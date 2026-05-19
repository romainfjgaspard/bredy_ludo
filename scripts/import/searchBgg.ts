import axios, { type AxiosInstance } from 'axios'
import { XMLParser } from 'fast-xml-parser'
import pThrottle from 'p-throttle'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../')
const RAW = path.join(ROOT, 'data/import/raw-games.json')
const CACHE = path.join(ROOT, 'data/import/bgg-cache.json')

const ONLY_MISSING = process.argv.includes('--only-missing')
const BGG_USERNAME = process.env.BGG_USERNAME
const BGG_PASSWORD = process.env.BGG_PASSWORD
const COOKIES_FILE = path.join(ROOT, 'data/import/bgg-cookies.json')

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

interface BggSearchResult {
  id: number
  name: string
  yearPublished?: number
  type: string
}

interface BggDetails {
  id: number
  name: string
  type: string
  yearPublished?: number
  minPlayers?: number
  maxPlayers?: number
  minPlaytime?: number
  maxPlaytime?: number
  minAge?: number
  bggRating?: number
  bggWeight?: number
  /** Nombre de joueurs idéal selon les votes de la communauté BGG */
  communityBestPlayers?: number
  /** Âge minimum selon les votes de la communauté BGG */
  communityMinAge?: number
  /** Lien BGG : https://boardgamegeek.com/boardgame/{id} */
  bggLink?: string
  thumbnail?: string
  image?: string
  description?: string
  categories?: string[]
}

interface Cache {
  searches: Record<string, BggSearchResult[]>
  details: Record<number, BggDetails>
}

function loadCache(): Cache {
  if (fs.existsSync(CACHE)) {
    return JSON.parse(fs.readFileSync(CACHE, 'utf-8'))
  }
  return { searches: {}, details: {} }
}

function saveCache(cache: Cache) {
  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2), 'utf-8')
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

async function withRetry<T>(fn: () => Promise<T>, retries = 5, delay = 3000): Promise<T> {
  let lastError: any
  for (let i = 0; i < retries; i++) {
    try {
      const result = await fn()
      // BGG returns 202 when processing — retry after delay
      if ((result as any)?.status === 202) {
        console.log(`  ⏳ BGG 202 — attente ${delay}ms (tentative ${i + 1}/${retries})…`)
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      return result
    } catch (e: any) {
      lastError = e
      const status = e?.response?.status
      const body = e?.response?.data ? String(e.response.data).substring(0, 200) : ''
      console.warn(`  ⚠️  Tentative ${i + 1}/${retries} — HTTP ${status ?? e?.code ?? 'ERR'}: ${body || e?.message}`)
      const waitMs = (status === 429 || status === 401)
        ? delay * 3 * (i + 1)
        : delay * Math.pow(2, i)
      if (i < retries - 1) await new Promise(r => setTimeout(r, waitMs))
    }
  }
  throw lastError ?? new Error('Max retries exceeded')
}

const throttledGet = pThrottle({ limit: 1, interval: 1500 })(
  (client: AxiosInstance, url: string) => client.get(url, {
    timeout: 30000,
    responseType: 'text',
  })
)

/**
 * BGG sets valid cookies THEN immediately "deletes" them via domain=.boardgamegeek.com + Max-Age=0.
 * We keep only the cookies that have a positive MaxAge or a future expiry (skip deletion entries).
 */
function extractValidCookies(setCookieHeaders: string[]): string {
  const valid: string[] = []
  for (const header of setCookieHeaders) {
    const parts = header.split(';').map(p => p.trim())
    const nameValue = parts[0]
    const maxAgePart = parts.find(p => p.toLowerCase().startsWith('max-age='))
    const expiresPart = parts.find(p => p.toLowerCase().startsWith('expires='))
    // Skip deletion cookies (Max-Age=0)
    if (maxAgePart && maxAgePart.split('=')[1].trim() === '0') continue
    // Skip already-expired cookies
    if (expiresPart) {
      const expDate = new Date(expiresPart.substring(expiresPart.indexOf('=') + 1))
      if (!isNaN(expDate.getTime()) && expDate.getTime() < Date.now()) continue
    }
    valid.push(nameValue)
  }
  return valid.join('; ')
}

async function getBggClient(): Promise<AxiosInstance> {
  const client = axios.create({
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/xml, application/xml, */*',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  })

  // Priorité 1 : cookies Playwright (bggLogin.ts)
  if (fs.existsSync(COOKIES_FILE)) {
    const saved = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf-8'))
    const ageDays = (Date.now() - new Date(saved.generatedAt).getTime()) / 86400000
    if (ageDays < 1 && saved.cookieHeader) {
      const names = saved.cookieHeader.split(';').map((c: string) => c.split('=')[0].trim()).filter(Boolean)
      client.defaults.headers.common['Cookie'] = saved.cookieHeader
      console.log(`🍪 Cookies Playwright chargés (${names.length}: ${names.join(', ')})`)
      return client
    } else {
      console.warn('⚠️  bgg-cookies.json expiré (>1 jour) — relancez bggLogin.ts')
    }
  }

  // Priorité 2 : login API /login/api/v1
  if (BGG_USERNAME && BGG_PASSWORD) {
    console.log(`🔐 Connexion BGG avec le compte ${BGG_USERNAME}…`)
    try {
      const loginRes = await client.post('https://boardgamegeek.com/login/api/v1', {
        credentials: { username: BGG_USERNAME, password: BGG_PASSWORD }
      }, {
        headers: { 'Content-Type': 'application/json' },
        validateStatus: s => s < 500,
      })
      if (loginRes.status < 400) {
        const setCookie = loginRes.headers['set-cookie'] ?? []
        const cookie = extractValidCookies(setCookie)
        const names = cookie.split(';').map(c => c.split('=')[0].trim()).filter(Boolean)
        client.defaults.headers.common['Cookie'] = cookie
        console.log(`✅ Connecté à BGG (${names.length} cookies: ${names.join(', ')})`)
      } else {
        console.warn(`⚠️  Login BGG échoué (HTTP ${loginRes.status}) — vérifier les identifiants`)
      }
    } catch (e) {
      console.warn('⚠️  Échec du login BGG:', (e as Error).message)
    }
  } else {
    console.warn('⚠️  BGG_USERNAME / BGG_PASSWORD non définis dans .env.local')
  }

  return client
}

/** Extrait le nombre de joueurs idéal depuis le poll BGG suggested_numplayers */
function extractCommunityBestPlayers(item: any): number | undefined {
  const polls = Array.isArray(item.poll) ? item.poll : item.poll ? [item.poll] : []
  const poll = polls.find((p: any) => p['@_name'] === 'suggested_numplayers')
  if (!poll) return undefined
  const resultGroups = Array.isArray(poll.results) ? poll.results : poll.results ? [poll.results] : []
  let bestNumPlayers: number | undefined
  let bestVotes = 0
  for (const group of resultGroups) {
    const numPlayers = parseInt(group['@_numplayers'] ?? '')
    if (isNaN(numPlayers)) continue
    const results = Array.isArray(group.result) ? group.result : group.result ? [group.result] : []
    const bestEntry = results.find((r: any) => r['@_value'] === 'Best')
    const votes = parseInt(bestEntry?.['@_numvotes'] ?? '0')
    if (votes > bestVotes) { bestVotes = votes; bestNumPlayers = numPlayers }
  }
  return bestVotes > 0 ? bestNumPlayers : undefined
}

/** Extrait l'âge minimum communautaire depuis le poll BGG suggested_playerage */
function extractCommunityMinAge(item: any): number | undefined {
  const polls = Array.isArray(item.poll) ? item.poll : item.poll ? [item.poll] : []
  const poll = polls.find((p: any) => p['@_name'] === 'suggested_playerage')
  if (!poll) return undefined
  const results = Array.isArray(poll.results?.result) ? poll.results.result : poll.results?.result ? [poll.results.result] : []
  let maxVotes = 0
  let communityAge: number | undefined
  for (const r of results) {
    const votes = parseInt(r['@_numvotes'] ?? '0')
    if (votes > maxVotes) {
      maxVotes = votes
      const parsed = parseInt(r['@_value'] ?? '')
      if (!isNaN(parsed)) communityAge = parsed
    }
  }
  return maxVotes > 0 ? communityAge : undefined
}

/** Construit le lien BGG selon le type du jeu */
function buildBggLink(bggId: number, type: string): string {
  const slug = type === 'boardgameexpansion' ? 'boardgameexpansion' : 'boardgame'
  return `https://boardgamegeek.com/${slug}/${bggId}`
}

async function searchBgg(client: AxiosInstance, query: string): Promise<BggSearchResult[]> {
  const url = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame,boardgameexpansion`
  const res = await withRetry(() => throttledGet(client, url))
  const data = parser.parse(res.data)
  const items = data?.items?.item
  if (!items) return []
  const arr = Array.isArray(items) ? items : [items]
  return arr.map((item: any) => ({
    id: parseInt(item['@_id']),
    name: item.name?.['@_value'] ?? item.name,
    yearPublished: item.yearpublished?.['@_value'] ? parseInt(item.yearpublished['@_value']) : undefined,
    type: item['@_type'],
  }))
}

async function fetchDetails(client: AxiosInstance, bggId: number): Promise<BggDetails | null> {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&stats=1`
  const res = await withRetry(() => throttledGet(client, url))
  const data = parser.parse(res.data)
  const item = data?.items?.item
  if (!item) return null

  const names = Array.isArray(item.name) ? item.name : [item.name]
  const primaryName = names.find((n: any) => n['@_type'] === 'primary')?.['@_value'] ?? names[0]?.['@_value'] ?? ''

  const ratings = item.statistics?.ratings
  const type = item['@_type'] ?? 'boardgame'
  return {
    id: bggId,
    name: primaryName,
    type,
    yearPublished: item.yearpublished?.['@_value'] ? parseInt(item.yearpublished['@_value']) : undefined,
    minPlayers: parseInt(item.minplayers?.['@_value'] ?? '0') || undefined,
    maxPlayers: parseInt(item.maxplayers?.['@_value'] ?? '0') || undefined,
    minPlaytime: parseInt(item.minplaytime?.['@_value'] ?? '0') || undefined,
    maxPlaytime: parseInt(item.maxplaytime?.['@_value'] ?? '0') || undefined,
    minAge: parseInt(item.minage?.['@_value'] ?? '0') || undefined,
    bggRating: parseFloat(ratings?.average?.['@_value'] ?? '0') || undefined,
    bggWeight: parseFloat(ratings?.averageweight?.['@_value'] ?? '0') || undefined,
    communityBestPlayers: extractCommunityBestPlayers(item),
    communityMinAge: extractCommunityMinAge(item),
    bggLink: buildBggLink(bggId, type),
    thumbnail: item.thumbnail,
    image: item.image,
    description: typeof item.description === 'string' ? item.description.substring(0, 500) : undefined,
    categories: (() => {
      const links = Array.isArray(item.link) ? item.link : (item.link ? [item.link] : [])
      return links
        .filter((l: any) => l['@_type'] === 'boardgamecategory')
        .map((l: any) => l['@_value'] as string)
        .slice(0, 3)
    })(),
  }
}

async function main() {
  if (!fs.existsSync(RAW)) {
    console.error('raw-games.json introuvable — lancez parseXlsx.ts en premier')
    process.exit(1)
  }

  const client = await getBggClient()
  const rawGames: { nom: string }[] = JSON.parse(fs.readFileSync(RAW, 'utf-8'))
  const cache = loadCache()
  let fetched = 0

  for (const game of rawGames) {
    const key = normalize(game.nom)

    if (!ONLY_MISSING && cache.searches[key]) continue
    if (ONLY_MISSING) {
      const results = cache.searches[key] ?? []
      const missing = results.filter(r => !cache.details[r.id])
      for (const r of missing) {
        console.log(`  Détails BGG ${r.id} pour ${game.nom}…`)
        const details = await fetchDetails(client, r.id)
        if (details) { cache.details[r.id] = details; fetched++ }
      }
      continue
    }

    console.log(`Recherche BGG: ${game.nom}…`)
    const results = await searchBgg(client, game.nom)
    cache.searches[key] = results
    fetched++

    for (const r of results.slice(0, 3)) {
      if (!cache.details[r.id]) {
        const details = await fetchDetails(client, r.id)
        if (details) { cache.details[r.id] = details; fetched++ }
      }
    }

    saveCache(cache)
  }

  saveCache(cache)
  console.log(`✅ ${fetched} appels BGG effectués. Cache: ${Object.keys(cache.details).length} détails`)
}

main().catch(e => { console.error(e); process.exit(1) })

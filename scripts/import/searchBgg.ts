import axios from 'axios'
import { XMLParser } from 'fast-xml-parser'
import pThrottle from 'p-throttle'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../')
const RAW = path.join(ROOT, 'data/import/raw-games.json')
const CACHE = path.join(ROOT, 'data/import/bgg-cache.json')

const ONLY_MISSING = process.argv.includes('--only-missing')
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
  thumbnail?: string
  image?: string
  description?: string
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

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (e) {
      if (i === retries - 1) throw e
      await new Promise(r => setTimeout(r, delay * Math.pow(2, i)))
    }
  }
  throw new Error('Should not reach here')
}

const throttledGet = pThrottle({ limit: 1, interval: 1100 })(
  (url: string) => axios.get(url, { timeout: 10000 })
)

async function searchBgg(query: string): Promise<BggSearchResult[]> {
  const url = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame,boardgameexpansion`
  const res = await withRetry(() => throttledGet(url))
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

async function fetchDetails(bggId: number): Promise<BggDetails | null> {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&stats=1`
  const res = await withRetry(() => throttledGet(url))
  const data = parser.parse(res.data)
  const item = data?.items?.item
  if (!item) return null

  const names = Array.isArray(item.name) ? item.name : [item.name]
  const primaryName = names.find((n: any) => n['@_type'] === 'primary')?.['@_value'] ?? names[0]?.['@_value'] ?? ''

  const ratings = item.statistics?.ratings
  return {
    id: bggId,
    name: primaryName,
    type: item['@_type'],
    yearPublished: item.yearpublished?.['@_value'] ? parseInt(item.yearpublished['@_value']) : undefined,
    minPlayers: parseInt(item.minplayers?.['@_value'] ?? '0') || undefined,
    maxPlayers: parseInt(item.maxplayers?.['@_value'] ?? '0') || undefined,
    minPlaytime: parseInt(item.minplaytime?.['@_value'] ?? '0') || undefined,
    maxPlaytime: parseInt(item.maxplaytime?.['@_value'] ?? '0') || undefined,
    minAge: parseInt(item.minage?.['@_value'] ?? '0') || undefined,
    bggRating: parseFloat(ratings?.average?.['@_value'] ?? '0') || undefined,
    bggWeight: parseFloat(ratings?.averageweight?.['@_value'] ?? '0') || undefined,
    thumbnail: item.thumbnail,
    image: item.image,
    description: typeof item.description === 'string' ? item.description.substring(0, 500) : undefined,
  }
}

async function main() {
  if (!fs.existsSync(RAW)) {
    console.error('raw-games.json introuvable — lancez parseXlsx.ts en premier')
    process.exit(1)
  }

  const rawGames: { nom: string }[] = JSON.parse(fs.readFileSync(RAW, 'utf-8'))
  const cache = loadCache()
  let fetched = 0

  for (const game of rawGames) {
    const key = normalize(game.nom)

    if (!ONLY_MISSING && cache.searches[key]) continue
    if (ONLY_MISSING) {
      // Only fetch details for IDs already in searches but not in details
      const results = cache.searches[key] ?? []
      const missing = results.filter(r => !cache.details[r.id])
      for (const r of missing) {
        console.log(`  Détails BGG ${r.id} pour ${game.nom}…`)
        const details = await fetchDetails(r.id)
        if (details) { cache.details[r.id] = details; fetched++ }
      }
      continue
    }

    console.log(`Recherche BGG: ${game.nom}…`)
    const results = await searchBgg(game.nom)
    cache.searches[key] = results
    fetched++

    // Fetch details for top 3 results
    for (const r of results.slice(0, 3)) {
      if (!cache.details[r.id]) {
        const details = await fetchDetails(r.id)
        if (details) { cache.details[r.id] = details; fetched++ }
      }
    }

    saveCache(cache)
  }

  saveCache(cache)
  console.log(`✅ ${fetched} appels BGG effectués. Cache: ${Object.keys(cache.details).length} détails`)
}

main().catch(e => { console.error(e); process.exit(1) })

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../')
const RAW = path.join(ROOT, 'data/import/raw-games.json')
const CACHE = path.join(ROOT, 'data/import/bgg-cache.json')
const OUTPUT = path.join(ROOT, 'data/import/reconciled-games.json')

const THRESHOLD = 85

interface RawGame { nom: string; emplacement: string }
interface BggDetails {
  id: number; name: string; type: string;
  minPlayers?: number; maxPlayers?: number; minPlaytime?: number; maxPlaytime?: number;
  minAge?: number; bggRating?: number; bggWeight?: number; thumbnail?: string; image?: string; description?: string;
}
interface Cache { searches: Record<string, { id: number; name: string; type: string }[]>; details: Record<number, BggDetails> }

export interface ReconciledGame {
  csvName: string
  emplacement: string
  selectedBggId: number | null
  status: 'confirmed' | 'needsReview' | 'notFound'
  score: number
  candidates: { id: number; name: string; score: number; type: string }[]
  details?: BggDetails
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function similarity(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 100
  if (nb.includes(na) || na.includes(nb)) return 90
  // Basic Levenshtein-based score
  const la = na.length, lb = nb.length
  const dp = Array.from({ length: la + 1 }, (_, i) => Array(lb + 1).fill(0).map((_, j) => i === 0 ? j : j === 0 ? i : 0))
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      dp[i][j] = na[i - 1] === nb[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  const dist = dp[la][lb]
  return Math.round((1 - dist / Math.max(la, lb)) * 100)
}

function main() {
  const rawGames: RawGame[] = JSON.parse(fs.readFileSync(RAW, 'utf-8'))
  const cache: Cache = JSON.parse(fs.readFileSync(CACHE, 'utf-8'))

  const confirmed: ReconciledGame[] = []
  const needsReview: ReconciledGame[] = []
  const notFound: ReconciledGame[] = []

  for (const game of rawGames) {
    const key = normalize(game.nom)
    const results = cache.searches[key] ?? []

    if (results.length === 0) {
      notFound.push({ csvName: game.nom, emplacement: game.emplacement, selectedBggId: null, status: 'notFound', score: 0, candidates: [] })
      continue
    }

    const scored = results.map(r => ({
      id: r.id, name: r.name, type: r.type,
      score: similarity(game.nom, r.name),
    })).sort((a, b) => b.score - a.score)

    const best = scored[0]
    const details = cache.details[best.id]

    const entry: ReconciledGame = {
      csvName: game.nom,
      emplacement: game.emplacement,
      selectedBggId: best.id,
      score: best.score,
      candidates: scored.slice(0, 5),
      details,
      status: best.score >= THRESHOLD ? 'confirmed' : 'needsReview',
    }

    if (entry.status === 'confirmed') confirmed.push(entry)
    else needsReview.push(entry)
  }

  const result = { version: 1, confirmed, needsReview, notFound }
  fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2), 'utf-8')
  console.log(`✅ Réconciliation terminée`)
  console.log(`  Confirmés  : ${confirmed.length}`)
  console.log(`  À réviser  : ${needsReview.length}`)
  console.log(`  Non trouvés: ${notFound.length}`)
}

main()

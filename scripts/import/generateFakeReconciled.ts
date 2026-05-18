/**
 * Génère un reconciled-games.json de test avec des données fictives.
 * Permet de tester tout le pipeline (importFirestore, téléchargement images, etc.)
 * sans attendre l'approbation de l'API BGG.
 *
 * Usage: npx tsx scripts/import/generateFakeReconciled.ts
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../')
const RAW = path.join(ROOT, 'data/import/raw-games.json')
const OUTPUT = path.join(ROOT, 'data/import/reconciled-games.json')

// Jeux connus avec vrais IDs BGG (pour les plus célèbres)
const KNOWN: Record<string, { id: number; minP: number; maxP: number; minT: number; maxT: number; age: number; rating: number; weight: number; ext?: boolean }> = {
  'catan le jeu de base':        { id: 13,    minP: 3, maxP: 4, minT: 60,  maxT: 120, age: 10, rating: 7.14, weight: 2.32 },
  'catane le jeu de base':       { id: 13,    minP: 3, maxP: 4, minT: 60,  maxT: 120, age: 10, rating: 7.14, weight: 2.32 },
  'takenoko':                    { id: 70919, minP: 2, maxP: 4, minT: 45,  maxT: 90,  age: 8,  rating: 7.28, weight: 1.83 },
  'splendor':                    { id: 148228,minP: 2, maxP: 4, minT: 30,  maxT: 60,  age: 10, rating: 7.42, weight: 1.78 },
  'dixit':                       { id: 39856, minP: 3, maxP: 6, minT: 30,  maxT: 60,  age: 8,  rating: 7.16, weight: 1.07 },
  'dobble':                      { id: 63268, minP: 2, maxP: 8, minT: 15,  maxT: 15,  age: 6,  rating: 6.48, weight: 1.04 },
  'azul':                        { id: 230802,minP: 2, maxP: 4, minT: 30,  maxT: 45,  age: 8,  rating: 7.85, weight: 1.76 },
  'hanabi':                      { id: 98778, minP: 2, maxP: 5, minT: 25,  maxT: 25,  age: 8,  rating: 7.05, weight: 1.74 },
  'pandemie':                    { id: 30549, minP: 2, maxP: 4, minT: 45,  maxT: 60,  age: 8,  rating: 7.63, weight: 2.41 },
  'rhino hero':                  { id: 179504,minP: 2, maxP: 5, minT: 5,   maxT: 15,  age: 5,  rating: 6.89, weight: 1.10 },
  'santorini':                   { id: 194655,minP: 2, maxP: 4, minT: 20,  maxT: 40,  age: 8,  rating: 7.54, weight: 2.05 },
  'ticket to ride europe':       { id: 14996, minP: 2, maxP: 5, minT: 30,  maxT: 90,  age: 8,  rating: 7.56, weight: 2.41 },
  'les aventuriers du rail europe': { id: 14996, minP: 2, maxP: 5, minT: 30, maxT: 90, age: 8, rating: 7.56, weight: 2.41 },
  'mysterium':                   { id: 181304,minP: 2, maxP: 7, minT: 42,  maxT: 42,  age: 10, rating: 7.41, weight: 1.88 },
  'agricola':                    { id: 31260, minP: 1, maxP: 5, minT: 30,  maxT: 150, age: 12, rating: 7.95, weight: 3.64 },
  'sky team':                    { id: 373106,minP: 2, maxP: 2, minT: 15,  maxT: 30,  age: 12, rating: 8.10, weight: 2.22 },
  '7 wonders duel':              { id: 173346,minP: 2, maxP: 2, minT: 30,  maxT: 45,  age: 10, rating: 8.09, weight: 2.23 },
  'turing machine':              { id: 356123,minP: 1, maxP: 4, minT: 20,  maxT: 60,  age: 14, rating: 7.99, weight: 2.16 },
  'just one':                    { id: 254640,minP: 3, maxP: 7, minT: 20,  maxT: 20,  age: 8,  rating: 7.56, weight: 1.06 },
  'the mind':                    { id: 244992,minP: 2, maxP: 4, minT: 15,  maxT: 20,  age: 8,  rating: 6.94, weight: 1.12 },
  'the crew':                    { id: 284083,minP: 3, maxP: 5, minT: 20,  maxT: 20,  age: 10, rating: 7.80, weight: 2.01 },
  'code names':                  { id: 178900,minP: 2, maxP: 8, minT: 15,  maxT: 30,  age: 14, rating: 7.59, weight: 1.36 },
  'cartographers':               { id: 263918,minP: 1, maxP: 100,minT: 30, maxT: 45,  age: 10, rating: 7.61, weight: 1.89 },
  'akropolis':                   { id: 371127,minP: 2, maxP: 4, minT: 20,  maxT: 30,  age: 8,  rating: 7.41, weight: 1.66 },
  'sea salt & paper':            { id: 367220,minP: 2, maxP: 4, minT: 30,  maxT: 45,  age: 8,  rating: 7.44, weight: 1.50 },
  'qwirkle':                     { id: 25669, minP: 2, maxP: 4, minT: 45,  maxT: 45,  age: 6,  rating: 7.04, weight: 1.62 },
  'skull & roses':               { id: 92415, minP: 2, maxP: 6, minT: 15,  maxT: 45,  age: 10, rating: 7.16, weight: 1.22 },
  'skull king':                  { id: 175348,minP: 2, maxP: 6, minT: 20,  maxT: 30,  age: 10, rating: 7.35, weight: 1.89 },
  'jamaïca':                     { id: 24480, minP: 2, maxP: 6, minT: 60,  maxT: 60,  age: 8,  rating: 7.02, weight: 1.78 },
  'jamaica':                     { id: 24480, minP: 2, maxP: 6, minT: 60,  maxT: 60,  age: 8,  rating: 7.02, weight: 1.78 },
  'magic maze':                  { id: 209778,minP: 1, maxP: 8, minT: 15,  maxT: 30,  age: 8,  rating: 7.11, weight: 1.77 },
  'micro macro (crime city)':    { id: 318977,minP: 1, maxP: 4, minT: 15,  maxT: 45,  age: 10, rating: 7.07, weight: 1.17 },
  'labyrinthe':                  { id: 2411,  minP: 2, maxP: 4, minT: 20,  maxT: 20,  age: 7,  rating: 6.49, weight: 1.35 },
  'taboo':                       { id: 1487,  minP: 4, maxP: 12,minT: 20,  maxT: 20,  age: 13, rating: 6.34, weight: 1.19 },
  'coloretto':                   { id: 5782,  minP: 2, maxP: 5, minT: 30,  maxT: 30,  age: 8,  rating: 6.66, weight: 1.43 },
  'mastermind':                  { id: 2392,  minP: 2, maxP: 2, minT: 15,  maxT: 30,  age: 8,  rating: 6.13, weight: 1.48 },
  'marrakech':                   { id: 29223, minP: 2, maxP: 4, minT: 20,  maxT: 30,  age: 7,  rating: 6.90, weight: 1.38 },
  'tokaido':                     { id: 123540,minP: 2, maxP: 5, minT: 45,  maxT: 60,  age: 8,  rating: 7.02, weight: 1.61 },
  'faraway':                     { id: 402028,minP: 2, maxP: 6, minT: 15,  maxT: 30,  age: 10, rating: 7.49, weight: 1.87 },
  'concept':                     { id: 147151,minP: 4, maxP: 12,minT: 40,  maxT: 40,  age: 10, rating: 6.78, weight: 1.24 },
  'azul extension pavillon d\'été': { id: 270270,minP: 2, maxP: 4, minT: 30, maxT: 45, age: 8, rating: 7.42, weight: 1.91, ext: true },
  'district noir':               { id: 350083,minP: 2, maxP: 2, minT: 20,  maxT: 20,  age: 10, rating: 7.24, weight: 1.77 },
  'living forest':               { id: 328479,minP: 1, maxP: 4, minT: 40,  maxT: 40,  age: 10, rating: 7.28, weight: 2.53 },
  'sobek':                       { id: 86248, minP: 2, maxP: 4, minT: 45,  maxT: 45,  age: 10, rating: 6.44, weight: 2.15 },
  'skyjo':                       { id: 237458,minP: 2, maxP: 8, minT: 30,  maxT: 45,  age: 8,  rating: 6.82, weight: 1.15 },
  'guillotine':                  { id: 116,   minP: 2, maxP: 5, minT: 30,  maxT: 30,  age: 12, rating: 6.44, weight: 1.44 },
  'happy city':                  { id: 302820,minP: 2, maxP: 6, minT: 20,  maxT: 30,  age: 8,  rating: 6.72, weight: 1.44 },
  'squadro':                     { id: 247938,minP: 2, maxP: 2, minT: 15,  maxT: 25,  age: 8,  rating: 7.13, weight: 1.71 },
  'pickomino':                   { id: 11002, minP: 2, maxP: 7, minT: 20,  maxT: 30,  age: 8,  rating: 6.65, weight: 1.36 },
  'set':                         { id: 1198,  minP: 1, maxP: 20,minT: 30,  maxT: 30,  age: 6,  rating: 6.74, weight: 1.49 },
  'dobble geox':                 { id: 63268, minP: 2, maxP: 8, minT: 15,  maxT: 15,  age: 6,  rating: 6.48, weight: 1.04, ext: true },
}

// Extensions connues par mot-clé dans le nom
function isExpansion(nom: string): boolean {
  const n = nom.toLowerCase()
  return (
    n.includes('extension') ||
    n.includes('expansion') ||
    n.includes('chevaux et diligence') ||
    n.includes('de l\'or au bout') ||
    n.includes('dodge city') ||
    n.includes('embrasement') ||
    n.includes('grozilla') ||
    n.includes('pavillon d') ||
    n.includes('stella (dixit') ||
    n.includes('geox')
  )
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return Math.abs(s) / 0xffffffff
  }
}

function fakeDetails(nom: string, bggId: number) {
  const known = KNOWN[nom.toLowerCase()]
  if (known) {
    return {
      id: known.id,
      name: nom,
      type: known.ext ? 'boardgameexpansion' : 'boardgame',
      minPlayers: known.minP,
      maxPlayers: known.maxP,
      minPlaytime: known.minT,
      maxPlaytime: known.maxT,
      minAge: known.age,
      bggRating: known.rating,
      bggWeight: known.weight,
      description: `Fiche de test générée automatiquement pour ${nom}.`,
    }
  }

  const rng = seededRandom(bggId)
  const minP = Math.floor(rng() * 2) + 2  // 2-3
  const maxP = minP + Math.floor(rng() * 4) + 1  // minP+1 à minP+4
  const minT = (Math.floor(rng() * 6) + 1) * 10  // 10-60
  const maxT = minT + (Math.floor(rng() * 4) + 1) * 15  // +15 à +60
  const age = [4, 5, 6, 7, 8, 10, 12, 14][Math.floor(rng() * 8)]
  const rating = Math.round((rng() * 3 + 6) * 100) / 100  // 6.0 - 9.0
  const weight = Math.round((rng() * 2.5 + 1) * 100) / 100  // 1.0 - 3.5

  return {
    id: bggId,
    name: nom,
    type: isExpansion(nom) ? 'boardgameexpansion' : 'boardgame',
    minPlayers: minP,
    maxPlayers: Math.min(maxP, 8),
    minPlaytime: minT,
    maxPlaytime: maxT,
    minAge: age,
    bggRating: rating,
    bggWeight: weight,
    description: `Fiche de test générée automatiquement pour ${nom}.`,
  }
}

function main() {
  const rawGames: { nom: string }[] = JSON.parse(fs.readFileSync(RAW, 'utf-8'))

  // Déduplication (raw-games.json contient des doublons)
  const seen = new Set<string>()
  const unique = rawGames.filter(g => {
    const k = g.nom.toLowerCase().trim()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  const confirmed = unique.map((game, i) => {
    const known = KNOWN[game.nom.toLowerCase()]
    const bggId = known ? known.id : 900000 + i
    const details = fakeDetails(game.nom, bggId)
    return {
      csvName: game.nom,
      selectedBggId: details.id,
      status: 'confirmed' as const,
      score: 95,
      candidates: [{ id: details.id, name: details.name, score: 95, type: details.type }],
      details,
    }
  })

  const result = { version: 1, confirmed, needsReview: [], notFound: [] }
  fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2), 'utf-8')

  const exts = confirmed.filter(g => g.details?.type === 'boardgameexpansion').length
  console.log(`✅ ${confirmed.length} jeux générés (${exts} extensions) → ${OUTPUT}`)
}

main()

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../')
const RECONCILED = path.join(ROOT, 'data/import/reconciled-games.json')
const DRY_RUN = process.argv.includes('--dry-run')

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : JSON.parse(fs.readFileSync(path.join(ROOT, 'service-account.json'), 'utf-8'))

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

async function main() {
  console.log(DRY_RUN ? '🔍 Mode DRY-RUN (aucune écriture)' : '🚀 Import Firestore en cours…')

  const data = JSON.parse(fs.readFileSync(RECONCILED, 'utf-8'))
  const games = [...data.confirmed, ...data.needsReview].filter((g: any) => g.selectedBggId && g.details)

  let count = 0

  for (const game of games) {
    const d = game.details
    const doc = {
      nom: game.csvName,
      type: d.type === 'boardgameexpansion' ? 'extension' : 'base',
      emplacement: game.emplacement,
      archived: false,
      bgg_id: d.id,
      image_url: `${d.id}.jpg`,
      metadata: {
        nb_joueurs_min: d.minPlayers ?? 2,
        nb_joueurs_max: d.maxPlayers ?? 4,
        duree_min: d.minPlaytime ?? 30,
        duree_max: d.maxPlaytime ?? 60,
        age_min: d.minAge ?? 8,
        bgg_rating: d.bggRating,
        bgg_weight: d.bggWeight,
        description: d.description,
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    if (DRY_RUN) {
      console.log(`[DRY] ${game.csvName} → bgg:${d.id}, type:${doc.type}, emplacement:${doc.emplacement}`)
    } else {
      await db.collection('games').add(doc)
      console.log(`✅ ${game.csvName}`)
    }
    count++
  }

  console.log(`\n${DRY_RUN ? '(DRY-RUN)' : ''} ${count} jeux traités`)
  if (data.notFound.length > 0) {
    console.warn(`⚠️  ${data.notFound.length} jeux non importés (non trouvés sur BGG)`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })

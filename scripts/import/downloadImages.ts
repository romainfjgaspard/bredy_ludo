import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../')
const RECONCILED = path.join(ROOT, 'data/import/reconciled-games.json')
const OUTPUT_DIR = path.join(ROOT, 'public/images/games')

async function download(url: string, dest: string): Promise<void> {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 })
  fs.writeFileSync(dest, Buffer.from(res.data))
}

async function main() {
  if (!fs.existsSync(RECONCILED)) {
    console.error('reconciled-games.json introuvable')
    process.exit(1)
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const data = JSON.parse(fs.readFileSync(RECONCILED, 'utf-8'))
  const allGames = [...data.confirmed, ...data.needsReview].filter((g: any) => g.selectedBggId)

  let downloaded = 0, skipped = 0, errors = 0

  for (const game of allGames) {
    const bggId = game.selectedBggId
    const dest = path.join(OUTPUT_DIR, `${bggId}.jpg`)
    if (fs.existsSync(dest)) { skipped++; continue }

    const imgUrl = game.details?.image ?? game.details?.thumbnail
    if (!imgUrl) { console.warn(`⚠️  Pas d'image pour ${game.csvName} (BGG ${bggId})`); errors++; continue }

    try {
      console.log(`Téléchargement: ${game.csvName} → ${bggId}.jpg`)
      await download(imgUrl, dest)
      downloaded++
      await new Promise(r => setTimeout(r, 200))
    } catch (e) {
      console.error(`❌ Erreur pour ${game.csvName}: ${e}`)
      errors++
    }
  }

  console.log(`✅ ${downloaded} téléchargées, ${skipped} déjà présentes, ${errors} erreurs`)
}

main().catch(e => { console.error(e); process.exit(1) })

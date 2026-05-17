import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../')
const RECONCILED = path.join(ROOT, 'data/import/reconciled-games.json')
const IMAGES_DIR = path.join(ROOT, 'public/images/games')

function main() {
  const data = JSON.parse(fs.readFileSync(RECONCILED, 'utf-8'))
  const allGames = [...data.confirmed, ...data.needsReview].filter((g: any) => g.selectedBggId)

  const missing: string[] = []

  for (const game of allGames) {
    const imgPath = path.join(IMAGES_DIR, `${game.selectedBggId}.jpg`)
    if (!fs.existsSync(imgPath)) {
      missing.push(`${game.csvName} → ${game.selectedBggId}.jpg`)
    }
  }

  if (missing.length > 0) {
    console.error(`❌ ${missing.length} images manquantes :`)
    missing.forEach(m => console.error(`  - ${m}`))
    process.exit(1)
  } else {
    console.log(`✅ Toutes les images sont présentes (${allGames.length} jeux)`)
  }
}

main()

import { createRequire } from 'module'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const XLSX = require('xlsx') as typeof import('xlsx')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../')
const INPUT = path.join(ROOT, 'data/import/source.xlsx')
const OUTPUT = path.join(ROOT, 'data/import/raw-games.json')

interface RawGame {
  nom: string
}

function main() {
  if (!fs.existsSync(INPUT)) {
    console.error(`Fichier non trouvé : ${INPUT}`)
    console.error('Placez le fichier source.xlsx dans data/import/')
    process.exit(1)
  }

  const workbook = XLSX.readFile(INPUT)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 }) as string[][]

  const results: RawGame[] = []
  let skipped = 0

  // Pas d'en-tête — la première ligne est déjà un jeu
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) { skipped++; continue }

    const nom = String(row[0] ?? '').trim()
    if (!nom) { skipped++; continue }

    results.push({ nom })
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2), 'utf-8')
  console.log(`✅ ${results.length} jeux parsés → ${OUTPUT}`)
  if (skipped > 0) console.log(`ℹ️  ${skipped} lignes vides ignorées`)
}

main()

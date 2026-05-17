import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../')
const INPUT = path.join(ROOT, 'data/import/source.xlsx')
const OUTPUT = path.join(ROOT, 'data/import/raw-games.json')

const VALID_LOCATIONS = new Set([
  'A1','A2','B1','B2','C1','C2','D1','D2','E1','E2','F1','F2','G','H','I'
])

interface RawGame {
  nom: string
  emplacement: string
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
  const invalid: { row: number; reason: string }[] = []
  let skipped = 0

  // Ignore header row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length < 2) { skipped++; continue }

    const nom = String(row[0] ?? '').trim()
    const emplacement = String(row[1] ?? '').trim().toUpperCase()

    if (!nom) { invalid.push({ row: i + 1, reason: 'Nom vide' }); continue }
    if (!VALID_LOCATIONS.has(emplacement)) {
      invalid.push({ row: i + 1, reason: `Emplacement invalide: "${emplacement}"` })
      continue
    }

    results.push({ nom, emplacement })
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2), 'utf-8')
  console.log(`✅ ${results.length} jeux parsés → ${OUTPUT}`)
  if (invalid.length > 0) {
    console.warn(`⚠️  ${invalid.length} lignes ignorées :`)
    invalid.forEach(e => console.warn(`  Ligne ${e.row}: ${e.reason}`))
  }
  if (skipped > 0) console.log(`ℹ️  ${skipped} lignes vides ignorées`)
}

main()

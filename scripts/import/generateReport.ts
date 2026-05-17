import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../')
const RECONCILED = path.join(ROOT, 'data/import/reconciled-games.json')
const OUTPUT = path.join(ROOT, 'data/import/review-report.md')

function main() {
  const data = JSON.parse(fs.readFileSync(RECONCILED, 'utf-8'))
  const lines: string[] = [
    '# Rapport de révision — Import BGG',
    `> Généré le ${new Date().toLocaleDateString('fr-FR')}`,
    '',
    `## Résumé`,
    `- Confirmés : **${data.confirmed.length}**`,
    `- À réviser : **${data.needsReview.length}**`,
    `- Non trouvés : **${data.notFound.length}**`,
    '',
    '---',
    '',
    '## Jeux à réviser manuellement',
    '> Remplissez `selectedBggId` dans `reconciled-games.json`',
    '',
  ]

  for (const game of data.needsReview) {
    lines.push(`### ${game.csvName}`)
    lines.push(`- Emplacement: \`${game.emplacement}\``)
    lines.push(`- Meilleur score: ${game.score}/100`)
    lines.push(`- Candidats BGG :`)
    for (const c of game.candidates) {
      lines.push(`  - **[${c.id}]** ${c.name} (${c.type}, score: ${c.score}) — https://boardgamegeek.com/boardgame/${c.id}`)
    }
    lines.push('')
  }

  if (data.notFound.length > 0) {
    lines.push('## Jeux non trouvés sur BGG', '')
    for (const g of data.notFound) {
      lines.push(`- **${g.csvName}** (${g.emplacement})`)
    }
    lines.push('')
  }

  fs.writeFileSync(OUTPUT, lines.join('\n'), 'utf-8')
  console.log(`✅ Rapport généré → ${OUTPUT}`)
}

main()

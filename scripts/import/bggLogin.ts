/**
 * bggLogin.ts — Playwright fallback pour récupérer des cookies BGG authentifiés
 *
 * Usage:
 *   npx playwright install chromium --with-deps
 *   npx tsx scripts/import/bggLogin.ts
 *
 * Résultat: écrit data/import/bgg-cookies.json avec les cookies de session
 * searchBgg.ts charge automatiquement ce fichier s'il existe.
 */
import { chromium } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../')
const COOKIES_FILE = path.join(ROOT, 'data/import/bgg-cookies.json')

const BGG_USERNAME = process.env.BGG_USERNAME
const BGG_PASSWORD = process.env.BGG_PASSWORD

if (!BGG_USERNAME || !BGG_PASSWORD) {
  console.error('❌ BGG_USERNAME et BGG_PASSWORD requis dans .env.local')
  process.exit(1)
}

console.log(`🌐 Ouverture du navigateur pour se connecter à BGG (${BGG_USERNAME})…`)

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  locale: 'fr-FR',
})
const page = await context.newPage()

// Aller sur la page de login BGG
await page.goto('https://boardgamegeek.com/login', { waitUntil: 'networkidle', timeout: 30000 })

// Fermer la popup de consentement cookies si elle apparaît (Funding Choices / fc-consent)
// La popup bloque les clics — on la supprime directement du DOM
// Note: le callback s'exécute dans le contexte navigateur, pas Node.js
const hadConsent = await page.evaluate(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlay = (globalThis as any).document?.querySelector('.fc-consent-root')
  if (overlay) { overlay.remove(); return true }
  return false
})
if (hadConsent) {
  console.log('🍪 Popup consentement supprimée du DOM')
  await page.waitForTimeout(500)
}

// Remplir le formulaire de login
await page.fill('input[name="username"], input[placeholder*="sername"], input[type="text"]', BGG_USERNAME)
await page.fill('input[name="password"], input[placeholder*="assword"], input[type="password"]', BGG_PASSWORD)

// Soumettre
await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {}),
  page.click('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"], input[type="submit"]')
])

// Attendre que le login soit traité
await page.waitForTimeout(3000)

// Vérifier si connecté
const url = page.url()
console.log('URL après login:', url)

// Tester l'API avec les cookies du navigateur
const apiResponse = await page.evaluate(async () => {
  const r = await fetch('https://boardgamegeek.com/xmlapi2/search?query=catan&type=boardgame')
  return { status: r.status, ok: r.ok }
})
console.log('Test API depuis le navigateur:', apiResponse)

// Extraire tous les cookies
const cookies = await context.cookies()
const bggCookies = cookies.filter(c => c.domain.includes('boardgamegeek.com') || c.domain.includes('geekdo.com'))
const cookieHeader = bggCookies.map(c => `${c.name}=${c.value}`).join('; ')

console.log(`🍪 ${bggCookies.length} cookies BGG récupérés:`, bggCookies.map(c => c.name).join(', '))

// Sauvegarder
const output = {
  generatedAt: new Date().toISOString(),
  cookieHeader,
  cookies: bggCookies.map(c => ({ name: c.name, value: c.value, domain: c.domain }))
}
fs.mkdirSync(path.dirname(COOKIES_FILE), { recursive: true })
fs.writeFileSync(COOKIES_FILE, JSON.stringify(output, null, 2))
console.log(`✅ Cookies sauvegardés → ${COOKIES_FILE}`)

if (apiResponse.status === 200) {
  console.log('✅ API BGG accessible — vous pouvez lancer searchBgg.ts')
} else {
  console.warn(`⚠️  API BGG toujours ${apiResponse.status} même avec cookies navigateur`)
  console.warn('   Cause probable : compte BGG nécessite une activité minimale (ajouter un jeu à la collection, etc.)')
}

await browser.close()

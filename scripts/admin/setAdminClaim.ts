/**
 * Script one-shot pour créer (si besoin) un compte Firebase Auth et lui définir le claim admin:true.
 * Usage: npx tsx scripts/admin/setAdminClaim.ts <email> [<password>]
 *
 * Nécessite : service-account.json à la racine OU $FIREBASE_SERVICE_ACCOUNT en env
 */
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../')

const email = process.argv[2]
const password = process.argv[3]

if (!email) {
  console.error('Usage: npx tsx scripts/admin/setAdminClaim.ts <email> [<password>]')
  process.exit(1)
}

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : JSON.parse(fs.readFileSync(path.join(ROOT, 'service-account.json'), 'utf-8'))

initializeApp({ credential: cert(serviceAccount) })

async function main() {
  const auth = getAuth()
  let user
  try {
    user = await auth.getUserByEmail(email)
    console.log(`📋 Compte existant trouvé : ${email} (uid: ${user.uid})`)
  } catch {
    if (!password) {
      console.error(`❌ Compte ${email} inexistant. Fournissez un mot de passe pour le créer :`)
      console.error(`   npx tsx scripts/admin/setAdminClaim.ts ${email} <password>`)
      process.exit(1)
    }
    user = await auth.createUser({ email, password, emailVerified: true })
    console.log(`✅ Compte créé : ${email} (uid: ${user.uid})`)
  }
  await auth.setCustomUserClaims(user.uid, { admin: true })
  console.log(`✅ Claim admin:true défini pour ${email}`)
}

main().catch(e => { console.error(e); process.exit(1) })

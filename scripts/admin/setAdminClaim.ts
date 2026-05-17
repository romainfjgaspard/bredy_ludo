/**
 * Script one-shot pour définir le claim admin sur un compte Firebase.
 * Usage: npx ts-node scripts/admin/setAdminClaim.ts <email>
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
if (!email) {
  console.error('Usage: npx ts-node scripts/admin/setAdminClaim.ts <email>')
  process.exit(1)
}

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : JSON.parse(fs.readFileSync(path.join(ROOT, 'service-account.json'), 'utf-8'))

initializeApp({ credential: cert(serviceAccount) })

async function main() {
  const user = await getAuth().getUserByEmail(email)
  await getAuth().setCustomUserClaims(user.uid, { admin: true })
  console.log(`✅ Claim admin:true défini pour ${email} (uid: ${user.uid})`)
}

main().catch(e => { console.error(e); process.exit(1) })

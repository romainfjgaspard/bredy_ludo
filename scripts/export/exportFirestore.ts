import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../')

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : JSON.parse(fs.readFileSync(path.join(ROOT, 'service-account.json'), 'utf-8'))

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

async function main() {
  const timestamp = new Date().toISOString().split('T')[0]
  const backupDir = path.join(ROOT, 'data/backup')
  fs.mkdirSync(backupDir, { recursive: true })

  for (const col of ['games', 'plays']) {
    const snap = await db.collection(col).get()
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    const file = path.join(backupDir, `${col}_${timestamp}.json`)
    fs.writeFileSync(file, JSON.stringify(docs, null, 2), 'utf-8')
    console.log(`✅ ${docs.length} docs → ${file}`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })

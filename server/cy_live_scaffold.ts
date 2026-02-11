import express from 'express'
import crypto from 'crypto'
import bodyParser from 'body-parser'

const app = express()
app.use(bodyParser.json())

// Encryption helpers (AES-256-GCM)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '' // base64 32 bytes
if (!ENCRYPTION_KEY) {
  console.warn('ENCRYPTION_KEY not set — use for stream key encryption')
}

function encrypt(text: string) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'base64')
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

function decrypt(payloadB64: string) {
  const data = Buffer.from(payloadB64, 'base64')
  const iv = data.slice(0, 12)
  const tag = data.slice(12, 28)
  const encrypted = data.slice(28)
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'base64')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}

// Lightweight endpoint stubs — wire to Prisma client in production
app.post('/api/encrypt', (req, res) => {
  const { value } = req.body
  if (!value) return res.status(400).json({ error: 'value required' })
  try {
    const ct = encrypt(value)
    return res.json({ encrypted: ct })
  } catch (e) {
    return res.status(500).json({ error: 'encryption_failed' })
  }
})

app.post('/api/decrypt', (req, res) => {
  const { payload } = req.body
  if (!payload) return res.status(400).json({ error: 'payload required' })
  try {
    const plain = decrypt(payload)
    return res.json({ value: plain })
  } catch (e) {
    return res.status(500).json({ error: 'decryption_failed' })
  }
})

app.listen(process.env.PORT || 4000, () => {
  console.log('CY live scaffold server running on port', process.env.PORT || 4000)
})

export default app

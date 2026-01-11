import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SESSIONS_FILE = path.join(__dirname, '..', 'storage', 'sessions.json')
const SESSIONS_DIR = path.dirname(SESSIONS_FILE)

function ensureStorage() {
  if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true })
  if (!fs.existsSync(SESSIONS_FILE)) fs.writeFileSync(SESSIONS_FILE, JSON.stringify({}, null, 2))
}

function readSessions() {
  ensureStorage()
  const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8')
  const parsed = JSON.parse(raw)
  return parsed && typeof parsed === 'object' ? parsed : {}
}

function writeSessions(sessions) {
  ensureStorage()
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2))
}

export function signToken(payload) {
  const username = payload?.username
  const token = crypto.randomBytes(24).toString('hex')
  const sessions = readSessions()
  sessions[token] = { username, createdAt: Date.now() }
  writeSessions(sessions)
  return token
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const m = header.match(/^Bearer\s+(.+)$/i)
  const token = m?.[1]
  if (!token) return res.status(401).json({ error: '未登录' })

  try {
    const sessions = readSessions()
    const session = sessions[token]
    if (!session?.username) return res.status(401).json({ error: '未登录' })
    req.user = { username: session.username }
    next()
  } catch {
    return res.status(401).json({ error: '未登录' })
  }
}


import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const USERS_FILE = path.join(__dirname, '..', 'storage', 'users.json')
const USERS_DIR = path.dirname(USERS_FILE)

function ensureStorage() {
  if (!fs.existsSync(USERS_DIR)) fs.mkdirSync(USERS_DIR, { recursive: true })
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2))
}

function readUsers() {
  ensureStorage()
  const raw = fs.readFileSync(USERS_FILE, 'utf-8')
  const data = JSON.parse(raw)
  return Array.isArray(data) ? data : []
}

function writeUsers(users) {
  ensureStorage()
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

export function getUserByUsername(username) {
  if (!username) return null
  const users = readUsers()
  return users.find(u => u.username === username) || null
}

export async function createUser({ username, password }) {
  ensureStorage()
  const users = readUsers()

  if (users.some(u => u.username === username)) {
    const err = new Error('用户名已存在')
    err.code = 'USERNAME_EXISTS'
    throw err
  }

  const salt = crypto.randomBytes(16).toString('hex')
  const passwordHash = crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex')
  const user = {
    id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    username,
    passwordHash,
    passwordSalt: salt,
    createdAt: Date.now()
  }

  users.push(user)
  writeUsers(users)

  return { id: user.id, username: user.username }
}

export async function verifyPassword(user, password) {
  if (!user?.passwordHash || !user?.passwordSalt) return false
  const hash = crypto.pbkdf2Sync(password, user.passwordSalt, 120000, 32, 'sha256').toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.passwordHash, 'hex'))
}


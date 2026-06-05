import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'
import { randomUUID } from 'crypto'
import { db } from '../db.js'
import { requireAuth, JWT_SECRET } from '../middleware/auth.js'

export const authRouter = Router()

function userToJson(row: any) {
  return {
    id:       row.id,
    name:     row.name,
    email:    row.email,
    avatar:   row.avatar,
    phone:    row.phone    ?? undefined,
    location: row.location ?? undefined,
  }
}

// ── Avatar upload ────────────────────────────────────────────────────────────
const avatarStorage = multer.diskStorage({
  destination: 'public/uploads/',
  filename: (_req, file, cb) => cb(null, `avatar-${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
})
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /^image\//.test(file.mimetype)),
})

// ── Routes ───────────────────────────────────────────────────────────────────

authRouter.post('/register', async (req, res) => {
  const { name, email, password } = req.body
  if (!name?.trim() || !email?.trim() || !password) {
    res.status(400).json({ error: 'Naam, e-mail en wachtwoord zijn verplicht' }); return
  }
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase())) {
    res.status(409).json({ error: 'E-mailadres is al in gebruik' }); return
  }
  const hash = await bcrypt.hash(password, 10)
  const id = randomUUID()
  const avatar = `https://i.pravatar.cc/150?u=${id}`
  db.prepare('INSERT INTO users (id, name, email, password_hash, avatar) VALUES (?,?,?,?,?)')
    .run(id, name.trim(), email.toLowerCase().trim(), hash, avatar)
  const user = userToJson(db.prepare('SELECT * FROM users WHERE id = ?').get(id))
  const token = jwt.sign({ userId: id, email: user.email, name: user.name, role: 'user' }, JWT_SECRET, { expiresIn: '7d' })
  res.status(201).json({ token, user })
})

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) { res.status(400).json({ error: 'E-mail en wachtwoord zijn verplicht' }); return }
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any
  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    res.status(401).json({ error: 'Onbekend e-mailadres of fout wachtwoord' }); return
  }
  const user = userToJson(row)
  const token = jwt.sign({ userId: row.id, email: row.email, name: row.name, role: row.role ?? 'user' }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, user: { ...user, role: row.role ?? 'user' } })
})

authRouter.get('/me', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.userId)
  if (!row) { res.status(404).json({ error: 'Gebruiker niet gevonden' }); return }
  res.json(userToJson(row))
})

authRouter.put('/profile', requireAuth, async (req, res) => {
  const { name, email, phone, location } = req.body
  if (name !== undefined && !name.trim()) {
    res.status(400).json({ error: 'Naam mag niet leeg zijn' }); return
  }
  if (email !== undefined) {
    const conflict = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?')
      .get(email.toLowerCase().trim(), req.user!.userId)
    if (conflict) { res.status(409).json({ error: 'E-mailadres al in gebruik' }); return }
  }
  const current = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.userId) as any
  if (!current) { res.status(404).json({ error: 'Gebruiker niet gevonden' }); return }

  db.prepare('UPDATE users SET name=?, email=?, phone=?, location=? WHERE id=?').run(
    name?.trim()             ?? current.name,
    email?.toLowerCase().trim() ?? current.email,
    phone?.trim()            ?? current.phone ?? null,
    location?.trim()         ?? current.location ?? null,
    req.user!.userId,
  )
  const updated = userToJson(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.userId))
  res.json(updated)
})

authRouter.post('/avatar', requireAuth, avatarUpload.single('avatar'), (req, res) => {
  if (!req.file) { res.status(400).json({ error: 'Geen afbeelding ontvangen' }); return }
  const url = `/uploads/${req.file.filename}`
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(url, req.user!.userId)
  res.json({ avatar: url })
})

import { Router } from 'express'
import { db } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'

export const adminRouter = Router()
adminRouter.use(requireAdmin)

// ── Stats ────────────────────────────────────────────────────────────────────
adminRouter.get('/stats', (_req, res) => {
  const stats = {
    listings: (db.prepare('SELECT COUNT(*) as n FROM listings').get() as any).n,
    activeListings: (db.prepare('SELECT COUNT(*) as n FROM listings WHERE active=1').get() as any).n,
    users: (db.prepare("SELECT COUNT(*) as n FROM users WHERE role='user'").get() as any).n,
    messages: (db.prepare('SELECT COUNT(*) as n FROM messages').get() as any).n,
    unreadMessages: (db.prepare('SELECT COUNT(*) as n FROM messages WHERE read=0').get() as any).n,
  }
  res.json(stats)
})

// ── Listings ─────────────────────────────────────────────────────────────────
adminRouter.get('/listings', (_req, res) => {
  const rows = db.prepare(`
    SELECT l.*, u.name as owner_name,
      (SELECT COUNT(*) FROM messages m WHERE m.listing_id = l.id) as message_count
    FROM listings l
    LEFT JOIN users u ON u.id = l.owner_id
    ORDER BY l.created_at DESC
  `).all()
  res.json(rows)
})

adminRouter.patch('/listings/:id', (req, res) => {
  const { title, description, active } = req.body
  const row = db.prepare('SELECT id FROM listings WHERE id=?').get(req.params.id)
  if (!row) { res.status(404).json({ error: 'Niet gevonden' }); return }

  if (title     !== undefined) db.prepare('UPDATE listings SET title=? WHERE id=?').run(title.trim(), req.params.id)
  if (description !== undefined) db.prepare('UPDATE listings SET description=? WHERE id=?').run(description.trim(), req.params.id)
  if (active    !== undefined) db.prepare('UPDATE listings SET active=? WHERE id=?').run(active ? 1 : 0, req.params.id)

  res.json(db.prepare('SELECT * FROM listings WHERE id=?').get(req.params.id))
})

adminRouter.delete('/listings/:id', (req, res) => {
  db.prepare('DELETE FROM messages WHERE listing_id=?').run(req.params.id)
  const { changes } = db.prepare('DELETE FROM listings WHERE id=?').run(req.params.id)
  if (!changes) { res.status(404).json({ error: 'Niet gevonden' }); return }
  res.json({ ok: true })
})

// ── Users ────────────────────────────────────────────────────────────────────
adminRouter.get('/users', (_req, res) => {
  const rows = db.prepare(`
    SELECT u.*,
      (SELECT COUNT(*) FROM listings l WHERE l.owner_id = u.id) as listing_count,
      (SELECT COUNT(*) FROM messages m
       JOIN listings l ON l.id = m.listing_id WHERE l.owner_id = u.id) as message_count
    FROM users u
    ORDER BY u.created_at DESC
  `).all()
  res.json(rows)
})

adminRouter.patch('/users/:id/role', (req, res) => {
  const { role } = req.body
  if (!['user', 'admin'].includes(role)) { res.status(400).json({ error: 'Ongeldige rol' }); return }
  const { changes } = db.prepare("UPDATE users SET role=? WHERE id=?").run(role, req.params.id)
  if (!changes) { res.status(404).json({ error: 'Niet gevonden' }); return }
  res.json({ ok: true, role })
})

adminRouter.delete('/users/:id', (req, res) => {
  // Prevent deleting self
  if (req.user!.userId === req.params.id) {
    res.status(400).json({ error: 'Je kunt jezelf niet verwijderen' }); return
  }
  const listingIds = (db.prepare('SELECT id FROM listings WHERE owner_id=?').all(req.params.id) as any[]).map((r: any) => r.id)
  listingIds.forEach(lid => db.prepare('DELETE FROM messages WHERE listing_id=?').run(lid))
  db.prepare('DELETE FROM listings WHERE owner_id=?').run(req.params.id)
  const { changes } = db.prepare('DELETE FROM users WHERE id=?').run(req.params.id)
  if (!changes) { res.status(404).json({ error: 'Niet gevonden' }); return }
  res.json({ ok: true })
})

// ── Messages ─────────────────────────────────────────────────────────────────
adminRouter.get('/messages', (_req, res) => {
  const rows = db.prepare(`
    SELECT m.*, l.title as listing_title, l.type as listing_type
    FROM messages m JOIN listings l ON l.id = m.listing_id
    ORDER BY m.created_at DESC LIMIT 100
  `).all()
  res.json(rows)
})

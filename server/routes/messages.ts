import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

export const messagesRouter = Router()

// Send a message (public)
messagesRouter.post('/', (req, res) => {
  const { listing_id, sender_name, sender_email, body } = req.body
  if (!listing_id || !sender_name || !sender_email || !body) {
    res.status(400).json({ error: 'Alle velden zijn verplicht' }); return
  }
  const listing = db.prepare('SELECT id FROM listings WHERE id = ?').get(listing_id)
  if (!listing) { res.status(404).json({ error: 'Advertentie niet gevonden' }); return }

  const { lastInsertRowid } = db.prepare(
    'INSERT INTO messages (listing_id, sender_name, sender_email, body) VALUES (?,?,?,?)'
  ).run(listing_id, sender_name.trim(), sender_email.trim(), body.trim())

  console.log(`[msg #${lastInsertRowid}] ${sender_name} → listing ${listing_id}`)
  res.status(201).json({ id: lastInsertRowid, listing_id, sender_name, sender_email, body })
})

// Get messages for own listing (auth required)
messagesRouter.get('/listing/:id', requireAuth, (req, res) => {
  const listing = db.prepare('SELECT owner_id FROM listings WHERE id = ?').get(req.params.id) as any
  if (!listing) { res.status(404).json({ error: 'Niet gevonden' }); return }
  if (listing.owner_id !== req.user!.userId) {
    res.status(403).json({ error: 'Geen toegang' }); return
  }
  const rows = db.prepare('SELECT * FROM messages WHERE listing_id = ? ORDER BY created_at DESC').all(req.params.id)
  // Mark as read
  db.prepare('UPDATE messages SET read = 1 WHERE listing_id = ? AND read = 0').run(req.params.id)
  res.json(rows)
})

import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'

export const listingsRouter = Router()

function rowToListing(row: Record<string, unknown>) {
  const imagesRaw = row.images as string | null
  const images: string[] = imagesRaw ? JSON.parse(imagesRaw) : []
  return {
    id:             row.id,
    type:           row.type,
    title:          row.title,
    description:    row.description,
    image:          images[0] ?? (row.image as string),   // first upload or seeded URL
    images:         images.length > 0 ? images : undefined,
    location:       { lat: row.lat, lng: row.lng, city: row.city, country: row.country },
    author:         { name: row.author_name, avatar: row.author_avatar, rating: row.author_rating, reviews: row.author_reviews },
    price:          row.price ?? undefined,
    priceUnit:      row.price_unit ?? undefined,
    tags:           JSON.parse(row.tags as string),
    date:           row.date ?? undefined,
    spotsAvailable: row.spots_available ?? undefined,
    ownerId:        row.owner_id ?? undefined,
  }
}

listingsRouter.get('/', (req, res) => {
  const { type } = req.query
  const rows = type
    ? db.prepare('SELECT * FROM listings WHERE type = ? ORDER BY created_at DESC').all(type as string)
    : db.prepare('SELECT * FROM listings ORDER BY created_at DESC').all()
  res.json((rows as Record<string, unknown>[]).map(rowToListing))
})

listingsRouter.get('/mine', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT l.*, COUNT(m.id) as message_count, SUM(CASE WHEN m.read = 0 THEN 1 ELSE 0 END) as unread_count
    FROM listings l
    LEFT JOIN messages m ON m.listing_id = l.id
    WHERE l.owner_id = ?
    GROUP BY l.id
    ORDER BY l.created_at DESC
  `).all(req.user!.userId) as Record<string, unknown>[]

  res.json(rows.map(r => ({ ...rowToListing(r), messageCount: r.message_count, unreadCount: r.unread_count })))
})

listingsRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!row) { res.status(404).json({ error: 'Niet gevonden' }); return }
  res.json(rowToListing(row))
})

listingsRouter.patch('/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT owner_id FROM listings WHERE id = ?').get(req.params.id) as { owner_id: string | null } | undefined
  if (!row) { res.status(404).json({ error: 'Niet gevonden' }); return }
  if (row.owner_id !== req.user!.userId && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Geen toegang' }); return
  }

  const { title, description, city, price, priceUnit, date, images, type } = req.body
  const updates: string[] = []
  const params: unknown[] = []

  if (title       !== undefined) { updates.push('title = ?');      params.push(title.trim()) }
  if (description !== undefined) { updates.push('description = ?'); params.push(description.trim()) }
  if (city        !== undefined) { updates.push('city = ?');        params.push(city.trim()) }
  if (price       !== undefined) { updates.push('price = ?');       params.push(price ?? null) }
  if (priceUnit   !== undefined) { updates.push('price_unit = ?');  params.push(priceUnit ?? null) }
  if (date        !== undefined) { updates.push('date = ?');        params.push(date || null) }
  if (type        !== undefined) { updates.push('type = ?');        params.push(type) }
  if (images      !== undefined) {
    const arr: string[] = Array.isArray(images) ? images : []
    updates.push('images = ?'); params.push(arr.length > 0 ? JSON.stringify(arr) : null)
    updates.push('image = ?');  params.push(arr[0] ?? '')
  }

  if (updates.length > 0) {
    params.push(req.params.id)
    db.prepare(`UPDATE listings SET ${updates.join(', ')} WHERE id = ?`).run(...params)
  }

  const updated = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id)
  res.json(rowToListing(updated as Record<string, unknown>))
})

listingsRouter.delete('/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT owner_id FROM listings WHERE id = ?').get(req.params.id) as { owner_id: string | null } | undefined
  if (!row) { res.status(404).json({ error: 'Niet gevonden' }); return }
  if (row.owner_id !== req.user!.userId && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Geen toegang' }); return
  }

  db.prepare('DELETE FROM messages WHERE listing_id = ?').run(req.params.id)
  db.prepare('DELETE FROM listings WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

listingsRouter.post('/', optionalAuth, (req, res) => {
  const { type, title, description, image, images, location, author, price, priceUnit, tags, date, spotsAvailable } = req.body
  if (!type || !title || !description) {
    res.status(400).json({ error: 'type, title en description zijn verplicht' }); return
  }
  const id = crypto.randomUUID()
  const ownerId = req.user?.userId ?? null

  const authorName  = req.user ? req.user.name : (author?.name ?? 'Anoniem')
  const authorAvatar = req.user
    ? (db.prepare('SELECT avatar FROM users WHERE id = ?').get(req.user.userId) as any)?.avatar ?? ''
    : (author?.avatar ?? '')

  const imagesArr: string[] = Array.isArray(images) ? images : (image ? [image] : [])

  db.prepare(`
    INSERT INTO listings (id, type, title, description, image, images, lat, lng, city, country,
      author_name, author_avatar, author_rating, author_reviews,
      price, price_unit, tags, date, spots_available, owner_id)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, type, title, description, imagesArr[0] ?? '',
    imagesArr.length > 0 ? JSON.stringify(imagesArr) : null,
    location?.lat ?? 52.3, location?.lng ?? 5.1, location?.city ?? '', location?.country ?? 'NL',
    authorName, authorAvatar, 5.0, 0,
    price ?? null, priceUnit ?? null, JSON.stringify(tags ?? []),
    date ?? null, spotsAvailable ?? null, ownerId,
  )

  const created = db.prepare('SELECT * FROM listings WHERE id = ?').get(id)
  res.status(201).json(rowToListing(created as Record<string, unknown>))
})

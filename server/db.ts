import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { listings as seed } from '../src/data/listings.js'

export const db = new Database('sailing.db')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    avatar        TEXT,
    phone         TEXT,
    location      TEXT,
    role          TEXT NOT NULL DEFAULT 'user',
    created_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS listings (
    id              TEXT PRIMARY KEY,
    type            TEXT NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT NOT NULL,
    image           TEXT NOT NULL,
    images          TEXT,
    lat             REAL NOT NULL,
    lng             REAL NOT NULL,
    city            TEXT NOT NULL,
    country         TEXT NOT NULL,
    author_name     TEXT NOT NULL,
    author_avatar   TEXT NOT NULL,
    author_rating   REAL NOT NULL,
    author_reviews  INTEGER NOT NULL,
    price           REAL,
    price_unit      TEXT,
    tags            TEXT NOT NULL,
    date            TEXT,
    spots_available INTEGER,
    owner_id        TEXT REFERENCES users(id),
    active          INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id   TEXT NOT NULL REFERENCES listings(id),
    sender_name  TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    body         TEXT NOT NULL,
    read         INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT DEFAULT (datetime('now'))
  );
`)

// ── Migrations (idempotent) ──────────────────────────────────────────────────
function addColumn(table: string, col: string, def: string) {
  const cols = (db.prepare(`PRAGMA table_info(${table})`).all() as any[]).map((c: any) => c.name)
  if (!cols.includes(col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`)
}
addColumn('users',    'phone',    'TEXT')
addColumn('users',    'location', 'TEXT')
addColumn('users',    'role',     "TEXT NOT NULL DEFAULT 'user'")
addColumn('listings', 'owner_id', 'TEXT REFERENCES users(id)')
addColumn('listings', 'active',   'INTEGER NOT NULL DEFAULT 1')
addColumn('listings', 'images',   'TEXT')
addColumn('messages', 'read',     'INTEGER NOT NULL DEFAULT 0')

// ── Seed listings ────────────────────────────────────────────────────────────
const { n: listingCount } = db.prepare('SELECT COUNT(*) as n FROM listings').get() as { n: number }
if (listingCount === 0) {
  const insert = db.prepare(`
    INSERT INTO listings (id,type,title,description,image,lat,lng,city,country,
      author_name,author_avatar,author_rating,author_reviews,price,price_unit,tags,date,spots_available)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `)
  for (const l of seed) {
    insert.run(l.id,l.type,l.title,l.description,l.image,
      l.location.lat,l.location.lng,l.location.city,l.location.country,
      l.author.name,l.author.avatar,l.author.rating,l.author.reviews,
      l.price??null,l.priceUnit??null,JSON.stringify(l.tags),l.date??null,l.spotsAvailable??null)
  }
  console.log(`Seeded ${seed.length} listings.`)
}

// ── Seed admin user ──────────────────────────────────────────────────────────
const adminEmail    = process.env.ADMIN_EMAIL    ?? 'admin@sailing-together.nl'
const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123'

const existingAdmin = db.prepare("SELECT id FROM users WHERE role = 'admin'").get()
if (!existingAdmin) {
  const hash = bcrypt.hashSync(adminPassword, 10)
  const id   = crypto.randomUUID()
  db.prepare('INSERT INTO users (id,name,email,password_hash,avatar,role) VALUES (?,?,?,?,?,?)')
    .run(id, 'Admin', adminEmail, hash, `https://i.pravatar.cc/150?u=${id}`, 'admin')
  console.log(`\n🔑 Admin aangemaakt:\n   E-mail:    ${adminEmail}\n   Wachtwoord: ${adminPassword}\n`)
}

import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { listingsRouter } from './routes/listings.js'
import { messagesRouter } from './routes/messages.js'
import { authRouter }     from './routes/auth.js'
import { uploadsRouter }  from './routes/uploads.js'
import { adminRouter }    from './routes/admin.js'
import './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')))

app.use('/api/auth',     authRouter)
app.use('/api/admin',    adminRouter)
app.use('/api/listings', listingsRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/uploads',  uploadsRouter)
app.get('/api/health',   (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`\n⚓ Sailing Together API — http://localhost:${PORT}\n`)
})

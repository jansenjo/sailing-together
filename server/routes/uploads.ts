import { Router, Request } from 'express'
import multer from 'multer'
import path from 'path'
import { randomUUID } from 'crypto'

export const uploadsRouter = Router()

const storage = multer.diskStorage({
  destination: 'public/uploads/',
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${randomUUID()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB per file
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png|webp|gif)$/.test(file.mimetype)
    cb(null, ok)
  },
})

uploadsRouter.post('/', upload.array('photos', 10), (req: Request, res) => {
  const files = (req.files ?? []) as Express.Multer.File[]
  if (files.length === 0) {
    res.status(400).json({ error: 'Geen geldige afbeeldingen ontvangen' }); return
  }
  const urls = files.map((f) => `/uploads/${f.filename}`)
  res.status(201).json({ urls })
})

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export const JWT_SECRET = process.env.JWT_SECRET ?? 'sailing-together-dev-secret'

export interface AuthPayload {
  userId: string
  email: string
  name: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Niet ingelogd' }); return
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET) as AuthPayload
    next()
  } catch {
    res.status(401).json({ error: 'Sessie verlopen, log opnieuw in' })
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) { res.status(401).json({ error: 'Niet ingelogd' }); return }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as AuthPayload
    if (payload.role !== 'admin') { res.status(403).json({ error: 'Geen toegang' }); return }
    req.user = payload
    next()
  } catch { res.status(401).json({ error: 'Sessie verlopen' }) }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try { req.user = jwt.verify(header.slice(7), JWT_SECRET) as AuthPayload } catch { /* ignore */ }
  }
  next()
}

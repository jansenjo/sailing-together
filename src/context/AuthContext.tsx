import { createContext, useContext, useState, type ReactNode } from 'react'

export interface AuthUser {
  id: string
  name: string
  email: string
  avatar: string
  phone?: string
  location?: string
  role?: 'user' | 'admin'
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  login: (email: string, password: string) => Promise<AuthUser>
  register: (name: string, email: string, password: string) => Promise<AuthUser>
  logout: () => void
  updateUser: (patch: Partial<AuthUser>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const s = localStorage.getItem('st_user')
      return s ? (JSON.parse(s) as AuthUser) : null
    } catch { return null }
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('st_token'))

  function persist(t: string, u: AuthUser) {
    setToken(t); setUser(u)
    localStorage.setItem('st_token', t)
    localStorage.setItem('st_user', JSON.stringify(u))
  }

  function updateUser(patch: Partial<AuthUser>) {
    if (!user) return
    const updated = { ...user, ...patch }
    setUser(updated)
    localStorage.setItem('st_user', JSON.stringify(updated))
  }

  async function login(email: string, password: string): Promise<AuthUser> {
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Inloggen mislukt')
    persist(data.token, data.user)
    return data.user as AuthUser
  }

  async function register(name: string, email: string, password: string): Promise<AuthUser> {
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Registratie mislukt')
    persist(data.token, data.user)
    return data.user as AuthUser
  }

  function logout() {
    setUser(null); setToken(null)
    localStorage.removeItem('st_token')
    localStorage.removeItem('st_user')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

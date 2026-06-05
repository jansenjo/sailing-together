import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Anchor, Eye, EyeOff, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '../context/AuthContext'

type Tab = 'login' | 'register'

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState<Tab>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const loggedIn = tab === 'login'
        ? await login(email, password)
        : await register(name, email, password)
      navigate(loggedIn.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-ocean-100 mb-4">
            <Anchor size={28} className="text-ocean-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {tab === 'login' ? 'Welkom terug' : 'Account aanmaken'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {tab === 'login' ? 'Log in om je advertenties te beheren' : 'Gratis en vrijblijvend'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
          {(['login', 'register'] as Tab[]).map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(null) }}
              className={clsx('flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              {t === 'login' ? 'Inloggen' : 'Registreren'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Naam</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Jouw naam" required autoComplete="name"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400" />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">E-mailadres</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="jij@email.nl" required autoComplete="email"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Wachtwoord</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === 'register' ? 'Minimaal 8 tekens' : '••••••••'}
                required minLength={tab === 'register' ? 8 : 1}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-ocean-600 hover:bg-ocean-700 disabled:opacity-60 text-white font-semibold py-3 rounded-2xl text-sm transition-colors">
            {loading ? <><Loader2 size={15} className="animate-spin" />Even geduld...</> :
              tab === 'login' ? 'Inloggen' : 'Account aanmaken'}
          </button>
        </form>
      </div>
    </div>
  )
}

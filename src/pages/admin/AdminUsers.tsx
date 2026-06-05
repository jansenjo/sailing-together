import { useState, useEffect } from 'react'
import { Trash2, ShieldCheck, ShieldOff, Loader2, Search, Phone, MapPin } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

interface AdminUser {
  id: string; name: string; email: string; avatar: string
  phone: string | null; location: string | null; role: string
  listing_count: number; message_count: number; created_at: string
}

export default function AdminUsers() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const token = localStorage.getItem('st_token')
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => {
    fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setUsers).finally(() => setLoading(false))
  }, [])

  const visible = users.filter(u =>
    query === '' || u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  )

  async function toggleRole(u: AdminUser) {
    const newRole = u.role === 'admin' ? 'user' : 'admin'
    if (!confirm(`${u.name} ${newRole === 'admin' ? 'promoveren tot admin' : 'terugzetten naar gebruiker'}?`)) return
    await fetch(`/api/admin/users/${u.id}/role`, {
      method: 'PATCH', headers, body: JSON.stringify({ role: newRole })
    })
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x))
  }

  async function deleteUser(u: AdminUser) {
    if (!confirm(`${u.name} en alle bijbehorende advertenties en berichten verwijderen?`)) return
    await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE', headers })
    setUsers(prev => prev.filter(x => x.id !== u.id))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gebruikers</h1>
        <span className="text-sm text-gray-500">{users.filter(u => u.role !== 'admin').length} gebruikers</span>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Zoek op naam of e-mail..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400" />
      </div>

      {loading ? (
        <div className="flex justify-center pt-16"><Loader2 size={24} className="animate-spin text-ocean-500" /></div>
      ) : (
        <div className="space-y-2">
          {visible.map(u => (
            <div key={u.id} className="bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm flex items-center gap-4">
              <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                  {u.role === 'admin' && (
                    <span className="bg-red-100 text-red-600 text-xs font-semibold px-1.5 py-0.5 rounded">admin</span>
                  )}
                  {u.id === me?.id && (
                    <span className="bg-ocean-100 text-ocean-600 text-xs px-1.5 py-0.5 rounded">jij</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{u.email}</p>
                <div className="flex flex-wrap gap-3 mt-1">
                  {u.phone && <span className="flex items-center gap-1 text-xs text-gray-400"><Phone size={10} />{u.phone}</span>}
                  {u.location && <span className="flex items-center gap-1 text-xs text-gray-400"><MapPin size={10} />{u.location}</span>}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-400 shrink-0">
                <div className="text-center hidden sm:block">
                  <p className="font-semibold text-gray-700">{u.listing_count}</p>
                  <p className="text-xs">adv.</p>
                </div>
                <div className="text-center hidden sm:block">
                  <p className="font-semibold text-gray-700">{u.message_count}</p>
                  <p className="text-xs">ber.</p>
                </div>
                <p className="text-xs hidden md:block">
                  {new Date(u.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: '2-digit' })}
                </p>
              </div>

              {u.id !== me?.id && (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleRole(u)} title={u.role === 'admin' ? 'Admin rechten intrekken' : 'Promoveren tot admin'}
                    className="p-2 rounded-lg transition-colors hover:bg-gray-50 text-gray-400 hover:text-amber-500">
                    {u.role === 'admin' ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                  </button>
                  <button onClick={() => deleteUser(u)} title="Gebruiker verwijderen"
                    className="p-2 rounded-lg transition-colors hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
          {visible.length === 0 && <p className="text-center text-gray-400 py-12">Geen gebruikers gevonden</p>}
        </div>
      )}
    </div>
  )
}

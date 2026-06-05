import { useState, useEffect } from 'react'
import { List, Users, MessageSquare, Eye, EyeOff, Loader2 } from 'lucide-react'

interface Stats {
  listings: number
  activeListings: number
  users: number
  messages: number
  unreadMessages: number
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: number; sub?: string; icon: typeof List; color: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  )
}

interface RecentListing {
  id: string; title: string; type: string; city: string; active: number
  author_name: string; message_count: number; created_at: string
}

interface RecentUser {
  id: string; name: string; email: string; role: string
  listing_count: number; created_at: string
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [listings, setListings] = useState<RecentListing[]>([])
  const [users, setUsers] = useState<RecentUser[]>([])
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('st_token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats',    { headers }).then(r => r.json()),
      fetch('/api/admin/listings', { headers }).then(r => r.json()),
      fetch('/api/admin/users',    { headers }).then(r => r.json()),
    ]).then(([s, l, u]) => {
      setStats(s)
      setListings((l as RecentListing[]).slice(0, 8))
      setUsers((u as RecentUser[]).slice(0, 6))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center pt-24"><Loader2 size={28} className="animate-spin text-ocean-500" /></div>

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Overzicht</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Advertenties"    value={stats?.listings ?? 0}
          sub={`${stats?.activeListings} actief`} icon={List} color="bg-ocean-500" />
        <StatCard label="Gebruikers"      value={stats?.users ?? 0}     icon={Users}         color="bg-violet-500" />
        <StatCard label="Berichten"       value={stats?.messages ?? 0}  icon={MessageSquare} color="bg-emerald-500" />
        <StatCard label="Ongelezen"       value={stats?.unreadMessages ?? 0} icon={MessageSquare} color="bg-amber-500" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent listings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Laatste advertenties</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {listings.map((l) => (
              <div key={l.id} className="flex items-center gap-3 px-5 py-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${l.active ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{l.title}</p>
                  <p className="text-xs text-gray-400">{l.city} · {l.author_name}</p>
                </div>
                <span className="text-xs text-gray-400">{l.message_count} ber.</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent users */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Nieuwste gebruikers</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-7 h-7 rounded-full bg-ocean-100 flex items-center justify-center text-ocean-700 font-semibold text-xs shrink-0">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{u.listing_count} adv.</span>
                  {u.role === 'admin' && <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">admin</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

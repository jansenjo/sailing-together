import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Trash2, Eye, EyeOff, Search } from 'lucide-react'
import { clsx } from 'clsx'

interface AdminListing {
  id: string; type: string; title: string; description: string
  city: string; active: number; author_name: string
  owner_name: string | null; message_count: number; created_at: string; price: number | null
}

const typeColors: Record<string, string> = {
  trip: 'bg-ocean-100 text-ocean-700', passenger: 'bg-violet-100 text-violet-700',
  crew_wanted: 'bg-amber-100 text-amber-700', crew_offer: 'bg-orange-100 text-orange-700',
  lesson: 'bg-pink-100 text-pink-700', rental: 'bg-emerald-100 text-emerald-700',
  sharing: 'bg-teal-100 text-teal-700',
}
const typeLabel: Record<string, string> = {
  trip: 'Dagje uit', passenger: 'Opstapper', crew_wanted: 'Crew gezocht',
  crew_offer: 'Crew aangeboden', lesson: 'Zeilles', rental: 'Verhuur', sharing: 'Sharing',
}

export default function AdminListings() {
  const [listings, setListings] = useState<AdminListing[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const token = localStorage.getItem('st_token')
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => {
    fetch('/api/admin/listings', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setListings).finally(() => setLoading(false))
  }, [])

  const visible = listings.filter(l =>
    query === '' || l.title.toLowerCase().includes(query.toLowerCase()) ||
    l.city.toLowerCase().includes(query.toLowerCase()) || l.author_name.toLowerCase().includes(query.toLowerCase())
  )

  async function toggleActive(l: AdminListing) {
    await fetch(`/api/admin/listings/${l.id}`, {
      method: 'PATCH', headers, body: JSON.stringify({ active: !l.active })
    })
    setListings(prev => prev.map(x => x.id === l.id ? { ...x, active: x.active ? 0 : 1 } : x))
  }

  async function handleDelete(id: string) {
    if (!confirm('Advertentie en alle bijbehorende berichten verwijderen?')) return
    await fetch(`/api/admin/listings/${id}`, { method: 'DELETE', headers })
    setListings(prev => prev.filter(l => l.id !== id))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Advertenties</h1>
        <span className="text-sm text-gray-500">{listings.length} totaal</span>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Zoek op titel, stad of auteur..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400" />
      </div>

      {loading ? (
        <div className="flex justify-center pt-16"><Loader2 size={24} className="animate-spin text-ocean-500" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Advertentie</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Aanbieder</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Ber.</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.map(l => (
                <tr key={l.id} className={clsx('group', !l.active && 'opacity-50')}>
                  <td className="px-4 py-3">
                    <div>
                      <span className={clsx('text-xs px-1.5 py-0.5 rounded-full font-medium mr-1.5', typeColors[l.type] ?? 'bg-gray-100 text-gray-600')}>
                        {typeLabel[l.type] ?? l.type}
                      </span>
                      <span className="font-medium text-gray-800">{l.title}</span>
                      <span className="text-gray-400 ml-2">· {l.city}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{l.owner_name ?? l.author_name}</td>
                  <td className="px-4 py-3 text-center text-gray-400 hidden lg:table-cell">{l.message_count}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(l)} title={l.active ? 'Verbergen' : 'Tonen'}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors hover:bg-gray-50">
                      {l.active
                        ? <><Eye size={12} className="text-emerald-500" /><span className="text-emerald-600">Actief</span></>
                        : <><EyeOff size={12} className="text-gray-400" /><span className="text-gray-400">Verborgen</span></>
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/listing/${l.id}/edit`} title="Bewerken"
                        className="p-1.5 text-gray-400 hover:text-ocean-600 hover:bg-ocean-50 rounded-lg transition-colors">
                        <Pencil size={14} />
                      </Link>
                      <button onClick={() => handleDelete(l.id)} title="Verwijderen"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && (
            <p className="text-center text-gray-400 py-12">Geen advertenties gevonden</p>
          )}
        </div>
      )}
    </div>
  )
}

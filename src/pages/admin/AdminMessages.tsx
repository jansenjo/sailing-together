import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Mail, Clock, ExternalLink } from 'lucide-react'

interface AdminMessage {
  id: number; listing_id: string; listing_title: string; listing_type: string
  sender_name: string; sender_email: string; body: string; read: number; created_at: string
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('st_token')

  useEffect(() => {
    fetch('/api/admin/messages', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setMessages).finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Berichten</h1>
        <span className="text-sm text-gray-500">{messages.length} totaal · {messages.filter(m => !m.read).length} ongelezen</span>
      </div>

      {loading ? (
        <div className="flex justify-center pt-16"><Loader2 size={24} className="animate-spin text-ocean-500" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {messages.map(m => (
              <div key={m.id} className={`px-5 py-4 ${!m.read ? 'bg-ocean-50/40' : ''}`}>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-ocean-100 flex items-center justify-center text-ocean-700 font-bold text-xs shrink-0">
                      {m.sender_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{m.sender_name}</p>
                      <a href={`mailto:${m.sender_email}`} className="flex items-center gap-1 text-xs text-ocean-600 hover:underline">
                        <Mail size={10} />{m.sender_email}
                      </a>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Link to={`/listing/${m.listing_id}`} target="_blank"
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-ocean-600 transition-colors">
                      <ExternalLink size={10} />
                      <span className="max-w-[160px] truncate">{m.listing_title}</span>
                    </Link>
                    <p className="flex items-center justify-end gap-1 text-xs text-gray-400 mt-0.5">
                      <Clock size={10} />
                      {new Date(m.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed pl-9">{m.body}</p>
                {!m.read && <span className="ml-9 mt-1.5 inline-block text-xs bg-ocean-100 text-ocean-700 px-1.5 py-0.5 rounded font-medium">Ongelezen</span>}
              </div>
            ))}
            {messages.length === 0 && <p className="text-center text-gray-400 py-12">Nog geen berichten</p>}
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  MessageCircle, MapPin, CalendarDays, ChevronDown, ChevronUp,
  Mail, Clock, PlusCircle, Loader2, Pencil, Check, X,
  LogOut, Camera, Phone, User, Trash2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchMyListings, fetchMessages, updateProfile, uploadAvatar, deleteListing } from '../api'
import type { Listing } from '../types'

type MyListing = Listing & { messageCount: number; unreadCount: number }
type Message = { id: number; sender_name: string; sender_email: string; body: string; created_at: string }

// ── Profile section ──────────────────────────────────────────────────────────
function ProfileSection() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [location, setLocation] = useState(user?.location ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)

  function startEdit() {
    setName(user?.name ?? '')
    setEmail(user?.email ?? '')
    setPhone(user?.phone ?? '')
    setLocation(user?.location ?? '')
    setSaveError(null)
    setEditing(true)
  }

  async function handleSave() {
    setSaving(true); setSaveError(null)
    try {
      const updated = await updateProfile({ name, email, phone, location })
      updateUser(updated)
      setEditing(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarLoading(true)
    try {
      const url = await uploadAvatar(file)
      updateUser({ avatar: url })
    } catch { /* silent */ }
    finally { setAvatarLoading(false) }
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
      <div className="flex items-start gap-5">
        {/* Avatar with upload overlay */}
        <div className="relative shrink-0">
          <img
            src={user?.avatar}
            alt={user?.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarLoading}
            title="Profielfoto wijzigen"
            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 hover:opacity-100 transition-opacity"
          >
            {avatarLoading
              ? <Loader2 size={20} className="text-white animate-spin" />
              : <Camera size={20} className="text-white" />
            }
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* Info or edit form */}
        <div className="flex-1 min-w-0">
          {!editing ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{user?.name}</h2>
              <div className="mt-1.5 space-y-1">
                <p className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Mail size={13} />{user?.email}
                </p>
                {user?.phone && (
                  <p className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Phone size={13} />{user.phone}
                  </p>
                )}
                {user?.location && (
                  <p className="flex items-center gap-1.5 text-sm text-gray-500">
                    <MapPin size={13} />{user.location}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Naam</label>
                  <div className="relative">
                    <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">E-mailadres</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Telefoonnummer</label>
                  <div className="relative">
                    <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="+31 6 12345678"
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Locatie / thuishaven</label>
                  <div className="relative">
                    <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={location} onChange={(e) => setLocation(e.target.value)}
                      placeholder="bijv. Amsterdam, Enkhuizen"
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400" />
                  </div>
                </div>
              </div>

              {saveError && (
                <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{saveError}</p>
              )}

              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 bg-ocean-600 hover:bg-ocean-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Opslaan
                </button>
                <button onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                  <X size={13} />Annuleren
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!editing && (
          <div className="flex flex-col items-end gap-2 shrink-0">
            <button onClick={startEdit}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
              <Pencil size={13} />Bewerken
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700 px-3 py-1.5 rounded-xl border border-red-100 hover:border-red-200 hover:bg-red-50 transition-colors">
              <LogOut size={13} />Uitloggen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Message thread per listing ────────────────────────────────────────────────
function MessageThread({ listing, onDelete }: { listing: MyListing; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Weet je zeker dat je deze advertentie wilt verwijderen?')) return
    setDeleting(true)
    try {
      await deleteListing(listing.id)
      onDelete(listing.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Verwijderen mislukt')
      setDeleting(false)
    }
  }

  async function toggle() {
    if (!open && messages.length === 0) {
      setLoading(true)
      fetchMessages(listing.id).then(setMessages).finally(() => setLoading(false))
    }
    setOpen(!open)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-start gap-4 p-4">
        <img src={listing.image} alt={listing.title}
          className="w-20 h-16 object-cover rounded-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <Link to={`/listing/${listing.id}`}
            className="font-semibold text-gray-900 hover:text-ocean-600 transition-colors line-clamp-1">
            {listing.title}
          </Link>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
            <span className="flex items-center gap-1"><MapPin size={11} />{listing.location.city}</span>
            {listing.date && (
              <span className="flex items-center gap-1">
                <CalendarDays size={11} />
                {new Date(listing.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Link to={`/listing/${listing.id}/edit`}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-ocean-600 px-2.5 py-1.5 rounded-lg hover:bg-ocean-50 transition-colors border border-gray-200 hover:border-ocean-200">
            <Pencil size={12} />Bewerken
          </Link>
          <button onClick={handleDelete} disabled={deleting}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors border border-gray-200 hover:border-red-200 disabled:opacity-50">
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          </button>
        </div>

        <button onClick={toggle}
          className="flex items-center gap-2 shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors hover:bg-gray-50">
          <MessageCircle size={15} className={listing.unreadCount > 0 ? 'text-ocean-600' : 'text-gray-400'} />
          <span className={listing.messageCount > 0 ? 'text-gray-700' : 'text-gray-400'}>
            {listing.messageCount} {listing.messageCount === 1 ? 'bericht' : 'berichten'}
          </span>
          {listing.unreadCount > 0 && (
            <span className="bg-ocean-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
              {listing.unreadCount}
            </span>
          )}
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-100">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nog geen berichten ontvangen</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {messages.map((m) => (
                <div key={m.id} className="px-4 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-ocean-100 flex items-center justify-center text-ocean-700 font-semibold text-xs">
                        {m.sender_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{m.sender_name}</p>
                        <a href={`mailto:${m.sender_email}`}
                          className="flex items-center gap-1 text-xs text-ocean-600 hover:underline">
                          <Mail size={10} />{m.sender_email}
                        </a>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={11} />
                      {new Date(m.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed pl-9">{m.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [listings, setListings] = useState<MyListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMyListings()
      .then(setListings)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const totalUnread = listings.reduce((s, l) => s + (l.unreadCount ?? 0), 0)

  return (
    <div className="max-w-3xl mx-auto px-4 pt-8 pb-24">

      <ProfileSection />

      {/* Listings header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Mijn advertenties</h2>
        <Link to="/aanbieden"
          className="flex items-center gap-1.5 bg-ocean-600 hover:bg-ocean-700 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors">
          <PlusCircle size={14} />Nieuwe advertentie
        </Link>
      </div>

      {totalUnread > 0 && (
        <div className="bg-ocean-50 border border-ocean-200 rounded-2xl px-4 py-3 mb-4 flex items-center gap-2 text-sm text-ocean-700">
          <MessageCircle size={16} />
          Je hebt <strong>{totalUnread} ongelezen {totalUnread === 1 ? 'bericht' : 'berichten'}</strong>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-ocean-500" /></div>
      )}
      {error && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="font-medium text-gray-700">{error}</p>
        </div>
      )}
      {!loading && !error && listings.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">⚓</p>
          <p className="font-medium text-gray-700 mb-2">Nog geen advertenties</p>
          <p className="text-sm mb-6">Maak je eerste advertentie aan en bereik zeilers in jouw buurt.</p>
          <Link to="/aanbieden"
            className="inline-flex items-center gap-2 bg-ocean-600 hover:bg-ocean-700 text-white font-medium px-6 py-3 rounded-full text-sm transition-colors">
            <PlusCircle size={15} />Eerste advertentie plaatsen
          </Link>
        </div>
      )}
      {!loading && !error && listings.length > 0 && (
        <div className="space-y-3">
          {listings.map((l) => (
            <MessageThread key={l.id} listing={l}
              onDelete={(id) => setListings((prev) => prev.filter((x) => x.id !== id))} />
          ))}
        </div>
      )}
    </div>
  )
}

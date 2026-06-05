import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Star, CalendarDays, Users,
  Tag, CheckCircle, Send, MessageCircle, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { fetchListing, sendMessage } from '../api'
import type { Listing, ListingType } from '../types'

function ImageGallery({ listing }: { listing: Listing }) {
  const all = listing.images && listing.images.length > 0 ? listing.images : [listing.image]
  const [active, setActive] = useState(0)

  function prev() { setActive((i) => (i - 1 + all.length) % all.length) }
  function next() { setActive((i) => (i + 1) % all.length) }

  return (
    <div className="mb-6">
      {/* Main image */}
      <div className="relative rounded-2xl overflow-hidden aspect-[16/9] group">
        <img src={all[active]} alt={listing.title} className="w-full h-full object-cover transition-opacity duration-300" />

        <span className={`absolute top-4 left-4 text-xs font-semibold px-3 py-1.5 rounded-full ${typePill[listing.type]}`}>
          {typeLabel[listing.type]}
        </span>
        {listing.price && (
          <span className="absolute bottom-4 right-4 bg-white/95 text-gray-900 text-sm font-semibold px-3 py-1.5 rounded-full shadow">
            €{listing.price.toLocaleString('nl-NL')} <span className="font-normal text-gray-500">{listing.priceUnit}</span>
          </span>
        )}

        {/* Arrow controls (only when multiple images) */}
        {all.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition-opacity opacity-0 group-hover:opacity-100">
              <ChevronLeft size={18} className="text-gray-700" />
            </button>
            <button onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition-opacity opacity-0 group-hover:opacity-100">
              <ChevronRight size={18} className="text-gray-700" />
            </button>
            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {all.map((_, i) => (
                <button key={i} onClick={() => setActive(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === active ? 'bg-white w-3' : 'bg-white/60'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {all.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {all.map((src, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === active ? 'border-ocean-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const typeLabel: Record<ListingType, string> = {
  trip:        'Dagje uit',
  passenger:   'Opstapper',
  crew_wanted: 'Crew gezocht',
  crew_offer:  'Crew aangeboden',
  lesson:      'Zeilles',
  rental:      'Boot verhuur',
  sharing:     'Boot sharing',
}

const typePill: Record<ListingType, string> = {
  trip:        'bg-ocean-100 text-ocean-700',
  passenger:   'bg-violet-100 text-violet-700',
  crew_wanted: 'bg-amber-100 text-amber-700',
  crew_offer:  'bg-orange-100 text-orange-700',
  lesson:      'bg-pink-100 text-pink-700',
  rental:      'bg-emerald-100 text-emerald-700',
  sharing:     'bg-teal-100 text-teal-700',
}

type FormState = 'idle' | 'sending' | 'sent' | 'error'

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>()

  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [formState, setFormState] = useState<FormState>('idle')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetchListing(id)
      .then(setListing)
      .catch((e: Error) => setFetchError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!listing || !name.trim() || !email.trim() || !message.trim()) return
    setFormState('sending')
    setFormError(null)
    try {
      await sendMessage({ listing_id: listing.id, sender_name: name, sender_email: email, body: message })
      setFormState('sent')
    } catch (err) {
      setFormState('error')
      setFormError(err instanceof Error ? err.message : 'Onbekende fout')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-ocean-500" />
      </div>
    )
  }

  if (fetchError || !listing) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-20 text-center text-gray-400">
        <p className="text-5xl mb-4">⚓</p>
        <p className="font-medium text-gray-700 text-lg">{fetchError ?? 'Advertentie niet gevonden'}</p>
        <Link to="/" className="mt-4 inline-block text-ocean-600 text-sm hover:underline">
          Terug naar overzicht
        </Link>
      </div>
    )
  }

  const canSubmit = name.trim() && email.trim() && message.trim()

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 pb-24">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors">
        <ArrowLeft size={15} />
        Terug naar overzicht
      </Link>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        {/* Left — listing info */}
        <div>
          <ImageGallery listing={listing} />

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{listing.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
            <span className="flex items-center gap-1"><MapPin size={14} />{listing.location.city}</span>
            {listing.date && (
              <span className="flex items-center gap-1">
                <CalendarDays size={14} />
                {new Date(listing.date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
            {listing.spotsAvailable !== undefined && (
              <span className="flex items-center gap-1">
                <Users size={14} />
                {listing.spotsAvailable} plek{listing.spotsAvailable !== 1 ? 'ken' : ''} beschikbaar
              </span>
            )}
          </div>

          <p className="text-base text-gray-700 leading-relaxed mb-6">{listing.description}</p>

          <div className="flex flex-wrap gap-2 mb-8">
            {listing.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                <Tag size={10} />{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
            <img src={listing.author.avatar} alt={listing.author.name} className="w-14 h-14 rounded-full" />
            <div>
              <p className="font-semibold text-gray-900">{listing.author.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13}
                    className={i < Math.round(listing.author.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
                  />
                ))}
                <span className="text-sm text-gray-500 ml-1">
                  {listing.author.rating} · {listing.author.reviews} beoordelingen
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — contact form */}
        <div className="lg:sticky lg:top-20">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <MessageCircle size={18} className="text-ocean-600" />
              <h2 className="font-semibold text-gray-900">Neem contact op</h2>
            </div>

            {formState === 'sent' ? (
              <div className="text-center py-8">
                <CheckCircle size={48} className="text-emerald-500 mx-auto mb-3" />
                <p className="font-semibold text-gray-900 mb-1">Bericht verstuurd!</p>
                <p className="text-sm text-gray-500">
                  {listing.author.name} ontvangt je bericht en neemt zo snel mogelijk contact op.
                </p>
                <button
                  onClick={() => { setFormState('idle'); setName(''); setEmail(''); setMessage('') }}
                  className="mt-5 text-sm text-ocean-600 hover:underline"
                >
                  Nog een bericht sturen
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Naam</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Jouw naam"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400 focus:border-transparent"
                    required />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">E-mailadres</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="jij@email.nl"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400 focus:border-transparent"
                    required />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Bericht</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5}
                    placeholder={`Hoi ${listing.author.name.split(' ')[0]}, ik ben geïnteresseerd...`}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400 focus:border-transparent resize-none"
                    required />
                </div>

                {formError && (
                  <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
                )}

                <button type="submit" disabled={!canSubmit || formState === 'sending'}
                  className="w-full flex items-center justify-center gap-2 bg-ocean-600 hover:bg-ocean-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-2xl text-sm transition-colors">
                  {formState === 'sending'
                    ? <><Loader2 size={15} className="animate-spin" />Versturen...</>
                    : <><Send size={15} />Stuur bericht naar {listing.author.name.split(' ')[0]}</>
                  }
                </button>

                <p className="text-xs text-gray-400 text-center">
                  Je e-mailadres wordt alleen gedeeld met de aanbieder.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Anchor, Users, Ship, GraduationCap, UserCheck, Handshake, PersonStanding,
  ImagePlus, X, Star, Loader2, Trash2,
} from 'lucide-react'
import { clsx } from 'clsx'
import type { ListingType } from '../types'
import { fetchListing, updateListing, deleteListing, uploadPhotos } from '../api'
import { useAuth } from '../context/AuthContext'

const types: { value: ListingType; label: string; desc: string; icon: typeof Anchor }[] = [
  { value: 'trip',        label: 'Dagje uit',       desc: 'Bied een tocht aan voor opstappers',   icon: Anchor },
  { value: 'passenger',   label: 'Opstapper',        desc: 'Zoek een plek aan boord',              icon: PersonStanding },
  { value: 'crew_wanted', label: 'Crew gezocht',     desc: 'Zoek bemanning voor jouw boot',         icon: Users },
  { value: 'crew_offer',  label: 'Crew aangeboden',  desc: 'Bied jezelf aan als crew',             icon: UserCheck },
  { value: 'lesson',      label: 'Zeilles',          desc: 'Geef zeilles of cursussen',            icon: GraduationCap },
  { value: 'rental',      label: 'Boot verhuur',     desc: 'Verhuur jouw boot aan anderen',         icon: Ship },
  { value: 'sharing',     label: 'Boot sharing',     desc: 'Deel eigendom of gebruik van een boot', icon: Handshake },
]

const pricedTypes: ListingType[] = ['trip', 'lesson', 'rental', 'sharing']
const datedTypes: ListingType[]  = ['trip', 'passenger', 'crew_wanted', 'lesson']

const priceLabel: Partial<Record<ListingType, string>> = {
  trip: '(p.p.)', lesson: '(p.p.)', rental: '(per dag)', sharing: '(per jaar)',
}
const priceUnit: Partial<Record<ListingType, string>> = {
  trip: 'p.p.', lesson: 'p.p.', rental: 'p. dag', sharing: 'p. jaar',
}

interface PhotoItem {
  id: string
  file?: File
  preview: string
  url: string | null
  uploading: boolean
  error: string | null
  existing: boolean
}

export default function EditListing() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [pageLoading, setPageLoading] = useState(true)
  const [notAllowed, setNotAllowed] = useState(false)

  const [selectedType, setSelectedType] = useState<ListingType>('trip')
  const [title, setTitle]               = useState('')
  const [description, setDescription]   = useState('')
  const [city, setCity]                 = useState('')
  const [price, setPrice]               = useState('')
  const [date, setDate]                 = useState('')

  const [photos, setPhotos]   = useState<PhotoItem[]>([])
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [deleting, setDeleting]       = useState(false)

  useEffect(() => {
    if (!id) return
    fetchListing(id)
      .then((listing) => {
        if (user?.role !== 'admin' && listing.ownerId !== user?.id) {
          setNotAllowed(true)
          setPageLoading(false)
          return
        }
        setSelectedType(listing.type)
        setTitle(listing.title)
        setDescription(listing.description)
        setCity(listing.location.city)
        setPrice(listing.price != null ? String(listing.price) : '')
        setDate(listing.date ?? '')

        const urls = listing.images?.length ? listing.images : (listing.image ? [listing.image] : [])
        setPhotos(urls.map((url) => ({
          id: crypto.randomUUID(),
          preview: url,
          url,
          uploading: false,
          error: null,
          existing: true,
        })))
        setPageLoading(false)
      })
      .catch(() => { setNotAllowed(true); setPageLoading(false) })
  }, [id, user])

  async function uploadFile(item: PhotoItem) {
    if (!item.file) return
    setPhotos((prev) => prev.map((p) => p.id === item.id ? { ...p, uploading: true, error: null } : p))
    try {
      const [url] = await uploadPhotos([item.file])
      setPhotos((prev) => prev.map((p) => p.id === item.id ? { ...p, uploading: false, url } : p))
    } catch {
      setPhotos((prev) => prev.map((p) => p.id === item.id ? { ...p, uploading: false, error: 'Upload mislukt' } : p))
    }
  }

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'))
    const newItems: PhotoItem[] = arr.slice(0, 10 - photos.length).map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      url: null,
      uploading: false,
      error: null,
      existing: false,
    }))
    setPhotos((prev) => [...prev, ...newItems])
    newItems.forEach(uploadFile)
  }, [photos.length]) // eslint-disable-line react-hooks/exhaustive-deps

  function removePhoto(photoId: string) {
    setPhotos((prev) => {
      const item = prev.find((p) => p.id === photoId)
      if (item && !item.existing) URL.revokeObjectURL(item.preview)
      return prev.filter((p) => p.id !== photoId)
    })
  }

  function moveToFront(photoId: string) {
    setPhotos((prev) => {
      const idx = prev.findIndex((p) => p.id === photoId)
      if (idx <= 0) return prev
      const next = [...prev]
      next.unshift(...next.splice(idx, 1))
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim() || !city.trim()) return
    if (photos.some((p) => p.uploading)) {
      setSubmitError("Wacht tot alle foto's klaar zijn met uploaden")
      return
    }

    const imageUrls = photos.filter((p) => p.url).map((p) => p.url!)
    const showPrice = pricedTypes.includes(selectedType)
    const showDate  = datedTypes.includes(selectedType)

    setSubmitting(true)
    setSubmitError(null)
    try {
      await updateListing(id!, {
        type:        selectedType,
        title:       title.trim(),
        description: description.trim(),
        city:        city.trim(),
        images:      imageUrls,
        price:       showPrice && price ? parseFloat(price) : null,
        priceUnit:   showPrice ? (priceUnit[selectedType] ?? null) : null,
        date:        showDate && date ? date : null,
      })
      navigate(`/listing/${id}`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Opslaan mislukt')
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Weet je zeker dat je deze advertentie wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) return
    setDeleting(true)
    try {
      await deleteListing(id!)
      navigate(user?.role === 'admin' ? '/admin/listings' : '/dashboard')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Verwijderen mislukt')
      setDeleting(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={28} className="animate-spin text-ocean-500" />
      </div>
    )
  }

  if (notAllowed) {
    return (
      <div className="text-center py-24 px-4">
        <p className="text-5xl mb-4">⛔</p>
        <p className="font-semibold text-gray-800 text-lg">Geen toegang</p>
        <p className="text-sm text-gray-400 mt-1">Je hebt geen rechten om deze advertentie te bewerken.</p>
      </div>
    )
  }

  const showPrice = pricedTypes.includes(selectedType)
  const showDate  = datedTypes.includes(selectedType)

  return (
    <div className="max-w-2xl mx-auto px-4 pt-10 pb-24">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Advertentie bewerken</h2>
          <p className="text-gray-500 mt-1">Wijzig de details van je advertentie.</p>
        </div>
        <button onClick={handleDelete} disabled={deleting}
          className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-800 border border-red-200 hover:border-red-300 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors disabled:opacity-60 shrink-0 ml-4">
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Verwijderen
        </button>
      </div>

      {/* Type selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
        {types.map(({ value, label, desc, icon: Icon }) => (
          <button key={value} type="button" onClick={() => setSelectedType(value)}
            className={clsx('flex flex-col items-center gap-2 p-3 rounded-2xl border-2 text-center transition-all',
              selectedType === value ? 'border-ocean-500 bg-ocean-50' : 'border-gray-200 hover:border-gray-300 bg-white')}>
            <Icon size={22} className={selectedType === value ? 'text-ocean-600' : 'text-gray-400'} />
            <span className={clsx('font-semibold text-xs leading-tight', selectedType === value ? 'text-ocean-700' : 'text-gray-700')}>{label}</span>
            <span className="text-xs text-gray-400 hidden sm:block leading-tight">{desc}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Foto's ──────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Foto&apos;s <span className="text-gray-400 font-normal">(max. 10)</span>
          </label>

          {photos.length < 10 && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
              onClick={() => fileInputRef.current?.click()}
              className={clsx(
                'flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-8 cursor-pointer transition-colors',
                dragging ? 'border-ocean-400 bg-ocean-50' : 'border-gray-200 hover:border-ocean-300 hover:bg-gray-50',
              )}
            >
              <ImagePlus size={28} className={dragging ? 'text-ocean-500' : 'text-gray-400'} />
              <p className="text-sm font-medium text-gray-600">Sleep foto&apos;s hierheen of klik om te bladeren</p>
              <p className="text-xs text-gray-400">JPG, PNG, WEBP · max. 8 MB per foto</p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => e.target.files && addFiles(e.target.files)} />
            </div>
          )}

          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
              {photos.map((photo, idx) => (
                <div key={photo.id} className="relative aspect-square group">
                  <img src={photo.preview} alt="" className="w-full h-full object-cover rounded-xl" />

                  {photo.uploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                      <Loader2 size={20} className="text-white animate-spin" />
                    </div>
                  )}
                  {photo.error && (
                    <div className="absolute inset-0 bg-red-900/60 rounded-xl flex items-center justify-center p-1">
                      <p className="text-white text-xs text-center leading-tight">{photo.error}</p>
                    </div>
                  )}
                  {idx === 0 && !photo.uploading && !photo.error && (
                    <span className="absolute top-1.5 left-1.5 bg-ocean-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <Star size={9} className="fill-white" /> Omslag
                    </span>
                  )}

                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {idx > 0 && photo.url && (
                      <button type="button" onClick={() => moveToFront(photo.id)}
                        title="Stel in als omslagfoto"
                        className="w-6 h-6 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow text-gray-700">
                        <Star size={11} />
                      </button>
                    )}
                    <button type="button" onClick={() => removePhoto(photo.id)}
                      className="w-6 h-6 bg-white/90 hover:bg-red-50 rounded-full flex items-center justify-center shadow text-gray-500 hover:text-red-600">
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {photos.length < 10 && (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-200 hover:border-ocean-300 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-ocean-500 transition-colors">
                  <ImagePlus size={18} />
                  <span className="text-xs">Toevoegen</span>
                </button>
              )}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-2">
            Eerste foto wordt de omslagfoto. Hover over een foto om te verwijderen of als omslag in te stellen.
          </p>
        </div>

        {/* ── Titel ───────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Titel</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400" />
        </div>

        {/* ── Beschrijving ─────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Beschrijving</label>
          <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400 resize-none" />
        </div>

        {/* ── Locatie + Prijs ──────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <div className={showPrice ? '' : 'col-span-2'}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Locatie / haven</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400" />
          </div>
          {showPrice && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Prijs {priceLabel[selectedType] ?? ''}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0"
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400" />
              </div>
            </div>
          )}
        </div>

        {/* ── Datum ────────────────────────────────────────────── */}
        {showDate && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Datum</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400" />
          </div>
        )}

        {submitError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{submitError}</p>
        )}

        {/* ── Knoppen ──────────────────────────────────────────── */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">
            Annuleren
          </button>
          <button type="submit" disabled={submitting || photos.some((p) => p.uploading)}
            className="flex-1 flex items-center justify-center gap-2 bg-ocean-600 hover:bg-ocean-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors">
            {submitting
              ? <><Loader2 size={15} className="animate-spin" />Opslaan...</>
              : 'Wijzigingen opslaan'}
          </button>
        </div>
      </form>
    </div>
  )
}

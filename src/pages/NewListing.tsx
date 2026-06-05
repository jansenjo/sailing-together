import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Anchor, Users, Ship, GraduationCap, UserCheck, Handshake, PersonStanding, ImagePlus, X, Star, Loader2, CheckCircle } from 'lucide-react'
import { clsx } from 'clsx'
import type { ListingType } from '../types'
import { uploadPhotos, createListing } from '../api'
import { useAuth } from '../context/AuthContext'

const types: { value: ListingType; label: string; desc: string; icon: typeof Anchor }[] = [
  { value: 'trip',        label: 'Dagje uit',       desc: 'Bied een tocht aan voor opstappers',    icon: Anchor },
  { value: 'passenger',   label: 'Opstapper',        desc: 'Zoek een plek aan boord',               icon: PersonStanding },
  { value: 'crew_wanted', label: 'Crew gezocht',     desc: 'Zoek bemanning voor jouw boot',          icon: Users },
  { value: 'crew_offer',  label: 'Crew aangeboden',  desc: 'Bied jezelf aan als crew',              icon: UserCheck },
  { value: 'lesson',      label: 'Zeilles',          desc: 'Geef zeilles of cursussen',             icon: GraduationCap },
  { value: 'rental',      label: 'Boot verhuur',     desc: 'Verhuur jouw boot aan anderen',          icon: Ship },
  { value: 'sharing',     label: 'Boot sharing',     desc: 'Deel eigendom of gebruik van een boot',  icon: Handshake },
]

const pricedTypes: ListingType[] = ['trip', 'lesson', 'rental', 'sharing']
const datedTypes: ListingType[]  = ['trip', 'passenger', 'crew_wanted', 'lesson']

const placeholders: Record<ListingType, string> = {
  trip:        'bijv. Dagtrip IJsselmeer vanuit Hoorn',
  passenger:   'bijv. Opstapper zoekt plek richting Zeeland',
  crew_wanted: 'bijv. Crew gezocht voor Noordzee-oversteek',
  crew_offer:  'bijv. Ervaren zeiler beschikbaar als crew',
  lesson:      'bijv. CWO 2 cursus voor beginners',
  rental:      'bijv. Bavaria 37 te huur in Amsterdam',
  sharing:     'bijv. Mede-eigenaar gezocht — Vrijheid 38',
}

interface PhotoItem {
  id: string
  file: File
  preview: string      // object URL for display
  url: string | null   // server URL after upload
  uploading: boolean
  error: string | null
}

export default function NewListing() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [selectedType, setSelectedType] = useState<ListingType>('trip')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [price, setPrice] = useState('')
  const [date, setDate] = useState('')

  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const showPrice = pricedTypes.includes(selectedType)
  const showDate  = datedTypes.includes(selectedType)

  // Upload a single file to the server and update state
  async function uploadFile(item: PhotoItem) {
    setPhotos((prev) => prev.map((p) => p.id === item.id ? { ...p, uploading: true, error: null } : p))
    try {
      const [url] = await uploadPhotos([item.file])
      setPhotos((prev) => prev.map((p) => p.id === item.id ? { ...p, uploading: false, url } : p))
    } catch (e) {
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
    }))
    setPhotos((prev) => [...prev, ...newItems])
    newItems.forEach(uploadFile)
  }, [photos.length]) // eslint-disable-line react-hooks/exhaustive-deps

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const item = prev.find((p) => p.id === id)
      if (item) URL.revokeObjectURL(item.preview)
      return prev.filter((p) => p.id !== id)
    })
  }

  function moveToFront(id: string) {
    setPhotos((prev) => {
      const idx = prev.findIndex((p) => p.id === id)
      if (idx <= 0) return prev
      const next = [...prev]
      next.unshift(...next.splice(idx, 1))
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim() || !city.trim()) return

    const pendingUploads = photos.filter((p) => p.uploading)
    if (pendingUploads.length > 0) {
      setSubmitError('Wacht tot alle foto\'s klaar zijn met uploaden')
      return
    }

    const uploadedUrls = photos.filter((p) => p.url).map((p) => p.url!)

    setSubmitting(true)
    setSubmitError(null)
    try {
      const listing = await createListing({
        type: selectedType,
        title: title.trim(),
        description: description.trim(),
        images: uploadedUrls,
        location: { city: city.trim(), lat: 52.3, lng: 5.1, country: 'NL' },
        price: price ? parseFloat(price) : undefined,
        priceUnit: showPrice ? ({ trip: 'p.p.', lesson: 'p.p.', rental: 'p. dag', sharing: 'p. jaar' }[selectedType]) : undefined,
        tags: [],
        date: showDate && date ? date : undefined,
      })
      setDone(true)
      setTimeout(() => navigate(`/listing/${listing.id}`), 1500)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Er ging iets mis')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
        <CheckCircle size={52} className="text-emerald-500" />
        <p className="text-xl font-bold text-gray-900">Advertentie gepubliceerd!</p>
        <p className="text-sm text-gray-500">Je wordt doorgestuurd...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-10 pb-24">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Iets aanbieden</h2>
      <p className="text-gray-500 mb-8">Vertel de community wat je te bieden hebt.</p>

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

        {/* ── Photo upload ────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Foto&apos;s <span className="text-gray-400 font-normal">(max. 10)</span>
          </label>

          {/* Dropzone */}
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
              <p className="text-sm font-medium text-gray-600">Sleep foto&apos;s hierheen</p>
              <p className="text-xs text-gray-400">of klik om te bladeren · JPG, PNG, WEBP · max. 8 MB</p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => e.target.files && addFiles(e.target.files)} />
            </div>
          )}

          {/* Preview grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
              {photos.map((photo, idx) => (
                <div key={photo.id} className="relative aspect-square group">
                  <img src={photo.preview} alt="" className="w-full h-full object-cover rounded-xl" />

                  {/* Uploading overlay */}
                  {photo.uploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                      <Loader2 size={20} className="text-white animate-spin" />
                    </div>
                  )}

                  {/* Error overlay */}
                  {photo.error && (
                    <div className="absolute inset-0 bg-red-900/60 rounded-xl flex items-center justify-center p-1">
                      <p className="text-white text-xs text-center leading-tight">{photo.error}</p>
                    </div>
                  )}

                  {/* Cover badge */}
                  {idx === 0 && !photo.uploading && !photo.error && (
                    <span className="absolute top-1.5 left-1.5 bg-ocean-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <Star size={9} className="fill-white" /> Omslag
                    </span>
                  )}

                  {/* Actions (visible on hover) */}
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

              {/* Add more button */}
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

        {/* ── Text fields ──────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Titel</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={placeholders[selectedType]} required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Beschrijving</label>
          <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Vertel meer over wat je aanbiedt..." required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400 resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className={showPrice ? '' : 'col-span-2'}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Locatie / haven</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
              placeholder="bijv. Amsterdam, Enkhuizen" required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400" />
          </div>
          {showPrice && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Prijs {{ trip: '(p.p.)', lesson: '(p.p.)', rental: '(per dag)', sharing: '(per jaar)' }[selectedType] ?? ''}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0"
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400" />
              </div>
            </div>
          )}
        </div>

        {showDate && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Datum</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400" />
          </div>
        )}

        {!user && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
            Je plaatst als gast. <a href="/login" className="underline font-medium">Log in</a> om advertenties te beheren en berichten te ontvangen.
          </p>
        )}

        {submitError && (
          <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{submitError}</p>
        )}

        <button type="submit" disabled={submitting || photos.some((p) => p.uploading)}
          className="w-full flex items-center justify-center gap-2 bg-ocean-600 hover:bg-ocean-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors">
          {submitting
            ? <><Loader2 size={15} className="animate-spin" />Publiceren...</>
            : 'Publiceren'}
        </button>
      </form>
    </div>
  )
}

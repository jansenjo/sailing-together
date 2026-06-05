import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchListings } from '../api'
import type { Listing, ListingType } from '../types'

// Fix default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const typeColor: Record<ListingType, string> = {
  trip:        '#0e8de7',
  passenger:   '#8b5cf6',
  crew_wanted: '#f59e0b',
  crew_offer:  '#f97316',
  lesson:      '#ec4899',
  rental:      '#10b981',
  sharing:     '#14b8a6',
}

const typeMapLabel: Record<ListingType, string> = {
  trip:        'Dagje uit',
  passenger:   'Opstapper',
  crew_wanted: 'Crew gezocht',
  crew_offer:  'Crew aangeboden',
  lesson:      'Zeilles',
  rental:      'Verhuur',
  sharing:     'Sharing',
}

const legendTypes: ListingType[] = ['trip', 'passenger', 'crew_wanted', 'crew_offer', 'lesson', 'rental', 'sharing']

// Netherlands bounding box
const NL_BOUNDS = L.latLngBounds([[50.5, 3.2], [53.7, 7.3]])

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [listings, setListings] = useState<Listing[]>([])

  useEffect(() => {
    fetchListings().then(setListings)
  }, [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current || listings.length === 0) return

    const map = L.map(containerRef.current, {
      center: [52.3, 5.3],
      zoom: 7,
      minZoom: 6,
      maxZoom: 14,
      maxBounds: NL_BOUNDS,
      maxBoundsViscosity: 0.9,
    })

    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    listings.forEach((listing) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${typeColor[listing.type]};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      })

      const popup = `
        <div style="min-width:180px">
          <img src="${listing.image}" alt="${listing.title}" style="width:100%;height:96px;object-fit:cover;border-radius:6px;margin-bottom:8px" />
          <p style="font-weight:600;font-size:13px;line-height:1.3;margin:0 0 2px">${listing.title}</p>
          <p style="font-size:12px;color:#6b7280;margin:0">${listing.location.city}</p>
          ${listing.price ? `<p style="font-size:12px;font-weight:600;color:#026fc5;margin:4px 0 0">€${listing.price.toLocaleString('nl-NL')} ${listing.priceUnit ?? ''}</p>` : ''}
        </div>
      `

      L.marker([listing.location.lat, listing.location.lng], { icon })
        .bindPopup(popup)
        .addTo(map)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [listings])

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="px-4 pt-6 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Kaartoverzicht</h2>
        <p className="text-sm text-gray-500 mt-1">Alle aanbiedingen in één overzicht</p>

        <div className="flex flex-wrap gap-3 mt-3">
          {legendTypes.map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded-full border-2 border-white shadow-sm inline-block" style={{ background: typeColor[t] }} />
              {typeMapLabel[t]}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 pb-6">
        <div
          ref={containerRef}
          className="rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          style={{ height: '100%' }}
        />
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import FilterBar, { type Filter } from '../components/FilterBar'
import ListingCard from '../components/ListingCard'
import { fetchListings } from '../api'
import type { Listing, ListingType } from '../types'

export default function Home() {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchListings(filter === 'all' ? undefined : filter as ListingType)
      .then(setListings)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [filter])

  const visible = listings.filter((l) =>
    query === '' ||
    l.title.toLowerCase().includes(query.toLowerCase()) ||
    l.location.city.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto px-4 pt-8 pb-24">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Vind je volgende avontuur op het water
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Zeiltochten, crew, zeilles, bootverhuur en meer — alles op één plek.
        </p>
      </div>

      <div className="relative mb-6 max-w-xl mx-auto">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Zoek op stad of type tocht..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400 focus:border-transparent"
        />
      </div>

      <div className="mb-8">
        <FilterBar active={filter} onChange={setFilter} />
      </div>

      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="font-medium text-gray-700">{error}</p>
          <p className="text-sm text-gray-400 mt-1">Is de server gestart? <code className="bg-gray-100 px-1 rounded">npm run dev:all</code></p>
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">⚓</p>
          <p className="font-medium">Geen resultaten gevonden</p>
          <p className="text-sm mt-1">Probeer een andere filter of zoekterm</p>
        </div>
      )}

      {!loading && !error && visible.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  )
}

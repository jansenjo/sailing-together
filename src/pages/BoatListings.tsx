import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import ListingCard from '../components/ListingCard'
import { fetchListings } from '../api'
import type { Listing } from '../types'

type Tab = 'rental' | 'sharing'

const tabs: { value: Tab; label: string }[] = [
  { value: 'rental',  label: 'Boot verhuur' },
  { value: 'sharing', label: 'Boot sharing' },
]

export default function BoatListings() {
  const [tab, setTab] = useState<Tab>('rental')
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchListings(tab).then(setListings).finally(() => setLoading(false))
  }, [tab])

  return (
    <div className="max-w-6xl mx-auto px-4 pt-8 pb-24">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Boten</h2>
        <p className="text-gray-500 mt-2">Huur een boot voor een dag, of deel eigenaarschap.</p>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
        {tabs.map(({ value, label }) => (
          <button key={value} onClick={() => setTab(value)}
            className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">⛵</p>
          <p className="font-medium">Nog geen boten in deze categorie</p>
        </div>
      )}
    </div>
  )
}

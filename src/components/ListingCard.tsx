import { Link } from 'react-router-dom'
import { MapPin, Star, CalendarDays, Users } from 'lucide-react'
import { clsx } from 'clsx'
import type { Listing, ListingType } from '../types'

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

interface Props {
  listing: Listing
}

export default function ListingCard({ listing }: Props) {
  return (
    <Link to={`/listing/${listing.id}`} className="block">
    <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={listing.image}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span className={clsx('absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full', typePill[listing.type])}>
          {typeLabel[listing.type]}
        </span>
        {listing.price && (
          <span className="absolute bottom-3 right-3 bg-white/95 text-gray-900 text-sm font-semibold px-2.5 py-1 rounded-full shadow-sm">
            €{listing.price.toLocaleString('nl-NL')} <span className="font-normal text-gray-500">{listing.priceUnit}</span>
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2 mb-1">{listing.title}</h3>

        <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
          <MapPin size={12} className="shrink-0" />
          <span>{listing.location.city}</span>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{listing.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={listing.author.avatar} alt={listing.author.name} className="w-7 h-7 rounded-full" />
            <div>
              <p className="text-xs font-medium text-gray-800 leading-none">{listing.author.name}</p>
              <div className="flex items-center gap-0.5 mt-0.5">
                <Star size={10} className="text-amber-400 fill-amber-400" />
                <span className="text-xs text-gray-500">{listing.author.rating} ({listing.author.reviews})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            {listing.date && (
              <span className="flex items-center gap-1">
                <CalendarDays size={11} />
                {new Date(listing.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
              </span>
            )}
            {listing.spotsAvailable !== undefined && (
              <span className="flex items-center gap-1">
                <Users size={11} />
                {listing.spotsAvailable} plek{listing.spotsAvailable !== 1 ? 'ken' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
    </Link>
  )
}

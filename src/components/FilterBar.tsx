import { clsx } from 'clsx'
import type { ListingType } from '../types'

export type Filter = ListingType | 'all'

interface Props {
  active: Filter
  onChange: (f: Filter) => void
}

const filters: { value: Filter; label: string; emoji: string }[] = [
  { value: 'all',        label: 'Alles',           emoji: '⚓' },
  { value: 'trip',       label: 'Dagje uit',        emoji: '🌊' },
  { value: 'passenger',  label: 'Opstapper',        emoji: '🙋' },
  { value: 'crew_wanted',label: 'Crew gezocht',     emoji: '👥' },
  { value: 'crew_offer', label: 'Crew aangeboden',  emoji: '🧑‍✈️' },
  { value: 'lesson',     label: 'Zeilles',          emoji: '🎓' },
  { value: 'rental',     label: 'Boot verhuur',     emoji: '⛵' },
  { value: 'sharing',    label: 'Boot sharing',     emoji: '🤝' },
]

export default function FilterBar({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {filters.map(({ value, label, emoji }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={clsx(
            'shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors',
            active === value
              ? 'bg-ocean-600 text-white border-ocean-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
          )}
        >
          <span>{emoji}</span>
          {label}
        </button>
      ))}
    </div>
  )
}

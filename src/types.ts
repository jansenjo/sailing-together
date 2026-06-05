export type ListingType =
  | 'trip'        // Dagje uit / Zeiltocht — skipper biedt plekken aan
  | 'passenger'   // Opstapper / Meevaren — iemand zoekt een plek aan boord
  | 'crew_wanted' // Crew gezocht — skipper zoekt bemanning
  | 'crew_offer'  // Crew aangeboden — iemand biedt zich aan als bemanning
  | 'lesson'      // Zeilles
  | 'rental'      // Boot verhuur
  | 'sharing'     // Boot sharing

export interface Location {
  lat: number
  lng: number
  city: string
  country: string
}

export interface Listing {
  id: string
  type: ListingType
  title: string
  description: string
  image: string
  images?: string[]   // all uploaded photos; first = cover
  location: Location
  author: {
    name: string
    avatar: string
    rating: number
    reviews: number
  }
  price?: number
  priceUnit?: string
  tags: string[]
  date?: string
  spotsAvailable?: number
  ownerId?: string
}

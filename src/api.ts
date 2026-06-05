import type { Listing, ListingType } from './types'

const BASE = '/api'

function authHeader(): HeadersInit {
  const token = localStorage.getItem('st_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeader() })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? `Fout ${res.status}`)
  }
  return res.json()
}

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Fout ${res.status}`)
  return data
}

async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE', headers: authHeader() })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? `Fout ${res.status}`)
  }
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Fout ${res.status}`)
  return data
}

// Listings
export const fetchListings = (type?: ListingType) =>
  apiGet<Listing[]>(type ? `/listings?type=${type}` : '/listings')

export const fetchListing  = (id: string) => apiGet<Listing>(`/listings/${id}`)

export const updateListing = (id: string, data: unknown) => apiPatch<Listing>(`/listings/${id}`, data)
export const deleteListing = (id: string) => apiDelete(`/listings/${id}`)

export const fetchMyListings = () =>
  apiGet<(Listing & { messageCount: number; unreadCount: number })[]>('/listings/mine')

export const createListing = (data: unknown) => apiPost<Listing>('/listings', data)

// Messages
export const sendMessage = (data: {
  listing_id: string; sender_name: string; sender_email: string; body: string
}) => apiPost<void>('/messages', data)

export async function updateProfile(data: { name?: string; email?: string; phone?: string; location?: string }) {
  const res = await fetch('/api/auth/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data),
  })
  const d = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((d as { error?: string }).error ?? `Fout ${res.status}`)
  return d as { id: string; name: string; email: string; avatar: string; phone?: string; location?: string }
}

export async function uploadAvatar(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('avatar', file)
  const res = await fetch('/api/auth/avatar', {
    method: 'POST',
    headers: authHeader(),
    body: fd,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Upload mislukt')
  return (data as { avatar: string }).avatar
}

export async function uploadPhotos(files: File[]): Promise<string[]> {
  const fd = new FormData()
  files.forEach((f) => fd.append('photos', f))
  const res = await fetch('/api/uploads', {
    method: 'POST',
    headers: authHeader(),
    body: fd,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Upload mislukt')
  return (data as { urls: string[] }).urls
}

export const fetchMessages = (listingId: string) =>
  apiGet<{ id: number; sender_name: string; sender_email: string; body: string; created_at: string }[]>(
    `/messages/listing/${listingId}`
  )

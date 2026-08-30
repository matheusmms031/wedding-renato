import { apiFetch } from './client.js'

export const getSummary = (options) => apiFetch('/admin/summary', options)
export const listRsvps = (options) => apiFetch('/admin/rsvps', options)
export const listGuests = (options) => apiFetch('/admin/guests', options)
export const listGifts = (options) => apiFetch('/admin/gifts', options)

export const createGuest = (body) => apiFetch('/admin/guests', { method: 'POST', body })
export const updateGuest = (id, body) => apiFetch(`/admin/guests/${id}`, { method: 'PATCH', body })
export const deleteGuest = (id) => apiFetch(`/admin/guests/${id}`, { method: 'DELETE' })
export const resetGuestPassword = (id, password) =>
  apiFetch(`/admin/guests/${id}/password`, { method: 'POST', body: { password } })

export const createGift = (body) => apiFetch('/admin/gifts', { method: 'POST', body })
export const updateGift = (id, body) => apiFetch(`/admin/gifts/${id}`, { method: 'PATCH', body })
export const deleteGift = (id) => apiFetch(`/admin/gifts/${id}`, { method: 'DELETE' })

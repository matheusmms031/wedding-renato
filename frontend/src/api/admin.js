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

export const getSettings = (options) => apiFetch('/admin/settings', options)
export const updateSettings = (body) => apiFetch('/admin/settings', { method: 'PUT', body })

/**
 * Upload não passa pelo apiFetch: ele fixa Content-Type: application/json, e
 * num multipart quem precisa definir o cabeçalho (com o boundary) é o browser.
 */
export async function uploadGiftImage(giftId, file) {
  const form = new FormData()
  form.append('file', file)

  const response = await fetch(`/api/admin/gifts/${giftId}/image`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'Não foi possível enviar a imagem.')
  }
  return payload
}

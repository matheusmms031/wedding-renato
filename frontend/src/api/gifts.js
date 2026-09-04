import { apiFetch } from './client.js'

export function listGifts({ signal } = {}) {
  return apiFetch('/gifts', { signal })
}

export function claimGift(giftId) {
  return apiFetch(`/gifts/${giftId}/claim`, { method: 'POST', body: {} })
}

export function unclaimGift(giftId) {
  return apiFetch(`/gifts/${giftId}/claim`, { method: 'DELETE' })
}

export const getGiftPix = (giftId, options) => apiFetch(`/gifts/${giftId}/pix`, options)

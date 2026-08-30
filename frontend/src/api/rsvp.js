import { apiFetch } from './client.js'

export function getRsvp({ signal } = {}) {
  return apiFetch('/rsvp', { signal })
}

export function saveRsvp(payload) {
  return apiFetch('/rsvp', { method: 'PUT', body: payload })
}

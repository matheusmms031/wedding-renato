import { apiFetch } from './client.js'

export function login(username, password) {
  return apiFetch('/auth/login', { method: 'POST', body: { username, password } })
}

export function getSession({ signal } = {}) {
  return apiFetch('/auth/session', { signal })
}

export function logout() {
  return apiFetch('/auth/logout', { method: 'POST' })
}

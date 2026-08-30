const BASE = '/api'

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN', details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export async function apiFetch(path, { method = 'GET', body, signal } = {}) {
  const hasBody = body !== undefined
  const headers = {}

  // Só declara JSON quando há corpo: o Fastify recusa com 400
  // FST_ERR_CTP_EMPTY_JSON_BODY uma requisição que diz ser JSON e vem vazia —
  // é o caso de POST /auth/logout e DELETE /gifts/:id/claim.
  if (hasBody) headers['Content-Type'] = 'application/json'

  let response
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      // Redundante em same-origin, mas mantém o acesso direto à API funcionando.
      credentials: 'include',
      headers,
      body: hasBody ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (cause) {
    if (cause.name === 'AbortError') throw cause
    throw new ApiError('Não foi possível conectar ao servidor.', { code: 'NETWORK' })
  }

  if (response.status === 204) return null

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const error = payload?.error ?? {}
    throw new ApiError(error.message ?? 'Algo deu errado. Tente novamente.', {
      status: response.status,
      code: error.code ?? 'UNKNOWN',
      details: error.details,
    })
  }

  return payload
}

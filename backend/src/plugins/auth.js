import fp from 'fastify-plugin'
import { env } from '../config/env.js'
import { forbidden, unauthorized } from '../lib/errors.js'
import { resolve } from '../services/session.service.js'

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function sessionCookieOptions(maxAgeSeconds) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    path: '/',
    maxAge: maxAgeSeconds,
    // Sem `domain` de propósito: cookie host-only é o que faz a estratégia
    // same-origin funcionar igual em localhost, no IP da LAN e em produção.
  }
}

async function authPlugin(fastify) {
  fastify.decorate('authenticate', async function authenticate(request, reply) {
    // SameSite=lax já barra o CSRF clássico; esta checagem fecha a folga
    // residual em métodos não-seguros sem precisar de token de CSRF.
    if (UNSAFE_METHODS.has(request.method)) {
      const origin = request.headers.origin
      if (origin && !env.CORS_ORIGIN.includes(origin)) {
        const host = request.headers.host
        if (!host || new URL(origin).host !== host) {
          throw forbidden('Origem não autorizada.')
        }
      }
    }

    const token = request.cookies[env.SESSION_COOKIE_NAME]
    const resolved = await resolve(fastify.models, token)
    if (!resolved) throw unauthorized()

    request.user = resolved.user

    // Sessão deslizante: o cookie é reemitido quando a validade foi estendida.
    if (resolved.renewed) {
      reply.setCookie(
        env.SESSION_COOKIE_NAME,
        token,
        sessionCookieOptions(resolved.maxAgeSeconds),
      )
    }
  })

  fastify.decorate('requireAdmin', async function requireAdmin(request) {
    if (request.user?.role !== 'admin') {
      throw forbidden('Esta área é restrita aos noivos.')
    }
  })
}

export default fp(authPlugin, { name: 'auth', dependencies: ['db', 'security'] })

import { env } from '../config/env.js'
import { toPublicUser } from '../lib/serializers.js'
import { sessionCookieOptions } from '../plugins/auth.js'
import * as authService from '../services/auth.service.js'
import * as sessionService from '../services/session.service.js'

export async function login(request, reply) {
  const { models } = request.server
  const user = await authService.authenticate(models, request.body)

  // Faxina barata e oportunista: a cada login bem-sucedido some com o lixo.
  await sessionService.purgeExpired(models)

  const { token, maxAgeSeconds } = await sessionService.create(models, user.id, {
    userAgent: request.headers['user-agent'],
    ip: request.ip,
  })

  reply.setCookie(env.SESSION_COOKIE_NAME, token, sessionCookieOptions(maxAgeSeconds))
  return { user: toPublicUser(user) }
}

export async function session(request) {
  return { user: toPublicUser(request.user) }
}

export async function logout(request, reply) {
  // Idempotente de propósito: sair duas vezes não é erro.
  await sessionService.destroy(request.server.models, request.cookies[env.SESSION_COOKIE_NAME])
  reply.clearCookie(env.SESSION_COOKIE_NAME, { path: '/' })
  return reply.code(204).send()
}

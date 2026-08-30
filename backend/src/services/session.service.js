import { Op } from 'sequelize'
import { env } from '../config/env.js'
import { createToken, hashToken } from '../lib/tokens.js'

const DAY_MS = 24 * 60 * 60 * 1000

function expiryFromNow() {
  return new Date(Date.now() + env.SESSION_TTL_DAYS * DAY_MS)
}

/** Cria a sessão e devolve o token cru — é a única vez que ele existe fora do navegador. */
export async function create(models, userId, { userAgent, ip } = {}) {
  const token = createToken()

  await models.Session.create({
    userId,
    tokenHash: hashToken(token),
    expiresAt: expiryFromNow(),
    lastSeenAt: new Date(),
    userAgent: userAgent ? userAgent.slice(0, 255) : null,
    ip: ip ? ip.slice(0, 45) : null,
  })

  return { token, maxAgeSeconds: env.SESSION_TTL_DAYS * 24 * 60 * 60 }
}

/**
 * Resolve o token em { user, renewed }. Sessão vencida é apagada na hora e
 * tratada como ausente. Sessão deslizante: quando resta menos de metade do TTL,
 * estende a validade e sinaliza para o controller reemitir o cookie.
 */
export async function resolve(models, token) {
  if (!token) return null

  const session = await models.Session.findOne({ where: { tokenHash: hashToken(token) } })
  if (!session) return null

  if (session.expiresAt.getTime() <= Date.now()) {
    await session.destroy()
    return null
  }

  const user = await models.User.findByPk(session.userId)
  if (!user) {
    await session.destroy()
    return null
  }

  const halfLife = (env.SESSION_TTL_DAYS * DAY_MS) / 2
  const remaining = session.expiresAt.getTime() - Date.now()
  const renewed = remaining < halfLife

  session.lastSeenAt = new Date()
  if (renewed) session.expiresAt = expiryFromNow()
  await session.save()

  return { user, session, renewed, maxAgeSeconds: env.SESSION_TTL_DAYS * 24 * 60 * 60 }
}

export async function destroy(models, token) {
  if (!token) return
  await models.Session.destroy({ where: { tokenHash: hashToken(token) } })
}

/** Usado ao redefinir senha: derruba todas as sessões daquele convidado. */
export async function destroyAllForUser(models, userId) {
  await models.Session.destroy({ where: { userId } })
}

export async function purgeExpired(models) {
  return models.Session.destroy({ where: { expiresAt: { [Op.lt]: new Date() } } })
}

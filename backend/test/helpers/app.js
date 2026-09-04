import { buildApp } from '../../src/app.js'
import { hashPassword } from '../../src/lib/password.js'

export async function buildTestApp(options = {}) {
  // Limite alto por padrão: só o teste do rate limit sobe uma app com o valor real.
  const app = await buildApp({ logger: false, loginRateLimitMax: 1000, ...options })
  await app.ready()
  return app
}

/** Zera tudo. O CASCADE leva sessões, RSVPs e escolhas junto. */
export async function truncateAll(app) {
  await app.db.query('TRUNCATE users, gifts, settings RESTART IDENTITY CASCADE')
}

export async function createUser(app, overrides = {}) {
  return app.models.User.create({
    username: overrides.username ?? 'convidado-teste',
    displayName: overrides.displayName ?? 'Convidado Teste',
    passwordHash: await hashPassword(overrides.password ?? 'senha123'),
    role: overrides.role ?? 'guest',
  })
}

export async function createGift(app, overrides = {}) {
  return app.models.Gift.create({
    slug: overrides.slug ?? 'presente-teste',
    name: overrides.name ?? 'Presente Teste',
    description: overrides.description ?? '',
    priceCents: overrides.priceCents ?? 10000,
    quantity: overrides.quantity ?? 1,
    active: overrides.active ?? true,
    sortOrder: overrides.sortOrder ?? 0,
  })
}

/** Faz login e devolve o header Cookie pronto para as chamadas autenticadas. */
export async function loginAs(app, username, password = 'senha123') {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { username, password },
  })

  const cookie = response.cookies.find((c) => c.name === 'rm_session')
  if (!cookie) throw new Error(`login falhou para ${username}: ${response.statusCode} ${response.body}`)

  return { response, cookie: `rm_session=${cookie.value}`, raw: cookie }
}

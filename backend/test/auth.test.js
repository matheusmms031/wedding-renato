import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, it } from 'node:test'
import { buildTestApp, createUser, loginAs, truncateAll } from './helpers/app.js'

let app

before(async () => {
  app = await buildTestApp()
})

after(async () => {
  await app.close()
})

beforeEach(async () => {
  await truncateAll(app)
  await createUser(app, { username: 'ana.silva', displayName: 'Ana Silva' })
})

describe('POST /api/auth/login', () => {
  it('recusa senha errada sem emitir cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'ana.silva', password: 'errada' },
    })

    assert.equal(res.statusCode, 401)
    assert.equal(JSON.parse(res.body).error.code, 'INVALID_CREDENTIALS')
    assert.equal(res.cookies.length, 0, 'não pode devolver Set-Cookie')
  })

  it('recusa usuário inexistente com o mesmo erro', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'nao-existe', password: 'senha123' },
    })

    assert.equal(res.statusCode, 401)
    assert.equal(JSON.parse(res.body).error.code, 'INVALID_CREDENTIALS')
  })

  it('emite cookie HttpOnly, Path=/ e SameSite=Lax', async () => {
    const { response, raw } = await loginAs(app, 'ana.silva')

    assert.equal(response.statusCode, 200)
    assert.equal(raw.httpOnly, true)
    assert.equal(raw.path, '/')
    assert.equal(raw.sameSite.toLowerCase(), 'lax')
  })

  it('grava o hash do token, nunca o token cru', async () => {
    const { raw } = await loginAs(app, 'ana.silva')

    const session = await app.models.Session.findOne()
    assert.ok(session)
    assert.notEqual(session.tokenHash, raw.value, 'o token cru não pode estar no banco')
    assert.equal(session.tokenHash.length, 64, 'sha256 em hex tem 64 caracteres')
  })
})

describe('GET /api/auth/session', () => {
  it('devolve o convidado com cookie válido', async () => {
    const { cookie } = await loginAs(app, 'ana.silva')

    const res = await app.inject({ url: '/api/auth/session', headers: { cookie } })

    assert.equal(res.statusCode, 200)
    assert.equal(JSON.parse(res.body).user.username, 'ana.silva')
  })

  it('responde 401 sem cookie', async () => {
    const res = await app.inject({ url: '/api/auth/session' })
    assert.equal(res.statusCode, 401)
  })

  it('responde 401 para sessão vencida e apaga a linha', async () => {
    const { cookie } = await loginAs(app, 'ana.silva')

    const session = await app.models.Session.findOne()
    session.expiresAt = new Date(Date.now() - 1000)
    await session.save()

    const res = await app.inject({ url: '/api/auth/session', headers: { cookie } })

    assert.equal(res.statusCode, 401)
    assert.equal(await app.models.Session.count(), 0, 'a sessão vencida deve ser removida')
  })
})

describe('POST /api/auth/logout', () => {
  it('apaga a sessão do banco e invalida o cookie', async () => {
    const { cookie } = await loginAs(app, 'ana.silva')
    assert.equal(await app.models.Session.count(), 1)

    const res = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { cookie } })

    assert.equal(res.statusCode, 204)
    assert.equal(await app.models.Session.count(), 0)

    const after = await app.inject({ url: '/api/auth/session', headers: { cookie } })
    assert.equal(after.statusCode, 401)
  })

  it('é idempotente sem sessão', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/logout' })
    assert.equal(res.statusCode, 204)
  })
})

describe('serialização', () => {
  it('nenhuma resposta expõe hash de senha ou de token', async () => {
    const { cookie, response } = await loginAs(app, 'ana.silva')
    const session = await app.inject({ url: '/api/auth/session', headers: { cookie } })

    for (const body of [response.body, session.body]) {
      for (const leak of ['password_hash', 'passwordHash', 'token_hash', 'tokenHash']) {
        assert.ok(!body.includes(leak), `resposta vazou ${leak}`)
      }
    }
  })
})

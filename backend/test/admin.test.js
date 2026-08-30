import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, it } from 'node:test'
import { buildTestApp, createGift, createUser, loginAs, truncateAll } from './helpers/app.js'

let app
let adminCookie
let guestCookie
let guest

before(async () => {
  app = await buildTestApp()
})

after(async () => {
  await app.close()
})

beforeEach(async () => {
  await truncateAll(app)
  await createUser(app, { username: 'noivos', displayName: 'Renato & Marília', role: 'admin' })
  guest = await createUser(app, { username: 'ana.silva', displayName: 'Ana Silva' })
  ;({ cookie: adminCookie } = await loginAs(app, 'noivos'))
  ;({ cookie: guestCookie } = await loginAs(app, 'ana.silva'))
})

const asAdmin = (options) => app.inject({ ...options, headers: { cookie: adminCookie } })

describe('autorização', () => {
  it('bloqueia convidado comum em toda a área de admin', async () => {
    for (const url of ['/api/admin/summary', '/api/admin/rsvps', '/api/admin/guests', '/api/admin/gifts']) {
      const res = await app.inject({ url, headers: { cookie: guestCookie } })
      assert.equal(res.statusCode, 403, `${url} deveria dar 403`)
    }
  })

  it('responde 401 para anônimo, não 403', async () => {
    const res = await app.inject({ url: '/api/admin/summary' })
    assert.equal(res.statusCode, 401)
  })
})

describe('GET /api/admin/summary', () => {
  it('conta convites, respostas e recusas', async () => {
    await app.inject({
      method: 'PUT',
      url: '/api/rsvp',
      payload: { attending: true, fullName: 'Ana Silva' },
      headers: { cookie: guestCookie },
    })

    const res = await asAdmin({ url: '/api/admin/summary' })
    const body = JSON.parse(res.body)

    assert.equal(body.totalUsers, 2)
    assert.equal(body.responded, 1)
    assert.equal(body.pending, 1)
    assert.equal(body.attending, 1)
    assert.equal(body.declined, 0)
  })
})

describe('convidados', () => {
  it('cria um convidado que consegue entrar', async () => {
    const res = await asAdmin({
      method: 'POST',
      url: '/api/admin/guests',
      payload: {
        username: 'carla.dias',
        displayName: 'Carla Dias',
        password: 'senha123',
      },
    })

    assert.equal(res.statusCode, 201)
    const { cookie } = await loginAs(app, 'carla.dias')
    assert.ok(cookie)
  })

  it('recusa nome de usuário repetido', async () => {
    const res = await asAdmin({
      method: 'POST',
      url: '/api/admin/guests',
      payload: { username: 'ana.silva', displayName: 'Outra Pessoa', password: 'senha123' },
    })

    assert.equal(res.statusCode, 409)
    assert.equal(JSON.parse(res.body).error.code, 'USERNAME_TAKEN')
  })

  it('não permite contrabandear role pelo corpo em campos não declarados', async () => {
    // removeAdditional: 'all' descarta o que não está no schema.
    const res = await asAdmin({
      method: 'POST',
      url: '/api/admin/guests',
      payload: {
        username: 'espertinho',
        displayName: 'Espertinho',
        password: 'senha123',
        passwordHash: 'injetado',
        isAdmin: true,
      },
    })

    assert.equal(res.statusCode, 201)
    const created = await app.models.User.findOne({ where: { username: 'espertinho' } })
    assert.equal(created.role, 'guest')
  })

  it('edita o nome exibido', async () => {
    const res = await asAdmin({
      method: 'PATCH',
      url: `/api/admin/guests/${guest.id}`,
      payload: { displayName: 'Ana Maria Silva' },
    })

    assert.equal(res.statusCode, 200)
    assert.equal(JSON.parse(res.body).guest.displayName, 'Ana Maria Silva')
  })

  it('exclui um convidado levando junto sessão e RSVP', async () => {
    await app.inject({
      method: 'PUT',
      url: '/api/rsvp',
      payload: { attending: true, fullName: 'Ana Silva' },
      headers: { cookie: guestCookie },
    })

    const res = await asAdmin({ method: 'DELETE', url: `/api/admin/guests/${guest.id}` })

    assert.equal(res.statusCode, 204)
    assert.equal(await app.models.Rsvp.count(), 0, 'FK em cascata leva o RSVP')
    assert.equal(await app.models.Session.count({ where: { userId: guest.id } }), 0)
  })

  it('impede o admin de excluir a própria conta', async () => {
    const me = await app.models.User.findOne({ where: { username: 'noivos' } })

    const res = await asAdmin({ method: 'DELETE', url: `/api/admin/guests/${me.id}` })

    assert.equal(res.statusCode, 409)
    assert.equal(JSON.parse(res.body).error.code, 'LAST_ADMIN')
  })

  it('impede rebaixar o último admin', async () => {
    const me = await app.models.User.findOne({ where: { username: 'noivos' } })

    const res = await asAdmin({
      method: 'PATCH',
      url: `/api/admin/guests/${me.id}`,
      payload: { role: 'guest' },
    })

    assert.equal(res.statusCode, 409)
  })

  it('redefinir a senha derruba as sessões abertas do convidado', async () => {
    const before = await app.inject({ url: '/api/auth/session', headers: { cookie: guestCookie } })
    assert.equal(before.statusCode, 200)

    const res = await asAdmin({
      method: 'POST',
      url: `/api/admin/guests/${guest.id}/password`,
      payload: { password: 'nova-senha' },
    })
    assert.equal(res.statusCode, 204)

    const after = await app.inject({ url: '/api/auth/session', headers: { cookie: guestCookie } })
    assert.equal(after.statusCode, 401, 'a sessão antiga tem de morrer')

    const { cookie } = await loginAs(app, 'ana.silva', 'nova-senha')
    assert.ok(cookie)
  })
})

describe('presentes', () => {
  it('cria, edita e exclui um presente sem escolhas', async () => {
    const created = await asAdmin({
      method: 'POST',
      url: '/api/admin/gifts',
      payload: { slug: 'jogo-de-panelas', name: 'Jogo de Panelas', priceCents: 45000 },
    })
    assert.equal(created.statusCode, 201)
    const { id } = JSON.parse(created.body).gift

    const updated = await asAdmin({
      method: 'PATCH',
      url: `/api/admin/gifts/${id}`,
      payload: { priceCents: 39900 },
    })
    assert.equal(JSON.parse(updated.body).gift.priceCents, 39900)

    const removed = await asAdmin({ method: 'DELETE', url: `/api/admin/gifts/${id}` })
    assert.equal(removed.statusCode, 204)
  })

  it('recusa excluir presente já escolhido', async () => {
    const gift = await createGift(app)
    await app.inject({
      method: 'POST',
      url: `/api/gifts/${gift.id}/claim`,
      payload: {},
      headers: { cookie: guestCookie },
    })

    const res = await asAdmin({ method: 'DELETE', url: `/api/admin/gifts/${gift.id}` })

    assert.equal(res.statusCode, 409)
    assert.equal(JSON.parse(res.body).error.code, 'GIFT_HAS_CLAIMS')
  })

  it('recusa reduzir a quantidade abaixo do que já foi escolhido', async () => {
    const gift = await createGift(app, { quantity: 5 })
    await createUser(app, { username: 'carla.dias' })
    const { cookie: other } = await loginAs(app, 'carla.dias')

    for (const cookie of [guestCookie, other]) {
      await app.inject({
        method: 'POST',
        url: `/api/gifts/${gift.id}/claim`,
        payload: {},
        headers: { cookie },
      })
    }

    const res = await asAdmin({
      method: 'PATCH',
      url: `/api/admin/gifts/${gift.id}`,
      payload: { quantity: 1 },
    })

    assert.equal(res.statusCode, 409)
    const { error } = JSON.parse(res.body)
    assert.equal(error.code, 'QUANTITY_BELOW_CLAIMS')
    assert.equal(error.details.claimed, 2)
  })

  it('mostra aos noivos quem escolheu cada presente', async () => {
    const gift = await createGift(app)
    await app.inject({
      method: 'POST',
      url: `/api/gifts/${gift.id}/claim`,
      payload: {},
      headers: { cookie: guestCookie },
    })

    const res = await asAdmin({ url: '/api/admin/gifts' })
    const [listed] = JSON.parse(res.body).gifts

    assert.equal(listed.claims.length, 1)
    assert.equal(listed.claims[0].displayName, 'Ana Silva')
  })
})

describe('serialização', () => {
  it('nenhuma resposta de admin expõe hash', async () => {
    for (const url of ['/api/admin/guests', '/api/admin/rsvps', '/api/admin/gifts']) {
      const res = await asAdmin({ url })
      for (const leak of ['password_hash', 'passwordHash', 'token_hash', 'tokenHash']) {
        assert.ok(!res.body.includes(leak), `${url} vazou ${leak}`)
      }
    }
  })
})

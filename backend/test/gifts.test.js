import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, it } from 'node:test'
import { buildTestApp, createGift, createUser, loginAs, truncateAll } from './helpers/app.js'

let app
let cookieA
let cookieB

before(async () => {
  app = await buildTestApp()
})

after(async () => {
  await app.close()
})

beforeEach(async () => {
  await truncateAll(app)
  await createUser(app, { username: 'ana.silva', displayName: 'Ana Silva' })
  await createUser(app, { username: 'joao.lima', displayName: 'João Lima' })
  ;({ cookie: cookieA } = await loginAs(app, 'ana.silva'))
  ;({ cookie: cookieB } = await loginAs(app, 'joao.lima'))
})

const claim = (giftId, cookie) =>
  app.inject({
    method: 'POST',
    url: `/api/gifts/${giftId}/claim`,
    payload: {},
    headers: { cookie },
  })

describe('GET /api/gifts', () => {
  it('exige sessão', async () => {
    const res = await app.inject({ url: '/api/gifts' })
    assert.equal(res.statusCode, 401)
  })

  it('não expõe quem escolheu, apenas o agregado', async () => {
    const gift = await createGift(app, { quantity: 2 })
    await claim(gift.id, cookieB)

    const res = await app.inject({ url: '/api/gifts', headers: { cookie: cookieA } })
    const [listed] = JSON.parse(res.body).gifts

    assert.equal(listed.claimedCount, 1)
    assert.equal(listed.claimedByMe, false)
    assert.equal(listed.available, true)
    assert.ok(!res.body.includes('João Lima'), 'não pode revelar quem escolheu')
  })

  it('esconde presentes inativos', async () => {
    await createGift(app, { slug: 'inativo', active: false })

    const res = await app.inject({ url: '/api/gifts', headers: { cookie: cookieA } })
    assert.equal(JSON.parse(res.body).gifts.length, 0)
  })
})

describe('POST /api/gifts/:id/claim', () => {
  it('reserva um presente disponível', async () => {
    const gift = await createGift(app)

    const res = await claim(gift.id, cookieA)

    assert.equal(res.statusCode, 201)
    assert.equal(JSON.parse(res.body).gift.claimedByMe, true)
    assert.equal(await app.models.GiftClaim.count(), 1)
  })

  it('recusa quando o presente exclusivo já foi levado', async () => {
    const gift = await createGift(app, { quantity: 1 })
    await claim(gift.id, cookieA)

    const res = await claim(gift.id, cookieB)

    assert.equal(res.statusCode, 409)
    assert.equal(JSON.parse(res.body).error.code, 'GIFT_UNAVAILABLE')
  })

  it('recusa o mesmo convidado escolhendo duas vezes uma cota', async () => {
    const gift = await createGift(app, { quantity: 10 })
    await claim(gift.id, cookieA)

    const res = await claim(gift.id, cookieA)

    assert.equal(res.statusCode, 409)
    assert.equal(JSON.parse(res.body).error.code, 'ALREADY_CLAIMED')
  })

  it('serializa reservas concorrentes: exatamente um 201 e um 409', async () => {
    // ESTE é o teste que exercita o lock FOR UPDATE em gift.service.js.
    // Se alguém trocar a transação por um count solto, ele quebra.
    const gift = await createGift(app, { quantity: 1 })

    const results = await Promise.all([claim(gift.id, cookieA), claim(gift.id, cookieB)])
    const codes = results.map((r) => r.statusCode).sort()

    assert.deepEqual(codes, [201, 409])
    assert.equal(await app.models.GiftClaim.count(), 1, 'não pode gravar duas reservas')
  })

  it('responde 404 para presente inexistente', async () => {
    const res = await claim('00000000-0000-4000-8000-000000000000', cookieA)
    assert.equal(res.statusCode, 404)
  })
})

describe('DELETE /api/gifts/:id/claim', () => {
  it('desfaz a própria escolha e libera o presente', async () => {
    const gift = await createGift(app, { quantity: 1 })
    await claim(gift.id, cookieA)

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/gifts/${gift.id}/claim`,
      headers: { cookie: cookieA },
    })

    assert.equal(res.statusCode, 204)
    assert.equal((await claim(gift.id, cookieB)).statusCode, 201)
  })

  it('não deixa desfazer a escolha de outro convidado', async () => {
    const gift = await createGift(app)
    await claim(gift.id, cookieA)

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/gifts/${gift.id}/claim`,
      headers: { cookie: cookieB },
    })

    assert.equal(res.statusCode, 404)
    assert.equal(await app.models.GiftClaim.count(), 1)
  })
})

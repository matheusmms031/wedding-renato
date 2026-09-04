import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, it } from 'node:test'
import { buildTestApp, createGift, createUser, loginAs, truncateAll } from './helpers/app.js'

let app
let cookie

before(async () => {
  app = await buildTestApp()
})

after(async () => {
  await app.close()
})

beforeEach(async () => {
  await truncateAll(app)
  await createUser(app, { username: 'ana.silva' })
  ;({ cookie } = await loginAs(app, 'ana.silva'))

  await app.models.Setting.bulkCreate([
    { key: 'pix_key', value: '123e4567-e89b-12d3-a456-426614174000' },
    { key: 'pix_receiver_name', value: 'Renato e Marilia' },
    { key: 'pix_receiver_city', value: 'Palmas' },
  ])
})

describe('GET /api/gifts/:giftId/pix', () => {
  it('exige sessão', async () => {
    const gift = await createGift(app)
    const res = await app.inject({ url: `/api/gifts/${gift.id}/pix` })
    assert.equal(res.statusCode, 401)
  })

  it('devolve payload e SVG para o valor do presente', async () => {
    const gift = await createGift(app, { priceCents: 20000 })

    const res = await app.inject({ url: `/api/gifts/${gift.id}/pix`, headers: { cookie } })
    assert.equal(res.statusCode, 200)

    const body = JSON.parse(res.body)
    assert.ok(body.payload.startsWith('000201'))
    assert.ok(body.payload.includes('5406200.00'), 'usa o preço do presente')
    assert.ok(body.qrcodeSvg.includes('<svg'))
  })

  it('404 para presente inexistente', async () => {
    const res = await app.inject({
      url: '/api/gifts/123e4567-e89b-12d3-a456-426614174000/pix',
      headers: { cookie },
    })
    assert.equal(res.statusCode, 404)
  })

  it('avisa quando o PIX ainda não foi configurado', async () => {
    await app.models.Setting.destroy({ where: {} })
    const gift = await createGift(app)

    const res = await app.inject({ url: `/api/gifts/${gift.id}/pix`, headers: { cookie } })
    assert.equal(res.statusCode, 409)
    assert.equal(JSON.parse(res.body).error.code, 'PIX_NAO_CONFIGURADO')
  })
})

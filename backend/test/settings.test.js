import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, it } from 'node:test'
import { buildTestApp, createUser, loginAs, truncateAll } from './helpers/app.js'

let app
let cookieAdmin
let cookieGuest

const CHAVE = '123e4567-e89b-12d3-a456-426614174000'

before(async () => {
  app = await buildTestApp()
})

after(async () => {
  await app.close()
})

beforeEach(async () => {
  await truncateAll(app)
  await createUser(app, { username: 'renato', role: 'admin' })
  await createUser(app, { username: 'ana.silva' })
  ;({ cookie: cookieAdmin } = await loginAs(app, 'renato'))
  ;({ cookie: cookieGuest } = await loginAs(app, 'ana.silva'))
})

const salvar = (payload, cookie) =>
  app.inject({ method: 'PUT', url: '/api/admin/settings', payload, headers: { cookie } })

describe('/api/admin/settings', () => {
  it('exige sessão', async () => {
    const res = await app.inject({ url: '/api/admin/settings' })
    assert.equal(res.statusCode, 401)
  })

  it('recusa convidado comum', async () => {
    const res = await app.inject({ url: '/api/admin/settings', headers: { cookie: cookieGuest } })
    assert.equal(res.statusCode, 403)
  })

  it('devolve campos vazios antes de configurar', async () => {
    const res = await app.inject({ url: '/api/admin/settings', headers: { cookie: cookieAdmin } })
    assert.equal(res.statusCode, 200)
    assert.deepEqual(JSON.parse(res.body).settings, {
      pixKey: '',
      pixReceiverName: '',
      pixReceiverCity: '',
    })
  })

  it('salva e relê', async () => {
    const res = await salvar(
      { pixKey: CHAVE, pixReceiverName: 'Renato e Marilia', pixReceiverCity: 'Palmas' },
      cookieAdmin,
    )
    assert.equal(res.statusCode, 200)

    const lido = await app.inject({ url: '/api/admin/settings', headers: { cookie: cookieAdmin } })
    assert.equal(JSON.parse(lido.body).settings.pixKey, CHAVE)
  })

  it('sobrescreve sem duplicar linha', async () => {
    await salvar({ pixKey: CHAVE, pixReceiverName: 'A', pixReceiverCity: 'B' }, cookieAdmin)
    await salvar({ pixKey: CHAVE, pixReceiverName: 'C', pixReceiverCity: 'D' }, cookieAdmin)

    const total = await app.models.Setting.count()
    assert.equal(total, 3)
  })

  it('recusa nome do recebedor acima de 25 caracteres', async () => {
    const res = await salvar(
      { pixKey: CHAVE, pixReceiverName: 'A'.repeat(26), pixReceiverCity: 'Palmas' },
      cookieAdmin,
    )
    assert.equal(res.statusCode, 400)
  })

  it('recusa cidade acima de 15 caracteres', async () => {
    const res = await salvar(
      { pixKey: CHAVE, pixReceiverName: 'Renato', pixReceiverCity: 'A'.repeat(16) },
      cookieAdmin,
    )
    assert.equal(res.statusCode, 400)
  })
})

import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, it } from 'node:test'
import { buildTestApp, createUser, loginAs, truncateAll } from './helpers/app.js'

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
  await createUser(app, { username: 'ana.silva', displayName: 'Ana Silva' })
  ;({ cookie } = await loginAs(app, 'ana.silva'))
})

const put = (payload, headers = { cookie }) =>
  app.inject({ method: 'PUT', url: '/api/rsvp', payload, headers })

describe('GET /api/rsvp', () => {
  it('exige sessão', async () => {
    const res = await app.inject({ url: '/api/rsvp' })
    assert.equal(res.statusCode, 401)
  })

  it('devolve null antes de responder', async () => {
    const res = await app.inject({ url: '/api/rsvp', headers: { cookie } })

    assert.equal(res.statusCode, 200)
    assert.deepEqual(JSON.parse(res.body), { rsvp: null })
  })
})

describe('PUT /api/rsvp', () => {
  it('responde 401 antes de 400 para anônimo com corpo inválido', async () => {
    // A validação do Fastify roda depois do onRequest: um anônimo não pode
    // receber pistas sobre o formato do corpo.
    const res = await put({ attending: true, fullName: 'X' }, {})
    assert.equal(res.statusCode, 401)
  })

  it('grava a confirmação', async () => {
    const res = await put({ attending: true, fullName: 'Ana Maria Silva' })

    assert.equal(res.statusCode, 200)
    const { rsvp } = JSON.parse(res.body)
    assert.equal(rsvp.attending, true)
    assert.equal(rsvp.fullName, 'Ana Maria Silva')
  })

  it('grava a recusa', async () => {
    const res = await put({ attending: false, fullName: 'Ana Silva' })

    assert.equal(res.statusCode, 200)
    assert.equal(JSON.parse(res.body).rsvp.attending, false)
  })

  it('atualiza a mesma linha quando chamado duas vezes', async () => {
    await put({ attending: true, fullName: 'Ana Silva' })
    const second = await put({ attending: false, fullName: 'Ana Silva' })

    assert.equal(second.statusCode, 200)
    assert.equal(await app.models.Rsvp.count(), 1, 'um RSVP por convite')
    assert.equal(JSON.parse(second.body).rsvp.attending, false)
  })

  it('guarda o recado e aceita omiti-lo', async () => {
    const withMessage = await put({
      attending: true,
      fullName: 'Ana Silva',
      message: 'Mal posso esperar!',
    })
    assert.equal(JSON.parse(withMessage.body).rsvp.message, 'Mal posso esperar!')

    const without = await put({ attending: true, fullName: 'Ana Silva' })
    assert.equal(JSON.parse(without.body).rsvp.message, null)
  })

  it('exige nome com pelo menos dois caracteres', async () => {
    const res = await put({ attending: true, fullName: 'X' })
    assert.equal(res.statusCode, 400)
  })

  it('descarta campos não declarados no corpo', async () => {
    // removeAdditional: 'all' — partySize não existe mais no contrato.
    const res = await put({ attending: true, fullName: 'Ana Silva', partySize: 9 })

    assert.equal(res.statusCode, 200)
    assert.ok(!res.body.includes('partySize'))
  })
})

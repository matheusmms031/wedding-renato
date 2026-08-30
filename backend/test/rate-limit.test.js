import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { buildTestApp, createUser, truncateAll } from './helpers/app.js'

// Arquivo próprio de propósito: o contador do rate limit vive na instância da
// app, e um limite baixo estouraria o orçamento de login dos outros testes.
// O node --test dá um processo por arquivo, então aqui a app é a única.
let app

before(async () => {
  app = await buildTestApp({ loginRateLimitMax: 5 })
  await truncateAll(app)
  await createUser(app, { username: 'ana.silva' })
})

after(async () => {
  await app.close()
})

describe('rate limit do login', () => {
  it('bloqueia a partir da 6ª tentativa na mesma dupla ip+usuário', async () => {
    const codes = []

    for (let i = 0; i < 6; i += 1) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { username: 'ana.silva', password: 'errada' },
      })
      codes.push(res.statusCode)
    }

    assert.deepEqual(codes.slice(0, 5), [401, 401, 401, 401, 401])
    assert.equal(codes[5], 429)
  })

  it('responde 429 com código e mensagem em português', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'ana.silva', password: 'errada' },
    })

    assert.equal(res.statusCode, 429)
    const { error } = JSON.parse(res.body)
    assert.equal(error.code, 'RATE_LIMITED')
    assert.match(error.message, /tentativas/i)
  })

  it('não conta tentativas de outro usuário no mesmo balde', async () => {
    await createUser(app, { username: 'joao.lima' })

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'joao.lima', password: 'senha123' },
    })

    assert.equal(res.statusCode, 200)
  })
})

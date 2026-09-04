import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { after, before, beforeEach, describe, it } from 'node:test'
import { buildTestApp, createGift, createUser, loginAs, truncateAll } from './helpers/app.js'

let app
let cookieAdmin
let cookieGuest

// PNG 1x1 real: os bytes iniciais são o que a validação inspeciona.
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

function multipart(buffer, filename, contentType) {
  const boundary = '----teste'
  const cabecalho =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
    `Content-Type: ${contentType}\r\n\r\n`
  return {
    payload: Buffer.concat([Buffer.from(cabecalho), buffer, Buffer.from(`\r\n--${boundary}--\r\n`)]),
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
  }
}

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

const enviar = (giftId, corpo, cookie) => {
  const { payload, headers } = corpo
  return app.inject({
    method: 'POST',
    url: `/api/admin/gifts/${giftId}/image`,
    payload,
    headers: { ...headers, cookie },
  })
}

describe('POST /api/admin/gifts/:id/image', () => {
  it('recusa convidado comum', async () => {
    const gift = await createGift(app)
    const res = await enviar(gift.id, multipart(PNG_1X1, 'foto.png', 'image/png'), cookieGuest)
    assert.equal(res.statusCode, 403)
  })

  it('aceita PNG e grava o caminho no presente', async () => {
    const gift = await createGift(app)
    const res = await enviar(gift.id, multipart(PNG_1X1, 'foto.png', 'image/png'), cookieAdmin)

    assert.equal(res.statusCode, 200)
    const { gift: atualizado } = JSON.parse(res.body)
    assert.match(atualizado.imageUrl, /^\/uploads\/[0-9a-f-]{36}\.png$/)

    const noDisco = path.join(app.uploadsDir, path.basename(atualizado.imageUrl))
    await fs.access(noDisco)
  })

  it('recusa arquivo cujo conteúdo não é imagem, mesmo com extensão mentindo', async () => {
    const gift = await createGift(app)
    const texto = Buffer.from('isto aqui é só texto, não é PNG nenhum')

    const res = await enviar(gift.id, multipart(texto, 'malicioso.png', 'image/png'), cookieAdmin)
    assert.equal(res.statusCode, 400)
    assert.equal(JSON.parse(res.body).error.code, 'ARQUIVO_INVALIDO')
  })

  it('recusa arquivo acima de 5 MB', async () => {
    const gift = await createGift(app)
    // Header de PNG válido seguido de 6 MB de zeros: passa na checagem de
    // assinatura e é barrado pelo limite de tamanho, que é o que se testa aqui.
    const gigante = Buffer.concat([PNG_1X1, Buffer.alloc(6 * 1024 * 1024)])

    const res = await enviar(gift.id, multipart(gigante, 'grande.png', 'image/png'), cookieAdmin)
    // 413 e não 400: é o status que descreve o que aconteceu.
    assert.equal(res.statusCode, 413)
    assert.equal(JSON.parse(res.body).error.code, 'ARQUIVO_GRANDE')
    assert.match(JSON.parse(res.body).error.message, /5 MB/)
  })

  it('apaga a imagem anterior ao trocar', async () => {
    const gift = await createGift(app)

    const primeira = await enviar(gift.id, multipart(PNG_1X1, 'a.png', 'image/png'), cookieAdmin)
    const antiga = JSON.parse(primeira.body).gift.imageUrl

    await enviar(gift.id, multipart(PNG_1X1, 'b.png', 'image/png'), cookieAdmin)

    await assert.rejects(fs.access(path.join(app.uploadsDir, path.basename(antiga))))
  })

  it('404 para presente inexistente', async () => {
    const res = await enviar(
      '123e4567-e89b-12d3-a456-426614174000',
      multipart(PNG_1X1, 'foto.png', 'image/png'),
      cookieAdmin,
    )
    assert.equal(res.statusCode, 404)
  })
})

# Presentes: QR Code PIX e imagens — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O convidado vê um QR Code PIX com o valor do presente, paga e confirma; o admin sobe uma foto para cada presente.

**Architecture:** O payload do BR Code é montado por uma função pura no backend e o QR é rasterizado em SVG no servidor, para não somar biblioteca ao bundle do convidado. A chave PIX vive numa tabela `settings` chave-valor editável pelo painel. As imagens são gravadas em disco, num volume Docker montado no backend (leitura e escrita) e no frontend (somente leitura), servido direto pelo nginx.

**Tech Stack:** Fastify 5, Sequelize 6, Postgres 17, React 19, Vite 8. Novas dependências: `@fastify/multipart`, `qrcode` (ambas no backend).

**Spec:** `docs/superpowers/specs/2026-09-04-presentes-pix-e-imagens-design.md`

## Global Constraints

- Comentários e mensagens de erro em **português**. Mensagem de `AppError` vai crua para a tela do convidado.
- Dinheiro é **inteiro em centavos**, nunca float.
- Nome do recebedor PIX: **máximo 25 caracteres**. Cidade: **máximo 15**. Limites normativos do Bacen — exceder gera BR Code que o app do banco recusa.
- Nome e cidade no payload PIX vão em **ASCII maiúsculo sem acentos** (`Marília` → `MARILIA`).
- Chave PIX é **aleatória**: 36 caracteres no formato UUID.
- Uploads aceitam **JPEG, PNG e WebP**, validados pelos **bytes iniciais**, nunca pela extensão ou `Content-Type`.
- Limite de upload: **5 MB**.
- Testes rodam com `npm test` no diretório `backend/` (`node --test`, sequencial). Exigem Postgres de teste acessível.
- Nenhuma migration destrutiva: `gifts.image_url` já existe e será reaproveitada.

---

### Task 1: Função pura que monta o payload PIX

**Files:**
- Create: `backend/src/lib/pix.js`
- Test: `backend/test/pix.test.js`

**Interfaces:**
- Consumes: nada
- Produces: `montarPayloadPix({ chave, nome, cidade, valorCentavos }) -> string`

- [ ] **Step 1: Escrever o teste que falha**

```js
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { montarPayloadPix } from '../src/lib/pix.js'

describe('montarPayloadPix', () => {
  it('monta o BR Code com os campos EMV na ordem normativa', () => {
    const payload = montarPayloadPix({
      chave: '123e4567-e89b-12d3-a456-426614174000',
      nome: 'RENATO E MARILIA',
      cidade: 'PALMAS',
      valorCentavos: 20000,
    })

    assert.ok(payload.startsWith('000201'), 'começa com o Payload Format Indicator')
    assert.ok(payload.includes('0014br.gov.bcb.pix'), 'declara o GUI do PIX')
    assert.ok(payload.includes('123e4567-e89b-12d3-a456-426614174000'))
    assert.ok(payload.includes('5303986'), 'moeda BRL')
    assert.ok(payload.includes('5406200.00'), 'valor em reais com duas casas')
    assert.ok(payload.includes('5802BR'))
    assert.match(payload.slice(-8), /^6304[0-9A-F]{4}$/, 'termina no CRC de 4 hex')
  })

  it('remove acentos e sobe para maiúsculas em nome e cidade', () => {
    const payload = montarPayloadPix({
      chave: 'x',
      nome: 'Marília',
      cidade: 'Goiânia',
      valorCentavos: 100,
    })

    assert.ok(payload.includes('MARILIA'))
    assert.ok(payload.includes('GOIANIA'))
  })

  it('recusa nome acima de 25 caracteres', () => {
    assert.throws(
      () =>
        montarPayloadPix({
          chave: 'x',
          nome: 'A'.repeat(26),
          cidade: 'PALMAS',
          valorCentavos: 100,
        }),
      /25/,
    )
  })

  it('recusa cidade acima de 15 caracteres', () => {
    assert.throws(
      () =>
        montarPayloadPix({ chave: 'x', nome: 'RENATO', cidade: 'A'.repeat(16), valorCentavos: 100 }),
      /15/,
    )
  })

  it('recusa valor zero ou negativo', () => {
    assert.throws(
      () => montarPayloadPix({ chave: 'x', nome: 'R', cidade: 'P', valorCentavos: 0 }),
      /valor/i,
    )
  })

  // O CRC16-CCITT é verificável: recalcular sobre tudo menos os 4 últimos
  // dígitos tem que devolver exatamente esses 4 dígitos.
  it('fecha com um CRC16-CCITT consistente', () => {
    const payload = montarPayloadPix({
      chave: 'chave-teste',
      nome: 'RENATO',
      cidade: 'PALMAS',
      valorCentavos: 5000,
    })

    const corpo = payload.slice(0, -4)
    let crc = 0xffff
    for (let i = 0; i < corpo.length; i += 1) {
      crc ^= corpo.charCodeAt(i) << 8
      for (let j = 0; j < 8; j += 1) {
        crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
      }
    }

    assert.equal(payload.slice(-4), crc.toString(16).toUpperCase().padStart(4, '0'))
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && node --test test/pix.test.js`
Expected: FAIL — `Cannot find module '../src/lib/pix.js'`

- [ ] **Step 3: Implementar**

```js
/**
 * Monta o payload do BR Code (PIX estático com valor), no formato EMV
 * QRCPS-MPM do Bacen.
 *
 * Tudo aqui é normativo, não estilo: a ordem dos campos, o tamanho de cada
 * valor em dois dígitos, o ASCII sem acento e o CRC16 no fim. Errar um byte
 * gera um código que o app do banco recusa sem dizer por quê — daí a função
 * ser pura e ter teste próprio.
 */

const CAMPO_NOME_MAX = 25
const CAMPO_CIDADE_MAX = 15

/** id + tamanho em dois dígitos + valor. É o bloco básico do EMV. */
function tlv(id, valor) {
  const tamanho = String(valor.length).padStart(2, '0')
  return `${id}${tamanho}${valor}`
}

/** O EMV é ASCII: acento vira caractere inválido e quebra o tamanho declarado. */
function ascii(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .trim()
}

/** CRC16-CCITT (polinômio 0x1021, inicial 0xFFFF), sobre o payload inteiro. */
function crc16(texto) {
  let crc = 0xffff
  for (let i = 0; i < texto.length; i += 1) {
    crc ^= texto.charCodeAt(i) << 8
    for (let j = 0; j < 8; j += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function montarPayloadPix({ chave, nome, cidade, valorCentavos }) {
  if (!chave) throw new Error('Chave PIX não configurada.')
  if (!Number.isInteger(valorCentavos) || valorCentavos <= 0) {
    throw new Error('O valor do presente precisa ser maior que zero.')
  }

  const nomeAscii = ascii(nome ?? '')
  const cidadeAscii = ascii(cidade ?? '')

  if (nomeAscii.length > CAMPO_NOME_MAX) {
    throw new Error(`O nome do recebedor passa de ${CAMPO_NOME_MAX} caracteres.`)
  }
  if (cidadeAscii.length > CAMPO_CIDADE_MAX) {
    throw new Error(`A cidade do recebedor passa de ${CAMPO_CIDADE_MAX} caracteres.`)
  }

  const contaPix = tlv('00', 'br.gov.bcb.pix') + tlv('01', chave)

  const semCrc =
    tlv('00', '01') +
    tlv('26', contaPix) +
    tlv('52', '0000') +
    tlv('53', '986') +
    tlv('54', (valorCentavos / 100).toFixed(2)) +
    tlv('58', 'BR') +
    tlv('59', nomeAscii) +
    tlv('60', cidadeAscii) +
    tlv('62', tlv('05', '***')) +
    '6304'

  return semCrc + crc16(semCrc)
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `cd backend && node --test test/pix.test.js`
Expected: PASS, 6 testes

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/pix.js backend/test/pix.test.js
git commit -m "Monta o payload do BR Code PIX numa função pura"
```

---

### Task 2: Tabela `settings` e endpoints de configuração

**Files:**
- Create: `backend/migrations/20260904000100-create-settings.cjs`
- Create: `backend/src/db/models/setting.js`
- Create: `backend/src/services/settings.service.js`
- Modify: `backend/src/db/index.js` (registrar o model)
- Modify: `backend/src/schemas/admin.schema.js` (schemas de settings)
- Modify: `backend/src/controllers/admin.controller.js`
- Modify: `backend/src/routes/admin.routes.js`
- Modify: `backend/test/helpers/app.js` (truncar `settings`)
- Test: `backend/test/settings.test.js`

**Interfaces:**
- Consumes: nada
- Produces:
  - `models.Setting` (campos `key`, `value`)
  - `settingsService.obterConfigPix(models) -> { pixKey, pixReceiverName, pixReceiverCity }`
  - `settingsService.salvar(models, { pixKey, pixReceiverName, pixReceiverCity }) -> mesma forma`
  - `GET /api/admin/settings`, `PUT /api/admin/settings`

- [ ] **Step 1: Escrever o teste que falha**

```js
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && node --test test/settings.test.js`
Expected: FAIL — 404 nas rotas, `app.models.Setting` indefinido

- [ ] **Step 3: Criar a migration**

`backend/migrations/20260904000100-create-settings.cjs`:

```js
'use strict'

/**
 * Configurações do site em chave-valor.
 *
 * Chave-valor e não colunas tipadas porque é o único formato em que a próxima
 * configuração não custa uma migration — e este site ainda vai receber ajustes
 * até dezembro.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('settings', {
      key: { type: Sequelize.STRING(64), primaryKey: true, allowNull: false },
      value: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('settings')
  },
}
```

- [ ] **Step 4: Criar o model**

`backend/src/db/models/setting.js`:

```js
export default function defineSetting(sequelize, DataTypes) {
  return sequelize.define(
    'Setting',
    {
      key: { type: DataTypes.STRING(64), primaryKey: true, allowNull: false },
      value: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    },
    { tableName: 'settings' },
  )
}
```

Em `backend/src/db/index.js`, importar `defineSetting` junto dos outros imports, instanciar `const Setting = defineSetting(sequelize, DataTypes)` depois de `Gift`, e incluir `Setting` no objeto exportado `models`. O `Setting` não tem associação com nada.

- [ ] **Step 5: Criar o service**

`backend/src/services/settings.service.js`:

```js
/**
 * As três chaves do PIX. A tabela é genérica; este módulo é quem sabe quais
 * chaves existem e como elas viram um objeto para a API.
 */
const CHAVES = {
  pixKey: 'pix_key',
  pixReceiverName: 'pix_receiver_name',
  pixReceiverCity: 'pix_receiver_city',
}

export async function obterConfigPix(models) {
  const linhas = await models.Setting.findAll({
    where: { key: Object.values(CHAVES) },
    raw: true,
  })

  const porChave = new Map(linhas.map((linha) => [linha.key, linha.value]))

  return {
    pixKey: porChave.get(CHAVES.pixKey) ?? '',
    pixReceiverName: porChave.get(CHAVES.pixReceiverName) ?? '',
    pixReceiverCity: porChave.get(CHAVES.pixReceiverCity) ?? '',
  }
}

export async function salvar(models, entrada) {
  // upsert em vez de create: a linha é única por chave e a tela salva por cima.
  await Promise.all(
    Object.entries(CHAVES).map(([campo, chave]) =>
      models.Setting.upsert({ key: chave, value: entrada[campo] ?? '' }),
    ),
  )

  return obterConfigPix(models)
}
```

- [ ] **Step 6: Schemas, controller e rota**

Em `backend/src/schemas/admin.schema.js`, acrescentar:

```js
const settingsShape = {
  type: 'object',
  properties: {
    pixKey: { type: 'string' },
    pixReceiverName: { type: 'string' },
    pixReceiverCity: { type: 'string' },
  },
}

export const getSettingsSchema = {
  response: {
    200: { type: 'object', properties: { settings: settingsShape } },
    ...errors(401, 403),
  },
}

export const updateSettingsSchema = {
  body: {
    type: 'object',
    required: ['pixKey', 'pixReceiverName', 'pixReceiverCity'],
    properties: {
      // 36 = UUID. A chave escolhida pelo casal é do tipo aleatória.
      pixKey: { type: 'string', minLength: 1, maxLength: 77 },
      // Limites do EMV: passar disso gera BR Code que o banco recusa.
      pixReceiverName: { type: 'string', minLength: 1, maxLength: 25 },
      pixReceiverCity: { type: 'string', minLength: 1, maxLength: 15 },
    },
  },
  response: {
    200: { type: 'object', properties: { settings: settingsShape } },
    ...errors(400, 401, 403),
  },
}
```

Em `backend/src/controllers/admin.controller.js`, importar `* as settingsService from '../services/settings.service.js'` e acrescentar:

```js
export async function getSettings(request) {
  return { settings: await settingsService.obterConfigPix(request.server.models) }
}

export async function updateSettings(request) {
  return { settings: await settingsService.salvar(request.server.models, request.body) }
}
```

Em `backend/src/routes/admin.routes.js`, importar `getSettingsSchema` e `updateSettingsSchema` e registrar, depois das rotas de gifts:

```js
  fastify.get('/settings', { schema: getSettingsSchema }, controller.getSettings)
  fastify.put('/settings', { schema: updateSettingsSchema }, controller.updateSettings)
```

Em `backend/test/helpers/app.js`, incluir `settings` no TRUNCATE:

```js
  await app.db.query('TRUNCATE users, gifts, settings RESTART IDENTITY CASCADE')
```

- [ ] **Step 7: Rodar a migration e os testes**

Run:
```bash
cd backend && npx sequelize-cli db:migrate && node --test test/settings.test.js
```
Expected: PASS, 7 testes

- [ ] **Step 8: Rodar a suíte inteira (nada pode quebrar)**

Run: `cd backend && npm test`
Expected: os 48 anteriores + 13 novos, 0 falhas

- [ ] **Step 9: Commit**

```bash
git add backend/migrations backend/src/db backend/src/services/settings.service.js \
        backend/src/schemas/admin.schema.js backend/src/controllers/admin.controller.js \
        backend/src/routes/admin.routes.js backend/test/settings.test.js backend/test/helpers/app.js
git commit -m "Guarda a configuração do PIX numa tabela de settings"
```

---

### Task 3: Endpoint que devolve o QR do presente

**Files:**
- Modify: `backend/package.json` (dependência `qrcode`)
- Create: `backend/src/services/pix.service.js`
- Modify: `backend/src/schemas/gifts.schema.js`
- Modify: `backend/src/controllers/gifts.controller.js`
- Modify: `backend/src/routes/gifts.routes.js`
- Test: `backend/test/gift-pix.test.js`

**Interfaces:**
- Consumes: `montarPayloadPix` (Task 1), `settingsService.obterConfigPix` (Task 2)
- Produces: `GET /api/gifts/:giftId/pix` → `{ payload: string, qrcodeSvg: string }`

- [ ] **Step 1: Instalar a dependência**

```bash
cd backend && npm install qrcode
```

- [ ] **Step 2: Escrever o teste que falha**

```js
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
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `cd backend && node --test test/gift-pix.test.js`
Expected: FAIL — 404 na rota

- [ ] **Step 4: Implementar o service**

`backend/src/services/pix.service.js`:

```js
import QRCode from 'qrcode'
import { conflict, notFound } from '../lib/errors.js'
import { montarPayloadPix } from '../lib/pix.js'
import { obterConfigPix } from './settings.service.js'

/**
 * Monta o BR Code de um presente e o rasteriza em SVG.
 *
 * O SVG sai daqui e não do navegador de propósito: assim a biblioteca de QR
 * não entra no bundle que todo convidado baixa.
 */
export async function gerarQrDoPresente(models, giftId) {
  const gift = await models.Gift.findByPk(giftId)
  if (!gift || !gift.active) {
    throw notFound('GIFT_NOT_FOUND', 'Este presente não está mais disponível.')
  }

  const config = await obterConfigPix(models)
  if (!config.pixKey) {
    throw conflict(
      'PIX_NAO_CONFIGURADO',
      'O PIX ainda não foi configurado. Avise os noivos.',
    )
  }

  const payload = montarPayloadPix({
    chave: config.pixKey,
    nome: config.pixReceiverName,
    cidade: config.pixReceiverCity,
    valorCentavos: gift.priceCents,
  })

  const qrcodeSvg = await QRCode.toString(payload, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
  })

  return { payload, qrcodeSvg }
}
```

- [ ] **Step 5: Schema, controller e rota**

Em `backend/src/schemas/gifts.schema.js`:

```js
export const giftPixSchema = {
  params: uuidParam('giftId'),
  response: {
    200: {
      type: 'object',
      properties: {
        payload: { type: 'string' },
        qrcodeSvg: { type: 'string' },
      },
    },
    ...errors(401, 404, 409),
  },
}
```

Em `backend/src/controllers/gifts.controller.js`, importar `* as pixService from '../services/pix.service.js'` e acrescentar:

```js
export async function pix(request) {
  return pixService.gerarQrDoPresente(request.server.models, request.params.giftId)
}
```

Em `backend/src/routes/gifts.routes.js`, importar `giftPixSchema` e registrar:

```js
  fastify.get('/:giftId/pix', { schema: giftPixSchema }, controller.pix)
```

- [ ] **Step 6: Rodar os testes**

Run: `cd backend && node --test test/gift-pix.test.js`
Expected: PASS, 4 testes

- [ ] **Step 7: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/services/pix.service.js \
        backend/src/schemas/gifts.schema.js backend/src/controllers/gifts.controller.js \
        backend/src/routes/gifts.routes.js backend/test/gift-pix.test.js
git commit -m "Serve o QR Code PIX de cada presente"
```

---

### Task 4: Upload da imagem do presente

**Files:**
- Modify: `backend/package.json` (dependência `@fastify/multipart`)
- Create: `backend/src/plugins/uploads.js`
- Create: `backend/src/services/upload.service.js`
- Modify: `backend/src/app.js` (registrar o plugin)
- Modify: `backend/src/config/env.js` (`UPLOADS_DIR`)
- Modify: `backend/src/schemas/admin.schema.js`
- Modify: `backend/src/controllers/admin.controller.js`
- Modify: `backend/src/routes/admin.routes.js`
- Modify: `backend/src/services/admin.service.js` (apagar arquivo ao apagar presente)
- Test: `backend/test/gift-image.test.js`

**Interfaces:**
- Consumes: nada das tarefas anteriores
- Produces:
  - `POST /api/admin/gifts/:id/image` (multipart, campo `file`) → `{ gift }`
  - `uploadService.salvarImagem(models, giftId, parte) -> Gift`
  - `uploadService.apagarImagem(imageUrl) -> void`

- [ ] **Step 1: Instalar a dependência**

```bash
cd backend && npm install @fastify/multipart
```

- [ ] **Step 2: Escrever o teste que falha**

```js
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
    assert.equal(res.statusCode, 400)
    assert.equal(JSON.parse(res.body).error.code, 'ARQUIVO_GRANDE')
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
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `cd backend && node --test test/gift-image.test.js`
Expected: FAIL — 404 na rota

- [ ] **Step 4: Configurar o diretório e o plugin**

Em `backend/src/config/env.js`, acrescentar ao objeto exportado:

```js
  // Dentro do container é o volume compartilhado com o nginx; fora, uma pasta
  // local que o .gitignore já cobre.
  UPLOADS_DIR: process.env.UPLOADS_DIR ?? 'uploads',
```

`backend/src/plugins/uploads.js`:

```js
import fs from 'node:fs/promises'
import path from 'node:path'
import multipart from '@fastify/multipart'
import fp from 'fastify-plugin'
import { env } from '../config/env.js'

const LIMITE_BYTES = 5 * 1024 * 1024

async function uploadsPlugin(fastify) {
  const uploadsDir = path.resolve(env.UPLOADS_DIR)
  await fs.mkdir(uploadsDir, { recursive: true })

  await fastify.register(multipart, {
    limits: { fileSize: LIMITE_BYTES, files: 1 },
  })

  fastify.decorate('uploadsDir', uploadsDir)
}

export default fp(uploadsPlugin, { name: 'uploads' })
```

Em `backend/src/app.js`, registrar o plugin junto dos outros (depois de `security`).

- [ ] **Step 5: Implementar o service**

`backend/src/services/upload.service.js`:

```js
import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { badRequest, notFound } from '../lib/errors.js'

/**
 * Assinaturas dos formatos aceitos.
 *
 * A checagem é sobre os bytes do arquivo, nunca sobre a extensão ou o
 * Content-Type: os dois vêm do cliente e mentem de graça.
 */
const ASSINATURAS = [
  { ext: 'png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { ext: 'jpg', bytes: [0xff, 0xd8, 0xff] },
  // WebP é "RIFF....WEBP": confere o prefixo e o marcador no offset 8.
  { ext: 'webp', bytes: [0x52, 0x49, 0x46, 0x46], offset8: [0x57, 0x45, 0x42, 0x50] },
]

function detectarExtensao(buffer) {
  for (const assinatura of ASSINATURAS) {
    const casa = assinatura.bytes.every((byte, i) => buffer[i] === byte)
    if (!casa) continue
    if (assinatura.offset8) {
      const casaWebp = assinatura.offset8.every((byte, i) => buffer[8 + i] === byte)
      if (!casaWebp) continue
    }
    return assinatura.ext
  }
  return null
}

/** Só o nome do arquivo, para nunca deixar um caminho do cliente virar caminho no disco. */
export async function apagarImagem(uploadsDir, imageUrl) {
  if (!imageUrl) return
  const nome = path.basename(imageUrl)
  await fs.rm(path.join(uploadsDir, nome), { force: true })
}

export async function salvarImagem(models, uploadsDir, giftId, parte) {
  const gift = await models.Gift.findByPk(giftId)
  if (!gift) throw notFound('GIFT_NOT_FOUND', 'Presente não encontrado.')

  if (!parte) throw badRequest('ARQUIVO_AUSENTE', 'Nenhum arquivo foi enviado.')

  const buffer = await parte.toBuffer()

  if (parte.file.truncated) {
    throw badRequest('ARQUIVO_GRANDE', 'A imagem passa de 5 MB.')
  }

  const ext = detectarExtensao(buffer)
  if (!ext) {
    throw badRequest('ARQUIVO_INVALIDO', 'Envie uma imagem JPEG, PNG ou WebP.')
  }

  const anterior = gift.imageUrl
  // Nome gerado por nós: o nome vindo do cliente é vetor de path traversal.
  const nome = `${randomUUID()}.${ext}`
  await fs.writeFile(path.join(uploadsDir, nome), buffer)

  gift.imageUrl = `/uploads/${nome}`
  await gift.save()

  await apagarImagem(uploadsDir, anterior)

  return gift
}
```

- [ ] **Step 6: Schema, controller e rota**

Em `backend/src/schemas/admin.schema.js`:

```js
export const uploadGiftImageSchema = {
  params: uuidParam('id'),
  response: {
    200: { type: 'object', properties: { gift: giftShape } },
    ...errors(400, 401, 403, 404),
  },
}
```

(se `uuidParam` ainda não estiver importado nesse arquivo, importar de `./common.schema.js`)

Em `backend/src/controllers/admin.controller.js`:

```js
export async function uploadGiftImage(request) {
  const parte = await request.file()
  const gift = await uploadService.salvarImagem(
    request.server.models,
    request.server.uploadsDir,
    request.params.id,
    parte,
  )
  return { gift: toPublicGift(gift) }
}
```

Importar `* as uploadService from '../services/upload.service.js'` e garantir que `toPublicGift` já esteja importado (está, usado por `createGift`).

Em `backend/src/routes/admin.routes.js`:

```js
  fastify.post('/gifts/:id/image', { schema: uploadGiftImageSchema }, controller.uploadGiftImage)
```

- [ ] **Step 7: Apagar o arquivo quando o presente é apagado**

Em `backend/src/services/admin.service.js`, na função que apaga presente, carregar o `imageUrl` antes do destroy e chamar `apagarImagem(uploadsDir, imageUrl)` depois. Passar `uploadsDir` do controller, como já é feito com `models`.

- [ ] **Step 8: Rodar os testes**

Run: `cd backend && node --test test/gift-image.test.js`
Expected: PASS, 6 testes

- [ ] **Step 9: Suíte inteira**

Run: `cd backend && npm test`
Expected: 0 falhas

- [ ] **Step 10: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src backend/test/gift-image.test.js
git commit -m "Aceita upload de imagem para os presentes"
```

---

### Task 5: Volume e nginx servindo as imagens

**Files:**
- Modify: `docker-compose.prod.yml`
- Modify: `docker-compose.yml`
- Modify: `frontend/nginx/default.conf`
- Modify: `docs/deploy-azure.md`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: o caminho `/uploads/<uuid>.<ext>` gravado na Task 4
- Produces: `https://renatoemarilia.site/uploads/<arquivo>` servido pelo nginx

- [ ] **Step 1: Volume nos dois containers (produção)**

Em `docker-compose.prod.yml`, no serviço `backend`:

```yaml
    volumes:
      - uploads-data:/app/uploads
    environment:
      UPLOADS_DIR: /app/uploads
```

No serviço `frontend`:

```yaml
    volumes:
      # Somente leitura: quem escreve é o backend. O nginx serve os arquivos
      # direto, sem passar pelo Node.
      - uploads-data:/usr/share/nginx/html/uploads:ro
```

E declarar o volume junto de `db-data`:

```yaml
volumes:
  db-data:
  uploads-data:
```

Repetir o mesmo em `docker-compose.yml` (desenvolvimento), para o comportamento não divergir entre os ambientes.

- [ ] **Step 2: nginx serve o diretório**

Em `frontend/nginx/default.conf`, **antes** do `location /`:

```nginx
  # Imagens dos presentes, gravadas pelo backend no volume compartilhado.
  # Vem antes do fallback da SPA, senão /uploads/x.png devolveria o index.html.
  location /uploads/ {
    try_files $uri =404;
    expires 30d;
    add_header Cache-Control "public";
  }
```

- [ ] **Step 3: Ignorar a pasta local**

Em `.gitignore`:

```
# Imagens enviadas pelo painel (ficam em volume Docker em produção)
backend/uploads/
```

- [ ] **Step 4: Registrar o segundo volume no runbook**

Em `docs/deploy-azure.md`, na seção de atualização, acrescentar aviso de que **são dois volumes** a preservar: `db-data` (banco) e `uploads-data` (imagens dos presentes), e que o dump do Postgres não cobre o segundo.

- [ ] **Step 5: Validar a composição**

Run:
```bash
cd /home/matheus/Documentos/wedding-renato
DOMAIN=exemplo.com TLS_EMAIL=a@b.com DB_USER=x DB_PASSWORD=y DB_NAME=z \
  docker compose -f docker-compose.prod.yml -f docker-compose.tls.yml config | grep -A3 uploads
```
Expected: o volume aparece montado nos dois serviços, `:ro` no frontend

- [ ] **Step 6: Commit**

```bash
git add docker-compose.yml docker-compose.prod.yml frontend/nginx/default.conf .gitignore docs/deploy-azure.md
git commit -m "Serve as imagens dos presentes pelo nginx, em volume compartilhado"
```

---

### Task 6: Painel — configuração do PIX e upload da imagem

**Files:**
- Modify: `frontend/src/api/admin.js`
- Modify: `frontend/src/pages/Admin.jsx`
- Modify: `frontend/src/pages/Admin.css`

**Interfaces:**
- Consumes: `GET/PUT /api/admin/settings` (Task 2), `POST /api/admin/gifts/:id/image` (Task 4)
- Produces: nada para tarefas seguintes

- [ ] **Step 1: Funções de API**

Em `frontend/src/api/admin.js`:

```js
export const getSettings = (options) => apiFetch('/admin/settings', options)

export const updateSettings = (body) => apiFetch('/admin/settings', { method: 'PUT', body })

/**
 * Upload não passa pelo apiFetch: ele força Content-Type JSON, e o browser
 * precisa definir o boundary do multipart sozinho.
 */
export async function uploadGiftImage(giftId, file) {
  const form = new FormData()
  form.append('file', file)

  const response = await fetch(`/api/admin/gifts/${giftId}/image`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'Não foi possível enviar a imagem.')
  }
  return payload
}
```

- [ ] **Step 2: Seção de configuração do PIX no Admin**

Em `frontend/src/pages/Admin.jsx`, acrescentar estado `settingsForm` e um formulário com três campos — chave PIX, nome do recebedor (`maxLength={25}`) e cidade (`maxLength={15}`). Os `maxLength` no HTML espelham o limite do EMV; um `<small>` abaixo de cada um explica que o limite vem do padrão do Bacen, para o admin não achar que é capricho.

Carregar via `getSettings` no mesmo `Promise.all` que já busca resumo, RSVPs, convidados e presentes.

- [ ] **Step 3: Campo de upload na lista de presentes**

Para cada presente já existente na tabela, um `<input type="file" accept="image/png,image/jpeg,image/webp">` que chama `uploadGiftImage(gift.id, file)` e recarrega a lista. Mostrar miniatura quando `gift.imageUrl` existir.

O upload é numa segunda etapa (presente primeiro, foto depois) porque o `id` só existe depois de criado.

- [ ] **Step 4: Verificar no navegador**

Run: `cd frontend && npm run dev`
Verificar: salvar a configuração do PIX persiste após recarregar; subir uma imagem mostra a miniatura.

- [ ] **Step 5: Lint e build**

Run: `cd frontend && npm run lint && npm run build`
Expected: sem erros

- [ ] **Step 6: Commit**

```bash
git add frontend/src/api/admin.js frontend/src/pages/Admin.jsx frontend/src/pages/Admin.css
git commit -m "Configura o PIX e envia imagens pelo painel"
```

---

### Task 7: Modal de pagamento na lista de presentes

**Files:**
- Modify: `frontend/src/api/gifts.js`
- Create: `frontend/src/components/home/GiftPixModal.jsx`
- Modify: `frontend/src/components/home/GiftsSection.jsx`
- Modify: `frontend/src/components/home/home.css`

**Interfaces:**
- Consumes: `GET /api/gifts/:giftId/pix` (Task 3), `claimGift` (já existe)
- Produces: nada

- [ ] **Step 1: Função de API**

Em `frontend/src/api/gifts.js`:

```js
export const getGiftPix = (giftId, options) => apiFetch(`/gifts/${giftId}/pix`, options)
```

- [ ] **Step 2: Componente do modal**

`frontend/src/components/home/GiftPixModal.jsx` — diálogo com:
- nome e valor do presente
- o `qrcodeSvg` injetado via `dangerouslySetInnerHTML` (é SVG gerado pelo nosso backend a partir de dado nosso, não conteúdo de terceiro)
- botão "Copiar código PIX" usando `navigator.clipboard.writeText(payload)`, com confirmação visual
- botão "Já fiz o PIX" que chama `claimGift(gift.id)`
- botão "Cancelar"
- `role="dialog"`, `aria-modal="true"`, foco inicial no diálogo, `Esc` fecha, foco preso dentro

Tratamento específico do erro `GIFT_UNAVAILABLE`: em vez da mensagem genérica, dizer que outra pessoa escolheu o presente enquanto ele pagava, e pedir que fale com os noivos — o dinheiro chegou e a correção é humana.

- [ ] **Step 3: Ligar no card**

Em `GiftsSection.jsx`: o botão "Presentear" passa a abrir o modal em vez de chamar `claimGift` direto. O card mostra `gift.imageUrl` quando existir, com `loading="lazy"` e `alt` com o nome do presente.

- [ ] **Step 4: Verificar no navegador**

Run: `cd frontend && npm run dev`
Verificar: o QR aparece, "copiar" copia o payload, "Já fiz o PIX" reserva o presente e o card atualiza.

- [ ] **Step 5: Conferir o QR num app de banco de verdade**

Configurar a chave PIX real no painel, abrir o modal e apontar a câmera do app do banco. Ele precisa reconhecer o valor e o recebedor. **Este passo não é opcional:** os testes garantem o formato, não que o banco aceita.

- [ ] **Step 6: Lint e build**

Run: `cd frontend && npm run lint && npm run build`
Expected: sem erros

- [ ] **Step 7: Commit**

```bash
git add frontend/src/api/gifts.js frontend/src/components/home
git commit -m "Mostra o QR Code PIX antes de reservar o presente"
```

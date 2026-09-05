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

  it('tira a pontuação de CPF, que o Bacen exige em dígitos puros', () => {
    const payload = montarPayloadPix({
      chave: '123.456.789-01',
      nome: 'RENATO',
      cidade: 'PALMAS',
      valorCentavos: 100,
    })

    assert.ok(payload.includes('011112345678901'), 'CPF entra com 11 dígitos e tamanho 11')
    assert.ok(!payload.includes('123.456.789-01'), 'a pontuação não sobra no payload')
  })

  it('tira a pontuação de CNPJ também', () => {
    const payload = montarPayloadPix({
      chave: '12.345.678/0001-95',
      nome: 'RENATO',
      cidade: 'PALMAS',
      valorCentavos: 100,
    })

    assert.ok(payload.includes('011412345678000195'))
  })

  it('não mexe em e-mail, telefone nem chave aleatória', () => {
    const casos = [
      'renato@exemplo.com',
      '+5563999999999',
      '123e4567-e89b-12d3-a456-426614174000',
    ]

    for (const chave of casos) {
      const payload = montarPayloadPix({
        chave,
        nome: 'RENATO',
        cidade: 'PALMAS',
        valorCentavos: 100,
      })
      assert.ok(payload.includes(chave), `manteve ${chave} intacta`)
    }
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

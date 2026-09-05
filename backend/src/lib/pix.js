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

/**
 * CPF e CNPJ entram no BR Code em dígitos puros — é o que o Bacen especifica.
 *
 * Colar "123.456.789-01" do jeito que se digita gera um QR que parece certo na
 * tela e o app do banco recusa, sem erro em log nenhum. Normalizar aqui é mais
 * barato que descobrir isso com um convidado tentando pagar.
 *
 * Só toca em chave que, sem pontuação, vira exatamente 11 ou 14 dígitos.
 * E-mail, telefone e chave aleatória passam intactos.
 */
function normalizarChave(chave) {
  const limpa = chave.trim()
  const digitos = limpa.replace(/[.\-/\s]/g, '')

  if (/^\d{11}$/.test(digitos) || /^\d{14}$/.test(digitos)) return digitos

  return limpa
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

  const contaPix = tlv('00', 'br.gov.bcb.pix') + tlv('01', normalizarChave(chave))

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

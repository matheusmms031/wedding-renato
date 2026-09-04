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
    throw conflict('PIX_NAO_CONFIGURADO', 'O PIX ainda não foi configurado. Avise os noivos.')
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

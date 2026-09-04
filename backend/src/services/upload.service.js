import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { badRequest, notFound, payloadTooLarge } from '../lib/errors.js'

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

  // O @fastify/multipart aborta o stream ao estourar o limite e lança
  // FST_REQ_FILE_TOO_LARGE. Sem este catch, o convidado recebe um 413 com
  // "Requisição inválida.", que não diz o que fazer.
  let buffer
  try {
    buffer = await parte.toBuffer()
  } catch (erro) {
    if (erro.code === 'FST_REQ_FILE_TOO_LARGE') {
      throw payloadTooLarge('ARQUIVO_GRANDE', 'A imagem passa de 5 MB. Envie uma menor.')
    }
    throw erro
  }

  if (parte.file.truncated) {
    throw payloadTooLarge('ARQUIVO_GRANDE', 'A imagem passa de 5 MB. Envie uma menor.')
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

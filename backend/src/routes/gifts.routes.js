import * as controller from '../controllers/gifts.controller.js'
import { claimGiftSchema, giftPixSchema, listGiftsSchema, unclaimGiftSchema } from '../schemas/gifts.schema.js'

export default async function giftsRoutes(fastify) {
  fastify.addHook('onRequest', fastify.authenticate)

  fastify.get('/', { schema: listGiftsSchema }, controller.index)
  fastify.get('/:giftId/pix', { schema: giftPixSchema }, controller.pix)
  fastify.post('/:giftId/claim', { schema: claimGiftSchema }, controller.claim)
  fastify.delete('/:giftId/claim', { schema: unclaimGiftSchema }, controller.unclaim)
}

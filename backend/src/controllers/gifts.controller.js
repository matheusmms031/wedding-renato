import { toPublicGift } from '../lib/serializers.js'
import * as giftService from '../services/gift.service.js'

export async function index(request) {
  const rows = await giftService.list(request.server.models, request.user.id)
  return { gifts: rows.map(({ gift, claimedCount, claimedByMe }) => toPublicGift(gift, { claimedCount, claimedByMe })) }
}

export async function claim(request, reply) {
  const { db, models } = request.server

  const { gift, claimedCount } = await giftService.claim(db, models, {
    giftId: request.params.giftId,
    userId: request.user.id,
    note: request.body?.note,
  })

  return reply.code(201).send({ gift: toPublicGift(gift, { claimedCount, claimedByMe: true }) })
}

export async function unclaim(request, reply) {
  await giftService.unclaim(request.server.models, {
    giftId: request.params.giftId,
    userId: request.user.id,
  })
  return reply.code(204).send()
}

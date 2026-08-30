import { errors, uuidParam } from './common.schema.js'

export const giftShape = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    slug: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    priceCents: { type: 'integer' },
    imageUrl: { type: 'string', nullable: true },
    quantity: { type: 'integer' },
    active: { type: 'boolean' },
    sortOrder: { type: 'integer' },
    // Só o agregado: quem escolheu o quê nunca é exposto ao convidado.
    claimedCount: { type: 'integer' },
    available: { type: 'boolean' },
    claimedByMe: { type: 'boolean' },
  },
}

export const listGiftsSchema = {
  response: {
    200: { type: 'object', properties: { gifts: { type: 'array', items: giftShape } } },
    ...errors(401),
  },
}

export const claimGiftSchema = {
  params: uuidParam('giftId'),
  body: {
    type: 'object',
    properties: { note: { type: 'string', maxLength: 280 } },
  },
  response: {
    201: { type: 'object', properties: { gift: giftShape } },
    ...errors(400, 401, 404, 409),
  },
}

export const unclaimGiftSchema = {
  params: uuidParam('giftId'),
  response: {
    204: { type: 'null' },
    ...errors(401, 404),
  },
}

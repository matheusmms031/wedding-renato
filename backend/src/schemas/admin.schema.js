import { errors, publicUser, uuidParam } from './common.schema.js'
import { giftShape } from './gifts.schema.js'

const adminRsvp = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    attending: { type: 'boolean' },
    fullName: { type: 'string' },
    message: { type: 'string', nullable: true },
    respondedAt: { type: 'string' },
    username: { type: 'string' },
    displayName: { type: 'string' },
  },
}

const adminGuest = {
  type: 'object',
  properties: {
    ...publicUser.properties,
    rsvpStatus: { type: 'string' },
  },
}

const adminGift = {
  type: 'object',
  properties: {
    ...giftShape.properties,
    claims: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          username: { type: 'string' },
          displayName: { type: 'string' },
          note: { type: 'string', nullable: true },
          createdAt: { type: 'string' },
        },
      },
    },
  },
}

export const summarySchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        totalUsers: { type: 'integer' },
        responded: { type: 'integer' },
        pending: { type: 'integer' },
        attending: { type: 'integer' },
        declined: { type: 'integer' },
      },
    },
    ...errors(401, 403),
  },
}

export const listRsvpsSchema = {
  querystring: {
    type: 'object',
    properties: { attending: { type: 'boolean' } },
  },
  response: {
    200: { type: 'object', properties: { rsvps: { type: 'array', items: adminRsvp } } },
    ...errors(401, 403),
  },
}

export const listGuestsSchema = {
  response: {
    200: { type: 'object', properties: { guests: { type: 'array', items: adminGuest } } },
    ...errors(401, 403),
  },
}

export const createGuestSchema = {
  body: {
    type: 'object',
    required: ['username', 'displayName', 'password'],
    properties: {
      username: { type: 'string', minLength: 3, maxLength: 64, pattern: '^[a-zA-Z0-9._-]+$' },
      displayName: { type: 'string', minLength: 2, maxLength: 120 },
      password: { type: 'string', minLength: 6, maxLength: 128 },
      role: { type: 'string', enum: ['guest', 'admin'], default: 'guest' },
    },
  },
  response: {
    201: { type: 'object', properties: { guest: publicUser } },
    ...errors(400, 401, 403, 409),
  },
}

export const updateGuestSchema = {
  params: uuidParam('id'),
  body: {
    type: 'object',
    properties: {
      displayName: { type: 'string', minLength: 2, maxLength: 120 },
      role: { type: 'string', enum: ['guest', 'admin'] },
    },
  },
  response: {
    200: { type: 'object', properties: { guest: publicUser } },
    ...errors(400, 401, 403, 404, 409),
  },
}

export const deleteGuestSchema = {
  params: uuidParam('id'),
  response: { 204: { type: 'null' }, ...errors(401, 403, 404, 409) },
}

export const resetPasswordSchema = {
  params: uuidParam('id'),
  body: {
    type: 'object',
    required: ['password'],
    properties: { password: { type: 'string', minLength: 6, maxLength: 128 } },
  },
  response: { 204: { type: 'null' }, ...errors(400, 401, 403, 404) },
}

export const listAdminGiftsSchema = {
  response: {
    200: { type: 'object', properties: { gifts: { type: 'array', items: adminGift } } },
    ...errors(401, 403),
  },
}

const giftBody = {
  slug: { type: 'string', minLength: 2, maxLength: 80, pattern: '^[a-z0-9-]+$' },
  name: { type: 'string', minLength: 2, maxLength: 120 },
  description: { type: 'string', maxLength: 2000 },
  priceCents: { type: 'integer', minimum: 0 },
  imageUrl: { type: 'string', maxLength: 500 },
  quantity: { type: 'integer', minimum: 1, maximum: 999 },
  active: { type: 'boolean' },
  sortOrder: { type: 'integer' },
}

export const createGiftSchema = {
  body: {
    type: 'object',
    required: ['slug', 'name', 'priceCents'],
    properties: giftBody,
  },
  response: {
    201: { type: 'object', properties: { gift: giftShape } },
    ...errors(400, 401, 403, 409),
  },
}

export const updateGiftSchema = {
  params: uuidParam('id'),
  body: { type: 'object', properties: giftBody },
  response: {
    200: { type: 'object', properties: { gift: giftShape } },
    ...errors(400, 401, 403, 404, 409),
  },
}

export const deleteGiftSchema = {
  params: uuidParam('id'),
  response: { 204: { type: 'null' }, ...errors(401, 403, 404, 409) },
}

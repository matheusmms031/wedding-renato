import { errors } from './common.schema.js'

const rsvp = {
  type: 'object',
  nullable: true,
  properties: {
    id: { type: 'string' },
    attending: { type: 'boolean' },
    fullName: { type: 'string' },
    message: { type: 'string', nullable: true },
    respondedAt: { type: 'string' },
  },
}

export const getRsvpSchema = {
  response: {
    200: {
      type: 'object',
      properties: { rsvp },
    },
    ...errors(401),
  },
}

export const putRsvpSchema = {
  body: {
    type: 'object',
    required: ['attending', 'fullName'],
    properties: {
      attending: { type: 'boolean' },
      fullName: { type: 'string', minLength: 2, maxLength: 120 },
      message: { type: 'string', maxLength: 500 },
    },
  },
  response: {
    200: { type: 'object', properties: { rsvp } },
    ...errors(400, 401),
  },
}

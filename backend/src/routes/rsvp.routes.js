import * as controller from '../controllers/rsvp.controller.js'
import { getRsvpSchema, putRsvpSchema } from '../schemas/rsvp.schema.js'

export default async function rsvpRoutes(fastify) {
  fastify.addHook('onRequest', fastify.authenticate)

  fastify.get('/', { schema: getRsvpSchema }, controller.show)
  fastify.put('/', { schema: putRsvpSchema }, controller.save)
}

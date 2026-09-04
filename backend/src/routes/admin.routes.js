import * as controller from '../controllers/admin.controller.js'
import {
  createGiftSchema,
  createGuestSchema,
  deleteGiftSchema,
  deleteGuestSchema,
  getSettingsSchema,
  listAdminGiftsSchema,
  listGuestsSchema,
  listRsvpsSchema,
  resetPasswordSchema,
  summarySchema,
  updateGiftSchema,
  updateGuestSchema,
  updateSettingsSchema,
  uploadGiftImageSchema,
} from '../schemas/admin.schema.js'

export default async function adminRoutes(fastify) {
  // authenticate em onRequest (401 antes de qualquer 400 de schema);
  // requireAdmin em preHandler porque depende de request.user já resolvido.
  fastify.addHook('onRequest', fastify.authenticate)
  fastify.addHook('preHandler', fastify.requireAdmin)

  fastify.get('/summary', { schema: summarySchema }, controller.summary)
  fastify.get('/rsvps', { schema: listRsvpsSchema }, controller.listRsvps)

  fastify.get('/guests', { schema: listGuestsSchema }, controller.listGuests)
  fastify.post('/guests', { schema: createGuestSchema }, controller.createGuest)
  fastify.patch('/guests/:id', { schema: updateGuestSchema }, controller.updateGuest)
  fastify.delete('/guests/:id', { schema: deleteGuestSchema }, controller.deleteGuest)
  fastify.post('/guests/:id/password', { schema: resetPasswordSchema }, controller.resetPassword)

  fastify.get('/gifts', { schema: listAdminGiftsSchema }, controller.listGifts)
  fastify.post('/gifts', { schema: createGiftSchema }, controller.createGift)
  fastify.patch('/gifts/:id', { schema: updateGiftSchema }, controller.updateGift)
  fastify.delete('/gifts/:id', { schema: deleteGiftSchema }, controller.deleteGift)

  fastify.post('/gifts/:id/image', { schema: uploadGiftImageSchema }, controller.uploadGiftImage)

  fastify.get('/settings', { schema: getSettingsSchema }, controller.getSettings)
  fastify.put('/settings', { schema: updateSettingsSchema }, controller.updateSettings)
}

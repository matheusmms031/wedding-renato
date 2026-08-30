import adminRoutes from './admin.routes.js'
import authRoutes from './auth.routes.js'
import giftsRoutes from './gifts.routes.js'
import healthRoutes from './health.routes.js'
import rsvpRoutes from './rsvp.routes.js'

export default async function routes(fastify) {
  // Health na raiz (healthcheck do Docker) e sob /api (uso pelo frontend).
  await fastify.register(healthRoutes)

  await fastify.register(
    async (api) => {
      await api.register(healthRoutes)
      await api.register(authRoutes, { prefix: '/auth' })
      await api.register(rsvpRoutes, { prefix: '/rsvp' })
      await api.register(giftsRoutes, { prefix: '/gifts' })
      await api.register(adminRoutes, { prefix: '/admin' })
    },
    { prefix: '/api' },
  )
}

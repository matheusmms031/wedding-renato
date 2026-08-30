import * as controller from '../controllers/auth.controller.js'
import { loginSchema, logoutSchema, sessionSchema } from '../schemas/auth.schema.js'

export default async function authRoutes(fastify) {
  fastify.post(
    '/login',
    {
      schema: loginSchema,
      config: {
        rateLimit: {
          max: fastify.appConfig.loginRateLimitMax,
          timeWindow: '15 minutes',
          keyGenerator: (request) =>
            `${request.ip}:${String(request.body?.username ?? '').toLowerCase()}`,
        },
      },
    },
    controller.login,
  )

  fastify.get(
    '/session',
    { schema: sessionSchema, onRequest: fastify.authenticate },
    controller.session,
  )

  // Sem preHandler: sair sem sessão válida responde 204 do mesmo jeito.
  fastify.post('/logout', { schema: logoutSchema }, controller.logout)
}

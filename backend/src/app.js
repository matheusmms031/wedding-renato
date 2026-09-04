import Fastify from 'fastify'
import { env } from './config/env.js'
import authPlugin from './plugins/auth.js'
import dbPlugin from './plugins/db.js'
import errorHandler from './plugins/error-handler.js'
import securityPlugin from './plugins/security.js'
import uploadsPlugin from './plugins/uploads.js'
import routes from './routes/index.js'

/**
 * Monta a instância do Fastify sem escutar em porta nenhuma.
 * Os testes usam isto com `fastify.inject()` — sem servidor HTTP, sem supertest.
 */
export async function buildApp(options = {}) {
  const fastify = Fastify({
    logger: options.logger ?? { level: env.LOG_LEVEL },
    trustProxy: env.TRUST_PROXY,
    ajv: {
      customOptions: {
        // Impede o cliente de contrabandear campos não declarados (por exemplo
        // `role: "admin"` num corpo de cadastro).
        removeAdditional: 'all',
        coerceTypes: true,
        useDefaults: true,
        allErrors: false,
      },
    },
  })

  fastify.decorate('appConfig', {
    loginRateLimitMax: options.loginRateLimitMax ?? env.RATE_LIMIT_LOGIN_MAX,
  })

  await fastify.register(errorHandler)
  await fastify.register(dbPlugin)
  await fastify.register(securityPlugin)
  await fastify.register(authPlugin)
  await fastify.register(uploadsPlugin)
  await fastify.register(routes)

  return fastify
}

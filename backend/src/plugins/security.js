import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import fp from 'fastify-plugin'
import { env } from '../config/env.js'

async function security(fastify) {
  await fastify.register(helmet, {
    // A API só devolve JSON; a CSP quem entrega é o nginx junto com o HTML.
    contentSecurityPolicy: false,
  })

  // Na prática não há preflight: o frontend chama /api na mesma origem, via
  // proxy do Vite (dev) ou do nginx (prod). Isto atende só o acesso direto à
  // porta da API por alguma ferramenta. Nunca origin:'*' com credentials.
  await fastify.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  })

  await fastify.register(cookie)

  await fastify.register(rateLimit, {
    global: false,
    // O padrão é o hook onRequest, onde o corpo ainda não foi parseado — um
    // keyGenerator baseado em body chavearia tudo como `undefined` e o site
    // inteiro viraria um balde só.
    hook: 'preHandler',
    max: 200,
    timeWindow: '1 minute',
  })
}

export default fp(security, { name: 'security' })

const healthSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        db: { type: 'string' },
      },
    },
    503: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        db: { type: 'string' },
      },
    },
  },
}

export default async function healthRoutes(fastify) {
  fastify.get('/health', { schema: healthSchema }, async (request, reply) => {
    // `db` só existe depois que o plugin de banco é registrado; enquanto o
    // esqueleto não tem banco, o endpoint responde apenas sobre o processo.
    if (!fastify.hasDecorator('db')) {
      return { status: 'ok', db: 'disabled' }
    }

    try {
      await fastify.db.query('SELECT 1')
      return { status: 'ok', db: 'ok' }
    } catch (error) {
      request.log.error({ err: error }, 'healthcheck: banco inacessível')
      return reply.code(503).send({ status: 'degraded', db: 'down' })
    }
  })
}

import fp from 'fastify-plugin'
import { AppError } from '../lib/errors.js'

function body(code, message, details) {
  return { error: details === undefined ? { code, message } : { code, message, details } }
}

async function errorHandler(fastify) {
  fastify.setNotFoundHandler((request, reply) => {
    reply.code(404).send(body('ROUTE_NOT_FOUND', 'Rota não encontrada.'))
  })

  fastify.setErrorHandler((error, request, reply) => {
    // Falha de JSON Schema (Ajv) — o Fastify anexa `validation`.
    if (error.validation) {
      request.log.info({ err: error }, 'falha de validação')
      return reply
        .code(400)
        .send(body('VALIDATION_ERROR', 'Verifique os dados enviados e tente novamente.'))
    }

    if (error instanceof AppError) {
      request.log.info({ code: error.code }, error.message)
      return reply.code(error.statusCode).send(body(error.code, error.message, error.details))
    }

    if (error.statusCode === 429) {
      return reply
        .code(429)
        .send(
          body(
            'RATE_LIMITED',
            'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.',
          ),
        )
    }

    // Erros do próprio Fastify que já trazem status (corpo vazio, payload grande…).
    if (error.statusCode && error.statusCode < 500) {
      request.log.info({ err: error }, 'erro de cliente')
      return reply
        .code(error.statusCode)
        .send(body(error.code ?? 'BAD_REQUEST', 'Requisição inválida.'))
    }

    // Qualquer outra coisa é bug nosso: loga o real, devolve genérico.
    request.log.error({ err: error }, 'erro não tratado')
    return reply
      .code(500)
      .send(body('INTERNAL_ERROR', 'Algo deu errado do nosso lado. Tente novamente em instantes.'))
  })
}

export default fp(errorHandler, { name: 'error-handler' })

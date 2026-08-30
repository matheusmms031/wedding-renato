import { buildApp } from './app.js'
import { env } from './config/env.js'

const app = await buildApp()

// `0.0.0.0` é obrigatório: o padrão do Fastify é 127.0.0.1, o que deixa o
// container inalcançável de fora e parece bug de rede.
await app.listen({ host: env.HOST, port: env.PORT })

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, async () => {
    app.log.info(`${signal} recebido, encerrando…`)
    try {
      await app.close()
      process.exit(0)
    } catch (error) {
      app.log.error({ err: error }, 'falha ao encerrar')
      process.exit(1)
    }
  })
}

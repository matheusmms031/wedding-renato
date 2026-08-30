import fp from 'fastify-plugin'
import { models, sequelize } from '../db/index.js'
import { purgeExpired } from '../services/session.service.js'

const SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000

async function dbPlugin(fastify) {
  await sequelize.authenticate()

  fastify.decorate('db', sequelize)
  fastify.decorate('models', models)

  // Varredura periódica de sessões vencidas — sem container de cron. O clear no
  // onClose é obrigatório: senão o handle aberto trava a suíte de testes.
  const sweeper = setInterval(() => {
    purgeExpired(models).catch((err) =>
      fastify.log.error({ err }, 'falha ao limpar sessões vencidas'),
    )
  }, SWEEP_INTERVAL_MS)
  sweeper.unref?.()

  fastify.addHook('onClose', async () => {
    clearInterval(sweeper)
    await sequelize.close()
  })
}

export default fp(dbPlugin, { name: 'db' })

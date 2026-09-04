import fs from 'node:fs/promises'
import path from 'node:path'
import multipart from '@fastify/multipart'
import fp from 'fastify-plugin'
import { env } from '../config/env.js'

const LIMITE_BYTES = 5 * 1024 * 1024

async function uploadsPlugin(fastify) {
  const uploadsDir = path.resolve(env.UPLOADS_DIR)
  await fs.mkdir(uploadsDir, { recursive: true })

  await fastify.register(multipart, {
    limits: { fileSize: LIMITE_BYTES, files: 1 },
  })

  fastify.decorate('uploadsDir', uploadsDir)
}

export default fp(uploadsPlugin, { name: 'uploads' })

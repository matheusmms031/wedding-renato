import { createHash, randomBytes } from 'node:crypto'

/** Token opaco de 256 bits. Só o navegador vê este valor. */
export function createToken() {
  return randomBytes(32).toString('base64url')
}

/** O que vai para o banco. Um dump não entrega sessões vivas. */
export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

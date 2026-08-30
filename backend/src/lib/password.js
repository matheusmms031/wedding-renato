import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'

// Hash descartável usado para equalizar o tempo de resposta quando o usuário não
// existe — sem isso, "usuário inexistente" responde bem mais rápido que "senha
// errada" e vira um oráculo de enumeração de convidados.
const DUMMY_HASH = bcrypt.hashSync('senha-inexistente', 10)

export function hashPassword(plain) {
  return bcrypt.hash(plain, env.BCRYPT_ROUNDS)
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash ?? DUMMY_HASH)
}

export function burnTime() {
  return bcrypt.compare('senha-inexistente', DUMMY_HASH)
}

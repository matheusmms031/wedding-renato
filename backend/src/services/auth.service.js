import { AppError } from '../lib/errors.js'
import { burnTime, verifyPassword } from '../lib/password.js'

const INVALID = () =>
  new AppError(401, 'INVALID_CREDENTIALS', 'Usuário ou senha inválidos. Confira e tente de novo.')

/**
 * Valida credenciais e devolve o usuário. Não cria sessão nem toca em cookie —
 * isso é responsabilidade do controller.
 */
export async function authenticate(models, { username, password }) {
  const normalized = String(username).trim().toLowerCase()

  const user = await models.User.scope('withPassword').findOne({ where: { username: normalized } })

  if (!user) {
    // Gasta o mesmo tempo de um bcrypt real para não denunciar que o usuário não existe.
    await burnTime()
    throw INVALID()
  }

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) throw INVALID()

  return user
}

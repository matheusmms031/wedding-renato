import { errors, publicUser } from './common.schema.js'

export const loginSchema = {
  body: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: { type: 'string', minLength: 3, maxLength: 64 },
      password: { type: 'string', minLength: 1, maxLength: 128 },
    },
  },
  response: {
    // O schema de resposta é controle de segurança, não só performance: com ele
    // é estruturalmente impossível serializar passwordHash.
    200: { type: 'object', properties: { user: publicUser } },
    ...errors(400, 401, 429),
  },
}

export const sessionSchema = {
  response: {
    200: { type: 'object', properties: { user: publicUser } },
    ...errors(401),
  },
}

export const logoutSchema = {
  response: {
    204: { type: 'null' },
  },
}

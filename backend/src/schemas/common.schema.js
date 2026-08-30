export const errorResponse = {
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: { type: 'object', additionalProperties: true },
      },
    },
  },
}

export const publicUser = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    username: { type: 'string' },
    displayName: { type: 'string' },
    role: { type: 'string' },
  },
}

export const uuidParam = (name) => ({
  type: 'object',
  required: [name],
  properties: { [name]: { type: 'string', format: 'uuid' } },
})

/** Atalho para respostas de erro. Nunca declare 2xx sem schema. */
export const errors = (...codes) =>
  Object.fromEntries(codes.map((code) => [code, errorResponse]))

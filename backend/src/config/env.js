import { config as loadDotenv } from 'dotenv'

// Fora do container existe um backend/.env; dentro, as variáveis vêm do compose
// e este arquivo não existe — dotenv então é um no-op inofensivo.
loadDotenv()

function required(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Variável de ambiente obrigatória ausente: ${name}. ` +
        'Copie backend/.env.example para backend/.env ou defina no docker compose.',
    )
  }
  return value
}

function int(name, fallback) {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  const value = Number(raw)
  if (!Number.isInteger(value)) {
    throw new Error(`Variável de ambiente ${name} precisa ser um inteiro, recebeu "${raw}".`)
  }
  return value
}

function bool(name, fallback) {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  return raw === 'true' || raw === '1'
}

const nodeEnv = process.env.NODE_ENV ?? 'development'
const isTest = nodeEnv === 'test'

export const env = Object.freeze({
  NODE_ENV: nodeEnv,
  IS_PRODUCTION: nodeEnv === 'production',
  IS_TEST: isTest,

  PORT: int('PORT', 3001),
  HOST: process.env.HOST ?? '0.0.0.0',
  LOG_LEVEL: process.env.LOG_LEVEL ?? (isTest ? 'silent' : 'info'),

  DB_HOST: process.env.DB_HOST ?? 'localhost',
  DB_PORT: int('DB_PORT', 5432),
  DB_USER: required('DB_USER'),
  DB_PASSWORD: required('DB_PASSWORD'),
  DB_NAME: isTest ? (process.env.DB_NAME_TEST ?? 'wedding_test') : required('DB_NAME'),

  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME ?? 'rm_session',
  SESSION_TTL_DAYS: int('SESSION_TTL_DAYS', 30),
  COOKIE_SECURE: bool('COOKIE_SECURE', false),
  BCRYPT_ROUNDS: int('BCRYPT_ROUNDS', 12),
  RATE_LIMIT_LOGIN_MAX: int('RATE_LIMIT_LOGIN_MAX', 5),

  CORS_ORIGIN: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  TRUST_PROXY: bool('TRUST_PROXY', false),
})

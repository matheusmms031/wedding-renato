/**
 * Importa src/seeds/guests.json para a tabela `users`, inserindo apenas quem
 * ainda não existe.
 *
 * Existe porque o seeder não serve para isso: com `seederStorage: 'sequelize'`
 * ele roda uma única vez por banco e é pulado dali em diante — ótimo para não
 * duplicar presentes a cada start, inútil para acrescentar um convidado novo.
 *
 * Idempotente: rodar duas vezes seguidas não muda nada. Nunca altera quem já
 * está no banco, então trocar a senha de alguém no JSON não tem efeito aqui —
 * apague o usuário antes, ou mude a senha pelo caminho normal da aplicação.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { models, sequelize } from '../src/db/index.js'
import { hashPassword } from '../src/lib/password.js'

// Em desenvolvimento o sequelize loga todo SQL — aqui isso jogaria hash de
// senha no stdout e afogaria o resumo do import.
sequelize.options.logging = false

const HERE = path.dirname(fileURLToPath(import.meta.url))
const GUESTS = path.resolve(HERE, '..', 'src', 'seeds', 'guests.json')

function loadGuests() {
  if (!fs.existsSync(GUESTS)) {
    throw new Error(
      `Lista de convidados não encontrada em ${GUESTS}. ` +
        'Ela fica fora do git; copie src/seeds/guests.example.json e preencha.',
    )
  }
  const guests = JSON.parse(fs.readFileSync(GUESTS, 'utf8'))

  const seen = new Set()
  return guests.map((guest) => {
    const username = String(guest.username).trim().toLowerCase()
    if (seen.has(username)) throw new Error(`username duplicado no JSON: ${username}`)
    if (!guest.displayName) throw new Error(`convidado sem displayName: ${username}`)
    if (!guest.password) throw new Error(`convidado sem password: ${username}`)
    seen.add(username)
    return { ...guest, username }
  })
}

const guests = loadGuests()

const existing = new Set(
  (await models.User.findAll({ attributes: ['username'], raw: true })).map((u) => u.username),
)
const novos = guests.filter((guest) => !existing.has(guest.username))

if (novos.length > 0) {
  const rows = await Promise.all(
    novos.map(async (guest) => ({
      username: guest.username,
      displayName: guest.displayName,
      passwordHash: await hashPassword(guest.password),
      role: guest.role === 'admin' ? 'admin' : 'guest',
    })),
  )
  // ignoreDuplicates = ON CONFLICT DO NOTHING: protege contra duas execuções
  // simultâneas, já que a checagem acima não é atômica.
  await models.User.bulkCreate(rows, { ignoreDuplicates: true })
}

console.log(`inseridos: ${novos.length}`)
console.log(`já existiam: ${guests.length - novos.length}`)
for (const guest of novos) console.log(`  + ${guest.username} (${guest.displayName})`)

// Quem está no banco mas saiu da lista: normalmente sobra de seed de exemplo.
// Só avisa — apagar usuário derruba RSVP e presentes junto, não é para ser
// efeito colateral de um import.
const orfaos = [...existing].filter((u) => !guests.some((g) => g.username === u))
if (orfaos.length > 0) {
  console.log(`\naviso: ${orfaos.length} usuário(s) no banco fora de guests.json: ${orfaos.join(', ')}`)
}

await sequelize.close()

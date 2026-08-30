'use strict'

const fs = require('node:fs')
const path = require('node:path')
const bcrypt = require('bcryptjs')

const REAL = path.resolve(__dirname, '..', 'src', 'seeds', 'guests.json')
const EXAMPLE = path.resolve(__dirname, '..', 'src', 'seeds', 'guests.example.json')

function loadGuests() {
  // guests.json (lista real, fora do git) tem precedência; sem ele, o exemplo.
  const file = fs.existsSync(REAL) ? REAL : EXAMPLE
  if (file === EXAMPLE) {
    console.warn(
      '[seed] src/seeds/guests.json não encontrado — usando guests.example.json. ' +
        'Crie o arquivo real antes de usar em produção.',
    )
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

module.exports = {
  async up(queryInterface) {
    const rounds = Number(process.env.BCRYPT_ROUNDS || 12)
    const now = new Date()

    const rows = loadGuests().map((guest) => ({
      username: String(guest.username).trim().toLowerCase(),
      display_name: guest.displayName,
      password_hash: bcrypt.hashSync(guest.password, rounds),
      role: guest.role === 'admin' ? 'admin' : 'guest',
      created_at: now,
      updated_at: now,
    }))

    // ignoreDuplicates vira ON CONFLICT DO NOTHING: cinto e suspensório junto
    // com o seederStorage, caso o seeder seja reexecutado à força.
    await queryInterface.bulkInsert('users', rows, { ignoreDuplicates: true })
  },

  async down(queryInterface) {
    const usernames = loadGuests().map((g) => String(g.username).trim().toLowerCase())
    await queryInterface.bulkDelete('users', { username: usernames })
  },
}

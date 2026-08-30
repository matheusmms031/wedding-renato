'use strict'

// Config exclusiva do sequelize-cli (CommonJS). O runtime da aplicação NÃO lê
// este arquivo — src/config/env.js lê process.env por conta própria. Mesmas
// variáveis, dois consumidores, nenhum import cruzando ESM e CJS.
require('dotenv').config()

const base = {
  dialect: 'postgres',
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  logging: false,
  define: { underscored: true, timestamps: true },

  // Obrigatório: o padrão é 'none', o que faz db:seed:all rerodar o seed inteiro
  // a cada chamada — e o entrypoint de produção o chama a cada start.
  seederStorage: 'sequelize',
  seederStorageTableName: 'sequelize_seeds',
}

module.exports = {
  development: { ...base },
  test: { ...base, database: process.env.DB_NAME_TEST || 'wedding_test' },
  production: { ...base },
}

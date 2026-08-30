'use strict'

const { Op } = require('sequelize')

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        // Nativo no PG 13+, não precisa da extensão pgcrypto.
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      username: { type: Sequelize.STRING(64), allowNull: false, unique: true },
      display_name: { type: Sequelize.STRING(120), allowNull: false },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role: { type: Sequelize.STRING(16), allowNull: false, defaultValue: 'guest' },
      max_guests: { type: Sequelize.SMALLINT, allowNull: false, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    })

    // VARCHAR + CHECK em vez de ENUM nativo: acrescentar um valor novo é um
    // ALTER TABLE, e não a dança de ALTER TYPE que o enum do Postgres exige.
    await queryInterface.addConstraint('users', {
      fields: ['role'],
      type: 'check',
      name: 'users_role_ck',
      where: { role: ['guest', 'admin'] },
    })

    await queryInterface.addConstraint('users', {
      fields: ['max_guests'],
      type: 'check',
      name: 'users_max_guests_ck',
      where: { max_guests: { [Op.gte]: 1 } },
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users')
  },
}

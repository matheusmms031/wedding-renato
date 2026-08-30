'use strict'

const { Op } = require('sequelize')

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rsvps', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      // UNIQUE: um RSVP por convite. O convidado edita a própria resposta.
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      attending: { type: Sequelize.BOOLEAN, allowNull: false },
      party_size: { type: Sequelize.SMALLINT, allowNull: false, defaultValue: 1 },
      full_name: { type: Sequelize.STRING(120), allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: true },
      responded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('now()'),
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    })

    // O teto por convite (users.max_guests) é validado no service: um CHECK não
    // enxerga outra tabela. Aqui só se garante o piso.
    await queryInterface.addConstraint('rsvps', {
      fields: ['party_size'],
      type: 'check',
      name: 'rsvps_party_size_ck',
      where: { party_size: { [Op.gte]: 0 } },
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('rsvps')
  },
}

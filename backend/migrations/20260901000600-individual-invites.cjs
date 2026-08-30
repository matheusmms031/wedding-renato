'use strict'

const { Op } = require('sequelize')

/**
 * Convite individual: cada login é uma pessoa e vale por um lugar.
 *
 * Com isso `users.max_guests` e `rsvps.party_size` deixam de significar algo —
 * o número de pessoas confirmadas passa a ser a contagem de RSVPs com
 * `attending = true`. Colunas mortas confundem mais do que uma migration.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeConstraint('rsvps', 'rsvps_party_size_ck')
    await queryInterface.removeColumn('rsvps', 'party_size')

    await queryInterface.removeConstraint('users', 'users_max_guests_ck')
    await queryInterface.removeColumn('users', 'max_guests')
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'max_guests', {
      type: Sequelize.SMALLINT,
      allowNull: false,
      defaultValue: 1,
    })
    await queryInterface.addConstraint('users', {
      fields: ['max_guests'],
      type: 'check',
      name: 'users_max_guests_ck',
      where: { max_guests: { [Op.gte]: 1 } },
    })

    await queryInterface.addColumn('rsvps', 'party_size', {
      type: Sequelize.SMALLINT,
      allowNull: false,
      defaultValue: 1,
    })
    await queryInterface.addConstraint('rsvps', {
      fields: ['party_size'],
      type: 'check',
      name: 'rsvps_party_size_ck',
      where: { party_size: { [Op.gte]: 0 } },
    })
  },
}

'use strict'

const { Op } = require('sequelize')

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('gifts', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      slug: { type: Sequelize.STRING(80), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(120), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
      // Dinheiro é inteiro em centavos, nunca float.
      price_cents: { type: Sequelize.INTEGER, allowNull: false },
      image_url: { type: Sequelize.STRING(500), allowNull: true },
      // Controla a exclusividade: 1 = item único; cotas recebem valores maiores.
      quantity: { type: Sequelize.SMALLINT, allowNull: false, defaultValue: 1 },
      active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    })

    await queryInterface.addConstraint('gifts', {
      fields: ['price_cents'],
      type: 'check',
      name: 'gifts_price_cents_ck',
      where: { price_cents: { [Op.gte]: 0 } },
    })

    await queryInterface.addConstraint('gifts', {
      fields: ['quantity'],
      type: 'check',
      name: 'gifts_quantity_ck',
      where: { quantity: { [Op.gte]: 1 } },
    })

    await queryInterface.addIndex('gifts', ['sort_order'], { name: 'gifts_sort_order_idx' })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('gifts')
  },
}

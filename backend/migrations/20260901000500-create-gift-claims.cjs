'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('gift_claims', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      gift_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'gifts', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      note: { type: Sequelize.STRING(280), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    })

    // Última linha de defesa contra o botão clicado duas vezes. A corrida entre
    // convidados distintos é resolvida por transação com lock em gift.service.js.
    await queryInterface.addConstraint('gift_claims', {
      fields: ['gift_id', 'user_id'],
      type: 'unique',
      name: 'gift_claims_gift_user_uk',
    })

    await queryInterface.addIndex('gift_claims', ['user_id'], { name: 'gift_claims_user_id_idx' })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('gift_claims')
  },
}

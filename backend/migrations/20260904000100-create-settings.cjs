'use strict'

/**
 * Configurações do site em chave-valor.
 *
 * Chave-valor e não colunas tipadas porque é o único formato em que a próxima
 * configuração não custa uma migration — e este site ainda vai receber ajustes
 * até dezembro.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('settings', {
      key: { type: Sequelize.STRING(64), primaryKey: true, allowNull: false },
      value: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('settings')
  },
}

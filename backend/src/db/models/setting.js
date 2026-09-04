export default function defineSetting(sequelize, DataTypes) {
  return sequelize.define(
    'Setting',
    {
      key: { type: DataTypes.STRING(64), primaryKey: true, allowNull: false },
      value: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    },
    { tableName: 'settings' },
  )
}

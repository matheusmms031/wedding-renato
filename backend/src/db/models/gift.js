export default function defineGift(sequelize, DataTypes) {
  return sequelize.define(
    'Gift',
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      slug: { type: DataTypes.STRING(80), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
      priceCents: { type: DataTypes.INTEGER, allowNull: false },
      imageUrl: { type: DataTypes.STRING(500), allowNull: true },
      quantity: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 1 },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: 'gifts' },
  )
}

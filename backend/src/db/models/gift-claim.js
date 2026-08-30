export default function defineGiftClaim(sequelize, DataTypes) {
  return sequelize.define(
    'GiftClaim',
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      giftId: { type: DataTypes.UUID, allowNull: false },
      userId: { type: DataTypes.UUID, allowNull: false },
      note: { type: DataTypes.STRING(280), allowNull: true },
    },
    {
      tableName: 'gift_claims',
      indexes: [{ unique: true, fields: ['gift_id', 'user_id'] }],
    },
  )
}

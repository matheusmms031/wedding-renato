export default function defineRsvp(sequelize, DataTypes) {
  return sequelize.define(
    'Rsvp',
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      userId: { type: DataTypes.UUID, allowNull: false, unique: true },
      attending: { type: DataTypes.BOOLEAN, allowNull: false },
      fullName: { type: DataTypes.STRING(120), allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: true },
      respondedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'rsvps' },
  )
}

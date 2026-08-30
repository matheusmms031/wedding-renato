export default function defineSession(sequelize, DataTypes) {
  return sequelize.define(
    'Session',
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      userId: { type: DataTypes.UUID, allowNull: false },
      tokenHash: { type: DataTypes.CHAR(64), allowNull: false, unique: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      lastSeenAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      userAgent: { type: DataTypes.STRING(255), allowNull: true },
      ip: { type: DataTypes.STRING(45), allowNull: true },
    },
    { tableName: 'sessions' },
  )
}

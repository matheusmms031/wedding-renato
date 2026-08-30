export default function defineUser(sequelize, DataTypes) {
  return sequelize.define(
    'User',
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      username: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      displayName: { type: DataTypes.STRING(120), allowNull: false },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false },
      role: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'guest' },
    },
    {
      tableName: 'users',
      // `passwordHash` fica fora de toda consulta por padrão. Os schemas de
      // resposta já impedem que vaze, mas isto evita até carregá-lo à toa.
      defaultScope: { attributes: { exclude: ['passwordHash'] } },
      scopes: { withPassword: { attributes: { include: ['passwordHash'] } } },
    },
  )
}

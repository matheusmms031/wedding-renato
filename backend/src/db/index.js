import { DataTypes, Sequelize } from 'sequelize'
import { env } from '../config/env.js'
import defineGiftClaim from './models/gift-claim.js'
import defineGift from './models/gift.js'
import defineRsvp from './models/rsvp.js'
import defineSession from './models/session.js'
import defineUser from './models/user.js'

// Objeto vazio quando DB_SSL=false: o driver então nem tenta negociar TLS,
// que é o que o Postgres do docker compose espera.
export const dialectOptions = env.DB_SSL
  ? { ssl: { require: true, rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED } }
  : {}

export const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'postgres',
  dialectOptions,
  logging: env.NODE_ENV === 'development' ? (sql) => console.debug(sql) : false,
  define: { underscored: true, timestamps: true },
  pool: { max: 10, min: 0, idle: 10_000, acquire: 30_000 },
})

const User = defineUser(sequelize, DataTypes)
const Session = defineSession(sequelize, DataTypes)
const Rsvp = defineRsvp(sequelize, DataTypes)
const Gift = defineGift(sequelize, DataTypes)
const GiftClaim = defineGiftClaim(sequelize, DataTypes)

User.hasMany(Session, { foreignKey: 'userId', as: 'sessions', onDelete: 'CASCADE' })
Session.belongsTo(User, { foreignKey: 'userId', as: 'user' })

User.hasOne(Rsvp, { foreignKey: 'userId', as: 'rsvp', onDelete: 'CASCADE' })
Rsvp.belongsTo(User, { foreignKey: 'userId', as: 'user' })

User.hasMany(GiftClaim, { foreignKey: 'userId', as: 'giftClaims', onDelete: 'CASCADE' })
GiftClaim.belongsTo(User, { foreignKey: 'userId', as: 'user' })

Gift.hasMany(GiftClaim, { foreignKey: 'giftId', as: 'claims', onDelete: 'CASCADE' })
GiftClaim.belongsTo(Gift, { foreignKey: 'giftId', as: 'gift' })

// O schema vem exclusivamente das migrations — sequelize.sync() nunca é chamado.
export const models = { User, Session, Rsvp, Gift, GiftClaim }

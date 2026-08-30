import { UniqueConstraintError } from 'sequelize'
import { conflict, notFound } from '../lib/errors.js'

export async function list(models, userId) {
  const gifts = await models.Gift.findAll({
    where: { active: true },
    order: [
      ['sortOrder', 'ASC'],
      ['name', 'ASC'],
    ],
    include: [{ model: models.GiftClaim, as: 'claims', attributes: ['userId'] }],
  })

  return gifts.map((gift) => ({
    gift,
    claimedCount: gift.claims.length,
    claimedByMe: gift.claims.some((claim) => claim.userId === userId),
  }))
}

/**
 * Reserva um presente.
 *
 * Contar e então inserir é corrida: dois convidados leem count=0 e ambos
 * inserem. O lock de linha no `gifts` serializa as reservas concorrentes do
 * mesmo presente. Não troque por um count solto.
 */
export async function claim(sequelize, models, { giftId, userId, note }) {
  try {
    return await sequelize.transaction(async (transaction) => {
      const gift = await models.Gift.findByPk(giftId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      })

      if (!gift || !gift.active) {
        throw notFound('GIFT_NOT_FOUND', 'Este presente não está mais disponível.')
      }

      const taken = await models.GiftClaim.count({ where: { giftId }, transaction })
      if (taken >= gift.quantity) {
        throw conflict('GIFT_UNAVAILABLE', 'Alguém escolheu este presente antes de você.')
      }

      const created = await models.GiftClaim.create(
        { giftId, userId, note: note?.trim() || null },
        { transaction },
      )

      return { claim: created, gift, claimedCount: taken + 1 }
    })
  } catch (error) {
    // Caminho da constraint única: o mesmo convidado clicou duas vezes.
    if (error instanceof UniqueConstraintError) {
      throw conflict('ALREADY_CLAIMED', 'Você já escolheu este presente.')
    }
    throw error
  }
}

export async function unclaim(models, { giftId, userId }) {
  const removed = await models.GiftClaim.destroy({ where: { giftId, userId } })
  if (removed === 0) {
    throw notFound('CLAIM_NOT_FOUND', 'Você não havia escolhido este presente.')
  }
}

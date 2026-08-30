export async function findForUser(models, user) {
  return models.Rsvp.findOne({ where: { userId: user.id } })
}

/**
 * Grava a resposta do convite. O convite é individual e vale por um lugar, então
 * a resposta é só sim ou não. Um RSVP por pessoa: chamar duas vezes atualiza a
 * mesma linha em vez de criar outra.
 */
export async function upsert(models, user, payload) {
  const values = {
    attending: payload.attending,
    fullName: payload.fullName.trim(),
    message: payload.message?.trim() || null,
    respondedAt: new Date(),
  }

  const existing = await models.Rsvp.findOne({ where: { userId: user.id } })
  if (existing) {
    return existing.update(values)
  }

  return models.Rsvp.create({ ...values, userId: user.id })
}

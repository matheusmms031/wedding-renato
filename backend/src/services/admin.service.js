import { conflict, notFound } from '../lib/errors.js'
import { hashPassword } from '../lib/password.js'
import { destroyAllForUser } from './session.service.js'
import { apagarImagem } from './upload.service.js'

// ---------- Resumo ----------

export async function summary(models) {
  const [totalUsers, responded, attending, declined] = await Promise.all([
    models.User.count(),
    models.Rsvp.count(),
    models.Rsvp.count({ where: { attending: true } }),
    models.Rsvp.count({ where: { attending: false } }),
  ])

  return {
    totalUsers,
    responded,
    pending: totalUsers - responded,
    attending,
    declined,
  }
}

// ---------- Confirmações ----------

export async function listRsvps(models, { attending } = {}) {
  const where = attending === undefined ? {} : { attending }

  return models.Rsvp.findAll({
    where,
    order: [['respondedAt', 'DESC']],
    include: [{ model: models.User, as: 'user', attributes: ['username', 'displayName'] }],
  })
}

// ---------- Convidados ----------

export async function listGuests(models) {
  return models.User.findAll({
    order: [['displayName', 'ASC']],
    include: [{ model: models.Rsvp, as: 'rsvp', attributes: ['attending'] }],
  })
}

export async function createGuest(models, payload) {
  const username = payload.username.trim().toLowerCase()

  const existing = await models.User.findOne({ where: { username } })
  if (existing) {
    throw conflict('USERNAME_TAKEN', `O usuário "${username}" já existe.`)
  }

  return models.User.create({
    username,
    displayName: payload.displayName.trim(),
    passwordHash: await hashPassword(payload.password),
    role: payload.role ?? 'guest',
  })
}

async function findGuest(models, id) {
  const guest = await models.User.findByPk(id)
  if (!guest) throw notFound('GUEST_NOT_FOUND', 'Convidado não encontrado.')
  return guest
}

/** Impede que os noivos se tranquem para fora removendo ou rebaixando o último admin. */
async function assertNotLastAdmin(models, guest) {
  if (guest.role !== 'admin') return
  const admins = await models.User.count({ where: { role: 'admin' } })
  if (admins <= 1) {
    throw conflict('LAST_ADMIN', 'Este é o único administrador — promova outro antes.')
  }
}

export async function updateGuest(models, id, payload, actingUserId) {
  const guest = await findGuest(models, id)

  const demoting = payload.role !== undefined && payload.role !== 'admin'
  if (demoting) {
    if (guest.id === actingUserId) {
      throw conflict('LAST_ADMIN', 'Você não pode remover o próprio acesso de administrador.')
    }
    await assertNotLastAdmin(models, guest)
  }

  if (payload.displayName !== undefined) guest.displayName = payload.displayName.trim()
  if (payload.role !== undefined) guest.role = payload.role

  return guest.save()
}

export async function deleteGuest(models, id, actingUserId) {
  if (id === actingUserId) {
    throw conflict('LAST_ADMIN', 'Você não pode excluir a própria conta.')
  }

  const guest = await findGuest(models, id)
  await assertNotLastAdmin(models, guest)

  // As FKs em cascata levam junto sessões, RSVP e escolhas de presente.
  await guest.destroy()
}

export async function resetGuestPassword(models, id, password) {
  const guest = await findGuest(models, id)
  guest.passwordHash = await hashPassword(password)
  await guest.save()

  // Senha trocada derruba todas as sessões abertas daquele convidado.
  await destroyAllForUser(models, guest.id)
}

// ---------- Presentes ----------

export async function listGiftsWithClaims(models) {
  return models.Gift.findAll({
    order: [
      ['sortOrder', 'ASC'],
      ['name', 'ASC'],
    ],
    include: [
      {
        model: models.GiftClaim,
        as: 'claims',
        include: [{ model: models.User, as: 'user', attributes: ['username', 'displayName'] }],
      },
    ],
  })
}

export async function createGift(models, payload) {
  const slug = payload.slug.trim().toLowerCase()

  const existing = await models.Gift.findOne({ where: { slug } })
  if (existing) throw conflict('SLUG_TAKEN', `Já existe um presente com o identificador "${slug}".`)

  return models.Gift.create({ ...payload, slug })
}

export async function updateGift(models, id, payload) {
  const gift = await models.Gift.findByPk(id)
  if (!gift) throw notFound('GIFT_NOT_FOUND', 'Presente não encontrado.')

  // Reduzir a quantidade abaixo do que já foi escolhido deixaria o catálogo mentiroso.
  if (payload.quantity !== undefined) {
    const taken = await models.GiftClaim.count({ where: { giftId: id } })
    if (payload.quantity < taken) {
      throw conflict(
        'QUANTITY_BELOW_CLAIMS',
        `Este presente já foi escolhido ${taken} vez(es); a quantidade não pode ser menor.`,
        { claimed: taken },
      )
    }
  }

  return gift.update(payload)
}

export async function deleteGift(models, id, uploadsDir) {
  const gift = await models.Gift.findByPk(id)
  if (!gift) throw notFound('GIFT_NOT_FOUND', 'Presente não encontrado.')

  const taken = await models.GiftClaim.count({ where: { giftId: id } })
  if (taken > 0) {
    throw conflict(
      'GIFT_HAS_CLAIMS',
      'Este presente já foi escolhido por alguém. Desative-o em vez de excluir.',
      { claimed: taken },
    )
  }

  const imagem = gift.imageUrl
  await gift.destroy()
  // Sem isto o arquivo fica órfão no volume para sempre.
  await apagarImagem(uploadsDir, imagem)
}

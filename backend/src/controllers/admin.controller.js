import { toPublicGift, toPublicUser } from '../lib/serializers.js'
import * as adminService from '../services/admin.service.js'
import * as settingsService from '../services/settings.service.js'

const iso = (value) => (value instanceof Date ? value.toISOString() : value)

export async function summary(request) {
  return adminService.summary(request.server.models)
}

export async function listRsvps(request) {
  const rows = await adminService.listRsvps(request.server.models, {
    attending: request.query.attending,
  })

  return {
    rsvps: rows.map((row) => ({
      id: row.id,
      attending: row.attending,
      fullName: row.fullName,
      message: row.message ?? null,
      respondedAt: iso(row.respondedAt),
      username: row.user.username,
      displayName: row.user.displayName,
    })),
  }
}

export async function listGuests(request) {
  const rows = await adminService.listGuests(request.server.models)

  return {
    guests: rows.map((row) => ({
      ...toPublicUser(row),
      rsvpStatus: row.rsvp ? (row.rsvp.attending ? 'confirmado' : 'recusado') : 'sem resposta',
    })),
  }
}

export async function createGuest(request, reply) {
  const guest = await adminService.createGuest(request.server.models, request.body)
  return reply.code(201).send({ guest: toPublicUser(guest) })
}

export async function updateGuest(request) {
  const guest = await adminService.updateGuest(
    request.server.models,
    request.params.id,
    request.body,
    request.user.id,
  )
  return { guest: toPublicUser(guest) }
}

export async function deleteGuest(request, reply) {
  await adminService.deleteGuest(request.server.models, request.params.id, request.user.id)
  return reply.code(204).send()
}

export async function resetPassword(request, reply) {
  await adminService.resetGuestPassword(
    request.server.models,
    request.params.id,
    request.body.password,
  )
  return reply.code(204).send()
}

export async function listGifts(request) {
  const rows = await adminService.listGiftsWithClaims(request.server.models)

  return {
    gifts: rows.map((gift) => ({
      ...toPublicGift(gift, { claimedCount: gift.claims.length, claimedByMe: false }),
      claims: gift.claims.map((claim) => ({
        username: claim.user.username,
        displayName: claim.user.displayName,
        note: claim.note ?? null,
        createdAt: iso(claim.createdAt),
      })),
    })),
  }
}

export async function createGift(request, reply) {
  const gift = await adminService.createGift(request.server.models, request.body)
  return reply.code(201).send({ gift: toPublicGift(gift) })
}

export async function updateGift(request) {
  const gift = await adminService.updateGift(
    request.server.models,
    request.params.id,
    request.body,
  )
  return { gift: toPublicGift(gift) }
}

export async function deleteGift(request, reply) {
  await adminService.deleteGift(request.server.models, request.params.id)
  return reply.code(204).send()
}

export async function getSettings(request) {
  return { settings: await settingsService.obterConfigPix(request.server.models) }
}

export async function updateSettings(request) {
  return { settings: await settingsService.salvar(request.server.models, request.body) }
}

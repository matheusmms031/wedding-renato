import { toPublicRsvp } from '../lib/serializers.js'
import * as rsvpService from '../services/rsvp.service.js'

export async function show(request) {
  const rsvp = await rsvpService.findForUser(request.server.models, request.user)
  return { rsvp: toPublicRsvp(rsvp) }
}

export async function save(request) {
  const rsvp = await rsvpService.upsert(request.server.models, request.user, request.body)
  return { rsvp: toPublicRsvp(rsvp) }
}

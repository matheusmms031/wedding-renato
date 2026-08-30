export function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  }
}

export function toPublicRsvp(rsvp) {
  if (!rsvp) return null
  return {
    id: rsvp.id,
    attending: rsvp.attending,
    fullName: rsvp.fullName,
    message: rsvp.message ?? null,
    respondedAt: rsvp.respondedAt instanceof Date ? rsvp.respondedAt.toISOString() : rsvp.respondedAt,
  }
}

export function toPublicGift(gift, { claimedCount = 0, claimedByMe = false } = {}) {
  return {
    id: gift.id,
    slug: gift.slug,
    name: gift.name,
    description: gift.description,
    priceCents: gift.priceCents,
    imageUrl: gift.imageUrl ?? null,
    quantity: gift.quantity,
    active: gift.active,
    sortOrder: gift.sortOrder,
    claimedCount,
    available: claimedCount < gift.quantity,
    claimedByMe,
  }
}

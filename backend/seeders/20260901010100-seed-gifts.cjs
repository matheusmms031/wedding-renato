'use strict'

const gifts = require('../src/seeds/gifts.json')

module.exports = {
  async up(queryInterface) {
    const now = new Date()

    const rows = gifts.map((gift) => ({
      slug: gift.slug,
      name: gift.name,
      description: gift.description ?? '',
      price_cents: gift.priceCents,
      image_url: gift.imageUrl ?? null,
      quantity: gift.quantity ?? 1,
      active: true,
      sort_order: gift.sortOrder ?? 0,
      created_at: now,
      updated_at: now,
    }))

    await queryInterface.bulkInsert('gifts', rows, { ignoreDuplicates: true })
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('gifts', { slug: gifts.map((g) => g.slug) })
  },
}

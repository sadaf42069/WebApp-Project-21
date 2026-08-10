import assert from 'node:assert/strict'
import { createConfig } from '../config.js'
import { createDatabase } from '../services/database-factory.js'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for the PostgreSQL smoke test.')

const config = createConfig({ isVercel: false })
const database = createDatabase(config)

try {
  await database.initialize()
  const initial = await database.read()
  assert.ok(initial.shops.length > 0)
  assert.ok(initial.tenants.length > 0)
  assert.equal(initial.users[0].role, 'admin')

  const marker = `postgres-smoke-${Date.now()}`
  await database.update((state) => {
    state.validationMarker = marker
    return marker
  })
  assert.equal((await database.read()).validationMarker, marker)
  console.log('PostgreSQL initialization, reads, and transactional writes passed.')
} finally {
  await database.close?.()
}

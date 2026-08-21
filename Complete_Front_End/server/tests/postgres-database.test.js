import assert from 'node:assert/strict'
import test from 'node:test'
import { PostgresDatabase } from '../services/postgres-database.js'

function fakePool(initialState) {
  let state = structuredClone(initialState)
  const calls = []
  let released = false

  const client = {
    async query(sql, parameters = []) {
      const normalized = sql.replace(/\s+/g, ' ').trim()
      calls.push(normalized.split(' ')[0] === 'SELECT' ? normalized : normalized.split(' ')[0])
      if (normalized === 'SELECT data FROM app_state WHERE id = 1 FOR UPDATE') {
        return { rows: [{ data: structuredClone(state) }] }
      }
      if (normalized.startsWith('UPDATE app_state')) {
        state = JSON.parse(parameters[0])
      }
      return { rows: [] }
    },
    release() {
      released = true
    },
  }

  return {
    pool: { connect: async () => client },
    calls,
    state: () => state,
    released: () => released,
  }
}

test('PostgreSQL updates lock the state row and commit atomically without a live database', async () => {
  const fake = fakePool({ version: 1, shops: [] })
  const database = new PostgresDatabase('', {}, { pool: fake.pool })

  const result = await database.update((state) => {
    state.shops.push({ no: 'TEST-01' })
    return state.shops[0].no
  })

  assert.equal(result, 'TEST-01')
  assert.deepEqual(fake.calls, ['BEGIN', 'SELECT data FROM app_state WHERE id = 1 FOR UPDATE', 'UPDATE', 'COMMIT'])
  assert.equal(fake.state().shops[0].no, 'TEST-01')
  assert.ok(fake.state().updatedAt)
  assert.equal(fake.released(), true)
})

test('PostgreSQL updates roll back and release the client when a mutation fails', async () => {
  const fake = fakePool({ version: 1, shops: [] })
  const database = new PostgresDatabase('', {}, { pool: fake.pool })

  await assert.rejects(database.update(() => {
    throw new Error('simulated mutation failure')
  }), /simulated mutation failure/)

  assert.deepEqual(fake.calls, ['BEGIN', 'SELECT data FROM app_state WHERE id = 1 FOR UPDATE', 'ROLLBACK'])
  assert.equal(fake.released(), true)
})

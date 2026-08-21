import pg from 'pg'
import { createInitialData } from './database.js'

const { Pool } = pg

function clone(value) {
  return structuredClone(value)
}

export class PostgresDatabase {
  constructor(connectionString, admin, { pool } = {}) {
    this.admin = admin
    if (pool) {
      this.pool = pool
      return
    }
    const connectionUrl = new URL(connectionString)
    if (connectionUrl.searchParams.get('sslmode') === 'require') {
      connectionUrl.searchParams.set('sslmode', 'verify-full')
    }
    this.pool = new Pool({
      connectionString: connectionUrl.toString(),
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      allowExitOnIdle: true,
    })
  }

  async initialize() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        id smallint PRIMARY KEY CHECK (id = 1),
        data jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    await this.pool.query(
      `INSERT INTO app_state (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING`,
      [JSON.stringify(createInitialData(this.admin))],
    )
  }

  async read() {
    const result = await this.pool.query('SELECT data FROM app_state WHERE id = 1')
    if (!result.rows[0]) throw new Error('The PostgreSQL application state has not been initialized.')
    return clone(result.rows[0].data)
  }

  async update(mutator) {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const current = await client.query('SELECT data FROM app_state WHERE id = 1 FOR UPDATE')
      if (!current.rows[0]) throw new Error('The PostgreSQL application state has not been initialized.')

      const database = current.rows[0].data
      const result = await mutator(database)
      database.updatedAt = new Date().toISOString()
      await client.query(
        'UPDATE app_state SET data = $1::jsonb, updated_at = now() WHERE id = 1',
        [JSON.stringify(database)],
      )
      await client.query('COMMIT')
      return clone(result)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async close() {
    await this.pool.end()
  }
}

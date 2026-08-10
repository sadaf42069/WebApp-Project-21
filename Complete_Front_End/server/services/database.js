import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { hashPassword } from './auth.js'
import { seedShops, seedTenants } from '../data/seed.js'

function clone(value) {
  return structuredClone(value)
}

export function addActivity(database, type, message) {
  database.activities.unshift({ id: randomUUID(), type, message, createdAt: new Date().toISOString() })
  database.activities = database.activities.slice(0, 100)
}

export function createInitialData(admin) {
  const password = hashPassword(admin.password)
  const now = new Date().toISOString()
  return {
    version: 1,
    users: [{
      id: randomUUID(),
      email: admin.email.trim().toLowerCase(),
      name: admin.name.trim(),
      role: 'admin',
      passwordHash: password.hash,
      passwordSalt: password.salt,
      createdAt: now,
    }],
    shops: clone(seedShops),
    tenants: clone(seedTenants),
    activities: [{
      id: randomUUID(),
      type: 'system_reset',
      message: 'The initial shopping-complex dataset was created.',
      createdAt: now,
    }],
    updatedAt: now,
  }
}

export class JsonDatabase {
  #queue = Promise.resolve()

  constructor(filePath, admin) {
    this.filePath = filePath
    this.admin = admin
  }

  async initialize() {
    try {
      await stat(this.filePath)
      const current = await this.read()
      if (!Array.isArray(current.users) || !Array.isArray(current.shops) || !Array.isArray(current.tenants)) {
        throw new Error('The database file does not contain the expected collections.')
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      await this.#write(createInitialData(this.admin))
    }
  }

  async read() {
    await this.#queue
    const contents = await readFile(this.filePath, 'utf8')
    return JSON.parse(contents)
  }

  update(mutator) {
    const operation = this.#queue.then(async () => {
      const contents = await readFile(this.filePath, 'utf8')
      const database = JSON.parse(contents)
      const result = await mutator(database)
      database.updatedAt = new Date().toISOString()
      await this.#write(database)
      return clone(result)
    })
    this.#queue = operation.then(() => undefined, () => undefined)
    return operation
  }

  async #write(database) {
    const directory = path.dirname(this.filePath)
    await mkdir(directory, { recursive: true })
    const temporaryFile = `${this.filePath}.${process.pid}.${randomUUID()}.tmp`
    await writeFile(temporaryFile, `${JSON.stringify(database, null, 2)}\n`, 'utf8')
    await rename(temporaryFile, this.filePath)
  }
}

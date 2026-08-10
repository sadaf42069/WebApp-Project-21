import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { after, before, test } from 'node:test'
import { createApp } from '../app.js'
import { createConfig } from '../config.js'
import { JsonDatabase } from '../services/database.js'

let baseUrl
let server
let temporaryDirectory
let token

async function request(route, options = {}) {
  const response = await fetch(`${baseUrl}${route}`, {
    ...options,
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
  })
  const body = response.status === 204 ? null : await response.json()
  return { response, body }
}

before(async () => {
  temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'navana-api-test-'))
  const config = createConfig({
    port: 0,
    dataFile: path.join(temporaryDirectory, 'database.json'),
    authSecret: 'integration-test-secret-with-sufficient-length',
    tokenTtlSeconds: 60,
    adminEmail: 'admin@example.com',
    adminPassword: 'TestPassword123!',
    adminName: 'Test Admin',
    staticDirectory: path.join(temporaryDirectory, 'missing-dist'),
  })
  const database = new JsonDatabase(config.dataFile, {
    email: config.adminEmail,
    password: config.adminPassword,
    name: config.adminName,
  })
  await database.initialize()
  const app = await createApp({ database, config })
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve)
  })
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true })
})

test('health endpoint identifies the Node.js runtime', async () => {
  const { response, body } = await request('/api/health')
  assert.equal(response.status, 200)
  assert.equal(body.data.runtime, 'Node.js')
})

test('login rejects invalid credentials and accepts the seeded admin', async () => {
  const invalid = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@example.com', password: 'wrong' }),
  })
  assert.equal(invalid.response.status, 401)

  const valid = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@example.com', password: 'TestPassword123!' }),
  })
  assert.equal(valid.response.status, 200)
  assert.equal(valid.body.data.user.role, 'admin')
  token = valid.body.data.token
})

test('shops are public but mutations require authentication', async () => {
  const list = await request('/api/shops')
  assert.equal(list.response.status, 200)
  assert.ok(list.body.data.length > 10)

  const unauthorized = await request('/api/shops', {
    method: 'POST',
    body: JSON.stringify({}),
  })
  assert.equal(unauthorized.response.status, 401)
})

test('authenticated shop CRUD persists and validates unique shop numbers', async () => {
  const shop = {
    no: 'D-01',
    name: 'Test Store',
    category: 'Testing',
    size: 250,
    floor: '3rd Floor',
    status: 'Vacant',
    contact: 'Management Office',
    openingHours: 'By appointment',
    description: 'Created by the API integration test.',
  }
  const created = await request('/api/shops', { method: 'POST', token, body: JSON.stringify(shop) })
  assert.equal(created.response.status, 201)
  assert.equal(created.body.data.no, 'D-01')

  const duplicate = await request('/api/shops', { method: 'POST', token, body: JSON.stringify(shop) })
  assert.equal(duplicate.response.status, 409)

  const updated = await request('/api/shops/D-01', {
    method: 'PUT',
    token,
    body: JSON.stringify({ ...shop, name: 'Updated Test Store' }),
  })
  assert.equal(updated.response.status, 200)
  assert.equal(updated.body.data.name, 'Updated Test Store')

  const removed = await request('/api/shops/D-01', { method: 'DELETE', token })
  assert.equal(removed.response.status, 204)
})

test('rent payment updates are authenticated and recorded', async () => {
  const updated = await request('/api/tenants/T-003/payment-status', {
    method: 'PATCH',
    token,
    body: JSON.stringify({ paymentStatus: 'Paid' }),
  })
  assert.equal(updated.response.status, 200)
  assert.equal(updated.body.data.paymentStatus, 'Paid')

  const activities = await request('/api/activities', { token })
  assert.equal(activities.response.status, 200)
  assert.equal(activities.body.data[0].type, 'rent_paid')
})

test('demo reset restores the seed state', async () => {
  const reset = await request('/api/system/reset', { method: 'POST', token })
  assert.equal(reset.response.status, 200)
  assert.equal(reset.body.data.tenants.find((tenant) => tenant.id === 'T-003').paymentStatus, 'Due')
  assert.equal(reset.body.data.activities[0].type, 'system_reset')
})


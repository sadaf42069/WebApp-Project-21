import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { after, before, test } from 'node:test'
import { createApp } from '../app.js'
import { createConfig } from '../config.js'
import { JsonDatabase } from '../services/database.js'
import { createToken } from '../services/auth.js'

let baseUrl
let server
let temporaryDirectory
let token
let testConfig

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
  testConfig = config
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

test('malformed, oversized, and invalid request bodies return specific client errors', async () => {
  const malformed = await request('/api/shops', {
    method: 'POST',
    token,
    body: '{"broken":',
  })
  assert.equal(malformed.response.status, 400)
  assert.equal(malformed.body.error.code, 'INVALID_JSON')

  const oversized = await request('/api/shops', {
    method: 'POST',
    token,
    body: JSON.stringify({ payload: 'x'.repeat(110 * 1024) }),
  })
  assert.equal(oversized.response.status, 413)

  const invalidShop = await request('/api/shops', {
    method: 'POST',
    token,
    body: JSON.stringify({
      no: 'INVALID-01',
      name: 'Invalid Shop',
      category: 'Testing',
      size: -1,
      floor: '3rd Floor',
      status: 'Vacant',
    }),
  })
  assert.equal(invalidShop.response.status, 400)
  assert.equal(invalidShop.body.error.code, 'VALIDATION_ERROR')
})

test('authenticated tenant CRUD synchronizes shop occupancy and validates conflicts', async () => {
  const tenant = {
    id: 'T-900',
    name: 'Integration Tenant',
    shopNo: 'C-02',
    rent: 17000,
    dueDate: '05 Sep 2026',
    paymentStatus: 'Due',
    phone: '+880 1700-000900',
    businessCategory: 'Testing',
    startDate: 'Aug 2026',
  }

  const created = await request('/api/tenants', { method: 'POST', token, body: JSON.stringify(tenant) })
  assert.equal(created.response.status, 201)
  assert.equal(created.body.data.id, 'T-900')

  const duplicate = await request('/api/tenants', { method: 'POST', token, body: JSON.stringify(tenant) })
  assert.equal(duplicate.response.status, 409)

  const occupiedShop = await request('/api/shops/C-02')
  assert.equal(occupiedShop.body.data.status, 'Occupied')

  const updated = await request('/api/tenants/T-900', {
    method: 'PUT',
    token,
    body: JSON.stringify({ ...tenant, id: 'T-901', name: 'Updated Integration Tenant', paymentStatus: 'Overdue' }),
  })
  assert.equal(updated.response.status, 200)
  assert.equal(updated.body.data.id, 'T-901')
  assert.equal(updated.body.data.paymentStatus, 'Overdue')

  const removed = await request('/api/tenants/T-901', { method: 'DELETE', token })
  assert.equal(removed.response.status, 204)
  const vacantShop = await request('/api/shops/C-02')
  assert.equal(vacantShop.body.data.status, 'Vacant')
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

test('report summaries are protected and match the current persisted state', async () => {
  const unauthorized = await request('/api/reports/summary')
  assert.equal(unauthorized.response.status, 401)

  const summary = await request('/api/reports/summary', { token })
  assert.equal(summary.response.status, 200)
  assert.equal(summary.body.data.shops.total, 16)
  assert.equal(summary.body.data.shops.total, summary.body.data.shops.occupied + summary.body.data.shops.vacant)
  assert.equal(summary.body.data.rent.total, summary.body.data.rent.collected + summary.body.data.rent.outstanding)
})

test('expired and malformed bearer tokens cannot access protected routes', async () => {
  const expired = createToken({
    id: 'expired-admin',
    email: 'expired@example.com',
    name: 'Expired Admin',
    role: 'admin',
  }, testConfig.authSecret, -1)

  const expiredResponse = await request('/api/tenants', { token: expired })
  assert.equal(expiredResponse.response.status, 401)

  const malformedResponse = await request('/api/tenants', { token: 'not.a.valid-token' })
  assert.equal(malformedResponse.response.status, 401)
})

test('demo reset restores the seed state', async () => {
  const reset = await request('/api/system/reset', { method: 'POST', token })
  assert.equal(reset.response.status, 200)
  assert.equal(reset.body.data.tenants.find((tenant) => tenant.id === 'T-003').paymentStatus, 'Due')
  assert.equal(reset.body.data.activities[0].type, 'system_reset')
})


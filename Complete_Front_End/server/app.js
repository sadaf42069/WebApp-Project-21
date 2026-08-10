import { stat } from 'node:fs/promises'
import path from 'node:path'
import express from 'express'
import { seedShops, seedTenants } from './data/seed.js'
import { addActivity } from './services/database.js'
import { createToken, verifyPassword, verifyToken } from './services/auth.js'
import {
  HttpError,
  validateCredentials,
  validatePaymentStatus,
  validateShop,
  validateTenant,
} from './validation.js'

function publicUser(user) {
  return { id: user.id, email: user.email, name: user.name, role: user.role }
}

function normalizeIdentifier(value) {
  return decodeURIComponent(value).trim().toUpperCase()
}

function reportSummary(database) {
  const occupied = database.shops.filter((shop) => shop.status === 'Occupied').length
  const vacant = database.shops.filter((shop) => shop.status === 'Vacant').length
  const totalRent = database.tenants.reduce((sum, tenant) => sum + tenant.rent, 0)
  const dueRent = database.tenants
    .filter((tenant) => tenant.paymentStatus !== 'Paid')
    .reduce((sum, tenant) => sum + tenant.rent, 0)

  const categoryCounts = Object.fromEntries(
    [...new Set(database.shops.map((shop) => shop.category))]
      .sort()
      .map((category) => [category, database.shops.filter((shop) => shop.category === category).length]),
  )
  const floorOccupancy = Object.fromEntries(
    [...new Set(database.shops.map((shop) => shop.floor))]
      .sort()
      .map((floor) => {
        const shops = database.shops.filter((shop) => shop.floor === floor)
        return [floor, { total: shops.length, occupied: shops.filter((shop) => shop.status === 'Occupied').length }]
      }),
  )

  return {
    shops: { total: database.shops.length, occupied, vacant },
    tenants: { total: database.tenants.length },
    rent: { total: totalRent, collected: totalRent - dueRent, outstanding: dueRent },
    categoryCounts,
    floorOccupancy,
  }
}

async function directoryExists(directory) {
  try {
    return (await stat(directory)).isDirectory()
  } catch {
    return false
  }
}

export async function createApp({ database, config }) {
  const app = express()

  app.disable('x-powered-by')
  app.use((request, response, next) => {
    response.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    })
    if (config.corsOrigin && request.get('origin') === config.corsOrigin) {
      response.set({
        'Access-Control-Allow-Origin': config.corsOrigin,
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        Vary: 'Origin',
      })
    }
    if (request.method === 'OPTIONS') return response.status(204).end()
    next()
  })
  app.use(express.json({ limit: '100kb' }))

  function requireAuth(request, _response, next) {
    const header = request.get('authorization') || ''
    const [scheme, token] = header.split(' ')
    const claims = scheme === 'Bearer' && token ? verifyToken(token, config.authSecret) : null
    if (!claims) return next(new HttpError(401, 'UNAUTHORIZED', 'A valid admin login is required.'))
    request.user = claims
    next()
  }

  app.get('/api/health', (_request, response) => {
    response.json({ data: { status: 'ok', runtime: 'Node.js', timestamp: new Date().toISOString() } })
  })

  app.post('/api/auth/login', async (request, response) => {
    const credentials = validateCredentials(request.body)
    const data = await database.read()
    const user = data.users.find((candidate) => candidate.email === credentials.email)
    if (!user || !verifyPassword(credentials.password, user.passwordSalt, user.passwordHash)) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'The email or password is incorrect.')
    }
    const token = createToken(user, config.authSecret, config.tokenTtlSeconds)
    response.json({ data: { token, user: publicUser(user) } })
  })

  app.get('/api/auth/me', requireAuth, async (request, response) => {
    const data = await database.read()
    const user = data.users.find((candidate) => candidate.id === request.user.sub)
    if (!user) throw new HttpError(401, 'UNAUTHORIZED', 'The signed-in user no longer exists.')
    response.json({ data: publicUser(user) })
  })

  app.get('/api/shops', async (request, response) => {
    const data = await database.read()
    const query = String(request.query.q || '').trim().toLowerCase()
    const category = String(request.query.category || '').trim()
    const floor = String(request.query.floor || '').trim()
    const status = String(request.query.status || '').trim()
    const shops = data.shops.filter((shop) => (
      (!query || [shop.no, shop.name, shop.category].some((value) => value.toLowerCase().includes(query)))
      && (!category || shop.category === category)
      && (!floor || shop.floor === floor)
      && (!status || shop.status === status)
    ))
    response.json({ data: shops })
  })

  app.get('/api/shops/:shopNo', async (request, response) => {
    const shopNo = normalizeIdentifier(request.params.shopNo)
    const data = await database.read()
    const shop = data.shops.find((candidate) => candidate.no === shopNo)
    if (!shop) throw new HttpError(404, 'SHOP_NOT_FOUND', `Shop ${shopNo} was not found.`)
    response.json({ data: shop })
  })

  app.post('/api/shops', requireAuth, async (request, response) => {
    const shop = validateShop(request.body)
    const created = await database.update((data) => {
      if (data.shops.some((candidate) => candidate.no === shop.no)) {
        throw new HttpError(409, 'SHOP_EXISTS', `Shop ${shop.no} already exists.`)
      }
      data.shops.unshift(shop)
      addActivity(data, 'shop_created', `Shop ${shop.no} (${shop.name}) was added.`)
      return shop
    })
    response.status(201).json({ data: created })
  })

  app.put('/api/shops/:shopNo', requireAuth, async (request, response) => {
    const currentNo = normalizeIdentifier(request.params.shopNo)
    const shop = validateShop(request.body)
    const updated = await database.update((data) => {
      const index = data.shops.findIndex((candidate) => candidate.no === currentNo)
      if (index < 0) throw new HttpError(404, 'SHOP_NOT_FOUND', `Shop ${currentNo} was not found.`)
      if (shop.no !== currentNo && data.shops.some((candidate) => candidate.no === shop.no)) {
        throw new HttpError(409, 'SHOP_EXISTS', `Shop ${shop.no} already exists.`)
      }
      data.shops[index] = shop
      if (shop.no !== currentNo) {
        data.tenants = data.tenants.map((tenant) => tenant.shopNo === currentNo ? { ...tenant, shopNo: shop.no } : tenant)
      }
      addActivity(data, 'shop_updated', `Shop ${currentNo} was updated${shop.no !== currentNo ? ` and renamed to ${shop.no}` : ''}.`)
      return shop
    })
    response.json({ data: updated })
  })

  app.delete('/api/shops/:shopNo', requireAuth, async (request, response) => {
    const shopNo = normalizeIdentifier(request.params.shopNo)
    await database.update((data) => {
      const shop = data.shops.find((candidate) => candidate.no === shopNo)
      if (!shop) throw new HttpError(404, 'SHOP_NOT_FOUND', `Shop ${shopNo} was not found.`)
      if (data.tenants.some((tenant) => tenant.shopNo === shopNo)) {
        throw new HttpError(409, 'SHOP_HAS_TENANT', `Shop ${shopNo} cannot be deleted while it has a tenant record.`)
      }
      data.shops = data.shops.filter((candidate) => candidate.no !== shopNo)
      addActivity(data, 'shop_deleted', `Shop ${shopNo} (${shop.name}) was deleted.`)
    })
    response.status(204).end()
  })

  app.get('/api/tenants', requireAuth, async (request, response) => {
    const data = await database.read()
    response.json({ data: data.tenants })
  })

  app.get('/api/tenants/:tenantId', requireAuth, async (request, response) => {
    const tenantId = normalizeIdentifier(request.params.tenantId)
    const data = await database.read()
    const tenant = data.tenants.find((candidate) => candidate.id === tenantId)
    if (!tenant) throw new HttpError(404, 'TENANT_NOT_FOUND', `Tenant ${tenantId} was not found.`)
    response.json({ data: tenant })
  })

  app.post('/api/tenants', requireAuth, async (request, response) => {
    const tenant = validateTenant(request.body)
    const created = await database.update((data) => {
      if (data.tenants.some((candidate) => candidate.id === tenant.id)) {
        throw new HttpError(409, 'TENANT_EXISTS', `Tenant ${tenant.id} already exists.`)
      }
      const shop = data.shops.find((candidate) => candidate.no === tenant.shopNo)
      if (!shop) throw new HttpError(400, 'SHOP_NOT_FOUND', `Shop ${tenant.shopNo} does not exist.`)
      if (data.tenants.some((candidate) => candidate.shopNo === tenant.shopNo)) {
        throw new HttpError(409, 'SHOP_HAS_TENANT', `Shop ${tenant.shopNo} already has a tenant record.`)
      }
      data.tenants.unshift(tenant)
      shop.status = 'Occupied'
      addActivity(data, 'tenant_created', `Tenant ${tenant.name} was assigned to shop ${tenant.shopNo}.`)
      return tenant
    })
    response.status(201).json({ data: created })
  })

  app.put('/api/tenants/:tenantId', requireAuth, async (request, response) => {
    const currentId = normalizeIdentifier(request.params.tenantId)
    const tenant = validateTenant(request.body)
    const updated = await database.update((data) => {
      const index = data.tenants.findIndex((candidate) => candidate.id === currentId)
      if (index < 0) throw new HttpError(404, 'TENANT_NOT_FOUND', `Tenant ${currentId} was not found.`)
      if (tenant.id !== currentId && data.tenants.some((candidate) => candidate.id === tenant.id)) {
        throw new HttpError(409, 'TENANT_EXISTS', `Tenant ${tenant.id} already exists.`)
      }
      const shop = data.shops.find((candidate) => candidate.no === tenant.shopNo)
      if (!shop) throw new HttpError(400, 'SHOP_NOT_FOUND', `Shop ${tenant.shopNo} does not exist.`)
      if (data.tenants.some((candidate, candidateIndex) => candidateIndex !== index && candidate.shopNo === tenant.shopNo)) {
        throw new HttpError(409, 'SHOP_HAS_TENANT', `Shop ${tenant.shopNo} already has a tenant record.`)
      }
      const previousShopNo = data.tenants[index].shopNo
      data.tenants[index] = tenant
      shop.status = 'Occupied'
      if (previousShopNo !== tenant.shopNo && !data.tenants.some((candidate) => candidate.shopNo === previousShopNo)) {
        const previousShop = data.shops.find((candidate) => candidate.no === previousShopNo)
        if (previousShop) previousShop.status = 'Vacant'
      }
      addActivity(data, 'tenant_updated', `Tenant ${tenant.id} was updated.`)
      return tenant
    })
    response.json({ data: updated })
  })

  app.patch('/api/tenants/:tenantId/payment-status', requireAuth, async (request, response) => {
    const tenantId = normalizeIdentifier(request.params.tenantId)
    const paymentStatus = validatePaymentStatus(request.body)
    const updated = await database.update((data) => {
      const tenant = data.tenants.find((candidate) => candidate.id === tenantId)
      if (!tenant) throw new HttpError(404, 'TENANT_NOT_FOUND', `Tenant ${tenantId} was not found.`)
      tenant.paymentStatus = paymentStatus
      addActivity(data, paymentStatus === 'Paid' ? 'rent_paid' : 'rent_updated', `Shop ${tenant.shopNo} rent status was changed to ${paymentStatus}.`)
      return tenant
    })
    response.json({ data: updated })
  })

  app.delete('/api/tenants/:tenantId', requireAuth, async (request, response) => {
    const tenantId = normalizeIdentifier(request.params.tenantId)
    await database.update((data) => {
      const tenant = data.tenants.find((candidate) => candidate.id === tenantId)
      if (!tenant) throw new HttpError(404, 'TENANT_NOT_FOUND', `Tenant ${tenantId} was not found.`)
      data.tenants = data.tenants.filter((candidate) => candidate.id !== tenantId)
      const shop = data.shops.find((candidate) => candidate.no === tenant.shopNo)
      if (shop) shop.status = 'Vacant'
      addActivity(data, 'tenant_deleted', `Tenant ${tenant.name} was removed from shop ${tenant.shopNo}.`)
    })
    response.status(204).end()
  })

  app.get('/api/activities', requireAuth, async (request, response) => {
    const requestedLimit = Number(request.query.limit)
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 20
    const data = await database.read()
    response.json({ data: data.activities.slice(0, limit) })
  })

  app.get('/api/reports/summary', requireAuth, async (_request, response) => {
    response.json({ data: reportSummary(await database.read()) })
  })

  app.post('/api/system/reset', requireAuth, async (_request, response) => {
    const resetData = await database.update((data) => {
      data.shops = structuredClone(seedShops)
      data.tenants = structuredClone(seedTenants)
      data.activities = []
      addActivity(data, 'system_reset', 'The demo shop and tenant data was restored.')
      return { shops: data.shops, tenants: data.tenants, activities: data.activities }
    })
    response.json({ data: resetData })
  })

  if (await directoryExists(config.staticDirectory)) {
    app.use(express.static(config.staticDirectory, { index: false }))
    app.use((request, response, next) => {
      if (request.method !== 'GET' || request.path.startsWith('/api/')) return next()
      response.sendFile(path.join(config.staticDirectory, 'index.html'))
    })
  }

  app.use((request, _response, next) => {
    next(new HttpError(404, 'NOT_FOUND', `No route matches ${request.method} ${request.path}.`))
  })

  app.use((error, _request, response, _next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return response.status(400).json({ error: { code: 'INVALID_JSON', message: 'The request body is not valid JSON.' } })
    }
    const status = Number.isInteger(error.status) ? error.status : 500
    const code = error.code || 'INTERNAL_ERROR'
    const message = status >= 500 ? 'The server could not complete the request.' : error.message
    if (status >= 500) console.error(error)
    response.status(status).json({ error: { code, message, ...(error.details ? { details: error.details } : {}) } })
  })

  return app
}

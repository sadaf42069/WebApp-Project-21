import assert from 'node:assert/strict'
import test from 'node:test'
import { isAdminPage, loginPathFor, loginReturnRoute, pathFor, routeFromPath } from '../routing.ts'

test('every application screen has a durable URL', () => {
  assert.equal(pathFor('login'), '/login')
  assert.equal(pathFor('dashboard'), '/admin')
  assert.equal(pathFor('shops'), '/admin/shops')
  assert.equal(pathFor('tenants'), '/admin/tenants')
  assert.equal(pathFor('reports'), '/admin/reports')
  assert.equal(pathFor('settings'), '/admin/settings')
  assert.equal(pathFor('directory'), '/directory')
  assert.equal(pathFor('floor-nav'), '/floor-map')
})

test('shop selections round-trip through directory and floor-map deep links', () => {
  assert.equal(pathFor('directory', 'A-01'), '/directory/A-01')
  assert.deepEqual(routeFromPath('/directory/A-01'), { page: 'directory', shopNo: 'A-01' })
  assert.equal(pathFor('floor-nav', 'B 02'), '/floor-map/B%2002')
  assert.deepEqual(routeFromPath('/floor-map/B%2002/'), { page: 'floor-nav', shopNo: 'B 02' })
})

test('protected destinations survive a login redirect without allowing an open redirect', () => {
  assert.equal(loginPathFor('reports'), '/login?next=%2Fadmin%2Freports')
  assert.deepEqual(loginReturnRoute('?next=%2Fadmin%2Freports'), { page: 'reports' })
  assert.equal(loginReturnRoute('?next=https%3A%2F%2Fevil.example'), null)
  assert.equal(loginReturnRoute('?next=%2Fdirectory'), null)
})

test('unknown paths safely resolve to login and admin pages are classified consistently', () => {
  assert.deepEqual(routeFromPath('/not-a-real-screen'), { page: 'login' })
  assert.equal(isAdminPage('dashboard'), true)
  assert.equal(isAdminPage('directory'), false)
})

import type { Activity, PaymentStatus, Shop, Tenant, User } from './types'

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
const TOKEN_KEY = 'nbs-auth-token'

interface ApiEnvelope<T> {
  data: T
}

interface ApiErrorEnvelope {
  error?: {
    code?: string
    message?: string
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

async function request<T>(path: string, options: RequestInit = {}, authenticated = false): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body) headers.set('Content-Type', 'application/json')
  if (authenticated) {
    const token = getStoredToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch {
    throw new ApiError('Cannot reach the Node.js backend. Make sure the API server is running.', 0, 'NETWORK_ERROR')
  }

  if (response.status === 204) return undefined as T

  const payload = await response.json().catch(() => ({})) as ApiEnvelope<T> & ApiErrorEnvelope
  if (!response.ok) {
    if (response.status === 401 && authenticated) {
      clearSession()
      window.dispatchEvent(new Event('nbs:unauthorized'))
    }
    throw new ApiError(
      payload.error?.message || `The server returned HTTP ${response.status}.`,
      response.status,
      payload.error?.code || 'API_ERROR',
    )
  }
  return payload.data
}

export async function login(email: string, password: string) {
  const session = await request<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  localStorage.setItem(TOKEN_KEY, session.token)
  return session
}

export const getCurrentUser = () => request<User>('/auth/me', {}, true)
export const getShops = () => request<Shop[]>('/shops')
export const getTenants = () => request<Tenant[]>('/tenants', {}, true)
export const getActivities = () => request<Activity[]>('/activities?limit=20', {}, true)

export const createShop = (shop: Shop) => request<Shop>('/shops', {
  method: 'POST',
  body: JSON.stringify(shop),
}, true)

export const updateShop = (currentShopNo: string, shop: Shop) => request<Shop>(`/shops/${encodeURIComponent(currentShopNo)}`, {
  method: 'PUT',
  body: JSON.stringify(shop),
}, true)

export const deleteShop = (shopNo: string) => request<void>(`/shops/${encodeURIComponent(shopNo)}`, {
  method: 'DELETE',
}, true)

export const createTenant = (tenant: Tenant) => request<Tenant>('/tenants', {
  method: 'POST',
  body: JSON.stringify(tenant),
}, true)

export const updateTenant = (currentTenantId: string, tenant: Tenant) => request<Tenant>(`/tenants/${encodeURIComponent(currentTenantId)}`, {
  method: 'PUT',
  body: JSON.stringify(tenant),
}, true)

export const deleteTenant = (tenantId: string) => request<void>(`/tenants/${encodeURIComponent(tenantId)}`, {
  method: 'DELETE',
}, true)

export const updateTenantPaymentStatus = (tenantId: string, paymentStatus: PaymentStatus) => request<Tenant>(`/tenants/${encodeURIComponent(tenantId)}/payment-status`, {
  method: 'PATCH',
  body: JSON.stringify({ paymentStatus }),
}, true)

export const resetDemoData = () => request<{ shops: Shop[]; tenants: Tenant[]; activities: Activity[] }>('/system/reset', {
  method: 'POST',
}, true)


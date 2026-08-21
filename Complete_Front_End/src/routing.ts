import type { Page } from './types'

export interface AppRoute {
  page: Page
  shopNo?: string
}

const pagePaths: Record<Page, string> = {
  login: '/login',
  dashboard: '/admin',
  shops: '/admin/shops',
  tenants: '/admin/tenants',
  directory: '/directory',
  'floor-nav': '/floor-map',
  reports: '/admin/reports',
  settings: '/admin/settings',
}

export const adminPages: Page[] = ['dashboard', 'shops', 'tenants', 'reports', 'settings']

export function isAdminPage(page: Page) {
  return adminPages.includes(page)
}

export function pathFor(page: Page, shopNo?: string) {
  const base = pagePaths[page]
  if ((page === 'directory' || page === 'floor-nav') && shopNo) {
    return `${base}/${encodeURIComponent(shopNo)}`
  }
  return base
}

export function routeFromPath(pathname: string): AppRoute {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return { page: 'login' }

  const exact = (Object.entries(pagePaths) as Array<[Page, string]>).find(([, value]) => value === path)
  if (exact) return { page: exact[0] }

  for (const page of ['directory', 'floor-nav'] as const) {
    const prefix = `${pagePaths[page]}/`
    if (path.startsWith(prefix)) {
      const encodedShopNo = path.slice(prefix.length).split('/')[0]
      try {
        return { page, shopNo: decodeURIComponent(encodedShopNo).trim().toUpperCase() }
      } catch {
        return { page }
      }
    }
  }

  return { page: 'login' }
}

export function loginPathFor(returnPage?: Page, shopNo?: string) {
  if (!returnPage || !isAdminPage(returnPage)) return pagePaths.login
  return `${pagePaths.login}?next=${encodeURIComponent(pathFor(returnPage, shopNo))}`
}

export function loginReturnRoute(search: string): AppRoute | null {
  const next = new URLSearchParams(search).get('next')
  if (!next || !next.startsWith('/')) return null
  const route = routeFromPath(next)
  return isAdminPage(route.page) ? route : null
}

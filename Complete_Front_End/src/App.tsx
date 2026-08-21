import { useCallback, useEffect, useState } from 'react'
import {
  ApiError,
  clearSession,
  createShop,
  createTenant,
  deleteShop,
  deleteTenant,
  errorMessage,
  getActivities,
  getCurrentUser,
  getShops,
  getStoredToken,
  getTenants,
  login,
  resetDemoData,
  updateShop,
  updateTenant,
  updateTenantPaymentStatus,
} from './api'
import {
  isAdminPage,
  loginPathFor,
  loginReturnRoute,
  pathFor,
  routeFromPath,
} from './routing'
import type { AppRoute } from './routing'
import type { Activity, Page, PaymentStatus, Shop, Tenant, User } from './types'
import Dashboard from './pages/Dashboard'
import FloorNavigation from './pages/FloorNavigation'
import LoginPage from './pages/LoginPage'
import Reports from './pages/Reports'
import SettingsPage from './pages/SettingsPage'
import ShopDirectory from './pages/ShopDirectory'
import ShopManagement from './pages/ShopManagement'
import TenantRent from './pages/TenantRent'

function initialRoute(): AppRoute {
  if (window.location.pathname === '/') {
    return { page: getStoredToken() ? 'dashboard' : 'login' }
  }
  return routeFromPath(window.location.pathname)
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(initialRoute)
  const [shops, setShops] = useState<Shop[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [initializationError, setInitializationError] = useState('')
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0)

  const commitRoute = useCallback((nextRoute: AppRoute, replace = false, explicitPath?: string) => {
    const nextPath = explicitPath ?? pathFor(nextRoute.page, nextRoute.shopNo)
    window.history[replace ? 'replaceState' : 'pushState']({ page: nextRoute.page, shopNo: nextRoute.shopNo }, '', nextPath)
    setRoute(nextRoute)
  }, [])

  const clearProtectedState = useCallback(() => {
    clearSession()
    setUser(null)
    setTenants([])
    setActivities([])
  }, [])

  const navigate = useCallback((nextPage: Page, shopNo?: string) => {
    if (nextPage === 'login') {
      clearProtectedState()
      commitRoute({ page: 'login' })
      return
    }

    if (isAdminPage(nextPage) && !getStoredToken()) {
      commitRoute({ page: 'login' }, false, loginPathFor(nextPage, shopNo))
      return
    }

    commitRoute({ page: nextPage, ...(shopNo ? { shopNo } : {}) })
  }, [clearProtectedState, commitRoute])

  useEffect(() => {
    if (window.location.pathname === '/') {
      window.history.replaceState({ page: route.page }, '', pathFor(route.page, route.shopNo))
    }

    const onPopState = () => {
      const nextRoute = routeFromPath(window.location.pathname)
      if (isAdminPage(nextRoute.page) && !getStoredToken()) {
        const loginPath = loginPathFor(nextRoute.page, nextRoute.shopNo)
        window.history.replaceState({ page: 'login' }, '', loginPath)
        setRoute({ page: 'login' })
        return
      }
      setRoute(nextRoute)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.querySelector<HTMLElement>('.content')?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [route.page, route.shopNo])

  useEffect(() => {
    const onUnauthorized = () => {
      const requestedPage = isAdminPage(route.page) ? route.page : undefined
      clearProtectedState()
      commitRoute({ page: 'login' }, true, loginPathFor(requestedPage, route.shopNo))
    }
    window.addEventListener('nbs:unauthorized', onUnauthorized)
    return () => window.removeEventListener('nbs:unauthorized', onUnauthorized)
  }, [clearProtectedState, commitRoute, route.page, route.shopNo])

  useEffect(() => {
    let cancelled = false

    const initialize = async () => {
      setInitializing(true)
      setInitializationError('')
      try {
        const publicShops = await getShops()
        if (cancelled) return
        setShops(publicShops)

        if (getStoredToken()) {
          try {
            const [currentUser, protectedTenants, recentActivities] = await Promise.all([
              getCurrentUser(),
              getTenants(),
              getActivities(),
            ])
            if (cancelled) return
            setUser(currentUser)
            setTenants(protectedTenants)
            setActivities(recentActivities)
          } catch (error) {
            if (!(error instanceof ApiError) || error.status !== 401) throw error
            clearProtectedState()
          }
        }

        if (isAdminPage(route.page) && !getStoredToken()) {
          commitRoute({ page: 'login' }, true, loginPathFor(route.page, route.shopNo))
        }
      } catch (error) {
        if (!cancelled) setInitializationError(errorMessage(error))
      } finally {
        if (!cancelled) setInitializing(false)
      }
    }

    void initialize()
    return () => { cancelled = true }
  }, [bootstrapAttempt])

  const refreshManagementData = async () => {
    const [latestShops, protectedTenants, recentActivities] = await Promise.all([
      getShops(),
      getTenants(),
      getActivities(),
    ])
    setShops(latestShops)
    setTenants(protectedTenants)
    setActivities(recentActivities)
  }

  const handleLogin = async (email: string, password: string) => {
    const session = await login(email, password)
    try {
      await refreshManagementData()
      setUser(session.user)
      const destination = loginReturnRoute(window.location.search) ?? { page: 'dashboard' as const }
      commitRoute(destination, true)
    } catch (error) {
      clearProtectedState()
      throw error
    }
  }

  const handleCreateShop = async (shop: Shop) => {
    await createShop(shop)
    await refreshManagementData()
  }

  const handleUpdateShop = async (currentShopNo: string, shop: Shop) => {
    await updateShop(currentShopNo, shop)
    await refreshManagementData()
  }

  const handleDeleteShop = async (shopNo: string) => {
    await deleteShop(shopNo)
    await refreshManagementData()
  }

  const handleCreateTenant = async (tenant: Tenant) => {
    const created = await createTenant(tenant)
    await refreshManagementData()
    return created
  }

  const handleUpdateTenant = async (currentTenantId: string, tenant: Tenant) => {
    const updated = await updateTenant(currentTenantId, tenant)
    await refreshManagementData()
    return updated
  }

  const handleDeleteTenant = async (tenantId: string) => {
    await deleteTenant(tenantId)
    await refreshManagementData()
  }

  const handlePaymentStatus = async (tenantId: string, status: PaymentStatus) => {
    const updated = await updateTenantPaymentStatus(tenantId, status)
    setTenants((current) => current.map((tenant) => tenant.id === tenantId ? updated : tenant))
    setActivities(await getActivities())
    return updated
  }

  const handleResetDemoData = async () => {
    const restored = await resetDemoData()
    setShops(restored.shops)
    setTenants(restored.tenants)
    setActivities(restored.activities)
  }

  if (initializing) {
    return <ServiceState title="Connecting to the Node.js backend..." detail="Loading shops and checking your admin session." />
  }

  if (initializationError) {
    return (
      <ServiceState title="Backend connection failed" detail={initializationError}>
        <button className="btn btn-primary" onClick={() => setBootstrapAttempt((attempt) => attempt + 1)}>Retry Connection</button>
      </ServiceState>
    )
  }

  switch (route.page) {
    case 'login':
      return <LoginPage onLogin={handleLogin} onBrowse={() => navigate('directory')} shopStats={{
        total: shops.length,
        occupied: shops.filter((shop) => shop.status === 'Occupied').length,
        floors: new Set(shops.map((shop) => shop.floor)).size,
      }} />
    case 'dashboard':
      return <Dashboard shops={shops} tenants={tenants} activities={activities} navigate={navigate} />
    case 'shops':
      return <ShopManagement shops={shops} onCreateShop={handleCreateShop} onUpdateShop={handleUpdateShop} onDeleteShop={handleDeleteShop} navigate={navigate} />
    case 'tenants':
      return <TenantRent shops={shops} tenants={tenants} onCreateTenant={handleCreateTenant} onUpdateTenant={handleUpdateTenant} onDeleteTenant={handleDeleteTenant} onUpdateStatus={handlePaymentStatus} navigate={navigate} />
    case 'directory':
      return <ShopDirectory shops={shops} selectedShopNo={route.shopNo} navigate={navigate} />
    case 'floor-nav':
      return <FloorNavigation shops={shops} selectedShopNo={route.shopNo} navigate={navigate} />
    case 'reports':
      return <Reports shops={shops} tenants={tenants} navigate={navigate} />
    case 'settings':
      return <SettingsPage navigate={navigate} resetDemoData={handleResetDemoData} />
    default:
      return null
  }
}

function ServiceState({ title, detail, children }: { title: string; detail: string; children?: React.ReactNode }) {
  return (
    <div className="center-page items-center justify-center" style={{ padding: 24 }}>
      <div className="card text-center" style={{ width: '100%', maxWidth: 520, padding: 32 }}>
        <div className="logo-mark" style={{ margin: '0 auto 18px' }}>NB</div>
        <h1 className="font-display" style={{ margin: 0 }}>{title}</h1>
        <p className="text-muted" style={{ lineHeight: 1.6 }}>{detail}</p>
        {children}
      </div>
    </div>
  )
}

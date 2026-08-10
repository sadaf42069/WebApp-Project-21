import { useEffect, useState } from 'react'
import {
  ApiError,
  clearSession,
  createShop,
  deleteShop,
  errorMessage,
  getActivities,
  getCurrentUser,
  getShops,
  getStoredToken,
  getTenants,
  login,
  resetDemoData,
  updateShop,
  updateTenantPaymentStatus,
} from './api'
import type { Activity, Page, PaymentStatus, Shop, Tenant, User } from './types'
import Dashboard from './pages/Dashboard'
import FloorNavigation from './pages/FloorNavigation'
import LoginPage from './pages/LoginPage'
import Reports from './pages/Reports'
import SettingsPage from './pages/SettingsPage'
import ShopDirectory from './pages/ShopDirectory'
import ShopManagement from './pages/ShopManagement'
import TenantRent from './pages/TenantRent'

export default function App() {
  const [page, setPage] = useState<Page>(() => getStoredToken() ? 'dashboard' : 'login')
  const [shops, setShops] = useState<Shop[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [selectedShopNo, setSelectedShopNo] = useState<string>('A-01')
  const [initializing, setInitializing] = useState(true)
  const [initializationError, setInitializationError] = useState('')
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0)

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
            clearSession()
            setPage('login')
          }
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

  const navigate = (nextPage: Page, selectedNo?: string) => {
    if (selectedNo) setSelectedShopNo(selectedNo)
    if (nextPage === 'login') {
      clearSession()
      setUser(null)
      setTenants([])
      setActivities([])
      setPage('login')
      return
    }
    const adminPage = ['dashboard', 'shops', 'tenants', 'reports', 'settings'].includes(nextPage)
    if (adminPage && !user) {
      setPage('login')
      return
    }
    setPage(nextPage)
  }

  const handleLogin = async (email: string, password: string) => {
    const session = await login(email, password)
    try {
      const [latestShops, protectedTenants, recentActivities] = await Promise.all([
        getShops(),
        getTenants(),
        getActivities(),
      ])
      setUser(session.user)
      setShops(latestShops)
      setTenants(protectedTenants)
      setActivities(recentActivities)
      setPage('dashboard')
    } catch (error) {
      clearSession()
      throw error
    }
  }

  const refreshActivities = async () => {
    try {
      setActivities(await getActivities())
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession()
        setUser(null)
        setTenants([])
        setActivities([])
        setPage('login')
      }
    }
  }

  const handleCreateShop = async (shop: Shop) => {
    const created = await createShop(shop)
    setShops((current) => [created, ...current])
    await refreshActivities()
  }

  const handleUpdateShop = async (currentShopNo: string, shop: Shop) => {
    const updated = await updateShop(currentShopNo, shop)
    setShops((current) => current.map((item) => item.no === currentShopNo ? updated : item))
    if (currentShopNo !== updated.no) {
      setTenants((current) => current.map((tenant) => tenant.shopNo === currentShopNo ? { ...tenant, shopNo: updated.no } : tenant))
    }
    await refreshActivities()
  }

  const handleDeleteShop = async (shopNo: string) => {
    await deleteShop(shopNo)
    setShops((current) => current.filter((shop) => shop.no !== shopNo))
    await refreshActivities()
  }

  const handlePaymentStatus = async (tenantId: string, status: PaymentStatus) => {
    const updated = await updateTenantPaymentStatus(tenantId, status)
    setTenants((current) => current.map((tenant) => tenant.id === tenantId ? updated : tenant))
    await refreshActivities()
    return updated
  }

  const handleResetDemoData = async () => {
    const restored = await resetDemoData()
    setShops(restored.shops)
    setTenants(restored.tenants)
    setActivities(restored.activities)
    setSelectedShopNo('A-01')
  }

  if (initializing) {
    return <ServiceState title="Connecting to the Node.js backend…" detail="Loading shops and checking your admin session." />
  }

  if (initializationError) {
    return (
      <ServiceState title="Backend connection failed" detail={initializationError}>
        <button className="btn btn-primary" onClick={() => setBootstrapAttempt((attempt) => attempt + 1)}>Retry Connection</button>
      </ServiceState>
    )
  }

  switch (page) {
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
      return <TenantRent tenants={tenants} onUpdateStatus={handlePaymentStatus} navigate={navigate} />
    case 'directory':
      return <ShopDirectory shops={shops} navigate={navigate} />
    case 'floor-nav':
      return <FloorNavigation shops={shops} selectedShopNo={selectedShopNo} navigate={navigate} />
    case 'reports':
      return <Reports shops={shops} tenants={tenants} navigate={navigate} />
    case 'settings':
      return <SettingsPage navigate={navigate} resetDemoData={handleResetDemoData} />
    default:
      return <LoginPage onLogin={handleLogin} onBrowse={() => navigate('directory')} shopStats={{ total: shops.length, occupied: 0, floors: 0 }} />
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

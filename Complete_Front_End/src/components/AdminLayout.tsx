import { useEffect, useRef, useState } from 'react'
import type { ElementType, ReactNode } from 'react'
import {
  BarChart3,
  Building2,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Settings,
  ShoppingBag,
  Store,
  Users,
  X,
} from 'lucide-react'
import type { Page } from '../types'

interface AdminLayoutProps {
  children: ReactNode
  activePage: Page
  navigate: (page: Page) => void
  title?: string
  subtitle?: string
}

const navItems: Array<{ label: string; page: Page; icon: ElementType; badge?: string }> = [
  { label: 'Dashboard', page: 'dashboard', icon: LayoutDashboard },
  { label: 'Shops', page: 'shops', icon: Store },
  { label: 'Tenants & Rent', page: 'tenants', icon: Users },
  { label: 'Customer Directory', page: 'directory', icon: ShoppingBag },
  { label: 'Floor Navigation', page: 'floor-nav', icon: Map },
  { label: 'Reports', page: 'reports', icon: BarChart3 },
  { label: 'Settings', page: 'settings', icon: Settings },
]

const titles: Record<Page, { title: string; subtitle: string }> = {
  login: { title: 'Login', subtitle: 'Sign in' },
  dashboard: { title: 'Dashboard', subtitle: 'Overview of shops, tenants, rent status and recent activity.' },
  shops: { title: 'Shop Management', subtitle: 'Add, update, search and manage all shop records.' },
  tenants: { title: 'Tenant & Rent Management', subtitle: 'Track tenants, rent dues, payment status and records.' },
  directory: { title: 'Customer Shop Directory', subtitle: 'Public shop search and shop discovery page.' },
  'floor-nav': { title: 'Digital Floor Navigation', subtitle: 'Floor-wise map and shop location viewer.' },
  reports: { title: 'Reports', subtitle: 'Management summaries for occupancy, category and rent status.' },
  settings: { title: 'Settings', subtitle: 'Prototype configuration and user access preferences.' },
}

export default function AdminLayout({ children, activePage, navigate, title, subtitle }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches)
  const sidebarRef = useRef<HTMLElement>(null)
  const pageTitle = title ?? titles[activePage].title
  const pageSubtitle = subtitle ?? titles[activePage].subtitle

  useEffect(() => {
    setMobileOpen(false)
  }, [activePage])

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)')
    const updateMode = () => setIsMobile(media.matches)
    media.addEventListener('change', updateMode)
    return () => media.removeEventListener('change', updateMode)
  }, [])

  useEffect(() => {
    if (sidebarRef.current) {
      ;(sidebarRef.current as HTMLElement & { inert: boolean }).inert = isMobile && !mobileOpen
    }
  }, [isMobile, mobileOpen])

  const toggleNavigation = () => {
    if (isMobile) {
      setCollapsed(false)
      setMobileOpen((open) => !open)
    }
    else setCollapsed((current) => !current)
  }

  const selectPage = (page: Page) => {
    setMobileOpen(false)
    navigate(page)
  }

  return (
    <div className="admin-layout">
      <button className={`mobile-nav-backdrop ${mobileOpen ? 'visible' : ''}`} aria-label="Close admin navigation" aria-hidden={!mobileOpen} tabIndex={mobileOpen ? 0 : -1} onClick={() => setMobileOpen(false)} />
      <aside ref={sidebarRef} id="admin-navigation" aria-label="Admin navigation" aria-hidden={isMobile && !mobileOpen ? true : undefined} className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div style={{ padding: 18, borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="logo-mark" style={{ width: 40, height: 40, borderRadius: 12 }}>NB</div>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div className="font-display" style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>Navana Bailey Star</div>
              <div style={{ color: 'rgba(255,255,255,.38)', fontSize: 10.5 }}>Management System</div>
            </div>
          )}
        </div>

        {!collapsed && (
          <div style={{ padding: '16px 18px 8px', color: 'rgba(255,255,255,.32)', fontSize: 10, fontWeight: 900, letterSpacing: '.11em', textTransform: 'uppercase' }}>
            Main Menu
          </div>
        )}

        <nav style={{ flex: 1, padding: 10, overflowY: 'auto' }}>
          {navItems.map(({ label, page, icon: Icon, badge }) => (
            <button
              key={page}
              className={`side-btn ${activePage === page ? 'active' : ''}`}
              title={collapsed ? label : undefined}
              aria-current={activePage === page ? 'page' : undefined}
              onClick={() => selectPage(page)}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <Icon size={18} />
              {!collapsed && (
                <>
                  <span style={{ flex: 1, whiteSpace: 'nowrap', fontSize: 13, fontWeight: activePage === page ? 800 : 500 }}>{label}</span>
                  {badge && (
                    <span style={{ fontSize: 10, fontWeight: 900, background: activePage === page ? '#c9a540' : 'rgba(255,255,255,.12)', color: activePage === page ? '#0d1b4b' : 'rgba(255,255,255,.55)', padding: '2px 7px', borderRadius: 999 }}>
                      {badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <button className="side-btn" onClick={() => selectPage('login')} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <LogOut size={18} />
            {!collapsed && <span style={{ fontSize: 13, fontWeight: 700 }}>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="topbar">
          <div className="flex items-center" style={{ gap: 14 }}>
            <button className="icon-btn" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-controls="admin-navigation" aria-expanded={mobileOpen} onClick={toggleNavigation} style={{ background: '#f0f2f6', color: '#0d1b4b' }}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div>
              <h1 className="page-title">{pageTitle}</h1>
              <p className="page-subtitle">{pageSubtitle}</p>
            </div>
          </div>

          <div className="admin-identity flex items-center" aria-label="Signed in as administrator" style={{ gap: 10, padding: '8px 10px', border: '1px solid #e8eaef', borderRadius: 999, background: '#fff' }}>
              <div style={{ width: 32, height: 32, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #c9a540, #e8cc6a)', fontWeight: 900, color: '#0d1b4b' }}>AD</div>
              <div className="admin-identity-copy" style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800 }}>Admin</div>
                <div style={{ fontSize: 10.5, color: '#9ca3af' }}>Management</div>
              </div>
          </div>
        </header>

        <div className="content">{children}</div>
      </main>
    </div>
  )
}

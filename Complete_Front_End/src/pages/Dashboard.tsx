import { AlertCircle, ArrowUpRight, Banknote, Building2, CheckCircle2, Clock, Store, UserPlus } from 'lucide-react'
import AdminLayout from '../components/AdminLayout'
import type { Activity, Page, Shop, Tenant } from '../types'

interface DashboardProps {
  shops: Shop[]
  tenants: Tenant[]
  activities: Activity[]
  navigate: (page: Page, shopNo?: string) => void
}

function taka(value: number) {
  return `৳ ${value.toLocaleString('en-IN')}`
}

function activityPresentation(type: Activity['type']) {
  if (type === 'rent_paid') return { icon: CheckCircle2, color: '#15803d' }
  if (type.startsWith('tenant_')) return { icon: UserPlus, color: '#0d1b4b' }
  if (type === 'rent_updated') return { icon: Clock, color: '#c2410c' }
  return { icon: Store, color: '#c9a540' }
}

function activityTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function Dashboard({ shops, tenants, activities, navigate }: DashboardProps) {
  const occupied = shops.filter((shop) => shop.status === 'Occupied').length
  const vacant = shops.filter((shop) => shop.status === 'Vacant').length
  const totalRent = tenants.reduce((sum, tenant) => sum + tenant.rent, 0)
  const dueRent = tenants.filter((tenant) => tenant.paymentStatus !== 'Paid').reduce((sum, tenant) => sum + tenant.rent, 0)
  const dueTenants = tenants.filter((tenant) => tenant.paymentStatus !== 'Paid')
  const occupancyRate = shops.length ? Math.round((occupied / shops.length) * 100) : 0

  const cards = [
    { title: 'Total Shops', value: shops.length.toString(), sub: 'All registered shop units', icon: Store, bg: '#e8ecf8', color: '#0d1b4b' },
    { title: 'Occupied Shops', value: occupied.toString(), sub: `${occupancyRate}% occupancy rate`, icon: Building2, bg: '#dcfce7', color: '#15803d' },
    { title: 'Vacant Shops', value: vacant.toString(), sub: 'Available for new tenants', icon: AlertCircle, bg: '#ffedd5', color: '#c2410c' },
    { title: 'Rent Due', value: taka(dueRent), sub: `${dueTenants.length} tenants pending`, icon: Banknote, bg: '#fee2e2', color: '#dc2626' },
  ]

  const recent = activities.slice(0, 5).map((activity) => ({
    ...activity,
    ...activityPresentation(activity.type),
    text: activity.message,
    time: activityTime(activity.createdAt),
  }))

  return (
    <AdminLayout navigate={navigate} activePage="dashboard">
      <section className="grid grid-4 gap-16 mb-6">
        {cards.map(({ title, value, sub, icon: Icon, bg, color }) => (
          <div className="soft-card" key={title} style={{ padding: 20 }}>
            <div className="flex items-start justify-between">
              <div>
                <p style={{ color: '#6b7280', margin: 0, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em' }}>{title}</p>
                <p className="font-display" style={{ margin: '8px 0 4px', fontSize: 30, fontWeight: 900, color: '#0d1b4b' }}>{value}</p>
                <p style={{ margin: 0, color: '#9ca3af', fontSize: 12.5 }}>{sub}</p>
              </div>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} color={color} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid dashboard-grid">
        <div className="card" style={{ padding: 22 }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display" style={{ margin: 0, fontWeight: 900, fontSize: 20 }}>Shopping Complex Overview</h2>
              <p className="page-subtitle">High level summary from the current shop and rent data.</p>
            </div>
            <button className="btn btn-outline" onClick={() => navigate('reports')}>View Reports <ArrowUpRight size={15} /></button>
          </div>

          <div className="grid grid-2 gap-16">
            <div className="soft-card" style={{ padding: 18, boxShadow: 'none' }}>
              <div className="flex items-center justify-between mb-3">
                <strong>Occupied vs Vacant</strong>
                <span className="pill pill-blue">{occupancyRate}% occupied</span>
              </div>
              <div className="report-bar"><span style={{ width: `${occupancyRate}%` }} /></div>
              <div className="flex justify-between mt-4 text-small text-muted">
                <span>{occupied} occupied</span>
                <span>{vacant} vacant</span>
              </div>
            </div>

            <div className="soft-card" style={{ padding: 18, boxShadow: 'none' }}>
              <div className="flex items-center justify-between mb-3">
                <strong>Rent Collection</strong>
                <span className="pill pill-warning">{taka(dueRent)} due</span>
              </div>
              <div className="report-bar">
                <span style={{ width: `${totalRent ? Math.round(((totalRent - dueRent) / totalRent) * 100) : 0}%` }} />
              </div>
              <div className="flex justify-between mt-4 text-small text-muted">
                <span>{taka(totalRent - dueRent)} collected</span>
                <span>{taka(totalRent)} total</span>
              </div>
            </div>
          </div>

          <div className="grid grid-3 gap-16 mt-5">
            {['Apparel', 'Electronics', 'Food & Beverage'].map((category) => {
              const count = shops.filter((shop) => shop.category === category).length
              return (
                <button key={category} className="soft-card" onClick={() => navigate('shops')} style={{ padding: 18, textAlign: 'left', border: 0 }}>
                  <p className="font-display" style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>{count}</p>
                  <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>{category} shops</p>
                </button>
              )
            })}
          </div>
        </div>

        <aside className="card" style={{ padding: 22 }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display" style={{ margin: 0, fontWeight: 900, fontSize: 20 }}>Recent Activities</h2>
            <span className="pill pill-gray">Live</span>
          </div>
          <div className="flex flex-col" style={{ gap: 14 }}>
            {recent.map(({ id, icon: Icon, text, time, color }) => (
              <div className="flex items-start" key={id} style={{ gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 12, background: '#f0f2f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={color} />
                </div>
                <div>
                  <p style={{ margin: 0, color: '#374151', fontSize: 13.5, fontWeight: 700, lineHeight: 1.35 }}>{text}</p>
                  <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: 12 }}>{time}</p>
                </div>
              </div>
            ))}
            {recent.length === 0 && <p className="text-muted text-small">No management activity has been recorded yet.</p>}
          </div>

          <div className="mt-6" style={{ padding: 16, borderRadius: 18, background: '#faf3dc', border: '1px solid rgba(201,165,64,.25)' }}>
            <div className="font-display" style={{ fontSize: 16, fontWeight: 900 }}>Quick Actions</div>
            <div className="grid gap-12 mt-4">
              <button className="btn btn-primary" onClick={() => navigate('shops')}>Manage Shops</button>
              <button className="btn btn-outline" onClick={() => navigate('tenants')}>Check Rent Status</button>
              <button className="btn btn-outline" onClick={() => navigate('floor-nav')}>Open Floor Map</button>
            </div>
          </div>
        </aside>
      </section>
    </AdminLayout>
  )
}

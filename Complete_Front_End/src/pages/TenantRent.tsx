import { useMemo, useState } from 'react'
import { AlertCircle, Banknote, CheckCircle2, Eye, Search, X } from 'lucide-react'
import { errorMessage } from '../api'
import AdminLayout from '../components/AdminLayout'
import StatusBadge from '../components/StatusBadge'
import type { Page, PaymentStatus, Tenant } from '../types'

interface TenantRentProps {
  tenants: Tenant[]
  onUpdateStatus: (tenantId: string, status: PaymentStatus) => Promise<Tenant>
  navigate: (page: Page, shopNo?: string) => void
}

function taka(value: number) {
  return `৳ ${value.toLocaleString('en-IN')}`
}

export default function TenantRent({ tenants, onUpdateStatus, navigate }: TenantRentProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | PaymentStatus>('All')
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [message, setMessage] = useState('')
  const [updatingTenantId, setUpdatingTenantId] = useState('')

  const filtered = tenants.filter((tenant) => {
    const query = search.toLowerCase()
    return (
      (tenant.name.toLowerCase().includes(query) || tenant.shopNo.toLowerCase().includes(query) || tenant.businessCategory.toLowerCase().includes(query)) &&
      (statusFilter === 'All' || tenant.paymentStatus === statusFilter)
    )
  })

  const summary = useMemo(() => {
    const total = tenants.reduce((sum, tenant) => sum + tenant.rent, 0)
    const paid = tenants.filter((tenant) => tenant.paymentStatus === 'Paid').reduce((sum, tenant) => sum + tenant.rent, 0)
    const due = total - paid
    return { total, paid, due, paidCount: tenants.filter((tenant) => tenant.paymentStatus === 'Paid').length }
  }, [tenants])

  const updateStatus = async (tenantId: string, status: PaymentStatus) => {
    setUpdatingTenantId(tenantId)
    setMessage('')
    try {
      const updated = await onUpdateStatus(tenantId, status)
      setSelectedTenant((current) => current && current.id === tenantId ? updated : current)
      setMessage(`Payment status updated to ${status}.`)
    } catch (updateError) {
      setMessage(errorMessage(updateError))
    } finally {
      setUpdatingTenantId('')
    }
  }

  const cards = [
    { label: 'Total Monthly Rent', value: taka(summary.total), icon: Banknote, className: 'pill-blue' },
    { label: 'Collected', value: taka(summary.paid), icon: CheckCircle2, className: 'pill-success' },
    { label: 'Outstanding', value: taka(summary.due), icon: AlertCircle, className: 'pill-danger' },
  ]

  return (
    <AdminLayout navigate={navigate} activePage="tenants">
      <section className="grid grid-3 gap-16 mb-6">
        {cards.map(({ label, value, icon: Icon, className }) => (
          <div className="soft-card" key={label} style={{ padding: 20 }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: '#6b7280', margin: 0, fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>{label}</p>
                <p className="font-display" style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 900 }}>{value}</p>
              </div>
              <span className={`pill ${className}`} style={{ width: 46, height: 46, justifyContent: 'center' }}><Icon size={20} /></span>
            </div>
          </div>
        ))}
      </section>

      <div className="card" style={{ padding: 18 }}>
        <div className="flex flex-wrap items-center mb-5" style={{ gap: 12 }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search size={15} style={{ position: 'absolute', left: 13, top: 13, color: '#9ca3af' }} />
            <input className="input" style={{ paddingLeft: 40 }} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by tenant, shop number or category..." />
          </div>
          <select className="select" style={{ width: 170 }} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'All' | PaymentStatus)}>
            <option>All</option>
            <option>Paid</option>
            <option>Due</option>
            <option>Overdue</option>
          </select>
          {message && <span className="pill pill-gray">{message}</span>}
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tenant Name</th>
                <th>Shop No.</th>
                <th>Rent</th>
                <th>Due Date</th>
                <th>Payment Status</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tenant) => (
                <tr key={tenant.id}>
                  <td>
                    <strong style={{ color: '#0d1b4b' }}>{tenant.name}</strong>
                    <div className="text-small text-muted">{tenant.businessCategory} • Since {tenant.startDate}</div>
                  </td>
                  <td><button className="pill pill-blue" onClick={() => navigate('floor-nav', tenant.shopNo)}>{tenant.shopNo}</button></td>
                  <td style={{ fontWeight: 800 }}>{taka(tenant.rent)}</td>
                  <td>{tenant.dueDate}</td>
                  <td><StatusBadge status={tenant.paymentStatus} /></td>
                  <td>{tenant.phone}</td>
                  <td>
                    <div className="flex items-center" style={{ gap: 6 }}>
                      <button className="icon-btn" onClick={() => setSelectedTenant(tenant)} style={{ background: '#e8ecf8', color: '#0d1b4b' }}><Eye size={15} /></button>
                      {tenant.paymentStatus !== 'Paid' && (
                        <button className="btn btn-gold" disabled={updatingTenantId === tenant.id} onClick={() => void updateStatus(tenant.id, 'Paid')} style={{ padding: '8px 10px', fontSize: 12 }}>
                          {updatingTenantId === tenant.id ? 'Saving…' : 'Mark Paid'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center" style={{ padding: 40 }}>
                    <strong>No rent records found.</strong>
                    <div className="text-muted text-small mt-4">Try changing search or filter.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTenant && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="flex items-center justify-between" style={{ padding: 22, borderBottom: '1px solid #f0f2f6' }}>
              <div>
                <h2 className="font-display" style={{ margin: 0, fontWeight: 900 }}>{selectedTenant.name}</h2>
                <p className="page-subtitle">Tenant details and rent status</p>
              </div>
              <button className="icon-btn" onClick={() => setSelectedTenant(null)} style={{ background: '#f0f2f6' }}><X size={16} /></button>
            </div>
            <div style={{ padding: 22 }}>
              <div className="grid grid-2 gap-16">
                <Info label="Shop Number" value={selectedTenant.shopNo} />
                <Info label="Business Category" value={selectedTenant.businessCategory} />
                <Info label="Monthly Rent" value={taka(selectedTenant.rent)} />
                <Info label="Due Date" value={selectedTenant.dueDate} />
                <Info label="Phone" value={selectedTenant.phone} />
                <div>
                  <div className="label">Status</div>
                  <StatusBadge status={selectedTenant.paymentStatus} />
                </div>
              </div>

              <div className="flex mt-6" style={{ gap: 10 }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate('floor-nav', selectedTenant.shopNo)}>View Shop Location</button>
                <button className="btn btn-primary" disabled={selectedTenant.paymentStatus === 'Paid' || updatingTenantId === selectedTenant.id} style={{ flex: 1 }} onClick={() => void updateStatus(selectedTenant.id, 'Paid')}>
                  {selectedTenant.paymentStatus === 'Paid' ? 'Already Paid' : updatingTenantId === selectedTenant.id ? 'Saving…' : 'Mark as Paid'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div style={{ padding: 12, borderRadius: 12, background: '#f8f9fb', color: '#0d1b4b', fontWeight: 800 }}>{value}</div>
    </div>
  )
}

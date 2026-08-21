import { useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { AlertCircle, Banknote, CheckCircle2, Eye, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { errorMessage } from '../api'
import AdminLayout from '../components/AdminLayout'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import type { Page, PaymentStatus, Shop, Tenant } from '../types'

interface TenantRentProps {
  shops: Shop[]
  tenants: Tenant[]
  onCreateTenant: (tenant: Tenant) => Promise<Tenant>
  onUpdateTenant: (currentTenantId: string, tenant: Tenant) => Promise<Tenant>
  onDeleteTenant: (tenantId: string) => Promise<void>
  onUpdateStatus: (tenantId: string, status: PaymentStatus) => Promise<Tenant>
  navigate: (page: Page, shopNo?: string) => void
}

type TenantForm = Omit<Tenant, 'rent'> & { rent: string }

const emptyForm: TenantForm = {
  id: '',
  name: '',
  shopNo: '',
  rent: '',
  dueDate: '',
  paymentStatus: 'Due',
  phone: '',
  businessCategory: '',
  startDate: '',
}

function toForm(tenant: Tenant): TenantForm {
  return { ...tenant, rent: String(tenant.rent) }
}

function taka(value: number) {
  return `৳ ${value.toLocaleString('en-IN')}`
}

export default function TenantRent({
  shops,
  tenants,
  onCreateTenant,
  onUpdateTenant,
  onDeleteTenant,
  onUpdateStatus,
  navigate,
}: TenantRentProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | PaymentStatus>('All')
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<TenantForm>(emptyForm)
  const [deleteTenantId, setDeleteTenantId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [messageIsError, setMessageIsError] = useState(false)
  const [busyTenantId, setBusyTenantId] = useState('')
  const [saving, setSaving] = useState(false)

  const filtered = tenants.filter((tenant) => {
    const query = search.toLowerCase()
    return (
      (tenant.name.toLowerCase().includes(query) || tenant.id.toLowerCase().includes(query) || tenant.shopNo.toLowerCase().includes(query) || tenant.businessCategory.toLowerCase().includes(query)) &&
      (statusFilter === 'All' || tenant.paymentStatus === statusFilter)
    )
  })

  const summary = useMemo(() => {
    const total = tenants.reduce((sum, tenant) => sum + tenant.rent, 0)
    const paid = tenants.filter((tenant) => tenant.paymentStatus === 'Paid').reduce((sum, tenant) => sum + tenant.rent, 0)
    return { total, paid, due: total - paid }
  }, [tenants])

  const availableShops = useMemo(() => {
    const occupiedShopNos = new Set(tenants.filter((tenant) => tenant.id !== editingTenantId).map((tenant) => tenant.shopNo))
    return shops.filter((shop) => !occupiedShopNos.has(shop.no))
  }, [editingTenantId, shops, tenants])

  const openAdd = () => {
    setEditingTenantId(null)
    const firstUnassignedShop = shops.find(
      (shop) => !tenants.some((tenant) => tenant.shopNo === shop.no),
    )
    setForm({ ...emptyForm, shopNo: firstUnassignedShop?.no ?? '' })
    setMessage('')
    setFormOpen(true)
  }

  const openEdit = (tenant: Tenant) => {
    setSelectedTenant(null)
    setEditingTenantId(tenant.id)
    setForm(toForm(tenant))
    setMessage('')
    setFormOpen(true)
  }

  const updateField = (key: keyof TenantForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const saveTenant = async (event: FormEvent) => {
    event.preventDefault()
    const tenant: Tenant = {
      ...form,
      id: form.id.trim().toUpperCase(),
      name: form.name.trim(),
      shopNo: form.shopNo.trim().toUpperCase(),
      rent: Number(form.rent),
      phone: form.phone.trim(),
      businessCategory: form.businessCategory.trim(),
      dueDate: form.dueDate.trim(),
      startDate: form.startDate.trim(),
    }

    setSaving(true)
    setMessage('')
    try {
      if (editingTenantId) await onUpdateTenant(editingTenantId, tenant)
      else await onCreateTenant(tenant)
      setMessage(editingTenantId ? 'Tenant record updated successfully.' : 'Tenant record created successfully.')
      setMessageIsError(false)
      setFormOpen(false)
    } catch (saveError) {
      setMessage(errorMessage(saveError))
      setMessageIsError(true)
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (tenantId: string, status: PaymentStatus) => {
    setBusyTenantId(tenantId)
    setMessage('')
    try {
      const updated = await onUpdateStatus(tenantId, status)
      setSelectedTenant((current) => current?.id === tenantId ? updated : current)
      setMessage(`Payment status updated to ${status}.`)
      setMessageIsError(false)
    } catch (updateError) {
      setMessage(errorMessage(updateError))
      setMessageIsError(true)
    } finally {
      setBusyTenantId('')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTenantId) return
    setBusyTenantId(deleteTenantId)
    setMessage('')
    try {
      await onDeleteTenant(deleteTenantId)
      setMessage(`Tenant ${deleteTenantId} was removed.`)
      setMessageIsError(false)
      setDeleteTenantId(null)
    } catch (deleteError) {
      setMessage(errorMessage(deleteError))
      setMessageIsError(true)
      setDeleteTenantId(null)
    } finally {
      setBusyTenantId('')
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
              <span aria-hidden="true" className={`pill ${className}`} style={{ width: 46, height: 46, justifyContent: 'center' }}><Icon size={20} /></span>
            </div>
          </div>
        ))}
      </section>

      <div className="card" style={{ padding: 18 }}>
        <div className="flex flex-wrap items-center mb-5" style={{ gap: 12 }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <label className="sr-only" htmlFor="tenant-search">Search tenants</label>
            <Search aria-hidden="true" size={15} style={{ position: 'absolute', left: 13, top: 13, color: '#9ca3af' }} />
            <input id="tenant-search" className="input" style={{ paddingLeft: 40 }} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by tenant ID, name, shop or category..." />
          </div>
          <label className="sr-only" htmlFor="tenant-status-filter">Filter tenants by payment status</label>
          <select id="tenant-status-filter" className="select filter-select-small" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'All' | PaymentStatus)}>
            <option>All</option>
            <option>Paid</option>
            <option>Due</option>
            <option>Overdue</option>
          </select>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Tenant</button>
        </div>

        {message && <div role={messageIsError ? 'alert' : 'status'} aria-live={messageIsError ? 'assertive' : 'polite'} className={`pill ${messageIsError ? 'pill-danger' : 'pill-gray'} mb-4`}>{message}</div>}

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Shop</th>
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
                    <div className="text-small text-muted">{tenant.id} · {tenant.businessCategory}</div>
                  </td>
                  <td><button className="pill pill-blue" onClick={() => navigate('floor-nav', tenant.shopNo)}>{tenant.shopNo}</button></td>
                  <td style={{ fontWeight: 800 }}>{taka(tenant.rent)}</td>
                  <td>{tenant.dueDate}</td>
                  <td>
                    <label className="sr-only" htmlFor={`status-${tenant.id}`}>Payment status for {tenant.name}</label>
                    <select id={`status-${tenant.id}`} className="select compact-select" value={tenant.paymentStatus} disabled={busyTenantId === tenant.id} onChange={(event) => void updateStatus(tenant.id, event.target.value as PaymentStatus)}>
                      <option>Paid</option><option>Due</option><option>Overdue</option>
                    </select>
                  </td>
                  <td>{tenant.phone}</td>
                  <td>
                    <div className="flex items-center" style={{ gap: 6 }}>
                      <button className="icon-btn" aria-label={`View ${tenant.name}`} onClick={() => setSelectedTenant(tenant)} style={{ background: '#ecfdf5', color: '#15803d' }}><Eye size={15} /></button>
                      <button className="icon-btn" aria-label={`Edit ${tenant.name}`} onClick={() => openEdit(tenant)} style={{ background: '#e8ecf8', color: '#0d1b4b' }}><Pencil size={15} /></button>
                      <button className="icon-btn" aria-label={`Delete ${tenant.name}`} onClick={() => setDeleteTenantId(tenant.id)} style={{ background: '#fee2e2', color: '#dc2626' }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center" style={{ padding: 40 }}><strong>No tenant records found.</strong><div className="text-muted text-small mt-4">Try changing search or filter.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <Modal title={editingTenantId ? 'Edit tenant' : 'Add tenant'} description="Tenant identity, assigned shop, rent, contact, and payment status." onClose={() => setFormOpen(false)}>
          <form onSubmit={saveTenant}>
            <div className="modal-heading">
              <div><h2 className="font-display" style={{ margin: 0, fontWeight: 900 }}>{editingTenantId ? 'Edit Tenant' : 'Add Tenant'}</h2><p className="page-subtitle">Maintain the complete protected tenant record.</p></div>
              <button type="button" className="icon-btn" aria-label="Close tenant form" onClick={() => setFormOpen(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="grid grid-2 gap-16">
                <FormField id="tenant-id" label="Tenant ID"><input id="tenant-id" className="input" required value={form.id} onChange={(event) => updateField('id', event.target.value)} placeholder="T-009" /></FormField>
                <FormField id="tenant-name" label="Tenant name"><input id="tenant-name" className="input" required value={form.name} onChange={(event) => updateField('name', event.target.value)} /></FormField>
                <FormField id="tenant-shop" label="Assigned shop"><select id="tenant-shop" className="select" required value={form.shopNo} onChange={(event) => updateField('shopNo', event.target.value)}><option value="">Select a shop</option>{availableShops.map((shop) => <option key={shop.no} value={shop.no}>{shop.no} - {shop.name}</option>)}</select></FormField>
                <FormField id="tenant-rent" label="Monthly rent"><input id="tenant-rent" className="input" type="number" min="0" step="1" required value={form.rent} onChange={(event) => updateField('rent', event.target.value)} /></FormField>
                <FormField id="tenant-due-date" label="Due date"><input id="tenant-due-date" className="input" required value={form.dueDate} onChange={(event) => updateField('dueDate', event.target.value)} placeholder="05 Sep 2026" /></FormField>
                <FormField id="tenant-payment" label="Payment status"><select id="tenant-payment" className="select" value={form.paymentStatus} onChange={(event) => updateField('paymentStatus', event.target.value as PaymentStatus)}><option>Paid</option><option>Due</option><option>Overdue</option></select></FormField>
                <FormField id="tenant-phone" label="Phone"><input id="tenant-phone" className="input" required value={form.phone} onChange={(event) => updateField('phone', event.target.value)} /></FormField>
                <FormField id="tenant-category" label="Business category"><input id="tenant-category" className="input" required value={form.businessCategory} onChange={(event) => updateField('businessCategory', event.target.value)} /></FormField>
                <FormField id="tenant-start-date" label="Tenancy start"><input id="tenant-start-date" className="input" required value={form.startDate} onChange={(event) => updateField('startDate', event.target.value)} placeholder="Aug 2026" /></FormField>
              </div>
              {message && messageIsError && <div role="alert" className="pill pill-danger mt-5">{message}</div>}
              <div className="modal-actions"><button type="button" className="btn btn-muted" onClick={() => setFormOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editingTenantId ? 'Save Changes' : 'Add Tenant'}</button></div>
            </div>
          </form>
        </Modal>
      )}

      {selectedTenant && (
        <Modal title={`${selectedTenant.name} tenant details`} onClose={() => setSelectedTenant(null)} style={{ maxWidth: 540 }}>
          <div className="modal-heading"><div><h2 className="font-display" style={{ margin: 0, fontWeight: 900 }}>{selectedTenant.name}</h2><p className="page-subtitle">Tenant details and current rent status</p></div><button className="icon-btn" aria-label="Close tenant details" onClick={() => setSelectedTenant(null)}><X size={16} /></button></div>
          <div className="modal-body">
            <div className="grid grid-2 gap-16">
              <Info label="Tenant ID" value={selectedTenant.id} /><Info label="Shop Number" value={selectedTenant.shopNo} /><Info label="Business Category" value={selectedTenant.businessCategory} /><Info label="Monthly Rent" value={taka(selectedTenant.rent)} /><Info label="Due Date" value={selectedTenant.dueDate} /><Info label="Phone" value={selectedTenant.phone} />
            </div>
            <div className="mt-5"><div className="label">Status</div><StatusBadge status={selectedTenant.paymentStatus} /></div>
            <div className="modal-actions"><button className="btn btn-outline" onClick={() => navigate('floor-nav', selectedTenant.shopNo)}>View Shop Location</button><button className="btn btn-primary" onClick={() => openEdit(selectedTenant)}>Edit Tenant</button></div>
          </div>
        </Modal>
      )}

      {deleteTenantId && (
        <Modal title={`Delete tenant ${deleteTenantId}`} description="This action removes the tenant and marks the linked shop vacant." onClose={() => setDeleteTenantId(null)} style={{ maxWidth: 400 }}>
          <div className="modal-body text-center">
            <span aria-hidden="true" className="pill pill-danger" style={{ width: 56, height: 56, justifyContent: 'center' }}><Trash2 size={24} /></span>
            <h2 className="font-display">Delete Tenant {deleteTenantId}?</h2>
            <p className="text-muted">The tenant record will be removed and the assigned shop will become vacant.</p>
            <div className="modal-actions"><button className="btn btn-muted" onClick={() => setDeleteTenantId(null)}>Cancel</button><button className="btn btn-danger" disabled={busyTenantId === deleteTenantId} onClick={() => void confirmDelete()}>{busyTenantId === deleteTenantId ? 'Deleting...' : 'Delete Tenant'}</button></div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}

function FormField({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return <div><label className="label" htmlFor={id}>{label}</label>{children}</div>
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="label">{label}</div><div className="detail-value">{value}</div></div>
}

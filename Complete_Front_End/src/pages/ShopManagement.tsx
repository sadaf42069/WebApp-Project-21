import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { errorMessage } from '../api'
import AdminLayout from '../components/AdminLayout'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import type { Page, Shop, ShopStatus } from '../types'

interface ShopManagementProps {
  shops: Shop[]
  onCreateShop: (shop: Shop) => Promise<void>
  onUpdateShop: (currentShopNo: string, shop: Shop) => Promise<void>
  onDeleteShop: (shopNo: string) => Promise<void>
  navigate: (page: Page, shopNo?: string) => void
}

type ShopForm = Omit<Shop, 'size'> & { size: string }

const emptyForm: ShopForm = {
  no: '',
  name: '',
  category: '',
  size: '',
  floor: '1st Floor',
  status: 'Occupied',
  contact: '',
  openingHours: '10:00 AM - 9:00 PM',
  description: '',
}

function toForm(shop: Shop): ShopForm {
  return { ...shop, size: String(shop.size) }
}

function categoryClass(category: string) {
  const colors: Record<string, string> = {
    Apparel: '#ede9fe',
    Electronics: '#dbeafe',
    'Food & Beverage': '#fef3c7',
    Kids: '#fce7f3',
    Cosmetics: '#fdf4ff',
    Books: '#ecfdf5',
    Sports: '#fff7ed',
    Health: '#f0fdf4',
    Jewellery: '#fdf8e1',
    Accessories: '#f5f3ff',
    Footwear: '#fff1f2',
  }
  return colors[category] ?? '#f3f4f6'
}

export default function ShopManagement({ shops, onCreateShop, onUpdateShop, onDeleteShop, navigate }: ShopManagementProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [floorFilter, setFloorFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState<'All' | ShopStatus>('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingShopNo, setEditingShopNo] = useState<string | null>(null)
  const [form, setForm] = useState<ShopForm>(emptyForm)
  const [deleteShopNo, setDeleteShopNo] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const categories = useMemo(() => ['All', ...Array.from(new Set(shops.map((shop) => shop.category))).sort()], [shops])
  const floors = useMemo(() => ['All', ...Array.from(new Set(shops.map((shop) => shop.floor))).sort()], [shops])

  const filtered = shops.filter((shop) => {
    const query = search.toLowerCase()
    return (
      (shop.no.toLowerCase().includes(query) || shop.name.toLowerCase().includes(query) || shop.category.toLowerCase().includes(query)) &&
      (categoryFilter === 'All' || shop.category === categoryFilter) &&
      (floorFilter === 'All' || shop.floor === floorFilter) &&
      (statusFilter === 'All' || shop.status === statusFilter)
    )
  })

  const openAdd = () => {
    setEditingShopNo(null)
    setForm(emptyForm)
    setMessage('')
    setModalOpen(true)
  }

  const openEdit = (shop: Shop) => {
    setEditingShopNo(shop.no)
    setForm(toForm(shop))
    setMessage('')
    setModalOpen(true)
  }

  const updateField = (key: keyof ShopForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const saveShop = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.no.trim() || !form.name.trim()) {
      setMessage('Shop number and shop name are required.')
      return
    }

    const nextShop: Shop = {
      ...form,
      no: form.no.trim().toUpperCase(),
      name: form.name.trim(),
      category: form.category.trim() || 'General',
      size: Number(form.size) || 0,
      contact: form.contact.trim() || 'Management Office',
      description: form.description.trim() || 'No description added yet.',
    }

    setSaving(true)
    setMessage('')
    try {
      if (editingShopNo) await onUpdateShop(editingShopNo, nextShop)
      else await onCreateShop(nextShop)
      setMessage(editingShopNo ? 'Shop information updated successfully.' : 'New shop added successfully.')
      setModalOpen(false)
    } catch (saveError) {
      setMessage(errorMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteShopNo) return
    setDeleting(true)
    setMessage('')
    try {
      await onDeleteShop(deleteShopNo)
      setMessage(`Shop ${deleteShopNo} removed from the list.`)
      setDeleteShopNo(null)
    } catch (deleteError) {
      setMessage(errorMessage(deleteError))
      setDeleteShopNo(null)
    } finally {
      setDeleting(false)
    }
  }

  const occupied = shops.filter((shop) => shop.status === 'Occupied').length
  const vacant = shops.filter((shop) => shop.status === 'Vacant').length

  return (
    <AdminLayout navigate={navigate} activePage="shops">
      <div className="flex flex-wrap items-center mb-5" style={{ gap: 12 }}>
        <span className="pill pill-blue">{shops.length} total shops</span>
        <span className="pill pill-success">{occupied} occupied</span>
        <span className="pill pill-warning">{vacant} vacant</span>
        {message && <span role="status" aria-live="polite" className="pill pill-gray">{message}</span>}
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div className="flex flex-wrap items-center mb-5" style={{ gap: 12 }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <label className="sr-only" htmlFor="shop-search">Search shops</label>
            <Search aria-hidden="true" size={15} style={{ position: 'absolute', left: 13, top: 13, color: '#9ca3af' }} />
            <input id="shop-search" className="input" style={{ paddingLeft: 40 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by shop number, name or category..." />
          </div>
          <label className="sr-only" htmlFor="shop-category-filter">Filter shops by category</label>
          <select id="shop-category-filter" className="select filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
          <label className="sr-only" htmlFor="shop-floor-filter">Filter shops by floor</label>
          <select id="shop-floor-filter" className="select filter-select-small" value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)}>
            {floors.map((floor) => <option key={floor}>{floor}</option>)}
          </select>
          <label className="sr-only" htmlFor="shop-status-filter">Filter shops by occupancy status</label>
          <select id="shop-status-filter" className="select filter-select-small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'All' | ShopStatus)}>
            <option>All</option>
            <option>Occupied</option>
            <option>Vacant</option>
          </select>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Shop</button>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Shop No.</th>
                <th>Shop Name</th>
                <th>Category</th>
                <th>Size</th>
                <th>Floor</th>
                <th>Status</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((shop) => (
                <tr key={shop.no}>
                  <td><span className="pill pill-blue">{shop.no}</span></td>
                  <td>
                    <strong style={{ color: '#0d1b4b' }}>{shop.name}</strong>
                    <div className="text-small text-muted">{shop.openingHours}</div>
                  </td>
                  <td>
                    <span className="pill" style={{ background: categoryClass(shop.category), color: '#0d1b4b' }}>{shop.category}</span>
                  </td>
                  <td>{shop.size.toLocaleString()} sq.ft</td>
                  <td>{shop.floor}</td>
                  <td><StatusBadge status={shop.status} /></td>
                  <td>{shop.contact}</td>
                  <td>
                    <div className="flex items-center" style={{ gap: 6 }}>
                      <button className="icon-btn" aria-label={`View ${shop.name} on floor map`} onClick={() => navigate('floor-nav', shop.no)} style={{ background: '#ecfdf5', color: '#15803d' }}><Eye size={15} /></button>
                      <button className="icon-btn" aria-label={`Edit ${shop.name}`} onClick={() => openEdit(shop)} style={{ background: '#e8ecf8', color: '#0d1b4b' }}><Pencil size={15} /></button>
                      <button className="icon-btn" aria-label={`Delete ${shop.name}`} onClick={() => setDeleteShopNo(shop.no)} style={{ background: '#fee2e2', color: '#dc2626' }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center" style={{ padding: 40 }}>
                    <strong>No shops found.</strong>
                    <div className="text-muted text-small mt-4">Try changing search or filters.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <Modal title={editingShopNo ? 'Edit shop' : 'Add shop'} description="Shop identity, category, floor, contact, hours, and occupancy status." onClose={() => setModalOpen(false)}>
          <form onSubmit={saveShop}>
            <div className="flex items-center justify-between" style={{ padding: 22, borderBottom: '1px solid #f0f2f6' }}>
              <div>
                <h2 className="font-display" style={{ margin: 0, fontWeight: 900 }}>{editingShopNo ? 'Edit Shop' : 'Add New Shop'}</h2>
                <p className="page-subtitle">{editingShopNo ? 'Update existing shop details.' : 'Register a new shop record.'}</p>
              </div>
              <button type="button" className="icon-btn" aria-label="Close shop form" onClick={() => setModalOpen(false)} style={{ background: '#f0f2f6' }}><X size={16} /></button>
            </div>

            <div style={{ padding: 22 }}>
              <div className="grid grid-2 gap-16">
                <div>
                  <label className="label" htmlFor="shop-number">Shop Number</label>
                  <input id="shop-number" className="input" required value={form.no} onChange={(e) => updateField('no', e.target.value)} placeholder="A-01" />
                </div>
                <div>
                  <label className="label" htmlFor="shop-name">Shop Name</label>
                  <input id="shop-name" className="input" required value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Trendy Fashion" />
                </div>
                <div>
                  <label className="label" htmlFor="shop-category">Category</label>
                  <input id="shop-category" className="input" value={form.category} onChange={(e) => updateField('category', e.target.value)} placeholder="Apparel" />
                </div>
                <div>
                  <label className="label" htmlFor="shop-size">Size (sq.ft)</label>
                  <input id="shop-size" className="input" type="number" min="0" value={form.size} onChange={(e) => updateField('size', e.target.value)} placeholder="450" />
                </div>
                <div>
                  <label className="label" htmlFor="shop-floor">Floor</label>
                  <select id="shop-floor" className="select" value={form.floor} onChange={(e) => updateField('floor', e.target.value)}>
                    <option>Basement</option>
                    <option>Ground Floor</option>
                    <option>1st Floor</option>
                    <option>2nd Floor</option>
                    <option>3rd Floor</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="shop-status">Status</label>
                  <select id="shop-status" className="select" value={form.status} onChange={(e) => updateField('status', e.target.value as ShopStatus)}>
                    <option>Occupied</option>
                    <option>Vacant</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="shop-contact">Contact</label>
                  <input id="shop-contact" className="input" value={form.contact} onChange={(e) => updateField('contact', e.target.value)} placeholder="+880..." />
                </div>
                <div>
                  <label className="label" htmlFor="shop-hours">Opening Hours</label>
                  <input id="shop-hours" className="input" value={form.openingHours} onChange={(e) => updateField('openingHours', e.target.value)} placeholder="10:00 AM - 9:00 PM" />
                </div>
              </div>
              <div className="mt-5">
                <label className="label" htmlFor="shop-description">Description</label>
                <textarea id="shop-description" className="textarea" value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Short shop description" />
              </div>

              {message && <div role="alert" className="pill pill-danger mt-5" style={{ width: '100%', justifyContent: 'center' }}>{message}</div>}

              <div className="flex justify-between mt-6" style={{ gap: 12 }}>
                <button type="button" className="btn btn-muted" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving…' : editingShopNo ? 'Save Changes' : 'Add Shop'}</button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {deleteShopNo && (
        <Modal title={`Delete shop ${deleteShopNo}`} description="This action removes the shop from prototype data." onClose={() => setDeleteShopNo(null)} style={{ maxWidth: 390 }}>
          <div style={{ padding: 26, textAlign: 'center' }}>
            <div style={{ width: 58, height: 58, margin: '0 auto 16px', borderRadius: 18, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 color="#dc2626" />
            </div>
            <h2 className="font-display" style={{ margin: 0 }}>Delete Shop {deleteShopNo}?</h2>
            <p className="text-muted" style={{ lineHeight: 1.6 }}>This will remove the shop from the prototype data. You can restore demo data from Settings.</p>
            <div className="flex" style={{ gap: 10 }}>
              <button className="btn btn-muted" style={{ flex: 1 }} onClick={() => setDeleteShopNo(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleting} style={{ flex: 1 }} onClick={() => void confirmDelete()}>{deleting ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}

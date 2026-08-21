import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowRight, Clock, Layers, MapPin, Phone, Search, Tag, X } from 'lucide-react'
import Modal from '../components/Modal'
import PublicHeader from '../components/PublicHeader'
import StatusBadge from '../components/StatusBadge'
import type { Page, Shop } from '../types'

interface ShopDirectoryProps {
  shops: Shop[]
  selectedShopNo?: string
  navigate: (page: Page, shopNo?: string) => void
}

const emojiByCategory: Record<string, string> = {
  Apparel: '👕',
  Electronics: '📱',
  'Food & Beverage': '🍽️',
  Kids: '🧸',
  Cosmetics: '💄',
  Books: '📚',
  Sports: '⚽',
  Health: '💊',
  Jewellery: '💍',
  Accessories: '👜',
  Footwear: '👟',
}

export default function ShopDirectory({ shops, selectedShopNo, navigate }: ShopDirectoryProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All Categories')
  const [floor, setFloor] = useState('All Floors')

  const categories = useMemo(() => ['All Categories', ...Array.from(new Set(shops.map((shop) => shop.category))).sort()], [shops])
  const floors = useMemo(() => ['All Floors', ...Array.from(new Set(shops.map((shop) => shop.floor))).sort()], [shops])

  const filtered = shops.filter((shop) => {
    const query = search.toLowerCase()
    return (
      (shop.name.toLowerCase().includes(query) || shop.category.toLowerCase().includes(query) || shop.no.toLowerCase().includes(query)) &&
      (category === 'All Categories' || shop.category === category) &&
      (floor === 'All Floors' || shop.floor === floor)
    )
  })

  const selectedShop = shops.find((shop) => shop.no === selectedShopNo)

  return (
    <div className="app-shell">
      <PublicHeader navigate={navigate} activePage="directory" />

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '42px 24px' }}>
        <div className="card" style={{ padding: 30, background: 'linear-gradient(135deg, #fff, #fdf9ee)' }}>
          <div className="flex flex-wrap items-center justify-between" style={{ gap: 20 }}>
            <div>
              <span className="pill pill-blue"><Search size={12} /> Customer Directory</span>
              <h1 className="font-display" style={{ margin: '14px 0 10px', fontWeight: 900, fontSize: 42, color: '#0d1b4b', lineHeight: 1.05 }}>
                Find Shops at<br />Navana Bailey Star
              </h1>
              <p className="text-muted" style={{ maxWidth: 620, lineHeight: 1.7 }}>
                Search by shop name, category, floor or shop number, then open the floor map to find the exact location.
              </p>
            </div>
            <div className="grid grid-3 gap-12" style={{ minWidth: 330 }}>
              <MiniStat value={shops.length.toString()} label="Shops" />
              <MiniStat value={floors.length - 1} label="Floors" />
              <MiniStat value={categories.length - 1} label="Categories" />
            </div>
          </div>

          <div className="flex flex-wrap mt-6" style={{ gap: 12 }}>
            <div style={{ position: 'relative', flex: '1 1 320px' }}>
              <label className="sr-only" htmlFor="directory-search">Search shops</label>
              <Search aria-hidden="true" size={15} style={{ position: 'absolute', left: 14, top: 13, color: '#9ca3af' }} />
              <input id="directory-search" className="input" style={{ paddingLeft: 42 }} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by shop name, category or shop number..." />
            </div>
            <label className="sr-only" htmlFor="directory-category">Filter by category</label>
            <select id="directory-category" className="select filter-select" value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
            <label className="sr-only" htmlFor="directory-floor">Filter by floor</label>
            <select id="directory-floor" className="select filter-select filter-select-small" value={floor} onChange={(event) => setFloor(event.target.value)}>
              {floors.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 mb-4">
          <div>
            <h2 className="font-display" style={{ margin: 0, fontWeight: 900, fontSize: 22 }}>All Shops</h2>
            <p className="page-subtitle" role="status" aria-live="polite">{filtered.length} result(s) found and displayed</p>
          </div>
          <button className="btn btn-outline" onClick={() => navigate('floor-nav')}>Open Full Floor Map <ArrowRight size={15} /></button>
        </div>

        <section className="grid grid-4 gap-20">
          {filtered.map((shop) => (
            <article key={shop.no} className="card shop-card">
              <div className="shop-image">{emojiByCategory[shop.category] ?? '🏪'}</div>
              <div style={{ padding: 18 }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="pill pill-blue">{shop.no}</span>
                  <StatusBadge status={shop.status} />
                </div>
                <h3 className="font-display" style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#0d1b4b' }}>{shop.name}</h3>
                <p className="text-muted text-small" style={{ lineHeight: 1.5, minHeight: 38 }}>{shop.description}</p>
                <div className="flex flex-wrap mb-4" style={{ gap: 7 }}>
                  <span className="pill pill-gray"><Tag size={11} /> {shop.category}</span>
                  <span className="pill pill-gray"><Layers size={11} /> {shop.floor}</span>
                </div>
                <div className="shop-card-actions">
                  <button className="btn btn-outline" onClick={() => navigate('directory', shop.no)}>View Details</button>
                  <button className="btn btn-primary" onClick={() => navigate('floor-nav', shop.no)}><MapPin size={15} /> Location</button>
                </div>
              </div>
            </article>
          ))}
        </section>

        {filtered.length === 0 && (
          <div className="card text-center" style={{ padding: 44 }}>
            <strong>No shops found.</strong>
            <p className="text-muted">Try a different keyword, category or floor.</p>
          </div>
        )}
      </section>

      {selectedShop && (
        <Modal title={`${selectedShop.name} shop details`} description={`Public details for shop ${selectedShop.no}.`} onClose={() => navigate('directory')} style={{ maxWidth: 560 }}>
          <div className="modal-heading">
            <div>
              <span className="pill pill-blue">{selectedShop.no}</span>
              <h2 className="font-display" style={{ margin: '10px 0 0', fontWeight: 900 }}>{selectedShop.name}</h2>
            </div>
            <button className="icon-btn" aria-label="Close shop details" onClick={() => navigate('directory')}><X size={16} /></button>
          </div>
          <div className="modal-body">
            <p className="text-muted" style={{ lineHeight: 1.7 }}>{selectedShop.description}</p>
            <div className="grid grid-2 gap-16 mt-5">
              <Detail icon={<Tag size={16} />} label="Category" value={selectedShop.category} />
              <Detail icon={<Layers size={16} />} label="Floor" value={selectedShop.floor} />
              <Detail icon={<Clock size={16} />} label="Opening hours" value={selectedShop.openingHours} />
              <Detail icon={<Phone size={16} />} label="Contact" value={selectedShop.contact} />
            </div>
            <div className="flex items-center justify-between mt-5">
              <StatusBadge status={selectedShop.status} />
              <strong>{selectedShop.size.toLocaleString()} sq.ft</strong>
            </div>
            <button className="btn btn-primary mt-6" style={{ width: '100%' }} onClick={() => navigate('floor-nav', selectedShop.no)}>
              <MapPin size={15} /> Show on Floor Map
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Detail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="detail-row">
      <span aria-hidden="true" className="pill pill-blue">{icon}</span>
      <span><span className="label">{label}</span><strong>{value}</strong></span>
    </div>
  )
}

function MiniStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="soft-card text-center" style={{ padding: 16, boxShadow: 'none' }}>
      <div className="font-display" style={{ fontSize: 26, fontWeight: 900 }}>{value}</div>
      <div className="text-muted text-small">{label}</div>
    </div>
  )
}

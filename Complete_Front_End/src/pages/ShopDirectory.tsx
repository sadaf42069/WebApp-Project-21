import { useMemo, useState } from 'react'
import { ArrowRight, Layers, MapPin, Search, Star, Tag } from 'lucide-react'
import PublicHeader from '../components/PublicHeader'
import StatusBadge from '../components/StatusBadge'
import type { Page, Shop } from '../types'

interface ShopDirectoryProps {
  shops: Shop[]
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

export default function ShopDirectory({ shops, navigate }: ShopDirectoryProps) {
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

  const popular = filtered.slice(0, 8)

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
              <Search size={15} style={{ position: 'absolute', left: 14, top: 13, color: '#9ca3af' }} />
              <input className="input" style={{ paddingLeft: 42 }} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by shop name, category or shop number..." />
            </div>
            <select className="select" style={{ width: 210 }} value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select className="select" style={{ width: 160 }} value={floor} onChange={(event) => setFloor(event.target.value)}>
              {floors.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 mb-4">
          <div>
            <h2 className="font-display" style={{ margin: 0, fontWeight: 900, fontSize: 22 }}>Popular Shops</h2>
            <p className="page-subtitle">{filtered.length} result(s) found</p>
          </div>
          <button className="btn btn-outline" onClick={() => navigate('floor-nav')}>Open Full Floor Map <ArrowRight size={15} /></button>
        </div>

        <section className="grid grid-4 gap-20">
          {popular.map((shop) => (
            <article key={shop.no} className="card shop-card">
              <div className="shop-image">{emojiByCategory[shop.category] ?? '🏪'}</div>
              <div style={{ padding: 18 }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="pill pill-blue">{shop.no}</span>
                  <span className="flex items-center" style={{ gap: 4, color: '#c9a540', fontWeight: 900, fontSize: 12 }}>
                    <Star size={13} fill="#c9a540" /> 4.{shop.no.charCodeAt(0) % 9}
                  </span>
                </div>
                <h3 className="font-display" style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#0d1b4b' }}>{shop.name}</h3>
                <p className="text-muted text-small" style={{ lineHeight: 1.5, minHeight: 38 }}>{shop.description}</p>
                <div className="flex flex-wrap mb-4" style={{ gap: 7 }}>
                  <span className="pill pill-gray"><Tag size={11} /> {shop.category}</span>
                  <span className="pill pill-gray"><Layers size={11} /> {shop.floor}</span>
                  <StatusBadge status={shop.status} />
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('floor-nav', shop.no)}>
                  <MapPin size={15} /> View Location
                </button>
              </div>
            </article>
          ))}
        </section>

        {popular.length === 0 && (
          <div className="card text-center" style={{ padding: 44 }}>
            <strong>No shops found.</strong>
            <p className="text-muted">Try a different keyword, category or floor.</p>
          </div>
        )}
      </section>
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

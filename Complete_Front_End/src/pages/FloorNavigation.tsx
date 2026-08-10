import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Building2, DoorOpen, Home, MapPin, Navigation, Search, Store, X } from 'lucide-react'
import PublicHeader from '../components/PublicHeader'
import StatusBadge from '../components/StatusBadge'
import type { Page, Shop } from '../types'

interface FloorNavigationProps {
  shops: Shop[]
  selectedShopNo: string
  navigate: (page: Page, shopNo?: string) => void
}

const floors = ['Basement', 'Ground Floor', '1st Floor', '2nd Floor', '3rd Floor']

function facility(label: string, icon: string) {
  return (
    <div className="facility">
      <div>
        <div style={{ fontSize: 26 }}>{icon}</div>
        <div style={{ fontSize: 11, fontWeight: 900, color: '#6b7280', marginTop: 6 }}>{label}</div>
      </div>
    </div>
  )
}

export default function FloorNavigation({ shops, selectedShopNo, navigate }: FloorNavigationProps) {
  const selectedFromProps = shops.find((shop) => shop.no === selectedShopNo)
  const [activeFloor, setActiveFloor] = useState(selectedFromProps?.floor ?? '1st Floor')
  const [selectedNo, setSelectedNo] = useState(selectedShopNo)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const found = shops.find((shop) => shop.no === selectedShopNo)
    if (found) {
      setActiveFloor(found.floor)
      setSelectedNo(found.no)
    }
  }, [selectedShopNo, shops])

  const floorShops = shops.filter((shop) => shop.floor === activeFloor)
  const selectedShop = shops.find((shop) => shop.no === selectedNo)
  const searchResults = useMemo(() => {
    const query = search.toLowerCase()
    return shops.filter((shop) => shop.name.toLowerCase().includes(query) || shop.no.toLowerCase().includes(query)).slice(0, 5)
  }, [search, shops])

  const mapCells: Array<Shop | 'corridor' | 'elevator' | 'stairs' | 'washroom' | 'entrance'> = [
    floorShops[0] ?? 'corridor',
    floorShops[1] ?? 'corridor',
    floorShops[2] ?? 'corridor',
    floorShops[3] ?? 'corridor',
    'elevator',
    'stairs',
    floorShops[4] ?? 'corridor',
    'corridor',
    'corridor',
    'corridor',
    'washroom',
    floorShops[5] ?? 'corridor',
    floorShops[6] ?? 'corridor',
    floorShops[7] ?? 'corridor',
    floorShops[8] ?? 'corridor',
    floorShops[9] ?? 'corridor',
    'entrance',
    floorShops[10] ?? 'corridor',
  ]

  return (
    <div className="app-shell">
      <PublicHeader navigate={navigate} activePage="floor-nav" />

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '34px 24px' }}>
        <div className="flex flex-wrap items-center justify-between mb-5" style={{ gap: 16 }}>
          <div>
            <span className="pill pill-blue"><Navigation size={12} /> Interactive Floor Map</span>
            <h1 className="font-display" style={{ margin: '14px 0 6px', fontWeight: 900, fontSize: 36 }}>Digital Floor Navigation</h1>
            <p className="text-muted">Select a floor, search a shop, and highlight its exact location.</p>
          </div>
          <button className="btn btn-outline" onClick={() => navigate('directory')}><Search size={15} /> Back to Directory</button>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div className="flex flex-wrap items-center justify-between mb-5" style={{ gap: 12 }}>
            <div className="flex flex-wrap" style={{ gap: 8 }}>
              {floors.map((floor) => (
                <button key={floor} className={`btn ${activeFloor === floor ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveFloor(floor)}>
                  {floor}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative', minWidth: 280 }}>
              <Search size={15} style={{ position: 'absolute', left: 13, top: 13, color: '#9ca3af' }} />
              <input className="input" style={{ paddingLeft: 40 }} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shop..." />
              {search && (
                <div className="card" style={{ position: 'absolute', top: 48, left: 0, right: 0, zIndex: 20, padding: 8 }}>
                  {searchResults.map((shop) => (
                    <button key={shop.no} onClick={() => { setSelectedNo(shop.no); setActiveFloor(shop.floor); setSearch('') }} style={{ width: '100%', border: 0, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 10 }}>
                      <span><strong>{shop.name}</strong><br /><span className="text-small text-muted">{shop.no} • {shop.floor}</span></span>
                      <MapPin size={15} color="#c9a540" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 330px', gap: 18 }}>
            <div>
              <div className="floor-grid">
                {mapCells.map((cell, index) => {
                  if (cell === 'corridor') return <div key={`c-${index}`} className="facility" style={{ background: 'repeating-linear-gradient(90deg, #e8eaef 0, #e8eaef 8px, #f8f9fb 8px, #f8f9fb 22px)' }}>Main Corridor</div>
                  if (cell === 'elevator') return <div key="elevator">{facility('Elevator', '🛗')}</div>
                  if (cell === 'stairs') return <div key="stairs">{facility('Escalator', '🚶')}</div>
                  if (cell === 'washroom') return <div key="washroom">{facility('Washroom', '🚻')}</div>
                  if (cell === 'entrance') return <div key="entrance">{facility('You are here', '📍')}</div>

                  const shop = cell
                  const isSelected = shop.no === selectedNo
                  const isHighlighted = ['A-01', 'A-03', 'A-08'].includes(shop.no)
                  return (
                    <button
                      key={shop.no}
                      className={`floor-cell ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${shop.status === 'Vacant' ? 'vacant' : ''}`}
                      onClick={() => setSelectedNo(shop.no)}
                    >
                      <div className="flex items-center justify-between">
                        <strong style={{ fontFamily: 'monospace' }}>{shop.no}</strong>
                        {shop.status === 'Vacant' ? <DoorOpen size={15} /> : <Store size={15} />}
                      </div>
                      <div style={{ marginTop: 12, fontWeight: 900, lineHeight: 1.25 }}>{shop.name}</div>
                      <div style={{ fontSize: 11.5, opacity: .72, marginTop: 6 }}>{shop.category}</div>
                    </button>
                  )
                })}
              </div>

              <div className="flex flex-wrap mt-5" style={{ gap: 10 }}>
                <span className="pill pill-blue"><MapPin size={12} /> Selected Shop</span>
                <span className="pill pill-warning">Highlighted Shop</span>
                <span className="pill pill-gray">Elevator / Escalator / Washroom</span>
              </div>
            </div>

            <aside className="soft-card" style={{ padding: 20 }}>
              {selectedShop ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className="pill pill-blue">{selectedShop.no}</span>
                    <button className="icon-btn" onClick={() => setSelectedNo('')} style={{ background: '#f0f2f6' }}><X size={15} /></button>
                  </div>
                  <h2 className="font-display" style={{ margin: 0, fontWeight: 900, fontSize: 24 }}>{selectedShop.name}</h2>
                  <p className="text-muted" style={{ lineHeight: 1.6 }}>{selectedShop.description}</p>
                  <div className="grid gap-12 mt-5">
                    <Info icon={<Building2 size={16} />} label="Floor" value={selectedShop.floor} />
                    <Info icon={<Store size={16} />} label="Category" value={selectedShop.category} />
                    <Info icon={<Home size={16} />} label="Size" value={`${selectedShop.size} sq.ft`} />
                    <Info icon={<MapPin size={16} />} label="Contact" value={selectedShop.contact} />
                    <div>
                      <div className="label">Status</div>
                      <StatusBadge status={selectedShop.status} />
                    </div>
                  </div>
                  <button className="btn btn-primary mt-6" style={{ width: '100%' }} onClick={() => navigate('directory')}>View Shop Details</button>
                </>
              ) : (
                <div className="text-center" style={{ padding: '40px 10px' }}>
                  <MapPin size={44} color="#c9a540" />
                  <h2 className="font-display">Select a shop</h2>
                  <p className="text-muted">Click on a shop block from the map to view its details.</p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center" style={{ gap: 10, padding: 12, borderRadius: 14, background: '#f8f9fb' }}>
      <span className="pill pill-blue" style={{ width: 34, height: 34, justifyContent: 'center' }}>{icon}</span>
      <span>
        <span style={{ display: 'block', color: '#9ca3af', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>{label}</span>
        <strong>{value}</strong>
      </span>
    </div>
  )
}

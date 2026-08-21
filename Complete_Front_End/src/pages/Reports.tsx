import { Download, FileText, Printer } from 'lucide-react'
import AdminLayout from '../components/AdminLayout'
import type { Page, Shop, Tenant } from '../types'

interface ReportsProps {
  shops: Shop[]
  tenants: Tenant[]
  navigate: (page: Page, shopNo?: string) => void
}

function taka(value: number) {
  return `৳ ${value.toLocaleString('en-IN')}`
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function Reports({ shops, tenants, navigate }: ReportsProps) {
  const occupied = shops.filter((shop) => shop.status === 'Occupied').length
  const vacant = shops.filter((shop) => shop.status === 'Vacant').length
  const totalRent = tenants.reduce((sum, tenant) => sum + tenant.rent, 0)
  const dueRent = tenants.filter((tenant) => tenant.paymentStatus !== 'Paid').reduce((sum, tenant) => sum + tenant.rent, 0)
  const categories = Array.from(new Set(shops.map((shop) => shop.category))).sort()
  const floors = Array.from(new Set(shops.map((shop) => shop.floor))).sort()

  const exportShops = () => {
    downloadCsv('navana-bailey-star-shops.csv', [
      ['Shop No', 'Shop Name', 'Category', 'Floor', 'Size', 'Status', 'Contact'],
      ...shops.map((shop) => [shop.no, shop.name, shop.category, shop.floor, String(shop.size), shop.status, shop.contact]),
    ])
  }

  return (
    <AdminLayout navigate={navigate} activePage="reports">
      <div className="flex flex-wrap items-center justify-between mb-5" style={{ gap: 12 }}>
        <div>
          <h2 className="font-display" style={{ margin: 0, fontWeight: 900 }}>Management Reports</h2>
          <p className="page-subtitle">Use these summaries for project demonstration and stakeholder review.</p>
        </div>
        <div className="flex" style={{ gap: 10 }}>
          <button className="btn btn-outline" onClick={() => window.print()}><Printer size={15} /> Print</button>
          <button className="btn btn-primary" onClick={exportShops}><Download size={15} /> Export Shops CSV</button>
        </div>
      </div>

      <section className="grid grid-4 gap-16 mb-6">
        <ReportCard label="Total Shops" value={shops.length.toString()} sub={`${occupied} occupied, ${vacant} vacant`} />
        <ReportCard label="Total Tenants" value={tenants.length.toString()} sub="Active rent records" />
        <ReportCard label="Monthly Rent" value={taka(totalRent)} sub="Total expected rent" />
        <ReportCard label="Outstanding Rent" value={taka(dueRent)} sub="Due and overdue amount" />
      </section>

      <section className="grid reports-grid">
        <div className="card" style={{ padding: 22 }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display" style={{ margin: 0, fontWeight: 900 }}>Category-wise Shop Count</h3>
            <FileText size={18} color="#c9a540" />
          </div>
          <div className="grid gap-12">
            {categories.map((category) => {
              const count = shops.filter((shop) => shop.category === category).length
              const percentage = shops.length ? Math.round((count / shops.length) * 100) : 0
              return (
                <div key={category}>
                  <div className="flex justify-between mb-3 text-small">
                    <strong>{category}</strong>
                    <span className="text-muted">{count} shops</span>
                  </div>
                  <div className="report-bar"><span style={{ width: `${percentage}%` }} /></div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display" style={{ margin: 0, fontWeight: 900 }}>Floor-wise Occupancy</h3>
            <FileText size={18} color="#c9a540" />
          </div>
          <div className="grid gap-12">
            {floors.map((floor) => {
              const floorShops = shops.filter((shop) => shop.floor === floor)
              const floorOccupied = floorShops.filter((shop) => shop.status === 'Occupied').length
              const percentage = floorShops.length ? Math.round((floorOccupied / floorShops.length) * 100) : 0
              return (
                <div key={floor}>
                  <div className="flex justify-between mb-3 text-small">
                    <strong>{floor}</strong>
                    <span className="text-muted">{floorOccupied}/{floorShops.length} occupied</span>
                  </div>
                  <div className="report-bar"><span style={{ width: `${percentage}%` }} /></div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="card mt-6" style={{ padding: 22 }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display" style={{ margin: 0, fontWeight: 900 }}>Due Rent List</h3>
          <span className="pill pill-danger">{tenants.filter((tenant) => tenant.paymentStatus !== 'Paid').length} pending</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Shop</th>
                <th>Rent</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tenants.filter((tenant) => tenant.paymentStatus !== 'Paid').map((tenant) => (
                <tr key={tenant.id}>
                  <td>{tenant.name}</td>
                  <td>{tenant.shopNo}</td>
                  <td>{taka(tenant.rent)}</td>
                  <td>{tenant.dueDate}</td>
                  <td>{tenant.paymentStatus}</td>
                </tr>
              ))}
              {tenants.every((tenant) => tenant.paymentStatus === 'Paid') && (
                <tr><td colSpan={5} className="text-center text-muted" style={{ padding: 28 }}>No outstanding rent records.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  )
}

function ReportCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="soft-card" style={{ padding: 20 }}>
      <p style={{ color: '#6b7280', margin: 0, fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>{label}</p>
      <p className="font-display" style={{ margin: '8px 0 4px', fontSize: 28, fontWeight: 900 }}>{value}</p>
      <p className="text-muted text-small" style={{ margin: 0 }}>{sub}</p>
    </div>
  )
}

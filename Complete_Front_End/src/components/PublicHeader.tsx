import type { CSSProperties } from 'react'
import { Home, LayoutDashboard, Map } from 'lucide-react'
import type { Page } from '../types'

interface PublicHeaderProps {
  navigate: (page: Page) => void
  activePage: Page
}

export default function PublicHeader({ navigate, activePage }: PublicHeaderProps) {
  const linkStyle = (page: Page): CSSProperties => ({
    border: 0,
    background: activePage === page ? '#e8ecf8' : 'transparent',
    color: activePage === page ? '#0d1b4b' : '#6b7280',
    borderRadius: 999,
    padding: '9px 13px',
    fontSize: 13,
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
  })

  return (
    <header className="public-header">
      <div className="public-header-inner">
        <button onClick={() => navigate('directory')} className="flex items-center" style={{ gap: 10, background: 'transparent', border: 0 }}>
          <span className="logo-mark" style={{ width: 38, height: 38, borderRadius: 12 }}>NB</span>
          <span>
            <span className="font-display" style={{ display: 'block', fontWeight: 900, color: '#0d1b4b', lineHeight: 1.1 }}>Navana Bailey Star</span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Bailey Road, Dhaka</span>
          </span>
        </button>

        <nav className="flex items-center" style={{ gap: 6 }}>
          <button onClick={() => navigate('directory')} style={linkStyle('directory')}><Home size={15} /> Directory</button>
          <button onClick={() => navigate('floor-nav')} style={linkStyle('floor-nav')}><Map size={15} /> Floor Map</button>
          <button onClick={() => navigate('dashboard')} style={linkStyle('dashboard')}><LayoutDashboard size={15} /> Admin</button>
        </nav>
      </div>
    </header>
  )
}

import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Home, LayoutDashboard, Map, Menu, X } from 'lucide-react'
import type { Page } from '../types'

interface PublicHeaderProps {
  navigate: (page: Page) => void
  activePage: Page
}

export default function PublicHeader({ navigate, activePage }: PublicHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => setMenuOpen(false), [activePage])

  const selectPage = (page: Page) => {
    setMenuOpen(false)
    navigate(page)
  }

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
        <button aria-label="Open customer directory" onClick={() => selectPage('directory')} className="public-brand flex items-center" style={{ gap: 10, background: 'transparent', border: 0 }}>
          <span className="logo-mark" style={{ width: 38, height: 38, borderRadius: 12 }}>NB</span>
          <span>
            <span className="font-display" style={{ display: 'block', fontWeight: 900, color: '#0d1b4b', lineHeight: 1.1 }}>Navana Bailey Star</span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Bailey Road, Dhaka</span>
          </span>
        </button>

        <button className="public-nav-toggle icon-btn" aria-label={menuOpen ? 'Close public navigation' : 'Open public navigation'} aria-controls="public-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <nav id="public-navigation" aria-label="Public navigation" className={`public-navigation flex items-center ${menuOpen ? 'open' : ''}`} style={{ gap: 6 }}>
          <button aria-current={activePage === 'directory' ? 'page' : undefined} onClick={() => selectPage('directory')} style={linkStyle('directory')}><Home size={15} /> Directory</button>
          <button aria-current={activePage === 'floor-nav' ? 'page' : undefined} onClick={() => selectPage('floor-nav')} style={linkStyle('floor-nav')}><Map size={15} /> Floor Map</button>
          <button onClick={() => selectPage('dashboard')} style={linkStyle('dashboard')}><LayoutDashboard size={15} /> Admin</button>
        </nav>
      </div>
    </header>
  )
}

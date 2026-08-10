import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import { errorMessage } from '../api'

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>
  onBrowse: () => void
  shopStats: { total: number; occupied: number; floors: number }
}

export default function LoginPage({ onLogin, onBrowse, shopStats }: LoginPageProps) {
  const [email, setEmail] = useState('admin@navana.com')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await onLogin(email, password)
    } catch (submitError) {
      setError(errorMessage(submitError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="center-page">
      <section className="brand-panel">
        <div className="brand-grid" />
        <div className="brand-orb one" />
        <div className="brand-orb two" />

        <div style={{ position: 'relative', zIndex: 1, padding: 48 }}>
          <div className="flex items-center" style={{ gap: 12 }}>
            <div className="logo-mark">NB</div>
            <div>
              <div className="font-display" style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>Navana Bailey Star</div>
              <div style={{ color: 'rgba(255,255,255,.42)', fontSize: 12 }}>Bailey Road, Dhaka</div>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, padding: '0 48px' }}>
          <div className="pill" style={{ background: 'rgba(201,165,64,.12)', color: '#c9a540', border: '1px solid rgba(201,165,64,.28)' }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: '#c9a540' }} />
            LIVE NODE.JS MANAGEMENT SYSTEM
          </div>
          <h1 className="font-display" style={{ margin: '28px 0 20px', color: '#fff', fontSize: 48, lineHeight: 1.06, fontWeight: 900 }}>
            Smart Shopping<br />Complex<br /><span style={{ color: '#c9a540' }}>Management</span>
          </h1>
          <p style={{ maxWidth: 420, color: 'rgba(255,255,255,.58)', lineHeight: 1.7, fontSize: 15 }}>
            A simple web application for shop records, tenant management, rent tracking, customer shop directory and digital floor navigation.
          </p>

          <div className="grid grid-3 gap-16" style={{ marginTop: 36, maxWidth: 520 }}>
            {[
              [String(shopStats.total), 'Total Shops', '🏪'],
              [String(shopStats.occupied), 'Occupied', '✅'],
              [String(shopStats.floors), 'Floors', '🏢'],
            ].map(([value, label, icon]) => (
              <div key={label} style={{ padding: 18, borderRadius: 20, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)' }}>
                <div style={{ fontSize: 24 }}>{icon}</div>
                <div className="font-display" style={{ color: '#fff', fontWeight: 900, fontSize: 26, marginTop: 6 }}>{value}</div>
                <div style={{ color: 'rgba(255,255,255,.42)', fontSize: 12 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, padding: 48, color: 'rgba(255,255,255,.25)', fontSize: 11 }}>
          © 2026 Navana Bailey Star Smart Shopping Complex Management System
        </div>
      </section>

      <section className="grow flex items-center justify-center" style={{ padding: 28 }}>
        <div style={{ width: '100%', maxWidth: 430 }}>
          <div className="mb-6">
            <div style={{ color: '#c9a540', fontSize: 12, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' }}>Admin Portal</div>
            <h2 className="font-display" style={{ margin: '8px 0 8px', fontSize: 34, fontWeight: 900, color: '#0d1b4b' }}>Welcome back</h2>
            <p className="text-muted">Sign in to access the management dashboard.</p>
          </div>

          <div className="card" style={{ padding: 28 }}>
            <form onSubmit={submit}>
              <div className="mb-4">
                <label className="label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: 13, color: '#9ca3af' }} />
                  <input className="input" type="email" required autoComplete="username" style={{ paddingLeft: 42 }} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@navana.com" />
                </div>
              </div>

              <div className="mb-4">
                <label className="label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: 13, color: '#9ca3af' }} />
                  <input className="input" required autoComplete="current-password" style={{ paddingLeft: 42, paddingRight: 42 }} type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: 10, border: 0, background: 'transparent', color: '#9ca3af' }}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-5">
                <span className="flex items-center" style={{ gap: 8, color: '#6b7280', fontSize: 12.5 }}>
                  <ShieldCheck size={15} color="#15803d" /> Role-based protected admin area
                </span>
                <button type="button" style={{ border: 0, background: 'transparent', color: '#c9a540', fontWeight: 800, fontSize: 12.5 }}>Forgot?</button>
              </div>

              {error && <div className="pill pill-danger mb-4" style={{ width: '100%', justifyContent: 'center' }}>{error}</div>}

              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Signing in...' : 'Login to Dashboard'} <ArrowRight size={16} />
              </button>

              <button className="btn btn-outline mt-4" type="button" style={{ width: '100%' }} onClick={onBrowse}>
                Browse Customer Directory
              </button>
            </form>
          </div>

          <p className="text-center text-muted text-small mt-5">
            Use the administrator credentials configured for this deployment.
          </p>
        </div>
      </section>
    </div>
  )
}

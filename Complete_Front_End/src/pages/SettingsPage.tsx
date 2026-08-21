import { useState } from 'react'
import type { ReactNode } from 'react'
import { Database, Languages, RotateCcw, ShieldCheck, Smartphone, X } from 'lucide-react'
import { errorMessage } from '../api'
import AdminLayout from '../components/AdminLayout'
import Modal from '../components/Modal'
import type { Page } from '../types'

interface SettingsPageProps {
  navigate: (page: Page, shopNo?: string) => void
  resetDemoData: () => Promise<void>
}

export default function SettingsPage({ navigate, resetDemoData }: SettingsPageProps) {
  const [resetting, setResetting] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [message, setMessage] = useState('')
  const [messageIsError, setMessageIsError] = useState(false)

  const reset = async () => {
    setResetting(true)
    setMessage('')
    try {
      await resetDemoData()
      setMessage('Demo shop and tenant data has been restored on the server.')
      setMessageIsError(false)
      setConfirmReset(false)
    } catch (resetError) {
      setMessage(errorMessage(resetError))
      setMessageIsError(true)
    } finally {
      setResetting(false)
    }
  }

  return (
    <AdminLayout navigate={navigate} activePage="settings">
      <section className="grid grid-2 gap-20">
        <div className="card" style={{ padding: 24 }}>
          <h2 className="font-display" style={{ margin: 0, fontWeight: 900 }}>System Preferences</h2>
          <p className="page-subtitle">Security, data, and localization preferences for this deployment.</p>

          <div className="grid gap-16 mt-6">
            <SettingItem icon={<ShieldCheck size={20} />} title="Role-based access" desc="Admin and management pages require an authenticated administrator." enabled />
            <SettingItem icon={<Smartphone size={20} />} title="Mobile-friendly interface" desc="Customers can search shops and view maps from mobile devices." enabled />
            <SettingItem icon={<Languages size={20} />} title="Bangla language support" desc="Planned for a future localized release." />
            <SettingItem icon={<Database size={20} />} title="Server data storage" desc="Changes are persisted by the Node.js API instead of browser localStorage." enabled />
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h2 className="font-display" style={{ margin: 0, fontWeight: 900 }}>Demo Data Control</h2>
          <p className="page-subtitle">Reset prototype data if testing changes becomes messy.</p>

          <div style={{ padding: 18, borderRadius: 20, background: '#fff7ed', border: '1px solid #fed7aa', marginTop: 22 }}>
            <strong style={{ color: '#9a3412' }}>Academic prototype note</strong>
            <p style={{ color: '#9a3412', lineHeight: 1.6, marginBottom: 0 }}>
              This system starts with sample data. Real tenant rent records must be verified and protected before actual deployment.
            </p>
          </div>

          <button className="btn btn-danger mt-6" disabled={resetting} onClick={() => setConfirmReset(true)}>
            <RotateCcw size={16} /> Reset Demo Data
          </button>

          {message && <p role={messageIsError ? 'alert' : 'status'} aria-live={messageIsError ? 'assertive' : 'polite'} className={`pill ${messageIsError ? 'pill-danger' : 'pill-success'} mt-5`}>{message}</p>}

          <div className="mt-6">
            <h3 className="font-display" style={{ fontWeight: 900 }}>Future Enhancements</h3>
            <div className="flex flex-wrap" style={{ gap: 10 }}>
              <span className="pill pill-gray">Customer loyalty points</span>
              <span className="pill pill-gray">Event/promotion management</span>
              <span className="pill pill-gray">Online rent payment</span>
              <span className="pill pill-gray">SMS/email notification</span>
            </div>
          </div>
        </div>
      </section>

      {confirmReset && (
        <Modal title="Reset demonstration data" description="All current shop, tenant, rent-status, and activity changes will be replaced with the seed dataset." onClose={() => setConfirmReset(false)} style={{ maxWidth: 440 }}>
          <div className="modal-heading">
            <div><h2 className="font-display" style={{ margin: 0, fontWeight: 900 }}>Reset Demo Data?</h2><p className="page-subtitle">This replaces all changes made during the current demonstration.</p></div>
            <button className="icon-btn" aria-label="Close reset confirmation" onClick={() => setConfirmReset(false)}><X size={16} /></button>
          </div>
          <div className="modal-body">
            <div className="pill pill-warning" style={{ width: '100%', justifyContent: 'center' }}>This action cannot be undone except through a database backup.</div>
            {message && messageIsError && <p role="alert" className="pill pill-danger mt-5">{message}</p>}
            <div className="modal-actions"><button className="btn btn-muted" onClick={() => setConfirmReset(false)}>Cancel</button><button className="btn btn-danger" disabled={resetting} onClick={() => void reset()}><RotateCcw size={16} /> {resetting ? 'Resetting...' : 'Reset Data'}</button></div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}

function SettingItem({ icon, title, desc, enabled = false }: { icon: ReactNode; title: string; desc: string; enabled?: boolean }) {
  return (
    <div className="flex items-center justify-between" style={{ gap: 14, padding: 16, borderRadius: 18, background: '#f8f9fb' }}>
      <div className="flex items-center" style={{ gap: 12 }}>
        <span className={`pill ${enabled ? 'pill-blue' : 'pill-gray'}`} style={{ width: 42, height: 42, justifyContent: 'center' }}>{icon}</span>
        <span>
          <strong style={{ display: 'block' }}>{title}</strong>
          <span className="text-muted text-small">{desc}</span>
        </span>
      </div>
      <span className={`pill ${enabled ? 'pill-success' : 'pill-gray'}`}>{enabled ? 'Enabled' : 'Future'}</span>
    </div>
  )
}

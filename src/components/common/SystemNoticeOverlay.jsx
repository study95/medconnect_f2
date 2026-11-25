import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { AlertTriangle, Info, ShieldAlert, Wrench, X } from 'lucide-react'
import { useRuntimeConfig } from '../../utils/runtimeConfig'
import { useAuth } from '../../context/AuthContext'

export default function SystemNoticeOverlay() {
  const runtime = useRuntimeConfig()
  const { isAdmin } = useAuth()
  const location = useLocation()
  const [dismissedBannerText, setDismissedBannerText] = useState('')

  const pathname = location?.pathname || '/'
  const isAdminPath =
    pathname.startsWith('/admin') ||
    pathname === '/admin-secure-access'

  // 1. Maintenance Mode Fullscreen Gate (admins & /admin-secure-access always stay open)
  if (runtime?.maintenance?.enabled && !isAdmin && !isAdminPath) {
    return (
      <div
        role="alertdialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'linear-gradient(135deg, #064E3B 0%, #0F172A 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 520,
            width: '100%',
            background: '#FFFFFF',
            borderRadius: 24,
            padding: '36px 32px',
            textAlign: 'center',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 20,
              background: '#ECFDF5',
              color: '#059669',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 18,
            }}
          >
            <Wrench size={34} />
          </div>
          <h1 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800, color: '#0F172A' }}>
            {runtime.maintenance.title || 'সিস্টেম রক্ষণাবেক্ষণ চলছে'}
          </h1>
          <p style={{ margin: '0 0 24px', fontSize: 15, lineHeight: 1.7, color: '#475569' }}>
            {runtime.maintenance.message}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #00B875, #059669)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              পুনরায় চেষ্টা করুন
            </button>
            <Link
              to="/admin-secure-access"
              style={{
                padding: '10px 18px',
                borderRadius: 12,
                border: '1px solid #CBD5E1',
                background: '#F8FAFC',
                color: '#334155',
                fontWeight: 600,
                fontSize: 13.5,
                textDecoration: 'none',
              }}
            >
              অ্যাডমিন লগইন
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 2. Emergency / Announcement Top Banner
  const banner = runtime?.banner
  if (!banner?.enabled || !banner?.text || dismissedBannerText === banner.text) {
    return null
  }

  const palette =
    banner.type === 'danger'
      ? { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', Icon: ShieldAlert }
      : banner.type === 'warning'
        ? { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', Icon: AlertTriangle }
        : { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', Icon: Info }

  const Icon = palette.Icon

  return (
    <div
      role="status"
      style={{
        background: palette.bg,
        borderBottom: `1px solid ${palette.border}`,
        color: palette.text,
        padding: '10px 16px',
        fontSize: 13.5,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        position: 'relative',
        zIndex: 1040,
        fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif",
      }}
    >
      <Icon size={17} style={{ flexShrink: 0 }} />
      <span style={{ textAlign: 'center', lineHeight: 1.4 }}>{banner.text}</span>
      <button
        type="button"
        aria-label="Close notice"
        onClick={() => setDismissedBannerText(banner.text)}
        style={{
          background: 'transparent',
          border: 'none',
          color: palette.text,
          cursor: 'pointer',
          padding: 4,
          display: 'inline-flex',
          alignItems: 'center',
          opacity: 0.75,
        }}
      >
        <X size={16} />
      </button>
    </div>
  )
}

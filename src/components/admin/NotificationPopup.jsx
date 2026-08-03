// NotificationPopup.jsx — Modal popup on login for unread popup notifications
import { useSubscription } from '../../context/SubscriptionContext'
import { markNotificationRead } from '../../api/subscriptionApi'

const typeIcons = { warning: '⚠️', info: 'ℹ️', promo: '🎁', system: '🔧', expiry: '⏰' }

export default function NotificationPopup() {
  const { popupNotifications, dismissPopups, refreshUnreadCount } = useSubscription()

  if (!popupNotifications || popupNotifications.length === 0) return null

  const handleDismiss = async () => {
    // Mark all popup notifications as read
    try {
      for (const n of popupNotifications) {
        await markNotificationRead(n.id)
      }
      refreshUnreadCount()
    } catch {}
    dismissPopups()
  }

  return (
    <div className="admin-modal-overlay" style={{ zIndex: 9999 }}>
      <div className="admin-modal" style={{ maxWidth: 500, padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ 
          padding: '24px 32px',
          background: 'linear-gradient(135deg, var(--admin-sidebar-bg), #1e293b)', 
          color: 'white',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🔔</span> Important Notifications
          </h3>
        </div>
        
        <div style={{ maxHeight: 400, overflowY: 'auto', background: 'var(--admin-card-bg)' }}>
          {popupNotifications.map((n, idx) => (
            <div
              key={n.id}
              style={{
                padding: '24px',
                borderBottom: idx < popupNotifications.length - 1 ? '1px solid var(--admin-border)' : 'none',
                display: 'flex', gap: 16,
                transition: 'background 0.2s'
              }}
            >
              <div style={{ 
                width: 48, height: 48, borderRadius: 14, 
                background: 'rgba(0,0,0,0.03)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, flexShrink: 0
              }}>
                {typeIcons[n.type] || 'ℹ️'}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: 'var(--admin-text)' }}>
                  {n.title}
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-text-muted)', lineHeight: 1.6 }}>
                  {n.message}
                </p>
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 600 }}>
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                  </span>
                  <span style={{ 
                    fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                    background: 'rgba(0, 168, 140, 0.1)', color: 'var(--admin-primary)', textTransform: 'uppercase'
                  }}>
                    {n.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '24px', textAlign: 'center', borderTop: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.02)' }}>
          <button
            className="admin-btn admin-btn-primary"
            onClick={handleDismiss}
            style={{ padding: '12px 32px', borderRadius: 12, fontWeight: 800, width: '100%' }}
          >
            ✓ I've Read All — Continue
          </button>
        </div>
      </div>
    </div>
  )
}


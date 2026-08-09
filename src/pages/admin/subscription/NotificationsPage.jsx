// NotificationsPage.jsx — Doctor notification inbox
import { useState, useEffect } from 'react'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../../api/subscriptionApi'
import { useSubscription } from '../../../context/SubscriptionContext'

const typeIcons = {
  warning: '⚠️', info: 'ℹ️', promo: '🎁', system: '🔧', expiry: '⏰'
}

const typeColors = {
  warning: { bg: '#FEF3C7', color: '#92400E' },
  info: { bg: '#DBEAFE', color: '#1E40AF' },
  promo: { bg: '#EDE9FE', color: '#6D28D9' },
  system: { bg: '#F1F5F9', color: '#475569' },
  expiry: { bg: '#FEE2E2', color: '#991B1B' },
}

export default function NotificationsPage() {
  const { refreshUnreadCount } = useSubscription()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedNotification, setSelectedNotification] = useState(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const res = await getNotifications()
      const data = res.data?.data
      setNotifications(data?.data || data || [])
    } catch {  }
    finally { setLoading(false) }
  }

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      refreshUnreadCount()
    } catch {}
  }

  const handleViewNotification = (notification) => {
    setSelectedNotification(notification)
    if (!notification.is_read) {
      handleMarkRead(notification.id)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      refreshUnreadCount()
      
    } catch {}
  }

  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">🔔 Notifications</h2>
          <p className="admin-page-subtitle">
            {unread > 0 ? `${unread} unread notification(s)` : 'All caught up!'}
          </p>
        </div>
        {unread > 0 && (
          <button className="admin-btn admin-btn-outline" onClick={handleMarkAllRead}>
            ✓ Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="admin-loading"><div className="admin-spinner" /> Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="admin-card">
          <div className="admin-empty">
            <div className="admin-empty-icon">🔔</div>
            <h4>No notifications</h4>
            <p>You're all caught up!</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notifications.map(n => {
            const tc = typeColors[n.type] || typeColors.info
            return (
              <div
                key={n.id}
                className="admin-card"
                style={{
                  padding: '20px 24px',
                  borderLeft: `4px solid ${tc.color}`,
                  opacity: n.is_read ? 0.7 : 1,
                  cursor: n.is_read ? 'default' : 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onClick={() => handleViewNotification(n)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 14, flex: 1 }}>
                    <span style={{ fontSize: 24 }}>{typeIcons[n.type] || 'ℹ️'}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h4 style={{ margin: 0, fontWeight: 800, fontSize: 15, color: 'var(--admin-text)' }}>
                          {n.title}
                        </h4>
                        <span style={{
                          background: tc.bg, color: tc.color,
                          padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                          textTransform: 'uppercase'
                        }}>{n.type}</span>
                        {!n.is_read && (
                          <span style={{
                            width: 8, height: 8, borderRadius: '50%', background: '#3B82F6'
                          }} />
                        )}
                      </div>
                      <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--admin-text-muted)', lineHeight: 1.5 }}>
                        {n.message}
                      </p>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                        {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                      </span>
                    </div>
                  </div>
                  <button 
                    className="admin-btn admin-btn-outline admin-btn-sm"
                    style={{ whiteSpace: 'nowrap', borderRadius: 10 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewNotification(n)
                    }}
                  >
                    👁️ View
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="admin-modal-overlay" onClick={() => setSelectedNotification(null)} style={{ zIndex: 9999 }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, borderRadius: 20 }}>
            <div className="admin-modal-header" style={{ borderBottom: '1px solid var(--admin-border)', paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>{typeIcons[selectedNotification.type] || 'ℹ️'}</span>
                <h3 className="admin-modal-title" style={{ fontSize: 18, fontWeight: 800 }}>Notification Detail</h3>
              </div>
              <button className="admin-modal-close" onClick={() => setSelectedNotification(null)}>✕</button>
            </div>
            
            <div className="admin-modal-body" style={{ padding: '24px 0' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ 
                    background: typeColors[selectedNotification.type]?.bg, 
                    color: typeColors[selectedNotification.type]?.color,
                    padding: '2px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                    textTransform: 'uppercase'
                  }}>
                    {selectedNotification.type}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                    {selectedNotification.created_at ? new Date(selectedNotification.created_at).toLocaleString() : ''}
                  </span>
                </div>
                <h4 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--admin-text)', lineHeight: 1.3 }}>
                  {selectedNotification.title}
                </h4>
              </div>

              <div style={{ 
                background: 'var(--admin-sidebar-user-bg)', 
                padding: 24, borderRadius: 16, border: '1px solid var(--admin-border)',
                lineHeight: 1.6, color: 'var(--admin-text)', fontSize: 15,
                whiteSpace: 'pre-line'
              }}>
                {selectedNotification.message}
              </div>
            </div>

            <div className="admin-modal-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
              <button 
                className="admin-btn admin-btn-primary" 
                style={{ width: '100%', padding: '12px', borderRadius: 12, fontWeight: 700 }}
                onClick={() => setSelectedNotification(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

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

const stripHtml = (html) => {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
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
      window.dispatchEvent(new Event('notification-read-updated'))
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
      window.dispatchEvent(new Event('notification-read-updated'))
    } catch {}
  }

  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div>
      <style>{`
        .notification-html-body { text-align: left; }
        .notification-html-body p { text-align: left; margin: 0 0 8px 0; }
        .notification-html-body p:last-child { margin-bottom: 0; }
        .notification-html-body ul, .notification-html-body ol { margin: 0 0 8px 0; padding-left: 20px; text-align: left; }
        .notification-html-body a { color: #00A88C; text-decoration: underline; }
      `}</style>
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
                        {stripHtml(n.message)}
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
        <div 
          className="admin-modal-overlay" 
          onClick={() => setSelectedNotification(null)} 
          style={{ 
            position: 'fixed', inset: 0, 
            background: 'rgba(15, 23, 42, 0.45)', 
            backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            zIndex: 99999, padding: 16 
          }}
        >
          <div 
            className="admin-modal" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: 500, 
              width: '100%', 
              background: '#FFFFFF', 
              borderRadius: 16, 
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)', 
              overflow: 'hidden',
              border: '1px solid #E2E8F0'
            }}
          >
            {/* Simple Clean Header: Sender & Date */}
            <div style={{ 
              padding: '16px 20px', 
              borderBottom: '1px solid #F1F5F9', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(0, 168, 140, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0
                }}>
                  {typeIcons[selectedNotification.type] || '📩'}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                    {selectedNotification.sender?.name || 'Administration'}
                  </h4>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>
                    {selectedNotification.created_at ? new Date(selectedNotification.created_at).toLocaleString([], { 
                      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                    }) : ''}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedNotification(null)}
                style={{
                  width: 28, height: 28, borderRadius: 6,
                  border: 'none', background: 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#94A3B8', fontSize: 15, transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#0F172A' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8' }}
                title="Close"
              >
                ✕
              </button>
            </div>
            
            {/* Natural Message Body */}
            <div style={{ padding: '20px 24px', maxHeight: 'calc(80vh - 130px)', overflowY: 'auto' }}>
              {/* Notice Title / Subject */}
              <h3 style={{ 
                margin: '0 0 12px', 
                fontSize: 17, 
                fontWeight: 700, 
                color: '#0F172A', 
                lineHeight: 1.4 
              }}>
                {selectedNotification.title}
              </h3>

              {/* Message Text: Natural & Clean Reading Experience */}
              <div 
                className="notification-html-body"
                style={{ 
                  color: '#334155', 
                  fontSize: 14.5,
                  lineHeight: 1.7,
                  wordBreak: 'break-word'
                }}
                dangerouslySetInnerHTML={{ __html: selectedNotification.message }}
              />
            </div>

            {/* Simple Footer */}
            <div style={{ 
              padding: '12px 20px', 
              borderTop: '1px solid #F1F5F9', 
              display: 'flex', 
              justifyContent: 'flex-end',
              background: '#FAFBFD'
            }}>
              <button 
                className="admin-btn admin-btn-outline" 
                style={{ 
                  padding: '7px 20px', 
                  borderRadius: 8, 
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  background: '#FFFFFF'
                }}
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

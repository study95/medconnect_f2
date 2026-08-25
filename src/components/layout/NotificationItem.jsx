import React, { memo } from 'react'
import { Star, MessageSquare, ShieldAlert, CheckCircle, Bell, ArrowRight } from 'lucide-react'
import { formatReviewDate } from '../../features/reviews/mappers'

/**
 * Renders an individual notification card for public navbar & admin header
 */
const NotificationItem = memo(function NotificationItem({
  notification,
  onMarkRead,
  onClick,
}) {
  if (!notification) return null

  const isRead = Boolean(notification.is_read || notification.read_at)
  const data = notification.data || {}
  const type = notification.type || data.type || 'system'

  const getIcon = () => {
    if (type.includes('Review') || data.title?.includes('Review')) {
      return <Star size={16} className="text-warning" fill="#f59e0b" />
    }
    if (type.includes('Reply') || data.title?.includes('Reply')) {
      return <MessageSquare size={16} className="text-primary" />
    }
    if (type.includes('Report') || data.title?.includes('Report')) {
      return <ShieldAlert size={16} className="text-danger" />
    }
    if (type.includes('Status') || data.title?.includes('Approved')) {
      return <CheckCircle size={16} className="text-success" />
    }
    return <Bell size={16} className="text-secondary" />
  }

  const title = notification.title || data.title || 'New Notification'
  const message = notification.message || data.message || data.comment_preview || ''
  const createdAt = notification.created_at || data.created_at

  return (
    <div
      onClick={() => {
        if (!isRead && onMarkRead) onMarkRead(notification.id)
        if (onClick) onClick(notification)
      }}
      className={`p-3 border-bottom border-light-subtle d-flex align-items-start gap-3 cursor-pointer transition ${
        !isRead ? 'bg-primary-subtle bg-opacity-25' : 'bg-white hover-bg-light'
      }`}
      style={{ cursor: 'pointer' }}
    >
      <div
        className="p-2 rounded-circle bg-light border border-light-subtle d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
        style={{ width: '32px', height: '32px' }}
      >
        {getIcon()}
      </div>

      <div className="flex-grow-1 min-w-0">
        <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
          <div className={`small text-truncate ${!isRead ? 'fw-bold text-dark' : 'fw-semibold text-secondary'}`}>
            {title}
          </div>
          {!isRead && (
            <span
              className="badge rounded-pill bg-primary"
              style={{ width: '7px', height: '7px', padding: 0 }}
              title="Unread"
            />
          )}
        </div>

        {message && (
          <p className="extra-small text-muted mb-1 lh-base text-truncate-2">
            {message}
          </p>
        )}

        <div className="extra-small text-secondary" style={{ fontSize: '0.72rem' }}>
          {formatReviewDate(createdAt)}
        </div>
      </div>
    </div>
  )
})

export default NotificationItem

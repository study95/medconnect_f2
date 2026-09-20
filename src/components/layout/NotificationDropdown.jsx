import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'
import NotificationItem from './NotificationItem'
import NotificationSkeleton from './NotificationSkeleton'
import { Bell, CheckCheck, BellOff, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * Enterprise Global Notification Bell Dropdown Component
 */
export default function NotificationDropdown({
  targetPath = '/admin/notifications',
  iconColor = 'currentColor',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // 1. Fetch unread count
  const { data: countData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get('/v1/notifications/unread-count')
        return (
          res.data?.unread_count ??
          res.data?.count ??
          res.data?.data?.unread_count ??
          res.data?.data?.count ??
          0
        )
      } catch {
        return 0
      }
    },
    refetchInterval: 1000 * 15, // poll every 15s for responsiveness
  })

  const unreadCount = Number(countData) || 0

  // Listen to local read updates from NotificationsPage
  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
    window.addEventListener('notification-read-updated', handleUpdate)
    return () => window.removeEventListener('notification-read-updated', handleUpdate)
  }, [queryClient])

  // 2. Fetch notifications list when dropdown is open
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: async () => {
      const res = await axiosInstance.get('/v1/notifications?per_page=10')
      const raw = res.data?.data || res.data || []
      return Array.isArray(raw) ? raw : raw.data || []
    },
    enabled: isOpen,
    staleTime: 1000 * 10,
  })

  const notifications = Array.isArray(notificationsData) ? notificationsData : []

  // 3. Mark single notification read mutation
  const markReadMutation = useMutation({
    mutationFn: (id) => axiosInstance.put(`/v1/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      window.dispatchEvent(new Event('notification-read-updated'))
    },
  })

  // 4. Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => axiosInstance.post('/v1/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      window.dispatchEvent(new Event('notification-read-updated'))
      toast.success('All notifications marked as read')
    },
  })

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleNotificationClick = (item) => {
    setIsOpen(false)
    const data = item.data || {}
    if (data.action_url) {
      navigate(data.action_url)
    } else if (targetPath) {
      navigate(targetPath)
    }
  }

  return (
    <div className={`position-relative d-inline-block ${className}`} ref={dropdownRef}>
      <style>{`
        @keyframes bellPulseAura {
          0% { transform: scale(0.9); opacity: 0.8; }
          70% { transform: scale(1.7); opacity: 0; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes bellBadgeBounce {
          0% { transform: scale(0); }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes bellSubtleSwing {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(12deg); }
          30% { transform: rotate(-10deg); }
          45% { transform: rotate(8deg); }
          60% { transform: rotate(-4deg); }
          75% { transform: rotate(0deg); }
        }
        .bell-has-unread {
          animation: bellSubtleSwing 3s ease-in-out infinite;
          transform-origin: top center;
        }
        .notification-bell-btn:hover {
          background: rgba(0, 184, 117, 0.12) !important;
          border-color: rgba(0, 184, 117, 0.35) !important;
        }
      `}</style>

      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="notification-bell-btn position-relative d-flex align-items-center justify-content-center"
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '1.5px solid var(--admin-border, rgba(0, 0, 0, 0.1))',
          background: isOpen ? 'rgba(0, 184, 117, 0.12)' : 'transparent',
          color: iconColor,
          outline: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'all 0.2s ease',
        }}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell
          size={18}
          className={unreadCount > 0 ? "bell-has-unread" : ""}
          style={{ strokeWidth: 2.2 }}
        />

        {unreadCount > 0 && (
          <>
            {/* Soft pulsing aura behind the badge */}
            <span
              style={{
                position: 'absolute',
                top: -1,
                right: -1,
                width: 18,
                height: 18,
                borderRadius: '50%',
                backgroundColor: '#EF4444',
                animation: 'bellPulseAura 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                pointerEvents: 'none',
              }}
            />

            {/* Notification Badge with clear count */}
            <span
              style={{
                position: 'absolute',
                top: -3,
                right: -3,
                minWidth: 18,
                height: 18,
                padding: '0 4px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                color: '#ffffff',
                fontSize: 10,
                fontWeight: 800,
                lineHeight: '18px',
                textAlign: 'center',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.5), 0 0 0 2px var(--admin-card-bg, #ffffff)',
                border: '1.5px solid #ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                userSelect: 'none',
                pointerEvents: 'none',
                animation: 'bellBadgeBounce 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </>
        )}
      </button>

      {/* Popover Dropdown Container */}
      {isOpen && (
        <div
          className="position-absolute end-0 mt-2 card border-0 shadow-lg rounded-4 overflow-hidden bg-white"
          style={{
            width: '360px',
            maxWidth: 'calc(100vw - 24px)',
            zIndex: 1050,
            animation: 'fadeIn 0.15s ease',
          }}
        >
          {/* Popover Header */}
          <div className="p-3 border-bottom border-light-subtle d-flex align-items-center justify-content-between bg-light">
            <div className="d-flex align-items-center gap-2">
              <h6 className="mb-0 fw-bold text-dark">Notifications</h6>
              {unreadCount > 0 ? (
                <span className="badge rounded-pill bg-danger-subtle text-danger fw-bold small">
                  {unreadCount} unread
                </span>
              ) : (
                <span className="badge rounded-pill bg-secondary-subtle text-secondary fw-semibold small">
                  All caught up
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="btn btn-link p-0 text-decoration-none extra-small text-muted d-inline-flex align-items-center gap-1 hover-text-primary"
                style={{ fontSize: '0.8rem' }}
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* Scrollable Notification Items List */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {isLoading ? (
              <NotificationSkeleton count={3} />
            ) : notifications.length === 0 ? (
              <div className="text-center py-5 px-3 text-muted">
                <BellOff size={32} className="mb-2 opacity-50 d-block mx-auto" />
                <div className="fw-semibold small">No notifications yet</div>
                <div className="extra-small text-muted">You will be notified of new notices and updates here.</div>
              </div>
            ) : (
              notifications.map((item) => (
                <NotificationItem
                  key={item.id || item.public_id}
                  notification={item}
                  onMarkRead={(id) => markReadMutation.mutate(id)}
                  onClick={handleNotificationClick}
                />
              ))
            )}
          </div>

          {/* Popover Footer */}
          {targetPath && (
            <div className="p-2 text-center border-top border-light-subtle bg-light">
              <Link
                to={targetPath}
                onClick={() => setIsOpen(false)}
                className="small fw-semibold text-decoration-none text-primary d-inline-flex align-items-center gap-1"
              >
                View all notifications
                <ExternalLink size={13} />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

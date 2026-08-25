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
        return res.data?.unread_count ?? res.data?.data?.unread_count ?? 0
      } catch {
        return 0
      }
    },
    refetchInterval: 1000 * 45, // poll every 45s
  })

  const unreadCount = Number(countData) || 0

  // 2. Fetch notifications list when open
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: async () => {
      const res = await axiosInstance.get('/v1/notifications?per_page=10')
      const raw = res.data?.data || res.data || []
      return Array.isArray(raw) ? raw : raw.data || []
    },
    enabled: isOpen,
    staleTime: 1000 * 20,
  })

  const notifications = Array.isArray(notificationsData) ? notificationsData : []

  // 3. Mark single notification read mutation
  const markReadMutation = useMutation({
    mutationFn: (id) => axiosInstance.put(`/v1/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // 4. Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => axiosInstance.post('/v1/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
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
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="btn p-0 border-0 bg-transparent position-relative d-flex align-items-center justify-content-center"
        style={{ color: iconColor, outline: 'none' }}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.65rem', padding: '2px 5px' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
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
              {unreadCount > 0 && (
                <span className="badge bg-primary-subtle text-primary rounded-pill small">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="btn btn-link p-0 text-decoration-none extra-small text-muted d-inline-flex align-items-center gap-1 hover-text-primary"
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
                <div className="extra-small text-muted">You will be notified of new reviews, replies, and updates here.</div>
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

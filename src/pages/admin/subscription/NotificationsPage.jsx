// NotificationsPage.jsx — Doctor notification inbox
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead,
  getDoctorSeatInvitations,
  acceptDoctorSeatInvitation,
  rejectDoctorSeatInvitation
} from '../../../api/subscriptionApi'
import { useSubscription } from '../../../context/SubscriptionContext'
import { sanitizeHtml } from '../../../utils/sanitizeHtml'
import toast from 'react-hot-toast'
import { 
  Award, Users, Calendar, ShieldCheck, Check, X, ChevronDown, ChevronUp, 
  ExternalLink, Bell, Building2, AlertTriangle, Gift, Search, CheckCheck, Clock 
} from 'lucide-react'

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

const getNotificationTeaser = (html, maxChars = 130) => {
  if (!html) return ''
  const parts = html.split(/<div style=/i)
  let clean = (parts[0] || html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&ldquo;|&rdquo;|&quot;/g, '"')
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (clean.length > maxChars) {
    clean = clean.slice(0, maxChars).trim() + '...'
  }
  return clean
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshUnreadCount } = useSubscription()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [seatInvitations, setSeatInvitations] = useState([])
  const [respondingInviteId, setRespondingInviteId] = useState(null)
  const [showFacilities, setShowFacilities] = useState(true)
  const [filterTab, setFilterTab] = useState('all') // 'all' | 'unread' | 'invitations' | 'system'
  const [searchTerm, setSearchTerm] = useState('')

  // Rejection reason modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectingInvitation, setRejectingInvitation] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [submittingReject, setSubmittingReject] = useState(false)

  const REJECT_PRESETS = [
    'বর্তমানে চেম্বার শিডিউল সম্পূর্ণ ব্যস্ত।',
    'হাসপাতালের লোকেশন বা দূরত্ব সুবিধাজনক নয়।',
    'সম্মানী বা প্রাতিষ্ঠানিক শর্তাবলীর সাথে সমন্বয় হচ্ছে না।',
    'অন্যান্য ব্যক্তিগত কারণ।'
  ]

  const openedTargetRef = useRef(null)

  const handleCloseModal = () => {
    setSelectedNotification(null)
    if (location.state?.selectedNotificationId || location.search.includes('open=')) {
      navigate(location.pathname, { replace: true, state: {} })
    }
  }

  const openRejectModal = (invitation) => {
    setRejectingInvitation(invitation)
    setRejectReason('')
    setRejectModalOpen(true)
  }

  const submitRejection = async () => {
    if (!rejectingInvitation) return
    try {
      setSubmittingReject(true)
      const res = await rejectDoctorSeatInvitation(rejectingInvitation.id, rejectReason)
      toast.success(res.message || 'আমন্ত্রণটি সফলভাবে প্রত্যাখ্যান করা হয়েছে।')
      setRejectModalOpen(false)
      handleCloseModal()
      await load()
      await loadInvitations()
      refreshUnreadCount()
      window.dispatchEvent(new Event('notification-read-updated'))
    } catch (err) {
      toast.error(err.response?.data?.message || 'আমন্ত্রণ প্রত্যাখ্যান করতে ব্যর্থ হয়েছে।')
    } finally {
      setSubmittingReject(false)
    }
  }

  useEffect(() => { 
    load()
    loadInvitations()
  }, [])

  // Auto-open notification if navigated from bell dropdown with state
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const targetId = location.state?.selectedNotificationId || searchParams.get('open')
    if (targetId && notifications.length > 0) {
      if (openedTargetRef.current !== String(targetId)) {
        const found = notifications.find(n => String(n.id) === String(targetId))
        if (found) {
          openedTargetRef.current = String(targetId)
          handleViewNotification(found)
          // Clean history state so modal doesn't re-trigger on subsequent updates or closes
          navigate(location.pathname, { replace: true, state: {} })
        }
      }
    }
  }, [notifications, location, navigate])

  const loadInvitations = async () => {
    try {
      const res = await getDoctorSeatInvitations()
      const list = res.data || []
      setSeatInvitations(Array.isArray(list) ? list : [])
    } catch {
      // Non-doctor user or invitations unavailable
    }
  }

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

  const handleAcceptInvitation = async (invitation) => {
    try {
      setRespondingInviteId(invitation.id)
      const res = await acceptDoctorSeatInvitation(invitation.id)
      toast.success(res.message || 'আমন্ত্রণটি সফলভাবে গৃহীত হয়েছে!')
      handleCloseModal()
      await load()
      await loadInvitations()
      refreshUnreadCount()
      window.dispatchEvent(new Event('notification-read-updated'))
    } catch (err) {
      toast.error(err.response?.data?.message || 'আমন্ত্রণ গ্রহণ করতে ব্যর্থ হয়েছে।')
    } finally {
      setRespondingInviteId(null)
    }
  }

  const handleRejectInvitation = async (invitation) => {
    const hospName = invitation.hospital?.name || 'এই হাসপাতাল'
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে ${hospName}-এর প্রাতিষ্ঠানিক সিট বরাদ্দ আমন্ত্রণ প্রত্যাখ্যান করতে চান?`)) {
      return
    }
    try {
      setRespondingInviteId(invitation.id)
      const res = await rejectDoctorSeatInvitation(invitation.id)
      toast.success(res.message || 'আমন্ত্রণটি প্রত্যাখ্যান করা হয়েছে।')
      handleCloseModal()
      await load()
      await loadInvitations()
      refreshUnreadCount()
      window.dispatchEvent(new Event('notification-read-updated'))
    } catch (err) {
      toast.error(err.response?.data?.message || 'আমন্ত্রণ প্রত্যাখ্যান করতে ব্যর্থ হয়েছে।')
    } finally {
      setRespondingInviteId(null)
    }
  }

  const unread = notifications.filter(n => !n.is_read).length

  const filteredNotifications = notifications.filter(n => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      const matchTitle = (n.title || '').toLowerCase().includes(q)
      const matchMsg = (n.message || '').toLowerCase().includes(q)
      const matchSender = (n.sender?.name || '').toLowerCase().includes(q)
      if (!matchTitle && !matchMsg && !matchSender) return false
    }

    if (filterTab === 'unread') {
      return !n.is_read
    }
    if (filterTab === 'invitations') {
      return (
        n.type?.includes('invitation') ||
        (n.title && n.title.includes('আমন্ত্রণ')) ||
        (n.message && n.message.includes('আমন্ত্রণ')) ||
        Boolean(n.hospital_id)
      )
    }
    if (filterTab === 'system') {
      const isInv = (
        n.type?.includes('invitation') ||
        (n.title && n.title.includes('আমন্ত্রণ')) ||
        (n.message && n.message.includes('আমন্ত্রণ')) ||
        Boolean(n.hospital_id)
      )
      return !isInv
    }
    return true
  })

  return (
    <div>
      <style>{`
        .notification-html-body { text-align: left; }
        .notification-html-body p { text-align: left; margin: 0 0 8px 0; }
        .notification-html-body p:last-child { margin-bottom: 0; }
        .notification-html-body ul, .notification-html-body ol { margin: 0 0 8px 0; padding-left: 20px; text-align: left; }
        .notification-html-body a { color: #00A88C; text-decoration: underline; }
      `}</style>

      {/* Modern Page Header */}
      <div className="admin-page-header" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0, fontSize: 24 }}>
            <span>🔔</span> Notifications
          </h2>
          <p className="admin-page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 13.5 }}>
            {unread > 0 ? (
              <span style={{ color: '#16A34A', fontWeight: 600 }}>
                আপনার <strong style={{ color: '#15803D', fontSize: 14 }}>{unread}টি</strong> নতুন অপঠিত নোটিফিকেশন রয়েছে
              </span>
            ) : (
              <span style={{ color: '#64748B' }}>
                সব নোটিফিকেশন পড়া সম্পন্ন! কোনো নতুন অপঠিত বার্তা নেই।
              </span>
            )}
          </p>
        </div>

        {unread > 0 && (
          <button 
            type="button"
            className="admin-btn"
            onClick={handleMarkAllRead}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              color: '#334155',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#E2E8F0'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; }}
          >
            <CheckCheck size={16} color="#00B875" />
            সবগুলো পঠিত চিহ্নিত করুন (Mark All Read)
          </button>
        )}
      </div>

      {/* Modern Filter Tabs & Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 20,
        flexWrap: 'wrap'
      }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: '#F1F5F9',
          padding: '4px',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'all', label: 'সবগুলো', count: notifications.length, icon: '📌' },
            { id: 'unread', label: 'অপঠিত (Unread)', count: unread, icon: '🟢', highlight: unread > 0 },
            { 
              id: 'invitations', 
              label: 'সিট আমন্ত্রণ', 
              count: notifications.filter(n => n.type?.includes('invitation') || n.title?.includes('আমন্ত্রণ') || Boolean(n.hospital_id)).length, 
              icon: '🏥' 
            },
            { 
              id: 'system', 
              label: 'সিস্টেম নোটিশ', 
              count: notifications.filter(n => !(n.type?.includes('invitation') || n.title?.includes('আমন্ত্রণ') || Boolean(n.hospital_id))).length, 
              icon: '🔔' 
            },
          ].map(tab => {
            const active = filterTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                style={{
                  border: 'none',
                  padding: '7px 14px',
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  background: active ? '#FFFFFF' : 'transparent',
                  color: active ? '#0F172A' : '#64748B',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 999,
                  background: active 
                    ? (tab.highlight ? '#DCFCE7' : '#F1F5F9') 
                    : (tab.highlight ? '#DCFCE7' : '#E2E8F0'),
                  color: tab.highlight ? '#15803D' : '#475569'
                }}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div style={{
          position: 'relative',
          minWidth: 240,
          flex: '0 1 280px'
        }}>
          <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="নোটিফিকেশন খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: 10,
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              fontSize: 13,
              outline: 'none',
              transition: 'border-color 0.2s',
              color: '#0F172A'
            }}
            onFocus={(e) => e.target.style.borderColor = '#00B875'}
            onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#94A3B8',
                fontSize: 14
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="admin-loading"><div className="admin-spinner" /> Loading notifications...</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="admin-card" style={{ padding: '60px 24px', textAlign: 'center', borderRadius: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>
            {filterTab === 'unread' ? '🎉' : '📭'}
          </div>
          <h4 style={{ fontWeight: 700, fontSize: 16, color: '#0F172A', marginBottom: 6 }}>
            {filterTab === 'unread' 
              ? 'সব অপঠিত নোটিফিকেশন পড়া হয়ে গেছে!' 
              : 'কোনো নোটিফিকেশন পাওয়া যায়নি'}
          </h4>
          <p style={{ color: '#64748B', fontSize: 13.5, maxWidth: 420, margin: '0 auto' }}>
            {searchTerm 
              ? `"${searchTerm}" কি-ওয়ার্ড দিয়ে কোনো ফলাফল পাওয়া যায়নি।` 
              : filterTab === 'unread'
                ? 'আপনার ইনবক্সে এই মুহূর্তে কোনো নতুন অপঠিত বার্তা নেই।'
                : 'আপনার জন্য এই ক্যাটাগরিতে কোনো নোটিশ নেই।'}
          </p>
          {(searchTerm || filterTab !== 'all') && (
            <button
              onClick={() => { setFilterTab('all'); setSearchTerm(''); }}
              className="admin-btn admin-btn-outline"
              style={{ marginTop: 16, borderRadius: 8, fontSize: 12.5 }}
            >
              সব নোটিফিকেশন দেখুন
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredNotifications.map(n => {
            const isUnread = !n.is_read
            const isInv = Boolean(
              n.type?.includes('invitation') ||
              (n.title && n.title.includes('আমন্ত্রণ')) ||
              (n.message && n.message.includes('আমন্ত্রণ')) ||
              Boolean(n.hospital_id)
            )

            // Dynamic icon
            const getIcon = () => {
              if (isInv) {
                return <Building2 size={22} color={isUnread ? '#00B875' : '#64748B'} />
              }
              if (n.type === 'warning' || n.type === 'expiry') {
                return <AlertTriangle size={22} color={isUnread ? '#D97706' : '#64748B'} />
              }
              if (n.type === 'promo') {
                return <Gift size={22} color={isUnread ? '#7C3AED' : '#64748B'} />
              }
              return <Bell size={22} color={isUnread ? '#3B82F6' : '#64748B'} />
            }

            const getIconBg = () => {
              if (isInv) return isUnread ? 'rgba(0, 184, 117, 0.12)' : '#F1F5F9'
              if (n.type === 'warning' || n.type === 'expiry') return isUnread ? '#FEF3C7' : '#F1F5F9'
              if (n.type === 'promo') return isUnread ? '#EDE9FE' : '#F1F5F9'
              return isUnread ? 'rgba(59, 130, 246, 0.12)' : '#F1F5F9'
            }

            return (
              <div
                key={n.id}
                onClick={() => handleViewNotification(n)}
                style={{
                  background: isUnread 
                    ? 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)' 
                    : '#FFFFFF',
                  borderRadius: 16,
                  border: isUnread ? '1.5px solid #86EFAC' : '1px solid #E2E8F0',
                  borderLeft: isUnread ? '5px solid #00B875' : '4px solid #CBD5E1',
                  boxShadow: isUnread 
                    ? '0 4px 18px rgba(0, 184, 117, 0.08), 0 1px 3px rgba(0,0,0,0.02)' 
                    : '0 1px 3px rgba(0, 0, 0, 0.02)',
                  padding: '18px 22px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = isUnread 
                    ? '0 8px 24px rgba(0, 184, 117, 0.14)' 
                    : '0 6px 16px rgba(0, 0, 0, 0.06)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = isUnread 
                    ? '0 4px 18px rgba(0, 184, 117, 0.08), 0 1px 3px rgba(0,0,0,0.02)' 
                    : '0 1px 3px rgba(0, 0, 0, 0.02)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 16, flex: 1, minWidth: 260 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: getIconBg(),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {getIcon()}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <h4 style={{
                          margin: 0,
                          fontWeight: isUnread ? 800 : 600,
                          fontSize: 15.5,
                          color: isUnread ? '#0F172A' : '#475569'
                        }}>
                          {n.title}
                        </h4>

                        {/* Status Pills */}
                        {isUnread ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: '#DCFCE7',
                            color: '#15803D',
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: '0.3px',
                            border: '1px solid #86EFAC'
                          }}>
                            <span style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: '#16A34A',
                              boxShadow: '0 0 0 2px rgba(22, 163, 74, 0.3)'
                            }} />
                            নতুন (Unread)
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: '#F8FAFC',
                            color: '#64748B',
                            padding: '2px 9px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 600,
                            border: '1px solid #E2E8F0'
                          }}>
                            ✓ পঠিত (Seen)
                          </span>
                        )}

                        {isInv && (
                          <span style={{
                            background: '#E0F2FE',
                            color: '#0369A1',
                            padding: '2px 9px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            border: '1px solid #BAE6FD',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            🏥 সিট বরাদ্দ আমন্ত্রণ
                          </span>
                        )}
                      </div>

                      <p style={{
                        margin: '0 0 8px',
                        fontSize: 13.5,
                        color: isUnread ? '#334155' : '#64748B',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        wordBreak: 'break-word'
                      }}>
                        {getNotificationTeaser(n.message, 130)}
                      </p>

                      {/* Subtle Badge if custom note is attached */}
                      {typeof n.message === 'string' && (n.message.includes('হাসপাতালের বিশেষ বার্তা') || n.message.includes('response_note')) && (
                        <div style={{ marginBottom: 8 }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: '#ECFDF5',
                            border: '1px solid #A7F3D0',
                            color: '#065F46',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 600
                          }}>
                            ✉️ হাসপাতালের বিশেষ বার্তা / অফার সংযুক্ত
                          </span>
                        </div>
                      )}

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        flexWrap: 'wrap',
                        fontSize: 12,
                        color: isUnread ? '#475569' : '#94A3B8'
                      }}>
                        {n.sender?.name && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: isUnread ? 700 : 500 }}>
                            <Building2 size={13} style={{ color: isUnread ? '#00B875' : '#94A3B8' }} />
                            {n.sender.name}
                          </span>
                        )}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Clock size={13} />
                          {n.created_at ? new Date(n.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', alignSelf: 'center' }}>
                    {isInv && isUnread ? (
                      <button
                        type="button"
                        style={{
                          padding: '8px 18px',
                          borderRadius: 10,
                          fontWeight: 700,
                          fontSize: 13,
                          background: '#00B875',
                          color: '#FFFFFF',
                          border: 'none',
                          boxShadow: '0 2px 8px rgba(0, 184, 117, 0.25)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        আমন্ত্রণ দেখুন
                      </button>
                    ) : (
                      <button
                        type="button"
                        style={{
                          padding: '7px 16px',
                          borderRadius: 10,
                          fontWeight: 600,
                          fontSize: 12.5,
                          background: '#FFFFFF',
                          color: isUnread ? '#0F172A' : '#64748B',
                          border: '1px solid #E2E8F0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        বিস্তারিত পড়ুন
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Notification Detail Modal */}
      {selectedNotification && (() => {
        const isRejectedNotice = Boolean(
          selectedNotification.title?.includes('প্রত্যাখ্যাত') ||
          selectedNotification.message?.includes('প্রত্যাখ্যাত') ||
          selectedNotification.message?.includes('গ্রহণ করেননি')
        )
        const isAcceptedNotice = Boolean(
          selectedNotification.title?.includes('গৃহীত') ||
          selectedNotification.message?.includes('গৃহীত')
        )
        const isIncomingDoctorInvitation = Boolean(
          !isRejectedNotice &&
          !isAcceptedNotice &&
          selectedNotification.target_type !== 'hospital' &&
          (
            selectedNotification.type?.includes('invitation') ||
            (selectedNotification.title && selectedNotification.title.includes('নতুন') && selectedNotification.title.includes('আমন্ত্রণ')) ||
            (selectedNotification.message && selectedNotification.message.includes('আমন্ত্রণ জানিয়েছে'))
          )
        )

        const matchingInvitation = isIncomingDoctorInvitation
          ? seatInvitations.find(inv => 
              (inv.status === 'pending' || inv.status?.value === 'pending') &&
              (
                (selectedNotification.hospital_id && String(inv.hospital_id) === String(selectedNotification.hospital_id)) ||
                (selectedNotification.sent_by && String(inv.invited_by) === String(selectedNotification.sent_by)) ||
                (inv.hospital?.name && selectedNotification.title?.includes(inv.hospital.name)) ||
                (inv.hospital?.name && selectedNotification.message?.includes(inv.hospital.name))
              )
            ) || seatInvitations.find(inv => inv.status === 'pending' || inv.status?.value === 'pending')
          : null

        return (
          <div 
            className="admin-modal-overlay" 
            onClick={handleCloseModal} 
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
                maxWidth: 540, 
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
                    background: isRejectedNotice ? '#FEE2E2' : 'rgba(0, 168, 140, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0
                  }}>
                    {isRejectedNotice ? '⚠️' : (typeIcons[selectedNotification.type] || '📩')}
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
                  onClick={handleCloseModal}
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
                  color: isRejectedNotice ? '#991B1B' : '#0F172A', 
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
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedNotification.message) }}
                />

                {/* Fallback Custom Note Display if not already in message HTML */}
                {isIncomingDoctorInvitation && (matchingInvitation?.notes || matchingInvitation?.response_note) && !selectedNotification.message?.includes('হাসপাতালের বিশেষ বার্তা') && (
                  <div style={{
                    marginTop: 14,
                    background: '#F0FDF4',
                    border: '1px solid #A7F3D0',
                    borderLeft: '4px solid #10B981',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 13.5,
                    color: '#065F46',
                    lineHeight: 1.5
                  }}>
                    <strong style={{ display: 'block', fontSize: 12, color: '#047857', marginBottom: 3 }}>
                      💬 হাসপাতালের বিশেষ বার্তা / অফার:
                    </strong>
                    &ldquo;{matchingInvitation.notes || matchingInvitation.response_note}&rdquo;
                  </div>
                )}

                {/* Facilities Accordion Card (Only for Incoming Pending Doctor Invitation) */}
                {isIncomingDoctorInvitation && (
                  <div style={{
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                    border: '1.5px solid #a7f3d0',
                    borderRadius: 14,
                    padding: '16px 18px',
                    marginTop: 18,
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.05)'
                  }}>
                    <div 
                      onClick={() => setShowFacilities(!showFacilities)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>🎁</span>
                        <span style={{ fontWeight: 800, fontSize: 13.5, color: '#065f46' }}>
                          এই প্রাতিষ্ঠানিক সিটের আওতায় প্রাপ্ত সুবিধাসমূহ
                        </span>
                      </div>
                      <button
                        type="button"
                        style={{
                          border: 'none',
                          background: 'rgba(5, 150, 105, 0.12)',
                          color: '#047857',
                          borderRadius: 6,
                          padding: '3px 8px',
                          fontSize: 11.5,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer'
                        }}
                      >
                        {showFacilities ? 'সংক্ষিপ্ত করুন' : 'সুবিধাসমূহ দেখুন'}
                        {showFacilities ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>

                    {showFacilities && (
                      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#047857' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <Award size={16} style={{ flexShrink: 0, color: '#059669', marginTop: 2 }} />
                          <div>
                            <strong style={{ color: '#065f46' }}>অফিসিয়াল পার্টনারশিপ:</strong> {matchingInvitation?.hospital?.name || selectedNotification.sender?.name || 'হাসপাতাল'}-এর পাবলিক প্রোফাইল ও ডিরেক্টরিতে আপনার অফিসিয়াল সংযুক্তি ও প্রাতিষ্ঠানিক ব্যাজ।
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <Users size={16} style={{ flexShrink: 0, color: '#059669', marginTop: 2 }} />
                          <div>
                            <strong style={{ color: '#065f46' }}>রোগী বৃদ্ধি ও রেফারেল:</strong> হাসপাতালের ওপিডি (OPD) ও প্রাতিষ্ঠানিক পেশেন্ট নেটওয়ার্ক থেকে সরাসরি রোগী প্রাপ্তির সুযোগ।
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <Calendar size={16} style={{ flexShrink: 0, color: '#059669', marginTop: 2 }} />
                          <div>
                            <strong style={{ color: '#065f46' }}>সমন্বিত চেম্বার ও রোস্টার:</strong> হাসপাতালের নিজস্ব ডেডিকেটেড শিডিউল এবং সেন্ট্রালাইজড অনলাইন/অফলাইন বুকিং সুবিধা।
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <ShieldCheck size={16} style={{ flexShrink: 0, color: '#059669', marginTop: 2 }} />
                          <div>
                            <strong style={{ color: '#065f46' }}>হাসপাতাল সহায়তা:</strong> ফ্রন্টডেস্ক অ্যাসিস্ট্যান্স ও ভেরিফাইড ক্লিনিক্যাল সাপোর্ট।
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{ 
                padding: '12px 20px', 
                borderTop: '1px solid #F1F5F9', 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: isIncomingDoctorInvitation && matchingInvitation ? 'space-between' : 'flex-end',
                background: '#FAFBFD',
                gap: 10,
                flexWrap: 'wrap'
              }}>
                {isIncomingDoctorInvitation && matchingInvitation ? (
                  <>
                    <button 
                      type="button"
                      className="admin-btn admin-btn-outline" 
                      style={{ 
                        padding: '7px 14px', 
                        borderRadius: 8, 
                        fontWeight: 600,
                        fontSize: 12.5,
                        cursor: 'pointer',
                        background: '#FFFFFF',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                      onClick={() => {
                        handleCloseModal()
                        navigate('/doctor/my-profile')
                      }}
                    >
                      <ExternalLink size={13} />
                      প্রোফাইলে দেখুন
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button 
                        type="button"
                        disabled={submittingReject}
                        style={{ 
                          padding: '7px 16px', 
                          borderRadius: 8, 
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                          background: '#FEF2F2',
                          border: '1px solid #FCA5A5',
                          color: '#DC2626',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          transition: '0.15s'
                        }}
                        onClick={() => openRejectModal(matchingInvitation)}
                      >
                        <X size={14} />
                        প্রত্যাখ্যান
                      </button>

                      <button 
                        type="button"
                        disabled={respondingInviteId !== null}
                        style={{ 
                          padding: '7px 18px', 
                          borderRadius: 8, 
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer',
                          background: '#00B875',
                          border: 'none',
                          color: '#FFFFFF',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          boxShadow: '0 2px 6px rgba(0, 184, 117, 0.3)',
                          transition: '0.15s'
                        }}
                        onClick={() => handleAcceptInvitation(matchingInvitation)}
                      >
                        <Check size={14} />
                        {respondingInviteId === matchingInvitation.id ? 'গ্রহণ করা হচ্ছে...' : 'গ্রহণ করুন (Accept)'}
                      </button>
                    </div>
                  </>
                ) : (
                  <button 
                    type="button"
                    className="admin-btn admin-btn-outline" 
                    style={{ 
                      padding: '7px 20px', 
                      borderRadius: 8, 
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      background: '#FFFFFF'
                    }}
                    onClick={handleCloseModal}
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Rejection Reason Modal */}
      {rejectModalOpen && (
        <div 
          className="admin-modal-overlay" 
          onClick={() => !submittingReject && setRejectModalOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100000, padding: 16
          }}
        >
          <div 
            className="admin-modal"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 480,
              width: '100%',
              background: '#FFFFFF',
              borderRadius: 18,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              border: '1px solid #E2E8F0'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FFF5F5'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#FEE2E2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#DC2626', flexShrink: 0
                }}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#991B1B' }}>
                    আমন্ত্রণ প্রত্যাখ্যানের কারণ
                  </h4>
                  <span style={{ fontSize: 12, color: '#DC2626' }}>
                    {rejectingInvitation?.hospital?.name || 'হাসপাতাল'}-এর জন্য কারণ উল্লেখ করুন
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={submittingReject}
                onClick={() => setRejectModalOpen(false)}
                style={{
                  border: 'none', background: 'transparent',
                  cursor: 'pointer', color: '#94A3B8', fontSize: 16
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '22px 24px' }}>
              <p style={{ margin: '0 0 14px', fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>
                হাসপাতাল কর্তৃপক্ষকে জানাতে আপনি কেন আমন্ত্রণটি গ্রহণ করতে পারছেন না তা নির্বাচন করুন বা লিখে দিন:
              </p>

              {/* Presets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {REJECT_PRESETS.map((preset, idx) => {
                  const isSelected = rejectReason === preset
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={submittingReject}
                      onClick={() => setRejectReason(preset)}
                      style={{
                        textAlign: 'left',
                        padding: '9px 14px',
                        borderRadius: 10,
                        fontSize: 12.5,
                        fontWeight: isSelected ? 700 : 500,
                        border: isSelected ? '1.5px solid #EF4444' : '1px solid #E2E8F0',
                        background: isSelected ? '#FEF2F2' : '#F8FAFC',
                        color: isSelected ? '#991B1B' : '#334155',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isSelected ? '✓ ' : '• '} {preset}
                    </button>
                  )
                })}
              </div>

              {/* Custom Text Area */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  অথবা বিস্তারিত মন্তব্য / কারণ লিখুন:
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="যেমন: বর্তমানে চেম্বার শিডিউল ব্যস্ত, আগামী মাসে আলোচনা করতে পারি..."
                  disabled={submittingReject}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    fontSize: 13,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    color: '#0F172A'
                  }}
                  onFocus={e => e.target.style.borderColor = '#EF4444'}
                  onBlur={e => e.target.style.borderColor = '#CBD5E1'}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #F1F5F9',
              background: '#FAFBFD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10
            }}>
              <button
                type="button"
                disabled={submittingReject}
                onClick={() => setRejectModalOpen(false)}
                className="admin-btn admin-btn-outline"
                style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, background: '#FFFFFF' }}
              >
                বাতিল করুন
              </button>

              <button
                type="button"
                disabled={submittingReject}
                onClick={submitRejection}
                style={{
                  padding: '8px 20px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  border: 'none',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
                }}
              >
                {submittingReject ? 'প্রত্যাখ্যান করা হচ্ছে...' : '✕ নিশ্চিতভাবে প্রত্যাখ্যান করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

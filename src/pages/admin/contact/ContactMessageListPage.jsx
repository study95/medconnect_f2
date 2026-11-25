import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Table, Modal, Button } from 'react-bootstrap'
import {
  IconMail, IconMailOpened, IconRefresh, IconEye, IconTrash,
  IconCheck, IconArchive, IconPhone, IconBrandWhatsapp, IconDeviceFloppy,
  IconAlertTriangle, IconCopy, IconClock, IconFileText
} from '@tabler/icons-react'
import toast from 'react-hot-toast'
import axiosInstance from '../../../api/axiosInstance'
import ListToolbar from '../../../components/admin/ListToolbar'
import useTableUrlFilters from '../../../hooks/useTableUrlFilters'
import DeleteModal from '../../../components/admin/DeleteModal'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'
import { PulseLight } from '../../../components/common/NewItemPulseLight'

const STATUS_CONFIG = {
  unread:   { label: 'অপঠিত (Unread)',       color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A', icon: <IconMail size={13} /> },
  read:     { label: 'পঠিত (Read)',           color: '#3B82F6', bg: '#DBEAFE', border: '#BFDBFE', icon: <IconMailOpened size={13} /> },
  replied:  { label: 'উত্তর দেওয়া হয়েছে',      color: '#10B981', bg: '#D1FAE5', border: '#A7F3D0', icon: <IconCheck size={13} /> },
  archived: { label: 'সংরক্ষিত (Archived)',   color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB', icon: <IconArchive size={13} /> },
}

const DEPARTMENTS = [
  'অ্যাপয়েন্টমেন্ট ও রোগী সেবা',
  'ডাক্তার নিবন্ধন সেবা',
  'হাসপাতাল ও ক্লিনিক সেবা',
  'ফি ও পেমেন্ট সংক্রান্ত',
  'লগইন ও টেকনিক্যাল সাপোর্ট',
]

function StatCard({ label, value, icon, color, active, onClick }) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      style={{
        background: active ? `${color}0D` : 'white',
        borderRadius: 16,
        padding: '18px 22px',
        border: active ? `2px solid ${color}` : '2px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flex: 1,
        minWidth: 155,
        boxShadow: active ? `0 4px 14px ${color}25` : '0 2px 8px rgba(0,0,0,0.02)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.18s ease-in-out',
        userSelect: 'none',
        position: 'relative',
        boxSizing: 'border-box',
      }}
      onMouseEnter={(e) => {
        if (!active && onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = `0 6px 16px rgba(0,0,0,0.06)`
          e.currentTarget.style.borderColor = color
        }
      }}
      onMouseLeave={(e) => {
        if (!active && onClick) {
          e.currentTarget.style.transform = 'none'
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'
          e.currentTarget.style.borderColor = '#E2E8F0'
        }
      }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: 14,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>{value}</div>
        <div style={{
          fontSize: 12,
          color: active ? color : '#64748B',
          fontWeight: active ? 800 : 600,
          marginTop: 2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {label}
        </div>
      </div>
      {active && (
        <span
          style={{
            position: 'absolute',
            top: 11,
            right: 13,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 0 3px ${color}33`,
          }}
          title="সক্রিয় ফিল্টার"
        />
      )}
    </div>
  )
}

function TableCheckbox({ checked, indeterminate, onChange, title }) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        margin: 0,
        position: 'relative',
        userSelect: 'none',
        verticalAlign: 'middle',
      }}
      title={title}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 0,
          height: 0,
          margin: 0,
          pointerEvents: 'none',
        }}
      />
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          border: checked || indeterminate ? '1.5px solid #10B981' : '1.5px solid #CBD5E1',
          background: checked || indeterminate ? '#10B981' : '#FFFFFF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease-in-out',
          boxShadow: checked || indeterminate ? '0 1px 3px rgba(16, 185, 129, 0.3)' : '0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        {checked && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {!checked && indeterminate && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </span>
    </label>
  )
}

export default function ContactMessageListPage() {
  const queryClient = useQueryClient()
  // Filters State synchronized with URL Query Parameters & SessionStorage
  const {
    filters,
    setFilter,
    setFilters,
    resetFilters,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    perPage,
    setPerPage,
    hasActiveFilters
  } = useTableUrlFilters({
    initialFilters: {
      filterTab: 'inbox',
      filterStatus: 'all',
      filterDept: 'all',
      dateFrom: '',
      dateTo: '',
    },
    aliases: {
      filterTab: ['tab'],
      filterStatus: ['status'],
      filterDept: ['dept', 'department'],
      dateFrom: ['date_from'],
      dateTo: ['date_to']
    },
    storageKey: 'admin_contact_messages_filters'
  })

  const {
    filterTab,
    filterStatus,
    filterDept,
    dateFrom,
    dateTo,
  } = filters

  const setFilterTab = (val) => {
    setFilter('filterTab', val)
    setCurrentPage(1)
  }
  const setFilterStatus = (val) => setFilter('filterStatus', val)
  const setFilterDept = (val) => setFilter('filterDept', val)
  const setDateFrom = (val) => setFilter('dateFrom', val)
  const setDateTo = (val) => setFilter('dateTo', val)

  const [showFilters, setShowFilters] = useState(Boolean(
    (filterStatus && filterStatus !== 'all') || (filterDept && filterDept !== 'all') || dateFrom || dateTo
  ))

  const [viewMsg, setViewMsg] = useState(null)
  const [adminNote, setAdminNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [pendingStatus, setPendingStatus] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [noteSavedNotice, setNoteSavedNotice] = useState(false)
  const [copiedCID, setCopiedCID] = useState(false)

  // Selection & Bulk Action States
  const [selectedIds, setSelectedIds] = useState([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [showPurgeSpamModal, setShowPurgeSpamModal] = useState(false)
  const [purgeLoading, setPurgeLoading] = useState(false)

  // Clear selections when changing tabs, status, search, or pagination
  React.useEffect(() => {
    setSelectedIds([])
  }, [filterTab, filterStatus, filterDept, dateFrom, dateTo, search, currentPage, perPage])

  const handleCopyCID = (cid) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(cid).catch(() => {})
    }
    setCopiedCID(true)
    toast.success('CID কপি করা হয়েছে!')
    setTimeout(() => setCopiedCID(false), 2000)
  }

  const handleDatePreset = (preset) => {
    const now = new Date()
    const fmt = (d) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    if (preset === 'today') {
      const t = fmt(now)
      setFilters({ dateFrom: t, dateTo: t })
    } else if (preset === 'yesterday') {
      const y = new Date(now)
      y.setDate(y.getDate() - 1)
      const yt = fmt(y)
      setFilters({ dateFrom: yt, dateTo: yt })
    } else if (preset === 'last7') {
      const past = new Date(now)
      past.setDate(past.getDate() - 6)
      setFilters({ dateFrom: fmt(past), dateTo: fmt(now) })
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      setFilters({ dateFrom: fmt(firstDay), dateTo: fmt(now) })
    } else if (preset === 'all') {
      setFilters({ dateFrom: '', dateTo: '' })
    }
  }

  const {
    data: msgRes = { data: [], total: 0, stats: { total: 0, inbox_total: 0, verified_count: 0, spam_count: 0, unread: 0, read: 0, replied: 0, archived: 0 } },
    isLoading: loading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-contact-messages', { search, tab: filterTab, status: filterStatus, department: filterDept, dateFrom, dateTo, perPage, currentPage }],
    queryFn: async () => {
      const res = await axiosInstance.get('/admin/contact-messages', {
        params: {
          search: search || undefined,
          tab: filterTab || undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          department: filterDept !== 'all' ? filterDept : undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          per_page: perPage,
          page: currentPage
        }
      })
      return {
        data: res.data?.data || [],
        total: res.data?.total ?? (res.data?.data?.length || 0),
        stats: res.data?.stats || { total: 0, inbox_total: 0, verified_count: 0, spam_count: 0, unread: 0, read: 0, replied: 0, archived: 0 }
      }
    },
    staleTime: 30 * 1000,
  })

  const messages = msgRes.data
  const stats = msgRes.stats

  const openMsgModal = async (msg) => {
    setViewMsg(msg)
    setAdminNote(msg?.admin_note || '')
    setPendingStatus(null)
    setNoteSavedNotice(false)
    setCopiedCID(false)
    // Auto-mark unread message as read when opened
    if (msg?.status === 'unread') {
      try {
        await axiosInstance.patch(`/admin/contact-messages/${msg.id}/status`, {
          status: 'read',
          admin_note: msg.admin_note || null
        })
        setViewMsg(prev => prev && prev.id === msg.id ? { ...prev, status: 'read' } : prev)
        queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] })
        window.dispatchEvent(new Event('unread-count-sync'))
      } catch {
        // Ignore silent auto-read failure
      }
    }
  }

  const confirmStatusChange = async (newStatus) => {
    if (!viewMsg) return
    setUpdatingStatus(true)
    try {
      await axiosInstance.patch(`/admin/contact-messages/${viewMsg.id}/status`, {
        status: newStatus,
        admin_note: adminNote
      })
      queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] })
      window.dispatchEvent(new Event('unread-count-sync'))
      setViewMsg(prev => ({ ...prev, status: newStatus, admin_note: adminNote }))
      setPendingStatus(null)
      toast.success(`স্ট্যাটাস পরিবর্তন হয়ে "${STATUS_CONFIG[newStatus]?.label || newStatus}" হয়েছে!`, {
        icon: '✅',
        duration: 3500
      })
    } catch {
      toast.error('স্ট্যাটাস আপডেট করা সম্ভব হয়নি')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleSaveAdminNote = async () => {
    if (!viewMsg) return
    setSavingNote(true)
    try {
      await axiosInstance.patch(`/admin/contact-messages/${viewMsg.id}/status`, {
        status: viewMsg.status || 'read',
        admin_note: adminNote
      })
      queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] })
      setViewMsg(prev => ({ ...prev, admin_note: adminNote }))
      setNoteSavedNotice(true)
      setTimeout(() => setNoteSavedNotice(false), 4500)
      toast.success('অ্যাডমিন নোট সফলভাবে সংরক্ষিত হয়েছে!', {
        icon: '📝',
        duration: 3500
      })
    } catch {
      toast.error('নোট সংরক্ষণ করা সম্ভব হয়নি')
    } finally {
      setSavingNote(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await axiosInstance.delete(`/admin/contact-messages/${deleteId}`)
      queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] })
      if (viewMsg?.id === deleteId) setViewMsg(null)
      setDeleteId(null)
      toast.success('বার্তাটি মুছে ফেলা হয়েছে')
    } catch {
      setDeleteId(null)
      toast.error('বার্তা মুছে ফেলা সম্ভব হয়নি')
    }
  }

  const handlePurgeSpam = async () => {
    setPurgeLoading(true)
    try {
      const res = await axiosInstance.post('/admin/contact-messages/purge-spam')
      queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] })
      setShowPurgeSpamModal(false)
      toast.success(res.data?.message || 'সকল স্প্যাম বার্তা মুছে ফেলা হয়েছে')
    } catch {
      toast.error('স্প্যাম পরিষ্কার করা সম্ভব হয়নি')
    } finally {
      setPurgeLoading(false)
    }
  }

  const handleToggleSpam = async (msgId) => {
    try {
      const res = await axiosInstance.patch(`/admin/contact-messages/${msgId}/toggle-spam`)
      queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] })
      if (viewMsg && viewMsg.id === msgId) {
        setViewMsg(prev => ({ ...prev, is_spam: !prev.is_spam }))
      }
      toast.success(res.data?.message || 'স্ট্যাটাস আপডেট হয়েছে')
    } catch {
      toast.error('আপডেট করা সম্ভব হয়নি')
    }
  }

  const isAllSelected = messages.length > 0 && messages.every(m => selectedIds.includes(m.id))
  const isSomeSelected = messages.length > 0 && messages.some(m => selectedIds.includes(m.id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const pageIds = messages.map(m => m.id)
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)))
    } else {
      const pageIds = messages.map(m => m.id)
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  const toggleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleBulkStatus = async (newStatus) => {
    if (selectedIds.length === 0) return
    setBulkLoading(true)
    try {
      const res = await axiosInstance.post('/admin/contact-messages/bulk-status', {
        ids: selectedIds,
        status: newStatus
      })
      queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] })
      window.dispatchEvent(new Event('unread-count-sync'))
      toast.success(res.data?.message || 'নির্বাচিত বার্তাগুলোর স্ট্যাটাস আপডেট হয়েছে')
      setSelectedIds([])
    } catch {
      toast.error('স্ট্যাটাস আপডেট করা সম্ভব হয়নি')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkSpam = async (isSpam) => {
    if (selectedIds.length === 0) return
    setBulkLoading(true)
    try {
      const res = await axiosInstance.post('/admin/contact-messages/bulk-spam', {
        ids: selectedIds,
        is_spam: isSpam
      })
      queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] })
      toast.success(res.data?.message || (isSpam ? 'স্প্যাম হিসেবে চিহ্নিত করা হয়েছে' : 'ইনবক্সে ফেরত নেওয়া হয়েছে'))
      setSelectedIds([])
    } catch {
      toast.error('আপডেট করা সম্ভব হয়নি')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    setBulkLoading(true)
    try {
      const res = await axiosInstance.post('/admin/contact-messages/bulk-delete', {
        ids: selectedIds
      })
      queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] })
      toast.success(res.data?.message || `${selectedIds.length} টি বার্তা সফলভাবে মুছে ফেলা হয়েছে`)
      setSelectedIds([])
      setShowBulkDeleteModal(false)
    } catch {
      toast.error('বার্তাগুলো মুছে ফেলা সম্ভব হয়নি')
    } finally {
      setBulkLoading(false)
    }
  }

  const formatDate = (iso) => {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return String(iso)
    }
  }

  return (
    <div className="admin-page">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">কন্টাক্ট পেইজ বার্তা ব্যবস্থাপনা (Public Contact Inquiries)</h2>
          <p className="admin-page-subtitle">যোগাযোগ (/contact) পেইজ থেকে প্রেরিত সকল ভিজিটর ও রোগীদের সাধারণ জিজ্ঞাসা ও বার্তা</p>
        </div>
      </div>

      {/* ── TOP TRIAGE TABS (INBOX / VERIFIED / SPAM / ALL) ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#F8FAFC',
        padding: '6px',
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 8
      }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setFilterTab('inbox')}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: filterTab === 'inbox' ? '1.5px solid #00B875' : '1px solid #E2E8F0',
              background: filterTab === 'inbox' ? '#FFFFFF' : 'transparent',
              color: filterTab === 'inbox' ? '#0F172A' : '#64748B',
              fontWeight: 800,
              fontSize: 13.5,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: filterTab === 'inbox' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span>📥 প্রধান ইনবক্স</span>
            <span style={{
              fontSize: 11,
              background: filterTab === 'inbox' ? '#DCFCE7' : '#E2E8F0',
              color: filterTab === 'inbox' ? '#15803D' : '#475569',
              padding: '2px 7px',
              borderRadius: 99,
              fontWeight: 800
            }}>
              {stats.inbox_total ?? stats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('verified')}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: filterTab === 'verified' ? '1.5px solid #10B981' : '1px solid #E2E8F0',
              background: filterTab === 'verified' ? '#FFFFFF' : 'transparent',
              color: filterTab === 'verified' ? '#065F46' : '#64748B',
              fontWeight: 800,
              fontSize: 13.5,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: filterTab === 'verified' ? '0 2px 6px rgba(16,185,129,0.12)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span>✓ ভেরিফায়েড বার্তা</span>
            <span style={{
              fontSize: 11,
              background: filterTab === 'verified' ? '#D1FAE5' : '#E2E8F0',
              color: filterTab === 'verified' ? '#065F46' : '#475569',
              padding: '2px 7px',
              borderRadius: 99,
              fontWeight: 800
            }}>
              {stats.verified_count ?? 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('spam')}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: filterTab === 'spam' ? '1.5px solid #EF4444' : '1px solid #E2E8F0',
              background: filterTab === 'spam' ? '#FFFFFF' : 'transparent',
              color: filterTab === 'spam' ? '#991B1B' : '#64748B',
              fontWeight: 800,
              fontSize: 13.5,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: filterTab === 'spam' ? '0 2px 6px rgba(239,68,68,0.12)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span>⚠️ স্প্যাম বক্স</span>
            <span style={{
              fontSize: 11,
              background: filterTab === 'spam' ? '#FEE2E2' : '#E2E8F0',
              color: filterTab === 'spam' ? '#991B1B' : '#475569',
              padding: '2px 7px',
              borderRadius: 99,
              fontWeight: 800
            }}>
              {stats.spam_count ?? 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('all')}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: filterTab === 'all' ? '1.5px solid #64748B' : '1px solid #E2E8F0',
              background: filterTab === 'all' ? '#FFFFFF' : 'transparent',
              color: filterTab === 'all' ? '#0F172A' : '#64748B',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: filterTab === 'all' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span>সব বার্তা</span>
          </button>
        </div>

        {filterTab === 'spam' && (stats.spam_count ?? 0) > 0 && (
          <button
            type="button"
            onClick={() => setShowPurgeSpamModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(239,68,68,0.25)'
            }}
          >
            <IconTrash size={14} /> সব স্প্যাম মুছুন
          </button>
        )}
      </div>

      {/* Dynamic Database Count Cards with One-Click Interactive Filtering */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
        <StatCard
          label="ইনবক্স বার্তা"
          value={stats.inbox_total ?? stats.total}
          icon={<IconMail size={22} />}
          color="#00B875"
          active={filterTab === 'inbox' && filterStatus === 'all'}
          onClick={() => {
            setFilterTab('inbox')
            setFilterStatus('all')
            setCurrentPage(1)
          }}
        />
        <StatCard
          label="✓ ভেরিফায়েড বার্তা"
          value={stats.verified_count ?? 0}
          icon={<IconCheck size={22} stroke={2.5} />}
          color="#10B981"
          active={filterTab === 'verified' && filterStatus === 'all'}
          onClick={() => {
            if (filterTab === 'verified' && filterStatus === 'all') {
              setFilterTab('inbox')
            } else {
              setFilterTab('verified')
              setFilterStatus('all')
            }
            setCurrentPage(1)
          }}
        />
        <StatCard
          label="অপঠিত (Unread)"
          value={stats.unread ?? 0}
          icon={<IconMail size={22} stroke={2.2} />}
          color="#F59E0B"
          active={filterStatus === 'unread'}
          onClick={() => {
            if (filterStatus === 'unread') {
              setFilterStatus('all')
            } else {
              setFilterStatus('unread')
            }
            setCurrentPage(1)
          }}
        />
        <StatCard
          label="পঠিত (Read)"
          value={stats.read ?? 0}
          icon={<IconMailOpened size={22} stroke={2.2} />}
          color="#3B82F6"
          active={filterStatus === 'read'}
          onClick={() => {
            if (filterStatus === 'read') {
              setFilterStatus('all')
            } else {
              setFilterStatus('read')
            }
            setCurrentPage(1)
          }}
        />
        <StatCard
          label="⚠️ স্প্যাম বক্স"
          value={stats.spam_count ?? 0}
          icon={<IconAlertTriangle size={22} stroke={2.2} />}
          color="#EF4444"
          active={filterTab === 'spam'}
          onClick={() => {
            if (filterTab === 'spam') {
              setFilterTab('inbox')
            } else {
              setFilterTab('spam')
              setFilterStatus('all')
            }
            setCurrentPage(1)
          }}
        />
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="CID (উদাঃ CID-123456), প্রেরকের নাম, মোবাইল নম্বর, ইমেইল বা বার্তা খুঁজুন..."
        onRefresh={() => refetch()}
        refreshing={isFetching}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={resetFilters}
        activeFilters={[
          filterStatus !== 'all' && { key: 'status', label: `স্ট্যাটাস: ${STATUS_CONFIG[filterStatus]?.label || filterStatus}`, onRemove: () => setFilterStatus('all') },
          filterDept !== 'all' && { key: 'dept', label: `বিভাগ: ${filterDept}`, onRemove: () => setFilterDept('all') },
          dateFrom && { key: 'date_from', label: `শুরুর তারিখ: ${dateFrom}`, onRemove: () => setDateFrom('') },
          dateTo && { key: 'date_to', label: `শেষ তারিখ: ${dateTo}`, onRemove: () => setDateTo('') },
        ].filter(Boolean)}
      >
        <div style={{ minWidth: 150 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>স্ট্যাটাস</label>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1) }} style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', cursor: 'pointer', background: 'white', fontWeight: 600, width: '100%' }}>
            <option value="all">সব স্ট্যাটাস</option>
            <option value="unread">অপঠিত (Unread)</option>
            <option value="read">পঠিত (Read)</option>
            <option value="replied">উত্তর দেওয়া হয়েছে (Replied)</option>
            <option value="archived">সংরক্ষিত (Archived)</option>
          </select>
        </div>
        <div style={{ minWidth: 190 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>নির্বাচিত বিভাগ</label>
          <select value={filterDept} onChange={e => { setFilterDept(e.target.value); setCurrentPage(1) }} style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', cursor: 'pointer', background: 'white', fontWeight: 600, width: '100%' }}>
            <option value="all">সব বিভাগ</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <div style={{ minWidth: 150 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>দ্রুত তারিখ ফিল্টার</label>
          <select
            value={(() => {
              if (!dateFrom && !dateTo) return 'all'
              const now = new Date()
              const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
              const t = fmt(now)
              if (dateFrom === t && dateTo === t) return 'today'
              const y = new Date(now); y.setDate(y.getDate() - 1); const yt = fmt(y)
              if (dateFrom === yt && dateTo === yt) return 'yesterday'
              const past7 = new Date(now); past7.setDate(past7.getDate() - 6);
              if (dateFrom === fmt(past7) && dateTo === t) return 'last7'
              const firstDay = fmt(new Date(now.getFullYear(), now.getMonth(), 1))
              if (dateFrom === firstDay && dateTo === t) return 'this_month'
              return 'custom'
            })()}
            onChange={e => handleDatePreset(e.target.value)}
            style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', cursor: 'pointer', background: 'white', fontWeight: 600, width: '100%' }}
          >
            <option value="all">সব সময়</option>
            <option value="today">আজ (Today)</option>
            <option value="yesterday">গতকাল (Yesterday)</option>
            <option value="last7">বিগত ৭ দিন (Last 7 Days)</option>
            <option value="this_month">এই মাস (This Month)</option>
            <option value="custom" disabled>কাস্টম তারিখ (Custom)</option>
          </select>
        </div>
        <div style={{ minWidth: 140 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>শুরুর তারিখ (From)</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setCurrentPage(1) }}
            style={{ height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: 'white', width: '100%', color: '#1E293B' }}
          />
        </div>
        <div style={{ minWidth: 140 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>শেষ তারিখ (To)</label>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={e => { setDateTo(e.target.value); setCurrentPage(1) }}
            style={{ height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: 'white', width: '100%', color: '#1E293B' }}
          />
        </div>
      </ListToolbar>

      <div className="admin-card">
        <div
          className="admin-card-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            padding: '16px 20px',
            borderBottom: '1px solid var(--admin-border, #E2E8F0)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 className="admin-card-title" style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
              {filterStatus === 'unread' && 'অপঠিত বার্তা (Unread)'}
              {filterStatus === 'read' && 'পঠিত বার্তা (Read)'}
              {filterStatus !== 'unread' && filterStatus !== 'read' && filterTab === 'inbox' && 'ইনবক্স বার্তা'}
              {filterStatus !== 'unread' && filterStatus !== 'read' && filterTab === 'verified' && 'ভেরিফায়েড বার্তা'}
              {filterStatus !== 'unread' && filterStatus !== 'read' && filterTab === 'spam' && 'স্প্যাম বার্তা বক্স'}
              {filterStatus !== 'unread' && filterStatus !== 'read' && filterTab === 'all' && 'সকল কন্টাক্ট বার্তা'}
            </h3>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#64748B',
                background: '#F1F5F9',
                padding: '2px 9px',
                borderRadius: 99,
                border: '1px solid #E2E8F0',
              }}
            >
              {msgRes.total ?? messages.length} টি বার্তা
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {selectedIds.length > 0 && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%)',
                  border: '1px solid #FECDD3',
                  borderRadius: 20,
                  padding: '4px 8px 4px 14px',
                  boxShadow: '0 2px 6px rgba(225, 29, 72, 0.08)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#00B875',
                      color: '#ffffff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    ✓
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', letterSpacing: '-0.01em' }}>
                    {selectedIds.length} <span style={{ fontWeight: 600, color: '#64748B' }}>টি নির্বাচিত</span>
                  </span>
                </div>

                <div style={{ width: 1, height: 16, background: '#CBD5E1', opacity: 0.6 }} />

                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 12,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'
                    e.currentTarget.style.color = '#0F172A'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#64748B'
                  }}
                >
                  নির্বাচন বাতিল
                </button>

                <button
                  type="button"
                  disabled={bulkLoading}
                  onClick={() => handleBulkStatus('read')}
                  style={{
                    background: '#3B82F6',
                    color: '#ffffff',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: 16,
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.25)',
                  }}
                >
                  <IconMailOpened size={13} />
                  <span>পঠিত করুন</span>
                </button>

                {filterTab === 'spam' ? (
                  <button
                    type="button"
                    disabled={bulkLoading}
                    onClick={() => handleBulkSpam(false)}
                    style={{
                      background: '#10B981',
                      color: '#ffffff',
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: 16,
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <IconCheck size={13} />
                    <span>ইনবক্সে সরান</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={bulkLoading}
                    onClick={() => handleBulkSpam(true)}
                    style={{
                      background: '#F59E0B',
                      color: '#ffffff',
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: 16,
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(245, 158, 11, 0.25)',
                    }}
                  >
                    <IconAlertTriangle size={13} />
                    <span>স্প্যাম চিহ্নিত করুন</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={bulkLoading}
                  onClick={() => setShowBulkDeleteModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '5px 14px',
                    borderRadius: 16,
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(225, 29, 72, 0.25)',
                  }}
                >
                  <IconTrash size={13} />
                  <span>মুছে ফেলুন ({selectedIds.length})</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <TableSkeleton
            rowCount={6}
            columnWidths={['44px', '12%', '16%', '15%', '15%', '16%', '10%', '6%', '6%']}
            headers={['', 'ট্র্যাকিং CID', 'প্রেরক ও মোবাইল', 'ইমেইল ঠিকানা', 'নির্বাচিত বিভাগ', 'বার্তার সারসংক্ষেপ', 'স্ট্যাটাস', 'তারিখ', 'অ্যাকশন']}
          />
        ) : messages.length === 0 ? (
          <EmptyState
            hasFilters={Boolean(filterStatus !== 'all' || filterDept !== 'all' || dateFrom || dateTo || search)}
            searchQuery={search}
            onClearFilters={() => { setFilterStatus('all'); setFilterDept('all'); setDateFrom(''); setDateTo(''); setCurrentPage(1) }}
            onClearSearch={() => { setSearch(''); setCurrentPage(1) }}
            icon="✉️"
            title="কোনো কন্টাক্ট বার্তা পাওয়া যায়নি"
            description="কন্টাক্ট (/contact) পেইজ থেকে এখনো কোনো বার্তা জমা পড়েনি বা ফিল্টারের সাথে মেলেনি।"
          />
        ) : (
          <Table responsive hover className="admin-table align-middle" style={{ marginBottom: 0 }}>
            <thead>
              <tr>
                <th style={{ width: 44, textAlign: 'center', verticalAlign: 'middle', paddingLeft: 16 }}>
                  <TableCheckbox
                    checked={isAllSelected}
                    indeterminate={isSomeSelected && !isAllSelected}
                    onChange={toggleSelectAll}
                    title={isAllSelected ? 'সব নির্বাচন বাতিল করুন' : 'এই পৃষ্ঠার সব নির্বাচন করুন'}
                  />
                </th>
                <th style={{ whiteSpace: 'nowrap', verticalAlign: 'middle' }}>ট্র্যাকিং CID</th>
                <th style={{ whiteSpace: 'nowrap', verticalAlign: 'middle' }}>প্রেরক ও মোবাইল</th>
                <th style={{ whiteSpace: 'nowrap', verticalAlign: 'middle' }}>ইমেইল ঠিকানা</th>
                <th style={{ whiteSpace: 'nowrap', verticalAlign: 'middle' }}>নির্বাচিত বিভাগ</th>
                <th style={{ whiteSpace: 'nowrap', verticalAlign: 'middle' }}>বার্তার সারসংক্ষেপ</th>
                <th style={{ whiteSpace: 'nowrap', verticalAlign: 'middle' }}>স্ট্যাটাস</th>
                <th style={{ whiteSpace: 'nowrap', verticalAlign: 'middle' }}>তারিখ</th>
                <th style={{ textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {messages.map(msg => {
                const sc = STATUS_CONFIG[msg.status] || STATUS_CONFIG.unread
                const isUnread = msg.status === 'unread'
                const isSelected = selectedIds.includes(msg.id)
                return (
                  <tr
                    key={msg.id}
                    style={{
                      background: isSelected ? 'rgba(16, 185, 129, 0.08)' : (isUnread ? '#F0FDF435' : undefined),
                      verticalAlign: 'middle',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ width: 44, textAlign: 'center', verticalAlign: 'middle', paddingLeft: 16 }} onClick={e => e.stopPropagation()}>
                      <TableCheckbox
                        checked={isSelected}
                        onChange={() => toggleSelectOne(msg.id)}
                        title="নির্বাচন করুন"
                      />
                    </td>
                    <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <CompactUlid value={msg.token_id} style={{ fontWeight: 800, fontSize: 13, color: '#0F172A' }} />
                    </td>
                    <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {isUnread && <PulseLight size={6.5} title="নতুন / অপঠিত বার্তা" />}
                        <span style={{ fontWeight: isUnread ? 800 : 700, fontSize: 13.5, color: '#0F172A', lineHeight: 1.3 }}>
                          {msg.name}
                        </span>
                        {msg.is_verified && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            fontSize: 10.5,
                            fontWeight: 800,
                            color: '#065F46',
                            background: '#D1FAE5',
                            border: '1px solid #A7F3D0',
                            padding: '1px 6px',
                            borderRadius: 6
                          }}>
                            <IconCheck size={11} stroke={3} />
                            {msg.sender_type === 'doctor' ? 'ভেরিফায়েড ডাক্তার' : 'ভেরিফায়েড রোগী'}
                          </span>
                        )}
                        {msg.is_spam && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            fontSize: 10.5,
                            fontWeight: 800,
                            color: '#991B1B',
                            background: '#FEE2E2',
                            border: '1px solid #FECACA',
                            padding: '1px 6px',
                            borderRadius: 6
                          }}>
                            <IconAlertTriangle size={11} stroke={2.5} />
                            স্প্যাম
                          </span>
                        )}
                      </div>
                      {msg.phone && (
                        <div style={{
                          fontSize: 12,
                          color: '#059669',
                          fontWeight: 600,
                          marginTop: 2,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <IconPhone size={12} stroke={2} style={{ opacity: 0.85 }} />
                          <span>{msg.phone}</span>
                        </div>
                      )}
                    </td>
                    <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 12.5, color: '#334155', fontWeight: 600 }}>
                        {msg.email}
                      </span>
                    </td>
                    <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontSize: 12,
                          color: '#1E293B',
                          background: '#F1F5F9',
                          border: '1px solid #E2E8F0',
                          padding: '3px 10px',
                          borderRadius: 99,
                          fontWeight: 700,
                          whiteSpace: 'nowrap'
                        }}>
                          {msg.department || 'সাধারণ'}
                        </span>
                        {msg.extra_field && (
                          <span style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap' }} title={`রেফারেন্স: ${msg.extra_field}`}>
                            ({msg.extra_field})
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div
                        style={{
                          maxWidth: 240,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: 13,
                          color: '#475569'
                        }}
                        title={msg.message}
                      >
                        {msg.message}
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontSize: 12,
                          color: sc.color,
                          background: sc.bg,
                          border: `1px solid ${sc.border}`,
                          padding: '3px 10px',
                          borderRadius: 99,
                          fontWeight: 800,
                          whiteSpace: 'nowrap'
                        }}>
                          {sc.label}
                        </span>
                        {msg.admin_note && (
                          <span style={{ fontSize: 11, color: '#059669', fontWeight: 800, whiteSpace: 'nowrap' }} title="অ্যাডমিন নোট যুক্ত আছে">
                            ✓ নোট
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'middle', fontSize: 12.5, color: '#64748B', whiteSpace: 'nowrap' }}>
                      {formatDate(msg.created_at)}
                    </td>
                    <td style={{ verticalAlign: 'middle', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div className="admin-actions" style={{ justifyContent: 'center' }}>
                        <button
                          className="admin-action-btn admin-action-btn-view"
                          onClick={() => openMsgModal(msg)}
                          title="বার্তা দেখুন ও পরিচালনা করুন"
                        >
                          <img src="/icons/view.png" alt="View" />
                        </button>
                        <button
                          className="admin-action-btn"
                          onClick={() => handleToggleSpam(msg.id)}
                          title={msg.is_spam ? 'স্প্যাম থেকে ইনবক্সে ফিরিয়ে নিন' : 'স্প্যাম হিসেবে চিহ্নিত করুন'}
                          style={{
                            color: msg.is_spam ? '#059669' : '#EF4444',
                            background: msg.is_spam ? '#ECFDF5' : '#FEF2F2',
                            border: msg.is_spam ? '1px solid #A7F3D0' : '1px solid #FECACA',
                            borderRadius: 8,
                            padding: '4px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <IconAlertTriangle size={15} />
                        </button>
                        <button
                          className="admin-action-btn admin-action-btn-delete"
                          onClick={() => setDeleteId(msg.id)}
                          title="মুছে ফেলুন"
                        >
                          <img src="/icons/delete.png" alt="Delete" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </div>

      <TableFooter
        total={msgRes.total}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        perPage={perPage}
        setPerPage={setPerPage}
      />

      {/* View & Moderate Contact Message Modal */}
      <Modal
        show={!!viewMsg}
        onHide={() => { setViewMsg(null); setPendingStatus(null) }}
        centered
        scrollable
        size="lg"
        dialogClassName="contact-modal-dialog"
      >
        <Modal.Header closeButton style={{ borderBottom: '1px solid #E2E8F0', padding: '16px 24px', background: '#FAFAFA', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #00B875, #009E64)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
              <IconMail size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Modal.Title style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  কন্টাক্ট বার্তার বিবরণ ও পরিচালনা
                </Modal.Title>
                {viewMsg?.token_id && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ECFDF5', border: '1.5px solid #A7F3D0', borderRadius: 8, padding: '2px 8px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 12.5, color: '#065F46' }}>
                      {viewMsg.token_id}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCID(viewMsg.token_id)}
                      title="CID কপি করুন"
                      style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', color: copiedCID ? '#00B875' : '#64748B', display: 'flex', alignItems: 'center' }}
                    >
                      <IconCopy size={13} />
                    </button>
                    {copiedCID && <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>কপি হয়েছে!</span>}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                প্রেরণের তারিখ: {viewMsg ? formatDate(viewMsg.created_at) : '—'}
              </div>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body style={{ padding: '20px 24px', overflowY: 'auto' }}>
          {viewMsg && (() => {
            const currentSc = STATUS_CONFIG[viewMsg.status] || STATUS_CONFIG.unread
            const cleanPhone = String(viewMsg.phone || '').replace(/[^0-9+]/g, '')
            const waDigits = cleanPhone ? (cleanPhone.replace(/[^0-9]/g, '').startsWith('88') ? cleanPhone.replace(/[^0-9]/g, '') : `88${cleanPhone.replace(/[^0-9]/g, '')}`) : ''

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Profile & Context Overview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                  {/* Sender Details */}
                  <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                      প্রেরকের পরিচয় ও যোগাযোগ
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>
                        {viewMsg.name || 'অজ্ঞাত প্রেরক'}
                      </span>
                      {viewMsg.is_verified && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#065F46',
                          background: '#D1FAE5',
                          border: '1px solid #A7F3D0',
                          padding: '2px 8px',
                          borderRadius: 8
                        }}>
                          <IconCheck size={12} stroke={3} />
                          {viewMsg.sender_type === 'doctor' ? 'ভেরিফায়েড ডাক্তার' : 'ভেরিফায়েড রোগী'}
                        </span>
                      )}
                      {viewMsg.is_spam && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#991B1B',
                          background: '#FEE2E2',
                          border: '1px solid #FECACA',
                          padding: '2px 8px',
                          borderRadius: 8
                        }}>
                          <IconAlertTriangle size={12} stroke={2.5} />
                          স্প্যাম কোয়ারেন্টিন
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                      {viewMsg.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <IconPhone size={14} /> {viewMsg.phone}
                          </span>
                        </div>
                      )}
                      {viewMsg.email && (
                        <div style={{ color: '#475569', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <IconMail size={14} color="#64748B" /> {viewMsg.email}
                        </div>
                      )}
                    </div>
                    {/* Direct Contact Action Buttons */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      {cleanPhone && (
                        <a
                          href={`tel:${cleanPhone}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}
                        >
                          <IconPhone size={13} /> কল করুন
                        </a>
                      )}
                      {waDigits && (
                        <a
                          href={`https://wa.me/${waDigits}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, background: '#F0FDF4', color: '#16A34A', border: '1px solid #86EFAC', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}
                        >
                          <IconBrandWhatsapp size={14} /> WhatsApp
                        </a>
                      )}
                      {viewMsg.email && (
                        <a
                          href={`mailto:${viewMsg.email}?subject=${encodeURIComponent(`Re: ${viewMsg.department || 'Doctor Booklet কন্টাক্ট বার্তা'}`)}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}
                        >
                          <IconMail size={13} /> ইমেইল
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleSpam(viewMsg.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '5px 11px',
                          borderRadius: 8,
                          background: viewMsg.is_spam ? '#ECFDF5' : '#FEF2F2',
                          color: viewMsg.is_spam ? '#065F46' : '#991B1B',
                          border: viewMsg.is_spam ? '1px solid #A7F3D0' : '1px solid #FECACA',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        <IconAlertTriangle size={13} />
                        {viewMsg.is_spam ? 'ইনবক্সে ফিরিয়ে নিন' : 'স্প্যাম হিসেবে চিহ্নিত করুন'}
                      </button>
                    </div>
                  </div>

                  {/* Context & Status Card */}
                  <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                        বিভাগ ও সংশ্লিষ্ট রেফারেন্স
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: '#1E293B', background: 'white', border: '1px solid #CBD5E1', padding: '4px 12px', borderRadius: 99 }}>
                          {viewMsg.department || 'সাধারণ জিজ্ঞাসা'}
                        </span>
                        {viewMsg.extra_field && (
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '4px 10px', borderRadius: 8 }}>
                            রেফারেন্স: {viewMsg.extra_field}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Prominent Current Status Indicator */}
                    <div style={{ background: 'white', borderRadius: 10, padding: '10px 14px', border: '1px solid #E2E8F0', marginTop: 8 }}>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 4 }}>
                        বর্তমান স্ট্যাটাস (Current Status):
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px', borderRadius: 99, background: currentSc.bg, border: `1.5px solid ${currentSc.border || currentSc.color}`, color: currentSc.color, fontWeight: 900, fontSize: 13 }}>
                        {currentSc.icon}
                        <span>{currentSc.label}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message Body Card */}
                <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '16px 18px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IconMail size={15} color="#00B875" /> প্রেরকের সম্পূর্ণ বার্তা:
                  </div>
                  <div style={{ fontSize: 14, color: '#1E293B', lineHeight: 1.8, whiteSpace: 'pre-wrap', background: '#F8FAFC', padding: '14px 16px', borderRadius: 10, border: '1px solid #F1F5F9' }}>
                    {viewMsg.message || '—'}
                  </div>
                </div>

                {/* Status Management Section (Accidental Click Protected) */}
                <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <IconRefresh size={16} color="#00B875" /> স্ট্যাটাস পরিচালনা করুন
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                        স্ট্যাটাস পরিবর্তন করতে নিচের অপশনে ক্লিক করুন (ভুল ক্লিক রোধে নিশ্চিতকরণ চাওয়া হবে):
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                      const isCurrent = viewMsg.status === key
                      const isPending = pendingStatus === key
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            if (!isCurrent) setPendingStatus(key)
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 7,
                            border: `2px solid ${isCurrent ? cfg.color : isPending ? '#F59E0B' : '#E2E8F0'}`,
                            background: isCurrent ? cfg.bg : isPending ? '#FEF3C7' : 'white',
                            color: isCurrent ? cfg.color : isPending ? '#92400E' : '#475569',
                            borderRadius: 10,
                            padding: '8px 16px',
                            fontSize: 13,
                            fontWeight: 800,
                            cursor: isCurrent ? 'default' : 'pointer',
                            boxShadow: isCurrent ? `0 2px 8px ${cfg.color}25` : undefined,
                            transition: 'all 0.15s'
                          }}
                        >
                          {cfg.icon}
                          <span>{cfg.label}</span>
                          {isCurrent && (
                            <span style={{ fontSize: 10, background: cfg.color, color: 'white', padding: '1px 6px', borderRadius: 99, marginLeft: 4 }}>
                              বর্তমান
                            </span>
                          )}
                          {isPending && !isCurrent && (
                            <span style={{ fontSize: 10, background: '#F59E0B', color: 'white', padding: '1px 6px', borderRadius: 99, marginLeft: 4 }}>
                              সিলেক্টেড
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Accidental Click Confirmation Box */}
                  {pendingStatus && pendingStatus !== viewMsg.status && (
                    <div style={{
                      background: '#FFFBEB',
                      border: '1.5px solid #F59E0B',
                      borderRadius: 12,
                      padding: '12px 16px',
                      marginTop: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <IconAlertTriangle size={22} color="#D97706" style={{ flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 13, color: '#92400E' }}>
                            স্ট্যাটাস পরিবর্তনের নিশ্চিতকরণ
                          </div>
                          <div style={{ fontSize: 12, color: '#78350F', marginTop: 2 }}>
                            আপনি কি নিশ্চিত যে বর্তমান স্ট্যাটাস <b>"{STATUS_CONFIG[viewMsg.status]?.label}"</b> থেকে পরিবর্তন করে <b>"{STATUS_CONFIG[pendingStatus]?.label}"</b> করতে চান?
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setPendingStatus(null)}
                          disabled={updatingStatus}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 8,
                            border: '1px solid #D1D5DB',
                            background: 'white',
                            color: '#374151',
                            fontWeight: 700,
                            fontSize: 12.5,
                            cursor: 'pointer'
                          }}
                        >
                          বাতিল
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmStatusChange(pendingStatus)}
                          disabled={updatingStatus}
                          style={{
                            padding: '6px 16px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#00B875',
                            color: 'white',
                            fontWeight: 800,
                            fontSize: 12.5,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            boxShadow: '0 2px 6px rgba(0,184,117,0.3)'
                          }}
                        >
                          {updatingStatus ? <IconClock size={14} /> : <IconCheck size={14} />}
                          <span>{updatingStatus ? 'আপডেট হচ্ছে...' : 'হ্যাঁ, পরিবর্তন করুন'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Admin Note Section with Visual Status Feedback */}
                {(() => {
                  const isNoteChanged = (adminNote || '').trim() !== (viewMsg?.admin_note || '').trim()
                  return (
                    <div style={{
                      background: '#F0FDF4',
                      borderRadius: 14,
                      padding: '16px 18px',
                      border: isNoteChanged ? '1.5px solid #86EFAC' : '1px solid #BBF7D0',
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 900, color: '#065F46', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <IconFileText size={16} /> অ্যাডমিন ফলো-আপ নোট
                            {isNoteChanged && (
                              <span style={{ fontSize: 11, fontWeight: 800, color: '#B45309', background: '#FEF3C7', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: 99, marginLeft: 4 }}>
                                ● নতুন পরিবর্তন (সংরক্ষণ করুন)
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#047857', marginTop: 2 }}>
                            {isNoteChanged ? (
                              <span style={{ color: '#D97706', fontWeight: 700 }}>
                                আপনি নোটে নতুন কিছু লিখেছেন, সংরক্ষণ করতে ডানপাশের বাটনে চাপ দিন।
                              </span>
                            ) : viewMsg.admin_note ? (
                              <span style={{ fontWeight: 700, color: '#059669' }}>
                                ✓ এই বার্তার সাথে সংরক্ষিত নোট ডাটাবেজে বিদ্যমান (নতুন কিছু লিখলে সেভ বাটন সক্রিয় হবে)
                              </span>
                            ) : (
                              <span>এখনো কোনো নোট সংরক্ষণ করা হয়নি (নিচে লিখে সংরক্ষণ করুন)</span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveAdminNote}
                          disabled={savingNote || !isNoteChanged}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: isNoteChanged
                              ? 'linear-gradient(135deg, #00B875, #009E64)'
                              : '#E2E8F0',
                            color: isNoteChanged ? 'white' : '#64748B',
                            border: isNoteChanged ? 'none' : '1px solid #CBD5E1',
                            borderRadius: 8,
                            padding: '7px 15px',
                            fontSize: 12.5,
                            fontWeight: 800,
                            cursor: (savingNote || !isNoteChanged) ? 'not-allowed' : 'pointer',
                            opacity: savingNote ? 0.75 : 1,
                            boxShadow: isNoteChanged ? '0 3px 10px rgba(0,184,117,0.35)' : 'none',
                            transition: 'all 0.2s ease',
                            transform: isNoteChanged ? 'scale(1.02)' : 'scale(1)'
                          }}
                        >
                          {savingNote ? (
                            <>
                              <IconClock size={14} />
                              <span>সংরক্ষণ হচ্ছে...</span>
                            </>
                          ) : isNoteChanged ? (
                            <>
                              <IconDeviceFloppy size={14} />
                              <span>নোট সংরক্ষণ করুন</span>
                            </>
                          ) : (
                            <>
                              <IconCheck size={14} color="#059669" />
                              <span style={{ color: '#065F46' }}>নোট সংরক্ষিত আছে</span>
                            </>
                          )}
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        value={adminNote}
                        onChange={e => setAdminNote(e.target.value)}
                        placeholder="প্রেরকের সাথে কথা বলা হয়েছে কি না বা কী সমাধান দেওয়া হয়েছে তা এখানে নোট করে রাখুন..."
                        style={{
                          width: '100%',
                          borderRadius: 10,
                          border: isNoteChanged ? '1.5px solid #00B875' : '1px solid #86EFAC',
                          padding: '10px 14px',
                          fontSize: 13.5,
                          color: '#0F172A',
                          background: '#FFFFFF',
                          outline: 'none',
                          resize: 'vertical',
                          boxShadow: isNoteChanged ? '0 0 0 3px rgba(0, 184, 117, 0.12)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      />

                      {noteSavedNotice && (
                        <div style={{
                          marginTop: 10,
                          padding: '8px 14px',
                          borderRadius: 8,
                          background: '#D1FAE5',
                          border: '1px solid #6EE7B7',
                          color: '#065F46',
                          fontSize: 12.5,
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}>
                          <IconCheck size={16} color="#059669" />
                          <span>অ্যাডমিন নোট সফলভাবে ডাটাবেজে সংরক্ষিত ও আপডেট হয়েছে!</span>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )
          })()}
        </Modal.Body>

        <Modal.Footer style={{ borderTop: '1px solid #E2E8F0', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', background: '#FAFAFA', flexShrink: 0 }}>
          <Button
            variant="light"
            onClick={() => { setDeleteId(viewMsg?.id); setViewMsg(null); setPendingStatus(null) }}
            style={{ color: '#EF4444', fontWeight: 800, fontSize: 13, border: '1px solid #FEE2E2', background: '#FEF2F2' }}
          >
            <IconTrash size={15} style={{ marginRight: 6 }} /> বার্তা মুছুন
          </Button>
          <Button
            variant="secondary"
            onClick={() => { setViewMsg(null); setPendingStatus(null) }}
            style={{ fontWeight: 800, fontSize: 13, padding: '7px 18px' }}
          >
            বন্ধ করুন
          </Button>
        </Modal.Footer>
      </Modal>

      <DeleteModal
        show={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="বার্তা মুছে ফেলার নিশ্চিতকরণ"
        message="আপনি কি নিশ্চিত যে এই কন্টাক্ট বার্তাটি ডাটাবেজ থেকে মুছে ফেলতে চান?"
      />

      <DeleteModal
        show={showBulkDeleteModal}
        onCancel={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
        title="নির্বাচিত বার্তাগুলো মুছে ফেলার নিশ্চিতকরণ"
        message={`আপনি কি নিশ্চিত যে নির্বাচিত ${selectedIds.length} টি বার্তা ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।`}
      />

      <DeleteModal
        show={showPurgeSpamModal}
        onCancel={() => !purgeLoading && setShowPurgeSpamModal(false)}
        onConfirm={handlePurgeSpam}
        loading={purgeLoading}
        title="সকল স্প্যাম বার্তা মুছে ফেলার নিশ্চিতকরণ"
        message="আপনি কি নিশ্চিত যে সকল স্প্যাম বার্তা স্থায়ীভাবে মুছে ফেলতে চান? এটি ডাটাবেজ থেকে সকল স্প্যাম বার্তা চিরতরে মুছে দেবে এবং এই প্রক্রিয়াটি আর ফিরিয়ে আনা যাবে না।"
        confirmText="হ্যাঁ, সব মুছে ফেলুন"
        cancelText="বাতিল"
      />

      <style>{`
        .contact-modal-dialog {
          max-height: calc(100vh - 40px);
          margin: 20px auto;
        }
        .contact-modal-dialog .modal-content {
          max-height: calc(100vh - 40px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 16px;
        }
        .contact-modal-dialog .modal-header {
          flex-shrink: 0;
        }
        .contact-modal-dialog .modal-body {
          flex: 1 1 auto;
          overflow-y: auto;
          max-height: calc(100vh - 170px);
        }
        .contact-modal-dialog .modal-footer {
          flex-shrink: 0;
        }
      `}</style>
    </div>
  )
}

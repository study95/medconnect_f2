import React, { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Table, Modal, Button } from 'react-bootstrap'
import {
  IconTicket, IconSearch, IconRefresh, IconEye, IconTrash,
  IconCheck, IconClock, IconAlertTriangle, IconX, IconCopy,
  IconChecklist, IconPhone, IconMail, IconBrandWhatsapp, IconDeviceFloppy, IconFileText
} from '@tabler/icons-react'
import toast from 'react-hot-toast'
import axiosInstance from '../../../api/axiosInstance'
import { queryKeys } from '../../../lib/queryKeys'
import ListToolbar from '../../../components/admin/ListToolbar'
import DeleteModal from '../../../components/admin/DeleteModal'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'

const STATUS_CONFIG = {
  pending:    { label: 'অপেক্ষমাণ',      color: '#F59E0B', bg: '#FEF3C7', icon: <IconClock size={13} /> },
  processing: { label: 'প্রক্রিয়াধীন',   color: '#3B82F6', bg: '#DBEAFE', icon: <IconAlertTriangle size={13} /> },
  resolved:   { label: 'সমাধান হয়েছে',   color: '#10B981', bg: '#D1FAE5', icon: <IconCheck size={13} /> },
  closed:     { label: 'বন্ধ',            color: '#6B7280', bg: '#F3F4F6', icon: <IconX size={13} /> },
}

const PRIORITY_CONFIG = {
  'সাধারণ':       { color: '#6B7280', bg: '#F3F4F6' },
  'জরুরী':        { color: '#F59E0B', bg: '#FEF3C7' },
  'অত্যন্ত জরুরী': { color: '#EF4444', bg: '#FEE2E2' },
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: '18px 22px',
      border: '1px solid #E2E8F0',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      flex: 1,
      minWidth: 160,
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: 14,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

export default function ServiceListPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewTicket, setViewTicket] = useState(null)
  const [adminNote, setAdminNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [copied, setCopied] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(null)
  const [pendingStatus, setPendingStatus] = useState(null)
  const [noteSavedNotice, setNoteSavedNotice] = useState(false)

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
      setDateFrom(t)
      setDateTo(t)
    } else if (preset === 'yesterday') {
      const y = new Date(now)
      y.setDate(y.getDate() - 1)
      const yt = fmt(y)
      setDateFrom(yt)
      setDateTo(yt)
    } else if (preset === 'last7') {
      const past = new Date(now)
      past.setDate(past.getDate() - 6)
      setDateFrom(fmt(past))
      setDateTo(fmt(now))
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      setDateFrom(fmt(firstDay))
      setDateTo(fmt(now))
    } else if (preset === 'all') {
      setDateFrom('')
      setDateTo('')
    }
    setCurrentPage(1)
  }

  const openTicketModal = (ticket) => {
    setViewTicket(ticket)
    setAdminNote(ticket?.admin_note || '')
    setPendingStatus(null)
    setNoteSavedNotice(false)
    setCopied(null)
  }

  const {
    data: ticketRes = { data: [], total: 0, stats: { total: 0, pending: 0, processing: 0, resolved: 0, closed: 0 } },
    isLoading: loading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.services.list({ search, status: filterStatus, priority: filterPriority, category: filterCategory, dateFrom, dateTo, perPage, currentPage }),
    queryFn: async () => {
      const res = await axiosInstance.get('/admin/services', {
        params: {
          search: search || undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          priority: filterPriority !== 'all' ? filterPriority : undefined,
          category: filterCategory !== 'all' ? filterCategory : undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          per_page: perPage,
          page: currentPage
        }
      })

      if (res.data?.data) {
        return {
          data: res.data.data,
          total: res.data.total ?? (Array.isArray(res.data.data) ? res.data.data.length : 0),
          stats: res.data.stats || { total: 0, pending: 0, processing: 0, resolved: 0, closed: 0 }
        }
      } else if (Array.isArray(res.data)) {
        return {
          data: res.data,
          total: res.data.length,
          stats: {
            total: res.data.length,
            pending: res.data.filter(t => t.status === 'pending').length,
            processing: res.data.filter(t => t.status === 'processing').length,
            resolved: res.data.filter(t => t.status === 'resolved').length,
            closed: res.data.filter(t => t.status === 'closed').length,
          }
        }
      }
      return { data: [], total: 0, stats: { total: 0, pending: 0, processing: 0, resolved: 0, closed: 0 } }
    },
    staleTime: 60 * 1000,
  })

  const tickets = ticketRes.data
  const stats = ticketRes.stats

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await axiosInstance.delete(`/admin/services/${deleteId}`)
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all })
      setDeleteId(null)
      if (viewTicket?.id === deleteId) setViewTicket(null)
      toast.success('সাপোর্ট টিকিট সফলভাবে মুছে ফেলা হয়েছে')
    } catch {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all })
      setDeleteId(null)
      if (viewTicket?.id === deleteId) setViewTicket(null)
    }
  }

  const confirmStatusChange = async (newStatus) => {
    if (!viewTicket) return
    setUpdatingStatus(viewTicket.id)
    try {
      await axiosInstance.patch(`/admin/services/${viewTicket.id}/status`, {
        status: newStatus,
        admin_note: adminNote
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all })
      setViewTicket(prev => ({ ...prev, status: newStatus, admin_note: adminNote }))
      setPendingStatus(null)
      toast.success(`স্ট্যাটাস পরিবর্তন হয়ে "${STATUS_CONFIG[newStatus]?.label || newStatus}" হয়েছে!`, {
        icon: '✅',
        duration: 3500
      })
    } catch {
      toast.error('স্ট্যাটাস আপডেট করা সম্ভব হয়নি')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleSaveAdminNote = async () => {
    if (!viewTicket) return
    setSavingNote(true)
    try {
      await axiosInstance.patch(`/admin/services/${viewTicket.id}/status`, {
        status: viewTicket.status || 'pending',
        admin_note: adminNote
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all })
      setViewTicket(prev => ({ ...prev, admin_note: adminNote }))
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

  const handleCopy = (text, key) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatDate = (iso) => {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return String(iso)
    }
  }

  const btnBase = { height: 34, minWidth: 34, padding: '0 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#0f172a', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }
  const btnActive = { ...btnBase, border: 'none', background: 'linear-gradient(135deg, #00B875, #009E64)', color: '#fff', boxShadow: '0 2px 8px rgba(0,184,117,0.35)' }
  const btnDisabled = { ...btnBase, opacity: 0.4, cursor: 'not-allowed' }

  return (
    <div className="admin-page">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">সাপোর্ট টিকিট ও অভিযোগ ব্যবস্থাপনা</h2>
          <p className="admin-page-subtitle">ব্যবহারকারীদের প্রেরিত অভিযোগ ও সাপোর্ট রিকোয়েস্ট পরিচালনা করুন</p>
        </div>
        <button
          onClick={() => refetch()}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #00B875, #009E64)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,184,117,0.25)' }}
        >
          <IconRefresh size={17} /> রিফ্রেশ তালিকা
        </button>
      </div>

      {/* Dynamic Database Count Cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
        <StatCard label="মোট অভিযোগ / টিকিট" value={stats.total} icon={<IconTicket size={24} />} color="#00B875" />
        <StatCard label="অপেক্ষমাণ (Pending)" value={stats.pending} icon={<IconClock size={24} />} color="#F59E0B" />
        <StatCard label="প্রক্রিয়াধীন (Processing)" value={stats.processing} icon={<IconAlertTriangle size={24} />} color="#3B82F6" />
        <StatCard label="সমাধান সম্পন্ন (Resolved)" value={stats.resolved} icon={<IconCheck size={24} />} color="#10B981" />
      </div>

      <ListToolbar
        search={search}
        onSearchChange={val => { setSearch(val); setCurrentPage(1) }}
        searchPlaceholder="টিকিট নম্বর, নাম, ফোন বা ইমেইল খুঁজুন..."
        onRefresh={() => refetch()}
        refreshing={isFetching}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={Boolean(filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all' || dateFrom || dateTo)}
        onClearFilters={() => { setFilterStatus('all'); setFilterPriority('all'); setFilterCategory('all'); setDateFrom(''); setDateTo(''); setCurrentPage(1) }}
        activeFilters={[
          filterStatus !== 'all' && { key: 'status', label: `স্ট্যাটাস: ${STATUS_CONFIG[filterStatus]?.label || filterStatus}`, onRemove: () => { setFilterStatus('all'); setCurrentPage(1) } },
          filterPriority !== 'all' && { key: 'priority', label: `অগ্রাধিকার: ${filterPriority}`, onRemove: () => { setFilterPriority('all'); setCurrentPage(1) } },
          filterCategory !== 'all' && { key: 'category', label: `বিভাগ: ${filterCategory}`, onRemove: () => { setFilterCategory('all'); setCurrentPage(1) } },
          dateFrom && { key: 'date_from', label: `শুরুর তারিখ: ${dateFrom}`, onRemove: () => { setDateFrom(''); setCurrentPage(1) } },
          dateTo && { key: 'date_to', label: `শেষ তারিখ: ${dateTo}`, onRemove: () => { setDateTo(''); setCurrentPage(1) } },
        ].filter(Boolean)}
      >
        <div style={{ minWidth: 150 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>স্ট্যাটাস</label>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1) }} style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', cursor: 'pointer', background: 'white', fontWeight: 600, width: '100%' }}>
            <option value="all">সব স্ট্যাটাস</option>
            <option value="pending">অপেক্ষমাণ (Pending)</option>
            <option value="processing">প্রক্রিয়াধীন (Processing)</option>
            <option value="resolved">সমাধান হয়েছে (Resolved)</option>
            <option value="closed">বন্ধ (Closed)</option>
          </select>
        </div>
        <div style={{ minWidth: 150 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>অগ্রাধিকার</label>
          <select value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setCurrentPage(1) }} style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', cursor: 'pointer', background: 'white', fontWeight: 600, width: '100%' }}>
            <option value="all">সব অগ্রাধিকার</option>
            <option value="সাধারণ">সাধারণ</option>
            <option value="জরুরী">জরুরী</option>
            <option value="অত্যন্ত জরুরী">অত্যন্ত জরুরী</option>
          </select>
        </div>
        <div style={{ minWidth: 180 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>ক্যাটাগরি</label>
          <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1) }} style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', cursor: 'pointer', background: 'white', fontWeight: 600, width: '100%' }}>
            <option value="all">সব ক্যাটাগরি</option>
            <option value="অ্যাপয়েন্টমেন্ট সমস্যা">অ্যাপয়েন্টমেন্ট সমস্যা</option>
            <option value="পেমেন্ট ও রিফান্ড">পেমেন্ট ও রিফান্ড</option>
            <option value="ভিডিও কল সমস্যা">ভিডিও কল সমস্যা</option>
            <option value="ডাক্তার সম্পর্কিত তথ্য">ডাক্তার সম্পর্কিত তথ্য</option>
            <option value="অন্যান্য জিজ্ঞাসা">অন্যান্য জিজ্ঞাসা</option>
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
        {loading ? (
          <TableSkeleton
            rowCount={6}
            columnWidths={['120px', '22%', '20%', '16%', '12%', '10%']}
            headers={['টিকিট নম্বর', 'প্রেরক ও যোগাযোগ', 'বিষয় ও বিভাগ', 'অগ্রাধিকার', 'স্ট্যাটাস', 'তারিখ', 'অ্যাকশন']}
          />
        ) : tickets.length === 0 ? (
          <EmptyState
            hasFilters={Boolean(filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all' || dateFrom || dateTo || search)}
            searchQuery={search}
            onClearFilters={() => { setFilterStatus('all'); setFilterPriority('all'); setFilterCategory('all'); setDateFrom(''); setDateTo(''); setCurrentPage(1) }}
            onClearSearch={() => { setSearch(''); setCurrentPage(1) }}
            icon="🎫"
            title="কোনো সাপোর্ট টিকিট পাওয়া যায়নি"
            description="আপনার সার্চ বা ফিল্টারের সাথে মিলে এমন কোনো টিকিট ডাটাবেজে নেই।"
          />
        ) : (
          <Table responsive hover className="admin-table align-middle" style={{ marginBottom: 0 }}>
            <thead>
              <tr>
                <th style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>টিকিট নম্বর</th>
                <th style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>প্রেরক ও যোগাযোগ</th>
                <th style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>অভিযোগের বিষয়</th>
                <th style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>ক্যাটাগরি</th>
                <th style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>অগ্রাধিকার</th>
                <th style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>বর্তমান স্ট্যাটাস</th>
                <th style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>তারিখ</th>
                <th style={{ textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => {
                const sc = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.pending
                const pc = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG['সাধারণ']
                const ticketNum = ticket.ticket_number || `TK-${ticket.id}`
                return (
                  <tr key={ticket.id} style={{ verticalAlign: 'middle' }}>
                    <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <CompactUlid value={ticketNum} />
                    </td>
                    <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 800, fontSize: 13.5, color: '#1E293B', lineHeight: 1.3 }}>{ticket.name}</div>
                      <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <IconPhone size={12} stroke={2} style={{ opacity: 0.85 }} />
                        <span>{ticket.contact}</span>
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, color: '#334155', fontWeight: 600 }} title={ticket.subject}>
                        {ticket.subject}
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 12, color: '#334155', background: '#F1F5F9', padding: '3px 10px', borderRadius: 99, fontWeight: 700, border: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                        {ticket.category || 'সাধারণ'}
                      </span>
                    </td>
                    <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 12, color: pc.color, background: pc.bg, padding: '3px 10px', borderRadius: 99, fontWeight: 800, whiteSpace: 'nowrap' }}>
                        {ticket.priority || 'সাধারণ'}
                      </span>
                    </td>
                    <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 12, color: sc.color, background: sc.bg, border: `1px solid ${sc.border || sc.color + '40'}`, padding: '3px 10px', borderRadius: 99, fontWeight: 800, whiteSpace: 'nowrap' }}>
                          {sc.label}
                        </span>
                        {ticket.admin_note && (
                          <span style={{ fontSize: 11, color: '#059669', fontWeight: 800, whiteSpace: 'nowrap' }} title="অ্যাডমিন নোট যুক্ত আছে">
                            ✓ নোট
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'middle', fontSize: 12.5, color: '#64748B', whiteSpace: 'nowrap' }}>
                      {formatDate(ticket.created_at)}
                    </td>
                    <td style={{ verticalAlign: 'middle', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div className="admin-actions" style={{ justifyContent: 'center' }}>
                        <button
                          className="admin-action-btn admin-action-btn-view"
                          onClick={() => openTicketModal(ticket)}
                          title="বিস্তারিত ও পরিচালনা"
                        >
                          <img src="/icons/view.png" alt="View" />
                        </button>
                        <button
                          className="admin-action-btn admin-action-btn-delete"
                          onClick={() => setDeleteId(ticket.id)}
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
        total={ticketRes.total ?? tickets.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        perPage={perPage}
        setPerPage={setPerPage}
      />

      {/* View Ticket Details Modal */}
      <Modal show={!!viewTicket} onHide={() => { setViewTicket(null); setPendingStatus(null) }} centered size="lg">
        <Modal.Header closeButton style={{ borderBottom: '1px solid #E2E8F0', padding: '16px 24px', background: '#FAFAFA' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #00B875, #009E64)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
              <IconTicket size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Modal.Title style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  অভিযোগ ও টিকিটের বিস্তারিত বিবরণ
                </Modal.Title>
                {viewTicket && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ECFDF5', border: '1.5px solid #A7F3D0', borderRadius: 8, padding: '2px 8px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 12.5, color: '#065F46' }}>
                      {viewTicket.ticket_number || `TK-${viewTicket.id}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(viewTicket.ticket_number || `TK-${viewTicket.id}`, 'modal')}
                      title="টিকিট নম্বর কপি করুন"
                      style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', color: copied === 'modal' ? '#00B875' : '#64748B', display: 'flex', alignItems: 'center' }}
                    >
                      <IconCopy size={13} />
                    </button>
                    {copied === 'modal' && <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>কপি হয়েছে!</span>}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                জমার তারিখ: {viewTicket ? formatDate(viewTicket.created_at || viewTicket.submitted_at) : '—'}
              </div>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body style={{ padding: '22px 24px', maxHeight: '78vh', overflowY: 'auto' }}>
          {viewTicket && (() => {
            const currentSc = STATUS_CONFIG[viewTicket.status] || STATUS_CONFIG.pending
            const currentPc = PRIORITY_CONFIG[viewTicket.priority] || PRIORITY_CONFIG['সাধারণ']
            const rawContact = String(viewTicket.contact || '')
            const rawMsg = String(viewTicket.message || '')
            const emailMatch = rawContact.match(/[^\s|[\]]+@[^\s|[\]]+\.[^\s|[\]]+/) || rawMsg.match(/[^\s|[\]]+@[^\s|[\]]+\.[^\s|[\]]+/)
            const phoneMatch = rawContact.match(/(?:\+?88)?01[3-9]\d{8}/) || rawMsg.match(/(?:\+?88)?01[3-9]\d{8}/)
            const senderEmail = emailMatch ? emailMatch[0] : (rawContact.includes('@') ? rawContact : '')
            const senderPhone = phoneMatch ? phoneMatch[0] : (!rawContact.includes('@') ? rawContact.replace(/[^0-9+]/g, '') : '')
            const waDigits = senderPhone ? (senderPhone.replace(/[^0-9]/g, '').startsWith('88') ? senderPhone.replace(/[^0-9]/g, '') : `88${senderPhone.replace(/[^0-9]/g, '')}`) : ''

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Profile & Context Overview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                  {/* Sender Details */}
                  <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                      প্রেরকের পরিচয় ও যোগাযোগ
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', marginBottom: 6 }}>
                      {viewTicket.name || 'অজ্ঞাত ব্যবহারকারী'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                      {senderPhone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <IconPhone size={14} /> {senderPhone}
                          </span>
                        </div>
                      )}
                      {senderEmail && (
                        <div style={{ color: '#475569', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <IconMail size={14} color="#64748B" /> {senderEmail}
                        </div>
                      )}
                    </div>
                    {/* Direct Contact Action Buttons */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      {senderPhone && (
                        <a
                          href={`tel:${senderPhone}`}
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
                      {senderEmail && (
                        <a
                          href={`mailto:${senderEmail}?subject=${encodeURIComponent(`Re: ${viewTicket.subject || 'Doctor Booklet সাপোর্ট টিকিট'}`)}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}
                        >
                          <IconMail size={13} /> ইমেইল
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Context & Status Card */}
                  <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                        ক্যাটাগরি ও অগ্রাধিকার মাত্রা
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: '#1E293B', background: 'white', border: '1px solid #CBD5E1', padding: '4px 12px', borderRadius: 99 }}>
                          {viewTicket.category || 'সাধারণ'}
                        </span>
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: currentPc.color, background: currentPc.bg, padding: '4px 12px', borderRadius: 99 }}>
                          অগ্রাধিকার: {viewTicket.priority || 'সাধারণ'}
                        </span>
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

                {/* Subject & Message Content Card */}
                <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '16px 18px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IconTicket size={16} color="#00B875" /> {viewTicket.subject}
                  </div>
                  <div style={{ fontSize: 14, color: '#1E293B', lineHeight: 1.8, whiteSpace: 'pre-wrap', background: '#F8FAFC', padding: '14px 16px', borderRadius: 10, border: '1px solid #F1F5F9' }}>
                    {viewTicket.message || '—'}
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
                      const isCurrent = viewTicket.status === key
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
                  {pendingStatus && pendingStatus !== viewTicket.status && (
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
                            আপনি কি নিশ্চিত যে বর্তমান স্ট্যাটাস <b>"{STATUS_CONFIG[viewTicket.status]?.label}"</b> থেকে পরিবর্তন করে <b>"{STATUS_CONFIG[pendingStatus]?.label}"</b> করতে চান?
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setPendingStatus(null)}
                          disabled={!!updatingStatus}
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
                          disabled={!!updatingStatus}
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

                {/* Admin Note / Moderation Reply Box with Clear Confirmation */}
                {(() => {
                  const isNoteChanged = (adminNote || '').trim() !== (viewTicket?.admin_note || '').trim()
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
                            <IconFileText size={16} /> অ্যাডমিন নোট ও সমাধানের উত্তর
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
                            ) : viewTicket.admin_note ? (
                              <span style={{ fontWeight: 700, color: '#059669' }}>
                                ✓ এই টিকিটে সংরক্ষিত উত্তর রয়েছে (নতুন কিছু লিখলে সেভ বাটন সক্রিয় হবে)
                              </span>
                            ) : (
                              <span>এখনো কোনো নোট বা সমাধানের উত্তর যুক্ত করা হয়নি (নিচে লিখে সংরক্ষণ করুন)</span>
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
                        placeholder="ব্যবহারকারীর বার্তার প্রেক্ষিতে আপনার সিদ্ধান্ত, সমাধান বা নির্দেশনা এখানে লিখুন (ট্র্যাকিং পেজে ব্যবহারকারী দেখতে পাবেন)..."
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
                          <span>অ্যাডমিন নোট ও উত্তর সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে!</span>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )
          })()}
        </Modal.Body>

        <Modal.Footer style={{ borderTop: '1px solid #E2E8F0', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', background: '#FAFAFA' }}>
          <Button
            variant="light"
            onClick={() => { setDeleteId(viewTicket?.id); setViewTicket(null); setPendingStatus(null) }}
            style={{ color: '#EF4444', fontWeight: 800, fontSize: 13, border: '1px solid #FEE2E2', background: '#FEF2F2' }}
          >
            <IconTrash size={15} style={{ marginRight: 6 }} /> অভিযোগ মুছুন
          </Button>
          <Button
            variant="secondary"
            onClick={() => { setViewTicket(null); setPendingStatus(null) }}
            style={{ fontWeight: 800, fontSize: 13, padding: '7px 18px' }}
          >
            বন্ধ করুন
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal using unified DeleteModal */}
      <DeleteModal
        show={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="অভিযোগ মুছে ফেলার নিশ্চিতকরণ"
        message="আপনি কি নিশ্চিত যে এই সাপোর্ট টিকিট/অভিযোগটি ডাটাবেজ থেকে মুছে ফেলতে চান? এই কাজটি পুনরায় ফিরিয়ে আনা যাবে না।"
      />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

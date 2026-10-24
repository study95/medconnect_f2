import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../context/AuthContext'
import { getPayments, updatePayment } from '../../../api/adminApi'
import { queryKeys } from '../../../lib/queryKeys'
import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'
import MoneyReceiptModal from '../../../components/admin/MoneyReceiptModal'
import {
  FileText, CheckCircle2, Clock, Banknote, Smartphone,
  RotateCcw, Printer, Check, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

const PAYMENT_METHODS = [
  { id: 'all', label: 'All Methods' },
  { id: 'cash', label: 'Cash (চেম্বার ক্যাশ)' },
  { id: 'bkash', label: 'bKash (বিকাশ)' },
  { id: 'nagad', label: 'Nagad (নগদ)' },
  { id: 'rocket', label: 'Rocket (রকেট)' },
  { id: 'card', label: 'Debit/Credit Card' },
  { id: 'online', label: 'Online Gateway' },
  { id: 'bank_transfer', label: 'Bank Transfer' },
]

const PAYMENT_STATUSES = [
  { id: 'all', label: 'All Statuses' },
  { id: 'paid', label: 'PAID (পরিশোধিত)' },
  { id: 'unpaid', label: 'UNPAID (বকেয়া)' },
  { id: 'refunded', label: 'REFUNDED (রিফান্ডকৃত)' },
]

export default function PaymentListPage() {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()

  // Filters State
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Receipt Modal State
  const [receiptPayment, setReceiptPayment] = useState(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)

  const queryParams = useMemo(() => {
    const params = { page: currentPage, per_page: perPage }
    if (methodFilter !== 'all') params.payment_method = methodFilter
    if (statusFilter !== 'all') params.payment_status = statusFilter
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    if (search.trim()) params.search = search.trim()
    return params
  }, [methodFilter, statusFilter, dateFrom, dateTo, currentPage, perPage, search])

  const {
    data: paymentsResponse = { data: [], meta: null },
    isLoading: loading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.payments.adminList(queryParams),
    queryFn: async () => {
      const res = await getPayments(queryParams)
      const raw = res.data?.data || res.data || {}
      // Support both paginated (has .data array + meta) and flat array responses
      if (Array.isArray(raw)) return { data: raw, meta: null }
      return {
        data: raw.data || [],
        meta: raw.meta || (raw.last_page ? { current_page: raw.current_page, last_page: raw.last_page, per_page: raw.per_page, total: raw.total } : null),
      }
    },
    staleTime: 60 * 1000,
  })

  const payments = paymentsResponse.data
  const serverMeta = paymentsResponse.meta

  // Client-side text search removed — search is now server-side
  const filtered = payments // server already filtered by search

  useEffect(() => {
    setCurrentPage(1)
  }, [methodFilter, statusFilter, dateFrom, dateTo, search, perPage])

  const paginatedData = filtered // server already paginated

  const totalPages = serverMeta ? serverMeta.last_page : Math.ceil(filtered.length / perPage)
  const totalCount = serverMeta ? serverMeta.total : filtered.length

  // Financial Stats Calculation
  const stats = useMemo(() => {
    let totalAmt = 0
    let paidAmt = 0
    let paidCnt = 0
    let unpaidAmt = 0
    let unpaidCnt = 0
    let cashAmt = 0
    let cashCnt = 0
    let onlineAmt = 0
    let onlineCnt = 0
    let refundedAmt = 0
    let refundedCnt = 0

    filtered.forEach(p => {
      const amt = Number(p.fee || p.amount || p.total_amount || 0)
      totalAmt += amt

      const pStatus = (p.payment_status || '').toLowerCase()
      const isPaid = pStatus === 'paid' || (p.status || '').toLowerCase() === 'completed'
      const isRefunded = pStatus === 'refunded'

      if (isRefunded) {
        refundedAmt += amt
        refundedCnt += 1
      } else if (isPaid) {
        paidAmt += amt
        paidCnt += 1
      } else {
        unpaidAmt += amt
        unpaidCnt += 1
      }

      const pMethod = (p.payment_method || 'cash').toLowerCase()
      if (pMethod === 'cash' || pMethod === 'cash on') {
        cashAmt += amt
        cashCnt += 1
      } else {
        onlineAmt += amt
        onlineCnt += 1
      }
    })

    return {
      totalAmount: totalAmt,
      totalCount: filtered.length,
      paidAmount: paidAmt,
      paidCount: paidCnt,
      unpaidAmount: unpaidAmt,
      unpaidCount: unpaidCnt,
      cashAmount: cashAmt,
      cashCount: cashCnt,
      onlineAmount: onlineAmt,
      onlineCount: onlineCnt,
      refundedAmount: refundedAmt,
      refundedCount: refundedCnt,
    }
  }, [filtered])

  // Collect Cash & Mark as Paid (with immediate receipt opening)
  const handleCollectCash = async (pay) => {
    setUpdatingId(pay.id)
    try {
      await updatePayment(pay.id, {
        payment_status: 'Paid',
        payment_method: 'Cash',
      })
      toast.success(`পেমেন্ট সফলভাবে আদায় করা হয়েছে (৳${pay.fee || pay.amount || 0})`)
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all })
      // Auto open money receipt for receptionist / user
      setReceiptPayment({ ...pay, payment_status: 'Paid', payment_method: 'Cash' })
      setShowReceiptModal(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'পেমেন্ট স্ট্যাটাস আপডেট করা সম্ভব হয়নি।')
    } finally {
      setUpdatingId(null)
    }
  }

  // Update Status manually (Paid, Unpaid, Refunded)
  const handleStatusChange = async (pay, newStatus) => {
    setUpdatingId(pay.id)
    try {
      await updatePayment(pay.id, { payment_status: newStatus })
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all })
      toast.success(`পেমেন্ট স্ট্যাটাস '${newStatus.toUpperCase()}' করা হয়েছে`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'পেমেন্ট স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleOpenReceipt = (pay) => {
    setReceiptPayment(pay)
    setShowReceiptModal(true)
  }

  const clearFilters = () => {
    setSearch('')
    setMethodFilter('all')
    setStatusFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  // Interactive KPI Cards Definition
  const kpiCards = [
    {
      id: 'total',
      title: 'মোট ট্রানজেকশন',
      count: `৳${stats.totalAmount.toLocaleString()}`,
      sub: `${stats.totalCount} টি`,
      icon: <FileText size={16} />,
      color: '#3B82F6',
      bgLight: 'rgba(59, 130, 246, 0.1)',
      isActive: statusFilter === 'all' && methodFilter === 'all',
      onClick: () => { setStatusFilter('all'); setMethodFilter('all') },
    },
    {
      id: 'paid',
      title: 'আদায়কৃত ফি',
      count: `৳${stats.paidAmount.toLocaleString()}`,
      sub: `${stats.paidCount} টি পরিশোধিত`,
      icon: <CheckCircle2 size={16} />,
      color: '#00B875',
      bgLight: 'rgba(0, 184, 117, 0.12)',
      isActive: statusFilter === 'paid',
      onClick: () => { setStatusFilter(statusFilter === 'paid' ? 'all' : 'paid'); setMethodFilter('all') },
    },
    {
      id: 'unpaid',
      title: 'বকেয়া / চেম্বারে প্রদেয়',
      count: `৳${stats.unpaidAmount.toLocaleString()}`,
      sub: `${stats.unpaidCount} টি বকেয়া`,
      icon: <Clock size={16} />,
      color: '#F59E0B',
      bgLight: 'rgba(245, 158, 11, 0.12)',
      isActive: statusFilter === 'unpaid',
      onClick: () => { setStatusFilter(statusFilter === 'unpaid' ? 'all' : 'unpaid'); setMethodFilter('all') },
    },
    {
      id: 'cash',
      title: 'কাউন্টার ক্যাশ',
      count: `৳${stats.cashAmount.toLocaleString()}`,
      sub: `${stats.cashCount} টি ক্যাশ`,
      icon: <Banknote size={16} />,
      color: '#0D9488',
      bgLight: 'rgba(13, 148, 136, 0.12)',
      isActive: methodFilter === 'cash',
      onClick: () => { setMethodFilter(methodFilter === 'cash' ? 'all' : 'cash'); setStatusFilter('all') },
    },
    {
      id: 'online',
      title: 'ডিজিটাল / অনলাইন',
      count: `৳${stats.onlineAmount.toLocaleString()}`,
      sub: `${stats.onlineCount} টি ডিজিটাল`,
      icon: <Smartphone size={16} />,
      color: '#6366F1',
      bgLight: 'rgba(99, 102, 241, 0.12)',
      isActive: methodFilter === 'online' || methodFilter === 'bkash',
      onClick: () => { setMethodFilter(methodFilter === 'online' ? 'all' : 'online'); setStatusFilter('all') },
    },
    {
      id: 'refunded',
      title: 'রিফান্ডকৃত ফি',
      count: `৳${stats.refundedAmount.toLocaleString()}`,
      sub: `${stats.refundedCount} টি রিফান্ড`,
      icon: <RotateCcw size={16} />,
      color: '#8B5CF6',
      bgLight: 'rgba(139, 92, 246, 0.12)',
      isActive: statusFilter === 'refunded',
      onClick: () => { setStatusFilter(statusFilter === 'refunded' ? 'all' : 'refunded'); setMethodFilter('all') },
    },
  ]

  return (
    <div className="admin-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>💳</span>
            Patient Payments & Money Receipts
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>
            Appointment consultation fees, counter cash collection logs, and printable money receipts
          </p>
        </div>
      </div>

      {/* Compact Single-Row Financial KPI Badges */}
      <div className="payments-kpi-grid">
        {kpiCards.map((card) => (
          <div
            key={card.id}
            onClick={card.onClick}
            className={`payments-kpi-card ${card.isActive ? 'active' : ''}`}
            style={{
              '--kpi-color': card.color,
              '--kpi-bg': card.bgLight,
            }}
            title={`${card.title}: ${card.count} (${card.sub}) - ফিল্টার করতে ক্লিক করুন`}
          >
            <div className="payments-kpi-icon" style={{ background: card.bgLight, color: card.color }}>
              {card.icon}
            </div>
            <div className="payments-kpi-content">
              <span className="payments-kpi-title">{card.title}</span>
              <div className="payments-kpi-value">{card.count}</div>
            </div>
            {card.isActive && (
              <span className="payments-kpi-active-badge">✓</span>
            )}
          </div>
        ))}
      </div>

      {/* Toolbar with instant auto-filters */}
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by patient, phone, doctor, hospital, serial, transaction..."
        onRefresh={() => refetch()}
        refreshing={isFetching}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={Boolean(methodFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo)}
        onClearFilters={clearFilters}
        activeFilters={[
          methodFilter !== 'all' && { key: 'method', label: `Method: ${methodFilter.toUpperCase()}`, onRemove: () => setMethodFilter('all') },
          statusFilter !== 'all' && { key: 'status', label: `Status: ${statusFilter.toUpperCase()}`, onRemove: () => setStatusFilter('all') },
          dateFrom && { key: 'dateFrom', label: `From: ${dateFrom}`, onRemove: () => setDateFrom('') },
          dateTo && { key: 'dateTo', label: `To: ${dateTo}`, onRemove: () => setDateTo('') },
        ].filter(Boolean)}
      >
        <div style={{ minWidth: 160 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Payment Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }}>
            {PAYMENT_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 160 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Payment Method</label>
          <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }}>
            {PAYMENT_METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 140 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Date From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }} />
        </div>
        <div style={{ minWidth: 140 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Date To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }} />
        </div>
      </ListToolbar>

      {/* Table Card */}
      <div className="admin-card">
        <div
          className="admin-card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '14px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 className="admin-card-title" style={{ margin: 0 }}>Transaction & Billing Ledger</h3>
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--admin-text-muted, #64748B)',
              background: 'var(--admin-bg, #F8FAFC)',
              padding: '4px 10px',
              borderRadius: 8,
              border: '1px solid var(--admin-border, #E2E8F0)',
            }}
          >
            <strong style={{ color: 'var(--admin-text, #0F172A)' }}>{totalCount}</strong> Records Found
          </div>
        </div>

        {loading ? (
          <TableSkeleton rowCount={8} columnWidths={['120px', '24%', '22%', '14%', '12%', '12%', '16%']} headers={['Transaction', 'Patient Details', 'Doctor / Service', 'Amount', 'Method', 'Status', 'Actions']} />
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={Boolean(methodFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo || search)} searchQuery={search} onClearFilters={clearFilters} onClearSearch={() => setSearch('')} icon="💳" title="No payment records found" description="No transactions match your search or filter settings." />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Patient Details</th>
                  <th>Doctor / Service</th>
                  <th>Consultation Fee</th>
                  <th>Method</th>
                  <th>Payment Status</th>
                  <th style={{ textAlign: 'center' }}>মানি রিসিট (Receipt)</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(pay => {
                  const pStatus = (pay.payment_status || '').toLowerCase()
                  const isCancelled = pay.status?.toLowerCase() === 'cancelled' || pay.status?.toLowerCase() === 'rejected'
                  const isPaid = pStatus === 'paid' || pay.status?.toLowerCase() === 'completed'
                  const isRefunded = pStatus === 'refunded'

                  return (
                    <tr key={pay.id} style={{ transition: 'background 0.15s' }}>
                      {/* Transaction ID */}
                      <td>
                        <CompactUlid value={pay.transaction_id || `TXN-${pay.id}`} />
                        <div style={{ fontSize: 10, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                          {pay.appointment_date ? new Date(pay.appointment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                          {pay.serial_number ? ` • #${pay.serial_number}` : ''}
                        </div>
                      </td>

                      {/* Patient Details */}
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>
                          {pay.patient?.name || pay.user_name || pay.patient_name || 'Patient'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                          📞 {pay.patient?.phone || pay.user_phone || pay.patient_phone || '—'}
                          {pay.patient?.age || pay.patient_age ? ` • ${pay.patient?.age || pay.patient_age}y` : ''}
                        </div>
                      </td>

                      {/* Doctor / Service */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--admin-text)' }}>
                          {pay.doctor?.name || pay.doctor_name || 'Medical Specialist'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                          📍 {pay.hospital?.name || pay.hospital_name || pay.chamber?.name || 'Chamber Consultation'}
                        </div>
                      </td>

                      {/* Consultation Fee */}
                      <td>
                        <span style={{ fontWeight: 800, color: '#00A88C', fontSize: 14 }}>
                          ৳{Number(pay.fee || pay.amount || pay.total_amount || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Method */}
                      <td>
                        <span style={{ textTransform: 'uppercase', fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'var(--admin-bg, #F1F5F9)', color: 'var(--admin-text, #475569)', border: '1px solid var(--admin-border, #E2E8F0)' }}>
                          {pay.payment_method || 'CASH'}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        {isCancelled ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 10.5,
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: 6,
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#DC2626',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                            }}
                          >
                            ✕ CANCELLED
                          </span>
                        ) : isRefunded ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 10.5,
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: 6,
                              background: 'rgba(147, 51, 234, 0.12)',
                              color: '#7C3AED',
                              border: '1px solid rgba(147, 51, 234, 0.25)',
                            }}
                          >
                            ↩ REFUNDED
                          </span>
                        ) : isPaid ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 10.5,
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: 6,
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#059669',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                            }}
                          >
                            ✓ PAID
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 10.5,
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: 6,
                              background: 'rgba(245, 158, 11, 0.12)',
                              color: '#D97706',
                              border: '1px solid rgba(245, 158, 11, 0.25)',
                            }}
                          >
                            ⏳ UNPAID
                          </span>
                        )}
                      </td>

                      {/* Receipt Action Only */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenReceipt(pay)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '6px 14px',
                            borderRadius: 8,
                            border: '1.5px solid #0284C7',
                            background: 'rgba(2, 132, 199, 0.08)',
                            color: '#0284C7',
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(2, 132, 199, 0.1)',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#0284C7'
                            e.currentTarget.style.color = '#FFFFFF'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(2, 132, 199, 0.08)'
                            e.currentTarget.style.color = '#0284C7'
                          }}
                          title="মানি রিসিট ও ভাউচার দেখুন / প্রিন্ট করুন"
                        >
                          <Printer size={14} />
                          <span>রিসিট</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TableFooter
        total={serverMeta ? serverMeta.total : filtered.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        perPage={perPage}
        setPerPage={setPerPage}
        totalPages={totalPages}
      />

      {/* Money Receipt Modal */}
      <MoneyReceiptModal
        show={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        payment={receiptPayment}
      />

      {/* Compact Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Compact Single-Row Payments KPI Grid */
        .payments-kpi-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 16px;
        }

        @media (max-width: 1080px) {
          .payments-kpi-grid {
            display: flex;
            overflow-x: auto;
            flex-wrap: nowrap;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 6px;
            gap: 8px;
            scrollbar-width: thin;
          }
          .payments-kpi-grid::-webkit-scrollbar {
            height: 4px;
          }
          .payments-kpi-grid::-webkit-scrollbar-thumb {
            background: var(--admin-border, #CBD5E1);
            border-radius: 4px;
          }
        }

        .payments-kpi-card {
          background: var(--admin-card-bg, #FFFFFF);
          border: 1.5px solid var(--admin-border, #E2E8F0);
          border-radius: 10px;
          padding: 8px 10px;
          cursor: pointer;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 9px;
          position: relative;
          user-select: none;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
          min-height: 48px;
          min-width: 0;
        }

        @media (max-width: 1080px) {
          .payments-kpi-card {
            flex: 0 0 148px;
            scroll-snap-align: start;
          }
        }

        .payments-kpi-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          border-color: var(--kpi-color);
        }

        .payments-kpi-card.active {
          border-color: var(--kpi-color);
          background: var(--kpi-bg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .payments-kpi-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .payments-kpi-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          transition: padding-right 0.15s ease;
        }

        .payments-kpi-card.active .payments-kpi-content {
          padding-right: 12px;
        }

        .payments-kpi-title {
          font-size: 11px;
          font-weight: 700;
          color: var(--admin-text-muted, #64748B);
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .payments-kpi-card.active .payments-kpi-title {
          color: var(--admin-text, #0F172A);
        }

        .payments-kpi-value {
          font-size: 16px;
          font-weight: 800;
          line-height: 1.15;
          color: var(--admin-text, #0F172A);
          letter-spacing: -0.01em;
        }

        .payments-kpi-card.active .payments-kpi-value {
          color: var(--kpi-color);
        }

        .payments-kpi-active-badge {
          position: absolute;
          top: 3px;
          right: 4px;
          width: 14px;
          height: 14px;
          border-radius: 99px;
          background: var(--kpi-color);
          color: #FFFFFF;
          font-size: 9px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
      `}} />
    </div>
  )
}

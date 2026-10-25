import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  FileText, Calendar, Filter, RotateCcw, CheckCircle2,
  Clock, CreditCard, Search, ArrowUpRight, Printer,
  Building2, ShieldCheck, Sparkles, AlertCircle
} from 'lucide-react'
import { getHospitalCommissionReport, getHospitalCommissionRequests } from '../../../api/adminApi'
import { queryKeys } from '../../../lib/queryKeys'
import CommissionMemo from './CommissionMemo'
import CommissionPayModal from './CommissionPayModal'
import PayoutRequestModal from './PayoutRequestModal'
import CommissionPaymentHistoryTab from './CommissionPaymentHistoryTab'
import { TableSkeleton } from '../../../components/common/Skeletons'
import TableFooter from '../../../components/admin/TableFooter'
import EmptyState from '../../../components/common/EmptyState'

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
]

const formatDisplayDate = (dateVal) => {
  if (!dateVal) return '—'
  try {
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return String(dateVal).split('T')[0]
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(d)
  } catch {
    return String(dateVal).split('T')[0]
  }
}

export default function HospitalCommissionReportPage() {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()

  const [filters, setFilters] = useState({
    month: '',
    year: currentYear.toString(),
    commission_status: '',
    search: '',
  })
  const [appliedFilters, setAppliedFilters] = useState(filters)

  const [perPage, setPerPage] = useState(15)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState('statement') // 'statement', 'payment_history'
  const [showMemo, setShowMemo] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [showPayoutModal, setShowPayoutModal] = useState(false)

  const {
    data: report = { data: [], summary: {} },
    isLoading,
    refetch
  } = useQuery({
    queryKey: queryKeys.commissions.hospitalCommissionReport(appliedFilters),
    queryFn: async () => {
      const res = await getHospitalCommissionReport(appliedFilters)
      const reportData = res.data?.data || []
      const reportSummary = res.data?.summary || {}
      return { data: reportData, summary: reportSummary }
    },
    staleTime: 60 * 1000,
  })

  const rawData = report.data || []
  const summary = report.summary || {}
  const hasActivePackage = summary.has_active_package

  // Client-side search for registration ID or patient name/phone
  const filteredData = rawData.filter(item => {
    if (!filters.search) return true
    const q = filters.search.toLowerCase()
    return (
      (item.registration_id && item.registration_id.toLowerCase().includes(q)) ||
      (item.patient_name && item.patient_name.toLowerCase().includes(q)) ||
      (item.patient_phone && item.patient_phone.includes(q)) ||
      (item.doctor_name && item.doctor_name.toLowerCase().includes(q))
    )
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [filteredData.length, perPage])

  const paginatedData = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage)

  const handleApply = (e) => {
    e?.preventDefault()
    setAppliedFilters({ ...filters })
  }

  const handleReset = () => {
    const defaultF = { month: '', year: currentYear.toString(), commission_status: '', search: '' }
    setFilters(defaultF)
    setAppliedFilters(defaultF)
  }

  return (
    <div className="admin-container">
      {/* ── Page Header ── */}
      <div className="admin-page-header" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🏥</span>
            <span>Hospital Commission & Settlement</span>
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>
            Review counter bookings, gross fee collections, and platform commission breakdown
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="admin-btn admin-btn-outline"
            onClick={() => setShowMemo(true)}
            disabled={filteredData.length === 0}
            style={{
              height: 42,
              padding: '0 18px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Printer size={16} />
            <span>Print Official Statement</span>
          </button>
        </div>
      </div>

      {/* ── Active Package / Commission Mode Banner (Slim 1-Row) ── */}
      {hasActivePackage ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 12,
          padding: '8px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
              flexShrink: 0
            }}>
              <ShieldCheck size={18} strokeWidth={2.2} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--admin-text)' }}>
                Active Enterprise Subscription:
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 8,
                background: '#10B981',
                color: 'white'
              }}>
                {summary.package_name || 'PACKAGE ACTIVE'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                • প্ল্যাটফর্ম কমিশন <strong>০% (মওকুফ)</strong>, সকল অ্যাপয়েন্টমেন্ট আয় হাসপাতালের জন্য সংরক্ষিত।
              </span>
            </div>
          </div>
          <div style={{
            fontSize: 11.5,
            fontWeight: 800,
            color: '#059669',
            background: 'white',
            padding: '4px 10px',
            borderRadius: 8,
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}>
            <span>⚡</span>
            <span>0% Commission Active</span>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(14, 165, 233, 0.05) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 12,
          padding: '8px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(99, 102, 241, 0.25)',
              flexShrink: 0
            }}>
              <Sparkles size={16} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--admin-text)' }}>
                Upgrade to Subscription & Pay 0% Commission
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 8,
                background: '#6366F1',
                color: 'white',
                letterSpacing: '0.04em'
              }}>
                COMMISSION MODE
              </span>
              <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                • এন্টারপ্রাইজ প্যাকেজে আপগ্রেড করলে প্ল্যাটফর্ম কমিশন ০% হবে।
              </span>
            </div>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => navigate('/hospital/hospital-subscription')}
            style={{
              height: 32,
              padding: '0 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
              border: 'none',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <span>🚀 Upgrade Package</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      )}

      {/* ── 4 Key Metric Summary Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        {/* Total Bookings Card */}
        <div className="admin-card" style={{ padding: '20px 22px', borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Appointments
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--admin-text)', lineHeight: 1 }}>
            {summary.total_count ?? 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 8 }}>
            Counter: <strong>{summary.counter_cash_count ?? 0}</strong> &nbsp;|&nbsp; Online: <strong>{summary.online_count ?? 0}</strong>
          </div>
        </div>

        {/* Total Gross Fees Card */}
        <div className="admin-card" style={{ padding: '20px 22px', borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Collected Fees
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#059669', lineHeight: 1 }}>
            ৳{Number(summary.total_billed || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            <span>
              Cash: <strong>৳{Number(summary.counter_cash_amount || 0).toLocaleString()}</strong>
              {Number(summary.online_collected_amount || 0) > 0 && (
                <> &nbsp;|&nbsp; Online: <strong>৳{Number(summary.online_collected_amount).toLocaleString()}</strong></>
              )}
            </span>
            {Number(summary.online_collected_amount || 0) > 0 && (
              <button
                type="button"
                onClick={() => setShowPayoutModal(true)}
                style={{
                  background: '#10B981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '3px 10px',
                  fontSize: 11.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                💸 উত্তোলন করুন
              </button>
            )}
          </div>
        </div>

        {/* Platform Commission Due (Payable) */}
        <div className="admin-card" style={{ padding: '20px 22px', borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Commission Due (Payable)
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245, 158, 11, 0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: (summary.pending_commission > 0) ? '#D97706' : 'var(--admin-text)', lineHeight: 1 }}>
            ৳{Number(summary.pending_commission || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            <span>
              {summary.pending_commission > 0 
                ? '⚠️ Settlement pending' 
                : (Number(summary.verifying_commission || 0) > 0 ? '🔍 ভেরিফিকেশন চলছে' : '✓ No outstanding due')}
            </span>
            {Number(summary.pending_commission || 0) > 0 && (
              <button
                type="button"
                onClick={() => setShowPayModal(true)}
                style={{
                  background: '#10B981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '3px 10px',
                  fontSize: 11.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                💳 বকেয়া পরিশোধ
              </button>
            )}
            {Number(summary.pending_commission || 0) <= 0 && Number(summary.verifying_commission || 0) > 0 && (
              <span style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#B45309',
                borderRadius: 8,
                padding: '3px 10px',
                fontSize: 11.5,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}>
                🔍 যাচাইকরণ প্রক্রিয়াধীন
              </span>
            )}
          </div>
        </div>

        {/* Settled / Paid Commission */}
        <div className="admin-card" style={{ padding: '20px 22px', borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Settled Commission
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#6366F1', lineHeight: 1 }}>
            ৳{Number(summary.paid_commission || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 8 }}>
            Total Commission: <strong>৳{Number(summary.total_commission || 0).toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* ── Verification Pending Alert Banner if any ── */}
      {Number(summary.verifying_commission || 0) > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 14,
          padding: '12px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{ fontSize: 20 }}>🔍</div>
          <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
            <strong>যাচাইকরণ প্রক্রিয়াধীন:</strong> হাসপাতালের পক্ষ থেকে <strong>৳{Number(summary.verifying_commission).toLocaleString()}</strong> কমিশন পরিশোধের তথ্য সাবমিট করা হয়েছে। অ্যাডমিন ব্যাংক/bKash স্টেটমেন্ট যাচাই করে অনুমোদন দিলে এটি <strong>'PAID & LOCKED'</strong> হিসেবে চূড়ান্ত হবে।
          </div>
        </div>
      )}

      {/* ── View Switcher Tabs ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
        borderBottom: '1.5px solid var(--admin-border, #e2e8f0)',
        paddingBottom: 4
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('statement')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'statement' ? '2.5px solid #00A88C' : '2.5px solid transparent',
            background: 'none',
            color: activeTab === 'statement' ? '#00A88C' : 'var(--admin-text-muted, #64748b)',
            fontWeight: activeTab === 'statement' ? 800 : 600,
            fontSize: 14,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s'
          }}
        >
          <FileText size={16} />
          <span>অ্যাপয়েন্টমেন্ট ভিত্তিক স্টেটমেন্ট</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payment_history')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'payment_history' ? '2.5px solid #00A88C' : '2.5px solid transparent',
            background: 'none',
            color: activeTab === 'payment_history' ? '#00A88C' : 'var(--admin-text-muted, #64748b)',
            fontWeight: activeTab === 'payment_history' ? 800 : 600,
            fontSize: 14,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s'
          }}
        >
          <CreditCard size={16} />
          <span>কমিশন পরিশোধের ইতিহাস (Payment History)</span>
          {Number(summary.verifying_commission || 0) > 0 && (
            <span style={{
              padding: '2px 8px',
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 800,
              background: '#fef3c7',
              color: '#d97706',
              border: '1px solid #fde68a'
            }}>
              যাচাই চলছে
            </span>
          )}
        </button>
      </div>

      {activeTab === 'statement' ? (
        <>
          {/* ── Filters Bar ── */}
          <div className="admin-card" style={{ padding: '16px 20px', borderRadius: 16, marginBottom: 20 }}>
        <form onSubmit={handleApply} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          {/* Search box */}
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
            <input
              type="text"
              className="admin-form-input"
              placeholder="Search serial, patient, doctor..."
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              style={{ width: '100%', height: 40, paddingLeft: 36, borderRadius: 10, fontSize: 13 }}
            />
          </div>

          {/* Month Selector */}
          <div style={{ minWidth: 140 }}>
            <select
              className="admin-form-select"
              value={filters.month}
              onChange={e => setFilters(prev => ({ ...prev, month: e.target.value }))}
              style={{ width: '100%', height: 40, borderRadius: 10, fontSize: 13 }}
            >
              <option value="">All Months</option>
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div style={{ width: 110 }}>
            <select
              className="admin-form-select"
              value={filters.year}
              onChange={e => setFilters(prev => ({ ...prev, year: e.target.value }))}
              style={{ width: '100%', height: 40, borderRadius: 10, fontSize: 13 }}
            >
              {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                <option key={y} value={y.toString()}>{y}</option>
              ))}
            </select>
          </div>

          {/* Commission Status */}
          <div style={{ minWidth: 140 }}>
            <select
              className="admin-form-select"
              value={filters.commission_status}
              onChange={e => setFilters(prev => ({ ...prev, commission_status: e.target.value }))}
              style={{ width: '100%', height: 40, borderRadius: 10, fontSize: 13 }}
            >
              <option value="">All Statuses</option>
              <option value="pending">⏳ Pending / Due</option>
              <option value="verifying">🔍 Verifying (যাচাইাধীন)</option>
              <option value="paid">🔒 Settled (Paid & Locked)</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              style={{ height: 40, padding: '0 18px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}
            >
              Filter
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={handleReset}
              style={{ height: 40, padding: '0 14px', borderRadius: 10, fontSize: 13 }}
              title="Reset filters"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </form>
      </div>

      {/* ── Table Statement Card ── */}
      <div className="admin-card" style={{ borderRadius: 16, overflow: 'hidden' }}>
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : paginatedData.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No commission records found"
            description="No appointment bookings match your filter criteria for this period."
          />
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 130 }}>Serial ID</th>
                  <th>Patient Details</th>
                  <th>Doctor & Chamber</th>
                  <th style={{ textAlign: 'right' }}>Visit Fee</th>
                  <th style={{ textAlign: 'center' }}>Rate (%)</th>
                  <th style={{ textAlign: 'right' }}>Platform Commission</th>
                  <th style={{ textAlign: 'center' }}>Channel</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(item => {
                  const isPaid = (item.commission_status || '').toLowerCase() === 'paid'
                  const isVerifying = (item.commission_status || '').toLowerCase() === 'verifying'
                  const isManagerCash = item.created_by_role === 'manager'

                  return (
                    <tr key={item.id}>
                      {/* Serial / Reg ID */}
                      <td>
                        <span style={{ fontWeight: 800, color: 'var(--admin-text)', fontSize: 12.5 }}>
                          {item.registration_id || `#${item.id}`}
                        </span>
                      </td>

                      {/* Patient Details */}
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 13 }}>
                          {item.patient_name || 'Patient'}
                        </div>
                        {item.patient_phone && (
                          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                            📞 {item.patient_phone}
                          </div>
                        )}
                      </td>

                      {/* Doctor & Chamber */}
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 13 }}>
                          {item.doctor_name || 'Consultant'}
                        </div>
                        {item.chamber_name && (
                          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                            📍 {item.chamber_name}
                          </div>
                        )}
                      </td>

                      {/* Visit Fee */}
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--admin-text)', fontSize: 13 }}>
                        ৳{Number(item.amount || 0).toLocaleString()}
                      </td>

                      {/* Commission Rate */}
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: 'var(--admin-bg)',
                          border: '1px solid var(--admin-border)',
                          color: 'var(--admin-text)'
                        }}>
                          {hasActivePackage ? '0%' : (item.commission_rate ? `${item.commission_rate}%` : '—')}
                        </span>
                      </td>

                      {/* Platform Commission Amount */}
                      <td style={{ textAlign: 'right', fontWeight: 900, fontSize: 13, color: item.commission_amount > 0 ? '#D97706' : '#059669' }}>
                        {hasActivePackage ? '৳0 (Waived)' : `৳${Number(item.commission_amount || 0).toLocaleString()}`}
                      </td>

                      {/* Booking Channel */}
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 8,
                          background: isManagerCash ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: isManagerCash ? '#2563EB' : '#059669'
                        }}>
                          {isManagerCash ? '🏢 Counter' : '🌐 Online'}
                        </span>
                      </td>

                      {/* Settlement Status */}
                      <td style={{ textAlign: 'center' }}>
                        {isPaid ? (
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: 8,
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#059669',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }} title={item.commission_note || 'Approved & Locked'}>
                            🔒 PAID & LOCKED
                          </span>
                        ) : isVerifying ? (
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: 8,
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#B45309',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }} title={item.commission_note || 'Admin Verification Pending'}>
                            🔍 VERIFYING (যাচাইাধীন)
                          </span>
                        ) : (
                          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 800,
                              padding: '3px 10px',
                              borderRadius: 8,
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#DC2626',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              whiteSpace: 'nowrap'
                            }}>
                              {isManagerCash ? '⏳ DUE (UNPAID)' : '⏳ PENDING'}
                            </span>
                            {item.commission_note && item.commission_note.includes('Rejected') && (
                              <span style={{ fontSize: 10, color: '#DC2626', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }} title={item.commission_note}>
                                ❌ {item.commission_note}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td style={{ textAlign: 'right', color: 'var(--admin-text)', fontSize: 12.5, whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700 }}>
                          {formatDisplayDate(item.appointment_date || item.date)}
                        </div>
                        {item.appointment_time && (
                          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 500 }}>
                            {item.appointment_time}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer Pagination */}
        <TableFooter
          totalItems={filteredData.length}
          perPage={perPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onPerPageChange={setPerPage}
        />
      </div>
      </>
      ) : (
        <CommissionPaymentHistoryTab
          fetchApi={getHospitalCommissionRequests}
          queryKey="hospital-commission-requests"
          onPayClick={() => setShowPayModal(true)}
          dueAmount={summary.pending_commission || 0}
          providerType="hospital"
        />
      )}

      {/* Official Memo Modal */}
      {showMemo && (
        <CommissionMemo
          show={showMemo}
          onClose={() => setShowMemo(false)}
          data={filteredData}
          summary={summary}
          filters={appliedFilters}
          hospital={{ name: 'Hospital Facility Statement' }}
        />
      )}

      {/* Commission Due Payment Modal */}
      {showPayModal && (
        <CommissionPayModal
          show={showPayModal}
          onClose={() => setShowPayModal(false)}
          dueAmount={summary.pending_commission || 0}
          pendingCount={summary.total_count ? (summary.counter_cash_count || 0) : 0}
          onSuccess={() => refetch()}
          isHospital={true}
        />
      )}

      {/* Payout / Withdrawal Request Modal */}
      {showPayoutModal && (
        <PayoutRequestModal
          show={showPayoutModal}
          onClose={() => setShowPayoutModal(false)}
          availableBalance={summary.online_collected_amount || summary.doctor_net_earnings || 0}
          onSuccess={() => refetch()}
          isHospital={true}
        />
      )}
    </div>
  )
}

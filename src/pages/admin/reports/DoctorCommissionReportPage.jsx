import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  FileText, Calendar, Filter, RotateCcw, CheckCircle2,
  Clock, CreditCard, Search, ArrowUpRight, Printer,
  Stethoscope, ShieldCheck, Sparkles, AlertCircle, DollarSign,
  TrendingUp, Award, User, Building2, X, ChevronDown, ChevronUp,
  Copy, Check
} from 'lucide-react'
import { getDoctorCommissionReport, getDoctorCommissionRequests } from '../../../api/adminApi'
import { queryKeys } from '../../../lib/queryKeys'
import CommissionMemo from './CommissionMemo'
import CommissionPayModal from './CommissionPayModal'
import PayoutRequestModal from './PayoutRequestModal'
import CommissionPaymentHistoryTab from './CommissionPaymentHistoryTab'
import { TableSkeleton } from '../../../components/common/Skeletons'
import TableFooter from '../../../components/admin/TableFooter'
import EmptyState from '../../../components/common/EmptyState'
import ListToolbar from '../../../components/admin/ListToolbar'

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

function CopyButton({ text, title = "Copy ID" }) {
  const [copied, setCopied] = useState(false)

  if (!text) return null

  const handleCopy = (e) => {
    e.stopPropagation()
    e.preventDefault()
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(String(text).trim())
      } else {
        const el = document.createElement('textarea')
        el.value = String(text).trim()
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.warn('Copy failed:', err)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied!" : title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 19,
        height: 19,
        padding: 0,
        marginLeft: 6,
        background: copied ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.08)',
        border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.4)' : 'rgba(100, 116, 139, 0.2)'}`,
        borderRadius: 4,
        color: copied ? '#059669' : 'var(--admin-text-muted, #64748b)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        verticalAlign: 'middle',
        flexShrink: 0
      }}
    >
      {copied ? <Check size={11} strokeWidth={2.8} /> : <Copy size={11} strokeWidth={2} />}
    </button>
  )
}

export default function DoctorCommissionReportPage() {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()

  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    month: '',
    year: currentYear.toString(),
    commission_status: '',
    search: '',
  })
  const [appliedFilters, setAppliedFilters] = useState(filters)
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  const activeFilterCount = (appliedFilters.month ? 1 : 0) +
    (appliedFilters.commission_status ? 1 : 0) +
    (appliedFilters.year && appliedFilters.year !== currentYear.toString() ? 1 : 0) +
    (appliedFilters.date_from ? 1 : 0) +
    (appliedFilters.date_to ? 1 : 0)

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
    queryKey: queryKeys.commissions.doctorCommissionReport(appliedFilters),
    queryFn: async () => {
      const res = await getDoctorCommissionReport(appliedFilters)
      const reportData = res.data?.data || []
      const reportSummary = res.data?.summary || {}
      return { data: reportData, summary: reportSummary }
    },
    staleTime: 60 * 1000,
  })

  const rawData = report.data || []
  const summary = report.summary || {}
  const hasActivePackage = summary.has_active_package

  // Client-side robust search (safe against null, numbers, case sensitivity, and date ranges)
  const filteredData = rawData.filter((item, idx) => {
    const itemDate = item.appointment_date || item.date
    if (filters.date_from && itemDate && itemDate < filters.date_from) return false
    if (filters.date_to && itemDate && itemDate > filters.date_to) return false

    if (!filters.search) return true
    const q = String(filters.search).toLowerCase().trim()
    if (!q) return true

    const match = (val) => val != null && String(val).toLowerCase().includes(q)

    return (
      match(idx + 1) ||
      match(item.public_id) ||
      match(item.registration_id) ||
      match(item.patient_name) ||
      match(item.patient_phone) ||
      match(item.booking_phone) ||
      match(item.chamber_name) ||
      match(item.chamber_public_id) ||
      match(item.hospital_name) ||
      match(item.commission_status) ||
      match(item.payment_status) ||
      match(item.appointment_date) ||
      match(item.date)
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

  const handleFilterChange = (key, val) => {
    const nextFilters = { ...filters, [key]: val }
    setFilters(nextFilters)
    setAppliedFilters(nextFilters)
  }

  const handleReset = () => {
    const defaultF = {
      date_from: '',
      date_to: '',
      month: '',
      year: currentYear.toString(),
      commission_status: '',
      search: ''
    }
    setFilters(defaultF)
    setAppliedFilters(defaultF)
  }

  return (
    <div className="admin-container">
      {/* ── Page Header ── */}
      <div className="admin-page-header" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🩺</span>
            <span>Doctor Earnings & Commission Statement</span>
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>
            Real-time statement of patient consultation fees, platform commissions, and net payout earnings
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

      {/* ── Dynamic Package or Upsell Banner (Slim 1-Row) ── */}
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
                Active Subscription:
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
                • প্ল্যাটফর্ম কমিশন <strong>০% (মওকুফ)</strong>, রোগীর সম্পূর্ণ ভিজিট ফি আপনার নিজস্ব আয়।
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
            <span>🎉</span>
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
                • সাবস্ক্রাইব করলে প্ল্যাটফর্ম ফি ০% হবে এবং সম্পূর্ণ আয় আপনার থাকবে।
              </span>
            </div>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => navigate('/doctor/subscription')}
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

      {/* ── 4 Key Metric Summary Cards (Slim & Compact) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 12,
        marginBottom: 18
      }}>
        {/* Total Consultations Card */}
        <div className="admin-card" style={{ padding: '12px 16px', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Patient Consultations
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={15} />
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--admin-text)', lineHeight: 1.1 }}>
            {summary.total_count ?? 0}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--admin-text-muted)', marginTop: 5 }}>
            Counter: <strong>{summary.counter_cash_count ?? 0}</strong> &nbsp;|&nbsp; Online: <strong>{summary.online_count ?? 0}</strong>
          </div>
        </div>

        {/* Gross Consultation Fees */}
        <div className="admin-card" style={{ padding: '12px 16px', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Gross Patient Fees
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={15} />
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--admin-text)', lineHeight: 1.1 }}>
            ৳{Number(summary.total_billed || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--admin-text-muted)', marginTop: 5 }}>
            Total value of all consultations
          </div>
        </div>

        {/* Doctor Net Earnings (Take-Home) */}
        <div className="admin-card" style={{
          padding: '12px 16px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(5, 150, 105, 0.03))',
          border: '1px solid rgba(16, 185, 129, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Doctor Net Earnings
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: '#10B981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={15} />
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>
            ৳{Number(summary.doctor_net_earnings || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 11.5, color: '#059669', marginTop: 5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            <span>✓ Net Take-Home</span>
            {Number(summary.doctor_net_earnings || 0) > 0 && (
              <button
                type="button"
                onClick={() => setShowPayoutModal(true)}
                style={{
                  background: '#10B981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                💸 উত্তোলন
              </button>
            )}
          </div>
        </div>

        {/* Platform Commission Deducted */}
        <div className="admin-card" style={{ padding: '12px 16px', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Platform Commission
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(245, 158, 11, 0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={15} />
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: hasActivePackage ? '#059669' : (summary.total_commission > 0 ? '#D97706' : 'var(--admin-text)'), lineHeight: 1.1 }}>
            {hasActivePackage ? '৳0' : `৳${Number(summary.total_commission || 0).toLocaleString()}`}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--admin-text-muted)', marginTop: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            <span>
              {hasActivePackage 
                ? '🎉 100% Waived by package' 
                : `Paid: ৳${summary.paid_commission ?? 0}${Number(summary.verifying_commission || 0) > 0 ? ` | Verifying: ৳${summary.verifying_commission}` : ''} | Due: ৳${summary.pending_commission ?? 0}`}
            </span>
            {!hasActivePackage && Number(summary.pending_commission || 0) > 0 && (
              <button
                type="button"
                onClick={() => setShowPayModal(true)}
                style={{
                  background: '#D97706',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                💳 পরিশোধ
              </button>
            )}
            {!hasActivePackage && Number(summary.pending_commission || 0) <= 0 && Number(summary.verifying_commission || 0) > 0 && (
              <span style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#B45309',
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3
              }}>
                🔍 যাচাইাধীন
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Verification Pending Banner if any ── */}
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
            <strong>যাচাইকরণ প্রক্রিয়াধীন:</strong> আপনার মোট <strong>৳{Number(summary.verifying_commission).toLocaleString()}</strong> কমিশন পরিশোধের রিকোয়েস্ট জমা আছে। অ্যাডমিন ব্যাংক/bKash স্টেটমেন্ট যাচাই করে অনুমোদন দিলে এটি <strong>'PAID & LOCKED'</strong> হিসেবে চূড়ান্ত হবে।
          </div>
        </div>
      )}

      {/* ── Enterprise ListToolbar matching standard admin listings ── */}
      <ListToolbar
        search={filters.search}
        onSearchChange={(val) => setFilters(prev => ({ ...prev, search: val }))}
        searchPlaceholder="Search serial, patient, chamber..."
        onRefresh={refetch}
        refreshing={isLoading}
        showFilters={showFilterPanel}
        onToggleFilters={() => setShowFilterPanel(prev => !prev)}
        hasActiveFilters={activeFilterCount > 0}
        filterCount={activeFilterCount}
        onClearFilters={handleReset}
        activeFilters={[
          appliedFilters.date_from && {
            key: 'date_from',
            label: `From: ${appliedFilters.date_from}`,
            onRemove: () => handleFilterChange('date_from', '')
          },
          appliedFilters.date_to && {
            key: 'date_to',
            label: `To: ${appliedFilters.date_to}`,
            onRemove: () => handleFilterChange('date_to', '')
          },
          appliedFilters.month && {
            key: 'month',
            label: `Month: ${MONTHS.find(m => String(m.value) === String(appliedFilters.month))?.label || appliedFilters.month}`,
            onRemove: () => handleFilterChange('month', '')
          },
          appliedFilters.year && appliedFilters.year !== currentYear.toString() && {
            key: 'year',
            label: `Year: ${appliedFilters.year}`,
            onRemove: () => handleFilterChange('year', currentYear.toString())
          },
          appliedFilters.commission_status && {
            key: 'status',
            label: `Status: ${
              appliedFilters.commission_status === 'pending'
                ? 'Pending / Unpaid'
                : appliedFilters.commission_status === 'verifying'
                ? 'Verifying'
                : 'Paid & Locked'
            }`,
            onRemove: () => handleFilterChange('commission_status', '')
          }
        ].filter(Boolean)}
        middleActions={
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--admin-input-bg, #f1f5f9)',
            padding: 3,
            borderRadius: 10,
            border: '1px solid var(--admin-border, #e2e8f0)',
            gap: 3
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('statement')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                height: 32,
                padding: '0 12px',
                borderRadius: 7,
                border: 'none',
                background: activeTab === 'statement' ? '#ffffff' : 'transparent',
                color: activeTab === 'statement' ? '#00A88C' : 'var(--admin-text-muted, #64748b)',
                fontWeight: activeTab === 'statement' ? 700 : 500,
                fontSize: 12.5,
                cursor: 'pointer',
                boxShadow: activeTab === 'statement' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <FileText size={14} />
              <span>স্টেটমেন্ট</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payment_history')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                height: 32,
                padding: '0 12px',
                borderRadius: 7,
                border: 'none',
                background: activeTab === 'payment_history' ? '#ffffff' : 'transparent',
                color: activeTab === 'payment_history' ? '#00A88C' : 'var(--admin-text-muted, #64748b)',
                fontWeight: activeTab === 'payment_history' ? 700 : 500,
                fontSize: 12.5,
                cursor: 'pointer',
                boxShadow: activeTab === 'payment_history' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <CreditCard size={14} />
              <span>পেমেন্ট হিস্ট্রি</span>
              {Number(summary.verifying_commission || 0) > 0 && (
                <span style={{
                  padding: '1px 6px',
                  borderRadius: 9999,
                  fontSize: 10,
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
        }
      >
        {/* From Date */}
        <div style={{ minWidth: 140 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted, #64748b)', marginBottom: 4, textTransform: 'uppercase' }}>
            From Date
          </label>
          <input
            type="date"
            className="admin-form-input"
            value={filters.date_from || ''}
            onChange={e => handleFilterChange('date_from', e.target.value)}
            style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
          />
        </div>

        {/* To Date */}
        <div style={{ minWidth: 140 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted, #64748b)', marginBottom: 4, textTransform: 'uppercase' }}>
            To Date
          </label>
          <input
            type="date"
            className="admin-form-input"
            min={filters.date_from || undefined}
            value={filters.date_to || ''}
            onChange={e => handleFilterChange('date_to', e.target.value)}
            style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
          />
        </div>

        {/* Month Selector */}
        <div style={{ minWidth: 160 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted, #64748b)', marginBottom: 4, textTransform: 'uppercase' }}>
            Month
          </label>
          <select
            className="admin-form-select"
            value={filters.month}
            onChange={e => handleFilterChange('month', e.target.value)}
            style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
          >
            <option value="">All Months</option>
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Year Selector */}
        <div style={{ minWidth: 130 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted, #64748b)', marginBottom: 4, textTransform: 'uppercase' }}>
            Year
          </label>
          <select
            className="admin-form-select"
            value={filters.year}
            onChange={e => handleFilterChange('year', e.target.value)}
            style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
          >
            {[currentYear, currentYear - 1, currentYear - 2].map(y => (
              <option key={y} value={y.toString()}>{y}</option>
            ))}
          </select>
        </div>

        {/* Commission Status */}
        <div style={{ minWidth: 180 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted, #64748b)', marginBottom: 4, textTransform: 'uppercase' }}>
            Commission Status
          </label>
          <select
            className="admin-form-select"
            value={filters.commission_status}
            onChange={e => handleFilterChange('commission_status', e.target.value)}
            style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
          >
            <option value="">All Statuses</option>
            <option value="pending">⏳ Pending / Unpaid</option>
            <option value="verifying">🔍 Verifying (যাচাইাধীন)</option>
            <option value="paid">🔒 Settled (Paid & Locked)</option>
          </select>
        </div>
      </ListToolbar>

      {activeTab === 'statement' ? (
        <div className="admin-card" style={{ borderRadius: 16, overflow: 'hidden' }}>
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : paginatedData.length === 0 ? (
          <EmptyState
            variant={filters.search ? 'no-search-results' : 'no-data'}
            searchQuery={filters.search}
            onClearSearch={() => setFilters(prev => ({ ...prev, search: '' }))}
            icon={<FileText size={28} />}
            title={filters.search ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No consultation earnings found'}
            description={filters.search ? `"${filters.search}" এর সাথে মিলে এমন কোনো অ্যাপয়েন্টমেন্ট পাওয়া যায়নি।` : 'No consultation records match your filter criteria for this period.'}
          />
        ) : (
          <div className="admin-table-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
            <table className="admin-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: 44, textAlign: 'center', padding: '12px 6px' }}>SL</th>
                  <th>Patient & Appointment</th>
                  <th>Chamber / Facility</th>
                  <th style={{ textAlign: 'right' }}>Consultation Fee</th>
                  <th style={{ textAlign: 'center', width: 75 }}>Comm %</th>
                  <th style={{ textAlign: 'right' }}>Platform Fee</th>
                  <th style={{ textAlign: 'center', width: 90 }}>Channel</th>
                  <th style={{ textAlign: 'center', width: 125 }}>Status</th>
                  <th style={{ textAlign: 'right', paddingRight: 20 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, index) => {
                  const isPaid = (item.commission_status || '').toLowerCase() === 'paid'
                  const isVerifying = (item.commission_status || '').toLowerCase() === 'verifying'
                  const isManagerCash = item.created_by_role === 'manager'

                  return (
                    <tr key={item.id}>
                      {/* Serial (#1, #2, ...) */}
                      <td style={{ textAlign: 'center', width: 44, padding: '12px 8px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 26,
                          height: 26,
                          borderRadius: 7,
                          background: 'rgba(100, 116, 139, 0.08)',
                          color: 'var(--admin-text-muted)',
                          fontSize: 12,
                          fontWeight: 800
                        }}>
                          {(currentPage - 1) * perPage + index + 1}
                        </span>
                      </td>

                      {/* Patient & Appointment Public ID (AP-XXXXXX, clean avatar + text) */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: 'rgba(0, 168, 140, 0.1)',
                            border: '1px solid rgba(0, 168, 140, 0.22)',
                            color: '#00A88C',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <User size={16} strokeWidth={2.4} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 13, lineHeight: 1.25 }}>
                              {item.patient_name || 'Patient'}
                            </div>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#00A88C',
                              fontFamily: 'monospace',
                              letterSpacing: '0.04em',
                              marginTop: 2
                            }}>
                              <span>{item.public_id || `#${item.registration_id || item.id}`}</span>
                              <CopyButton text={item.public_id || item.registration_id || item.id} title="Copy Appointment ID" />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Chamber / Hospital Name & Chamber Public ID */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background: item.hospital_name ? 'rgba(59, 130, 246, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                            border: item.hospital_name ? '1px solid rgba(59, 130, 246, 0.22)' : '1px solid rgba(99, 102, 241, 0.22)',
                            color: item.hospital_name ? '#2563EB' : '#6366F1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 13,
                            flexShrink: 0
                          }}>
                            {item.hospital_name ? <Building2 size={15} strokeWidth={2.2} /> : <Stethoscope size={15} strokeWidth={2.2} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 13, lineHeight: 1.25 }}>
                              {item.hospital_name || item.chamber_name || 'Chamber'}
                            </div>
                            {item.chamber_public_id && (
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                fontSize: 11,
                                fontWeight: 600,
                                color: 'var(--admin-text-muted)',
                                fontFamily: 'monospace',
                                letterSpacing: '0.04em',
                                marginTop: 2
                              }}>
                                <span>{item.chamber_public_id}</span>
                                <CopyButton text={item.chamber_public_id} title="Copy Chamber ID" />
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Consultation Fee */}
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--admin-text)', fontSize: 13.5, whiteSpace: 'nowrap' }}>
                        ৳{Number(item.amount || 0).toLocaleString()}
                      </td>

                      {/* Commission Rate */}
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {hasActivePackage ? (
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#059669',
                            border: '1px solid rgba(16, 185, 129, 0.25)'
                          }}>
                            0% Plan
                          </span>
                        ) : (
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: 'rgba(100, 116, 139, 0.08)',
                            border: '1px solid var(--admin-border)',
                            color: 'var(--admin-text)'
                          }}>
                            {item.commission_rate ? `${item.commission_rate}%` : '—'}
                          </span>
                        )}
                      </td>

                      {/* Platform Fee Deducted */}
                      <td style={{
                        textAlign: 'right',
                        fontWeight: 800,
                        fontSize: 13,
                        color: hasActivePackage ? '#059669' : (item.commission_amount > 0 ? '#D97706' : '#059669'),
                        whiteSpace: 'nowrap'
                      }}>
                        {hasActivePackage ? '৳0' : `৳${Number(item.commission_amount || 0).toLocaleString()}`}
                      </td>

                      {/* Channel */}
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: isManagerCash ? 'rgba(59, 130, 246, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                          color: isManagerCash ? '#2563EB' : '#059669',
                          border: isManagerCash ? '1px solid rgba(59, 130, 246, 0.22)' : '1px solid rgba(16, 185, 129, 0.22)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}>
                          <span style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: isManagerCash ? '#3B82F6' : '#10B981'
                          }} />
                          {isManagerCash ? 'Counter' : 'Online'}
                        </span>
                      </td>

                      {/* Settlement Status */}
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {isPaid ? (
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: 8,
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#059669',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5
                          }} title={item.commission_note || 'Approved & Locked'}>
                            <CheckCircle2 size={13} strokeWidth={2.4} />
                            PAID & LOCKED
                          </span>
                        ) : isVerifying ? (
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: 8,
                            background: 'rgba(245, 158, 11, 0.14)',
                            color: '#B45309',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5
                          }} title={item.commission_note || 'Admin Verification Pending'}>
                            <Clock size={13} strokeWidth={2.4} />
                            VERIFYING
                          </span>
                        ) : (
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: 8,
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#DC2626',
                            border: '1px solid rgba(239, 68, 68, 0.28)',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5
                          }}>
                            <AlertCircle size={13} strokeWidth={2.4} />
                            {isManagerCash ? 'DUE' : 'PENDING'}
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td style={{ textAlign: 'right', color: 'var(--admin-text)', fontSize: 12.5, whiteSpace: 'nowrap', fontWeight: 700, paddingRight: 20 }}>
                        <div>{formatDisplayDate(item.appointment_date || item.date)}</div>
                        {item.appointment_time && (
                          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 500, marginTop: 2 }}>
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
          total={filteredData.length}
          perPage={perPage}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          setPerPage={setPerPage}
        />
      </div>
      ) : (
        <CommissionPaymentHistoryTab
          fetchApi={getDoctorCommissionRequests}
          queryKey="doctor-commission-requests"
          onPayClick={() => setShowPayModal(true)}
          dueAmount={summary.pending_commission || 0}
          providerType="doctor"
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
          doctor={{ name: 'Doctor Earnings Statement' }}
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
          isHospital={false}
        />
      )}

      {/* Payout / Withdrawal Request Modal */}
      {showPayoutModal && (
        <PayoutRequestModal
          show={showPayoutModal}
          onClose={() => setShowPayoutModal(false)}
          availableBalance={summary.doctor_net_earnings || 0}
          onSuccess={() => refetch()}
          isHospital={false}
        />
      )}
    </div>
  )
}

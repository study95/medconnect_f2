import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  getAdminSubscribers,
  getAdminSubscriberDetails,
  cancelAdminSubscriber,
  updateAdminSubscriber,
  getAdminManualPaymentSlipUrl,
  approveAdminManualPayment,
  rejectAdminManualPayment,
} from '../../../api/billingAdminApi'
import axiosInstance from '../../../api/axiosInstance'
import {
  Search,
  Users,
  Eye,
  XCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  X,
  Stethoscope,
  Building2,
  Grid,
  Layers,
  Sparkles,
  Receipt,
  CreditCard,
  Tag,
  Settings,
  Calendar,
  ShieldCheck,
  Ban,
  ArrowUpRight,
  ExternalLink,
  FileText,
  Check,
  Image as ImageIcon,
} from 'lucide-react'
import useDebounce from '../../../hooks/useDebounce'
import { useAuth } from '../../../context/AuthContext'
import '../../../styles/admin-billing.css'

export default function AdminSubscribersPage() {
  const { hasPermission } = useAuth()

  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({})

  const debouncedSearch = useDebounce(search, 400)

  // Drawer state
  const [selectedSub, setSelectedSub] = useState(null)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [timeline, setTimeline] = useState([])

  // Approval / Rejection state
  const [approvalProcessing, setApprovalProcessing] = useState(false)
  const [approvalNote, setApprovalNote] = useState('')
  const [approvalError, setApprovalError] = useState(null)
  const [approvalSuccess, setApprovalSuccess] = useState(null)
  const [slipBlobUrl, setSlipBlobUrl] = useState(null)
  const [slipBlobLoading, setSlipBlobLoading] = useState(false)

  const loadSubscribers = async () => {
    try {
      setError(null)
      setLoading(true)
      const res = await getAdminSubscribers({
        search: debouncedSearch.trim() || undefined,
        status: statusFilter || undefined,
        entity_type: entityFilter !== 'all' ? (entityFilter === 'doctor' ? 'Doctor' : 'Hospital') : undefined,
        page,
        per_page: 15,
      })
      const responseMeta = res.data?.meta || {}
      setMeta(responseMeta)
      const list = res.data?.data || []
      setSubscribers(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load subscribers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubscribers()
  }, [statusFilter, entityFilter, page, debouncedSearch])

  // Reset page to 1 whenever filters or search change
  useEffect(() => {
    setPage(1)
  }, [statusFilter, entityFilter, debouncedSearch])

  const fetchSlipBlob = async (txId) => {
    setSlipBlobLoading(true)
    try {
      const res = await axiosInstance.get(`/admin/billing/manual-payments/${txId}/slip`, {
        responseType: 'blob'
      })
      const url = URL.createObjectURL(res.data)
      setSlipBlobUrl(url)
    } catch (err) {
      console.error('Failed to load slip', err)
      setSlipBlobUrl(null)
    } finally {
      setSlipBlobLoading(false)
    }
  }

  const closeDrawer = () => {
    if (slipBlobUrl) {
      URL.revokeObjectURL(slipBlobUrl)
      setSlipBlobUrl(null)
    }
    setSelectedSub(null)
    setApprovalNote('')
    setApprovalError(null)
    setApprovalSuccess(null)
  }

  const openDrawer = async (sub) => {
    try {
      if (slipBlobUrl) {
        URL.revokeObjectURL(slipBlobUrl)
        setSlipBlobUrl(null)
      }
      setSelectedSub(sub)
      setApprovalNote('')
      setApprovalError(null)
      setApprovalSuccess(null)
      setDrawerLoading(true)
      const res = await getAdminSubscriberDetails(sub.id)
      const fullSub = res.data?.subscription || sub
      setSelectedSub(fullSub)
      setTimeline(res.data?.timeline || [])

      if (fullSub.payment_evidence?.transaction_id && fullSub.payment_evidence?.has_slip) {
        fetchSlipBlob(fullSub.payment_evidence.transaction_id)
      }
    } catch (err) {
      alert('Failed to load subscription timeline')
    } finally {
      setDrawerLoading(false)
    }
  }

  const handleApprovalAction = async (action) => {
    const txId = selectedSub?.payment_evidence?.transaction_id
    if (!txId) {
      setApprovalError('No manual payment transaction found for this subscription.')
      return
    }

    if (!approvalNote.trim()) {
      setApprovalError(`Please provide a mandatory audit note before ${action === 'approve' ? 'approving' : 'rejecting'} this payment.`)
      return
    }

    try {
      setApprovalProcessing(true)
      setApprovalError(null)
      setApprovalSuccess(null)

      if (action === 'approve') {
        await approveAdminManualPayment(txId, approvalNote.trim())
        setApprovalSuccess('Manual payment approved successfully! Subscription activated.')
      } else {
        await rejectAdminManualPayment(txId, approvalNote.trim())
        setApprovalSuccess('Manual payment rejected and invoice marked as void.')
      }

      setTimeout(async () => {
        const res = await getAdminSubscriberDetails(selectedSub.id)
        setSelectedSub(res.data?.subscription || selectedSub)
        setTimeline(res.data?.timeline || [])
        setApprovalSuccess(null)
        loadSubscribers()
      }, 1200)
    } catch (err) {
      if (err.response?.status === 409) {
        setApprovalError('Conflict (409): This transaction has already been processed.')
      } else {
        const errorData = err.response?.data
        let errMsg = errorData?.message || `Failed to ${action} payment.`
        if (errorData?.errors && typeof errorData.errors === 'object') {
          const firstKey = Object.keys(errorData.errors)[0]
          const firstErr = errorData.errors[firstKey]
          if (Array.isArray(firstErr) && firstErr.length > 0) {
            errMsg = `${errMsg} (${firstErr[0]})`
          } else if (typeof firstErr === 'string') {
            errMsg = `${errMsg} (${firstErr})`
          }
        }
        setApprovalError(errMsg)
      }
    } finally {
      setApprovalProcessing(false)
    }
  }

  const handleCancelSub = async (immediately = false) => {
    const msg = immediately
      ? 'Are you sure you want to cancel this subscription IMMEDIATELY? Access will be terminated right now.'
      : 'Are you sure you want to cancel this subscription at the end of the current billing cycle?'
    if (!window.confirm(msg)) return

    try {
      await cancelAdminSubscriber(selectedSub.id, immediately)
      openDrawer(selectedSub)
      loadSubscribers()
    } catch (err) {
      alert(err.response?.data?.message || 'Error cancelling subscription')
    }
  }

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const total = subscribers.length
    const active = subscribers.filter(s => s.status === 'active').length
    const trialing = subscribers.filter(s => s.status === 'trialing').length
    const pendingReview = subscribers.filter(s => s.payment_evidence?.status === 'pending').length
    const pastDue = subscribers.filter(s => ['past_due', 'grace_period'].includes(s.status)).length
    const canceled = subscribers.filter(s => ['canceled', 'expired'].includes(s.status)).length
    return { total, active, trialing, pendingReview, pastDue, canceled }
  }, [subscribers])

  const getStatusBadge = (status, sub = null) => {
    if (sub?.payment_evidence?.status === 'pending') {
      return <span className="ab-badge ab-badge-amber"><span className="ab-dot ab-dot-pulse" style={{ background: '#f59e0b' }} /> Pending Review</span>
    }
    switch (status) {
      case 'active':
        return <span className="ab-badge ab-badge-emerald"><span className="ab-dot ab-dot-pulse" style={{ background: '#10b981' }} /> Active</span>
      case 'trialing':
        return <span className="ab-badge ab-badge-blue"><span className="ab-dot" style={{ background: '#3b82f6' }} /> Trialing</span>
      case 'under_review':
      case 'pending':
        return <span className="ab-badge ab-badge-amber"><span className="ab-dot ab-dot-pulse" style={{ background: '#f59e0b' }} /> Pending Review</span>
      case 'past_due':
        return <span className="ab-badge ab-badge-amber"><span className="ab-dot" style={{ background: '#f59e0b' }} /> Past Due</span>
      case 'grace_period':
        return <span className="ab-badge ab-badge-amber"><span className="ab-dot ab-dot-pulse" style={{ background: '#f59e0b' }} /> Grace Period</span>
      case 'canceled':
        return <span className="ab-badge ab-badge-rose">Canceled</span>
      case 'rejected':
      case 'failed':
        return <span className="ab-badge ab-badge-rose">Rejected</span>
      case 'expired':
        return <span className="ab-badge ab-badge-slate">Expired</span>
      default:
        return <span className="ab-badge ab-badge-slate">{status}</span>
    }
  }

  return (
    <div className="ab-container">
      {/* ─── 1. PAGE HEADER ─── */}
      <div className="ab-header">
        <div>
          <h1 className="ab-title">
            Subscribers & Client Roster
            <span className="ab-title-badge">Lifecycle Manager</span>
          </h1>
          <p className="ab-subtitle">
            Manage active doctor and hospital client subscriptions, inspect usage quotas, and audit lifecycle event timelines.
          </p>
        </div>

        <div className="ab-header-actions">
          <button
            onClick={loadSubscribers}
            className="ab-btn-refresh"
            title="Refresh Roster"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ─── 2. QUICK NAVIGATION BAR ─── */}
      <nav className="ab-quick-nav">
        <Link to="/admin/billing/dashboard" className="ab-nav-pill">
          <Grid size={14} /> Analytics Dashboard
        </Link>
        <Link to="/admin/billing/plans" className="ab-nav-pill">
          <Layers size={14} /> Plans & Tiers
        </Link>
        <Link to="/admin/billing/matrix" className="ab-nav-pill">
          <Sparkles size={14} /> Feature Matrix
        </Link>
        <Link to="/admin/billing/subscribers" className="ab-nav-pill active">
          <Users size={14} /> Subscribers Roster
        </Link>
        <Link to="/admin/billing/invoices" className="ab-nav-pill">
          <Receipt size={14} /> Invoices Ledger
        </Link>
        <Link to="/admin/billing/transactions" className="ab-nav-pill">
          <CreditCard size={14} /> Manual Transactions
        </Link>
        <Link to="/admin/billing/coupons" className="ab-nav-pill">
          <Tag size={14} /> Discount Coupons
        </Link>
        <Link to="/admin/billing/settings" className="ab-nav-pill">
          <Settings size={14} /> Billing Config
        </Link>
      </nav>

      {/* ─── 3. KPI METRICS DECK ─── */}
      <div className="ab-kpi-deck">
        <div className="ab-kpi-card">
          <div className="ab-kpi-label">
            <span>Total Enrolled Practices</span>
            <Users size={15} color="#64748b" />
          </div>
          <div className="ab-kpi-value">{summaryMetrics.total}</div>
          <div className="ab-kpi-footnote">Across all configured tiers</div>
        </div>

        <div className="ab-kpi-card">
          <div className="ab-kpi-label">
            <span>Active Paid Subscriptions</span>
            <CheckCircle2 size={15} color="#00b875" />
          </div>
          <div className="ab-kpi-value">{summaryMetrics.active}</div>
          <div className="ab-kpi-footnote">Generating monthly recurring revenue</div>
        </div>

        <div className="ab-kpi-card">
          <div className="ab-kpi-label">
            <span>Trialing & Evaluation</span>
            <Clock size={15} color="#3b82f6" />
          </div>
          <div className="ab-kpi-value">{summaryMetrics.trialing}</div>
          <div className="ab-kpi-footnote">Active trial days remaining</div>
        </div>

        <div className="ab-kpi-card">
          <div className="ab-kpi-label">
            <span>Pending Review</span>
            <Clock size={15} color="#f59e0b" />
          </div>
          <div className="ab-kpi-value">{summaryMetrics.pendingReview}</div>
          <div className="ab-kpi-footnote">Awaiting manual payment approval</div>
        </div>

        <div className="ab-kpi-card">
          <div className="ab-kpi-label">
            <span>Past Due / Grace Period</span>
            <AlertTriangle size={15} color="#f59e0b" />
          </div>
          <div className="ab-kpi-value">{summaryMetrics.pastDue}</div>
          <div className="ab-kpi-footnote">Pending renewal settlement</div>
        </div>
      </div>

      {/* ─── 4. TOOLBAR ─── */}
      <div className="ab-toolbar">
        <div className="ab-toolbar-left">
          {/* Target Entity Segmented Control */}
          <div className="ab-segmented-group">
            <button
              onClick={() => setEntityFilter('all')}
              className={`ab-segmented-btn ${entityFilter === 'all' ? 'active' : ''}`}
            >
              All Entities
            </button>
            <button
              onClick={() => setEntityFilter('doctor')}
              className={`ab-segmented-btn ${entityFilter === 'doctor' ? 'active' : ''}`}
            >
              <Stethoscope size={13} /> Doctor Practices
            </button>
            <button
              onClick={() => setEntityFilter('hospital')}
              className={`ab-segmented-btn ${entityFilter === 'hospital' ? 'active' : ''}`}
            >
              <Building2 size={13} /> Hospitals
            </button>
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ab-select"
          >
            <option value="">All Statuses</option>
            <option value="pending_review">Pending Review Only</option>
            <option value="active">Active Only</option>
            <option value="trialing">Trialing Only</option>
            <option value="past_due">Past Due Only</option>
            <option value="grace_period">Grace Period Only</option>
            <option value="canceled">Canceled Only</option>
            <option value="expired">Expired Only</option>
          </select>
        </div>

        <div className="ab-toolbar-right">
          <div className="ab-search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search subscriber name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ab-search-input"
            />
          </div>
        </div>
      </div>

      {/* ─── 5. ERROR STATE ─── */}
      {error && (
        <div className="ab-error-state" role="alert" aria-live="polite">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button onClick={loadSubscribers} className="ab-btn-secondary">Retry</button>
        </div>
      )}

      {/* ─── 6. SUBSCRIBERS TABLE ─── */}
      <div className="ab-card-table ab-fade-in">
        <div className="ab-table-responsive">
          <table className="ab-table" aria-busy={loading}>
            <thead>
              <tr>
                <th>Subscriber / Client</th>
                <th>Entity Type</th>
                <th>Enrolled Tier</th>
                <th>Status</th>
                <th>Current Period End</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="ab-skeleton-row">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}><div className="ab-skeleton ab-skeleton-text" /></td>
                    ))}
                  </tr>
                ))
              ) : subscribers.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="ab-empty-state">
                      <Users size={36} className="ab-empty-icon" />
                      <div className="ab-empty-title">No subscribers found</div>
                      <div className="ab-empty-sub">Try adjusting your filters or search query</div>
                    </div>
                  </td>
                </tr>
              ) : (
                subscribers.map((sub) => {
                  const isDoctor = (sub.entity_type || '').toLowerCase() === 'doctor'
                  return (
                    <tr key={sub.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              background: isDoctor ? 'rgba(59, 130, 246, 0.12)' : 'rgba(139, 92, 246, 0.12)',
                              color: isDoctor ? '#2563eb' : '#7c3aed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '13px',
                            }}
                          >
                            {isDoctor ? <Stethoscope size={16} /> : <Building2 size={16} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--ab-text)', fontSize: '13.5px' }}>
                              {sub.subscriber_name || 'Unnamed Account'}
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--ab-text-dim)' }}>
                              {sub.subscriber_email || sub.subscriber_phone || `ID #${sub.id}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`ab-badge ${isDoctor ? 'ab-badge-blue' : 'ab-badge-purple'}`}>
                          {sub.entity_type}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--ab-text)' }}>{sub.plan?.name || 'Default Tier'}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--ab-text-dim)' }}>
                          ৳{Number(sub.plan?.price || 0).toLocaleString()} • {sub.plan?.tier || 'starter'}
                        </div>
                      </td>
                      <td>{getStatusBadge(sub.status, sub)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--ab-text-muted)' }}>
                          <Calendar size={13} color="var(--ab-text-dim)" />
                          {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString() : 'Continuous'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => openDrawer(sub)}
                          className="ab-btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          aria-label="Open subscriber timeline"
                        >
                          <Eye size={13} /> Timeline
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 7. PAGINATION ─── */}
      {meta.last_page > 1 && (
        <div className="ab-pagination">
          <button
            className="ab-btn-secondary"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            ← Previous
          </button>
          <span className="ab-pagination-info">
            Page {meta.current_page || page} of {meta.last_page} &bull; {meta.total} total
          </span>
          <button
            className="ab-btn-secondary"
            onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
            disabled={page >= meta.last_page}
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      )}

      {/* ─── 8. LIFECYCLE TIMELINE & DETAIL DRAWER ─── */}
      {selectedSub && (
        <div className="ab-drawer-backdrop" onClick={closeDrawer}>
          <div className="ab-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="ab-drawer-header">
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--ab-text)' }}>
                  {selectedSub.subscriber_name}
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--ab-text-muted)', marginTop: '2px' }}>
                  {selectedSub.entity_type} Client • Subscription #{selectedSub.id}
                </div>
              </div>
              <button
                onClick={closeDrawer}
                style={{ background: 'transparent', border: 'none', color: 'var(--ab-text-muted)', cursor: 'pointer', padding: '4px' }}
                aria-label="Close drawer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="ab-drawer-body">
              {/* Approval Alerts */}
              {approvalError && (
                <div
                  role="alert"
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {approvalError}
                </div>
              )}

              {approvalSuccess && (
                <div
                  role="status"
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(0, 184, 117, 0.12)',
                    border: '1px solid rgba(0, 184, 117, 0.3)',
                    color: '#00b875',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {approvalSuccess}
                </div>
              )}

              {/* Account Quick Card */}
              <div style={{ background: 'var(--ab-card-header)', border: '1px solid var(--ab-border)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--ab-text-muted)' }}>Subscribed Tier</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--ab-text)' }}>{selectedSub.plan?.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--ab-text-muted)' }}>Status State</span>
                  <div>{getStatusBadge(selectedSub.status, selectedSub)}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--ab-text-muted)' }}>Cycle Price</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--ab-text)' }}>
                    ৳{Number(selectedSub.plan?.price || 0).toLocaleString()} / {selectedSub.billing_cycle || 'month'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: 'var(--ab-text-muted)' }}>Billing Period End</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ab-text)' }}>
                    {selectedSub.ends_at ? new Date(selectedSub.ends_at).toLocaleString() : 'Open / Continuous'}
                  </span>
                </div>
              </div>

              {/* ─── Payment Evidence Card ─── */}
              {selectedSub.payment_evidence && (
                <div style={{ background: 'var(--ab-card-header)', border: '1px solid var(--ab-border)', borderRadius: '12px', padding: '16px' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ab-text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={13} /> Payment Evidence
                    <span style={{
                      marginLeft: 'auto',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      background: selectedSub.payment_evidence.status === 'verified' ? 'rgba(16,185,129,0.12)' :
                                  selectedSub.payment_evidence.status === 'failed' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                      color: selectedSub.payment_evidence.status === 'verified' ? '#059669' :
                             selectedSub.payment_evidence.status === 'failed' ? '#dc2626' : '#d97706',
                    }}>
                      {selectedSub.payment_evidence.status?.replace('_', ' ')?.toUpperCase()}
                    </span>
                  </h3>

                  {[
                    ['Gateway', selectedSub.payment_evidence.gateway?.replace('_', ' ')?.toUpperCase()],
                    ['Transaction Ref', selectedSub.payment_evidence.transaction_reference],
                    ['Amount', selectedSub.payment_evidence.amount ? `৳${Number(selectedSub.payment_evidence.amount).toLocaleString()} ${selectedSub.payment_evidence.currency || 'BDT'}` : '—'],
                    ['Sender Number', selectedSub.payment_evidence.sender_number || '—'],
                    ['Receiver Number', selectedSub.payment_evidence.receiver_number || '—'],
                    ['Submitted At', selectedSub.payment_evidence.submitted_at ? new Date(selectedSub.payment_evidence.submitted_at).toLocaleString() : '—'],
                    ['Verified At', selectedSub.payment_evidence.verified_at ? new Date(selectedSub.payment_evidence.verified_at).toLocaleString() : 'Pending Review'],
                    ['Approver', selectedSub.payment_evidence.approver || '—'],
                    ['Audit Note', selectedSub.payment_evidence.audit_note || '—'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px', gap: '12px' }}>
                      <span style={{ fontSize: '11.5px', color: 'var(--ab-text-muted)', flexShrink: 0 }}>{label}</span>
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--ab-text)', textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
                    </div>
                  ))}

                  {/* Payment Slip Screenshot */}
                  {(slipBlobUrl || slipBlobLoading || selectedSub.payment_evidence.has_slip) && (
                    <div style={{ marginTop: '14px', borderTop: '1px solid var(--ab-border)', paddingTop: '12px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ab-text-muted)', display: 'block', marginBottom: '6px' }}>
                        Payment Proof Slip
                      </label>
                      <div style={{ border: '1px solid var(--ab-border)', borderRadius: '10px', overflow: 'hidden', textAlign: 'center', background: '#0f172a', minHeight: '140px', maxHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}>
                        {slipBlobLoading ? (
                          <div style={{ color: '#94a3b8', fontSize: '12px' }}>Loading payment slip...</div>
                        ) : slipBlobUrl ? (
                          <img
                            src={slipBlobUrl}
                            alt="Payment Proof"
                            style={{ maxHeight: '210px', maxWidth: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          <a
                            href={getAdminManualPaymentSlipUrl(selectedSub.payment_evidence.transaction_id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 14px',
                              borderRadius: '8px',
                              background: 'rgba(99,102,241,0.1)',
                              color: '#6366f1',
                              fontSize: '12px',
                              fontWeight: 700,
                              textDecoration: 'none',
                              border: '1px solid rgba(99,102,241,0.2)',
                            }}
                          >
                            <ExternalLink size={13} /> View Slip in New Tab
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Audit Note Input for Pending Manual Payment */}
                  {selectedSub.payment_evidence.status === 'pending' && (
                    <div style={{ marginTop: '14px', borderTop: '1px solid var(--ab-border)', paddingTop: '12px' }}>
                      <label className="ab-form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                        Audit Note for Verification *{' '}
                        <span style={{ fontWeight: 400, color: 'var(--ab-text-dim)' }}>
                          (Required before approving or rejecting)
                        </span>
                      </label>
                      <textarea
                        rows={2}
                        value={approvalNote}
                        onChange={(e) => setApprovalNote(e.target.value)}
                        placeholder="e.g. Verified transaction reference on bKash/bank statement; received full amount."
                        className="ab-form-textarea"
                        style={{ fontSize: '12px' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Lifecycle Events Timeline */}
              <div>
                <h3 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ab-text-muted)', marginBottom: '14px' }}>
                  Subscription Lifecycle Events Timeline
                </h3>

                {drawerLoading ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--ab-text-muted)' }}>
                    <RefreshCw size={18} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    Loading audit trail...
                  </div>
                ) : timeline.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--ab-text-muted)', fontSize: '13px' }}>
                    No audit events recorded for this subscription yet.
                  </div>
                ) : (
                  <div className="ab-timeline">
                    {timeline.map((event, idx) => (
                      <div key={idx} className="ab-timeline-item">
                        <div
                          className="ab-timeline-dot"
                          style={{
                            background:
                              event.type === 'success' ? '#00b875' :
                              event.type === 'danger' ? '#ef4444' :
                              event.type === 'warning' ? '#f59e0b' : '#3b82f6',
                          }}
                        />
                        <div className="ab-timeline-content">
                          <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--ab-text)' }}>{event.title}</div>
                          <div style={{ fontSize: '12px', color: 'var(--ab-text-muted)', marginTop: '2px' }}>{event.description}</div>
                          <div style={{ fontSize: '10.5px', color: 'var(--ab-text-dim)', marginTop: '4px' }}>
                            {new Date(event.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="ab-drawer-footer" style={{ flexDirection: 'column', gap: '8px' }}>
              {selectedSub.payment_evidence?.status === 'pending' ? (
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <button
                    onClick={() => handleApprovalAction('approve')}
                    className="ab-btn-primary"
                    style={{
                      flex: 2,
                      justifyContent: 'center',
                      background: '#00b875',
                      borderColor: '#00b875',
                      fontWeight: 700,
                    }}
                    disabled={approvalProcessing || !hasPermission('billing.manual.approve')}
                    title={!hasPermission('billing.manual.approve') ? 'Insufficient permissions' : 'Approve payment & activate subscription'}
                    aria-label="Approve subscription payment"
                  >
                    {approvalProcessing ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        <Check size={15} /> Approve &amp; Activate
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleApprovalAction('reject')}
                    className="ab-btn-secondary"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      color: '#ef4444',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      fontWeight: 700,
                    }}
                    disabled={approvalProcessing || !hasPermission('billing.manual.approve')}
                    title={!hasPermission('billing.manual.approve') ? 'Insufficient permissions' : 'Reject payment'}
                    aria-label="Reject subscription payment"
                  >
                    <X size={15} /> Reject
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <button
                    onClick={() => handleCancelSub(false)}
                    className="ab-btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', color: '#d97706' }}
                    disabled={!hasPermission('billing.manual.approve')}
                    title={!hasPermission('billing.manual.approve') ? 'Insufficient permissions' : 'Cancel at period end'}
                    aria-label="Cancel subscription at period end"
                  >
                    Cancel at Period End
                  </button>
                  <button
                    onClick={() => handleCancelSub(true)}
                    className="ab-btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    disabled={!hasPermission('billing.manual.approve')}
                    title={!hasPermission('billing.manual.approve') ? 'Insufficient permissions' : 'Cancel immediately'}
                    aria-label="Cancel subscription immediately"
                  >
                    Cancel Immediately
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  getAdminTransactions,
  verifyPaymentTransaction,
  approveAdminManualPayment,
  rejectAdminManualPayment,
  getAdminManualPaymentSlipUrl,
} from '../../../api/billingAdminApi'
import axiosInstance from '../../../api/axiosInstance'
import {
  Search,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  FileText,
  Check,
  Eye,
  Clock,
  Image as ImageIcon,
  CreditCard,
  Grid,
  Layers,
  Sparkles,
  Users,
  Receipt,
  Tag,
  Settings,
  ShieldCheck,
  X,
  ExternalLink,
  DollarSign,
  Smartphone,
  Building,
} from 'lucide-react'
import useDebounce from '../../../hooks/useDebounce'
import { useAuth } from '../../../context/AuthContext'
import '../../../styles/admin-billing.css'

export default function AdminTransactionsPage() {
  const { hasPermission } = useAuth()

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [gatewayFilter, setGatewayFilter] = useState('')
  const [fraudFilter, setFraudFilter] = useState(false)
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'manual_pending'
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({})

  const debouncedSearch = useDebounce(search, 400)

  // Verification & Audit Modal
  const [selectedTx, setSelectedTx] = useState(null)
  const [verificationNote, setVerificationNote] = useState('')
  const [actionType, setActionType] = useState(null) // 'approve' | 'reject' | 'details'
  const [slipModalUrl, setSlipModalUrl] = useState(null)
  const [slipLoading, setSlipLoading] = useState(false)
  const [actionProcessing, setActionProcessing] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [actionSuccess, setActionSuccess] = useState(null)

  const loadTransactions = async () => {
    try {
      setLoading(true)
      setActionError(null)
      const params = {
        search: debouncedSearch.trim() || undefined,
        gateway: activeTab === 'manual_pending' ? 'manual_offline' : gatewayFilter || undefined,
        has_fraud_alert: fraudFilter || undefined,
        page,
        per_page: 15,
      }
      if (activeTab === 'manual_pending') {
        params.status = 'pending'
      }
      const res = await getAdminTransactions(params)
      const resMeta = res.data?.meta || {}
      setMeta(resMeta)
      const list = res.data?.data || []
      setTransactions(Array.isArray(list) ? list : [])
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Failed to load transactions. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  // Load transactions when filters or page change
  useEffect(() => {
    loadTransactions()
  }, [activeTab, gatewayFilter, fraudFilter, page, debouncedSearch])

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [activeTab, gatewayFilter, fraudFilter, debouncedSearch])

  const fetchSlipBlob = async (txId) => {
    setSlipLoading(true)
    try {
      const res = await axiosInstance.get(`/admin/billing/manual-payments/${txId}/slip`, {
        responseType: 'blob'
      })
      const url = URL.createObjectURL(res.data)
      setSlipModalUrl(url)
    } catch (err) {
      console.error('Failed to load slip', err)
      setSlipModalUrl(null)
    } finally {
      setSlipLoading(false)
    }
  }

  // Open slip viewer
  const handleOpenSlip = (tx) => {
    setSelectedTx(tx)
    setActionType('details')
    fetchSlipBlob(tx.id)
  }

  const handleCloseModal = () => {
    if (slipModalUrl) {
      URL.revokeObjectURL(slipModalUrl)
      setSlipModalUrl(null)
    }
    setSelectedTx(null)
    setActionType(null)
    setVerificationNote('')
    setActionError(null)
    setActionSuccess(null)
  }

  // Handle Approve or Reject
  const handleManualAction = async () => {
    if (!selectedTx || !actionType) return
    if (!verificationNote.trim()) {
      alert(`Please enter a mandatory audit note before ${actionType === 'approve' ? 'approving' : 'rejecting'} this payment.`)
      return
    }

    setActionProcessing(true)
    setActionError(null)

    try {
      if (actionType === 'approve') {
        await approveAdminManualPayment(selectedTx.id, verificationNote.trim())
        setActionSuccess('Manual payment approved successfully! Subscription activated.')
      } else if (actionType === 'reject') {
        await rejectAdminManualPayment(selectedTx.id, verificationNote.trim())
        setActionSuccess('Manual payment rejected and invoice marked as void.')
      }
      setTimeout(() => {
        handleCloseModal()
        loadTransactions()
      }, 1500)
    } catch (err) {
      if (err.response?.status === 409) {
        setActionError('Conflict (409): This transaction has already been processed by another administrator session.')
      } else {
        const errorData = err.response?.data
        let errMsg = errorData?.message || `Failed to ${actionType} transaction.`
        if (errorData?.errors && typeof errorData.errors === 'object') {
          const firstKey = Object.keys(errorData.errors)[0]
          const firstErr = errorData.errors[firstKey]
          if (Array.isArray(firstErr) && firstErr.length > 0) {
            errMsg = `${errMsg} (${firstErr[0]})`
          } else if (typeof firstErr === 'string') {
            errMsg = `${errMsg} (${firstErr})`
          }
        }
        setActionError(errMsg)
      }
    } finally {
      setActionProcessing(false)
    }
  }

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalCount = transactions.length
    const pendingManual = transactions.filter(t => t.status === 'pending' && (t.gateway === 'manual_offline' || t.payment_method === 'manual_offline')).length
    const fraudAlerts = transactions.filter(t => t.has_fraud_alert || t.fraud_score > 50).length
    const totalVolume = transactions
      .filter(t => t.status === 'verified' || t.status === 'completed' || t.status === 'paid')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0)

    return { totalCount, pendingManual, fraudAlerts, totalVolume }
  }, [transactions])

  const getStatusBadge = (tx) => {
    if (tx.status === 'verified' || tx.status === 'completed' || tx.status === 'paid') {
      return <span className="ab-badge ab-badge-emerald"><CheckCircle2 size={11} /> Verified</span>
    }
    if (tx.status === 'pending') {
      return <span className="ab-badge ab-badge-amber"><span className="ab-dot ab-dot-pulse" style={{ background: '#f59e0b' }} /> Pending Audit</span>
    }
    if (tx.status === 'rejected' || tx.status === 'failed') {
      return <span className="ab-badge ab-badge-rose"><XCircle size={11} /> Rejected</span>
    }
    return <span className="ab-badge ab-badge-slate">{tx.status}</span>
  }

  return (
    <div className="ab-container">
      {/* ─── 1. PAGE HEADER ─── */}
      <div className="ab-header">
        <div>
          <h1 className="ab-title">
            Transactions &amp; Fraud Detection
            <span className="ab-title-badge">Security Guard</span>
          </h1>
          <p className="ab-subtitle">
            Audit digital gateway settlements, inspect protected manual bank slips, and monitor anomaly indicators.
          </p>
        </div>

        <div className="ab-header-actions">
          <button
            onClick={loadTransactions}
            className="ab-btn-refresh"
            title="Refresh Transactions"
            aria-label="Refresh transactions"
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
          <Layers size={14} /> Plans &amp; Tiers
        </Link>
        <Link to="/admin/billing/matrix" className="ab-nav-pill">
          <Sparkles size={14} /> Feature Matrix
        </Link>
        <Link to="/admin/billing/subscribers" className="ab-nav-pill">
          <Users size={14} /> Subscribers Roster
        </Link>
        <Link to="/admin/billing/invoices" className="ab-nav-pill">
          <Receipt size={14} /> Invoices Ledger
        </Link>
        <Link to="/admin/billing/transactions" className="ab-nav-pill active">
          <CreditCard size={14} /> Manual Transactions
          {summaryMetrics.pendingManual > 0 && (
            <span className="ab-nav-counter">{summaryMetrics.pendingManual}</span>
          )}
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
            <span>Total Transactions</span>
            <CreditCard size={15} color="#64748b" />
          </div>
          <div className="ab-kpi-value">{summaryMetrics.totalCount}</div>
          <div className="ab-kpi-footnote">Audit records logged in system</div>
        </div>

        <div className="ab-kpi-card">
          <div className="ab-kpi-label">
            <span>Pending Offline Slips</span>
            <Clock size={15} color="#f59e0b" />
          </div>
          <div className="ab-kpi-value" style={{ color: summaryMetrics.pendingManual > 0 ? '#f59e0b' : 'var(--ab-text)' }}>
            {summaryMetrics.pendingManual}
          </div>
          <div className="ab-kpi-footnote">Awaiting administrator verification</div>
        </div>

        <div className="ab-kpi-card">
          <div className="ab-kpi-label">
            <span>Settled Volume</span>
            <CheckCircle2 size={15} color="#00b875" />
          </div>
          <div className="ab-kpi-value" style={{ color: '#00b875' }}>
            ৳{summaryMetrics.totalVolume.toLocaleString()}
          </div>
          <div className="ab-kpi-footnote">Net successful customer inflow</div>
        </div>

        <div className="ab-kpi-card">
          <div className="ab-kpi-label">
            <span>Fraud Alerts / Anomalies</span>
            <ShieldAlert size={15} color="#ef4444" />
          </div>
          <div className="ab-kpi-value" style={{ color: summaryMetrics.fraudAlerts > 0 ? '#ef4444' : 'var(--ab-text)' }}>
            {summaryMetrics.fraudAlerts}
          </div>
          <div className="ab-kpi-footnote">Flagged for suspicious traits</div>
        </div>
      </div>

      {/* ─── 4. TABS & TOOLBAR ─── */}
      <div className="ab-toolbar">
        <div className="ab-toolbar-left">
          <div className="ab-segmented-group">
            <button
              onClick={() => setActiveTab('all')}
              className={`ab-segmented-btn ${activeTab === 'all' ? 'active' : ''}`}
            >
              All Payment Logs
            </button>
            <button
              onClick={() => setActiveTab('manual_pending')}
              className={`ab-segmented-btn ${activeTab === 'manual_pending' ? 'active' : ''}`}
            >
              <Clock size={13} />
              Pending Manual Verifications
              {summaryMetrics.pendingManual > 0 && (
                <span className="ab-counter-chip" style={{ background: '#f59e0b', color: '#fff' }}>
                  {summaryMetrics.pendingManual}
                </span>
              )}
            </button>
          </div>

          <select
            value={gatewayFilter}
            onChange={(e) => setGatewayFilter(e.target.value)}
            className="ab-select"
            disabled={activeTab === 'manual_pending'}
          >
            <option value="">All Payment Channels</option>
            <option value="bkash_checkout">bKash Checkout</option>
            <option value="nagad_direct">Nagad Direct</option>
            <option value="rocket">Rocket</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="manual_offline">Manual Slip Submission</option>
          </select>
        </div>

        <div className="ab-toolbar-right">
          <div className="ab-search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search reference, mobile, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ab-search-input"
              aria-label="Search transactions"
            />
          </div>
        </div>
      </div>

      {/* ─── 5. ERROR STATE (page-level, outside modal) ─── */}
      {actionError && !selectedTx && (
        <div className="ab-error-state" role="alert" aria-live="polite">
          <AlertTriangle size={20} />
          <span>{actionError}</span>
          <button onClick={loadTransactions} className="ab-btn-secondary">Retry</button>
        </div>
      )}

      {/* ─── 6. TRANSACTIONS TABLE ─── */}
      <div className="ab-card-table ab-fade-in">
        <div className="ab-table-responsive">
          <table className="ab-table" aria-busy={loading}>
            <thead>
              <tr>
                <th>Transaction Reference</th>
                <th>Channel / Gateway</th>
                <th>Payment Amount</th>
                <th>Status</th>
                <th>Security &amp; Fraud Risk</th>
                <th>Timestamp</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="ab-skeleton-row">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j}><div className="ab-skeleton ab-skeleton-text" /></td>
                    ))}
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="ab-empty-state">
                      <CreditCard size={36} className="ab-empty-icon" />
                      <div className="ab-empty-title">No transactions found</div>
                      <div className="ab-empty-sub">Try adjusting your filters or switch tabs</div>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isManual = tx.gateway === 'manual_offline' || tx.payment_method === 'manual_offline'
                  const hasFraud = tx.has_fraud_alert || (tx.fraud_score && tx.fraud_score > 50)
                  const canApprove = hasPermission('billing.manual.approve')
                  const refCode = tx.gateway_transaction_reference || tx.transaction_reference || tx.gateway_transaction_id || `TXN-${tx.id}`
                  const senderId = tx.sender_identifier || tx.sender_number

                  return (
                    <tr key={tx.id}>
                      <td>
                        <div style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--ab-text)', fontSize: '13px' }}>
                          {refCode}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--ab-text-dim)' }}>
                          {senderId ? `Sender: ${senderId}` : `ID #${tx.id}`}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isManual ? <Smartphone size={14} color="#f59e0b" /> : <CreditCard size={14} color="#3b82f6" />}
                          <span style={{ fontWeight: 600, fontSize: '12.5px' }}>
                            {tx.gateway_payload?.payment_method?.replace('_', ' ') || tx.gateway_title || tx.payment_method || tx.gateway || 'Manual'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--ab-text)' }}>
                          ৳{Number(tx.amount || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--ab-text-dim)' }}>{tx.currency || 'BDT'}</div>
                      </td>
                      <td>{getStatusBadge(tx)}</td>
                      <td>
                        {hasFraud ? (
                          <span className="ab-badge ab-badge-rose">
                            <ShieldAlert size={12} /> High Risk ({tx.fraud_score || 'Alert'})
                          </span>
                        ) : (
                          <span className="ab-badge ab-badge-emerald" style={{ opacity: 0.85 }}>
                            <ShieldCheck size={12} /> Clean
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--ab-text-muted)' }}>
                        {tx.created_at ? new Date(tx.created_at).toLocaleString() : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isManual && tx.status === 'pending' ? (
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setSelectedTx(tx)
                                setActionType('approve')
                                setVerificationNote('')
                                fetchSlipBlob(tx.id)
                              }}
                              className="ab-btn-primary"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              disabled={actionProcessing || !canApprove}
                              title={!canApprove ? 'Insufficient permissions' : undefined}
                              aria-label="Approve transaction"
                            >
                              <Check size={13} /> Verify
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTx(tx)
                                setActionType('reject')
                                setVerificationNote('')
                                fetchSlipBlob(tx.id)
                              }}
                              className="ab-btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '12px', color: '#ef4444' }}
                              disabled={actionProcessing || !canApprove}
                              title={!canApprove ? 'Insufficient permissions' : undefined}
                              aria-label="Reject transaction"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenSlip(tx)}
                            className="ab-btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            aria-label="View payment slip"
                          >
                            <Eye size={13} /> Inspect
                          </button>
                        )}
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

      {/* ─── 8. AUDIT / SLIP INSPECTION MODAL ─── */}
      {selectedTx && (
        <div className="ab-modal-backdrop" onClick={handleCloseModal}>
          <div className="ab-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ab-modal-header">
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--ab-text)' }}>
                  {actionType === 'approve'
                    ? 'Approve Manual Offline Payment'
                    : actionType === 'reject'
                    ? 'Reject Manual Payment Request'
                    : 'Transaction Audit Details'}
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--ab-text-muted)', marginTop: '2px' }}>
                  Ref: {selectedTx.gateway_transaction_reference || selectedTx.transaction_reference || `TXN-${selectedTx.id}`} • Amount: ৳{Number(selectedTx.amount).toLocaleString()}
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                style={{ background: 'transparent', border: 'none', color: 'var(--ab-text-muted)', cursor: 'pointer', padding: '4px' }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="ab-modal-body">
              {/* Alert Feedback */}
              {actionError && (
                <div
                  role="alert"
                  aria-live="polite"
                  style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}
                >
                  {actionError}
                </div>
              )}
              {actionSuccess && (
                <div
                  role="status"
                  aria-live="polite"
                  style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(0, 184, 117, 0.12)', border: '1px solid rgba(0, 184, 117, 0.3)', color: '#00b875', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}
                >
                  {actionSuccess}
                </div>
              )}

              {/* Payment Details Grid */}
              <div style={{ background: 'var(--ab-card-header)', border: '1px solid var(--ab-border)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px' }}>
                  <div>
                    <span style={{ color: 'var(--ab-text-muted)' }}>Channel:</span>{' '}
                    <strong style={{ textTransform: 'uppercase' }}>{selectedTx.gateway_payload?.payment_method?.replace('_', ' ') || selectedTx.gateway_title || selectedTx.payment_method || selectedTx.gateway}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ab-text-muted)' }}>Sender Number:</span>{' '}
                    <strong>{selectedTx.sender_identifier || selectedTx.sender_number || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ab-text-muted)' }}>Timestamp:</span>{' '}
                    <strong>{new Date(selectedTx.created_at).toLocaleString()}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ab-text-muted)' }}>Security Check:</span>{' '}
                    <strong>{selectedTx.has_fraud_alert ? 'Flagged Alert' : 'Normal'}</strong>
                  </div>
                </div>
              </div>

              {/* Slip Preview if available */}
              {(slipModalUrl || slipLoading || selectedTx.manual_payment_slip_path) && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="ab-form-label">Protected Payment Slip</label>
                  <div style={{ border: '1px solid var(--ab-border)', borderRadius: '10px', overflow: 'hidden', textAlign: 'center', background: '#0f172a', minHeight: '160px', maxHeight: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}>
                    {slipLoading ? (
                      <div style={{ color: '#94a3b8', fontSize: '12px' }}>Loading payment slip...</div>
                    ) : slipModalUrl ? (
                      <img
                        src={slipModalUrl}
                        alt="Deposit Slip"
                        style={{ maxHeight: '230px', maxWidth: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ color: '#94a3b8', fontSize: '12px' }}>No slip screenshot uploaded</div>
                    )}
                  </div>
                </div>
              )}

              {/* Mandatory Audit Note when approving or rejecting */}
              {(actionType === 'approve' || actionType === 'reject') && (
                <div>
                  <label className="ab-form-label">
                    Mandatory Audit Note *{' '}
                    <span style={{ fontWeight: 400, color: 'var(--ab-text-dim)' }}>
                      (Stored permanently with approver timestamp for compliance)
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={verificationNote}
                    onChange={(e) => setVerificationNote(e.target.value)}
                    placeholder={actionType === 'approve' ? 'e.g. Bank slip verified on corporate account; matches deposit.' : 'e.g. Invalid transaction ID; funds not found in bank balance.'}
                    className="ab-form-textarea"
                  />
                </div>
              )}
            </div>

            <div className="ab-modal-footer">
              <button
                type="button"
                onClick={handleCloseModal}
                className="ab-btn-secondary"
                disabled={actionProcessing}
                aria-label="Close modal"
              >
                Close
              </button>

              {(actionType === 'approve' || actionType === 'reject') && (
                <button
                  type="button"
                  onClick={handleManualAction}
                  className="ab-btn-primary"
                  style={{
                    background: actionType === 'approve' ? '#00b875' : '#ef4444',
                    borderColor: actionType === 'approve' ? '#00b875' : '#ef4444',
                  }}
                  disabled={actionProcessing || !verificationNote.trim()}
                >
                  {actionProcessing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Processing...
                    </>
                  ) : actionType === 'approve' ? (
                    <>
                      <Check size={15} /> Confirm &amp; Activate Subscription
                    </>
                  ) : (
                    <>
                      <X size={15} /> Confirm Rejection
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

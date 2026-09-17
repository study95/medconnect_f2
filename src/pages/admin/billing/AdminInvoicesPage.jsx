import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  getAdminInvoices,
  markInvoicePaid,
  voidInvoice,
  regenerateInvoice,
  sendInvoiceEmail,
} from '../../../api/billingAdminApi'
import {
  Search,
  Printer,
  Download,
  Mail,
  RefreshCw,
  Eye,
  CheckCircle2,
  Ban,
  Receipt,
  Grid,
  Layers,
  Sparkles,
  Users,
  CreditCard,
  Tag,
  Settings,
  Calendar,
  DollarSign,
  AlertCircle,
  AlertTriangle,
  X,
  FileText,
} from 'lucide-react'
import useDebounce from '../../../hooks/useDebounce'
import { useAuth } from '../../../context/AuthContext'
import '../../../styles/admin-billing.css'

export default function AdminInvoicesPage() {
  const { hasPermission } = useAuth()

  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [actionProcessing, setActionProcessing] = useState(false)
  const [actionMessage, setActionMessage] = useState(null)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({})

  const debouncedSearch = useDebounce(search, 400)

  const loadInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getAdminInvoices({
        search: debouncedSearch.trim() || undefined,
        status: statusFilter || undefined,
        page,
        per_page: 15,
      })
      const responseMeta = res.data?.meta || {}
      setMeta(responseMeta)
      const list = res.data?.data || []
      setInvoices(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Failed to load invoices', err)
      setError(err?.response?.data?.message || 'Failed to load invoices. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  // Main data-loading effect — reruns when filters or page changes
  useEffect(() => {
    loadInvoices()
  }, [statusFilter, page, debouncedSearch])

  // Reset to page 1 whenever filters/search change
  useEffect(() => {
    setPage(1)
  }, [statusFilter, debouncedSearch])

  const handleMarkPaid = async (inv) => {
    if (!window.confirm(`Mark Invoice ${inv.invoice_number} as PAID?`)) return
    try {
      setActionProcessing(true)
      await markInvoicePaid(inv.id)
      setActionMessage({ type: 'success', text: `Invoice ${inv.invoice_number} marked as PAID.` })
      loadInvoices()
      if (selectedInvoice?.id === inv.id) setSelectedInvoice(null)
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || 'Error marking invoice paid.' })
    } finally {
      setActionProcessing(false)
      setTimeout(() => setActionMessage(null), 4000)
    }
  }

  const handleRegenerate = async (inv) => {
    try {
      setActionProcessing(true)
      await regenerateInvoice(inv.id)
      setActionMessage({ type: 'success', text: `Invoice ${inv.invoice_number} recalculated & regenerated.` })
      loadInvoices()
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Error regenerating invoice.' })
    } finally {
      setActionProcessing(false)
      setTimeout(() => setActionMessage(null), 4000)
    }
  }

  const handleSendEmail = async (inv) => {
    try {
      setActionProcessing(true)
      await sendInvoiceEmail(inv.id)
      setActionMessage({ type: 'success', text: `Invoice ${inv.invoice_number} successfully dispatched to customer email!` })
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Error emailing invoice.' })
    } finally {
      setActionProcessing(false)
      setTimeout(() => setActionMessage(null), 4000)
    }
  }

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let totalGross = 0
    let totalCollected = 0
    let totalDue = 0
    let voidCount = 0

    invoices.forEach(inv => {
      const tot = Number(inv.total_amount || 0)
      totalGross += tot
      if (inv.status === 'paid') {
        totalCollected += tot
      } else if (inv.status === 'issued') {
        totalDue += Number(inv.balance_due ?? tot)
      } else if (inv.status === 'void') {
        voidCount++
      }
    })

    return { totalGross, totalCollected, totalDue, voidCount }
  }, [invoices])

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="ab-badge ab-badge-emerald"><span className="ab-dot" style={{ background: '#10b981' }} /> Paid</span>
      case 'issued':
        return <span className="ab-badge ab-badge-amber"><span className="ab-dot ab-dot-pulse" style={{ background: '#f59e0b' }} /> Issued / Due</span>
      case 'draft':
        return <span className="ab-badge ab-badge-blue">Draft</span>
      case 'void':
        return <span className="ab-badge ab-badge-slate">Void</span>
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
            Invoices & Billing Ledger
            <span className="ab-title-badge">Receivables</span>
          </h1>
          <p className="ab-subtitle">
            Generate, audit, email, and reconcile customer billing invoices across all subscribed practices.
          </p>
        </div>

        <div className="ab-header-actions">
          <button
            onClick={loadInvoices}
            className="ab-btn-refresh"
            title="Refresh Invoices"
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
        <Link to="/admin/billing/subscribers" className="ab-nav-pill">
          <Users size={14} /> Subscribers Roster
        </Link>
        <Link to="/admin/billing/invoices" className="ab-nav-pill active">
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
            <span>Gross Invoiced</span>
            <Receipt size={15} color="#64748b" />
          </div>
          <div className="ab-kpi-value">৳{summaryMetrics.totalGross.toLocaleString()}</div>
          <div className="ab-kpi-footnote">Total volume billed across accounts</div>
        </div>

        <div className="ab-kpi-card">
          <div className="ab-kpi-label">
            <span>Collected Cash Inflow</span>
            <CheckCircle2 size={15} color="#00b875" />
          </div>
          <div className="ab-kpi-value" style={{ color: '#00b875' }}>৳{summaryMetrics.totalCollected.toLocaleString()}</div>
          <div className="ab-kpi-footnote">Successfully settled transactions</div>
        </div>

        <div className="ab-kpi-card">
          <div className="ab-kpi-label">
            <span>Outstanding Receivables</span>
            <AlertCircle size={15} color="#f59e0b" />
          </div>
          <div className="ab-kpi-value" style={{ color: '#f59e0b' }}>৳{summaryMetrics.totalDue.toLocaleString()}</div>
          <div className="ab-kpi-footnote">Balance due on issued invoices</div>
        </div>

        <div className="ab-kpi-card">
          <div className="ab-kpi-label">
            <span>Voided / Written Off</span>
            <Ban size={15} color="#94a3b8" />
          </div>
          <div className="ab-kpi-value">{summaryMetrics.voidCount}</div>
          <div className="ab-kpi-footnote">Canceled or invalid invoices</div>
        </div>
      </div>

      {/* Action Message Banner */}
      {actionMessage && (
        <div
          className="ab-fade-in"
          role="status"
          aria-live="polite"
          style={{
            padding: '12px 18px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: actionMessage.type === 'success' ? 'rgba(0, 184, 117, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: actionMessage.type === 'success' ? '#00b875' : '#ef4444',
            border: `1px solid ${actionMessage.type === 'success' ? 'rgba(0, 184, 117, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          }}
        >
          {actionMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* ─── 4. TOOLBAR ─── */}
      <div className="ab-toolbar">
        <div className="ab-toolbar-left">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ab-select"
          >
            <option value="">All Invoice Statuses</option>
            <option value="paid">Paid</option>
            <option value="issued">Issued / Due</option>
            <option value="draft">Draft</option>
            <option value="void">Void</option>
            <option value="uncollectible">Uncollectible</option>
          </select>
        </div>

        <div className="ab-toolbar-right">
          <div className="ab-search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search invoice number, client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ab-search-input"
              aria-label="Search invoices"
            />
          </div>
        </div>
      </div>

      {/* ─── 5. ERROR STATE ─── */}
      {error && (
        <div className="ab-error-state" role="alert">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button onClick={loadInvoices} className="ab-btn-secondary">Retry</button>
        </div>
      )}

      {/* ─── 6. INVOICES TABLE ─── */}
      <div className="ab-card-table ab-fade-in">
        <div className="ab-table-responsive">
          <table className="ab-table" aria-busy={loading}>
            <thead>
              <tr>
                <th>Invoice Identifier</th>
                <th>Billed Customer</th>
                <th>Invoiced Amount</th>
                <th>Payment Status</th>
                <th>Issue Date / Due Date</th>
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
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="ab-empty-state">
                      <Receipt size={36} className="ab-empty-icon" />
                      <div className="ab-empty-title">No invoices found</div>
                      <div className="ab-empty-sub">Try a different status filter or search</div>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <div style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--ab-text)', fontSize: '13.5px' }}>
                        {inv.invoice_number}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ab-text-dim)' }}>ID #{inv.id}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--ab-text)' }}>{inv.subscriber_name || 'Client Account'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--ab-text-dim)' }}>{inv.entity_type} Account</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--ab-text)', fontSize: '14px' }}>
                        ৳{Number(inv.total_amount || 0).toLocaleString()}
                      </div>
                      {Number(inv.balance_due || 0) > 0 && (
                        <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>
                          Due: ৳{Number(inv.balance_due).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td>{getStatusBadge(inv.status)}</td>
                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--ab-text)' }}>
                        {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : '—'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ab-text-dim)' }}>
                        Due: {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'Immediate'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="ab-btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          title="View &amp; Print Document"
                          aria-label={`View invoice ${inv.invoice_number}`}
                        >
                          <Eye size={13} /> View
                        </button>
                        {inv.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkPaid(inv)}
                            className="ab-btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '12px', color: '#00b875' }}
                            title={!hasPermission('billing.invoices.view') ? 'Insufficient permissions' : 'Mark as Paid'}
                            disabled={actionProcessing || !hasPermission('billing.invoices.view')}
                            aria-label={`Mark invoice ${inv.invoice_number} as paid`}
                          >
                            <CheckCircle2 size={13} /> Settle
                          </button>
                        )}
                        <button
                          onClick={() => handleSendEmail(inv)}
                          className="ab-btn-secondary"
                          style={{ padding: '6px 8px', fontSize: '12px' }}
                          title={!hasPermission('billing.invoices.view') ? 'Insufficient permissions' : 'Dispatch Email Receipt'}
                          disabled={actionProcessing || !hasPermission('billing.invoices.view')}
                          aria-label={`Send email for invoice ${inv.invoice_number}`}
                        >
                          <Mail size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
      {/* ─── 6. INVOICE VIEWER MODAL ─── */}
      {selectedInvoice && (
        <div className="ab-modal-backdrop" onClick={() => setSelectedInvoice(null)}>
          <div className="ab-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ab-modal-header">
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--ab-text)' }}>
                  Tax Invoice {selectedInvoice.invoice_number}
                </h2>
                <div style={{ marginTop: '4px' }}>{getStatusBadge(selectedInvoice.status)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => window.print()}
                  className="ab-btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  <Printer size={13} /> Print
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--ab-text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="ab-modal-body">
              {/* Invoice Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', fontSize: '12.5px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ab-text-dim)', marginBottom: '4px' }}>
                    Billed Customer
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--ab-text)', fontSize: '14px' }}>
                    {selectedInvoice.subscriber_name}
                  </div>
                  <div style={{ color: 'var(--ab-text-muted)' }}>{selectedInvoice.entity_type} Client Account</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ab-text-dim)', marginBottom: '4px' }}>
                    Invoice Timeline
                  </div>
                  <div style={{ color: 'var(--ab-text)' }}>Issue: {new Date(selectedInvoice.issue_date).toLocaleDateString()}</div>
                  <div style={{ color: 'var(--ab-text)' }}>Due: {new Date(selectedInvoice.due_date).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Line Items Table */}
              <div style={{ border: '1px solid var(--ab-border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ background: 'var(--ab-card-header)', padding: '10px 14px', fontWeight: 700, fontSize: '12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--ab-border)' }}>
                  <span>Item Description</span>
                  <span>Amount</span>
                </div>
                <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Subscription Plan Entitlements & Services</span>
                  <span style={{ fontWeight: 700 }}>৳{Number(selectedInvoice.subtotal_amount || selectedInvoice.total_amount).toLocaleString()}</span>
                </div>
                {Number(selectedInvoice.discount_amount || 0) > 0 && (
                  <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#00b875', borderTop: '1px solid var(--ab-border)' }}>
                    <span>Coupon / Promotional Discount</span>
                    <span>-৳{Number(selectedInvoice.discount_amount).toLocaleString()}</span>
                  </div>
                )}
                {Number(selectedInvoice.tax_amount || 0) > 0 && (
                  <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--ab-text-muted)', borderTop: '1px solid var(--ab-border)' }}>
                    <span>Tax & VAT</span>
                    <span>+৳{Number(selectedInvoice.tax_amount).toLocaleString()}</span>
                  </div>
                )}
                <div style={{ background: 'var(--ab-card-header)', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '15px', borderTop: '1px solid var(--ab-border)', color: 'var(--ab-text)' }}>
                  <span>Total Amount Due</span>
                  <span>৳{Number(selectedInvoice.total_amount).toLocaleString()}</span>
                </div>
              </div>

              {/* Linked Payment Evidence */}
              {selectedInvoice.transactions && selectedInvoice.transactions.length > 0 && (
                <div style={{ border: '1px solid var(--ab-border)', borderRadius: '12px', padding: '14px', background: 'var(--ab-card-header)', marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ab-text-dim)', marginBottom: '8px' }}>
                    Linked Payment Transaction Evidence
                  </div>
                  {selectedInvoice.transactions.map((tx) => (
                    <div key={tx.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                      <div><span style={{ color: 'var(--ab-text-muted)' }}>Channel:</span> <strong>{tx.gateway}</strong></div>
                      <div><span style={{ color: 'var(--ab-text-muted)' }}>Txn Ref:</span> <strong style={{ fontFamily: 'monospace' }}>{tx.gateway_transaction_reference || 'N/A'}</strong></div>
                      <div><span style={{ color: 'var(--ab-text-muted)' }}>Sender:</span> <strong>{tx.sender_identifier || 'N/A'}</strong></div>
                      <div><span style={{ color: 'var(--ab-text-muted)' }}>State:</span> <strong style={{ textTransform: 'uppercase', color: tx.status === 'verified' ? '#059669' : '#d97706' }}>{tx.status}</strong></div>
                      {tx.verified_by_name && (
                        <div style={{ gridColumn: 'span 2' }}>
                          <span style={{ color: 'var(--ab-text-muted)' }}>Verified by:</span> <strong>{tx.verified_by_name}</strong> {tx.verified_at ? `on ${new Date(tx.verified_at).toLocaleString()}` : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleRegenerate(selectedInvoice)}
                  className="ab-btn-secondary"
                  style={{ fontSize: '12px' }}
                  disabled={actionProcessing}
                >
                  Recalculate & Regenerate
                </button>
                <button
                  type="button"
                  onClick={() => handleSendEmail(selectedInvoice)}
                  className="ab-btn-primary"
                  style={{ fontSize: '12px', padding: '8px 14px' }}
                  disabled={actionProcessing}
                >
                  <Mail size={13} /> Send Email Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

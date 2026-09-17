import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
} from '../../../api/billingAdminApi'
import {
  Plus,
  Tag,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Search,
  Grid,
  Layers,
  Sparkles,
  Users,
  Receipt,
  CreditCard,
  Settings,
  Calendar,
  DollarSign,
  Percent,
  X,
  Check,
  Building2,
  Stethoscope,
  AlertTriangle,
} from 'lucide-react'
import useDebounce from '../../../hooks/useDebounce'
import { useAuth } from '../../../context/AuthContext'
import '../../../styles/admin-billing.css'

export default function AdminCouponsPage() {
  const { hasPermission } = useAuth()

  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({})

  const debouncedSearch = useDebounce(search, 400)

  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    applies_to_entity: 'Doctor',
    max_redemptions: 100,
    valid_from: new Date().toISOString().slice(0, 10),
    valid_until: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    is_active: true,
  })

  const loadCoupons = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getAdminCoupons({
        search: debouncedSearch.trim() || undefined,
        page,
        per_page: 15,
      })
      const resMeta = res.data?.meta || {}
      setMeta(resMeta)
      const list = res.data?.data || res.data || []
      setCoupons(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Failed to load coupons', err)
      setError(err?.response?.data?.message || 'Failed to load coupons. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  // Main data-fetch effect: re-runs on page or debounced search change
  useEffect(() => {
    loadCoupons()
  }, [page, debouncedSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset to page 1 when search query changes
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const openCreate = () => {
    setEditingCoupon(null)
    setForm({
      code: '',
      discount_type: 'percentage',
      discount_value: 15,
      applies_to_entity: 'Doctor',
      max_redemptions: 50,
      valid_from: new Date().toISOString().slice(0, 10),
      valid_until: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      is_active: true,
    })
    setShowModal(true)
  }

  const openEdit = (cpn) => {
    setEditingCoupon(cpn)
    setForm({
      code: cpn.code,
      discount_type: cpn.discount_type,
      discount_value: cpn.discount_value,
      applies_to_entity: cpn.applies_to_entity || 'Doctor',
      max_redemptions: cpn.max_redemptions || 100,
      valid_from: cpn.valid_from ? cpn.valid_from.slice(0, 10) : new Date().toISOString().slice(0, 10),
      valid_until: cpn.valid_until ? cpn.valid_until.slice(0, 10) : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      is_active: Boolean(cpn.is_active),
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        discount_value: parseFloat(form.discount_value) || 0,
        max_redemptions: parseInt(form.max_redemptions) || 0,
      }

      if (editingCoupon) {
        await updateAdminCoupon(editingCoupon.id, payload)
      } else {
        await createAdminCoupon(payload)
      }
      setShowModal(false)
      loadCoupons()
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving promotional coupon.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Deactivate / Remove coupon "${coupon.code}"?`)) return
    try {
      await deleteAdminCoupon(coupon.id)
      loadCoupons()
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting coupon.')
    }
  }

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const total = coupons.length
    const active = coupons.filter(c => c.is_active).length
    const totalRedeemed = coupons.reduce((acc, c) => acc + (c.times_redeemed || 0), 0)
    const totalRevenue = coupons.reduce((acc, c) => acc + Number(c.revenue_generated || 0), 0)
    return { total, active, totalRedeemed, totalRevenue }
  }, [coupons])

  // Filtered coupons (client-side entity filter; search is server-side via debouncedSearch)
  const filteredCoupons = useMemo(() => {
    return coupons.filter(cpn => {
      if (entityFilter !== 'all' && (cpn.applies_to_entity || '').toLowerCase() !== entityFilter) {
        return false
      }
      return true
    })
  }, [coupons, entityFilter])

  return (
    <div className="ab-container">
      {/* ─── 1. PAGE HEADER ─── */}
      <div className="ab-header">
        <div>
          <h1 className="ab-title">
            Promotional Coupons &amp; Campaigns
            <span className="ab-title-badge">Discounts Engine</span>
          </h1>
          <p className="ab-subtitle">
            Create and track promotional vouchers, redemption capacities, campaign attribution, and net revenue.
          </p>
        </div>

        <div className="ab-header-actions">
          <button
            onClick={loadCoupons}
            className="ab-btn-refresh"
            title="Refresh Coupons"
            disabled={loading}
            aria-label="Refresh coupons list"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openCreate}
            className="ab-btn-primary"
            disabled={!hasPermission('billing.plans.manage')}
            title={!hasPermission('billing.plans.manage') ? 'Insufficient permissions' : undefined}
          >
            <Plus size={16} /> Create Coupon
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
        <Link to="/admin/billing/transactions" className="ab-nav-pill">
          <CreditCard size={14} /> Manual Transactions
        </Link>
        <Link to="/admin/billing/coupons" className="ab-nav-pill active">
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
            <span>Configured Vouchers</span>
            <Tag size={15} color="#8b5cf6" />
          </div>
          <div className="ab-kpi-value">{summaryMetrics.total}</div>
          <div className="ab-kpi-footnote">
            <span style={{ color: '#00b875', fontWeight: 700 }}>{summaryMetrics.active} Active</span> • {summaryMetrics.total - summaryMetrics.active} Inactive
          </div>
        </div>

        <div className="ab-kpi-card">
          <div className="ab-kpi-label">
            <span>Total Redemptions</span>
            <Users size={15} color="#3b82f6" />
          </div>
          <div className="ab-kpi-value">{summaryMetrics.totalRedeemed}</div>
          <div className="ab-kpi-footnote">Checkout applications by practices</div>
        </div>

        <div className="ab-kpi-card">
          <div className="ab-kpi-label">
            <span>Attributed Revenue</span>
            <DollarSign size={15} color="#00b875" />
          </div>
          <div className="ab-kpi-value" style={{ color: '#00b875' }}>
            ৳{summaryMetrics.totalRevenue.toLocaleString()}
          </div>
          <div className="ab-kpi-footnote">Net turnover generated by coupons</div>
        </div>

        <div className="ab-kpi-card">
          <div className="ab-kpi-label">
            <span>Campaign Success Rate</span>
            <CheckCircle2 size={15} color="#f59e0b" />
          </div>
          <div className="ab-kpi-value">
            {summaryMetrics.total > 0 ? Math.round((summaryMetrics.active / summaryMetrics.total) * 100) : 0}%
          </div>
          <div className="ab-kpi-footnote">Active campaigns ratio</div>
        </div>
      </div>

      {/* ─── 4. TOOLBAR ─── */}
      <div className="ab-toolbar">
        <div className="ab-toolbar-left">
          <div className="ab-segmented-group">
            <button
              onClick={() => setEntityFilter('all')}
              className={`ab-segmented-btn ${entityFilter === 'all' ? 'active' : ''}`}
            >
              All Audiences
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
        </div>

        <div className="ab-toolbar-right">
          <div className="ab-search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search coupon code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ab-search-input"
              aria-label="Search coupons by code"
            />
          </div>
        </div>
      </div>

      {/* ─── 5. ERROR STATE ─── */}
      {error && (
        <div className="ab-error-state" role="status" aria-live="polite">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button onClick={loadCoupons} className="ab-btn-secondary">Retry</button>
        </div>
      )}

      {/* ─── 6. COUPONS TABLE ─── */}
      <div className="ab-card-table ab-fade-in">
        <div className="ab-table-responsive">
          <table className="ab-table" aria-busy={loading}>
            <thead>
              <tr>
                <th>Voucher Code</th>
                <th>Discount Value</th>
                <th>Target Entity</th>
                <th>Usage &amp; Capacity</th>
                <th>Generated Revenue</th>
                <th>Validity Range</th>
                <th>Status</th>
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
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="ab-empty-state">
                      <Tag size={36} className="ab-empty-icon" />
                      <div className="ab-empty-title">No coupons found</div>
                      <div className="ab-empty-sub">Create your first coupon campaign to offer discounts</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((cpn) => {
                  const isPercent = cpn.discount_type === 'percentage'
                  const pctUsed = cpn.max_redemptions
                    ? Math.min(100, Math.round(((cpn.times_redeemed || 0) / cpn.max_redemptions) * 100))
                    : 0
                  return (
                    <tr key={cpn.id}>
                      <td>
                        <div style={{ fontFamily: 'monospace', fontWeight: 900, color: '#8b5cf6', fontSize: '14px', letterSpacing: '0.05em' }}>
                          {cpn.code}
                        </div>
                      </td>
                      <td>
                        <span className="ab-badge ab-badge-purple" style={{ fontSize: '12px' }}>
                          {isPercent ? `${cpn.discount_value}% OFF` : `৳${cpn.discount_value} FLAT`}
                        </span>
                      </td>
                      <td>
                        <span className="ab-badge ab-badge-blue">
                          {cpn.applies_to_entity || 'All Audiences'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--ab-text)' }}>
                          {cpn.times_redeemed || 0} / {cpn.max_redemptions ?? '∞'} ({pctUsed}%)
                        </div>
                        <div style={{ width: '110px', height: '5px', borderRadius: '999px', background: 'var(--ab-pill-bg)', marginTop: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pctUsed}%`, background: '#8b5cf6', borderRadius: '999px' }} />
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, color: '#00b875', fontSize: '13.5px' }}>
                          ৳{Number(cpn.revenue_generated || 0).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: 'var(--ab-text-muted)' }}>
                          {cpn.valid_until ? `Until ${new Date(cpn.valid_until).toLocaleDateString()}` : 'No Expiry'}
                        </div>
                      </td>
                      <td>
                        {cpn.is_active ? (
                          <span className="ab-badge ab-badge-emerald">Active</span>
                        ) : (
                          <span className="ab-badge ab-badge-slate">Inactive</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => openEdit(cpn)}
                            className="ab-btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            disabled={!hasPermission('billing.plans.manage')}
                            title={!hasPermission('billing.plans.manage') ? 'Insufficient permissions' : 'Edit coupon'}
                            aria-label={`Edit coupon ${cpn.code}`}
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(cpn)}
                            className="ab-btn-secondary"
                            style={{ padding: '6px 8px', fontSize: '12px', color: '#ef4444' }}
                            disabled={!hasPermission('billing.plans.manage')}
                            title={!hasPermission('billing.plans.manage') ? 'Insufficient permissions' : 'Remove coupon'}
                            aria-label={`Delete coupon ${cpn.code}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
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

      {/* ─── 8. CREATE / EDIT COUPON MODAL ─── */}
      {showModal && (
        <div className="ab-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="ab-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ab-modal-header">
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--ab-text)' }}>
                {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Promotional Campaign'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--ab-text-muted)', cursor: 'pointer', padding: '4px' }}
                aria-label="Close coupon form"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="ab-modal-body">
                <div className="ab-form-group">
                  <label className="ab-form-label">Promotional Voucher Code *</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SUMMER2026 or DOCTORPROMO"
                    className="ab-form-input"
                    style={{ fontFamily: 'monospace', fontWeight: 700 }}
                  />
                </div>

                <div className="ab-form-row">
                  <div className="ab-form-group">
                    <label className="ab-form-label">Discount Type *</label>
                    <select
                      value={form.discount_type}
                      onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                      className="ab-form-select"
                    >
                      <option value="percentage">Percentage Discount (%)</option>
                      <option value="fixed">Fixed Deduction (৳ BDT)</option>
                    </select>
                  </div>

                  <div className="ab-form-group">
                    <label className="ab-form-label">Discount Magnitude *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.discount_value}
                      onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                      className="ab-form-input"
                    />
                  </div>
                </div>

                <div className="ab-form-row">
                  <div className="ab-form-group">
                    <label className="ab-form-label">Target Entity</label>
                    <select
                      value={form.applies_to_entity}
                      onChange={(e) => setForm({ ...form, applies_to_entity: e.target.value })}
                      className="ab-form-select"
                    >
                      <option value="Doctor">Doctor Practices Only</option>
                      <option value="Hospital">Hospitals Only</option>
                      <option value="all">All Customer Entities</option>
                    </select>
                  </div>

                  <div className="ab-form-group">
                    <label className="ab-form-label">Capacity (Max Redemptions)</label>
                    <input
                      type="number"
                      value={form.max_redemptions}
                      onChange={(e) => setForm({ ...form, max_redemptions: e.target.value })}
                      className="ab-form-input"
                    />
                  </div>
                </div>

                <div className="ab-form-row">
                  <div className="ab-form-group">
                    <label className="ab-form-label">Valid From</label>
                    <input
                      type="date"
                      value={form.valid_from}
                      onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                      className="ab-form-input"
                    />
                  </div>

                  <div className="ab-form-group">
                    <label className="ab-form-label">Valid Until (Expiry Date)</label>
                    <input
                      type="date"
                      value={form.valid_until}
                      onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                      className="ab-form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                  <input
                    type="checkbox"
                    id="coupon_is_active"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#00b875' }}
                  />
                  <label htmlFor="coupon_is_active" style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ab-text)', cursor: 'pointer' }}>
                    Active Campaign (available for customer redemption)
                  </label>
                </div>
              </div>

              <div className="ab-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="ab-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !hasPermission('billing.plans.manage')}
                  title={!hasPermission('billing.plans.manage') ? 'Insufficient permissions' : undefined}
                  className="ab-btn-primary"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check size={15} /> Save Campaign
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  getAdminPlans,
  createAdminPlan,
  updateAdminPlan,
  deleteAdminPlan,
  getFeatureMatrix,
  updateFeatureMatrix,
} from '../../../api/billingAdminApi'
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Shield,
  RefreshCw,
  Search,
  Building2,
  Stethoscope,
  Grid,
  Table as TableIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  Users,
  CreditCard,
  Receipt,
  FileText,
  Tag,
  Settings,
  HelpCircle,
} from 'lucide-react'
import '../../../styles/admin-billing-plans.css'

export default function AdminPlansPage() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // View & Filtering
  const [viewMode, setViewMode] = useState('catalog') // 'catalog' | 'matrix'
  const [entityFilter, setEntityFilter] = useState('all') // 'all' | 'doctor' | 'hospital'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'inactive'
  const [searchQuery, setSearchQuery] = useState('')

  // Feature Matrix State
  const [matrixData, setMatrixData] = useState(null)
  const [matrixLoading, setMatrixLoading] = useState(false)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [modalTab, setModalTab] = useState('basics') // 'basics' | 'pricing' | 'features'
  const [saving, setSaving] = useState(false)

  // Form State
  const [form, setForm] = useState({
    name: '',
    slug: '',
    target_entity: 'doctor',
    tier: 'starter',
    price_monthly: 0,
    price_annual: 0,
    annual_discount_percentage: 20,
    currency: 'BDT',
    trial_period_days: 0,
    grace_period_days: 3,
    is_active: true,
    sort_order: 0,
    description: '',
    features: [],
  })

  // Load plans catalog
  const loadPlans = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getAdminPlans()
      // API returns { success: true, data: { data: [...] } } or { data: [...] }
      const plansList = res.data?.data || res.data || []
      setPlans(Array.isArray(plansList) ? plansList : [])
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load subscription plans')
    } finally {
      setLoading(false)
    }
  }

  // Load feature matrix
  const loadMatrix = async () => {
    try {
      setMatrixLoading(true)
      const res = await getFeatureMatrix()
      setMatrixData(res.data || null)
    } catch (err) {
      console.error('Failed to load feature matrix', err)
    } finally {
      setMatrixLoading(false)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [])

  useEffect(() => {
    if (viewMode === 'matrix' && !matrixData) {
      loadMatrix()
    }
  }, [viewMode])

  // Computed summary metrics
  const summaryMetrics = useMemo(() => {
    const total = plans.length
    const active = plans.filter(p => p.is_active).length
    const doctorPlans = plans.filter(p => (p.target_entity || '').toLowerCase() === 'doctor').length
    const hospitalPlans = plans.filter(p => (p.target_entity || '').toLowerCase() === 'hospital').length
    const totalSubscribers = plans.reduce((acc, p) => acc + (p.subscriptions_count || 0), 0)

    return { total, active, doctorPlans, hospitalPlans, totalSubscribers }
  }, [plans])

  // Filtered plans
  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      const entity = (plan.target_entity || '').toLowerCase()
      if (entityFilter !== 'all' && entity !== entityFilter) return false

      if (statusFilter === 'active' && !plan.is_active) return false
      if (statusFilter === 'inactive' && plan.is_active) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = (plan.name || '').toLowerCase().includes(q)
        const matchSlug = (plan.slug || '').toLowerCase().includes(q)
        const matchDesc = (plan.description || '').toLowerCase().includes(q)
        const matchTier = (plan.tier || '').toLowerCase().includes(q)
        if (!matchName && !matchSlug && !matchDesc && !matchTier) return false
      }

      return true
    })
  }, [plans, entityFilter, statusFilter, searchQuery])

  // Open Create Modal
  const openCreate = () => {
    setEditingPlan(null)
    setModalTab('basics')
    setForm({
      name: '',
      slug: '',
      target_entity: entityFilter === 'hospital' ? 'hospital' : 'doctor',
      tier: 'starter',
      price_monthly: 1000,
      price_annual: 9600,
      annual_discount_percentage: 20,
      currency: 'BDT',
      trial_period_days: 14,
      grace_period_days: 3,
      is_active: true,
      sort_order: (plans.length + 1) * 10,
      description: '',
      features: [
        { feature_key: 'prescriptions_limit', feature_name: 'Monthly Prescriptions', is_enabled: true, quota_limit: 500, reset_period: 'monthly' },
        { feature_key: 'chambers_limit', feature_name: 'Practice Chambers', is_enabled: true, quota_limit: 3, reset_period: 'never' },
        { feature_key: 'telemedicine_enabled', feature_name: 'Telemedicine Video Calls', is_enabled: true, quota_limit: -1, reset_period: 'monthly' },
      ],
    })
    setShowModal(true)
  }

  // Open Edit Modal
  const openEdit = (plan) => {
    setEditingPlan(plan)
    setModalTab('basics')
    
    const monthlyPrice = Number(plan.price_monthly ?? plan.price ?? 0)
    const annualPrice = Number(plan.price_annual ?? (monthlyPrice * 12 * 0.8))
    const discount = Number(plan.annual_discount_percentage ?? 20)

    setForm({
      name: plan.name || '',
      slug: plan.slug || '',
      target_entity: (plan.target_entity || 'doctor').toLowerCase(),
      tier: (plan.tier || 'starter').toLowerCase(),
      price_monthly: monthlyPrice,
      price_annual: annualPrice,
      annual_discount_percentage: discount,
      currency: plan.currency || 'BDT',
      trial_period_days: Number(plan.trial_period_days ?? 0),
      grace_period_days: Number(plan.grace_period_days ?? 3),
      is_active: Boolean(plan.is_active),
      sort_order: Number(plan.sort_order ?? 0),
      description: plan.description || '',
      features: Array.isArray(plan.features) ? plan.features.map(f => ({
        feature_key: f.feature_key,
        feature_name: f.feature_name || f.feature_key,
        is_enabled: Boolean(f.is_enabled),
        quota_limit: Number(f.quota_limit ?? -1),
        reset_period: f.reset_period || 'monthly',
      })) : [],
    })
    setShowModal(true)
  }

  // Handle monthly price change and auto-calc annual price
  const handleMonthlyPriceChange = (val) => {
    const monthly = parseFloat(val) || 0
    const discount = parseFloat(form.annual_discount_percentage) || 20
    const calculatedAnnual = Math.round(monthly * 12 * (1 - discount / 100))
    setForm(prev => ({
      ...prev,
      price_monthly: monthly,
      price_annual: calculatedAnnual,
    }))
  }

  // Add Feature Row in Modal
  const addFeatureRow = () => {
    setForm(prev => ({
      ...prev,
      features: [
        ...prev.features,
        {
          feature_key: `feature_${prev.features.length + 1}`,
          feature_name: 'New Entitlement',
          is_enabled: true,
          quota_limit: -1,
          reset_period: 'monthly',
        },
      ],
    }))
  }

  // Remove Feature Row
  const removeFeatureRow = (index) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }

  // Update Feature Row
  const updateFeatureRow = (index, field, value) => {
    setForm(prev => {
      const updated = [...prev.features]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, features: updated }
    })
  }

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug ? form.slug.trim() : undefined,
        target_entity: form.target_entity.toLowerCase(),
        tier: form.tier.toLowerCase(),
        price_monthly: parseFloat(form.price_monthly) || 0,
        price_annual: parseFloat(form.price_annual) || 0,
        annual_discount_percentage: parseFloat(form.annual_discount_percentage) || 0,
        trial_period_days: parseInt(form.trial_period_days) || 0,
        grace_period_days: parseInt(form.grace_period_days) || 3,
        currency: 'BDT',
        is_active: Boolean(form.is_active),
        sort_order: parseInt(form.sort_order) || 0,
        description: form.description ? form.description.trim() : '',
        features: form.features.map(f => ({
          feature_key: f.feature_key.trim(),
          feature_name: f.feature_name.trim(),
          is_enabled: Boolean(f.is_enabled),
          quota_limit: parseInt(f.quota_limit),
          reset_period: f.reset_period || 'monthly',
        })),
      }

      if (editingPlan) {
        await updateAdminPlan(editingPlan.id, payload)
      } else {
        await createAdminPlan(payload)
      }

      setShowModal(false)
      loadPlans()
      if (viewMode === 'matrix') loadMatrix()
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error saving plan')
    } finally {
      setSaving(false)
    }
  }

  // Quick Toggle Plan Status
  const handleToggleStatus = async (plan) => {
    try {
      await updateAdminPlan(plan.id, {
        is_active: !plan.is_active,
      })
      loadPlans()
    } catch (err) {
      alert(err.response?.data?.message || 'Error toggling plan status')
    }
  }

  // Delete Plan
  const handleDelete = async (plan) => {
    if (!window.confirm(`Are you sure you want to delete the plan "${plan.name}"?\n\nPlans with active subscribers cannot be deleted and should be deactivated instead.`)) {
      return
    }
    try {
      await deleteAdminPlan(plan.id)
      loadPlans()
      if (viewMode === 'matrix') loadMatrix()
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting plan')
    }
  }

  return (
    <div className="abp-container">
      {/* ─── 1. PAGE HEADER ─── */}
      <div className="abp-header">
        <div>
          <h1 className="abp-title">
            Subscription Plans & Tiers
            <span className="abp-title-badge">Pricing Engine</span>
          </h1>
          <p className="abp-subtitle">
            Configure Doctor practice and Hospital enterprise subscription tiers, billing cycles, quotas, and feature entitlements.
          </p>
        </div>

        <div className="abp-header-actions">
          <button
            onClick={() => { loadPlans(); if (viewMode === 'matrix') loadMatrix(); }}
            className="abp-btn-refresh"
            title="Refresh Catalog"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openCreate}
            className="abp-btn-primary"
          >
            <Plus size={16} /> Create Plan
          </button>
        </div>
      </div>

      {/* ─── 2. QUICK NAVIGATION BAR ─── */}
      <nav className="abp-quick-nav">
        <Link to="/admin/billing/dashboard" className="abp-nav-pill">
          <Grid size={14} /> Analytics Dashboard
        </Link>
        <Link to="/admin/billing/plans" className="abp-nav-pill active">
          <Layers size={14} /> Plans & Tiers
        </Link>
        <Link to="/admin/billing/subscribers" className="abp-nav-pill">
          <Users size={14} /> Subscribers Roster
        </Link>
        <Link to="/admin/billing/invoices" className="abp-nav-pill">
          <Receipt size={14} /> Invoices Ledger
        </Link>
        <Link to="/admin/billing/transactions" className="abp-nav-pill">
          <CreditCard size={14} /> Manual Transactions
        </Link>
        <Link to="/admin/billing/coupons" className="abp-nav-pill">
          <Tag size={14} /> Discount Coupons
        </Link>
        <Link to="/admin/billing/settings" className="abp-nav-pill">
          <Settings size={14} /> Billing Config
        </Link>
      </nav>

      {/* ─── 3. KPI METRICS DECK ─── */}
      <div className="abp-kpi-deck">
        <div className="abp-kpi-card">
          <div className="abp-kpi-label">
            <span>Total Catalog Plans</span>
            <Layers size={15} color="#64748b" />
          </div>
          <div className="abp-kpi-value">{summaryMetrics.total}</div>
          <div className="abp-kpi-footnote">
            <span style={{ color: '#00b875', fontWeight: 700 }}>{summaryMetrics.active} Active</span>
            <span>• {summaryMetrics.total - summaryMetrics.active} Inactive</span>
          </div>
        </div>

        <div className="abp-kpi-card">
          <div className="abp-kpi-label">
            <span>Doctor Practice Tiers</span>
            <Stethoscope size={15} color="#3b82f6" />
          </div>
          <div className="abp-kpi-value">{summaryMetrics.doctorPlans}</div>
          <div className="abp-kpi-footnote">
            Individual & group medical practice plans
          </div>
        </div>

        <div className="abp-kpi-card">
          <div className="abp-kpi-label">
            <span>Hospital Enterprise Tiers</span>
            <Building2 size={15} color="#8b5cf6" />
          </div>
          <div className="abp-kpi-value">{summaryMetrics.hospitalPlans}</div>
          <div className="abp-kpi-footnote">
            Institutional hospital & clinic subscriptions
          </div>
        </div>

        <div className="abp-kpi-card">
          <div className="abp-kpi-label">
            <span>Total Active Subscribers</span>
            <Users size={15} color="#00b875" />
          </div>
          <div className="abp-kpi-value">{summaryMetrics.totalSubscribers}</div>
          <div className="abp-kpi-footnote">
            Enrolled practices across all active tiers
          </div>
        </div>
      </div>

      {/* ─── 4. TOOLBAR (FILTER / SEARCH / VIEW SWITCHER) ─── */}
      <div className="abp-toolbar">
        <div className="abp-toolbar-left">
          {/* Target Entity Segmented Control */}
          <div className="abp-segmented-group">
            <button
              onClick={() => setEntityFilter('all')}
              className={`abp-segmented-btn ${entityFilter === 'all' ? 'active' : ''}`}
            >
              All Entities
              <span className="abp-counter-chip">{summaryMetrics.total}</span>
            </button>
            <button
              onClick={() => setEntityFilter('doctor')}
              className={`abp-segmented-btn ${entityFilter === 'doctor' ? 'active' : ''}`}
            >
              <Stethoscope size={13} />
              Doctor Practices
              <span className="abp-counter-chip">{summaryMetrics.doctorPlans}</span>
            </button>
            <button
              onClick={() => setEntityFilter('hospital')}
              className={`abp-segmented-btn ${entityFilter === 'hospital' ? 'active' : ''}`}
            >
              <Building2 size={13} />
              Hospital Enterprises
              <span className="abp-counter-chip">{summaryMetrics.hospitalPlans}</span>
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="abp-select-filter"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <div className="abp-toolbar-right">
          {/* Search Box */}
          <div className="abp-search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search plans, slugs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="abp-search-input"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="abp-segmented-group">
            <button
              onClick={() => setViewMode('catalog')}
              className={`abp-segmented-btn ${viewMode === 'catalog' ? 'active' : ''}`}
              title="Catalog Cards View"
            >
              <Grid size={14} /> Catalog
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`abp-segmented-btn ${viewMode === 'matrix' ? 'active' : ''}`}
              title="Feature Entitlements Matrix"
            >
              <TableIcon size={14} /> Feature Matrix
            </button>
          </div>
        </div>
      </div>

      {/* ─── 5. MAIN CONTENT AREA ─── */}
      {loading ? (
        <div className="abp-plans-grid">
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '380px', borderRadius: '16px', background: 'var(--abp-card-bg)', border: '1px solid var(--abp-border)' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ padding: '32px', textAlign: 'center', background: 'var(--abp-card-bg)', borderRadius: '16px', border: '1px solid #ef4444' }}>
          <AlertCircle size={36} color="#ef4444" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700 }}>Failed to Load Plans</h3>
          <p style={{ color: 'var(--abp-text-muted)', fontSize: '13px', margin: '0 0 16px 0' }}>{error}</p>
          <button onClick={loadPlans} className="abp-btn-primary" style={{ margin: '0 auto' }}>
            <RefreshCw size={14} /> Retry Loading
          </button>
        </div>
      ) : viewMode === 'catalog' ? (
        /* CATALOG CARDS VIEW */
        filteredPlans.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--abp-card-bg)', borderRadius: '16px', border: '1px solid var(--abp-border)' }}>
            <Shield size={44} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 700 }}>No Subscription Plans Found</h3>
            <p style={{ color: 'var(--abp-text-muted)', fontSize: '13.5px', maxWidth: '400px', margin: '0 auto 18px auto' }}>
              No plans matched your active filter or search query. Create a new plan or adjust your filters.
            </p>
            <button onClick={openCreate} className="abp-btn-primary" style={{ margin: '0 auto' }}>
              <Plus size={15} /> Create Plan
            </button>
          </div>
        ) : (
          <div className="abp-plans-grid abp-fade-in">
            {filteredPlans.map(plan => {
              const tierClass = `tier-${(plan.tier || 'starter').toLowerCase()}`
              const isDoctor = (plan.target_entity || '').toLowerCase() === 'doctor'
              const monthly = Number(plan.price_monthly ?? plan.price ?? 0)
              const annual = Number(plan.price_annual ?? (monthly * 12 * 0.8))
              const discount = Number(plan.annual_discount_percentage ?? 20)
              const features = Array.isArray(plan.features) ? plan.features : []

              return (
                <div key={plan.id} className={`abp-card ${tierClass}`}>
                  <div className="abp-card-top-bar" />

                  <div className="abp-card-body">
                    {/* Meta pills */}
                    <div className="abp-card-meta">
                      <span className={`abp-entity-pill ${isDoctor ? 'abp-entity-doctor' : 'abp-entity-hospital'}`}>
                        {isDoctor ? <Stethoscope size={12} /> : <Building2 size={12} />}
                        {isDoctor ? 'Doctor Practice' : 'Hospital'} • {plan.tier}
                      </span>
                      <button
                        onClick={() => handleToggleStatus(plan)}
                        className={`abp-status-pill ${plan.is_active ? 'abp-status-active' : 'abp-status-inactive'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Click to toggle status"
                      >
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    {/* Title & Slug */}
                    <h3 className="abp-card-title">
                      <span>{plan.name}</span>
                      <span className="abp-card-slug">{plan.slug}</span>
                    </h3>

                    {/* Description */}
                    <p className="abp-card-desc">
                      {plan.description || 'Enterprise healthcare tier equipped with automated practice workflow tools and real-time patient care modules.'}
                    </p>

                    {/* Pricing Box */}
                    <div className="abp-pricing-box">
                      <div className="abp-price-row">
                        <div>
                          <span className="abp-price-main">৳{monthly.toLocaleString()}</span>
                          <span className="abp-price-cycle">/ month</span>
                        </div>
                        {plan.trial_period_days > 0 && (
                          <span className="abp-discount-tag" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' }}>
                            {plan.trial_period_days}d Free Trial
                          </span>
                        )}
                      </div>

                      <div className="abp-price-annual-row">
                        <span>Annual Billing: <strong>৳{annual.toLocaleString()}/yr</strong></span>
                        {discount > 0 && (
                          <span className="abp-discount-tag">Save {discount}%</span>
                        )}
                      </div>
                    </div>

                    {/* Highlight Metrics */}
                    <div className="abp-plan-metrics">
                      <div className="abp-plan-metric-pill">
                        <strong>{plan.subscriptions_count ?? 0}</strong>
                        Subscribers
                      </div>
                      <div className="abp-plan-metric-pill">
                        <strong>{plan.features_count ?? features.length}</strong>
                        Entitlements
                      </div>
                    </div>

                    {/* Features Preview List */}
                    <div className="abp-features-header">
                      <span>Feature Entitlements</span>
                      <span>Quota</span>
                    </div>

                    <ul className="abp-features-list">
                      {features.length === 0 ? (
                        <li className="abp-feature-item" style={{ color: 'var(--abp-text-dim)', fontStyle: 'italic' }}>
                          Standard platform access
                        </li>
                      ) : (
                        features.slice(0, 4).map((feat, idx) => (
                          <li key={idx} className="abp-feature-item">
                            <span className="abp-feature-name">
                              <CheckCircle2 size={13} color="#00b875" />
                              {feat.feature_name || feat.feature_key}
                            </span>
                            <span className="abp-feature-quota">
                              {feat.quota_limit === -1 ? 'Unlimited' : feat.quota_limit}
                            </span>
                          </li>
                        ))
                      )}
                      {features.length > 4 && (
                        <li className="abp-feature-item" style={{ color: 'var(--abp-text-dim)', fontSize: '11px', paddingTop: '2px' }}>
                          + {features.length - 4} more entitlements...
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="abp-card-footer">
                    <button
                      onClick={() => openEdit(plan)}
                      className="abp-btn-edit"
                    >
                      <Edit2 size={13} /> Edit Tier
                    </button>
                    <button
                      onClick={() => handleDelete(plan)}
                      className="abp-btn-delete"
                      title="Delete Plan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* FEATURE MATRIX VIEW */
        <div className="abp-matrix-card abp-fade-in">
          <div className="abp-matrix-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Feature Entitlements Comparison Matrix</h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: 'var(--abp-text-muted)' }}>
                Compare and verify feature limits, quotas, and enablement flags across all configured subscription plans.
              </p>
            </div>
            <button
              onClick={loadMatrix}
              className="abp-btn-refresh"
              title="Refresh Matrix"
              disabled={matrixLoading}
            >
              <RefreshCw size={14} className={matrixLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="abp-table-responsive">
            {matrixLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--abp-text-muted)' }}>
                Loading entitlements matrix...
              </div>
            ) : !matrixData || !matrixData.matrix || matrixData.matrix.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--abp-text-muted)' }}>
                No feature matrix data found. Configure features within plans to generate matrix.
              </div>
            ) : (
              <table className="abp-matrix-table">
                <thead>
                  <tr>
                    <th className="abp-matrix-feature-col">Feature Entitlement</th>
                    {matrixData.plans.map(p => (
                      <th key={p.id} style={{ textAlign: 'center' }}>
                        <div>{p.name}</div>
                        <div style={{ fontSize: '10px', textTransform: 'none', color: 'var(--abp-text-dim)', fontWeight: 500 }}>
                          ৳{Number(p.price).toLocaleString()} • {p.target_entity}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixData.matrix.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td className="abp-matrix-feature-col">
                        <div>{row.feature_name}</div>
                        <div className="abp-matrix-feature-key">{row.feature_key}</div>
                      </td>
                      {matrixData.plans.map(p => {
                        const val = row.plans[p.id]
                        if (!val || !val.is_enabled) {
                          return (
                            <td key={p.id} style={{ textAlign: 'center' }}>
                              <span className="abp-quota-badge abp-quota-disabled">
                                <X size={12} /> Excluded
                              </span>
                            </td>
                          )
                        }
                        if (val.is_unlimited || val.quota_limit === -1) {
                          return (
                            <td key={p.id} style={{ textAlign: 'center' }}>
                              <span className="abp-quota-badge abp-quota-unlimited">
                                <Check size={12} /> Unlimited
                              </span>
                            </td>
                          )
                        }
                        return (
                          <td key={p.id} style={{ textAlign: 'center' }}>
                            <span className="abp-quota-badge abp-quota-numeric">
                              {val.quota_limit} / {val.reset_period || 'mo'}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─── 6. CREATE / EDIT PLAN MODAL ─── */}
      {showModal && (
        <div className="abp-modal-backdrop">
          <div className="abp-modal-content">
            {/* Modal Header */}
            <div className="abp-modal-header">
              <h2 className="abp-modal-title">
                {editingPlan ? `Edit Tier: ${editingPlan.name}` : 'Configure New Subscription Plan'}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="abp-modal-close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="abp-modal-tabs">
              <button
                type="button"
                onClick={() => setModalTab('basics')}
                className={`abp-modal-tab ${modalTab === 'basics' ? 'active' : ''}`}
              >
                1. Plan Information
              </button>
              <button
                type="button"
                onClick={() => setModalTab('pricing')}
                className={`abp-modal-tab ${modalTab === 'pricing' ? 'active' : ''}`}
              >
                2. Pricing & Terms
              </button>
              <button
                type="button"
                onClick={() => setModalTab('features')}
                className={`abp-modal-tab ${modalTab === 'features' ? 'active' : ''}`}
              >
                3. Feature Entitlements ({form.features.length})
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="abp-modal-body">
                {/* TAB 1: BASICS */}
                {modalTab === 'basics' && (
                  <div className="abp-fade-in">
                    <div className="abp-form-group">
                      <label className="abp-form-label">Plan Display Name *</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Professional Practice Suite"
                        className="abp-form-input"
                      />
                    </div>

                    <div className="abp-form-row">
                      <div className="abp-form-group">
                        <label className="abp-form-label">Target Audience / Entity *</label>
                        <select
                          value={form.target_entity}
                          onChange={e => setForm({ ...form, target_entity: e.target.value })}
                          className="abp-form-select"
                        >
                          <option value="doctor">Doctor Practice</option>
                          <option value="hospital">Hospital Enterprise</option>
                        </select>
                      </div>

                      <div className="abp-form-group">
                        <label className="abp-form-label">Pricing Tier Level *</label>
                        <select
                          value={form.tier}
                          onChange={e => setForm({ ...form, tier: e.target.value })}
                          className="abp-form-select"
                        >
                          <option value="free">Free Tier</option>
                          <option value="starter">Starter</option>
                          <option value="professional">Professional</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </div>
                    </div>

                    <div className="abp-form-row">
                      <div className="abp-form-group">
                        <label className="abp-form-label">URL Slug (System Identifier)</label>
                        <input
                          type="text"
                          value={form.slug}
                          onChange={e => setForm({ ...form, slug: e.target.value })}
                          placeholder="leave empty to auto-generate"
                          className="abp-form-input"
                        />
                      </div>

                      <div className="abp-form-group">
                        <label className="abp-form-label">Sort Order (Display Priority)</label>
                        <input
                          type="number"
                          value={form.sort_order}
                          onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                          className="abp-form-input"
                        />
                      </div>
                    </div>

                    <div className="abp-form-group">
                      <label className="abp-form-label">Public Description</label>
                      <textarea
                        rows={3}
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        placeholder="Brief marketing or feature summary visible on the checkout & pricing matrix..."
                        className="abp-form-textarea"
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                      <input
                        type="checkbox"
                        id="plan_is_active"
                        checked={form.is_active}
                        onChange={e => setForm({ ...form, is_active: e.target.checked })}
                        style={{ width: '16px', height: '16px', accentColor: '#00b875' }}
                      />
                      <label htmlFor="plan_is_active" style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--abp-text)', cursor: 'pointer' }}>
                        Active Plan (publicly available for subscription & upgrades)
                      </label>
                    </div>
                  </div>
                )}

                {/* TAB 2: PRICING & TERMS */}
                {modalTab === 'pricing' && (
                  <div className="abp-fade-in">
                    <div className="abp-form-row">
                      <div className="abp-form-group">
                        <label className="abp-form-label">Monthly Price (BDT) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={form.price_monthly}
                          onChange={e => handleMonthlyPriceChange(e.target.value)}
                          className="abp-form-input"
                        />
                      </div>

                      <div className="abp-form-group">
                        <label className="abp-form-label">Annual Discount (%)</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={form.annual_discount_percentage}
                          onChange={e => {
                            const disc = parseFloat(e.target.value) || 0
                            const monthly = parseFloat(form.price_monthly) || 0
                            setForm({
                              ...form,
                              annual_discount_percentage: disc,
                              price_annual: Math.round(monthly * 12 * (1 - disc / 100)),
                            })
                          }}
                          className="abp-form-input"
                        />
                      </div>
                    </div>

                    <div className="abp-form-group">
                      <label className="abp-form-label">Annual Price (BDT)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.price_annual}
                        onChange={e => setForm({ ...form, price_annual: parseFloat(e.target.value) || 0 })}
                        className="abp-form-input"
                      />
                      <div style={{ fontSize: '11.5px', color: 'var(--abp-text-dim)', marginTop: '4px' }}>
                        Calculated automatically based on discount, or enter a custom annual price.
                      </div>
                    </div>

                    <div className="abp-form-row">
                      <div className="abp-form-group">
                        <label className="abp-form-label">Free Trial Period (Days)</label>
                        <input
                          type="number"
                          min="0"
                          value={form.trial_period_days}
                          onChange={e => setForm({ ...form, trial_period_days: parseInt(e.target.value) || 0 })}
                          placeholder="0 for immediate billing"
                          className="abp-form-input"
                        />
                      </div>

                      <div className="abp-form-group">
                        <label className="abp-form-label">Grace Period (Days)</label>
                        <input
                          type="number"
                          min="0"
                          value={form.grace_period_days}
                          onChange={e => setForm({ ...form, grace_period_days: parseInt(e.target.value) || 3 })}
                          className="abp-form-input"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: FEATURES & ENTITLEMENTS */}
                {modalTab === 'features' && (
                  <div className="abp-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--abp-text-muted)' }}>
                        Configure feature keys, labels, and quota thresholds for this tier. Use <strong>-1</strong> for unlimited.
                      </p>
                      <button
                        type="button"
                        onClick={addFeatureRow}
                        className="abp-btn-edit"
                        style={{ flex: 'none', padding: '5px 12px', fontSize: '12px' }}
                      >
                        <Plus size={13} /> Add Entitlement
                      </button>
                    </div>

                    {form.features.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', background: 'var(--abp-card-header)', borderRadius: '10px', border: '1px dashed var(--abp-border)' }}>
                        <Sparkles size={24} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
                        <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--abp-text-muted)' }}>
                          No specific feature entitlements defined yet.
                        </p>
                        <button type="button" onClick={addFeatureRow} className="abp-btn-edit" style={{ margin: '0 auto', display: 'inline-flex' }}>
                          <Plus size={13} /> Add First Feature
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {form.features.map((feat, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1.4fr 1.4fr 0.8fr 1fr auto',
                              gap: '8px',
                              alignItems: 'center',
                              background: 'var(--abp-card-header)',
                              padding: '10px 12px',
                              borderRadius: '10px',
                              border: '1px solid var(--abp-border)',
                            }}
                          >
                            <div>
                              <input
                                type="text"
                                placeholder="Feature Key (e.g. max_chambers)"
                                value={feat.feature_key}
                                onChange={e => updateFeatureRow(idx, 'feature_key', e.target.value)}
                                className="abp-form-input"
                                style={{ fontSize: '12px', padding: '6px 8px' }}
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                placeholder="Display Name"
                                value={feat.feature_name}
                                onChange={e => updateFeatureRow(idx, 'feature_name', e.target.value)}
                                className="abp-form-input"
                                style={{ fontSize: '12px', padding: '6px 8px' }}
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                placeholder="Quota (-1 = unl)"
                                value={feat.quota_limit}
                                onChange={e => updateFeatureRow(idx, 'quota_limit', parseInt(e.target.value) || 0)}
                                className="abp-form-input"
                                style={{ fontSize: '12px', padding: '6px 8px' }}
                              />
                            </div>
                            <div>
                              <select
                                value={feat.reset_period}
                                onChange={e => updateFeatureRow(idx, 'reset_period', e.target.value)}
                                className="abp-form-select"
                                style={{ fontSize: '12px', padding: '6px 8px' }}
                              >
                                <option value="never">Never</option>
                                <option value="daily">Daily</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                              </select>
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => removeFeatureRow(idx)}
                                className="abp-btn-delete"
                                style={{ padding: '6px' }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="abp-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="abp-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="abp-btn-primary"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check size={15} /> Save Plan Configuration
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

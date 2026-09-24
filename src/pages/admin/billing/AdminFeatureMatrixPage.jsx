import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getFeatureMatrix, updateFeatureMatrix } from '../../../api/billingAdminApi'
import { useAuth } from '../../../context/AuthContext'
import {
  Check,
  X,
  Save,
  RefreshCw,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Grid,
  Users,
  Receipt,
  CreditCard,
  Tag,
  Settings,
  Building2,
  Stethoscope,
  Info,
} from 'lucide-react'
import '../../../styles/admin-billing.css'


export default function AdminFeatureMatrixPage() {
  const { hasPermission } = useAuth()

  const [plans, setPlans] = useState([])
  const [matrix, setMatrix] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [error, setError] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('all') // 'all' | 'doctor' | 'hospital'

  const loadData = async () => {
    try {
      setLoading(true)
      setFeedback(null)
      setError(null)
      const res = await getFeatureMatrix()
      setPlans(res.data?.plans || [])
      setMatrix(res.data?.matrix || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'ফিচার ম্যাট্রিক্স লোড করা সম্ভব হয়নি। পুনরায় চেষ্টা করুন।')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Toggle feature enablement for a specific plan
  const handleToggle = (featureKey, planId) => {
    setMatrix(prev => prev.map(item => {
      if (item.feature_key !== featureKey) return item
      const current = item.plans[planId] || { is_enabled: false, quota_limit: -1 }
      return {
        ...item,
        plans: {
          ...item.plans,
          [planId]: {
            ...current,
            is_enabled: !current.is_enabled,
          },
        },
      }
    }))
  }

  // Handle numeric quota limit change
  const handleLimitChange = (featureKey, planId, value) => {
    const quota = parseInt(value, 10)
    setMatrix(prev => prev.map(item => {
      if (item.feature_key !== featureKey) return item
      const current = item.plans[planId] || { is_enabled: true, quota_limit: -1 }
      return {
        ...item,
        plans: {
          ...item.plans,
          [planId]: {
            ...current,
            quota_limit: isNaN(quota) ? -1 : quota,
          },
        },
      }
    }))
  }

  // Save bulk matrix payload
  const handleSave = async () => {
    try {
      setSaving(true)
      setFeedback(null)
      const payload = []

      matrix.forEach(row => {
        plans.forEach(plan => {
          const pf = row.plans[plan.id] || { is_enabled: false, quota_limit: -1 }
          payload.push({
            plan_id: plan.id,
            feature_key: row.feature_key,
            feature_name: row.feature_name,
            is_enabled: pf.is_enabled,
            quota_limit: pf.quota_limit,
            reset_period: pf.reset_period || 'monthly',
          })
        })
      })

      await updateFeatureMatrix(payload)
      setFeedback({ type: 'success', text: 'সকল সক্রিয় প্ল্যানে ফিচার সুবিধা ও কোটা সফলভাবে সংরক্ষিত ও সিঙ্ক করা হয়েছে!' })
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'ফিচার ম্যাট্রিক্স সংরক্ষণে সমস্যা হয়েছে।' })
    } finally {
      setSaving(false)
    }
  }

  // Filtered plans based on entity
  const filteredPlans = useMemo(() => {
    if (entityFilter === 'all') return plans
    return plans.filter(p => (p.target_entity || '').toLowerCase() === entityFilter)
  }, [plans, entityFilter])

  // Filtered matrix rows based on search
  const filteredMatrix = useMemo(() => {
    if (!search.trim()) return matrix
    const q = search.toLowerCase()
    return matrix.filter(row =>
      (row.feature_name || '').toLowerCase().includes(q) ||
      (row.feature_key || '').toLowerCase().includes(q)
    )
  }, [matrix, search])

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalFeatures = matrix.length
    const totalPlans = plans.length
    let totalUnlimited = 0
    let totalCapped = 0

    matrix.forEach(row => {
      Object.values(row.plans || {}).forEach(pf => {
        if (pf.is_enabled) {
          if (pf.quota_limit === -1) totalUnlimited++
          else totalCapped++
        }
      })
    })

    return { totalFeatures, totalPlans, totalUnlimited, totalCapped }
  }, [matrix, plans])

  return (
    <div className="ab-container">
      {/* ─── 1. PAGE HEADER ─── */}
      <div className="ab-header">
        <div>
          <h1 className="ab-title">
            প্ল্যান ফিচার সুবিধা ম্যাট্রিক্স
            <span className="ab-title-badge">অ্যাক্সেস কন্ট্রোল</span>
          </h1>
          <p className="ab-subtitle">
            সকল টিয়ারের প্ল্যানে ফিচারের অনুমতি, ব্যবহার সীমা এবং কোটা কনফিগার ও সিঙ্ক করুন।
          </p>
        </div>

        <div className="ab-header-actions">
          <button
            onClick={loadData}
            className="ab-btn-refresh"
            title="ম্যাট্রিক্স রিফ্রেশ করুন"
            aria-label="Refresh feature matrix"
            disabled={loading || saving}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || !hasPermission('billing.plans.manage')}
            title={!hasPermission('billing.plans.manage') ? 'অনুমতি নেই' : undefined}
            className="ab-btn-primary"
            aria-label="Save matrix changes"
          >
            <Save size={16} /> {saving ? 'সংরক্ষণ হচ্ছে...' : 'ম্যাট্রিক্স পরিবর্তন সংরক্ষণ করুন'}
          </button>
        </div>
      </div>

      {/* ─── 2. QUICK NAVIGATION BAR ─── */}
      <nav className="ab-quick-nav">
        <Link to="/admin/billing/dashboard" className="ab-nav-pill">
          <Grid size={14} /> অ্যানালিটিক্স ড্যাশবোর্ড
        </Link>
        <Link to="/admin/billing/plans" className="ab-nav-pill">
          <Layers size={14} /> প্ল্যান ও টিয়ার
        </Link>
        <Link to="/admin/billing/matrix" className="ab-nav-pill active">
          <Sparkles size={14} /> ফিচার ম্যাট্রিক্স
        </Link>
        <Link to="/admin/billing/subscribers" className="ab-nav-pill">
          <Users size={14} /> গ্রাহক তালিকা
        </Link>
        <Link to="/admin/billing/invoices" className="ab-nav-pill">
          <Receipt size={14} /> ইনভয়েস লেজার
        </Link>
        <Link to="/admin/billing/transactions" className="ab-nav-pill">
          <CreditCard size={14} /> ম্যানুয়াল লেনদেন
        </Link>
        <Link to="/admin/billing/coupons" className="ab-nav-pill">
          <Tag size={14} /> ডিসকাউন্ট কুপন
        </Link>
        <Link to="/admin/billing/settings" className="ab-nav-pill">
          <Settings size={14} /> বিলিং সেটিংস
        </Link>
      </nav>

      {/* ─── 3. KPI METRICS DECK ─── */}
      <div className="ab-kpi-deck">
        <div className="ab-kpi-card">
          <div className="abp-kpi-label">
            <span>মোট নির্ধারিত সুবিধা</span>
            <Sparkles size={15} color="#8b5cf6" />
          </div>
          <div className="ab-kpi-value">{summaryMetrics.totalFeatures}</div>
          <div className="ab-kpi-footnote">প্ল্যাটফর্ম মডিউল ও পারমিশন</div>
        </div>

        <div className="ab-kpi-card">
          <div className="ab-kpi-label">
            <span>পরিচালিত সাবস্ক্রিপশন টিয়ার</span>
            <Layers size={15} color="#3b82f6" />
          </div>
          <div className="ab-kpi-value">{summaryMetrics.totalPlans}</div>
          <div className="ab-kpi-footnote">ডাক্তার ও হাসপাতাল উভয় ক্যাটাগরিতে</div>
        </div>

        <div className="ab-kpi-card">
          <div className="ab-kpi-label">
            <span>আনলিমিটেড সুবিধা</span>
            <CheckCircle2 size={15} color="#00b875" />
          </div>
          <div className="ab-kpi-value">{summaryMetrics.totalUnlimited}</div>
          <div className="ab-kpi-footnote">সীমাহীন কোটা বরাদ্দ (-১ প্যারামিটার)</div>
        </div>

        <div className="ab-kpi-card">
          <div className="ab-kpi-label">
            <span>নির্দিষ্ট কোটা সীমা</span>
            <Info size={15} color="#f59e0b" />
          </div>
          <div className="ab-kpi-value">{summaryMetrics.totalCapped}</div>
          <div className="ab-kpi-footnote">মাসিক/দৈনিক নির্ধারিত সংখ্যাগত সীমা</div>
        </div>
      </div>

      {/* ─── FEEDBACK BANNER ─── */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className="ab-fade-in"
          style={{
            padding: '14px 18px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: feedback.type === 'success' ? 'rgba(0, 184, 117, 0.1)' : 'rgba(239, 68, 68, 0.07)',
            color: feedback.type === 'success' ? '#00b875' : '#dc2626',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(0, 184, 117, 0.3)' : 'rgba(239, 68, 68, 0.25)'}`,
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ─── ERROR STATE ─── */}
      {error && (
        <div className="ab-error-state" role="alert">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button onClick={loadData} className="ab-btn-secondary">পুনরায় চেষ্টা</button>
        </div>
      )}

      {/* ─── 4. TOOLBAR ─── */}
      <div className="ab-toolbar">
        <div className="ab-toolbar-left">
          {/* Target Entity Segmented Control */}
          <div className="ab-segmented-group" role="group" aria-label="Filter by entity type">
            <button
              onClick={() => setEntityFilter('all')}
              className={`ab-segmented-btn ${entityFilter === 'all' ? 'active' : ''}`}
              aria-pressed={entityFilter === 'all'}
            >
              সকল প্ল্যান
              <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--ab-pill-bg)', borderRadius: '99px', padding: '1px 7px', marginLeft: '4px' }}>
                {plans.length}
              </span>
            </button>
            <button
              onClick={() => setEntityFilter('doctor')}
              className={`ab-segmented-btn ${entityFilter === 'doctor' ? 'active' : ''}`}
              aria-pressed={entityFilter === 'doctor'}
            >
              <Stethoscope size={13} />
              ডাক্তার প্ল্যান
            </button>
            <button
              onClick={() => setEntityFilter('hospital')}
              className={`ab-segmented-btn ${entityFilter === 'hospital' ? 'active' : ''}`}
              aria-pressed={entityFilter === 'hospital'}
            >
              <Building2 size={13} />
              হাসপাতাল প্ল্যান
            </button>
          </div>
        </div>

        <div className="ab-toolbar-right">
          <div className="ab-search-box">
            <Search size={14} aria-hidden="true" />
            <input
              type="search"
              placeholder="ফিচারের নাম বা কোড খুঁজুন..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="ab-search-input"
              aria-label="Search features"
            />

          </div>
        </div>
      </div>

      {/* ─── 5. MATRIX TABLE ─── */}
      {loading ? (
        <div className="ab-card-table" style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={24} className="animate-spin" color="var(--ab-text-muted)" />
        </div>
      ) : matrix.length === 0 ? (
        <div className="ab-card-table" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Sparkles size={40} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 700 }}>কোনো ফিচার সুবিধা পাওয়া যায়নি</h3>
          <p style={{ color: 'var(--ab-text-muted)', fontSize: '13px' }}>
            সাবস্ক্রিপশন প্ল্যানে ফিচার সীমা যুক্ত করা হলে স্বয়ংক্রিয়ভাবে ম্যাট্রিক্সে প্রদর্শিত হবে।
          </p>
        </div>
      ) : (
        <div className="ab-card-table ab-fade-in">
          <div className="ab-table-responsive">
            <table className="ab-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '260px', position: 'sticky', left: 0, zIndex: 2, background: 'var(--ab-table-head)' }}>
                    ফিচার ও পারমিশন
                  </th>
                  {filteredPlans.map(plan => {
                    const isDoctor = (plan.target_entity || '').toLowerCase() === 'doctor'
                    return (
                      <th key={plan.id} style={{ textAlign: 'center', minWidth: '150px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--ab-text)' }}>{plan.name}</div>
                        <div style={{ fontSize: '10.5px', textTransform: 'uppercase', color: isDoctor ? '#3b82f6' : '#8b5cf6', marginTop: '2px' }}>
                          {plan.tier} • {plan.target_entity}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--ab-text-dim)', fontWeight: 500 }}>
                          ৳{Number(plan.price).toLocaleString()}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredMatrix.map(row => (
                  <tr key={row.feature_key}>
                    <td style={{ position: 'sticky', left: 0, zIndex: 1, background: 'var(--ab-card)' }}>
                      <div style={{ fontWeight: 700, color: 'var(--ab-text)', fontSize: '13.5px' }}>{row.feature_name}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--ab-text-dim)', marginTop: '2px' }}>
                        {row.feature_key}
                      </div>
                    </td>

                    {filteredPlans.map(plan => {
                      const pf = row.plans[plan.id] || { is_enabled: false, quota_limit: -1 }
                      const canManage = hasPermission('billing.plans.manage')
                      return (
                        <td key={plan.id} style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleToggle(row.feature_key, plan.id)}
                              disabled={!canManage}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: canManage ? 'pointer' : 'not-allowed',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease',
                                background: pf.is_enabled ? 'rgba(0, 184, 117, 0.15)' : 'var(--ab-pill-bg)',
                                color: pf.is_enabled ? '#00b875' : 'var(--ab-text-dim)',
                                opacity: canManage ? 1 : 0.6,
                              }}
                              title={!canManage ? 'Insufficient permissions' : pf.is_enabled ? 'Feature Enabled (click to disable)' : 'Feature Disabled (click to enable)'}
                              aria-label={`${pf.is_enabled ? 'Disable' : 'Enable'} ${row.feature_name} for ${plan.name}`}
                              aria-pressed={pf.is_enabled}
                            >
                              {pf.is_enabled ? <Check size={16} strokeWidth={3} /> : <X size={15} />}
                            </button>

                            {pf.is_enabled && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                  type="number"
                                  title="Enter quota limit or -1 for unlimited"
                                  aria-label={`Quota for ${row.feature_name} on ${plan.name}`}
                                  value={pf.quota_limit}
                                  onChange={e => handleLimitChange(row.feature_key, plan.id, e.target.value)}
                                  disabled={!canManage}
                                  style={{
                                    width: '64px',
                                    textAlign: 'center',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    padding: '4px 6px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--ab-input-border)',
                                    background: 'var(--ab-input-bg)',
                                    color: pf.quota_limit === -1 ? '#00b875' : 'var(--ab-text)',
                                  }}
                                />
                                {pf.quota_limit === -1 && (
                                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#00b875' }}>∞</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>
      )}
    </div>
  )
}

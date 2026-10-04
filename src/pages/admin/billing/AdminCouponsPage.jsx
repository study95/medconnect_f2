import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import AdminBillingTabs from '../../../components/admin/AdminBillingTabs'

export default function AdminCouponsPage() {
  const { hasPermission } = useAuth()
  const queryClient = useQueryClient()

  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')
  const [page, setPage] = useState(1)

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

  const debouncedSearch = useDebounce(search, 400)

  // Reset to page 1 when search query changes
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  // TanStack Query for Coupons
  const {
    data: couponResponse,
    isLoading: loading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'billing', 'coupons', { search: debouncedSearch.trim() || undefined, page }],
    queryFn: async () => {
      const res = await getAdminCoupons({
        search: debouncedSearch.trim() || undefined,
        page,
        per_page: 15,
      })
      return res.data || {}
    },
    staleTime: 60 * 1000,
  })

  const coupons = useMemo(() => {
    const list = couponResponse?.data || couponResponse || []
    return Array.isArray(list) ? list : []
  }, [couponResponse])

  const meta = couponResponse?.meta || {}
  const error = queryError?.response?.data?.message || (queryError ? 'কুপন তালিকা লোড করতে ব্যর্থ হয়েছে।' : null)

  const openCreate = () => {
    setEditingCoupon(null)
    setForm({
      code: '',
      discount_type: 'percentage',
      discount_value: 15,
      applies_to_entity: 'doctor',
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
      applies_to_entity: (cpn.applies_to_entity || 'doctor').toLowerCase(),
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
        applies_to_entity: (form.applies_to_entity || 'doctor').toLowerCase(),
        discount_value: parseFloat(form.discount_value) || 0,
        max_redemptions: parseInt(form.max_redemptions) || 0,
      }

      if (editingCoupon) {
        await updateAdminCoupon(editingCoupon.id, payload)
        toast.success(`কুপন "${payload.code}" সফলভাবে আপডেট হয়েছে!`)
      } else {
        await createAdminCoupon(payload)
        toast.success(`নতুন কুপন "${payload.code}" সফলভাবে তৈরি হয়েছে!`)
      }
      setShowModal(false)
      queryClient.invalidateQueries({ queryKey: ['admin', 'billing', 'coupons'] })
    } catch (err) {
      const fieldErrors = err.response?.data?.errors
      let errorText = err.response?.data?.message || 'প্রমোশনাল কুপন সংরক্ষণে সমস্যা হয়েছে।'
      if (fieldErrors && typeof fieldErrors === 'object') {
        const firstField = Object.values(fieldErrors).flat()[0]
        if (firstField) errorText = firstField
      }
      toast.error(errorText)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (coupon) => {
    if (!window.confirm(`কুপন "${coupon.code}" নিষ্ক্রিয় বা মুছে ফেলতে চান?`)) return
    try {
      await deleteAdminCoupon(coupon.id)
      toast.success(`কুপন "${coupon.code}" সফলভাবে মুছে ফেলা হয়েছে!`)
      queryClient.invalidateQueries({ queryKey: ['admin', 'billing', 'coupons'] })
    } catch (err) {
      toast.error(err.response?.data?.message || 'কুপন মুছতে সমস্যা হয়েছে।')
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
            প্রমোশনাল কুপন ও ক্যাম্পেইন
            <span className="ab-title-badge">ডিসকাউন্ট ইঞ্জিন</span>
          </h1>
          <p className="ab-subtitle">
            প্রমোশনাল ভাউচার তৈরি করুন, ব্যবহারের সীমা ও ক্যাম্পেইনের মাধ্যমে অর্জিত রাজস্ব ট্র্যাক করুন।
          </p>
        </div>

        <div className="ab-header-actions">
          <button
            onClick={() => refetch()}
            className="ab-btn-refresh"
            title="কুপন রিফ্রেশ করুন"
            disabled={loading || isFetching}
            aria-label="Refresh coupons list"
          >
            <RefreshCw size={15} className={loading || isFetching ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openCreate}
            className="ab-btn-primary"
            disabled={!hasPermission('billing.plans.manage')}
            title={!hasPermission('billing.plans.manage') ? 'পর্যাপ্ত অনুমতি নেই' : undefined}
          >
            <Plus size={16} /> নতুন কুপন তৈরি
          </button>
        </div>
      </div>

      {/* ─── 2. QUICK NAVIGATION BAR ─── */}
      <AdminBillingTabs />

      {/* ─── 3. KPI METRICS DECK ─── */}
      <div className="ab-kpi-deck">
        <div className="ab-kpi-card">
          <div className="ab-kpi-label">
            <span>কনফিগারকৃত ভাউচার</span>
            <Tag size={15} color="#8b5cf6" />
          </div>
          <div className="ab-kpi-value">{summaryMetrics.total}</div>
          <div className="ab-kpi-footnote">
            <span style={{ color: '#00b875', fontWeight: 700 }}>{summaryMetrics.active}টি সক্রিয়</span> • {summaryMetrics.total - summaryMetrics.active}টি নিষ্ক্রিয়
          </div>
        </div>

        <div className="ab-kpi-card">
          <div className="ab-kpi-label">
            <span>সর্বমোট রিডিম / ব্যবহার</span>
            <Users size={15} color="#3b82f6" />
          </div>
          <div className="ab-kpi-value">{summaryMetrics.totalRedeemed}</div>
          <div className="ab-kpi-footnote">চেকআউটে গ্রাহকদের দ্বারা ব্যবহারের সংখ্যা</div>
        </div>

        <div className="ab-kpi-card">
          <div className="ab-kpi-label">
            <span>কুপন সংশ্লিষ্ট রাজস্ব</span>
            <DollarSign size={15} color="#00b875" />
          </div>
          <div className="ab-kpi-value" style={{ color: '#00b875' }}>
            ৳{summaryMetrics.totalRevenue.toLocaleString()}
          </div>
          <div className="ab-kpi-footnote">কুপন ব্যবহারে সফলভাবে সংগৃহীত মোট লেনদেন</div>
        </div>

        <div className="ab-kpi-card">
          <div className="ab-kpi-label">
            <span>সক্রিয় ক্যাম্পেইনের হার</span>
            <CheckCircle2 size={15} color="#f59e0b" />
          </div>
          <div className="ab-kpi-value">
            {summaryMetrics.total > 0 ? Math.round((summaryMetrics.active / summaryMetrics.total) * 100) : 0}%
          </div>
          <div className="ab-kpi-footnote">মোট কুপনের মধ্যে সক্রিয় অনুপাত</div>
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
              সকল গ্রাহক
            </button>
            <button
              onClick={() => setEntityFilter('doctor')}
              className={`ab-segmented-btn ${entityFilter === 'doctor' ? 'active' : ''}`}
            >
              <Stethoscope size={13} /> ডাক্তারদের জন্য
            </button>
            <button
              onClick={() => setEntityFilter('hospital')}
              className={`ab-segmented-btn ${entityFilter === 'hospital' ? 'active' : ''}`}
            >
              <Building2 size={13} /> হাসপাতালের জন্য
            </button>
          </div>
        </div>

        <div className="ab-toolbar-right">
          <div className="ab-search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="কুপন কোড দিয়ে খুঁজুন..."
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
          <button onClick={loadCoupons} className="ab-btn-secondary">পুনরায় চেষ্টা করুন</button>
        </div>
      )}

      {/* ─── 6. COUPONS TABLE ─── */}
      <div className="ab-card-table ab-fade-in">
        <div className="ab-table-responsive">
          <table className="ab-table" aria-busy={loading}>
            <thead>
              <tr>
                <th>ভাউচার কোড</th>
                <th>ডিসকাউন্টের পরিমাণ</th>
                <th>উদ্দিষ্ট গ্রাহক</th>
                <th>ব্যবহার ও সর্বোচ্চ সীমা</th>
                <th>অর্জিত রাজস্ব</th>
                <th>মেয়াদকাল</th>
                <th>স্ট্যাটাস</th>
                <th style={{ textAlign: 'right' }}>পদক্ষেপ</th>
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
                      <div className="ab-empty-title">কোনো কুপন পাওয়া যায়নি</div>
                      <div className="ab-empty-sub">ডিসকাউন্ট সুবিধা দিতে আপনার প্রথম কুপন ক্যাম্পেইন তৈরি করুন</div>
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
                          {isPercent ? `${cpn.discount_value}% ছাড়` : `৳${cpn.discount_value} ফিক্সড`}
                        </span>
                      </td>
                      <td>
                        <span className="ab-badge ab-badge-blue">
                          {cpn.applies_to_entity === 'Doctor' ? 'ডাক্তার' : cpn.applies_to_entity === 'Hospital' ? 'হাসপাতাল' : 'সকল গ্রাহক'}
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
                          {cpn.valid_until ? `মেয়াদ: ${new Date(cpn.valid_until).toLocaleDateString('bn-BD')} পর্যন্ত` : 'মেয়াদহীন'}
                        </div>
                      </td>
                      <td>
                        {cpn.is_active ? (
                          <span className="ab-badge ab-badge-emerald">সক্রিয়</span>
                        ) : (
                          <span className="ab-badge ab-badge-slate">নিষ্ক্রিয়</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => openEdit(cpn)}
                            className="ab-btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            disabled={!hasPermission('billing.plans.manage')}
                            title={!hasPermission('billing.plans.manage') ? 'পর্যাপ্ত অনুমতি নেই' : 'কুপন সম্পাদনা করুন'}
                            aria-label={`Edit coupon ${cpn.code}`}
                          >
                            <Edit2 size={13} /> সম্পাদনা
                          </button>
                          <button
                            onClick={() => handleDelete(cpn)}
                            className="ab-btn-secondary"
                            style={{ padding: '6px 8px', fontSize: '12px', color: '#ef4444' }}
                            disabled={!hasPermission('billing.plans.manage')}
                            title={!hasPermission('billing.plans.manage') ? 'পর্যাপ্ত অনুমতি নেই' : 'কুপন মুছুন'}
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
            ← পূর্ববর্তী
          </button>
          <span className="ab-pagination-info">
            পৃষ্ঠা {meta.current_page || page} / {meta.last_page} &bull; মোট {meta.total}টি
          </span>
          <button
            className="ab-btn-secondary"
            onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
            disabled={page >= meta.last_page}
            aria-label="Next page"
          >
            পরবর্তী →
          </button>
        </div>
      )}

      {/* ─── 8. CREATE / EDIT COUPON MODAL ─── */}
      {showModal && (
        <div className="ab-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="ab-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ab-modal-header">
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--ab-text)' }}>
                {editingCoupon ? `কুপন সম্পাদনা: ${editingCoupon.code}` : 'নতুন প্রমোশনাল ক্যাম্পেইন তৈরি'}
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
                  <label className="ab-form-label">প্রমোশনাল ভাউচার কোড *</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="যেমন: SUMMER2026 বা DOCTORPROMO"
                    className="ab-form-input"
                    style={{ fontFamily: 'monospace', fontWeight: 700 }}
                  />
                </div>

                <div className="ab-form-row">
                  <div className="ab-form-group">
                    <label className="ab-form-label">ডিসকাউন্টের ধরন *</label>
                    <select
                      value={form.discount_type}
                      onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                      className="ab-form-select"
                    >
                      <option value="percentage">শতকরা ছাড় (%)</option>
                      <option value="fixed">নির্দিষ্ট অংকের ছাড় (৳ BDT)</option>
                    </select>
                  </div>

                  <div className="ab-form-group">
                    <label className="ab-form-label">ছাড়ের পরিমাণ *</label>
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
                    <label className="ab-form-label">উদ্দিষ্ট গ্রাহক প্রতিষ্ঠান</label>
                    <select
                      value={form.applies_to_entity}
                      onChange={(e) => setForm({ ...form, applies_to_entity: e.target.value })}
                      className="ab-form-select"
                    >
                      <option value="doctor">শুধুমাত্র ডাক্তারদের জন্য</option>
                      <option value="hospital">শুধুমাত্র হাসপাতালের জন্য</option>
                      <option value="all">সকল গ্রাহক (ডাক্তার ও হাসপাতাল)</option>
                    </select>
                  </div>

                  <div className="ab-form-group">
                    <label className="ab-form-label">সর্বোচ্চ ব্যবহার সীমা (Max Redemptions)</label>
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
                    <label className="ab-form-label">শুরুর তারিখ (Valid From)</label>
                    <input
                      type="date"
                      value={form.valid_from}
                      onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                      className="ab-form-input"
                    />
                  </div>

                  <div className="ab-form-group">
                    <label className="ab-form-label">মেয়াদ শেষের তারিখ (Valid Until)</label>
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
                    সক্রিয় ক্যাম্পেইন (গ্রাহকরা চেকআউটে ব্যবহার করতে পারবেন)
                  </label>
                </div>
              </div>

              <div className="ab-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="ab-btn-secondary"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving || !hasPermission('billing.plans.manage')}
                  title={!hasPermission('billing.plans.manage') ? 'পর্যাপ্ত অনুমতি নেই' : undefined}
                  className="ab-btn-primary"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> সংরক্ষণ হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Check size={15} /> ক্যাম্পেইন সংরক্ষণ করুন
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

// DoctorSubscriptionExperiencePage.jsx — Enterprise Doctor Subscription & Practice Experience
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  getDoctorBillingOverview,
  getDoctorAvailablePlans,
  previewDoctorPlanChange,
  cancelDoctorBillingSubscription,
  emailDoctorInvoice,
  downloadDoctorInvoice
} from '../../../api/subscriptionApi'
import {
  Building2, Users, Check, AlertTriangle, Clock, Zap, Shield,
  RefreshCw, Lock, FileText, Calendar, Info, AlertCircle,
  CheckCircle2, ChevronRight, X, PhoneCall, Mail, Headphones,
  History, Search, Printer, Sparkles, Send, Layers,
  ChevronDown, ChevronUp, ArrowRight, ExternalLink, Activity
} from 'lucide-react'
import '../../../styles/doctor-subscription.css'

export default function DoctorSubscriptionExperiencePage() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' | 'annual'

  // Modal & Drawer states
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [actionFeedback, setActionFeedback] = useState(null)
  const [showTimeline, setShowTimeline] = useState(false)
  const [showComparisonMatrix, setShowComparisonMatrix] = useState(false)
  const [emailingInvoiceId, setEmailingInvoiceId] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancellingSub, setCancellingSub] = useState(false)

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      const [overviewRes, plansRes] = await Promise.all([
        getDoctorBillingOverview(),
        getDoctorAvailablePlans()
      ])
      setOverview(overviewRes.data)
      setPlans(plansRes.data || [])
    } catch (err) {
      console.error('Failed to load doctor subscription data:', err)
      setActionFeedback({
        type: 'error',
        text: err.response?.data?.message || 'বিলিং ও সাবস্ক্রিপশন তথ্য লোড করতে ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto-dismiss feedback after 6 seconds
  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => setActionFeedback(null), 6000)
      return () => clearTimeout(timer)
    }
  }, [actionFeedback])

  const handleOpenPlanChange = async (plan) => {
    setSelectedPlan(plan)
    setPreviewLoading(true)
    try {
      const res = await previewDoctorPlanChange(plan.id, billingCycle)
      setPreview(res.data)
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err.response?.data?.message || 'প্ল্যান পরিবর্তনের প্রোরেশন হিসাব করতে সমস্যা হয়েছে।'
      })
      setSelectedPlan(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  // Redirect to Checkout — the single source of truth for subscription checkout
  const handleProceedToCheckout = (plan) => {
    const tierKey = (plan?.tier || '').toLowerCase()
    const isFree = tierKey === 'free' || Number(plan?.price_monthly) === 0
    const cycleParam = isFree ? 'monthly' : billingCycle
    const prefix = window.location.pathname.startsWith('/doctor') ? '/doctor' : '/admin'
    navigate(`${prefix}/subscription/checkout?plan_id=${plan.id}&cycle=${cycleParam}`)
  }

  // Cancellation via clean modal
  const handleConfirmCancelSub = async () => {
    try {
      setCancellingSub(true)
      await cancelDoctorBillingSubscription(false)
      setActionFeedback({
        type: 'info',
        text: 'সাবস্ক্রিপশন বাতিলকরণ শিডিউল করা হয়েছে। বর্তমান বিলিং সাইকেল শেষ হওয়া পর্যন্ত আপনার প্র্যাকটিস সুবিধা সক্রিয় থাকবে।'
      })
      setShowCancelModal(false)
      loadData(true)
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err.response?.data?.message || 'সাবস্ক্রিপশন বাতিল করতে সমস্যা হয়েছে।'
      })
    } finally {
      setCancellingSub(false)
    }
  }

  const handleEmailInvoice = async (invoiceId, invoiceNumber) => {
    try {
      setEmailingInvoiceId(invoiceId)
      const res = await emailDoctorInvoice(invoiceId)
      setActionFeedback({
        type: 'success',
        text: res.message || `ইনভয়েস #${invoiceNumber} আপনার ভেরিফাইড ইমেইলে পাঠানো হয়েছে!`
      })
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err.response?.data?.message || 'ইমেইলে ইনভয়েস পাঠাতে ব্যর্থ হয়েছে।'
      })
    } finally {
      setEmailingInvoiceId(null)
    }
  }

  const handlePrintInvoice = () => {
    window.print()
  }

  // Helper: Status badge renderer
  const renderStatusBadge = (status) => {
    const s = String(status || 'active').toLowerCase()
    if (s === 'active') {
      return (
        <span className="doc-sub-badge-status active">
          <span className="doc-sub-dot pulse" style={{ background: '#10b981' }} />
          সক্রিয় প্র্যাকটিস প্ল্যান
        </span>
      )
    }
    if (s === 'trialing') {
      return (
        <span className="doc-sub-badge-status trialing">
          <span className="doc-sub-dot pulse" style={{ background: '#6366f1' }} />
          ফ্রি ট্রায়াল
        </span>
      )
    }
    if (s === 'grace_period') {
      return (
        <span className="doc-sub-badge-status grace">
          <span className="doc-sub-dot pulse" style={{ background: '#f59e0b' }} />
          গ্রেস পিরিয়ড
        </span>
      )
    }
    if (s === 'canceled' || s === 'cancelled') {
      return (
        <span className="doc-sub-badge-status expired">
          <span className="doc-sub-dot" style={{ background: '#ef4444' }} />
          বাতিলকৃত
        </span>
      )
    }
    return (
      <span className="doc-sub-badge-status expired">
        <span className="doc-sub-dot" style={{ background: '#ef4444' }} />
        {s === 'expired' ? 'মেয়াদোত্তীর্ণ' : s.toUpperCase()}
      </span>
    )
  }

  // ─── LOADING SKELETON ───
  if (loading) {
    return (
      <div className="doc-sub-container">
        <div className="doc-sub-skeleton mb-4" style={{ height: '36px', width: '360px' }} />
        <div className="doc-sub-skeleton mb-4" style={{ height: '200px', width: '100%', borderRadius: '20px' }} />
        <div className="row g-3 mb-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="col-12 col-sm-6 col-lg-3">
              <div className="doc-sub-skeleton" style={{ height: '120px', borderRadius: '16px' }} />
            </div>
          ))}
        </div>
        <div className="doc-sub-skeleton" style={{ height: '340px', width: '100%', borderRadius: '20px' }} />
      </div>
    )
  }

  const sub = overview?.subscription
  const doctor = overview?.doctor
  const banners = overview?.banners || {}
  const staged = banners?.staged_renewal
  const usages = overview?.usages || []
  const invoices = overview?.invoices || []
  const timeline = overview?.timeline || []
  const pendingRequest = overview?.pending_request
  const pendingPayment = overview?.pending_payment

  // Calculate trial status & days remaining
  const isTrial = sub?.status === 'trialing' ||
    sub?.plan?.tier === 'free' ||
    (sub?.plan?.name && sub.plan.name.toLowerCase().includes('trial')) ||
    (sub?.plan?.name_bn && (sub.plan.name_bn.includes('ট্রায়াল') || sub.plan.name_bn.includes('ট্রায়াল'))) ||
    Number(sub?.current_price ?? sub?.plan?.price_monthly ?? 0) === 0

  let daysRemaining = banners.days_remaining ?? null
  if (daysRemaining === null && sub?.current_period_ends_at) {
    const diffTime = new Date(sub.current_period_ends_at).getTime() - new Date().getTime()
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  }

  const isExpired = Boolean(banners?.is_expired) || sub?.status === 'expired' || (daysRemaining !== null && daysRemaining <= 0)

  // Calculate lowest paid plan starting price dynamically
  const lowestPaidPlan = plans
    ?.filter(p => Number(p.price_monthly) > 0)
    ?.sort((a, b) => Number(a.price_monthly) - Number(b.price_monthly))[0]
  const startingPrice = lowestPaidPlan ? Number(lowestPaidPlan.price_monthly) : 600

  // Individual usage lookups for KPI cards
  const rxUsage = usages.find(u => u.key === 'prescriptions' || u.key === 'eprescription')
  const apptUsage = usages.find(u => u.key === 'appointments' || u.key === 'live_queue')
  const chamberUsage = usages.find(u => u.key === 'chambers' || u.key === 'max_chambers')
  const smsUsage = usages.find(u => u.key === 'patient_sms' || u.key === 'sms_reminders')
  const teleUsage = usages.find(u => u.key === 'telemedicine_calls' || u.key === 'telemedicine')

  return (
    <div className="doc-sub-container doc-sub-fade-in">
      {/* ─── PAGE HEADER & CONTROLS ─── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.3px', color: 'var(--admin-text, #0f172a)' }}>
            সাবস্ক্রিপশন ও প্র্যাকটিস প্ল্যান
          </h1>
          <p className="text-muted" style={{ fontSize: '13px', margin: '4px 0 0 0' }}>
            আপনার বর্তমান প্ল্যান, ব্যবহারের কোটা ও বিলিং বিবরণী
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {timeline.length > 0 && (
            <button
              onClick={() => setShowTimeline(true)}
              className="doc-sub-btn-secondary"
              title="লাইফসাইকেল ইভেন্ট টাইমলাইন দেখুন"
            >
              <Activity size={15} style={{ color: '#00B875' }} />
              <span>লাইফসাইকেল টাইমলাইন ({timeline.length})</span>
            </button>
          )}

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="doc-sub-btn-secondary"
            title="সর্বশেষ ডেটা রিফ্রেশ করুন"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} style={{ color: '#00B875' }} />
            <span>{refreshing ? 'রিফ্রেশ হচ্ছে...' : 'রিফ্রেশ'}</span>
          </button>
        </div>
      </div>

      {/* ─── ACTION TOAST / FEEDBACK ─── */}
      {actionFeedback && (
        <div
          className={`doc-sub-banner ${
            actionFeedback.type === 'error' ? 'danger' : actionFeedback.type === 'info' ? 'info' : 'warning'
          } doc-sub-fade-in`}
          style={{
            background: actionFeedback.type === 'success' ? '#ecfdf5' : undefined,
            borderColor: actionFeedback.type === 'success' ? '#a7f3d0' : undefined,
            color: actionFeedback.type === 'success' ? '#065f46' : undefined
          }}
        >
          <div className="d-flex align-items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 size={18} style={{ color: '#10b981' }} />
            ) : actionFeedback.type === 'error' ? (
              <AlertCircle size={18} style={{ color: '#ef4444' }} />
            ) : (
              <Info size={18} style={{ color: '#3b82f6' }} />
            )}
            <span style={{ fontSize: '13.5px', fontWeight: 600 }}>{actionFeedback.text}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ─── 1. ACTIVE PENDING PAYMENT LOCK BANNER ─── */}
      {overview?.is_checkout_locked && (
        <div className="doc-sub-banner warning doc-sub-fade-in">
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#f59e0b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14.5px' }}>
                পেমেন্ট ভেরিফিকেশন অ্যাডমিন পর্যালোচনায় রয়েছে
              </div>
              <div style={{ fontSize: '12.5px', opacity: 0.95, marginTop: '2px' }}>
                {overview.lock_reason || 'আপনার প্রেরিত ম্যানুয়াল পেমেন্ট তথ্যটি পর্যালোচনার জন্য জমা রয়েছে।'}{' '}
                {pendingPayment && (
                  <span style={{ fontWeight: 700 }}>
                    (রেফারেন্স: {pendingPayment.transaction_reference}, ৳ {Number(pendingPayment.amount).toLocaleString()})
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => navigate('/admin/subscription/history')}
              className="doc-sub-btn-secondary"
              style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 700 }}
            >
              হিস্ট্রিতে দেখুন
            </button>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '9999px',
                background: 'rgba(245, 158, 11, 0.25)',
                color: '#92400e',
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase'
              }}
            >
              পর্যালোচনায়
            </span>
          </div>
        </div>
      )}

      {/* ─── 2. PENDING PLAN CHANGE REQUEST BANNER ─── */}
      {pendingRequest && (
        <div className="doc-sub-banner info doc-sub-fade-in">
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#3b82f6',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <RefreshCw size={20} className="animate-spin" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14.5px' }}>
                প্ল্যান পরিবর্তনের অনুরোধ অনুমোদনের অপেক্ষায়
              </div>
              <div style={{ fontSize: '12.5px', opacity: 0.95, marginTop: '2px' }}>
                অনুরোধকৃত প্ল্যান: <strong>{pendingRequest.target_plan}</strong> ({pendingRequest.target_cycle === 'annual' ? 'বাৎসরিক' : 'মাসিক'}), সমন্বিত ব্যালেন্স: ৳ {Number(pendingRequest.amount_due).toLocaleString()}। অ্যাডমিন পর্যালোচনার পর কার্যকর হবে।
              </div>
            </div>
          </div>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '9999px',
              background: 'rgba(59, 130, 246, 0.25)',
              color: '#1e40af',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase'
            }}
          >
            অনুমোদনের অপেক্ষায়
          </span>
        </div>
      )}


      {/* ─── 4. CLINICAL HERO CARD ─── */}
      <div className={`doc-sub-hero ${isExpired ? 'expired' : ''}`}>
        <div className="doc-sub-hero-glow" />

        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-4 position-relative" style={{ zIndex: 1 }}>
          <div>
            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
              {isExpired ? (
                <>
                  <span className="doc-sub-badge-tier" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                    <Shield size={12} />
                    ফ্রি ট্রায়াল সমাপ্ত
                  </span>
                  <span className="doc-sub-badge-status expired">
                    <span className="doc-sub-dot" style={{ background: '#ef4444' }} />
                    সেবা স্থগিত
                  </span>
                </>
              ) : isTrial ? (
                <>
                  <span className="doc-sub-badge-tier">
                    <Shield size={12} />
                    ফ্রি ট্রায়াল
                  </span>
                  {daysRemaining !== null && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: daysRemaining <= 3 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(0, 184, 117, 0.12)',
                        color: daysRemaining <= 3 ? '#dc2626' : '#059669',
                        border: `1px solid ${daysRemaining <= 3 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0, 184, 117, 0.25)'}`
                      }}
                    >
                      <Clock size={11} />
                      {daysRemaining} দিন বাকি
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="doc-sub-badge-tier">
                    <Shield size={12} />
                    {sub?.plan?.tier_bn || sub?.plan?.tier || 'প্র্যাকটিস'} টায়ার
                  </span>
                  {renderStatusBadge(sub?.status)}
                  {daysRemaining !== null && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: daysRemaining <= 3 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(0, 184, 117, 0.12)',
                        color: daysRemaining <= 3 ? '#dc2626' : '#059669',
                        border: `1px solid ${daysRemaining <= 3 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0, 184, 117, 0.25)'}`
                      }}
                    >
                      <Clock size={11} />
                      {daysRemaining > 0 ? `${daysRemaining} দিন বাকি` : 'মেয়াদ উত্তীর্ণ'}
                    </span>
                  )}
                  {Boolean(sub?.auto_renew) && sub?.status === 'active' && (daysRemaining === null || daysRemaining > 0) && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: '#4f46e5',
                        border: '1px solid rgba(99, 102, 241, 0.2)'
                      }}
                    >
                      অটো-রিনিউ সক্রিয়
                    </span>
                  )}
                </>
              )}
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '6px 0 6px 0', letterSpacing: '-0.3px', color: 'var(--admin-text, #0f172a)' }}>
              {sub?.plan?.name_bn || sub?.plan?.name || (isTrial ? 'ডাক্তার ফ্রি ট্রায়াল' : 'ক্লিনিক্যাল প্র্যাকটিস প্ল্যান')}
            </h2>
            <p className="text-muted" style={{ fontSize: '13.5px', margin: 0, maxWidth: '640px', lineHeight: 1.5 }}>
              {isExpired
                ? 'সেবা নিরবচ্ছিন্ন রাখতে অনুগ্রহ করে আপনার পছন্দের প্যাকেজে আপগ্রেড করুন।'
                : isTrial
                ? 'বর্তমানে ১৪ দিনের ফ্রি ট্রায়াল সক্রিয় রয়েছে। সকল ডিজিটাল প্রেসক্রিপশন ও চেম্বার সুবিধা উপভোগ করুন।'
                : 'ডক্টর প্ল্যাটফর্মে চিকিৎসকদের জন্য ডিজিটাল প্রেসক্রিপশন ও ক্লিনিক্যাল প্র্যাকটিস সুবিধা কার্যকর রয়েছে।'}
            </p>
          </div>

          <div className="doc-sub-hero-price-box">
            <div className="text-end" style={{ whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                {isExpired ? 'প্যাকেজ শুরু' : isTrial ? 'বর্তমান চার্জ' : 'সাইকেল ফি'}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--admin-text, #0f172a)', lineHeight: 1.2 }}>
                {isExpired ? (
                  <span>
                    ৳ {startingPrice.toLocaleString()}
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}> / মাস</span>
                  </span>
                ) : isTrial ? (
                  <span>
                    ৳ ০ <span style={{ fontSize: '12px', fontWeight: 600, color: '#10b981' }}>(ফ্রি)</span>
                  </span>
                ) : (
                  <span>
                    ৳ {Number(sub?.current_price || sub?.plan?.price_monthly || 0).toLocaleString()}
                    <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#94a3b8' }}>
                      {' '}/ {sub?.billing_cycle === 'annual' ? 'বছর' : 'মাস'}
                    </span>
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => document.getElementById('pricing-plans-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="doc-sub-btn-primary"
              style={{ whiteSpace: 'nowrap', padding: '10px 18px', fontWeight: 700 }}
            >
              <Zap size={14} />
              <span>আপগ্রেড করুন</span>
            </button>
            {sub?.status === 'active' && !isTrial && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="doc-sub-btn-danger"
                style={{ whiteSpace: 'nowrap' }}
              >
                বাতিল
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── 5. CAPACITY & KPI METRIC DECK ─── */}
      <div className="doc-sub-kpi-grid">
        {/* E-Prescriptions Metric */}
        {(() => {
          const isUnlimited = rxUsage?.is_unlimited || rxUsage?.limit === -1 || rxUsage?.limit === 999999
          const used = rxUsage?.used ?? 0
          const planLimit = sub?.plan?.features?.find(f => f.feature_key === 'eprescription' || f.feature_key === 'prescriptions')?.quota_limit
          const limit = (rxUsage?.limit && rxUsage.limit > 0) ? rxUsage.limit : (isUnlimited ? -1 : (planLimit && Number(planLimit) > 0 ? Number(planLimit) : 100))
          const pct = isUnlimited ? 15 : Math.min(100, (limit > 0 ? Math.round((used / limit) * 100) : 0))
          const color = isExpired ? 'rose' : (rxUsage?.status === 'critical' ? 'rose' : rxUsage?.status === 'warning' ? 'amber' : 'emerald')

          return (
            <div className="doc-sub-kpi-card" key="rx">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="doc-sub-kpi-label">ডিজিটাল প্রেসক্রিপশন</div>
                  <div className="doc-sub-kpi-value">
                    {used}{' '}
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>
                      / {isUnlimited ? '∞ আনলিমিটেড' : `${limit}টি`}
                    </span>
                  </div>
                </div>
                <div className="doc-sub-kpi-icon-wrap" style={{ background: isExpired ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: isExpired ? '#dc2626' : '#059669' }}>
                  <FileText size={18} />
                </div>
              </div>

              <div className="doc-sub-progress-track">
                <div className={`doc-sub-progress-bar ${color}`} style={{ width: `${pct}%` }} />
              </div>

              <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '11px', color: '#64748b' }}>
                <span>{isUnlimited ? 'সীমাহীন সুবিধা' : `${pct}% ব্যবহৃত`}</span>
                <span style={{ fontWeight: 700, color: isExpired ? '#dc2626' : (color === 'rose' ? '#dc2626' : '#059669') }}>
                  {isExpired ? 'সার্ভিস স্থগিত' : (rxUsage?.forecasted_usage ? `~${rxUsage.forecasted_usage} সাইকেল শেষে` : 'সক্রিয়')}
                </span>
              </div>
            </div>
          )
        })()}

        {/* Patient Appointments / Queue Metric */}
        {(() => {
          const isUnlimited = apptUsage?.is_unlimited || apptUsage?.limit === -1 || apptUsage?.limit === 999999
          const used = apptUsage?.used ?? 0
          const planLimit = sub?.plan?.features?.find(f => f.feature_key === 'live_queue' || f.feature_key === 'appointments')?.quota_limit
          const limit = (apptUsage?.limit && apptUsage.limit > 0) ? apptUsage.limit : (isUnlimited ? -1 : (planLimit && Number(planLimit) > 0 ? Number(planLimit) : 200))
          const pct = isUnlimited ? 15 : Math.min(100, (limit > 0 ? Math.round((used / limit) * 100) : 0))
          const color = isExpired ? 'rose' : (apptUsage?.status === 'critical' ? 'rose' : apptUsage?.status === 'warning' ? 'amber' : 'blue')

          return (
            <div className="doc-sub-kpi-card" key="appt">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="doc-sub-kpi-label">সিরিয়াল ও লাইভ কিউ</div>
                  <div className="doc-sub-kpi-value">
                    {used}{' '}
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>
                      / {isUnlimited ? '∞ আনলিমিটেড' : `${limit} রোগী`}
                    </span>
                  </div>
                </div>
                <div className="doc-sub-kpi-icon-wrap" style={{ background: isExpired ? 'rgba(239, 68, 68, 0.1)' : 'rgba(37, 99, 235, 0.1)', color: isExpired ? '#dc2626' : '#2563eb' }}>
                  <Activity size={18} />
                </div>
              </div>

              <div className="doc-sub-progress-track">
                <div className={`doc-sub-progress-bar ${color}`} style={{ width: `${pct}%` }} />
              </div>

              <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '11px', color: '#64748b' }}>
                <span>অনলাইন বুকিং সিরিয়াল</span>
                <span style={{ fontWeight: 700, color: isExpired ? '#dc2626' : '#2563eb' }}>
                  {isExpired ? 'বুকিং স্থগিত' : (isUnlimited ? 'আনলিমিটেড রোগী' : `${Math.max(0, limit - used)}টি বাকি`)}
                </span>
              </div>
            </div>
          )
        })()}

        {/* Chamber Listings Metric */}
        {(() => {
          const isUnlimited = chamberUsage?.is_unlimited || chamberUsage?.limit === -1 || chamberUsage?.limit === 999999
          const used = chamberUsage?.used ?? 1
          const planLimit = sub?.plan?.features?.find(f => f.feature_key === 'max_chambers' || f.feature_key === 'chambers')?.quota_limit
          const limit = (chamberUsage?.limit && chamberUsage.limit > 0) ? chamberUsage.limit : (isUnlimited ? -1 : (planLimit && Number(planLimit) > 0 ? Number(planLimit) : 2))
          const remainingChambers = Math.max(0, limit - used)
          const pct = isUnlimited ? 20 : Math.min(100, (limit > 0 ? Math.round((used / limit) * 100) : 0))
          const color = isExpired ? 'rose' : (pct >= 100 ? 'amber' : 'purple')

          return (
            <div className="doc-sub-kpi-card" key="chamber">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="doc-sub-kpi-label">সক্রিয় চেম্বার সংখ্যা</div>
                  <div className="doc-sub-kpi-value">
                    {used}{' '}
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>
                      / {isUnlimited ? '∞ আনলিমিটেড' : `${limit}টি চেম্বার`}
                    </span>
                  </div>
                </div>
                <div className="doc-sub-kpi-icon-wrap" style={{ background: isExpired ? 'rgba(239, 68, 68, 0.1)' : 'rgba(139, 92, 246, 0.1)', color: isExpired ? '#dc2626' : '#7c3aed' }}>
                  <Building2 size={18} />
                </div>
              </div>

              <div className="doc-sub-progress-track">
                <div className={`doc-sub-progress-bar ${color}`} style={{ width: `${pct}%` }} />
              </div>

              <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '11px', color: '#64748b' }}>
                <span>ফিজিক্যাল চেম্বার লোকেশন</span>
                <span style={{ fontWeight: 700, color: isExpired ? '#dc2626' : (pct >= 100 ? '#d97706' : '#059669') }}>
                  {isExpired ? 'কোটা স্থগিত' : (pct >= 100 ? 'কোটা পূর্ণ' : `${remainingChambers}টি চেম্বার খালি`)}
                </span>
              </div>
            </div>
          )
        })()}

        {/* Practice Billing & Renewal Metric */}
        <div className="doc-sub-kpi-card" key="billing">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="doc-sub-kpi-label">বিলিং ও রিনিউয়াল</div>
              <div className="doc-sub-kpi-value">
                {sub?.billing_cycle === 'annual' ? 'বাৎসরিক' : 'মাসিক'}{' '}
                <span style={{ fontSize: '12px', fontWeight: 600, color: isExpired ? '#dc2626' : '#10b981' }}>
                  ({isExpired ? (isTrial ? 'ট্রায়াল শেষ' : 'স্থগিত') : isTrial ? 'ফ্রি ট্রায়াল' : 'অটো-পে'})
                </span>
              </div>
            </div>
            <div className="doc-sub-kpi-icon-wrap" style={{ background: isExpired ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: isExpired ? '#dc2626' : '#d97706' }}>
              <Calendar size={18} />
            </div>
          </div>

          <div className="doc-sub-progress-track">
            <div
              className={`doc-sub-progress-bar ${isExpired ? 'rose' : 'amber'}`}
              style={{
                width: isExpired ? '100%' : (daysRemaining !== null && daysRemaining <= 30
                  ? `${Math.max(10, Math.round(((30 - Math.min(30, daysRemaining)) / 30) * 100))}%`
                  : '100%')
              }}
            />
          </div>

          <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '11px', color: '#64748b' }}>
            <span>{isExpired ? 'মেয়াদ শেষ হয়েছে' : 'পরবর্তী রিনিউয়াল তারিখ'}</span>
            <span style={{ fontWeight: 700, color: isExpired ? '#dc2626' : 'var(--admin-text, #0f172a)' }}>
              {sub?.current_period_ends_at
                ? new Date(sub.current_period_ends_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })
                : (isExpired ? 'অপেক্ষমাণ' : 'স্বয়ংক্রিয়')}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 6. ALL METERED PRACTICE QUOTAS DETAILS CARD ─── */}
      {usages.length > 0 && (
        <div className="doc-sub-card">
          <div className="doc-sub-card-header">
            <div className="d-flex align-items-center gap-3">
              <div
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'rgba(0, 184, 117, 0.1)',
                  color: '#00B875'
                }}
              >
                <Activity size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--admin-text, #0f172a)' }}>
                  প্র্যাকটিস কোটা ও ব্যবহারের বিস্তারিত তথ্য
                </h3>
                <p className="text-muted" style={{ fontSize: '12.5px', margin: '2px 0 0 0' }}>
                  আপনার চেম্বার, প্রেসক্রিপশন ও এসএমএস কোটার লাইভ স্ট্যাটাস এবং ভবিষ্যৎ পূর্বাভাস।
                </p>
              </div>
            </div>
          </div>

          <div className="row g-3">
            {usages.map((usage) => {
              const isUnlimited = usage.is_unlimited || usage.limit === -1 || usage.limit === 999999
              const percent = isUnlimited ? 15 : Math.min(100, usage.percentage || 0)
              const statusClass = usage.status === 'critical' ? 'rose' : usage.status === 'warning' ? 'amber' : 'emerald'

              return (
                <div key={usage.key} className="col-12 col-md-6 col-lg-4">
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      border: '1px solid var(--admin-border, #e2e8f0)',
                      background: 'var(--admin-bg, #f8fafc)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>
                            {usage.title}
                          </div>
                          <div className="text-muted" style={{ fontSize: '11px', marginTop: '1px' }}>
                            {usage.description}
                          </div>
                        </div>

                        {!usage.is_unlocked ? (
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: 'rgba(148, 163, 184, 0.15)',
                              color: '#64748b',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Lock size={10} /> লক করা
                          </span>
                        ) : (
                          <div style={{ fontSize: '13px', fontWeight: 800 }}>
                            {usage.used}{' '}
                            <span style={{ color: '#94a3b8', fontWeight: 500 }}>
                              / {isUnlimited ? 'আনলিমিটেড' : usage.limit}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="doc-sub-progress-track">
                        <div
                          className={`doc-sub-progress-bar ${statusClass}`}
                          style={{
                            width: !usage.is_unlocked ? '0%' : `${percent}%`,
                            opacity: !usage.is_unlocked ? 0.3 : 1
                          }}
                        />
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-2" style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {usage.forecasted_usage != null ? (
                        <span>
                          প্রত্যাশিত ব্যবহার:{' '}
                          <strong style={{ color: usage.projected_status === 'critical' ? '#ef4444' : '#10b981' }}>
                            ~{usage.forecasted_usage}
                          </strong>
                        </span>
                      ) : (
                        <span>
                          {usage.is_unlocked
                            ? (isUnlimited ? 'আনলিমিটেড সুবিধা' : `${percent}% ব্যবহৃত`)
                            : 'আপগ্রেড প্রয়োজন'}
                        </span>
                      )}

                      {!usage.is_unlocked && (
                        <button
                          onClick={() => document.getElementById('pricing-plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#00B875',
                            fontWeight: 700,
                            fontSize: '11px',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          ফিচার আনলক করুন →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── 7. PRACTICE PLANS & BILLING TOGGLE ─── */}
      <div id="pricing-plans-section" className="mb-5 pt-2">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3 pb-3 border-bottom border-secondary border-opacity-10">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  background: 'rgba(0, 184, 117, 0.1)',
                  color: '#00B875'
                }}
              >
                স্বচ্ছ ও সাশ্রয়ী টায়ার
              </span>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '6px 0 0 0', letterSpacing: '-0.3px', color: 'var(--admin-text, #0f172a)' }}>
              আপনার প্র্যাকটিস প্ল্যান বেছে নিন
            </h3>
            <p className="text-muted" style={{ fontSize: '13.5px', margin: '3px 0 0 0' }}>
              আপনার চেম্বার ও ডিজিটাল প্র্যাকটিস আরও প্রসারিত করুন। যেকোনো সময় সাশ্রয়ী মূল্যে আপগ্রেড করতে পারবেন।
            </p>
          </div>

          {/* Monthly / Annual Billing Toggle */}
          <div className="doc-sub-cycle-toggle">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`doc-sub-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
            >
              মাসিক বিলিং
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`doc-sub-toggle-btn ${billingCycle === 'annual' ? 'active' : ''}`}
            >
              <span>বাৎসরিক বিলিং</span>
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#059669',
                  fontWeight: 800,
                  textTransform: 'uppercase'
                }}
              >
                ~২০% সাশ্রয়
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="doc-sub-pricing-grid">
          {plans.map(plan => {
            const isCurrent = sub?.plan?.id === plan.id
            const tierKey = (plan.tier || '').toLowerCase()
            const isFree = tierKey === 'free' || Number(plan.price_monthly) === 0
            const displayPrice = isFree ? 0 : (billingCycle === 'annual' ? plan.price_annual : plan.price_monthly)
            const isPopular = plan.is_most_popular || plan.tier === 'professional'
            const isBestValue = !isFree && (plan.is_best_value || plan.tier === 'starter')
            const isProfessional = tierKey === 'professional'

            // Deduplicate features cleanly
            const cleanFeatures = (() => {
              const seen = new Set()
              return (plan.features || []).filter(f => {
                const name = (f.feature_name || '').trim().toLowerCase()
                if (seen.has(name)) return false
                seen.add(name)
                return true
              })
            })()

            return (
              <div
                key={plan.id}
                className={`doc-sub-plan-card ${isPopular ? 'popular' : ''} ${isCurrent ? 'current' : ''}`}
              >
                {isPopular && (
                  <div className="doc-sub-badge-popular">
                    <Sparkles size={13} />
                    <span>জনপ্রিয় পছন্দ</span>
                  </div>
                )}
                {!isPopular && isBestValue && (
                  <div className="doc-sub-badge-best-value">
                    <Check size={13} strokeWidth={3} />
                    <span>সর্বোত্তম সাশ্রয়ী</span>
                  </div>
                )}

                <div>
                  {/* Top Tier Badge & Active Indicator */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        background: isFree ? '#ecfdf5' : isProfessional ? '#f0fdf4' : '#eff6ff',
                        color: isFree ? '#047857' : isProfessional ? '#00B875' : '#1d4ed8',
                        border: `1px solid ${isFree ? '#a7f3d0' : isProfessional ? '#a7f3d0' : '#bfdbfe'}`
                      }}
                    >
                      {plan.tier_bn || plan.tier} টায়ার
                    </span>

                    {isCurrent && (
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 800,
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          padding: '3px 10px',
                          borderRadius: '999px'
                        }}
                      >
                        <CheckCircle2 size={13} /> সক্রিয় প্ল্যান
                      </span>
                    )}
                  </div>

                  {/* Plan Name & Description */}
                  <h4 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--admin-text, #0f172a)', letterSpacing: '-0.3px' }}>
                    {plan.name_bn || plan.name}
                  </h4>
                  <p className="text-muted" style={{ fontSize: '12.5px', minHeight: '44px', margin: 0, lineHeight: 1.55 }}>
                    {plan.description}
                  </p>

                  {/* Price Box */}
                  <div style={{ margin: '22px 0 18px' }}>
                    <div className="d-flex align-items-baseline gap-1">
                      <span style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '-0.5px', color: 'var(--admin-text, #0f172a)', lineHeight: 1 }}>
                        ৳ {isFree ? '০' : Number(displayPrice).toLocaleString()}
                      </span>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: isFree ? '#059669' : '#94a3b8' }}>
                        / {isFree ? `${plan.trial_period_days || 14} দিনের ট্রায়াল` : (billingCycle === 'annual' ? 'বাৎসরিক' : 'মাসিক')}
                      </span>
                    </div>

                    {/* Annual Savings Pill */}
                    <div style={{ minHeight: '26px', marginTop: '6px' }}>
                      {isFree ? (
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#047857',
                            fontWeight: 700,
                            background: '#ecfdf5',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            border: '1px solid #a7f3d0'
                          }}
                        >
                          <Check size={12} strokeWidth={3} />
                          <span>কোনো পেমেন্ট বা কার্ড প্রয়োজন নেই</span>
                        </div>
                      ) : billingCycle === 'annual' && plan.annual_savings_amount > 0 ? (
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#047857',
                            fontWeight: 700,
                            background: '#ecfdf5',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            border: '1px solid #a7f3d0'
                          }}
                        >
                          <Check size={12} strokeWidth={3} />
                          <span>বছরে ৳ {Number(plan.annual_savings_amount).toLocaleString()} সাশ্রয়</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                          স্ট্যান্ডার্ড প্র্যাকটিস ফি
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modern Feature Checklist */}
                  <div style={{ paddingTop: '16px', borderTop: '1px solid var(--admin-border, #e2e8f0)', fontSize: '12.5px' }}>
                    <div className="d-flex flex-column gap-2">
                      {cleanFeatures.map((f, idx) => {
                        const isUnlimited = f.is_unlimited || f.quota_limit === -1 || f.quota_limit === '-1'
                        const hasQuota = Number(f.quota_limit) > 0
                        const isAvailable = Boolean(f.is_enabled) && (isUnlimited || hasQuota)

                        return (
                          <div key={idx} className="d-flex align-items-center justify-content-between" style={{ padding: '3px 0' }}>
                            <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  width: 19,
                                  height: 19,
                                  borderRadius: '50%',
                                  background: isAvailable ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                                  color: isAvailable ? '#059669' : '#94a3b8',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}
                              >
                                {isAvailable ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={2.5} />}
                              </div>
                              <span
                                style={{
                                  fontSize: '12.5px',
                                  fontWeight: isAvailable ? 500 : 400,
                                  color: isAvailable ? 'var(--admin-text, #334155)' : '#94a3b8',
                                  textDecoration: isAvailable ? 'none' : 'line-through',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {f.feature_name}
                              </span>
                            </div>

                            {isAvailable && (
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                  padding: '2px 7px',
                                  borderRadius: '6px',
                                  background: 'rgba(0, 0, 0, 0.04)',
                                  color: '#475569',
                                  flexShrink: 0,
                                  marginLeft: '8px'
                                }}
                              >
                                {isUnlimited
                                  ? 'আনলিমিটেড'
                                  : f.feature_key === 'max_chambers'
                                  ? `${f.quota_limit}টি চেম্বার`
                                  : `${f.quota_limit}/মাস`}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div style={{ paddingTop: '20px', marginTop: '20px', borderTop: '1px solid var(--admin-border, #e2e8f0)' }}>
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-100"
                      style={{
                        padding: '12px',
                        background: isExpired ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.1)',
                        border: isExpired ? '1.5px solid rgba(239, 68, 68, 0.25)' : '1.5px solid rgba(16, 185, 129, 0.3)',
                        color: isExpired ? '#dc2626' : '#059669',
                        fontWeight: 700,
                        borderRadius: '12px',
                        fontSize: '13px',
                        cursor: 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      {isExpired ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
                      <span>{isExpired ? 'মেয়াদোত্তীর্ণ প্ল্যান (আপগ্রেড করুন)' : 'বর্তমান সক্রিয় প্ল্যান'}</span>
                    </button>
                  ) : overview?.is_checkout_locked ? (
                    <button
                      disabled
                      title="পেমেন্ট যাচাইয়ের অপেক্ষায় থাকায় প্ল্যান পরিবর্তন লক রয়েছে"
                      className="w-100"
                      style={{
                        padding: '12px',
                        background: 'var(--admin-bg, #f1f5f9)',
                        border: '1px solid var(--admin-border, #e2e8f0)',
                        color: '#94a3b8',
                        fontWeight: 700,
                        borderRadius: '12px',
                        fontSize: '13px',
                        cursor: 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Lock size={14} />
                      <span>পেমেন্ট ভেরিফিকেশন চলছে</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleProceedToCheckout(plan)}
                      className="doc-sub-btn-primary w-100"
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 700,
                        background: isFree ? '#059669' : undefined,
                        boxShadow: isFree ? '0 4px 14px rgba(5, 150, 105, 0.25)' : undefined
                      }}
                    >
                      {isFree ? (
                        <>
                          <Sparkles size={14} />
                          <span>১৪ দিনের ফ্রি ট্রায়াল শুরু করুন</span>
                        </>
                      ) : (
                        <>
                          <Zap size={14} />
                          <span>চেকআউট ও পেমেন্টে এগিয়ে যান</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Feature Comparison Matrix Toggle */}
        <div className="text-center mb-4">
          <button
            onClick={() => setShowComparisonMatrix(!showComparisonMatrix)}
            className="doc-sub-btn-secondary"
            style={{ fontWeight: 700 }}
          >
            <Layers size={15} style={{ color: '#00B875' }} />
            <span>{showComparisonMatrix ? 'ফিচার তালিকা লুকান' : 'সকল ফিচারের বিস্তারিত তুলনা দেখুন'}</span>
            {showComparisonMatrix ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {/* Toggleable Feature Comparison Matrix Table */}
        {showComparisonMatrix && (
          <div className="doc-sub-card doc-sub-fade-in mb-4" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="p-4 border-bottom border-secondary border-opacity-10">
              <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--admin-text, #0f172a)' }}>
                ক্লিনিক্যাল ফিচার ও সুবিধার সম্পূর্ণ তুলনা
              </h4>
              <p className="text-muted" style={{ fontSize: '12.5px', margin: '2px 0 0 0' }}>
                বিভিন্ন প্র্যাকটিস প্ল্যানে অন্তর্ভুক্ত সকল সুবিধার তুলনামূলক তালিকা।
              </p>
            </div>
            <div className="doc-sub-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="doc-sub-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>ফিচার / সুবিধা</th>
                    {plans.map(p => (
                      <th key={p.id} style={{ textAlign: 'center', width: `${60 / plans.length}%` }}>
                        {p.name_bn || p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      keys: ['max_chambers', 'chambers'],
                      label: 'চেম্বার সংখ্যা (Physical Locations)',
                      format: (limit, isUnlimited) => isUnlimited ? '∞ আনলিমিটেড' : `${limit}টি চেম্বার`
                    },
                    {
                      keys: ['live_queue', 'appointments'],
                      label: 'দৈনিক অ্যাপয়েন্টমেন্ট ও লাইভ কিউ',
                      format: (limit, isUnlimited) => isUnlimited ? '∞ আনলিমিটেড' : `${limit} / মাস`
                    },
                    {
                      keys: ['eprescription', 'prescriptions'],
                      label: 'ডিজিটাল প্রেসক্রিপশন তৈরি',
                      format: (limit, isUnlimited) => isUnlimited ? '∞ আনলিমিটেড' : `${limit} / মাস`
                    },
                    {
                      keys: ['telemedicine', 'telemedicine_calls'],
                      label: 'টেলিমেডিসিন ভিডিও কনসালটেশন',
                      format: (limit, isUnlimited) => isUnlimited ? '∞ আনলিমিটেড' : `${limit} সেশন / মাস`
                    },
                    {
                      keys: ['sms_reminders', 'patient_sms', 'sms_notifications'],
                      label: 'রোগীদের স্বয়ংক্রিয় এসএমএস রিমাইন্ডার',
                      format: (limit, isUnlimited) => isUnlimited ? '∞ আনলিমিটেড' : `${limit}টি / মাস`
                    },
                    {
                      keys: ['advanced_analytics', 'analytics'],
                      label: 'অ্যানালিটিক্স ও প্র্যাকটিস আয়ের রিপোর্ট',
                      tierOverride: (p) => p.tier === 'professional' || p.tier === 'enterprise'
                    },
                    {
                      keys: ['priority_support'],
                      label: 'ডেডিকেটেড প্রায়োরিটি হেল্পলাইন সাপোর্ট',
                      tierOverride: (p) => p.tier === 'professional' || p.tier === 'enterprise'
                    }
                  ].map(feat => (
                    <tr key={feat.label}>
                      <td style={{ fontWeight: 600 }}>{feat.label}</td>
                      {plans.map(p => {
                        const pf = p.features?.find(f => feat.keys.includes(f.feature_key))
                        const isUnlimited = pf?.is_unlimited || pf?.quota_limit === -1 || pf?.quota_limit === '-1'
                        const hasQuota = Number(pf?.quota_limit) > 0
                        const isGrantedByTier = feat.tierOverride ? feat.tierOverride(p) : false
                        const isAvailable = (Boolean(pf?.is_enabled) && (isUnlimited || hasQuota)) || isGrantedByTier

                        return (
                          <td key={p.id} style={{ textAlign: 'center' }}>
                            {isAvailable ? (
                              isUnlimited ? (
                                <span style={{ color: '#00B875', fontWeight: 800 }}>∞ আনলিমিটেড</span>
                              ) : hasQuota ? (
                                <span style={{ fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>
                                  {feat.format ? feat.format(pf.quota_limit, false) : `${pf.quota_limit} / মাস`}
                                </span>
                              ) : (
                                <Check size={18} style={{ color: '#00B875' }} />
                              )
                            ) : (
                              <X size={16} style={{ color: '#cbd5e1' }} />
                            )}
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

      {/* ─── 8. DOCTOR PRACTICE PERKS & ASSURANCES DECK ─── */}
      <div className="doc-sub-card">
        <div className="doc-sub-card-header">
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                padding: '10px',
                borderRadius: '12px',
                background: 'rgba(0, 184, 117, 0.1)',
                color: '#00B875'
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--admin-text, #0f172a)' }}>
                ডক্টর বুকলেট ক্লিনিক্যাল প্র্যাকটিস সুবিধাসমূহ
              </h3>
              <p className="text-muted" style={{ fontSize: '12.5px', margin: '2px 0 0 0' }}>
                আধুনিক চিকিৎসকদের জন্য বিশেষায়িত ডিজিটাল প্রযুক্তি, নিরাপত্তা ও সেবা নিশ্চিতকরণ।
              </p>
            </div>
          </div>
        </div>

        <div className="doc-sub-perks-grid">
          <div className="doc-sub-perk-card">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span style={{ fontSize: '20px' }}>🩺</span>
              <h5 style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>স্মার্ট প্রেসক্রিপশন ইঞ্জিন</h5>
            </div>
            <p className="text-muted" style={{ fontSize: '12px', margin: 0, lineHeight: 1.5 }}>
              এক ক্লিকে ড্রাগ সাজেস্ট, জেনেরিক ও ব্র্যান্ড ডাটাবেস, ড্রাগ-ড্রাগ ইন্টারঅ্যাকশন এলার্ট এবং অটো প্রেসক্রিপশন প্রিন্ট সুবিধা।
            </p>
          </div>

          <div className="doc-sub-perk-card">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span style={{ fontSize: '20px' }}>📅</span>
              <h5 style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>স্মার্ট কিউ ও চেম্বার সিঙ্ক</h5>
            </div>
            <p className="text-muted" style={{ fontSize: '12px', margin: 0, lineHeight: 1.5 }}>
              লাইভ সিরিয়াল ট্র্যাকিং, রোগী আগমনের রিয়েল-টাইম নোটিফিকেশন এবং একাধিক চেম্বারের আলাদা শিডিউল পরিচালনা।
            </p>
          </div>

          <div className="doc-sub-perk-card">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span style={{ fontSize: '20px' }}>🔒</span>
              <h5 style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>বিএমডিসি ও ডাটা সিকিউরিটি</h5>
            </div>
            <p className="text-muted" style={{ fontSize: '12px', margin: 0, lineHeight: 1.5 }}>
              রোগীদের সংবেদনশীল স্বাস্থ্য তথ্যের সর্বোচ্চ গোপনীয়তা রক্ষা, ২৫৬-বিট এসএসএল এনক্রিপশন এবং অটো ক্লাউড ব্যাকআপ।
            </p>
          </div>

          <div className="doc-sub-perk-card">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span style={{ fontSize: '20px' }}>💬</span>
              <h5 style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>স্বয়ংক্রিয় এসএমএস ও হেল্পলাইন</h5>
            </div>
            <p className="text-muted" style={{ fontSize: '12px', margin: 0, lineHeight: 1.5 }}>
              রোগীদের অ্যাপয়েন্টমেন্ট কনফার্মেশন ও দেরি সতর্কবার্তা এসএমএস, সাথে যেকোনো প্রয়োজনে ২৪/৭ ডেডিকেটেড সাপোর্ট হেল্পলাইন।
            </p>
          </div>
        </div>
      </div>

      {/* ─── 9. BILLING INVOICES & OFFICIAL RECEIPTS ─── */}
      <div className="doc-sub-card">
        <div className="doc-sub-card-header">
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                padding: '10px',
                borderRadius: '12px',
                background: 'rgba(0, 184, 117, 0.1)',
                color: '#00B875'
              }}
            >
              <FileText size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--admin-text, #0f172a)' }}>
                বিলিং ইনভয়েস ও অফিশিয়াল রসিদ
              </h3>
              <p className="text-muted" style={{ fontSize: '12.5px', margin: '2px 0 0 0' }}>
                অফিসিয়াল বিলিং রসিদ ডাউনলোড করুন অথবা আপনার ভেরিফাইড ইমেইলে ভ্যাট/ট্যাক্স অনুমোদিত কপি পাঠান।
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/subscription/history')}
            className="doc-sub-btn-secondary"
            style={{ fontSize: '12.5px' }}
          >
            <span>সকল হিস্ট্রি দেখুন</span>
            <ChevronRight size={13} />
          </button>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-5 text-muted" style={{ fontSize: '13.5px' }}>
            <FileText size={40} className="mx-auto mb-2 opacity-50 text-muted" />
            <div style={{ fontWeight: 600 }}>এখনও কোনো বিলিং ইনভয়েস রেকর্ড তৈরি হয়নি</div>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              নতুন কোনো প্ল্যান সাবস্ক্রিপশন সম্পন্ন হলে স্বয়ংক্রিয়ভাবে এখানে অফিশিয়াল মানি রিসিট পাওয়া যাবে।
            </p>
          </div>
        ) : (
          <div className="doc-sub-table-wrapper">
            <table className="doc-sub-table">
              <thead>
                <tr>
                  <th>ইনভয়েস নম্বর</th>
                  <th>বিলিং তারিখ</th>
                  <th>মোট পরিমাণ</th>
                  <th>অবস্থা</th>
                  <th style={{ textAlign: 'right' }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(0, 0, 0, 0.05)',
                          fontSize: '12px'
                        }}
                      >
                        {inv.invoice_number}
                      </span>
                    </td>
                    <td className="text-muted">
                      {new Date(inv.issue_date).toLocaleDateString('bn-BD', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td style={{ fontWeight: 800 }}>
                      ৳ {Number(inv.total_amount).toLocaleString()}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          background: inv.status === 'paid' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: inv.status === 'paid' ? '#059669' : '#d97706'
                        }}
                      >
                        ● {inv.status === 'paid' ? 'পরিশোধিত' : inv.status === 'pending' ? 'অপেক্ষমাণ' : inv.status === 'failed' ? 'ব্যর্থ' : inv.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="d-inline-flex align-items-center gap-2">
                        <button
                          onClick={() => handleEmailInvoice(inv.id, inv.invoice_number)}
                          disabled={emailingInvoiceId === inv.id}
                          className="doc-sub-btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          title="ইমেইলে ইনভয়েস পাঠান"
                        >
                          <Mail size={13} />
                          <span>{emailingInvoiceId === inv.id ? 'পাঠানো হচ্ছে...' : 'ইমেইল'}</span>
                        </button>

                        <button
                          onClick={handlePrintInvoice}
                          className="doc-sub-btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          title="ইনভয়েস রসিদ প্রিন্ট করুন"
                        >
                          <Printer size={13} />
                          <span>প্রিন্ট</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── 10. SUBSCRIPTION CANCELLATION MODAL (PORTAL) ─── */}
      {showCancelModal && createPortal(
        <div className="doc-sub-modal-backdrop" onClick={() => setShowCancelModal(false)}>
          <div className="doc-sub-modal doc-sub-fade-in" onClick={e => e.stopPropagation()}>
            <div className="d-flex align-items-center gap-2 mb-3" style={{ color: '#dc2626' }}>
              <div
                style={{
                  padding: '8px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#dc2626'
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--admin-text, #0f172a)' }}>
                সাবস্ক্রিপশন বাতিল নিশ্চিতকরণ
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
              আপনি কি নিশ্চিত যে চলমান সাবস্ক্রিপশন বাতিল করতে চান? আপনার বর্তমান বিলিং সাইকেলের শেষ দিন ({' '}
              <strong>
                {sub?.current_period_ends_at
                  ? new Date(sub.current_period_ends_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'সাইকেলের সমাপ্তি'}
              </strong>{' '}
              ) পর্যন্ত ডিজিটাল প্রেসক্রিপশন ও চেম্বার ম্যানেজমেন্টের সকল সুবিধা পুরোদমে চালু থাকবে।
            </p>

            <div className="d-flex justify-content-end gap-2 pt-3 mt-4" style={{ borderTop: '1px solid var(--admin-border, #e2e8f0)' }}>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="doc-sub-btn-secondary"
              >
                সাবস্ক্রিপশন চালু রাখুন
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelSub}
                disabled={cancellingSub}
                className="doc-sub-btn-danger"
              >
                {cancellingSub ? 'প্রক্রিয়াধীন...' : 'বাতিল নিশ্চিত করুন'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── 11. PRORATION PREVIEW & TIER SWITCH MODAL (PORTAL) ─── */}
      {selectedPlan && createPortal(
        <div className="doc-sub-modal-backdrop" onClick={() => { setSelectedPlan(null); setPreview(null) }}>
          <div className="doc-sub-modal doc-sub-fade-in" onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--admin-text, #0f172a)' }}>
                  প্ল্যান পরিবর্তনের প্রোরেশন ও নিশ্চিতকরণ
                </h3>
                <p className="text-muted" style={{ fontSize: '12.5px', margin: '2px 0 0 0' }}>
                  <strong style={{ color: '#00B875' }}>{selectedPlan.name_bn || selectedPlan.name}</strong>-এ পরিবর্তন হচ্ছে ({billingCycle === 'annual' ? 'বাৎসরিক' : 'মাসিক'} সাইকেল)
                </p>
              </div>
              <button
                onClick={() => { setSelectedPlan(null); setPreview(null) }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
              >
                <X size={20} />
              </button>
            </div>

            {previewLoading ? (
              <div className="text-center py-5">
                <RefreshCw size={24} className="animate-spin text-muted mx-auto mb-2" />
                <div className="text-muted" style={{ fontSize: '13px' }}>সঠিক প্রোরেশন হিসাব করা হচ্ছে...</div>
              </div>
            ) : preview ? (
              <div className="space-y-3">
                <div
                  style={{
                    borderRadius: '14px',
                    padding: '16px',
                    background: 'rgba(0, 184, 117, 0.04)',
                    border: '1px solid rgba(0, 184, 117, 0.15)'
                  }}
                >
                  <div className="d-flex justify-content-between mb-2" style={{ fontSize: '13px' }}>
                    <span className="text-muted">নতুন প্ল্যান চার্জ ({preview.billing_cycle === 'annual' ? 'বাৎসরিক' : 'মাসিক'})</span>
                    <span style={{ fontWeight: 700 }}>৳ {Number(preview.new_plan_charge).toLocaleString()}</span>
                  </div>

                  {preview.current_plan_credit > 0 && (
                    <div className="d-flex justify-content-between mb-2" style={{ fontSize: '13px', color: '#10b981' }}>
                      <span>অব্যবহৃত ব্যালেন্স ছাড় / ক্রেডিট</span>
                      <span style={{ fontWeight: 700 }}>-৳ {Number(preview.current_plan_credit).toLocaleString()}</span>
                    </div>
                  )}

                  <div className="d-flex justify-content-between pt-2 border-top border-secondary border-opacity-10" style={{ fontSize: '15px', fontWeight: 800 }}>
                    <span>সর্বমোট প্রদেয় পরিমাণ</span>
                    <span style={{ color: '#00B875' }}>৳ {Number(preview.net_amount_due).toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-muted" style={{ fontSize: '11.5px', lineHeight: 1.5, marginTop: '8px' }}>
                  দ্রষ্টব্য: নতুন প্র্যাকটিস কোটা ও ক্লিনিক্যাল ফিচার অ্যাডমিন যাচাইয়ের পর স্বয়ংক্রিয়ভাবে সক্রিয় হয়ে যাবে।
                </div>

                <div className="d-flex justify-content-end gap-2 pt-3 mt-3 border-top border-secondary border-opacity-10">
                  <button
                    type="button"
                    onClick={() => { setSelectedPlan(null); setPreview(null) }}
                    className="doc-sub-btn-secondary"
                  >
                    বাতিল করুন
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProceedToCheckout(selectedPlan)}
                    className="doc-sub-btn-primary"
                    style={{ width: 'auto', padding: '10px 24px' }}
                  >
                    <span>পেমেন্ট ও চেকআউটে এগিয়ে যান</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>,
        document.body
      )}

      {/* ─── 12. LIFECYCLE TIMELINE DRAWER (PORTAL) ─── */}
      {showTimeline && createPortal(
        <div className="doc-sub-drawer-backdrop" onClick={() => setShowTimeline(false)}>
          <div className="doc-sub-drawer doc-sub-fade-in" onClick={e => e.stopPropagation()}>
            <div className="doc-sub-drawer-header">
              <div className="d-flex align-items-center gap-2">
                <Activity size={18} style={{ color: '#00B875' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--admin-text, #0f172a)' }}>
                  সাবস্ক্রিপশন লাইফসাইকেল টাইমলাইন
                </h3>
              </div>
              <button
                onClick={() => setShowTimeline(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="doc-sub-drawer-body">
              <div className="d-flex flex-column gap-3">
                {timeline.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', padding: '48px 0' }}>
                    এই সাবস্ক্রিপশনের জন্য এখনও কোনো লাইফসাইকেল ইভেন্ট রেকর্ড নেই।
                  </div>
                ) : (
                  timeline.map((event) => (
                    <div key={event.id} className="doc-sub-timeline-item">
                      <div className="doc-sub-timeline-dot" />
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>
                        {event.title}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', lineHeight: 1.5 }}>
                        {event.description}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>
                          {new Date(event.occurred_at).toLocaleString('bn-BD', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span>•</span>
                        <span>দ্বারা: {event.performed_by}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

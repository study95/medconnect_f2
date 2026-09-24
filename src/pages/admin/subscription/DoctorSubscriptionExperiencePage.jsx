// DoctorSubscriptionExperiencePage.jsx — Phase 4.1 & 4.4 Enterprise Doctor Subscription Management
import React, { useState, useEffect } from 'react'
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
  CreditCard, Check, AlertTriangle, Clock, Zap, Shield,
  ArrowUpRight, RefreshCw, Lock, FileText, Calendar,
  Info, AlertCircle, CheckCircle2, ChevronRight, X, Mail,
  Printer, ArrowRight, ExternalLink, Sparkles, Activity,
  Layers, ChevronDown, ChevronUp, Download, Eye, History
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
        text: err.response?.data?.message || 'Failed to load billing details. Please try again.'
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
        text: err.response?.data?.message || 'Error calculating plan change preview.'
      })
      setSelectedPlan(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  // Redirect to Checkout — the ONLY way to subscribe or change plans.
  // Enforces: gateway selection → txn ref → slip upload → pending state → admin approval.
  const handleProceedToCheckout = (plan) => {
    navigate(`/admin/subscription/checkout?plan_id=${plan.id}&cycle=${billingCycle}`)
  }

  const handleCancelSub = async () => {
    if (!window.confirm('Are you sure you want to cancel your active subscription? Your clinical features will remain fully available until the end of your billing cycle.')) {
      return
    }
    try {
      await cancelDoctorBillingSubscription(false)
      setActionFeedback({
        type: 'info',
        text: 'Subscription cancellation scheduled for the end of the billing period.'
      })
      loadData(true)
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Error cancelling subscription.'
      })
    }
  }

  const handleEmailInvoice = async (invoiceId, invoiceNumber) => {
    try {
      setEmailingInvoiceId(invoiceId)
      const res = await emailDoctorInvoice(invoiceId)
      setActionFeedback({
        type: 'success',
        text: res.message || `Invoice #${invoiceNumber} has been queued to your email.`
      })
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to email invoice receipt.'
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
          সক্রিয় প্ল্যান
        </span>
      )
    }
    if (s === 'trialing') {
      return (
        <span className="doc-sub-badge-status trialing">
          <span className="doc-sub-dot pulse" style={{ background: '#6366f1' }} />
          ফ্রি ট্রায়াল
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
      <div className="doc-sub-container space-y-6">
        <div className="doc-sub-skeleton" style={{ height: '36px', width: '320px' }} />
        <div className="doc-sub-skeleton" style={{ height: '180px', width: '100%', borderRadius: '20px' }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="doc-sub-skeleton" style={{ height: '120px', borderRadius: '16px' }} />
          ))}
        </div>
        <div className="doc-sub-skeleton" style={{ height: '360px', width: '100%', borderRadius: '20px' }} />
      </div>
    )
  }

  const sub = overview?.subscription
  const banners = overview?.banners || {}
  const usages = overview?.usages || []
  const invoices = overview?.invoices || []
  const timeline = overview?.timeline || []
  const pendingRequest = overview?.pending_request
  const pendingPayment = overview?.pending_payment
  const stagedRenewal = banners.staged_renewal

  return (
    <div className="doc-sub-container doc-sub-fade-in">
      {/* ─── PAGE HEADER & CONTROLS ─── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '12px', fontWeight: 600 }}>
            <span>ড্যাশবোর্ড</span>
            <ChevronRight size={13} />
            <span style={{ color: 'var(--admin-primary, #00B875)' }}>সাবস্ক্রিপশন ও প্র্যাকটিস প্ল্যান</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0 0 0', letterSpacing: '-0.4px' }}>
            ডাক্তার সাবস্ক্রিপশন ব্যবস্থাপনা
          </h1>
          <p className="text-muted" style={{ fontSize: '13.5px', margin: '4px 0 0 0' }}>
            ডিজিটাল প্রেসক্রিপশন, চেম্বার কোটা, বিলিং ইনভয়েস ও সাবস্ক্রিপশন প্ল্যান নিয়ন্ত্রণ করুন।
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={() => navigate('/admin/subscription/history')}
            className="doc-sub-btn-secondary"
            title="সাবস্ক্রিপশন ও পেমেন্টের ইতিহাস দেখুন"
          >
            <History size={15} style={{ color: '#00B875' }} />
            <span>সাবস্ক্রিপশন হিস্ট্রি</span>
          </button>

          {timeline.length > 0 && (
            <button
              onClick={() => setShowTimeline(true)}
              className="doc-sub-btn-secondary"
              title="লাইফসাইকেল টাইমলাইন দেখুন"
            >
              <Activity size={15} style={{ color: '#00B875' }} />
              <span>টাইমলাইন রেকর্ড</span>
            </button>
          )}

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="doc-sub-btn-secondary"
            title="তথ্য রিফ্রেশ করুন"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'সিঙ্ক হচ্ছে...' : 'সিঙ্ক করুন'}</span>
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
                ম্যানুয়াল পেমেন্ট যাচাইকরণ প্রক্রিয়াধীন
              </div>
              <div style={{ fontSize: '12.5px', opacity: 0.95, marginTop: '2px' }}>
                {overview.lock_reason || 'আপনার প্রেরিত পেমেন্ট তথ্যটি অ্যাডমিন কর্তৃক যাচাই করা হচ্ছে।'}{' '}
                {pendingPayment && (
                  <span style={{ fontWeight: 700 }}>
                    (রেফারেন্স: {pendingPayment.transaction_reference}, ৳ {Number(pendingPayment.amount).toLocaleString()})
                  </span>
                )}
              </div>
            </div>
          </div>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(245, 158, 11, 0.25)',
              color: '#92400e',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            অ্যাডমিন পর্যালোচনায় আছে
          </span>
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
              <Zap size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14.5px' }}>
                প্ল্যান পরিবর্তনের অনুরোধ অনুমোদনের অপেক্ষায়
              </div>
              <div style={{ fontSize: '12.5px', opacity: 0.95, marginTop: '2px' }}>
                আপনি <span style={{ fontWeight: 700 }}>{pendingRequest.target_plan}</span> ({pendingRequest.target_cycle === 'annual' ? 'বাৎসরিক' : 'মাসিক'}) প্ল্যানে পরিবর্তনের অনুরোধ পাঠিয়েছেন। সমন্বিত প্রদেয় ফি:{' '}
                <span style={{ fontWeight: 700 }}>৳ {Number(pendingRequest.amount_due).toLocaleString()}</span>। অ্যাডমিন অনুমোদনের পর তা কার্যকর হবে।
              </div>
            </div>
          </div>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(59, 130, 246, 0.25)',
              color: '#1e40af',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase'
            }}
          >
            পরিবর্তন অপেক্ষমাণ
          </span>
        </div>
      )}

      {/* ─── 3. STAGED RENEWAL / EXPIRATION BANNER ─── */}
      {stagedRenewal && (
        <div className={`doc-sub-banner ${stagedRenewal.urgency === 'critical' ? 'danger' : 'warning'} doc-sub-fade-in`}>
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: stagedRenewal.urgency === 'critical' ? '#ef4444' : '#f59e0b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {stagedRenewal.urgency === 'critical' ? <Lock size={20} /> : <AlertTriangle size={20} />}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14.5px' }}>{stagedRenewal.headline}</div>
              <div style={{ fontSize: '12.5px', opacity: 0.95, marginTop: '2px' }}>{stagedRenewal.message}</div>
            </div>
          </div>
          <button
            onClick={() => document.getElementById('pricing-plans-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="doc-sub-btn-secondary"
            style={{
              fontWeight: 800,
              background: stagedRenewal.urgency === 'critical' ? '#ef4444' : '#f59e0b',
              color: '#ffffff',
              borderColor: 'transparent'
            }}
          >
            <span>{stagedRenewal.action_label || 'প্ল্যান রিনিউ করুন'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ─── 4. PREMIUM HERO CARD ─── */}
      <div className="doc-sub-hero">
        <div className="doc-sub-hero-glow" />

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-4 position-relative">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  background: 'rgba(0, 184, 117, 0.12)',
                  color: '#00B875',
                  border: '1px solid rgba(0, 184, 117, 0.25)'
                }}
              >
                {sub?.plan?.tier || 'Free'} Tier
              </span>
              {renderStatusBadge(sub?.status)}
              {sub?.auto_renew && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: '6px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#4f46e5'
                  }}
                >
                  অটো-রিনিউ সক্রিয়
                </span>
              )}
            </div>

            <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '6px 0 4px 0', letterSpacing: '-0.4px' }}>
              {sub?.plan?.name || 'কমিউনিটি প্র্যাকটিস প্ল্যান'}
            </h2>

            <p className="text-muted" style={{ fontSize: '13.5px', margin: 0 }}>
              {sub?.current_period_ends_at ? (
                <>
                  বর্তমান সাবস্ক্রিপশন মেয়াদ শেষ হবে{' '}
                  <span style={{ fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>
                    {new Date(sub.current_period_ends_at).toLocaleDateString('bn-BD', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>{' '}
                  (আর {banners.days_remaining ?? 0} দিন বাকি)
                </>
              ) : (
                'ডক্টর বুকলেট প্ল্যাটফর্মে স্ট্যান্ডার্ড প্র্যাকটিস প্রোফাইল।'
              )}
            </p>
          </div>

          <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-4">
            <div className="text-sm-end">
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                বর্তমান রেট
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--admin-text, #0f172a)' }}>
                ৳ {Number(sub?.current_price || sub?.plan?.price_monthly || 0).toLocaleString()}
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>
                  {' '}/ {sub?.billing_cycle === 'annual' ? 'বাৎসরিক' : 'মাসিক'}
                </span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                onClick={() => document.getElementById('pricing-plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="doc-sub-btn-primary"
                style={{ width: 'auto', padding: '10px 22px' }}
              >
                <Sparkles size={15} />
                <span>প্ল্যান পরিবর্তন</span>
              </button>

              {sub?.status === 'active' && !sub?.canceled_at && (
                <button
                  onClick={handleCancelSub}
                  className="doc-sub-btn-secondary"
                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  title="চলমান সাবস্ক্রিপশন বাতিল করুন"
                >
                  বাতিল করুন
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 5. PRACTICE QUOTA & USAGE GAUGES ─── */}
      <div className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, letterSpacing: '-0.2px' }}>
              প্র্যাকটিস কোটা ও ব্যবহার পরিসংখ্যান
            </h3>
            <p className="text-muted" style={{ fontSize: '13px', margin: '2px 0 0 0' }}>
              আপনার চেম্বার, প্রেসক্রিপশন ও অন্যান্য ফিচারের লাইভ ব্যবহার পরিসংখ্যান।
            </p>
          </div>
        </div>

        <div className="doc-sub-usage-grid">
          {usages.map((usage) => {
            const isUnlimited = usage.is_unlimited
            const percent = isUnlimited ? 15 : Math.min(100, usage.percentage || 0)
            const statusClass = usage.status === 'critical' ? 'critical' : usage.status === 'warning' ? 'warning' : 'normal'

            return (
              <div key={usage.key} className="doc-sub-usage-card">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700 }}>{usage.title}</div>
                    <div className="text-muted" style={{ fontSize: '11.5px', marginTop: '1px' }}>
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
                      {usage.used} <span style={{ color: '#94a3b8', fontWeight: 500 }}>/ {isUnlimited ? 'আনলিমিটেড' : usage.limit}</span>
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

                <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {usage.forecasted_usage != null ? (
                    <span>
                      প্রত্যাশিত ব্যবহার:{' '}
                      <strong style={{ color: usage.projected_status === 'critical' ? '#ef4444' : '#10b981' }}>
                        ~{usage.forecasted_usage}
                      </strong>
                    </span>
                  ) : (
                    <span>{usage.is_unlocked ? (isUnlimited ? 'আনলিমিটেড সুবিধা' : `${percent}% ব্যবহৃত`) : 'আপগ্রেড প্রয়োজন'}</span>
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
            )
          })}
        </div>
      </div>

      {/* ─── 6. PRACTICE PLANS & BILLING TOGGLE ─── */}
      <div id="pricing-plans-section" className="mb-5 pt-3">
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
                Transparent Tiers
              </span>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '6px 0 0 0', letterSpacing: '-0.3px' }}>
              আপনার প্র্যাকটিস প্ল্যান বেছে নিন
            </h3>
            <p className="text-muted" style={{ fontSize: '13.5px', margin: '3px 0 0 0' }}>
              আপনার চেম্বার ও ডিজিটাল প্র্যাকটিস আরও প্রসারিত করুন। যেকোনো সময় প্ল্যান আপগ্রেড বা পরিবর্তন করতে পারবেন।
            </p>
          </div>

          {/* Monthly / Annual Billing Segmented Switch */}
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
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '6px',
                  background: '#dcfce7',
                  color: '#15803d'
                }}
              >
                ২০% ছাড়
              </span>
            </button>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="doc-sub-pricing-grid">
          {plans.map((plan) => {
            const isCurrent = sub?.plan?.id === plan.id
            const displayPrice = billingCycle === 'annual' ? plan.price_annual : plan.price_monthly
            const monthlyEquiv = billingCycle === 'annual' ? Math.round(plan.price_annual / 12) : plan.price_monthly
            const isPopular = plan.is_most_popular || plan.tier === 'professional'
            const isBestValue = plan.is_best_value || plan.tier === 'starter'

            return (
              <div
                key={plan.id}
                className={`doc-sub-plan-card ${isPopular ? 'popular' : ''} ${isCurrent ? 'current' : ''}`}
              >
                {isPopular && <div className="doc-sub-badge-popular">★ জনপ্রিয় পছন্দ</div>}
                {!isPopular && isBestValue && <div className="doc-sub-badge-best-value">সর্বোত্তম সাশ্রয়ী</div>}

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        background: 'rgba(148, 163, 184, 0.15)',
                        color: '#475569'
                      }}
                    >
                      {plan.tier}
                    </span>

                    {isCurrent && (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#6366f1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} /> বর্তমান প্ল্যান
                      </span>
                    )}
                  </div>

                  <h4 style={{ fontSize: '20px', fontWeight: 800, margin: '8px 0 4px 0' }}>{plan.name_bn || plan.name}</h4>
                  <p className="text-muted" style={{ fontSize: '12.5px', minHeight: '36px', margin: 0 }}>
                    {plan.description}
                  </p>

                  <div className="my-4">
                    <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                      ৳ {Number(displayPrice).toLocaleString()}
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>
                        {' '}/ {billingCycle === 'annual' ? 'বাৎসরিক' : 'মাসিক'}
                      </span>
                    </div>

                    {billingCycle === 'annual' && plan.annual_savings_amount > 0 && (
                      <div style={{ fontSize: '11.5px', color: '#10b981', fontWeight: 700, marginTop: '2px' }}>
                        বার্ষিক সাশ্রয় ৳ {Number(plan.annual_savings_amount).toLocaleString()} (~৳ {monthlyEquiv.toLocaleString()}/মাস)
                      </div>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="pt-3 border-top border-secondary border-opacity-10 space-y-2" style={{ fontSize: '12.5px' }}>
                    {plan.features?.map((f, idx) => {
                      const isUnlimited = f.is_unlimited || f.quota_limit === -1 || f.quota_limit === '-1'
                      const hasQuota = Number(f.quota_limit) > 0
                      const isAvailable = Boolean(f.is_enabled) && (isUnlimited || hasQuota)

                      return (
                        <div key={idx} className="d-flex align-items-center gap-2">
                          {isAvailable ? (
                            <Check size={15} style={{ color: '#10b981', flexShrink: 0 }} />
                          ) : (
                            <X size={15} style={{ color: '#cbd5e1', flexShrink: 0 }} />
                          )}
                          <span
                            style={{
                              color: isAvailable ? 'var(--admin-text, #0f172a)' : '#94a3b8',
                              textDecoration: isAvailable ? 'none' : 'line-through'
                            }}
                          >
                            {f.feature_name}{' '}
                            {isAvailable && !isUnlimited && hasQuota && (
                              <strong style={{ color: '#00B875' }}>
                                ({f.feature_key === 'max_chambers' ? `${f.quota_limit}টি চেম্বার` : `${f.quota_limit}/মাস`})
                              </strong>
                            )}
                            {isAvailable && isUnlimited && (
                              <strong style={{ color: '#00B875' }}>(আনলিমিটেড)</strong>
                            )}
                            {!isAvailable && (
                              <strong style={{ color: '#94a3b8', fontSize: '11px' }}> (উপলব্ধ নয়)</strong>
                            )}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-top border-secondary border-opacity-10">
                  {isCurrent ? (
                    <button
                      disabled
                      className="doc-sub-btn-primary"
                      style={{ background: '#e2e8f0', color: '#64748b', boxShadow: 'none', cursor: 'default' }}
                    >
                      বর্তমান প্ল্যান সক্রিয়
                    </button>
                  ) : overview?.is_checkout_locked ? (
                    <button
                      disabled
                      className="doc-sub-btn-primary"
                      style={{ background: '#cbd5e1', color: '#475569', boxShadow: 'none', cursor: 'not-allowed' }}
                    >
                      <Lock size={14} />
                      <span>পেমেন্ট পর্যালোচনায় আছে</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleProceedToCheckout(plan)}
                      className="doc-sub-btn-primary"
                    >
                      <span>{plan.name_bn || plan.name} প্ল্যানে পরিবর্তন</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Toggleable Comprehensive Feature Comparison Matrix */}
        <div className="text-center mb-5">
          <button
            onClick={() => setShowComparisonMatrix(!showComparisonMatrix)}
            className="doc-sub-btn-secondary"
            style={{ fontWeight: 700 }}
          >
            <Layers size={15} />
            <span>{showComparisonMatrix ? 'ফিচার তালিকা লুকান' : 'সকল ফিচারের বিস্তারিত তুলনা দেখুন'}</span>
            {showComparisonMatrix ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {showComparisonMatrix && (
          <div className="doc-sub-table-card doc-sub-fade-in mb-5">
            <div className="p-4 border-bottom border-secondary border-opacity-10">
              <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                ক্লিনিক্যাল ফিচার ও সুবিধার তালিকা
              </h4>
              <p className="text-muted" style={{ fontSize: '12.5px', margin: '2px 0 0 0' }}>
                বিভিন্ন প্ল্যানে অন্তর্ভুক্ত সকল সুবিধার সম্পূর্ণ বিবরণ।
              </p>
            </div>
            <div className="table-responsive">
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
                      label: 'চেম্বার সংখ্যা',
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
                      label: 'রোগীদের স্বয়ংক্রিয় এসএমএস',
                      format: (limit, isUnlimited) => isUnlimited ? '∞ আনলিমিটেড' : `${limit}টি / মাস`
                    },
                    { 
                      keys: ['advanced_analytics', 'analytics'], 
                      label: 'অ্যানালিটিক্স ও আয়ের রিপোর্ট',
                      tierOverride: (p) => p.tier === 'professional'
                    },
                    { 
                      keys: ['priority_support'], 
                      label: 'ডেডিকেটেড প্রায়োরিটি সাপোর্ট',
                      tierOverride: (p) => p.tier === 'professional'
                    },
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
                                <span style={{ color: '#10b981', fontWeight: 800 }}>∞ আনলিমিটেড</span>
                              ) : hasQuota ? (
                                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                                  {feat.format ? feat.format(pf.quota_limit, false) : `${pf.quota_limit} / মাস`}
                                </span>
                              ) : (
                                <Check size={18} style={{ color: '#10b981' }} />
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

      {/* ─── 7. INVOICE RECEIPTS & BILLING HISTORY ─── */}
      <div className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, letterSpacing: '-0.2px' }}>
              বিলিং ইনভয়েস ও রসিদ
            </h3>
            <p className="text-muted" style={{ fontSize: '13px', margin: '2px 0 0 0' }}>
              অফিসিয়াল বিলিং রসিদ ডাউনলোড করুন অথবা আপনার ভেরিফাইড ইমেইলে ভ্যাট/ট্যাক্স অনুমোদিত কপি পাঠান।
            </p>
          </div>
        </div>

        <div className="doc-sub-table-card">
          {invoices.length === 0 ? (
            <div className="text-center py-5 text-muted" style={{ fontSize: '13.5px' }}>
              <FileText size={36} className="mx-auto mb-2 opacity-50" />
              <div>এই ডাক্তার অ্যাকাউন্টে এখনও কোনো বিলিং ইনভয়েস রেকর্ড নেই।</div>
            </div>
          ) : (
            <div className="table-responsive">
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
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                        {inv.invoice_number}
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
                            fontSize: '10.5px',
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
      </div>

      {/* ─── 8. TIMELINE DRAWER ─── */}
      {showTimeline && (
        <div className="doc-sub-drawer-backdrop doc-sub-fade-in" onClick={() => setShowTimeline(false)}>
          <div className="doc-sub-drawer" onClick={e => e.stopPropagation()}>
            <div className="doc-sub-drawer-header">
              <div className="d-flex align-items-center gap-2">
                <Activity size={18} style={{ color: '#00B875' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>সাবস্ক্রিপশন লাইফসাইকেল টাইমলাইন</h4>
              </div>
              <button
                onClick={() => setShowTimeline(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="doc-sub-drawer-body">
              {timeline.length === 0 ? (
                <div className="text-center py-5 text-muted" style={{ fontSize: '13px' }}>
                  এই সাবস্ক্রিপশনের জন্য এখনও কোনো লাইফসাইকেল ইভেন্ট রেকর্ড নেই।
                </div>
              ) : (
                timeline.map((evt) => (
                  <div key={evt.id} className="doc-sub-timeline-item">
                    <div className="doc-sub-timeline-dot" />
                    <div className="d-flex justify-content-between align-items-start">
                      <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{evt.title}</div>
                      <span className="text-muted" style={{ fontSize: '11px' }}>
                        {new Date(evt.occurred_at).toLocaleDateString('bn-BD')}
                      </span>
                    </div>
                    <p className="text-muted" style={{ fontSize: '12px', margin: '4px 0 0 0' }}>
                      {evt.description}
                    </p>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px' }}>
                      সম্পাদনকারী: <strong style={{ color: 'inherit' }}>{evt.performed_by}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 9. PRORATION PREVIEW & TIER SWITCH MODAL ─── */}
      {selectedPlan && (
        <div className="doc-sub-modal-backdrop doc-sub-fade-in">
          <div className="doc-sub-modal">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>প্ল্যান পরিবর্তনের নিশ্চিতকরণ</h3>
                <p className="text-muted" style={{ fontSize: '12.5px', margin: '2px 0 0 0' }}>
                  <strong style={{ color: '#00B875' }}>{selectedPlan.name_bn || selectedPlan.name}</strong>-এ পরিবর্তন হচ্ছে ({billingCycle === 'annual' ? 'বাৎসরিক' : 'মাসিক'} সাইকেল)
                </p>
              </div>
              <button
                onClick={() => { setSelectedPlan(null); setPreview(null) }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
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

                <div className="text-muted" style={{ fontSize: '11.5px', lineHeight: 1.5 }}>
                  দ্রষ্টব্য: আপনার প্র্যাকটিস কোটা ও ক্লিনিক্যাল ফিচারের সীমাবদ্ধতা তাৎক্ষণিকভাবে বা অ্যাডমিন যাচাইয়ের পর স্বয়ংক্রিয়ভাবে কার্যকর হবে।
                </div>

                <div className="d-flex justify-content-end gap-2 pt-3 border-top border-secondary border-opacity-10">
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
        </div>
      )}
    </div>
  )
}

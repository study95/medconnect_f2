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
          Active Plan
        </span>
      )
    }
    if (s === 'trialing') {
      return (
        <span className="doc-sub-badge-status trialing">
          <span className="doc-sub-dot pulse" style={{ background: '#6366f1' }} />
          Trial Mode
        </span>
      )
    }
    if (s === 'grace_period') {
      return (
        <span className="doc-sub-badge-status grace">
          <span className="doc-sub-dot pulse" style={{ background: '#f59e0b' }} />
          Grace Period
        </span>
      )
    }
    return (
      <span className="doc-sub-badge-status expired">
        <span className="doc-sub-dot" style={{ background: '#ef4444' }} />
        {s.toUpperCase()}
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
            <span>Dashboard</span>
            <ChevronRight size={13} />
            <span style={{ color: 'var(--admin-primary, #00B875)' }}>Subscription & Practice Plans</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0 0 0', letterSpacing: '-0.4px' }}>
            Doctor Practice Subscription
          </h1>
          <p className="text-muted" style={{ fontSize: '13.5px', margin: '4px 0 0 0' }}>
            Manage clinical tier entitlements, usage quotas, invoice receipts, and automated billing.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={() => navigate('/admin/subscription/history')}
            className="doc-sub-btn-secondary"
            title="View subscription and manual payment history"
          >
            <History size={15} style={{ color: '#00B875' }} />
            <span>Subscription History</span>
          </button>

          {timeline.length > 0 && (
            <button
              onClick={() => setShowTimeline(true)}
              className="doc-sub-btn-secondary"
              title="View lifecycle history"
            >
              <Activity size={15} style={{ color: '#00B875' }} />
              <span>History Timeline</span>
            </button>
          )}

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="doc-sub-btn-secondary"
            title="Refresh subscription state"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
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
                Manual Payment Verification In Progress
              </div>
              <div style={{ fontSize: '12.5px', opacity: 0.95, marginTop: '2px' }}>
                {overview.lock_reason || 'Your manual payment submission is undergoing verification by administrators.'}{' '}
                {pendingPayment && (
                  <span style={{ fontWeight: 700 }}>
                    (Ref: {pendingPayment.transaction_reference}, ৳ {Number(pendingPayment.amount).toLocaleString()})
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
            Admin Review Pending
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
                Tier Change Request Pending Approval
              </div>
              <div style={{ fontSize: '12.5px', opacity: 0.95, marginTop: '2px' }}>
                You requested a switch to <span style={{ fontWeight: 700 }}>{pendingRequest.target_plan}</span> ({pendingRequest.target_cycle}). Prorated amount due:{' '}
                <span style={{ fontWeight: 700 }}>৳ {Number(pendingRequest.amount_due).toLocaleString()}</span>. Awaiting administrator approval.
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
            Pending Switch
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
            <span>{stagedRenewal.action_label || 'Renew Plan'}</span>
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
                  Auto-Renew On
                </span>
              )}
            </div>

            <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '6px 0 4px 0', letterSpacing: '-0.4px' }}>
              {sub?.plan?.name || 'Community Practice Plan'}
            </h2>

            <p className="text-muted" style={{ fontSize: '13.5px', margin: 0 }}>
              {sub?.current_period_ends_at ? (
                <>
                  Active billing period ends on{' '}
                  <span style={{ fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>
                    {new Date(sub.current_period_ends_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>{' '}
                  ({banners.days_remaining ?? 0} days remaining)
                </>
              ) : (
                'Standard perpetual profile on DoctorBooklet platform.'
              )}
            </p>
          </div>

          <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-4">
            <div className="text-sm-end">
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                Current Rate
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--admin-text, #0f172a)' }}>
                ৳ {Number(sub?.current_price || sub?.plan?.price_monthly || 0).toLocaleString()}
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>
                  {' '}/ {sub?.billing_cycle || 'monthly'}
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
                <span>Change Tier</span>
              </button>

              {sub?.status === 'active' && !sub?.canceled_at && (
                <button
                  onClick={handleCancelSub}
                  className="doc-sub-btn-secondary"
                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  title="Cancel active subscription"
                >
                  Cancel
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
              Practice Quota Consumption
            </h3>
            <p className="text-muted" style={{ fontSize: '13px', margin: '2px 0 0 0' }}>
              Real-time utilization metrics across your clinical chambers, patient bookings, and telehealth features.
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
                      <Lock size={10} /> Locked
                    </span>
                  ) : (
                    <div style={{ fontSize: '13px', fontWeight: 800 }}>
                      {usage.used} <span style={{ color: '#94a3b8', fontWeight: 500 }}>/ {isUnlimited ? '∞' : usage.limit}</span>
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
                      Forecast:{' '}
                      <strong style={{ color: usage.projected_status === 'critical' ? '#ef4444' : '#10b981' }}>
                        ~{usage.forecasted_usage}
                      </strong>
                    </span>
                  ) : (
                    <span>{usage.is_unlocked ? (isUnlimited ? 'Unlimited Capacity' : `${percent}% utilized`) : 'Upgrade required'}</span>
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
                      Unlock Feature →
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
              Select Practice Plan
            </h3>
            <p className="text-muted" style={{ fontSize: '13.5px', margin: '3px 0 0 0' }}>
              Scale your digital practice seamlessly. All upgrades and downgrades are prorated down to the second.
            </p>
          </div>

          {/* Monthly / Annual Billing Segmented Switch */}
          <div className="doc-sub-cycle-toggle">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`doc-sub-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`doc-sub-toggle-btn ${billingCycle === 'annual' ? 'active' : ''}`}
            >
              <span>Annual Billing</span>
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
                Save ~20%
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
                {isPopular && <div className="doc-sub-badge-popular">★ Most Popular</div>}
                {!isPopular && isBestValue && <div className="doc-sub-badge-best-value">Best Value</div>}

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
                        <CheckCircle2 size={14} /> Current
                      </span>
                    )}
                  </div>

                  <h4 style={{ fontSize: '20px', fontWeight: 800, margin: '8px 0 4px 0' }}>{plan.name}</h4>
                  <p className="text-muted" style={{ fontSize: '12.5px', minHeight: '36px', margin: 0 }}>
                    {plan.description}
                  </p>

                  <div className="my-4">
                    <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                      ৳ {Number(displayPrice).toLocaleString()}
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>
                        {' '}/ {billingCycle}
                      </span>
                    </div>

                    {billingCycle === 'annual' && plan.annual_savings_amount > 0 && (
                      <div style={{ fontSize: '11.5px', color: '#10b981', fontWeight: 700, marginTop: '2px' }}>
                        Save ৳ {Number(plan.annual_savings_amount).toLocaleString()} annually (~৳ {monthlyEquiv.toLocaleString()}/mo)
                      </div>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="pt-3 border-top border-secondary border-opacity-10 space-y-2" style={{ fontSize: '12.5px' }}>
                    {plan.features?.map((f, idx) => (
                      <div key={idx} className="d-flex align-items-center gap-2">
                        {f.is_enabled ? (
                          <Check size={15} style={{ color: '#10b981', flexShrink: 0 }} />
                        ) : (
                          <X size={15} style={{ color: '#cbd5e1', flexShrink: 0 }} />
                        )}
                        <span
                          style={{
                            color: f.is_enabled ? 'var(--admin-text, #0f172a)' : '#94a3b8',
                            textDecoration: f.is_enabled ? 'none' : 'line-through'
                          }}
                        >
                          {f.feature_name}{' '}
                          {f.is_enabled && !f.is_unlimited && f.quota_limit && (
                            <strong style={{ color: '#00B875' }}>({f.quota_limit}/mo)</strong>
                          )}
                          {f.is_enabled && f.is_unlimited && (
                            <strong style={{ color: '#00B875' }}>(Unlimited)</strong>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-top border-secondary border-opacity-10">
                  {isCurrent ? (
                    <button
                      disabled
                      className="doc-sub-btn-primary"
                      style={{ background: '#e2e8f0', color: '#64748b', boxShadow: 'none', cursor: 'default' }}
                    >
                      Current Plan Active
                    </button>
                  ) : overview?.is_checkout_locked ? (
                    <button
                      disabled
                      className="doc-sub-btn-primary"
                      style={{ background: '#cbd5e1', color: '#475569', boxShadow: 'none', cursor: 'not-allowed' }}
                    >
                      <Lock size={14} />
                      <span>Payment Under Review</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleProceedToCheckout(plan)}
                      className="doc-sub-btn-primary"
                    >
                      <span>Switch to {plan.name}</span>
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
            <span>{showComparisonMatrix ? 'Hide Detailed Feature Comparison' : 'View Detailed Feature Comparison Matrix'}</span>
            {showComparisonMatrix ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {showComparisonMatrix && (
          <div className="doc-sub-table-card doc-sub-fade-in mb-5">
            <div className="p-4 border-bottom border-secondary border-opacity-10">
              <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                Enterprise Clinical Features Matrix
              </h4>
              <p className="text-muted" style={{ fontSize: '12.5px', margin: '2px 0 0 0' }}>
                Complete breakdown of entitlements and capability ceilings across practice tiers.
              </p>
            </div>
            <div className="table-responsive">
              <table className="doc-sub-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Feature / Entitlement</th>
                    {plans.map(p => (
                      <th key={p.id} style={{ textAlign: 'center', width: `${60 / plans.length}%` }}>
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'chambers', label: 'Doctor Practice Chambers' },
                    { key: 'appointments', label: 'Daily Appointment Bookings' },
                    { key: 'telemedicine', label: 'Telemedicine Video Consultations' },
                    { key: 'prescriptions', label: 'Digital Rx & Prescription Engine' },
                    { key: 'sms_notifications', label: 'Automated SMS Alerts' },
                    { key: 'analytics', label: 'Practice Revenue & Patient Insights' },
                    { key: 'priority_support', label: 'Dedicated Account Concierge' },
                  ].map(feat => (
                    <tr key={feat.key}>
                      <td style={{ fontWeight: 600 }}>{feat.label}</td>
                      {plans.map(p => {
                        const pf = p.features?.find(f => f.feature_key === feat.key)
                        return (
                          <td key={p.id} style={{ textAlign: 'center' }}>
                            {pf?.is_enabled ? (
                              pf.is_unlimited ? (
                                <span style={{ color: '#10b981', fontWeight: 800 }}>∞ Unlimited</span>
                              ) : pf.quota_limit ? (
                                <span style={{ fontWeight: 700 }}>{pf.quota_limit} / mo</span>
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
              Billing Invoices & Tax Receipts
            </h3>
            <p className="text-muted" style={{ fontSize: '13px', margin: '2px 0 0 0' }}>
              Download official receipts or dispatch VAT/Tax compliant copies to your verified email.
            </p>
          </div>
        </div>

        <div className="doc-sub-table-card">
          {invoices.length === 0 ? (
            <div className="text-center py-5 text-muted" style={{ fontSize: '13.5px' }}>
              <FileText size={36} className="mx-auto mb-2 opacity-50" />
              <div>No billing invoices recorded for this doctor account yet.</div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="doc-sub-table">
                <thead>
                  <tr>
                    <th>Invoice Number</th>
                    <th>Billing Date</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                        {inv.invoice_number}
                      </td>
                      <td className="text-muted">
                        {new Date(inv.issue_date).toLocaleDateString('en-US', {
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
                          ● {inv.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="d-inline-flex align-items-center gap-2">
                          <button
                            onClick={() => handleEmailInvoice(inv.id, inv.invoice_number)}
                            disabled={emailingInvoiceId === inv.id}
                            className="doc-sub-btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            title="Send invoice via email"
                          >
                            <Mail size={13} />
                            <span>{emailingInvoiceId === inv.id ? 'Sending...' : 'Email'}</span>
                          </button>

                          <button
                            onClick={handlePrintInvoice}
                            className="doc-sub-btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            title="Print invoice receipt"
                          >
                            <Printer size={13} />
                            <span>Print</span>
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
                <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Subscription Lifecycle Timeline</h4>
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
                  No lifecycle events recorded for this subscription yet.
                </div>
              ) : (
                timeline.map((evt) => (
                  <div key={evt.id} className="doc-sub-timeline-item">
                    <div className="doc-sub-timeline-dot" />
                    <div className="d-flex justify-content-between align-items-start">
                      <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{evt.title}</div>
                      <span className="text-muted" style={{ fontSize: '11px' }}>
                        {new Date(evt.occurred_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-muted" style={{ fontSize: '12px', margin: '4px 0 0 0' }}>
                      {evt.description}
                    </p>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px' }}>
                      By: <strong style={{ color: 'inherit' }}>{evt.performed_by}</strong>
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
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Confirm Practice Tier Switch</h3>
                <p className="text-muted" style={{ fontSize: '12.5px', margin: '2px 0 0 0' }}>
                  Switching to <strong style={{ color: '#00B875' }}>{selectedPlan.name}</strong> ({billingCycle} cycle)
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
                <div className="text-muted" style={{ fontSize: '13px' }}>Calculating second-by-second proration credit...</div>
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
                    <span className="text-muted">Target Plan Charge ({preview.billing_cycle})</span>
                    <span style={{ fontWeight: 700 }}>৳ {Number(preview.new_plan_charge).toLocaleString()}</span>
                  </div>

                  {preview.current_plan_credit > 0 && (
                    <div className="d-flex justify-content-between mb-2" style={{ fontSize: '13px', color: '#10b981' }}>
                      <span>Unused Prorated Credit</span>
                      <span style={{ fontWeight: 700 }}>-৳ {Number(preview.current_plan_credit).toLocaleString()}</span>
                    </div>
                  )}

                  <div className="d-flex justify-content-between pt-2 border-top border-secondary border-opacity-10" style={{ fontSize: '15px', fontWeight: 800 }}>
                    <span>Net Amount Due</span>
                    <span style={{ color: '#00B875' }}>৳ {Number(preview.net_amount_due).toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-muted" style={{ fontSize: '11.5px', lineHeight: 1.5 }}>
                  Notice: Your practice quotas and clinical feature limits will adjust immediately or upon administrator verification depending on account status.
                </div>

                <div className="d-flex justify-content-end gap-2 pt-3 border-top border-secondary border-opacity-10">
                  <button
                    type="button"
                    onClick={() => { setSelectedPlan(null); setPreview(null) }}
                    className="doc-sub-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProceedToCheckout(selectedPlan)}
                    className="doc-sub-btn-primary"
                    style={{ width: 'auto', padding: '10px 24px' }}
                  >
                    <span>Proceed to Checkout</span>
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

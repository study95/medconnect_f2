// CheckoutPage.jsx — Enterprise Checkout Experience & Legacy Compatibility
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  getSubscriptionPackages,
  purchaseSubscription,
  getCheckoutSummary,
  applyCheckoutCoupon,
  createCheckoutSession,
  cancelCheckoutSession,
  getCheckoutInvoicePreview,
  submitManualPayment,
} from '../../../api/subscriptionApi'
import { useSubscription } from '../../../context/SubscriptionContext'
import { useAuth } from '../../../context/AuthContext'

const ENTERPRISE_PAYMENT_METHODS = [
  {
    key: 'bkash',
    label: 'bKash (Send Money / Merchant)',
    icon: '📱',
    badge: 'Manual Verification',
    color: '#E2136E',
    description: 'Send payment to our official bKash account and upload TrxID & slip screenshot.',
    isManual: true,
  },
  {
    key: 'nagad',
    label: 'Nagad (Send Money / Merchant)',
    icon: '📲',
    badge: 'Manual Verification',
    color: '#F6921E',
    description: 'Send payment to our official Nagad account and upload TrxID & receipt screenshot.',
    isManual: true,
  },
  {
    key: 'offline',
    label: 'Bank Transfer / Deposit Slip',
    icon: '🏦',
    badge: 'Manual Verification',
    color: '#10B981',
    description: 'Direct Eastern Bank PLC account wire transfer or cash branch deposit slip.',
    isManual: true,
  },
  {
    key: 'sslcommerz',
    label: 'SSLCommerz (Cards & NetBanking)',
    icon: '💳',
    badge: 'Online Gateway',
    color: '#0052CC',
    description: 'Visa, MasterCard, Amex, UnionPay, and Bangladeshi Internet Banking.',
    isManual: false,
  },
  {
    key: 'stripe',
    label: 'Stripe (International Cards)',
    icon: '🌐',
    badge: 'Online Gateway',
    color: '#635BFF',
    description: 'Global credit and debit cards processed with international standards.',
    isManual: false,
  },
]

export default function CheckoutPage() {
  const { isManager, isDoctor } = useAuth()
  const { packageId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refreshSubscription } = useSubscription()

  // Mode detection: Enterprise plan vs Legacy package
  const planIdParam = searchParams.get('plan_id') || packageId
  const cycleParam = searchParams.get('cycle') || 'monthly'

  const [isEnterprise, setIsEnterprise] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Enterprise state
  const [summaryData, setSummaryData] = useState(null)
  const [billingCycle, setBillingCycle] = useState(cycleParam)
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('bkash')
  const [termsAccepted, setTermsAccepted] = useState(false)

  const isFreePlan = (summaryData?.target_plan?.tier === 'free') || (Number(summaryData?.pricing?.total_amount || 0) <= 0)
  const isManualMethod = !isFreePlan && ['bkash', 'nagad', 'offline', 'rocket'].includes(paymentMethod)

  const handlePaymentMethodChange = (newKey) => {
    setPaymentMethod(newKey)
    if (newKey === 'bkash') {
      setManualMethod('bkash_personal')
    } else if (newKey === 'nagad') {
      setManualMethod('nagad_personal')
    } else if (newKey === 'offline') {
      setManualMethod('bank_transfer')
    }
  }

  // Billing address state
  const [billingAddress, setBillingAddress] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    city: 'Dhaka',
    country: 'Bangladesh',
  })

  // Modals state
  const [invoicePreviewModal, setInvoicePreviewModal] = useState(false)
  const [invoicePreviewData, setInvoicePreviewData] = useState(null)
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [sessionSuccessData, setSessionSuccessData] = useState(null)
  const [cancellingSession, setCancellingSession] = useState(false)

  // Phase 4.4 Manual Payment State
  const [manualMethod, setManualMethod] = useState('bkash_personal')
  const [senderNumber, setSenderNumber] = useState('')
  const [transactionRef, setTransactionRef] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [manualNotes, setManualNotes] = useState('')
  const [slipFile, setSlipFile] = useState(null)
  const [slipPreviewUrl, setSlipPreviewUrl] = useState(null)
  const [manualSubmitting, setManualSubmitting] = useState(false)
  const [manualSuccessData, setManualSuccessData] = useState(null)
  const [manualErrorMsg, setManualErrorMsg] = useState('')

  // Legacy state
  const [legacyPkg, setLegacyPkg] = useState(null)
  const [legacyPaymentRef, setLegacyPaymentRef] = useState('')
  const [legacyShowSuccess, setLegacyShowSuccess] = useState(false)

  useEffect(() => {
    initCheckout()
  }, [planIdParam, billingCycle])

  const initCheckout = async () => {
    setLoading(true)
    setErrorMsg('')
    setCouponError('')

    if (planIdParam) {
      try {
        // First try fetching Enterprise summary
        const res = await getCheckoutSummary(planIdParam, billingCycle, appliedCoupon)
        if (res?.success && res?.data) {
          setIsEnterprise(true)
          setSummaryData(res.data)
          if (res.data.entity) {
            setBillingAddress(prev => ({
              ...prev,
              name: prev.name || res.data.entity.name || '',
              email: prev.email || res.data.entity.email || '',
              phone: prev.phone || res.data.entity.phone || '',
            }))
          }
          setLoading(false)
          return
        }
      } catch (err) {
        // If enterprise checkout summary fails with 404/validation, attempt legacy packages fallback
        const msg = err.response?.data?.message || ''
        console.warn('Enterprise summary check note:', msg)
      }
    }

    // Fallback: Legacy package lookup
    try {
      const res = await getSubscriptionPackages()
      const packages = res.data?.data || []
      const found = packages.find(p => String(p.id) === String(planIdParam))
      if (found) {
        setIsEnterprise(false)
        setLegacyPkg(found)
      } else {
        setErrorMsg('The requested subscription package could not be found.')
      }
    } catch (legacyErr) {
      setErrorMsg('Failed to load subscription package details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Enterprise Coupon
  const handleApplyCoupon = async (e) => {
    e?.preventDefault()
    if (!couponInput.trim()) return
    setCouponLoading(true)
    setCouponError('')

    try {
      const res = await applyCheckoutCoupon(planIdParam, couponInput.trim(), billingCycle)
      if (res?.success) {
        setAppliedCoupon(couponInput.trim().toUpperCase())
        // Refresh summary
        const summaryRes = await getCheckoutSummary(planIdParam, billingCycle, couponInput.trim().toUpperCase())
        if (summaryRes?.success) {
          setSummaryData(summaryRes.data)
        }
      }
    } catch (err) {
      const msg = err.response?.data?.errors?.coupon_code?.[0] || err.response?.data?.message || 'Invalid coupon code.'
      setCouponError(msg)
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = async () => {
    setCouponLoading(true)
    setCouponError('')
    setAppliedCoupon('')
    setCouponInput('')
    try {
      const summaryRes = await getCheckoutSummary(planIdParam, billingCycle, '')
      if (summaryRes?.success) {
        setSummaryData(summaryRes.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCouponLoading(false)
    }
  }

  // Handle Cycle Switch
  const handleCycleChange = (newCycle) => {
    setBillingCycle(newCycle)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('cycle', newCycle)
    setSearchParams(newParams, { replace: true })
  }

  // Handle Invoice Preview Modal
  const handleOpenInvoicePreview = async () => {
    setInvoiceLoading(true)
    setInvoicePreviewModal(true)
    try {
      const res = await getCheckoutInvoicePreview(planIdParam, billingCycle, appliedCoupon, billingAddress)
      if (res?.success) {
        setInvoicePreviewData(res.data)
      }
    } catch (err) {
      alert('Failed to load invoice preview.')
      setInvoicePreviewModal(false)
    } finally {
      setInvoiceLoading(false)
    }
  }

  // Handle Enterprise Checkout Submission
  const handleEnterpriseCheckout = async (e) => {
    e.preventDefault()
    if (!termsAccepted) {
      alert('Please agree to the Terms of Service and Billing Agreement to continue.')
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    try {
      const payload = {
        plan_id: parseInt(planIdParam, 10),
        billing_cycle: billingCycle,
        coupon_code: appliedCoupon || null,
        payment_method: isFreePlan ? 'free_trial' : paymentMethod,
        terms_accepted: true,
        billing_address: billingAddress,
        metadata: {
          client_timestamp: new Date().toISOString(),
          requested_from: window.location.pathname,
        },
      }

      const res = await createCheckoutSession(payload)
      if (res?.success && res?.data) {
        setSessionSuccessData(res.data)
        if (isFreePlan) {
          refreshSubscription?.()
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Checkout could not be processed. Please check your inputs.'
      setErrorMsg(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Session Cancellation
  const handleCancelSession = async () => {
    if (!sessionSuccessData?.session_id) return
    if (!window.confirm('Are you sure you want to cancel this pending checkout session?')) return

    setCancellingSession(true)
    try {
      const res = await cancelCheckoutSession(sessionSuccessData.session_id)
      if (res?.success) {
        alert('Checkout session cancelled.')
        setSessionSuccessData(null)
        navigate('/admin/subscription')
      }
    } catch (err) {
      alert('Failed to cancel session: ' + (err.response?.data?.message || 'Error'))
    } finally {
      setCancellingSession(false)
    }
  }

  // Handle Slip File Selection & Validation
  const handleSlipFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Payment proof must be a valid image file (JPG, PNG, or WEBP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Payment proof image size must not exceed 5 MB.')
      return
    }
    setSlipFile(file)
    setSlipPreviewUrl(URL.createObjectURL(file))
    setManualErrorMsg('')
  }

  // Handle Enterprise Manual Offline Payment Submission (Phase 4.4)
  const handleManualPaymentSubmit = async (e) => {
    e.preventDefault()
    if (!slipFile) {
      setManualErrorMsg('A payment proof screenshot (slip/receipt) is required.')
      return
    }
    if (!transactionRef.trim()) {
      setManualErrorMsg('Please enter the transaction reference / deposit ID.')
      return
    }
    if (!termsAccepted) {
      alert('Please agree to the Terms of Service and Billing Agreement to continue.')
      return
    }

    setManualSubmitting(true)
    setManualErrorMsg('')

    try {
      const formData = new FormData()
      formData.append('plan_id', planIdParam)
      formData.append('billing_cycle', billingCycle)
      formData.append('amount', summaryData?.pricing?.total_amount || 0)
      let methodToSubmit = manualMethod
      if (paymentMethod === 'bkash' && !manualMethod.startsWith('bkash')) {
        methodToSubmit = 'bkash_personal'
      } else if (paymentMethod === 'nagad' && !manualMethod.startsWith('nagad')) {
        methodToSubmit = 'nagad_personal'
      } else if (paymentMethod === 'offline' && !['bank_transfer', 'manual_offline', 'rocket'].includes(manualMethod)) {
        methodToSubmit = 'bank_transfer'
      }
      formData.append('payment_method', methodToSubmit)
      formData.append('transaction_reference', transactionRef.trim())
      formData.append('sender_number', senderNumber.trim())
      formData.append('payment_date', paymentDate)
      if (appliedCoupon) {
        formData.append('coupon_code', appliedCoupon)
      }
      if (manualNotes.trim()) {
        formData.append('notes', manualNotes.trim())
      }
      formData.append('slip_image', slipFile)

      const res = await submitManualPayment(formData)
      if (res?.success) {
        setManualSuccessData(res.data)
        initCheckout()
      }
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) {
        const firstErr = Object.values(errors)[0]
        setManualErrorMsg(Array.isArray(firstErr) ? firstErr[0] : String(firstErr))
      } else {
        setManualErrorMsg(err.response?.data?.message || 'Failed to submit manual payment. Please try again.')
      }
    } finally {
      setManualSubmitting(false)
    }
  }

  // Handle Legacy Checkout Submission
  const handleLegacySubmit = async (e) => {
    e.preventDefault()
    if (!paymentMethod) {
      alert('Please select a payment method.')
      return
    }
    if (paymentMethod !== 'sslcommerz' && !legacyPaymentRef.trim()) {
      alert('Please enter a Transaction ID or payment reference.')
      return
    }

    setSubmitting(true)
    try {
      await purchaseSubscription({
        package_id: legacyPkg.id,
        payment_method: paymentMethod,
        payment_reference: legacyPaymentRef.trim(),
        promo_code: appliedCoupon || null,
      })
      refreshSubscription()
      setLegacyShowSuccess(true)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete subscription.')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading Screen
  if (loading) {
    return (
      <div className="admin-loading" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="admin-spinner" style={{ width: 44, height: 44, marginBottom: 16 }} />
        <h3 style={{ color: 'var(--admin-text)', fontWeight: 700 }}>Preparing Secure Checkout...</h3>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>Calculating proration, discounts, and order items.</p>
      </div>
    )
  }

  // Error Screen
  if (errorMsg && !summaryData && !legacyPkg) {
    return (
      <div className="admin-card" style={{ maxWidth: 600, margin: '40px auto', padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ color: 'var(--admin-text)', fontWeight: 800, marginBottom: 12 }}>Unable to Load Checkout</h2>
        <p style={{ color: 'var(--admin-text-muted)', lineHeight: 1.6, marginBottom: 24 }}>{errorMsg}</p>
        <Link to="/admin/subscription" className="admin-btn admin-btn-primary">← Return to Subscription Plans</Link>
      </div>
    )
  }

  // -------------------------------------------------------------
  // RENDER: ENTERPRISE CHECKOUT EXPERIENCE
  // -------------------------------------------------------------
  if (isEnterprise && summaryData) {
    const { target_plan, current_plan, pricing, currency_symbol } = summaryData

    return (
      <div style={{ maxWidth: 1240, margin: '0 auto', paddingBottom: 60 }}>
        {/* Header */}
        <div className="admin-page-header" style={{ marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h2 className="admin-page-title" style={{ margin: 0 }}>🛡️ Enterprise Checkout</h2>
              <span style={{
                fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                padding: '4px 10px', borderRadius: 20, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE'
              }}>
                Secure SSL 256-Bit
              </span>
            </div>
            <p className="admin-page-subtitle" style={{ margin: 0 }}>
              Review order items, calculate proration & discounts, and initiate pending payment.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={handleOpenInvoicePreview}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              📄 Preview Invoice
            </button>
            <Link to="/admin/subscription" className="admin-btn admin-btn-outline">
              ← Change Plan
            </Link>
          </div>
        </div>

        {/* Verification Lock Banner (Phase 4.4) */}
        {summaryData?.is_checkout_locked && (
          <div style={{
            background: '#FEF3C7', border: '1px solid #F59E0B', color: '#92400E',
            borderRadius: 12, padding: '16px 20px', marginBottom: 24, fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            <span style={{ fontSize: 24 }}>⏳</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Payment Verification in Progress</div>
              <div>{summaryData.lock_reason || 'Your payment is currently under verification. Please wait for administrator approval.'}</div>
            </div>
          </div>
        )}

        {/* Free Trial Activated Success Banner */}
        {sessionSuccessData && isFreePlan && (
          <div style={{
            background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46',
            borderRadius: 14, padding: '20px', marginBottom: 24, fontSize: 14,
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <span style={{ fontSize: 32 }}>🎉</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: '#065F46' }}>
                    14-Day Free Trial Activated Successfully!
                  </div>
                  <p style={{ margin: '6px 0 10px', fontSize: 13, color: '#047857', maxWidth: 650, lineHeight: 1.5 }}>
                    Your facility trial is now active with 2 doctor seats, 1 waiting lounge display, and basic analytics. No payment required.
                  </p>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, background: '#D1FAE5', padding: '8px 14px', borderRadius: 8 }}>
                    <span>Plan: <strong>{target_plan.name}</strong></span>
                    <span>Status: <strong style={{ color: '#059669' }}>ACTIVE TRIAL (14 DAYS)</strong></span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignSelf: 'center', marginTop: 10 }}>
                <Link
                  to={isManager ? "/admin/hospital-subscription" : "/admin/subscription"}
                  className="admin-btn admin-btn-primary"
                  style={{ background: '#10B981', borderColor: '#10B981', padding: '10px 18px', fontWeight: 700 }}
                >
                  🚀 Go to {isManager ? "Hospital" : "Doctor"} Portal
                </Link>
                <Link
                  to="/admin/subscription/history"
                  className="admin-btn admin-btn-outline"
                  style={{ background: '#fff', padding: '10px 18px', fontWeight: 700 }}
                >
                  📋 Subscription History
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Manual Payment Submitted Success Banner (Phase 4.4) */}
        {manualSuccessData && (
          <div style={{
            background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46',
            borderRadius: 14, padding: '20px', marginBottom: 24, fontSize: 14,
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <span style={{ fontSize: 32 }}>✅</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: '#065F46' }}>
                    Manual Payment Submitted Successfully!
                  </div>
                  <p style={{ margin: '6px 0 10px', fontSize: 13, color: '#047857', maxWidth: 650, lineHeight: 1.5 }}>
                    Your payment details and slip screenshot have been submitted and are currently <strong>Under Admin Review</strong>.
                    Your plan features will remain locked and will activate automatically once verified by our billing administration.
                  </p>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, background: '#D1FAE5', padding: '8px 14px', borderRadius: 8 }}>
                    <span>Transaction Ref: <strong>{manualSuccessData.transaction_reference}</strong></span>
                    <span>Amount: <strong>৳{Number(manualSuccessData.submitted_amount || 0).toLocaleString()}</strong></span>
                    <span>Status: <strong style={{ textTransform: 'uppercase', color: '#D97706' }}>Pending Admin Approval</strong></span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignSelf: 'center', marginTop: 10 }}>
                <Link
                  to="/admin/subscription/history"
                  className="admin-btn admin-btn-primary"
                  style={{ background: '#10B981', borderColor: '#10B981', padding: '10px 18px', fontWeight: 700 }}
                >
                  📋 Track in Subscription History
                </Link>
                <Link
                  to={isManager ? "/admin/hospital-subscription" : "/admin/subscription"}
                  className="admin-btn admin-btn-outline"
                  style={{ background: '#fff', padding: '10px 18px', fontWeight: 700 }}
                >
                  ← Return to Portal
                </Link>
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #F87171', color: '#991B1B',
            borderRadius: 12, padding: '14px 18px', marginBottom: 24, fontSize: 14, fontWeight: 600
          }}>
            ❌ {errorMsg}
          </div>
        )}

        {/* Main Grid: Left = Checkout Form & Options, Right = Order Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 32, alignItems: 'flex-start' }}>

          {/* LEFT COLUMN */}
          <div>
            <form onSubmit={isManualMethod ? handleManualPaymentSubmit : handleEnterpriseCheckout}>

              {/* 1. Target Plan & Billing Cycle Selection Card */}
              <div className="admin-card" style={{ padding: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: 16, color: 'var(--admin-text)' }}>
                    📦 Selected Subscription
                  </h3>
                  <span style={{
                    fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 8,
                    background: '#F1F5F9', color: '#334155', textTransform: 'uppercase'
                  }}>
                    Tier: {target_plan.tier}
                  </span>
                </div>

                <div style={{
                  background: 'var(--admin-sidebar-user-bg, #F8FAFC)',
                  border: '1px solid var(--admin-border, #E2E8F0)',
                  borderRadius: 14, padding: 18, marginBottom: 18
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: 'var(--admin-text)' }}>
                        {target_plan.name}
                      </h4>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-text-muted)' }}>
                        Entity designation: <strong style={{ textTransform: 'capitalize' }}>{target_plan.target_entity}</strong>
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#00A88C' }}>
                        {currency_symbol}{billingCycle === 'annual' ? target_plan.price_annual.toLocaleString() : target_plan.price_monthly.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                        per {billingCycle === 'annual' ? 'year' : 'month'}
                      </div>
                    </div>
                  </div>

                  {/* Plan Change Context */}
                  {current_plan && (
                    <div style={{
                      marginTop: 14, paddingTop: 12, borderTop: '1px dashed var(--admin-border, #CBD5E1)',
                      fontSize: 12, color: 'var(--admin-text-muted)', display: 'flex', justifyContent: 'space-between'
                    }}>
                      <span>Current Active Plan: <strong>{current_plan.name}</strong></span>
                      <span style={{ color: '#059669', fontWeight: 700 }}>
                        {pricing.proration_credit > 0 ? `Unused credit: ${currency_symbol}${pricing.proration_credit}` : 'Direct switch'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Billing Cycle Switcher */}
                <div>
                  <label className="admin-form-label" style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>
                    Billing Cycle
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <button
                      type="button"
                      disabled={summaryData?.is_checkout_locked}
                      onClick={() => handleCycleChange('monthly')}
                      style={{
                        padding: '12px 16px', borderRadius: 10, cursor: summaryData?.is_checkout_locked ? 'not-allowed' : 'pointer', textAlign: 'left',
                        border: billingCycle === 'monthly' ? '2px solid #00A88C' : '1px solid var(--admin-border)',
                        background: billingCycle === 'monthly' ? '#00A88C10' : 'var(--admin-card-bg)',
                        color: 'var(--admin-text)',
                        opacity: summaryData?.is_checkout_locked ? 0.6 : 1,
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: 14 }}>Monthly Billing</div>
                      <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>Pay month-to-month</div>
                    </button>

                    <button
                      type="button"
                      disabled={summaryData?.is_checkout_locked}
                      onClick={() => handleCycleChange('annual')}
                      style={{
                        padding: '12px 16px', borderRadius: 10, cursor: summaryData?.is_checkout_locked ? 'not-allowed' : 'pointer', textAlign: 'left',
                        border: billingCycle === 'annual' ? '2px solid #00A88C' : '1px solid var(--admin-border)',
                        background: billingCycle === 'annual' ? '#00A88C10' : 'var(--admin-card-bg)',
                        color: 'var(--admin-text)',
                        position: 'relative',
                        opacity: summaryData?.is_checkout_locked ? 0.6 : 1,
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: -10, right: 12,
                        background: '#10B981', color: 'white', fontSize: 10, fontWeight: 800,
                        padding: '2px 8px', borderRadius: 12
                      }}>
                        Save up to 20%
                      </span>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>Annual Billing</div>
                      <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>Billed annually upfront</div>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Billing Contact & Address Form */}
              <div className="admin-card" style={{ padding: 24, marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 16px', fontWeight: 800, fontSize: 16, color: 'var(--admin-text)' }}>
                  🏢 Billing Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="admin-form-label">Contact Person / Doctor Name</label>
                    <input
                      className="admin-form-input"
                      value={billingAddress.name}
                      onChange={e => setBillingAddress({ ...billingAddress, name: e.target.value })}
                      placeholder="e.g. Dr. Arman Hossain"
                      required
                    />
                  </div>
                  <div>
                    <label className="admin-form-label">Organization / Hospital (Optional)</label>
                    <input
                      className="admin-form-input"
                      value={billingAddress.company}
                      onChange={e => setBillingAddress({ ...billingAddress, company: e.target.value })}
                      placeholder="e.g. City General Care Hospital"
                    />
                  </div>
                  <div>
                    <label className="admin-form-label">Billing Email</label>
                    <input
                      type="email"
                      className="admin-form-input"
                      value={billingAddress.email}
                      onChange={e => setBillingAddress({ ...billingAddress, email: e.target.value })}
                      placeholder="billing@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="admin-form-label">Billing Phone / Hotline</label>
                    <input
                      className="admin-form-input"
                      value={billingAddress.phone}
                      onChange={e => setBillingAddress({ ...billingAddress, phone: e.target.value })}
                      placeholder="+880 1711-000000"
                      required
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="admin-form-label">Street Address</label>
                    <input
                      className="admin-form-input"
                      value={billingAddress.address}
                      onChange={e => setBillingAddress({ ...billingAddress, address: e.target.value })}
                      placeholder="e.g. Suite 4B, Road 11, Dhanmondi"
                      required
                    />
                  </div>
                  <div>
                    <label className="admin-form-label">City</label>
                    <input
                      className="admin-form-input"
                      value={billingAddress.city}
                      onChange={e => setBillingAddress({ ...billingAddress, city: e.target.value })}
                      placeholder="Dhaka"
                    />
                  </div>
                  <div>
                    <label className="admin-form-label">Country</label>
                    <input
                      className="admin-form-input"
                      value={billingAddress.country}
                      onChange={e => setBillingAddress({ ...billingAddress, country: e.target.value })}
                      placeholder="Bangladesh"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Payment Method Selection (Free Trial vs Paid) */}
              {isFreePlan ? (
                <div className="admin-card" style={{ padding: 24, marginBottom: 24, border: '2px solid #10B981', background: '#F0FDF4' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 32 }}>🎁</span>
                    <div>
                      <h3 style={{ margin: 0, fontWeight: 800, fontSize: 16, color: '#065F46' }}>
                        14-Day Free Trial Entitlement
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#047857' }}>
                        <strong>৳0 / No Payment Required.</strong> Your 14-day trial activates immediately upon confirmation with full features.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="admin-card" style={{ padding: 24, marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: 16, color: 'var(--admin-text)' }}>
                      💳 Select Payment Gateway / Method
                    </h3>
                    <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                      No charges processed during checkout
                    </span>
                  </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                  {ENTERPRISE_PAYMENT_METHODS.map(m => {
                    const isSelected = paymentMethod === m.key
                    return (
                      <label
                        key={m.key}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '14px 18px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                          border: isSelected ? `2px solid ${m.color}` : '1px solid var(--admin-border)',
                          background: isSelected ? `${m.color}0D` : 'var(--admin-card-bg)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <input
                            type="radio"
                            name="payment_method"
                            value={m.key}
                            checked={isSelected}
                            onChange={() => handlePaymentMethodChange(m.key)}
                            style={{ accentColor: m.color, width: 18, height: 18 }}
                          />
                          <span style={{ fontSize: 24 }}>{m.icon}</span>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--admin-text)' }}>
                              {m.label}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                              {m.description}
                            </div>
                          </div>
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                          background: isSelected ? `${m.color}20` : '#F1F5F9',
                          color: isSelected ? m.color : '#64748B',
                        }}>
                          {m.badge}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
              )}

              {/* 3.1 Manual Offline / Mobile Wallet Payment Details & Proof Upload (Phase 4.4) */}
              {isManualMethod && (
                <div className="admin-card" style={{ padding: 24, marginBottom: 24, border: '2px solid #10B981', background: '#F0FDF4' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ margin: 0, fontWeight: 800, fontSize: 16, color: '#065F46' }}>
                        🏦 Manual Mobile &amp; Bank Payment Verification
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#047857' }}>
                        Transfer or deposit the payable amount and upload the transaction receipt/screenshot for admin verification.
                      </p>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 800, background: '#10B981', color: '#fff',
                      padding: '4px 10px', borderRadius: 20
                    }}>
                      Proof Required
                    </span>
                  </div>

                  {/* Receiving Account Instructions Box */}
                  <div style={{
                    background: '#fff', border: '1px solid #A7F3D0', borderRadius: 12,
                    padding: 16, marginBottom: 20, fontSize: 13, color: '#1F2937'
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 8, color: '#065F46' }}>
                      📋 Official Receiving Accounts:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                      <div style={{
                        background: paymentMethod === 'bkash' ? '#FDF2F8' : '#F9FAFB',
                        padding: 12, borderRadius: 10,
                        border: paymentMethod === 'bkash' ? '2px solid #E2136E' : '1px solid #E5E7EB'
                      }}>
                        <div style={{ fontWeight: 800, color: '#E2136E', fontSize: 12 }}>bKash Personal / Merchant</div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#0F172A', marginTop: 2 }}>
                          {summaryData?.manual_payment_settings?.accounts?.bkash_number || summaryData?.manual_payment_settings?.accounts?.bkash_personal || '+880 1700-000000'}
                        </div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Send Money / Merchant Payment</div>
                      </div>
                      <div style={{
                        background: paymentMethod === 'nagad' ? '#FFFBEB' : '#F9FAFB',
                        padding: 12, borderRadius: 10,
                        border: paymentMethod === 'nagad' ? '2px solid #F6921E' : '1px solid #E5E7EB'
                      }}>
                        <div style={{ fontWeight: 800, color: '#F6921E', fontSize: 12 }}>Nagad Personal / Merchant</div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#0F172A', marginTop: 2 }}>
                          {summaryData?.manual_payment_settings?.accounts?.nagad_number || summaryData?.manual_payment_settings?.accounts?.nagad_personal || '+880 1800-000000'}
                        </div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Send Money / Payment</div>
                      </div>
                      <div style={{
                        background: paymentMethod === 'offline' ? '#EFF6FF' : '#F9FAFB',
                        padding: 12, borderRadius: 10,
                        border: paymentMethod === 'offline' ? '2px solid #0052CC' : '1px solid #E5E7EB'
                      }}>
                        <div style={{ fontWeight: 800, color: '#0052CC', fontSize: 12 }}>Bank Wire (EBL PLC)</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                          {summaryData?.manual_payment_settings?.accounts?.bank_name || 'Eastern Bank PLC'}
                        </div>
                        <div style={{ fontSize: 12, color: '#374151' }}>
                          A/C: {summaryData?.manual_payment_settings?.accounts?.bank_account_number || summaryData?.manual_payment_settings?.accounts?.bank_account_no || '1041060000000'}
                        </div>
                        <div style={{ fontSize: 11, color: '#6B7280' }}>
                          Branch: {summaryData?.manual_payment_settings?.accounts?.bank_branch || 'Principal Branch'}
                        </div>
                      </div>
                    </div>

                    {summaryData?.manual_payment_settings?.instructions && (
                      <div style={{ marginTop: 10, fontSize: 12, color: '#047857', fontStyle: 'italic' }}>
                        📌 Note: {summaryData.manual_payment_settings.instructions}
                      </div>
                    )}
                  </div>

                  {manualErrorMsg && (
                    <div style={{
                      background: '#FEF2F2', border: '1px solid #F87171', color: '#991B1B',
                      borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, fontWeight: 600
                    }}>
                      ⚠️ {manualErrorMsg}
                    </div>
                  )}

                  {/* Manual Payment Fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label className="admin-form-label" style={{ fontWeight: 700, fontSize: 12 }}>
                        Channel / Method <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <select
                        className="admin-form-input"
                        value={manualMethod}
                        onChange={e => setManualMethod(e.target.value)}
                        style={{ background: '#fff' }}
                        required
                      >
                        <option value="bkash_personal">bKash (Personal Send Money)</option>
                        <option value="bkash_merchant">bKash (Merchant Payment)</option>
                        <option value="nagad_personal">Nagad (Personal Send Money)</option>
                        <option value="nagad_merchant">Nagad (Merchant Payment)</option>
                        <option value="rocket">Rocket (DBBL)</option>
                        <option value="bank_transfer">Direct Bank Transfer (EBL / BEFTN / NPSB)</option>
                        <option value="manual_offline">Cash / Cheque / Other Offline</option>
                      </select>
                    </div>

                    <div>
                      <label className="admin-form-label" style={{ fontWeight: 700, fontSize: 12 }}>
                        Sender Identifier (Mobile / Account)
                      </label>
                      <input
                        type="text"
                        className="admin-form-input"
                        placeholder="e.g. 01711XXXXXX"
                        value={senderNumber}
                        onChange={e => setSenderNumber(e.target.value)}
                        style={{ background: '#fff' }}
                      />
                    </div>

                    <div>
                      <label className="admin-form-label" style={{ fontWeight: 700, fontSize: 12 }}>
                        Transaction Reference / TrxID <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="admin-form-input"
                        placeholder="e.g. 9J87K6L5M4 or Slip Ref"
                        value={transactionRef}
                        onChange={e => setTransactionRef(e.target.value.toUpperCase())}
                        style={{ background: '#fff', fontWeight: 700 }}
                        required
                      />
                      <span style={{ fontSize: 11, color: '#6B7280' }}>Unique transaction reference or deposit slip ID</span>
                    </div>

                    <div>
                      <label className="admin-form-label" style={{ fontWeight: 700, fontSize: 12 }}>
                        Payment Date <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="date"
                        className="admin-form-input"
                        value={paymentDate}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={e => setPaymentDate(e.target.value)}
                        style={{ background: '#fff' }}
                        required
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="admin-form-label" style={{ fontWeight: 700, fontSize: 12 }}>
                        Payment Notes / Branch Name (Optional)
                      </label>
                      <input
                        type="text"
                        className="admin-form-input"
                        placeholder="e.g. Deposited at Dhanmondi Branch by Dr. Arman"
                        value={manualNotes}
                        onChange={e => setManualNotes(e.target.value)}
                        style={{ background: '#fff' }}
                      />
                    </div>

                    {/* Screenshot Upload (Mandatory) */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="admin-form-label" style={{ fontWeight: 700, fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                        <span>
                          Proof of Payment Screenshot / Slip <span style={{ color: '#DC2626' }}>*</span>
                        </span>
                        <span style={{ fontSize: 11, color: '#6B7280' }}>JPG, PNG, WEBP (Max: 5MB)</span>
                      </label>

                      <div style={{
                        border: '2px dashed #6EE7B7', borderRadius: 12, padding: 18,
                        textAlign: 'center', background: '#fff', cursor: 'pointer'
                      }}>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleSlipFileChange}
                          id="slip-file-input"
                          style={{ display: 'none' }}
                        />
                        {slipPreviewUrl ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                            <img
                              src={slipPreviewUrl}
                              alt="Slip Preview"
                              style={{ maxHeight: 110, borderRadius: 8, border: '1px solid #D1D5DB' }}
                            />
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: '#065F46' }}>{slipFile?.name}</div>
                              <div style={{ fontSize: 11, color: '#6B7280' }}>{(slipFile?.size / 1024).toFixed(1)} KB</div>
                              <button
                                type="button"
                                onClick={() => { setSlipFile(null); setSlipPreviewUrl(null) }}
                                style={{
                                  marginTop: 6, background: '#FEE2E2', border: '1px solid #F87171', color: '#991B1B',
                                  fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 8px', cursor: 'pointer'
                                }}
                              >
                                ✕ Remove & Change
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label htmlFor="slip-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                            <div style={{ fontSize: 32, marginBottom: 4 }}>📷</div>
                            <div style={{ fontWeight: 700, color: '#065F46', fontSize: 14 }}>
                              Click to upload deposit slip or mobile transaction screenshot
                            </div>
                            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                              Stored in protected internal storage. Accessible only by authorized administrators.
                            </div>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Terms & Conditions Agreement */}
              <div className="admin-card" style={{ padding: 20, marginBottom: 24, background: '#F8FAFC' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    style={{ width: 18, height: 18, marginTop: 2, accentColor: '#00A88C' }}
                    required
                  />
                  <span style={{ fontSize: 13, color: 'var(--admin-text)', lineHeight: 1.5 }}>
                    I agree to the <strong>Subscription Agreement</strong>, <strong>Billing Terms</strong>, and <strong>Cancellation Policy</strong>.
                    I acknowledge that clicking {isManualMethod ? 'Submit Payment Proof' : 'Place Order'} initiates a pending session awaiting manual or gateway payment clearance.
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={submitting || manualSubmitting || !termsAccepted || summaryData?.is_checkout_locked}
                style={{
                  width: '100%', padding: '16px', borderRadius: 14,
                  fontSize: 16, fontWeight: 900, letterSpacing: '0.5px',
                  background: summaryData?.is_checkout_locked ? '#9CA3AF' : isFreePlan ? '#2563EB' : isManualMethod ? '#10B981' : undefined,
                  cursor: summaryData?.is_checkout_locked ? 'not-allowed' : 'pointer',
                  opacity: summaryData?.is_checkout_locked ? 0.7 : 1,
                }}
              >
                {summaryData?.is_checkout_locked
                  ? '🔒 Locked (Payment Under Verification)'
                  : isFreePlan
                  ? (submitting ? 'Activating Free Trial...' : '🚀 Activate 14-Day Free Trial (৳0)')
                  : isManualMethod
                  ? (manualSubmitting ? 'Submitting Payment Proof...' : `Submit Payment Proof (${currency_symbol}${pricing.total_amount.toLocaleString()})`)
                  : (submitting ? 'Generating Checkout Session...' : `Confirm & Place Order (${currency_symbol}${pricing.total_amount.toLocaleString()})`)
                }
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN — STICKY ORDER SUMMARY */}
          <div style={{ position: 'sticky', top: 24 }}>
            <div className="admin-card" style={{ padding: 26, border: '1px solid var(--admin-border)' }}>
              <h3 style={{ margin: '0 0 18px', fontWeight: 900, fontSize: 17, color: 'var(--admin-text)' }}>
                🧾 Order Summary
              </h3>

              {/* Target Plan Header */}
              <div style={{
                background: 'var(--admin-sidebar-user-bg, #F1F5F9)',
                borderRadius: 12, padding: 16, marginBottom: 20
              }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--admin-text)' }}>
                  {target_plan.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                  Cycle: <strong style={{ textTransform: 'capitalize' }}>{billingCycle}</strong>
                </div>
              </div>

              {/* Coupon Box */}
              <div style={{ marginBottom: 20 }}>
                <label className="admin-form-label" style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  🎟️ Have a Coupon?
                </label>
                {appliedCoupon ? (
                  <div style={{
                    background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10,
                    padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ color: '#166534', fontWeight: 800, fontSize: 13 }}>
                        ✅ {appliedCoupon}
                      </div>
                      <div style={{ color: '#15803D', fontSize: 11 }}>
                        Coupon applied to this order
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      disabled={couponLoading}
                      style={{
                        background: 'none', border: 'none', color: '#DC2626',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '4px 8px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="admin-form-input"
                        placeholder="e.g. SAVE20"
                        value={couponInput}
                        onChange={e => {
                          setCouponInput(e.target.value.toUpperCase())
                          setCouponError('')
                        }}
                        style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px', flex: 1 }}
                      />
                      <button
                        type="button"
                        className="admin-btn admin-btn-outline"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        style={{ padding: '0 16px', fontWeight: 700 }}
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <div style={{ color: '#DC2626', fontSize: 12, fontWeight: 600, marginTop: 6 }}>
                        ⚠️ {couponError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pricing Breakdown */}
              <div style={{ fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: 'var(--admin-text-muted)' }}>
                  <span>Plan Subtotal</span>
                  <span style={{ fontWeight: 700, color: 'var(--admin-text)' }}>
                    {currency_symbol}{pricing.subtotal.toLocaleString()}
                  </span>
                </div>

                {pricing.proration_credit > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: '#059669' }}>
                    <span>Proration Credit</span>
                    <span style={{ fontWeight: 800 }}>
                      -{currency_symbol}{pricing.proration_credit.toLocaleString()}
                    </span>
                  </div>
                )}

                {pricing.discount_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: '#D97706' }}>
                    <span>Coupon Discount ({appliedCoupon})</span>
                    <span style={{ fontWeight: 800 }}>
                      -{currency_symbol}{pricing.discount_amount.toLocaleString()}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: 'var(--admin-text-muted)' }}>
                  <span>Estimated Tax ({pricing.tax_rate_percentage}%)</span>
                  <span style={{ fontWeight: 700, color: 'var(--admin-text)' }}>
                    {currency_symbol}{pricing.tax_amount.toLocaleString()}
                  </span>
                </div>

                {/* Grand Total */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  borderTop: '2px solid var(--admin-border)', paddingTop: 14, marginTop: 14,
                  color: 'var(--admin-text)',
                }}>
                  <span style={{ fontWeight: 900, fontSize: 17 }}>Total Due</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, fontSize: 24, color: '#00A88C' }}>
                      {currency_symbol}{pricing.total_amount.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                      {summaryData.currency}
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Footnote */}
              <div style={{
                marginTop: 20, paddingTop: 14, borderTop: '1px dashed var(--admin-border)',
                fontSize: 11, color: '#94A3B8', lineHeight: 1.5, display: 'flex', gap: 8
              }}>
                <span>🔒</span>
                <span>All transactions are encrypted and audited. Subscriptions remain pending until confirmed.</span>
              </div>
            </div>
          </div>

        </div>

        {/* ================= INVOICE PREVIEW MODAL ================= */}
        {invoicePreviewModal && (
          <div className="admin-modal-overlay" style={{ zIndex: 9999 }}>
            <div className="admin-modal" style={{ maxWidth: 680, padding: 32, borderRadius: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 900, fontSize: 20, color: 'var(--admin-text)' }}>
                    📄 Invoice Preview
                  </h3>
                  <span style={{
                    fontSize: 11, fontWeight: 800, background: '#FEF3C7', color: '#92400E',
                    padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase'
                  }}>
                    Draft Simulation
                  </span>
                </div>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setInvoicePreviewModal(false)}
                >
                  ✕ Close
                </button>
              </div>

              {invoiceLoading ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <div className="admin-spinner" style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: 'var(--admin-text-muted)' }}>Rendering invoice preview...</p>
                </div>
              ) : invoicePreviewData ? (
                <div style={{ fontSize: 13, color: 'var(--admin-text)' }}>
                  {/* Invoice Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #E2E8F0', paddingBottom: 16, marginBottom: 16 }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800 }}>
                        {invoicePreviewData.company?.legal_name || 'Doctor Booklet Healthcare SaaS'}
                      </h4>
                      <div style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>
                        {invoicePreviewData.company?.address}<br />
                        VAT / BIN: {invoicePreviewData.company?.vat_number}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{invoicePreviewData.invoice_number}</div>
                      <div style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>
                        Issue Date: {invoicePreviewData.issue_date}<br />
                        Due Date: {invoicePreviewData.due_date}
                      </div>
                    </div>
                  </div>

                  {/* Billed To */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 800, fontSize: 12, textTransform: 'uppercase', color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                      Billed To
                    </div>
                    <div style={{ fontWeight: 700 }}>{invoicePreviewData.billed_to?.name}</div>
                    {invoicePreviewData.billed_to?.company && <div>{invoicePreviewData.billed_to?.company}</div>}
                    <div style={{ color: 'var(--admin-text-muted)' }}>
                      {invoicePreviewData.billed_to?.address}, {invoicePreviewData.billed_to?.city}, {invoicePreviewData.billed_to?.country}<br />
                      Email: {invoicePreviewData.billed_to?.email} | Phone: {invoicePreviewData.billed_to?.phone}
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #CBD5E1', textAlign: 'left' }}>
                        <th style={{ padding: '8px 10px', fontWeight: 800 }}>Description</th>
                        <th style={{ padding: '8px 10px', fontWeight: 800, textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '8px 10px', fontWeight: 800, textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoicePreviewData.items?.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '10px' }}>{item.description}</td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>
                            {invoicePreviewData.currency_symbol}{item.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                    <div style={{ width: 260 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span>Subtotal</span>
                        <span>{invoicePreviewData.currency_symbol}{invoicePreviewData.summary?.subtotal}</span>
                      </div>
                      {invoicePreviewData.summary?.discount_amount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: '#D97706' }}>
                          <span>Discount</span>
                          <span>-{invoicePreviewData.currency_symbol}{invoicePreviewData.summary?.discount_amount}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span>Tax</span>
                        <span>{invoicePreviewData.currency_symbol}{invoicePreviewData.summary?.tax_amount}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 16, borderTop: '2px solid #CBD5E1', paddingTop: 8 }}>
                        <span>Total Due</span>
                        <span style={{ color: '#00A88C' }}>
                          {invoicePreviewData.currency_symbol}{invoicePreviewData.summary?.total_amount} {invoicePreviewData.currency}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="admin-btn admin-btn-outline"
                      onClick={() => window.print()}
                    >
                      🖨️ Print Preview
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      onClick={() => setInvoicePreviewModal(false)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ================= SESSION CREATED MODAL (PENDING PAYMENT) ================= */}
        {sessionSuccessData && (
          <div className="admin-modal-overlay" style={{ zIndex: 9999 }}>
            <div className="admin-modal" style={{ maxWidth: 540, padding: 0, overflow: 'hidden', borderRadius: 24 }}>
              <div style={{
                background: 'linear-gradient(135deg, #00A88C, #0284C7)',
                padding: '40px 28px', textAlign: 'center', color: 'white'
              }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>📋</div>
                <h2 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 6px' }}>Checkout Session Created</h2>
                <p style={{ fontSize: 14, opacity: 0.95, margin: 0 }}>
                  Reference: <strong>{sessionSuccessData.public_id}</strong>
                </p>
              </div>

              <div style={{ padding: 28 }}>
                <div style={{
                  background: '#FEF3C7', border: '1px solid #FDE68A',
                  borderRadius: 12, padding: '12px 16px', marginBottom: 20, textAlign: 'center'
                }}>
                  <span style={{ color: '#92400E', fontWeight: 800, fontSize: 13 }}>
                    ⏳ Status: PENDING PAYMENT
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#78350F' }}>
                    Your subscription will activate automatically upon payment verification.
                  </p>
                </div>

                <div style={{ fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--admin-text-muted)' }}>Amount Due:</span>
                    <strong style={{ fontSize: 16, color: '#00A88C' }}>
                      {currency_symbol}{sessionSuccessData.total_amount?.toLocaleString()} {sessionSuccessData.currency}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--admin-text-muted)' }}>Selected Method:</span>
                    <strong style={{ textTransform: 'capitalize' }}>{sessionSuccessData.payment_method}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--admin-text-muted)' }}>Session Expiry:</span>
                    <span>2 Hours ({new Date(sessionSuccessData.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn-outline"
                    onClick={() => navigate('/admin/subscription')}
                    style={{ fontWeight: 700 }}
                  >
                    View Billing Plans
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() => navigate('/admin')}
                    style={{ fontWeight: 700 }}
                  >
                    Go to Dashboard
                  </button>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={handleCancelSession}
                    disabled={cancellingSession}
                    style={{
                      background: 'none', border: 'none', color: '#DC2626',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline'
                    }}
                  >
                    {cancellingSession ? 'Cancelling...' : 'Cancel Checkout Session'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // -------------------------------------------------------------
  // RENDER: LEGACY PACKAGE COMPATIBILITY FLOW
  // -------------------------------------------------------------
  const legacyPrice = parseFloat(legacyPkg?.price || 0)
  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">🛒 Checkout</h2>
          <p className="admin-page-subtitle">Complete your subscription package purchase</p>
        </div>
        <Link to="/admin/subscription" className="admin-btn admin-btn-outline">← Back to Plans</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32, alignItems: 'flex-start' }}>
        <div>
          <form onSubmit={handleLegacySubmit}>
            {/* Payment Method */}
            <div className="admin-card" style={{ marginBottom: 24, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontWeight: 800, fontSize: 16, color: 'var(--admin-text)' }}>💳 Payment Method</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {ENTERPRISE_PAYMENT_METHODS.slice(0, 4).map(method => (
                  <label
                    key={method.key}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
                      borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                      border: paymentMethod === method.key ? `2px solid ${method.color}` : '1px solid var(--admin-border)',
                      background: paymentMethod === method.key ? `${method.color}15` : 'var(--admin-card-bg)',
                    }}
                  >
                    <input
                      type="radio" name="legacy_payment_method" value={method.key}
                      checked={paymentMethod === method.key}
                      onChange={() => setPaymentMethod(method.key)}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: 24 }}>{method.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--admin-text)' }}>{method.label}</span>
                  </label>
                ))}
              </div>

              {paymentMethod && (
                <div style={{ marginTop: 20 }}>
                  <label className="admin-form-label">Transaction ID / Reference</label>
                  <input
                    className="admin-form-input"
                    placeholder="e.g. TXN123456789"
                    value={legacyPaymentRef}
                    onChange={e => setLegacyPaymentRef(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={submitting}
              style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 800 }}
            >
              {submitting ? 'Processing...' : `Confirm & Pay ৳${legacyPrice}`}
            </button>
          </form>
        </div>

        {/* Right Summary */}
        <div className="admin-card" style={{ padding: 28 }}>
          <h3 style={{ margin: '0 0 20px', fontWeight: 800, fontSize: 16, color: 'var(--admin-text)' }}>📦 Order Summary</h3>
          <div style={{ background: 'var(--admin-sidebar-user-bg)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 4px', fontWeight: 800, color: 'var(--admin-text)', fontSize: 18 }}>
              {legacyPkg?.name}
            </h4>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-text-muted)' }}>
              {legacyPkg?.duration_months} month subscription
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 20 }}>
            <span>Total</span>
            <span style={{ color: '#00A88C' }}>৳{legacyPrice}</span>
          </div>
        </div>
      </div>

      {legacyShowSuccess && (
        <div className="admin-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="admin-modal" style={{ maxWidth: 440, padding: 32, textAlign: 'center', borderRadius: 24 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 8px' }}>Purchase Received</h2>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: 24 }}>
              Your order has been placed for {legacyPkg?.name}.
            </p>
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => navigate('/admin/subscription')}
              style={{ width: '100%', padding: '12px', fontWeight: 700 }}
            >
              View Subscriptions
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

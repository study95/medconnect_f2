// CheckoutPage.jsx — Modern Enterprise Checkout Experience for Doctors & Hospitals
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  getDoctorAvailablePlans,
  getHospitalAvailablePlans,
} from '../../../api/subscriptionApi'
import { useSubscription } from '../../../context/SubscriptionContext'
import { useAuth } from '../../../context/AuthContext'
import {
  Shield, Zap, Check, AlertTriangle, Clock, RefreshCw, FileText,
  Calendar, CheckCircle2, X, Copy, CheckCheck, Upload, ArrowLeft,
  Lock, Sparkles, Building2, User, Phone, Mail, MapPin,
  CreditCard, Smartphone, ChevronDown, ChevronUp, Printer, ExternalLink, Edit2
} from 'lucide-react'
import { getContent } from '../../../utils/contentService'
import '../../../styles/checkout.css'

export const ONLINE_GATEWAY_METHODS = [
  {
    key: 'sslcommerz',
    label: 'অনলাইন পেমেন্ট (কার্ড ও নেট ব্যাংকিং)',
    sublabel: 'ভিসা, মাস্টারকার্ড, অ্যামেক্স ও ইন্টারনেট ব্যাংকিং (Citytouch, EBL, etc.)',
    badge: 'ভিসা / মাস্টারকার্ড / নেট ব্যাংকিং',
    color: '#0052CC',
    icon: CreditCard,
  },
  {
    key: 'bkash',
    label: 'বিকাশ অনলাইন পেমেন্ট (bKash Checkout)',
    sublabel: 'ডিরেক্ট ওটিপি ও পিন ভেরিফিকেশনের মাধ্যমে তাৎক্ষণিক পেমেন্ট',
    badge: 'ইনস্ট্যান্ট চেকআউট',
    color: '#E2136E',
    icon: Smartphone,
  },
  {
    key: 'nagad',
    label: 'নগদ অনলাইন পেমেন্ট (Nagad Checkout)',
    sublabel: 'ডিরেক্ট ওটিপি ও পিন ভেরিফিকেশনের মাধ্যমে তাৎক্ষণিক পেমেন্ট',
    badge: 'ইনস্ট্যান্ট চেকআউট',
    color: '#F6921E',
    icon: Smartphone,
  },
]

export const MANUAL_PAYMENT_CHANNELS = [
  {
    key: 'offline',
    label: 'ব্যাংক ট্রান্সফার / সরাসরি ডিপোজিট',
    shortLabel: 'ব্যাংক ট্রান্সফার',
    sublabel: 'ইস্টার্ন ব্যাংক পিএলসি (EBL) বা BEFTN / NPSB',
    color: '#0284c7',
    icon: Building2,
  },
  {
    key: 'bkash',
    label: 'বিকাশ (bKash)',
    shortLabel: 'বিকাশ (bKash)',
    sublabel: 'সেন্ড মানি বা মার্চেন্ট পেমেন্ট',
    color: '#E2136E',
    icon: Smartphone,
  },
  {
    key: 'nagad',
    label: 'নগদ (Nagad)',
    shortLabel: 'নগদ (Nagad)',
    sublabel: 'সেন্ড মানি বা মার্চেন্ট পেমেন্ট',
    color: '#F6921E',
    icon: Smartphone,
  },
  {
    key: 'rocket',
    label: 'ডাচ-বাংলা রকেট (Rocket)',
    shortLabel: 'রকেট (Rocket)',
    sublabel: 'ডাচ-বাংলা ব্যাংক রকেট সেন্ড মানি',
    color: '#8C318C',
    icon: Smartphone,
  },
]

const ENTERPRISE_PAYMENT_METHODS = [
  {
    key: 'bkash',
    label: 'bKash (বিকাশ)',
    sublabel: 'সেন্ড মানি বা মার্চেন্ট পেমেন্ট',
    badge: 'ম্যানুয়াল যাচাই',
    color: '#E2136E',
    iconColor: '#E2136E',
    isManual: true,
  },
  {
    key: 'nagad',
    label: 'Nagad (নগদ)',
    sublabel: 'সেন্ড মানি বা মার্চেন্ট পেমেন্ট',
    badge: 'ম্যানুয়াল যাচাই',
    color: '#F6921E',
    iconColor: '#F6921E',
    isManual: true,
  },
  {
    key: 'offline',
    label: 'ব্যাংক ট্রান্সফার / সরাসরি ডিপোজিট',
    sublabel: 'ইস্টার্ন ব্যাংক পিএলসি (EBL) বা BEFTN/NPSB',
    badge: 'ম্যানুয়াল যাচাই',
    color: '#10B981',
    iconColor: '#10B981',
    isManual: true,
  },
  {
    key: 'sslcommerz',
    label: 'অনলাইন পেমেন্ট (কার্ড ও নেট ব্যাংকিং)',
    sublabel: 'ভিসা, মাস্টারকার্ড, অ্যামেক্স ও ইন্টারনেট ব্যাংকিং',
    badge: 'তাৎক্ষণিক গেটওয়ে',
    color: '#0052CC',
    iconColor: '#0052CC',
    isManual: false,
  },
]


export default function CheckoutPage() {
  const { isManager, user } = useAuth()
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
  // Two-Pillar payment architecture state:
  // 'online' = Instant gateway checkout (SSLCommerz, bKash Checkout, Nagad Checkout)
  // 'manual' = Corporate / Bank & Mobile deposit settlement with slip & TrxID
  const [paymentMode, setPaymentMode] = useState('online')
  const [onlineGateway, setOnlineGateway] = useState('sslcommerz')
  const [manualChannel, setManualChannel] = useState('offline')
  const [paymentMethod, setPaymentMethod] = useState('sslcommerz')
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Copy feedback state
  const [copiedField, setCopiedField] = useState('')

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  const isFreePlan = (summaryData?.target_plan?.tier === 'free') || (Number(summaryData?.pricing?.total_amount || 0) <= 0)
  const isManualMethod = !isFreePlan && paymentMode === 'manual'

  // Manual payment method breakdown
  const [manualMethod, setManualMethod] = useState('bank_transfer')
  const [senderNumber, setSenderNumber] = useState('')
  const [transactionRef, setTransactionRef] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [manualNotes, setManualNotes] = useState('')
  const [slipFile, setSlipFile] = useState(null)
  const [slipPreviewUrl, setSlipPreviewUrl] = useState(null)
  const [manualSubmitting, setManualSubmitting] = useState(false)
  const [manualSuccessData, setManualSuccessData] = useState(null)
  const [manualErrorMsg, setManualErrorMsg] = useState('')

  // Billing address state
  const [billingAddress, setBillingAddress] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    city: 'ঢাকা',
    country: 'বাংলাদেশ',
  })

  // Modals state
  const [invoicePreviewModal, setInvoicePreviewModal] = useState(false)
  const [invoicePreviewData, setInvoicePreviewData] = useState(null)
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [sessionSuccessData, setSessionSuccessData] = useState(null)
  const [cancellingSession, setCancellingSession] = useState(false)
  const [legalModal, setLegalModal] = useState({ open: false, type: 'subscription' })

  // Prevent background scroll when any modal is open
  useEffect(() => {
    if (legalModal.open || invoicePreviewModal || sessionSuccessData) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [legalModal.open, invoicePreviewModal, sessionSuccessData])

  // Legacy state
  const [legacyPkg, setLegacyPkg] = useState(null)
  const [legacyPaymentRef, setLegacyPaymentRef] = useState('')
  const [legacyShowSuccess, setLegacyShowSuccess] = useState(false)

  const handleSelectPaymentMode = (mode) => {
    setPaymentMode(mode)
    if (mode === 'online') {
      setPaymentMethod(onlineGateway)
    } else {
      setPaymentMethod(manualChannel)
      if (manualChannel === 'bkash') {
        setManualMethod('bkash_personal')
      } else if (manualChannel === 'nagad') {
        setManualMethod('nagad_personal')
      } else if (manualChannel === 'rocket') {
        setManualMethod('rocket')
      } else {
        setManualMethod('bank_transfer')
      }
    }
  }

  const handleSelectOnlineGateway = (gwKey) => {
    setOnlineGateway(gwKey)
    setPaymentMethod(gwKey)
  }

  const handleSelectManualChannel = (chKey) => {
    setManualChannel(chKey)
    setPaymentMethod(chKey)
    if (chKey === 'bkash') {
      setManualMethod('bkash_personal')
    } else if (chKey === 'nagad') {
      setManualMethod('nagad_personal')
    } else if (chKey === 'rocket') {
      setManualMethod('rocket')
    } else {
      setManualMethod('bank_transfer')
    }
  }

  const handlePaymentMethodChange = (newKey) => {
    setPaymentMethod(newKey)
    if (['sslcommerz', 'bkash_checkout', 'nagad_checkout'].includes(newKey)) {
      setPaymentMode('online')
      setOnlineGateway(newKey)
    } else {
      setPaymentMode('manual')
      setManualChannel(newKey)
      if (newKey === 'bkash') {
        setManualMethod('bkash_personal')
      } else if (newKey === 'nagad') {
        setManualMethod('nagad_personal')
      } else if (newKey === 'rocket') {
        setManualMethod('rocket')
      } else {
        setManualMethod('bank_transfer')
      }
    }
  }

  const handleCopyText = (text, fieldName) => {
    if (!text) return
    navigator.clipboard?.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => {
      setCopiedField('')
    }, 2000)
  }

  useEffect(() => {
    initCheckout()
  }, [planIdParam, billingCycle])

  const initCheckout = async () => {
    setLoading(true)
    setErrorMsg('')
    setCouponError('')

    let targetPlanId = planIdParam

    if (!targetPlanId) {
      try {
        const defaultPlanRes = isManager
          ? await getHospitalAvailablePlans().catch(() => null)
          : await getDoctorAvailablePlans().catch(() => null)
        const defaultPlanList = defaultPlanRes?.data || defaultPlanRes || []
        const defaultTarget = defaultPlanList.find(p => p.tier === 'starter' || Number(p.price_monthly) > 0) || defaultPlanList[0]
        if (defaultTarget?.id) {
          targetPlanId = String(defaultTarget.id)
        }
      } catch (autoErr) {
        console.warn('Auto-plan detection note:', autoErr)
      }
    }

    if (targetPlanId) {
      try {
        const res = await getCheckoutSummary(targetPlanId, billingCycle, appliedCoupon)
        if (res?.success && res?.data) {
          setIsEnterprise(true)
          setSummaryData(res.data)
          if (res.data.entity) {
            const ent = res.data.entity
            setBillingAddress(prev => ({
              ...prev,
              name: prev.name || ent.name || user?.name || '',
              company: prev.company || (ent.hospital_type ? ent.name : '') || '',
              email: prev.email || ent.email || ent.official_email || user?.email || '',
              phone: prev.phone || ent.phone || ent.hotline || user?.phone || '',
              address: prev.address || ent.address || '',
              city: prev.city || ent.city || 'ঢাকা',
              country: 'বাংলাদেশ',
            }))
          }
          setLoading(false)
          return
        }
      } catch (err) {
        console.warn('Enterprise summary check note:', err.response?.data?.message || err.message)
      }
    }

    // Fallback: Legacy package lookup
    try {
      const res = await getSubscriptionPackages()
      const packages = res.data?.data || []
      const found = packages.find(p => String(p.id) === String(targetPlanId))
      if (found) {
        setIsEnterprise(false)
        setLegacyPkg(found)
      } else {
        setErrorMsg('অনুরোধকৃত সাবস্ক্রিপশন প্যাকেজটি খুঁজে পাওয়া যায়নি।')
      }
    } catch (legacyErr) {
      setErrorMsg('সাবস্ক্রিপশন প্যাকেজের বিবরণ লোড করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।')
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
        const summaryRes = await getCheckoutSummary(planIdParam, billingCycle, couponInput.trim().toUpperCase())
        if (summaryRes?.success) {
          setSummaryData(summaryRes.data)
        }
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setCouponError('খুব দ্রুত চেষ্টা করা হয়েছে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন।')
      } else {
        const msg = err.response?.data?.errors?.coupon_code?.[0] || err.response?.data?.message || 'কুপন কোডটি সঠিক নয় বা প্রযোজ্য নয়।'
        setCouponError(msg)
      }
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
      alert('ইনভয়েস প্রিভিউ লোড করতে ব্যর্থ হয়েছে।')
      setInvoicePreviewModal(false)
    } finally {
      setInvoiceLoading(false)
    }
  }

  // Handle Enterprise Checkout Submission
  const handleEnterpriseCheckout = async (e) => {
    e.preventDefault()
    if (!termsAccepted) {
      alert('এগিয়ে যেতে সাবস্ক্রিপশন চুক্তি এবং বিলিং নীতিমালাতে সম্মতি দিন।')
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    try {
      const payload = {
        plan_id: parseInt(planIdParam, 10),
        billing_cycle: billingCycle,
        coupon_code: appliedCoupon || null,
        payment_method: isFreePlan ? 'free_trial' : (paymentMode === 'online' ? onlineGateway : paymentMethod),
        terms_accepted: true,
        billing_address: billingAddress,
        metadata: {
          client_timestamp: new Date().toISOString(),
          requested_from: window.location.pathname,
        },
      }

      const res = await createCheckoutSession(payload)
      if (res?.success && res?.data) {
        const redirectUrl = res.data.redirect_url || res.data.bkashURL || res.data.gateway_result?.bkashURL || res.data.gateway_result?.redirect_url
        if (redirectUrl) {
          window.location.href = redirectUrl
          return
        }

        setSessionSuccessData(res.data)
        if (isFreePlan) {
          refreshSubscription?.()
        }
      }
    } catch (err) {
      const fieldMsg = err.response?.data?.errors?.payment_method?.[0] || err.response?.data?.errors?.payment?.[0]
      const msg = fieldMsg || err.response?.data?.message || 'চেকআউট সম্পন্ন করা সম্ভব হয়নি। ইনপুটগুলো যাচাই করুন।'
      setErrorMsg(msg)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Session Cancellation
  const handleCancelSession = async () => {
    if (!sessionSuccessData?.session_id) return
    if (!window.confirm('আপনি কি নিশ্চিত যে অপেক্ষমাণ চেকআউট সেশনটি বাতিল করতে চান?')) return

    setCancellingSession(true)
    try {
      const res = await cancelCheckoutSession(sessionSuccessData.session_id)
      if (res?.success) {
        alert('চেকআউট সেশন বাতিল করা হয়েছে।')
        setSessionSuccessData(null)
        navigate(isManager ? '/admin/hospital-subscription' : '/admin/subscription')
      }
    } catch (err) {
      alert('সেশন বাতিল করা ব্যর্থ হয়েছে: ' + (err.response?.data?.message || 'ত্রুটি'))
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
      alert('পেমেন্টের প্রমাণ অবশ্যই বৈধ ছবি ফাইল (JPG, PNG, বা WEBP) হতে হবে।')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('ফাইলের সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে।')
      return
    }
    setSlipFile(file)
    setSlipPreviewUrl(URL.createObjectURL(file))
    setManualErrorMsg('')
  }

  // Handle Enterprise Manual Offline Payment Submission
  const handleManualPaymentSubmit = async (e) => {
    e.preventDefault()
    if (!slipFile) {
      setManualErrorMsg('পেমেন্টের প্রমাণের স্ক্রিনশট বা ব্যাংক রসিদ আপলোড করা আবশ্যক।')
      return
    }
    if (!transactionRef.trim()) {
      setManualErrorMsg('অনুগ্রহ করে ট্রানজ্যাকশন আইডি (TrxID) বা ব্যাংক রেফারেন্স নম্বর দিন।')
      return
    }
    if (!termsAccepted) {
      alert('এগিয়ে যেতে সাবস্ক্রিপশন চুক্তি এবং বিলিং নীতিমালাতে সম্মতি দিন।')
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
      if (manualChannel === 'bkash') {
        methodToSubmit = manualMethod.startsWith('bkash') ? manualMethod : 'bkash_personal'
      } else if (manualChannel === 'nagad') {
        methodToSubmit = manualMethod.startsWith('nagad') ? manualMethod : 'nagad_personal'
      } else if (manualChannel === 'rocket') {
        methodToSubmit = 'rocket'
      } else if (manualChannel === 'offline') {
        methodToSubmit = 'bank_transfer'
      }
      formData.append('payment_method', methodToSubmit)
      formData.append('transaction_reference', transactionRef.trim())
      formData.append('sender_number', senderNumber.trim())
      formData.append('payment_date', paymentDate)
      formData.append('terms_accepted', '1')
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
        setManualErrorMsg(err.response?.data?.message || 'ম্যানুয়াল পেমেন্ট জমা দিতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।')
      }
    } finally {
      setManualSubmitting(false)
    }
  }

  // Handle Legacy Checkout Submission
  const handleLegacySubmit = async (e) => {
    e.preventDefault()
    if (!paymentMethod) {
      alert('পেমেন্ট মাধ্যম নির্বাচন করুন।')
      return
    }
    if (paymentMethod !== 'sslcommerz' && !legacyPaymentRef.trim()) {
      alert('ট্রানজ্যাকশন আইডি প্রদান করুন।')
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
      alert(err.response?.data?.message || 'সাবস্ক্রিপশন সম্পন্ন করতে ব্যর্থ হয়েছে।')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading Screen
  if (loading) {
    return (
      <div className="chk-container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCw size={36} className="animate-spin" style={{ color: '#00B875', marginBottom: 16 }} />
        <h3 style={{ color: 'var(--admin-text, #0f172a)', fontWeight: 800 }}>নিরাপদ চেকআউট প্রস্তুত করা হচ্ছে...</h3>
        <p style={{ color: 'var(--admin-text-muted, #64748b)', fontSize: 13.5 }}>প্রোরেশন, ছাড় এবং অর্ডারের বিস্তারিত হিসাব হচ্ছে...</p>
      </div>
    )
  }

  // Error Screen
  if (errorMsg && !summaryData && !legacyPkg) {
    return (
      <div className="chk-container" style={{ paddingTop: 40 }}>
        <div className="chk-card" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', padding: 36 }}>
          <AlertTriangle size={48} style={{ color: '#EF4444', margin: '0 auto 16px' }} />
          <h2 style={{ color: 'var(--admin-text, #0f172a)', fontWeight: 800, marginBottom: 10 }}>চেকআউট লোড করা সম্ভব হয়নি</h2>
          <p style={{ color: 'var(--admin-text-muted, #64748b)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{errorMsg}</p>
          <Link to={isManager ? '/admin/hospital-subscription' : '/admin/subscription'} className="chk-btn-primary" style={{ display: 'inline-flex', width: 'auto' }}>
            <ArrowLeft size={16} />
            <span>সাবস্ক্রিপশন প্ল্যানে ফিরে যান</span>
          </Link>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: ENTERPRISE CHECKOUT EXPERIENCE
  // ─────────────────────────────────────────────────────────────
  if (isEnterprise && summaryData) {
    const { target_plan, current_plan, pricing, currency_symbol, manual_payment_settings } = summaryData
    const accounts = manual_payment_settings?.accounts || {}
    const returnUrl = target_plan.target_entity === 'hospital' || isManager
      ? '/admin/hospital-subscription'
      : '/admin/subscription'

    return (
      <div className="chk-container chk-fade-in">
        {/* ─── PAGE HEADER ─── */}
        <div className="chk-header">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <Link to={returnUrl} className="chk-btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }} title="প্ল্যান তালিকায় ফিরে যান">
                <ArrowLeft size={14} />
                <span>ফিরে যান</span>
              </Link>
              <span className="chk-ssl-badge">
                <Lock size={12} />
                নিরাপদ SSL ২৫৬-বিট
              </span>
            </div>
            <h1 className="chk-title">
              সাবস্ক্রিপশন চেকআউট ও পেমেন্ট
            </h1>
            <p className="chk-subtitle">
              অর্ডারের বিবরণ পর্যালোচনা করুন এবং আপনার পছন্দের মাধ্যমে পেমেন্ট সম্পন্ন করুন।
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="chk-btn-outline"
              onClick={handleOpenInvoicePreview}
            >
              <FileText size={15} style={{ color: '#00B875' }} />
              <span>ইনভয়েস প্রিভিউ</span>
            </button>
            <Link to={returnUrl} className="chk-btn-outline">
              প্ল্যান পরিবর্তন
            </Link>
          </div>
        </div>

        {/* ─── VERIFICATION LOCK BANNER ─── */}
        {summaryData?.is_checkout_locked && (
          <div className="chk-banner warning chk-fade-in">
            <Clock size={24} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '14.5px' }}>পেমেন্ট ভেরিফিকেশন চলমান রয়েছে</div>
              <div style={{ fontSize: '13px', marginTop: 2, opacity: 0.95 }}>
                {summaryData.lock_reason || 'আপনার আগের একটি পেমেন্ট বর্তমানে যাচাইয়ের অপেক্ষায় রয়েছে। অনুগ্রহ করে অ্যাডমিন পর্যালোচনার অপেক্ষা করুন।'}
              </div>
            </div>
          </div>
        )}

        {/* ─── FREE TRIAL ACTIVATED SUCCESS BANNER ─── */}
        {sessionSuccessData && isFreePlan && (
          <div className="chk-banner success chk-fade-in">
            <Sparkles size={28} style={{ color: '#10B981', flexShrink: 0 }} />
            <div className="flex-grow-1">
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#065F46' }}>
                ১৪ দিনের ফ্রি ট্রায়াল সফলভাবে চালু হয়েছে!
              </div>
              <p style={{ margin: '4px 0 12px', fontSize: '13px', color: '#047857' }}>
                আপনার ট্রায়াল প্ল্যানটি এখন সম্পূর্ণ সক্রিয়। সকল ডিজিটাল সুবিধা উপভোগ করতে পারেন।
              </p>
              <div className="d-flex gap-2 flex-wrap">
                <Link to={returnUrl} className="chk-btn-primary" style={{ display: 'inline-flex', width: 'auto', padding: '10px 18px' }}>
                  <Zap size={15} />
                  <span>পোর্টালে প্রবেশ করুন</span>
                </Link>
                <Link to="/admin/subscription/history" className="chk-btn-outline" style={{ background: '#ffffff' }}>
                  সাবস্ক্রিপশন হিস্ট্রি
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ─── MANUAL PAYMENT SUBMITTED SUCCESS BANNER ─── */}
        {manualSuccessData && (
          <div className="chk-banner success chk-fade-in">
            <CheckCircle2 size={28} style={{ color: '#10B981', flexShrink: 0 }} />
            <div className="flex-grow-1">
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#065F46' }}>
                পেমেন্ট রসিদ সফলভাবে জমা হয়েছে!
              </div>
              <p style={{ margin: '4px 0 10px', fontSize: '13px', color: '#047857', lineHeight: 1.5 }}>
                আপনার TrxID এবং রসিদের স্ক্রিনশট গ্রহণ করা হয়েছে এবং বর্তমানে <strong>অ্যাডমিন পর্যালোচনায়</strong> রয়েছে।
                ভেরিফিকেশন সম্পন্ন হওয়ামাত্রই প্ল্যানটি সক্রিয় হবে।
              </p>
              <div className="d-flex align-items-center gap-3 mb-3 flex-wrap" style={{ background: '#d1fae5', padding: '8px 14px', borderRadius: 8, fontSize: '12.5px' }}>
                <span>TrxID: <strong>{manualSuccessData.transaction_reference}</strong></span>
                <span>•</span>
                <span>পরিমাণ: <strong>৳{Number(manualSuccessData.submitted_amount || 0).toLocaleString()}</strong></span>
                <span>•</span>
                <span style={{ color: '#d97706', fontWeight: 800 }}>অ্যাডমিন অনুমোদনের অপেক্ষায়</span>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <Link to="/admin/subscription/history" className="chk-btn-primary" style={{ display: 'inline-flex', width: 'auto', padding: '10px 18px' }}>
                  হিস্ট্রিতে ট্র্যাক করুন
                </Link>
                <Link to={returnUrl} className="chk-btn-outline" style={{ background: '#ffffff' }}>
                  পোর্টালে ফিরে যান
                </Link>
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="chk-banner error chk-fade-in">
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* ─── MAIN 2-COLUMN GRID ─── */}
        <div className="chk-grid">

          {/* LEFT COLUMN: Configuration & Payment */}
          <div>
            <form onSubmit={isManualMethod ? handleManualPaymentSubmit : handleEnterpriseCheckout}>

              {/* CARD 1: Selected Plan & Cycle */}
              <div className="chk-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="chk-card-title" style={{ margin: 0 }}>
                    <Shield size={18} style={{ color: '#00B875' }} />
                    <span>নির্বাচিত সাবস্ক্রিপশন প্যাকেজ</span>
                  </h3>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      background: isFreePlan ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 184, 117, 0.1)',
                      color: isFreePlan ? '#059669' : '#00b875',
                      border: '1px solid rgba(0, 184, 117, 0.25)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {target_plan.tier_bn || target_plan.tier} টায়ার
                  </span>
                </div>

                <div className="chk-plan-banner">
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: 'var(--admin-text, #0f172a)' }}>
                      {target_plan.name_bn || target_plan.name}
                    </h4>
                    <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--admin-text-muted, #64748b)' }}>
                      গ্রাহক সত্ত্বা: <strong>{target_plan.target_entity === 'hospital' ? 'হাসপাতাল ও ক্লিনিক' : 'চিকিৎসক / ডাক্তার'}</strong>
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#00B875', lineHeight: 1.1 }}>
                      {currency_symbol}{billingCycle === 'annual' ? Number(target_plan.price_annual).toLocaleString() : Number(target_plan.price_monthly).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted, #64748b)', marginTop: '2px' }}>
                      প্রতি {billingCycle === 'annual' ? 'বছর' : 'মাস'}
                    </div>
                  </div>
                </div>

                {/* Proration Context Note */}
                {current_plan && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'var(--admin-bg, #f8fafc)',
                    border: '1px dashed var(--admin-border, #e2e8f0)',
                    fontSize: '12.5px',
                    marginBottom: '18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>বর্তমান প্ল্যান: <strong>{current_plan.name_bn || current_plan.name}</strong></span>
                    <span style={{ color: '#059669', fontWeight: 700 }}>
                      {pricing.proration_credit > 0 ? `অব্যবহৃত ক্রেডিট সাশ্রয়: ${currency_symbol}${Number(pricing.proration_credit).toLocaleString()}` : 'সরাসরি আপগ্রেড'}
                    </span>
                  </div>
                )}

                {/* Billing Cycle Switcher */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', display: 'block', color: 'var(--admin-text, #0f172a)' }}>
                    বিলিং সাইকেল নির্বাচন করুন
                  </label>
                  <div className="chk-cycle-grid">
                    <button
                      type="button"
                      disabled={summaryData?.is_checkout_locked}
                      onClick={() => handleCycleChange('monthly')}
                      className={`chk-cycle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                    >
                      <div style={{ fontWeight: 800, fontSize: '14px' }}>মাসিক বিলিং</div>
                      <div style={{ fontSize: '12px', color: 'var(--admin-text-muted, #64748b)', marginTop: '2px' }}>
                        প্রতি মাসে নিয়মিত পরিশোধ
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={summaryData?.is_checkout_locked}
                      onClick={() => handleCycleChange('annual')}
                      className={`chk-cycle-btn ${billingCycle === 'annual' ? 'active' : ''}`}
                    >
                      <span className="chk-savings-badge">
                        ~২০% সাশ্রয়
                      </span>
                      <div style={{ fontWeight: 800, fontSize: '14px' }}>বাৎসরিক বিলিং</div>
                      <div style={{ fontSize: '12px', color: 'var(--admin-text-muted, #64748b)', marginTop: '2px' }}>
                        এককালীন ১২ মাসের পরিশোধ
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD 2: Verified Customer & Entity Profile (Read-Only) */}
              <div className="chk-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <Building2 size={18} style={{ color: '#00B875' }} />
                    <h3 className="chk-card-title" style={{ margin: 0 }}>
                      বিলিং ও গ্রাহক পরিচিতি
                    </h3>
                  </div>
                  {/* Verified Profile Badge */}
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '999px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    color: '#059669',
                    border: '1px solid rgba(16, 185, 129, 0.25)'
                  }}>
                    <CheckCircle2 size={12} />
                    ভেরিফাইড প্রোফাইল
                  </span>
                </div>

                <div className="chk-profile-summary" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px 12px' }}>
                  {/* 1. Public ID */}
                  <div>
                    <div className="chk-profile-item-label">
                      {target_plan?.target_entity === 'hospital' || isManager ? 'হাসপাতাল আইডি (Public ID)' : 'গ্রাহক আইডি (Public ID)'}
                    </div>
                    <div className="chk-profile-item-val" style={{ fontFamily: 'monospace', fontWeight: 800, color: '#00B875', fontSize: '14.5px' }}>
                      {summaryData?.entity?.public_id || (target_plan?.target_entity === 'hospital' || isManager ? `HP-${String(user?.id || 1).padStart(5, '0')}` : `DR-${String(user?.id || 1).padStart(5, '0')}`)}
                    </div>
                  </div>

                  {/* 2. Name */}
                  <div>
                    <div className="chk-profile-item-label">
                      {target_plan?.target_entity === 'hospital' || isManager ? 'হাসপাতাল / প্রতিষ্ঠানের নাম' : 'নাম / চিকিৎসক'}
                    </div>
                    <div className="chk-profile-item-val" style={{ fontWeight: 800 }}>
                      {summaryData?.entity?.name || billingAddress.name || user?.name || 'নির্ধারিত নয়'}
                    </div>
                  </div>

                  {/* 3. BMDC (for doctor) or License Number (for hospital) */}
                  {target_plan?.target_entity === 'hospital' || isManager ? (
                    <div>
                      <div className="chk-profile-item-label">সরকারি লাইসেন্স নম্বর</div>
                      <div className="chk-profile-item-val" style={{ fontWeight: 700 }}>
                        {summaryData?.entity?.license_number || 'যাচাইকৃত স্বাস্থ্য প্রতিষ্ঠান'}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="chk-profile-item-label">বিএমডিসি নম্বর (BMDC Reg)</div>
                      <div className="chk-profile-item-val" style={{ fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>
                        {summaryData?.entity?.bmdc ? `BMDC: ${summaryData.entity.bmdc}` : (user?.bmdc ? `BMDC: ${user.bmdc}` : 'যাচাইকৃত রেজিস্টার্ড চিকিৎসক')}
                      </div>
                    </div>
                  )}

                  {/* 4. Phone */}
                  <div>
                    <div className="chk-profile-item-label">মোবাইল নম্বর</div>
                    <div className="chk-profile-item-val" style={{ fontWeight: 600 }}>
                      {summaryData?.entity?.phone || billingAddress.phone || user?.phone || 'নির্ধারিত নয়'}
                    </div>
                  </div>

                  {/* 5. Billing Email */}
                  <div>
                    <div className="chk-profile-item-label">বিলিং ইমেইল</div>
                    <div className="chk-profile-item-val" style={{ fontWeight: 600 }}>
                      {summaryData?.entity?.email || billingAddress.email || user?.email || 'নির্ধারিত নয়'}
                    </div>
                  </div>

                  {/* 6. Address & City */}
                  <div>
                    <div className="chk-profile-item-label">ঠিকানা ও শহর</div>
                    <div className="chk-profile-item-val">
                      {summaryData?.entity?.address
                        ? `${summaryData.entity.address}, ${summaryData.entity.city || 'ঢাকা'}`
                        : (billingAddress.address ? `${billingAddress.address}, ${billingAddress.city || 'ঢাকা'}` : (summaryData?.entity?.city || 'ঢাকা, বাংলাদেশ'))}
                    </div>
                  </div>
                </div>

                {/* Verified Audit Note */}
                <div style={{
                  marginTop: '16px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--admin-border, #f1f5f9)',
                  fontSize: '11.5px',
                  color: 'var(--admin-text-muted, #64748b)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Shield size={13} style={{ color: '#10B981', flexShrink: 0 }} />
                  <span>
                    এই তথ্যগুলো আপনার ভেরিফাইড প্রাতিষ্ঠানিক অ্যাকাউন্ট থেকে চালানের (Invoice) জন্য স্বয়ংক্রিয়ভাবে সংযুক্ত রয়েছে।
                  </span>
                </div>
              </div>

              {/* CARD 3: Payment Method Selection */}
              {isFreePlan ? (
                <div className="chk-card" style={{ border: '2px solid #10B981', background: 'rgba(16, 185, 129, 0.04)' }}>
                  <div className="d-flex align-items-center gap-3">
                    <Sparkles size={32} style={{ color: '#10B981', flexShrink: 0 }} />
                    <div>
                      <h3 style={{ margin: 0, fontWeight: 800, fontSize: '16px', color: '#065F46' }}>
                        ১৪ দিনের ফ্রি ট্রায়াল সুবিধা
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#047857' }}>
                        <strong>৳০ (সম্পূর্ণ বিনামূল্যে)।</strong> নিশ্চিত করলেই ১৪ দিনের ট্রায়াল সুবিধা তাৎক্ষণিক সক্রিয় হবে। কোনো কার্ড বা পেমেন্ট মেথড আবশ্যক নয়।
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="chk-card">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="chk-card-title" style={{ margin: 0 }}>
                      <CreditCard size={18} style={{ color: '#00B875' }} />
                      <span>পেমেন্ট মাধ্যম নির্বাচন করুন</span>
                    </h3>
                    <span style={{ fontSize: '11px', color: 'var(--admin-text-muted, #64748b)' }}>
                      কোনো হিডেন চার্জ নেই
                    </span>
                  </div>

                  {/* ─── TWO MASTER PILLAR CARDS ─── */}
                  <div className="chk-pillar-grid">
                    {/* Pillar 1: Online */}
                    <div
                      onClick={() => handleSelectPaymentMode('online')}
                      className={`chk-pillar-card ${paymentMode === 'online' ? 'active-online' : ''}`}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center gap-3">
                          <div style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: paymentMode === 'online' ? '#00B875' : 'rgba(0, 184, 117, 0.1)',
                            color: paymentMode === 'online' ? '#ffffff' : '#00B875',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Zap size={20} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--admin-text, #0f172a)' }}>
                              অনলাইন তাৎক্ষণিক পেমেন্ট
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--admin-text-muted, #64748b)', marginTop: '1px' }}>
                              কার্ড, বিকাশ ও নগদ অটোমেটিক গেটওয়ে
                            </div>
                          </div>
                        </div>
                        <div className="chk-pillar-radio-dot">
                          {paymentMode === 'online' && <Check size={12} color="#ffffff" strokeWidth={3.5} />}
                        </div>
                      </div>

                      <div className="chk-pillar-footer">
                        <span className="chk-pillar-badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
                          ⚡ তাৎক্ষণিক সক্রিয়
                        </span>
                        <span className="chk-pillar-hint">
                          স্লিপ প্রয়োজন নেই
                        </span>
                      </div>
                    </div>

                    {/* Pillar 2: Manual / Bank */}
                    <div
                      onClick={() => handleSelectPaymentMode('manual')}
                      className={`chk-pillar-card ${paymentMode === 'manual' ? 'active-manual' : ''}`}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center gap-3">
                          <div style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: paymentMode === 'manual' ? '#0284c7' : 'rgba(2, 132, 199, 0.1)',
                            color: paymentMode === 'manual' ? '#ffffff' : '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Building2 size={20} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--admin-text, #0f172a)' }}>
                              প্রাতিষ্ঠানিক ব্যাংক ও ডিপোজিট
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--admin-text-muted, #64748b)', marginTop: '1px' }}>
                              ব্যাংক অ্যাকাউন্ট, বিকাশ, নগদ ও রকেট
                            </div>
                          </div>
                        </div>
                        <div className="chk-pillar-radio-dot">
                          {paymentMode === 'manual' && <Check size={12} color="#ffffff" strokeWidth={3.5} />}
                        </div>
                      </div>

                      <div className="chk-pillar-footer">
                        <span className="chk-pillar-badge" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
                          📋 ম্যানুয়াল ডিপোজিট
                        </span>
                        <span className="chk-pillar-hint">
                          স্লিপ ও TrxID যাচাই
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ─── EXPANDED CONTENT: ONLINE GATEWAY ─── */}
                  {paymentMode === 'online' && (
                    <div className="chk-suboptions-box">
                      <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--admin-text, #0f172a)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Zap size={15} style={{ color: '#00B875' }} />
                        <span>অনলাইন গেটওয়ে চ্যানেল নির্বাচন করুন:</span>
                      </div>

                      <div className="chk-pay-grid">
                        {ONLINE_GATEWAY_METHODS.map(m => {
                          const isSelected = onlineGateway === m.key
                          const Icon = m.icon
                          return (
                            <div
                              key={m.key}
                              onClick={() => handleSelectOnlineGateway(m.key)}
                              className={`chk-pay-card ${isSelected ? 'active' : ''}`}
                              style={{
                                borderColor: isSelected ? m.color : undefined,
                                background: isSelected ? `${m.color}0a` : undefined,
                              }}
                            >
                              <div className="d-flex align-items-center gap-3">
                                <input
                                  type="radio"
                                  name="online_gateway"
                                  value={m.key}
                                  checked={isSelected}
                                  onChange={() => handleSelectOnlineGateway(m.key)}
                                  style={{ accentColor: m.color, width: 18, height: 18, cursor: 'pointer' }}
                                />
                                <div style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 8,
                                  background: `${m.color}15`,
                                  color: m.color,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <Icon size={18} />
                                </div>
                                <div>
                                  <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--admin-text, #0f172a)' }}>
                                    {m.label}
                                  </div>
                                  <div style={{ fontSize: '12px', color: 'var(--admin-text-muted, #64748b)', marginTop: '2px' }}>
                                    {m.sublabel}
                                  </div>
                                </div>
                              </div>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background: isSelected ? `${m.color}18` : 'var(--admin-bg, #f1f5f9)',
                                  color: isSelected ? m.color : '#64748b',
                                  flexShrink: 0
                                }}
                              >
                                {m.badge}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      <div style={{
                        marginTop: '14px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(0, 184, 117, 0.05)',
                        border: '1px solid rgba(0, 184, 117, 0.2)',
                        fontSize: '12px',
                        color: '#065F46',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Shield size={15} style={{ color: '#00B875', flexShrink: 0 }} />
                        <span>
                          SSLCommerz ও ডিরেক্ট চেকআউট সম্পূর্ণ এনক্রিপ্টেড এবং বাংলাদেশ ব্যাংক নির্দেশিকা অনুযায়ী সুরক্ষিত। পেমেন্ট সফল হওয়ামাত্রই অ্যাকাউন্ট স্বয়ংক্রিয়ভাবে সক্রিয় হবে।
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ─── EXPANDED CONTENT: MANUAL / OFFLINE SETTLEMENT ─── */}
                  {paymentMode === 'manual' && (
                    <div className="chk-suboptions-box">
                      <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--admin-text, #0f172a)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={15} style={{ color: '#0284c7' }} />
                        <span>প্রাতিষ্ঠানিক ডিপোজিট বা মোবাইল ব্যাংকিং চ্যানেল নির্বাচন করুন:</span>
                      </div>

                      {/* 4 Channel Tabs */}
                      <div className="chk-channel-nav">
                        {MANUAL_PAYMENT_CHANNELS.map(ch => {
                          const isSelected = manualChannel === ch.key
                          const Icon = ch.icon
                          return (
                            <button
                              key={ch.key}
                              type="button"
                              onClick={() => handleSelectManualChannel(ch.key)}
                              className={`chk-channel-btn ${isSelected ? 'active' : ''}`}
                              style={isSelected ? { borderColor: ch.color, color: ch.color, background: `${ch.color}12` } : {}}
                            >
                              <Icon size={16} />
                              <span>{ch.shortLabel}</span>
                            </button>
                          )
                        })}
                      </div>

                      {/* Account details box */}
                      <div className="chk-acc-box">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--admin-text, #0f172a)' }}>
                            {manualChannel === 'bkash' && '📱 অফিশিয়াল বিকাশ অ্যাকাউন্ট:'}
                            {manualChannel === 'nagad' && '📲 অফিশিয়াল নগদ অ্যাকাউন্ট:'}
                            {manualChannel === 'rocket' && '🚀 অফিশিয়াল ডাচ-বাংলা রকেট অ্যাকাউন্ট:'}
                            {manualChannel === 'offline' && '🏦 অফিশিয়াল ব্যাংক হিসাব বিবরণী:'}
                          </div>
                          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                            {manualChannel === 'offline' ? 'সরাসরি ট্রান্সফার' : 'সেন্ড মানি / মার্চেন্ট'}
                          </span>
                        </div>

                        {manualChannel === 'bkash' && (
                          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div>
                              <div style={{ fontSize: '16px', fontWeight: 900, color: '#E2136E', letterSpacing: '0.5px' }}>
                                {accounts.bkash_number || '01700000000'}
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                                মেথড: <strong>{manualMethod === 'bkash_personal' ? 'পার্সোনাল (সেন্ড মানি)' : 'মার্চেন্ট পেমেন্ট'}</strong>
                              </div>
                            </div>
                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                onClick={() => setManualMethod(manualMethod === 'bkash_personal' ? 'bkash_merchant' : 'bkash_personal')}
                                className="chk-btn-outline"
                                style={{ padding: '4px 10px', fontSize: '11px' }}
                              >
                                {manualMethod === 'bkash_personal' ? 'মার্চেন্টে পাঠান?' : 'পার্সোনালে পাঠান?'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyText(accounts.bkash_number || '01700000000', 'bkash')}
                                className="chk-copy-btn"
                              >
                                {copiedField === 'bkash' ? <CheckCheck size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                                <span>{copiedField === 'bkash' ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {manualChannel === 'nagad' && (
                          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div>
                              <div style={{ fontSize: '16px', fontWeight: 900, color: '#F6921E', letterSpacing: '0.5px' }}>
                                {accounts.nagad_number || '01800000000'}
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                                মেথড: <strong>{manualMethod === 'nagad_personal' ? 'পার্সোনাল (সেন্ড মানি)' : 'মার্চেন্ট পেমেন্ট'}</strong>
                              </div>
                            </div>
                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                onClick={() => setManualMethod(manualMethod === 'nagad_personal' ? 'nagad_merchant' : 'nagad_personal')}
                                className="chk-btn-outline"
                                style={{ padding: '4px 10px', fontSize: '11px' }}
                              >
                                {manualMethod === 'nagad_personal' ? 'মার্চেন্টে পাঠান?' : 'পার্সোনালে পাঠান?'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyText(accounts.nagad_number || '01800000000', 'nagad')}
                                className="chk-copy-btn"
                              >
                                {copiedField === 'nagad' ? <CheckCheck size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                                <span>{copiedField === 'nagad' ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {manualChannel === 'rocket' && (
                          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div>
                              <div style={{ fontSize: '16px', fontWeight: 900, color: '#8C318C', letterSpacing: '0.5px' }}>
                                {accounts.rocket_number || '01900000000'}
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                                মেথড: <strong>ডাচ-বাংলা রকেট (Rocket - সেন্ড মানি)</strong>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(accounts.rocket_number || '01900000000', 'rocket')}
                              className="chk-copy-btn"
                            >
                              {copiedField === 'rocket' ? <CheckCheck size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                              <span>{copiedField === 'rocket' ? 'কপি হয়েছে!' : 'নম্বর কপি করুন'}</span>
                            </button>
                          </div>
                        )}

                        {manualChannel === 'offline' && (
                          <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '12.5px' }}>
                              <div>ব্যাংক: <strong>{accounts.bank_name || 'Eastern Bank PLC'}</strong></div>
                              <div>হিসাবের নাম: <strong>{accounts.bank_account_name || 'Doctor Booklet Health Ltd'}</strong></div>
                              <div>শাখা: <strong>{accounts.bank_branch || 'Principal Branch, Dhaka'}</strong></div>
                              <div>রাউটিং: <strong>{accounts.bank_routing_number || '095260100'}</strong></div>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mt-2 pt-2 flex-wrap gap-2" style={{ borderTop: '1px solid #e2e8f0' }}>
                              <div>
                                হিসাব নম্বর: <strong style={{ fontSize: '14px', letterSpacing: '0.5px' }}>{accounts.bank_account_number || '1041060000000'}</strong>
                              </div>
                              <div className="d-flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(accounts.bank_routing_number || '095260100', 'routing')}
                                  className="chk-copy-btn"
                                >
                                  {copiedField === 'routing' ? <CheckCheck size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                                  <span>{copiedField === 'routing' ? 'কপি হয়েছে!' : 'রাউটিং কপি'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(accounts.bank_account_number || '1041060000000', 'bank')}
                                  className="chk-copy-btn"
                                >
                                  {copiedField === 'bank' ? <CheckCheck size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                                  <span>{copiedField === 'bank' ? 'কপি হয়েছে!' : 'হিসাব নম্বর কপি'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {manual_payment_settings?.instructions && (
                          <div style={{ marginTop: '10px', fontSize: '11.5px', color: '#059669', fontStyle: 'italic' }}>
                            📌 বিশেষ দ্রষ্টব্য: {manual_payment_settings.instructions}
                          </div>
                        )}
                      </div>

                      {manualErrorMsg && (
                        <div className="chk-banner error" style={{ padding: '10px 14px', fontSize: '12.5px', marginBottom: '16px' }}>
                          <AlertTriangle size={16} />
                          <span>{manualErrorMsg}</span>
                        </div>
                      )}

                      {/* Manual submission input fields */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                        <div>
                          <label className="admin-form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                            প্রেরক নম্বর / অ্যাকাউন্ট
                          </label>
                          <input
                            type="text"
                            className="admin-form-input"
                            placeholder="যেমন: 01711XXXXXX বা ব্যাংক হিসাব"
                            value={senderNumber}
                            onChange={e => setSenderNumber(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="admin-form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                            ট্রানজ্যাকশন আইডি (TrxID) বা ব্যাংক স্লিপ <span style={{ color: '#DC2626' }}>*</span>
                          </label>
                          <input
                            type="text"
                            className="admin-form-input"
                            placeholder="যেমন: 9J87K6L5M4"
                            value={transactionRef}
                            onChange={e => setTransactionRef(e.target.value.toUpperCase())}
                            style={{ fontWeight: 800, letterSpacing: '0.5px' }}
                            required
                          />
                        </div>

                        <div>
                          <label className="admin-form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                            পেমেন্টের তারিখ <span style={{ color: '#DC2626' }}>*</span>
                          </label>
                          <input
                            type="date"
                            className="admin-form-input"
                            value={paymentDate}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={e => setPaymentDate(e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <label className="admin-form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                            নোট বা রেফারেন্স (ঐচ্ছিক)
                          </label>
                          <input
                            type="text"
                            className="admin-form-input"
                            placeholder="যেমন: ডা. আরমান কর্তৃক জমাকৃত"
                            value={manualNotes}
                            onChange={e => setManualNotes(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Modern File Dropzone */}
                      <div className="mb-2">
                        <label className="admin-form-label" style={{ fontSize: '12px', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                          <span>পেমেন্টের স্ক্রিনশট বা রসিদের ছবি <span style={{ color: '#DC2626' }}>*</span></span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>JPG, PNG (সর্বোচ্চ ৫ মেগাবাইট)</span>
                        </label>

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleSlipFileChange}
                          id="chk-slip-input"
                          style={{ display: 'none' }}
                        />

                        {slipPreviewUrl ? (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '12px'
                          }}>
                            <div className="d-flex align-items-center gap-3">
                              <img
                                src={slipPreviewUrl}
                                alt="Slip Preview"
                                style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid #cbd5e1' }}
                              />
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{slipFile?.name}</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>{(slipFile?.size / 1024).toFixed(1)} KB • প্রস্তুত</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setSlipFile(null); setSlipPreviewUrl(null) }}
                              className="chk-btn-outline"
                              style={{ padding: '4px 10px', fontSize: '12px', color: '#dc2626' }}
                            >
                              <X size={14} />
                              <span>মুছে ফেলুন</span>
                            </button>
                          </div>
                        ) : (
                          <label htmlFor="chk-slip-input" className="chk-dropzone" style={{ display: 'block' }}>
                            <Upload size={28} style={{ color: '#0284c7', margin: '0 auto 6px' }} />
                            <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--admin-text, #0f172a)' }}>
                              পেমেন্ট স্লিপ বা ট্রানজ্যাকশন স্ক্রিনশট আপলোড করতে ক্লিক করুন
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--admin-text-muted, #64748b)', marginTop: '2px' }}>
                              ক্যামেরা দিয়ে তোলা ছবি বা গ্যালারি থেকে নির্বাচন করুন
                            </div>
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CARD 4: Terms & Agreement */}
              <div className="chk-card" style={{ padding: '16px 20px', background: 'var(--admin-bg, #f8fafc)', borderRadius: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    style={{ width: 18, height: 18, marginTop: 2, accentColor: '#00B875', cursor: 'pointer', flexShrink: 0 }}
                    required
                  />
                  <span style={{ fontSize: '13px', color: 'var(--admin-text, #0f172a)', lineHeight: 1.6 }}>
                    আমি Doctor Booklet-এর{' '}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setLegalModal({ open: true, type: 'subscription' })
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          e.stopPropagation()
                          setLegalModal({ open: true, type: 'subscription' })
                        }
                      }}
                      style={{
                        color: '#00B875',
                        fontWeight: 700,
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      সাবস্ক্রিপশন চুক্তি
                    </span>
                    {' '}ও{' '}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setLegalModal({ open: true, type: 'billing' })
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          e.stopPropagation()
                          setLegalModal({ open: true, type: 'billing' })
                        }
                      }}
                      style={{
                        color: '#00B875',
                        fontWeight: 700,
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      বিলিং নীতিমালায়
                    </span>
                    {' '}সম্মতি জানাচ্ছি। আমি অবগত যে {isManualMethod ? 'পেমেন্ট রসিদ ও TrxID জমা দেওয়ার পর অ্যাডমিন যাচাই সাপেক্ষে' : 'অনলাইন গেটওয়েতে সফল পেমেন্টের পর তাৎক্ষণিকভাবে'} প্ল্যানটি কার্যকর হবে।
                  </span>
                </label>
              </div>

              {/* Inline Error Alert for instant visibility at bottom */}
              {errorMsg && (
                <div className="chk-banner error chk-fade-in" style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12 }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: '13px', lineHeight: 1.5, fontWeight: 600 }}>{errorMsg}</div>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                className="chk-btn-primary"
                disabled={submitting || manualSubmitting || !termsAccepted || summaryData?.is_checkout_locked}
              >
                {summaryData?.is_checkout_locked ? (
                  <>
                    <Lock size={16} />
                    <span>লক করা (ভেরিফিকেশন চলছে)</span>
                  </>
                ) : isFreePlan ? (
                  <>
                    <Zap size={16} />
                    <span>{submitting ? 'সক্রিয় হচ্ছে...' : '১৪ দিনের ফ্রি ট্রায়াল শুরু করুন (৳০)'}</span>
                  </>
                ) : isManualMethod ? (
                  <>
                    <Upload size={16} />
                    <span>{manualSubmitting ? 'জমা দেওয়া হচ্ছে...' : `পেমেন্ট রসিদ ও ট্রানজ্যাকশন জমা দিন (${currency_symbol}${Number(pricing.total_amount).toLocaleString()})`}</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    <span>{submitting ? 'প্রক্রিয়াধীন...' : `নিরাপদ গেটওয়েতে এগিয়ে যান (${currency_symbol}${Number(pricing.total_amount).toLocaleString()})`}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: Sticky Order Summary */}
          <div className="chk-summary-sticky">
            <div className="chk-card">
              <h3 style={{ margin: '0 0 16px', fontWeight: 800, fontSize: '16px', color: 'var(--admin-text, #0f172a)' }}>
                🧾 অর্ডারের বিবরণ
              </h3>

              {/* Plan Box */}
              <div style={{
                background: 'var(--admin-bg, #f8fafc)',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '18px',
                border: '1px solid var(--admin-border, #e2e8f0)'
              }}>
                <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--admin-text, #0f172a)' }}>
                  {target_plan.name_bn || target_plan.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted, #64748b)', marginTop: '2px' }}>
                  বিলিং সাইকেল: <strong>{billingCycle === 'annual' ? 'বাৎসরিক' : 'মাসিক'}</strong>
                </div>
              </div>

              {/* Coupon Box */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px', display: 'block', color: 'var(--admin-text, #0f172a)' }}>
                  কুপন বা ডিসকাউন্ট কোড
                </label>
                {appliedCoupon ? (
                  <div style={{
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ fontSize: '12px', color: '#065f46', fontWeight: 800 }}>
                      ✓ {appliedCoupon} কুপন যুক্ত হয়েছে
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      disabled={couponLoading}
                      style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      মুছে ফেলুন
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        className="admin-form-input"
                        placeholder="যেমন: SAVE20"
                        value={couponInput}
                        onChange={e => {
                          setCouponInput(e.target.value.toUpperCase())
                          setCouponError('')
                        }}
                        style={{ textTransform: 'uppercase', fontWeight: 800, fontSize: '13px' }}
                      />
                      <button
                        type="button"
                        className="chk-btn-outline"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        style={{ padding: '0 16px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        {couponLoading ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            <span>যাচাই হচ্ছে...</span>
                          </>
                        ) : (
                          'প্রয়োগ'
                        )}
                      </button>
                    </div>
                    {couponError && (
                      <div style={{
                        color: '#b91c1c',
                        fontSize: '12px',
                        marginTop: '6px',
                        fontWeight: 600,
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <AlertTriangle size={13} style={{ flexShrink: 0, color: '#dc2626' }} />
                        <span>{couponError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div style={{ fontSize: '13.5px' }}>
                <div className="d-flex justify-content-between mb-2" style={{ color: 'var(--admin-text-muted, #64748b)' }}>
                  <span>সাবটোটাল</span>
                  <span style={{ fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>
                    {currency_symbol}{Number(pricing.subtotal).toLocaleString()}
                  </span>
                </div>

                {pricing.proration_credit > 0 && (
                  <div className="d-flex justify-content-between mb-2" style={{ color: '#059669' }}>
                    <span>প্রোরেশন ক্রেডিট ছাড়</span>
                    <span style={{ fontWeight: 800 }}>
                      -{currency_symbol}{Number(pricing.proration_credit).toLocaleString()}
                    </span>
                  </div>
                )}

                {pricing.discount_amount > 0 && (
                  <div className="d-flex justify-content-between mb-2" style={{ color: '#d97706' }}>
                    <span>কুপন ছাড়</span>
                    <span style={{ fontWeight: 800 }}>
                      -{currency_symbol}{Number(pricing.discount_amount).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="d-flex justify-content-between mb-3" style={{ color: 'var(--admin-text-muted, #64748b)' }}>
                  <span>ভ্যাট / ট্যাক্স ({pricing.tax_rate_percentage}%)</span>
                  <span style={{ fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>
                    {currency_symbol}{Number(pricing.tax_amount).toLocaleString()}
                  </span>
                </div>

                {/* Grand Total */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  borderTop: '1.5px solid var(--admin-border, #e2e8f0)',
                  paddingTop: '14px',
                  marginTop: '10px'
                }}>
                  <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--admin-text, #0f172a)' }}>
                    সর্বমোট প্রদেয়
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <div className="chk-summary-total">
                      {currency_symbol}{Number(pricing.total_amount).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-muted, #64748b)' }}>
                      {summaryData.currency || 'BDT'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Badge */}
              <div style={{
                marginTop: '20px',
                paddingTop: '14px',
                borderTop: '1px dashed var(--admin-border, #e2e8f0)',
                fontSize: '11.5px',
                color: '#94a3b8',
                lineHeight: 1.5,
                display: 'flex',
                gap: '8px'
              }}>
                <Lock size={15} style={{ flexShrink: 0, marginTop: 1, color: '#00b875' }} />
                <span>সকল লেনদেন এনক্রিপ্ট করা ও সম্পূর্ণ নিরাপদ। কোনো গোপন চার্জ নেই।</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── INVOICE PREVIEW MODAL ─── */}
        {invoicePreviewModal && typeof document !== 'undefined' && createPortal(
          <div 
            className="chk-legal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setInvoicePreviewModal(false)
            }}
          >
            <div 
              className="admin-modal" 
              onClick={e => e.stopPropagation()}
              style={{ 
                maxWidth: 680, 
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: 32, 
                borderRadius: 20,
                textAlign: 'left',
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                animation: 'chkModalScale 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '18px', color: 'var(--admin-text, #0f172a)', textAlign: 'left' }}>
                    📄 ড্রাফট ইনভয়েস প্রিভিউ
                  </h3>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#d97706' }}>
                    খসড়া হিসাব বিবরণী
                  </span>
                </div>
                <button
                  type="button"
                  className="chk-btn-outline"
                  onClick={() => setInvoicePreviewModal(false)}
                  style={{ padding: '4px 10px' }}
                >
                  <X size={16} />
                </button>
              </div>

              {invoiceLoading ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ color: '#00B875', margin: '0 auto 8px' }} />
                  <p style={{ color: 'var(--admin-text-muted, #64748b)', fontSize: '13px' }}>ইনভয়েস প্রিভিউ তৈরি হচ্ছে...</p>
                </div>
              ) : invoicePreviewData ? (
                <div style={{ fontSize: '13px', color: 'var(--admin-text, #0f172a)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '14px', marginBottom: '14px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 800 }}>
                        {invoicePreviewData.company?.legal_name || 'Doctor Booklet Healthcare SaaS'}
                      </h4>
                      <div style={{ color: 'var(--admin-text-muted, #64748b)', fontSize: '12px' }}>
                        ভ্যাট / বিআইএন (BIN): {invoicePreviewData.company?.vat_number || 'N/A'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '13px' }}>{invoicePreviewData.invoice_number}</div>
                      <div style={{ color: 'var(--admin-text-muted, #64748b)', fontSize: '11.5px' }}>
                        তারিখ: {invoicePreviewData.issue_date}
                      </div>
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', textAlign: 'left', fontSize: '12px' }}>
                        <th style={{ padding: '8px 10px', fontWeight: 800 }}>বিবরণ</th>
                        <th style={{ padding: '8px 10px', fontWeight: 800, textAlign: 'center' }}>পরিমাণ</th>
                        <th style={{ padding: '8px 10px', fontWeight: 800, textAlign: 'right' }}>মোট টাকা</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoicePreviewData.items?.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '12.5px' }}>
                          <td style={{ padding: '8px 10px' }}>{item.description}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                            {invoicePreviewData.currency_symbol}{Number(item.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="d-flex justify-content-end mb-3">
                    <div style={{ width: 240, fontSize: '12.5px' }}>
                      <div className="d-flex justify-content-between mb-1">
                        <span>সাবটোটাল</span>
                        <span>{invoicePreviewData.currency_symbol}{invoicePreviewData.summary?.subtotal}</span>
                      </div>
                      {invoicePreviewData.summary?.discount_amount > 0 && (
                        <div className="d-flex justify-content-between mb-1" style={{ color: '#d97706' }}>
                          <span>ছাড়</span>
                          <span>-{invoicePreviewData.currency_symbol}{invoicePreviewData.summary?.discount_amount}</span>
                        </div>
                      )}
                      <div className="d-flex justify-content-between mb-1">
                        <span>ভ্যাট</span>
                        <span>{invoicePreviewData.currency_symbol}{invoicePreviewData.summary?.tax_amount}</span>
                      </div>
                      <div className="d-flex justify-content-between pt-2" style={{ borderTop: '2px solid #cbd5e1', fontWeight: 900, fontSize: '15px' }}>
                        <span>সর্বমোট</span>
                        <span style={{ color: '#00b875' }}>
                          {invoicePreviewData.currency_symbol}{invoicePreviewData.summary?.total_amount}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between">
                    <button
                      type="button"
                      className="chk-btn-outline"
                      onClick={() => window.print()}
                    >
                      <Printer size={14} />
                      <span>প্রিন্ট প্রিভিউ</span>
                    </button>
                    <button
                      type="button"
                      className="chk-btn-primary"
                      onClick={() => setInvoicePreviewModal(false)}
                      style={{ width: 'auto', padding: '8px 18px' }}
                    >
                      সম্পন্ন
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>,
          document.body
        )}

        {/* ─── ENTERPRISE LEGAL & POLICY MODAL ─── */}
        {legalModal.open && (() => {
          const cmsData = getContent()
          const isSubscription = legalModal.type === 'subscription'
          const policyData = isSubscription
            ? (cmsData.legal_subscription || {
                title: 'সাবস্ক্রিপশন সেবা চুক্তি (Master Subscription Agreement)',
                subtitle: 'Doctor Booklet প্ল্যাটফর্মে নিবন্ধিত চিকিৎসক, স্বাস্থ্য ক্লিনিক ও হাসপাতালগুলোর প্রাতিষ্ঠানিক সেবা চুক্তি।',
                updated_date: '৪ অক্টোবর, ২০২৬',
                notice: 'গুরুত্বপূর্ণ বিজ্ঞপ্তি: এটি স্বাস্থ্যসেবা প্রদানকারী (ডাক্তার/হাসপাতাল) এবং Doctor Booklet Health Technologies Ltd.-এর মধ্যকার একটি দ্বিপাক্ষিক আইনি চুক্তি। কোনো সাবস্ক্রিপশন প্ল্যান সক্রিয় করার মাধ্যমে আপনি এই চুক্তিপত্রের সকল ধারায় পূর্ণ সম্মতি জ্ঞাপন করছেন।',
                sections: []
              })
            : (cmsData.legal_billing || {
                title: 'বিলিং, পেমেন্ট ও প্রোরেশন নীতিমালা (Enterprise Billing Policy)',
                subtitle: 'সাবস্ক্রিপশন চার্জ, ৫% সরকারি ভ্যাট, অনলাইন/ম্যানুয়াল পেমেন্ট ভেরিফিকেশন এবং প্যাকেজ আপগ্রেড প্রোরেশনের সুস্পষ্ট নিয়মাবলী।',
                updated_date: '৪ অক্টোবর, ২০২৬',
                notice: 'বাংলাদেশ সরকারের অর্থ আইন ও জাতীয় রাজস্ব বোর্ডের (NBR) মূসক নির্দেশিকা অনুযায়ী এই বিলিং পলিসি পরিচালিত হয়। প্রতিটি সফল পেমেন্টে স্বয়ংক্রিয়ভাবে অডিট-রেডি ডিজিটাল ভ্যাট ইনভয়েস ইস্যু করা হয়।',
                sections: []
              })

          return typeof document !== 'undefined' ? createPortal(
            <div 
              className="chk-legal-overlay"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setLegalModal({ open: false, type: 'subscription' })
                }
              }}
            >
              <div 
                className="chk-legal-modal"
                onClick={e => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="chk-legal-modal-header">
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: 800, color: '#00D4AF', background: 'rgba(0,212,175,0.15)', padding: '2px 8px', borderRadius: 4, marginBottom: 4 }}>
                      <Shield size={12} /> DOCTOR BOOKLET ENTERPRISE COMPLIANCE
                    </div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                      {policyData.title}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      title="প্রিন্ট করুন"
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        color: '#ffffff',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Printer size={14} /> প্রিন্ট
                    </button>
                    <a
                      href={`/legal?tab=${legalModal.type}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="নতুন ট্যাবে সম্পূর্ণ পেজ দেখুন"
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        color: '#ffffff',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        textDecoration: 'none'
                      }}
                    >
                      <ExternalLink size={14} /> পূর্ণাঙ্গ পেজ
                    </a>
                    <button
                      type="button"
                      onClick={() => setLegalModal({ open: false, type: 'subscription' })}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        color: '#ffffff',
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Modal Scrollable Body */}
                <div className="chk-legal-modal-body">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      <strong>প্রতিষ্ঠান:</strong> Doctor Booklet Health Technologies Ltd. (BIN-002938192-0101)
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      সর্বশেষ হালনাগাদ: <strong>{policyData.updated_date || '৪ অক্টোবর, ২০২৬'}</strong>
                    </div>
                  </div>

                  <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: 16 }}>
                    {policyData.subtitle}
                  </p>

                  {policyData.notice && (
                    <div style={{
                      background: '#ECFDF5',
                      borderLeft: '4px solid #00B875',
                      padding: '12px 16px',
                      borderRadius: '4px 8px 8px 4px',
                      fontSize: '13px',
                      color: '#065F46',
                      fontWeight: 600,
                      lineHeight: 1.5,
                      marginBottom: 24
                    }}>
                      {policyData.notice}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {policyData.sections?.map((sec, idx) => (
                      <div key={idx} style={{ paddingBottom: 16, borderBottom: idx !== policyData.sections.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#00B875', background: 'rgba(0,184,117,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                            {sec.num}
                          </span>
                          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                            {sec.heading}
                          </h4>
                        </div>
                        <p style={{ margin: 0, fontSize: '13.5px', color: '#334155', lineHeight: 1.7 }}>
                          {sec.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="chk-legal-modal-footer">
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    সম্মতি প্রদানের মাধ্যমে আপনি এই শর্তাবলীতে সম্মত হবেন।
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      className="chk-btn-outline"
                      onClick={() => setLegalModal({ open: false, type: 'subscription' })}
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                    >
                      বন্ধ করুন
                    </button>
                    <button
                      type="button"
                      className="chk-btn-primary"
                      onClick={() => {
                        setTermsAccepted(true)
                        setLegalModal({ open: false, type: 'subscription' })
                      }}
                      style={{ width: 'auto', padding: '8px 20px', fontSize: '13px' }}
                    >
                      <Check size={16} /> আমি সম্পূর্ণ পড়েছি ও সম্মত আছি
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          ) : null
        })()}

        {/* ─── SESSION CREATED MODAL ─── */}
        {sessionSuccessData && !isFreePlan && typeof document !== 'undefined' && createPortal(
          <div 
            className="chk-legal-overlay" 
            style={{ zIndex: 99999 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setSessionSuccessData(null)
            }}
          >
            <div 
              className="admin-modal" 
              onClick={e => e.stopPropagation()}
              style={{ 
                maxWidth: 500, 
                width: '100%',
                padding: 0, 
                overflow: 'hidden', 
                borderRadius: 20,
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                animation: 'chkModalScale 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
            >
              <div style={{
                background: 'linear-gradient(135deg, #00B875, #0284C7)',
                padding: '32px 24px', textAlign: 'center', color: '#ffffff'
              }}>
                <FileText size={44} style={{ margin: '0 auto 10px' }} />
                <h2 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 4px', color: '#ffffff' }}>চেকআউট সেশন তৈরি হয়েছে</h2>
                <p style={{ fontSize: '13px', opacity: 0.95, margin: 0, color: '#ffffff' }}>
                  রেফারেন্স: <strong>{sessionSuccessData.public_id}</strong>
                </p>
              </div>

              <div style={{ padding: 24 }}>
                <div style={{
                  background: '#fef3c7', border: '1px solid #fde68a',
                  borderRadius: 10, padding: '10px 14px', marginBottom: 16, textAlign: 'center',
                  fontSize: '12.5px', color: '#92400e', fontWeight: 700
                }}>
                  অবস্থা: পেমেন্টের জন্য অপেক্ষমাণ (২ ঘণ্টার মধ্যে পরিশোধ প্রযোজ্য)
                </div>

                <div style={{ fontSize: '13.5px', marginBottom: 20, lineHeight: 1.6 }}>
                  <div className="d-flex justify-content-between mb-1">
                    <span style={{ color: 'var(--admin-text-muted, #64748b)' }}>প্রদেয় পরিমাণ:</span>
                    <strong style={{ fontSize: '15px', color: '#00B875' }}>
                      {currency_symbol}{Number(sessionSuccessData.total_amount || 0).toLocaleString()} {sessionSuccessData.currency}
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span style={{ color: 'var(--admin-text-muted, #64748b)' }}>নির্বাচিত মাধ্যম:</span>
                    <strong style={{ textTransform: 'capitalize' }}>{sessionSuccessData.payment_method}</strong>
                  </div>
                </div>

                <div className="d-flex gap-2 mb-3">
                  <button
                    type="button"
                    className="chk-btn-outline flex-grow-1"
                    onClick={() => navigate(returnUrl)}
                  >
                    প্ল্যানসমূহে ফিরে যান
                  </button>
                  <button
                    type="button"
                    className="chk-btn-primary flex-grow-1"
                    onClick={() => navigate('/admin')}
                  >
                    ড্যাশবোর্ডে যান
                  </button>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={handleCancelSession}
                    disabled={cancellingSession}
                    style={{
                      background: 'none', border: 'none', color: '#dc2626',
                      fontSize: '12px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline'
                    }}
                  >
                    {cancellingSession ? 'বাতিল হচ্ছে...' : 'সেশন বাতিল করুন'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: LEGACY PACKAGE COMPATIBILITY FLOW
  // ─────────────────────────────────────────────────────────────
  const legacyPrice = parseFloat(legacyPkg?.price || 0)
  return (
    <div className="chk-container chk-fade-in" style={{ paddingTop: 20 }}>
      <div className="chk-header">
        <div>
          <h2 className="chk-title">সাবস্ক্রিপশন চেকআউট</h2>
          <p className="chk-subtitle">প্যাকেজ ক্রয় সম্পন্ন করুন</p>
        </div>
        <Link to="/admin/subscription" className="chk-btn-outline">
          ← প্ল্যানসমূহে ফিরে যান
        </Link>
      </div>

      <div className="chk-grid">
        <div>
          <form onSubmit={handleLegacySubmit}>
            <div className="chk-card">
              <h3 className="chk-card-title">💳 পেমেন্ট মাধ্যম</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                {ENTERPRISE_PAYMENT_METHODS.slice(0, 4).map(method => (
                  <div
                    key={method.key}
                    onClick={() => setPaymentMethod(method.key)}
                    className={`chk-pay-card ${paymentMethod === method.key ? 'active' : ''}`}
                    style={{
                      borderColor: paymentMethod === method.key ? method.color : undefined,
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="radio"
                        name="legacy_payment_method"
                        value={method.key}
                        checked={paymentMethod === method.key}
                        onChange={() => setPaymentMethod(method.key)}
                        style={{ accentColor: method.color }}
                      />
                      <span style={{ fontWeight: 700, fontSize: '13.5px' }}>{method.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {paymentMethod && (
                <div style={{ marginTop: 18 }}>
                  <label className="admin-form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                    ট্রানজ্যাকশন আইডি / রেফারেন্স
                  </label>
                  <input
                    className="admin-form-input"
                    placeholder="যেমন: TXN123456789"
                    value={legacyPaymentRef}
                    onChange={e => setLegacyPaymentRef(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="chk-btn-primary"
              disabled={submitting}
            >
              {submitting ? 'প্রসেসিং হচ্ছে...' : `নিশ্চিত করুন ও পরিশোধ করুন ৳${legacyPrice.toLocaleString()}`}
            </button>
          </form>
        </div>

        <div>
          <div className="chk-card">
            <h3 className="chk-card-title">অর্ডারের বিবরণ</h3>
            <div style={{ background: 'var(--admin-bg, #f8fafc)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: '15px' }}>{legacyPkg?.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{legacyPkg?.duration_months} মাসের সাবস্ক্রিপশন</div>
            </div>
            <div className="d-flex justify-content-between align-items-baseline">
              <span style={{ fontWeight: 800 }}>সর্বমোট</span>
              <span className="chk-summary-total">৳{legacyPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {legacyShowSuccess && (
        <div className="admin-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="admin-modal" style={{ maxWidth: 420, padding: 28, textAlign: 'center', borderRadius: 20 }}>
            <CheckCircle2 size={44} style={{ color: '#10b981', margin: '0 auto 12px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 6px' }}>অর্ডার গৃহীত হয়েছে</h2>
            <p style={{ color: 'var(--admin-text-muted, #64748b)', fontSize: '13px', marginBottom: 20 }}>
              {legacyPkg?.name}-এর জন্য আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।
            </p>
            <button
              className="chk-btn-primary"
              onClick={() => navigate('/admin/subscription')}
            >
              সাবস্ক্রিপশন দেখুন
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

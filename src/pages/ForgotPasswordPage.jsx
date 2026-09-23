import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Form } from 'react-bootstrap'
import axiosInstance from '../api/axiosInstance'
import {
  Smartphone,
  ShieldCheck,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Shield,
  Sparkles,
  RefreshCw,
  HelpCircle,
  UserPlus
} from 'lucide-react'
import '../styles/auth-premium.css'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  // Steps: 1 = Mobile input, 2 = OTP verification, 3 = New password, 4 = Success
  const [step, setStep] = useState(1)
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resetToken, setResetToken] = useState('')
  const [devOtp, setDevOtp] = useState('')

  // Password fields
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // UI state
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })
  const [isNotRegistered, setIsNotRegistered] = useState(false)
  const [timer, setTimer] = useState(0)
  const [resolvedRole, setResolvedRole] = useState('')

  const otpRefs = useRef([])

  // Countdown timer for OTP resend
  useEffect(() => {
    if (timer <= 0) return
    const interval = setInterval(() => setTimer(t => t - 1), 1000)
    return () => clearInterval(interval)
  }, [timer])

  // Focus first OTP box on Step 2
  useEffect(() => {
    if (step === 2 && otpRefs.current[0]) {
      setTimeout(() => otpRefs.current[0]?.focus(), 150)
    }
  }, [step])

  // ================= STEP 1: SEND OTP =================
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault()
    setIsNotRegistered(false)
    setStatusMsg({ type: '', text: '' })

    const raw = mobile.replace(/[^\d]/g, '')
    const cleanMobile = raw.startsWith('8801') ? raw.slice(2) : raw

    if (!cleanMobile) {
      setStatusMsg({ type: 'danger', text: 'অনুগ্রহ করে আপনার মোবাইল নম্বরটি লিখুন।' })
      return
    }

    if (!/^01[3-9]\d{8}$/.test(cleanMobile)) {
      setStatusMsg({
        type: 'danger',
        text: '১১ সংখ্যার সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।'
      })
      return
    }

    setLoading(true)
    try {
      const res = await axiosInstance.post('/forgot-password/send-otp', {
        mobile: cleanMobile
      }, { skipGlobalToast: true })

      if (res.data?.success) {
        setMobile(cleanMobile)
        setStep(2)
        setTimer(60)
        setOtp(['', '', '', '', '', ''])
        if (res.data.dev_otp) {
          setDevOtp(res.data.dev_otp)
        }
        setStatusMsg({
          type: 'success',
          text: res.data.message || 'আপনার মোবাইলে ৬ সংখ্যার ওটিপি (OTP) পাঠানো হয়েছে।'
        })
      } else {
        setStatusMsg({
          type: 'danger',
          text: res.data?.message || 'ওটিপি পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
        })
      }
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.message || ''

      if (status === 404 || msg.includes('নিবন্ধিত নয়') || msg.includes('not registered') || msg.includes('not exist')) {
        setIsNotRegistered(true)
        setStatusMsg({
          type: 'danger',
          text: 'এই মোবাইল নম্বরটি সিস্টেমে নিবন্ধিত নয়। অনুগ্রহ করে সঠিক নম্বর দিন অথবা নতুন অ্যাকাউন্ট তৈরি করুন।'
        })
      } else {
        setStatusMsg({
          type: 'danger',
          text: msg || 'সার্ভারে সাময়িক সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // ================= STEP 2: OTP INPUT HANDLING =================
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/[^\d]/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)
    if (statusMsg.text) setStatusMsg({ type: '', text: '' })

    // Auto move to next input
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^\d]/g, '').slice(0, 6)
    if (!pasted) return
    const newOtp = [...otp]
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i]
    }
    setOtp(newOtp)
    const focusIdx = Math.min(pasted.length, 5)
    otpRefs.current[focusIdx]?.focus()
  }

  // Auto-fill dev OTP for quick testing
  const handleFillDevOtp = () => {
    if (!devOtp) return
    const digits = devOtp.split('').slice(0, 6)
    setOtp(digits)
    otpRefs.current[5]?.focus()
  }

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault()
    const fullOtp = otp.join('')
    if (fullOtp.length !== 6) {
      setStatusMsg({ type: 'danger', text: 'অনুগ্রহ করে সম্পূর্ণ ৬ সংখ্যার ওটিপি কোডটি লিখুন।' })
      return
    }

    setLoading(true)
    setStatusMsg({ type: '', text: '' })

    try {
      const res = await axiosInstance.post('/forgot-password/verify-otp', {
        mobile,
        otp: fullOtp
      }, { skipGlobalToast: true })

      if (res.data?.success && res.data.reset_token) {
        setResetToken(res.data.reset_token)
        setStep(3)
        setStatusMsg({
          type: 'success',
          text: 'ওটিপি যাচাই সফল হয়েছে! এবার আপনার নতুন পাসওয়ার্ড দিন।'
        })
      } else {
        setStatusMsg({
          type: 'danger',
          text: res.data?.message || 'ওটিপি যাচাই ব্যর্থ হয়েছে।'
        })
      }
    } catch (err) {
      setStatusMsg({
        type: 'danger',
        text: err.response?.data?.message || 'ভুল ওটিপি কোড! সঠিক কোডটি দিন।'
      })
    } finally {
      setLoading(false)
    }
  }

  // ================= STEP 3: RESET PASSWORD =================
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setStatusMsg({ type: '', text: '' })

    if (password.length < 6) {
      setStatusMsg({ type: 'danger', text: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' })
      return
    }

    if (password !== passwordConfirmation) {
      setStatusMsg({ type: 'danger', text: 'উভয় পাসওয়ার্ড হুবহু মিলছে না।' })
      return
    }

    setLoading(true)
    try {
      const res = await axiosInstance.post('/forgot-password/reset-password', {
        mobile,
        reset_token: resetToken,
        password,
        password_confirmation: passwordConfirmation
      }, { skipGlobalToast: true })

      if (res.data?.success) {
        const destRole = res.data.role || ''
        const redirectPath = res.data.redirect_url || (destRole ? `/login/${destRole}` : '/login')
        setResolvedRole(destRole)
        setStep(4)
        setStatusMsg({
          type: 'success',
          text: res.data.message || 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!'
        })
        // Auto redirect after 3.5 seconds
        setTimeout(() => navigate(redirectPath, { state: { identifier: mobile } }), 3500)
      } else {
        setStatusMsg({
          type: 'danger',
          text: res.data?.message || 'পাসওয়ার্ড পরিবর্তন সম্পন্ন করা যায়নি।'
        })
      }
    } catch (err) {
      const errData = err.response?.data
      setStatusMsg({
        type: 'danger',
        text: errData?.message || 'সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
        isSamePassword: errData?.is_same_password,
        loginRole: errData?.role
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-premium-wrapper">
      <div className="auth-mesh-bg" />

      {/* SPLIT CONTAINER CENTERED IN PAGE */}
      <div className="auth-split-container fade-in-up" style={{ maxWidth: 880 }}>

        {/* ===== LEFT PANEL — EXECUTIVE HEALTHCARE BRANDING ===== */}
        <div className="auth-info-panel">
          <div>
            <Link to="/" className="info-panel-logo mb-4 text-decoration-none" style={{ cursor: 'pointer' }}>
              <img
                src="/doctorBookletLogo.png"
                alt="Doctor Booklet Logo"
                style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
              />
            </Link>

            <h2 className="info-panel-title">
              পাসওয়ার্ড পুনরুদ্ধার,<br />সহজ ও সুরক্ষিত
            </h2>
            <p className="info-panel-subtitle">
              Doctor Booklet প্ল্যাটফর্মে আপনার মোবাইল নম্বরে তাৎক্ষণিক ওটিপি ভেরিফিকেশন দিয়ে পাসওয়ার্ড রিসেট করুন।
            </p>

            <ul className="info-feature-list">
              <li className="info-feature-item">
                <span className="info-feature-icon"><Smartphone size={16} /></span>
                <span>মোবাইল ওটিপি ভিত্তিক নিরাপদ রিকভারি</span>
              </li>
              <li className="info-feature-item">
                <span className="info-feature-icon"><ShieldCheck size={16} /></span>
                <span>তাৎক্ষণিক সিস্টেম ভ্যালিডেশন</span>
              </li>
              <li className="info-feature-item">
                <span className="info-feature-icon"><Lock size={16} /></span>
                <span>উচ্চমানের এনক্রিপশন ও গোপনীয়তা</span>
              </li>
              <li className="info-feature-item">
                <span className="info-feature-icon"><Sparkles size={16} /></span>
                <span>মাত্র ১ মিনিটে সম্পূর্ণ নিরাপদ রিসেট</span>
              </li>
            </ul>
          </div>

          <div className="info-trust-badge">
            <Shield size={14} />
            <span>SSL সুরক্ষিত · বিশ্বস্ত অ্যাকাউন্ট ভেরিফিকেশন</span>
          </div>
        </div>

        {/* ===== RIGHT PANEL — INTERACTIVE MULTI-STEP CARD ===== */}
        <div className="auth-form-panel fp-form-panel">
          <div className="slide-in-right">

            {/* Step Progress Bar */}
            {step < 4 && (
              <div className="fp-stepper-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    className="fp-step-circle"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: step >= 1 ? '#00B875' : '#E2E8F0',
                      color: step >= 1 ? '#FFFFFF' : '#64748B',
                      fontSize: 11.5,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    ১
                  </span>
                  <span className="fp-step-label" style={{ fontSize: 12, fontWeight: step === 1 ? 700 : 500, color: step === 1 ? '#0F172A' : '#64748B' }}>
                    নম্বর
                  </span>
                </div>

                <div style={{ flex: 1, height: 2, background: step >= 2 ? '#00B875' : '#E2E8F0', margin: '0 8px' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    className="fp-step-circle"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: step >= 2 ? '#00B875' : '#E2E8F0',
                      color: step >= 2 ? '#FFFFFF' : '#64748B',
                      fontSize: 11.5,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    ২
                  </span>
                  <span className="fp-step-label" style={{ fontSize: 12, fontWeight: step === 2 ? 700 : 500, color: step === 2 ? '#0F172A' : '#64748B' }}>
                    ওটিপি
                  </span>
                </div>

                <div style={{ flex: 1, height: 2, background: step >= 3 ? '#00B875' : '#E2E8F0', margin: '0 8px' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    className="fp-step-circle"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: step >= 3 ? '#00B875' : '#E2E8F0',
                      color: step >= 3 ? '#FFFFFF' : '#64748B',
                      fontSize: 11.5,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    ৩
                  </span>
                  <span className="fp-step-label" style={{ fontSize: 12, fontWeight: step === 3 ? 700 : 500, color: step === 3 ? '#0F172A' : '#64748B' }}>
                    পাসওয়ার্ড
                  </span>
                </div>
              </div>
            )}

            {/* Error / Alert Message Banner */}
            {statusMsg.text && statusMsg.type === 'danger' && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                  borderRadius: 12,
                  padding: '12px 14px',
                  fontSize: 13.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  marginBottom: 20
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <span>{statusMsg.text}</span>
                  {isNotRegistered && (
                    <div style={{ marginTop: 8 }}>
                      <Link
                        to="/register"
                        className="btn btn-sm"
                        style={{
                          background: '#DC2626',
                          color: '#FFFFFF',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '5px 12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          textDecoration: 'none'
                        }}
                      >
                        <UserPlus size={14} />
                        <span>নতুন অ্যাকাউন্ট নিবন্ধন করুন</span>
                      </Link>
                    </div>
                  )}
                  {statusMsg.isSamePassword && (
                    <div style={{ marginTop: 10 }}>
                      <Link
                        to={statusMsg.loginRole ? `/login/${statusMsg.loginRole}` : '/login'}
                        state={{ identifier: mobile }}
                        className="btn btn-sm"
                        style={{
                          background: '#00B875',
                          color: '#FFFFFF',
                          borderRadius: 8,
                          fontSize: 12.5,
                          fontWeight: 700,
                          padding: '6px 14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          textDecoration: 'none',
                          boxShadow: '0 2px 8px rgba(0, 184, 117, 0.3)'
                        }}
                      >
                        <ArrowRight size={14} />
                        <span>সরাসরি এই পাসওয়ার্ড দিয়ে লগইন করুন</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= STEP 1: ENTER MOBILE ================= */}
            {step === 1 && (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontWeight: 800, color: '#0F172A', fontSize: 22, marginBottom: 6, letterSpacing: '-0.4px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, rgba(0, 184, 117, 0.14) 0%, rgba(5, 150, 105, 0.2) 100%)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#00B875',
                        border: '1px solid rgba(0, 184, 117, 0.25)',
                        boxShadow: '0 2px 8px rgba(0, 184, 117, 0.12)',
                        flexShrink: 0
                      }}
                    >
                      <KeyRound size={20} />
                    </span>
                    <span>পাসওয়ার্ড ভুলে গেছেন?</span>
                  </h2>
                  <p style={{ color: '#64748B', fontWeight: 500, fontSize: 13.5, margin: 0, lineHeight: 1.55 }}>
                    আপনার অ্যাকাউন্টে নিবন্ধিত মোবাইল নম্বরটি লিখুন। নম্বরটি যাচাই করে আমরা আপনাকে ৬ সংখ্যার ওটিপি (OTP) পাঠাব।
                  </p>
                </div>

                <Form onSubmit={handleSendOtp}>
                  <Form.Group style={{ marginBottom: 20 }}>
                    <Form.Label className="auth-label-premium" style={{ marginBottom: 8 }}>
                      নিবন্ধিত মোবাইল নম্বর (Mobile Number)
                    </Form.Label>
                    <div className="input-group-premium" style={{ position: 'relative' }}>
                      <span className="input-icon-premium" style={{ color: '#00B875' }}>
                        <Smartphone size={18} />
                      </span>
                      <Form.Control
                        type="tel"
                        placeholder="যেমন: 017XXXXXXXX"
                        value={mobile}
                        maxLength={11}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^\d]/g, '')
                          setMobile(val)
                          if (statusMsg.text) setStatusMsg({ type: '', text: '' })
                          if (isNotRegistered) setIsNotRegistered(false)
                        }}
                        required
                        className="auth-input-premium"
                        style={{ paddingLeft: 44, paddingRight: 118, fontSize: 15, letterSpacing: '0.5px' }}
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={loading || mobile.length < 11}
                        style={{
                          position: 'absolute',
                          right: 5,
                          top: 5,
                          bottom: 5,
                          padding: '0 14px',
                          background: (mobile.length === 11 && !loading)
                            ? 'linear-gradient(135deg, #00B875 0%, #059669 100%)'
                            : '#E2E8F0',
                          color: (mobile.length === 11 && !loading) ? '#FFFFFF' : '#94A3B8',
                          border: 'none',
                          borderRadius: 8,
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: (loading || mobile.length < 11) ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          zIndex: 5,
                          transition: 'all 0.2s',
                          boxShadow: (mobile.length === 11 && !loading) ? '0 2px 8px rgba(0, 184, 117, 0.25)' : 'none'
                        }}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm" style={{ width: 13, height: 13 }} role="status" aria-hidden="true" />
                            <span style={{ fontSize: 11 }}>যাচাই...</span>
                          </>
                        ) : (
                          'OTP পাঠান'
                        )}
                      </button>
                    </div>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={12} color="#00B875" />
                      <span>অ্যাকাউন্ট তৈরির সময় ব্যবহৃত ১১ সংখ্যার মোবাইল নম্বরটি লিখুন</span>
                    </div>
                  </Form.Group>
                </Form>
              </div>
            )}

            {/* ================= STEP 2: VERIFY OTP ================= */}
            {step === 2 && (
              <div>
                <div style={{ marginBottom: 18 }}>
                  <h2 style={{ fontWeight: 800, color: '#0F172A', fontSize: 21, marginBottom: 6, letterSpacing: '-0.4px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, rgba(0, 184, 117, 0.14) 0%, rgba(5, 150, 105, 0.2) 100%)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#00B875',
                        border: '1px solid rgba(0, 184, 117, 0.25)',
                        boxShadow: '0 2px 8px rgba(0, 184, 117, 0.12)',
                        flexShrink: 0
                      }}
                    >
                      <ShieldCheck size={20} />
                    </span>
                    <span>ওটিপি কোড যাচাই করুন</span>
                  </h2>
                  <p style={{ color: '#64748B', fontWeight: 500, fontSize: 13.5, margin: 0, lineHeight: 1.55 }}>
                    আপনার মোবাইল নম্বর <strong style={{ color: '#0F172A' }}>{mobile}</strong>-এ ৬ সংখ্যার কোড পাঠানো হয়েছে।{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1)
                        setStatusMsg({ type: '', text: '' })
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#00B875',
                        fontWeight: 700,
                        fontSize: 13,
                        padding: 0,
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      নম্বর পরিবর্তন করুন
                    </button>
                  </p>
                </div>

                {/* Dev OTP helper for quick testing in dev/demo */}
                {devOtp && (
                  <div
                    onClick={handleFillDevOtp}
                    style={{
                      background: '#ECFDF5',
                      border: '1px dashed #059669',
                      borderRadius: 10,
                      padding: '8px 12px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: '#065F46',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 16,
                      cursor: 'pointer'
                    }}
                    title="ক্লিক করে কোড বসিয়ে দিন"
                  >
                    <span>🧪 টেস্ট ওটিপি কোড: <strong style={{ letterSpacing: 2 }}>{devOtp}</strong></span>
                    <span style={{ fontSize: 11, background: '#00B875', color: '#fff', padding: '2px 8px', borderRadius: 6 }}>
                      অটো ফিল
                    </span>
                  </div>
                )}

                {/* 6-box OTP input */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={idx === 0 ? handleOtpPaste : undefined}
                      className="fp-otp-box"
                      style={{
                        width: 44,
                        height: 50,
                        textAlign: 'center',
                        fontSize: 22,
                        fontWeight: 800,
                        borderRadius: 10,
                        border: digit ? '2px solid #00B875' : '1.5px solid #CBD5E1',
                        background: digit ? '#F0FDF4' : '#FFFFFF',
                        color: '#0F172A',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        boxShadow: digit ? '0 2px 8px rgba(0, 184, 117, 0.15)' : 'none'
                      }}
                    />
                  ))}
                </div>

                {/* Verify Button */}
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.join('').length !== 6}
                  className="w-100 auth-btn-premium"
                  style={{
                    width: '100%',
                    height: 48,
                    fontSize: 15,
                    fontWeight: 800,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    border: 'none',
                    color: '#FFFFFF',
                    background: (loading || otp.join('').length !== 6)
                      ? '#E2E8F0'
                      : 'linear-gradient(135deg, #064E3B 0%, #00B875 100%)',
                    boxShadow: (loading || otp.join('').length !== 6)
                      ? 'none'
                      : '0 4px 14px rgba(0, 184, 117, 0.32)',
                    cursor: (loading || otp.join('').length !== 6) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.25s ease',
                    marginBottom: 14
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      <span>যাচাই করা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <span>ওটিপি যাচাই করুন</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>

                {/* Resend Timer / Action */}
                <div style={{ textAlign: 'center', fontSize: 13, color: '#64748B' }}>
                  {timer > 0 ? (
                    <span>পুনরায় ওটিপি পাঠাতে অপেক্ষা করুন: <strong style={{ color: '#00B875' }}>{timer}s</strong></span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#00B875',
                        fontWeight: 700,
                        fontSize: 13,
                        padding: 0,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <RefreshCw size={13} />
                      <span>কোড পাননি? পুনরায় ওটিপি পাঠান</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ================= STEP 3: SET NEW PASSWORD ================= */}
            {step === 3 && (
              <div>
                <div style={{ marginBottom: 18 }}>
                  <h2 style={{ fontWeight: 800, color: '#0F172A', fontSize: 21, marginBottom: 6, letterSpacing: '-0.4px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, rgba(0, 184, 117, 0.14) 0%, rgba(5, 150, 105, 0.2) 100%)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#00B875',
                        border: '1px solid rgba(0, 184, 117, 0.25)',
                        boxShadow: '0 2px 8px rgba(0, 184, 117, 0.12)',
                        flexShrink: 0
                      }}
                    >
                      <Lock size={20} />
                    </span>
                    <span>নতুন পাসওয়ার্ড দিন</span>
                  </h2>
                  <p style={{ color: '#64748B', fontWeight: 500, fontSize: 13.5, margin: 0, lineHeight: 1.55 }}>
                    আপনার অ্যাকাউন্টের জন্য একটি নতুন ও শক্তিশালী গোপন পাসওয়ার্ড তৈরি করুন।
                  </p>
                </div>

                <Form onSubmit={handleResetPassword}>
                  {/* New Password */}
                  {/* New Password */}
                  <Form.Group style={{ marginBottom: 16 }}>
                    <Form.Label className="auth-label-premium" style={{ marginBottom: 6 }}>
                      নতুন পাসওয়ার্ড (New Password)
                    </Form.Label>
                    <div className="input-group-premium" style={{ position: 'relative' }}>
                      <span className="input-icon-premium" style={{ color: password.length >= 6 ? '#10B981' : '#00B875' }}>
                        <Lock size={17} />
                      </span>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        placeholder="কমপক্ষে ৬ অক্ষর"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="auth-input-premium"
                        style={{
                          paddingLeft: 44,
                          paddingRight: 42,
                          borderColor: password.length > 0
                            ? (password.length >= 6 ? '#10B981' : '#EF4444')
                            : undefined,
                          transition: 'all 0.2s ease'
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#64748B',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {/* Live Length Feedback */}
                    {password.length > 0 && (
                      password.length < 6 ? (
                        <p style={{ color: '#EF4444', fontSize: 12.5, fontWeight: 600, marginTop: 5, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span>⚠️ পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে (বর্তমানে {password.length} অক্ষর)</span>
                        </p>
                      ) : (
                        <p style={{ color: '#10B981', fontSize: 12.5, fontWeight: 600, marginTop: 5, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span>✓ পাসওয়ার্ডের দৈর্ঘ্য সঠিক</span>
                        </p>
                      )
                    )}
                  </Form.Group>

                  {/* Confirm Password */}
                  <Form.Group style={{ marginBottom: 20 }}>
                    <Form.Label className="auth-label-premium" style={{ marginBottom: 6 }}>
                      পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)
                    </Form.Label>
                    <div className="input-group-premium" style={{ position: 'relative' }}>
                      <span className="input-icon-premium" style={{ color: passwordConfirmation.length > 0 && password === passwordConfirmation ? '#10B981' : '#00B875' }}>
                        <Lock size={17} />
                      </span>
                      <Form.Control
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="পুনরায় নতুন পাসওয়ার্ড দিন"
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        required
                        className="auth-input-premium"
                        style={{
                          paddingLeft: 44,
                          paddingRight: 42,
                          borderColor: passwordConfirmation.length > 0
                            ? (password === passwordConfirmation ? '#10B981' : '#EF4444')
                            : undefined,
                          transition: 'all 0.2s ease'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#64748B',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {/* Live Match Feedback */}
                    {passwordConfirmation.length > 0 && (
                      password === passwordConfirmation ? (
                        <p style={{ color: '#10B981', fontSize: 12.5, fontWeight: 600, marginTop: 5, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span>✓ উভয় পাসওয়ার্ড হুবহু মিলেছে</span>
                        </p>
                      ) : (
                        <p style={{ color: '#EF4444', fontSize: 12.5, fontWeight: 600, marginTop: 5, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span>✕ উভয় পাসওয়ার্ড মিলছে না, দয়া করে নিশ্চিত করুন</span>
                        </p>
                      )
                    )}
                  </Form.Group>

                  <button
                    type="submit"
                    disabled={loading || password.length < 6 || password !== passwordConfirmation}
                    className="w-100 auth-btn-premium"
                    style={{
                      width: '100%',
                      height: 48,
                      fontSize: 15,
                      fontWeight: 800,
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      border: 'none',
                      color: '#FFFFFF',
                      background: (loading || password.length < 6 || password !== passwordConfirmation)
                        ? '#E2E8F0'
                        : 'linear-gradient(135deg, #064E3B 0%, #00B875 100%)',
                      boxShadow: (loading || password.length < 6 || password !== passwordConfirmation)
                        ? 'none'
                        : '0 4px 14px rgba(0, 184, 117, 0.32)',
                      cursor: (loading || password.length < 6 || password !== passwordConfirmation) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.25s ease',
                      marginTop: 8
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                        <span>সংরক্ষণ করা হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <span>পাসওয়ার্ড সংরক্ষণ করুন</span>
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </Form>
              </div>
            )}

            {/* ================= STEP 4: SUCCESS SCREEN ================= */}
            {step === 4 && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: '#DCFCE7',
                    color: '#16A34A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 4px 16px rgba(22, 163, 74, 0.2)'
                  }}
                >
                  <CheckCircle2 size={38} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                  পাসওয়ার্ড পরিবর্তন সফল হয়েছে! 🎉
                </h3>
                <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 22 }}>
                  আপনার নতুন পাসওয়ার্ড সক্রিয় হয়েছে। এখন আপনি নতুন পাসওয়ার্ড ব্যবহার করে আপনার অ্যাকাউন্টে লগইন করতে পারবেন।
                </p>
                <Link
                  to={resolvedRole ? `/login/${resolvedRole}` : '/login'}
                  state={{ identifier: mobile }}
                  className="btn btn-mc-primary"
                  style={{
                    borderRadius: 10,
                    fontSize: 14.5,
                    fontWeight: 700,
                    padding: '11px 28px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(0, 184, 117, 0.3)'
                  }}
                >
                  <span>লগইন করুন</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}

            {/* Bottom Links */}
            {step < 4 && (
              <div
                style={{
                  marginTop: 24,
                  paddingTop: 18,
                  borderTop: '1px solid #F1F5F9',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <Link
                  to="/login"
                  style={{
                    color: '#00B875',
                    fontSize: 13.5,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-3px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                >
                  <ArrowLeft size={16} />
                  <span>পাসওয়ার্ড মনে পড়েছে? লগইন করুন</span>
                </Link>

                <div style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <HelpCircle size={13} style={{ opacity: 0.8 }} />
                  <span>সহায়তা প্রয়োজন? হেল্পলাইন: </span>
                  <a href="tel:09613868438" style={{ color: '#475569', fontWeight: 600, textDecoration: 'none' }}>
                    09613868438
                  </a>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      <style>{`
        .fp-form-panel {
          padding: 36px 34px;
        }

        .fp-stepper-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
          background: transparent;
          border: none;
          padding: 0 2px;
        }

        @media (max-width: 991px) {
          .auth-split-container {
            border-radius: 18px !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.07) !important;
            border: 1px solid #E2E8F0 !important;
            overflow: hidden !important;
          }

          .fp-form-panel {
            padding: 26px 20px !important;
            border-radius: 18px !important;
          }
        }

        @media (max-width: 520px) {
          .auth-premium-wrapper {
            padding: 16px 12px 60px !important;
          }

          .auth-split-container {
            border-radius: 16px !important;
            margin-bottom: 16px;
          }

          .fp-form-panel {
            padding: 20px 16px !important;
            border-radius: 16px !important;
          }

          .fp-stepper-box {
            padding: 0 2px;
            margin-bottom: 18px;
            background: transparent;
            border: none;
          }

          .fp-step-label {
            font-size: 11px !important;
          }

          .fp-step-circle {
            width: 22px !important;
            height: 22px !important;
            font-size: 11px !important;
          }

          .fp-otp-box {
            width: 38px !important;
            height: 46px !important;
            font-size: 18px !important;
          }
        }
      `}</style>
    </div>
  )
}

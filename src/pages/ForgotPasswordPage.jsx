// ForgotPasswordPage.jsx
// Pixel-perfect match for the user's mobile forgot password design
// Full 3-step state machine with real backend OTP verification & password reset

import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import {
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Headset,
  Phone
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  // Steps: 1 = Mobile input, 2 = OTP verification, 3 = New password, 4 = Success
  const [step, setStep] = useState(1)
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resetToken, setResetToken] = useState('')

  // Password fields
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // UI state
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })
  const [timer, setTimer] = useState(0)

  const otpRefs = useRef([])

  // Countdown timer for OTP resend
  useEffect(() => {
    if (timer <= 0) return
    const interval = setInterval(() => setTimer((t) => t - 1), 1000)
    return () => clearInterval(interval)
  }, [timer])

  const formatCountdown = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    const str = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    return str.replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d])
  }

  // Focus first OTP box on Step 2
  useEffect(() => {
    if (step === 2 && otpRefs.current[0]) {
      setTimeout(() => otpRefs.current[0]?.focus(), 150)
    }
  }, [step])

  // Strictly limit mobile input to 11 digits & support Bengali numerals
  const handleMobileChange = (e) => {
    const val = e.target.value
    const bnToEn = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' }
    const normalized = val.replace(/[০-৯]/g, (d) => bnToEn[d] || d)
    const cleanDigits = normalized.replace(/\D/g, '').slice(0, 11)
    setMobile(cleanDigits)
    if (statusMsg.text) setStatusMsg({ type: '', text: '' })
  }

  // ================= STEP 1: SEND OTP =================
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault()
    setStatusMsg({ type: '', text: '' })

    const cleanMobile = mobile.replace(/[^\d]/g, '').slice(0, 11)

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
      const res = await axiosInstance.post(
        '/forgot-password/send-otp',
        { mobile: cleanMobile },
        { skipGlobalToast: true }
      )

      if (res.data?.success) {
        setMobile(cleanMobile)
        setStep(2)
        setTimer(60)
        setOtp(['', '', '', '', '', ''])
        setStatusMsg({
          type: 'success',
          text: res.data.message || 'আপনার মোবাইলে ৬ সংখ্যার ওটিপি পাঠানো হয়েছে।'
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

      const retryAfter = err.response?.data?.retry_after_seconds || err.response?.data?.cooldown_seconds
      if (status === 429 && retryAfter) {
        setTimer(Number(retryAfter))
        setStatusMsg({
          type: 'danger',
          text: msg || 'ওটিপি অনুরোধের সীমা পৌঁছেছে।'
        })
        return
      }

      if (status === 404 || msg.includes('নিবন্ধিত নয়') || msg.includes('not registered') || msg.includes('not exist')) {
        setStatusMsg({
          type: 'danger',
          text: 'এই মোবাইল নম্বরটি সিস্টেমে নিবন্ধিত নয়। সঠিক নম্বর দিন অথবা নতুন অ্যাকাউন্ট তৈরি করুন।'
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
    const bnToEn = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' }
    const normalized = String(value).replace(/[০-৯]/g, (d) => bnToEn[d] || d)
    const cleanDigits = normalized.replace(/\D/g, '')

    if (cleanDigits.length > 1) {
      const digits = cleanDigits.slice(0, 6).split('')
      const newOtp = [...otp]
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d
      })
      setOtp(newOtp)
      if (statusMsg.text) setStatusMsg({ type: '', text: '' })
      const nextFocus = Math.min(index + digits.length - 1, 5)
      setTimeout(() => otpRefs.current[nextFocus]?.focus(), 10)
      return
    }

    const singleDigit = cleanDigits.slice(-1)
    const newOtp = [...otp]
    newOtp[index] = singleDigit
    setOtp(newOtp)
    if (statusMsg.text) setStatusMsg({ type: '', text: '' })

    // Auto move to next input
    if (singleDigit && index < 5) {
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
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (otp.join('').length === 6 && !loading) {
        handleVerifyOtp()
      }
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const raw = e.clipboardData?.getData('text')?.trim() || ''
    const bnToEn = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' }
    const normalized = raw.replace(/[০-৯]/g, (d) => bnToEn[d] || d)
    const cleanDigits = normalized.replace(/\D/g, '')
    if (!cleanDigits) return
    const digits = cleanDigits.slice(0, 6).split('')
    const newOtp = ['', '', '', '', '', '']
    digits.forEach((d, i) => {
      newOtp[i] = d
    })
    setOtp(newOtp)
    if (statusMsg.text) setStatusMsg({ type: '', text: '' })
    const focusIdx = Math.min(digits.length - 1, 5)
    setTimeout(() => otpRefs.current[focusIdx]?.focus(), 10)
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
      const res = await axiosInstance.post(
        '/forgot-password/verify-otp',
        { mobile, otp: fullOtp },
        { skipGlobalToast: true }
      )

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
    if (e) e.preventDefault()
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
      const res = await axiosInstance.post(
        '/forgot-password/reset-password',
        {
          mobile,
          reset_token: resetToken,
          password,
          password_confirmation: passwordConfirmation
        },
        { skipGlobalToast: true }
      )

      if (res.data?.success) {
        const destRole = res.data.role || ''
        const redirectPath = res.data.redirect_url || (destRole ? `/login/${destRole}` : '/login')
        setStep(4)
        setStatusMsg({
          type: 'success',
          text: res.data.message || 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!'
        })
        setTimeout(() => navigate(redirectPath, { state: { identifier: mobile } }), 3000)
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
        text: errData?.message || 'সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fp-page-container">
      <div className="fp-content-wrapper">

        {/* ===== MAIN WHITE CARD ===== */}
        <div className="fp-main-card">

          {/* Top Illustration */}
          <div className="fp-illustration-wrapper">
            <img
              src="/images/forgot-password-hero.png"
              alt="পাসওয়ার্ড ভুলে গেছেন"
              className="fp-illustration-img"
              loading="eager"
            />
          </div>

          {/* Headline & Subtitle Dynamic per Step */}
          {step === 1 && (
            <>
              <h1 className="fp-main-title">পাসওয়ার্ড ভুলে গেছেন?</h1>
              <p className="fp-main-subtitle">
                নিবন্ধিত মোবাইল নম্বরটি দিয়ে ওটিপি পাঠায়ে নতুন পাসওয়ার্ড সেট করুন।
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="fp-main-title">ওটিপি কোড যাচাই করুন</h1>
              <p className="fp-main-subtitle">
                <strong>{mobile}</strong> নম্বরে পাঠানো ৬ সংখ্যার কোডটি নিচে লিখুন।
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="fp-main-title">নতুন পাসওয়ার্ড সেট করুন</h1>
              <p className="fp-main-subtitle">
                আপনার অ্যাকাউন্টের সুরক্ষায় একটি শক্তিশালী নতুন পাসওয়ার্ড লিখুন।
              </p>
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="fp-main-title">পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!</h1>
              <p className="fp-main-subtitle">
                কয়েক সেকেন্ডের মধ্যে লগইন পেজে নিয়ে যাওয়া হচ্ছে...
              </p>
            </>
          )}

          {/* Status / Alert Message */}
          {statusMsg.text && (
            <div className={`fp-alert-box ${statusMsg.type === 'success' ? 'fp-alert-success' : 'fp-alert-danger'}`}>
              {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* ===== STEP 1 FORM: MOBILE NUMBER ===== */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="fp-form">
              <div className="fp-field-group">
                <label className="fp-field-label">মোবাইল নম্বর</label>
                <div className="fp-input-wrapper fp-input-wrapper-inline-btn">
                  <Smartphone size={18} className="fp-input-icon" />
                  <input
                    type="tel"
                    className="fp-text-input"
                    placeholder="01XXXXXXXXX"
                    value={mobile}
                    onChange={handleMobileChange}
                    autoFocus
                    maxLength={11}
                  />
                  <button
                    type="submit"
                    disabled={loading || mobile.length !== 11}
                    className="fp-inline-otp-btn"
                    title={mobile.length !== 11 ? "১১ সংখ্যার মোবাইল নম্বর দিন" : "ওটিপি পাঠান"}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={13} className="fp-spin-anim" />
                        <span>পাঠানো হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>ওটিপি পাঠান</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ===== STEP 2 FORM: OTP CODE ===== */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="fp-form">
              <div className="fp-field-group">
                <label className="fp-field-label">৬ সংখ্যার ওটিপি কোড</label>
                <div className="fp-otp-inputs-grid" onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className={`fp-otp-box ${digit ? 'fp-otp-filled' : ''}`}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    />
                  ))}
                </div>
              </div>

              {/* Resend Timer / Action */}
              <div className="fp-resend-row">
                {timer > 0 ? (
                  <span className="fp-timer-text">
                    পুনরায় ওটিপি পাঠাতে অপেক্ষা করুন: <strong>{formatCountdown(timer)}</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="fp-resend-btn"
                  >
                    আবার ওটিপি পাঠান
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className="fp-submit-btn"
              >
                {loading ? (
                  <>
                    <RefreshCw size={17} className="fp-spin-anim" />
                    <span>যাচাই হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Check size={18} strokeWidth={2.4} />
                    <span>ওটিপি যাচাই করুন</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              <div className="fp-change-number-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setStatusMsg({ type: '', text: '' })
                  }}
                  className="fp-change-number-btn"
                >
                  <ArrowLeft size={14} /> নম্বর পরিবর্তন করুন
                </button>
              </div>
            </form>
          )}

          {/* ===== STEP 3 FORM: NEW PASSWORD ===== */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="fp-form">
              <div className="fp-field-group">
                <label className="fp-field-label">নতুন পাসওয়ার্ড</label>
                <div className="fp-input-wrapper">
                  <Lock size={18} className="fp-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="fp-text-input"
                    placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="fp-eye-btn"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="fp-field-group">
                <label className="fp-field-label">পাসওয়ার্ড নিশ্চিত করুন</label>
                <div className="fp-input-wrapper">
                  <Lock size={18} className="fp-input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="fp-text-input"
                    placeholder="একই পাসওয়ার্ড আবার লিখুন"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="fp-eye-btn"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="fp-submit-btn"
              >
                {loading ? (
                  <>
                    <RefreshCw size={17} className="fp-spin-anim" />
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Lock size={17} />
                    <span>পাসওয়ার্ড সেট করুন</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ===== STEP 4: SUCCESS ===== */}
          {step === 4 && (
            <div className="fp-success-state">
              <div className="fp-success-icon-wrap">
                <CheckCircle2 size={54} color="#00B875" />
              </div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="fp-submit-btn"
                style={{ marginTop: 20 }}
              >
                <span>এখনই লগইন করুন</span>
                <ArrowRight size={17} />
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="fp-card-divider" />

          {/* Bottom Links */}
          <div className="fp-bottom-links-box">
            <Link to="/login" className="fp-back-login-link">
              <ArrowLeft size={16} />
              <span>পাসওয়ার্ড মনে পড়েছে? <strong>লগইন করুন</strong></span>
            </Link>

            <a href="tel:09613868438" className="fp-helpline-link">
              <Headset size={16} />
              <span>সহায়তা প্রয়োজন? ফোন করুন: <strong>09613868438</strong></span>
            </a>
          </div>

        </div>

      </div>

      {/* ===== CSS STYLES ===== */}
      <style>{`
        .fp-page-container {
          min-height: calc(100vh - 58px);
          width: 100%;
          background: #F0FDF4;
          background: linear-gradient(180deg, #F0FDF4 0%, #E6F8EE 50%, #F0FDF4 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 24px 16px 90px 16px;
          box-sizing: border-box;
          font-family: 'Inter', 'Hind Siliguri', system-ui, -apple-system, sans-serif;
        }

        .fp-content-wrapper {
          width: 100%;
          max-width: 460px;
        }

        /* Main Card */
        .fp-main-card {
          background: #FFFFFF;
          border-radius: 24px;
          padding: 24px 20px;
          box-shadow: 0 10px 30px rgba(0, 184, 117, 0.08), 0 2px 12px rgba(15, 23, 42, 0.04);
          border: 1px solid rgba(226, 232, 240, 0.85);
          box-sizing: border-box;
        }


        /* Illustration */
        .fp-illustration-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 16px;
        }

        .fp-illustration-img {
          width: 100%;
          max-width: 290px;
          height: auto;
          max-height: 210px;
          object-fit: contain;
          display: block;
        }

        /* Titles */
        .fp-main-title {
          font-size: 20px;
          font-weight: 800;
          color: #0F2942;
          text-align: center;
          margin: 0 0 8px 0;
          line-height: 1.35;
          letter-spacing: -0.3px;
        }

        .fp-main-subtitle {
          font-size: 13.5px;
          color: #475569;
          text-align: center;
          margin: 0 0 22px 0;
          line-height: 1.55;
          font-weight: 500;
        }

        /* Alert Box */
        .fp-alert-box {
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 12.5px;
          font-weight: 600;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 8px;
          line-height: 1.4;
        }

        .fp-alert-success {
          background: #DCFCE7;
          color: #15803D;
          border: 1px solid #BBF7D0;
        }

        .fp-alert-danger {
          background: #FEE2E2;
          color: #B91C1C;
          border: 1px solid #FECACA;
        }

        /* Form */
        .fp-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .fp-field-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .fp-field-label {
          font-size: 13px;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .fp-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          background: #F8FAFC;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          padding: 0 14px;
          height: 48px;
          transition: all 0.2s;
        }

        .fp-input-wrapper:focus-within {
          border-color: #00B875;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(0, 184, 117, 0.15);
        }

        .fp-input-wrapper-inline-btn {
          height: 52px;
          padding-left: 14px;
          padding-right: 6px;
        }

        .fp-inline-otp-btn {
          height: 40px;
          padding: 0 14px;
          border-radius: 9px;
          background: linear-gradient(135deg, #00B875 0%, #059669 100%);
          color: #FFFFFF;
          border: none;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0, 184, 117, 0.25);
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .fp-inline-otp-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 184, 117, 0.35);
        }

        .fp-inline-otp-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }

        .fp-input-icon {
          color: #64748B;
          margin-right: 10px;
          flex-shrink: 0;
        }

        .fp-text-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 14.5px;
          color: #0F172A;
          outline: none;
          height: 100%;
          font-weight: 600;
        }

        .fp-text-input::placeholder {
          color: #94A3B8;
          font-weight: 500;
        }

        .fp-eye-btn {
          background: transparent;
          border: none;
          color: #64748B;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
        }

        /* Submit Button */
        .fp-submit-btn {
          width: 100%;
          height: 48px;
          background: linear-gradient(135deg, #00B875 0%, #059669 100%);
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          box-shadow: 0 4px 14px rgba(0, 184, 117, 0.28);
          transition: all 0.2s;
        }

        .fp-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(0, 184, 117, 0.35);
        }

        .fp-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        /* OTP Inputs Grid */
        .fp-otp-inputs-grid {
          display: flex;
          gap: 8px;
          justify-content: space-between;
        }

        .fp-otp-box {
          width: 48px;
          height: 52px;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          background: #F8FAFC;
          font-size: 20px;
          font-weight: 800;
          text-align: center;
          color: #0F172A;
          outline: none;
          transition: all 0.2s;
        }

        .fp-otp-box:focus {
          border-color: #00B875;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(0, 184, 117, 0.15);
        }

        .fp-otp-filled {
          border-color: #00B875;
          background: #F0FDF4;
        }

        .fp-resend-row {
          display: flex;
          justify-content: center;
          font-size: 12.5px;
        }

        .fp-timer-text {
          color: #64748B;
        }

        .fp-resend-btn {
          background: transparent;
          border: none;
          color: #00B875;
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
        }

        .fp-change-number-wrap {
          display: flex;
          justify-content: center;
          margin-top: 4px;
        }

        .fp-change-number-btn {
          background: transparent;
          border: none;
          color: #64748B;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .fp-change-number-btn:hover {
          color: #0F172A;
        }

        /* Divider & Bottom Links */
        .fp-card-divider {
          height: 1px;
          background: #E2E8F0;
          margin: 22px 0 16px 0;
        }

        .fp-bottom-links-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          text-align: center;
        }

        .fp-back-login-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #475569;
          font-size: 13px;
          text-decoration: none;
          transition: color 0.15s;
        }

        .fp-back-login-link strong {
          color: #00B875;
        }

        .fp-back-login-link:hover {
          color: #0F172A;
        }

        .fp-helpline-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #475569;
          font-size: 12px;
          text-decoration: none;
          transition: color 0.15s;
        }

        .fp-helpline-link strong {
          color: #00875A;
        }

        .fp-helpline-link:hover {
          color: #00875A;
          text-decoration: underline;
        }

        .fp-success-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 0;
        }

        .fp-spin-anim {
          animation: fpSpin 0.8s linear infinite;
        }

        @keyframes fpSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 991px) {
          .fp-page-container {
            margin-top: 59px !important;
            min-height: calc(100vh - 59px) !important;
            padding: 20px 14px 85px 14px !important;
          }
        }

        @media (max-width: 480px) {
          .fp-page-container {
            margin-top: 58px !important;
            padding: 16px 12px 85px 12px !important;
          }

          .fp-main-card {
            padding: 20px 14px;
            border-radius: 20px;
          }

          .fp-main-title {
            font-size: 18.5px;
          }

          .fp-main-subtitle {
            font-size: 13px;
            margin-bottom: 18px;
          }

          .fp-otp-box {
            width: 42px;
            height: 48px;
            font-size: 18px;
          }

          .fp-inline-otp-btn {
            padding: 0 10px;
            font-size: 12px;
            gap: 4px;
            height: 38px;
          }
        }
      `}</style>
    </div>
  )
}

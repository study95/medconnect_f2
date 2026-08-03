// RegisterPage.jsx — Unified Registration: type select + OTP on split-card layout
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendOtp, verifyOtp } from '../api/authApi'
import '../../styles/auth.css'

const DEFAULT_MOBILE = '01747465444'
const DEFAULT_OTP = '123456'

const TYPES = [
  {
    key: 'patient',
    label: 'Patient',
    labelBn: 'রোগী',
    icon: '👤',
    color: '#00A88C',
    gradient: 'linear-gradient(135deg, #00A88C, #00C9A7)',
    features: ['Book appointments online', 'Download prescriptions', 'Manage health records', 'Track your health journey'],
    desc: 'Join as a patient to book appointments and manage your complete health journey.',
  },
  {
    key: 'doctor',
    label: 'Doctor',
    labelBn: 'ডাক্তার',
    icon: '👨‍⚕️',
    color: '#4F46E5',
    gradient: 'linear-gradient(135deg, #4F46E5, #6366F1)',
    features: ['Manage your chambers', 'Create digital prescriptions', 'View patient history', 'Telemedicine support'],
    desc: 'Register as a doctor to manage appointments, prescriptions and connect with patients.',
  },
  {
    key: 'hospital',
    label: 'Hospital',
    labelBn: 'হাসপাতাল',
    icon: '🏥',
    color: '#0284c7',
    gradient: 'linear-gradient(135deg, #0284c7, #38bdf8)',
    features: ['Manage doctors & facilities', 'Handle patient admissions', 'Operational analytics', 'Staff & resource management'],
    desc: 'Register your hospital or clinic to manage facilities, doctors and operations.',
  },
]

export default function RegisterPage() {
  const navigate = useNavigate()

  // step: 'type' | 'mobile' | 'otp' | 'success'
  const [step, setStep]           = useState('type')
  const [selectedType, setSelectedType] = useState(null)
  const [mobile, setMobile]       = useState('')
  const [otp, setOtp]             = useState(['', '', '', '', '', ''])
  const [mobileError, setMobileError] = useState('')
  const [otpError, setOtpError]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [timer, setTimer]         = useState(0)
  const otpRefs = useRef([])

  const typeObj = TYPES.find(t => t.key === selectedType) || TYPES[0]

  useEffect(() => {
    if (timer <= 0) return
    const interval = setInterval(() => setTimer(t => t - 1), 1000)
    return () => clearInterval(interval)
  }, [timer])

  useEffect(() => {
    if (step === 'otp' && otpRefs.current[0]) {
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    }
  }, [step])

  const handleSelectType = (typeKey) => {
    setSelectedType(typeKey)
    setStep('mobile')
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    const trimmed = mobile.trim()
    const VALID_PREFIXES = ['017', '013', '019', '016', '018', '015', '014']
    setMobileError('')

    if (!trimmed) { setMobileError('Please enter your mobile number'); return }
    if (trimmed.length !== 11) { setMobileError('Mobile number must be exactly 11 digits'); return }
    if (!VALID_PREFIXES.some(p => trimmed.startsWith(p))) { setMobileError('Invalid Bangladeshi mobile operator prefix'); return }

    setLoading(true)
    try {
      await sendOtp({ mobile: trimmed, type: 'registration' })
      setStep('otp')
      setTimer(60)
    } catch (err) {
      if (err.response?.status === 400 || err.response?.status === 409) {
        setMobileError(err.response.data.message || 'This mobile number is already registered.')
      } else {
        setStep('otp')
        setTimer(60)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1)
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1].focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').trim()
    if (/^\d{6}$/.test(pasted)) {
      setOtp(pasted.split(''))
      otpRefs.current[5]?.focus()
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setOtpError('')
    const otpString = otp.join('')
    if (otpString.length !== 6) { setOtpError('Please enter the complete 6-digit OTP'); return }

    setLoading(true)
    try {
      await verifyOtp({ mobile, otp: otpString })
      setStep('success')
    } catch {
      if (otpString === DEFAULT_OTP) {
        setStep('success')
      } else {
        setOtpError('Invalid OTP. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (timer > 0) return
    setOtp(['', '', '', '', '', ''])
    setOtpError('')
    try {
      await sendOtp({ mobile })
      setTimer(60)
    } catch {
      setTimer(60)
    }
  }

  const handleCompleteProfile = () => {
    navigate(`/register/${selectedType}`, { state: { verified: true, mobile } })
  }

  const tc = typeObj.color
  const tg = typeObj.gradient

  // ─── LEFT PANEL CONTENT ──────────────────────────────────────────────
  const renderLeftPanel = () => (
    <div className="auth-info-panel" style={{ background: tg, transition: 'background 0.4s ease' }}>
      <div className="auth-info-content">
        <div className="auth-info-icon" style={{ background: 'rgba(255,255,255,0.2)', fontSize: 32 }}>
          {typeObj.icon}
        </div>
        <h2 className="auth-info-title" style={{ fontSize: 26 }}>
          {typeObj.label}<br /><span style={{ fontWeight: 500, opacity: 0.85 }}>Registration</span>
        </h2>
        <p className="auth-info-desc">{typeObj.desc}</p>
        <ul className="auth-info-features">
          {typeObj.features.map((f, i) => <li key={i}>{f}</li>)}
        </ul>

        {/* Type Switch buttons */}
        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Switch Account Type
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => { setSelectedType(t.key); setStep('mobile'); setMobileError(''); setOtp(['','','','','','']); setOtpError('') }}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  border: '2px solid rgba(255,255,255,0.4)',
                  background: selectedType === t.key ? 'rgba(255,255,255,0.25)' : 'transparent',
                  color: 'white', cursor: 'pointer', transition: 'all 0.2s ease',
                  backdropFilter: 'blur(4px)'
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // ─── SUCCESS SCREEN ───────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="auth-page-wrapper">
        <div className="auth-split-card" style={{ maxWidth: 860 }}>
          {renderLeftPanel()}
          <div className="auth-form-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '48px 40px' }}>
            {/* Success Animation */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00A88C, #00C9A7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 12px 40px rgba(0,168,140,0.3)',
              animation: 'successPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <h3 style={{ fontSize: 24, fontWeight: 900, color: '#1A1D2E', marginBottom: 8 }}>
              Mobile Verified! 🎉
            </h3>
            <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
              Your mobile number <strong style={{ color: tc }}>{mobile}</strong> has been successfully verified.
            </p>
            <p style={{ color: '#64748B', fontSize: 14, marginBottom: 32 }}>
              What would you like to do next?
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
              <button
                onClick={handleCompleteProfile}
                style={{
                  padding: '14px 24px', borderRadius: 12, border: 'none',
                  background: tg, color: 'white', fontWeight: 800, fontSize: 15,
                  cursor: 'pointer', transition: 'all 0.3s ease',
                  boxShadow: `0 8px 24px ${tc}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                {typeObj.icon} Complete {typeObj.label} Profile →
              </button>

              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '14px 24px', borderRadius: 12,
                  border: `2px solid #E5EAF0`,
                  background: 'white', color: '#374151', fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', transition: 'all 0.3s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                🏠 View Home Page
              </button>
            </div>

            <p style={{ marginTop: 24, fontSize: 12, color: '#94A3B8' }}>
              You can complete your profile later from your account settings.
            </p>
          </div>
        </div>

        <style>{`
          @keyframes successPop {
            0% { transform: scale(0); opacity: 0; }
            70% { transform: scale(1.15); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  // ─── TYPE SELECTION SCREEN (full width) ─────────────────────────────
  if (step === 'type') {
    return (
      <div className="auth-page-wrapper">
        <button className="auth-back-btn" onClick={() => navigate(-1)}>← Back</button>

        <div style={{ width: '100%', maxWidth: 900, textAlign: 'center' }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{
              width: 60, height: 60, background: 'linear-gradient(135deg, #00A88C, #00C9A7)',
              borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', boxShadow: '0 8px 28px rgba(0,168,140,0.25)', fontSize: 28
            }}>
              ✨
            </div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: '#1A1D2E', marginBottom: 10, letterSpacing: '-0.5px' }}>
              Create Your Account
            </h2>
            <p style={{ fontSize: 15, color: '#6B7280', maxWidth: 440, margin: '0 auto' }}>
              Select your account type to begin your registration journey
            </p>
          </div>

          {/* Type Cards */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40 }}>
            {TYPES.map(t => (
              <div
                key={t.key}
                onClick={() => handleSelectType(t.key)}
                style={{
                  flex: '1', minWidth: 220, maxWidth: 280,
                  background: 'white', borderRadius: 20, border: '2px solid #E5EAF0',
                  padding: '32px 24px', cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.35s cubic-bezier(0.165, 0.84, 0.44, 1)',
                  position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = t.color
                  e.currentTarget.style.transform = 'translateY(-6px)'
                  e.currentTarget.style.boxShadow = `0 20px 50px ${t.color}20`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#E5EAF0'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: 18, background: t.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', fontSize: 28,
                  boxShadow: `0 8px 24px ${t.color}30`
                }}>
                  {t.icon}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1A1D2E', marginBottom: 6 }}>{t.label}</h3>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 20 }}>{t.desc}</p>
                <button style={{
                  width: '100%', padding: '11px 0', borderRadius: 10, border: 'none',
                  background: t.gradient, color: 'white', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer'
                }}>
                  Register as {t.label} →
                </button>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 14, color: '#6B7280' }}>
            Already have an account?{' '}
            <span onClick={() => navigate('/login')} style={{ color: '#00A88C', fontWeight: 700, cursor: 'pointer' }}>
              Login here
            </span>
          </p>
        </div>
      </div>
    )
  }

  // ─── SPLIT CARD: mobile / otp steps ─────────────────────────────────
  const stepNum = step === 'mobile' ? 1 : 2

  return (
    <div className="auth-page-wrapper">
      <button className="auth-back-btn" onClick={() => step === 'otp' ? setStep('mobile') : setStep('type')}>
        ← Back
      </button>

      <div className="auth-split-card" style={{ maxWidth: 900 }}>
        {renderLeftPanel()}

        <div className="auth-form-panel">
          <div className="auth-form-header">
            <h3 style={{ color: tc }}>
              {step === 'mobile' ? `Verify Mobile — ${typeObj.label}` : 'Enter OTP Code'}
            </h3>
            <p>
              {step === 'mobile'
                ? 'Enter your mobile number to receive a verification code'
                : `We sent a 6-digit code to ${mobile}`}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="auth-step-indicator">
            <div className={`auth-step-dot ${stepNum >= 1 ? 'active' : ''}`} style={{ background: stepNum >= 1 ? tc : undefined }} />
            <div className={`auth-step-dot ${stepNum >= 2 ? 'active' : ''}`} style={{ background: stepNum >= 2 ? tc : undefined }} />
          </div>

          {/* ── Step 1: Mobile ── */}
          {step === 'mobile' && (
            <form onSubmit={handleSendOtp}>
              <div className="auth-input-group">
                <label>Mobile Number</label>
                <div className="phone-input-group">
                  <span className="phone-prefix" style={{ background: `${tc}12`, color: tc }}>🇧🇩 +88</span>
                  <input
                    type="tel"
                    className="auth-input"
                    placeholder={DEFAULT_MOBILE}
                    value={mobile}
                    onChange={e => {
                      const v = e.target.value
                      if (v === '' || /^\d+$/.test(v)) { setMobile(v); setMobileError('') }
                    }}
                    maxLength={11}
                    autoFocus
                  />
                </div>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 6, marginBottom: 0 }}>
                  Demo: use {DEFAULT_MOBILE}
                </p>
                {mobileError && <div className="auth-field-error">{mobileError}</div>}
              </div>

              <button
                type="submit"
                className="auth-btn-primary"
                style={{ background: tg }}
                disabled={loading}
              >
                {loading
                  ? <><span className="spinner-border spinner-border-sm" /> Sending OTP...</>
                  : 'Send OTP →'}
              </button>
            </form>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp}>
              <div className="auth-input-group" style={{ marginBottom: 8 }}>
                <label style={{ textAlign: 'center', display: 'block' }}>Enter 6-digit OTP</label>
              </div>

              <div className="otp-container" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => (otpRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={`otp-input ${digit ? 'filled' : ''}`}
                    style={{ '--otp-color': tc }}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                  />
                ))}
              </div>

              <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginBottom: 8 }}>
                Demo OTP: <strong>{DEFAULT_OTP}</strong>
              </p>

              {otpError && (
                <div className="auth-field-error" style={{ textAlign: 'center', marginBottom: 16 }}>
                  {otpError}
                </div>
              )}

              <button
                type="submit"
                className="auth-btn-primary"
                style={{ background: tg }}
                disabled={loading}
              >
                {loading
                  ? <><span className="spinner-border spinner-border-sm" /> Verifying...</>
                  : 'Verify & Continue →'}
              </button>

              <div className="otp-timer" style={{ marginTop: 16, textAlign: 'center' }}>
                {timer > 0 ? (
                  <span>Resend OTP in <strong style={{ color: tc }}>{timer}s</strong></span>
                ) : (
                  <button type="button" className="otp-resend" style={{ color: tc }} onClick={handleResend}>
                    Resend OTP
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Footer */}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
              Already have an account?{' '}
              <span onClick={() => navigate('/login')} style={{ color: tc, fontWeight: 700, cursor: 'pointer' }}>
                Login here
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

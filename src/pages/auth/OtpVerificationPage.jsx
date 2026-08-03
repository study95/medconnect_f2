// OtpVerificationPage.jsx — Mobile number verification with 6-digit OTP
// Hardcoded default: mobile 01747465444, otp 123456
import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { sendOtp, verifyOtp } from '../../api/authApi'
import { toast } from 'react-toastify'
import '../../styles/auth.css'

const DEFAULT_MOBILE = '01747465444'
const DEFAULT_OTP = '123456'

export default function OtpVerificationPage() {
  const navigate = useNavigate()
  const { type } = useParams() // 'patient', 'doctor', or 'hospital'
  const [step, setStep] = useState(1) // 1=enter mobile, 2=enter OTP
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [mobileError, setMobileError] = useState('')
  const [otpError, setOtpError] = useState('')
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(0)
  const otpRefs = useRef([])

  // Countdown timer for resend
  useEffect(() => {
    if (timer <= 0) return
    const interval = setInterval(() => setTimer(t => t - 1), 1000)
    return () => clearInterval(interval)
  }, [timer])

  // Auto-focus first OTP input when step changes
  useEffect(() => {
    if (step === 2 && otpRefs.current[0]) {
      otpRefs.current[0].focus()
    }
  }, [step])

  const handleSendOtp = async (e) => {
    e.preventDefault()
    const trimmedMobile = mobile.trim()
    const VALID_PREFIXES = ['017', '013', '019', '016', '018', '015', '014']

    setMobileError('')
    if (!trimmedMobile) {
      setMobileError('Please enter your mobile number')
      return
    }

    if (trimmedMobile.length !== 11) {
      setMobileError('Mobile number must be exactly 11 digits')
      return
    }

    if (!VALID_PREFIXES.some(prefix => trimmedMobile.startsWith(prefix))) {
      setMobileError('Invalid Bangladeshi mobile operator prefix')
      return
    }

    setLoading(true)
    try {
      // Pass 'registration' so backend knows to check for existing users
      await sendOtp({ mobile: trimmedMobile, type: 'registration' })
      toast.success('OTP sent successfully!')
      setStep(2)
      setTimer(60)
    } catch (err) {
      if (err.response?.status === 400 || err.response?.status === 404) {
        setMobileError(err.response.data.message)
      } else {
        // Fallback: still allow proceeding for demo purposes
        console.warn('OTP API error or not available, using demo mode')
        toast.success('OTP sent! (Demo: use 123456)')
        setStep(2)
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

    // Auto-focus next input
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
    const pastedData = e.clipboardData.getData('text').trim()
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('')
      setOtp(digits)
      otpRefs.current[5]?.focus()
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setOtpError('')
    const otpString = otp.join('')
    if (otpString.length !== 6) {
      setOtpError('Please enter the 6-digit OTP')
      return
    }

    setLoading(true)
    try {
      await verifyOtp({ mobile, otp: otpString })
      toast.success('Mobile verified successfully!')
      navigate(`/register/${type}`, { state: { verified: true, mobile } })
    } catch (err) {
      // Demo fallback: check against hardcoded OTP
      if (otpString === DEFAULT_OTP) {
        toast.success('Mobile verified successfully!')
        navigate(`/register/${type}`, { state: { verified: true, mobile } })
      } else {
        setOtpError('Invalid OTP. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (timer > 0) return
    try {
      await sendOtp({ mobile })
      toast.success('OTP resent!')
      setTimer(60)
    } catch {
      toast.success('OTP resent! (Demo: use 123456)')
      setTimer(60)
    }
  }

  const isDoctor = type === 'doctor'
  const isHospital = type === 'hospital'

  const getThemeColor = () => {
    if (isDoctor) return '#4F46E5'
    if (isHospital) return '#0284c7'
    return '#00A88C'
  }

  const getGradient = () => {
    if (isDoctor) return 'linear-gradient(135deg, #4F46E5, #6366F1)'
    if (isHospital) return 'linear-gradient(135deg, #0284c7, #38bdf8)'
    return 'linear-gradient(135deg, #00A88C, #00C9A7)'
  }

  const getIcon = () => {
    if (isHospital) return '🏥'
    return '📱'
  }

  return (
    <div className="auth-page-wrapper" style={{ '--theme-color': getThemeColor() }}>
      <button className="auth-back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="otp-verification-card" style={{ maxWidth: 440, width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 32, padding: '48px 40px',
          boxShadow: '0 25px 70px rgba(0,0,0,0.07)',
          border: '1px solid rgba(255, 255, 255, 0.5)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 56, height: 56,
              background: isDoctor
                ? getGradient()
                : getGradient(),
              borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: 28
            }}>
              {getIcon()}
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#1A1D2E', marginBottom: 6 }}>
              {step === 1 ? 'Verify Mobile Number' : 'Enter OTP'}
            </h3>
            <p style={{ fontSize: 13, color: '#6B7280' }}>
              {step === 1
                ? `Enter your mobile number to register as a ${type}`
                : `We sent a 6-digit code to ${mobile}`
              }
            </p>

            {/* Step Indicator */}
            <div className="auth-step-indicator" style={{ justifyContent: 'center', marginTop: 16 }}>
              <div className={`auth-step-dot ${step >= 1 ? 'active' : ''}`} style={{ background: step >= 1 ? getThemeColor() : undefined }} />
              <div className={`auth-step-dot ${step >= 2 ? 'active' : ''}`} style={{ background: step >= 2 ? getThemeColor() : undefined }} />
            </div>
          </div>

          {/* Step 1: Mobile Number */}
          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              <div className="auth-input-group">
                <label>Mobile Number</label>
                <div className="phone-input-group">
                  <span className="phone-prefix">🇧🇩 +88</span>
                  <input
                    type="tel"
                    className="auth-input"
                    placeholder={DEFAULT_MOBILE}
                    value={mobile}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '' || /^\d+$/.test(val)) setMobile(val)
                    }}
                    maxLength={11}
                    required
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
                className={`auth-btn-primary ${isDoctor ? 'doctor-theme' : ''}`}
                style={{ background: !isDoctor ? getThemeColor() : undefined }}
                disabled={loading}
              >
                {loading ? (
                  <><span className="spinner-border spinner-border-sm" /> Sending OTP...</>
                ) : (
                  'Send OTP →'
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Input */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <div className="otp-container" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={`otp-input ${digit ? 'filled' : ''}`}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  />
                ))}
              </div>

              <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginBottom: 10 }}>
                Demo OTP: {DEFAULT_OTP}
              </p>
              
              {otpError && <div className="auth-field-error" style={{ textAlign: 'center', marginBottom: '16px' }}>{otpError}</div>}

              <button
                type="submit"
                className={`auth-btn-primary ${isDoctor ? 'doctor-theme' : ''}`}
                style={{ background: !isDoctor ? getThemeColor() : undefined }}
                disabled={loading}
              >
                {loading ? (
                  <><span className="spinner-border spinner-border-sm" /> Verifying...</>
                ) : (
                  'Verify & Continue →'
                )}
              </button>

              <div className="otp-timer">
                {timer > 0 ? (
                  <span>Resend OTP in <strong>{timer}s</strong></span>
                ) : (
                  <button type="button" className="otp-resend" onClick={handleResend}>
                    Resend OTP
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Footer Options */}
          <div style={{ marginTop: 32, textAlign: 'center', borderTop: '1px solid #F1F5F9', paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
              Already have an account?{' '}
              <span onClick={() => navigate('/login')} style={{ color: getThemeColor(), fontWeight: 700, cursor: 'pointer' }}>
                Login here
              </span>
            </p>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
              Need a different account?{' '}
              <span onClick={() => navigate('/register')} style={{ color: getThemeColor(), fontWeight: 700, cursor: 'pointer' }}>
                Register here
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

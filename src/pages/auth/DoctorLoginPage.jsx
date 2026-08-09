// DoctorLoginPage.jsx — Split-card doctor login
// Left: Info panel with doctor theme | Right: Step-by-step login
// Supports phone/email/BMDC number
import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { doctorCheckIdentifier } from '../../api/authApi'
import { Eye, EyeOff } from 'lucide-react'
import '../../styles/auth.css'

export default function DoctorLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginAsDoctor } = useAuth()

  const from = location.state?.from?.pathname || '/admin'

  const [step, setStep] = useState(1)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const detectInputType = (value) => {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email'
    if (/^01\d{9}$/.test(value)) return 'Phone'
    if (/^[A-Za-z0-9-]+$/.test(value) && value.length > 3) return 'BMDC'
    return 'Identifier'
  }

  const handleCheckIdentifier = async (e) => {
    e.preventDefault()
    if (!identifier.trim()) return setError('Please enter your phone, email, or BMDC number')

    setLoading(true)
    setError('')
    try {
      await doctorCheckIdentifier({ identifier, role: 'doctor' })
      setStep(2)
    } catch (err) {
      if (err.response?.status === 404) {
        setError(err.response?.data?.message || 'আপনার ইমেইল/মোবাইল নম্বরটি নিবন্ধিত নয়, নিবন্ধন করুন।')
      } else {
        setError('Something went wrong checking the identifier.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!password) return setError('Please enter your password')

    setLoading(true)
    setError('')
    const result = await loginAsDoctor(identifier, password)
    setLoading(false)

    if (result.success) {
      
      navigate(from, { replace: true })
    } else {
      setError(result.message || 'Invalid credentials. Please try again.')
    }
  }

  return (
    <div className="auth-page-wrapper">
      <button className="auth-back-btn" onClick={() => navigate(step === 2 ? -1 : '/login')}>
        ← Back
      </button>

      <div className="auth-split-card">
        {/* LEFT — Info Panel */}
        <div className="auth-info-panel doctor">
          <div className="auth-info-content">
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', marginBottom: 20 }}>
              <img src="/doctorBookletLogo.png" alt="Doctor Booklet Logo" style={{ height: '42px', width: 'auto', objectFit: 'contain', background: 'white', padding: '4px 10px', borderRadius: '8px' }} />
            </Link>
            <div className="auth-info-icon">👨‍⚕️</div>
            <h2 className="auth-info-title">
              Doctor<br />Portal
            </h2>
            <p className="auth-info-desc">
              Manage your professional practice — handle appointments, 
              create prescriptions, and connect with your patients efficiently.
            </p>
            <ul className="auth-info-features">
              <li>Manage chambers & schedules</li>
              <li>Create digital prescriptions</li>
              <li>View patient history</li>
              <li>Telemedicine support</li>
            </ul>
          </div>
        </div>

        {/* RIGHT — Login Form */}
        <div className="auth-form-panel">
          <div className="auth-form-header">
            <h3>Doctor Login</h3>
            <p>{step === 1 ? 'Enter your phone, email, or BMDC number' : 'Enter your password to sign in'}</p>
          </div>

          {/* Step Indicator */}
          <div className="auth-step-indicator">
            <div className={`auth-step-dot ${step >= 1 ? 'active' : ''}`} style={{ background: step >= 1 ? '#4F46E5' : undefined }} />
            <div className={`auth-step-dot ${step >= 2 ? 'active' : ''}`} style={{ background: step >= 2 ? '#4F46E5' : undefined }} />
          </div>



          {/* Step 1: Identifier */}
          {step === 1 && (
            <form onSubmit={handleCheckIdentifier}>
              <div className="auth-input-group">
                <label>Phone / Email / BMDC Number</label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="01XXXXXXXXX, doctor@email.com, or BMDC-12345"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setError('') }}
                  autoFocus
                  required
                />
                {identifier && (
                  <span style={{ fontSize: 11, color: '#4F46E5', fontWeight: 600, marginTop: 4, display: 'block' }}>
                    Detected: {detectInputType(identifier)}
                  </span>
                )}
                {error && step === 1 && <div className="auth-field-error" style={{ marginTop: '8px' }}>{error}</div>}
              </div>
              <button type="submit" className="auth-btn-primary doctor-theme" disabled={loading}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm" /> Checking...</>
                ) : (
                  'Next →'
                )}
              </button>
            </form>
          )}

          {/* Step 2: Password */}
          {step === 2 && (
            <form onSubmit={handleLogin}>
              <div className="auth-input-group">
                <label>Signed in as</label>
                <div style={{
                  padding: '12px 16px', borderRadius: 12, background: '#EEF2FF',
                  fontWeight: 700, color: '#4338CA', fontSize: 14,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span>{identifier}</span>
                  <button type="button" onClick={() => { setStep(1); setError('') }}
                    style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    Change
                  </button>
                </div>
              </div>

              <div className="auth-input-group">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="auth-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    autoFocus
                    required
                    style={{ paddingRight: '45px' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#6B7280',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {error && step === 2 && <div className="auth-field-error" style={{ marginTop: '8px' }}>{error}</div>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Link to="/forgot-password" style={{ fontSize: 13, color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="auth-btn-primary doctor-theme" disabled={loading}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm" /> Signing in...</>
                ) : (
                  '🔐 Sign In'
                )}
              </button>
            </form>
          )}

          {/* Google Login */}
          <div className="auth-divider">OR</div>
          <button className="auth-btn-google" onClick={() => setError('Google Sign-In is not implemented yet.')}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z" fill="#4285F4"/><path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z" fill="#34A853"/><path d="M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3-2.33z" fill="#FBBC05"/><path d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.59A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          {/* Register Link */}
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#6B7280' }}>
            Don't have an account?{' '}
            <span onClick={() => navigate('/register')} style={{ color: '#4F46E5', fontWeight: 700, cursor: 'pointer' }}>
              Register
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

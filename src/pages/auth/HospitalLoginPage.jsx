// HospitalLoginPage.jsx — Split-card hospital login
// Left: Info panel with hospital theme | Right: Step-by-step login
// Supports phone/email
import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { hospitalCheckIdentifier } from '../../api/authApi'
import { Eye, EyeOff } from 'lucide-react'
import '../../styles/auth.css'

export default function HospitalLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginAsHospital } = useAuth()

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
    return 'Identifier'
  }

  const handleNext = async (e) => {
    e.preventDefault()
    if (!identifier.trim()) return setError('Please enter your phone or email')

    setLoading(true)
    setError('')
    try {
      await hospitalCheckIdentifier({ identifier, role: 'hospital' })
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
    const result = await loginAsHospital(identifier, password)
    setLoading(false)

    if (result.success) {
      
      navigate(from, { replace: true })
    } else {
      if (result.message && result.message.toLowerCase().includes('not finding')) {
          setStep(1)
      }
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
        <div className="auth-info-panel" style={{ background: 'linear-gradient(135deg, #0284c7, #38bdf8)' }}>
          <div className="auth-info-content">
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', marginBottom: 20 }}>
              <img src="/doctorBookletLogo.png" alt="Doctor Booklet Logo" style={{ height: '42px', width: 'auto', objectFit: 'contain', background: 'white', padding: '4px 10px', borderRadius: '8px' }} />
            </Link>
            <div className="auth-info-icon" style={{ background: 'rgba(255,255,255,0.2)' }}>🏥</div>
            <h2 className="auth-info-title">
              Hospital<br />Portal
            </h2>
            <p className="auth-info-desc">
              Manage hospital operations efficiently.
            </p>
            <ul className="auth-info-features">
              <li>Manage doctors & facilities</li>
              <li>Handle patient admissions</li>
              <li>Operational analytics</li>
              <li>Manage staff & resources</li>
            </ul>
          </div>
        </div>

        {/* RIGHT — Login Form */}
        <div className="auth-form-panel">
          <div className="auth-form-header">
            <h3>Hospital Login</h3>
            <p>{step === 1 ? 'Enter your phone or email' : 'Enter your password to sign in'}</p>
          </div>

          {/* Step Indicator */}
          <div className="auth-step-indicator">
            <div className={`auth-step-dot ${step >= 1 ? 'active' : ''}`} style={{ background: step >= 1 ? '#0284c7' : undefined }} />
            <div className={`auth-step-dot ${step >= 2 ? 'active' : ''}`} style={{ background: step >= 2 ? '#0284c7' : undefined }} />
          </div>



          {/* Step 1: Identifier */}
          {step === 1 && (
            <form onSubmit={handleNext}>
              <div className="auth-input-group">
                <label>Phone / Email</label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="01XXXXXXXXX or admin@hospital.com"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setError('') }}
                  autoFocus
                  required
                />
                {identifier && (
                  <span style={{ fontSize: 11, color: '#0284c7', fontWeight: 600, marginTop: 4, display: 'block' }}>
                    Detected: {detectInputType(identifier)}
                  </span>
                )}
                {error && step === 1 && <div className="auth-field-error" style={{ marginTop: '8px' }}>{error}</div>}
              </div>
              <button type="submit" className="auth-btn-primary" style={{ background: '#0284c7' }} disabled={loading}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm" /> Loading...</>
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
                  padding: '12px 16px', borderRadius: 12, background: '#f0f9ff',
                  fontWeight: 700, color: '#0284c7', fontSize: 14,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span>{identifier}</span>
                  <button type="button" onClick={() => { setStep(1); setError('') }}
                    style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
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
                <Link to="/forgot-password" style={{ fontSize: 13, color: '#0284c7', fontWeight: 600, textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="auth-btn-primary" style={{ background: '#0284c7' }} disabled={loading}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm" /> Signing in...</>
                ) : (
                  '🔐 Sign In'
                )}
              </button>
            </form>
          )}

          {/* Register Link */}
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#6B7280' }}>
            Don't have an account?{' '}
            <span onClick={() => navigate('/register')} style={{ color: '#0284c7', fontWeight: 700, cursor: 'pointer' }}>
              Register
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

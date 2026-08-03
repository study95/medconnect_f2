// PatientLoginPage.jsx — Split-card patient login
// Left: Info panel with patient image | Right: Step-by-step login form
// Step 1: Enter phone/email → verify exists
// Step 2: Enter password → sign in
import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { patientCheckIdentifier } from '../../api/authApi'
import { toast } from 'react-toastify'
import { Eye, EyeOff } from 'lucide-react'
import '../../styles/auth.css'

export default function PatientLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginAsPatient } = useAuth()

  const from = location.state?.from?.pathname || '/'

  const [step, setStep] = useState(1) // 1 = identifier, 2 = password
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Check if identifier exists
  const handleCheckIdentifier = async (e) => {
    e.preventDefault()
    if (!identifier.trim()) return setError('Please enter your phone number or email')

    setLoading(true)
    setError('')
    try {
      await patientCheckIdentifier({ identifier, role: 'patient' })
      setStep(2)
    } catch (err) {
      if (err.response?.status === 404) {
        setError(err.response?.data?.message || 'Not finding this user. Please register first.')
      } else {
        setError('Something went wrong checking the identifier.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Submit password
  const handleLogin = async (e) => {
    e.preventDefault()
    if (!password) return setError('Please enter your password')

    setLoading(true)
    setError('')
    const result = await loginAsPatient(identifier, password)
    setLoading(false)

    if (result.success) {
      toast.success('Logged in successfully!')
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
        <div className="auth-info-panel patient">
          <div className="auth-info-content">
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 20 }}>
              <img src="/doctorBookletLogo.png" alt="Doctor Booklet Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain', background: 'white', padding: '3px 8px', borderRadius: '8px' }} />
              <span style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>Doctor <span style={{ color: '#00D4AF' }}>Booklet</span></span>
            </Link>
            <div className="auth-info-icon">👤</div>
            <h2 className="auth-info-title">
              Patient<br />Portal
            </h2>
            <p className="auth-info-desc">
              Access your complete health journey — view appointments, 
              download prescriptions, and stay connected with your doctors.
            </p>
            <ul className="auth-info-features">
              <li>View appointment history</li>
              <li>Download prescriptions</li>
              <li>Update health records</li>
              <li>Book online appointments</li>
            </ul>
          </div>
        </div>

        {/* RIGHT — Login Form */}
        <div className="auth-form-panel">
          <div className="auth-form-header">
            <h3>Patient Login</h3>
            <p>{step === 1 ? 'Enter your phone number or email to continue' : 'Enter your password to sign in'}</p>
          </div>

          {/* Step Indicator */}
          <div className="auth-step-indicator">
            <div className={`auth-step-dot ${step >= 1 ? 'active' : ''}`} />
            <div className={`auth-step-dot ${step >= 2 ? 'active' : ''}`} />
          </div>

          {/* {error && <div className="auth-error">⚠️ {error}</div>} */}

          {/* Step 1: Identifier */}
          {step === 1 && (
            <form onSubmit={handleCheckIdentifier}>
              <div className="auth-input-group">
                <label>Phone Number or Email</label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="01XXXXXXXXX or you@example.com"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setError('') }}
                  autoFocus
                  required
                />
                {error && step === 1 && <div className="auth-field-error" style={{ marginTop: '8px' }}>{error}</div>}
              </div>
              <button type="submit" className="auth-btn-primary" disabled={loading}>
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
                  padding: '12px 16px', borderRadius: 12, background: '#E6F6F4',
                  fontWeight: 700, color: '#065F46', fontSize: 14,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span>{identifier}</span>
                  <button type="button" onClick={() => { setStep(1); setError('') }}
                    style={{ background: 'none', border: 'none', color: '#00A88C', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
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
                {error && step === 2 && <div className="auth-field-error">{error}</div>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Link to="/forgot-password" style={{ fontSize: 13, color: '#00A88C', fontWeight: 600, textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="auth-btn-primary" disabled={loading}>
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
          <button className="auth-btn-google" onClick={() => toast('Google login coming soon!')}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z" fill="#4285F4"/><path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z" fill="#34A853"/><path d="M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3-2.33z" fill="#FBBC05"/><path d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.59A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          {/* Register Link */}
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#6B7280' }}>
            Don't have an account?{' '}
            <span onClick={() => navigate('/register')} style={{ color: '#00A88C', fontWeight: 700, cursor: 'pointer' }}>
              Register
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

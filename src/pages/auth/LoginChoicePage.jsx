// LoginChoicePage.jsx — Premium card selection: Patient vs Doctor login
import { Link, useNavigate } from 'react-router-dom'
import '../../styles/auth.css'

export default function LoginChoicePage() {
  const navigate = useNavigate()

  return (
    <div className="auth-page-wrapper">
      <button className="auth-back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div style={{ textAlign: 'center', width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <Link to="/" style={{ display: 'inline-block', marginBottom: 20 }}>
            <img 
              src="/doctorBookletLogo.png" 
              alt="Doctor Booklet Logo" 
              style={{ height: '64px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 4px 14px rgba(0,168,140,0.25))' }} 
            />
          </Link>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#1A1D2E', marginBottom: 8, letterSpacing: '-0.5px' }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: 15, color: '#6B7280', maxWidth: 400, margin: '0 auto' }}>
            Choose your account type to sign in
          </p>
        </div>

        {/* Choice Cards */}
        <div className="auth-choice-container">
          {/* Patient Login */}
          <div className="auth-choice-card patient" onClick={() => navigate('/login/patient')}>
            <div className="auth-choice-icon">
              👤
            </div>
            <h3 className="auth-choice-title">Patient Login</h3>
            <p className="auth-choice-desc">
              Access your health records, appointments, and prescriptions
            </p>
            <button className="auth-choice-btn" type="button">
              Login as Patient →
            </button>
          </div>

          {/* Doctor Login */}
          <div className="auth-choice-card doctor" onClick={() => navigate('/login/doctor')}>
            <div className="auth-choice-icon">
              👨‍⚕️
            </div>
            <h3 className="auth-choice-title">Doctor Login</h3>
            <p className="auth-choice-desc">
              Access your practice dashboard, patients, and chamber management
            </p>
            <button className="auth-choice-btn" type="button">
              Login as Doctor →
            </button>
          </div>

          {/* Hospital Login */}
          <div className="auth-choice-card hospital" onClick={() => navigate('/login/hospital')}>
            <div className="auth-choice-icon">
              🏥
            </div>
            <h3 className="auth-choice-title">Hospital Login</h3>
            <p className="auth-choice-desc">
              Manage hospital operations, doctors, and patient admissions
            </p>
            <button className="auth-choice-btn" type="button">
              Login as Hospital →
            </button>
          </div>
        </div>

        {/* Don't have an account */}
        <p style={{ marginTop: 40, fontSize: 14, color: '#6B7280' }}>
          Don't have an account?{' '}
          <span
            onClick={() => navigate('/register')}
            style={{ color: '#00A88C', fontWeight: 700, cursor: 'pointer' }}
          >
            Register here
          </span>
        </p>
      </div>
    </div>
  )
}

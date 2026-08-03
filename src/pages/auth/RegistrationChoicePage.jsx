// RegistrationChoicePage.jsx — Premium card selection: Patient vs Doctor registration
import { Link, useNavigate } from 'react-router-dom'
import '../../styles/auth.css'

export default function RegistrationChoicePage() {
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
            Join Doctor <span style={{ color: '#00A88C' }}>Booklet</span>
          </h2>
          <p style={{ fontSize: 15, color: '#6B7280', maxWidth: 400, margin: '0 auto' }}>
            Choose your account type to get started with your registration
          </p>
        </div>

        {/* Choice Cards */}
        <div className="auth-choice-container">
          {/* Patient Card */}
          <div className="auth-choice-card patient" onClick={() => navigate('/register/patient/verify')}>
            <div className="auth-choice-icon">
              👤
            </div>
            <h3 className="auth-choice-title">Patient</h3>
            <p className="auth-choice-desc">
              Book appointments, view prescriptions, and manage your health records
            </p>
            <button className="auth-choice-btn" type="button">
              Register as Patient →
            </button>
          </div>

          {/* Doctor Card */}
          <div className="auth-choice-card doctor" onClick={() => navigate('/register/doctor/verify')}>
            <div className="auth-choice-icon">
              👨‍⚕️
            </div>
            <h3 className="auth-choice-title">Doctor</h3>
            <p className="auth-choice-desc">
              Manage your practice, prescriptions, chambers, and connect with patients
            </p>
            <button className="auth-choice-btn" type="button">
              Register as Doctor →
            </button>
          </div>

          {/* Hospital Card */}
          <div className="auth-choice-card hospital" onClick={() => navigate('/register/hospital/verify')}>
            <div className="auth-choice-icon">
              🏥
            </div>
            <h3 className="auth-choice-title">Hospital</h3>
            <p className="auth-choice-desc">
              Register your hospital or clinic to manage facilities and doctors
            </p>
            <button className="auth-choice-btn" type="button">
              Register as Hospital →
            </button>
          </div>
        </div>

        {/* Already have an account */}
        <p style={{ marginTop: 40, fontSize: 14, color: '#6B7280' }}>
          Already have an account?{' '}
          <span
            onClick={() => navigate('/login')}
            style={{ color: '#00A88C', fontWeight: 700, cursor: 'pointer' }}
          >
            Login here
          </span>
        </p>
      </div>
    </div>
  )
}

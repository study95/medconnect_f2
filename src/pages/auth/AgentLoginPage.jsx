import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  DollarSign, 
  CheckCircle2, 
  Headphones, 
  ArrowLeft,
  Briefcase
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useSiteSettings } from '../../utils/contentService'
import { getMediaUrl } from '../../utils/mediaUtils'
import TwoFactorLoginModal from '../../components/auth/TwoFactorLoginModal'
import '../../styles/auth-premium.css'

export default function AgentLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const site = useSiteSettings()
  const { loginAsAgent, user } = useAuth()

  const [identifier, setIdentifier] = useState(() => location.state?.identifier || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showTwoFaModal, setShowTwoFaModal] = useState(false)
  const [twoFaData, setTwoFaData] = useState(null)

  useEffect(() => {
    if (location.state?.identifier) {
      setIdentifier(location.state.identifier)
    }
  }, [location.state])

  // If already logged in as agent or admin, redirect to agent dashboard
  React.useEffect(() => {
    if (user) {
      const rawRoles = user.roles || user.role || []
      const roles = (Array.isArray(rawRoles) ? rawRoles : [rawRoles]).map(r => 
        (typeof r === 'object' && r ? r.name || r.role : String(r)).toLowerCase()
      )
      if (roles.includes('agent') || roles.includes('admin') || roles.includes('super-admin')) {
        navigate('/agent', { replace: true })
      }
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const cleanId = identifier.trim()
    if (!cleanId) {
      setError('অনুগ্রহ করে আপনার Agent Code, মোবাইল নম্বর অথবা ইমেইল দিন।')
      return
    }
    if (!password) {
      setError('পাসওয়ার্ড প্রদান করুন।')
      return
    }

    setLoading(true)
    try {
      const res = await loginAsAgent(cleanId, password)
      if (res.success) {
        toast.success(`স্বাগতম, ${res.user?.name || 'Partner'}! ফিল্ড পার্টনার ডেস্কে সফলভাবে লগইন হয়েছে।`)
        navigate('/agent', { replace: true })
      } else if (res.requires_2fa) {
        setTwoFaData({
          session_key: res.session_key,
          method: res.method || 'totp',
          masked_mobile: res.masked_mobile || '',
        })
        setShowTwoFaModal(true)
      } else {
        const msg = res.message || 'লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করে পুনরায় চেষ্টা করুন।'
        setError(msg)
      }
    } catch (err) {
      console.error('Agent login error:', err)
      const msg = err?.response?.data?.message || err?.message || 'সার্ভার সংযোগে ত্রুটি। আবার চেষ্টা করুন।'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-premium-wrapper">
      {/* Ambient background mesh */}
      <div className="auth-mesh-bg" />

      {/* Main Split Container */}
      <div className="auth-split-container fade-in-up">
        {/* ===== LEFT INFO PANEL (Healthcare Partner Branding) ===== */}
        <div className="auth-info-panel">
          <div>
            <div className="d-flex align-items-center justify-content-between mb-4">
              <Link to="/" className="info-panel-logo text-decoration-none" style={{ cursor: 'pointer' }}>
                <img 
                  src={site?.logo_url ? getMediaUrl(site.logo_url, '/doctorBookletLogo.png') : '/doctorBookletLogo.png'} 
                  alt={site?.name || 'Doctor Booklet Logo'} 
                  onError={(e) => { e.target.src = '/doctorBookletLogo.png' }}
                  style={{ height: '38px', width: 'auto', objectFit: 'contain' }} 
                />
              </Link>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                background: 'rgba(6, 95, 70, 0.08)',
                color: '#065F46',
                padding: '4px 10px',
                borderRadius: 8,
                border: '1px solid rgba(6, 95, 70, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                Field Partner
              </span>
            </div>

            <h2 className="info-panel-title">
              ডাক্তার ও হাসপাতাল<br />অনবোর্ডিং পার্টনার ডেস্ক
            </h2>
            <p className="info-panel-subtitle">
              স্বাস্থ্যসেবা প্রতিষ্ঠানগুলোকে Doctor Booklet প্ল্যাটফর্মে যুক্ত করুন এবং স্বচ্ছ ওয়ালেটে সরাসরি আকর্ষণীয় কমিশন উপভোগ করুন।
            </p>

            <ul className="info-feature-list">
              <li className="info-feature-item">
                <span className="info-feature-icon" style={{ background: '#DCFCE7', color: '#00803D' }}>
                  <DollarSign size={17} />
                </span>
                <span><strong>৳৫০০ তাৎক্ষণিক কমিশন:</strong> প্রতিটি ভেরিফায়েড প্রোভাইডারে সরাসরি ওয়ালেট ক্রেডিট।</span>
              </li>
              <li className="info-feature-item">
                <span className="info-feature-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}>
                  <ShieldCheck size={17} />
                </span>
                <span><strong>দ্বিমুখী লেজার ওয়ালেট:</strong> বিকাশ ও ব্যাংক অ্যাকাউন্টে দ্রুত পে-আউট সেটেলমেন্ট।</span>
              </li>
              <li className="info-feature-item">
                <span className="info-feature-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
                  <CheckCircle2 size={17} />
                </span>
                <span><strong>রিয়েল-টাইম ট্র্যাকিং:</strong> প্রোভাইডার অনবোর্ডিং ও BMDC যাচাইকরণের লাইভ অগ্রগতি।</span>
              </li>
            </ul>
          </div>

          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 16,
              borderTop: '1px solid #DCFCE7',
              fontSize: 12,
              color: '#065F46'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Headphones size={15} style={{ color: '#00803D' }} />
                <span>হেল্পডেস্ক: <strong>09613868438</strong></span>
              </div>
              <div className="info-trust-badge" style={{ margin: 0, padding: '2px 8px' }}>
                <Lock size={12} />
                <span>SSL সুরক্ষিত</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== RIGHT FORM PANEL ===== */}
        <div className="auth-form-panel">
          <div className="auth-form-inner-content">
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #064E3B 0%, #00B875 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 184, 117, 0.25)'
                }}>
                  <Briefcase size={22} />
                </div>
                <div>
                  <h2 style={{ fontWeight: 800, color: '#0F172A', fontSize: 21, margin: 0, letterSpacing: '-0.4px' }}>
                    এজেন্ট লগইন (Sign In)
                  </h2>
                  <p style={{ color: '#64748B', fontWeight: 500, fontSize: 13, margin: 0 }}>
                    আপনার নির্ধারিত ক্রেডেনশিয়াল দিয়ে ডেস্কে প্রবেশ করুন
                  </p>
                </div>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div
                className="fade-in-up"
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  color: '#991B1B',
                  fontSize: 13,
                  lineHeight: '1.45',
                  fontWeight: 500,
                  textAlign: 'left'
                }}
              >
                <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ flex: 1 }}>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              {/* Identifier Input */}
              <div style={{ marginBottom: 16 }}>
                <label className="auth-label-premium">
                  এজেন্ট কোড / মোবাইল নম্বর / ইমেইল <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div className="input-group-premium" style={{ position: 'relative' }}>
                  <span className="input-icon-premium" style={{ color: '#00B875' }}>
                    <UserCheck size={18} />
                  </span>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. AGT-202611-0001 বা 017XXXXXXXX"
                    className="auth-input-premium"
                    style={{ paddingLeft: 42 }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="auth-label-premium" style={{ margin: 0 }}>
                    পাসওয়ার্ড (Password) <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                </div>
                <div className="input-group-premium" style={{ position: 'relative' }}>
                  <span className="input-icon-premium" style={{ color: '#00B875' }}>
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড প্রদান করুন"
                    className="auth-input-premium"
                    style={{ paddingLeft: 42, paddingRight: 42 }}
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
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      zIndex: 3
                    }}
                    title={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-100 auth-btn-premium patient-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 700,
                  marginBottom: 16
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spinner-border spinner-border-sm" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>যাচাই করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>ফিল্ড ডেস্কে প্রবেশ করুন</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Quick Notice Card */}
            <div style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              fontSize: 12.5,
              color: '#166534',
              lineHeight: 1.5,
              marginBottom: 16
            }}>
              💡 <strong>নতুন ফিল্ড এজেন্ট?</strong> এডমিন দ্বারা আপনার অ্যাকাউন্ট অনুমোদিত হলে SMS-এর মাধ্যমে Agent Code ও পাসওয়ার্ড প্রদান করা হবে। যেকোনো প্রয়োজনে হেল্পডেস্কে যোগাযোগ করুন।
            </div>

            {/* Footer Navigation Links */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              <div>
                <span style={{ color: '#64748B' }}>সাধারণ ব্যবহারকারী হিসেবে লগইন করতে চান? </span>
                <Link to="/login" style={{ color: '#00803D', fontWeight: 700, textDecoration: 'none' }}>
                  সাধারণ লগইন পেজ &rarr;
                </Link>
              </div>
              <div>
                <Link to="/" style={{ color: '#94A3B8', fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <ArrowLeft size={13} /> মূল ওয়েবসাইটে ফিরে যান
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication Modal */}
      {showTwoFaModal && twoFaData && (
        <TwoFactorLoginModal
          isOpen={showTwoFaModal}
          onClose={() => setShowTwoFaModal(false)}
          sessionKey={twoFaData.session_key}
          method={twoFaData.method || 'totp'}
          maskedMobile={twoFaData.masked_mobile}
          onSuccess={(userData) => {
            setShowTwoFaModal(false)
            toast.success(`স্বাগতম, ${userData?.name || 'Partner'}! Google 2FA যাচাইকরণ সম্পন্ন হয়েছে।`)
            navigate('/agent', { replace: true })
          }}
        />
      )}
    </div>
  )
}

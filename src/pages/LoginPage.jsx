import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Form, Button } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import { User, ShieldCheck, Hotel, Mail, Lock, Shield, Clock, CalendarCheck, Heart, Eye, EyeOff, ArrowRight, ChevronDown, AlertTriangle, LockKeyhole, Smartphone } from 'lucide-react'
import '../styles/auth-premium.css'

function LoginPage() {
  const { login, verifyDoctor2Fa } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Derive initial role from URL path
  const pathRole = location.pathname === '/login/doctor'
    ? 'doctor'
    : location.pathname === '/login/hospital'
      ? 'hospital'
      : location.pathname === '/login/patient'
        ? 'patient'
        : ''

  const [role, setRole] = useState(pathRole)
  const [identifier, setIdentifier] = useState(location.state?.identifier || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  // Doctor 2FA verification states
  const [twoFactorState, setTwoFactorState] = useState(null)
  const [otp, setOtp] = useState('')
  const [trustDevice, setTrustDevice] = useState(true)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')

  useEffect(() => {
    if (location.state?.identifier) {
      setIdentifier(location.state.identifier)
    }
  }, [location.state])

  // Sync role when URL changes (e.g. back/forward navigation)
  useEffect(() => {
    setRole(
      location.pathname === '/login/doctor'
        ? 'doctor'
        : location.pathname === '/login/hospital'
          ? 'hospital'
          : location.pathname === '/login/patient'
            ? 'patient'
            : ''
    )
  }, [location.pathname])

  const from = location.state?.from?.pathname || '/'

  const roleConfigs = {
    patient: {
      label: 'রোগী',
      desc: 'স্বাস্থ্য ব্যবস্থাপনা ও অ্যাপয়েন্টমেন্ট নিন',
      icon: <User size={16} />,
      btnClass: 'patient-btn',
      color: '#00B875',
    },
    doctor: {
      label: 'ডাক্তার',
      desc: 'রোগী পরিচালনা ও সময়সূচি নিয়ন্ত্রণ করুন',
      icon: <ShieldCheck size={16} />,
      btnClass: 'doctor-btn',
      color: '#00B875',
    },
    hospital: {
      label: 'হাসপাতাল',
      desc: 'আপনার চিকিৎসা প্রতিষ্ঠান পরিচালনা করুন',
      icon: <Hotel size={16} />,
      btnClass: 'hospital-btn',
      color: '#00B875',
    },
  }

  const cfg = roleConfigs[role] || { label: '', icon: null, btnClass: 'patient-btn', color: '#00B875' }

  const features = {
    patient: [
      { icon: <CalendarCheck size={16} />, text: 'সহজে অ্যাপয়েন্টমেন্ট বুক করুন' },
      { icon: <Heart size={16} />, text: 'পছন্দের ডাক্তার সংরক্ষণ করুন' },
      { icon: <Shield size={16} />, text: 'নিরাপদ ও গোপনীয় স্বাস্থ্য তথ্য' },
      { icon: <Clock size={16} />, text: '২৪/৭ ডাক্তার খুঁজে নিন' },
    ],
    doctor: [
      { icon: <CalendarCheck size={16} />, text: 'অ্যাপয়েন্টমেন্ট ও সময়সূচি নিয়ন্ত্রণ' },
      { icon: <User size={16} />, text: 'রোগীর তথ্য ও রেকর্ড দেখুন' },
      { icon: <Shield size={16} />, text: 'প্রেসক্রিপশন তৈরি ও পরিচালনা' },
      { icon: <Clock size={16} />, text: 'চেম্বার ও সিডিউল ম্যানেজমেন্ট' },
    ],
    hospital: [
      { icon: <User size={16} />, text: 'ডাক্তার ও কর্মী পরিচালনা' },
      { icon: <CalendarCheck size={16} />, text: 'অ্যাপয়েন্টমেন্ট সিস্টেম নিয়ন্ত্রণ' },
      { icon: <Shield size={16} />, text: 'হাসপাতাল প্রোফাইল কাস্টমাইজ' },
      { icon: <Clock size={16} />, text: 'রিপোর্ট ও বিশ্লেষণ দেখুন' },
    ],
  }

  const handleLockedFieldClick = () => {
    if (!role) {
      setFieldErrors({ role: 'অনুগ্রহ করে প্রথমে ভূমিকা নির্বাচন করুন।' })
    }
  }

  const handlePostLoginRedirect = (userData) => {
    const rawRoles = userData?.roles || userData?.role || []
    const roles = (Array.isArray(rawRoles) ? rawRoles : [rawRoles]).map(r =>
      typeof r === 'object' && r !== null ? String(r.name || r.role || '').toLowerCase() : String(r).toLowerCase()
    )
    const isStaffUser = roles.includes('admin') ||
                        roles.includes('super-admin') ||
                        roles.includes('doctor') ||
                        roles.includes('manager') ||
                        roles.includes('hospital') ||
                        [1, 2, 3].includes(userData?.role_id)

    // Pending verification check for doctor / hospital
    if (role === 'doctor' || role === 'hospital') {
      const approvedRoles = role === 'doctor'
        ? ['doctor', 'admin', 'super-admin']
        : ['manager', 'hospital', 'admin', 'super-admin']
      const isApproved = approvedRoles.some(r => roles.includes(r))
        || (role === 'doctor' && (userData?.role_id === 1 || userData?.role_id === 2))
        || (role === 'hospital' && (userData?.role_id === 1 || userData?.role_id === 3))

      if (!isApproved) {
        navigate('/pending-verification', {
          replace: true,
          state: { type: role, name: userData?.name || '' }
        })
        return
      }
    }

    // Smart Role-Based Redirect:
    if (from && from !== '/' && !from.startsWith('/login') && !from.startsWith('/register')) {
      navigate(from, { replace: true })
    } else if (role === 'doctor' || roles.includes('doctor') || userData?.role_id === 2) {
      navigate('/doctor', { replace: true })
    } else if (role === 'hospital' || roles.includes('hospital') || roles.includes('manager') || userData?.role_id === 3) {
      navigate('/hospital', { replace: true })
    } else if (roles.includes('admin') || roles.includes('super-admin') || userData?.role_id === 1) {
      navigate('/admin', { replace: true })
    } else if (isStaffUser) {
      navigate('/admin', { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})

    if (!role) {
      setFieldErrors({ role: 'অনুগ্রহ করে প্রথমে ভূমিকা নির্বাচন করুন।' })
      return
    }

    if (!identifier) {
      setFieldErrors({ identifier: 'ইমেইল অথবা মোবাইল নম্বর দিন।' })
      return
    }

    if (!password) {
      setFieldErrors({ password: 'পাসওয়ার্ড দিন।' })
      return
    }

    setLoading(true)
    const result = await login(identifier, password, role)
    setLoading(false)

    if (result.requires_2fa) {
      setTwoFactorState({
        session_key: result.session_key,
        masked_mobile: result.masked_mobile,
        dev_otp: result.dev_otp,
        role: result.role || role
      })
      setOtp('')
      setTrustDevice(true)
      setOtpError('')
      return
    }

    if (result.success) {
      handlePostLoginRedirect(result.user)
    } else {
      const errMsg = result.message || 'লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।'
      const lower = errMsg.toLowerCase()

      if (lower.includes('রোগী') || lower.includes('ডাক্তার') || lower.includes('হাসপাতাল') || lower.includes('role')) {
        setFieldErrors({ role: errMsg })
      } else if (lower.includes('নিবন্ধিত নয়') || lower.includes('নিবন্ধন করুন') || lower.includes('পাওয়া যায়নি') || lower.includes('not find') || lower.includes('found') || lower.includes('email') || lower.includes('phone') || lower.includes('mobile')) {
        setFieldErrors({ identifier: errMsg })
      } else if (lower.includes('পাসওয়ার্ড') || lower.includes('password') || lower.includes('credential') || lower.includes('invalid')) {
        setFieldErrors({ password: errMsg })
      } else {
        setFieldErrors({ form: errMsg })
      }
    }
  }

  const handleVerifyDoctor2Fa = async (e) => {
    e.preventDefault()
    if (!otp || otp.trim().length !== 6) {
      setOtpError('অনুগ্রহ করে ৬-সংখ্যার সিকিউরিটি কোডটি লিখুন।')
      return
    }

    setOtpLoading(true)
    setOtpError('')

    const res = await verifyDoctor2Fa({
      session_key: twoFactorState.session_key,
      otp: otp.trim(),
      trust_device: trustDevice
    })

    setOtpLoading(false)

    if (res.success) {
      setTwoFactorState(null)
      handlePostLoginRedirect(res.user)
    } else {
      setOtp('')
      setOtpError(res.message || 'ভুল সিকিউরিটি কোড! সঠিক কোডটি দিন।')
    }
  }

  return (
    <div className="auth-premium-wrapper">
      <div className="auth-mesh-bg" />

      {/* SPLIT CONTAINER CENTERED IN PAGE */}
      <div className="auth-split-container fade-in-up">
        
        {/* ===== LEFT PANEL — EXECUTIVE NAVY BRANDING ===== */}
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
              আপনার স্বাস্থ্যসেবা,<br />এখন সহজ ও সুরক্ষিত
            </h2>
            <p className="info-panel-subtitle">
              Doctor Booklet ডিজিটাল প্ল্যাটফর্মে লগইন করে বিশ্বস্ত চিকিৎসা সেবা গ্রহণ করুন।
            </p>

            <ul className="info-feature-list">
              {(features[role] || features['patient']).map((f, i) => (
                <li key={i} className="info-feature-item">
                  <span className="info-feature-icon">{f.icon}</span>
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="info-trust-badge">
            <Shield size={14} />
            <span>SSL সুরক্ষিত · গোপনীয়তা বজায় থাকবে</span>
          </div>
        </div>

        {/* ===== RIGHT PANEL — CLEAN WHITE ACTIVE LOGIN FORM / 2FA ===== */}
        <div className="auth-form-panel">
          {twoFactorState ? (
            <div className="slide-in-right" style={{ width: '100%', maxWidth: 420 }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)', marginBottom: 12
                }}>
                  <Smartphone size={28} />
                </div>
                <h3 style={{ fontWeight: 800, color: '#0F172A', fontSize: 20, marginBottom: 4 }}>
                  নিরাপত্তা যাচাইকরণ (2FA)
                </h3>
                <p style={{ color: '#64748B', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                  নতুন ডিভাইস সনাক্ত হয়েছে। {(twoFactorState?.role === 'hospital' || role === 'hospital') ? 'হাসপাতাল' : 'ডাক্তার'} অ্যাকাউন্টের সুরক্ষায় আপনার নিবন্ধিত মোবাইল নম্বর{' '}
                  <strong style={{ color: '#0F172A' }}>{twoFactorState.masked_mobile || '017****'}</strong>
                  -এ ৬ ডিজিটের ওটিপি পাঠানো হয়েছে।
                </p>
              </div>

              {twoFactorState.dev_otp && (
                <div 
                  onClick={() => setOtp(twoFactorState.dev_otp)}
                  style={{
                    background: '#FEF3C7', border: '1px dashed #F59E0B', borderRadius: 8,
                    padding: '8px 12px', fontSize: 12, color: '#92400E', marginBottom: 16,
                    cursor: 'pointer', textAlign: 'center'
                  }}
                  title="ক্লিক করে ওটিপি বসান"
                >
                  ⚡ টেস্ট মোড ওটিপি: <strong>{twoFactorState.dev_otp}</strong> (ক্লিক করলে স্বয়ংক্রিয় বসবে)
                </div>
              )}

              {otpError && (
                <div style={{
                  background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B',
                  borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16,
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{otpError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyDoctor2Fa}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    ৬ ডিজিটের ওটিপি কোড
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ''))
                      setOtpError('')
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: 22,
                      fontWeight: 700,
                      textAlign: 'center',
                      letterSpacing: '8px',
                      borderRadius: 10,
                      border: '2px solid #CBD5E1',
                      outline: 'none',
                      color: '#0F172A',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0D9488'}
                    onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#334155', fontWeight: 500 }}>
                    <input
                      type="checkbox"
                      checked={trustDevice}
                      onChange={(e) => setTrustDevice(e.target.checked)}
                      style={{ cursor: 'pointer', width: 16, height: 16, accentColor: '#0D9488' }}
                    />
                    <span>এই ডিভাইসে আর জিজ্ঞাসা করবেন না</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={otpLoading || otp.length < 6}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 14,
                    background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: otpLoading || otp.length < 6 ? 'not-allowed' : 'pointer',
                    opacity: otp.length < 6 ? 0.7 : 1
                  }}
                >
                  {otpLoading ? (
                    <><span className="spinner-border spinner-border-sm me-2" /> যাচাই করা হচ্ছে...</>
                  ) : (
                    <>যাচাই করুন ও প্রবেশ করুন <ArrowRight size={17} /></>
                  )}
                </Button>

                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setTwoFactorState(null)
                      setOtp('')
                      setOtpError('')
                    }}
                    style={{
                      background: 'none', border: 'none', color: '#64748B', fontSize: 13,
                      cursor: 'pointer', textDecoration: 'underline'
                    }}
                  >
                    লগইন পেজে ফিরে যান
                  </button>
                </div>
              </form>
            </div>
          ) : (
          <div className="slide-in-right">
            
            {/* Header */}
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontWeight: 800, color: '#0F172A', fontSize: 22, marginBottom: 2, letterSpacing: '-0.5px' }}>
                স্বাগতম 👋
              </h2>
              <p style={{ color: '#64748B', fontWeight: 500, fontSize: 13, margin: 0 }}>
                আপনার অ্যাকাউন্টে লগইন করতে তথ্য দিন
              </p>
            </div>

            {/* Account Type Selection Dropdown */}
            <Form.Group style={{ marginBottom: 4 }}>
              <Form.Label className="auth-label-premium">অ্যাকাউন্টের ধরন (Account Type)</Form.Label>
              <div className="input-group-premium" style={{ position: 'relative' }}>
                <span className="input-icon-premium" style={{ color: role ? cfg.color : '#94A3B8' }}>
                  {role ? cfg.icon : <User size={16} />}
                </span>
                <Form.Select
                  id="login-role-select"
                  value={role}
                  onChange={(e) => {
                    const val = e.target.value
                    setRole(val)
                    setFieldErrors(prev => ({ ...prev, role: '' }))
                    if (val === 'doctor') navigate('/login/doctor', { replace: true })
                    else if (val === 'hospital') navigate('/login/hospital', { replace: true })
                    else if (val === 'patient') navigate('/login/patient', { replace: true })
                  }}
                  className="auth-input-premium"
                  style={{
                    paddingLeft: 46,
                    paddingRight: 42,
                    cursor: 'pointer',
                    fontWeight: role ? 600 : 400,
                    color: role ? '#0F172A' : '#94A3B8',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                  }}
                >
                  <option value="" disabled>— অ্যাকাউন্টের ধরন বেছে নিন —</option>
                  <option value="patient">রোগী (Patient)</option>
                  <option value="doctor">ডাক্তার (Doctor)</option>
                  <option value="hospital">হাসপাতাল (Hospital)</option>
                </Form.Select>
                <span style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  pointerEvents: 'none', color: '#64748B', display: 'flex', alignItems: 'center'
                }}>
                  <ChevronDown size={17} />
                </span>
              </div>
            </Form.Group>

            {/* Inline Red Error for Role */}
            {fieldErrors.role && (
              <p className="fade-in-up" style={{ color: '#DC2626', fontSize: 12.5, fontWeight: 600, marginTop: 4, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0 }} /> {fieldErrors.role}
              </p>
            )}

            {/* Dynamic Role Selected Message */}
            {role && (
              <p
                key={role}
                className="fade-in-up"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: role === 'patient' ? '#0D9488' : role === 'doctor' ? '#2563EB' : '#4F46E5',
                  fontWeight: 600,
                  fontSize: 12.5,
                  marginTop: 4,
                  marginBottom: 10,
                }}
              >
                {role === 'patient' && (<><User size={14} style={{ flexShrink: 0 }} /> আপনি রোগী হিসেবে লগইন করছেন।</>)}
                {role === 'doctor' && (<><ShieldCheck size={14} style={{ flexShrink: 0 }} /> আপনি ডাক্তার হিসেবে লগইন করছেন।</>)}
                {role === 'hospital' && (<><Hotel size={14} style={{ flexShrink: 0 }} /> আপনি হাসপাতাল হিসেবে লগইন করছেন।</>)}
              </p>
            )}


            {/* Form */}
            <Form onSubmit={handleSubmit}>
              {/* Email or Mobile Field */}
              <Form.Group style={{ marginBottom: 14 }}>
                <Form.Label className="auth-label-premium" style={{ color: !role ? '#94A3B8' : undefined }}>
                  ইমেইল অথবা মোবাইল নম্বর {!role && <LockKeyhole size={12} style={{ marginLeft: 4, opacity: 0.6 }} />}
                </Form.Label>
                <div
                  className="input-group-premium"
                  onClick={handleLockedFieldClick}
                  style={{
                    cursor: !role ? 'not-allowed' : undefined,
                    opacity: !role ? 0.55 : 1,
                    transition: 'opacity 0.3s',
                    position: 'relative',
                  }}
                >
                  {!role && (
                    <div style={{
                      position: 'absolute', inset: 0, zIndex: 10,
                      borderRadius: 0, cursor: 'not-allowed',
                      background: 'rgba(248,250,252,0.6)',
                    }} />
                  )}
                  <span className="input-icon-premium"><Mail size={17} /></span>
                  <Form.Control
                    id="login-identifier"
                    type="text"
                    placeholder="01XXXXXXXXX অথবা name@example.com"
                    value={identifier}
                    onChange={e => {
                      setIdentifier(e.target.value)
                      setFieldErrors(prev => ({ ...prev, identifier: '' }))
                    }}
                    required
                    className="auth-input-premium"
                    disabled={!role}
                    style={{ cursor: !role ? 'not-allowed' : undefined }}
                  />
                </div>
                {fieldErrors.identifier && (
                  <p className="fade-in-up" style={{ color: '#DC2626', fontSize: 12.5, fontWeight: 600, marginTop: 4, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0 }} /> {fieldErrors.identifier}
                  </p>
                )}
              </Form.Group>

              {/* Password Field */}
              <Form.Group style={{ marginBottom: 16 }}>
                <Form.Label className="auth-label-premium mb-0" style={{ color: !role ? '#94A3B8' : undefined }}>
                  পাসওয়ার্ড {!role && <LockKeyhole size={12} style={{ marginLeft: 4, opacity: 0.6 }} />}
                </Form.Label>
                <div
                  className="input-group-premium mt-1.5"
                  onClick={handleLockedFieldClick}
                  style={{
                    cursor: !role ? 'not-allowed' : undefined,
                    opacity: !role ? 0.55 : 1,
                    transition: 'opacity 0.3s',
                    position: 'relative',
                  }}
                >
                  {!role && (
                    <div style={{
                      position: 'absolute', inset: 0, zIndex: 10,
                      borderRadius: 0, cursor: 'not-allowed',
                      background: 'rgba(248,250,252,0.6)',
                    }} />
                  )}
                  <span className="input-icon-premium"><Lock size={17} /></span>
                  <Form.Control
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value)
                      setFieldErrors(prev => ({ ...prev, password: '' }))
                    }}
                    required
                    className="auth-input-premium"
                    disabled={!role}
                    style={{ cursor: !role ? 'not-allowed' : undefined }}
                  />
                  <button
                    type="button"
                    className="input-link-premium"
                    style={{ color: '#94A3B8', border: 'none', background: 'none' }}
                    onClick={() => role && setShowPass(!showPass)}
                    disabled={!role}
                  >
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {fieldErrors.password && (
                  <p className="fade-in-up" style={{ color: '#DC2626', fontSize: 12.5, fontWeight: 600, marginTop: 6, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0 }} /> {fieldErrors.password}
                  </p>
                )}

                {/* Google Style Natural Placement: Forgot Password Link below input */}
                <div style={{ textAlign: 'right', marginTop: 6, marginBottom: 2 }}>
                  <Link 
                    to="/forgot-password" 
                    style={{ 
                      fontSize: 12.5, 
                      color: !role ? '#CBD5E1' : '#0D9488', 
                      fontWeight: 600, 
                      textDecoration: 'none', 
                      pointerEvents: !role ? 'none' : 'auto',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => { if (role) e.target.style.textDecoration = 'underline'; }}
                    onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </Link>
                </div>
              </Form.Group>

              {fieldErrors.general && (
                <p className="fade-in-up" style={{ color: '#DC2626', fontSize: 13, fontWeight: 600, marginBottom: 12, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0 }} /> {fieldErrors.general}
                </p>
              )}

              {/* Submit Button */}
              <Button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className={`w-100 auth-btn-premium ${cfg.btnClass}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px',
                  opacity: !role ? 0.7 : 1,
                  transition: 'opacity 0.3s',
                }}
              >
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2" /> লগইন হচ্ছে...</>
                  : <><span>লগইন করুন</span> <ArrowRight size={17} /></>
                }
              </Button>
            </Form>

            {/* Footer */}
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#64748B', margin: 0 }}>
                অ্যাকাউন্ট নেই?{' '}
                <Link to={role ? `/register/${role}` : '/register'} style={{ color: '#0D9488', fontWeight: 700, textDecoration: 'none' }}>
                  এখানে রেজিস্টার করুন
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  )
}

export default LoginPage

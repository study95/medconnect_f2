import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Form, Button } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import { User, ShieldCheck, Hotel, Mail, Lock, Shield, Clock, CalendarCheck, Heart, Eye, EyeOff, ArrowRight, ChevronDown, AlertTriangle, LockKeyhole } from 'lucide-react'
import '../styles/auth-premium.css'

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [role, setRole] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const from = location.state?.from?.pathname || '/'

  const roleConfigs = {
    patient: {
      label: 'রোগী',
      desc: 'স্বাস্থ্য ব্যবস্থাপনা ও অ্যাপয়েন্টমেন্ট নিন',
      icon: <User size={16} />,
      btnClass: 'patient-btn',
      color: '#0D9488',
    },
    doctor: {
      label: 'ডাক্তার',
      desc: 'রোগী পরিচালনা ও সময়সূচি নিয়ন্ত্রণ করুন',
      icon: <ShieldCheck size={16} />,
      btnClass: 'doctor-btn',
      color: '#2563EB',
    },
    hospital: {
      label: 'হাসপাতাল',
      desc: 'আপনার চিকিৎসা প্রতিষ্ঠান পরিচালনা করুন',
      icon: <Hotel size={16} />,
      btnClass: 'hospital-btn',
      color: '#4F46E5',
    },
  }

  const cfg = roleConfigs[role] || { label: '', icon: null, btnClass: 'patient-btn', color: '#94A3B8' }

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

    if (result.success) {
      navigate(from, { replace: true })
    } else {
      const errMsg = result.message || 'লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।'
      const lower = errMsg.toLowerCase()

      if (lower.includes('নিবন্ধিত নয়') || lower.includes('নিবন্ধন করুন') || lower.includes('পাওয়া যায়নি') || lower.includes('not find') || lower.includes('found') || lower.includes('email') || lower.includes('phone') || lower.includes('mobile')) {
        setFieldErrors({ password: errMsg })
      } else if (lower.includes('পাসওয়ার্ড') || lower.includes('password') || lower.includes('credential') || lower.includes('invalid')) {
        setFieldErrors({ password: errMsg })
      } else if (lower.includes('রোগী') || lower.includes('ডাক্তার') || lower.includes('হাসপাতাল') || lower.includes('role')) {
        setFieldErrors({ role: errMsg })
      } else {
        setFieldErrors({ password: errMsg })
      }
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

        {/* ===== RIGHT PANEL — CLEAN WHITE ACTIVE LOGIN FORM ===== */}
        <div className="auth-form-panel">
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
                    setRole(e.target.value)
                    setFieldErrors(prev => ({ ...prev, role: '' }))
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
                <div className="d-flex justify-content-between align-items-center">
                  <Form.Label className="auth-label-premium mb-0" style={{ color: !role ? '#94A3B8' : undefined }}>
                    পাসওয়ার্ড {!role && <LockKeyhole size={12} style={{ marginLeft: 4, opacity: 0.6 }} />}
                  </Form.Label>
                  <Link to="/forgot-password" style={{ fontSize: 12.5, color: !role ? '#CBD5E1' : '#0D9488', fontWeight: 600, textDecoration: 'none', pointerEvents: !role ? 'none' : 'auto' }}>
                    ভুলে গেছেন?
                  </Link>
                </div>
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
                  <p className="fade-in-up" style={{ color: '#DC2626', fontSize: 12.5, fontWeight: 600, marginTop: 4, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0 }} /> {fieldErrors.password}
                  </p>
                )}
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
                <Link to="/register" style={{ color: '#0D9488', fontWeight: 700, textDecoration: 'none' }}>
                  এখানে রেজিস্টার করুন
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

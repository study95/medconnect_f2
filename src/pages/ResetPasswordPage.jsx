import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Form, Button } from 'react-bootstrap'
import axiosInstance from '../api/axiosInstance'
import PasswordInput from '../components/common/PasswordInput'
import {
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Shield,
  Sparkles,
  HelpCircle
} from 'lucide-react'
import '../styles/auth-premium.css'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const emailParam = searchParams.get('email') || ''
  const navigate = useNavigate()

  const [email, setEmail] = useState(emailParam)
  const [password, setPassword] = useState('')
  const [password_confirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatusMsg({ type: '', text: '' })

    if (!token) {
      setStatusMsg({ type: 'danger', text: 'অকার্যকর অথবা মেয়াদোত্তীর্ণ পাসওয়ার্ড রিসেট টোকেন।' })
      return
    }

    if (!email.trim()) {
      setStatusMsg({ type: 'danger', text: 'অনুগ্রহ করে আপনার ইমেইল প্রদান করুন।' })
      return
    }

    if (password.length < 6) {
      setStatusMsg({ type: 'danger', text: 'পাসওয়ার্ডটি কমপক্ষে ৬ অক্ষরের হতে হবে।' })
      return
    }

    if (password !== password_confirmation) {
      setStatusMsg({ type: 'danger', text: 'উভয় পাসওয়ার্ড হুবহু মিলছে না।' })
      return
    }

    setLoading(true)
    try {
      const res = await axiosInstance.post('/reset-password', {
        email: email.trim(),
        token,
        password,
        password_confirmation
      })

      if (res.data?.success) {
        setIsSuccess(true)
        setStatusMsg({
          type: 'success',
          text: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! কয়েক সেকেন্ডের মধ্যে আপনাকে লগইন পেইজে নেওয়া হচ্ছে...'
        })
        setTimeout(() => navigate('/login'), 2500)
      } else {
        setStatusMsg({
          type: 'danger',
          text: res.data?.message || 'পাসওয়ার্ড পরিবর্তন সম্পন্ন করা যায়নি।'
        })
      }
    } catch (err) {
      setStatusMsg({
        type: 'danger',
        text: err.response?.data?.message || 'সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-premium-wrapper">
      <div className="auth-mesh-bg" />

      {/* SPLIT CONTAINER CENTERED IN PAGE */}
      <div className="auth-split-container fade-in-up" style={{ maxWidth: 880 }}>

        {/* ===== LEFT PANEL — EXECUTIVE MINT BRANDING ===== */}
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
              সুরক্ষিত নতুন পাসওয়ার্ড,<br />নিরাপদ স্বাস্থ্যসেবা
            </h2>
            <p className="info-panel-subtitle">
              একটি শক্তিশালী পাসওয়ার্ড ব্যবহার করে আপনার Doctor Booklet অ্যাকাউন্ট সুরক্ষিত রাখুন।
            </p>

            <ul className="info-feature-list">
              <li className="info-feature-item">
                <span className="info-feature-icon"><ShieldCheck size={16} /></span>
                <span>শক্তিশালী এনক্রিপ্ট করা পাসওয়ার্ড সুরক্ষা</span>
              </li>
              <li className="info-feature-item">
                <span className="info-feature-icon"><Lock size={16} /></span>
                <span>কমপক্ষে ৬ অক্ষর বা তার বেশি ব্যবহার করুন</span>
              </li>
              <li className="info-feature-item">
                <span className="info-feature-icon"><Sparkles size={16} /></span>
                <span>সংখ্যা ও চিহ্নের সমন্বয় আরও নিরাপদ</span>
              </li>
            </ul>
          </div>

          <div className="info-trust-badge">
            <Shield size={14} />
            <span>SSL সুরক্ষিত · সর্বোচ্চ নিরাপত্তা ব্যবস্থা</span>
          </div>
        </div>

        {/* ===== RIGHT PANEL — MODERN RESET PASSWORD FORM ===== */}
        <div className="auth-form-panel" style={{ padding: '38px 36px' }}>
          <div className="slide-in-right">

            {/* Mobile Header Logo */}
            <div className="d-lg-none text-center mb-4">
              <Link to="/" className="text-decoration-none d-inline-block">
                <img
                  src="/doctorBookletLogo.png"
                  alt="Doctor Booklet"
                  style={{ height: '34px', width: 'auto', objectFit: 'contain' }}
                />
              </Link>
            </div>

            {/* Icon Badge */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(0, 184, 117, 0.12) 0%, rgba(5, 150, 105, 0.18) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00B875',
                marginBottom: 16,
                border: '1px solid rgba(0, 184, 117, 0.25)',
                boxShadow: '0 4px 12px rgba(0, 184, 117, 0.1)'
              }}
            >
              <KeyRound size={24} />
            </div>

            {/* Form Title & Subtitle */}
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontWeight: 800, color: '#0F172A', fontSize: 22, marginBottom: 6, letterSpacing: '-0.4px' }}>
                নতুন পাসওয়ার্ড নির্ধারণ করুন
              </h2>
              <p style={{ color: '#64748B', fontWeight: 500, fontSize: 13.5, margin: 0, lineHeight: 1.55 }}>
                আপনার অ্যাকাউন্টের জন্য নতুন একটি গোপন ও শক্তিশালী পাসওয়ার্ড লিখুন।
              </p>
            </div>

            {/* Status Messages */}
            {statusMsg.text && (
              <div
                style={{
                  background: statusMsg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${statusMsg.type === 'success' ? '#BBF7D0' : '#FCA5A5'}`,
                  color: statusMsg.type === 'success' ? '#166534' : '#991B1B',
                  borderRadius: 12,
                  padding: '12px 14px',
                  fontSize: 13.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 20
                }}
              >
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                ) : (
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                )}
                <span>{statusMsg.text}</span>
              </div>
            )}

            {isSuccess ? (
              <div className="text-center py-3">
                <Link
                  to="/login"
                  className="btn btn-mc-primary"
                  style={{
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    padding: '10px 24px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <span>লগইন করুন</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <Form onSubmit={handleSubmit}>
                <Form.Group style={{ marginBottom: 16 }}>
                  <Form.Label className="auth-label-premium">ইমেইল এড্রেস</Form.Label>
                  <div className="input-group-premium" style={{ position: 'relative' }}>
                    <span className="input-icon-premium" style={{ color: '#00B875' }}>
                      <Mail size={17} />
                    </span>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      readOnly={!!emailParam}
                      required
                      className="auth-input-premium"
                      style={{
                        paddingLeft: 44,
                        background: emailParam ? '#F8FAFC' : '#FFFFFF',
                        cursor: emailParam ? 'not-allowed' : 'text'
                      }}
                    />
                  </div>
                </Form.Group>

                <Form.Group style={{ marginBottom: 16 }}>
                  <Form.Label className="auth-label-premium">নতুন পাসওয়ার্ড (New Password)</Form.Label>
                  <PasswordInput
                    className="auth-input-premium"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    showStrength={false}
                  />
                </Form.Group>

                <Form.Group style={{ marginBottom: 22 }}>
                  <Form.Label className="auth-label-premium">পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)</Form.Label>
                  <PasswordInput
                    className="auth-input-premium"
                    name="password_confirmation"
                    value={password_confirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="পুনরায় নতুন পাসওয়ার্ড দিন"
                    showStrength={false}
                  />
                </Form.Group>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="auth-btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: 15,
                    fontWeight: 700,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: (loading || !token) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      <span>পরিবর্তন করা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <span>পাসওয়ার্ড সংরক্ষণ করুন</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </Form>
            )}

            {/* Bottom Links */}
            <div
              style={{
                marginTop: 24,
                paddingTop: 18,
                borderTop: '1px solid #F1F5F9',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12
              }}
            >
              <Link
                to="/login"
                style={{
                  color: '#00B875',
                  fontSize: 13.5,
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-3px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
              >
                <ArrowLeft size={16} />
                <span>লগইন পেইজে ফিরে যান</span>
              </Link>

              <div style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', display: 'flex', alignItems: 'center', gap: 5 }}>
                <HelpCircle size={13} style={{ opacity: 0.8 }} />
                <span>সহায়তা প্রয়োজন? হেল্পলাইন: </span>
                <a href="tel:09613868438" style={{ color: '#475569', fontWeight: 600, textDecoration: 'none' }}>
                  09613868438
                </a>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

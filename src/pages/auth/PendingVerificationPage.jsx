// PendingVerificationPage.jsx
// Matches the exact executive light mint theme of LoginPage and RegisterPage
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Clock, ShieldCheck, CheckCircle2, Building2, User,
  RefreshCw, PhoneCall, Mail, ArrowRight, Home,
  FileCheck2, AlertCircle, Shield, Sparkles, CalendarCheck, Heart
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import '../../styles/auth-premium.css'

export default function PendingVerificationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, fetchCurrentUser, isDoctor, isManager, isAdmin } = useAuth()

  const [refreshing, setRefreshing] = useState(false)

  // Determine type: prefer state or user data
  const stateType = location.state?.type
  const isHospital = stateType === 'hospital' ||
    user?.registration_type === 'hospital' ||
    user?.hospital ||
    location.pathname.includes('hospital')

  const roleLabel = isHospital ? 'হাসপাতাল' : 'ডাক্তার'
  const roleSubtext = isHospital ? 'চিকিৎসা প্রতিষ্ঠান পার্টনারশিপ' : 'মেডিকেল প্র্যাকটিশনার প্রোফাইল'

  // Name resolution
  const displayName = location.state?.name ||
    user?.hospital?.name ||
    user?.name ||
    (isHospital ? 'সম্মানিত হাসপাতাল কর্তৃপক্ষ' : 'সম্মানিত ডাক্তার')

  const mobileOrEmail = user?.phone || user?.mobile || user?.email || 'আপনার নিবন্ধিত নম্বর'

  // Live status check
  const handleCheckStatus = async () => {
    setRefreshing(true)
    try {
      if (fetchCurrentUser) {
        await fetchCurrentUser()
      }

      if (isAdmin || isDoctor || isManager) {
        toast.success('অভিনন্দন! আপনার অ্যাকাউন্ট অনুমোদিত হয়েছে।')
        navigate('/admin', { replace: true })
        return
      }

      setTimeout(() => {
        setRefreshing(false)
        toast('আপনার আবেদনটি এখনও যাচাই প্রক্রিয়ায় রয়েছে। অনুমোদন হলে এসএমএস/ইমেইলে জানানো হবে।', {
          icon: '⏳',
          duration: 4000
        })
      }, 700)
    } catch {
      setRefreshing(false)
      toast.error('স্ট্যাটাস আপডেট চেক করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।')
    }
  }

  return (
    <div className="auth-premium-wrapper">
      <div className="auth-mesh-bg" />

      {/* SPLIT CONTAINER CENTERED IN PAGE — Exact same card structure as LoginPage */}
      <div className="auth-split-container fade-in-up" style={{ maxWidth: 940 }}>

        {/* ===== LEFT PANEL — EXACT LIGHT MINT HEALTHCARE BRANDING ===== */}
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
              Doctor Booklet ডিজিটাল প্ল্যাটফর্মে আপনার {roleLabel} প্রোফাইল যাচাইকরণ চলমান রয়েছে।
            </p>

            <ul className="info-feature-list">
              <li className="info-feature-item">
                <span className="info-feature-icon"><ShieldCheck size={16} /></span>
                <span>বিএমডিসি ও সরকারি লাইসেন্স যাচাই</span>
              </li>
              <li className="info-feature-item">
                <span className="info-feature-icon"><Clock size={16} /></span>
                <span>১-৩ কার্যদিবসের মধ্যে দ্রুত অনুমোদন</span>
              </li>
              <li className="info-feature-item">
                <span className="info-feature-icon"><CheckCircle2 size={16} /></span>
                <span>এসএমএস ও ইমেইল তাৎক্ষণিক নোটিফিকেশন</span>
              </li>
              <li className="info-feature-item">
                <span className="info-feature-icon"><Building2 size={16} /></span>
                <span>অনুমোদন শেষে সম্পূর্ণ প্যানেল সক্রিয়</span>
              </li>
            </ul>
          </div>

          <div className="info-trust-badge">
            <Shield size={14} />
            <span>SSL সুরক্ষিত · বিশ্বস্ত ভেরিফিকেশন</span>
          </div>
        </div>

        {/* ===== RIGHT PANEL — CLEAN WHITE INFORMATIVE VERIFICATION STATUS ===== */}
        <div className="auth-form-panel" style={{ padding: '34px 36px' }}>
          <div className="slide-in-right">

            {/* Top Status Badge & Time */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: '#FEF3C7', color: '#92400E',
                padding: '5px 12px', borderRadius: 20,
                fontSize: 12, fontWeight: 700
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#D97706',
                  animation: 'pvDotPulse 1.5s infinite'
                }} />
                <span>যাচাইকরণ প্রক্রিয়াধীন (In Review)</span>
              </div>

              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Clock size={13} /> ১-৩ কার্যদিবস
              </span>
            </div>

            {/* Title & Subtitle */}
            <h2 style={{ fontWeight: 800, color: '#0F172A', fontSize: 21, marginBottom: 4, letterSpacing: '-0.4px' }}>
              ধন্যবাদ, {displayName}! 🎉
            </h2>
            <p style={{ color: '#64748B', fontWeight: 500, fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
              আপনার <strong>{roleLabel}</strong> অ্যাকাউন্ট নিবন্ধন তথ্য সফলভাবে সিস্টেমে জমা হয়েছে।
            </p>

            {/* Applicant Summary Card */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 16
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600, display: 'block' }}>অ্যাকাউন্টের ধরন</span>
                  <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <User size={13} color="#00B875" /> {roleLabel} ({roleSubtext})
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600, display: 'block' }}>নিবন্ধিত তথ্য</span>
                  <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 700, display: 'block', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {mobileOrEmail}
                  </span>
                </div>
              </div>
              <div style={{ height: 1, background: '#E2E8F0', margin: '8px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>বর্তমান অবস্থা:</span>
                <span style={{ color: '#D97706', fontWeight: 700 }}>অ্যাডমিন অনুমোদনের অপেক্ষমাণ</span>
              </div>
            </div>

            {/* 3-Step Visual Progress Stepper */}
            <div style={{ marginBottom: 18 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <FileCheck2 size={15} color="#00B875" />
                যাচাইকরণ ধাপসমূহ
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Step 1: Done */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: '#00B875', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 1
                  }}>
                    <CheckCircle2 size={13} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>১. তথ্য ও ডকুমেন্ট জমা</span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, background: '#DCFCE7', color: '#15803D', padding: '1px 7px', borderRadius: 10 }}>সম্পন্ন</span>
                    </div>
                    <span style={{ fontSize: 11.5, color: '#64748B' }}>আপনার সকল মৌলিক তথ্য সফলভাবে সিস্টেমে সংরক্ষিত হয়েছে।</span>
                  </div>
                </div>

                {/* Step 2: Active */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: '#FEF3C7', color: '#D97706', border: '1.5px solid #F59E0B',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 1
                  }}>
                    <Clock size={12} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#92400E' }}>২. লাইসেন্স ও সনদ পরীক্ষা</span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, background: '#FEF3C7', color: '#B45309', padding: '1px 7px', borderRadius: 10 }}>চলমান</span>
                    </div>
                    <span style={{ fontSize: 11.5, color: '#78350F' }}>
                      {isHospital
                        ? 'স্বাস্থ্য অধিদপ্তরের (DGHS) লাইসেন্স ও প্রাতিষ্ঠানিক বিবরণ যাচাই চলছে।'
                        : 'বিএমডিসি (BMDC) রেজিস্ট্রেশন নম্বর ও সনদের সত্যতা পরীক্ষা চলছে।'
                      }
                    </span>
                  </div>
                </div>

                {/* Step 3: Pending */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: '#F1F5F9', color: '#94A3B8', border: '1px solid #CBD5E1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 1
                  }}>
                    <ShieldCheck size={12} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#64748B' }}>৩. প্যানেল সক্রিয়করণ ও নোটিফিকেশন</span>
                      <span style={{ fontSize: 10.5, fontWeight: 600, background: '#F1F5F9', color: '#64748B', padding: '1px 7px', borderRadius: 10 }}>অপেক্ষমাণ</span>
                    </div>
                    <span style={{ fontSize: 11.5, color: '#94A3B8' }}>অনুমোদন শেষে এসএমএস পাবেন এবং সরাসরি প্যানেল সক্রিয় হবে।</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Helpline Box */}
            <div style={{
              background: '#F0FDF4',
              border: '1px solid #DCFCE7',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8
            }}>
              <span style={{ fontSize: 11.5, color: '#065F46', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                <PhoneCall size={13} color="#00B875" />
                জরুরি প্রয়োজনে সহায়তা:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <a href="tel:09613868438" style={{ color: '#00B875', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                  ০৯৬১৩৮৬৮৪৩৮
                </a>
                <span style={{ color: '#CBD5E1' }}>|</span>
                <a href="mailto:info@doctorbooklet.com.bd" style={{ color: '#00B875', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                  ইমেইল সাপোর্ট
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <button
                onClick={handleCheckStatus}
                disabled={refreshing}
                className="auth-btn-premium"
                style={{
                  flex: 1.2,
                  padding: '11px',
                  background: '#00B875',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  boxShadow: '0 4px 14px rgba(0, 184, 117, 0.25)',
                  transition: 'all 0.2s'
                }}
              >
                <RefreshCw size={15} className={refreshing ? 'pv-spin' : ''} />
                <span>{refreshing ? 'চেক হচ্ছে...' : 'স্ট্যাটাস রিফ্রেশ করুন'}</span>
              </button>

              <button
                onClick={() => navigate('/')}
                style={{
                  flex: 1,
                  padding: '11px',
                  background: '#FFFFFF',
                  color: '#334155',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  transition: 'all 0.2s'
                }}
              >
                <Home size={15} />
                <span>ওয়েবসাইটে ফিরুন</span>
              </button>
            </div>

            <p style={{ fontSize: 11.5, color: '#94A3B8', textAlign: 'center', margin: 0 }}>
              অনুমোদনের পর আপনার বর্তমান লগইন তথ্য দিয়েই প্যানেলে ঢুকতে পারবেন।
            </p>

          </div>
        </div>

      </div>

      <style>{`
        .pv-spin {
          animation: pvRotate 0.8s linear infinite;
        }
        @keyframes pvRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pvDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.85); }
        }
      `}</style>
    </div>
  )
}
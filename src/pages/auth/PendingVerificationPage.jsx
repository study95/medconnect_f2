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

  // Handle email click gracefully across desktop & mobile
  const handleEmailClick = (e) => {
    const email = 'info@doctorbooklet.com.bd'

    // 1. Copy email address to clipboard
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(email).catch(() => {})
    }

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (isMobile) {
      // Mobile browsers natively open Gmail/Mail app via mailto
      return
    }

    // 2. On desktop, mailto: silently does nothing if no Windows Mail/Outlook client is configured.
    // So we open Gmail web compose tab directly and notify user with toast.
    e.preventDefault()
    toast.success(`সাপোর্ট ইমেইল (${email}) কপি হয়েছে এবং জিমেইল ওপেন হচ্ছে...`, {
      icon: '✉️',
      duration: 4000
    })

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent('Doctor Booklet অ্যাকাউন্ট ভেরিফিকেশন সহায়তা')}`
    window.open(gmailUrl, '_blank')
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
        <div className="auth-form-panel pv-form-panel">
          <div className="slide-in-right">


            {/* Top Status Badge & Time */}
            <div className="pv-status-bar">
              <div className="pv-in-review-badge">
                <span className="pv-dot-indicator" />
                <span>যাচাইকরণ প্রক্রিয়াধীন (In Review)</span>
              </div>

              <span className="pv-time-indicator">
                <Clock size={13} /> ১-৩ কার্যদিবস
              </span>
            </div>

            {/* Title & Subtitle */}
            <h2 className="pv-title">
              ধন্যবাদ, {displayName}! 🎉
            </h2>
            <p className="pv-subtitle">
              আপনার <strong>{roleLabel}</strong> অ্যাকাউন্ট নিবন্ধন তথ্য সফলভাবে সিস্টেমে জমা হয়েছে।
            </p>

            {/* Applicant Summary Card */}
            <div className="pv-summary-card">
              <div className="pv-summary-grid">
                <div>
                  <span className="pv-field-label">অ্যাকাউন্টের ধরন</span>
                  <span className="pv-field-value">
                    <User size={13} color="#00B875" /> {roleLabel}
                  </span>
                </div>
                <div>
                  <span className="pv-field-label">নিবন্ধিত তথ্য</span>
                  <span className="pv-field-value pv-contact-value">
                    {mobileOrEmail}
                  </span>
                </div>
              </div>
              <div className="pv-card-divider" />
              <div className="pv-status-row">
                <span className="pv-status-label">বর্তমান অবস্থা:</span>
                <span className="pv-status-val">অ্যাডমিন অনুমোদনের অপেক্ষমাণ</span>
              </div>
            </div>

            {/* 3-Step Visual Progress Stepper */}
            <div className="pv-stepper-container">
              <span className="pv-stepper-title">
                <FileCheck2 size={15} color="#00B875" />
                যাচাইকরণ ধাপসমূহ
              </span>

              <div className="pv-steps-list">
                {/* Step 1: Done */}
                <div className="pv-step-item">
                  <div className="pv-step-indicator-col">
                    <div className="pv-step-circle pv-circle-done">
                      <CheckCircle2 size={13} />
                    </div>
                    <div className="pv-timeline-bar pv-bar-done" />
                  </div>
                  <div className="pv-step-content">
                    <div className="pv-step-header">
                      <span className="pv-step-name">১. তথ্য ও ডকুমেন্ট জমা</span>
                      <span className="pv-step-tag pv-tag-done">সম্পন্ন</span>
                    </div>
                    <span className="pv-step-desc">আপনার সকল মৌলিক তথ্য সফলভাবে সিস্টেমে সংরক্ষিত হয়েছে।</span>
                  </div>
                </div>

                {/* Step 2: Active */}
                <div className="pv-step-item">
                  <div className="pv-step-indicator-col">
                    <div className="pv-step-circle pv-circle-active">
                      <Clock size={12} />
                    </div>
                    <div className="pv-timeline-bar pv-bar-pending" />
                  </div>
                  <div className="pv-step-content">
                    <div className="pv-step-header">
                      <span className="pv-step-name pv-active-text">২. লাইসেন্স ও সনদ পরীক্ষা</span>
                      <span className="pv-step-tag pv-tag-active">চলমান</span>
                    </div>
                    <span className="pv-step-desc pv-active-subtext">
                      {isHospital
                        ? 'স্বাস্থ্য অধিদপ্তরের (DGHS) লাইসেন্স ও প্রাতিষ্ঠানিক বিবরণ যাচাই চলছে।'
                        : 'বিএমডিসি (BMDC) রেজিস্ট্রেশন নম্বর ও সনদের সত্যতা পরীক্ষা চলছে।'
                      }
                    </span>
                  </div>
                </div>

                {/* Step 3: Pending */}
                <div className="pv-step-item">
                  <div className="pv-step-indicator-col">
                    <div className="pv-step-circle pv-circle-pending">
                      <ShieldCheck size={12} />
                    </div>
                  </div>
                  <div className="pv-step-content">
                    <div className="pv-step-header">
                      <span className="pv-step-name pv-pending-text">৩. প্যানেল সক্রিয়করণ ও নোটিফিকেশন</span>
                      <span className="pv-step-tag pv-tag-pending">অপেক্ষমাণ</span>
                    </div>
                    <span className="pv-step-desc pv-pending-subtext">অনুমোদন শেষে এসএমএস পাবেন এবং সরাসরি প্যানেল সক্রিয় হবে।</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Helpline Box */}
            <div className="pv-helpline-box">
              <span className="pv-helpline-label">
                <PhoneCall size={13} color="#00B875" />
                জরুরি প্রয়োজনে সহায়তা:
              </span>
              <div className="pv-helpline-links">
                <a href="tel:09613868438" className="pv-call-btn">
                  ০৯৬১৩৮৬৮৪৩৮
                </a>
                <span className="pv-helpline-sep">|</span>
                <a
                  href="mailto:info@doctorbooklet.com.bd"
                  onClick={handleEmailClick}
                  className="pv-email-btn"
                  title="ক্লিক করে সরাসরি ইমেইল পাঠান অথবা কপি করুন"
                >
                  ইমেইল সাপোর্ট
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pv-action-buttons">
              <button
                onClick={handleCheckStatus}
                disabled={refreshing}
                className="pv-btn-refresh"
              >
                <RefreshCw size={15} className={refreshing ? 'pv-spin' : ''} />
                <span>{refreshing ? 'চেক হচ্ছে...' : 'স্ট্যাটাস রিফ্রেশ করুন'}</span>
              </button>

              <button
                onClick={() => navigate('/')}
                className="pv-btn-home"
              >
                <Home size={15} />
                <span>ওয়েবসাইটে ফিরুন</span>
              </button>
            </div>

            <p className="pv-footer-tip">
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

        .pv-form-panel {
          padding: 34px 36px;
        }


        .pv-status-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .pv-in-review-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #FEF3C7;
          color: #92400E;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
        }

        .pv-dot-indicator {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #D97706;
          animation: pvDotPulse 1.5s infinite;
        }

        .pv-time-indicator {
          font-size: 12px;
          color: #64748B;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .pv-title {
          font-weight: 800;
          color: #0F172A;
          font-size: 21px;
          margin-bottom: 4px;
          letter-spacing: -0.4px;
          line-height: 1.35;
        }

        .pv-subtitle {
          color: #64748B;
          font-weight: 500;
          font-size: 13px;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .pv-summary-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 16px;
        }

        .pv-summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .pv-field-label {
          font-size: 11px;
          color: #64748B;
          font-weight: 600;
          display: block;
        }

        .pv-field-value {
          font-size: 13px;
          color: #0F172A;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 2px;
        }

        .pv-contact-value {
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pv-card-divider {
          height: 1px;
          background: #E2E8F0;
          margin: 8px 0;
        }

        .pv-status-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11.5px;
        }

        .pv-status-label {
          color: #64748B;
          font-weight: 500;
        }

        .pv-status-val {
          color: #D97706;
          font-weight: 700;
        }

        .pv-stepper-container {
          margin-bottom: 18px;
        }

        .pv-stepper-title {
          font-size: 12.5px;
          font-weight: 700;
          color: #0F172A;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 10px;
        }

        .pv-steps-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .pv-step-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .pv-step-indicator-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }

        .pv-step-circle {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
        }

        .pv-circle-done {
          background: #00B875;
          color: white;
        }

        .pv-circle-active {
          background: #FEF3C7;
          color: #D97706;
          border: 1.5px solid #F59E0B;
        }

        .pv-circle-pending {
          background: #F1F5F9;
          color: #94A3B8;
          border: 1px solid #CBD5E1;
        }

        .pv-timeline-bar {
          width: 2px;
          min-height: 20px;
          margin: 2px 0;
        }

        .pv-bar-done {
          background: #00B875;
        }

        .pv-bar-pending {
          background: #E2E8F0;
        }

        .pv-step-content {
          flex: 1;
          padding-bottom: 12px;
        }

        .pv-step-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .pv-step-name {
          font-size: 12.5px;
          font-weight: 700;
          color: #0F172A;
        }

        .pv-active-text {
          color: #92400E;
        }

        .pv-pending-text {
          color: #64748B;
          font-weight: 600;
        }

        .pv-step-tag {
          font-size: 10.5px;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: 10px;
        }

        .pv-tag-done {
          background: #DCFCE7;
          color: #15803D;
        }

        .pv-tag-active {
          background: #FEF3C7;
          color: #B45309;
        }

        .pv-tag-pending {
          background: #F1F5F9;
          color: #64748B;
        }

        .pv-step-desc {
          font-size: 11.5px;
          color: #64748B;
          display: block;
          margin-top: 1px;
          line-height: 1.4;
        }

        .pv-active-subtext {
          color: #78350F;
        }

        .pv-pending-subtext {
          color: #94A3B8;
        }

        .pv-helpline-box {
          background: #F0FDF4;
          border: 1px solid #DCFCE7;
          border-radius: 10px;
          padding: 10px 14px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        .pv-helpline-label {
          font-size: 11.5px;
          color: #065F46;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .pv-helpline-links {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pv-call-btn, .pv-email-btn {
          color: #00B875;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          transition: opacity 0.15s;
        }

        .pv-call-btn:hover, .pv-email-btn:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        .pv-helpline-sep {
          color: #CBD5E1;
        }

        .pv-action-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 12px;
        }

        .pv-btn-refresh {
          flex: 1.2;
          padding: 11px 16px;
          background: #00B875;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          box-shadow: 0 4px 14px rgba(0, 184, 117, 0.25);
          transition: all 0.2s;
        }

        .pv-btn-refresh:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-1px);
        }

        .pv-btn-home {
          flex: 1;
          padding: 11px 16px;
          background: #FFFFFF;
          color: #334155;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: all 0.2s;
        }

        .pv-btn-home:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .pv-footer-tip {
          font-size: 11.5px;
          color: #94A3B8;
          text-align: center;
          margin: 0;
          line-height: 1.4;
        }

        /* Responsive Breakpoints for Mobile View */
        @media (max-width: 991px) {
          .auth-split-container {
            border-radius: 18px !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08) !important;
            border: 1px solid #E2E8F0 !important;
            overflow: hidden !important;
          }


          .pv-form-panel {
            padding: 24px 20px !important;
            border-radius: 18px !important;
          }
        }

        @media (max-width: 520px) {
          .auth-premium-wrapper {
            padding: 16px 12px 60px !important;
          }

          .auth-split-container {
            border-radius: 16px !important;
            margin-bottom: 16px;
          }

          .pv-form-panel {
            padding: 20px 16px !important;
            border-radius: 16px !important;
          }

          .pv-title {
            font-size: 18px;
          }

          .pv-summary-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .pv-summary-grid > div:first-child {
            border-bottom: 1px dashed #E2E8F0;
            padding-bottom: 6px;
          }

          .pv-action-buttons {
            flex-direction: column;
            gap: 9px;
          }

          .pv-btn-refresh, .pv-btn-home {
            width: 100%;
            padding: 12px;
            font-size: 13.5px;
            min-height: 44px;
          }

          .pv-helpline-box {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .pv-helpline-links {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  )
}
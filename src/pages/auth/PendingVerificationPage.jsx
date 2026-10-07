// PendingVerificationPage.jsx
// Pixel-perfect match for the user's mobile onboarding design
// Fully dynamic data with real status checking, Benglai date formatting, and details drawer

import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Check, Hourglass, ShieldCheck, History, ArrowRight,
  Headset, Phone, ChevronDown, ChevronUp, RefreshCw,
  User, Building2, FileText, Calendar, Mail, AlertCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Helper to convert date to beautiful Bengali date & time string
const formatBengaliDateTime = (dateInput) => {
  if (!dateInput) {
    return { date: '২৯ সেপ্টেম্বর ২০২৪', time: 'সকাল ১০:৩০' }
  }
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) {
    return { date: '২৯ সেপ্টেম্বর ২০২৪', time: 'সকাল ১০:৩০' }
  }

  const bngMonths = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ]
  const toBngNum = (num) => String(num).replace(/[0-9]/g, (digit) => '০১২৩৪৫৬৭৮৯'[digit])

  const day = toBngNum(d.getDate())
  const month = bngMonths[d.getMonth()]
  const year = toBngNum(d.getFullYear())

  const hours = d.getHours()
  const minutes = toBngNum(String(d.getMinutes()).padStart(2, '0'))

  let period = 'সকাল'
  if (hours >= 12 && hours < 15) period = 'দুপুর'
  else if (hours >= 15 && hours < 18) period = 'বিকাল'
  else if (hours >= 18 && hours < 20) period = 'সন্ধ্যা'
  else if (hours >= 20 || hours < 6) period = 'রাত'

  const displayHours = hours % 12 === 0 ? 12 : hours % 12
  const timeStr = `${period} ${toBngNum(displayHours)}:${minutes}`

  return {
    date: `${day} ${month} ${year}`,
    time: timeStr
  }
}

export default function PendingVerificationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, fetchCurrentUser, isDoctor, isManager, isAdmin } = useAuth()

  const [refreshing, setRefreshing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Determine user role
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

  // Mobile / Email resolution
  const mobileOrEmail = user?.phone || user?.mobile || user?.email || location.state?.phone || '০১৭********'
  const emailAddress = user?.email || location.state?.email || 'N/A'

  // License / BMDC resolution
  const licenseNumber = user?.bmdc_number ||
    user?.doctor?.bmdc_number ||
    user?.bmdc_reg_no ||
    user?.license_number ||
    user?.hospital?.license_number ||
    user?.dghs_reg_no ||
    location.state?.bmdc_number ||
    location.state?.license_number ||
    'যাচাই প্রক্রিয়াধীন'

  // Submission Date & Time
  const submissionTimestamp = user?.created_at || location.state?.created_at || null
  const { date: submissionDate, time: submissionTime } = formatBengaliDateTime(submissionTimestamp)

  // Auto check if already approved
  useEffect(() => {
    if (isAdmin || isDoctor || isManager) {
      toast.success('আপনার অ্যাকাউন্ট অনুমোদিত হয়েছে!')
      navigate('/admin', { replace: true })
    }
  }, [isAdmin, isDoctor, isManager, navigate])

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
        toast('আপনার আবেদনটি এখনও যাচাই প্রক্রিয়ায় রয়েছে। অনুমোদন হলে এসএমএস পাঠানো হবে।', {
          icon: '⏳',
          duration: 4000
        })
      }, 600)
    } catch {
      setRefreshing(false)
      toast.error('স্ট্যাটাস আপডেট চেক করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
    }
  }

  return (
    <div className="pv-page-container">
      <div className="pv-content-wrapper">

        {/* ===== MAIN WHITE CARD ===== */}
        <div className="pv-main-card">

          {/* Top Illustration */}
          <div className="pv-illustration-wrapper">
            <img
              src="/images/pending-verification-hero.png"
              alt="আবেদন যাচাইকরণ প্রক্রিয়াধীন"
              className="pv-illustration-img"
              loading="eager"
            />
          </div>

          {/* Main Headline */}
          <h1 className="pv-main-title">
            আপনার আবেদন এখনো অনুমোদনের অপেক্ষায়
          </h1>

          {/* Subtitle */}
          <p className="pv-main-subtitle">
            আপনার তথ্য আমাদের কাছে জমা হয়েছে।<br />
            এটি এখন প্রশাসক দলের মাধ্যমে যাচাই করা হচ্ছে।
          </p>

          {/* ===== 3-STEP HORIZONTAL PROGRESS STEPPER ===== */}
          <div className="pv-stepper-box">
            <div className="pv-stepper-track">

              {/* Step 1: তথ্য জমা (Done) */}
              <div className="pv-step-node">
                <div className="pv-step-icon-circle pv-node-done">
                  <Check size={18} strokeWidth={3} />
                </div>
                <div className="pv-step-text-group">
                  <span className="pv-step-title pv-title-done">তথ্য জমা</span>
                  <span className="pv-step-time-info">{submissionDate}</span>
                  <span className="pv-step-time-info">{submissionTime}</span>
                </div>
              </div>

              {/* Connecting Line 1 (Green) */}
              <div className="pv-step-connector pv-connector-done" />

              {/* Step 2: যাচাই চলছে (Active / In-progress) */}
              <div className="pv-step-node">
                <div className="pv-step-icon-circle pv-node-active">
                  <Hourglass size={16} strokeWidth={2.4} />
                </div>
                <div className="pv-step-text-group">
                  <span className="pv-step-title pv-title-active">যাচাই চলছে</span>
                </div>
              </div>

              {/* Connecting Line 2 (Dashed gray) */}
              <div className="pv-step-connector pv-connector-pending" />

              {/* Step 3: অনুমোদিত হবে (Pending / Future) */}
              <div className="pv-step-node">
                <div className="pv-step-icon-circle pv-node-pending">
                  <Check size={16} strokeWidth={2.2} />
                </div>
                <div className="pv-step-text-group">
                  <span className="pv-step-title pv-title-pending">অনুমোদিত হবে</span>
                </div>
              </div>

            </div>
          </div>

          {/* ===== INFO NOTICE BOX ===== */}
          <div className="pv-notice-box">
            <div className="pv-notice-icon-circle">
              <ShieldCheck size={20} strokeWidth={2.4} />
            </div>
            <div className="pv-notice-content">
              <h4 className="pv-notice-heading">আমরা আপনার তথ্য যাচাই করছি</h4>
              <p className="pv-notice-desc">
                সাধারণত ১–৩ কার্যদিবসের মধ্যে অনুমোদন সম্পন্ন করা হয়। অনুমোদন হলে আপনাকে আমরা নোটিফিকেশন পাঠাবো।
              </p>
            </div>
          </div>

          {/* ===== VIEW APPLICATION DETAILS ACCORDION BUTTON ===== */}
          <div className="pv-details-toggle-card">
            <button
              type="button"
              className="pv-details-toggle-btn"
              onClick={() => setShowDetails(!showDetails)}
              aria-expanded={showDetails}
            >
              <div className="pv-details-btn-left">
                <History size={18} className="pv-details-history-icon" />
                <span className="pv-details-btn-text">আবেদন বিস্তারিত দেখুন</span>
              </div>
              <div className="pv-details-btn-right">
                {showDetails ? (
                  <ChevronUp size={18} className="pv-details-arrow" />
                ) : (
                  <ArrowRight size={18} className="pv-details-arrow" />
                )}
              </div>
            </button>

            {/* Expandable Details Drawer */}
            {showDetails && (
              <div className="pv-details-expanded-panel">
                <div className="pv-details-divider" />
                <div className="pv-details-grid">
                  <div className="pv-details-item">
                    <span className="pv-item-label">
                      <User size={13} /> আবেদনকারীর নাম
                    </span>
                    <span className="pv-item-value">{displayName}</span>
                  </div>

                  <div className="pv-details-item">
                    <span className="pv-item-label">
                      <Building2 size={13} /> অ্যাকাউন্টের ধরন
                    </span>
                    <span className="pv-item-value">{roleLabel}</span>
                  </div>

                  <div className="pv-details-item">
                    <span className="pv-item-label">
                      <FileText size={13} /> {isHospital ? 'লাইসেন্স নম্বর' : 'বিএমডিসি নম্বর'}
                    </span>
                    <span className="pv-item-value">{licenseNumber}</span>
                  </div>

                  <div className="pv-details-item">
                    <span className="pv-item-label">
                      <Phone size={13} /> মোবাইল নম্বর
                    </span>
                    <span className="pv-item-value">{mobileOrEmail}</span>
                  </div>

                  <div className="pv-details-item pv-item-full">
                    <span className="pv-item-label">
                      <Mail size={13} /> নিবন্ধিত ইমেইল
                    </span>
                    <span className="pv-item-value">{emailAddress}</span>
                  </div>

                  <div className="pv-details-item pv-item-full">
                    <span className="pv-item-label">
                      <AlertCircle size={13} /> বর্তমান অবস্থা
                    </span>
                    <span className="pv-item-value pv-status-badge">
                      যাচাই প্রক্রিয়াধীন (In Review)
                    </span>
                  </div>
                </div>

                {/* Status Refresh Action Inside Details */}
                <div className="pv-refresh-action-row">
                  <button
                    type="button"
                    onClick={handleCheckStatus}
                    disabled={refreshing}
                    className="pv-refresh-submit-btn"
                  >
                    <RefreshCw size={14} className={refreshing ? 'pv-spin-anim' : ''} />
                    <span>{refreshing ? 'চেক হচ্ছে...' : 'স্ট্যাটাস রিফ্রেশ করুন'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ===== BOTTOM HELPLINE / CONTACT SUPPORT CARD ===== */}
        <div className="pv-helpline-card">
          <div className="pv-helpline-left">
            <div className="pv-headset-icon-wrap">
              <Headset size={24} color="#0F172A" />
            </div>
            <div className="pv-helpline-text-group">
              <span className="pv-helpline-query">কোনো সহায়তা প্রয়োজন?</span>
              <span className="pv-helpline-subtext">আমাদের সাথে যোগাযোগ করুন</span>
            </div>
          </div>

          <a href="tel:09613868438" className="pv-call-pill-btn" title="সরাসরি কল করুন">
            <Phone size={14} className="pv-phone-pill-icon" />
            <span>09613868438</span>
          </a>
        </div>

      </div>

      {/* ===== STYLES ===== */}
      <style>{`
        .pv-page-container {
          min-height: calc(100vh - 58px);
          width: 100%;
          background: #F0FDF4;
          background: linear-gradient(180deg, #F0FDF4 0%, #E6F8EE 50%, #F0FDF4 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 24px 16px 90px 16px;
          box-sizing: border-box;
          font-family: 'Inter', 'Hind Siliguri', system-ui, -apple-system, sans-serif;
        }

        .pv-content-wrapper {
          width: 100%;
          max-width: 460px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* Main Card */
        .pv-main-card {
          background: #FFFFFF;
          border-radius: 24px;
          padding: 24px 20px;
          box-shadow: 0 10px 30px rgba(0, 184, 117, 0.08), 0 2px 12px rgba(15, 23, 42, 0.04);
          border: 1px solid rgba(226, 232, 240, 0.85);
          box-sizing: border-box;
        }

        /* Illustration */
        .pv-illustration-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 16px;
        }

        .pv-illustration-img {
          width: 100%;
          max-width: 320px;
          height: auto;
          max-height: 220px;
          object-fit: contain;
          display: block;
        }

        /* Titles */
        .pv-main-title {
          font-size: 20px;
          font-weight: 800;
          color: #0F2942;
          text-align: center;
          margin: 0 0 8px 0;
          line-height: 1.35;
          letter-spacing: -0.3px;
        }

        .pv-main-subtitle {
          font-size: 13.5px;
          color: #475569;
          text-align: center;
          margin: 0 0 24px 0;
          line-height: 1.55;
          font-weight: 500;
        }

        /* Stepper */
        .pv-stepper-box {
          margin-bottom: 22px;
          padding: 0 4px;
        }

        .pv-stepper-track {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          position: relative;
        }

        .pv-step-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 90px;
          z-index: 2;
        }

        .pv-step-icon-circle {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        }

        .pv-node-done {
          background: #00B875;
          color: #FFFFFF;
          box-shadow: 0 4px 10px rgba(0, 184, 117, 0.3);
        }

        .pv-node-active {
          background: #F59E0B;
          color: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2), 0 4px 10px rgba(245, 158, 11, 0.3);
          animation: pvPulseNode 2s infinite ease-in-out;
        }

        @keyframes pvPulseNode {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2), 0 4px 10px rgba(245, 158, 11, 0.3);
          }
          50% {
            box-shadow: 0 0 0 7px rgba(245, 158, 11, 0.28), 0 4px 12px rgba(245, 158, 11, 0.4);
          }
        }

        .pv-node-pending {
          background: #E2E8F0;
          color: #94A3B8;
        }

        .pv-step-text-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 8px;
          text-align: center;
        }

        .pv-step-title {
          font-size: 13px;
          font-weight: 700;
          line-height: 1.25;
        }

        .pv-title-done {
          color: #00B875;
        }

        .pv-title-active {
          color: #D97706;
        }

        .pv-title-pending {
          color: #64748B;
        }

        .pv-step-time-info {
          font-size: 11px;
          color: #64748B;
          margin-top: 2px;
          line-height: 1.3;
          white-space: nowrap;
        }

        .pv-step-connector {
          flex: 1;
          height: 2px;
          margin-top: 16px;
          z-index: 1;
        }

        .pv-connector-done {
          background: #00B875;
        }

        .pv-connector-pending {
          background: repeating-linear-gradient(
            to right,
            #CBD5E1,
            #CBD5E1 5px,
            transparent 5px,
            transparent 9px
          );
        }

        /* Notice Box */
        .pv-notice-box {
          background: #EDFBF4;
          border-radius: 16px;
          padding: 14px 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
          border: 1px solid rgba(0, 184, 117, 0.15);
        }

        .pv-notice-icon-circle {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #DCFCE7;
          color: #00B875;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .pv-notice-content {
          flex: 1;
        }

        .pv-notice-heading {
          font-size: 13.5px;
          font-weight: 700;
          color: #065F46;
          margin: 0 0 3px 0;
          line-height: 1.3;
        }

        .pv-notice-desc {
          font-size: 12px;
          color: #33614B;
          margin: 0;
          line-height: 1.45;
          font-weight: 500;
        }

        /* Accordion Toggle */
        .pv-details-toggle-card {
          border: 1.5px solid #E2E8F0;
          border-radius: 14px;
          background: #FFFFFF;
          overflow: hidden;
          transition: border-color 0.2s;
        }

        .pv-details-toggle-card:hover {
          border-color: #CBD5E1;
        }

        .pv-details-toggle-btn {
          width: 100%;
          background: transparent;
          border: none;
          padding: 13px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          outline: none;
        }

        .pv-details-btn-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pv-details-history-icon {
          color: #0F5132;
        }

        .pv-details-btn-text {
          font-size: 13.5px;
          font-weight: 700;
          color: #0F2942;
        }

        .pv-details-arrow {
          color: #00B875;
          transition: transform 0.2s ease;
        }

        .pv-details-expanded-panel {
          padding: 0 16px 14px 16px;
          animation: pvFadeSlideDown 0.25s ease-out;
        }

        @keyframes pvFadeSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .pv-details-divider {
          height: 1px;
          background: #E2E8F0;
          margin-bottom: 12px;
        }

        .pv-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .pv-details-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .pv-item-full {
          grid-column: 1 / -1;
        }

        .pv-item-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748B;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .pv-item-value {
          font-size: 13px;
          font-weight: 700;
          color: #0F172A;
          word-break: break-word;
        }

        .pv-status-badge {
          color: #D97706;
          display: inline-block;
        }

        .pv-refresh-action-row {
          margin-top: 14px;
          padding-top: 10px;
          border-top: 1px dashed #E2E8F0;
          display: flex;
          justify-content: flex-end;
        }

        .pv-refresh-submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #00B875;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .pv-refresh-submit-btn:hover:not(:disabled) {
          background: #059669;
        }

        .pv-spin-anim {
          animation: pvSpin 0.8s linear infinite;
        }

        @keyframes pvSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Bottom Helpline Card */
        .pv-helpline-card {
          background: #FFFFFF;
          border-radius: 18px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid rgba(226, 232, 240, 0.85);
          box-shadow: 0 4px 16px rgba(0, 184, 117, 0.05), 0 2px 6px rgba(15, 23, 42, 0.03);
          box-sizing: border-box;
        }

        .pv-helpline-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pv-headset-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pv-helpline-text-group {
          display: flex;
          flex-direction: column;
        }

        .pv-helpline-query {
          font-size: 13.5px;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.25;
        }

        .pv-helpline-subtext {
          font-size: 12px;
          color: #64748B;
          margin-top: 1px;
        }

        .pv-call-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #E6F8EE;
          color: #00875A;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 13.5px;
          font-weight: 700;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
          white-space: nowrap;
        }

        .pv-call-pill-btn:hover {
          background: #D1FAE5;
          transform: translateY(-1px);
        }

        .pv-phone-pill-icon {
          color: #00875A;
        }

        /* Responsive adjustments */
        @media (max-width: 991px) {
          .pv-page-container {
            margin-top: 59px !important;
            min-height: calc(100vh - 59px) !important;
            padding: 20px 14px 85px 14px !important;
          }
        }

        @media (max-width: 480px) {
          .pv-page-container {
            margin-top: 58px !important;
            padding: 16px 12px 85px 12px !important;
          }

          .pv-main-card {
            padding: 20px 14px;
            border-radius: 20px;
          }

          .pv-main-title {
            font-size: 18.5px;
          }

          .pv-main-subtitle {
            font-size: 13px;
            margin-bottom: 20px;
          }

          .pv-step-node {
            width: 82px;
          }

          .pv-step-title {
            font-size: 12px;
          }

          .pv-step-time-info {
            font-size: 10px;
          }

          .pv-notice-box {
            padding: 12px 14px;
          }

          .pv-helpline-card {
            padding: 12px 14px;
            border-radius: 16px;
          }

          .pv-helpline-query {
            font-size: 12.5px;
          }

          .pv-call-pill-btn {
            padding: 7px 13px;
            font-size: 12.5px;
          }

          .pv-details-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
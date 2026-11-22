import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom'
import { 
  Stethoscope, 
  Building2, 
  ShieldCheck, 
  ArrowRight, 
  PhoneCall, 
  Phone,
  Check,
  Sparkles
} from 'lucide-react'
import axiosInstance from '../api/axiosInstance'

export default function JoinPartnerLandingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const params = useParams()

  const rawRef = searchParams.get('ref') || params.agentCode || ''
  const cleanRef = rawRef.trim().toUpperCase()

  const [agentData, setAgentData] = useState(null)
  const [loadingAgent, setLoadingAgent] = useState(false)

  // 1. Persist referral code to localStorage and Cookie for 30 days
  useEffect(() => {
    if (cleanRef) {
      try {
        localStorage.setItem('doctorbooklet_agent_ref', cleanRef)
        localStorage.setItem('doctorbooklet_agent_ref_time', Date.now().toString())
        document.cookie = `agent_ref=${cleanRef}; path=/; max-age=2592000; SameSite=Lax`
      } catch (e) {
        console.warn('Could not store agent ref:', e)
      }

      // Fetch agent public info
      setLoadingAgent(true)
      axiosInstance.get(`/public/partner/${cleanRef}`)
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setAgentData(res.data.data)
          }
        })
        .catch((err) => {
          console.warn('Agent public lookup failed:', err)
        })
        .finally(() => setLoadingAgent(false))
    }
  }, [cleanRef])

  const handleSelectRole = (role) => {
    const targetUrl = role === 'hospital' 
      ? `/register/hospital${cleanRef ? `?ref=${cleanRef}` : ''}`
      : `/register/doctor${cleanRef ? `?ref=${cleanRef}` : ''}`
    navigate(targetUrl)
  }

  return (
    <div className="join-page-wrapper">
      <style>{`
        .join-page-wrapper {
          min-height: 100vh;
          background: radial-gradient(circle at 50% 0%, #D1FAE5 0%, #ECFDF5 25%, #F0FDF4 55%, #F8FAFC 100%);
          display: flex;
          flex-direction: column;
          position: relative;
          overflow-x: hidden;
        }

        /* ── Ambient Background Lighting ── */
        .join-ambient-glow-1 {
          position: absolute;
          top: 60px;
          left: -80px;
          width: 260px;
          height: 260px;
          border-radius: 50%;
          background: rgba(0, 184, 117, 0.18);
          filter: blur(70px);
          pointer-events: none;
        }
        .join-ambient-glow-2 {
          position: absolute;
          top: 180px;
          right: -80px;
          width: 240px;
          height: 240px;
          border-radius: 50%;
          background: rgba(2, 132, 199, 0.15);
          filter: blur(70px);
          pointer-events: none;
        }

        .join-header {
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
          padding: 12px 20px;
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .join-header-inner {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .join-brand-link {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }
        .join-brand-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: linear-gradient(135deg, #00B875 0%, #0284c7 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0, 184, 117, 0.25);
        }
        .join-brand-title {
          font-size: 16px;
          font-weight: 900;
          color: #0F172A;
          letter-spacing: -0.02em;
          display: block;
          line-height: 1.1;
        }
        .join-helpline-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          color: #065F46;
          background: #FFFFFF;
          border: 1px solid #A7F3D0;
          padding: 5px 12px;
          border-radius: 20px;
          text-decoration: none;
          flex-shrink: 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .join-main {
          max-width: 490px;
          width: 100%;
          margin: 0 auto;
          padding: 24px 16px 48px;
          box-sizing: border-box;
          flex: 1;
          position: relative;
          z-index: 1;
        }

        /* ── Unified Frosted Portal Card ── */
        .join-portal-card {
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1.5px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 16px 40px -10px rgba(0, 184, 117, 0.14), 0 2px 8px rgba(0, 0, 0, 0.04);
          padding: 20px 18px 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          overflow: hidden;
        }
        .join-card-accent-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #00B875 0%, #0284c7 100%);
        }

        /* ── Embedded Agent Profile Bar ── */
        .join-agent-box {
          background: linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 65%, #F8FAFC 100%);
          border: 1.5px solid #A7F3D0;
          border-radius: 18px;
          padding: 11px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          box-shadow: 0 2px 8px rgba(0, 184, 117, 0.05);
        }
        .join-agent-left {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
          flex: 1;
        }
        .join-agent-avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .join-agent-avatar {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: #ECFDF5;
          color: #00B875;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
          font-weight: 900;
          border: 2px solid #00B875;
          box-shadow: 0 3px 8px rgba(0, 184, 117, 0.2);
        }
        .join-agent-verified-badge {
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: #00B875;
          border: 2px solid #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .join-agent-meta {
          min-width: 0;
          flex: 1;
        }
        .join-agent-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 9.5px;
          font-weight: 800;
          color: #059669;
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          padding: 2px 7px;
          border-radius: 12px;
          margin-bottom: 2px;
          white-space: nowrap;
        }
        .join-agent-title {
          font-size: 15px;
          font-weight: 900;
          color: #0F172A;
          margin: 0;
          line-height: 1.25;
          word-break: break-word;
        }
        .join-agent-call-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #FFFFFF;
          border: 1.5px solid #00B875;
          color: #065F46;
          padding: 6px 12px;
          border-radius: 20px;
          text-decoration: none;
          font-size: 11.5px;
          font-weight: 800;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.15s ease;
          box-shadow: 0 2px 6px rgba(0, 184, 117, 0.12);
        }
        .join-agent-call-btn:hover {
          background: #00B875;
          color: #FFFFFF;
        }

        /* ── Section Title ── */
        .join-heading-wrap {
          text-align: center;
          padding: 2px 0 0;
        }
        .join-heading {
          font-size: 18.5px;
          font-weight: 900;
          color: #0F172A;
          margin: 0 0 3px;
          letter-spacing: -0.02em;
        }
        .join-heading-sub {
          font-size: 12px;
          color: #64748B;
          margin: 0;
        }

        /* ── Themed Role Cards ── */
        .join-roles-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .join-role-card {
          border-radius: 18px;
          padding: 15px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 14px;
          text-align: left;
        }
        .join-role-card.doctor {
          background: linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%);
          border: 1.5px solid #86EFAC;
          box-shadow: 0 4px 14px rgba(0, 184, 117, 0.08);
        }
        .join-role-card.doctor:hover {
          background: #DCFCE7;
          border-color: #00B875;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 184, 117, 0.18);
        }

        .join-role-card.hospital {
          background: linear-gradient(135deg, #FFFFFF 0%, #F0F9FF 100%);
          border: 1.5px solid #93C5FD;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.08);
        }
        .join-role-card.hospital:hover {
          background: #E0F2FE;
          border-color: #0284c7;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(2, 132, 199, 0.18);
        }

        .join-role-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          flex-shrink: 0;
        }
        .join-role-icon.doctor {
          background: linear-gradient(135deg, #00B875 0%, #059669 100%);
          box-shadow: 0 4px 12px rgba(0, 184, 117, 0.32);
        }
        .join-role-icon.hospital {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.32);
        }

        .join-role-content {
          flex: 1;
          min-width: 0;
        }
        .join-role-title {
          font-size: 16px;
          font-weight: 900;
          color: #0F172A;
          margin: 0;
          line-height: 1.25;
        }
        .join-role-desc {
          font-size: 12px;
          color: #475569;
          margin: 3px 0 0;
          line-height: 1.35;
        }

        /* ── Modern Circular Action Arrows ── */
        .join-role-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: #FFFFFF;
          transition: transform 0.2s ease;
        }
        .join-role-card.doctor .join-role-arrow {
          background: linear-gradient(135deg, #00B875 0%, #059669 100%);
          box-shadow: 0 2px 8px rgba(0, 184, 117, 0.35);
        }
        .join-role-card.hospital .join-role-arrow {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.35);
        }
        .join-role-card:hover .join-role-arrow {
          transform: translateX(3px);
        }

        /* ── Reassuring Trust Pill & Footer ── */
        .join-card-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding-top: 6px;
          border-top: 1px dashed #E2E8F0;
        }
        .join-trust-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          color: #065F46;
          background: #ECFDF5;
          padding: 3px 10px;
          border-radius: 20px;
        }
        .join-login-row {
          font-size: 12.5px;
          color: #64748B;
        }
        .join-login-link {
          color: #00B875;
          font-weight: 800;
          text-decoration: none;
          margin-left: 6px;
        }
        .join-login-link:hover {
          text-decoration: underline;
        }

        /* ── Mobile Viewports (< 640px) ── */
        @media screen and (max-width: 640px) {
          .join-header {
            padding: 10px 14px !important;
          }
          .join-main {
            padding: 16px 14px calc(40px + env(safe-area-inset-bottom, 0px)) !important;
          }
          .join-portal-card {
            border-radius: 22px !important;
            padding: 18px 14px 14px !important;
            gap: 14px !important;
          }
          .join-agent-box {
            padding: 10px 12px !important;
          }
          .join-agent-avatar {
            width: 44px !important;
            height: 44px !important;
            font-size: 18px !important;
          }
          .join-agent-title {
            font-size: 14.5px !important;
          }
          .join-heading {
            font-size: 17px !important;
          }
          .join-role-card {
            padding: 13px 14px !important;
          }
          .join-role-icon {
            width: 44px !important;
            height: 44px !important;
          }
          .join-role-title {
            font-size: 15px !important;
          }
          .join-role-desc {
            font-size: 11.5px !important;
          }
        }
      `}</style>
      
      {/* ── Ambient Background Glows ── */}
      <div className="join-ambient-glow-1" />
      <div className="join-ambient-glow-2" />

      {/* ── Top Header Bar ── */}
      <header className="join-header">
        <div className="join-header-inner">
          <Link to="/" className="join-brand-link">
            <div className="join-brand-icon">
              <Stethoscope size={18} />
            </div>
            <span className="join-brand-title">
              DOCTOR<span style={{ color: '#00B875' }}>BOOKLET</span>
            </span>
          </Link>

          <a href="tel:01310123123" className="join-helpline-btn">
            <PhoneCall size={12} color="#059669" />
            <span>01310-123123</span>
          </a>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="join-main">

        {/* ── Unified Portal Card ── */}
        <div className="join-portal-card">
          <div className="join-card-accent-bar" />

          {/* Embedded Agent Profile Bar */}
          <div className="join-agent-box">
            <div className="join-agent-left">
              <div className="join-agent-avatar-wrap">
                <div className="join-agent-avatar">
                  {agentData?.photo ? (
                    <img src={agentData.photo} alt={agentData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>{agentData?.name ? agentData.name.charAt(0).toUpperCase() : (cleanRef ? 'A' : 'P')}</span>
                  )}
                </div>
                <div className="join-agent-verified-badge">
                  <Check size={9} strokeWidth={3.5} color="#FFFFFF" />
                </div>
              </div>

              <div className="join-agent-meta">
                <div className="join-agent-badge">
                  <ShieldCheck size={11} color="#059669" />
                  <span>ভেরিফাইড ফিল্ড পার্টনার</span>
                </div>
                <h1 className="join-agent-title">
                  {agentData?.name || (cleanRef ? 'ফিল্ড পার্টনার প্রতিনিধি' : 'ডক্টরবুকলেট পার্টনার')}
                </h1>
              </div>
            </div>

            {agentData?.phone && (
              <a
                href={`tel:${agentData.phone}`}
                className="join-agent-call-btn"
                title={`সরাসরি কল করুন: ${agentData.phone}`}
              >
                <Phone size={12} color="#00B875" />
                <span>কল</span>
              </a>
            )}
          </div>

          {/* Section Heading inside Unified Card */}
          <div className="join-heading-wrap">
            <h2 className="join-heading">
              যুক্ত হতে নির্বাচন করুন
            </h2>
            <p className="join-heading-sub">
              আপনার প্রোফাইল অনুযায়ী যেকোনো একটি অপশন বেছে নিন
            </p>
          </div>

          {/* Connected Themed Role Cards */}
          <div className="join-roles-grid">
            
            {/* Card 1: Doctor (Themed Mint BG) */}
            <div 
              onClick={() => handleSelectRole('doctor')}
              className="join-role-card doctor"
            >
              <div className="join-role-icon doctor">
                <Stethoscope size={24} />
              </div>
              <div className="join-role-content">
                <h3 className="join-role-title">চিকিৎসক (Doctor)</h3>
                <p className="join-role-desc">চেম্বার ও রোগী সিরিয়াল ম্যানেজমেন্ট</p>
              </div>
              <div className="join-role-arrow">
                <ArrowRight size={16} strokeWidth={2.5} />
              </div>
            </div>

            {/* Card 2: Hospital (Themed Sky Blue BG) */}
            <div 
              onClick={() => handleSelectRole('hospital')}
              className="join-role-card hospital"
            >
              <div className="join-role-icon hospital">
                <Building2 size={24} />
              </div>
              <div className="join-role-content">
                <h3 className="join-role-title">হাসপাতাল ও ক্লিনিক</h3>
                <p className="join-role-desc">বেড, কেবিন ও বিশেষজ্ঞ ডাক্তার তালিকা</p>
              </div>
              <div className="join-role-arrow">
                <ArrowRight size={16} strokeWidth={2.5} />
              </div>
            </div>

          </div>

          {/* Trust Badge & Login Footer */}
          <div className="join-card-footer">
            <div className="join-trust-pill">
              <ShieldCheck size={13} color="#059669" />
              <span>১০০% নিরাপদ ও অফিসিয়াল প্ল্যাটফর্ম</span>
            </div>
            <div className="join-login-row">
              <span>অলরেডি অ্যাকাউন্ট আছে?</span>
              <Link to="/login" className="join-login-link">
                লগইন করুন
              </Link>
            </div>
          </div>

        </div>

      </main>
    </div>
  )
}

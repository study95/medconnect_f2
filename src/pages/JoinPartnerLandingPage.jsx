import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom'
import { 
  Stethoscope, 
  Building2, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  PhoneCall, 
  Phone,
  Globe, 
  Award, 
  User, 
  Check, 
  Lock,
  ChevronRight,
  Info
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F0FDF4 0%, #F8FAFC 50%, #FFFFFF 100%)' }}>
      <style>{`
        @media (min-width: 640px) {
          .hero-subtext {
            white-space: nowrap !important;
          }
        }
      `}</style>
      
      {/* ── Top Header Bar ── */}
      <header style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '14px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{
          maxWidth: 1040,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Brand Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #00B875 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0, 184, 117, 0.25)'
            }}>
              <Stethoscope size={22} />
            </div>
            <div>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', display: 'block', lineHeight: 1.1 }}>
                DOCTOR<span style={{ color: '#00B875' }}>BOOKLET</span>
              </span>
              <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600, letterSpacing: '0.04em' }}>
                DIGITAL HEALTHCARE NETWORK
              </span>
            </div>
          </Link>

          {/* Quick Helpline */}
          <a
            href="tel:01310123123"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 700,
              color: '#065F46',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              padding: '6px 12px',
              borderRadius: 20,
              textDecoration: 'none'
            }}
          >
            <PhoneCall size={13} color="#059669" />
            <span>হেল্পলাইন: 01310-123123</span>
          </a>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '36px 20px 64px' }}>

        {/* ── Agent Attribution Welcome Banner ── */}
        <div style={{
          background: 'linear-gradient(135deg, #064E3B 0%, #047857 50%, #0D9488 100%)',
          borderRadius: 24,
          padding: '28px 26px',
          color: '#FFFFFF',
          marginBottom: 36,
          boxShadow: '0 12px 30px -8px rgba(6, 78, 59, 0.35)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background Decorative Rings */}
          <div style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            pointerEvents: 'none'
          }} />

          <div style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              {/* Agent Photo or Avatar with Verified Ring */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  color: '#064E3B',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  fontWeight: 900,
                  border: '3.5px solid rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
                }}>
                  {agentData?.photo ? (
                    <img src={agentData.photo} alt={agentData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>{agentData?.name ? agentData.name.charAt(0).toUpperCase() : (cleanRef ? 'A' : 'P')}</span>
                  )}
                </div>
                {/* Verified Green Badge on Photo */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#10B981',
                  border: '2px solid #FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}>
                  <Check size={12} strokeWidth={3.5} color="#FFFFFF" />
                </div>
              </div>

              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 6,
                  color: '#A7F3D0'
                }}>
                  <ShieldCheck size={13} color="#6EE7B7" />
                  <span>অনুমোদিত ফিল্ড পার্টনার • ভেরিফাইড আইডি</span>
                </div>

                <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 3px', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                  {agentData?.name || (cleanRef ? 'ফিল্ড পার্টনার প্রতিনিধি' : 'ডক্টরবুকলেট পার্টনার নেটওয়ার্ক')}
                </h1>
                
                <p className="hero-subtext" style={{ margin: '0 0 8px', fontSize: 13, opacity: 0.9, lineHeight: 1.4 }}>
                  আপনার প্র্যাকটিস বা স্বাস্থ্যসেবা প্রতিষ্ঠানকে ডিজিটালাইজড করতে সরাসরি এই পোর্টালে যুক্ত হোন।
                </p>

                {/* Agent Contact Call Pill */}
                {agentData?.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    <a
                      href={`tel:${agentData.phone}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        background: 'rgba(255, 255, 255, 0.16)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: 20,
                        padding: '4px 12px 4px 10px',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                        fontSize: 12,
                        fontWeight: 700,
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.26)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)' }}
                      title="এজেন্টকে সরাসরি কল করুন"
                    >
                      <Phone size={13} color="#6EE7B7" />
                      <span>সহায়তার জন্য যোগাযোগ: <strong>{agentData.phone}</strong></span>
                      <span style={{
                        fontSize: 10,
                        background: '#10B981',
                        color: '#FFFFFF',
                        padding: '1px 6px',
                        borderRadius: 10,
                        marginLeft: 2,
                        fontWeight: 800
                      }}>
                        কল করুন
                      </span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Agent Code Chip */}
            {cleanRef && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                borderRadius: 16,
                padding: '12px 20px',
                textAlign: 'right',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
              }}>
                <div style={{ fontSize: 11, color: '#A7F3D0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  রেফারেল কোড (সক্রিয়)
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'monospace', color: '#FFFFFF', letterSpacing: '0.06em', marginTop: 2 }}>
                  {cleanRef}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Selection Section Title ── */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
            আপনি কী হিসেবে যুক্ত হতে চান?
          </h2>
          <p style={{ fontSize: 14, color: '#64748B', margin: '6px 0 0' }}>
            নিচের যেকোনো একটি অপশন নির্বাচন করে আপনার সেলফ-অনবোর্ডিং বা রেজিস্ট্রেশন সম্পন্ন করুন।
          </p>
        </div>

        {/* ── Two Big Choice Cards ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          marginBottom: 40
        }}>
          
          {/* ════ Card 1: Doctor Registration ════ */}
          <div 
            onClick={() => handleSelectRole('doctor')}
            style={{
              background: '#FFFFFF',
              borderRadius: 24,
              border: '2px solid #E2E8F0',
              padding: '32px 28px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#00B875'
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 16px 32px -8px rgba(0, 184, 117, 0.18)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E2E8F0'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div>
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #00B875 0%, #059669 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 18px rgba(0, 184, 117, 0.3)'
                }}>
                  <Stethoscope size={28} />
                </div>
                <span style={{
                  background: '#ECFDF5',
                  color: '#059669',
                  border: '1px solid #A7F3D0',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 11.5,
                  fontWeight: 800
                }}>
                  চিকিৎসক অনবোর্ডিং
                </span>
              </div>

              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: '0 0 8px' }}>
                আমি একজন চিকিৎসক (Doctor)
              </h3>
              <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.5, margin: '0 0 20px' }}>
                ডিজিটাল চেম্বার পরিচালনা, প্রেসক্রিপশন তৈরি এবং রোগীদের অনলাইন অ্যাপয়েন্টমেন্ট শিডিউলিং।
              </p>

              {/* Feature Points */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 26 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#334155' }}>
                  <CheckCircle2 size={16} color="#00B875" style={{ flexShrink: 0 }} />
                  <span>বিএমডিসি (BMDC) ভেরিফাইড প্রোফাইল ও সনদ যাচাই</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#334155' }}>
                  <CheckCircle2 size={16} color="#00B875" style={{ flexShrink: 0 }} />
                  <span>স্মার্ট চেম্বার সিরিয়াল ও এসএমএস নোটিফিকেশন</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#334155' }}>
                  <CheckCircle2 size={16} color="#00B875" style={{ flexShrink: 0 }} />
                  <span>ডিজিটাল প্রেসক্রিপশন ও রোগীর প্রেসক্রিপশন হিস্ট্রি</span>
                </div>
              </div>
            </div>

            {/* Action CTA Button */}
            <button
              type="button"
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: 14,
                border: 'none',
                background: '#00B875',
                color: '#FFFFFF',
                fontSize: 14.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(0, 184, 117, 0.3)',
                transition: 'background 0.15s ease'
              }}
            >
              <span>ডাক্তার হিসেবে যুক্ত হোন</span>
              <ArrowRight size={17} />
            </button>
          </div>

          {/* ════ Card 2: Hospital / Clinic Registration ════ */}
          <div 
            onClick={() => handleSelectRole('hospital')}
            style={{
              background: '#FFFFFF',
              borderRadius: 24,
              border: '2px solid #E2E8F0',
              padding: '32px 28px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#0284c7'
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 16px 32px -8px rgba(2, 132, 199, 0.18)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E2E8F0'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div>
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 18px rgba(2, 132, 199, 0.3)'
                }}>
                  <Building2 size={28} />
                </div>
                <span style={{
                  background: '#F0F9FF',
                  color: '#0284c7',
                  border: '1px solid #BAE6FD',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 11.5,
                  fontWeight: 800
                }}>
                  প্রতিষ্ঠান অনবোর্ডিং
                </span>
              </div>

              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: '0 0 8px' }}>
                হাসপাতাল / ক্লিনিক / ডায়াগনস্টিক
              </h3>
              <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.5, margin: '0 0 20px' }}>
                আইসিইউ, কেবিন, টেস্ট বুকিং এবং হাসপাতালের সকল বিশেষজ্ঞ চিকিৎসকের তালিকা পরিচালনা।
              </p>

              {/* Feature Points */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 26 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#334155' }}>
                  <CheckCircle2 size={16} color="#0284c7" style={{ flexShrink: 0 }} />
                  <span>ডিজিএইচএস (DGHS) লাইসেন্স ও ট্রেড সনদ যাচাই</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#334155' }}>
                  <CheckCircle2 size={16} color="#0284c7" style={{ flexShrink: 0 }} />
                  <span>রিয়েল-টাইম বেড, কেবিন ও আইসিইউ ম্যানেজমেন্ট</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#334155' }}>
                  <CheckCircle2 size={16} color="#0284c7" style={{ flexShrink: 0 }} />
                  <span>ডায়াগনস্টিক টেস্ট প্যাকেজ ও কেন্দ্রীয় ড্যাশবোর্ড</span>
                </div>
              </div>
            </div>

            {/* Action CTA Button */}
            <button
              type="button"
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: 14,
                border: 'none',
                background: '#0284c7',
                color: '#FFFFFF',
                fontSize: 14.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                transition: 'background 0.15s ease'
              }}
            >
              <span>হাসপাতাল হিসেবে যুক্ত হোন</span>
              <ArrowRight size={17} />
            </button>
          </div>

        </div>

        {/* ── Trust & Support Footer Box ── */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669'
            }}>
              <Award size={20} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                সম্পূর্ণ ফ্রি অনবোর্ডিং ও ডেডিকেটেড সাপোর্ট
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                রেজিস্ট্রেশন করতে কোনো হিডেন ফি নেই। ফিল্ড পার্টনার সহায়তা প্রদান করবেন।
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 12, color: '#64748B' }}>
              অলরেডি অ্যাকাউন্ট আছে?
            </span>
            <Link
              to="/login"
              style={{
                fontSize: 12.5,
                fontWeight: 800,
                color: '#00B875',
                textDecoration: 'none',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                padding: '6px 14px',
                borderRadius: 10
              }}
            >
              লগইন করুন
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}

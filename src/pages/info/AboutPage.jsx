import { useState, useEffect } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { getContent } from '../../utils/contentService'
import BreadcrumbHUD from '../../components/common/BreadcrumbHUD'
import { useTheme } from '../../context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  Lock,
  Zap,
  Building2,
  Target,
  Compass,
  Sparkles,
  Search,
  ArrowRight,
  HeartPulse,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Monitor,
  Users,
  Smartphone,
  Server,
  FileText,
  BadgeCheck,
  Stethoscope,
  TrendingUp,
  MapPin,
  HelpCircle,
  CalendarCheck,
  HeartHandshake,
  Headphones
} from 'lucide-react'

// ─── Inline Keyframe & Enterprise Responsive Styles ───────────────────────────
const ABOUT_STYLES = `
  @keyframes about-glow {
    0%, 100% { opacity: 0.35; transform: scale(1); }
    50%      { opacity: 0.65; transform: scale(1.08); }
  }

  .about-hero-section {
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, #012B1E 0%, #034D36 45%, #00875A 100%);
    padding: 38px 0 52px;
    margin-bottom: 0;
  }
  .about-hero-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 80% 25%, rgba(0, 184, 117, 0.28) 0%, transparent 55%),
      radial-gradient(circle at 10% 85%, rgba(255, 255, 255, 0.08) 0%, transparent 45%),
      radial-gradient(circle at 50% 50%, rgba(2, 43, 30, 0.4) 0%, transparent 70%);
    pointer-events: none;
  }
  .about-hero-grid-pattern {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 32px 32px;
    pointer-events: none;
  }

  .about-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.14);
    color: #DCFCE7;
    font-size: 12px;
    font-weight: 800;
    padding: 6px 16px;
    border-radius: 99px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 16px;
    border: 1px solid rgba(255, 255, 255, 0.22);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .about-hero-title {
    font-size: clamp(28px, 4.6vw, 48px);
    font-weight: 900;
    color: #FFFFFF;
    letter-spacing: -0.5px;
    line-height: 1.2;
    margin-bottom: 16px;
  }

  .about-hero-desc {
    font-size: clamp(14.5px, 1.8vw, 17px);
    color: rgba(255, 255, 255, 0.9);
    font-weight: 450;
    line-height: 1.7;
    max-width: 680px;
    margin: 0 auto;
  }

  .about-stat-card {
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.22);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-radius: 16px;
    padding: 18px 14px;
    text-align: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    height: 100%;
  }
  .about-stat-card:hover {
    background: rgba(255, 255, 255, 0.18);
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.35);
  }
  .about-stat-number {
    font-size: clamp(24px, 3.2vw, 34px);
    font-weight: 900;
    color: #FFFFFF;
    letter-spacing: -0.5px;
    line-height: 1.1;
    margin-bottom: 4px;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  .about-stat-label {
    font-size: 11.5px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.88);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* ── SECTION BADGES & HEADINGS ── */
  .about-section-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #F0FDF4;
    color: #00875A;
    font-size: 11.5px;
    font-weight: 800;
    padding: 5px 14px;
    border-radius: 99px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 12px;
    border: 1px solid #DCFCE7;
  }
  .about-section-badge .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #00B875;
  }

  .about-section-heading {
    font-size: clamp(22px, 3vw, 32px);
    font-weight: 900;
    color: var(--mc-text, #0F172A);
    letter-spacing: -0.5px;
    line-height: 1.25;
    margin-bottom: 12px;
  }

  .about-card-box {
    background: var(--mc-white, #FFFFFF);
    border: 1px solid var(--mc-border, #E2E8F0);
    border-radius: 20px;
    padding: 32px 28px;
    height: 100%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    transition: all 0.3s ease;
  }

  /* ── VISION & MISSION DUAL CARDS ── */
  .about-vision-card {
    background: #FFFFFF;
    border-radius: 20px;
    padding: 32px 28px;
    border: 1.5px solid #E2E8F0;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.04);
    height: 100%;
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .about-vision-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 14px 32px rgba(0, 184, 117, 0.12);
    border-color: #00B875;
  }
  .about-vision-card.mission {
    border-top: 5px solid #00B875;
  }
  .about-vision-card.vision {
    border-top: 5px solid #0284C7;
  }

  /* ── ECOSYSTEM PILLARS ── */
  .about-eco-card {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 18px;
    padding: 24px 20px;
    height: 100%;
    transition: all 0.3s ease;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  }
  .about-eco-card:hover {
    transform: translateY(-4px);
    border-color: #00B875;
    box-shadow: 0 10px 24px rgba(0, 184, 117, 0.1);
  }

  /* ── STEP CARDS ── */
  .about-step-card {
    background: #FFFFFF;
    border: 1.5px solid #E2E8F0;
    border-radius: 18px;
    padding: 28px 22px;
    height: 100%;
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
  }
  .about-step-card:hover {
    transform: translateY(-4px);
    border-color: #00B875;
    box-shadow: 0 12px 28px rgba(0, 184, 117, 0.12);
  }
  .about-step-num {
    font-size: 28px;
    font-weight: 900;
    color: #E2E8F0;
    position: absolute;
    top: 20px;
    right: 22px;
    line-height: 1;
    font-family: 'Hind Siliguri', sans-serif;
  }
  .about-step-card:hover .about-step-num {
    color: #A7F3D0;
  }

  /* ── TRUST & ARCHITECTURAL PILLARS ── */
  .about-pillar-card {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 16px;
    padding: 22px 18px;
    height: 100%;
    transition: all 0.25s ease;
  }
  .about-pillar-card:hover {
    border-color: #00B875;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
  }

  /* ── GUARANTEE CARDS ── */
  .about-guarantee-card {
    background: #FFFFFF;
    border: 1.5px solid #E2E8F0;
    border-radius: 16px;
    padding: 22px 18px;
    height: 100%;
    transition: all 0.25s ease;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  }
  .about-guarantee-card:hover {
    border-color: #00B875;
    transform: translateY(-3px);
    box-shadow: 0 10px 22px rgba(0, 184, 117, 0.09);
  }

  /* ── SMART CTA SECTION & MOCKUP ── */
  .about-cta-section {
    background: linear-gradient(135deg, #012B1E 0%, #034D36 45%, #00875A 100%);
    border-radius: 24px;
    padding: 38px 36px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 16px 40px rgba(0, 184, 117, 0.22);
    border: 1.5px solid rgba(255, 255, 255, 0.2);
    color: #FFFFFF;
  }
  .about-cta-orb-1 {
    position: absolute;
    top: -60px; right: -60px;
    width: 280px; height: 280px;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }
  .about-cta-orb-2 {
    position: absolute;
    bottom: -60px; left: -40px;
    width: 260px; height: 260px;
    background: radial-gradient(circle, rgba(0, 184, 117, 0.3) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }
  .about-cta-grid-bg {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
  }
  .about-cta-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    padding: 5px 14px;
    border-radius: 99px;
    font-size: 11.5px;
    font-weight: 800;
    color: #DCFCE7;
    margin-bottom: 12px;
    border: 1px solid rgba(255, 255, 255, 0.22);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .about-cta-title {
    font-size: clamp(24px, 3.6vw, 36px);
    font-weight: 900;
    color: #FFFFFF;
    letter-spacing: -0.5px;
    line-height: 1.25;
    margin-bottom: 12px;
  }
  .about-cta-desc {
    font-size: 14.5px;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 450;
    line-height: 1.65;
    margin-bottom: 18px;
    max-width: 580px;
  }
  .about-cta-check-list {
    display: flex;
    flex-direction: column;
    gap: 9px;
    margin-bottom: 6px;
  }
  .about-cta-check-item {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 13px;
    font-weight: 600;
    color: #DCFCE7;
  }
  .about-cta-card-wrap {
    display: flex;
    flex-direction: column;
  }
  .about-cta-mockup-card {
    background: #FFFFFF;
    border-radius: 18px;
    padding: 18px 20px;
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.24);
    border: 1px solid rgba(255, 255, 255, 0.9);
    position: relative;
    z-index: 2;
    transition: transform 0.3s ease;
  }
  .about-cta-mockup-card:hover {
    transform: translateY(-2px);
  }
  .about-cta-live-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #00B875;
    box-shadow: 0 0 0 3px rgba(0, 184, 117, 0.25);
    animation: about-glow 2s infinite ease-in-out;
  }
  .about-cta-buttons-container {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 14px;
    width: 100%;
  }
  .about-cta-btn {
    background: #FFFFFF;
    color: #012B1E;
    border: none;
    border-radius: 12px;
    padding: 12px 20px;
    font-size: 13.5px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.25s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    flex: 1;
    white-space: nowrap;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  }
  .about-cta-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
    background: #F0FDF4;
    color: #00875A;
  }
  .about-cta-btn-outline {
    background: rgba(255, 255, 255, 0.14);
    color: #FFFFFF;
    border: 1.5px solid rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-radius: 12px;
    padding: 11px 18px;
    font-size: 13.5px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.25s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    white-space: nowrap;
  }
  .about-cta-btn-outline:hover {
    background: rgba(255, 255, 255, 0.24);
    border-color: #FFFFFF;
    transform: translateY(-2px);
  }

  /* ── MOBILE SPECIFIC REFINEMENTS ── */
  @media (max-width: 768px) {
    .about-hero-section {
      padding: 24px 0 40px;
      text-align: center;
    }
    .about-hero-title {
      font-size: 24px !important;
      line-height: 1.3 !important;
      margin-bottom: 10px !important;
    }
    .about-hero-desc {
      font-size: 13px !important;
      line-height: 1.6 !important;
    }
    .about-stat-card {
      padding: 12px 8px !important;
      border-radius: 13px !important;
    }
    .about-stat-number {
      font-size: 21px !important;
    }
    .about-stat-label {
      font-size: 9.5px !important;
    }
    .about-card-box {
      padding: 20px 16px !important;
      border-radius: 16px !important;
    }
    .about-vision-card {
      padding: 22px 18px !important;
      border-radius: 16px !important;
    }
    .about-eco-card {
      padding: 18px 14px !important;
      border-radius: 14px !important;
    }
    .about-step-card {
      padding: 20px 16px !important;
      border-radius: 14px !important;
    }
    .about-step-num {
      font-size: 24px !important;
      top: 16px !important;
      right: 16px !important;
    }
    .about-pillar-card {
      padding: 16px 14px !important;
      border-radius: 14px !important;
    }
    .about-guarantee-card {
      padding: 16px 14px !important;
      border-radius: 14px !important;
    }
    .about-cta-section {
      padding: 24px 16px !important;
      border-radius: 18px !important;
      text-align: center;
    }
    .about-cta-title {
      font-size: 21px !important;
      line-height: 1.3 !important;
    }
    .about-cta-desc {
      font-size: 12.5px !important;
      line-height: 1.55 !important;
      margin: 0 auto 14px !important;
    }
    .about-cta-check-list {
      align-items: center !important;
      margin-bottom: 16px !important;
    }
    .about-cta-buttons-container {
      flex-direction: column !important;
      gap: 8px !important;
    }
    .about-cta-btn, .about-cta-btn-outline {
      width: 100% !important;
      padding: 11px 14px !important;
    }
  }
`

export default function AboutPage() {
  const [data, setData] = useState(getContent())

  useEffect(() => {
    const handleUpdate = () => setData(getContent())
    window.addEventListener('cms-updated', handleUpdate)
    return () => window.removeEventListener('cms-updated', handleUpdate)
  }, [])

  const { theme } = useTheme()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const lang = i18n.language
  const isEn = lang === 'en'

  const content = data[lang]?.about_us || data['en']?.about_us || data.about_us || {}

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: 60 }}>
      {/* Inline Styles */}
      <style>{ABOUT_STYLES}</style>

      {/* ═══════════════════════════════════════════════════
          1. ENTERPRISE HERO SECTION
      ═══════════════════════════════════════════════════ */}
      <div className="about-hero-section">
        <div className="about-hero-grid-pattern" />
        <BreadcrumbHUD links={[{ label: isEn ? 'About Platform' : 'আমাদের পরিচিতি ও লক্ষ্য' }]} variant="light" />

        <Container style={{ position: 'relative', zIndex: 2, marginTop: 12 }}>
          <div className="text-center">
            <div className="about-hero-badge">
              <Sparkles size={14} color="#34D399" />
              <span>{content.badge || (isEn ? 'Enterprise Digital Health Platform' : 'আধুনিক ডিজিটাল স্বাস্থ্যসেবা প্ল্যাটফর্ম')}</span>
            </div>

            <h1 className="about-hero-title">
              {content.title || (isEn ? 'Bridging Patients & Specialists with Trust & Technology' : 'স্বাস্থ্যসেবায় উদ্ভাবন, আস্থা ও প্রযুক্তির সমন্বয়')}
            </h1>

            <p className="about-hero-desc">
              {content.subtitle || (isEn
                ? 'Doctor Booklet is an enterprise-grade digital healthcare infrastructure in Bangladesh — eliminating waiting queues, connecting verified medical specialists, and providing seamless outpatient scheduling across all 64 districts.'
                : 'Doctor Booklet আধুনিক প্রযুক্তি ও মানবিক সেবার সমন্বয়ে তৈরি একটি উন্নত ডিজিটাল স্বাস্থ্যসেবা প্ল্যাটফর্ম — যা হাসপাতাল ও ডাক্তারের সাথে রোগীর সরাসরি নির্ভরযোগ্য সংযোগ স্থাপন করে সিরিয়ালের দীর্ঘ অপেক্ষা ও জটিলতা দূর করে।')}
            </p>
          </div>

          {/* Key Platform Impact Stats Grid */}
          <Row className="g-2 g-md-3 justify-content-center" style={{ marginTop: 28 }}>
            {[
              { num: content.stat_doctors || '১,০০০+', label: isEn ? 'Verified Specialists' : 'যাচাইকৃত বিশেষজ্ঞ ডাক্তার' },
              { num: content.stat_hospitals || '২০০+', label: isEn ? 'Partner Facilities' : 'পার্টনার হাসপাতাল ও চেম্বার' },
              { num: content.stat_patients || '৫০,০০০+', label: isEn ? 'Appointments Completed' : 'সফল সিরিয়াল ও সেবা' },
              { num: content.stat_coverage || '৬৪ জেলা', label: isEn ? 'Countrywide Coverage' : 'দেশব্যাপী ডিজিটাল সেবা' },
            ].map((s, i) => (
              <Col xs={6} md={3} key={i}>
                <div className="about-stat-card">
                  <div className="about-stat-number">{s.num}</div>
                  <div className="about-stat-label">{s.label}</div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </div>

      {/* ═══════════════════════════════════════════════════
          2. CORPORATE OVERVIEW / THE PROBLEM WE SOLVE
      ═══════════════════════════════════════════════════ */}
      <Container style={{ marginTop: 44, marginBottom: 44 }}>
        <div className="about-card-box">
          <Row className="align-items-center g-4">
            <Col lg={7}>
              <div>
                <div className="about-section-badge">
                  <span className="dot" />
                  {isEn ? 'Our Purpose' : 'আমাদের পরিচিতি ও উদ্দেশ্য'}
                </div>
                <h2 className="about-section-heading">
                  {content.story_title || (isEn ? 'Transforming Outpatient Care from Chaos to Clarity' : 'চিরাচরিত ভোগান্তি দূর করে স্বাস্থ্যসেবায় নতুন দিগন্ত')}
                </h2>
                <p style={{ fontSize: 14.5, color: '#475569', lineHeight: 1.75, fontWeight: 450, marginBottom: 14 }}>
                  {content.story_desc || (isEn
                    ? 'In the traditional healthcare landscape, scheduling a doctor appointment often involves hours of waiting at crowded counters, uncertainty about slot times, and lack of verified doctor information.'
                    : 'ঐতিহ্যগত চিকিৎসা ব্যবস্থাপনায় ডাক্তারের সিরিয়াল নেওয়া মানেই ছিল ভোরে লাইনে দাঁড়ানো, দীর্ঘ ঘণ্টার অপেক্ষা, চেম্বারে ভিড় এবং কখন ডাক্তার দেখবেন সেই অনিশ্চয়তা। Doctor Booklet এই চিরাচরিত চিত্রকে বদলে দিতে প্রযুক্তির মেলবন্ধন ঘটিয়েছে।')}
                </p>
                <p style={{ fontSize: 14.5, color: '#475569', lineHeight: 1.75, fontWeight: 450, marginBottom: 20 }}>
                  {isEn
                    ? 'Doctor Booklet replaces manual paper notebooks and unorganized queue systems with an enterprise-grade digital ecosystem. Patients get live token tracking, transparent chamber timings, and verified credentials, while clinics enjoy fully automated OPD workflows.'
                    : 'আমরা কাগজের নোটবুক ও বিশৃঙ্খল সিরিয়াল সিস্টেমের পরিবর্তে নিয়ে এসেছি রিয়েল-টাইম ক্লাউড প্ল্যাটফর্ম। এখানে রোগীরা ঘরে বসেই লাইভ সিরিয়াল দেখতে পান, ডাক্তারগণ সুশৃঙ্খলভাবে রোগী দেখতে পারেন এবং হাসপাতালগুলো ডিজিটাল ডিসপ্লে ও ওপিডি সফটওয়্যারের মাধ্যমে উন্নত সেবা প্রদান করতে পারে।'}
                </p>

                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                    <CheckCircle2 size={16} color="#00B875" />
                    <span>{isEn ? 'Real-Time Serial Queue' : 'রিয়েল-টাইম লাইভ সিরিয়াল'}</span>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                    <CheckCircle2 size={16} color="#00B875" />
                    <span>{isEn ? '100% BMDC Verified Doctors' : 'বিএমডিসি যাচাইকৃত বিশেষজ্ঞ'}</span>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                    <CheckCircle2 size={16} color="#00B875" />
                    <span>{isEn ? 'Zero Counter Congestion' : 'কাউন্টারে দীর্ঘ লাইনমুক্ত'}</span>
                  </div>
                </div>
              </div>
            </Col>

            <Col lg={5}>
              <div style={{
                background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                borderRadius: 18,
                padding: '28px 24px',
                border: '1.5px solid #BBF7D0',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#00B875', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(0, 184, 117, 0.3)' }}>
                    <HeartPulse size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#064E3B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ডিজিটাল অঙ্গীকার</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#064E3B', lineHeight: 1.2 }}>রোগীর সময় ও আস্থার মূল্য</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '12px 14px', border: '1px solid #DCFCE7', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Clock size={18} color="#00B875" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>গড়ে ৭০% অপেক্ষার সময় হ্রাস</span>
                  </div>
                  <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '12px 14px', border: '1px solid #DCFCE7', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Smartphone size={18} color="#00B875" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>এসএমএস ও ডিজিটাল সিরিয়াল টিকিট</span>
                  </div>
                  <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '12px 14px', border: '1px solid #DCFCE7', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Monitor size={18} color="#00B875" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>ওয়েটিং রুম ডিসপ্লে বোর্ড সংযোগ</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Container>

      {/* ═══════════════════════════════════════════════════
          3. DEDICATED MISSION & VISION SHOWCASE
      ═══════════════════════════════════════════════════ */}
      <Container style={{ marginBottom: 44 }}>
        <div className="text-center" style={{ marginBottom: 26 }}>
          <div className="about-section-badge">
            <span className="dot" />
            {isEn ? 'Guiding Principles' : 'আমাদের দৃষ্টিভঙ্গি ও লক্ষ্য'}
          </div>
          <h2 className="about-section-heading" style={{ margin: 0 }}>
            {isEn ? 'Mission & Vision Defining Our Future' : 'আমাদের মিশন ও ভিশন'}
          </h2>
          <p style={{ fontSize: 14.5, color: '#64748B', maxWidth: 540, margin: '6px auto 0', lineHeight: 1.6 }}>
            {isEn
              ? 'Anchoring every engineering standard and clinical partnership to bring world-class healthcare within reach.'
              : 'প্রতিটি প্রযুক্তিগত উন্নয়ন ও অংশীদারিত্বের মূল অনুপ্রেরণা — যা কোটি মানুষের সুস্বাস্থ্য নিশ্চিত করতে আমাদের পথ দেখায়।'}
          </p>
        </div>

        <Row className="g-4 align-items-stretch">
          {/* ── CARD 1: OUR MISSION ── */}
          <Col lg={6}>
            <div className="about-vision-card mission">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: '#F0FDF4', color: '#00B875', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1.5px solid #DCFCE7', boxShadow: '0 4px 12px rgba(0, 184, 117, 0.12)' }}>
                  <Target size={26} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#00B875', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {isEn ? 'Our Mission' : 'আমাদের মিশন'}
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>
                    {content.mission_title || (isEn ? 'Accessible & Time-Definite Healthcare' : 'সহজলভ্য, স্বচ্ছ ও সময়সাশ্রয়ী চিকিৎসা সেবা')}
                  </h3>
                </div>
              </div>

              <p style={{ fontSize: 14.5, color: '#475569', lineHeight: 1.8, fontWeight: 450, marginBottom: 20 }}>
                {content.mission_desc || content.mission || (isEn
                  ? 'To dismantle every friction point between patients and trusted healthcare providers through verified scheduling, real-time queue intelligence, and transparent outpatient coordination.'
                  : 'প্রযুক্তির সর্বোচ্চ উৎকর্ষ কাজে লাগিয়ে বাংলাদেশের প্রতিটি নাগরিকের কাছে বিশেষজ্ঞ চিকিৎসা সেবা সহজলভ্য ও সময়সাশ্রয়ী করা — সিরিয়ালের দীর্ঘ অপেক্ষা ও বিভ্রান্তি দূর করে হাসপাতাল ও ডাক্তারের সাথে রোগীর সরাসরি নির্ভরযোগ্য ডিজিটাল সংযোগ স্থাপন করা।')}
              </p>

              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>মিশনের মূল ৩টি স্তম্ভ:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#334155' }}>
                    <CheckCircle2 size={16} color="#00B875" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span><strong>তথ্যের যথার্থতা:</strong> শতভাগ নিবন্ধিত ডাক্তার ও নির্ভরযোগ্য ফি তালিকা।</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#334155' }}>
                    <CheckCircle2 size={16} color="#00B875" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span><strong>স্মার্ট শিডিউলিং:</strong> ডিজিটাল টোকেন ও লাইভ সিরিয়াল মনিটরিং।</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#00B875' }}>
                    <CheckCircle2 size={16} color="#00B875" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ color: '#334155' }}><strong>রোগী-কেন্দ্রিক সেবা:</strong> ২৪/৭ হেল্পলাইন ও সহজ ইউজার এক্সপেরিয়েন্স।</span>
                  </div>
                </div>
              </div>
            </div>
          </Col>

          {/* ── CARD 2: OUR VISION ── */}
          <Col lg={6}>
            <div className="about-vision-card vision">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: '#F0F9FF', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1.5px solid #BAE6FD', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.12)' }}>
                  <Compass size={26} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {isEn ? 'Our Vision' : 'আমাদের ভিশন'}
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>
                    {content.vision_title || (isEn ? 'National Health Infrastructure of Choice' : 'বাংলাদেশের সর্বজনীন ডিজিটাল স্বাস্থ্য ইকোসিস্টেম')}
                  </h3>
                </div>
              </div>

              <p style={{ fontSize: 14.5, color: '#475569', lineHeight: 1.8, fontWeight: 450, marginBottom: 20 }}>
                {content.vision_desc || content.vision || (isEn
                  ? 'To become the benchmark digital health infrastructure across Bangladesh — establishing a future where every citizen, regardless of geographical barriers, accesses specialized clinical care with dignity and transparency.'
                  : 'একটি সর্বজনীন, ক্যাশলেস ও পেপারলেস স্বাস্থ্যসেবা পরিকাঠামো গড়ে তোলা — যেখানে দেশের প্রত্যন্ত অঞ্চল থেকে শুরু করে মহানগর পর্যন্ত প্রতিটি নাগরিক তাৎক্ষণিক বিশেষজ্ঞ পরামর্শ, ডিজিটাল প্রেসক্রিপশন ও হাসপাতাল বুকিং সুবিধা পাবেন পরম সম্মানের সাথে।')}
              </p>

              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>ভিশনের ভবিষ্যৎ রূপরেখা:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#334155' }}>
                    <CheckCircle2 size={16} color="#0284C7" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span><strong>সর্বজনীন বিস্তার:</strong> বাংলাদেশের ৮টি বিভাগের সকল ৬৪ জেলায় পূর্ণাঙ্গ নেটওয়ার্ক।</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#334155' }}>
                    <CheckCircle2 size={16} color="#0284C7" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span><strong>স্মার্ট ওপিডি অটোমেশন:</strong> হাসপাতাল ক্লিনিক ও চেম্বারের ১০০% পেপারলেস কিউ।</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#334155' }}>
                    <CheckCircle2 size={16} color="#0284C7" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span><strong>নিরাপদ সেন্ট্রাল রেকর্ড:</strong> রোগীর ব্যক্তিগত তথ্যের এন্ড-টু-এন্ড সুরক্ষা।</span>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* ═══════════════════════════════════════════════════
          4. THE DOCTOR BOOKLET PLATFORM ECOSYSTEM
      ═══════════════════════════════════════════════════ */}
      <div style={{ background: '#FFFFFF', padding: '48px 0', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', marginBottom: 44 }}>
        <Container>
          <div className="text-center" style={{ marginBottom: 30 }}>
            <div className="about-section-badge">
              <span className="dot" />
              {isEn ? 'Platform Ecosystem' : 'প্ল্যাটফর্ম ইকোসিস্টেম'}
            </div>
            <h2 className="about-section-heading" style={{ margin: 0 }}>
              {isEn ? 'Comprehensive Solutions for the Healthcare Community' : 'সবার জন্য তৈরি এক সমন্বিত ডিজিটাল পরিকাঠামো'}
            </h2>
            <p style={{ fontSize: 14.5, color: '#64748B', maxWidth: 560, margin: '8px auto 0', lineHeight: 1.6 }}>
              {isEn
                ? 'Empowering patients, consulting doctors, and healthcare institutions through synchronized digital modules.'
                : 'রোগী, বিশেষজ্ঞ চিকিৎসক ও হাসপাতাল — প্রতিটি পক্ষের সর্বোচ্চ সুবিধা নিশ্চিতে আমাদের ৪টি মূল মডিউল।'}
            </p>
          </div>

          <Row className="g-3 g-md-4">
            {/* Pillar 1: For Patients */}
            <Col xs={12} sm={6} lg={3}>
              <div className="about-eco-card">
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F0FDF4', color: '#00B875', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: '1px solid #DCFCE7' }}>
                  <Smartphone size={22} />
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>রোগীদের জন্য</h4>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                  তাৎক্ষণিক সিরিয়াল বুকিং, ঘরে বসেই লাইভ সিরিয়াল ট্র্যাকিং, এসএমএস আপডেট ও ডিজিটাল প্রেসক্রিপশন সংরক্ষণ।
                </p>
              </div>
            </Col>

            {/* Pillar 2: For Doctors */}
            <Col xs={12} sm={6} lg={3}>
              <div className="about-eco-card">
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: '1px solid #DBEAFE' }}>
                  <Stethoscope size={22} />
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>ডাক্তারদের জন্য</h4>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                  স্মার্ট চেম্বার শিডিউলিং, পেশেন্ট সিরিয়াল ম্যানেজমেন্ট, ছুটির ক্যালেন্ডার নিয়ন্ত্রণ ও ক্লিনিক্যাল প্রোফাইল।
                </p>
              </div>
            </Col>

            {/* Pillar 3: For Hospitals */}
            <Col xs={12} sm={6} lg={3}>
              <div className="about-eco-card">
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: '1px solid #DDD6FE' }}>
                  <Building2 size={22} />
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>হাসপাতাল ও ক্লিনিক</h4>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                  সেন্ট্রালাইজড ওপিডি কাউন্টার সমন্বয়, একাধিক ডাক্তারের সিরিয়াল হ্যান্ডলিং ও দৈনিক রিপোর্ট ম্যানেজমেন্ট।
                </p>
              </div>
            </Col>

            {/* Pillar 4: Public Display Board */}
            <Col xs={12} sm={6} lg={3}>
              <div className="about-eco-card">
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: '1px solid #FDE68A' }}>
                  <Monitor size={22} />
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>লাইভ ডিসপ্লে বোর্ড</h4>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                  ওয়েটিং রুমে রিয়েল-টাইম টিভি মনিটর ডিসপ্লে, লাইভ টোকেন কলিং ও রোগীদের জন্য নিখুঁত সিরিয়াল নোটিস।
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* ═══════════════════════════════════════════════════
          5. CREDENTIAL VERIFICATION & DATA SECURITY PILLARS
      ═══════════════════════════════════════════════════ */}
      <Container style={{ marginBottom: 44 }}>
        <div className="text-center" style={{ marginBottom: 26 }}>
          <div className="about-section-badge">
            <span className="dot" />
            {isEn ? 'Trust & Security' : 'নির্ভরযোগ্যতা ও নিরাপত্তা পরিকাঠামো'}
          </div>
          <h2 className="about-section-heading" style={{ margin: 0 }}>
            {isEn ? 'Engineered with Strict Clinical & Security Standards' : 'নিরাপত্তা ও নৈতিকতার সর্বোচ্চ মান'}
          </h2>
          <p style={{ fontSize: 14.5, color: '#64748B', maxWidth: 540, margin: '6px auto 0', lineHeight: 1.6 }}>
            {isEn
              ? 'We prioritize patient data confidentiality, credential authentication, and platform uptime above all.'
              : 'রোগীর তথ্যের শতভাগ গোপনীয়তা এবং প্রকৃত ডাক্তারের সনদপত্র যাচাইকরণের সুদৃঢ় প্রতিশ্রুতি।'}
          </p>
        </div>

        <Row className="g-3 g-md-4">
          <Col md={6} lg={3}>
            <div className="about-pillar-card">
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F0FDF4', color: '#00B875', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, border: '1px solid #DCFCE7' }}>
                <BadgeCheck size={20} />
              </div>
              <h4 style={{ fontSize: 15.5, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>বিএমডিসি নিবন্ধন যাচাই</h4>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                প্ল্যাটফর্মে তালিকাভুক্তির পূর্বে প্রতিটি চিকিৎসকের সক্রিয় বিএমডিসি রেজিস্ট্রেশন ও ডিগ্রি যাচাই করা হয়।
              </p>
            </div>
          </Col>

          <Col md={6} lg={3}>
            <div className="about-pillar-card">
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, border: '1px solid #DBEAFE' }}>
                <Lock size={20} />
              </div>
              <h4 style={{ fontSize: 15.5, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>ডেটা এনক্রিপশন (SSL)</h4>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                আধুনিক ২৫৬-বিট এসএসএল/টিএলএস এনক্রিপশনের মাধ্যমে রোগীর প্রতিটি অ্যাপয়েন্টমেন্ট ও তথ্য সুরক্ষিত থাকে।
              </p>
            </div>
          </Col>

          <Col md={6} lg={3}>
            <div className="about-pillar-card">
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, border: '1px solid #FEE2E2' }}>
                <ShieldCheck size={20} />
              </div>
              <h4 style={{ fontSize: 15.5, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>জিরো স্প্যাম ও প্রাইভেসি</h4>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                রোগীর ব্যক্তিগত মোবাইল নম্বর বা প্রেসক্রিপশন কোনো তৃতীয় পক্ষের কাছে শেয়ার বা বাণিজ্যিক কাজে ব্যবহৃত হয় না।
              </p>
            </div>
          </Col>

          <Col md={6} lg={3}>
            <div className="about-pillar-card">
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FAF5FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, border: '1px solid #F3E8FF' }}>
                <Server size={20} />
              </div>
              <h4 style={{ fontSize: 15.5, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>৯৯.৯% ক্লাউড আপটাইম</h4>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                সার্বক্ষণিক সক্রিয় হাই-পারফরম্যান্স সার্ভার অবকাঠামো, যা যেকোনো জরুরি মুহূর্তে তাৎক্ষণিক বুকিং নিশ্চিত করে।
              </p>
            </div>
          </Col>
        </Row>
      </Container>

      {/* ═══════════════════════════════════════════════════
          6A. COMPARISON: TRADITIONAL VS DOCTOR BOOKLET
      ═══════════════════════════════════════════════════ */}
      <Container style={{ marginBottom: 44 }}>
        <div className="about-card-box" style={{ background: '#FFFFFF', padding: '36px 30px' }}>
          <div className="text-center" style={{ marginBottom: 30 }}>
            <div className="about-section-badge">
              <span className="dot" />
              {isEn ? 'Value Comparison' : 'পার্থক্য ও শ্রেষ্ঠত্ব'}
            </div>
            <h2 className="about-section-heading" style={{ margin: 0 }}>
              {isEn ? 'The Traditional Way vs. The Doctor Booklet Standard' : 'চিরাচরিত ভোগান্তি বনাম Doctor Booklet-এর স্মার্ট সমাধান'}
            </h2>
            <p style={{ fontSize: 14.5, color: '#64748B', maxWidth: 600, margin: '8px auto 0', lineHeight: 1.6 }}>
              {isEn
                ? 'See how our digital workflows eliminate outpatient friction, uncertainty, and hours of wasted waiting time.'
                : 'প্রথাগত পদ্ধতির অনিশ্চয়তা দূর করে আমরা তৈরি করেছি এক নির্ভরযোগ্য, স্বচ্ছ ও ঝামেলাহীন স্বাস্থ্যসেবা পরিকাঠামো।'}
            </p>
          </div>

          <Row className="g-4 align-items-stretch">
            {/* Left: Traditional Way */}
            <Col lg={6}>
              <div style={{
                background: '#FFF5F5',
                border: '1.5px solid #FED7D7',
                borderRadius: 18,
                padding: '24px 22px',
                height: '100%'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #FEB2B2' }}>
                  <XCircle size={24} color="#E53E3E" />
                  <div>
                    <h4 style={{ fontSize: 17, fontWeight: 900, color: '#9B2C2C', margin: 0 }}>প্রথাগত / চিরাচরিত পদ্ধতি</h4>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#C53030' }}>অনিশ্চয়তা, দীর্ঘ লাইন ও সময় অপচয়</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <XCircle size={17} color="#E53E3E" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13.5, color: '#742A2A', lineHeight: 1.5, fontWeight: 500 }}>
                      ভোরে চেম্বার বা হাসপাতালে গিয়ে দীর্ঘ লাইনে দাঁড়িয়ে সিরিয়াল নেওয়ার শারীরিক ক্লান্তি
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <XCircle size={17} color="#E53E3E" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13.5, color: '#742A2A', lineHeight: 1.5, fontWeight: 500 }}>
                      ডাক্তার কখন চেম্বারে ঢুকবেন বা কখন সিরিয়াল আসবে সে বিষয়ে ঘণ্টার পর ঘণ্টা অনিশ্চয়তা
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <XCircle size={17} color="#E53E3E" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13.5, color: '#742A2A', lineHeight: 1.5, fontWeight: 500 }}>
                      ভিড়ের মধ্যে ওয়েটিং রুমে বসার জায়গা না পাওয়া এবং অস্বস্তিকর পরিবেশের ভোগান্তি
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <XCircle size={17} color="#E53E3E" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13.5, color: '#742A2A', lineHeight: 1.5, fontWeight: 500 }}>
                      কাগজের প্রেসক্রিপশন হারিয়ে যাওয়া বা পূর্ববর্তী কোনো মেডিকেল রেকর্ডের ডিজিটাল হিস্ট্রি না থাকা
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <XCircle size={17} color="#E53E3E" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13.5, color: '#742A2A', lineHeight: 1.5, fontWeight: 500 }}>
                      ডাক্তারের ফি, ডিগ্রি ও চেম্বার শিডিউল সম্পর্কে নির্ভরযোগ্য স্বচ্ছ তথ্যের অভাব
                    </span>
                  </div>
                </div>
              </div>
            </Col>

            {/* Right: Doctor Booklet Smart Way */}
            <Col lg={6}>
              <div style={{
                background: '#F0FDF4',
                border: '1.5px solid #BBF7D0',
                borderRadius: 18,
                padding: '24px 22px',
                height: '100%',
                boxShadow: '0 4px 18px rgba(0, 184, 117, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #A7F3D0' }}>
                  <CheckCircle2 size={24} color="#00B875" />
                  <div>
                    <h4 style={{ fontSize: 17, fontWeight: 900, color: '#064E3B', margin: 0 }}>Doctor Booklet স্মার্ট সমাধান</h4>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#00875A' }}>ঘরে বসেই নিশ্চিত, দ্রুত ও নির্ভরযোগ্য সেবা</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={17} color="#00B875" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13.5, color: '#064E3B', lineHeight: 1.5, fontWeight: 600 }}>
                      ঘরে বা কর্মস্থলে বসেই মোবাইল থেকে ১ ক্লিকে সুবিধাজনক তারিখ ও সময় নির্বাচন করে সিরিয়াল বুকিং
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={17} color="#00B875" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13.5, color: '#064E3B', lineHeight: 1.5, fontWeight: 600 }}>
                      রিয়েল-টাইম লাইভ সিরিয়াল ট্র্যাকিং — মোবাইল স্ক্রিনেই বর্তমান রানিং সিরিয়াল দেখার স্বচ্ছতা
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={17} color="#00B875" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13.5, color: '#064E3B', lineHeight: 1.5, fontWeight: 600 }}>
                      সিরিয়াল আসার নির্ধারিত সময়ে চেম্বারে সরাসরি আগমন, ফলে ঘণ্টার পর ঘণ্টা দীর্ঘ অপেক্ষার অবসান
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={17} color="#00B875" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13.5, color: '#064E3B', lineHeight: 1.5, fontWeight: 600 }}>
                      প্রোফাইলে আজীবন ডিজিটাল হেলথ কার্ড, অ্যাপয়েন্টমেন্ট হিস্ট্রি ও প্রেসক্রিপশন ডাউনলোড সুবিধা
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={17} color="#00B875" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13.5, color: '#064E3B', lineHeight: 1.5, fontWeight: 600 }}>
                      শতভাগ বিএমডিসি সনদ যাচাইকৃত ডাক্তার প্রোফাইল, প্রকৃত ডিগ্রি ও সম্পূর্ণ উন্মুক্ত ভিজিট ফি
                    </span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Container>

      {/* ═══════════════════════════════════════════════════
          6B. HOW IT WORKS: 3 SIMPLE STEPS
      ═══════════════════════════════════════════════════ */}
      <div style={{ background: '#FFFFFF', padding: '48px 0', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', marginBottom: 44 }}>
        <Container>
          <div className="text-center" style={{ marginBottom: 30 }}>
            <div className="about-section-badge">
              <span className="dot" />
              {isEn ? 'Simple 3-Step Process' : 'সহজ কর্মপ্রক্রিয়া'}
            </div>
            <h2 className="about-section-heading" style={{ margin: 0 }}>
              {isEn ? 'How to Book & Consult in 3 Easy Steps' : 'সহজ ৩টি ধাপে আপনার কাঙ্ক্ষিত ডাক্তারের সিরিয়াল'}
            </h2>
            <p style={{ fontSize: 14.5, color: '#64748B', maxWidth: 560, margin: '8px auto 0', lineHeight: 1.6 }}>
              {isEn
                ? 'Designed for simplicity so anyone can schedule an appointment and track consultation in seconds.'
                : 'কোনো জটিলতা ছাড়াই যেকোনো স্মার্টফোন থেকে মুহূর্তেই সিরিয়াল নিশ্চিত করুন এবং সময়মতো চিকিৎসা সেবা গ্রহণ করুন।'}
            </p>
          </div>

          <Row className="g-3 g-md-4">
            {/* Step 1 */}
            <Col md={4}>
              <div className="about-step-card">
                <span className="about-step-num">০১</span>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F0FDF4', color: '#00B875', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: '1px solid #DCFCE7' }}>
                  <Search size={22} />
                </div>
                <h4 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>বিশেষজ্ঞ ও হাসপাতাল সন্ধান</h4>
                <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.65, margin: 0, fontWeight: 450 }}>
                  আপনার এলাকা, বিভাগ বা রোগের লক্ষণ অনুযায়ী যাচাইকৃত বিশেষজ্ঞ ডাক্তার বা পছন্দের হাসপাতাল নির্বাচন করুন। ডাক্তারের যোগ্যতা ও ফি যাচাই করুন।
                </p>
              </div>
            </Col>

            {/* Step 2 */}
            <Col md={4}>
              <div className="about-step-card">
                <span className="about-step-num">০২</span>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: '1px solid #DBEAFE' }}>
                  <CalendarCheck size={22} />
                </div>
                <h4 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>তাৎক্ষণিক সিরিয়াল বুকিং</h4>
                <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.65, margin: 0, fontWeight: 450 }}>
                  সুবিধাজনক তারিখ ও উপলব্ধ চেম্বার সময় বেছে নিয়ে ১ ক্লিকে সিরিয়াল কনফার্ম করুন। আপনার মোবাইলে সাথে সাথে ডিজিটাল সিরিয়াল টিকিট ও এসএমএস পৌঁছে যাবে।
                </p>
              </div>
            </Col>

            {/* Step 3 */}
            <Col md={4}>
              <div className="about-step-card">
                <span className="about-step-num">০৩</span>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FAF5FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: '1px solid #F3E8FF' }}>
                  <Activity size={22} />
                </div>
                <h4 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>লাইভ ট্র্যাকিং ও চিকিৎসা</h4>
                <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.65, margin: 0, fontWeight: 450 }}>
                  ঘরে বসেই মোবাইলে বর্তমান রানিং সিরিয়াল লাইভ ট্র্যাক করুন। সিরিয়াল আসার ঠিক পূর্ব মুহূর্তে চেম্বারে পৌঁছে স্বাচ্ছন্দ্যে ডাক্তারের পরামর্শ গ্রহণ করুন।
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* ═══════════════════════════════════════════════════
          6C. OUR CORE COMMITMENTS & GUARANTEES
      ═══════════════════════════════════════════════════ */}
      <Container style={{ marginBottom: 44 }}>
        <div className="text-center" style={{ marginBottom: 28 }}>
          <div className="about-section-badge">
            <span className="dot" />
            {isEn ? 'Core Commitments' : 'আমাদের মূল অঙ্গীকার'}
          </div>
          <h2 className="about-section-heading" style={{ margin: 0 }}>
            {isEn ? 'Our Unwavering Promises to Every Patient & Partner' : 'স্বাস্থ্যসেবায় আমাদের অপরিবর্তনীয় ৪টি নীতি'}
          </h2>
          <p style={{ fontSize: 14.5, color: '#64748B', maxWidth: 540, margin: '8px auto 0', lineHeight: 1.6 }}>
            {isEn
              ? 'Our operational standards are rooted in medical ethics, transparency, and relentless dedication to healthcare excellence.'
              : 'যে মৌলিক নীতি ও অঙ্গীকারগুলোর ওপর ভিত্তি করে পরিচালিত হয় Doctor Booklet-এর প্রতিটি সেবা ও কার্যক্রম।'}
          </p>
        </div>

        <Row className="g-3 g-md-4">
          <Col md={6} lg={3}>
            <div className="about-guarantee-card">
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#F0FDF4', color: '#00B875', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, border: '1px solid #DCFCE7' }}>
                <Clock size={20} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>রোগীর সময় ও মর্যাদা</h4>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                সিরিয়ালের দীর্ঘ অনিশ্চয়তা দূর করে রোগীর প্রতিটি মুহূর্তের সময়ের সর্বোচ্চ মূল্যায়ন ও মর্যাদা নিশ্চিত করা আমাদের প্রধান দায়িত্ব।
              </p>
            </div>
          </Col>

          <Col md={6} lg={3}>
            <div className="about-guarantee-card">
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, border: '1px solid #DBEAFE' }}>
                <ShieldCheck size={20} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>শতভাগ তথ্যের স্বচ্ছতা</h4>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                কোনো প্রকার গোপনীয় বা অতিরিক্ত চার্জ নেই। ডাক্তার ও হাসপাতালের যাচাইকৃত তথ্য ও আসল ফি সবসময় উন্মুক্ত রাখা হয়।
              </p>
            </div>
          </Col>

          <Col md={6} lg={3}>
            <div className="about-guarantee-card">
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#FAF5FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, border: '1px solid #F3E8FF' }}>
                <Lock size={20} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>ডেটা নিরাপত্তা ও সুরক্ষা</h4>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                রোগীর ব্যক্তিগত স্বাস্থ্য তথ্য ও প্রেসক্রিপশন সম্পূর্ণ সুরক্ষিত, যা কখনোই কোনো বাণিজ্যিক প্রচারণায় তৃতীয় পক্ষের সাথে শেয়ার করা হয় না।
              </p>
            </div>
          </Col>

          <Col md={6} lg={3}>
            <div className="about-guarantee-card">
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, border: '1px solid #FDE68A' }}>
                <HeartHandshake size={20} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>সার্বক্ষণিক নিবেদিত সহায়তা</h4>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                অ্যাপয়েন্টমেন্ট বাতিল, রিফান্ড বা যেকোনো সমস্যায় রোগী ও ডাক্তারের সহায়তায় আমাদের পেশাদার কাস্টমার সাপোর্ট টিম সর্বদা প্রস্তুত।
              </p>
            </div>
          </Col>
        </Row>
      </Container>

      {/* ═══════════════════════════════════════════════════
          7. ENTERPRISE SMART CTA SECTION
      ═══════════════════════════════════════════════════ */}
      <Container style={{ marginBottom: 20 }}>
        <div className="about-cta-section">
          {/* Ambient Lighting Orbs */}
          <div className="about-cta-orb-1" />
          <div className="about-cta-orb-2" />
          <div className="about-cta-grid-bg" />

          <Row className="align-items-center g-4" style={{ position: 'relative', zIndex: 3 }}>
            {/* Left Content */}
            <Col lg={7}>
              <div className="about-cta-badge">
                <Sparkles size={14} color="#34D399" />
                <span>আজই শুরু করুন • ডিজিটাল স্বাস্থ্যসেবা</span>
              </div>

              <h2 className="about-cta-title">
                {isEn ? 'Step into the Future of Smart Healthcare' : 'স্মার্ট স্বাস্থ্যসেবার আধুনিক অভিজ্ঞতায় যুক্ত হোন'}
              </h2>

              <p className="about-cta-desc">
                {isEn
                  ? 'Say goodbye to long counter queues and uncertain wait times. Book verified specialists, receive instant digital tokens, and track consultation schedules live from anywhere.'
                  : 'দীর্ঘ লাইনে দাঁড়িয়ে সময় ও শ্রম নষ্ট করার দিন শেষ। ঘরে বসেই নিশ্চিত করুন বিশেষজ্ঞ ডাক্তারের সিরিয়াল এবং রিয়েল-টাইমে ট্র্যাক করুন আপনার চেম্বার শিডিউল।'}
              </p>

              {/* 3 Value Checkpoints */}
              <div className="about-cta-check-list">
                <div className="about-cta-check-item">
                  <CheckCircle2 size={16} color="#34D399" />
                  <span>কোনো বাড়তি বুকিং ফি নেই</span>
                </div>
                <div className="about-cta-check-item">
                  <CheckCircle2 size={16} color="#34D399" />
                  <span>লাইভ সিরিয়াল ট্র্যাকিং ও এসএমএস অ্যালার্ট</span>
                </div>
                <div className="about-cta-check-item">
                  <CheckCircle2 size={16} color="#34D399" />
                  <span>১০০% বিএমডিসি সনদ যাচাইকৃত ডাক্তার</span>
                </div>
              </div>
            </Col>

            {/* Right Interactive Mockup + Actions */}
            <Col lg={5}>
              <div className="about-cta-card-wrap">
                {/* Live Serial Tracker Card Mockup */}
                <div className="about-cta-mockup-card">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="about-cta-live-dot" />
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#00B875', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        লাইভ সিরিয়াল ট্র্যাকিং
                      </span>
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 800, background: '#F0FDF4', color: '#00B875', padding: '2px 8px', borderRadius: 6, border: '1px solid #DCFCE7' }}>
                      সক্রিয় সেশন
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F0FDF4', color: '#00B875', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, border: '1px solid #DCFCE7', flexShrink: 0 }}>
                      <Stethoscope size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        ডাঃ ফারহানা আহমেদ
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>মেডিসিন ও হৃদরোগ বিশেষজ্ঞ</div>
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '10px 8px', border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, textAlign: 'center', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 9.5, color: '#64748B', fontWeight: 700 }}>আপনার সিরিয়াল</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#00B875' }}>#১২</div>
                    </div>
                    <div style={{ borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 9.5, color: '#64748B', fontWeight: 700 }}>বর্তমান রানিং</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#0284C7' }}>#০৯</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9.5, color: '#64748B', fontWeight: 700 }}>আনুমানিক অপেক্ষা</div>
                      <div style={{ fontSize: 13.5, fontWeight: 900, color: '#D97706' }}>~১৫ মিনিট</div>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div style={{ width: '100%', height: 5, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: '75%', height: '100%', background: 'linear-gradient(90deg, #00B875 0%, #34D399 100%)', borderRadius: 99 }} />
                  </div>
                </div>

                {/* Smart Action Buttons */}
                <div className="about-cta-buttons-container">
                  <button className="about-cta-btn" onClick={() => navigate('/doctors')}>
                    <Search size={16} />
                    <span>ডাক্তার খুঁজুন ও সিরিয়াল নিন</span>
                  </button>
                  <button className="about-cta-btn-outline" onClick={() => navigate('/support')}>
                    <Headphones size={16} />
                    <span>২৪/৭ হেল্পডেস্ক</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Container>
    </div>
  )
}

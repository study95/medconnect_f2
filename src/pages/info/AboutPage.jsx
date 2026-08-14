import { useState } from 'react'
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
  Award,
  FileCheck,
  Globe,
  Handshake,
  MapPin,
  Calendar,
  Headphones,
  TrendingUp,
  Target,
  Sparkles,
  Search,
  ArrowRight,
  BadgeCheck,
  HeartPulse,
  Activity,
  CheckCircle2,
  UserCheck
} from 'lucide-react'

// ─── Inline Keyframe & Responsive Styles ──────────────────────────────────────
const ABOUT_STYLES = `
  @keyframes about-fade-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes about-pulse-ring {
    0%   { transform: scale(0.95); opacity: 0.7; }
    50%  { transform: scale(1.2); opacity: 0.25; }
    100% { transform: scale(0.95); opacity: 0.7; }
  }
  @keyframes about-float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-6px); }
  }

  .about-hero-section {
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, #02382B 0%, #064E3B 45%, #00B875 100%);
    padding: 36px 0 48px;
    margin-bottom: 0;
  }
  .about-hero-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 85% 20%, rgba(0, 184, 117, 0.25) 0%, transparent 50%),
      radial-gradient(circle at 15% 85%, rgba(255, 255, 255, 0.08) 0%, transparent 45%);
    pointer-events: none;
  }

  .about-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.15);
    color: white;
    font-size: 12px;
    font-weight: 800;
    padding: 5px 14px;
    border-radius: 99px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 16px;
    border: 1px solid rgba(255,255,255,0.25);
    backdrop-filter: blur(8px);
  }

  .about-hero-title {
    font-size: clamp(26px, 4.5vw, 52px);
    font-weight: 900;
    color: #fff;
    letter-spacing: -1px;
    line-height: 1.15;
    margin-bottom: 16px;
  }

  .about-hero-desc {
    font-size: clamp(14.5px, 1.8vw, 17px);
    color: rgba(255,255,255,0.88);
    font-weight: 500;
    line-height: 1.65;
    max-width: 560px;
    margin-bottom: 0;
  }

  .about-stat-card {
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.22);
    backdrop-filter: blur(12px);
    border-radius: 16px;
    padding: 18px 14px;
    text-align: center;
    transition: all 0.3s ease;
    height: 100%;
  }
  .about-stat-card:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-3px);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.15);
  }
  .about-stat-number {
    font-size: clamp(22px, 3vw, 32px);
    font-weight: 900;
    color: #fff;
    letter-spacing: -0.5px;
    line-height: 1.1;
    margin-bottom: 4px;
  }
  .about-stat-label {
    font-size: 11.5px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.85);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .about-section-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #F0FDF4;
    color: #00B875;
    font-size: 11px;
    font-weight: 800;
    padding: 5px 14px;
    border-radius: 99px;
    letter-spacing: 0.08em;
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
    color: var(--mc-text);
    letter-spacing: -0.6px;
    line-height: 1.25;
    margin-bottom: 14px;
  }

  .about-card-box {
    background: var(--mc-white);
    border: 1px solid var(--mc-border);
    border-radius: 20px;
    padding: 28px 24px;
    height: 100%;
    box-shadow: var(--mc-shadow);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .about-value-card {
    background: var(--mc-white);
    border: 1px solid var(--mc-border);
    border-radius: 20px;
    padding: 24px 20px;
    height: 100%;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    box-shadow: var(--mc-shadow);
  }
  .about-value-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    border-radius: 20px 20px 0 0;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .about-value-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--mc-shadow-hover);
    border-color: rgba(0, 184, 117, 0.35);
  }
  .about-value-card:hover::before { opacity: 1; }
  .about-value-card.green::before  { background: linear-gradient(90deg, #00B875, #10B981); }
  .about-value-card.blue::before   { background: linear-gradient(90deg, #059669, #34D399); }
  .about-value-card.purple::before { background: linear-gradient(90deg, #047857, #059669); }
  .about-value-card.amber::before  { background: linear-gradient(90deg, #00B875, #059669); }

  .about-icon-ring {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    flex-shrink: 0;
  }

  .about-timeline {
    position: relative;
    padding-left: 32px;
  }
  .about-timeline::before {
    content: '';
    position: absolute;
    left: 9px; top: 6px; bottom: 6px;
    width: 2px;
    background: linear-gradient(to bottom, #00B875, rgba(0, 184, 117, 0.15));
    border-radius: 2px;
  }
  .about-timeline-item {
    position: relative;
    padding-bottom: 24px;
    animation: about-fade-up 0.5s ease both;
  }
  .about-timeline-item:last-child { padding-bottom: 0; }
  .about-timeline-dot {
    position: absolute;
    left: -32px;
    top: 4px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #00B875;
    border: 3px solid var(--mc-bg);
    box-shadow: 0 0 0 2px #00B875;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .about-timeline-year {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: #00B875;
    text-transform: uppercase;
    margin-bottom: 3px;
  }
  .about-timeline-title {
    font-size: 15.5px;
    font-weight: 800;
    color: var(--mc-text);
    margin-bottom: 4px;
  }
  .about-timeline-desc {
    font-size: 13px;
    color: var(--mc-text-muted);
    line-height: 1.55;
    font-weight: 500;
  }

  .about-team-card {
    background: var(--mc-white);
    border: 1px solid var(--mc-border);
    border-radius: 20px;
    padding: 24px 18px;
    text-align: center;
    transition: all 0.3s ease;
    box-shadow: var(--mc-shadow);
    height: 100%;
  }
  .about-team-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--mc-shadow-hover);
    border-color: rgba(0, 184, 117, 0.35);
  }
  .about-team-avatar {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    margin: 0 auto 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 800;
    color: white;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    position: relative;
  }
  .about-team-avatar-check {
    position: absolute;
    bottom: -1px;
    right: -1px;
    width: 18px;
    height: 18px;
    background: #00B875;
    border-radius: 50%;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--mc-white);
  }
  .about-team-name {
    font-size: 15.5px;
    font-weight: 800;
    color: var(--mc-text);
    margin-bottom: 2px;
  }
  .about-team-role {
    font-size: 12px;
    font-weight: 700;
    color: #00B875;
    margin-bottom: 8px;
  }
  .about-team-desc {
    font-size: 12.5px;
    color: var(--mc-text-muted);
    line-height: 1.5;
    font-weight: 500;
  }

  .about-cta-section {
    background: linear-gradient(135deg, #02382B 0%, #064E3B 45%, #00B875 100%);
    border-radius: 20px;
    padding: 36px 28px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 12px 36px rgba(0, 184, 117, 0.22);
  }
  .about-cta-section::before {
    content: '';
    position: absolute;
    top: -40%; right: -10%;
    width: 280px; height: 280px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }
  .about-cta-btn {
    background: white;
    color: #064E3B;
    border: none;
    border-radius: 12px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.25s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .about-cta-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
    background: #F0FDF4;
    color: #02382B;
  }
  .about-cta-btn-outline {
    background: transparent;
    color: white;
    border: 1.5px solid rgba(255, 255, 255, 0.6);
    border-radius: 12px;
    padding: 11px 22px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.25s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .about-cta-btn-outline:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: white;
    transform: translateY(-2px);
  }

  .about-trust-bar {
    background: var(--mc-white);
    border: 1px solid var(--mc-border);
    border-radius: 16px;
    padding: 16px 20px;
    box-shadow: var(--mc-shadow);
  }

  .about-partner-logo {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: var(--mc-bg);
    border-radius: 10px;
    border: 1px solid var(--mc-border);
    font-size: 12px;
    font-weight: 700;
    color: var(--mc-text-muted);
    white-space: nowrap;
    transition: all 0.2s ease;
  }
  .about-partner-logo:hover {
    border-color: #00B875;
    color: #00B875;
  }

  /* ─── Mobile Specific Enhancements ────────────────────────────────────────── */
  @media (max-width: 768px) {
    .about-hero-section {
      padding: 24px 0 36px;
      text-align: center;
    }
    .about-hero-badge {
      margin-left: auto;
      margin-right: auto;
    }
    .about-hero-title {
      font-size: clamp(24px, 6.5vw, 34px) !important;
      margin-bottom: 12px !important;
    }
    .about-hero-desc {
      font-size: 14.5px !important;
      margin: 0 auto !important;
    }
    .about-hero-mobile-pills {
      display: flex !important;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 16px;
    }
    .about-stat-card {
      padding: 14px 10px !important;
      border-radius: 14px;
    }
    .about-stat-number {
      font-size: 22px !important;
    }
    .about-stat-label {
      font-size: 10px !important;
      letter-spacing: 0.03em !important;
    }
    .about-trust-bar {
      padding: 14px 14px !important;
      margin-top: -14px !important;
      margin-bottom: 32px !important;
    }
    .about-partner-logo {
      padding: 5px 10px;
      font-size: 11px;
    }
    .about-card-box {
      padding: 22px 18px !important;
      border-radius: 16px !important;
    }
    .about-value-card {
      padding: 20px 16px !important;
      border-radius: 16px !important;
    }
    .about-timeline {
      padding-left: 26px !important;
    }
    .about-timeline::before {
      left: 7px !important;
    }
    .about-timeline-dot {
      left: -26px !important;
      width: 16px !important;
      height: 16px !important;
      top: 5px !important;
      box-shadow: 0 0 0 1px var(--mc-primary) !important;
    }
    .about-timeline-dot svg {
      width: 9px !important;
      height: 9px !important;
    }
    .about-timeline-item {
      padding-bottom: 16px !important;
    }
    .about-team-card {
      padding: 20px 16px !important;
      border-radius: 16px !important;
    }
    .about-cta-section {
      padding: 28px 18px !important;
      border-radius: 16px !important;
      text-align: center;
    }
    .about-cta-buttons {
      flex-direction: column !important;
      width: 100%;
      gap: 10px !important;
    }
    .about-cta-btn, .about-cta-btn-outline {
      width: 100%;
    }
    .about-section-heading {
      font-size: clamp(20px, 5vw, 26px) !important;
    }
  }
`

// ─── Data Structures ──────────────────────────────────────────────────────────
const VALUES = {
  en: [
    {
      icon: ShieldCheck,
      color: 'green',
      bg: 'rgba(0,184,117,0.1)',
      iconColor: '#00B875',
      title: 'Verified Credentials',
      desc: 'Every doctor undergoes BMDC registration verification and credential checks.',
    },
    {
      icon: Lock,
      color: 'blue',
      bg: 'rgba(5,150,105,0.1)',
      iconColor: '#059669',
      title: 'Patient Data Security',
      desc: 'End-to-end encrypted health records. We never share your medical data with third parties.',
    },
    {
      icon: Zap,
      color: 'amber',
      bg: 'rgba(16,185,129,0.1)',
      iconColor: '#10B981',
      title: 'Instant Booking',
      desc: 'Real-time appointment availability with instant serial confirmation, eliminating wait queues.',
    },
    {
      icon: Building2,
      color: 'purple',
      bg: 'rgba(4,120,87,0.1)',
      iconColor: '#047857',
      title: 'Network of Excellence',
      desc: "Partnered with Bangladesh's top accredited hospitals and specialist chambers nationwide.",
    },
  ],
  bn: [
    {
      icon: ShieldCheck,
      color: 'green',
      bg: 'rgba(0,184,117,0.1)',
      iconColor: '#00B875',
      title: 'যাচাইকৃত সনদপত্র',
      desc: 'প্রতিটি ডাক্তার বিএমডিসি নিবন্ধন যাচাই ও পরীক্ষা-নিরীক্ষার পর প্ল্যাটফর্মে যোগ দেন।',
    },
    {
      icon: Lock,
      color: 'blue',
      bg: 'rgba(5,150,105,0.1)',
      iconColor: '#059669',
      title: 'রোগীর তথ্য নিরাপত্তা',
      desc: 'এন্ড-টু-এন্ড এনক্রিপ্টেড রেকর্ড। আপনার চিকিৎসা তথ্য কখনোই তৃতীয় পক্ষের সাথে শেয়ার করা হয় না।',
    },
    {
      icon: Zap,
      color: 'amber',
      bg: 'rgba(16,185,129,0.1)',
      iconColor: '#10B981',
      title: 'তাৎক্ষণিক বুকিং',
      desc: 'রিয়েল-টাইম প্রাপ্যতা ও তাৎক্ষণিক সিরিয়াল নিশ্চিতকরণ — দীর্ঘ লাইন এড়ান।',
    },
    {
      icon: Building2,
      color: 'purple',
      bg: 'rgba(4,120,87,0.1)',
      iconColor: '#047857',
      title: 'শ্রেষ্ঠত্বের নেটওয়ার্ক',
      desc: 'সারাদেশে বাংলাদেশের শীর্ষ স্বীকৃত হাসপাতাল ও বিশেষজ্ঞ চেম্বারের সাথে অংশীদারিত্ব।',
    },
  ],
}

const TIMELINE = {
  en: [
    { year: '2022', title: 'Platform Founded', desc: 'Doctor Booklet Bangladesh established in Panthapath, Dhaka to digitize healthcare.' },
    { year: '2023', title: '500+ Doctors Onboarded', desc: 'Reached 500 BMDC-verified doctors across Dhaka, Chittagong, and Sylhet.' },
    { year: '2024', title: 'Hospital Expansion', desc: 'Signed partnerships with 200+ accredited hospitals with live slot booking.' },
    { year: '2025', title: 'Digital Payments', desc: 'Integrated bKash, Nagad & Rocket gateways for instant serial confirmation.' },
    { year: '2026', title: '1 Million+ Patients', desc: 'Crossed 1 million patients served, covering all 8 divisions of Bangladesh.' },
  ],
  bn: [
    { year: '২০২২', title: 'প্ল্যাটফর্ম প্রতিষ্ঠা', desc: 'স্বাস্থ্যসেবা ডিজিটালায়নের লক্ষ্যে Doctor Booklet Bangladesh পান্থপথে প্রতিষ্ঠিত হয়।' },
    { year: '২০২৩', title: '৫০০+ ডাক্তার অনবোর্ড', desc: 'ঢাকা, চট্টগ্রাম ও সিলেট বিভাগে ৫০০ বিএমডিসি-যাচাইকৃত ডাক্তারের মাইলফলক অর্জিত।' },
    { year: '২০২৪', title: 'হাসপাতাল সম্প্রসারণ', desc: '২০০+ স্বীকৃত হাসপাতালের সাথে অংশীদারিত্ব ও জাতীয় পর্যায়ে অনলাইন বুকিং चालू।' },
    { year: '২০২৫', title: 'ডিজিটাল পেমেন্ট', desc: 'বিকাশ, নগদ ও রকেট পেমেন্ট গেটওয়ের মাধ্যমে তাৎক্ষণিক স্লট কনফার্মেশন।' },
    { year: '২০২৬', title: '১০ লাখ+ রোগী সেবিত', desc: '১০ লাখের বেশি রোগী সেবার মাইলফলক অতিক্রম করে সকল ৮ বিভাগে সম্প্রসারণ।' },
  ],
}

const TEAM = {
  en: [
    { initials: 'AR', bg: 'linear-gradient(135deg, #00B875, #064E3B)', name: 'Dr. Arman Rahman', role: 'Founder & CEO', desc: 'MBBS, MPH. Visionary leader with 15+ years in health tech and clinical management.' },
    { initials: 'SK', bg: 'linear-gradient(135deg, #059669, #02382B)', name: 'Sumaiya Khan', role: 'Chief Medical Officer', desc: 'MD, Cardiology. Oversees clinical quality and doctor credential verification.' },
    { initials: 'RH', bg: 'linear-gradient(135deg, #10B981, #047857)', name: 'Rafiq Hossain', role: 'CTO & Co-Founder', desc: "MSc. Computer Science. Architect of secure infrastructure and health APIs." },
    { initials: 'NA', bg: 'linear-gradient(135deg, #00B875, #059669)', name: 'Nadia Ahmed', role: 'Head of Partnerships', desc: 'MBA, Healthcare. Manages relationships with 200+ hospitals nationwide.' },
  ],
  bn: [
    { initials: 'AR', bg: 'linear-gradient(135deg, #00B875, #064E3B)', name: 'ডাঃ আরমান রহমান', role: 'প্রতিষ্ঠাতা ও সিইও', desc: 'MBBS, MPH। স্বাস্থ্য প্রযুক্তি ও ক্লিনিকাল ম্যানেজমেন্টে ১৫+ বছরের অভিজ্ঞ দূরদৃষ্টিসম্পন্ন নেতা।' },
    { initials: 'SK', bg: 'linear-gradient(135deg, #059669, #02382B)', name: 'সুমাইয়া খান', role: 'চিফ মেডিকেল অফিসার', desc: 'MD, কার্ডিওলজি। ক্লিনিকাল মান ও ডাক্তার সনদপত্র যাচাই প্রোটোকল তত্ত্বাবধান করেন।' },
    { initials: 'RH', bg: 'linear-gradient(135deg, #10B981, #047857)', name: 'রফিক হোসেন', role: 'সিটিও ও সহ-প্রতিষ্ঠাতা', desc: 'MSc. কম্পিউটার বিজ্ঞান। প্ল্যাটফর্মের নিরাপদ অবকাঠামো ও এপিআই স্থপতি।' },
    { initials: 'NA', bg: 'linear-gradient(135deg, #00B875, #059669)', name: 'নাদিয়া আহমেদ', role: 'অংশীদারিত্ব প্রধান', desc: 'MBA, হেলথকেয়ার। ২০০+ হাসপাতাল ও চিকিৎসা প্রতিষ্ঠানের সাথে সম্পর্ক পরিচালনা করেন।' },
  ],
}

const ACCREDITATIONS = [
  { icon: Award, label: 'BMDC Verified' },
  { icon: ShieldCheck, label: 'SSL Secured' },
  { icon: FileCheck, label: 'DGDA Compliant' },
  { icon: Globe, label: 'ISO 27001' },
  { icon: Handshake, label: 'MoHFW Partner' },
]

// ─── Component ─────────────────────────────────────────────────────────────
export default function AboutPage() {
  const [data] = useState(getContent())
  const { theme } = useTheme()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const lang = i18n.language
  const isEn = lang === 'en'

  const content = data[lang]?.about_us || data['en']?.about_us || data.about_us
  const values   = isEn ? VALUES.en   : VALUES.bn
  const timeline = isEn ? TIMELINE.en : TIMELINE.bn
  const team     = isEn ? TEAM.en     : TEAM.bn

  const isDark = theme === 'dark'

  return (
    <div className="page-wrapper" style={{ background: 'var(--mc-bg)', paddingBottom: 0 }}>
      {/* Inline Styles */}
      <style>{ABOUT_STYLES}</style>

      {/* ═══════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════ */}
      <div className="about-hero-section">
        <BreadcrumbHUD links={[{ label: t('about_us') }]} variant="light" />

        <Container style={{ position: 'relative', zIndex: 2 }}>
          <Row className="align-items-center g-4" style={{ marginTop: 8 }}>
            <Col lg={7}>
              <div>
                <div className="about-hero-badge">
                  <Sparkles size={13} color="#ADFCE9" />
                  {isEn ? 'Our Story & Mission' : 'আমাদের গল্প ও লক্ষ্য'}
                </div>

                <h1 className="about-hero-title">
                  {isEn ? (
                    <>Bridging Patients to <br className="d-none d-md-block" /><span style={{ color: '#ADFCE9' }}>Expert Healthcare</span></>
                  ) : (
                    <>রোগী ও বিশেষজ্ঞের <br className="d-none d-md-block" /><span style={{ color: '#ADFCE9' }}>মধ্যে সেতুবন্ধন</span></>
                  )}
                </h1>

                <p className="about-hero-desc">
                  {isEn
                    ? 'Doctor Booklet Bangladesh is the country\'s trusted digital healthcare platform — connecting patients with BMDC-verified specialists, accredited hospitals, and seamless appointment scheduling across all 8 divisions.'
                    : 'Doctor Booklet Bangladesh দেশের সবচেয়ে বিশ্বস্ত ডিজিটাল স্বাস্থ্যসেবা প্ল্যাটফর্ম — সকল ৮টি বিভাগে বিএমডিসি-যাচাইকৃত বিশেষজ্ঞ, স্বীকৃত হাসপাতাল ও নিরবচ্ছিন্ন অ্যাপয়েন্টমেন্টের সংযোগ স্থাপন করছে।'
                  }
                </p>

                {/* Responsive Mobile Badges */}
                <div className="d-flex d-lg-none about-hero-mobile-pills">
                  <span style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: '#fff', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <BadgeCheck size={13} color="#ADFCE9" />
                    {isEn ? 'BMDC Verified' : 'BMDC যাচাইকৃত'}
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: '#fff', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Zap size={13} color="#FCD34D" />
                    {isEn ? 'Instant Serial' : 'তাৎক্ষণিক সিরিয়াল'}
                  </span>
                </div>
              </div>
            </Col>

            <Col lg={5} className="d-none d-lg-flex justify-content-center">
              <div style={{ position: 'relative', width: 260, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Outer animated ring */}
                <div style={{
                  position: 'absolute',
                  width: 160, height: 160, borderRadius: '50%',
                  border: '2px dashed rgba(255,255,255,0.25)',
                  animation: 'about-pulse-ring 4s infinite ease-in-out',
                }} />

                {/* Central Glass Graphic Card */}
                <div style={{
                  width: 120, height: 120, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  border: '2px solid rgba(255,255,255,0.35)',
                  backdropFilter: 'blur(16px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: 'about-float 4s ease-in-out infinite',
                  boxShadow: '0 16px 36px rgba(0,0,0,0.2)',
                  position: 'relative', zIndex: 2,
                }}>
                  <HeartPulse size={56} color="#ADFCE9" />
                </div>

                {/* Floating Tags */}
                <div style={{
                  position: 'absolute', top: 5, left: -15,
                  background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, padding: '6px 12px',
                  fontSize: 11.5, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 6px 16px rgba(0,0,0,0.12)', zIndex: 3,
                }}>
                  <BadgeCheck size={15} color="#ADFCE9" />
                  {isEn ? 'BMDC Verified' : 'BMDC যাচাইকৃত'}
                </div>

                <div style={{
                  position: 'absolute', bottom: 10, right: -15,
                  background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, padding: '6px 12px',
                  fontSize: 11.5, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 6px 16px rgba(0,0,0,0.12)', zIndex: 3,
                }}>
                  <Zap size={15} color="#FCD34D" />
                  {isEn ? 'Instant Serial' : 'তাৎক্ষণিক সিরিয়াল'}
                </div>
              </div>
            </Col>
          </Row>

          {/* ─── Key Stats Grid ─── */}
          <Row className="g-2 g-md-3" style={{ marginTop: 24 }}>
            {[
              { num: '1,000+', label: isEn ? 'Verified Doctors' : 'যাচাইকৃত ডাক্তার' },
              { num: '500+',   label: isEn ? 'Partner Hospitals' : 'পার্টনার হাসপাতাল' },
              { num: '1M+',    label: isEn ? 'Patients Served' : 'সেবিত রোগী' },
              { num: '8',      label: isEn ? 'Divisions Covered' : 'বিভাগ কভার করা হয়' },
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
          TRUST / ACCREDITATION BAR
      ═══════════════════════════════════════════════════ */}
      <Container style={{ marginTop: -20, marginBottom: 40, position: 'relative', zIndex: 3 }}>
        <div className="about-trust-bar">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            flexWrap: 'wrap', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--mc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>
              {isEn ? 'Recognized With:' : 'স্বীকৃত:'}
            </span>
            {ACCREDITATIONS.map((a, i) => {
              const IconComp = a.icon
              return (
                <div className="about-partner-logo" key={i}>
                  <IconComp size={14} color="var(--mc-primary)" />
                  <span>{a.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </Container>

      {/* ═══════════════════════════════════════════════════
          MISSION + VISION SECTION
      ═══════════════════════════════════════════════════ */}
      <Container style={{ marginBottom: 44 }}>
        <Row className="g-3 g-md-4 align-items-stretch">
          <Col lg={6}>
            <div className="about-card-box">
              <div>
                <div className="about-section-badge">
                  <span className="dot" />
                  {isEn ? 'Who We Are' : 'আমরা কে'}
                </div>
                <h2 className="about-section-heading">
                  {isEn ? 'The Standard for Digital Healthcare in Bangladesh' : 'বাংলাদেশে ডিজিটাল স্বাস্থ্যসেবার মানদণ্ড'}
                </h2>
                <p style={{ fontSize: 14.5, color: 'var(--mc-text-muted)', lineHeight: 1.7, fontWeight: 500, marginBottom: 14 }}>
                  {content.description}
                </p>
                <p style={{ fontSize: 14.5, color: 'var(--mc-text-muted)', lineHeight: 1.7, fontWeight: 500, marginBottom: 20 }}>
                  {isEn
                    ? 'We operate with one goal in mind: removing every barrier between a patient and the right doctor. Our platform enforces multi-layer verification, ensuring every listed practitioner holds active BMDC registration and valid hospital affiliations.'
                    : 'আমরা একটি লক্ষ্য নিয়ে কাজ করি: রোগী ও সঠিক ডাক্তারের মধ্যে প্রতিটি বাধা দূর করা। আমাদের প্ল্যাটফর্ম বহু-স্তর যাচাই প্রয়োগ করে, নিশ্চিত করে যে তালিকাভুক্ত প্রতিটি চিকিৎসকের সক্রিয় বিএমডিসি নিবন্ধন ও বৈধ হাসপাতাল সম্পর্ক রয়েছে।'
                  }
                </p>
              </div>

              {/* Mission Box */}
              <div style={{
                background: isDark ? 'rgba(0,184,117,0.1)' : 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                borderRadius: 14, padding: '16px 18px',
                border: '1px solid rgba(0,184,117,0.25)',
                display: 'flex', gap: 12, alignItems: 'flex-start'
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: 'rgba(0,184,117,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Target size={20} color="#00B875" />
                </div>
                <div>
                  <p style={{ fontSize: 10.5, fontWeight: 800, color: '#00B875', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
                    {t('our_mission')}
                  </p>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--mc-text)', lineHeight: 1.55, margin: 0 }}>
                    "{content.mission}"
                  </p>
                </div>
              </div>
            </div>
          </Col>

          <Col lg={6}>
            {/* Vision + Quick facts panel */}
            <div className="about-card-box">
              <div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Activity size={17} color="#00B875" />
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#00B875', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {isEn ? 'Our Vision' : 'আমাদের দৃষ্টিভঙ্গি'}
                    </span>
                  </div>
                  <p style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--mc-text)', lineHeight: 1.6, margin: 0 }}>
                    {content.vision || (isEn
                      ? 'To become the definitive health-trust layer for all 170 million citizens of Bangladesh — enabling every person to access verified, quality healthcare within minutes.'
                      : '১৭ কোটি নাগরিকের জন্য নিশ্চিত স্বাস্থ্য-আস্থা স্তর হয়ে ওঠা — প্রত্যেক ব্যক্তিকে মিনিটের মধ্যে যাচাইকৃত, মানসম্মত স্বাস্থ্যসেবা অ্যাক্সেস করতে সক্ষম করা।'
                    )}
                  </p>
                </div>

                <div style={{ height: 1, background: 'var(--mc-border)', marginBottom: 18 }} />

                {/* Quick Facts List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { icon: MapPin, label: isEn ? 'Headquarters' : 'সদর দফতর', value: isEn ? 'Panthapath, Dhaka-1215' : 'পান্থপথ, ঢাকা-১২১৫' },
                    { icon: Calendar, label: isEn ? 'Founded'      : 'প্রতিষ্ঠিত',  value: isEn ? '2022' : '২০২২' },
                    { icon: Globe, label: isEn ? 'Coverage'     : 'কভারেজ',    value: isEn ? 'All 8 Divisions of Bangladesh' : 'বাংলাদেশের সকল ৮ বিভাগ' },
                    { icon: Headphones, label: isEn ? 'Support'      : 'সহায়তা',    value: isEn ? '24/7 Patient Helpline' : '২৪/৭ রোগী হেল্পলাইন' },
                  ].map((f, i) => {
                    const FactIcon = f.icon
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '9px 12px', borderRadius: 10, background: 'var(--mc-bg)',
                        border: '1px solid var(--mc-border)'
                      }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: 'var(--mc-white)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                        }}>
                          <FactIcon size={15} color="var(--mc-primary)" />
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--mc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 1 }}>
                            {f.label}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--mc-text)' }}>
                            {f.value}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* ═══════════════════════════════════════════════════
          CORE VALUES SECTION
      ═══════════════════════════════════════════════════ */}
      <div style={{
        background: isDark ? 'rgba(30,41,59,0.4)' : '#F1F5F9',
        padding: '40px 0',
        marginBottom: 44,
        borderTop: '1px solid var(--mc-border)',
        borderBottom: '1px solid var(--mc-border)'
      }}>
        <Container>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div className="about-section-badge" style={{ margin: '0 auto 10px' }}>
              <span className="dot" />
              {isEn ? 'Core Values' : 'মূল মান'}
            </div>
            <h2 className="about-section-heading" style={{ marginBottom: 8 }}>
              {isEn ? 'What We Stand For' : 'আমরা কীসের জন্য দাঁড়াই'}
            </h2>
            <p style={{ fontSize: 14.5, color: 'var(--mc-text-muted)', maxWidth: 480, margin: '0 auto', lineHeight: 1.55, fontWeight: 500 }}>
              {isEn
                ? 'Four pillars that define every decision we make and every feature we build.'
                : 'চারটি স্তম্ভ যা আমাদের প্রতিটি সিদ্ধান্ত ও বৈশিষ্ট্য নির্ধারণ করে।'
              }
            </p>
          </div>

          <Row className="g-3">
            {values.map((v, i) => {
              const ValueIcon = v.icon
              return (
                <Col xs={12} sm={6} lg={3} key={i}>
                  <div className={`about-value-card ${v.color}`}>
                    <div className="about-icon-ring" style={{ background: v.bg }}>
                      <ValueIcon size={24} color={v.iconColor} />
                    </div>
                    <h4 style={{ fontWeight: 800, fontSize: 15.5, color: 'var(--mc-text)', marginBottom: 6, lineHeight: 1.3 }}>
                      {v.title}
                    </h4>
                    <p style={{ fontSize: 13, color: 'var(--mc-text-muted)', lineHeight: 1.55, fontWeight: 500, margin: 0 }}>
                      {v.desc}
                    </p>
                  </div>
                </Col>
              )
            })}
          </Row>
        </Container>
      </div>

      {/* ═══════════════════════════════════════════════════
          MILESTONES / TIMELINE
      ═══════════════════════════════════════════════════ */}
      <Container style={{ marginBottom: 44 }}>
        <Row className="g-4 align-items-start">
          <Col lg={5}>
            <div style={{ position: 'sticky', top: 90 }}>
              <div className="about-section-badge">
                <span className="dot" />
                {isEn ? 'Our Journey' : 'আমাদের যাত্রা'}
              </div>
              <h2 className="about-section-heading" style={{ marginBottom: 12 }}>
                {isEn ? 'From Idea to National Platform' : 'ধারণা থেকে জাতীয় প্ল্যাটফর্ম'}
              </h2>
              <p style={{ fontSize: 14.5, color: 'var(--mc-text-muted)', lineHeight: 1.65, fontWeight: 500, marginBottom: 20 }}>
                {isEn
                  ? "In just four years, Doctor Booklet has grown from a small startup to Bangladesh's largest verified healthcare network."
                  : 'মাত্র চার বছরে Doctor Booklet ঢাকার একটি ছোট স্টার্টআপ থেকে বাংলাদেশের বৃহত্তম যাচাইকৃত স্বাস্থ্যসেবা নেটওয়ার্কে পরিণত হয়েছে।'
                }
              </p>

              <div style={{
                background: 'linear-gradient(135deg, #064E3B, #00B875)',
                borderRadius: 14, padding: '16px 18px',
                display: 'flex', gap: 14, alignItems: 'center',
                boxShadow: '0 6px 20px rgba(0,184,117,0.2)'
              }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <TrendingUp size={20} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 1 }}>
                    {isEn ? 'Rapid Growth' : 'দ্রুত প্রবৃদ্ধি'}
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>
                    {isEn ? '500+ new doctors onboarded every quarter' : 'প্রতি ত্রৈমাসিকে ৫০০+ নতুন ডাক্তার অনবোর্ড'}
                  </div>
                </div>
              </div>
            </div>
          </Col>

          <Col lg={7}>
            <div className="about-timeline">
              {timeline.map((item, i) => (
                <div className="about-timeline-item" key={i}>
                  <div className="about-timeline-dot">
                    <CheckCircle2 size={10} color="#fff" />
                  </div>
                  <div style={{
                    background: 'var(--mc-white)', border: '1px solid var(--mc-border)',
                    borderRadius: 14, padding: '16px 18px',
                    boxShadow: i === timeline.length - 1 ? '0 4px 18px rgba(0,184,117,0.15)' : 'var(--mc-shadow)',
                    borderLeft: i === timeline.length - 1 ? '3px solid #00B875' : '1px solid var(--mc-border)',
                  }}>
                    <div className="about-timeline-year">{item.year}</div>
                    <div className="about-timeline-title">{item.title}</div>
                    <div className="about-timeline-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </Container>

      {/* ═══════════════════════════════════════════════════
          LEADERSHIP TEAM
      ═══════════════════════════════════════════════════ */}
      <div style={{
        background: isDark ? 'rgba(30,41,59,0.4)' : '#F1F5F9',
        padding: '40px 0',
        marginBottom: 44,
        borderTop: '1px solid var(--mc-border)',
        borderBottom: '1px solid var(--mc-border)'
      }}>
        <Container>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div className="about-section-badge" style={{ margin: '0 auto 10px' }}>
              <span className="dot" />
              {isEn ? 'Leadership' : 'নেতৃত্ব'}
            </div>
            <h2 className="about-section-heading" style={{ marginBottom: 8 }}>
              {isEn ? 'Meet Our Leadership Team' : 'আমাদের নেতৃত্ব দলের সাথে পরিচিত হন'}
            </h2>
            <p style={{ fontSize: 14.5, color: 'var(--mc-text-muted)', maxWidth: 480, margin: '0 auto', lineHeight: 1.55, fontWeight: 500 }}>
              {isEn
                ? 'Experienced clinicians and technologists united by a single purpose: improving healthcare access in Bangladesh.'
                : 'অভিজ্ঞ চিকিৎসক ও প্রযুক্তিবিদরা একটি উদ্দেশ্যে একত্রিত: বাংলাদেশে স্বাস্থ্যসেবা অ্যাক্সেস উন্নত করা।'
              }
            </p>
          </div>

          <Row className="g-3">
            {team.map((member, i) => (
              <Col xs={12} sm={6} lg={3} key={i}>
                <div className="about-team-card">
                  <div className="about-team-avatar" style={{ background: member.bg }}>
                    {member.initials}
                    <div className="about-team-avatar-check">
                      <CheckCircle2 size={11} />
                    </div>
                  </div>
                  <div className="about-team-name">{member.name}</div>
                  <div className="about-team-role">{member.role}</div>
                  <div className="about-team-desc">{member.desc}</div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </div>

      {/* ═══════════════════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════════════════ */}
      <Container style={{ paddingBottom: 44 }}>
        <div className="about-cta-section">
          <Row className="align-items-center g-3">
            <Col lg={7}>
              <p style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                {isEn ? 'Get Started Today' : 'আজই শুরু করুন'}
              </p>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.6px', lineHeight: 1.2, marginBottom: 10 }}>
                {isEn
                  ? 'Ready to Experience Smarter Healthcare?'
                  : 'স্মার্ট স্বাস্থ্যসেবার অভিজ্ঞতা নিতে প্রস্তুত?'
                }
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: 500, lineHeight: 1.55, marginBottom: 0 }}>
                {isEn
                  ? 'Join over 1 million patients who trust Doctor Booklet to connect them with verified specialists across Bangladesh.'
                  : 'বাংলাদেশে যাচাইকৃত বিশেষজ্ঞদের সাথে সংযুক্ত করতে Doctor Booklet বিশ্বস্ত ১০ লাখেরও বেশি রোগীর দলে যোগ দিন।'
                }
              </p>
            </Col>
            <Col lg={5}>
              <div className="d-flex flex-wrap gap-2 justifyContent-flex-start about-cta-buttons justify-content-lg-end">
                <button className="about-cta-btn" onClick={() => navigate('/doctors')}>
                  <Search size={15} />
                  {isEn ? 'Find a Doctor' : 'ডাক্তার খুঁজুন'}
                </button>
                <button className="about-cta-btn-outline" onClick={() => navigate('/contact')}>
                  {isEn ? 'Contact Us' : 'যোগাযোগ করুন'}
                  <ArrowRight size={15} />
                </button>
              </div>
            </Col>
          </Row>
        </div>
      </Container>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Container, Row, Col } from 'react-bootstrap'
import { 
  MapPin, Phone, Mail, Globe, Clock, Send, ShieldCheck, 
  Headset, CheckCircle2, Copy, ExternalLink,
  Building2, ArrowRight, MessageSquare, ChevronDown,
  Sparkles, MessageCircle, User, Stethoscope, 
  CreditCard, Wrench, Navigation, Check, HelpCircle
} from 'lucide-react'
import { getContent } from '../utils/contentService'
import BreadcrumbHUD from '../components/common/BreadcrumbHUD'

export default function ContactPage() {
  const [cms, setCms] = useState(getContent())

  useEffect(() => {
    const handleUpdate = () => setCms(getContent())
    window.addEventListener('cms-updated', handleUpdate)
    return () => window.removeEventListener('cms-updated', handleUpdate)
  }, [])

  const site = cms.site || {}
  const contact = cms.contact || {}

  const [activeDepartment, setActiveDepartment] = useState('general')
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    subject: 'সাধারণ জিজ্ঞাসা ও রোগী সেবা', 
    extraField: '', 
    message: '' 
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [copiedField, setCopiedField] = useState(null)
  const [activeFaq, setActiveFaq] = useState(null)

  // Determine if office is currently open (BD time Saturday to Thursday 9:00 AM - 8:00 PM)
  const [isOfficeOpen, setIsOfficeOpen] = useState(true)
  useEffect(() => {
    try {
      const now = new Date()
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
      const bdTime = new Date(utc + (3600000 * 6))
      const day = bdTime.getDay()
      const hour = bdTime.getHours()
      if (day === 5) {
        setIsOfficeOpen(false)
      } else {
        setIsOfficeOpen(hour >= 9 && hour < 20)
      }
    } catch {
      setIsOfficeOpen(true)
    }
  }, [])

  const DEPARTMENTS = [
    {
      id: 'general',
      label: 'সাধারণ ও রোগী সেবা',
      icon: <Headset size={16} />,
      badge: 'গড় রেসপন্স ১৫ মিনিট',
      placeholderSubject: 'সাধারণ জিজ্ঞাসা ও অ্যাপয়েন্টমেন্ট সংক্রান্ত',
      extraLabel: null
    },
    {
      id: 'doctor',
      label: 'ডাক্তার অনবোর্ডিং',
      icon: <Stethoscope size={16} />,
      badge: 'ভেরিফিকেশন টিম',
      placeholderSubject: 'ডাক্তার নিবন্ধন ও ডিজিটাল চেম্বার',
      extraLabel: 'বিএমডিসি নম্বর (BMDC Reg No)'
    },
    {
      id: 'hospital',
      label: 'হাসপাতাল পার্টনারশিপ',
      icon: <Building2 size={16} />,
      badge: 'প্রাতিষ্ঠানিক সাপোর্ট',
      placeholderSubject: 'হাসপাতাল / ডায়াগনস্টিক সফটওয়্যার ইন্টিগ্রেশন',
      extraLabel: 'হাসপাতাল / প্রতিষ্ঠানের নাম'
    },
    {
      id: 'billing',
      label: 'বিলিং ও পেমেন্ট',
      icon: <CreditCard size={16} />,
      badge: 'অ্যাকাউন্টস ডেস্ক',
      placeholderSubject: 'পেমেন্ট ভেরিফিকেশন ও ইনভয়েস',
      extraLabel: 'ট্রানজ্যাকশন আইডি (ঐচ্ছিক)'
    },
    {
      id: 'tech',
      label: 'কারিগরি সহায়তা',
      icon: <Wrench size={16} />,
      badge: 'আইটি সাপোর্ট',
      placeholderSubject: 'সিস্টেম এরর বা বাগ রিপোর্ট',
      extraLabel: 'ডিভাইস বা ব্রাউজার বিবরণ'
    }
  ]

  const handleDepartmentChange = (dept) => {
    setActiveDepartment(dept.id)
    setForm(prev => ({
      ...prev,
      subject: dept.placeholderSubject
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.phone || !form.message) {
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setForm({ 
      name: '', 
      email: '', 
      phone: '', 
      subject: DEPARTMENTS.find(d => d.id === activeDepartment)?.placeholderSubject || 'সাধারণ জিজ্ঞাসা', 
      extraField: '', 
      message: '' 
    })
    setLoading(false)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 6000)
  }

  const handleCopy = (text, fieldName) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
    }
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2500)
  }

  const FAQS = [
    {
      q: 'অনলাইনে সিরিয়াল নেওয়ার পর এসএমএস না আসলে কী করব?',
      a: 'সাধারণত সিরিয়াল নিশ্চিত হওয়ামাত্রই স্বয়ংক্রিয় এসএমএস প্রেরিত হয়। মোবাইল নেটওয়ার্ক বিলম্বের কারণে এসএমএস না পেলে আপনার ড্যাশবোর্ডের "আমার সিরিয়াল" সেকশনে লগইন করে তাৎক্ষণিক ডিজিটাল টিকিট ডাউনলোড বা দেখতে পারেন অথবা আমাদের হেল্পলাইনে কল করুন।'
    },
    {
      q: 'ডাক্তার হিসেবে Doctor Booklet প্ল্যাটফর্মে কীভাবে যুক্ত হব?',
      a: 'ওয়েবসাইটের মেন্যু থেকে "ডাক্তার রেজিস্ট্রেশন" অপশনে গিয়ে আপনার বিএমডিসি রেজিস্ট্রেশন নম্বর, বিশেষত্ব ও প্রয়োজনীয় তথ্য প্রদান করুন। আমাদের মেডিকেল ভেরিফিকেশন টিম সর্বোচ্চ ২৪ ঘণ্টার মধ্যে সনদ যাচাই করে আপনার ডিজিটাল চেম্বার সক্রিয় করবে।'
    },
    {
      q: 'হাসপাতাল বা ক্লিনিকের ডিসপ্লে বোর্ড ও ওপিডি সফটওয়্যার কীভাবে নেব?',
      a: 'হাসপাতাল পার্টনারশিপ ক্যাটাগরি নির্বাচন করে আমাদের কাছে বার্তা পাঠান। আমাদের এন্টারপ্রাইজ টিম সরাসরি আপনার স্বাস্থ্যসেবা প্রতিষ্ঠান পরিদর্শন করবে এবং কাস্টমাইজড ডিসপ্লে বোর্ড ও সিরিয়াল ম্যানেজমেন্ট সিস্টেম সেটআপ করে দেবে।'
    },
    {
      q: 'ভুলবশত বুকিং হয়ে গেলে বা তারিখ পরিবর্তন করতে চাইলে করণীয় কী?',
      a: 'অ্যাপয়েন্টমেন্ট সময়ের অন্তত ৪ ঘণ্টা পূর্বে আপনার রোগী প্রোফাইল থেকে সহজেই তারিখ রিশিডিউল করতে পারবেন। কোনো অসুবিধা হলে আমাদের ২৪/৭ কাস্টমার সাপোর্টে কল করলে প্রতিনিধি আপনাকে তৎক্ষণাৎ সাহায্য করবেন।'
    }
  ]

  const phoneValue = contact.phone || site.phone || '01700-000000'
  const emailValue = contact.email || site.email_support || site.email || 'support@doctorbooklet.com.bd'
  
  // Clean address to remove legacy "মেডকানেক্ট" references
  const rawAddress = contact.address || site.address || 'বাড়ি নং ১২, রোড নং ৫, ধানমন্ডি, ঢাকা-১২০৫'
  const addressValue = rawAddress.replace(/মেডকানেক্ট\s*কমপ্লেক্স,?\s*/gi, 'ডাক্তার বুকলেট হেডকোয়ার্টার, ')
  
  const officeHoursValue = contact.office_hours || site.office_hours || 'শনিবার - বৃহস্পতিবার: সকাল ৯:০০ - রাত ৮:০০'
  
  // Facebook / Messenger URL
  const facebookUrl = site.facebook || 'https://facebook.com'
  const messengerUrl = facebookUrl.includes('facebook.com') && !facebookUrl.endsWith('facebook.com')
    ? facebookUrl.replace('facebook.com', 'm.me')
    : 'https://m.me'

  return (
    <div className="page-wrapper contact-page-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <style>{`
        /* ── HERO & BASE STYLES ── */
        .contact-hero {
          background: radial-gradient(130% 100% at 50% 0%, #064E3B 0%, #022C22 55%, #011C15 100%);
          padding-bottom: 95px;
          position: relative;
          overflow: hidden;
          color: white;
        }
        @media (max-width: 768px) {
          .contact-hero {
            padding-bottom: 55px;
          }
        }
        .contact-hero-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
          background-size: 36px 36px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, #000 50%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, #000 50%, transparent 100%);
          pointer-events: none;
        }
        .contact-hero-glow-1 {
          position: absolute;
          top: -140px;
          right: 5%;
          width: 550px;
          height: 550px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 184, 117, 0.24) 0%, rgba(6, 78, 59, 0.06) 50%, transparent 70%);
          filter: blur(40px);
          pointer-events: none;
        }
        .contact-hero-glow-2 {
          position: absolute;
          top: 15%;
          left: -100px;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.16) 0%, rgba(6, 78, 59, 0.04) 50%, transparent 70%);
          filter: blur(45px);
          pointer-events: none;
        }
        .contact-hero-glow-3 {
          position: absolute;
          bottom: -80px;
          left: 35%;
          width: 500px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 70%);
          filter: blur(50px);
          pointer-events: none;
        }

        /* ── QUICK ACTION STRIP ── */
        .contact-strip-container {
          margin-top: -60px;
          position: relative;
          z-index: 10;
        }
        @media (max-width: 768px) {
          .contact-strip-container {
            margin-top: -30px;
          }
        }

        .channel-action-card {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 22px 20px;
          border: 1.5px solid #E2E8F0;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.02);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .channel-action-card:hover {
          transform: translateY(-5px);
        }

        /* ── DEPARTMENT PILLS (MOBILE TOUCH-FRIENDLY) ── */
        .dept-tabs-container {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 6px;
          margin-bottom: 22px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
        }
        .dept-tabs-container::-webkit-scrollbar {
          height: 4px;
        }
        .dept-tabs-container::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 4px;
        }

        .dept-pill-btn {
          white-space: nowrap;
          padding: 9px 16px;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 700;
          border: 1.5px solid #E2E8F0;
          background: #FFFFFF;
          color: #475569;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
        }
        .dept-pill-btn:hover {
          border-color: #00B875;
          color: #065F46;
          background: #F0FDF4;
        }
        .dept-pill-btn.active {
          background: #064E3B;
          border-color: #064E3B;
          color: #FFFFFF;
          box-shadow: 0 4px 14px rgba(6, 78, 59, 0.25);
        }

        /* ── FORM ELEMENTS ── */
        .contact-form-card {
          background: #FFFFFF;
          border-radius: 24px;
          padding: 34px 30px;
          border: 1.5px solid #E2E8F0;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
        }
        @media (max-width: 768px) {
          .contact-form-card {
            padding: 22px 18px;
            border-radius: 20px;
          }
        }

        .input-group-custom {
          position: relative;
        }
        .input-group-custom .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
          pointer-events: none;
          transition: color 0.2s ease;
        }
        .input-group-custom .contact-input {
          padding-left: 44px;
        }
        .input-group-custom:focus-within .input-icon {
          color: #00B875;
        }

        .contact-input {
          width: 100%;
          padding: 13px 16px;
          border-radius: 13px;
          border: 1.5px solid #E2E8F0;
          font-size: 14.5px;
          outline: none;
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
          transition: all 0.2s ease;
          background: #F8FAFC;
          color: #0F172A;
          font-weight: 500;
        }
        .contact-input:focus {
          border-color: #00B875;
          background: #FFFFFF;
          box-shadow: 0 0 0 3.5px rgba(0, 184, 117, 0.15);
        }
        .contact-input::placeholder {
          color: #94A3B8;
          font-weight: 400;
        }

        /* ── RIGHT COLUMN INFO CARDS ── */
        .contact-info-card {
          background: #FFFFFF;
          border-radius: 24px;
          padding: 28px 24px;
          border: 1.5px solid #E2E8F0;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
        }
        @media (max-width: 768px) {
          .contact-info-card {
            padding: 20px 18px;
            border-radius: 20px;
          }
        }

        /* ── FAQ ACCORDION ITEM ── */
        .contact-faq-item {
          background: #FFFFFF;
          border-radius: 16px;
          border: 1.5px solid #E2E8F0;
          overflow: hidden;
          transition: all 0.2s ease;
          margin-bottom: 12px;
        }
        .contact-faq-item:hover {
          border-color: #CBD5E1;
        }
        .contact-faq-item.active {
          border-color: #A7F3D0;
          box-shadow: 0 6px 18px rgba(0, 184, 117, 0.08);
        }
        .contact-faq-header {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          background: transparent;
          gap: 12px;
          user-select: none;
        }
        .contact-faq-body {
          padding: 0 20px 18px;
          color: #475569;
          font-size: 14px;
          line-height: 1.65;
        }
        .btn-faq-more:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 26px rgba(0, 184, 117, 0.45) !important;
          color: white !important;
        }
      `}</style>

      {/* ── HERO SECTION ── */}
      <section className="contact-hero">
        <div className="contact-hero-grid" />
        <div className="contact-hero-glow-1" />
        <div className="contact-hero-glow-2" />
        <div className="contact-hero-glow-3" />

        {/* Architectural Subtle Ambient Light Wave */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.16, pointerEvents: 'none', overflow: 'hidden' }}>
          <svg width="100%" height="100%" viewBox="0 0 1440 400" fill="none" preserveAspectRatio="none">
            <path d="M-100 280 C300 400, 700 120, 1100 250 C1300 320, 1500 180, 1600 200" stroke="rgba(52, 211, 153, 0.45)" strokeWidth="1.5" fill="none" />
            <path d="M-100 230 C350 350, 750 80, 1150 200 C1350 270, 1550 140, 1600 160" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="1" strokeDasharray="6 6" fill="none" />
            <path d="M-100 330 C250 450, 650 170, 1050 300 C1250 370, 1450 230, 1600 250" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1" fill="none" />
          </svg>
        </div>

        <BreadcrumbHUD links={[{ label: 'যোগাযোগ' }]} variant="light" />

        <Container style={{ position: 'relative', zIndex: 2, marginTop: 12 }}>
          <Row className="align-items-center g-4">
            <Col lg={8} md={12}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                padding: '6px 14px',
                borderRadius: 99,
                fontSize: 12.5,
                fontWeight: 700,
                marginBottom: 16,
                color: '#ECFDF5',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
              }}>
                <span style={{ 
                  width: 8, height: 8, borderRadius: '50%', 
                  background: '#34D399', display: 'inline-block',
                  boxShadow: '0 0 10px #34D399'
                }} />
                <span>সার্বক্ষণিক কানেক্টিভিটি ও কাস্টমার কেয়ার</span>
              </div>

              <h1 style={{ 
                color: 'white', 
                fontWeight: 900, 
                fontSize: 'clamp(26px, 4.5vw, 42px)', 
                lineHeight: 1.25, 
                marginBottom: 14,
                letterSpacing: '-0.3px',
                textShadow: '0 2px 20px rgba(0, 0, 0, 0.2)'
              }}>
                {contact.hero_title || 'ডাক্তার বুকলেট কন্টাক্ট হাব: আমরা সার্বক্ষণিক আপনার পাশে'}
              </h1>

              <p style={{ 
                color: 'rgba(255,255,255,0.92)', 
                fontSize: 'clamp(14px, 1.8vw, 16px)', 
                lineHeight: 1.7, 
                marginBottom: 24, 
                maxWidth: 620,
                fontWeight: 400
              }}>
                {contact.hero_subtitle || 'রোগী, নিবন্ধিত ডাক্তার কিংবা হাসপাতাল কর্তৃপক্ষ—যেকোনো প্রশ্ন, প্রযুক্তিগত সহায়তা বা প্রাতিষ্ঠানিক অংশীদারিত্বের জন্য আমাদের বিশেষজ্ঞ টিমের সাথে যোগাযোগ করুন।'}
              </p>

              {/* Service SLA Highlights */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 10,
                maxWidth: 580
              }}>
                {[
                  { icon: <Clock size={16} />, title: 'গড় রেসপন্স টাইম', desc: '১৫ মিনিট' },
                  { icon: <ShieldCheck size={16} />, title: 'তথ্য সুরক্ষা', desc: '২৫৬-বিট এনক্রিপশন' },
                  { icon: <Headset size={16} />, title: 'সরাসরি হটলাইন', desc: '২৪/৭ ডেডিকেটেড' }
                ].map((sla, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    borderRadius: 14,
                    padding: '8px 14px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ 
                      width: 32, height: 32, borderRadius: 10,
                      background: 'rgba(52, 211, 153, 0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#34D399', flexShrink: 0
                    }}>
                      {sla.icon}
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: 600 }}>{sla.title}</div>
                      <div style={{ color: 'white', fontSize: 13.5, fontWeight: 800 }}>{sla.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Col>

            {/* Desktop Visual Indicator Badge */}
            <Col lg={4} className="d-none d-lg-block text-end">
              <div style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 24,
                padding: '24px 22px',
                textAlign: 'left',
                display: 'inline-block',
                maxWidth: 320,
                color: 'white',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ 
                    width: 40, height: 40, borderRadius: 12, 
                    background: 'rgba(52, 211, 153, 0.2)', 
                    color: '#34D399', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>সেন্ট্রাল সাপোর্ট ডেস্ক</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>ডাক্তার বুকলেট বাংলাদেশ</div>
                  </div>
                </div>

                <div style={{ 
                  background: 'rgba(0, 0, 0, 0.25)', 
                  borderRadius: 12, 
                  padding: '10px 12px', 
                  fontSize: 12, 
                  lineHeight: 1.5, 
                  marginBottom: 12,
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ color: '#34D399', fontWeight: 700, marginBottom: 2 }}>● সাপোর্ট ডেস্ক সক্রিয়</div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.85)' }}>যেকোনো জরুরি জিজ্ঞাসা বা সিস্টেমে সাহায্যের জন্য সরাসরি যোগাযোগ করুন।</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>
                  <span>সাপ্তাহিক কর্মদিবস: শনি-বৃহ</span>
                  <span style={{ color: '#34D399', fontWeight: 700 }}>সকাল ৯টা - রাত ৮টা</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── QUICK ACTION CHANNELS STRIP (INSTANT BRAND RECOGNITION) ── */}
      <Container className="contact-strip-container">
        <Row className="g-3">
          {/* 1. Phone Hotline Card */}
          <Col lg={3} sm={6} xs={12}>
            <div 
              className="channel-action-card" 
              style={{
                background: 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 35%)',
                borderColor: '#BBF7D0'
              }}
            >
              {/* Brand Top Line */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: '#00B875' }} />
              
              {/* Watermark Icon */}
              <div style={{ position: 'absolute', right: -12, bottom: -12, color: '#00B875', opacity: 0.05, pointerEvents: 'none' }}>
                <Phone size={95} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ 
                    width: 48, height: 48, borderRadius: 14, 
                    background: '#00B875', color: 'white', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 6px 14px rgba(0, 184, 117, 0.3)'
                  }}>
                    <Phone size={22} />
                  </div>
                  <span style={{ 
                    fontSize: 11.5, fontWeight: 800, 
                    background: '#DCFCE7', color: '#166534', 
                    border: '1px solid #86EFAC',
                    padding: '4px 10px', borderRadius: 99,
                    display: 'inline-flex', alignItems: 'center', gap: 5
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
                    ২৪/৭ হেল্পলাইন
                  </span>
                </div>
                <h5 style={{ fontWeight: 900, fontSize: 16, color: '#0F172A', marginBottom: 4 }}>টেলিফোন কল</h5>
                <p style={{ color: '#00B875', fontWeight: 900, fontSize: 16, margin: 0, letterSpacing: '0.3px' }}>
                  {phoneValue}
                </p>
                <p style={{ color: '#64748B', fontSize: 12, margin: '3px 0 0' }}>সরাসরি সেন্ট্রাল কল সেন্টারে কথা বলুন</p>
              </div>

              <div style={{ marginTop: 18, position: 'relative', zIndex: 2 }}>
                <a 
                  href={`tel:${phoneValue.replace(/[^0-9+]/g, '')}`} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: '#00B875',
                    color: 'white',
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontWeight: 800,
                    fontSize: 13.5,
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(0, 184, 117, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Phone size={15} />
                  <span>সরাসরি কল করুন</span>
                </a>
              </div>
            </div>
          </Col>

          {/* 2. WhatsApp Direct Card (Instant Green Recognition) */}
          <Col lg={3} sm={6} xs={12}>
            <div 
              className="channel-action-card" 
              style={{
                background: 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 35%)',
                borderColor: '#86EFAC'
              }}
            >
              {/* WhatsApp Brand Top Line */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: '#25D366' }} />

              {/* Watermark WhatsApp Logo */}
              <div style={{ position: 'absolute', right: -12, bottom: -12, color: '#25D366', opacity: 0.06, pointerEvents: 'none' }}>
                <svg width="95" height="95" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ 
                    width: 48, height: 48, borderRadius: 14, 
                    background: '#25D366', color: 'white', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 6px 14px rgba(37, 211, 102, 0.35)'
                  }}>
                    {/* Official WhatsApp SVG Logo */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <span style={{ 
                    fontSize: 11.5, fontWeight: 800, 
                    background: '#DCFCE7', color: '#15803D', 
                    border: '1px solid #86EFAC',
                    padding: '4px 10px', borderRadius: 99,
                    display: 'inline-flex', alignItems: 'center', gap: 5
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#25D366', display: 'inline-block' }} />
                    WhatsApp Live
                  </span>
                </div>
                <h5 style={{ fontWeight: 900, fontSize: 16, color: '#0F172A', marginBottom: 4 }}>হোয়াটসঅ্যাপ সাপোর্ট</h5>
                <p style={{ color: '#15803D', fontWeight: 800, fontSize: 14.5, margin: 0 }}>
                  তাৎক্ষণিক চ্যাট ও প্রেসক্রিপশন
                </p>
                <p style={{ color: '#64748B', fontSize: 12, margin: '3px 0 0' }}>ডকুমেন্ট, ছবি ও প্রশ্ন সরাসরি পাঠান</p>
              </div>

              <div style={{ marginTop: 18, position: 'relative', zIndex: 2 }}>
                <a 
                  href={`https://wa.me/${phoneValue.replace(/[^0-9]/g, '') || '8801700000000'}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: '#25D366',
                    color: 'white',
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontWeight: 800,
                    fontSize: 13.5,
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <MessageCircle size={16} />
                  <span>WhatsApp-এ মেসেজ দিন</span>
                </a>
              </div>
            </div>
          </Col>

          {/* 3. Official Email Card */}
          <Col lg={3} sm={6} xs={12}>
            <div 
              className="channel-action-card" 
              style={{
                background: 'linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 35%)',
                borderColor: '#BFDBFE'
              }}
            >
              {/* Brand Top Line */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: '#2563EB' }} />

              {/* Watermark Mail Icon */}
              <div style={{ position: 'absolute', right: -12, bottom: -12, color: '#2563EB', opacity: 0.05, pointerEvents: 'none' }}>
                <Mail size={95} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ 
                    width: 48, height: 48, borderRadius: 14, 
                    background: '#2563EB', color: 'white', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 6px 14px rgba(37, 99, 235, 0.3)'
                  }}>
                    <Mail size={22} />
                  </div>
                  <span style={{ 
                    fontSize: 11.5, fontWeight: 800, 
                    background: '#DBEAFE', color: '#1E40AF', 
                    border: '1px solid #93C5FD',
                    padding: '4px 10px', borderRadius: 99,
                    display: 'inline-flex', alignItems: 'center', gap: 5
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB', display: 'inline-block' }} />
                    অফিসিয়াল ইমেইল
                  </span>
                </div>
                <h5 style={{ fontWeight: 900, fontSize: 16, color: '#0F172A', marginBottom: 4 }}>ইমেইল হেল্পডেস্ক</h5>
                <p style={{ color: '#1E40AF', fontWeight: 800, fontSize: 13, margin: 0, wordBreak: 'break-all' }}>
                  {emailValue}
                </p>
                <p style={{ color: '#64748B', fontSize: 12, margin: '3px 0 0' }}>সর্বোচ্চ ২ ঘণ্টার মধ্যে আনুষ্ঠানিক উত্তর</p>
              </div>

              <div style={{ marginTop: 18, position: 'relative', zIndex: 2, display: 'flex', gap: 8 }}>
                <a 
                  href={`mailto:${emailValue}`}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    background: '#2563EB',
                    color: 'white',
                    borderRadius: 12,
                    padding: '10px 12px',
                    fontWeight: 800,
                    fontSize: 13.5,
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Mail size={15} />
                  <span>ইমেইল পাঠান</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(emailValue, 'topEmail')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1.5px solid #CBD5E1',
                    background: '#F8FAFC',
                    color: '#475569',
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  title="ইমেইল কপি করুন"
                >
                  {copiedField === 'topEmail' ? <Check size={15} color="#059669" /> : <Copy size={15} />}
                </button>
              </div>
            </div>
          </Col>

          {/* 4. Facebook Messenger Card (Instant Messenger Gradient Recognition) */}
          <Col lg={3} sm={6} xs={12}>
            <div 
              className="channel-action-card" 
              style={{
                background: 'linear-gradient(180deg, #F0F9FF 0%, #FFFFFF 35%)',
                borderColor: '#BAE6FD'
              }}
            >
              {/* Messenger Official Gradient Top Line */}
              <div style={{ 
                position: 'absolute', 
                top: 0, left: 0, right: 0, height: 4, 
                background: 'linear-gradient(90deg, #00C6FF 0%, #0072FF 50%, #9B51E0 100%)' 
              }} />

              {/* Watermark Messenger Lightning Logo */}
              <div style={{ position: 'absolute', right: -12, bottom: -12, color: '#0084FF', opacity: 0.05, pointerEvents: 'none' }}>
                <svg width="95" height="95" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.145 2 11.258C2 14.17 3.433 16.745 5.672 18.39V22L9.123 20.106C10.038 20.364 11.002 20.516 12 20.516C17.523 20.516 22 16.371 22 11.258C22 6.145 17.523 2 12 2ZM13.082 14.437L10.938 12.146L6.758 14.437L11.353 9.549L13.528 11.84L17.677 9.549L13.082 14.437Z" />
                </svg>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ 
                    width: 48, height: 48, borderRadius: 14, 
                    background: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 50%, #9B51E0 100%)', 
                    color: 'white', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 6px 14px rgba(0, 114, 255, 0.35)'
                  }}>
                    {/* Official Messenger SVG Lightning Logo */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2C6.477 2 2 6.145 2 11.258C2 14.17 3.433 16.745 5.672 18.39V22L9.123 20.106C10.038 20.364 11.002 20.516 12 20.516C17.523 20.516 22 16.371 22 11.258C22 6.145 17.523 2 12 2ZM13.082 14.437L10.938 12.146L6.758 14.437L11.353 9.549L13.528 11.84L17.677 9.549L13.082 14.437Z" />
                    </svg>
                  </div>
                  <span style={{ 
                    fontSize: 11.5, fontWeight: 800, 
                    background: '#E0F2FE', color: '#0369A1', 
                    border: '1px solid #7DD3FC',
                    padding: '4px 10px', borderRadius: 99,
                    display: 'inline-flex', alignItems: 'center', gap: 5
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284C7', display: 'inline-block' }} />
                    Messenger Chat
                  </span>
                </div>
                <h5 style={{ fontWeight: 900, fontSize: 16, color: '#0F172A', marginBottom: 4 }}>ফেসবুক মেসেঞ্জার</h5>
                <p style={{ color: '#0284C7', fontWeight: 800, fontSize: 14.5, margin: 0 }}>
                  সরাসরি অফিসিয়াল ইনবক্স
                </p>
                <p style={{ color: '#64748B', fontSize: 12, margin: '3px 0 0' }}>সোশ্যাল সাপোর্ট টিম সার্বক্ষণিক সক্রিয়</p>
              </div>

              <div style={{ marginTop: 18, position: 'relative', zIndex: 2 }}>
                <a 
                  href={messengerUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: 'linear-gradient(135deg, #00B2FF 0%, #006AFF 100%)',
                    color: 'white',
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontWeight: 800,
                    fontSize: 13.5,
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(0, 106, 255, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2C6.477 2 2 6.145 2 11.258C2 14.17 3.433 16.745 5.672 18.39V22L9.123 20.106C10.038 20.364 11.002 20.516 12 20.516C17.523 20.516 22 16.371 22 11.258C22 6.145 17.523 2 12 2ZM13.082 14.437L10.938 12.146L6.758 14.437L11.353 9.549L13.528 11.84L17.677 9.549L13.082 14.437Z" />
                  </svg>
                  <span>মেসেঞ্জারে নক দিন</span>
                </a>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* ── MAIN INTERACTIVE CONTACT SECTION ── */}
      <section style={{ padding: '48px 0 65px' }}>
        <Container>
          <Row className="g-4">
            {/* LEFT COLUMN: Enterprise Message Form */}
            <Col lg={7} md={12}>
              <div className="contact-form-card">
                {/* Header */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ 
                      background: '#ECFDF5', 
                      color: '#059669', 
                      fontSize: 12, 
                      fontWeight: 800, 
                      padding: '4px 12px', 
                      borderRadius: 99,
                      border: '1px solid #A7F3D0'
                    }}>
                      মেসেজ পাঠান
                    </span>
                    <span style={{ color: '#64748B', fontSize: 12.5, fontWeight: 600 }}>
                      • গড় উত্তর সময়: ১৫-৩০ মিনিট
                    </span>
                  </div>
                  <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: 'clamp(21px, 3.2vw, 25px)', marginBottom: 6 }}>
                    আপনার জিজ্ঞাসা বা মতামত জানান
                  </h3>
                  <p style={{ color: '#64748B', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                    নিচের বিভাগ নির্বাচন করে আপনার বার্তাটি পাঠান। আমাদের ডেডিকেটেড টিম দ্রুত আপনার সাথে যোগাযোগ করবে।
                  </p>
                </div>

                {/* Department Selector Tabs */}
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 8 }}>
                    বিভাগ বা বিষয়ের ধরন নির্বাচন করুন:
                  </label>
                  <div className="dept-tabs-container">
                    {DEPARTMENTS.map((dept) => (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => handleDepartmentChange(dept)}
                        className={`dept-pill-btn ${activeDepartment === dept.id ? 'active' : ''}`}
                      >
                        {dept.icon}
                        <span>{dept.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Success Banner */}
                {submitted && (
                  <div style={{ 
                    background: '#ECFDF5', 
                    border: '1.5px solid #6EE7B7', 
                    borderRadius: 16, 
                    padding: '16px 20px', 
                    marginBottom: 22, 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: 12,
                    color: '#065F46'
                  }}>
                    <CheckCircle2 size={24} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#064E3B', marginBottom: 2 }}>
                        আপনার বার্তাটি সফলভাবে জমা হয়েছে!
                      </div>
                      <div style={{ fontSize: 13, color: '#047857', lineHeight: 1.5 }}>
                        ধন্যবাদ। আমাদের সংশ্লিষ্ট বিভাগের সাপোর্ট স্পেশালিস্ট অতি দ্রুত আপনার ইমেইল বা ফোন নম্বরে যোগাযোগ করবেন।
                      </div>
                    </div>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <Row className="g-3">
                    {/* Name */}
                    <Col md={6} xs={12}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                        আপনার পুরো নাম <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <div className="input-group-custom">
                        <User size={17} className="input-icon" />
                        <input
                          id="contact-name"
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          required
                          placeholder="উদাঃ মোঃ রহিম আহমেদ"
                          className="contact-input"
                        />
                      </div>
                    </Col>

                    {/* Phone */}
                    <Col md={6} xs={12}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                        মোবাইল নম্বর <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <div className="input-group-custom">
                        <Phone size={17} className="input-icon" />
                        <input
                          id="contact-phone"
                          value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                          required
                          placeholder="017XXXXXXXX"
                          className="contact-input"
                        />
                      </div>
                    </Col>

                    {/* Email */}
                    <Col md={6} xs={12}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                        ইমেইল ঠিকানা <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <div className="input-group-custom">
                        <Mail size={17} className="input-icon" />
                        <input
                          id="contact-email"
                          type="email"
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          required
                          placeholder="rahim@example.com"
                          className="contact-input"
                        />
                      </div>
                    </Col>

                    {/* Subject Line */}
                    <Col md={6} xs={12}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                        বার্তার বিষয় <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <div className="input-group-custom">
                        <MessageSquare size={17} className="input-icon" />
                        <input
                          id="contact-subject"
                          value={form.subject}
                          onChange={e => setForm({ ...form, subject: e.target.value })}
                          required
                          placeholder="বার্তার মূল বিষয়"
                          className="contact-input"
                        />
                      </div>
                    </Col>

                    {/* Dynamic Extra Field based on department */}
                    {DEPARTMENTS.find(d => d.id === activeDepartment)?.extraLabel && (
                      <Col xs={12}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                          {DEPARTMENTS.find(d => d.id === activeDepartment).extraLabel}
                        </label>
                        <input
                          id="contact-extra"
                          value={form.extraField}
                          onChange={e => setForm({ ...form, extraField: e.target.value })}
                          placeholder="প্রাসঙ্গিক তথ্য এখানে লিখুন"
                          className="contact-input"
                        />
                      </Col>
                    )}

                    {/* Message Box */}
                    <Col xs={12}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', margin: 0 }}>
                          আপনার বিস্তারিত বার্তা <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <span style={{ fontSize: 11.5, color: '#94A3B8' }}>{form.message.length}/500 অক্ষর</span>
                      </div>
                      <textarea
                        id="contact-message"
                        value={form.message}
                        onChange={e => setForm({ ...form, message: e.target.value.slice(0, 500) })}
                        required
                        rows={4}
                        placeholder="আপনার জিজ্ঞাসা, সমস্যা বা প্রয়োজনীয় সেবা সম্পর্কে বিস্তারিত লিখুন..."
                        className="contact-input"
                        style={{ resize: 'vertical', minHeight: 115 }}
                      />
                    </Col>

                    {/* Submit Button & Privacy note */}
                    <Col xs={12} className="mt-2">
                      <button
                        id="contact-submit"
                        type="submit"
                        disabled={loading}
                        style={{
                          background: 'linear-gradient(135deg, #00B875 0%, #059669 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 14,
                          padding: '14px 28px',
                          fontWeight: 800,
                          fontSize: 15,
                          cursor: loading ? 'not-allowed' : 'pointer',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif",
                          boxShadow: '0 8px 20px rgba(0, 184, 117, 0.3)',
                          transition: 'all 0.25s ease',
                          opacity: loading ? 0.8 : 1
                        }}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                            বার্তা পাঠানো হচ্ছে...
                          </>
                        ) : (
                          <>
                            <Send size={18} /> 
                            <span>বার্তা পাঠান</span>
                          </>
                        )}
                      </button>

                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: 6, 
                        marginTop: 12, 
                        color: '#64748B', 
                        fontSize: 12 
                      }}>
                        <ShieldCheck size={14} color="#059669" />
                        <span>আপনার প্রদত্ত সকল তথ্য কঠোরভাবে সুরক্ষিত ও গোপন রাখা হয়।</span>
                      </div>
                    </Col>
                  </Row>
                </form>
              </div>
            </Col>

            {/* RIGHT COLUMN: Office Info & Map */}
            <Col lg={5} md={12}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* 1. Office Details Card */}
                <div className="contact-info-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ 
                        width: 36, height: 36, borderRadius: 10, 
                        background: '#ECFDF5', color: '#059669', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center' 
                      }}>
                        <Building2 size={18} />
                      </div>
                      <h4 style={{ fontWeight: 800, color: '#0F172A', fontSize: 17, margin: 0 }}>
                        প্রধান কার্যালয়
                      </h4>
                    </div>

                    <span style={{
                      background: isOfficeOpen ? '#DCFCE7' : '#FEF3C7',
                      color: isOfficeOpen ? '#166534' : '#92400E',
                      fontSize: 11.5,
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: 99,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <span style={{ 
                        width: 7, height: 7, borderRadius: '50%', 
                        background: isOfficeOpen ? '#22C55E' : '#F59E0B', 
                        display: 'inline-block',
                        boxShadow: isOfficeOpen ? '0 0 6px #22C55E' : 'none'
                      }} />
                      {isOfficeOpen ? 'অফিস খোলা রয়েছে' : 'অনলাইন ডেস্ক সক্রিয়'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Corporate Address */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ 
                        width: 36, height: 36, borderRadius: 10, 
                        background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: '#475569', flexShrink: 0 
                      }}>
                        <MapPin size={17} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13, marginBottom: 2 }}>ঠিকানা ও অবস্থান</div>
                        <div style={{ color: '#475569', fontSize: 13, lineHeight: 1.5 }}>
                          {addressValue}
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ 
                        width: 36, height: 36, borderRadius: 10, 
                        background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: '#2563EB', flexShrink: 0 
                      }}>
                        <Mail size={17} />
                      </div>
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13, marginBottom: 2 }}>অফিসিয়াল ইমেইল</div>
                        <div style={{ color: '#475569', fontSize: 13, lineHeight: 1.5, wordBreak: 'break-all' }}>
                          {emailValue}
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleCopy(emailValue, 'officeEmail')}
                        style={{ 
                          border: 'none', background: '#F1F5F9', color: '#475569', 
                          borderRadius: 8, padding: '5px 8px', fontSize: 11.5, 
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 
                        }}
                        title="ইমেইল কপি করুন"
                      >
                        {copiedField === 'officeEmail' ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                        <span>{copiedField === 'officeEmail' ? 'কপি হয়েছে' : 'কপি'}</span>
                      </button>
                    </div>

                    {/* Office Hours */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ 
                        width: 36, height: 36, borderRadius: 10, 
                        background: '#FFF1F2', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: '#E11D48', flexShrink: 0 
                      }}>
                        <Clock size={17} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13, marginBottom: 2 }}>কার্যক্রমের সময়সূচী</div>
                        <div style={{ color: '#475569', fontSize: 13, lineHeight: 1.5 }}>
                          {officeHoursValue}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#059669', fontWeight: 700, marginTop: 2 }}>
                          অনলাইন সিরিয়াল ও হটলাইন: ২৪ ঘণ্টা চালু
                        </div>
                      </div>
                    </div>

                    {/* Official Portal */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ 
                        width: 36, height: 36, borderRadius: 10, 
                        background: '#FAF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: '#9333EA', flexShrink: 0 
                      }}>
                        <Globe size={17} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13, marginBottom: 2 }}>অফিসিয়াল পোর্টাল</div>
                        <div style={{ color: '#475569', fontSize: 13, lineHeight: 1.5 }}>
                          {site.website || 'www.doctorbooklet.com.bd'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Interactive Google Map Embed Card */}
                <div id="office-map" style={{
                  background: '#FFFFFF',
                  borderRadius: 24,
                  padding: 14,
                  border: '1.5px solid #E2E8F0',
                  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
                  position: 'relative'
                }}>
                  <div style={{ borderRadius: 16, overflow: 'hidden', height: 215, position: 'relative' }}>
                    {contact.map_embed ? (
                      <iframe 
                        src={contact.map_embed} 
                        width="100%" 
                        height="215" 
                        style={{ border: 0 }} 
                        allowFullScreen 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade" 
                        title="Doctor Booklet Office Location Map" 
                      />
                    ) : (
                      <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14608.036944849319!2d90.36710724874272!3d23.747049993356064!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b8b33cffc3fb%3A0x4a826f475fd312af!2sDhanmondi%2C%20Dhaka!5e0!3m2!1sen!2sbd!4v1710000000000!5m2!1sen!2sbd"
                        width="100%"
                        height="215"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Doctor Booklet Dhanmondi Map"
                      />
                    )}
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 6px', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: 12.5, color: '#475569', fontWeight: 700 }}>ঢাকা ধানমন্ডি সেন্ট্রাল অফিস</span>
                    <a 
                      href="https://maps.google.com/?q=Dhanmondi,Dhaka" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        color: '#059669', 
                        fontSize: 12.5, 
                        fontWeight: 800, 
                        textDecoration: 'none', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 4 
                      }}
                    >
                      <span>গুগল ম্যাপে ডিরেকশন</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* ── QUICK FAQ ACCORDION SECTION ── */}
          <div style={{ marginTop: 55 }}>
            <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 28px' }}>
              <span style={{ 
                background: '#ECFDF5', 
                color: '#059669', 
                fontSize: 12, 
                fontWeight: 800, 
                padding: '4px 14px', 
                borderRadius: 99, 
                border: '1px solid #A7F3D0',
                display: 'inline-block',
                marginBottom: 8
              }}>
                দ্রুত সমাধান (Quick FAQs)
              </span>
              <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: 'clamp(20px, 3.2vw, 26px)', margin: '0 0 6px' }}>
                যোগাযোগের আগে সাধারণ জিজ্ঞাসাসমূহ
              </h3>
              <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>
                আপনার কাঙ্ক্ষিত প্রশ্নের তাৎক্ষণিক সমাধান নিচে পেয়ে যেতে পারেন
              </p>
            </div>

            <Row className="justify-content-center">
              <Col lg={10}>
                {FAQS.map((faq, idx) => {
                  const isOpen = activeFaq === idx
                  return (
                    <div 
                      key={idx} 
                      className={`contact-faq-item ${isOpen ? 'active' : ''}`}
                    >
                      <div 
                        className="contact-faq-header"
                        onClick={() => setActiveFaq(isOpen ? null : idx)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ 
                            width: 26, height: 26, borderRadius: '50%', 
                            background: isOpen ? '#00B875' : '#F1F5F9', 
                            color: isOpen ? 'white' : '#64748B', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            fontSize: 12.5, fontWeight: 800, flexShrink: 0 
                          }}>
                            ?
                          </span>
                          <span style={{ fontWeight: 800, fontSize: 15, color: isOpen ? '#064E3B' : '#0F172A' }}>
                            {faq.q}
                          </span>
                        </div>
                        <div style={{ color: isOpen ? '#00B875' : '#94A3B8', flexShrink: 0, transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                          <ChevronDown size={18} />
                        </div>
                      </div>
                      {isOpen && (
                        <div className="contact-faq-body">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* More Questions / Help Center Button */}
                <div style={{ textAlign: 'center', marginTop: 28 }}>
                  <Link
                    to="/support"
                    className="btn-faq-more"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 12,
                      background: 'linear-gradient(135deg, #00B875 0%, #059669 100%)',
                      color: 'white',
                      padding: '13px 30px',
                      borderRadius: 99,
                      fontWeight: 800,
                      fontSize: 15,
                      textDecoration: 'none',
                      boxShadow: '0 8px 22px rgba(0, 184, 117, 0.35)',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <HelpCircle size={19} />
                    <span>আরো জানুন (সাহায্য কেন্দ্র FAQ)</span>
                    <span style={{ opacity: 0.6, fontSize: 16 }}>|</span>
                    <ArrowRight size={17} />
                  </Link>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </section>
    </div>
  )
}

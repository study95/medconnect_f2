import React, { useState, useEffect } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { 
  MapPin, Phone, Mail, Globe, Clock, Send, ShieldCheck, 
  Headset, CheckCircle2, Copy, ExternalLink,
  Building2, ArrowRight, MessageSquare
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

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: 'সাধারণ জিজ্ঞাসা', message: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [copiedField, setCopiedField] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.phone || !form.message) {
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setForm({ name: '', email: '', phone: '', subject: 'সাধারণ জিজ্ঞাসা', message: '' })
    setLoading(false)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 5000)
  }

  const handleCopy = (text, fieldName) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
    }
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const SUBJECTS = [
    { label: 'সাধারণ জিজ্ঞাসা', icon: '❓' },
    { label: 'অ্যাপয়েন্টমেন্ট সংক্রান্ত', icon: '📅' },
    { label: 'পেমেন্ট সমস্যা', icon: '💳' },
    { label: 'ডাক্তার নিবন্ধন', icon: '🩺' },
    { label: 'হাসপাতাল সহায়তা', icon: '🏥' },
    { label: 'অন্যান্য', icon: '💬' }
  ]

  return (
    <div className="page-wrapper contact-page-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <style>{`
        .contact-hero {
          background: linear-gradient(135deg, #013A28 0%, #064E3B 50%, #00B875 100%);
          padding-bottom: 90px;
          position: relative;
          overflow: hidden;
          color: white;
        }
        @media (max-width: 768px) {
          .contact-hero {
            padding-bottom: 50px;
          }
        }
        .contact-strip-container {
          margin-top: -65px;
          position: relative;
          z-index: 10;
        }
        @media (max-width: 768px) {
          .contact-strip-container {
            margin-top: -30px;
          }
        }
        .contact-card {
          background: white;
          border-radius: 20px;
          padding: 24px 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.06);
          border: 1.5px solid #E2E8F0;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .contact-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px rgba(0,0,0,0.1);
        }
        .trust-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          width: 100%;
          max-width: 600px;
        }
        @media (max-width: 480px) {
          .trust-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }
        .trust-badge-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 14px;
          padding: 10px 14px;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .contact-form-card {
          background: white;
          border-radius: 24px;
          padding: 32px 28px;
          border: 1.5px solid #E2E8F0;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
        }
        @media (max-width: 768px) {
          .contact-form-card {
            padding: 22px 18px;
            border-radius: 20px;
          }
        }
        .contact-info-card {
          background: white;
          border-radius: 24px;
          padding: 28px 24px;
          border: 1.5px solid #E2E8F0;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
        }
        @media (max-width: 768px) {
          .contact-info-card {
            padding: 20px 16px;
            border-radius: 20px;
          }
        }
        .contact-input {
          width: 100%;
          padding: 13px 16px;
          border-radius: 12px;
          border: 1.5px solid #E2E8F0;
          font-size: 15px;
          outline: none;
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
          transition: all 0.2s ease;
          background: #FAFAFA;
          color: #0F172A;
          font-weight: 500;
        }
        .contact-input:focus {
          border-color: #00B875;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(0, 184, 117, 0.15);
        }
        .emergency-bar {
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
          border-radius: 20px;
          padding: 20px 24px;
          color: white;
          box-shadow: 0 10px 25px rgba(15,23,42,0.15);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        @media (max-width: 576px) {
          .emergency-bar {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
            padding: 18px 16px;
          }
          .emergency-bar .btn-emergency {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      {/* ── HERO SECTION ── */}
      <section className="contact-hero">
        {/* Background Decorative Rings */}
        <div style={{ position: 'absolute', right: -80, top: -80, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: -80, bottom: -80, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0, 184, 117, 0.25) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none' }} />

        <BreadcrumbHUD links={[{ label: 'যোগাযোগ' }]} variant="light" />

        <Container style={{ position: 'relative', zIndex: 2, marginTop: 12 }}>
          <Row className="align-items-center g-4">
            <Col lg={7} md={12}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '6px 14px',
                borderRadius: 99,
                fontSize: 12.5,
                fontWeight: 700,
                marginBottom: 16,
                color: '#F0FDF4'
              }}>
                <Headset size={15} /> 
                <span>২৪/৭ কাস্টমার সাপোর্ট সেন্টার</span>
              </div>

              <h1 style={{ 
                color: 'white', 
                fontWeight: 900, 
                fontSize: 'clamp(24px, 5vw, 44px)', 
                lineHeight: 1.25, 
                marginBottom: 14,
                letterSpacing: '-0.3px'
              }}>
                {contact.hero_title || 'আমরা আছি আপনার সেবায় সর্বদা'}
              </h1>

              <p style={{ 
                color: 'rgba(255,255,255,0.9)', 
                fontSize: 'clamp(14px, 2vw, 16px)', 
                lineHeight: 1.7, 
                marginBottom: 24, 
                maxWidth: 580,
                fontWeight: 400
              }}>
                {contact.hero_subtitle || 'আপনার যেকোনো প্রশ্ন, মতামত বা কারিগরি সহায়তার জন্য আমাদের সাথে বার্তা পাঠান অথবা সরাসরি আমাদের কল সেন্টারে ফোন করুন।'}
              </p>

              {/* Quick Trust Indicators */}
              <div className="trust-grid">
                {[
                  { icon: <Clock size={16} />, label: 'দ্রুত সাড়া', sub: 'গড় ১৫ মিনিট' },
                  { icon: <ShieldCheck size={16} />, label: 'সুরক্ষিত তথ্য', sub: '১০০% গোপনীয়তা' },
                  { icon: <Headset size={16} />, label: '২৪/৭ সহায়তা', sub: 'দক্ষ সাপোর্ট টিম' }
                ].map((item, i) => (
                  <div key={i} className="trust-badge-item">
                    <div style={{ 
                      width: 34, height: 34, borderRadius: 10, 
                      background: 'rgba(255,255,255,0.2)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      color: 'white',
                      flexShrink: 0
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ color: 'white', fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>{item.label}</div>
                      <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11.5, lineHeight: 1.2 }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Col>

            <Col lg={5} className="d-none d-lg-block text-center">
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img 
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=700&q=80" 
                  alt="Doctor Booklet Support" 
                  style={{ 
                    width: '100%', 
                    maxWidth: 440, 
                    height: 350, 
                    objectFit: 'cover', 
                    borderRadius: 28, 
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
                    border: '3px solid rgba(255,255,255,0.2)'
                  }} 
                />
                <div style={{
                  position: 'absolute',
                  bottom: -15,
                  left: -15,
                  background: 'white',
                  color: '#0F172A',
                  padding: '14px 20px',
                  borderRadius: 18,
                  boxShadow: '0 16px 30px rgba(0,0,0,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  border: '1px solid #E2E8F0'
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00B875' }}>
                    <CheckCircle2 size={22} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>স্বাস্থ্য সেবায় নিবেদিত</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>আপনার সুস্থতাই আমাদের মূল লক্ষ্য</div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── CONTACT CHANNELS SUMMARY STRIP ── */}
      <Container className="contact-strip-container">
        <Row className="g-3 justify-content-center">
          {[
            {
              icon: <Phone size={20} />,
              title: 'টেলিফোন / হেল্পলাইন',
              primary: contact.phone || site.phone || '017 XXXX XXXX',
              secondary: '২৪/৭ সাপোর্ট',
              actionText: 'সরাসরি কল করুন',
              actionHref: `tel:${contact.phone || site.phone || '017XXXXXXXX'}`,
              bgColor: '#F0FDF4',
              iconColor: '#00B875'
            },
            {
              icon: <Mail size={20} />,
              title: 'ইমেইল সহায়তা',
              primary: contact.email || site.email_support || site.email || 'info@doctorbooklet.com.bd',
              secondary: '২ ঘণ্টার মধ্যে উত্তর',
              actionText: 'ইমেইল পাঠান',
              actionHref: `mailto:${contact.email || site.email_support || site.email || 'info@doctorbooklet.com.bd'}`,
              bgColor: '#EFF6FF',
              iconColor: '#2563EB'
            },
            {
              icon: <MapPin size={20} />,
              title: contact.office_title || 'প্রধান কার্যালয়',
              primary: contact.address || site.address || 'ধানমন্ডি, ঢাকা-১২০৫',
              secondary: 'শনি - বৃহস্পতি',
              actionText: 'ম্যাপে দেখুন',
              actionHref: '#office-map',
              bgColor: '#FEF3C7',
              iconColor: '#D97706'
            }
          ].map((channel, i) => (
            <Col key={i} lg={4} md={4} sm={12}>
              <div className="contact-card">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
                    <div style={{ 
                      width: 44, height: 44, borderRadius: 14, 
                      background: channel.bgColor, color: channel.iconColor, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {channel.icon}
                    </div>
                    <span style={{ 
                      fontSize: 11.5, 
                      fontWeight: 700, 
                      background: '#F1F5F9', 
                      color: '#475569', 
                      padding: '4px 10px', 
                      borderRadius: 99,
                      whiteSpace: 'nowrap'
                    }}>
                      {channel.secondary}
                    </span>
                  </div>
                  <h5 style={{ fontWeight: 800, fontSize: 16, color: '#0F172A', marginBottom: 4 }}>{channel.title}</h5>
                  <p style={{ color: '#334155', fontWeight: 600, fontSize: 14, margin: 0, wordBreak: 'break-word', lineHeight: 1.5 }}>{channel.primary}</p>
                </div>
                <div style={{ marginTop: 18 }}>
                  <a href={channel.actionHref} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: channel.iconColor,
                    fontWeight: 800,
                    fontSize: 13.5,
                    textDecoration: 'none'
                  }}>
                    <span>{channel.actionText}</span>
                    <ArrowRight size={15} />
                  </a>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>

      {/* ── MAIN CONTACT FORM & LOCATION SECTION ── */}
      <section style={{ padding: '40px 0 70px' }}>
        <Container>
          <Row className="g-4">
            {/* LEFT COLUMN: Contact Form */}
            <Col lg={7} md={12}>
              <div className="contact-form-card">
                <div style={{ marginBottom: 24 }}>
                  <span style={{ background: '#F0FDF4', color: '#00B875', fontSize: 12.5, fontWeight: 800, padding: '4px 12px', borderRadius: 99, display: 'inline-block', marginBottom: 8 }}>
                    মেসেজ পাঠান
                  </span>
                  <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: 'clamp(20px, 3.5vw, 24px)', marginBottom: 6 }}>
                    আমাদের সাথে সরাসরি যোগাযোগ করুন
                  </h3>
                  <p style={{ color: '#64748B', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                    আপনার তথ্য পূরণ করে বার্তা পাঠান। আমাদের সাপোর্ট স্পেশালিস্ট দ্রুত আপনাকে সাহায্য করবেন।
                  </p>
                </div>

                {submitted && (
                  <div style={{ 
                    background: '#F0FDF4', 
                    border: '1.5px solid #86EFAC', 
                    borderRadius: 14, 
                    padding: '14px 18px', 
                    marginBottom: 20, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12,
                    color: '#166534'
                  }}>
                    <CheckCircle2 size={20} color="#16A34A" />
                    <div style={{ fontSize: 14, fontWeight: 700 }}>
                      আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে! আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <Row className="g-3">
                    {/* Subject Selector Dropdown */}
                    <Col xs={12}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>
                        বার্তার বিষয় নির্বাচন করুন <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <select
                        id="contact-subject"
                        value={form.subject}
                        onChange={e => setForm({ ...form, subject: e.target.value })}
                        required
                        className="contact-input"
                        style={{ cursor: 'pointer' }}
                      >
                        <option value="">বিষয় নির্বাচন করুন</option>
                        {SUBJECTS.map((s) => (
                          <option key={s.label} value={s.label}>
                            {s.icon} {s.label}
                          </option>
                        ))}
                      </select>
                    </Col>

                    {/* Name */}
                    <Col md={6} xs={12}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>
                        আপনার পুরো নাম <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        id="contact-name"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        required
                        placeholder="উদাঃ মোঃ রহিম আহমেদ"
                        className="contact-input"
                      />
                    </Col>

                    {/* Email */}
                    <Col md={6} xs={12}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>
                        ইমেইল ঠিকানা <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        required
                        placeholder="rahim@example.com"
                        className="contact-input"
                      />
                    </Col>

                    {/* Phone */}
                    <Col xs={12}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>
                        মোবাইল নম্বর <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        id="contact-phone"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        required
                        placeholder="017XXXXXXXX"
                        className="contact-input"
                      />
                    </Col>

                    {/* Message Box */}
                    <Col xs={12}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', margin: 0 }}>
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
                        placeholder="আপনার প্রশ্ন বা মতামত সম্পর্কে বিস্তারিত লিখুন..."
                        className="contact-input"
                        style={{ resize: 'vertical', minHeight: 110 }}
                      />
                    </Col>

                    {/* Submit Button */}
                    <Col xs={12} className="mt-3">
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
                          boxShadow: '0 6px 20px rgba(0, 184, 117, 0.3)',
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
                            <Send size={17} /> 
                            <span>বার্তা পাঠান</span>
                          </>
                        )}
                      </button>
                    </Col>
                  </Row>
                </form>
              </div>
            </Col>

            {/* RIGHT COLUMN: Office Info & Map */}
            <Col lg={5} md={12}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Office Details Card */}
                <div className="contact-info-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                    <h4 style={{ fontWeight: 800, color: '#0F172A', fontSize: 18, margin: 0 }}>
                      অফিস সম্পর্কিত তথ্য
                    </h4>
                    <span style={{
                      background: '#DCFCE7',
                      color: '#166534',
                      fontSize: 11.5,
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: 99,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5
                    }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                      এখন খোলা রয়েছে
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {/* Address */}
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00B875', flexShrink: 0 }}>
                        <Building2 size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13.5, marginBottom: 2 }}>ঠিকানা</div>
                        <div style={{ color: '#64748B', fontSize: 13, lineHeight: 1.5 }}>
                          {contact.address || site.address || 'মেডকানেক্ট কমপ্লেক্স, বাড়ি নং ১২, রোড নং ৫, ধানমন্ডি, ঢাকা-১২০৫'}
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', flexShrink: 0 }}>
                        <Mail size={18} />
                      </div>
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13.5, marginBottom: 2 }}>অফিসিয়াল ইমেইল</div>
                        <div style={{ color: '#64748B', fontSize: 13, lineHeight: 1.5, wordBreak: 'break-all' }}>
                          {contact.email || site.email || 'info@doctorbooklet.com.bd'}
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleCopy(contact.email || site.email || 'info@doctorbooklet.com.bd', 'email')}
                        style={{ border: 'none', background: '#F1F5F9', color: '#475569', borderRadius: 8, padding: '5px 8px', fontSize: 11.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}
                        title="ইমেইল কপি করুন"
                      >
                        <Copy size={12} /> {copiedField === 'email' ? 'কপি হয়েছে' : 'কপি'}
                      </button>
                    </div>

                    {/* Office Hours */}
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: '#FFE4E6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E11D48', flexShrink: 0 }}>
                        <Clock size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13.5, marginBottom: 2 }}>কার্যক্রমের সময়সূচী</div>
                        <div style={{ color: '#64748B', fontSize: 13, lineHeight: 1.5 }}>
                          {contact.office_hours || site.office_hours || 'শনিবার - বৃহস্পতিবার: সকাল ৯টা - রাত ৮টা'}
                        </div>
                      </div>
                    </div>

                    {/* Website */}
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333EA', flexShrink: 0 }}>
                        <Globe size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13.5, marginBottom: 2 }}>ওয়েবসাইট</div>
                        <div style={{ color: '#64748B', fontSize: 13, lineHeight: 1.5, wordBreak: 'break-all' }}>
                          {site.website || 'www.doctorbooklet.com.bd'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Google Map Box */}
                <div id="office-map" style={{
                  background: 'white',
                  borderRadius: 24,
                  padding: 14,
                  border: '1.5px solid #E2E8F0',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                  position: 'relative'
                }}>
                  <div style={{ borderRadius: 16, overflow: 'hidden', height: 210, position: 'relative' }}>
                    {contact.map_embed ? (
                      <iframe 
                        src={contact.map_embed} 
                        width="100%" 
                        height="210" 
                        style={{ border: 0 }} 
                        allowFullScreen 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade" 
                        title="Doctor Booklet Office Location Map" 
                      />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F1F5F9', color: '#64748B' }}>
                        <MapPin size={32} color="#00B875" style={{ marginBottom: 6 }} />
                        <span style={{ fontWeight: 700, fontSize: 13.5 }}>ধানমন্ডি, ঢাকা-১২০৫</span>
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 6px', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 600 }}>ঢাকা ধানমন্ডি সেন্ট্রাল অফিস</span>
                    <a 
                      href="https://maps.google.com/?q=Dhanmondi,Dhaka" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#00B875', fontSize: 12.5, fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <span>গুগল ম্যাপে খুলুন</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>

                {/* 24/7 Emergency Callout Box */}
                <div className="emergency-bar">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ background: '#EF4444', color: 'white', fontSize: 10.5, fontWeight: 800, padding: '2px 7px', borderRadius: 99 }}>জরুরী হটলাইন</span>
                      <h5 style={{ margin: 0, fontWeight: 800, fontSize: 15, color: 'white' }}>জরুরী স্বাস্থ্য সেবা?</h5>
                    </div>
                    <p style={{ margin: 0, color: '#94A3B8', fontSize: 12.5, lineHeight: 1.4 }}>২৪ ঘণ্টা তাৎক্ষণিক জরুরি চিকিৎসকের জন্য কল করুন</p>
                  </div>
                  <a 
                    href={`tel:${site.phone || '999'}`}
                    className="btn-emergency"
                    style={{
                      background: '#00B875',
                      color: 'white',
                      padding: '10px 18px',
                      borderRadius: 12,
                      fontWeight: 800,
                      fontSize: 13.5,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 4px 12px rgba(0, 184, 117, 0.4)',
                      flexShrink: 0
                    }}
                  >
                    <Phone size={15} /> 
                    <span>{site.phone || '017 XXXX XXXX'}</span>
                  </a>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  )
}


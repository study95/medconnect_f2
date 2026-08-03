import React, { useState } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { 
  MapPin, Phone, Mail, Globe, Clock, Send, ShieldCheck, 
  MessageSquare, Headset, CheckCircle2, Copy, ExternalLink,
  Sparkles, AlertCircle, Building2, User, HelpCircle, ArrowRight
} from 'lucide-react'
import { getContent } from '../utils/contentService'
import { toast } from 'react-toastify'
import BreadcrumbHUD from '../components/common/BreadcrumbHUD'

export default function ContactPage() {
  const cms = getContent()
  const site = cms.site || {}
  const contact = cms.contact || {}
  const nl = cms.newsletter || {}

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: 'সাধারণ জিজ্ঞাসা', message: '' })
  const [loading, setLoading] = useState(false)
  const [copiedField, setCopiedField] = useState(null)
  const [nlEmail, setNlEmail] = useState('')
  const [nlLoading, setNlLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.phone || !form.message) {
      toast.error('অনুগ্ৰহ করে প্রয়োজনীয় ঘরগুলো পূরণ করুন।')
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    toast.success('ধন্যবাদ! আপনার বার্তা সফলভাবে জমা হয়েছে। আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।')
    setForm({ name: '', email: '', phone: '', subject: 'সাধারণ জিজ্ঞাসা', message: '' })
    setLoading(false)
  }

  const handleNewsletter = async (e) => {
    e.preventDefault()
    if (!nlEmail || !nlEmail.includes('@')) {
      toast.error('একটি সঠিক ইমেইল ঠিকানা প্রদান করুন।')
      return
    }
    setNlLoading(true)
    await new Promise(r => setTimeout(r, 600))
    toast.success('আমাদের নিউজলেটারে সাবস্ক্রাইব করার জন্য ধন্যবাদ!')
    setNlEmail('')
    setNlLoading(false)
  }

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    toast.info(`${text} কপি করা হয়েছে!`)
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

  const inputStyle = {
    width: '100%',
    padding: '14px 18px',
    borderRadius: 14,
    border: '1.5px solid #E2E8F0',
    fontSize: 14,
    outline: 'none',
    fontFamily: "'Hind Siliguri', sans-serif",
    transition: 'all 0.2s ease',
    background: '#FAFAFA',
    color: '#0F172A',
    fontWeight: 500
  }

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      {/* ── HERO SECTION ── */}
      <section style={{ 
        background: 'linear-gradient(135deg, #004D40 0%, #00796B 50%, #00A88C 100%)', 
        padding: '0 0 110px', 
        position: 'relative', 
        overflow: 'hidden',
        color: 'white'
      }}>
        {/* Background Decorative Rings */}
        <div style={{ position: 'absolute', right: -80, top: -80, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: -100, bottom: -100, width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,201,167,0.2) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none' }} />

        <BreadcrumbHUD links={[{ label: 'যোগাযোগ' }]} variant="light" />

        <Container style={{ position: 'relative', zIndex: 2, marginTop: 20 }}>
          <Row className="align-items-center g-5">
            <Col lg={7}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '6px 18px',
                borderRadius: 99,
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 20,
                color: '#E6FFFA'
              }}>
                <Headset size={16} /> 
                <span>২৪/৭ কাস্টমার সাপোর্ট সেন্টার</span>
              </div>

              <h1 style={{ 
                color: 'white', 
                fontWeight: 900, 
                fontSize: 'clamp(30px, 4.5vw, 52px)', 
                lineHeight: 1.25, 
                marginBottom: 20,
                letterSpacing: '-0.5px'
              }}>
                {contact.hero_title || 'আমরা আছি আপনার সেবায় সর্বদা'}
              </h1>

              <p style={{ 
                color: 'rgba(255,255,255,0.9)', 
                fontSize: 'clamp(15px, 1.8vw, 18px)', 
                lineHeight: 1.8, 
                marginBottom: 36, 
                maxWidth: 580,
                fontWeight: 400
              }}>
                {contact.hero_subtitle || 'আপনার যেকোনো প্রশ্ন, মতামত বা কারিগরি সহায়তার জন্য আমাদের সাথে বার্তা পাঠান অথবা সরাসরি আমাদের কল সেন্টারে ফোন করুন।'}
              </p>

              {/* Quick Trust Indicators */}
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {[
                  { icon: <Clock size={18} />, label: 'দ্রুত সাড়া', sub: 'গড় ১৫ মিনিট' },
                  { icon: <ShieldCheck size={18} />, label: 'সুরক্ষিত তথ্য', sub: '১০০% গোপনীয়তা' },
                  { icon: <Headset size={18} />, label: '২৪/৭ সহায়তা', sub: 'দক্ষ সাপোর্ট টিম' }
                ].map((item, i) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    background: 'rgba(255,255,255,0.1)', 
                    backdropFilter: 'blur(12px)', 
                    borderRadius: 16, 
                    padding: '12px 18px', 
                    border: '1px solid rgba(255,255,255,0.18)' 
                  }}>
                    <div style={{ 
                      width: 38, height: 38, borderRadius: 12, 
                      background: 'rgba(255,255,255,0.2)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      color: 'white' 
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>{item.label}</div>
                      <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{item.sub}</div>
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
                    maxWidth: 460, 
                    height: 380, 
                    objectFit: 'cover', 
                    borderRadius: 32, 
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
                    border: '4px solid rgba(255,255,255,0.2)'
                  }} 
                />
                <div style={{
                  position: 'absolute',
                  bottom: -20,
                  left: -20,
                  background: 'white',
                  color: '#0F172A',
                  padding: '16px 24px',
                  borderRadius: 20,
                  boxShadow: '0 20px 30px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  border: '1px solid #E2E8F0'
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A88C' }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>স্বাস্থ্য সেবায় নিবেদিত</div>
                    <div style={{ fontSize: 13, color: '#64748B' }}>আপনার সুস্থতাই আমাদের মূল লক্ষ্য</div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── CONTACT CHANNELS SUMMARY STRIP (OVERLAPPING GREEN BG TO CARD MIDDLE) ── */}
      <Container style={{ marginTop: -100, position: 'relative', zIndex: 10 }}>
        <Row className="g-4 justify-content-center">
          {[
            {
              icon: <Phone size={22} />,
              title: 'টেলিফোন / হেল্পলাইন',
              primary: site.phone || '017 XXXX XXXX',
              secondary: '২৪/৭ সাপোর্ট উপলব্ধ',
              actionText: 'কল করুন',
              actionHref: `tel:${site.phone}`,
              bgColor: '#F0FDF4',
              iconColor: '#00A88C'
            },
            {
              icon: <Mail size={22} />,
              title: 'ইমেইল সহায়তা',
              primary: site.email_support || 'support@doctorbooklet.com.bd',
              secondary: '২ ঘণ্টার মধ্যে উত্তর দেওয়া হয়',
              actionText: 'ইমেইল পাঠান',
              actionHref: `mailto:${site.email_support || 'support@doctorbooklet.com.bd'}`,
              bgColor: '#EFF6FF',
              iconColor: '#2563EB'
            },
            {
              icon: <MapPin size={22} />,
              title: 'প্রধান কার্যালয়',
              primary: 'ধানমন্ডি, ঢাকা-১২০৫',
              secondary: 'শনিবার - বৃহস্পতিবার (৯টা - ৮টা)',
              actionText: 'ম্যাপে দেখুন',
              actionHref: '#office-map',
              bgColor: '#FEF3C7',
              iconColor: '#D97706'
            }
          ].map((channel, i) => (
            <Col key={i} lg={4} md={4} sm={12}>
              <div style={{
                background: 'white',
                borderRadius: 24,
                padding: 28,
                boxShadow: '0 15px 35px rgba(0,0,0,0.08)',
                border: '1.5px solid #E2E8F0',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                transition: 'all 0.3s ease'
              }} className="hover-lift">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ 
                      width: 50, height: 50, borderRadius: 16, 
                      background: channel.bgColor, color: channel.iconColor, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                      {channel.icon}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, background: '#F1F5F9', color: '#475569', padding: '4px 12px', borderRadius: 99 }}>
                      {channel.secondary}
                    </span>
                  </div>
                  <h5 style={{ fontWeight: 800, fontSize: 17, color: '#0F172A', marginBottom: 6 }}>{channel.title}</h5>
                  <p style={{ color: '#334155', fontWeight: 700, fontSize: 15, margin: 0, wordBreak: 'break-word' }}>{channel.primary}</p>
                </div>
                <div style={{ marginTop: 24 }}>
                  <a href={channel.actionHref} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    color: channel.iconColor,
                    fontWeight: 800,
                    fontSize: 14,
                    textDecoration: 'none'
                  }}>
                    <span>{channel.actionText}</span>
                    <ArrowRight size={16} />
                  </a>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>

      {/* ── MAIN CONTACT FORM & LOCATION SECTION ── */}
      <section style={{ padding: '70px 0 90px' }}>
        <Container>
          <Row className="g-5">
            {/* LEFT COLUMN: Contact Form */}
            <Col lg={7}>
              <div style={{
                background: 'white',
                borderRadius: 28,
                padding: '40px 36px',
                border: '1.5px solid #E2E8F0',
                boxShadow: '0 12px 35px rgba(0,0,0,0.04)'
              }}>
                <div style={{ marginBottom: 32 }}>
                  <span style={{ background: '#E6FFFA', color: '#00796B', fontSize: 13, fontWeight: 800, padding: '5px 14px', borderRadius: 99, display: 'inline-block', marginBottom: 10 }}>
                    মেসেজ পাঠান
                  </span>
                  <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: 26, marginBottom: 8 }}>
                    আমাদের সাথে সরাসরি যোগাযোগ করুন
                  </h3>
                  <p style={{ color: '#64748B', fontSize: 15, margin: 0 }}>
                    আপনার তথ্য পূরণ করে বার্তা পাঠান। আমাদের সাপোর্ট স্পেশালিস্ট অবিলম্বে আপনাকে সাহায্য করবেন।
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <Row className="g-3">
                    {/* Subject Selector Dropdown */}
                    <Col md={12}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                        বার্তার বিষয় নির্বাচন করুন <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <select
                        id="contact-subject"
                        value={form.subject}
                        onChange={e => setForm({ ...form, subject: e.target.value })}
                        required
                        style={{ ...inputStyle, cursor: 'pointer' }}
                        onFocus={e => { e.target.style.borderColor = '#00A88C'; e.target.style.background = '#FFFFFF'; e.target.style.boxShadow = '0 0 0 4px rgba(0, 168, 140, 0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA'; e.target.style.boxShadow = 'none'; }}
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
                    <Col md={6}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                        আপনার পুরো নাম <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          id="contact-name"
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          required
                          placeholder="উদাঃ মোঃ রহিম আহমেদ"
                          style={inputStyle}
                          onFocus={e => { e.target.style.borderColor = '#00A88C'; e.target.style.background = '#FFFFFF'; e.target.style.boxShadow = '0 0 0 4px rgba(0, 168, 140, 0.1)'; }}
                          onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA'; e.target.style.boxShadow = 'none'; }}
                        />
                      </div>
                    </Col>

                    {/* Email */}
                    <Col md={6}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                        ইমেইল ঠিকানা <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        required
                        placeholder="rahim@example.com"
                        style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = '#00A88C'; e.target.style.background = '#FFFFFF'; e.target.style.boxShadow = '0 0 0 4px rgba(0, 168, 140, 0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA'; e.target.style.boxShadow = 'none'; }}
                      />
                    </Col>

                    {/* Phone */}
                    <Col md={12}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                        মোবাইল নম্বর <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        id="contact-phone"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        required
                        placeholder="017XXXXXXXX"
                        style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = '#00A88C'; e.target.style.background = '#FFFFFF'; e.target.style.boxShadow = '0 0 0 4px rgba(0, 168, 140, 0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA'; e.target.style.boxShadow = 'none'; }}
                      />
                    </Col>

                    {/* Message Box */}
                    <Col md={12}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', margin: 0 }}>
                          আপনার বিস্তারিত বার্তা <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>{form.message.length}/500 অক্ষর</span>
                      </div>
                      <textarea
                        id="contact-message"
                        value={form.message}
                        onChange={e => setForm({ ...form, message: e.target.value.slice(0, 500) })}
                        required
                        rows={5}
                        placeholder="আপনার প্রশ্ন বা মতামত সম্পর্কে বিস্তারিত লিখুন..."
                        style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
                        onFocus={e => { e.target.style.borderColor = '#00A88C'; e.target.style.background = '#FFFFFF'; e.target.style.boxShadow = '0 0 0 4px rgba(0, 168, 140, 0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#FAFAFA'; e.target.style.boxShadow = 'none'; }}
                      />
                    </Col>

                    {/* Submit Button */}
                    <Col md={12} className="mt-4">
                      <button
                        id="contact-submit"
                        type="submit"
                        disabled={loading}
                        style={{
                          background: 'linear-gradient(135deg, #00796B 0%, #00A88C 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 16,
                          padding: '16px 36px',
                          fontWeight: 800,
                          fontSize: 16,
                          cursor: loading ? 'not-allowed' : 'pointer',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          gap: 10,
                          fontFamily: "'Hind Siliguri', sans-serif",
                          boxShadow: '0 8px 25px rgba(0,168,140,0.35)',
                          transition: 'all 0.3s ease',
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
                            <Send size={19} /> 
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
            <Col lg={5}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Office Details Card */}
                <div style={{
                  background: 'white',
                  borderRadius: 28,
                  padding: 32,
                  border: '1.5px solid #E2E8F0',
                  boxShadow: '0 12px 35px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h4 style={{ fontWeight: 800, color: '#0F172A', fontSize: 20, margin: 0 }}>
                      অফিস সম্পর্কিত তথ্য
                    </h4>
                    <span style={{
                      background: '#DCFCE7',
                      color: '#166534',
                      fontSize: 12,
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: 99,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                      এখন খোলা রয়েছে
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                    {/* Address */}
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A88C', flexShrink: 0 }}>
                        <Building2 size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14, marginBottom: 2 }}>ঠিকানা</div>
                        <div style={{ color: '#64748B', fontSize: 13, lineHeight: 1.6 }}>
                          {site.address || 'মেডকানেক্ট কমপ্লেক্স, বাড়ি নং ১২, রোড নং ৫, ধানমন্ডি, ঢাকা-১২০৫'}
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', flexShrink: 0 }}>
                        <Mail size={20} />
                      </div>
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14, marginBottom: 2 }}>অফিসিয়াল ইমেইল</div>
                        <div style={{ color: '#64748B', fontSize: 13, lineHeight: 1.6 }}>
                          {site.email || 'info@doctorbooklet.com.bd'}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleCopy(site.email || 'info@doctorbooklet.com.bd', 'email')}
                        style={{ border: 'none', background: '#F1F5F9', color: '#475569', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        title="ইমেইল কপি করুন"
                      >
                        <Copy size={13} /> {copiedField === 'email' ? 'কপি হয়েছে' : 'কপি'}
                      </button>
                    </div>

                    {/* Office Hours */}
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FFE4E6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E11D48', flexShrink: 0 }}>
                        <Clock size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14, marginBottom: 2 }}>কার্যক্রমের সময়সূচী</div>
                        <div style={{ color: '#64748B', fontSize: 13, lineHeight: 1.6 }}>
                          {site.office_hours || 'শনিবার - বৃহস্পতিবার: সকাল ৯টা - রাত ৮টা'}
                        </div>
                      </div>
                    </div>

                    {/* Website */}
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333EA', flexShrink: 0 }}>
                        <Globe size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14, marginBottom: 2 }}>ওয়েবসাইট</div>
                        <div style={{ color: '#64748B', fontSize: 13, lineHeight: 1.6 }}>
                          {site.website || 'www.doctorbooklet.com.bd'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Google Map Box */}
                <div id="office-map" style={{
                  background: 'white',
                  borderRadius: 28,
                  padding: 16,
                  border: '1.5px solid #E2E8F0',
                  boxShadow: '0 12px 35px rgba(0,0,0,0.04)',
                  position: 'relative'
                }}>
                  <div style={{ borderRadius: 20, overflow: 'hidden', height: 230, position: 'relative' }}>
                    {contact.map_embed ? (
                      <iframe 
                        src={contact.map_embed} 
                        width="100%" 
                        height="230" 
                        style={{ border: 0 }} 
                        allowFullScreen 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade" 
                        title="Doctor Booklet Office Location Map" 
                      />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F1F5F9', color: '#64748B' }}>
                        <MapPin size={36} color="#00A88C" style={{ marginBottom: 8 }} />
                        <span style={{ fontWeight: 700, fontSize: 14 }}>ধানমন্ডি, ঢাকা-১২০৫</span>
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
                    <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>ঢাকা ধানমন্ডি সেন্ট্রাল অফিস</span>
                    <a 
                      href="https://maps.google.com/?q=Dhanmondi,Dhaka" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#00A88C', fontSize: 13, fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <span>গুগল ম্যাপে খুলুন</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>

                {/* 24/7 Emergency Callout Box */}
                <div style={{
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                  borderRadius: 24,
                  padding: '24px 28px',
                  color: 'white',
                  boxShadow: '0 12px 30px rgba(15,23,42,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ background: '#EF4444', color: 'white', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 99 }}>জরুরী হটলাইন</span>
                      <h5 style={{ margin: 0, fontWeight: 800, fontSize: 16, color: 'white' }}>জরুরী স্বাস্থ্য সেবা?</h5>
                    </div>
                    <p style={{ margin: 0, color: '#94A3B8', fontSize: 13 }}>২৪ ঘণ্টা তাৎক্ষণিক জরুরি চিকিৎসকের জন্য কল করুন</p>
                  </div>
                  <a 
                    href={`tel:${site.phone || '999'}`}
                    style={{
                      background: '#00A88C',
                      color: 'white',
                      padding: '12px 20px',
                      borderRadius: 14,
                      fontWeight: 800,
                      fontSize: 14,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 6px 15px rgba(0,168,140,0.4)'
                    }}
                  >
                    <Phone size={16} /> 
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

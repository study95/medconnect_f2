import React, { useState } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import {
  IconArrowRight, IconCheck, IconClock, IconDeviceMobile,
  IconStethoscope, IconBuildingHospital, IconUsers, IconFileText,
  IconCalendar, IconChartBar, IconShieldCheck, IconLock, IconStar,
  IconHeadset, IconChevronRight, IconActivity, IconBell, IconFileInvoice,
  IconAdjustmentsHorizontal, IconUserCheck, IconSearch
} from '@tabler/icons-react'

export default function ServicesPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('doctor')

  const tabFeatures = {
    doctor: [
      { title: 'ডিজিটাল চেম্বার ও স্লট', desc: 'সহজেই চেম্বারের সময়সূচী ও স্লট ম্যানেজ করুন' },
      { title: 'স্মার্ট ই-প্রেসক্রিপশন', desc: 'কয়েক ক্লিকে ডিজিটাল প্রেসক্রিপশন ও ওষুধের তালিকা প্রস্তুত' },
      { title: 'রোগীর ইতিহাস ও রেকর্ড', desc: 'পূর্বের সকল চিকিৎসার ইতিহাস এনক্রিপ্টেড ও সুরক্ষিত' },
      { title: 'অটোমেটিক SMS রিমাইন্ডার', desc: 'রোগীদের অ্যাপয়েন্টমেন্টের সময় স্বয়ংক্রিয় মেসেজ প্রেরণ' },
    ],
    hospital: [
      { title: 'ডাক্তার ও ইউনিট ম্যানেজমেন্ট', desc: 'হাসপাতালের সকল বিভাগ ও ডাক্তারদের তালিকা নিয়ন্ত্রণ' },
      { title: 'ডিজিটাল ইনভয়েস ও কাউন্টার', desc: 'রোগীদের টেস্ট ও ক্যাশ কাউন্টার বিলিং অটোমেশন' },
      { title: 'অকুপেন্সি ও সিট ট্র্যাকিং', desc: 'বেড ও কেবিন বুকিং সংক্রান্ত রিয়েলটাইম তথ্য' },
      { title: 'পেমেন্ট ও রিভিনিউ রিপোর্ট', desc: 'দৈনিক এবং মাসিক আয়-ব্যয়ের পুঙ্খানুপুঙ্খ চার্ট' },
    ],
    patient: [
      { title: 'তাৎক্ষণিক ডাক্তার বুকিং', desc: 'অভিজ্ঞ বিশেষজ্ঞ ডাক্তার খুঁজুন এবং মুহূর্তেই বুকিং দিন' },
      { title: 'ডিজিটাল হেলথ কার্ড', desc: 'আপনার সকল প্রেসক্রিপশন ও রিপোর্ট এক প্রোফাইলে' },
      { title: 'স্মার্ট অ্যাপয়েন্টমেন্ট অ্যালার্ট', desc: 'ডাক্তারের সিরিয়াল ও সময় নিয়ে মোবাইলে সরাসরি আপডেট' },
      { title: '২৪/৭ জরুরি হেল্পলাইন', desc: 'যেকোনো প্রয়োজনে আমাদের সাপোর্ট টিমের সঙ্গে সার্বক্ষণিক যোগাযোগ' },
    ]
  }

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Hind Siliguri', sans-serif" }}>

      {/* ─── HERO SECTION (MATCHING ATTACHED DESIGN) ──────────────────────────── */}
      <section className="services-hero-section" style={{
        background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%)',
        padding: '115px 0 80px',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid #E2E8F0'
      }}>
        {/* Subtle Ambient Radial Glow */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '50%',
          height: '70%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <Container>
          <Row className="align-items-center g-5">
            {/* Left Content Column */}
            <Col lg={5}>
              {/* Green Pill Badge */}
              <div style={{ marginBottom: 20 }}>
                <span style={{
                  background: '#DCFCE7',
                  color: '#166534',
                  padding: '6px 16px',
                  borderRadius: 0,
                  fontSize: 13,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
                  ১০০% ফ্রি সেবা
                </span>
              </div>

              {/* Main Headline */}
              <h1 style={{
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 900,
                color: '#0F172A',
                lineHeight: 1.25,
                marginBottom: 20,
                letterSpacing: '-0.5px'
              }}>
                আপনার স্বাস্থ্যসেবা ব্যবস্থাপনা{' '}
                <span style={{ color: '#00B875', display: 'block' }}>এখন ডিজিটাল</span>
              </h1>

              {/* Subtitle */}
              <p style={{
                fontSize: 15.5,
                color: '#64748B',
                lineHeight: 1.7,
                marginBottom: 28,
                fontWeight: 500,
                maxWidth: 480
              }}>
                অ্যাপয়েন্টমেন্ট বুকিং, ই-প্রেসক্রিপশন, হাসপাতাল সার্ভিস, অনলাইন কন্সাল্টেশন — সবকিছু এক জায়গায়
              </p>

              {/* Primary Action Button */}
              <div style={{ marginBottom: 12 }}>
                <button
                  onClick={() => navigate('/register')}
                  style={{
                    background: '#00B875',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 0,
                    padding: '15px 36px',
                    fontWeight: 800,
                    fontSize: 16,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    boxShadow: '0 10px 25px rgba(0, 184, 117, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#009E64' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#00B875' }}
                >
                  <span>ফ্রি অ্যাকাউন্ট খুলুন</span>
                  <IconArrowRight size={18} stroke={2.5} />
                </button>
              </div>

              {/* Subtext under button */}
              <div style={{ fontSize: 12.5, color: '#94A3B8', fontWeight: 600, marginBottom: 32 }}>
                কোনো ক্রেডিট কার্ড লাগবে না
              </div>

              {/* Feature Highlights Footer List */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                flexWrap: 'wrap',
                borderTop: '1px solid #E2E8F0',
                paddingTop: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#475569' }}>
                  <IconActivity size={16} color="#00B875" />
                  <span>অটো সলিউশন</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#475569' }}>
                  <IconClock size={16} color="#00B875" />
                  <span>২ মিনিটে সেটআপ</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#475569' }}>
                  <IconDeviceMobile size={16} color="#00B875" />
                  <span>মোবাইলে চলবে</span>
                </div>
              </div>
            </Col>

            {/* Right Column (Browser Mockup Preview) */}
            <Col lg={7}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: 0,
                boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(15, 23, 42, 0.08)',
                overflow: 'hidden',
                transition: 'transform 0.4s ease'
              }}>
                {/* MacOS Top Header Bar */}
                <div style={{
                  background: '#F1F5F9',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #E2E8F0'
                }}>
                  {/* Window Control Dots */}
                  <div style={{ display: 'flex', gap: 7 }}>
                    <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#FF5F56' }} />
                    <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#FFBD2E' }} />
                    <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#27C93F' }} />
                  </div>

                  {/* Browser Address Bar */}
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: 0,
                    padding: '4px 20px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#64748B',
                    border: '1px solid #E2E8F0',
                    width: '50%',
                    textAlign: 'center',
                    fontFamily: 'monospace'
                  }}>
                    doctorbooklet.com/dashboard
                  </div>

                  {/* Header Button Pill */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ background: '#0F172A', color: '#FFFFFF', padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>+ New Booking</span>
                  </div>
                </div>

                {/* Inside Dashboard Body */}
                <div style={{ padding: '24px', background: '#F8FAFC' }}>
                  {/* Top Welcome Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                      <h4 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>Welcome back, Dr. Kazi</h4>
                      <span style={{ fontSize: 12, color: '#64748B' }}>Here's your clinic overview today</span>
                    </div>
                    <span style={{ background: '#00B875', color: '#FFFFFF', padding: '6px 14px', fontSize: 12, fontWeight: 800 }}>
                      + Patient Entry
                    </span>
                  </div>

                  {/* 6 Stat Metric Cards Row */}
                  <Row className="g-2 mb-3">
                    <Col xs={4} md={2}>
                      <div style={{ background: '#FFFFFF', padding: '12px 10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>১২০+</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>রোগী</div>
                      </div>
                    </Col>
                    <Col xs={4} md={2}>
                      <div style={{ background: '#FFFFFF', padding: '12px 10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#00B875' }}>২০</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>বুকিং</div>
                      </div>
                    </Col>
                    <Col xs={4} md={2}>
                      <div style={{ background: '#FFFFFF', padding: '12px 10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#16A34A' }}>৭৭%</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>উপস্থিতি</div>
                      </div>
                    </Col>
                    <Col xs={4} md={2}>
                      <div style={{ background: '#FFFFFF', padding: '12px 10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>১৯</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>প্রেসক্রিপশন</div>
                      </div>
                    </Col>
                    <Col xs={4} md={2}>
                      <div style={{ background: '#FFFFFF', padding: '12px 10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#D97706' }}>৩</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>রিপোর্ট</div>
                      </div>
                    </Col>
                    <Col xs={4} md={2}>
                      <div style={{ background: '#FFFFFF', padding: '12px 10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#00B875' }}>৳৪,২০,৫০০</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>মোট আয়</div>
                      </div>
                    </Col>
                  </Row>

                  {/* Main Dashboard Widget Cards */}
                  <Row className="g-3">
                    {/* Revenue Overview Widget */}
                    <Col md={7}>
                      <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '18px', height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>Revenue Summary</span>
                          <span style={{ fontSize: 11, color: '#38BDF8' }}>View All</span>
                        </div>
                        <Row className="g-2 text-center mb-3">
                          <Col xs={4}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#4ADE80' }}>৳ ১,৩৪,৩০০</div>
                            <div style={{ fontSize: 10, color: '#94A3B8' }}>Collected</div>
                          </Col>
                          <Col xs={4}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#FACC15' }}>৳ ৪,৭১,৩৬০</div>
                            <div style={{ fontSize: 10, color: '#94A3B8' }}>Due</div>
                          </Col>
                          <Col xs={4}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#F87171' }}>৳ ১,২০,৫০০</div>
                            <div style={{ fontSize: 10, color: '#94A3B8' }}>Expenses</div>
                          </Col>
                        </Row>
                        <div style={{ background: '#1E293B', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: '#94A3B8' }}>Est. Monthly Total</span>
                          <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>৳ ৫,৪০,০০০</span>
                        </div>
                      </div>
                    </Col>

                    {/* Appointment Status Widget */}
                    <Col md={5}>
                      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '18px', height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>Booking Status</span>
                          <span style={{ fontSize: 11, color: '#2563EB' }}>View all</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B' }}>Confirmed</span>
                            <span style={{ fontWeight: 800, color: '#16A34A' }}>15</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B' }}>Pending</span>
                            <span style={{ fontWeight: 800, color: '#D97706' }}>2</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B' }}>Cancelled</span>
                            <span style={{ fontWeight: 800, color: '#DC2626' }}>2</span>
                          </div>
                          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                            <span>Total Units</span>
                            <span>26</span>
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>


      {/* ─── INTERACTIVE ROLE SWITCHER SECTION ───────────────────────────────── */}
      <section style={{ padding: '64px 0', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
        <Container>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 34px)', fontWeight: 900, color: '#0F172A', marginBottom: 10 }}>
              সবার জন্য বিশেষায়িত ডিজিটাল ফিচার
            </h2>
            <p style={{ fontSize: 14.5, color: '#64748B', maxWidth: 540, margin: '0 auto' }}>
              আপনার চাহিদা অনুযায়ী পছন্দের ক্যাটাগরি বেছে নিয়ে সেবা সম্পর্কে জানুন
            </p>
          </div>

          {/* Role Tabs */}
          <div className="role-switcher-tabs" style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 36, flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('doctor')}
              style={{
                background: activeTab === 'doctor' ? '#0B192C' : '#F1F5F9',
                color: activeTab === 'doctor' ? '#FFFFFF' : '#334155',
                border: activeTab === 'doctor' ? '1px solid #0B192C' : '1px solid #E2E8F0',
                borderRadius: 4,
                padding: '12px 28px',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: activeTab === 'doctor' ? '0 6px 18px rgba(11, 25, 44, 0.35)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <IconStethoscope size={18} color={activeTab === 'doctor' ? '#00B875' : '#64748B'} />
              <span>ডাক্তারদের জন্য</span>
            </button>

            <button
              onClick={() => setActiveTab('hospital')}
              style={{
                background: activeTab === 'hospital' ? '#0B192C' : '#F1F5F9',
                color: activeTab === 'hospital' ? '#FFFFFF' : '#334155',
                border: activeTab === 'hospital' ? '1px solid #0B192C' : '1px solid #E2E8F0',
                borderRadius: 4,
                padding: '12px 28px',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: activeTab === 'hospital' ? '0 6px 18px rgba(11, 25, 44, 0.35)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <IconBuildingHospital size={18} color={activeTab === 'hospital' ? '#00B875' : '#64748B'} />
              <span>হাসপাতালের জন্য</span>
            </button>

            <button
              onClick={() => setActiveTab('patient')}
              style={{
                background: activeTab === 'patient' ? '#0B192C' : '#F1F5F9',
                color: activeTab === 'patient' ? '#FFFFFF' : '#334155',
                border: activeTab === 'patient' ? '1px solid #0B192C' : '1px solid #E2E8F0',
                borderRadius: 4,
                padding: '12px 28px',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: activeTab === 'patient' ? '0 6px 18px rgba(11, 25, 44, 0.35)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <IconUsers size={18} color={activeTab === 'patient' ? '#00B875' : '#64748B'} />
              <span>রোগীদের জন্য</span>
            </button>
          </div>

          {/* Active Tab Grid Features */}
          <Row className="g-4">
            {tabFeatures[activeTab].map((feat, i) => (
              <Col key={i} md={6}>
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  padding: '24px 22px',
                  borderRadius: 0,
                  display: 'flex',
                  gap: 16,
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    background: '#00B875',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 900
                  }}>
                    <IconCheck size={20} stroke={3} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
                      {feat.title}
                    </h4>
                    <p style={{ fontSize: 13.5, color: '#64748B', margin: 0, lineHeight: 1.6 }}>
                      {feat.desc}
                    </p>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>


      {/* ─── FREE QR POSTER FEATURE SECTION (REPLACING BOTTOM AREA) ──────────── */}
      <section style={{ background: '#00B875', padding: '72px 0', color: '#FFFFFF', position: 'relative', overflow: 'hidden' }}>
        <Container>
          <Row className="align-items-center g-5">
            {/* Left Column: QR Poster Mockup Card */}
            <Col lg={5} className="text-center">
              <div style={{
                maxWidth: 340,
                margin: '0 auto',
                background: '#0B192C',
                borderRadius: 0,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
                textAlign: 'center',
                transform: 'rotate(-2deg)',
                transition: 'transform 0.4s ease'
              }}
              className="qr-poster-card"
              >
                {/* Poster Top Dark Banner */}
                <div className="qr-poster-header" style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <span style={{ fontSize: 10, letterSpacing: 1.5, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 800, display: 'block', marginBottom: 2 }}>
                    AVAILABLE FOR BOOKING
                  </span>
                  <h4 style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                    রহমান মেডিকেল সেন্টার
                  </h4>
                  <span style={{ fontSize: 11, color: '#64748B' }}>Dhanmondi, Dhaka</span>
                </div>

                {/* Poster White Main Body */}
                <div className="qr-poster-body" style={{ background: '#FFFFFF', padding: '24px 20px', color: '#0F172A' }}>
                  {/* Large Graphic QR Code Placeholder / SVG */}
                  <div className="qr-poster-box" style={{
                    width: 170,
                    height: 170,
                    margin: '0 auto 16px',
                    padding: 10,
                    background: '#FFFFFF',
                    border: '2px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                      <rect width="100" height="100" fill="white" />
                      {/* Top-left position marker */}
                      <rect x="5" y="5" width="30" height="30" fill="#0F172A" />
                      <rect x="10" y="10" width="20" height="20" fill="white" />
                      <rect x="15" y="15" width="10" height="10" fill="#0F172A" />
                      {/* Top-right position marker */}
                      <rect x="65" y="5" width="30" height="30" fill="#0F172A" />
                      <rect x="70" y="10" width="20" height="20" fill="white" />
                      <rect x="75" y="15" width="10" height="10" fill="#0F172A" />
                      {/* Bottom-left position marker */}
                      <rect x="5" y="65" width="30" height="30" fill="#0F172A" />
                      <rect x="10" y="70" width="20" height="20" fill="white" />
                      <rect x="15" y="75" width="10" height="10" fill="#0F172A" />
                      {/* Inner QR patterns */}
                      <rect x="42" y="10" width="8" height="8" fill="#0F172A" />
                      <rect x="52" y="20" width="8" height="8" fill="#0F172A" />
                      <rect x="42" y="30" width="8" height="8" fill="#0F172A" />
                      <rect x="10" y="42" width="8" height="8" fill="#0F172A" />
                      <rect x="25" y="50" width="8" height="8" fill="#0F172A" />
                      <rect x="42" y="45" width="16" height="16" fill="#0F172A" />
                      <rect x="65" y="42" width="8" height="8" fill="#0F172A" />
                      <rect x="80" y="50" width="12" height="12" fill="#0F172A" />
                      <rect x="45" y="70" width="10" height="10" fill="#0F172A" />
                      <rect x="60" y="65" width="15" height="15" fill="#0F172A" />
                      <rect x="80" y="80" width="12" height="12" fill="#0F172A" />
                    </svg>
                  </div>

                  <h5 style={{ fontSize: 14, fontWeight: 900, color: '#0F172A', marginBottom: 2 }}>
                    অ্যাপয়েন্টমেন্ট নিতে স্ক্যান করুন
                  </h5>
                  <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 14 }}>
                    Scan QR code to see doctor schedules
                  </span>

                  {/* 3 Step Instruction Box */}
                  <div className="qr-poster-steps" style={{ background: '#F8FAFC', padding: '10px 12px', border: '1px solid #E2E8F0', textAlign: 'left', fontSize: 11, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#0F172A', color: 'white', fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                      <span>ফোনের ক্যামেরা নিয়ে QR স্ক্যান করুন</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#0F172A', color: 'white', fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                      <span>ডাক্তারের তথ্য, সময় ও ফি দেখুন</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#0F172A', color: 'white', fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
                      <span>সরাসরি সিরিয়াল বুক বা কল করুন</span>
                    </div>
                  </div>

                  {/* URL Pill */}
                  <div style={{ marginTop: 14, background: '#F1F5F9', padding: '5px 12px', fontSize: 10, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace', display: 'inline-block' }}>
                    doctorbooklet.com/chamber/qr
                  </div>
                </div>

                {/* Poster Footer Dark Bar */}
                <div style={{ background: '#0B192C', padding: '8px', color: '#FFFFFF', fontSize: 11, fontWeight: 800, letterSpacing: 0.5 }}>
                  DoctorBooklet.com
                </div>
              </div>
            </Col>

            {/* Right Column: Title, Subtitle, Checkmarks & Action Button */}
            <Col lg={7}>
              <h2 style={{
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 900,
                color: '#FFFFFF',
                lineHeight: 1.25,
                marginBottom: 16
              }}>
                এই QR পোস্টার আপনার হাসপাতাল বা চেম্বারের গেটে লাগান
              </h2>

              <p style={{
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.85)',
                fontWeight: 600,
                marginBottom: 28
              }}>
                রোগীরা স্ক্যান করলেই দেখবে:
              </p>

              {/* Checkmark List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
                {[
                  'কোন কোন ডাক্তার ও বিভাগ সচল আছে',
                  'অ্যাপয়েন্টমেন্ট ফি ও সময়সূচী',
                  'ছবি ও ডাক্তারদের বিস্তারিত তথ্য',
                  'সরাসরি অনলাইনে অ্যাপয়েন্টমেন্ট বুকিং'
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <IconCheck size={15} color="#FFFFFF" stroke={3} />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* White Primary Button */}
              <button
                onClick={() => navigate('/register')}
                style={{
                  background: '#FFFFFF',
                  color: '#00B875',
                  border: 'none',
                  borderRadius: 0,
                  padding: '15px 36px',
                  fontWeight: 900,
                  fontSize: 16,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#F8FAFC' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#FFFFFF' }}
              >
                <span>ফ্রি QR পোস্টার বানান</span>
                <IconArrowRight size={18} stroke={2.5} />
              </button>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ─── HOW IT WORKS SECTION (PIC REFERENCE STYLE) ───────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '64px 0 72px', borderTop: '1px solid #E2E8F0' }}>
        <Container>
          {/* Title Header */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{
              fontSize: 'clamp(26px, 3.8vw, 36px)',
              fontWeight: 900,
              color: '#0F172A',
              margin: 0,
              fontFamily: "'Hind Siliguri', sans-serif"
            }}>
              কিভাবে শুরু করবেন?
            </h2>
          </div>

          {/* 3 Step Process Flow Grid */}
          <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto' }}>
            {/* Connector Line (Desktop) */}
            <div style={{
              position: 'absolute',
              top: 40,
              left: '15%',
              right: '15%',
              height: 2,
              borderTop: '2px dashed #E2E8F0',
              zIndex: 1
            }} className="d-none d-md-block" />

            <Row className="g-4 justify-content-center position-relative" style={{ zIndex: 2 }}>
              {[
                {
                  num: 1,
                  numColor: '#00B875',
                  bgLight: '#F0FDF4',
                  icon: <IconDeviceMobile size={32} color="#00B875" stroke={1.8} />,
                  title: 'ফ্রি অ্যাকাউন্ট খুলুন',
                  subtitle: 'মোবাইল নম্বর দিয়ে ১ মিনিটে'
                },
                {
                  num: 2,
                  numColor: '#9333EA',
                  bgLight: '#F3E8FF',
                  icon: <IconBuildingHospital size={32} color="#9333EA" stroke={1.6} />,
                  title: 'তথ্য যোগ করুন',
                  subtitle: 'ডাক্তার, হাসপাতাল ও সিডিউলের তথ্য দিন'
                },
                {
                  num: 3,
                  numColor: '#16A34A',
                  bgLight: '#DCFCE7',
                  icon: <IconCheck size={32} color="#16A34A" stroke={2.5} />,
                  title: 'ম্যানেজ করুন',
                  subtitle: 'ইনভয়েস, রিমাইন্ডার, প্রেসক্রিপশন — সব রেডি'
                }
              ].map((step, i) => (
                <Col key={i} xs={12} md={4} className="text-center">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Icon Box with Top-Right Number Overlay Badge */}
                    <div style={{ position: 'relative', marginBottom: 20 }}>
                      <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: 16,
                        background: step.bgLight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                      }}>
                        {step.icon}
                      </div>

                      {/* Number Badge */}
                      <div style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: step.numColor,
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        border: '2px solid #FFFFFF'
                      }}>
                        {step.num}
                      </div>
                    </div>

                    {/* Title & Subtitle */}
                    <h4 style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: '#0F172A',
                      marginBottom: 6,
                      fontFamily: "'Hind Siliguri', sans-serif"
                    }}>
                      {step.title}
                    </h4>
                    <p style={{
                      fontSize: 13.5,
                      color: '#64748B',
                      margin: 0,
                      fontWeight: 500,
                      fontFamily: "'Hind Siliguri', sans-serif",
                      maxWidth: 240,
                      lineHeight: 1.5
                    }}>
                      {step.subtitle}
                    </p>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </Container>
      </section>

      {/* ─── FAST PATIENT LISTING SECTION (RIGHT AFTER HOW IT WORKS) ──────────── */}
      <section style={{ background: '#F0FDF4', padding: '64px 0 68px', borderTop: '1px solid #DCFCE7', textAlign: 'center' }}>
        <Container>
          {/* Header */}
          <div style={{ maxWidth: 650, margin: '0 auto 36px' }}>
            <h2 style={{
              fontSize: 'clamp(26px, 3.8vw, 36px)',
              fontWeight: 900,
              color: '#0F172A',
              marginBottom: 10,
              fontFamily: "'Hind Siliguri', sans-serif"
            }}>
              চেম্বার বা হাসপাতাল সার্ভিস সচল? নতুন রোগী পান দ্রুত
            </h2>
            <p style={{
              fontSize: 14.5,
              color: '#64748B',
              margin: 0,
              fontWeight: 500,
              fontFamily: "'Hind Siliguri', sans-serif"
            }}>
              আপনার খালি চেম্বার বা সার্ভিস doctorbooklet.com ডিরেক্টরিতে এক ক্লিকে লিস্টিং করুন
            </p>
          </div>

          {/* 3 Step Icon Badges Row with Arrow Connectors */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
            {/* Step 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 68,
                height: 68,
                borderRadius: 16,
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                marginBottom: 10
              }}>
                <IconStethoscope size={28} color="#0F172A" stroke={1.8} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', fontFamily: "'Hind Siliguri', sans-serif" }}>
                ডাক্তার ও চেম্বার
              </span>
            </div>

            {/* Arrow 1 */}
            <div style={{ paddingBottom: 24 }} className="d-none d-sm-block">
              <IconArrowRight size={22} color="#16A34A" stroke={2.5} />
            </div>

            {/* Step 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 68,
                height: 68,
                borderRadius: 16,
                background: '#FFFFFF',
                border: '2px solid #00B875',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0, 184, 117, 0.15)',
                marginBottom: 10
              }}>
                <IconSearch size={28} color="#00B875" stroke={2} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', fontFamily: "'Hind Siliguri', sans-serif" }}>
                ডিজিটাল ডিরেক্টরি
              </span>
            </div>

            {/* Arrow 2 */}
            <div style={{ paddingBottom: 24 }} className="d-none d-sm-block">
              <IconArrowRight size={22} color="#16A34A" stroke={2.5} />
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 68,
                height: 68,
                borderRadius: 16,
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                marginBottom: 10
              }}>
                <IconUserCheck size={28} color="#16A34A" stroke={2} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', fontFamily: "'Hind Siliguri', sans-serif" }}>
                নতুন রোগী পেলেন
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div>
            <button
              onClick={() => navigate('/register')}
              style={{
                background: '#00B875',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 0,
                padding: '14px 36px',
                fontWeight: 800,
                fontSize: 15,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 8px 24px rgba(0, 184, 117, 0.25)',
                transition: 'all 0.3s ease',
                fontFamily: "'Hind Siliguri', sans-serif"
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#009E64' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#00B875' }}
            >
              <span>ফ্রি লিস্টিং দিন</span>
              <IconArrowRight size={17} stroke={2.5} />
            </button>
          </div>
        </Container>
      </section>

      {/* ─── WHY CHOOSE US (VALUABLE HEALTHCARE COMMITMENT SECTION) ───────────── */}
      <section style={{ padding: '64px 0 72px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
        <Container>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span style={{
              background: '#D1FAE5',
              color: '#065F46',
              fontSize: 13,
              fontWeight: 800,
              padding: '6px 18px',
              borderRadius: 99,
              display: 'inline-block',
              marginBottom: 16
            }}>
              কেন আমাদের বেছে নিবেন?
            </span>
            <h2 style={{
              fontSize: 'clamp(26px, 3.8vw, 38px)',
              fontWeight: 900,
              color: '#0F172A',
              marginBottom: 16,
              fontFamily: "'Hind Siliguri', sans-serif"
            }}>
              বিশ্বস্ত ও নির্ভরযোগ্য সেবার অঙ্গীকার
            </h2>
            <div style={{ width: 60, height: 4, background: '#00B875', margin: '0 auto' }} />
          </div>

          {/* 5 Feature Cards Row */}
          <Row className="g-3 justify-content-center mb-4">
            {[
              { icon: <IconShieldCheck size={32} />, title: 'যাচাইকৃত ডাক্তার', desc: 'অভিজ্ঞ ও নিবন্ধিত বিশেষজ্ঞ ডাক্তার' },
              { icon: <IconCalendar size={32} />, title: 'নিরাপদ বুকিং', desc: 'আপনার সময় ও গোপনীয়তা আমাদের দায়িত্ব' },
              { icon: <IconStethoscope size={32} />, title: 'সহজ ও দ্রুত', desc: 'কয়েক ক্লিকে সেরা সেবা নিশ্চিত করুন' },
              { icon: <IconHeadset size={32} />, title: '২৪/৭ সহায়তা', desc: 'জরুরি প্রয়োজনে আমরা আছি আপনার সাথে' },
              { icon: <IconLock size={32} />, title: 'তথ্য সুরক্ষা', desc: 'আপনার সকল তথ্য এনক্রিপ্টেড ও সুরক্ষিত' },
            ].map((item, i) => (
              <Col key={i} xs={12} sm={6} lg={true}>
                <div style={{
                  textAlign: 'center',
                  background: '#FFFFFF',
                  border: '1.5px solid rgba(0, 184, 117, 0.18)',
                  borderRadius: 0,
                  padding: '32px 20px',
                  boxShadow: '0 8px 24px rgba(0, 184, 117, 0.04)',
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }} className="why-choose-card-page">
                  <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: '#F0FDF4',
                    color: '#00B875',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    transition: 'all 0.3s ease'
                  }}>
                    {item.icon}
                  </div>
                  <h5 style={{ fontWeight: 800, fontSize: 17, color: '#0F172A', marginBottom: 10, fontFamily: "'Hind Siliguri', sans-serif" }}>
                    {item.title}
                  </h5>
                  <p style={{ color: '#64748B', fontSize: 13.5, lineHeight: 1.6, margin: 0, fontWeight: 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                    {item.desc}
                  </p>
                </div>
              </Col>
            ))}
          </Row>

          {/* Action Button */}
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <button
              onClick={() => navigate('/register')}
              style={{
                background: '#00B875',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 0,
                padding: '14px 38px',
                fontWeight: 800,
                fontSize: 16,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 10px 25px rgba(0, 184, 117, 0.25)',
                transition: 'all 0.3s ease',
                fontFamily: "'Hind Siliguri', sans-serif"
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#009E64' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#00B875' }}
            >
              <span>এখনই নিবন্ধন করুন</span>
              <IconArrowRight size={18} stroke={2.5} />
            </button>
          </div>
        </Container>
      </section>
      <style>{`
        @media (max-width: 991px) {
          .services-hero-section {
            padding-top: calc(var(--header-height, 72px) + 24px) !important;
            padding-bottom: 40px !important;
          }
        }
        @media (max-width: 767px) {
          .role-switcher-tabs {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 6px !important;
            width: 100% !important;
            padding: 0 4px !important;
          }
          .role-switcher-tabs button {
            width: 100% !important;
            padding: 10px 3px !important;
            font-size: 11.5px !important;
            justify-content: center !important;
            white-space: nowrap !important;
            gap: 4px !important;
          }
          .role-switcher-tabs button svg {
            width: 15px !important;
            height: 15px !important;
          }
          
          /* 📱 Compact QR Poster Card on Mobile */
          .qr-poster-card {
            max-width: 240px !important;
            transform: none !important;
            margin: 0 auto 20px !important;
          }
          .qr-poster-header {
            padding: 10px 12px !important;
          }
          .qr-poster-header h4 {
            font-size: 14px !important;
          }
          .qr-poster-body {
            padding: 14px 12px !important;
          }
          .qr-poster-box {
            width: 110px !important;
            height: 110px !important;
            margin-bottom: 10px !important;
            padding: 6px !important;
          }
          .qr-poster-body h5 {
            font-size: 12px !important;
          }
          .qr-poster-steps {
            padding: 6px 8px !important;
            font-size: 9.5px !important;
            gap: 4px !important;
          }
        }
      `}</style>

    </div>
  )
}

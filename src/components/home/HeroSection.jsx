import { useNavigate } from 'react-router-dom'
import { Container, Row, Col } from 'react-bootstrap'
import useLocations from '../../hooks/useLocations'
import { getDivisions, getDistricts, getUpazilas } from '../../api/locationApi'
import React, { useState, useEffect, useRef, memo, useMemo } from 'react'
import { IconSearch, IconCalendarEvent, IconShieldCheck, IconInfoCircle, IconStethoscope, IconUsers, IconBuildingHospital, IconActivity, IconHeadset, IconMapPin, IconChevronDown, IconX } from '@tabler/icons-react'
import { getContent } from '../../utils/contentService'
import ScrollReveal from '../common/ScrollReveal'

import { useTypewriter } from '../../hooks/useTypewriter'

// Swiper imports for mobile top banner carousel
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

const SEARCH_PHRASES = [
  'ডাক্তারের নাম বা বিশেষজ্ঞতা দিয়ে সার্চ করুন...',
  'যেমন: হার্ট স্পেশালিস্ট',
  'যেমন: মেডিসিন ডাক্তার',
  'যেমন: চক্ষু বিশেষজ্ঞ',
  'যেমন: গাইনী ও প্রসূতি'
]

function AnimatedCounter({ value, duration = 1200 }) {
  const [count, setCount] = useState(0);

  const toBanglaNumber = (num) => {
    const banglaDigits = {
      '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
      '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    return String(num).split('').map(char => banglaDigits[char] || char).join('');
  };

  useEffect(() => {
    if (!value) return;
    const englishDigits = value.replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d));
    const numericValue = parseInt(englishDigits.replace(/[^0-9]/g, ''), 10);

    if (isNaN(numericValue)) {
      setCount(value);
      return;
    }

    let start = 0;
    const end = numericValue;
    const startTime = performance.now();
    let animationFrameId;

    const updateCount = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const current = Math.floor(progress * end);
      setCount(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCount);
      } else {
        setCount(end);
      }
    };

    animationFrameId = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  if (!value) return '';
  const hasDigits = /[0-9০-৯]/.test(value);
  if (!hasDigits) return value;

  const suffix = value.replace(/[0-9০-৯]/g, '');
  return `${toBanglaNumber(count)}${suffix}`;
}

function StatItem({ icon, count, label }) {
  return (
    <div className="hero-stat-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, flex: '1 1 0%', textAlign: 'center' }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(0,168,140,0.12) 0%, rgba(0,212,175,0.05) 100%)',
        border: '1px solid rgba(0,168,140,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A88C',
        flexShrink: 0, boxShadow: '0 4px 12px rgba(0,168,140,0.1)'
      }}>
        {React.cloneElement(icon, { size: 22, stroke: 2.2 })}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', lineHeight: 1.1, marginBottom: 3, fontFamily: "'Hind Siliguri', sans-serif" }}>
          <AnimatedCounter value={count} />
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', fontFamily: "'Hind Siliguri', sans-serif", whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.3 }}>{label}</div>
      </div>
    </div>
  )
}

const HeroSection = memo(function HeroSection({ stats: propStats }) {
  const typingPlaceholder = useTypewriter(SEARCH_PHRASES)
  const navigate = useNavigate()
  const cms = getContent()
  const hero = cms.hero || {}
  const stats = cms.stats || {}

  const { divisions, districts, upazilas, unions, selectedDivision, selectedDistrict, selectedUpazila, selectedUnion, setSelectedDivision, setSelectedDistrict, setSelectedUpazila, setSelectedUnion } = useLocations()
  const [searchText, setSearchText] = useState('')

  const [phraseIndex, setPhraseIndex] = useState(0)
  const [subIndex, setSubIndex] = useState(0)
  const [reverse, setReverse] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const dynamicPhrases = useMemo(() => [
    { text: hero.title_line2 || 'আপনার অগ্রাধিকার', color: '#00A88C' },
    { text: 'আপনার বিশ্বস্ত সঙ্গী', color: '#2563EB' },
    { text: 'সুস্থ জীবনের প্রতিশ্রুতি', color: '#D946EF' }
  ], [hero.title_line2])

  useEffect(() => {
    if (isPaused) {
      const timer = setTimeout(() => {
        setIsPaused(false)
        setReverse(true)
      }, 2000)
      return () => clearTimeout(timer)
    }

    const currentText = dynamicPhrases[phraseIndex].text

    if (subIndex === currentText.length + 1 && !reverse) {
      setIsPaused(true)
      return
    }

    if (subIndex === 0 && reverse) {
      setReverse(false)
      setPhraseIndex((prev) => (prev + 1) % dynamicPhrases.length)
      return
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1))
    }, reverse ? 30 : 80)

    return () => clearTimeout(timeout)
  }, [subIndex, phraseIndex, reverse, isPaused, dynamicPhrases])

  const triggerSearch = () => {
    const params = {}
    if (selectedDivision) params.division_id = selectedDivision
    if (selectedDistrict) params.district_id = selectedDistrict
    if (selectedUpazila) params.upazila_id = selectedUpazila
    if (selectedUnion) params.union_id = selectedUnion
    if (searchText.trim()) params.search = searchText.trim()
    const qs = new URLSearchParams(params).toString()
    if (qs) navigate(`/doctors?${qs}`)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    triggerSearch()
  }

  const inputStyle = {
    borderRadius: 14,
    border: '1.5px solid #F1F5F9',
    padding: '10px 12px',
    fontSize: 14,
    color: '#0F172A',
    background: '#F8FAFC',
    width: '100%',
    height: 52,
    outline: 'none',
    fontFamily: "'Hind Siliguri', sans-serif",
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  }

  // Prefer real stats from props, fallback to CMS, then fallback to defaults
  const docCount = propStats?.total_doctors ? `${propStats.total_doctors}+` : stats.doctors_count || '১০০০+'
  const hospCount = propStats?.total_hospitals ? `${propStats.total_hospitals}+` : stats.hospitals_count || '৫০০+'
  const specCount = propStats?.total_specialties ? `${propStats.total_specialties}+` : stats.services_count || '৫০+'

  const statItems = [
    { icon: <IconStethoscope />, count: docCount, label: stats.doctors_label || 'বিশেষজ্ঞ ডাক্তার' },
    { icon: <IconBuildingHospital />, count: hospCount, label: stats.hospitals_label || 'হাসপাতাল ও ক্লিনিক' },
    { icon: <IconActivity />, count: specCount, label: stats.services_label || 'বিশেষজ্ঞ বিভাগ' },
    { icon: <IconUsers />, count: stats.patients_count || '১০ লাখ+', label: stats.patients_label || 'সন্তুষ্ট রোগী' },
  ]

  const featureCards = [
    { icon: <IconCalendarEvent size={22} />, title: 'সহজ অ্যাপয়েন্টমেন্ট', desc: 'দ্রুত ও সহজে' },
    { icon: <IconInfoCircle size={22} />, title: 'নির্ভরযোগ্য তথ্য', desc: 'বিশেষজ্ঞের পরামর্শ' },
    { icon: <IconShieldCheck size={22} />, title: 'নিরাপদ ও গোপনীয়', desc: 'আপনার তথ্য সুরক্ষিত' },
  ]

  return (
    <section className="hero-section-main" style={{
      background: 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)',
      paddingTop: 'var(--header-height, 90px)',
      paddingBottom: '24px',
      position: 'relative',
      zIndex: 1,
      overflowX: 'hidden',
      overflowY: 'visible'
    }}>
      <div style={{ position: 'absolute', top: -150, right: -150, width: 500, height: 500, borderRadius: '50%', background: 'rgba(0,168,140,0.04)', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(0,168,140,0.02)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <Container>


        <Row className="align-items-start g-5 hero-row-mobile">
          {/* 1. Text & Search Section */}
          <Col lg={7} xs={12} className="order-1 hero-content-mobile" style={{ paddingTop: 16 }}>
            <ScrollReveal direction="up" distance={20} duration={600}>
              <div className="hero-text-container" style={{ maxWidth: 660 }}>
              <div className="hero-badge-mobile" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#D1FAE5', color: '#065F46', padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 700, marginBottom: 16, letterSpacing: '0.02em' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }}></span>
                স্মার্ট স্বাস্থ্যসেবা এখন আপনার হাতের মুঠোয়
              </div>

              <h1 className="hero-title-mobile" style={{ fontSize: 'clamp(26px, 5.5vw, 68px)', fontWeight: 900, color: '#0F172A', lineHeight: 1.2, marginBottom: 20, letterSpacing: '-0.02em' }}>
                {hero.title_line1 || 'স্বাস্থ্যই হোক'} <br />
                <span style={{ color: dynamicPhrases[phraseIndex].color, display: 'inline-block', whiteSpace: 'nowrap' }}>
                  {dynamicPhrases[phraseIndex].text.substring(0, subIndex)}
                </span>
              </h1>

              <p className="hero-subtitle-mobile" style={{ fontSize: 19, color: '#475569', lineHeight: 1.7, marginBottom: 40, fontWeight: 500, maxWidth: 600 }}>
                {hero.subtitle || 'বিশ্বস্ত ডাক্তার, আধুনিক হাসপাতাল এবং স্বাস্থ্যসেবা তথ্য এখন হাতের মুঠোয়। সুস্থ জীবন গড়ুন আমাদের সাথে।'}
              </p>

              {/* Search HUD */}
              <div className="hero-search-hud" style={{
                background: 'white',
                borderRadius: 28,
                padding: 'clamp(20px, 3vw, 36px)',
                boxShadow: '0 25px 80px rgba(0,0,0,0.04)',
                border: '1.5px solid rgba(241, 245, 249, 0.8)',
                marginBottom: 24,
                position: 'relative',
                zIndex: 10
              }}>
                {/* Search HUD Label - Optimized for Doctor Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,168,140,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A88C' }}>
                    <IconStethoscope size={18} stroke={3} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>বিশেষজ্ঞ ডাক্তার খুঁজুন</h3>
                </div>

                <form onSubmit={handleSearch}>
                  <Row className="g-3 mb-4">
                    <Col xs={6}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>বিভাগ</label>
                      <select style={{ ...inputStyle, color: selectedDivision ? '#0F172A' : '#94A3B8' }} value={selectedDivision} onChange={e => setSelectedDivision(e.target.value)}>
                        <option value="">সব বিভাগ</option>
                        {divisions.map(d => <option key={d.id} value={d.id}>{d.bangla_name}</option>)}
                      </select>
                    </Col>
                    <Col xs={6}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>জেলা</label>
                      <select style={{ ...inputStyle, color: selectedDistrict ? '#0F172A' : '#94A3B8' }} value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} disabled={!selectedDivision}>
                        <option value="">{selectedDivision ? 'সব জেলা' : 'বিভাগ নির্বাচন করুন'}</option>
                        {districts.map(d => <option key={d.id} value={d.id}>{d.bangla_name}</option>)}
                      </select>
                    </Col>
                    <Col xs={6}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>উপজেলা</label>
                      <select style={{ ...inputStyle, color: selectedUpazila ? '#0F172A' : '#94A3B8' }} value={selectedUpazila} onChange={e => setSelectedUpazila(e.target.value)} disabled={!selectedDistrict}>
                        <option value="">{selectedDistrict ? 'সব উপজেলা' : 'জেলা নির্বাচন করুন'}</option>
                        {upazilas.map(u => <option key={u.id} value={u.id}>{u.bangla_name}</option>)}
                      </select>
                    </Col>
                    <Col xs={6}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>ইউনিয়ন</label>
                      <select style={{ ...inputStyle, color: selectedUnion ? '#0F172A' : '#94A3B8' }} value={selectedUnion} onChange={e => setSelectedUnion(e.target.value)} disabled={!selectedUpazila}>
                        <option value="">{selectedUpazila ? 'সব ইউনিয়ন' : 'উপজেলা নির্বাচন করুন'}</option>
                        {unions.map(u => <option key={u.id} value={u.id}>{u.bangla_name}</option>)}
                      </select>
                    </Col>
                  </Row>
                  <div style={{ position: 'relative', display: 'flex', gap: 14 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <IconSearch size={22} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: '#CBD5E1' }} />
                      <input
                        type="text"
                        placeholder={typingPlaceholder}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ ...inputStyle, padding: '10px 16px 10px 56px', height: 60, borderRadius: 16, border: '1.5px solid #F1F5F9', background: '#F8FAFC' }}
                      />
                    </div>
                    <button type="submit" style={{
                      background: 'linear-gradient(135deg, #004D40 0%, #00695C 100%)',
                      color: 'white', border: 'none', borderRadius: 16, padding: '0 24px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      transition: '0.3s ease', flexShrink: 0, boxShadow: '0 8px 20px rgba(0,77,64,0.2)',
                      fontSize: 16, fontWeight: 700
                    }}>
                      <IconSearch size={24} stroke={2.5} />
                      <span className="d-none d-sm-inline">সার্চ করুন</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>

            {/* Stats Banner — full Col width, outside maxWidth container */}
            <div className="hero-stats-banner" style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(226, 232, 240, 0.8)',
              borderRadius: 24,
              padding: '18px 24px',
              boxShadow: '0 20px 50px rgba(0, 168, 140, 0.06), 0 4px 12px rgba(0,0,0,0.02)',
              width: '100%',
              marginTop: '32px'
            }}>
              <div className="hero-stats-mobile">
                {statItems.map((s, i) => (
                  <React.Fragment key={i}>
                    <StatItem {...s} />
                    {i < statItems.length - 1 && (
                      <div className="hero-stat-divider" style={{ width: 1, alignSelf: 'center', height: 40, background: 'linear-gradient(to bottom, transparent, #E2E8F0, transparent)', flexShrink: 0 }} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
            </ScrollReveal>
          </Col>

          {/* 2. Image Section */}
          <Col lg={5} xs={12} className="order-2 d-none d-lg-block">
            <ScrollReveal direction="left" distance={30} duration={700}>
            <div className="hero-img-wrapper" style={{ position: 'relative', height: 620, width: '100%' }}>
              {/* Floating Feature Cards */}
              <div className="hero-floating-cards" style={{ position: 'absolute', zIndex: 10 }}>
                {featureCards.map((f, i) => (
                  <div key={i} className="hero-f-card" style={{
                    background: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: 24, padding: 'clamp(14px, 2vw, 18px) clamp(18px, 2.5vw, 24px)',
                    display: 'flex', alignItems: 'center', gap: 16,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.06)', border: '1.5px solid rgba(255, 255, 255, 0.9)',
                    animation: `floatY ${4 + i}s ease-in-out infinite`
                  }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(0,168,140,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A88C', flexShrink: 0 }}>
                      {f.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 'clamp(13px, 1.5vw, 15px)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.01em' }}>{f.title}</div>
                      <div style={{ fontSize: 'clamp(11px, 1.2vw, 13px)', color: '#64748B', fontWeight: 600 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Doctor Image Container */}
              <div style={{
                position: 'relative', width: '100%', height: '100%', zIndex: 2,
                borderRadius: '60px 60px 40px 160px', overflow: 'hidden', boxShadow: '0 30px 70px rgba(0,0,0,0.1)'
              }} className="hero-main-img">
                <img src="/images/doctor-hero-centered.png" alt="Doctor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              {/* Background Accent Shape */}
              <div style={{
                position: 'absolute', top: '10%', left: '-60px', width: '100%', height: '90%',
                background: 'linear-gradient(135deg, #E6F6F4 0%, #D1FAE5 100%)',
                borderRadius: '60px 60px 40px 160px', zIndex: 1
              }} className="hero-accent-bg" />
            </div>
            </ScrollReveal>
          </Col>
        </Row>

        {/* Mobile Swiper Carousel - Visible on mobile only */}
        <div className="d-block d-lg-none mt-1 mobile-swiper" style={{ borderRadius: 0, overflow: 'hidden' }}>
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            spaceBetween={0}
            slidesPerView={1}
            loop={true}
          >
            <SwiperSlide>
              <div style={{ height: 180, width: '100%' }}>
                <img src="/images/doctor-hero-new.png" alt="Medical Care" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div style={{ height: 180, width: '100%' }}>
                <img src="/images/doctor-premium.png" alt="Specialist Consulting" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div style={{ height: 180, width: '100%' }}>
                <img src="/images/heart-health-hero.png" alt="Heart Health Care" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
      </Container>

      <style>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        select option { font-family: 'Hind Siliguri', sans-serif; color: #0F172A; }
        select:focus, input[type="text"]:focus { border-color: #00A88C !important; background: white !important; box-shadow: 0 0 0 4px rgba(0,168,140,0.08) !important; outline: none; }
        
        input::placeholder { color: #94A3B8 !important; }
        
        /* Desktop Floating Position */
        .hero-floating-cards {
          right: -60px;
          bottom: 40px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .hero-f-card { width: 280px; }

        /* Stats banner — base desktop layout */
        .hero-stats-mobile {
          display: flex;
          align-items: stretch;
          width: 100%;
        }
        .hero-stat-item {
          flex: 1 1 0%;
        }

        @media (max-width: 991px) { 
          .hero-section-main { padding-top: var(--header-height, 66px) !important; padding-bottom: 20px !important; margin-top: 0 !important; }
          .hero-content-mobile { padding-top: 0 !important; margin-top: 0 !important; }
          .hero-row-mobile { margin-top: 0 !important; padding-top: 0 !important; }
          
          /* Center align text */
          .hero-text-container { display: flex; flex-direction: column; align-items: center; text-align: center; }
          .hero-badge-mobile { margin-left: auto; margin-right: auto; margin-top: 0 !important; }
          .hero-title-mobile { text-align: center; }
          .hero-subtitle-mobile { text-align: center; margin-left: auto; margin-right: auto; }
          
          /* Remove gaps */
          .hero-search-hud { width: 100%; text-align: left; margin-bottom: 24px !important; }
          .hero-stats-banner {
            padding: 14px !important;
            border-radius: 18px !important;
            margin-top: 20px !important;
          }
          .hero-stats-mobile { 
            display: grid !important; 
            grid-template-columns: repeat(2, 1fr) !important; 
            gap: 10px !important; 
          }
          .hero-stat-item {
            flex-direction: row !important;
            justify-content: flex-start !important;
            text-align: left !important;
            background: #F8FAFC !important;
            padding: 12px 14px !important;
            border-radius: 12px !important;
            border: 1px solid #F1F5F9 !important;
            gap: 10px !important;
          }
          .hero-stat-divider { display: none !important; }
        }

        /* ── Very small screens (≤ 360px) ── */
        @media (max-width: 360px) {
          .hero-stats-banner {
            padding: 10px !important;
            border-radius: 14px !important;
          }
          .hero-stats-mobile {
            gap: 8px !important;
          }
          .hero-stat-item {
            padding: 10px !important;
            gap: 8px !important;
            border-radius: 10px !important;
          }
          .hero-stat-item > div:first-child {
            width: 36px !important;
            height: 36px !important;
            border-radius: 10px !important;
            flex-shrink: 0 !important;
          }
        }

        .mobile-swiper .swiper {
          padding-bottom: 0 !important;
        }

        .mobile-swiper .swiper-pagination {
          position: absolute !important;
          bottom: 12px !important;
          left: 0 !important;
          width: 100% !important;
          z-index: 10 !important;
        }
        
        .mobile-swiper .swiper-pagination-bullet {
          background: #CBD5E1 !important;
          opacity: 1 !important;
          width: 8px !important;
          height: 8px !important;
          margin: 0 6px !important;
          border-radius: 50% !important;
          transition: background-color 0.3s ease !important;
        }
        
        .mobile-swiper .swiper-pagination-bullet-active {
          background: #00A88C !important;
        }
        .common-spec-item:hover {
          background-color: #F8FAFC !important;
        }
      `}</style>

    </section>
  )
})

export default HeroSection

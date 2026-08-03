import { useNavigate, Link } from 'react-router-dom'
import { Container, Row, Col } from 'react-bootstrap'
import HeroSection from '../components/home/HeroSection'
import MostViewedDoctors from '../components/home/MostViewedDoctors'
import TopSpecialtiesSlider from '../components/home/TopSpecialtiesSlider'
import TopHospitals from '../components/home/TopHospitals'
import OptimizedImage from '../components/common/OptimizedImage'
import ScrollReveal from '../components/common/ScrollReveal'

import {
  IconArrowRight, IconCalendar, IconShieldCheck, IconClock, IconStar, IconHeadset,
  IconChevronLeft, IconChevronRight, IconStethoscope, IconHeart, IconDental, IconUsers, IconEye, IconScissors,
  IconLock, IconDeviceMobile, IconBuildingHospital, IconInfoCircle, IconShare
} from '@tabler/icons-react'
import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import axiosInstance from '../api/axiosInstance'
import { getContent } from '../utils/contentService'
import useHomepage from '../hooks/useHomepage'

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

// ─── SERVICE PREVIEW ────────────────────────────────────────────────────────
function ServicePreview() {
  const cms = getContent()

  const DEFAULT = [
    { id: 1, title_bn: 'ডায়াগনস্টিক সেবা', icon: <IconStethoscope size={28} />, count: '১২০০+' },
    { id: 2, title_bn: 'ক্লিনিক্যাল সেবা', icon: <IconHeart size={28} />, count: '৮৫০+' },
    { id: 3, title_bn: 'সার্জিক্যাল সেবা', icon: <IconScissors size={28} />, count: '৩০০+' },
    { id: 4, title_bn: 'হেলথ চেকআপ', icon: <IconHeart size={28} />, count: '৮০০+' },
    { id: 5, title_bn: 'মা ও শিশু সেবা', icon: <IconUsers size={28} />, count: '৬০০+' },
    { id: 6, title_bn: 'ডেন্টাল সেবা', icon: <IconDental size={28} />, count: '৪০০+' },
  ]

  const ICON_MAP = {
    diagnostic: <IconStethoscope size={28} />,
    clinical: <IconHeart size={28} />,
    surgical: <IconScissors size={28} />,
    check: <IconHeart size={28} />,
    mother: <IconUsers size={28} />,
    dental: <IconDental size={28} />
  }

  // TanStack Query — cached for 10 min, no refetch on revisit
  const { data: fetchedServices } = useQuery({
    queryKey: ['services-preview'],
    queryFn: async () => {
      const res = await axiosInstance.get('/services')
      return (res.data && res.data.length > 0) ? res.data : DEFAULT
    },
    staleTime: 10 * 60 * 1000,
    placeholderData: DEFAULT,
  })

  const display = fetchedServices || DEFAULT

  return (
    <section style={{ padding: '20px 0', background: 'white' }}>
      <Container>
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 99, display: 'inline-block' }}>
              জনপ্রিয় সেবা সমূহ
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link to="/services" style={{ color: '#00A88C', fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              সব সেবা দেখুন <IconArrowRight size={18} />
            </Link>
          </div>
        </div>

        <Swiper
          modules={[Pagination]}
          pagination={{ clickable: true }}
          spaceBetween={16}
          slidesPerView={1.25} // 1 full card and a clear peek (25%) of the next card on the right!
          loop={false} // Disable loop to prevent cloned slide rendering bugs in React
          breakpoints={{
            480: { slidesPerView: 2.25, spaceBetween: 20 },
            768: { slidesPerView: 3.25, spaceBetween: 20 },
            1024: { slidesPerView: 4, spaceBetween: 20 },
            1280: { slidesPerView: 5, spaceBetween: 20 },
          }}
          style={{ padding: '10px 10px 32px' }} // 32px padding for pagination dots
          className="service-swiper"
        >
          {display.map((s, i) => {
            // Premium light signature pastel themes for each service!
            const THEMES = [
              { bg: '#EFF6FF', iconBg: '#DBEAFE', color: '#2563EB', hoverBorder: '#93C5FD' }, // Blue
              { bg: '#FDF2F8', iconBg: '#FCE7F3', color: '#DB2777', hoverBorder: '#F9A8D4' }, // Magenta
              { bg: '#FFF7ED', iconBg: '#FFEDD5', color: '#EA580C', hoverBorder: '#FDBA74' }, // Orange
              { bg: '#F0FDF4', iconBg: '#DCFCE7', color: '#16A34A', hoverBorder: '#86EFAC' }, // Green
              { bg: '#FEFCE8', iconBg: '#FEF9C3', color: '#CA8A04', hoverBorder: '#FDE047' }, // Yellow
              { bg: '#F0FDFA', iconBg: '#CCFBF1', color: '#0D9488', hoverBorder: '#5EEAD4' }  // Teal
            ]
            const theme = THEMES[i % THEMES.length]

            return (
              <SwiperSlide key={s.id || i} style={{ height: 'auto' }}>
                <Link to="/services" style={{ textDecoration: 'none', height: '100%', display: 'block' }}>
                  <div className="service-card" style={{
                    background: theme.bg,
                    borderRadius: 7,
                    padding: '32px 20px',
                    border: '1px solid rgba(226, 232, 240, 0.6)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    height: '100%',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = theme.hoverBorder;
                      e.currentTarget.style.boxShadow = `0 20px 40px ${theme.color}15`;
                      e.currentTarget.style.transform = 'translateY(-10px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.6)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)';
                      e.currentTarget.style.transform = 'none'
                    }}>

                    {/* Faint Background Watermark Icon */}
                    <div className="service-card-watermark" style={{
                      position: 'absolute',
                      bottom: '-15px',
                      right: '-15px',
                      opacity: 0.05, // Subtle dynamic watermark color
                      color: theme.color,
                      pointerEvents: 'none',
                      transform: 'rotate(-15deg)',
                      zIndex: 0
                    }}>
                      {React.isValidElement(ICON_MAP[s.icon] || s.icon) 
                        ? React.cloneElement(ICON_MAP[s.icon] || s.icon, { size: 100 }) 
                        : <span style={{ fontSize: 80 }}>{(ICON_MAP[s.icon] || s.icon || '🏥')}</span>
                      }
                    </div>

                    {/* Icon Container */}
                    <div className="service-icon-container" style={{
                      width: 68,
                      height: 68,
                      borderRadius: 22,
                      background: `linear-gradient(135deg, ${theme.bg} 0%, ${theme.iconBg} 100%)`,
                      color: theme.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 28,
                      boxShadow: `0 8px 16px ${theme.color}10`,
                      position: 'relative',
                      zIndex: 1
                    }}>
                      {ICON_MAP[s.icon] || s.icon || '🏥'}
                    </div>

                    {/* Text column wrapping title & badge */}
                    <div className="service-card-text-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      {/* Title */}
                      <h4 style={{ fontSize: 17, fontWeight: 800, color: '#1E293B', margin: 0, lineHeight: 1.4, position: 'relative', zIndex: 1 }}>
                        {s.title_bn || s.title_en || s.name}
                      </h4>

                      {/* Count Badge */}
                      <div className="service-count-badge" style={{
                        fontSize: 13,
                        color: theme.color,
                        fontWeight: 700,
                        background: theme.iconBg,
                        padding: '4px 12px',
                        borderRadius: 12,
                        position: 'relative',
                        zIndex: 1
                      }}>
                        {s.count || '৫০০+'} কেন্দ্র
                      </div>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            )
          })}
        </Swiper>
      </Container>
    </section>
  )
}

// ─── APPOINTMENT CTA ─────────────────────────────────────────────────────────
function AppointmentCTA() {
  const navigate = useNavigate()
  return (
    <section style={{ padding: '20px 0', background: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
      <Container>
        <div className="appointment-cta-container" style={{
          background: 'linear-gradient(135deg, #022C22 0%, #064E3B 45%, #0F766E 100%)',
          borderRadius: 36,
          overflow: 'hidden',
          boxShadow: '0 30px 80px -15px rgba(2, 44, 34, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          position: 'relative',
          minHeight: 460,
          display: 'flex',
          alignItems: 'center'
        }}>
          {/* Ambient Lighting & Pattern Overlay */}
          <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(52, 211, 153, 0.2) 0%, transparent 70%)', filter: 'blur(70px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-20%', left: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(15, 118, 110, 0.25) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
          
          <Row className="align-items-center w-100 g-0">
            {/* Left: Glassmorphic Smartphone Interface Visual */}
            <Col lg={5} className="d-none d-lg-flex justify-content-center p-0" style={{ position: 'relative', height: 540, display: 'flex', alignItems: 'center' }}>
              
              {/* Outer Subtle Light Ring */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 380, height: 380, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(52, 211, 153, 0.12) 0%, rgba(2, 44, 34, 0) 70%)',
                pointerEvents: 'none', zIndex: 1
              }} />

              {/* Floating Notification Card 1 (Top Left) */}
              <div style={{
                position: 'absolute', left: 20, top: 60, background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(16px)', padding: '12px 18px', borderRadius: 20,
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.8)',
                display: 'flex', alignItems: 'center', gap: 12, zIndex: 10,
                animation: 'floatY 4s ease-in-out infinite'
              }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <IconCalendar size={20} stroke={2.5} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>অ্যাপয়েন্টমেন্ট কনফার্মড!</div>
                  <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, marginTop: 2 }}>আজ দুপুর ২:৩০ মিনিটে</div>
                </div>
              </div>

              {/* Floating Notification Card 2 (Bottom Right) */}
              <div style={{
                position: 'absolute', right: 15, bottom: 65, background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(16px)', padding: '12px 18px', borderRadius: 20,
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', gap: 12, zIndex: 10,
                animation: 'floatY 5s ease-in-out 1s infinite'
              }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(52, 211, 153, 0.2)', color: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <IconShieldCheck size={22} stroke={2.5} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>১০০% ভেরিফাইড ডাক্তার</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>বিএমডিসি নিবন্ধিত বিশেষজ্ঞ</div>
                </div>
              </div>

              {/* Central Premium Phone Frame */}
              <div style={{
                width: 270, height: 470,
                background: 'linear-gradient(160deg, #1E293B 0%, #0F172A 100%)',
                borderRadius: 42, border: '6px solid #334155',
                boxShadow: '0 30px 70px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.15)',
                position: 'relative', overflow: 'hidden', zIndex: 2,
                display: 'flex', flexDirection: 'column'
              }}>
                {/* Dynamic Island / Notch */}
                <div style={{ width: 90, height: 18, background: '#0F172A', borderRadius: 12, margin: '10px auto 0', position: 'relative', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1E293B' }} />
                </div>

                {/* App Screen Content */}
                <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399' }} />
                      <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>MedConnect Live</span>
                    </div>
                    <span style={{ fontSize: 10, background: 'rgba(52, 211, 153, 0.15)', color: '#34D399', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>অনলাইন</span>
                  </div>

                  {/* Doctor Card UI inside Phone */}
                  <div style={{ background: '#1E293B', borderRadius: 18, padding: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ width: 50, height: 50, borderRadius: 14, overflow: 'hidden', background: '#334155', flexShrink: 0 }}>
                        <OptimizedImage src="/images/doctor-hero-centered.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>ডঃ মোস্তফা রহমান</div>
                        <div style={{ fontSize: 10, color: '#94A3B8' }}>মেডিসিন ও হৃদরোগ বিশেষজ্ঞ</div>
                        <div style={{ fontSize: 10, color: '#F59E0B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                          ★ 4.9 (420+ রিভিউ)
                        </div>
                      </div>
                    </div>

                    {/* Time Slot Picker inside Phone */}
                    <div style={{ fontSize: 10, color: '#CBD5E1', marginBottom: 6, fontWeight: 700 }}>সময় নির্বাচন করুন:</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                      <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.06)', color: '#94A3B8', padding: '4px 8px', borderRadius: 8, flex: 1, textAlign: 'center' }}>১০:৩০ AM</span>
                      <span style={{ fontSize: 10, background: '#10B981', color: 'white', padding: '4px 8px', borderRadius: 8, flex: 1, textAlign: 'center', fontWeight: 800 }}>০২:৩০ PM</span>
                      <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.06)', color: '#94A3B8', padding: '4px 8px', borderRadius: 8, flex: 1, textAlign: 'center' }}>০৬:০০ PM</span>
                    </div>

                    {/* Action Button inside Phone */}
                    <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', borderRadius: 10, padding: '8px', fontSize: 11, fontWeight: 800, textAlign: 'center' }}>
                      বুকিং কনফার্ম করুন ➔
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div style={{ background: 'rgba(52, 211, 153, 0.08)', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, border: '1px dashed rgba(52, 211, 153, 0.3)' }}>
                    <IconClock size={16} color="#34D399" />
                    <span style={{ fontSize: 10, color: '#A7F3D0', fontWeight: 600 }}>ইনস্ট্যান্ট কনফার্মেশন ও এসএমএস অ্যালার্ট</span>
                  </div>
                </div>
              </div>
            </Col>

            {/* Right: Modern Professional Content */}
            <Col lg={7} className="appointment-cta-content" style={{ padding: '32px clamp(20px, 3vw, 50px)', position: 'relative', zIndex: 3 }}>
              
              {/* Badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(52, 211, 153, 0.12)', color: '#6EE7B7',
                padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700,
                marginBottom: 20, border: '1px solid rgba(52, 211, 153, 0.25)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 10px #34D399', animation: 'pulse 2s infinite' }} />
                সহজ ডক্টর বুকিং সেবা
              </div>

              {/* Heading */}
              <h2 style={{
                fontWeight: 900,
                fontSize: 'clamp(28px, 4vw, 44px)',
                color: 'white',
                marginBottom: 18,
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
                fontFamily: "'Hind Siliguri', sans-serif"
              }}>
                <span>সহজেই সেরা ডাক্তারের</span> <br />
                <span style={{
                  background: 'linear-gradient(135deg, #34D399 0%, #A7F3D0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block'
                }}>অ্যাপয়েন্টমেন্ট নিন</span>
              </h2>

              {/* Subtitle */}
              <p className="cta-desc" style={{
                fontSize: 16, color: 'rgba(226, 232, 240, 0.88)',
                lineHeight: 1.7, marginBottom: 32, fontWeight: 400,
                maxWidth: 520, fontFamily: "'Hind Siliguri', sans-serif"
              }}>
                দীর্ঘ লাইনে দাঁড়িয়ে থাকার দিন শেষ। এখন আপনার স্মার্টফোন থেকেই বুক করুন পছন্দের বিশেষজ্ঞ ডাক্তারের অ্যাপয়েন্টমেন্ট।
              </p>

              {/* 2x2 Glass Feature Cards */}
              <div className="cta-features-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
                marginBottom: 36
              }}>
                {[
                  { title: 'দ্রুত বুকিং', desc: 'মাত্র ৩০ সেকেন্ডে অ্যাপয়েন্টমেন্ট', icon: <IconClock /> },
                  { title: 'নিরাপদ সেবা', desc: '100% ভেরিফাইড প্রফেশনাল', icon: <IconShieldCheck /> },
                  { title: 'সহজ ট্র্যাকিং', desc: 'লাইভ স্ট্যাটাস আপডেট পান', icon: <IconDeviceMobile /> },
                  { title: 'স্মার্ট রিমাইন্ডার', desc: 'এসএমএস ও পুশ নোটিফিকেশন', icon: <IconCalendar /> }
                ].map((item, i) => (
                  <div key={i} className="cta-feature-card" style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 16, padding: '14px 16px',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12,
                      background: 'linear-gradient(135deg, rgba(52,211,153,0.2) 0%, rgba(16,185,129,0.1) 100%)',
                      color: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, border: '1px solid rgba(52,211,153,0.3)'
                    }}>
                      {React.cloneElement(item.icon, { size: 20, stroke: 2.2 })}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'white', marginBottom: 2, fontFamily: "'Hind Siliguri', sans-serif" }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: 'rgba(203, 213, 225, 0.85)', fontWeight: 500, fontFamily: "'Hind Siliguri', sans-serif" }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons & Social Proof */}
              <div className="cta-actions-row" style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate('/doctors')}
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF', border: 'none', borderRadius: 16,
                    padding: '16px 36px', fontWeight: 800, fontSize: 16, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    boxShadow: '0 12px 30px rgba(16,185,129,0.35)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontFamily: "'Hind Siliguri', sans-serif"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 18px 40px rgba(16,185,129,0.45)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(16,185,129,0.35)' }}
                >
                  বুক করুন <IconArrowRight size={20} stroke={2.5} />
                </button>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255, 255, 255, 0.05)', padding: '10px 18px', borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                   <div style={{ display: 'flex' }}>
                      {[1, 2, 3].map(i => (
                        <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #064E3B', marginLeft: i > 1 ? -10 : 0, overflow: 'hidden', background: '#334155' }}>
                           <OptimizedImage src={i === 1 ? '/images/doctor-hero-centered.png' : i === 2 ? '/images/doctor-premium.png' : '/images/login_banner_guy.png'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                   </div>
                   <div style={{ fontSize: 13, color: 'rgba(226, 232, 240, 0.9)', fontWeight: 600, textAlign: 'left', fontFamily: "'Hind Siliguri', sans-serif" }}>
                      <span style={{ color: '#34D399', fontWeight: 900, fontSize: 14 }}>৫০০০+</span> <span>রোগী যুক্ত হয়েছেন</span>
                   </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Container>

      <style>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        .cta-feature-card:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(52, 211, 153, 0.4) !important;
          transform: translateY(-3px);
        }
      `}</style>
    </section>
  )
}

// ─── WHY CHOOSE US ────────────────────────────────────────────────────────────
function WhyChooseUs() {
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768)
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const features = [
    { icon: <IconShieldCheck size={32} />, title: 'যাচাইকৃত ডাক্তার', desc: 'অভিজ্ঞ ও নিবন্ধিত বিশেষজ্ঞ ডাক্তার' },
    { icon: <IconCalendar size={32} />, title: 'নিরাপদ বুকিং', desc: 'আপনার সময় ও গোপনীয়তা আমাদের দায়িত্ব' },
    { icon: <IconStethoscope size={32} />, title: 'সহজ ও দ্রুত', desc: 'কয়েক ক্লিকে সেরা সেবা নিশ্চিত করুন' },
    { icon: <IconHeadset size={32} />, title: '২৪/৭ সহায়তা', desc: 'জরুরি প্রয়োজনে আমরা আছি আপনার সাথে' },
    { icon: <IconLock size={32} />, title: 'তথ্য সুরক্ষা', desc: 'আপনার সকল তথ্য এনক্রিপ্টেড ও সুরক্ষিত' },
  ]

  return (
    <section style={{ padding: '20px 0', background: 'radial-gradient(circle at bottom left, #F8FAFC 0%, #FFFFFF 50%)', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative background element */}
      <div style={{ position: 'absolute', top: '10%', right: '-5%', width: '30%', height: '40%', background: 'rgba(0,168,140,0.02)', borderRadius: '40% 60% 30% 70% / 60% 30% 70% 40%', filter: 'blur(60px)' }} />

      <Container>
        <div className="text-center" style={{ position: 'relative', zIndex: 2, marginBottom: 16 }}>
          <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 99, display: 'inline-block', marginBottom: 16 }}>
            কেন আমাদের বেছে নিবেন?
          </span>
          <h2 style={{ fontWeight: 900, fontSize: 'clamp(28px, 4vw, 40px)', color: '#0F172A', marginBottom: 20, letterSpacing: '-0.02em' }}>
            বিশ্বস্ত ও নির্ভরযোগ্য সেবার অঙ্গীকার
          </h2>
          <div style={{ width: 60, height: 4, background: 'linear-gradient(90deg, #00A88C, #059669)', borderRadius: 2, margin: '0 auto' }} />
        </div>

        {isMobile ? (
          <Swiper
            spaceBetween={16}
            slidesPerView={1.2}
            loop={false}
            style={{ padding: '16px 4px 20px', margin: '0 -8px' }}
            className="why-choose-swiper-mobile"
          >
            {features.map((item, i) => (
              <SwiperSlide key={i} style={{ height: 'auto' }}>
                <div
                  className="why-choose-card"
                  onClick={() => navigate('/doctors')}
                  style={{
                    textAlign: 'center',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: '#FFFFFF',
                    border: '2px solid rgba(0, 168, 140, 0.18)',
                    borderRadius: 7,
                    padding: '32px 24px',
                    boxShadow: '0 10px 30px rgba(0, 168, 140, 0.04)',
                    height: '100%',
                    cursor: 'pointer'
                  }}
                >
                  <div className="why-choose-icon-box" style={{
                    width: 90, height: 90, borderRadius: '24px',
                    background: '#F0FDFA', color: '#00A88C',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(0,168,140,0.08)',
                    position: 'relative',
                    margin: '0 auto 20px',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    {/* Subtle Glow Behind Icon */}
                    <div style={{ position: 'absolute', width: '100%', height: '100%', background: '#00A88C', opacity: 0.08, borderRadius: 'inherit', filter: 'blur(10px)' }} />
                    {item.icon}
                  </div>
                  <h5 style={{ fontWeight: 900, fontSize: 19, color: '#0F172A', marginBottom: 12, fontFamily: "'Inter', sans-serif" }}>{item.title}</h5>
                  <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.7, maxWidth: 220, margin: '0 auto', fontWeight: 500 }}>{item.desc}</p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <Row className="why-choose-row g-3 justify-content-center" style={{ position: 'relative', zIndex: 2 }}>
            {features.map((item, i) => (
              <Col key={i} xs={12} sm={6} lg={true} className="why-choose-col">
                <div
                  className="why-choose-card"
                  onClick={() => navigate('/doctors')}
                  style={{
                    textAlign: 'center',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: '#FFFFFF',
                    border: '2px solid rgba(0, 168, 140, 0.15)',
                    borderRadius: 7,
                    padding: '36px 24px',
                    boxShadow: '0 10px 30px rgba(0, 168, 140, 0.04)',
                    height: '100%',
                    cursor: 'pointer'
                  }}
                >
                  <div className="why-choose-icon-box" style={{
                    width: 90, height: 90, borderRadius: '24px',
                    background: '#F0FDFA', color: '#00A88C',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(0,168,140,0.08)',
                    position: 'relative',
                    margin: '0 auto 20px',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    {/* Subtle Glow Behind Icon */}
                    <div style={{ position: 'absolute', width: '100%', height: '100%', background: '#00A88C', opacity: 0.08, borderRadius: 'inherit', filter: 'blur(10px)' }} />
                    {item.icon}
                  </div>
                  <h5 style={{ fontWeight: 900, fontSize: 19, color: '#0F172A', marginBottom: 12, fontFamily: "'Inter', sans-serif" }}>{item.title}</h5>
                  <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.7, maxWidth: 220, margin: '0 auto', fontWeight: 500 }}>{item.desc}</p>
                </div>
              </Col>
            ))}
          </Row>
        )}

        <div className="text-center" style={{ position: 'relative', zIndex: 2, marginTop: 16 }}>
          <button
            onClick={() => navigate('/doctors')}
            style={{
              background: 'linear-gradient(135deg, #00A88C 0%, #00796B 100%)', color: 'white', border: 'none', borderRadius: 18,
              padding: '18px 54px', fontWeight: 800, fontSize: 18, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 14,
              boxShadow: '0 15px 35px rgba(0,168,140,0.25)', transition: 'all 0.3s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 20px 45px rgba(0,168,140,0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.1)' }}
          >
            ডাক্তার বুকিং সহজে <IconArrowRight size={22} />
          </button>
        </div>
      </Container>
    </section>
  )
}






// ─── REGISTRATION CARDS ──────────────────────────────────────────────────────
function RegistrationCards() {
  const navigate = useNavigate()
  const scrollRef = React.useRef(null)
  const thumbRef  = React.useRef(null)

  React.useEffect(() => {
    const el    = scrollRef.current
    const thumb = thumbRef.current
    if (!el || !thumb) return
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth
      const pct = max > 0 ? (el.scrollLeft / max) * (200 / 3) : 0
      thumb.style.transform = `translateX(${pct}%)`
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const cards = [
    {
      title: 'ডাক্তার হিসেবে যুক্ত হোন',
      desc: 'আপনার প্র্যাকটিস পরিচালনা করুন এবং রোগীদের ডিজিটাল সেবা দিন।',
      btnText: 'ডাক্তার রেজিস্ট্রেশন',
      link: '/register?role=doctor',
      infoLink: '/register-doctor',
      icon: <IconStethoscope size={20} />,
      color: '#2563EB',
      solidBg: '#E0F2FE',
      image: '/images/promotion/doctor.png'
    },
    {
      title: 'হাসপাতাল পার্টনার হোন',
      desc: 'আপনার হাসপাতালের তথ্য যুক্ত করুন এবং অ্যাপয়েন্টমেন্ট ম্যানেজ করুন।',
      btnText: 'হাসপাতাল রেজিস্ট্রেশন',
      link: '/register?role=hospital',
      infoLink: '/register-hospital',
      icon: <IconBuildingHospital size={20} />,
      color: '#DB2777',
      solidBg: '#FCE7F3',
      image: '/images/promotion/hospital.png'
    },
    {
      title: 'পেশেন্ট হিসেবে যুক্ত হোন',
      desc: 'ডাক্তার খুঁজুন এবং সহজেই অনলাইনে অ্যাপয়েন্টমেন্ট বুক করুন।',
      btnText: 'পেশেন্ট রেজিস্ট্রেশন',
      link: '/register?role=patient',
      infoLink: '/support',
      icon: <IconUsers size={20} />,
      color: '#059669',
      solidBg: '#DCFCE7',
      image: '/images/promotion/care.png'
    }
  ]

  return (
    <section className="registration-section" style={{ padding: '16px 0 20px', background: 'transparent' }}>
      <Container>
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'nowrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#D1FAE5', color: '#065F46', fontSize: 12, fontWeight: 800, padding: '6px 14px', borderRadius: 99, boxShadow: '0 4px 10px rgba(6, 95, 70, 0.05)', whiteSpace: 'nowrap' }}>
            <IconUsers size={16} stroke={2.5} />
            <span>REGISTRATION / নিবন্ধন</span>
          </div>
        </div>

        {/* Cards — horizontal scroll on mobile, 3-col grid on desktop */}
        <div className="reg-cards-scroll-wrap">
        <div className="reg-cards-grid" ref={scrollRef}>
          {cards.map((card, i) => (
            <div
              key={i}
              className="premium-reg-card"
              onClick={() => navigate(card.link)}
              style={{
                background: 'white',
                borderRadius: 7,
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                '--card-color': card.color,
                '--card-color-light': `${card.color}30`
              }}
            >
              {/* ── MOBILE: horizontal (text left, image right) ── */}
              <div className="reg-card-mobile" style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                gap: 14,
                background: `linear-gradient(130deg, ${card.solidBg}80 0%, white 55%)`
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Role icon pill */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'white', color: card.color,
                    boxShadow: `0 3px 10px ${card.color}20`,
                    border: `2px solid ${card.solidBg}`,
                    marginBottom: 8
                  }}>
                    {card.icon}
                  </div>
                  <h3 style={{
                    fontSize: 16, fontWeight: 900, color: '#0F172A',
                    marginBottom: 5, lineHeight: 1.3,
                    fontFamily: "'Hind Siliguri', sans-serif"
                  }}>{card.title}</h3>
                  <p style={{
                    fontSize: 12.5, color: '#64748B', lineHeight: 1.5,
                    marginBottom: 12, fontWeight: 500,
                    fontFamily: "'Hind Siliguri', sans-serif"
                  }}>{card.desc}</p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(card.link) }}
                      className="reg-card-primary-btn"
                      style={{
                        background: card.color, color: 'white', border: 'none',
                        borderRadius: 7, padding: '8px 14px', fontWeight: 700,
                        fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 5,
                        cursor: 'pointer', whiteSpace: 'nowrap',
                        fontFamily: "'Hind Siliguri', sans-serif"
                      }}
                    >
                      রেজিস্ট্রেশন <IconArrowRight size={13} className="btn-arrow" style={{ transition: 'transform 0.3s ease' }} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(card.infoLink) }}
                      className="reg-card-secondary-btn"
                      style={{
                        background: 'transparent', color: '#475569',
                        border: '1.5px solid #E2E8F0', borderRadius: 7,
                        padding: '8px 11px', fontWeight: 700, fontSize: 12.5,
                        display: 'flex', alignItems: 'center', gap: 4,
                        cursor: 'pointer', whiteSpace: 'nowrap',
                        fontFamily: "'Hind Siliguri', sans-serif"
                      }}
                    >
                      বিস্তারিত <IconInfoCircle size={13} />
                    </button>
                  </div>
                </div>
                <div style={{ width: 100, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <OptimizedImage
                    src={card.image} alt={card.title} objectFit="contain"
                    style={{ width: '100%', height: 95, mixBlendMode: 'multiply', transition: 'transform 0.5s ease' }}
                    className="reg-card-img-mobile"
                  />
                </div>
              </div>

              {/* ── DESKTOP: vertical card (image top, body bottom) ── */}
              <div className="reg-card-desktop" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{
                  height: 180,
                  background: `linear-gradient(135deg, ${card.solidBg}50 0%, ${card.solidBg}20 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', overflow: 'hidden', padding: '20px'
                }}>
                  <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', top: -30, right: -30, filter: 'blur(20px)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', bottom: -20, left: -20, filter: 'blur(15px)', pointerEvents: 'none' }} />
                  <OptimizedImage
                    src={card.image} alt={card.title} objectFit="contain"
                    style={{ height: '100%', maxHeight: 140, width: 'auto', transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)', mixBlendMode: 'multiply' }}
                    className="reg-card-img-desktop"
                  />
                </div>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'white', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, position: 'absolute', top: 156, left: 24, zIndex: 10, border: `2px solid ${card.solidBg}` }}>
                  {card.icon}
                </div>
                <div style={{ padding: '32px 24px 28px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', marginBottom: 10, marginTop: 8, lineHeight: 1.3, fontFamily: "'Hind Siliguri', sans-serif" }}>{card.title}</h3>
                  <p style={{ fontSize: 14.5, color: '#64748B', lineHeight: 1.6, marginBottom: 24, fontWeight: 500, flexGrow: 1, fontFamily: "'Hind Siliguri', sans-serif" }}>{card.desc}</p>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 'auto' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(card.link) }}
                      className="reg-card-primary-btn"
                      style={{ background: card.color, color: 'white', border: 'none', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1.3, cursor: 'pointer', boxShadow: `0 4px 14px ${card.color}20`, fontFamily: "'Hind Siliguri', sans-serif" }}
                    >
                      <span style={{ whiteSpace: 'nowrap' }}>{card.btnText}</span>
                      <IconArrowRight size={16} className="btn-arrow" style={{ transition: 'transform 0.3s ease' }} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(card.infoLink) }}
                      className="reg-card-secondary-btn"
                      style={{ background: 'transparent', color: '#475569', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '12px 14px', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, flex: 0.7, cursor: 'pointer', fontFamily: "'Hind Siliguri', sans-serif" }}
                    >
                      <span style={{ whiteSpace: 'nowrap' }}>বিস্তারিত</span>
                      <IconInfoCircle size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>

        {/* Scroll progress bar — mobile only */}
        <div className="reg-scroll-track">
          <div className="reg-scroll-thumb" ref={thumbRef} />
        </div>
      </Container>

      <style>{`
        /* ── Mobile: horizontal scroll row ── */
        .reg-cards-scroll-wrap {
          margin: 0 -12px;
          padding: 4px 12px;
        }
        .reg-cards-grid {
          display: flex;
          flex-direction: row;
          gap: 12px;
          overflow-x: auto;
          overflow-y: visible;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-top: 10px;
          padding-bottom: 12px;
        }
        .reg-cards-grid::-webkit-scrollbar { display: none; }
        .reg-cards-grid .premium-reg-card {
          flex: 0 0 85vw;
          max-width: 320px;
          scroll-snap-align: start;
        }

        /* ── Desktop: 3-col grid ── */
        @media (min-width: 768px) {
          .reg-cards-scroll-wrap { margin: 0; padding: 0; }
          .reg-cards-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            overflow-x: visible;
          }
          .reg-cards-grid .premium-reg-card {
            flex: none;
            max-width: none;
          }
        }

        /* ── Toggle mobile vs desktop card inner layout ── */
        .reg-card-mobile  { display: flex !important; }
        .reg-card-desktop { display: none !important; }
        @media (min-width: 768px) {
          .reg-card-mobile  { display: none !important; }
          .reg-card-desktop { display: flex !important; }
        }

        /* ── Scroll progress bar (mobile only) ── */
        .reg-scroll-track {
          height: 3px;
          background: #E2E8F0;
          border-radius: 99px;
          margin-top: 14px;
          overflow: hidden;
        }
        .reg-scroll-thumb {
          height: 100%;
          width: 33.33%;
          background: linear-gradient(90deg, #00A88C, #00D4AF);
          border-radius: 99px;
          transform: translateX(0%);
          transition: transform 0.15s ease;
        }
        @media (min-width: 768px) {
          .reg-scroll-track { display: none; }
        }

        /* ── Card hover ── */
        .premium-reg-card {
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .premium-reg-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 36px -8px var(--card-color-light), 0 1px 3px rgba(0,0,0,0.04) !important;
          border-color: var(--card-color) !important;
        }
        .premium-reg-card:hover .reg-card-img-desktop,
        .premium-reg-card:hover .reg-card-img-mobile {
          transform: scale(1.06) translateY(-3px) !important;
        }
        .reg-card-primary-btn { transition: all 0.3s ease !important; }
        .reg-card-primary-btn:hover .btn-arrow { transform: translateX(4px) !important; }
        .reg-card-secondary-btn { transition: all 0.3s ease !important; }
        .reg-card-secondary-btn:hover { background: #F8FAFC !important; border-color: #CBD5E1 !important; color: #0F172A !important; }

        /* ── Why Choose (unrelated, kept) ── */
        .why-choose-card { transition: all 0.4s cubic-bezier(0.4,0,0.2,1) !important; }
        .why-choose-card:hover { transform: translateY(-12px) scale(1.03) !important; border-color: #00A88C !important; box-shadow: 0 22px 50px rgba(0,168,140,0.18) !important; background: linear-gradient(180deg,#FFFFFF 0%,#F0FDFA 100%) !important; }
        .why-choose-card:hover .why-choose-icon-box { transform: scale(1.12) rotate(4deg) !important; background: linear-gradient(135deg,#00A88C 0%,#00796B 100%) !important; color:#FFFFFF !important; box-shadow: 0 12px 28px rgba(0,168,140,0.35) !important; }
      `}</style>


    </section>
  )
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage() {
  // SINGLE API CALL: Fetches top doctors, top hospitals, specialties, and stats
  const { data, isLoading } = useHomepage()

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <HeroSection stats={data?.stats} />
      
      <ScrollReveal direction="up" distance={28} duration={600}>
        <MostViewedDoctors doctors={data?.top_doctors} loading={isLoading} />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600}>
        <TopSpecialtiesSlider specialties={data?.specialties} loading={isLoading} />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600}>
        <RegistrationCards />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600}>
        <TopHospitals hospitals={data?.top_hospitals} loading={isLoading} />
      </ScrollReveal>

      {/* Below-the-fold sections fetch their own data independently via TanStack Query */}
      <ScrollReveal direction="up" distance={28} duration={600}>
        <ServicePreview />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600}>
        <AppointmentCTA />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600}>
        <WhyChooseUs />
      </ScrollReveal>



      <style>{`
        @media (max-width: 768px) {
          section { padding: 12px 0 !important; }
          .registration-section { padding: 6px 0 0px !important; }
          .registration-card { text-align: center !important; }
          .registration-card-icon { margin: 0 auto !important; }
          .service-swiper { padding: 10px 0 30px !important; }
          .appointment-cta-container { 
            border-radius: 24px !important; 
            min-height: auto !important;
            margin: 0 4px !important;
          }
          .appointment-cta-content { 
            padding: 40px 20px !important; 
            text-align: center !important; 
          }
          .reg-card-prev, .reg-card-next { display: none !important; }
          
          /* 📱 Appointment CTA Mobile View Overrides */
          .cta-desc {
            font-size: 14px !important;
            line-height: 1.6 !important;
            margin-bottom: 24px !important;
            text-align: center !important;
          }
          .cta-features-grid {
            grid-template-columns: 1fr !important;
            max-width: 290px !important;
            margin: 0 auto 32px !important;
            gap: 16px !important;
          }
          .cta-actions-row {
            justify-content: center !important;
            gap: 16px !important;
          }
          .cta-actions-row button {
            width: 100% !important;
            max-width: 280px !important;
            justify-content: center !important;
            padding: 14px 28px !important;
            font-size: 15px !important;
          }
            
          /* 📱 Popular Services Mobile View Overrides */
          .service-arrows-desktop { display: none !important; }
          .service-controls-desktop a {
            font-size: 13px !important;
            gap: 4px !important;
          }
          .service-card {
            flex-direction: row !important;
            align-items: center !important;
            text-align: left !important;
            border-radius: 12px !important;
            padding: 14px 16px !important;
            gap: 16px !important;
            border: 1px solid rgba(226, 232, 240, 0.8) !important;
            justify-content: flex-start !important;
            height: 84px !important;
          }
          .service-card .service-icon-container {
            width: 52px !important;
            height: 52px !important;
            border-radius: 12px !important;
            flex-shrink: 0 !important;
          }
          .service-card-text-col {
            align-items: flex-start !important;
            gap: 4px !important;
            text-align: left !important;
          }
          .service-card h4 {
            font-size: 15px !important;
            text-align: left !important;
          }
          .service-count-badge {
            font-size: 11px !important;
            padding: 3px 8px !important;
            border-radius: 6px !important;
          }
          .service-card-watermark {
            right: 8px !important;
            bottom: auto !important;
            top: 50% !important;
            transform: translateY(-50%) rotate(-15deg) !important;
            opacity: 0.08 !important;
          }
            
          /* 📱 Why Choose Us Dotted Borders Mobile Overrides */
          .why-choose-row {
            gap: 20px !important;
          }
          .why-choose-col {
            padding: 0 16px !important;
          }
          .why-choose-card {
            background: #FFFFFF !important;
            border: 2.5px dotted rgba(0, 168, 140, 0.35) !important;
            border-radius: 24px !important;
            padding: 32px 24px !important;
            box-shadow: 0 10px 30px rgba(0, 168, 140, 0.02) !important;
            margin: 0 auto !important;
            max-width: 320px !important;
            transition: all 0.3s ease !important;
          }
            

        }
      `}</style>
    </div>
  )
}

export default HomePage

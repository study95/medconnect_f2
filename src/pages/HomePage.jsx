import { useNavigate, Link } from 'react-router-dom'
import { Container, Row, Col } from 'react-bootstrap'
import HeroSection from '../components/home/HeroSection'
import ImageBannerSlider from '../components/home/ImageBannerSlider'
import MostViewedDoctors from '../components/home/MostViewedDoctors'
import TopSpecialtiesSlider from '../components/home/TopSpecialtiesSlider'
import TopHospitals from '../components/home/TopHospitals'
import OptimizedImage from '../components/common/OptimizedImage'
import ScrollReveal from '../components/common/ScrollReveal'

import {
  IconArrowRight, IconCalendar, IconShieldCheck, IconClock, IconStar, IconHeadset,
  IconChevronLeft, IconChevronRight, IconChevronDown, IconStethoscope, IconHeart, IconDental, IconUsers, IconEye, IconScissors,
  IconLock, IconDeviceMobile, IconBuildingHospital, IconInfoCircle, IconShare,
  IconFileText, IconBell, IconChartBar, IconMapPin, IconArrowUpRight
} from '@tabler/icons-react'
import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import axiosInstance from '../api/axiosInstance'
import { getContent } from '../utils/contentService'
import useHomepage from '../hooks/useHomepage'
import { getMediaUrl } from '../utils/mediaUtils'

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
    <section style={{ padding: '14px 0', background: 'white' }}>
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
    <section style={{ padding: '14px 0', background: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
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
    <section style={{ padding: '14px 0', background: 'radial-gradient(circle at bottom left, #F8FAFC 0%, #FFFFFF 50%)', position: 'relative', overflow: 'hidden' }}>
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

// ─── REGISTRATION CARDS (PIC 1 EXECUTIVE STYLE) ──────────────────────────────
// ─── REGISTRATION / STEP-BY-STEP CARDS (MADE SIMPLE DESIGN) ──────────────────────
function RegistrationCards() {
  const navigate = useNavigate()

  const steps = [
    {
      stepNum: 'STEP 01',
      title: 'Doctor Registration',
      subTitle: 'ডাক্তার হিসেবে যুক্ত হোন',
      desc: 'আপনার প্রাকটিস পরিচালনা করুন এবং রোগীদের ডিজিটাল সেবা দিন।',
      link: '/register-doctor',
      icon: (
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#00B875" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="7" r="4" />
          <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2" />
        </svg>
      ),
    },
    {
      stepNum: 'STEP 02',
      title: 'Hospital Registration',
      subTitle: 'হাসপাতাল পার্টনার হোন',
      desc: 'আপনার হাসপাতালের তথ্য যুক্ত করুন এবং অ্যাপয়েন্টমেন্ট ম্যানেজ করুন।',
      link: '/register-hospital',
      icon: (
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#00B875" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
    {
      stepNum: 'STEP 03',
      title: 'Patient Registration',
      subTitle: 'পেশেন্ট হিসেবে যুক্ত হোন',
      desc: 'ডাক্তার খুঁজুন এবং সহজেই অনলাইনে অ্যাপয়েন্টমেন্ট বুক করুন।',
      link: '/register',
      icon: (
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#00B875" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="7" r="4" />
          <path d="M3.5 21v-2a6.5 6.5 0 0 1 13 0v2" />
          <polyline points="16 11 18 13 22 9" />
        </svg>
      ),
    }
  ]

  return (
    <section className="registration-section" style={{ padding: '36px 0 28px', background: '#F8FAFC' }}>
      <Container>
        {/* Title Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{
            fontSize: 'clamp(26px, 3.8vw, 36px)',
            fontWeight: 800,
            color: '#0F172A',
            marginBottom: 8,
            fontFamily: "'Inter', sans-serif"
          }}>
            সহজ ৩টি ধাপে যুক্ত হোন
          </h2>
          <p style={{
            fontSize: 15,
            color: '#64748B',
            fontWeight: 400,
            maxWidth: 560,
            margin: '0 auto',
            fontFamily: "'Hind Siliguri', sans-serif"
          }}>
            ডাক্তার, হাসপাতাল এবং রোগী — সবার জন্য ডিজিটাল স্বাস্থ্যসেবা
          </p>
        </div>

        {/* Dark Navy Box Container */}
        <div style={{
          background: '#0B192C',
          borderRadius: 8,
          boxShadow: '0 20px 45px -10px rgba(11, 25, 44, 0.3)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div className="pic1-steps-grid">
            {steps.map((item, i) => (
              <div
                key={i}
                className="pic1-step-col"
                onClick={() => navigate(item.link)}
                style={{
                  cursor: 'pointer',
                  padding: '42px 32px 38px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                  transition: 'background 0.3s ease'
                }}
              >
                {/* Step Tag */}
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#00B875',
                  letterSpacing: '2px',
                  marginBottom: 24,
                  textTransform: 'uppercase',
                  fontFamily: "'Inter', sans-serif"
                }}>
                  {item.stepNum}
                </span>

                {/* Icon Box */}
                <div style={{
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 56,
                  transition: 'transform 0.3s ease'
                }} className="pic1-icon-wrap">
                  {item.icon}
                </div>

                {/* English Title */}
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  marginBottom: 8,
                  fontFamily: "'Inter', sans-serif"
                }}>
                  {item.title}
                </h3>

                {/* Bangla Subtitle Pill */}
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  background: '#00B875',
                  padding: '4px 14px',
                  borderRadius: 4,
                  marginBottom: 14,
                  display: 'inline-block',
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}>
                  {item.subTitle}
                </span>

                {/* Description */}
                <p style={{
                  fontSize: 13,
                  color: '#94A3B8',
                  lineHeight: 1.6,
                  margin: 0,
                  fontWeight: 400,
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}>
                  {item.desc}
                </p>

                {/* Arrow connector between columns (desktop horizontal / mobile vertical) */}
                {i < steps.length - 1 && (
                  <>
                    <div className="pic1-step-connector d-none d-md-flex">
                      <IconChevronRight size={14} color="#00B875" />
                    </div>
                    <div className="pic1-step-connector-mobile d-flex d-md-none">
                      <IconChevronDown size={16} color="#00B875" />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Primary CTA Button Below Box */}
        <div className="reg-cta-btn-wrapper" style={{ textAlign: 'center', marginTop: 28, marginBottom: 20 }}>
          <button
            onClick={() => navigate('/register')}
            style={{
              background: '#00B875',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '14px 42px',
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 8px 24px rgba(0, 184, 117, 0.3)',
              transition: 'all 0.3s ease',
              fontFamily: "'Hind Siliguri', sans-serif"
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#009E64' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#00B875' }}
          >
            <span>এখনই নিবন্ধন শুরু করুন</span>
            <IconArrowRight size={18} stroke={2.5} />
          </button>
        </div>
      </Container>

      <style>{`
        .pic1-steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 767px) {
          .reg-cta-btn-wrapper {
            margin-bottom: 32px !important;
            margin-top: 24px !important;
          }
          .registration-section {
            padding-bottom: 44px !important;
          }
        }
        .pic1-step-col {
          border-right: 1px solid rgba(255, 255, 255, 0.08);
        }
        .pic1-step-col:last-child {
          border-right: none;
        }
        .pic1-step-col:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .pic1-step-col:hover .pic1-icon-wrap {
          transform: translateY(-4px) scale(1.08);
        }
        .pic1-step-connector {
          position: absolute;
          right: -14px;
          top: 50%;
          transform: translateY(-50%);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #0B192C;
          border: 1px solid rgba(0, 184, 117, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
        @media (max-width: 860px) {
          .pic1-steps-grid {
            grid-template-columns: 1fr;
          }
          .pic1-step-col {
            border-right: none;
            border-bottom: 1.5px dashed rgba(0, 184, 117, 0.35);
            padding: 34px 20px 42px;
          }
          .pic1-step-col:last-child {
            border-bottom: none;
            padding-bottom: 34px;
          }
          .pic1-step-connector {
            display: none;
          }
          .pic1-step-connector-mobile {
            position: absolute;
            bottom: -15px;
            left: 50%;
            transform: translateX(-50%);
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: #0B192C;
            border: 1.5px solid #00B875;
            box-shadow: 0 4px 14px rgba(0, 184, 117, 0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
          }
        }
      `}</style>
    </section>
  )
}

// ─── DIGITAL DASHBOARD BANNER (PIC 2 REFERENCE STYLE) ──────────────────────
function DigitalDashboardBanner() {
  const navigate = useNavigate()

  const features = [
    {
      icon: <IconCalendar size={20} stroke={2.2} />,
      title: 'ডিজিটাল অ্যাপয়েন্টমেন্ট বুকিং',
      subtitle: 'অনলাইন সিডিউল, রোগী তালিকা, অটো স্লট'
    },
    {
      icon: <IconFileText size={20} stroke={2.2} />,
      title: 'ইনভয়েস ও ই-প্রেসক্রিপশন',
      subtitle: 'এক ক্লিকে ডিজিটাল প্রেসক্রিপশন, PDF রসিদ'
    },
    {
      icon: <IconBell size={20} stroke={2.2} />,
      title: 'অটো রিমাইন্ডার ও SMS নোটিফিকেশন',
      subtitle: 'অ্যাপয়েন্টমেন্টের আগে ও পরে অটো SMS'
    },
    {
      icon: <IconBuildingHospital size={20} stroke={2.2} />,
      title: 'হাসপাতাল ও চেম্বার পেজ',
      subtitle: 'ডাক্তার তালিকা, ইউনিট ও পাবলিক পেজ'
    },
    {
      icon: <IconChartBar size={20} stroke={2.2} />,
      title: 'আয়-ব্যয় ও পেমেন্ট অ্যানালিটিক্স',
      subtitle: 'চার্ট, রিপোর্ট, হিসাব এক্সপোর্ট'
    }
  ]

  return (
    <section style={{ background: '#0B192C', padding: '56px 0 52px', color: '#FFFFFF', position: 'relative', overflow: 'hidden' }}>
      <Container>
        {/* Title Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h2 style={{
            fontSize: 'clamp(24px, 3.8vw, 38px)',
            fontWeight: 900,
            color: '#FFFFFF',
            marginBottom: 10,
            fontFamily: "'Hind Siliguri', 'Inter', sans-serif",
            letterSpacing: '-0.5px'
          }}>
            ডাক্তার ও হাসপাতাল? ব্যবস্থাপনা ডিজিটাল করুন
          </h2>
          <p style={{
            fontSize: 14.5,
            color: '#94A3B8',
            fontWeight: 500,
            maxWidth: 620,
            margin: '0 auto',
            fontFamily: "'Hind Siliguri', sans-serif"
          }}>
            অ্যাপয়েন্টমেন্ট, রোগী ব্যবস্থাপনা, ইনভয়েস, রিমাইন্ডার — সব এক ড্যাশবোর্ডে
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <Row className="g-3 justify-content-center mb-4">
            {features.map((item, i) => (
              <Col key={i} xs={12} md={6} lg={4}>
                <div style={{
                  background: 'rgba(15, 30, 52, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 6,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  transition: 'all 0.3s ease',
                  height: '100%'
                }} className="dashboard-feature-card">
                  {/* Green Square Icon Badge */}
                  <div style={{
                    width: 38,
                    height: 38,
                    background: '#00B875',
                    color: '#FFFFFF',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 900
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: '#FFFFFF',
                      marginBottom: 2,
                      fontFamily: "'Hind Siliguri', sans-serif",
                      lineHeight: 1.3
                    }}>
                      {item.title}
                    </h4>
                    <p style={{
                      fontSize: 12,
                      color: '#94A3B8',
                      margin: 0,
                      fontWeight: 500,
                      fontFamily: "'Hind Siliguri', sans-serif"
                    }}>
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* Sub-label below cards */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 14px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 4,
            fontSize: 12,
            color: '#64748B',
            fontFamily: "'Inter', monospace",
            marginBottom: 6
          }}>
            doctorbooklet.com/dashboard
          </div>
          <div style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, fontFamily: "'Hind Siliguri', sans-serif" }}>
            doctorbooklet.com Owner Dashboard
          </div>
        </div>

        {/* Action Buttons (1 Row on Mobile) */}
        <div className="dash-banner-btns-row" style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/services')}
            style={{
              background: '#00B875',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              padding: '13px 32px',
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
            <span>সব ফিচার দেখুন</span>
            <IconArrowRight size={17} stroke={2.5} />
          </button>

          <button
            onClick={() => navigate('/register')}
            style={{
              background: 'transparent',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: 6,
              padding: '13px 28px',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.3s ease',
              fontFamily: "'Hind Siliguri', sans-serif"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)' }}
          >
            <span>ফ্রি অ্যাকাউন্ট খুলুন</span>
          </button>
        </div>
      </Container>

      <style>{`
        .dashboard-feature-card:hover {
          background: rgba(15, 30, 52, 0.95) !important;
          border-color: rgba(0, 184, 117, 0.4) !important;
          transform: translateY(-3px);
        }
      `}</style>
    </section>
  )
}

// ─── EXPLORE DIVISIONS / CITIES SECTION (IMAGE 1 REFERENCE DESIGN) ───────────
function BrowseByLocationSection() {
  const navigate = useNavigate()

  const divisions = [
    {
      bnName: 'ঢাকা বিভাগ',
      enName: 'Dhaka Division',
      count: '৪৫+ হাসপাতাল',
      searchKey: 'Dhaka',
      img: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=600&auto=format&fit=crop&q=70'
    },
    {
      bnName: 'সিলেট বিভাগ',
      enName: 'Sylhet Division',
      count: '১৮+ হাসপাতাল',
      searchKey: 'Sylhet',
      img: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=70'
    },
    {
      bnName: 'চট্টগ্রাম বিভাগ',
      enName: 'Chattogram Division',
      count: '২৫+ হাসপাতাল',
      searchKey: 'Chattogram',
      img: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=600&auto=format&fit=crop&q=70'
    },
    {
      bnName: 'রাজশাহী সিটি',
      enName: 'Rajshahi City',
      count: '১৫+ হাসপাতাল',
      searchKey: 'Rajshahi',
      img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=70'
    }
  ]

  return (
    <section style={{ background: '#F8FAFC', padding: '56px 0 52px', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
      <Container>
        {/* Title & Top Right Button Header (Matching Image 1) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{
              fontSize: 'clamp(22px, 3.5vw, 32px)',
              fontWeight: 900,
              color: '#0F172A',
              margin: 0,
              fontFamily: "'Hind Siliguri', 'Inter', sans-serif"
            }}>
              বিভাগ অনুযায়ী হাসপাতাল খুঁজুন
            </h2>
            <p style={{ fontSize: 13.5, color: '#64748B', margin: '4px 0 0 0', fontWeight: 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
              বাংলাদেশের জনপ্রিয় বিভাগ ও এলাকার সেরা হাসপাতাল এবং ল্যাব সেন্টার
            </p>
          </div>

          <button
            onClick={() => navigate('/hospitals')}
            style={{
              background: '#FFFFFF',
              color: '#0F172A',
              border: '1.5px solid #E2E8F0',
              borderRadius: 0,
              padding: '10px 20px',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.3s ease',
              fontFamily: "'Hind Siliguri', sans-serif"
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#0F172A'; e.currentTarget.style.background = '#F8FAFC' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FFFFFF' }}
          >
            <span>সব এলাকা দেখুন</span>
            <IconArrowRight size={16} color="#16A34A" stroke={2.5} />
          </button>
        </div>

        {/* 4 Image Division Cards Grid (Matching Image 1) */}
        <Row className="g-3">
          {divisions.map((div, i) => (
            <Col key={i} xs={12} sm={6} lg={3}>
              <div
                onClick={() => navigate(`/hospitals?search=${encodeURIComponent(div.searchKey)}`)}
                style={{
                  position: 'relative',
                  height: 230,
                  borderRadius: 0,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
                }}
                className="division-image-card"
              >
                {/* Background Image */}
                <img
                  src={div.img}
                  alt={div.enName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.5s ease'
                  }}
                  className="division-card-img"
                />

                {/* Dark Overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.45) 55%, rgba(15,23,42,0.15) 100%)'
                }} />

                {/* Content at Bottom Left */}
                <div style={{ position: 'absolute', bottom: 18, left: 18, right: 65, zIndex: 2 }}>
                  <h4 style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: '#FFFFFF',
                    margin: '0 0 3px 0',
                    lineHeight: 1.25,
                    fontFamily: "'Hind Siliguri', 'Inter', sans-serif"
                  }}>
                    {div.bnName}
                  </h4>
                  <span style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.85)',
                    fontFamily: "'Hind Siliguri', sans-serif"
                  }}>
                    {div.count}
                  </span>
                </div>

                {/* Bottom Right Glassmorphic Arrow Button (↗) */}
                <div
                  className="division-card-arrow"
                  style={{
                    position: 'absolute',
                    bottom: 18,
                    right: 18,
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.28)',
                    backdropFilter: 'blur(8px)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    zIndex: 2,
                    border: '1px solid rgba(255, 255, 255, 0.4)'
                  }}
                >
                  <IconArrowUpRight size={20} stroke={2.5} />
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>

      <style>{`
        .division-image-card:hover .division-card-img {
          transform: scale(1.08);
        }
        .division-image-card:hover .division-card-arrow {
          background: #FFFFFF !important;
          color: #0F172A !important;
          transform: scale(1.1) rotate(45deg);
        }
      `}</style>
    </section>
  )
}

// ─── PATIENT TESTIMONIALS SECTION (EXACT REFERENCE DESIGN) ─────────────────
function PatientTestimonialsSection() {
  const testimonials = [
    {
      name: 'ঐশী খান',
      role: 'রোগী (ঢাকা)',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      comment: 'ঘরে বসেই মাত্র কয়েক ক্লিকে ধানমন্ডির সেরা শিশু বিশেষজ্ঞ ডাক্তারের অ্যাপয়েন্টমেন্ট বুক করতে পেরেছি! সময় বেঁচেছে অনেক এবং সিরিয়ালও সঠিক সময়ে পেয়েছি।'
    },
    {
      name: 'মনিরুল ইসলাম',
      role: 'রোগী (সিলেট)',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      comment: 'জরুরি প্রয়োজনে অভিজ্ঞ হৃদরোগ বিশেষজ্ঞ ডাক্তার খুঁজে পাওয়া ছিল কঠিন। কিন্তু এই প্ল্যাটফর্মের মাধ্যমে সরাসরি সিরিয়াল ও ডিজিটাল টিকিট পেয়ে খুব উপকার হয়েছে।'
    },
    {
      name: 'তানজিলা রহমান',
      role: 'রোগী (চট্টগ্রাম)',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      comment: 'হাসপাতালে ঘণ্টার পর ঘণ্টা সিরিয়ালের লাইনে দাঁড়িয়ে থাকার দিন শেষ! এখন স্মার্টফোন থেকেই সিরিয়াল দেওয়া যায় আর নোটিফিকেশনও পাওয়া যায়।'
    },
    {
      name: 'মোঃ আরিফ হোসেন',
      role: 'রোগী (রাজশাহী)',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      comment: 'যাচাইকৃত বিএমডিসি নিবন্ধিত বিশেষজ্ঞ ডাক্তারদের সরাসরি চেম্বার ঠিকানা ও সিরিয়াল নম্বর সহজে জানা যায়। প্ল্যাটফর্মটির সেবা সত্যি প্রশংসনীয়।'
    }
  ]

  return (
    <section style={{ background: '#FFFFFF', padding: '64px 0 60px', borderTop: '1px solid #E2E8F0' }}>
      <Container>
        {/* Section Title Header */}
        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 42px' }}>
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: 900,
            color: '#0F172A',
            marginBottom: 10,
            fontFamily: "'Hind Siliguri', 'Inter', sans-serif"
          }}>
            হাজারো রোগীর ভরসা ও সন্তুষ্টি
          </h2>
          <p style={{
            fontSize: 14.5,
            color: '#64748B',
            margin: 0,
            lineHeight: 1.6,
            fontWeight: 500,
            fontFamily: "'Hind Siliguri', sans-serif"
          }}>
            আমাদের সেবা ব্যবহার করে যারা তাদের পছন্দের বিশেষজ্ঞ ডাক্তার ও সঠিক চিকিৎসা সেবা নিশ্চিত করেছেন, তাদের কথা শুনুন।
          </p>
        </div>

        {/* Swiper Slider Wrapper */}
        <div className="testimonial-slider-wrapper">
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={24}
            slidesPerView={1}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            loop={true}
            pagination={{
              clickable: true,
              el: '.testimonial-custom-pagination',
            }}
            breakpoints={{
              768: { slidesPerView: 2 },
            }}
            className="testimonial-swiper"
          >
            {testimonials.map((item, index) => (
              <SwiperSlide key={index} style={{ height: 'auto' }}>
                <div style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 16,
                  padding: '28px 24px 24px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 4px 16px rgba(15,23,42,0.04)',
                  transition: 'all 0.3s ease'
                }}
                className="testimonial-card"
                >
                  {/* Top Header: Avatar, Name & Rating */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #F0FDFA'
                        }}
                      />
                      <div>
                        <h4 style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: '#0F172A',
                          margin: 0,
                          fontFamily: "'Hind Siliguri', sans-serif"
                        }}>
                          {item.name}
                        </h4>
                        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, fontFamily: "'Hind Siliguri', sans-serif" }}>
                          {item.role}
                        </span>
                      </div>
                    </div>

                    {/* 5 Gold Star Rating */}
                    <div style={{ display: 'flex', gap: 3, color: '#F59E0B' }}>
                      {[...Array(item.rating)].map((_, i) => (
                        <IconStar key={i} size={18} fill="#F59E0B" stroke={0} />
                      ))}
                    </div>
                  </div>

                  {/* Comment Text */}
                  <p style={{
                    fontSize: 14,
                    color: '#334155',
                    lineHeight: 1.65,
                    margin: 0,
                    fontWeight: 500,
                    fontFamily: "'Hind Siliguri', sans-serif",
                    flexGrow: 1
                  }}>
                    "{item.comment}"
                  </p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Bottom Moving Circle / Pill Pagination */}
          <div className="testimonial-custom-pagination"></div>
        </div>

        <style>{`
          .testimonial-slider-wrapper {
            position: relative;
          }

          .testimonial-swiper {
            padding-top: 4px !important;
            padding-bottom: 6px !important;
            padding-left: 2px !important;
            padding-right: 2px !important;
          }

          .testimonial-card:hover {
            border-color: #00B875 !important;
            box-shadow: 0 8px 24px rgba(0, 184, 117, 0.08) !important;
            transform: translateY(-3px);
          }

          .testimonial-custom-pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            margin-top: 14px;
            z-index: 10;
          }

          .testimonial-custom-pagination .swiper-pagination-bullet {
            width: 10px;
            height: 10px;
            background: #CBD5E1;
            opacity: 0.8;
            border-radius: 99px;
            margin: 0 !important;
            transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
          }

          .testimonial-custom-pagination .swiper-pagination-bullet:hover {
            background: #94A3B8;
            opacity: 1;
          }

          .testimonial-custom-pagination .swiper-pagination-bullet-active {
            width: 28px;
            height: 10px;
            background: #00B875;
            border-radius: 99px;
            opacity: 1;
            box-shadow: 0 2px 8px rgba(0, 184, 117, 0.4);
          }
        `}</style>
      </Container>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
function DarkRegistrationSection() {
  const navigate = useNavigate()

  const steps = [
    {
      stepNum: 'STEP 01',
      title: 'Doctor Registration',
      subTitle: 'ডাক্তার হিসেবে যুক্ত হোন',
      desc: 'আপনার প্র্যাকটিস পরিচালনা করুন এবং রোগীদের ডিজিটাল সেবা দিন।',
      link: '/register?role=doctor',
      icon: (
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#00B875" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="7" r="4" />
          <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2" />
          <path d="M16 11l2 2 4-4" stroke="#00B875" strokeWidth="1.5" />
          <path d="M12 11v4" stroke="#00B875" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      stepNum: 'STEP 02',
      title: 'Hospital Registration',
      subTitle: 'হাসপাতাল পার্টনার হোন',
      desc: 'আপনার হাসপাতালের তথ্য যুক্ত করুন এবং অ্যাপয়েন্টমেন্ট ম্যানেজ করুন।',
      link: '/register?role=hospital',
      icon: (
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#00B875" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M9 12h6M12 9v6" stroke="#00B875" strokeWidth="1.5" />
          <path d="M8 4v-1h8v1" />
        </svg>
      ),
    },
    {
      stepNum: 'STEP 03',
      title: 'Patient Registration',
      subTitle: 'পেশেন্ট হিসেবে যুক্ত হোন',
      desc: 'ডাক্তার খুঁজুন এবং সহজেই অনলাইনে অ্যাপয়েন্টমেন্ট বুক করুন।',
      link: '/register?role=patient',
      icon: (
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#00B875" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="7" r="3" />
          <path d="M3 21v-2a5 5 0 0 1 10 0v2" />
          <polyline points="16 11 18 13 22 9" stroke="#00B875" strokeWidth="1.5" />
        </svg>
      ),
    }
  ]

  return (
    <section className="registration-section" style={{ padding: '42px 0 32px', background: '#F8FAFC' }}>
      <Container>
        {/* Header Title & Subtitle */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{
            fontSize: 'clamp(26px, 3.8vw, 36px)',
            fontWeight: 900,
            color: '#0F172A',
            marginBottom: 8,
            fontFamily: "'Hind Siliguri', 'Inter', sans-serif"
          }}>
            সহজ ৩টি ধাপে নিবন্ধন করুন
          </h2>
          <p style={{
            fontSize: 15,
            color: '#64748B',
            fontWeight: 500,
            maxWidth: 580,
            margin: '0 auto',
            fontFamily: "'Hind Siliguri', sans-serif"
          }}>
            ডাক্তার, হাসপাতাল এবং রোগী — সবার জন্য ডিজিটাল স্বাস্থ্যসেবা
          </p>
        </div>

        {/* Dark Navy 3-Column Container */}
        <div style={{
          background: '#0B192C',
          borderRadius: 8,
          boxShadow: '0 20px 45px -10px rgba(11, 25, 44, 0.3)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div className="pic1-steps-grid">
            {steps.map((item, i) => (
              <div
                key={i}
                className="pic1-step-col"
                onClick={() => navigate(item.link)}
                style={{
                  cursor: 'pointer',
                  padding: '42px 32px 38px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                  transition: 'background 0.3s ease'
                }}
              >
                {/* Step Label */}
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#00B875',
                  letterSpacing: '2px',
                  marginBottom: 24,
                  textTransform: 'uppercase',
                  fontFamily: "'Inter', sans-serif"
                }}>
                  {item.stepNum}
                </span>

                {/* Icon */}
                <div style={{
                  marginBottom: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 56,
                  transition: 'transform 0.3s ease'
                }} className="pic1-icon-wrap">
                  {item.icon}
                </div>

                {/* English Title */}
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  marginBottom: 8,
                  fontFamily: "'Inter', sans-serif"
                }}>
                  {item.title}
                </h3>

                {/* Bangla Subtitle Pill */}
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  background: '#00B875',
                  padding: '4px 14px',
                  borderRadius: 4,
                  marginBottom: 14,
                  display: 'inline-block',
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}>
                  {item.subTitle}
                </span>

                {/* Description */}
                <p style={{
                  fontSize: 13,
                  color: '#94A3B8',
                  lineHeight: 1.6,
                  margin: 0,
                  fontWeight: 400,
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}>
                  {item.desc}
                </p>

                {/* Arrow connector between columns (desktop only) */}
                {i < steps.length - 1 && (
                  <div className="pic1-step-connector">
                    <IconChevronRight size={14} color="#00B875" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Green Action Button */}
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <button
            onClick={() => navigate('/register')}
            style={{
              background: '#00B875',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '14px 42px',
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 8px 24px rgba(0, 184, 117, 0.3)',
              transition: 'all 0.3s ease',
              fontFamily: "'Hind Siliguri', sans-serif"
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#009E64' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#00B875' }}
          >
            <span>এখনই নিবন্ধন শুরু করুন</span>
            <IconArrowRight size={18} stroke={2.5} />
          </button>
        </div>
      </Container>

      <style>{`
        .pic1-steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        }
        .pic1-step-col {
          border-right: 1px solid rgba(255, 255, 255, 0.08);
        }
        .pic1-step-col:last-child {
          border-right: none;
        }
        .pic1-step-col:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .pic1-step-col:hover .pic1-icon-wrap {
          transform: translateY(-4px) scale(1.08);
        }
        .pic1-step-connector {
          position: absolute;
          right: -14px;
          top: 50%;
          transform: translateY(-50%);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #0B192C;
          border: 1px solid rgba(245, 158, 11, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
        @media (max-width: 860px) {
          .pic1-steps-grid {
            grid-template-columns: 1fr;
          }
          .pic1-step-col {
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding: 32px 20px;
          }
          .pic1-step-col:last-child {
            border-bottom: none;
          }
          .pic1-step-connector {
            display: none;
          }
        }
      `}</style>
    </section>
  )
}

// ─── OUR HOSPITAL PARTNERS (CONTINUOUS MARQUEE SLOW SCROLLING) ───────────────
function HospitalPartnersSection({ hospitals = [] }) {
  // Static fallback partners with logos if backend photo is not set
  const DEFAULT_PARTNERS = [
    { name: 'Bangladesh Specialized Hospital', photo_url: '/images/hospital.png' },
    { name: 'Chevron Clinical Laboratory', photo_url: '/images/care.png' },
    { name: 'Popular Diagnostic Center', photo_url: '/images/doctor.png' },
    { name: 'Praava Health', photo_url: '/images/doctor-hero-centered.png' },
    { name: 'York Hospital', photo_url: '/images/doctor-premium.png' }
  ]

  const items = (hospitals && hospitals.length > 0) ? hospitals : DEFAULT_PARTNERS

  // Multiply array elements to guarantee seamless infinite loop animation
  const marqueeItems = [...items, ...items, ...items, ...items]

  return (
    <section style={{ padding: '36px 0 44px', background: '#FFFFFF', borderTop: '1px solid #E2E8F0', overflow: 'hidden' }}>
      <Container>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{
            fontSize: 'clamp(22px, 3.2vw, 34px)',
            fontWeight: 900,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            marginBottom: 6,
            fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif"
          }}>
            আমাদের সহযোগী হাসপাতালসমূহ
          </h2>
          <p style={{ fontSize: 13.5, color: '#64748B', fontWeight: 500, margin: 0, fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>
            দেশজুড়ে নির্ভরযোগ্য হাসপাতাল ও ক্লিনিক্যাল সেন্টারসমূহ
          </p>
        </div>
      </Container>

      {/* Infinite Continuous Slow Marquee Slider */}
      <div className="partner-marquee-container" style={{ position: 'relative', width: '100%', overflow: 'hidden', padding: '10px 0' }}>
        {/* Left & Right subtle gradient fade overlays */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 90, background: 'linear-gradient(to right, #FFFFFF 20%, transparent 100%)', zIndex: 3, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 90, background: 'linear-gradient(to left, #FFFFFF 20%, transparent 100%)', zIndex: 3, pointerEvents: 'none' }} />

        <div className="partner-marquee-track">
          {marqueeItems.map((hosp, idx) => {
            const imgSrc = hosp.logo_url || hosp.logo || hosp.photo_url || hosp.photo || hosp.image
            const finalImg = imgSrc ? getMediaUrl(imgSrc) : '/favicon.png'

            return (
              <div key={idx} className="partner-marquee-item">
                <div className="partner-logo-card">
                  <img
                    src={finalImg}
                    alt={hosp.name || 'Hospital Logo'}
                    style={{
                      width: '80px',
                      height: '50px',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = '/favicon.png'
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        .partner-marquee-track {
          display: flex;
          align-items: center;
          gap: 24px;
          width: max-content;
          animation: partnerMarquee 40s linear infinite;
        }

        .partner-marquee-container:hover .partner-marquee-track {
          animation-play-state: paused;
        }

        .partner-marquee-item {
          flex-shrink: 0;
        }

        .partner-logo-card {
          width: 140px;
          height: 76px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .partner-logo-card:hover {
          border-color: #00A88C;
          box-shadow: 0 12px 28px rgba(0, 168, 140, 0.16);
          transform: translateY(-4px);
        }

        @keyframes partnerMarquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  )
}

// ─── DOCTOR BOOKING PROMO BANNER (FULL WIDTH BLURRED DESIGN) ────────────
function DoctorBookingPromoBanner() {
  const navigate = useNavigate()
  return (
    <section style={{
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      padding: '70px 20px',
      margin: '24px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
    }}>
      {/* Background Image Container (Crystal Clear & Sharp) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&auto=format&fit=crop&q=85')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'none',
        transform: 'none',
        zIndex: 1
      }} />

      {/* Subtle Transparent Green Overlay to Keep Image Clear */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, rgba(11, 25, 44, 0.58) 0%, rgba(0, 110, 75, 0.45) 50%, rgba(0, 140, 95, 0.52) 100%)',
        zIndex: 2
      }} />

      {/* Foreground Content */}
      <div style={{
        position: 'relative',
        zIndex: 3,
        textAlign: 'center',
        maxWidth: 900,
        margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 40px)',
          fontWeight: 900,
          color: '#FFFFFF',
          lineHeight: 1.4,
          marginBottom: 24,
          textShadow: '0 2px 12px rgba(0, 0, 0, 0.4)',
          fontFamily: "'Hind Siliguri', sans-serif"
        }}>
          আপনার পছন্দের ডাক্তারের অ্যাপয়েন্টমেন্ট <br />
          বুক করুন
        </h2>

        <button
          onClick={() => navigate('/doctors')}
          style={{
            background: '#00B875',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 99,
            padding: '14px 44px',
            fontSize: 17,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(0, 184, 117, 0.4)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontFamily: "'Hind Siliguri', sans-serif"
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)'; e.currentTarget.style.background = '#009E64'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 184, 117, 0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#00B875'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 184, 117, 0.4)'; }}
        >
          অ্যাপয়েন্টমেন্ট নিন
        </button>
      </div>
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
        <ImageBannerSlider />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600}>
        <DoctorBookingPromoBanner />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600}>
        <MostViewedDoctors doctors={data?.top_doctors} loading={isLoading} />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600}>
        <BrowseByLocationSection />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600}>
        <TopSpecialtiesSlider specialties={data?.specialties} loading={isLoading} />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600}>
        <TopHospitals hospitals={data?.top_hospitals} loading={isLoading} />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600}>
        <DarkRegistrationSection />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600}>
        <DigitalDashboardBanner />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600}>
        <PatientTestimonialsSection />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600}>
        <HospitalPartnersSection hospitals={data?.top_hospitals} />
      </ScrollReveal>





      <style>{`
        @media (max-width: 768px) {
          section { padding: 16px 0 !important; }
          .registration-section { padding: 24px 0 40px !important; }
          .dash-banner-btns-row {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            width: 100% !important;
            padding: 0 8px !important;
          }
          .dash-banner-btns-row button {
            width: 100% !important;
            padding: 11px 4px !important;
            font-size: 12px !important;
            justify-content: center !important;
            white-space: nowrap !important;
            gap: 4px !important;
          }
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
            
          /* 📱 Global Homepage Mobile View Fine-Tuning */
          @media (max-width: 767px) {
            .appointment-cta-container {
              border-radius: 24px !important;
              padding: 28px 16px !important;
              min-height: auto !important;
            }
            .doc-promo-banner {
              border-radius: 16px !important;
              padding: 24px 16px !important;
              text-align: center !important;
            }
            .doc-promo-banner button {
              width: 100% !important;
              max-width: 260px !important;
              margin: 0 auto !important;
            }
            .hero-search-form {
              margin-bottom: 24px !important;
            }
          }
        }
      `}</style>
    </div>
  )
}

export default HomePage

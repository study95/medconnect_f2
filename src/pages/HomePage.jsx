import { useNavigate, Link } from 'react-router-dom'
import { Container, Row, Col, Modal, InputGroup, Form } from 'react-bootstrap'
import HeroSection from '../components/home/HeroSection'
import ImageBannerSlider from '../components/home/ImageBannerSlider'
import MostViewedDoctors from '../components/home/MostViewedDoctors'
import TodayDoctorsSection from '../components/home/TodayDoctorsSection'
import TopSpecialtiesSlider from '../components/home/TopSpecialtiesSlider'
import TopHospitals from '../components/home/TopHospitals'
import DoctorCard from '../components/common/DoctorCard'
import HospitalCard from '../components/common/HospitalCard'
import OptimizedImage from '../components/common/OptimizedImage'
import ScrollReveal from '../components/common/ScrollReveal'
import SeoHead from '../components/common/SeoHead'

import {
  IconArrowRight, IconCalendar, IconShieldCheck, IconClock, IconStar, IconHeadset,
  IconChevronLeft, IconChevronRight, IconChevronDown, IconStethoscope, IconHeart, IconDental, IconUsers, IconEye, IconScissors,
  IconLock, IconDeviceMobile, IconBuildingHospital, IconInfoCircle, IconShare,
  IconFileText, IconBell, IconChartBar, IconMapPin, IconArrowUpRight, IconPlus, IconMinus,
  IconSearch, IconX
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

// ─── EXPLORE DIVISIONS / CITIES SECTION (REFERENCE IMAGE 2 DESIGN) ───────────
function BrowseByLocationSection({ popularDivisions = [], popularDistricts = [], popularUpazilas = [], stats = {} }) {
  const navigate = useNavigate()
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [modalTab, setModalTab] = useState('divisions') // 'divisions' | 'districts'
  const [locationSearch, setLocationSearch] = useState('')

  const toBnNum = (n) => {
    if (n === null || n === undefined) return ''
    const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯', '+': '+', ',': ',' }
    return String(n).replace(/[0-9]/g, d => enToBn[d] || d)
  }

  // Preset divisions with curated Bangladesh landmark photos & sub-districts
  const mainDivisions = [
    {
      id: 1,
      bnName: 'ঢাকা বিভাগ',
      enName: 'Dhaka Division',
      count: '৮৫০+ হাসপাতাল',
      searchKey: 'dhaka',
      img: '/images/dhaka_division_parliament.jpg',
      districts: [
        { name: 'গাজীপুর', slug: 'gazipur' },
        { name: 'নারায়ণগঞ্জ', slug: 'narayanganj' },
        { name: 'মুন্সীগঞ্জ', slug: 'munshiganj' },
        { name: '+ ১৫ জেলা', isMore: true }
      ]
    },
    {
      id: 2,
      bnName: 'সিলেট বিভাগ',
      enName: 'Sylhet Division',
      count: '১৮০+ হাসপাতাল',
      searchKey: 'sylhet',
      img: '/images/sylhet_division_teagarden.jpg',
      districts: [
        { name: 'সিলেট', slug: 'sylhet' },
        { name: 'হবিগঞ্জ', slug: 'habiganj' },
        { name: 'মৌলভীবাজার', slug: 'moulvibazar' },
        { name: '+ ৪ জেলা', isMore: true }
      ]
    },
    {
      id: 3,
      bnName: 'চট্টগ্রাম বিভাগ',
      enName: 'Chattogram Division',
      count: '২৫০+ হাসপাতাল',
      searchKey: 'chattogram',
      img: '/images/chattogram_division_sunset.jpg',
      districts: [
        { name: 'চট্টগ্রাম', slug: 'chittagong' },
        { name: 'কক্সবাজার', slug: 'coxsbazar' },
        { name: 'রাঙ্গামাটি', slug: 'rangamati' },
        { name: '+ ৭ জেলা', isMore: true }
      ]
    }
  ]

  // Curated district thumbnail images matching Reference Image 2
  const DISTRICT_THUMBNAILS = {
    'sylhet': '/images/sylhet_division_teagarden.jpg',
    'সিলেট': '/images/sylhet_division_teagarden.jpg',
    'habiganj': 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&auto=format&fit=crop&q=70',
    'হবিগঞ্জ': 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&auto=format&fit=crop&q=70',
    'gazipur': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=100&auto=format&fit=crop&q=70',
    'গাজীপুর': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=100&auto=format&fit=crop&q=70',
    'chittagong': '/images/chattogram_division_sunset.jpg',
    'চট্টগ্রাম': '/images/chattogram_division_sunset.jpg',
    'narayanganj': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=100&auto=format&fit=crop&q=70',
    'নারায়ণগঞ্জ': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=100&auto=format&fit=crop&q=70',
    'mymensingh': 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=100&auto=format&fit=crop&q=70',
    'ময়মনসিংহ': 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=100&auto=format&fit=crop&q=70',
    'rajshahi': 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=100&auto=format&fit=crop&q=70',
    'রাজশাহী': 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=100&auto=format&fit=crop&q=70',
    'dhaka': '/images/dhaka_division_parliament.jpg',
    'ঢাকা': '/images/dhaka_division_parliament.jpg',
  }

  // Fallback preset popular districts
  const defaultDistricts = [
    { id: 'd1', bangla_name: 'সিলেট', slug: 'sylhet', doctors_count: 56, img: DISTRICT_THUMBNAILS['সিলেট'] },
    { id: 'd2', bangla_name: 'হবিগঞ্জ', slug: 'habiganj', doctors_count: 22, img: DISTRICT_THUMBNAILS['হবিগঞ্জ'] },
    { id: 'd3', bangla_name: 'গাজীপুর', slug: 'gazipur', doctors_count: 43, img: DISTRICT_THUMBNAILS['গাজীপুর'] },
    { id: 'd4', bangla_name: 'চট্টগ্রাম', slug: 'chittagong', doctors_count: 32, img: DISTRICT_THUMBNAILS['চট্টগ্রাম'] },
    { id: 'd5', bangla_name: 'নারায়ণগঞ্জ', slug: 'narayanganj', doctors_count: 27, img: DISTRICT_THUMBNAILS['নারায়ণগঞ্জ'] },
    { id: 'd6', bangla_name: 'ময়মনসিংহ', slug: 'mymensingh', doctors_count: 19, img: DISTRICT_THUMBNAILS['ময়মনসিংহ'] },
    { id: 'd7', bangla_name: 'রাজশাহী', slug: 'rajshahi', doctors_count: 25, img: DISTRICT_THUMBNAILS['রাজশাহী'] },
  ]

  // Fallback preset popular upazilas/areas
  const defaultUpazilas = [
    { id: 'u1', bangla_name: 'ধানমন্ডি', slug: 'dhanmondi', district_slug: 'dhaka', doctors_count: 120, img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=100&auto=format&fit=crop&q=70' },
    { id: 'u2', bangla_name: 'উত্তরা', slug: 'uttara', district_slug: 'dhaka', doctors_count: 98, img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=100&auto=format&fit=crop&q=70' },
    { id: 'u3', bangla_name: 'চট্টগ্রাম সদর', slug: 'chattogram-sadar', district_slug: 'chittagong', doctors_count: 85, img: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=100&auto=format&fit=crop&q=70' },
    { id: 'u4', bangla_name: 'শাহজালাল উপশহর', slug: 'shahjalal-uposhahar', district_slug: 'sylhet', doctors_count: 72, img: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=100&auto=format&fit=crop&q=70' },
    { id: 'u5', bangla_name: 'জিন্দাবাজার', slug: 'zindabazar', district_slug: 'sylhet', doctors_count: 65, img: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&auto=format&fit=crop&q=70' },
    { id: 'u6', bangla_name: 'আগানগর', slug: 'aganagar', district_slug: 'dhaka', doctors_count: 56, img: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=100&auto=format&fit=crop&q=70' },
    { id: 'u7', bangla_name: 'কুমিল্লা সদর', slug: 'cumilla-sadar', district_slug: 'cumilla', doctors_count: 51, img: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=100&auto=format&fit=crop&q=70' },
  ]

  const activeDistricts = popularDistricts && popularDistricts.length > 0 ? popularDistricts : defaultDistricts
  const activeUpazilas = popularUpazilas && popularUpazilas.length > 0 ? popularUpazilas : defaultUpazilas

  const getDistrictImg = (dist) => {
    const slugKey = (dist.slug || '').toLowerCase()
    const nameKey = (dist.bangla_name || dist.name || '').toLowerCase()
    return DISTRICT_THUMBNAILS[slugKey] || DISTRICT_THUMBNAILS[nameKey] || dist.img || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=100&auto=format&fit=crop&q=70'
  }

  // All 8 divisions of Bangladesh with rich metadata
  const allEightDivisions = [
    {
      id: 1,
      name: 'ঢাকা বিভাগ',
      enName: 'Dhaka Division',
      slug: 'dhaka',
      hospitals: '৮৫০+ হাসপাতাল',
      doctors: '৫,২০০+ ডাক্তার',
      districtsCount: '১৩টি জেলা',
      img: '/images/dhaka_division_parliament.jpg'
    },
    {
      id: 2,
      name: 'চট্টগ্রাম বিভাগ',
      enName: 'Chattogram Division',
      slug: 'chattogram',
      hospitals: '২৫০+ হাসপাতাল',
      doctors: '২,৪০০+ ডাক্তার',
      districtsCount: '১১টি জেলা',
      img: '/images/chattogram_division_sunset.jpg'
    },
    {
      id: 3,
      name: 'সিলেট বিভাগ',
      enName: 'Sylhet Division',
      slug: 'sylhet',
      hospitals: '১৮০+ হাসপাতাল',
      doctors: '১,৮০০+ ডাক্তার',
      districtsCount: '৪টি জেলা',
      img: '/images/sylhet_division_teagarden.jpg'
    },
    {
      id: 4,
      name: 'রাজশাহী বিভাগ',
      enName: 'Rajshahi Division',
      slug: 'rajshahi',
      hospitals: '১৬০+ হাসপাতাল',
      doctors: '১,৫০০+ ডাক্তার',
      districtsCount: '৮টি জেলা',
      img: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=100&auto=format&fit=crop&q=70'
    },
    {
      id: 5,
      name: 'খুলনা বিভাগ',
      enName: 'Khulna Division',
      slug: 'khulna',
      hospitals: '১৪০+ হাসপাতাল',
      doctors: '১,২০০+ ডাক্তার',
      districtsCount: '১০টি জেলা',
      img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=100&auto=format&fit=crop&q=70'
    },
    {
      id: 6,
      name: 'বরিশাল বিভাগ',
      enName: 'Barishal Division',
      slug: 'barishal',
      hospitals: '১১০+ হাসপাতাল',
      doctors: '৯৫০+ ডাক্তার',
      districtsCount: '৬টি জেলা',
      img: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&auto=format&fit=crop&q=70'
    },
    {
      id: 7,
      name: 'রংপুর বিভাগ',
      enName: 'Rangpur Division',
      slug: 'rangpur',
      hospitals: '১৩০+ হাসপাতাল',
      doctors: '১,১০০+ ডাক্তার',
      districtsCount: '৮টি জেলা',
      img: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=100&auto=format&fit=crop&q=70'
    },
    {
      id: 8,
      name: 'ময়মনসিংহ বিভাগ',
      enName: 'Mymensingh Division',
      slug: 'mymensingh',
      hospitals: '১২০+ হাসপাতাল',
      doctors: '৮৫০+ ডাক্তার',
      districtsCount: '৪টি জেলা',
      img: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=100&auto=format&fit=crop&q=70'
    },
  ]

  // All 64 Districts of Bangladesh
  const all64Districts = [
    // ঢাকা বিভাগ
    { name: 'ঢাকা', enName: 'Dhaka', slug: 'dhaka', division: 'ঢাকা বিভাগ', count: '৫,২০০+ ডাক্তার' },
    { name: 'গাজীপুর', enName: 'Gazipur', slug: 'gazipur', division: 'ঢাকা বিভাগ', count: '৩৫০+ ডাক্তার' },
    { name: 'নারায়ণগঞ্জ', enName: 'Narayanganj', slug: 'narayanganj', division: 'ঢাকা বিভাগ', count: '২৮০+ ডাক্তার' },
    { name: 'মুন্সীগঞ্জ', enName: 'Munshiganj', slug: 'munshiganj', division: 'ঢাকা বিভাগ', count: '১১০+ ডাক্তার' },
    { name: 'নরসিংদী', enName: 'Narsingdi', slug: 'narsingdi', division: 'ঢাকা বিভাগ', count: '১২০+ ডাক্তার' },
    { name: 'টাঙ্গাইল', enName: 'Tangail', slug: 'tangail', division: 'ঢাকা বিভাগ', count: '১৮০+ ডাক্তার' },
    { name: 'মানিকগঞ্জ', enName: 'Manikganj', slug: 'manikganj', division: 'ঢাকা বিভাগ', count: '৮৫+ ডাক্তার' },
    { name: 'ফরিদপুর', enName: 'Faridpur', slug: 'faridpur', division: 'ঢাকা বিভাগ', count: '১৪০+ ডাক্তার' },
    { name: 'মাদারীপুর', enName: 'Madaripur', slug: 'madaripur', division: 'ঢাকা বিভাগ', count: '৭৫+ ডাক্তার' },
    { name: 'গোপালগঞ্জ', enName: 'Gopalganj', slug: 'gopalganj', division: 'ঢাকা বিভাগ', count: '৯০+ ডাক্তার' },
    { name: 'রাজবাড়ী', enName: 'Rajbari', slug: 'rajbari', division: 'ঢাকা বিভাগ', count: '৬৫+ ডাক্তার' },
    { name: 'শরীয়তপুর', enName: 'Shariatpur', slug: 'shariatpur', division: 'ঢাকা বিভাগ', count: '৬০+ ডাক্তার' },
    { name: 'কিশোরগঞ্জ', enName: 'Kishoreganj', slug: 'kishoreganj', division: 'ঢাকা বিভাগ', count: '১৩০+ ডাক্তার' },

    // চট্টগ্রাম বিভাগ
    { name: 'চট্টগ্রাম', enName: 'Chattogram', slug: 'chittagong', division: 'চট্টগ্রাম বিভাগ', count: '২,৪০০+ ডাক্তার' },
    { name: 'কক্সবাজার', enName: 'Cox\'s Bazar', slug: 'coxsbazar', division: 'চট্টগ্রাম বিভাগ', count: '১৯০+ ডাক্তার' },
    { name: 'কুমিল্লা', enName: 'Cumilla', slug: 'cumilla', division: 'চট্টগ্রাম বিভাগ', count: '৩৮০+ ডাক্তার' },
    { name: 'নোয়াখালী', enName: 'Noakhali', slug: 'noakhali', division: 'চট্টগ্রাম বিভাগ', count: '২২০+ ডাক্তার' },
    { name: 'ফেনী', enName: 'Feni', slug: 'feni', division: 'চট্টগ্রাম বিভাগ', count: '১৪০+ ডাক্তার' },
    { name: 'ব্রাহ্মণবাড়িয়া', enName: 'Brahmanbaria', slug: 'brahmanbaria', division: 'চট্টগ্রাম বিভাগ', count: '১৩০+ ডাক্তার' },
    { name: 'চাঁদপুর', enName: 'Chandpur', slug: 'chandpur', division: 'চট্টগ্রাম বিভাগ', count: '১২৫+ ডাক্তার' },
    { name: 'লক্ষ্মীপুর', enName: 'Lakshmipur', slug: 'lakshmipur', division: 'চট্টগ্রাম বিভাগ', count: '৮৫+ ডাক্তার' },
    { name: 'রাঙ্গামাটি', enName: 'Rangamati', slug: 'rangamati', division: 'চট্টগ্রাম বিভাগ', count: '৪৫+ ডাক্তার' },
    { name: 'খাগড়াছড়ি', enName: 'Khagrachhari', slug: 'khagrachhari', division: 'চট্টগ্রাম বিভাগ', count: '৪০+ ডাক্তার' },
    { name: 'বান্দরবান', enName: 'Bandarban', slug: 'bandarban', division: 'চট্টগ্রাম বিভাগ', count: '৩৫+ ডাক্তার' },

    // সিলেট বিভাগ
    { name: 'সিলেট', enName: 'Sylhet', slug: 'sylhet', division: 'সিলেট বিভাগ', count: '১,৮০০+ ডাক্তার' },
    { name: 'মৌলভীবাজার', enName: 'Moulvibazar', slug: 'moulvibazar', division: 'সিলেট বিভাগ', count: '১৪০+ ডাক্তার' },
    { name: 'হবিগঞ্জ', enName: 'Habiganj', slug: 'habiganj', division: 'সিলেট বিভাগ', count: '১১০+ ডাক্তার' },
    { name: 'সুনামগঞ্জ', enName: 'Sunamganj', slug: 'sunamganj', division: 'সিলেট বিভাগ', count: '৮০+ ডাক্তার' },

    // রাজশাহী বিভাগ
    { name: 'রাজশাহী', enName: 'Rajshahi', slug: 'rajshahi', division: 'রাজশাহী বিভাগ', count: '১,৫০০+ ডাক্তার' },
    { name: 'বগুড়া', enName: 'Bogura', slug: 'bogura', division: 'রাজশাহী বিভাগ', count: '৩২০+ ডাক্তার' },
    { name: 'পাবনা', enName: 'Pabna', slug: 'pabna', division: 'রাজশাহী বিভাগ', count: '১৭০+ ডাক্তার' },
    { name: 'সিরাজগঞ্জ', enName: 'Sirajganj', slug: 'sirajganj', division: 'রাজশাহী বিভাগ', count: '১৪৫+ ডাক্তার' },
    { name: 'নওগাঁ', enName: 'Naogaon', slug: 'naogaon', division: 'রাজশাহী বিভাগ', count: '১১০+ ডাক্তার' },
    { name: 'নাটোর', enName: 'Natore', slug: 'natore', division: 'রাজশাহী বিভাগ', count: '৯৫+ ডাক্তার' },
    { name: 'চাঁপাইনবাবগঞ্জ', enName: 'Chapainawabganj', slug: 'chapainawabganj', division: 'রাজশাহী বিভাগ', count: '৮০+ ডাক্তার' },
    { name: 'জয়পুরহাট', enName: 'Joypurhat', slug: 'joypurhat', division: 'রাজশাহী বিভাগ', count: '৬৫+ ডাক্তার' },

    // খুলনা বিভাগ
    { name: 'খুলনা', enName: 'Khulna', slug: 'khulna', division: 'খুলনা বিভাগ', count: '১,২০০+ ডাক্তার' },
    { name: 'যশোর', enName: 'Jashore', slug: 'jashore', division: 'খুলনা বিভাগ', count: '২৫০+ ডাক্তার' },
    { name: 'কুষ্টিয়া', enName: 'Kushtia', slug: 'kushtia', division: 'খুলনা বিভাগ', count: '১৯০+ ডাক্তার' },
    { name: 'ঝিনাইদহ', enName: 'Jhenaidah', slug: 'jhenaidah', division: 'খুলনা বিভাগ', count: '১০০+ ডাক্তার' },
    { name: 'সাতক্ষীরা', enName: 'Satkhira', slug: 'satkhira', division: 'খুলনা বিভাগ', count: '৯৫+ ডাক্তার' },
    { name: 'বাগেরহাট', enName: 'Bagerhat', slug: 'bagerhat', division: 'খুলনা বিভাগ', count: '৮৫+ ডাক্তার' },
    { name: 'চুয়াডাঙ্গা', enName: 'Chuadanga', slug: 'chuadanga', division: 'খুলনা বিভাগ', count: '৭৫+ ডাক্তার' },
    { name: 'মেহেরপুর', enName: 'Meherpur', slug: 'meherpur', division: 'খুলনা বিভাগ', count: '৫০+ ডাক্তার' },
    { name: 'নড়াইল', enName: 'Narail', slug: 'narail', division: 'খুলনা বিভাগ', count: '৫৫+ ডাক্তার' },
    { name: 'মাগুরা', enName: 'Magura', slug: 'magura', division: 'খুলনা বিভাগ', count: '৬০+ ডাক্তার' },

    // বরিশাল বিভাগ
    { name: 'বরিশাল', enName: 'Barishal', slug: 'barishal', division: 'বরিশাল বিভাগ', count: '৯৫০+ ডাক্তার' },
    { name: 'পটুয়াখালী', enName: 'Patuakhali', slug: 'patuakhali', division: 'বরিশাল বিভাগ', count: '১১০+ ডাক্তার' },
    { name: 'ভোলা', enName: 'Bhola', slug: 'bhola', division: 'বরিশাল বিভাগ', count: '৯০+ ডাক্তার' },
    { name: 'পিরোজপুর', enName: 'Pirojpur', slug: 'pirojpur', division: 'বরিশাল বিভাগ', count: '৭৫+ ডাক্তার' },
    { name: 'বরগুনা', enName: 'Barguna', slug: 'barguna', division: 'বরিশাল বিভাগ', count: '৫৫+ ডাক্তার' },
    { name: 'ঝালকাঠি', enName: 'Jhalokati', slug: 'jhalokati', division: 'বরিশাল বিভাগ', count: '৫০+ ডাক্তার' },

    // রংপুর বিভাগ
    { name: 'রংপুর', enName: 'Rangpur', slug: 'rangpur', division: 'রংপুর বিভাগ', count: '১,১০০+ ডাক্তার' },
    { name: 'দিনাজপুর', enName: 'Dinajpur', slug: 'dinajpur', division: 'রংপুর বিভাগ', count: '২১০+ ডাক্তার' },
    { name: 'কুড়িগ্রাম', enName: 'Kurigram', slug: 'kurigram', division: 'রংপুর বিভাগ', count: '৯০+ ডাক্তার' },
    { name: 'গাইবান্ধা', enName: 'Gaibandha', slug: 'gaibandha', division: 'রংপুর বিভাগ', count: '৮৫+ ডাক্তার' },
    { name: 'নীলফামারী', enName: 'Nilphamari', slug: 'nilphamari', division: 'রংপুর বিভাগ', count: '৮০+ ডাক্তার' },
    { name: 'লালমনিরহাট', enName: 'Lalmonirhat', slug: 'lalmonirhat', division: 'রংপুর বিভাগ', count: '৬০+ ডাক্তার' },
    { name: 'ঠাকুরগাঁও', enName: 'Thakurgaon', slug: 'thakurgaon', division: 'রংপুর বিভাগ', count: '৭০+ ডাক্তার' },
    { name: 'পঞ্চগড়', enName: 'Panchagarh', slug: 'panchagarh', division: 'রংপুর বিভাগ', count: '৫৫+ ডাক্তার' },

    // ময়মনসিংহ বিভাগ
    { name: 'ময়মনসিংহ', enName: 'Mymensingh', slug: 'mymensingh', division: 'ময়মনসিংহ বিভাগ', count: '৮৫০+ ডাক্তার' },
    { name: 'জামালপুর', enName: 'Jamalpur', slug: 'jamalpur', division: 'ময়মনসিংহ বিভাগ', count: '১৩০+ ডাক্তার' },
    { name: 'নেত্রকোণা', enName: 'Netrokona', slug: 'netrokona', division: 'ময়মনসিংহ বিভাগ', count: '৮৫+ ডাক্তার' },
    { name: 'শেরপুর', enName: 'Sherpur', slug: 'sherpur', division: 'ময়মনসিংহ বিভাগ', count: '৬৫+ ডাক্তার' },
  ]

  const filteredDivisions = allEightDivisions.filter(d => {
    const q = locationSearch.trim().toLowerCase()
    if (!q) return true
    return (
      d.name.toLowerCase().includes(q) ||
      d.enName.toLowerCase().includes(q) ||
      d.slug.toLowerCase().includes(q)
    )
  })

  const filteredDistricts = all64Districts.filter(d => {
    const q = locationSearch.trim().toLowerCase()
    if (!q) return true
    return (
      d.name.toLowerCase().includes(q) ||
      d.enName.toLowerCase().includes(q) ||
      d.slug.toLowerCase().includes(q) ||
      d.division.toLowerCase().includes(q)
    )
  })

  return (
    <section style={{ background: '#FAFBFD', padding: '56px 0 52px', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
      <Container>
        {/* ── Title Header ── */}
        <div className="mb-4">
          <h2 style={{
            fontSize: 'clamp(20px, 3.2vw, 30px)',
            fontWeight: 900,
            color: '#0F172A',
            margin: 0,
            fontFamily: "'Hind Siliguri', 'Inter', sans-serif",
            lineHeight: 1.3
          }}>
            আপনার এলাকায় <span style={{ color: '#059669' }}>ডাক্তার খুঁজুন</span>
          </h2>
          <p style={{ fontSize: 'clamp(13px, 1.6vw, 14.5px)', color: '#64748B', margin: '4px 0 0 0', fontWeight: 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
            বিভাগ বা জেলা নির্বাচন করে সহজেই সেবা নিন
          </p>
        </div>

        {/* ── 4 Cards Grid: 3 Landmark Cards + 1 Green Feature Card ── */}
        <Row className="g-3">
          {mainDivisions.map((div) => (
            <Col key={div.id} xs={12} sm={6} lg={3}>
              <div
                onClick={() => navigate(`/doctors/${div.searchKey}`)}
                className="bbl-division-card"
              >
                {/* Background Image */}
                <img
                  src={div.img}
                  alt={div.enName}
                  className="bbl-card-img"
                />

                {/* Floating Top Badge */}
                <div className="bbl-card-top-badge">
                  <IconBuildingHospital size={16} color="#0284C7" stroke={2} />
                  <span>{div.count}</span>
                </div>

                {/* Dark Gradient Overlay */}
                <div className="bbl-card-overlay" />

                {/* Bottom Content Container */}
                <div className="bbl-card-bottom">
                  {/* Title & Arrow Row */}
                  <div className="bbl-card-title-row">
                    <h4 className="bbl-card-title">
                      {div.bnName} 📍
                    </h4>
                    <div className="bbl-card-arrow-btn">
                      <IconArrowRight size={18} stroke={2.5} />
                    </div>
                  </div>

                  {/* District Sub-tags */}
                  <div className="bbl-tag-list">
                    {div.districts.map((tag, idx) => (
                      <span
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (tag.isMore) {
                            setModalTab('districts')
                            setLocationSearch('')
                            setShowLocationModal(true)
                          } else {
                            navigate(`/doctors/${tag.slug}`)
                          }
                        }}
                        className="bbl-mini-tag"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Col>
          ))}

          {/* 4th Card: Special Card ("সব বিভাগ দেখুন") with User Uploaded Map Graphic */}
          <Col xs={12} sm={6} lg={3}>
            <div
              onClick={() => {
                setModalTab('divisions')
                setLocationSearch('')
                setShowLocationModal(true)
              }}
              className="bbl-division-card bbl-more-card"
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              {/* Background Image: User Uploaded Bangladesh Map Graphic */}
              <img
                src="/images/bangladesh_map_all_divisions.png"
                alt="সব বিভাগ দেখুন"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.6s ease'
                }}
                className="bbl-card-img"
              />

              {/* Gentle Overlay for contrast */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.52) 0%, rgba(2, 44, 34, 0.68) 100%)',
                zIndex: 1
              }} />

              {/* Card Content */}
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                {/* Big White Circular "+" Button */}
                <div className="bbl-more-plus-btn">
                  <IconPlus size={28} stroke={3} />
                </div>

                {/* Title & Subtitles */}
                <h4 style={{
                  fontSize: 21,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  margin: '0 0 6px 0',
                  fontFamily: "'Hind Siliguri', 'Inter', sans-serif",
                  lineHeight: 1.2
                }}>
                  সব বিভাগ দেখুন
                </h4>

                <span style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontFamily: "'Hind Siliguri', sans-serif",
                  marginBottom: 2
                }}>
                  ৮ বিভাগ • ৬৪ জেলা
                </span>

                <span style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}>
                  ৪৯৫ উপজেলা
                </span>
              </div>

              {/* Bottom Right White Arrow Button */}
              <div style={{ position: 'absolute', bottom: 14, right: 14, zIndex: 2 }}>
                <div className="bbl-card-arrow-btn">
                  <IconArrowRight size={18} stroke={2.5} />
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* ── Popular Districts Row with Round Photos (Image 2 Design) ── */}
        <div className="mt-4 pt-1">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center gap-2">
              <IconMapPin size={19} stroke={2.5} color="#059669" />
              <h5 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0, fontFamily: "'Hind Siliguri', sans-serif" }}>
                জনপ্রিয় জেলা
              </h5>
            </div>
            <button
              onClick={() => {
                setModalTab('districts')
                setLocationSearch('')
                setShowLocationModal(true)
              }}
              className="bbl-link-btn"
            >
              <span>সব দেখুন</span>
              <IconChevronRight size={14} stroke={2.5} />
            </button>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2 bbl-pills-scroll">
            {activeDistricts.slice(0, 8).map((dist, idx) => (
              <div
                key={dist.id || idx}
                onClick={() => navigate(`/doctors/${dist.slug}`)}
                className="bbl-pill-btn"
              >
                <img
                  src={getDistrictImg(dist)}
                  alt={dist.bangla_name || dist.name}
                  className="bbl-pill-thumb"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
                <span className="bbl-pill-text">
                  {dist.bangla_name || dist.name}
                  {dist.doctors_count > 0 && (
                    <span className="bbl-pill-count">({toBnNum(dist.doctors_count)})</span>
                  )}
                </span>
              </div>
            ))}

            <div
              onClick={() => {
                setModalTab('districts')
                setLocationSearch('')
                setShowLocationModal(true)
              }}
              className="bbl-pill-btn bbl-pill-more"
            >
              <IconPlus size={14} stroke={3} />
              <span>আরও জেলা</span>
            </div>
          </div>
        </div>

        {/* ── Popular Thanas / Areas Row (Image 2 Design) ── */}
        <div className="mt-3 pt-1">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center gap-2">
              <IconBuildingHospital size={19} stroke={2.5} color="#059669" />
              <h5 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0, fontFamily: "'Hind Siliguri', sans-serif" }}>
                জনপ্রিয় এলাকা ও থানা
              </h5>
            </div>
            <button onClick={() => navigate('/doctors')} className="bbl-link-btn">
              <span>সব দেখুন</span>
              <IconChevronRight size={14} stroke={2.5} />
            </button>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2 bbl-pills-scroll">
            {activeUpazilas.slice(0, 8).map((upz, idx) => (
              <div
                key={upz.id || idx}
                onClick={() => navigate(`/doctors/${upz.district?.slug || upz.district_slug || 'dhaka'}/${upz.slug}`)}
                className="bbl-pill-btn"
              >
                <img
                  src={upz.img || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=100&auto=format&fit=crop&q=70'}
                  alt={upz.bangla_name || upz.name}
                  className="bbl-pill-thumb"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
                <span className="bbl-pill-text">
                  {upz.bangla_name || upz.name}
                  {upz.doctors_count > 0 && (
                    <span className="bbl-pill-count">({toBnNum(upz.doctors_count)})</span>
                  )}
                </span>
              </div>
            ))}

            <div
              onClick={() => navigate('/doctors')}
              className="bbl-pill-btn bbl-pill-more"
            >
              <IconPlus size={14} stroke={3} />
              <span>আরও এলাকা</span>
            </div>
          </div>
        </div>

        {/* ── Bottom Summary Stats Banner (Image 2 Design) ── */}
        <div className="bbl-stats-bar mt-4 pt-2">
          {/* 8 Divisions */}
          <div className="bbl-stat-item">
            <div className="bbl-stat-icon-wrap">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7l6 -3l6 3l6 -3v13l-6 3l-6 -3l-6 3v-13" />
                <path d="M9 4v13" />
                <path d="M15 7v13" />
              </svg>
            </div>
            <div className="bbl-stat-text">
              <span className="bbl-stat-val">৮</span>
              <span className="bbl-stat-lbl">বিভাগ</span>
            </div>
          </div>

          <div className="bbl-stat-divider" />

          {/* 64 Districts */}
          <div className="bbl-stat-item">
            <div className="bbl-stat-icon-wrap">
              <IconMapPin size={24} stroke={2} color="#059669" />
            </div>
            <div className="bbl-stat-text">
              <span className="bbl-stat-val">৬৪</span>
              <span className="bbl-stat-lbl">জেলা</span>
            </div>
          </div>

          <div className="bbl-stat-divider" />

          {/* 495 Upazilas */}
          <div className="bbl-stat-item">
            <div className="bbl-stat-icon-wrap">
              <IconBuildingHospital size={24} stroke={2} color="#059669" />
            </div>
            <div className="bbl-stat-text">
              <span className="bbl-stat-val">৪৯৫</span>
              <span className="bbl-stat-lbl">উপজেলা</span>
            </div>
          </div>

          <div className="bbl-stat-divider" />

          {/* 12,000+ Doctors */}
          <div className="bbl-stat-item bbl-stat-wide">
            <div className="bbl-stat-icon-wrap">
              <IconUsers size={24} stroke={2} color="#059669" />
            </div>
            <div className="bbl-stat-text">
              <span className="bbl-stat-val">
                {stats?.total_doctors ? `${toBnNum(stats.total_doctors)}+` : '১২,০০০+'}
              </span>
              <span className="bbl-stat-lbl">ডাক্তার</span>
            </div>
          </div>

          <div className="bbl-stat-divider" />

          {/* 1,800+ Hospitals */}
          <div className="bbl-stat-item bbl-stat-wide">
            <div className="bbl-stat-icon-wrap">
              <IconBuildingHospital size={24} stroke={2} color="#059669" />
            </div>
            <div className="bbl-stat-text">
              <span className="bbl-stat-val">
                {stats?.total_hospitals ? `${toBnNum(stats.total_hospitals)}+` : '১,৮০০+'}
              </span>
              <span className="bbl-stat-lbl">হাসপাতাল</span>
            </div>
          </div>
        </div>
      </Container>

      {/* ── Unified All Divisions & Districts Searchable Modal (Specialties Style) ── */}
      <Modal show={showLocationModal} onHide={() => setShowLocationModal(false)} size="xl" centered scrollable>
        <Modal.Header style={{ borderBottom: '1px solid #E2E8F0', padding: '20px 28px', background: '#FFFFFF' }}>
          <div>
            <Modal.Title style={{ fontWeight: 800, fontSize: 21, color: '#0F172A', fontFamily: "'Hind Siliguri', sans-serif" }}>
              বাংলাদেশের সকল বিভাগ ও জেলা
              <span style={{ fontSize: 13.5, color: '#059669', marginLeft: 10, fontWeight: 700, background: '#E8F8F2', padding: '3px 10px', borderRadius: 20 }}>
                ৮টি বিভাগ • ৬৪টি জেলা
              </span>
            </Modal.Title>
            <p style={{ margin: '4px 0 0', fontSize: 13.5, color: '#64748B', fontFamily: "'Hind Siliguri', sans-serif" }}>
              পছন্দের বিভাগ বা জেলা নির্বাচন করে সরাসরি ডাক্তারের তালিকা দেখুন
            </p>
          </div>
          <button
            onClick={() => setShowLocationModal(false)}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
          >
            <IconX size={26} />
          </button>
        </Modal.Header>

        <Modal.Body style={{ padding: 0, background: '#F8FAFC' }}>
          {/* Sticky Search & Tab Filter Bar */}
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#F8FAFC', padding: '18px 24px 14px', borderBottom: '1px solid rgba(226,232,240,0.8)' }}>
            <InputGroup style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.04)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
              <InputGroup.Text style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRight: 'none', paddingLeft: 18 }}>
                <IconSearch size={20} color="#059669" />
              </InputGroup.Text>
              <Form.Control
                placeholder="বিভাগ বা জেলার নাম লিখে খুঁজুন (যেমন: ঢাকা, সিলেট, কুমিল্লা)..."
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                style={{ border: '1px solid #E2E8F0', borderLeft: 'none', boxShadow: 'none', padding: '12px 16px', fontSize: 15, fontFamily: "'Hind Siliguri', sans-serif" }}
              />
              {locationSearch && (
                <button
                  onClick={() => setLocationSearch('')}
                  style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: 'none', padding: '0 16px', color: '#94A3B8', cursor: 'pointer' }}
                >
                  <IconX size={18} />
                </button>
              )}
            </InputGroup>

            {/* Segmented Tab Filter */}
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                onClick={() => setModalTab('divisions')}
                className={`bbl-modal-tab-btn ${modalTab === 'divisions' ? 'active' : ''}`}
              >
                <IconMapPin size={16} />
                <span>বিভাগসমূহ</span>
                <span className="bbl-tab-badge">{filteredDivisions.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('districts')}
                className={`bbl-modal-tab-btn ${modalTab === 'districts' ? 'active' : ''}`}
              >
                <IconBuildingHospital size={16} />
                <span>সকল জেলা</span>
                <span className="bbl-tab-badge">{filteredDistricts.length}</span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div style={{ padding: '20px 24px 36px 24px' }}>
            {modalTab === 'divisions' ? (
              filteredDivisions.length > 0 ? (
                <Row className="row-cols-1 row-cols-sm-2 row-cols-md-2 row-cols-lg-3 g-3">
                  {filteredDivisions.map(div => (
                    <Col key={div.id}>
                      <div
                        onClick={() => {
                          setShowLocationModal(false)
                          navigate(`/doctors/${div.slug}`)
                        }}
                        className="bbl-modal-card"
                      >
                        <div className="bbl-modal-icon-badge">
                          {div.img ? (
                            <img
                              src={div.img}
                              alt={div.name}
                              className="bbl-modal-img"
                              onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                          ) : (
                            <IconMapPin size={22} color="#059669" />
                          )}
                        </div>
                        <div className="bbl-modal-info">
                          <h6 className="bbl-modal-card-title">{div.name}</h6>
                          <span className="bbl-modal-card-sub">
                            {div.hospitals} • {div.districtsCount}
                          </span>
                        </div>
                        <div className="bbl-modal-arrow">
                          <IconChevronRight size={18} color="#059669" />
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
                  <IconSearch size={36} color="#CBD5E1" style={{ marginBottom: 10 }} />
                  <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>কোনো বিভাগ পাওয়া যায়নি</p>
                </div>
              )
            ) : (
              filteredDistricts.length > 0 ? (
                <Row className="row-cols-1 row-cols-sm-2 row-cols-md-2 row-cols-lg-3 g-3">
                  {filteredDistricts.map((dist, idx) => (
                    <Col key={dist.slug || idx}>
                      <div
                        onClick={() => {
                          setShowLocationModal(false)
                          navigate(`/doctors/${dist.slug}`)
                        }}
                        className="bbl-modal-card"
                      >
                        <div className="bbl-modal-icon-badge">
                          <img
                            src={getDistrictImg(dist)}
                            alt={dist.name}
                            className="bbl-modal-img"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                        </div>
                        <div className="bbl-modal-info">
                          <h6 className="bbl-modal-card-title">{dist.name}</h6>
                          <span className="bbl-modal-card-sub">
                            {dist.division} • {dist.count}
                          </span>
                        </div>
                        <div className="bbl-modal-arrow">
                          <IconChevronRight size={18} color="#059669" />
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
                  <IconSearch size={36} color="#CBD5E1" style={{ marginBottom: 10 }} />
                  <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>কোনো জেলা পাওয়া যায়নি</p>
                </div>
              )
            )}
          </div>
        </Modal.Body>
      </Modal>

      {/* ── Scoped Styles ── */}
      <style>{`
        /* Card Container */
        .bbl-division-card {
          position: relative;
          height: 250px;
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bbl-division-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.16);
        }

        .bbl-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bbl-division-card:hover .bbl-card-img {
          transform: scale(1.08);
        }

        /* Floating Top-Left Hospital Badge */
        .bbl-card-top-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(8px);
          border-radius: 999px;
          padding: 4px 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          color: #0F172A;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          z-index: 3;
          font-family: 'Hind Siliguri', sans-serif;
        }

        /* Dark Gradient Overlay */
        .bbl-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(10, 25, 41, 0.96) 0%, rgba(10, 25, 41, 0.62) 50%, rgba(10, 25, 41, 0.12) 100%);
          z-index: 1;
        }

        /* Bottom Content Container */
        .bbl-card-bottom {
          position: absolute;
          bottom: 14px;
          left: 14px;
          right: 14px;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .bbl-card-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .bbl-card-title {
          font-size: 18px;
          font-weight: 900;
          color: #FFFFFF;
          margin: 0;
          font-family: 'Hind Siliguri', sans-serif;
        }

        .bbl-card-arrow-btn {
          width: 34px;
          height: 34px;
          min-width: 34px;
          border-radius: 50%;
          background: #FFFFFF;
          color: #064E3B;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
        }

        .bbl-division-card:hover .bbl-card-arrow-btn {
          transform: translateX(3px) scale(1.08);
          background: #059669;
          color: #FFFFFF;
        }

        /* District Sub-tags */
        .bbl-tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .bbl-mini-tag {
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255, 255, 255, 0.22);
          color: #FFFFFF;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 7px;
          font-family: 'Hind Siliguri', sans-serif;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .bbl-mini-tag:hover {
          background: rgba(255, 255, 255, 0.35);
          transform: scale(1.04);
        }

        /* 4th Card: Green Gradient Special Card */
        .bbl-more-card {
          background: linear-gradient(135deg, #059669 0%, #047857 50%, #064E3B 100%);
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 24px 20px;
        }

        .bbl-more-card:hover .bbl-more-plus-btn {
          transform: rotate(90deg) scale(1.1);
        }

        .bbl-more-plus-btn {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #FFFFFF;
          color: #059669;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          transition: all 0.35s ease;
          margin-bottom: 12px;
        }

        /* Pills Buttons for Districts & Areas */
        .bbl-pill-btn {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 999px;
          padding: 4px 14px 4px 5px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
          user-select: none;
        }

        .bbl-pill-btn:hover {
          transform: translateY(-2px);
          border-color: #059669;
          box-shadow: 0 6px 14px rgba(5, 150, 105, 0.12);
        }

        .bbl-pill-thumb {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          object-fit: cover;
        }

        .bbl-pill-text {
          font-size: 13.5px;
          font-weight: 700;
          color: #1E293B;
          font-family: 'Hind Siliguri', sans-serif;
        }

        .bbl-pill-count {
          font-size: 12px;
          font-weight: 500;
          color: #64748B;
          margin-left: 4px;
        }

        .bbl-pill-more {
          background: #E8F8F2;
          border-color: #A7F3D0;
          color: #059669;
          padding: 6px 16px;
          font-weight: 700;
          font-size: 13px;
        }

        .bbl-pill-more:hover {
          background: #059669;
          color: #FFFFFF;
          border-color: #059669;
        }

        /* Header & Link Action Buttons */
        .bbl-header-btn {
          background: #FFFFFF;
          border: 1.5px solid #059669;
          color: #059669;
          border-radius: 999px;
          padding: 8px 18px;
          font-weight: 800;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.25s ease;
          font-family: 'Hind Siliguri', sans-serif;
          cursor: pointer;
        }

        .bbl-header-btn:hover {
          background: #059669;
          color: #FFFFFF;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(5, 150, 105, 0.2);
        }

        .bbl-link-btn {
          background: #E8F8F2;
          border: none;
          color: #059669;
          border-radius: 999px;
          padding: 5px 14px;
          font-weight: 700;
          font-size: 12.5px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s ease;
          font-family: 'Hind Siliguri', sans-serif;
          cursor: pointer;
        }

        .bbl-link-btn:hover {
          background: #059669;
          color: #FFFFFF;
        }

        /* Bottom Stats Bar */
        .bbl-stats-bar {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 20px;
          padding: 18px 28px;
          display: flex;
          align-items: center;
          justify-content: space-around;
          box-shadow: 0 4px 18px rgba(15, 23, 42, 0.04);
        }

        .bbl-stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bbl-stat-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #E8F8F2;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bbl-stat-text {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .bbl-stat-val {
          font-size: 22px;
          font-weight: 900;
          color: #0F172A;
          font-family: 'Hind Siliguri', 'Inter', sans-serif;
        }

        .bbl-stat-lbl {
          font-size: 14px;
          font-weight: 600;
          color: #64748B;
          font-family: 'Hind Siliguri', sans-serif;
        }

        .bbl-stat-divider {
          width: 1px;
          height: 36px;
          background: #E2E8F0;
        }

        /* Unified Modal Tabs */
        .bbl-modal-tab-btn {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          color: #64748B;
          border-radius: 999px;
          padding: 6px 16px;
          font-weight: 700;
          font-size: 13.5px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Hind Siliguri', sans-serif;
        }
        .bbl-modal-tab-btn:hover {
          border-color: #059669;
          color: #059669;
        }
        .bbl-modal-tab-btn.active {
          background: #059669;
          border-color: #059669;
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);
        }
        .bbl-tab-badge {
          background: rgba(0, 0, 0, 0.08);
          font-size: 11.5px;
          padding: 1px 7px;
          border-radius: 12px;
          font-weight: 800;
        }
        .bbl-modal-tab-btn.active .bbl-tab-badge {
          background: rgba(255, 255, 255, 0.25);
          color: #FFFFFF;
        }

        /* Modal Cards matching Specialties design */
        .bbl-modal-card {
          background: #FFFFFF;
          border: 1.2px solid #EDF2F7;
          border-radius: 18px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
          transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
          user-select: none;
          height: 100%;
          min-height: 78px;
          position: relative;
          overflow: hidden;
        }
        .bbl-modal-card:hover {
          transform: translateY(-3px);
          border-color: #059669;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.07);
        }
        .bbl-modal-icon-badge {
          width: 48px;
          height: 48px;
          min-width: 48px;
          border-radius: 14px;
          background: #E8F8F2;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: transform 0.25s ease;
        }
        .bbl-modal-card:hover .bbl-modal-icon-badge {
          transform: scale(1.06);
        }
        .bbl-modal-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .bbl-modal-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 3px;
        }
        .bbl-modal-card-title {
          font-size: 15.5px;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
          line-height: 1.3;
          font-family: 'Hind Siliguri', 'Inter', sans-serif;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.2s ease;
        }
        .bbl-modal-card:hover .bbl-modal-card-title {
          color: #059669;
        }
        .bbl-modal-card-sub {
          font-size: 12px;
          font-weight: 500;
          color: #64748B;
          margin: 0;
          line-height: 1.35;
          font-family: 'Hind Siliguri', 'Inter', sans-serif;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bbl-modal-arrow {
          width: 32px;
          height: 32px;
          min-width: 32px;
          border-radius: 50%;
          background: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
        }
        .bbl-modal-card:hover .bbl-modal-arrow {
          transform: translateX(3px);
          background: #059669;
        }
        .bbl-modal-card:hover .bbl-modal-arrow svg {
          color: #FFFFFF !important;
          stroke: #FFFFFF !important;
        }

        @media (max-width: 992px) {
          .bbl-stats-bar {
            flex-wrap: wrap;
            gap: 16px;
            justify-content: flex-start;
          }
          .bbl-stat-divider {
            display: none;
          }
          .bbl-stat-item {
            flex: 1 1 45%;
          }
        }

        @media (max-width: 768px) {
          .bbl-pills-scroll {
            display: flex !important;
            flex-wrap: nowrap !important;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 6px;
            padding-top: 2px;
            scrollbar-width: none;
          }
          .bbl-pills-scroll::-webkit-scrollbar {
            display: none;
          }
          .bbl-pill-btn {
            flex-shrink: 0;
            white-space: nowrap;
          }

          .bbl-stats-bar {
            display: grid !important;
            grid-template-columns: repeat(6, 1fr) !important;
            gap: 14px 6px !important;
            padding: 16px 10px !important;
            border-radius: 16px !important;
          }
          .bbl-stat-divider {
            display: none !important;
          }
          .bbl-stat-item {
            grid-column: span 2 !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 6px !important;
          }
          .bbl-stat-item.bbl-stat-wide {
            grid-column: span 3 !important;
          }
          .bbl-stat-icon-wrap {
            width: 38px !important;
            height: 38px !important;
            border-radius: 10px !important;
          }
          .bbl-stat-icon-wrap svg {
            width: 20px !important;
            height: 20px !important;
          }
          .bbl-stat-text {
            flex-direction: column !important;
            align-items: center !important;
            gap: 0 !important;
            line-height: 1.25 !important;
          }
          .bbl-stat-val {
            font-size: 16px !important;
          }
          .bbl-stat-lbl {
            font-size: 11.5px !important;
          }
        }
      `}</style>
    </section>
  )
}

// ─── RECENTLY ADDED ENTITIES DISCOVERY SECTION ───────────────────────────────
function RecentlyAddedSection({ doctors = [], hospitals = [] }) {
  if ((!doctors || doctors.length === 0) && (!hospitals || hospitals.length === 0)) return null

  return (
    <section style={{ padding: '48px 0', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
      <Container>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <span className="badge rounded-pill px-3 py-1 mb-2" style={{ background: '#DCFCE7', color: '#15803D', fontSize: '0.8rem', fontWeight: 700 }}>
              নতুন সংযোজন
            </span>
            <h2 className="fw-bold mb-0 text-dark" style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontFamily: "'Hind Siliguri', sans-serif" }}>
              সম্প্রতি যুক্ত বিশেষজ্ঞ ডাক্তার ও হাসপাতাল
            </h2>
          </div>
          <Link to="/doctors" className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-semibold">
            সকল ডাক্তার <IconArrowRight size={16} />
          </Link>
        </div>

        {doctors && doctors.length > 0 && (
          <Row className="g-3">
            {doctors.slice(0, 3).map(doc => (
              <Col key={doc.id} xs={12} sm={6} md={4}>
                <DoctorCard doctor={doc} />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </section>
  )
}

// ─── HOMEPAGE FAQ SECTION (WITH SCHEMA SUPPORT) ─────────────────────────────
function HomepageFaqSection() {
  const [openIndex, setOpenIndex] = useState(0)

  const faqs = [
    {
      q: 'কিভাবে DoctorBooklet-এ বিশেষজ্ঞ ডাক্তারের অ্যাপয়েন্টমেন্ট বুক করব?',
      a: 'ওয়েবসাইটে ডাক্তার বা স্পেশালিটি অনুসন্ধান করে আপনার পছন্দের ডাক্তারের প্রোফাইলে প্রবেশ করুন। এরপর আপনার সুবিধাজনক চেম্বার এবং সময় নির্বাচন করে সহজেই অ্যাপয়েন্টমেন্ট নিশ্চিত করুন।'
    },
    {
      q: 'অনলাইন সিরিয়াল বুকিং করতে কোন অতিরিক্ত ফি লাগে?',
      a: 'না, DoctorBooklet প্ল্যাটফর্মের মাধ্যমে অ্যাপয়েন্টমেন্ট বুকিং সম্পূর্ণ ফ্রি। আপনি চেম্বারে পৌঁছে ডাক্তারের নির্ধারিত ভিজিট ফি প্রদান করবেন।'
    },
    {
      q: 'হাসপাতালের জরুরি অ্যাম্বুলেন্স ও আইসিইউ সেবা কিভাবে খুঁজব?',
      a: 'আমাদের হাসপাতাল ডিরেক্টরিতে জেলা ও থানা ভিত্তিক ফিল্টার ব্যবহার করে ২৪/৭ ইমার্জেন্সি, আইসিইউ এবং অ্যাম্বুলেন্স সেবা সমৃদ্ধ হাসপাতাল তাৎক্ষণিক খুঁজে নিতে পারেন।'
    },
    {
      q: 'অ্যাপয়েন্টমেন্ট বাতিল বা সময় পরিবর্তন করা যাবে কি?',
      a: 'হ্যাঁ, বুকিং সম্পন্ন হলে আপনার মোবাইল নম্বরে প্রাপ্ত বুকিং ট্র্যাকিং লিংকের মাধ্যমে সহজে অ্যাপয়েন্টমেন্ট রিসিডিউল বা বাতিল করতে পারবেন।'
    },
    {
      q: 'টেলিমেডিসিন বা অনলাইন ভিডিও কনসালটেশন পাওয়া যাবে কি?',
      a: 'হ্যাঁ, যেসকল ডাক্তারের প্রোফাইলে "টেলিমেডিসিন সুবিধা" উল্লেখ রয়েছে, তাদের সাথে আপনি ঘরে বসেই সরাসরি ভিডিও কলে পরামর্শ গ্রহণ করতে পারেন।'
    }
  ]

  const handleToggle = (i) => {
    setOpenIndex(prev => (prev === i ? null : i))
  }

  return (
    <section style={{ padding: '60px 0', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
      <Container style={{ maxWidth: 880 }}>
        <div className="text-center mb-4">
          <span className="badge rounded-pill px-3 py-1 mb-2" style={{ background: '#DCFCE7', color: '#15803D', fontSize: '0.8rem', fontWeight: 700 }}>
            প্রশ্নোত্তর
          </span>
          <h2 className="fw-bold text-dark" style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontFamily: "'Hind Siliguri', sans-serif" }}>
            সাধারণ জিজ্ঞাসা ও উত্তর
          </h2>
          <p className="text-muted" style={{ fontSize: '0.95rem', fontFamily: "'Hind Siliguri', sans-serif" }}>
            DoctorBooklet ব্যবহার ও স্বাস্থ্যসেবা প্রাপ্তি সংক্রান্ত সাধারণ তথ্যাবলী
          </p>
        </div>

        <div className="d-flex flex-column gap-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div
                key={i}
                className="bg-white rounded-3 border"
                style={{
                  boxShadow: isOpen ? '0 4px 20px rgba(0, 184, 117, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
                  borderColor: isOpen ? '#86EFAC' : '#E2E8F0',
                  transition: 'all 0.25s ease',
                  overflow: 'hidden'
                }}
              >
                <button
                  type="button"
                  onClick={() => handleToggle(i)}
                  className="w-100 d-flex align-items-center justify-content-between p-3 p-md-4 text-start border-0 bg-transparent"
                  style={{ cursor: 'pointer', outline: 'none', gap: 14 }}
                  aria-expanded={isOpen}
                >
                  <span
                    className="fw-bold mb-0"
                    style={{
                      fontSize: 16,
                      color: isOpen ? '#15803D' : '#1E293B',
                      fontFamily: "'Hind Siliguri', sans-serif",
                      lineHeight: 1.5,
                      flex: 1,
                      transition: 'color 0.2s ease'
                    }}
                  >
                    {faq.q}
                  </span>
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                    style={{
                      width: 32,
                      height: 32,
                      background: isOpen ? '#00B875' : '#F1F5F9',
                      color: isOpen ? '#FFFFFF' : '#475569',
                      transition: 'all 0.25s ease',
                      border: isOpen ? '1px solid #00B875' : '1px solid #E2E8F0'
                    }}
                  >
                    {isOpen ? <IconMinus size={18} stroke={2.5} /> : <IconPlus size={18} stroke={2.5} />}
                  </span>
                </button>

                {isOpen && (
                  <div
                    className="px-3 px-md-4 pb-3 pb-md-4 pt-0"
                    style={{
                      animation: 'faqFadeIn 0.3s ease'
                    }}
                  >
                    <div style={{ height: 1, background: '#F1F5F9', marginBottom: 14 }} />
                    <p
                      className="text-muted mb-0"
                      style={{
                        fontSize: 14.5,
                        lineHeight: 1.7,
                        fontFamily: "'Hind Siliguri', sans-serif",
                        color: '#475569'
                      }}
                    >
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* আরো জানুন (FAQ / Help Center) Button */}
        <div className="text-center mt-4 pt-2">
          <Link
            to="/support"
            className="btn text-white rounded-pill px-4 py-2 fw-bold"
            style={{
              fontSize: '0.95rem',
              fontFamily: "'Hind Siliguri', sans-serif",
              background: '#00B875',
              borderColor: '#00B875',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(0, 184, 117, 0.35)',
              transition: 'all 0.25s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#009E64'
              e.currentTarget.style.borderColor = '#009E64'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#00B875'
              e.currentTarget.style.borderColor = '#00B875'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            আরো জানুন (সাহায্য কেন্দ্র FAQ)
            <IconArrowRight size={18} />
          </Link>
        </div>
      </Container>

      <style>{`
        @keyframes faqFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  )
}

// ─── PATIENT TESTIMONIALS SECTION (EXACT REFERENCE DESIGN) ─────────────────
function PatientTestimonialsSection() {
  const [cms, setCms] = useState(getContent())

  useEffect(() => {
    const handleUpdate = () => setCms(getContent())
    window.addEventListener('cms-updated', handleUpdate)
    return () => window.removeEventListener('cms-updated', handleUpdate)
  }, [])

  const sec = cms?.testimonials || {}
  const title = sec.title || 'হাজারো রোগীর ভরসা ও সন্তুষ্টি'
  const subtitle = sec.subtitle || 'আমাদের সেবা ব্যবহার করে যারা তাদের পছন্দের বিশেষজ্ঞ ডাক্তার ও সঠিক চিকিৎসা সেবা নিশ্চিত করেছেন, তাদের কথা শুনুন।'
  const testimonials = (sec.items && sec.items.length > 0) ? sec.items : [
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
            {title}
          </h2>
          <p style={{
            fontSize: 14.5,
            color: '#64748B',
            margin: 0,
            lineHeight: 1.6,
            fontWeight: 500,
            fontFamily: "'Hind Siliguri', sans-serif"
          }}>
            {subtitle}
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

  const roles = [
    {
      badge: 'ডাক্তারদের জন্য',
      title: 'Doctor Registration',
      subTitle: 'ডাক্তার হিসেবে যোগ দিন',
      desc: 'আপনার চেম্বার ও প্র্যাকটিস পরিচালনা করুন এবং রোগীদের সরাসরি ডিজিটাল সেবা দিন।',
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
      badge: 'হাসপাতাল ও ক্লিনিকের জন্য',
      title: 'Hospital Registration',
      subTitle: 'হাসপাতাল পার্টনার হোন',
      desc: 'আপনার হাসপাতালের তথ্য যুক্ত করুন এবং অনলাইন অ্যাপয়েন্টমেন্ট ও সার্ভিস ম্যানেজ করুন।',
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
      badge: 'রোগীদের জন্য',
      title: 'Patient Registration',
      subTitle: 'পেশেন্ট হিসেবে যুক্ত হোন',
      desc: 'বিশেষজ্ঞ ডাক্তার খুঁজুন এবং যেকোনো সময় সহজে অনলাইনে অ্যাপয়েন্টমেন্ট বুক করুন।',
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
    <section className="registration-section" style={{ padding: '48px 0 40px', background: '#F8FAFC' }}>
      <Container>
        {/* Header Title & Subtitle */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span className="badge rounded-pill px-3 py-1 mb-2" style={{ background: '#DCFCE7', color: '#15803D', fontSize: '0.8rem', fontWeight: 700 }}>
            ইউজার নিবন্ধন
          </span>
          <h2 style={{
            fontSize: 'clamp(24px, 3.8vw, 34px)',
            fontWeight: 900,
            color: '#0F172A',
            marginBottom: 8,
            fontFamily: "'Hind Siliguri', 'Inter', sans-serif"
          }}>
            আপনার ক্যাটাগরি অনুযায়ী নিবন্ধন করুন
          </h2>
          <p style={{
            fontSize: 15,
            color: '#64748B',
            fontWeight: 500,
            maxWidth: 620,
            margin: '0 auto',
            fontFamily: "'Hind Siliguri', sans-serif"
          }}>
            ডাক্তার, হাসপাতাল কিংবা সাধারণ রোগী — আপনার প্রয়োজন অনুযায়ী সঠিক প্রোফাইল নির্বাচন করুন
          </p>
        </div>

        {/* Dark Navy 3-Column Container */}
        <div style={{
          background: '#0B192C',
          borderRadius: 12,
          boxShadow: '0 20px 45px -10px rgba(11, 25, 44, 0.3)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div className="pic1-steps-grid">
            {roles.map((item, i) => (
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
                {/* Role Category Badge */}
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#00B875',
                  letterSpacing: '0.5px',
                  marginBottom: 20,
                  fontFamily: "'Hind Siliguri', sans-serif",
                  background: 'rgba(0, 184, 117, 0.12)',
                  padding: '4px 12px',
                  borderRadius: 20,
                  border: '1px solid rgba(0, 184, 117, 0.25)'
                }}>
                  {item.badge}
                </span>

                {/* Icon */}
                <div style={{
                  marginBottom: 20,
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
                  padding: '5px 16px',
                  borderRadius: 6,
                  marginBottom: 14,
                  display: 'inline-block',
                  fontFamily: "'Hind Siliguri', sans-serif",
                  boxShadow: '0 2px 8px rgba(0, 184, 117, 0.3)'
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
            <span>নিবন্ধন নির্বাচন করুন</span>
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
          background: rgba(255, 255, 255, 0.04);
        }
        .pic1-step-col:hover .pic1-icon-wrap {
          transform: translateY(-4px) scale(1.08);
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
        }
      `}</style>
    </section>
  )
}

// ─── OUR HOSPITAL PARTNERS (CONTINUOUS MARQUEE SLOW SCROLLING) ───────────────
function HospitalPartnersSection({ hospitals = [] }) {
  const [cms, setCms] = useState(getContent())

  useEffect(() => {
    const handleUpdate = () => setCms(getContent())
    window.addEventListener('cms-updated', handleUpdate)
    return () => window.removeEventListener('cms-updated', handleUpdate)
  }, [])

  const sec = cms?.partners || {}
  const title = sec.title || 'আমাদের সহযোগী হাসপাতালসমূহ'
  const subtitle = sec.subtitle || 'দেশজুড়ে নির্ভরযোগ্য হাসপাতাল ও ক্লিনিক্যাল সেন্টারসমূহ'

  const customItems = (sec.items && sec.items.length > 0) ? sec.items : null
  const fallbackPartners = [
    { name: 'Bangladesh Specialized Hospital', logo_url: 'https://img.freepik.com/free-vector/hospital-logo-design-vector-medical-cross_53876-136743.jpg' },
    { name: 'Chevron Clinical Laboratory', logo_url: 'https://img.freepik.com/free-vector/cross-medical-health-care-logo_23987-136.jpg' },
    { name: 'Popular Diagnostic Center', logo_url: 'https://img.freepik.com/free-vector/hospital-clinic-logo-design_23-2149544607.jpg' },
    { name: 'Praava Health', logo_url: 'https://img.freepik.com/free-vector/medical-care-logo-vector_53876-136744.jpg' },
    { name: 'York Hospital', logo_url: 'https://img.freepik.com/free-vector/medical-cross-logo-vector_53876-136742.jpg' },
    { name: 'Ibn Sina Hospital', logo_url: 'https://img.freepik.com/free-vector/gradient-medical-logo-template_23-2148995383.jpg' }
  ]

  const items = customItems || (hospitals && hospitals.length > 0 ? hospitals : fallbackPartners)

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
            {title}
          </h2>
          <p style={{ fontSize: 13.5, color: '#64748B', fontWeight: 500, margin: 0, fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>
            {subtitle}
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
    <section
      className="doctor-booking-promo-banner d-none d-md-flex"
      style={{
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        padding: '70px 20px',
        margin: '24px 0',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .doctor-booking-promo-banner {
            display: none !important;
          }
        }
      `}</style>
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
  // SINGLE API CALL: Fetches top doctors, top hospitals, recent entities, locations, specialties, and stats
  const { data, isLoading } = useHomepage()

  const homeSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${window.location.origin}/#website`,
        'url': window.location.origin,
        'name': 'MedConnect',
        'description': 'বাংলাদেশের শীর্ষস্থানীয় বিশেষজ্ঞ ডাক্তার ও হাসপাতাল ডিরেক্টরি',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': `${window.location.origin}/search?query={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@type': 'MedicalOrganization',
        '@id': `${window.location.origin}/#organization`,
        'name': 'DoctorBooklet Bangladesh',
        'url': window.location.origin,
        'logo': `${window.location.origin}/logo.png`,
        'contactPoint': {
          '@type': 'ContactPoint',
          'contactType': 'customer support',
          'availableLanguage': ['bn', 'en']
        }
      },
      {
        '@type': 'FAQPage',
        '@id': `${window.location.origin}/#faq`,
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'কিভাবে DoctorBooklet-এ বিশেষজ্ঞ ডাক্তারের অ্যাপয়েন্টমেন্ট বুক করব?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'ওয়েবসাইটে ডাক্তার বা স্পেশালিটি অনুসন্ধান করে আপনার পছন্দের ডাক্তারের প্রোফাইলে প্রবেশ করুন। এরপর আপনার সুবিধাজনক চেম্বার এবং সময় নির্বাচন করে সহজেই অ্যাপয়েন্টমেন্ট নিশ্চিত করুন।'
            }
          },
          {
            '@type': 'Question',
            'name': 'অনলাইন সিরিয়াল বুকিং করতে কোন অতিরিক্ত ফি লাগে?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'না, DoctorBooklet প্ল্যাটফর্মের মাধ্যমে অ্যাপয়েন্টমেন্ট বুকিং সম্পূর্ণ ফ্রি। আপনি চেম্বারে পৌঁছে ডাক্তারের নির্ধারিত ভিজিট ফি প্রদান করবেন।'
            }
          }
        ]
      }
    ]
  }

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <SeoHead
        title="MedConnect — শীর্ষস্থানীয় বিশেষজ্ঞ ডাক্তার ও হাসপাতাল ডিরেক্টরি"
        description="বাংলাদেশের শীর্ষস্থানীয় বিশেষজ্ঞ ডাক্তার ও হাসপাতালের তথ্য, চেম্বার সময়সূচি এবং সহজে অনলাইন সিরিয়াল ও অ্যাপয়েন্টমেন্ট বুকিং করুন।"
        canonicalUrl={window.location.origin}
        schemaData={homeSchema}
      />
      <HeroSection stats={data?.stats} />

      <ScrollReveal direction="up" distance={28} duration={600}>
        <ImageBannerSlider />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600} className="d-none d-md-block">
        <DoctorBookingPromoBanner />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600}>
        <TodayDoctorsSection />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600}>
        <MostViewedDoctors doctors={data?.top_doctors} loading={isLoading} />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600}>
        <BrowseByLocationSection
          popularDivisions={data?.popular_divisions}
          popularDistricts={data?.popular_districts}
          popularUpazilas={data?.popular_upazilas}
          stats={data?.stats}
        />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600}>
        <TopSpecialtiesSlider specialties={data?.specialties} loading={isLoading} />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600}>
        <TopHospitals hospitals={data?.top_hospitals} loading={isLoading} />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600}>
        <RecentlyAddedSection
          doctors={data?.recent_doctors}
          hospitals={data?.recent_hospitals}
        />
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

      <ScrollReveal direction="up" distance={28} duration={600}>
        <HomepageFaqSection />
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

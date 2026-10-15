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
import QuickLiveSerialModal from '../components/common/QuickLiveSerialModal'

import {
  IconArrowRight, IconCalendar, IconShieldCheck, IconClock, IconStar, IconHeadset,
  IconChevronLeft, IconChevronRight, IconChevronDown, IconStethoscope, IconHeart, IconDental, IconUsers, IconEye, IconScissors,
  IconLock, IconDeviceMobile, IconBuildingHospital, IconInfoCircle, IconShare,
  IconFileText, IconBell, IconChartBar, IconMapPin, IconArrowUpRight, IconPlus, IconMinus,
  IconSearch, IconX, IconActivity, IconUserHeart
} from '@tabler/icons-react'
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
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
      icon: <IconCalendar size={19} stroke={2.2} />,
      title: 'ডিজিটাল অ্যাপয়েন্টমেন্ট',
      subtitle: 'অনলাইন সিডিউল, রোগী তালিকা, অটো স্লট'
    },
    {
      icon: <IconFileText size={19} stroke={2.2} />,
      title: 'ই-প্রেসক্রিপশন ও ইনভয়েস',
      subtitle: 'এক ক্লিকে ডিজিটাল প্রেসক্রিপশন, PDF রসিদ'
    },
    {
      icon: <IconBell size={19} stroke={2.2} />,
      title: 'অটো SMS রিমাইন্ডার',
      subtitle: 'অ্যাপয়েন্টমেন্টের আগে ও পরে অটো SMS'
    },
    {
      icon: <IconActivity size={19} stroke={2.2} />,
      title: 'লাইভ কিউ ডিসপ্লে',
      subtitle: 'চেম্বারের জন্য রিয়েল-টাইম সিরিয়াল বোর্ড'
    },
    {
      icon: <IconBuildingHospital size={19} stroke={2.2} />,
      title: 'চেম্বার ও হাসপাতাল পেজ',
      subtitle: 'ডাক্তার তালিকা, ইউনিট ও পাবলিক পেজ'
    },
    {
      icon: <IconChartBar size={19} stroke={2.2} />,
      title: 'আয়-ব্যয় অ্যানালিটিক্স',
      subtitle: 'চার্ট, রিপোর্ট ও হিসাব এক্সপোর্ট'
    }
  ]

  return (
    <section className="dashboard-promo-section">
      <Container>
        {/* Title Header */}
        <div className="dashboard-promo-header">
          <div className="dashboard-promo-pill">
            <span className="dashboard-promo-dot" />
            <span>প্র্যাকটিস ম্যানেজমেন্ট</span>
          </div>
          <h2 className="dashboard-promo-title">
            আপনার চেম্বার হোক <span style={{ color: '#059669' }}>সম্পূর্ণ ডিজিটাল</span>
          </h2>
          <p className="dashboard-promo-subtitle">
            অ্যাপয়েন্টমেন্ট থেকে ই-প্রেসক্রিপশন — সব এক স্মার্ট ড্যাশবোর্ডে
          </p>
        </div>

        {/* Feature Cards Grid (2 cols on mobile, 3 cols on desktop) */}
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <Row className="g-2 g-md-3 justify-content-center mb-3 mb-md-4">
            {features.map((item, i) => (
              <Col key={i} xs={6} md={6} lg={4}>
                <div className="dashboard-feature-card">
                  {/* Green Square Icon Badge */}
                  <div className="dashboard-feature-icon-badge">
                    {item.icon}
                  </div>
                  <div className="dashboard-feature-text-box">
                    <h4 className="dashboard-feature-title">
                      {item.title}
                    </h4>
                    <p className="dashboard-feature-sub d-none d-sm-block">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* Action Buttons (Side by side on mobile) */}
        <div className="dash-banner-btns-row">
          <button
            onClick={() => navigate('/services')}
            className="dash-banner-primary-btn"
          >
            <span>সব ফিচার দেখুন</span>
            <IconArrowRight size={17} stroke={2.5} />
          </button>

          <button
            onClick={() => navigate('/register')}
            className="dash-banner-secondary-btn"
          >
            <span>ফ্রি অ্যাকাউন্ট খুলুন</span>
          </button>
        </div>
      </Container>

      <style>{`
        .dashboard-promo-section {
          background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 50%, #E6F4EA 100%);
          padding: 38px 0 36px;
          color: '#0F172A';
          position: relative;
          overflow: hidden;
        }

        .dashboard-promo-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .dashboard-promo-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3.5px 12px;
          background: #DCFCE7;
          border: 1px solid #BBF7D0;
          color: #047857;
          font-size: 12px;
          font-weight: 700;
          border-radius: 999px;
          margin-bottom: 10px;
          font-family: 'Hind Siliguri', sans-serif;
        }

        .dashboard-promo-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #059669;
          display: inline-block;
          box-shadow: 0 0 6px #10B981;
        }

        .dashboard-promo-title {
          font-size: clamp(21px, 3.4vw, 34px);
          font-weight: 900;
          color: #0F172A;
          margin-bottom: 8px;
          font-family: 'Hind Siliguri', 'Inter', sans-serif;
          letter-spacing: -0.3px;
          line-height: 1.3;
        }

        .dashboard-promo-subtitle {
          font-size: 14.5px;
          color: #475569;
          font-weight: 500;
          max-width: 580px;
          margin: 0 auto;
          font-family: 'Hind Siliguri', sans-serif;
          line-height: 1.5;
        }

        .dashboard-feature-card {
          background: #FFFFFF;
          border: 1.5px solid #A7F3D0;
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.25s ease;
          height: 100%;
          box-shadow: 0 4px 14px rgba(5, 150, 105, 0.05);
        }

        .dashboard-feature-card:hover {
          background: #FFFFFF !important;
          border-color: #059669 !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(5, 150, 105, 0.12) !important;
        }

        .dashboard-feature-icon-badge {
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: #FFFFFF;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 3px 8px rgba(5, 150, 105, 0.25);
        }

        .dashboard-feature-text-box {
          flex: 1;
          min-width: 0;
        }

        .dashboard-feature-title {
          font-size: 14px;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 2px;
          font-family: 'Hind Siliguri', sans-serif;
          line-height: 1.3;
        }

        .dashboard-feature-sub {
          font-size: 12px;
          color: #64748B;
          margin: 0;
          font-weight: 500;
          font-family: 'Hind Siliguri', sans-serif;
          line-height: 1.35;
        }

        .dash-banner-btns-row {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .dash-banner-primary-btn {
          background: #059669;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 11px 26px;
          font-weight: 800;
          font-size: 14.5px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 6px 18px rgba(5, 150, 105, 0.22);
          transition: all 0.25s ease;
          font-family: 'Hind Siliguri', sans-serif;
        }

        .dash-banner-primary-btn:hover {
          background: #047857;
          transform: translateY(-2px);
        }

        .dash-banner-secondary-btn {
          background: #FFFFFF;
          color: #059669;
          border: 1.5px solid #059669;
          border-radius: 8px;
          padding: 11px 24px;
          font-weight: 700;
          font-size: 14.5px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 3px 10px rgba(5, 150, 105, 0.06);
          transition: all 0.25s ease;
          font-family: 'Hind Siliguri', sans-serif;
        }

        .dash-banner-secondary-btn:hover {
          background: #E8F8F2;
          transform: translateY(-2px);
        }

        @media (max-width: 767px) {
          .dashboard-promo-section {
            padding: 24px 0 24px !important;
          }

          .dashboard-promo-header {
            margin-bottom: 16px !important;
          }

          .dashboard-promo-pill {
            font-size: 11px !important;
            padding: 2.5px 10px !important;
            margin-bottom: 6px !important;
          }

          .dashboard-promo-title {
            font-size: 19px !important;
            line-height: 1.3 !important;
            margin-bottom: 4px !important;
          }

          .dashboard-promo-subtitle {
            font-size: 12.5px !important;
            line-height: 1.4 !important;
            padding: 0 8px;
          }

          .dashboard-feature-card {
            padding: 10px 9px !important;
            gap: 8px !important;
            border-radius: 10px !important;
            min-height: 58px !important;
          }

          .dashboard-feature-icon-badge {
            width: 32px !important;
            height: 32px !important;
            border-radius: 7px !important;
          }

          .dashboard-feature-icon-badge svg {
            width: 17px !important;
            height: 17px !important;
          }

          .dashboard-feature-title {
            font-size: 12px !important;
            line-height: 1.25 !important;
            margin: 0 !important;
            font-weight: 800 !important;
          }

          .dash-banner-btns-row {
            gap: 10px !important;
          }

          .dash-banner-primary-btn,
          .dash-banner-secondary-btn {
            font-size: 13.5px !important;
            padding: 9.5px 14px !important;
            flex: 1 1 45% !important;
            justify-content: center !important;
            white-space: nowrap !important;
          }
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

  // Bottom sheet swipe down to dismiss refs & handlers (Specialties Style)
  const sheetRef = useRef(null)
  const overlayRef = useRef(null)
  const sheetTouchStartY = useRef(0)
  const sheetCurrentY = useRef(0)
  const isSheetDragging = useRef(false)

  const closeLocationModal = () => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
      sheetRef.current.style.transform = 'translateY(100%)'
    }
    if (overlayRef.current) {
      overlayRef.current.style.transition = 'opacity 0.25s ease'
      overlayRef.current.style.opacity = '0'
    }
    setTimeout(() => {
      setShowLocationModal(false)
      setLocationSearch('')
      if (sheetRef.current) {
        sheetRef.current.style.transform = ''
      }
    }, 250)
  }

  const handleSheetTouchStart = (e) => {
    sheetTouchStartY.current = e.touches[0].clientY
    sheetCurrentY.current = 0
    isSheetDragging.current = true
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none'
    }
    if (overlayRef.current) {
      overlayRef.current.style.transition = 'none'
    }
  }

  const handleSheetTouchMove = (e) => {
    if (!isSheetDragging.current) return
    const deltaY = e.touches[0].clientY - sheetTouchStartY.current
    if (deltaY > 0) {
      sheetCurrentY.current = deltaY
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${deltaY}px)`
      }
      if (overlayRef.current) {
        const opacity = Math.max(0, 1 - deltaY / 400)
        overlayRef.current.style.opacity = opacity
      }
    }
  }

  const handleSheetTouchEnd = () => {
    if (!isSheetDragging.current) return
    isSheetDragging.current = false
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)'
    }
    if (overlayRef.current) {
      overlayRef.current.style.transition = 'opacity 0.28s ease'
    }

    if (sheetCurrentY.current > 100) {
      closeLocationModal()
    } else {
      if (sheetRef.current) {
        sheetRef.current.style.transform = 'translateY(0px)'
      }
      if (overlayRef.current) {
        overlayRef.current.style.opacity = '1'
      }
      sheetCurrentY.current = 0
    }
  }

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (showLocationModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showLocationModal])

  const toBnNum = (n) => {
    if (n === null || n === undefined) return ''
    const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯', '+': '+', ',': ',' }
    return String(n).replace(/[0-9]/g, d => enToBn[d] || d)
  }

  // Bengali name dictionary for districts
  const DISTRICT_NAME_BN = {
    'dhaka': 'ঢাকা', 'gazipur': 'গাজীপুর', 'narayanganj': 'নারায়ণগঞ্জ', 'munshiganj': 'মুন্সীগঞ্জ',
    'narsingdi': 'নরসিংদী', 'tangail': 'টাঙ্গাইল', 'manikganj': 'মানিকগঞ্জ', 'faridpur': 'ফরিদপুর',
    'madaripur': 'মাদারীপুর', 'gopalganj': 'গোপালগঞ্জ', 'rajbari': 'রাজবাড়ী', 'shariatpur': 'শরীয়তপুর',
    'kishoreganj': 'কিশোরগঞ্জ',
    'chittagong': 'চট্টগ্রাম', 'chattogram': 'চট্টগ্রাম', 'coxsbazar': 'কক্সবাজার', 'cumilla': 'কুমিল্লা',
    'noakhali': 'নোয়াখালী', 'feni': 'ফেনী', 'brahmanbaria': 'ব্রাহ্মণবাড়িয়া', 'chandpur': 'চাঁদপুর',
    'lakshmipur': 'লক্ষ্মীপুর', 'rangamati': 'রাঙ্গামাটি', 'khagrachhari': 'খাগড়াছড়ি', 'bandarban': 'বান্দরবান',
    'sylhet': 'সিলেট', 'moulvibazar': 'মৌলভীবাজার', 'habiganj': 'হবিগঞ্জ', 'sunamganj': 'সুনামগঞ্জ',
    'rajshahi': 'রাজশাহী', 'bogura': 'বগুড়া', 'pabna': 'পাবনা', 'sirajganj': 'সিরাজগঞ্জ',
    'naogaon': 'নওগাঁ', 'natore': 'নাটোর', 'chapainawabganj': 'চাঁপাইনবাবগঞ্জ', 'joypurhat': 'জয়পুরহাট',
    'khulna': 'খুলনা', 'jashore': 'যশোর', 'kushtia': 'কুষ্টিয়া', 'jhenaidah': 'ঝিনাইদহ',
    'satkhira': 'সাতক্ষীরা', 'bagerhat': 'বাগেরহাট', 'chuadanga': 'চুয়াডাঙ্গা', 'meherpur': 'মেহেরপুর',
    'narail': 'নড়াইল', 'magura': 'মাগুরা',
    'barishal': 'বরিশাল', 'barisal': 'বরিশাল', 'patuakhali': 'পটুয়াখালী', 'bhola': 'ভোলা',
    'pirojpur': 'পিরোজপুর', 'barguna': 'বরগুনা', 'jhalokati': 'ঝালকাঠি',
    'rangpur': 'রংপুর', 'dinajpur': 'দিনাজপুর', 'kurigram': 'কুড়িগ্রাম', 'gaibandha': 'গাইবান্ধা',
    'nilphamari': 'নীলফামারী', 'lalmonirhat': 'লালমনিরহাট', 'thakurgaon': 'ঠাকুরগাঁও', 'panchagarh': 'পঞ্চগড়',
    'mymensingh': 'ময়মনসিংহ', 'maimonshigh': 'ময়মনসিংহ', 'jamalpur': 'জামালপুর', 'netrokona': 'নেত্রকোণা', 'sherpur': 'শেরপুর',
  }

  // ── Dynamic Main 3 Featured Landmark Divisions with Backend Database Counts ──
  const mainDivisions = useMemo(() => {
    const configs = [
      {
        id: 1,
        bnName: 'ঢাকা বিভাগ',
        enName: 'Dhaka Division',
        searchKey: 'dhaka',
        img: '/images/dhaka_division_parliament.jpg'
      },
      {
        id: 2,
        bnName: 'সিলেট বিভাগ',
        enName: 'Sylhet Division',
        searchKey: 'sylhet',
        img: '/images/sylhet_division_teagarden.jpg'
      },
      {
        id: 5,
        bnName: 'চট্টগ্রাম বিভাগ',
        enName: 'Chattogram Division',
        searchKey: 'chattogram',
        img: '/images/chattogram_division_sunset.jpg'
      }
    ]

    return configs.map(cfg => {
      // Find matching dynamic division record from backend
      const divData = popularDivisions?.find(d => {
        const n = (d.name || '').toLowerCase()
        const bn = (d.bangla_name || '')
        return n.includes(cfg.searchKey) ||
               (cfg.searchKey === 'chattogram' && (n.includes('chhatagram') || n.includes('chittagong'))) ||
               (bn && cfg.bnName.includes(bn))
      })

      // Dynamic count: Reflect real hospital/doctor count from database
      let countText = '০টি হাসপাতাল'
      if (divData) {
        const hCount = divData.hospitals_count || 0
        const dCount = divData.doctors_count || 0
        if (hCount > 0) {
          countText = `${toBnNum(hCount)}টি হাসপাতাল`
        } else if (dCount > 0) {
          countText = `${toBnNum(dCount)}টি ডাক্তার`
        } else {
          countText = '০টি হাসপাতাল'
        }
      }

      // 100% Dynamic districts strictly from database for this division
      const dbDistricts = (divData?.districts || []).map(d => ({
        name: d.bangla_name || DISTRICT_NAME_BN[(d.slug || d.name || '').toLowerCase()] || d.name,
        slug: d.slug || (d.name || '').toLowerCase()
      }))

      const displayDistricts = dbDistricts.slice(0, 3)
      const remainingCount = dbDistricts.length > 3 ? dbDistricts.length - 3 : 0

      if (remainingCount > 0) {
        displayDistricts.push({
          name: `+ ${toBnNum(remainingCount)} জেলা`,
          isMore: true
        })
      }

      return {
        id: divData?.id || cfg.id,
        divId: divData?.id || cfg.id,
        bnName: cfg.bnName,
        enName: cfg.enName,
        count: countText,
        searchKey: cfg.searchKey,
        img: cfg.img,
        districts: displayDistricts
      }
    })
  }, [popularDivisions])

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

  const getDistrictImg = (dist) => {
    const slugKey = (dist.slug || '').toLowerCase()
    const nameKey = (dist.bangla_name || dist.name || '').toLowerCase()
    return DISTRICT_THUMBNAILS[slugKey] || DISTRICT_THUMBNAILS[nameKey] || dist.img || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=100&auto=format&fit=crop&q=70'
  }

  // Preset 8 divisions of Bangladesh with rich metadata
  const presetEightDivisions = [
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
      id: 5,
      name: 'চট্টগ্রাম বিভাগ',
      enName: 'Chattogram Division',
      slug: 'chattogram',
      hospitals: '২৫০+ হাসপাতাল',
      doctors: '২,৪০০+ ডাক্তার',
      districtsCount: '১১টি জেলা',
      img: '/images/chattogram_division_sunset.jpg'
    },
    {
      id: 2,
      name: 'সিলেট বিভাগ',
      enName: 'Sylhet Division',
      slug: 'sylhet',
      hospitals: '১৮০+ হাসপাতাল',
      doctors: '১,৮০০+ ডাক্তার',
      districtsCount: '৪টি জেলা',
      img: '/images/sylhet_division_teagarden.jpg'
    },
    {
      id: 6,
      name: 'রাজশাহী বিভাগ',
      enName: 'Rajshahi Division',
      slug: 'rajshahi',
      hospitals: '১৬০+ হাসপাতাল',
      doctors: '১,৫০০+ ডাক্তার',
      districtsCount: '৮টি জেলা',
      img: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=100&auto=format&fit=crop&q=70'
    },
    {
      id: 7,
      name: 'খুলনা বিভাগ',
      enName: 'Khulna Division',
      slug: 'khulna',
      hospitals: '১৪০+ হাসপাতাল',
      doctors: '১,২০০+ ডাক্তার',
      districtsCount: '১০টি জেলা',
      img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=100&auto=format&fit=crop&q=70'
    },
    {
      id: 4,
      name: 'বরিশাল বিভাগ',
      enName: 'Barishal Division',
      slug: 'barishal',
      hospitals: '১১০+ হাসপাতাল',
      doctors: '৯৫০+ ডাক্তার',
      districtsCount: '৬টি জেলা',
      img: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&auto=format&fit=crop&q=70'
    },
    {
      id: 3,
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

  const allEightDivisions = useMemo(() => {
    return presetEightDivisions.map(div => {
      const match = popularDivisions?.find(d => {
        const n = (d.name || '').toLowerCase()
        return n.includes(div.slug) ||
               (div.slug === 'chattogram' && (n.includes('chhatagram') || n.includes('chittagong'))) ||
               (d.bangla_name && div.name.includes(d.bangla_name))
      })
      const hCount = match?.hospitals_count || 0
      const dCount = match?.doctors_count || 0
      const distCount = match?.districts_count || 0
      return {
        ...div,
        id: match?.id || div.id,
        dbId: match?.id || div.id,
        hospitals: hCount > 0 ? `${toBnNum(hCount)}টি হাসপাতাল` : '০টি হাসপাতাল',
        doctors: dCount > 0 ? `${toBnNum(dCount)}টি ডাক্তার` : '০টি ডাক্তার',
        districtsCount: `${toBnNum(distCount)}টি জেলা`
      }
    })
  }, [popularDivisions])

  // 100% Dynamic Districts strictly from backend database
  const activeDistrictsList = useMemo(() => {
    return (popularDistricts || []).map(dist => {
      const bnName = dist.bangla_name || DISTRICT_NAME_BN[(dist.slug || dist.name || '').toLowerCase()] || dist.name
      const divName = dist.division?.bangla_name ||
        (dist.division?.name ? `${dist.division.name} বিভাগ` : '') ||
        (DISTRICT_NAME_BN[(dist.division?.name || '').toLowerCase()] ? `${DISTRICT_NAME_BN[(dist.division?.name || '').toLowerCase()]} বিভাগ` : 'বাংলাদেশ')
      const docCount = dist.doctors_count || 0
      return {
        id: dist.id,
        name: bnName,
        enName: dist.name,
        slug: dist.slug,
        division: divName,
        doctorsCount: docCount,
        count: `${toBnNum(docCount)} জন ডাক্তার`,
        img: getDistrictImg(dist)
      }
    })
  }, [popularDistricts])

  const filteredDivisions = allEightDivisions.filter(d => {
    const q = locationSearch.trim().toLowerCase()
    if (!q) return true
    return (
      d.name.toLowerCase().includes(q) ||
      (d.enName && d.enName.toLowerCase().includes(q)) ||
      (d.slug && d.slug.toLowerCase().includes(q))
    )
  })

  const filteredDistricts = activeDistrictsList.filter(d => {
    const q = locationSearch.trim().toLowerCase()
    if (!q) return true
    return (
      d.name.toLowerCase().includes(q) ||
      (d.enName && d.enName.toLowerCase().includes(q)) ||
      (d.slug && d.slug.toLowerCase().includes(q)) ||
      (d.division && d.division.toLowerCase().includes(q))
    )
  })

  return (
    <section style={{ background: '#F8FAFC', padding: '30px 0 32px' }}>
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
                    {div.districts && div.districts.length > 0 ? (
                      div.districts.map((tag, idx) => (
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
                      ))
                    ) : (
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/doctors/${div.searchKey}`)
                        }}
                        className="bbl-mini-tag"
                        style={{ opacity: 0.95 }}
                      >
                        সকল ডাক্তার দেখুন
                      </span>
                    )}
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
                  {toBnNum(stats?.total_divisions ?? 8)} বিভাগ • {toBnNum(stats?.total_districts ?? 3)} জেলা
                </span>

                <span style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}>
                  {toBnNum(stats?.total_upazilas ?? 3)} উপজেলা
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

        {/* ── Bottom Summary Stats Banner (Image 2 Design) ── */}
        <div className="bbl-stats-bar mt-4 pt-2">
          {/* Divisions */}
          <div className="bbl-stat-item">
            <div className="bbl-stat-icon-wrap">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7l6 -3l6 3l6 -3v13l-6 3l-6 -3l-6 3v-13" />
                <path d="M9 4v13" />
                <path d="M15 7v13" />
              </svg>
            </div>
            <div className="bbl-stat-text">
              <span className="bbl-stat-val">
                {stats?.total_divisions !== undefined ? toBnNum(stats.total_divisions) : '৮'}
              </span>
              <span className="bbl-stat-lbl">বিভাগ</span>
            </div>
          </div>

          <div className="bbl-stat-divider" />

          {/* Districts */}
          <div className="bbl-stat-item">
            <div className="bbl-stat-icon-wrap">
              <IconMapPin size={24} stroke={2} color="#059669" />
            </div>
            <div className="bbl-stat-text">
              <span className="bbl-stat-val">
                {stats?.total_districts !== undefined ? toBnNum(stats.total_districts) : '৩'}
              </span>
              <span className="bbl-stat-lbl">জেলা</span>
            </div>
          </div>

          <div className="bbl-stat-divider" />

          {/* Upazilas */}
          <div className="bbl-stat-item">
            <div className="bbl-stat-icon-wrap">
              <IconBuildingHospital size={24} stroke={2} color="#059669" />
            </div>
            <div className="bbl-stat-text">
              <span className="bbl-stat-val">
                {stats?.total_upazilas !== undefined ? toBnNum(stats.total_upazilas) : '৩'}
              </span>
              <span className="bbl-stat-lbl">উপজেলা</span>
            </div>
          </div>

          <div className="bbl-stat-divider" />

          {/* Doctors */}
          <div className="bbl-stat-item bbl-stat-wide">
            <div className="bbl-stat-icon-wrap">
              <IconUsers size={24} stroke={2} color="#059669" />
            </div>
            <div className="bbl-stat-text">
              <span className="bbl-stat-val">
                {stats?.total_doctors !== undefined ? `${toBnNum(stats.total_doctors)}+` : '০+'}
              </span>
              <span className="bbl-stat-lbl">ডাক্তার</span>
            </div>
          </div>

          <div className="bbl-stat-divider" />

          {/* Hospitals */}
          <div className="bbl-stat-item bbl-stat-wide">
            <div className="bbl-stat-icon-wrap">
              <IconBuildingHospital size={24} stroke={2} color="#059669" />
            </div>
            <div className="bbl-stat-text">
              <span className="bbl-stat-val">
                {stats?.total_hospitals !== undefined ? `${toBnNum(stats.total_hospitals)}+` : '০+'}
              </span>
              <span className="bbl-stat-lbl">হাসপাতাল</span>
            </div>
          </div>
        </div>
      </Container>

      {/* ── Unified All Divisions & Districts Searchable Modal (Specialties Style) ── */}
      {showLocationModal && typeof document !== 'undefined' && createPortal(
        <div
          ref={overlayRef}
          className="bbl-popup-overlay"
          onClick={closeLocationModal}
        >
          <div
            ref={sheetRef}
            className="bbl-popup-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Drag Indicator Handle Bar (Swipe down to dismiss) */}
            <div
              className="bbl-sheet-drag-zone"
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
            >
              <div className="bbl-sheet-drag-bar" />
            </div>

            {/* Header (Swipeable) */}
            <div
              className="bbl-popup-header"
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
            >
              <div>
                <div className="bbl-popup-title">
                  বাংলাদেশের সকল বিভাগ ও জেলা
                  <span className="bbl-popup-badge">
                    {toBnNum(stats?.total_divisions ?? 8)}টি বিভাগ • {toBnNum(stats?.total_districts ?? (popularDistricts?.length || 3))}টি জেলা
                  </span>
                </div>
                <div className="bbl-popup-sub">
                  পছন্দের বিভাগ বা জেলা নির্বাচন করে সরাসরি ডাক্তারের তালিকা দেখুন
                </div>
              </div>
              <button
                type="button"
                className="bbl-popup-close-btn"
                onClick={closeLocationModal}
                aria-label="Close"
              >
                <IconX size={20} />
              </button>
            </div>

            {/* Sticky Search & Tab Filter Bar */}
            <div className="bbl-popup-search-area">
              <div className="bbl-popup-search-box">
                <IconSearch size={18} color="#059669" />
                <input
                  type="text"
                  placeholder="বিভাগ বা জেলার নাম লিখে খুঁজুন (যেমন: সিলেট, ঢাকা, হবিগঞ্জ)..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="bbl-popup-search-input"
                />
                {locationSearch && (
                  <button
                    type="button"
                    onClick={() => setLocationSearch('')}
                    className="bbl-popup-search-clear"
                  >
                    <IconX size={16} />
                  </button>
                )}
              </div>

              {/* Segmented Tab Filter */}
              <div className="bbl-popup-tabs">
                <button
                  type="button"
                  onClick={() => setModalTab('divisions')}
                  className={`bbl-modal-tab-btn ${modalTab === 'divisions' ? 'active' : ''}`}
                >
                  <IconMapPin size={15} />
                  <span>বিভাগসমূহ</span>
                  <span className="bbl-tab-badge">{toBnNum(filteredDivisions.length)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalTab('districts')}
                  className={`bbl-modal-tab-btn ${modalTab === 'districts' ? 'active' : ''}`}
                >
                  <IconBuildingHospital size={15} />
                  <span>সকল জেলা</span>
                  <span className="bbl-tab-badge">{toBnNum(filteredDistricts.length)}</span>
                </button>
              </div>
            </div>

            {/* Body / Content Grid */}
            <div className="bbl-popup-body">
              {modalTab === 'divisions' ? (
                filteredDivisions.length > 0 ? (
                  <div className="bbl-popup-grid">
                    {filteredDivisions.map(div => (
                      <div
                        key={div.id}
                        onClick={() => {
                          closeLocationModal()
                          navigate(`/doctors?division_id=${div.id}`)
                        }}
                        className="bbl-popup-card"
                      >
                        <div className="bbl-popup-card-icon">
                          {div.img ? (
                            <img
                              src={div.img}
                              alt={div.name}
                              className="bbl-popup-card-img"
                              onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                          ) : (
                            <IconMapPin size={22} color="#059669" />
                          )}
                        </div>
                        <div className="bbl-popup-card-info">
                          <h6 className="bbl-popup-card-title">{div.name}</h6>
                          <span className="bbl-popup-card-sub">
                            {div.hospitals} • {div.districtsCount}
                          </span>
                        </div>
                        <div className="bbl-popup-card-arrow">
                          <IconChevronRight size={18} color="#059669" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bbl-popup-empty">
                    <IconSearch size={36} color="#CBD5E1" />
                    <p>কোনো বিভাগ পাওয়া যায়নি</p>
                  </div>
                )
              ) : (
                filteredDistricts.length > 0 ? (
                  <div className="bbl-popup-grid">
                    {filteredDistricts.map((dist, idx) => (
                      <div
                        key={dist.slug || idx}
                        onClick={() => {
                          closeLocationModal()
                          navigate(`/doctors/${dist.slug}`)
                        }}
                        className="bbl-popup-card"
                      >
                        <div className="bbl-popup-card-icon">
                          <img
                            src={getDistrictImg(dist)}
                            alt={dist.name}
                            className="bbl-popup-card-img"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                        </div>
                        <div className="bbl-popup-card-info">
                          <h6 className="bbl-popup-card-title">{dist.name}</h6>
                          <span className="bbl-popup-card-sub">
                            {dist.division ? `${dist.division} • ` : ''}{dist.count}
                          </span>
                        </div>
                        <div className="bbl-popup-card-arrow">
                          <IconChevronRight size={18} color="#059669" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bbl-popup-empty">
                    <IconSearch size={36} color="#CBD5E1" />
                    <p>কোনো জেলা পাওয়া যায়নি</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

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

        /* ── Specialties Style Unified Location Popup ── */
        .bbl-popup-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.65);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          animation: bblFadeIn 0.2s ease;
          padding: 20px;
        }

        @keyframes bblFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .bbl-popup-sheet {
          background: #FFFFFF;
          width: 100%;
          max-width: 880px;
          max-height: 86vh;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.28);
          animation: bblModalScale 0.25s cubic-bezier(0.165, 0.84, 0.44, 1);
          will-change: transform;
        }

        @keyframes bblModalScale {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .bbl-sheet-drag-zone {
          display: none;
          width: 100%;
          padding: 10px 0 4px;
          align-items: center;
          justify-content: center;
          cursor: grab;
          touch-action: none;
        }

        .bbl-sheet-drag-bar {
          width: 44px;
          height: 4.5px;
          background: #CBD5E1;
          border-radius: 10px;
        }

        .bbl-popup-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 18px 24px 14px 24px;
          border-bottom: 1px solid #F1F5F9;
          background: #FFFFFF;
          flex-shrink: 0;
        }

        .bbl-popup-title {
          font-size: 19px;
          font-weight: 800;
          color: #0F172A;
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Hind Siliguri', sans-serif;
          margin: 0;
        }

        .bbl-popup-badge {
          font-size: 12px;
          font-weight: 700;
          color: #059669;
          background: #E8F8F2;
          padding: 3px 10px;
          border-radius: 20px;
          border: 1px solid rgba(5, 150, 105, 0.2);
        }

        .bbl-popup-sub {
          font-size: 13px;
          color: #64748B;
          margin-top: 4px;
          font-family: 'Hind Siliguri', sans-serif;
        }

        .bbl-popup-close-btn {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748B;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .bbl-popup-close-btn:hover {
          background: #EF4444;
          color: #FFFFFF;
          border-color: #EF4444;
        }

        .bbl-popup-search-area {
          padding: 14px 24px;
          background: #F8FAFC;
          border-bottom: 1px solid #F1F5F9;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .bbl-popup-search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 12px;
          padding: 9px 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: border-color 0.15s ease;
        }

        .bbl-popup-search-box:focus-within {
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
        }

        .bbl-popup-search-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 14.5px;
          color: #0F172A;
          font-family: 'Hind Siliguri', sans-serif;
        }

        .bbl-popup-search-input::placeholder {
          color: #94A3B8;
        }

        .bbl-popup-search-clear {
          background: none;
          border: none;
          padding: 0;
          color: #94A3B8;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .bbl-popup-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .bbl-popup-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px 30px;
          -webkit-overflow-scrolling: touch;
          background: #F8FAFC;
        }

        .bbl-popup-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 12px;
        }

        .bbl-popup-card {
          background: #FFFFFF;
          border: 1.2px solid #EDF2F7;
          border-radius: 16px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
          user-select: none;
        }

        .bbl-popup-card:hover {
          transform: translateY(-2px);
          border-color: #059669;
          box-shadow: 0 8px 20px rgba(5, 150, 105, 0.12);
        }

        .bbl-popup-card-icon {
          width: 44px;
          height: 44px;
          min-width: 44px;
          border-radius: 12px;
          background: #E8F8F2;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: transform 0.25s ease;
        }

        .bbl-popup-card:hover .bbl-popup-card-icon {
          transform: scale(1.05);
        }

        .bbl-popup-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .bbl-popup-card-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 2px;
        }

        .bbl-popup-card-title {
          font-size: 15px;
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

        .bbl-popup-card:hover .bbl-popup-card-title {
          color: #059669;
        }

        .bbl-popup-card-sub {
          font-size: 12px;
          font-weight: 500;
          color: #64748B;
          margin: 0;
          line-height: 1.3;
          font-family: 'Hind Siliguri', 'Inter', sans-serif;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .bbl-popup-card-arrow {
          width: 30px;
          height: 30px;
          min-width: 30px;
          border-radius: 50%;
          background: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
        }

        .bbl-popup-card:hover .bbl-popup-card-arrow {
          transform: translateX(3px);
          background: #059669;
        }

        .bbl-popup-card:hover .bbl-popup-card-arrow svg {
          color: #FFFFFF !important;
          stroke: #FFFFFF !important;
        }

        .bbl-popup-empty {
          text-align: center;
          padding: 40px 0;
          color: #64748B;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .bbl-popup-empty p {
          font-size: 14.5px;
          font-weight: 600;
          margin: 0;
          font-family: 'Hind Siliguri', sans-serif;
        }

        @media (max-width: 992px) and (min-width: 769px) {
          .bbl-stats-bar {
            padding: 16px 20px;
            gap: 10px;
          }
          .bbl-stat-item {
            gap: 8px;
          }
          .bbl-stat-val {
            font-size: 18px;
          }
          .bbl-stat-lbl {
            font-size: 12.5px;
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
            grid-template-columns: repeat(5, 1fr) !important;
            gap: 2px !important;
            padding: 14px 6px !important;
            border-radius: 16px !important;
            background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 50%, #E6F4EA 100%) !important;
            border: 1px solid #A7F3D0 !important;
            box-shadow: 0 4px 16px rgba(5, 150, 105, 0.08) !important;
          }
          .bbl-stat-divider {
            display: none !important;
          }
          .bbl-stat-item {
            grid-column: span 1 !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 4px !important;
            min-width: 0 !important;
          }
          .bbl-stat-item.bbl-stat-wide {
            grid-column: span 1 !important;
          }
          .bbl-stat-icon-wrap {
            width: 32px !important;
            height: 32px !important;
            border-radius: 9px !important;
            background: #FFFFFF !important;
            box-shadow: 0 2px 6px rgba(5, 150, 105, 0.12) !important;
          }
          .bbl-stat-icon-wrap svg {
            width: 17px !important;
            height: 17px !important;
          }
          .bbl-stat-text {
            flex-direction: column !important;
            align-items: center !important;
            gap: 1px !important;
            line-height: 1.15 !important;
          }
          .bbl-stat-val {
            font-size: 13.5px !important;
            font-weight: 800 !important;
            color: #065F46 !important;
            white-space: nowrap !important;
          }
          .bbl-stat-lbl {
            font-size: 11px !important;
            font-weight: 700 !important;
            color: #047857 !important;
            white-space: nowrap !important;
          }

          /* Specialties Style Mobile Bottom Sheet */
          .bbl-popup-overlay {
            padding: 0 !important;
            align-items: flex-end !important;
          }

          .bbl-popup-sheet {
            max-width: 100% !important;
            max-height: 85vh !important;
            border-radius: 24px 24px 0 0 !important;
            animation: bblSheetSlideUp 0.25s cubic-bezier(0.165, 0.84, 0.44, 1) !important;
          }

          @keyframes bblSheetSlideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }

          .bbl-sheet-drag-zone {
            display: flex !important;
          }

          .bbl-popup-header {
            padding: 4px 18px 14px !important;
            cursor: grab;
            touch-action: none;
            user-select: none;
          }

          .bbl-popup-title {
            font-size: 16px !important;
            gap: 6px !important;
            flex-wrap: wrap !important;
          }

          .bbl-popup-badge {
            font-size: 11px !important;
            padding: 2px 7px !important;
          }

          .bbl-popup-sub {
            font-size: 11.5px !important;
          }

          .bbl-popup-search-area {
            padding: 10px 16px !important;
            gap: 10px !important;
          }

          .bbl-popup-search-box {
            padding: 7px 12px !important;
          }

          .bbl-popup-search-input {
            font-size: 13.5px !important;
          }

          .bbl-popup-body {
            padding: 14px 16px 28px !important;
          }

          .bbl-popup-grid {
            grid-template-columns: 1fr !important;
            gap: 9px !important;
          }

          .bbl-popup-card {
            padding: 11px 13px !important;
            border-radius: 14px !important;
          }

          .bbl-popup-card-icon {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            border-radius: 10px !important;
          }

          .bbl-popup-card-title {
            font-size: 14px !important;
          }

          .bbl-popup-card-sub {
            font-size: 11.5px !important;
          }
        }

        @media (max-width: 360px) {
          .bbl-stats-bar {
            padding: 11px 2px !important;
            gap: 1px !important;
          }
          .bbl-stat-icon-wrap {
            width: 28px !important;
            height: 28px !important;
            border-radius: 7px !important;
          }
          .bbl-stat-icon-wrap svg {
            width: 15px !important;
            height: 15px !important;
          }
          .bbl-stat-val {
            font-size: 12.5px !important;
          }
          .bbl-stat-lbl {
            font-size: 10px !important;
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
    <section className="d-none d-md-block" style={{ padding: '32px 0 34px', background: '#FFFFFF' }}>
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
    <section style={{ padding: '36px 0 24px', background: '#F8FAFC' }}>
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
        <div className="text-center mt-3">
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
    <section style={{ background: '#FFFFFF', padding: '38px 0 36px' }}>
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
  const scrollContainerRef = useRef(null)
  const [activeDot, setActiveDot] = useState(0)

  const roles = [
    {
      badge: 'ডাক্তারদের জন্য',
      title: 'Doctor Registration',
      subTitle: 'ডাক্তার হিসেবে যোগ দিন',
      desc: 'আপনার চেম্বার ও প্র্যাকটিস পরিচালনা করুন এবং রোগীদের সরাসরি ডিজিটাল সেবা দিন।',
      link: '/register?role=doctor',
      icon: <IconStethoscope size={36} color="#059669" stroke={2.2} />,
    },
    {
      badge: 'হাসপাতালের জন্য',
      title: 'Hospital Registration',
      subTitle: 'হাসপাতাল পার্টনার হোন',
      desc: 'আপনার হাসপাতালের তথ্য যুক্ত করুন এবং অনলাইন অ্যাপয়েন্টমেন্ট ও সার্ভিস ম্যানেজ করুন।',
      link: '/register?role=hospital',
      icon: <IconBuildingHospital size={36} color="#059669" stroke={2.2} />,
    },
    {
      badge: 'রোগীদের জন্য',
      title: 'Patient Registration',
      subTitle: 'পেশেন্ট হিসেবে যুক্ত হোন',
      desc: 'বিশেষজ্ঞ ডাক্তার খুঁজুন এবং যেকোনো সময় সহজে অনলাইনে অ্যাপয়েন্টমেন্ট বুক করুন।',
      link: '/register?role=patient',
      icon: <IconUserHeart size={36} color="#059669" stroke={2.2} />,
    }
  ]

  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const cardWidth = el.scrollWidth / roles.length
    const currentIndex = Math.round(el.scrollLeft / cardWidth)
    setActiveDot(Math.min(Math.max(currentIndex, 0), roles.length - 1))
  }

  const scrollToCard = (index) => {
    const el = scrollContainerRef.current
    if (!el) return
    const cards = el.querySelectorAll('.reg-card-col')
    if (cards[index]) {
      cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      setActiveDot(index)
    }
  }

  return (
    <section className="registration-section" style={{ padding: '38px 0 36px', background: '#F8FAFC' }}>
      <Container>
        {/* Header Title & Subtitle (Clean, Compact & Premium) */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <span className="badge rounded-pill px-3 py-1 mb-2" style={{ background: '#DCFCE7', color: '#15803D', fontSize: '0.78rem', fontWeight: 700 }}>
            ক্যাটাগরি নির্বাচন
          </span>
          <h2 style={{
            fontSize: 'clamp(20px, 3.2vw, 30px)',
            fontWeight: 900,
            color: '#0F172A',
            marginBottom: 6,
            fontFamily: "'Hind Siliguri', 'Inter', sans-serif"
          }}>
            আপনার প্রোফাইল <span style={{ color: '#059669' }}>বেছে নিন</span>
          </h2>
          <p style={{
            fontSize: 14,
            color: '#64748B',
            fontWeight: 500,
            maxWidth: 480,
            margin: '0 auto',
            fontFamily: "'Hind Siliguri', sans-serif"
          }}>
            সহজেই আপনার সংশ্লিষ্ট ক্যাটাগরিতে যুক্ত হোন
          </p>
        </div>

        {/* Modern Clean White 3-Cards: Desktop 3-Cols / Mobile Horizontal Swipe Carousel */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="reg-cards-scroll-container"
        >
          {roles.map((item, i) => (
            <div key={i} className="reg-card-col">
              <div
                onClick={() => navigate(item.link)}
                className="reg-white-card"
              >
                {/* Role Category Badge */}
                <span className="reg-role-badge">
                  {item.badge}
                </span>

                {/* Icon Wrapper */}
                <div className="reg-icon-wrap">
                  {item.icon}
                </div>

                {/* Title */}
                <h3 className="reg-card-title">
                  {item.title}
                </h3>

                {/* Bangla Subtitle Pill */}
                <span className="reg-sub-pill">
                  {item.subTitle}
                </span>

                {/* Description */}
                <p className="reg-card-desc">
                  {item.desc}
                </p>

                {/* Action Link */}
                <div className="reg-card-action">
                  <span>নিবন্ধন করুন</span>
                  <IconArrowRight size={15} stroke={2.5} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Swipe Pagination Indicator Dots */}
        <div className="reg-mobile-dots d-flex d-md-none justify-content-center align-items-center gap-2 mt-3">
          {roles.map((_, idx) => (
            <span
              key={idx}
              className={`reg-dot ${activeDot === idx ? 'active' : ''}`}
              onClick={() => scrollToCard(idx)}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Bottom Green Action Button */}
        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <button
            onClick={() => navigate('/register')}
            className="reg-bottom-cta-btn"
          >
            <span>নিবন্ধন নির্বাচন করুন</span>
            <IconArrowRight size={18} stroke={2.5} />
          </button>
        </div>
      </Container>

      <style>{`
        .reg-cards-scroll-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          align-items: stretch;
        }

        .reg-card-col {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .reg-white-card {
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 34px 24px 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          cursor: pointer;
          width: 100%;
          height: 100%;
          min-height: 375px;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
          transition: all 0.32s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .reg-white-card:hover {
          transform: translateY(-6px);
          border-color: #059669;
          box-shadow: 0 16px 36px rgba(5, 150, 105, 0.12);
        }

        .reg-role-badge {
          font-size: 12px;
          font-weight: 700;
          color: #059669;
          letter-spacing: 0.3px;
          margin-bottom: 18px;
          font-family: 'Hind Siliguri', sans-serif;
          background: #E8F8F2;
          padding: 4px 14px;
          border-radius: 999px;
          border: 1px solid rgba(5, 150, 105, 0.2);
        }

        .reg-icon-wrap {
          width: 68px;
          height: 68px;
          border-radius: 20px;
          background: #ECFDF5;
          border: 2px solid #A7F3D0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
          box-shadow: 0 6px 16px rgba(5, 150, 105, 0.08);
          transition: transform 0.3s ease, background 0.3s ease, border-color 0.3s ease;
        }

        .reg-white-card:hover .reg-icon-wrap {
          transform: translateY(-4px) scale(1.08);
          background: #D1FAE5;
          border-color: #059669;
        }

        .reg-card-title {
          font-size: 19px;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 8px;
          font-family: 'Inter', sans-serif;
          transition: color 0.25s ease;
        }

        .reg-white-card:hover .reg-card-title {
          color: #059669;
        }

        .reg-sub-pill {
          font-size: 12px;
          font-weight: 700;
          color: #FFFFFF;
          background: #059669;
          padding: 4px 14px;
          border-radius: 6px;
          margin-bottom: 14px;
          display: inline-block;
          font-family: 'Hind Siliguri', sans-serif;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.25);
          transition: background 0.2s ease;
        }

        .reg-card-desc {
          font-size: 13.5px;
          color: #64748B;
          line-height: 1.6;
          margin: 0 0 20px 0;
          font-weight: 500;
          font-family: 'Hind Siliguri', sans-serif;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .reg-card-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #059669;
          background: #F0FDF4;
          padding: 7px 18px;
          border-radius: 999px;
          border: 1px solid #A7F3D0;
          font-family: 'Hind Siliguri', sans-serif;
          transition: all 0.25s ease;
          margin-top: auto;
        }

        .reg-white-card:hover .reg-card-action {
          background: #059669;
          color: #FFFFFF;
          border-color: #059669;
          transform: translateX(3px);
        }

        .reg-bottom-cta-btn {
          background: #059669;
          color: #FFFFFF;
          border: none;
          border-radius: 999px;
          padding: 14px 42px;
          font-weight: 800;
          font-size: 15.5px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 8px 24px rgba(5, 150, 105, 0.25);
          transition: all 0.3s ease;
          font-family: 'Hind Siliguri', sans-serif;
        }
        .reg-bottom-cta-btn:hover {
          transform: translateY(-2px);
          background: #047857;
        }

        @media (max-width: 767px) {
          .registration-section {
            padding: 22px 0 24px !important;
          }
          .reg-cards-scroll-container {
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none !important;
            padding: 6px 16px 14px 16px !important;
            margin: 0 -12px !important;
            gap: 12px !important;
            align-items: stretch !important;
          }
          .reg-cards-scroll-container::-webkit-scrollbar {
            display: none !important;
          }

          .reg-card-col {
            flex: 0 0 78% !important;
            max-width: 295px !important;
            scroll-snap-align: center !important;
            scroll-snap-stop: always !important;
            display: flex !important;
            flex-direction: column !important;
            height: auto !important;
          }

          .reg-white-card {
            padding: 22px 16px 18px !important;
            border-radius: 18px !important;
            box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06) !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            height: 100% !important;
            min-height: 335px !important;
          }

          .reg-role-badge {
            font-size: 11px !important;
            margin-bottom: 12px !important;
            padding: 3px 12px !important;
          }

          .reg-icon-wrap {
            width: 58px !important;
            height: 58px !important;
            border-radius: 16px !important;
            margin-bottom: 12px !important;
          }

          .reg-card-title {
            font-size: 16px !important;
            margin-bottom: 6px !important;
          }

          .reg-sub-pill {
            font-size: 11px !important;
            padding: 3px 12px !important;
            margin-bottom: 8px !important;
          }

          .reg-card-desc {
            font-size: 12px !important;
            margin-bottom: 16px !important;
            line-height: 1.45 !important;
            min-height: 36px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          .reg-card-action {
            font-size: 12px !important;
            padding: 6px 16px !important;
            margin-top: auto !important;
          }

          .reg-dot {
            width: 7px;
            height: 7px;
            border-radius: 99px;
            background: #CBD5E1;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
          }
          .reg-dot.active {
            width: 22px;
            background: #059669;
          }

          .reg-bottom-cta-btn {
            padding: 11px 30px !important;
            font-size: 14px !important;
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
    <section style={{ padding: '28px 0 30px', background: '#FFFFFF', overflow: 'hidden' }}>
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

// ─── DOCTOR BOOKING PROMO BANNER (FULL WIDTH SINGLE ROW LIVE TRACKER) ────
function DoctorBookingPromoBanner() {
  const navigate = useNavigate()
  const [showLiveSerialModal, setShowLiveSerialModal] = useState(false)
  return (
    <section
      className="doctor-booking-promo-banner d-none d-md-block"
      style={{
        width: '100%',
        margin: '0',
        position: 'relative',
        background: 'linear-gradient(90deg, #022C22 0%, #064E3B 32%, #047857 70%, #065F46 100%)',
        padding: '30px 0',
        minHeight: '165px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden'
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .doctor-booking-promo-banner {
            display: none !important;
          }
        }
        @keyframes livePulseAnim {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; box-shadow: 0 0 12px #EF4444; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
        .live-pulse-dot {
          animation: livePulseAnim 1.6s infinite ease-in-out;
        }
        .live-tracker-single-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
        }
        @media (max-width: 991px) {
          .live-tracker-single-row {
            flex-wrap: wrap;
            gap: 20px;
          }
        }
      `}</style>

      {/* Subtle Background Glow Rings */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '20%',
        width: 360,
        height: 180,
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(ellipse, rgba(16, 185, 129, 0.25) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        right: '15%',
        width: 320,
        height: 160,
        transform: 'translate(50%, -50%)',
        background: 'radial-gradient(ellipse, rgba(52, 211, 153, 0.18) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <Container fluid="xl" className="px-3 px-lg-4" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <div className="live-tracker-single-row">
          
          {/* Left Segment: Full-Height Mobile Mockup + LIVE Headline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, minWidth: 280, flex: '1 1 auto' }}>
            
            {/* Realistic Full-Height Smartphone Mockup */}
            <div style={{
              width: 86,
              height: 154,
              borderRadius: 20,
              background: '#0B132B',
              border: '2.5px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45), inset 0 0 0 1.5px rgba(255, 255, 255, 0.1)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.35))'
            }}>
              {/* Top Dynamic Island / Speaker */}
              <div style={{
                width: 24,
                height: 5,
                borderRadius: 99,
                background: '#000000',
                margin: '5px auto 4px'
              }} />

              {/* Phone App Header */}
              <div style={{
                background: '#047857',
                padding: '3px 5px',
                borderRadius: 5,
                margin: '0 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: 7, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.2px' }}>DoctorBooklet</span>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
              </div>

              {/* Phone Screen Live Queue Box */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: 8,
                margin: '4px 4px 3px',
                padding: '5px 4px',
                textAlign: 'center',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)'
              }}>
                <div style={{ fontSize: 7, color: '#047857', fontWeight: 800 }}>চলতি সিরিয়াল</div>
                <div style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: '#059669',
                  lineHeight: 1.1,
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}>
                  ১২
                </div>
                <div style={{ fontSize: 6, color: '#64748B', fontWeight: 600 }}>চেম্বার লাইভ চলছে</div>
              </div>

              {/* Mini Upcoming Ticker on Phone */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.12)',
                borderRadius: 5,
                margin: '1px 4px',
                padding: '3px 4px',
                textAlign: 'center',
                fontSize: 6.5,
                color: '#A7F3D0',
                fontWeight: 600
              }}>
                পরবর্তী: ১৩ • ১৪
              </div>

              {/* Bottom Home Indicator */}
              <div style={{
                width: 26,
                height: 2.5,
                borderRadius: 99,
                background: 'rgba(255, 255, 255, 0.5)',
                margin: 'auto auto 4px'
              }} />
            </div>

            {/* LIVE Badge, Headline & Sub-bullet */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 99,
                  background: 'rgba(239, 68, 68, 0.22)',
                  border: '1px solid rgba(239, 68, 68, 0.6)',
                  color: '#FCA5A5',
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '0.5px'
                }}>
                  <span
                    className="live-pulse-dot"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#EF4444',
                      display: 'inline-block'
                    }}
                  />
                  LIVE সিরিয়াল ট্র্যাকিং
                </span>
                <span style={{ color: '#A7F3D0', fontSize: 13.5, fontWeight: 600 }}>
                  • চেম্বারে বসে অপেক্ষার দিন শেষ
                </span>
              </div>

              <h3 style={{
                fontSize: 'clamp(18px, 1.9vw, 24px)',
                fontWeight: 900,
                color: '#FFFFFF',
                margin: 0,
                lineHeight: 1.4,
                fontFamily: "'Hind Siliguri', sans-serif"
              }}>
                ঘরে বসেই লাইভ সিরিয়াল ট্র্যাক করুন ও পছন্দের ডাক্তারের অ্যাপয়েন্টমেন্ট নিন
              </h3>
            </div>
          </div>

          {/* Middle Segment: Real-Time Chamber Queue Pill (Without #) */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: 16,
            padding: '10px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            flexShrink: 0
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#A7F3D0', fontWeight: 700, textTransform: 'uppercase' }}>
                চলতি সিরিয়াল
              </div>
              <div style={{
                fontSize: 26,
                fontWeight: 900,
                color: '#FDE047',
                lineHeight: 1.1,
                fontFamily: "'Hind Siliguri', sans-serif"
              }}>
                ১২
              </div>
            </div>

            <div style={{ width: 1, height: 36, background: 'rgba(255, 255, 255, 0.18)' }} />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: '#FFFFFF', fontWeight: 700 }}>
                <IconActivity size={17} color="#34D399" />
                <span>রিয়েল-টাইম ডিসপ্লে</span>
              </div>
              <div style={{ fontSize: 12, color: '#D1FAE5', marginTop: 2 }}>
                মোবাইলেই চেম্বার আপডেট
              </div>
            </div>
          </div>

          {/* Right Segment: Primary Action Button Only */}
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <button
              onClick={() => setShowLiveSerialModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 9,
                background: '#FFFFFF',
                color: '#065F46',
                border: 'none',
                borderRadius: 99,
                padding: '13px 28px',
                fontSize: 16,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 6px 22px rgba(0, 0, 0, 0.25)',
                transition: 'all 0.25s ease',
                fontFamily: "'Hind Siliguri', sans-serif",
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 10px 28px rgba(0, 0, 0, 0.35)'
                e.currentTarget.style.background = '#F0FDF4'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = '0 6px 22px rgba(0, 0, 0, 0.25)'
                e.currentTarget.style.background = '#FFFFFF'
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#059669',
                  boxShadow: '0 0 8px #10B981',
                  display: 'inline-block',
                  animation: 'livePulseAnim 1.6s infinite ease-in-out'
                }}
              />
              <span>লাইভ সিরিয়াল ট্র্যাক করুন</span>
              <IconArrowRight size={19} stroke={2.5} />
            </button>
          </div>

        </div>
      </Container>

      {/* Quick Live Serial Tracking Modal */}
      <QuickLiveSerialModal
        isOpen={showLiveSerialModal}
        onClose={() => setShowLiveSerialModal(false)}
      />
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

      <ScrollReveal direction="up" distance={28} duration={600} className="d-none d-md-block" style={{ width: '100%' }}>
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

      <ScrollReveal direction="up" distance={28} duration={600} className="d-none d-md-block">
        <TopSpecialtiesSlider specialties={data?.specialties} loading={isLoading} />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600}>
        <TopHospitals hospitals={data?.top_hospitals} loading={isLoading} />
      </ScrollReveal>

      <ScrollReveal direction="up" distance={28} duration={600} className="d-none d-md-block">
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

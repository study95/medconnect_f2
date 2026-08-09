import React, { useRef } from 'react'
import { Container } from 'react-bootstrap'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import { Link, useNavigate } from 'react-router-dom'
import {
  IconChevronLeft,
  IconChevronRight,
  IconTrophy,
  IconStethoscope,
  IconHeart,
  IconBuildingHospital,
  IconShieldCheck,
  IconStar,
  IconArrowRight,
  IconSparkles,
  IconPhoneCall,
  IconCalendarEvent,
  IconEye,
  IconActivity,
  IconAmbulance,
  IconCheck
} from '@tabler/icons-react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

export default function ServiceLeaderboardSlider() {
  const navigate = useNavigate()
  const prevRef = useRef(null)
  const nextRef = useRef(null)

  // ── LEADERBOARD DECLARATION SLIDES ──────────────────────────────────
  const slides = [
    {
      id: 'slide-1',
      badge: 'TOP SERVICE LEADERBOARD #1',
      badgeBg: '#F43F5E',
      gradient: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 45%, #7C3AED 100%)', // Deep Purple / Toffee style like screenshot
      accentColor: '#EC4899',
      title: 'MEDCONNECT SERVICE LEADERBOARD',
      subtitle: 'ডায়াগনস্টিক | ক্লিনিক্যাল | সার্বক্ষণিক অ্যাম্বুলেন্স | টেলিমেডিসিন',
      description: 'সর্বাধিক পঠিত ও সর্বোচ্চ রেটিং প্রাপ্ত সেবা ডিক্লেয়ারেশন। ২০,০০০+ নিবন্ধিত রোগীর প্রথম পছন্দ।',
      features: [
        '১০০% ভেরিফাইড স্পেশালিস্ট',
        'ইনস্ট্যান্ট কনফার্মেশন',
        '২৪/৭ জরুরী হেল্পলাইন'
      ],
      tag: 'সর্বাধিক বুককৃত সেবা',
      phoneBadge: 'লিডারবোর্ড রেটিং ৪.৯★',
      ctaText: 'লিডারবোর্ড দেখুন',
      ctaLink: '/services',
      cardType: 'toffee-showcase',
      ranking: [
        { rank: '1', name: 'ডায়াগনস্টিক ও ল্যাব চেকআপ', count: '১৮,৪৫০+ রোগী' },
        { rank: '2', name: 'হৃদরোগ ও মেডিসিন কনসালটেশন', count: '১৪,২০০+ রোগী' },
        { rank: '3', name: 'মা ও শিশু স্বাস্থ্য সেবা', count: '১১,৮০০+ রোগী' }
      ]
    },
    {
      id: 'slide-2',
      badge: 'MOST POPULAR DOCTORS / সর্বাধিক পঠিত',
      badgeBg: '#10B981',
      gradient: 'linear-gradient(135deg, #064E3B 0%, #047857 50%, #059669 100%)', // Emerald Teal Theme
      accentColor: '#34D399',
      title: 'শীর্ষ স্পেশালিস্ট ডাক্তার লিডারবোর্ড',
      subtitle: 'কার্ডিওলজি | নিউরোলজি | গাইনি ও প্রসূতি | শিশু রোগ',
      description: 'চলতি মাসে সর্বাধিক পঠিত ও অ্যাপয়েন্টমেন্ট নেওয়া শীর্ষ ১০০ বিশেষজ্ঞ চিকিৎসকের তালিকা।',
      features: [
        'বিএমডিসি নিবন্ধিত ডক্টর',
        'সিরিয়ালের নো টেনশন',
        'ডিজিটাল প্রেসক্রিপশন'
      ],
      tag: 'ডক্টর লিডারবোর্ড',
      phoneBadge: '১০০০+ সার্টিফাইড ডাক্তার',
      ctaText: 'ডাক্তারদের তালিকা দেখুন',
      ctaLink: '/doctors',
      cardType: 'doctor-leaderboard',
      ranking: [
        { rank: '1', name: 'ডাঃ মোস্তফা রহমান (হৃদরোগ)', count: '৪,৮৫০+ সিরিয়াল' },
        { rank: '2', name: 'ডাঃ সুলতানা রাজিয়া (গাইনি)', count: '৪,১০০+ সিরিয়াল' },
        { rank: '3', name: 'ডাঃ আহসান হাবীব (মেডিসিন)', count: '৩,৯৫০+ সিরিয়াল' }
      ]
    },
    {
      id: 'slide-3',
      badge: 'EMERGENCY & HOSPITAL LEADERBOARD',
      badgeBg: '#F59E0B',
      gradient: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)', // Midnight Indigo Theme
      accentColor: '#FBBF24',
      title: 'সেরা হাসপাতাল ও জরুরী এ্যাম্বুলেন্স ডিক্লেয়ারেশন',
      subtitle: 'এসি এ্যাম্বুলেন্স | আইসিইউ সাপোর্ট | ইমার্জেন্সি টেস্ট',
      description: 'জরুরী অবস্থায় মাত্র ১৫-৩০ মিনিটের মধ্যে সার্ভিস রেসপন্স। সর্বোচ্চ মানসম্মত হসপিটাল কেয়ার।',
      features: [
        '১৫ মিনিটে অ্যাম্বুলেন্স ট্র্যাকিং',
        'বিশেষায়িত আইসিইউ সার্ভিস',
        '৩৫% পর্যন্ত ছাড় টেস্টে'
      ],
      tag: 'জরুরী সার্ভিস',
      phoneBadge: '২৪/৭ ইমার্জেন্সি রেসপন্স',
      ctaText: 'হাসপাতাল খুঁজুন',
      ctaLink: '/hospitals',
      cardType: 'hospital-showcase',
      ranking: [
        { rank: '1', name: 'স্কয়ার হাসপাতাল ঢাকা', count: '৯.৮/১০ রেটিং' },
        { rank: '2', name: 'এভারকেয়ার হাসপাতাল', count: '৯.৭/১০ রেটিং' },
        { rank: '3', name: 'ল্যাবএইড স্পেশালাইজড', count: '৯.৬/১০ রেটিং' }
      ]
    },
    {
      id: 'slide-4',
      badge: 'HEALTH PACKAGE LEADERBOARD',
      badgeBg: '#06B6D4',
      gradient: 'linear-gradient(135deg, #831843 0%, #9F1239 50%, #BE123C 100%)', // Crimson Ruby Theme
      accentColor: '#FB7185',
      title: 'প্রিমিয়াম ফুল বডি হেলথ চেকআপ লিডারবোর্ড',
      subtitle: 'সম্পূর্ণ পরিবারের স্বাস্থ্য পরীক্ষা | বিশেষ ৪৫% ছাড়',
      description: 'বাড়িতে বসেই ব্লাড স্যাম্পল কালেকশন ও রিপোর্ট ইমেইলে বা হোয়াটসঅ্যাপে পাওয়ার সুবিধা।',
      features: [
        'হোম স্যাম্পল কালেকশন',
        'ফ্রি ডক্টর কনসালটেশন',
        'একই দিনে ডিজিটাল রিপোর্ট'
      ],
      tag: 'প্যাকেজ অফার',
      phoneBadge: '৪৫% বিশেষ ছাড়',
      ctaText: 'প্যাকেজ বুক করুন',
      ctaLink: '/services',
      cardType: 'package-showcase',
      ranking: [
        { rank: '1', name: 'ফুল বডি সুপ্রিম হেলথ চেকআপ', count: '৫০+ প্যারামিটার' },
        { rank: '2', name: 'ডায়াবেটিস ও হার্ট স্পেশাল প্যাকেজ', count: '৩৫+ প্যারামিটার' },
        { rank: '3', name: 'মা ও শিশু সমৃদ্ধি প্যাকেজ', count: '২৫+ প্যারামিটার' }
      ]
    }
  ]

  return (
    <section className="service-leaderboard-section" style={{ padding: '24px 0 28px', position: 'relative', overflow: 'hidden' }}>
      <Container fluid className="px-2 px-md-4">
        
        {/* Section Header with "MOST POPULAR / সর্বাধিক পঠিত" Badge */}
        <div style={{ padding: '0 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            {/* Top Pill Tag */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#D1FAE5', color: '#065F46', fontSize: 13, fontWeight: 800, padding: '6px 16px', borderRadius: 99, boxShadow: '0 2px 8px rgba(6, 95, 70, 0.08)', marginBottom: '8px' }}>
              <IconEye size={18} stroke={2.5} />
              <span>MOST POPULAR / সর্বাধিক পঠিত</span>
            </div>

            {/* Section Title */}
            <h2 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em', fontFamily: "'Hind Siliguri', sans-serif" }}>
              সার্ভিস লিডারবোর্ড ও পপুলার ডিক্লেয়ারেশন
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0', fontWeight: 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
              সর্বাধিক পঠিত ও জনসেবায় শীর্ষে থাকা চিকিৎসা সার্ভিসসমূহ একনজরে
            </p>
          </div>

          {/* View All Button */}
          <Link to="/services" style={{ color: '#00A88C', fontWeight: 800, fontSize: 15, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#F0FDFA', borderRadius: '12px', border: '1px solid #CCFBF1', transition: 'all 0.3s ease' }}>
            <span>সব সেবা দেখুন</span>
            <IconArrowRight size={18} />
          </Link>
        </div>

        {/* ── SWIPER CAROUSEL CONTAINER WITH PEEKING SIDES & OVERLAY NAV ──────────────────────── */}
        <div className="service-leaderboard-wrapper" style={{ position: 'relative' }}>

          {/* Prev Button (Floating over left edge of active slide) */}
          <button
            ref={prevRef}
            className="service-leaderboard-prev-btn"
            aria-label="Previous Slide"
          >
            <IconChevronLeft size={24} stroke={3} />
          </button>

          {/* Next Button (Floating over right edge of active slide) */}
          <button
            ref={nextRef}
            className="service-leaderboard-next-btn"
            aria-label="Next Slide"
          >
            <IconChevronRight size={24} stroke={3} />
          </button>

          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            centeredSlides={true}
            loop={true}
            speed={750}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true
            }}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current
              swiper.params.navigation.nextEl = nextRef.current
            }}
            pagination={{
              clickable: true,
              el: '.service-leaderboard-custom-dots',
            }}
            spaceBetween={16}
            slidesPerView={1.08}
            breakpoints={{
              576: { slidesPerView: 1.15, spaceBetween: 20 },
              768: { slidesPerView: 1.24, spaceBetween: 24 },
              1024: { slidesPerView: 1.32, spaceBetween: 24 },
              1400: { slidesPerView: 1.35, spaceBetween: 28 },
            }}
            className="service-leaderboard-swiper"
          >
            {slides.map((slide) => (
              <SwiperSlide key={slide.id}>
                {({ isActive }) => (
                  <div
                    className={`leaderboard-slide-card ${isActive ? 'is-active' : 'is-peek'}`}
                    style={{
                      background: slide.gradient,
                      borderRadius: 28,
                      position: 'relative',
                      overflow: 'hidden',
                      color: 'white',
                      padding: 'clamp(24px, 4vw, 44px)',
                      boxShadow: isActive ? '0 25px 50px -12px rgba(15, 23, 42, 0.45)' : '0 10px 30px rgba(0,0,0,0.1)',
                      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      minHeight: 380,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {/* Background Decorative Lighting & Geometric Grids */}
                    <div style={{ position: 'absolute', top: '-25%', right: '-10%', width: '450px', height: '450px', borderRadius: '50%', background: `radial-gradient(circle, ${slide.accentColor}35 0%, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

                    {/* Main Banner Grid Content */}
                    <div className="row align-items-center w-100 g-4 m-0" style={{ position: 'relative', zIndex: 2 }}>
                      
                      {/* Left Column: Text & Declaration Details */}
                      <div className="col-12 col-lg-7 p-0 pe-lg-4">
                        {/* Top Header Tag & Sub-badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                          <span style={{ background: slide.badgeBg, color: '#FFFFFF', fontSize: 12, fontWeight: 900, padding: '5px 14px', borderRadius: 99, letterSpacing: '0.04em', textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                            {slide.badge}
                          </span>
                          <span style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', color: '#FFFFFF', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 99, border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                            ★ {slide.phoneBadge}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.25, margin: '0 0 12px 0', letterSpacing: '-0.02em', fontFamily: "'Hind Siliguri', sans-serif" }}>
                          {slide.title}
                        </h3>

                        {/* Subtitle Highlight */}
                        <div style={{ fontSize: 'clamp(14px, 1.8vw, 17px)', fontWeight: 700, color: slide.accentColor, marginBottom: '12px', fontFamily: "'Hind Siliguri', sans-serif" }}>
                          {slide.subtitle}
                        </div>

                        {/* Description */}
                        <p style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.88)', lineHeight: 1.6, margin: '0 0 20px 0', maxWidth: 540, fontFamily: "'Hind Siliguri', sans-serif" }}>
                          {slide.description}
                        </p>

                        {/* Key Features Checkmarks */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                          {slide.features.map((feat, idx) => (
                            <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '6px 12px', borderRadius: '10px', fontSize: 12, fontWeight: 700, border: '1px solid rgba(255,255,255,0.15)' }}>
                              <IconCheck size={14} color={slide.accentColor} stroke={3} />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>

                        {/* CTA Buttons Row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => navigate(slide.ctaLink)}
                            style={{
                              background: 'white',
                              color: '#0F172A',
                              border: 'none',
                              padding: '12px 28px',
                              borderRadius: 14,
                              fontWeight: 900,
                              fontSize: 15,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.transform = 'translateY(-2px)'
                              e.currentTarget.style.boxShadow = '0 14px 30px rgba(0,0,0,0.3)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform = 'none'
                              e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)'
                            }}
                          >
                            <span>{slide.ctaText}</span>
                            <IconArrowRight size={18} stroke={3} />
                          </button>

                          <Link
                            to="/contact"
                            style={{
                              color: '#FFFFFF',
                              textDecoration: 'none',
                              fontSize: 14,
                              fontWeight: 700,
                              padding: '10px 20px',
                              borderRadius: 14,
                              background: 'rgba(255,255,255,0.12)',
                              backdropFilter: 'blur(8px)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <IconPhoneCall size={16} />
                            <span>জরুরী সাহায্য</span>
                          </Link>
                        </div>
                      </div>

                      {/* Right Column: Visual Showcase Card & Leaderboard Rankings (matches phone/poster graphic in screenshot) */}
                      <div className="col-12 col-lg-5 p-0 d-none d-md-block">
                        <div style={{
                          background: 'rgba(15, 23, 42, 0.45)',
                          backdropFilter: 'blur(20px)',
                          borderRadius: 24,
                          padding: '24px',
                          border: '1px solid rgba(255, 255, 255, 0.18)',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                          position: 'relative'
                        }}>
                          {/* Floating Top Badge */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: 32, height: 32, borderRadius: 10, background: slide.accentColor, color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                                <IconTrophy size={18} />
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 900, color: 'white' }}>লিডারবোর্ড র‍্যাঙ্কিং</span>
                            </div>
                            <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.15)', color: slide.accentColor, padding: '3px 10px', borderRadius: 99, fontWeight: 800 }}>
                              LIVE TOP 3
                            </span>
                          </div>

                          {/* Ranking Items */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {slide.ranking.map((item, idx) => (
                              <div key={idx} style={{
                                background: idx === 0 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                                borderRadius: 14,
                                padding: '12px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                border: idx === 0 ? `1px solid ${slide.accentColor}80` : '1px solid rgba(255,255,255,0.08)'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: idx === 0 ? slide.accentColor : idx === 1 ? '#94A3B8' : '#D97706',
                                    color: idx === 0 ? '#0F172A' : '#FFFFFF',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 13, fontWeight: 900
                                  }}>
                                    #{item.rank}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: 'white', fontFamily: "'Hind Siliguri', sans-serif" }}>
                                      {item.name}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                                      {item.count}
                                    </div>
                                  </div>
                                </div>

                                <IconSparkles size={16} color={idx === 0 ? slide.accentColor : 'rgba(255,255,255,0.4)'} />
                              </div>
                            ))}
                          </div>

                          {/* Footer Tag */}
                          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                            ✓ আপডেট করা হয়েছে: প্রতিনিয়ত রিয়েলটাইম ভিউ ও রেটিং সাপেক্ষে
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Dots Pagination Container (matches bottom magenta pill pagination in screenshot) */}
          <div className="service-leaderboard-custom-dots" />

        </div>
      </Container>

      {/* ── CSS STYLES FOR EXACT MATCH WITH SCREENSHOT ──────────────────────────── */}
      <style>{`
        /* Swiper container adjustments */
        .service-leaderboard-swiper {
          padding: 10px 0 44px !important;
          overflow: visible !important;
        }
        
        .service-leaderboard-swiper .swiper-wrapper {
          align-items: center;
        }

        /* Slide state styling: non-active sides peek out with scaled opacity */
        .leaderboard-slide-card.is-peek {
          opacity: 0.72;
          transform: scale(0.95);
          filter: brightness(0.85);
        }

        .leaderboard-slide-card.is-active {
          opacity: 1;
          transform: scale(1);
          filter: brightness(1);
        }

        /* ── Prev / Next Navigation Buttons (Floating over edges) ── */
        .service-leaderboard-prev-btn,
        .service-leaderboard-next-btn {
          position: absolute;
          top: calc(50% - 22px);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #FFFFFF;
          color: #0F172A;
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 25;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .service-leaderboard-prev-btn {
          left: calc(12.5% - 22px);
        }

        .service-leaderboard-next-btn {
          right: calc(12.5% - 22px);
        }

        .service-leaderboard-prev-btn:hover,
        .service-leaderboard-next-btn:hover {
          background: #FFFFFF;
          color: #00A88C;
          transform: scale(1.12);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
        }

        /* ── Custom Dots Pagination (Matches pill indicator in screenshot) ── */
        .service-leaderboard-custom-dots {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          position: absolute;
          bottom: 12px;
          left: 0;
          right: 0;
          z-index: 20;
        }

        .service-leaderboard-custom-dots .swiper-pagination-bullet {
          width: 10px;
          height: 10px;
          background: #CBD5E1;
          opacity: 0.8;
          border-radius: 99px;
          margin: 0 !important;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        /* Active dot expands to wide pill (magenta/vibrant pink accent like Toffee banner) */
        .service-leaderboard-custom-dots .swiper-pagination-bullet-active {
          width: 32px;
          height: 10px;
          background: linear-gradient(90deg, #EC4899 0%, #F43F5E 100%);
          border-radius: 99px;
          opacity: 1;
          box-shadow: 0 2px 8px rgba(236, 72, 153, 0.5);
        }

        /* Responsive overrides for smaller screens */
        @media (max-width: 991px) {
          .service-leaderboard-prev-btn { left: 4px; }
          .service-leaderboard-next-btn { right: 4px; }
        }

        @media (max-width: 575px) {
          .service-leaderboard-section { padding: 16px 0 20px !important; }
          .service-leaderboard-prev-btn, .service-leaderboard-next-btn { display: none !important; }
          .leaderboard-slide-card { border-radius: 20px !important; padding: 20px !important; min-height: auto !important; }
        }
      `}</style>
    </section>
  )
}

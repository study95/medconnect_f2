import React, { useRef } from 'react'
import { Container } from 'react-bootstrap'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import { useNavigate } from 'react-router-dom'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

export default function ImageBannerSlider() {
  const navigate = useNavigate()
  const prevRef = useRef(null)
  const nextRef = useRef(null)

  // ── 6 TO 10 PURE IMAGE BANNERS FOR SLIDE VIEW ──────────────────────────
  const banners = [
    {
      id: 1,
      image: '/images/banner_telemedicine_1786196938449.jpg',
      alt: 'Telemedicine & Doctor Booking Banner',
      link: '/doctors'
    },
    {
      id: 2,
      image: '/images/banner_emergency_1786196953227.jpg',
      alt: 'Emergency Ambulance & Hospitals Banner',
      link: '/hospitals'
    },
    {
      id: 3,
      image: '/images/banner_checkup_1786196968047.jpg',
      alt: 'Full Body Health Checkup & Lab Test Banner',
      link: '/services'
    },
    {
      id: 4,
      image: '/images/banner_mother_child_1786196984755.jpg',
      alt: 'Mother and Child Care Package Banner',
      link: '/services'
    },
    {
      id: 5,
      image: '/images/banner_ai_health_1786197001799.jpg',
      alt: 'AI Health Assistant Banner',
      link: '/contact'
    },
    {
      id: 6,
      image: '/images/banner_health_card_1786197020544.jpg',
      alt: 'Digital Health Card VIP Membership Banner',
      link: '/services'
    },
    {
      id: 7,
      image: '/images/promotion/doctor.png',
      alt: 'Specialist Consultation Banner',
      link: '/doctors'
    },
    {
      id: 8,
      image: '/images/promotion/hospital.png',
      alt: 'Hospital Directory & ICU Banner',
      link: '/hospitals'
    }
  ]

  return (
    <section className="image-banner-slider-section" style={{ padding: '16px 0 24px', position: 'relative', overflow: 'hidden' }}>
      <Container fluid className="px-2 px-md-4">
        
        {/* ── PURE IMAGE SLIDER CONTAINER (NO TEXT DESIGN ABOVE) ──────────────────────── */}
        <div className="image-banner-wrapper" style={{ position: 'relative' }}>

          {/* Floating Prev Arrow Overlay (<) */}
          <button
            ref={prevRef}
            className="image-banner-prev-btn"
            aria-label="Previous Slide"
          >
            <IconChevronLeft size={24} stroke={3} />
          </button>

          {/* Floating Next Arrow Overlay (>) */}
          <button
            ref={nextRef}
            className="image-banner-next-btn"
            aria-label="Next Slide"
          >
            <IconChevronRight size={24} stroke={3} />
          </button>

          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            centeredSlides={true}
            loop={banners.length > 2}
            speed={700}
            autoplay={{
              delay: 4500,
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
              el: '.image-banner-custom-dots',
            }}
            spaceBetween={16}
            slidesPerView={1.08}
            breakpoints={{
              576: { slidesPerView: 1.16, spaceBetween: 20 },
              768: { slidesPerView: 1.25, spaceBetween: 24 },
              1024: { slidesPerView: 1.30, spaceBetween: 24 },
              1400: { slidesPerView: 1.35, spaceBetween: 28 },
            }}
            className="image-banner-swiper"
          >
            {banners.map((item) => (
              <SwiperSlide key={item.id}>
                {({ isActive }) => (
                  <div
                    onClick={() => navigate(item.link)}
                    className={`image-slide-card ${isActive ? 'is-active' : 'is-peek'}`}
                    style={{
                      borderRadius: 26,
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 20px 45px rgba(15, 23, 42, 0.25)' : '0 8px 20px rgba(0,0,0,0.08)',
                      transition: 'all 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
                      aspectRatio: '16 / 6.5',
                      minHeight: 220,
                      background: '#1E293B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {/* Full Banner Image */}
                    <img
                      src={item.image}
                      alt={item.alt}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 0.5s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (isActive) e.currentTarget.style.transform = 'scale(1.03)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                      }}
                    />
                  </div>
                )}
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Bottom Pagination Dots Container */}
          <div className="image-banner-custom-dots" />

        </div>
      </Container>

      {/* ── CSS STYLES FOR EXACT MATCH WITH BANGLALINK / TOFFEE SLIDER SCREENSHOT ──────────────────────────── */}
      <style>{`
        .image-banner-swiper {
          padding: 8px 0 42px !important;
          overflow: visible !important;
        }

        .image-banner-swiper .swiper-wrapper {
          align-items: center;
        }

        /* Slide states: Active center vs peeking left/right slides */
        .image-slide-card.is-peek {
          opacity: 0.72;
          transform: scale(0.95);
          filter: brightness(0.85);
        }

        .image-slide-card.is-active {
          opacity: 1;
          transform: scale(1);
          filter: brightness(1);
        }

        /* Floating Prev / Next Navigation Buttons (< & >) */
        .image-banner-prev-btn,
        .image-banner-next-btn {
          position: absolute;
          top: calc(50% - 22px);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #FFFFFF;
          color: #0F172A;
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 25;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .image-banner-prev-btn {
          left: calc(12.5% - 22px);
        }

        .image-banner-next-btn {
          right: calc(12.5% - 22px);
        }

        .image-banner-prev-btn:hover,
        .image-banner-next-btn:hover {
          background: #FFFFFF;
          color: #00A88C;
          transform: scale(1.12);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3);
        }

        /* Bottom Pill Pagination Dots (Active dot becomes wide pill) */
        .image-banner-custom-dots {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          position: absolute;
          bottom: 10px;
          left: 0;
          right: 0;
          z-index: 20;
        }

        .image-banner-custom-dots .swiper-pagination-bullet {
          width: 10px;
          height: 10px;
          background: #CBD5E1;
          opacity: 0.8;
          border-radius: 99px;
          margin: 0 !important;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .image-banner-custom-dots .swiper-pagination-bullet-active {
          width: 32px;
          height: 10px;
          background: linear-gradient(90deg, #EC4899 0%, #F43F5E 100%);
          border-radius: 99px;
          opacity: 1;
          box-shadow: 0 2px 8px rgba(236, 72, 153, 0.5);
        }

        /* Responsive adjustments */
        @media (max-width: 991px) {
          .image-banner-prev-btn { left: 6px; }
          .image-banner-next-btn { right: 6px; }
          .image-slide-card { aspect-ratio: 16 / 8 !important; min-height: 180px !important; }
        }

        @media (max-width: 575px) {
          .image-banner-slider-section { padding: 10px 0 16px !important; }
          .image-banner-prev-btn, .image-banner-next-btn { display: none !important; }
          .image-slide-card { border-radius: 18px !important; aspect-ratio: 16 / 9 !important; min-height: 160px !important; }
        }
      `}</style>
    </section>
  )
}

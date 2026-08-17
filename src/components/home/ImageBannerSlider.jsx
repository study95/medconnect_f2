import React, { useRef, useState, useEffect } from 'react'
import { Container } from 'react-bootstrap'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay } from 'swiper/modules'
import { useNavigate } from 'react-router-dom'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { getContent } from '../../utils/contentService'
import 'swiper/css'
import 'swiper/css/navigation'

const FALLBACK_BANNERS = [
    { id: 1, image: '/images/banner_telemedicine_1786196938449.jpg', alt: 'Telemedicine & Doctor Booking Banner', link: '/doctors' },
    { id: 2, image: '/images/banner_emergency_1786196953227.jpg', alt: 'Emergency Ambulance & Hospitals Banner', link: '/hospitals' },
    { id: 3, image: '/images/banner_checkup_1786196968047.jpg', alt: 'Full Body Health Checkup & Lab Test Banner', link: '/services' },
    { id: 4, image: '/images/banner_mother_child_1786196984755.jpg', alt: 'Mother and Child Care Package Banner', link: '/services' },
    { id: 5, image: '/images/banner_ai_health_1786197001799.jpg', alt: 'AI Health Assistant Banner', link: '/contact' },
    { id: 6, image: '/images/banner_health_card_1786197020544.jpg', alt: 'Digital Health Card VIP Membership Banner', link: '/services' },
    { id: 7, image: '/images/promotion/doctor.png', alt: 'Specialist Consultation Banner', link: '/doctors' },
    { id: 8, image: '/images/promotion/hospital.png', alt: 'Hospital Directory & ICU Banner', link: '/hospitals' }
]

export default function ImageBannerSlider() {
  const navigate = useNavigate()
  const prevRef = useRef(null)
  const nextRef = useRef(null)

  const [cms, setCms] = useState(getContent())
  useEffect(() => {
    const update = () => setCms(getContent())
    window.addEventListener('cms-updated', update)
    return () => window.removeEventListener('cms-updated', update)
  }, [])

  const banners = (cms.banners?.items && cms.banners.items.length > 0)
    ? cms.banners.items
    : FALLBACK_BANNERS


  return (
    <section className="image-banner-slider-section" style={{ padding: '16px 0 24px', position: 'relative', overflow: 'hidden' }}>
      <Container fluid className="px-2 px-md-4">
        
        <div className="image-banner-wrapper" style={{ position: 'relative' }}>

          <button
            ref={prevRef}
            className="image-banner-prev-btn"
            aria-label="Previous Slide"
          >
            <IconChevronLeft size={24} stroke={3} />
          </button>

          <button
            ref={nextRef}
            className="image-banner-next-btn"
            aria-label="Next Slide"
          >
            <IconChevronRight size={24} stroke={3} />
          </button>

          <Swiper
            modules={[Navigation, Autoplay]}
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
            spaceBetween={0}
            slidesPerView={1}
            breakpoints={{
              576: { slidesPerView: 1.08, spaceBetween: 12 },
              768: { slidesPerView: 1.25, spaceBetween: 16 },
              1024: { slidesPerView: 1.30, spaceBetween: 16 },
              1400: { slidesPerView: 1.35, spaceBetween: 16 },
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
                      borderRadius: 7,
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
                    <img
                      src={item.image}
                      alt={item.alt}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        borderRadius: 7,
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

        </div>
      </Container>

      <style>{`
        .image-banner-swiper {
          padding: 8px 0 12px !important;
          overflow: visible !important;
        }

        .image-banner-swiper .swiper-wrapper {
          align-items: center;
        }

        .image-slide-card {
          border-radius: 7px !important;
        }

        .image-slide-card img {
          border-radius: 7px !important;
        }

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
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 50px;
          border-radius: 10px !important;
          background: #FFFFFF;
          color: #0F172A;
          border: 1.5px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
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
          background: #15803D;
          color: #FFFFFF;
          border-color: #15803D;
          transform: translateY(-50%) scale(1.08);
          box-shadow: 0 12px 28px rgba(21, 128, 61, 0.35);
        }

        @media (max-width: 991px) {
          .image-banner-prev-btn { left: 6px; }
          .image-banner-next-btn { right: 6px; }
          .image-slide-card { aspect-ratio: 16 / 8 !important; min-height: 180px !important; }
        }

        @media (max-width: 575px) {
          .image-banner-slider-section { padding: 6px 0 12px !important; }
          .image-banner-slider-section .container-fluid { padding-left: 0 !important; padding-right: 0 !important; }
          .image-banner-prev-btn, .image-banner-next-btn { display: none !important; }
          .image-slide-card { border-radius: 0 !important; aspect-ratio: 16 / 8.5 !important; min-height: auto !important; }
          .image-slide-card img { border-radius: 0 !important; }
        }
      `}</style>
    </section>
  )
}

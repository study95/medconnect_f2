import React, { useRef, useState, useEffect } from 'react'
import { Container } from 'react-bootstrap'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import { useNavigate } from 'react-router-dom'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { getContent } from '../../utils/contentService'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

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
            <IconChevronLeft size={20} stroke={2.5} />
          </button>

          <button
            ref={nextRef}
            className="image-banner-next-btn"
            aria-label="Next Slide"
          >
            <IconChevronRight size={20} stroke={2.5} />
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
            pagination={{
              clickable: true,
              dynamicBullets: false,
            }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current
              swiper.params.navigation.nextEl = nextRef.current
            }}
            spaceBetween={20}
            slidesPerView={1.08}
            breakpoints={{
              576: { slidesPerView: 1.12, spaceBetween: 16 },
              768: { slidesPerView: 1.18, spaceBetween: 20 },
              992: { slidesPerView: 1.20, spaceBetween: 22 },
              1200: { slidesPerView: 1.22, spaceBetween: 24 },
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
                      borderRadius: 16,
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                      border: '1px solid #E2E8F0',
                      transition: 'all 0.4s ease',
                      aspectRatio: '16 / 6.5',
                      minHeight: 220,
                      background: '#F1F5F9',
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
                        borderRadius: 15,
                        transition: 'transform 0.4s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (isActive) e.currentTarget.style.transform = 'scale(1.015)'
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
          padding: 10px 0 !important;
          overflow: visible !important;
        }

        .image-banner-swiper .swiper-wrapper {
          align-items: center;
        }

        .image-slide-card {
          border-radius: 16px !important;
        }

        .image-slide-card img {
          border-radius: 15px !important;
        }

        .image-slide-card.is-peek {
          opacity: 0.88;
          transform: scale(0.98);
          filter: brightness(0.92);
        }

        .image-slide-card.is-active {
          opacity: 1;
          transform: scale(1);
          filter: brightness(1);
        }

        /* Desktop: hide pagination dots, use navigation arrow buttons */
        .image-banner-swiper .swiper-pagination {
          display: none;
        }

        /* Floating Prev / Next Navigation Buttons (< & >) exactly centered in the image gap line */
        .image-banner-prev-btn,
        .image-banner-next-btn {
          position: absolute;
          top: 50%;
          width: 38px;
          height: 38px;
          border-radius: 8px !important;
          background: #FFFFFF;
          color: #1E293B;
          border: 1px solid #E2E8F0;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 25;
          transition: all 0.2s ease;
        }

        /* Desktop: 1200px+ (slidesPerView: 1.22 -> center seam line at 9.0%) */
        .image-banner-prev-btn {
          left: 9.0%;
          transform: translate(-50%, -50%);
        }

        .image-banner-next-btn {
          right: 9.0%;
          transform: translate(50%, -50%);
        }

        .image-banner-prev-btn:hover,
        .image-banner-next-btn:hover {
          background: #00B875;
          color: #FFFFFF;
          border-color: #00B875;
          box-shadow: 0 6px 18px rgba(0, 184, 117, 0.35);
        }

        /* 992px - 1199px (slidesPerView: 1.20 -> center seam line at 8.3%) */
        @media (max-width: 1199px) and (min-width: 992px) {
          .image-banner-prev-btn { left: 8.3%; }
          .image-banner-next-btn { right: 8.3%; }
        }

        /* 768px - 991px (slidesPerView: 1.18 -> center seam line at 7.6%) */
        @media (max-width: 991px) and (min-width: 768px) {
          .image-banner-prev-btn { left: 7.6%; }
          .image-banner-next-btn { right: 7.6%; }
          .image-slide-card { aspect-ratio: 16 / 8 !important; min-height: 180px !important; }
        }

        /* 576px - 767px (slidesPerView: 1.12 -> center seam line at 5.3%) */
        @media (max-width: 767px) and (min-width: 576px) {
          .image-banner-prev-btn { left: 5.3%; }
          .image-banner-next-btn { right: 5.3%; }
          .image-slide-card { aspect-ratio: 16 / 8.5 !important; min-height: 160px !important; }
        }

        /* Mobile View: Clean Minimalist Indicator Dots directly on image (No dark box) */
        @media (max-width: 767px) {
          .image-banner-swiper .swiper-pagination {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            position: absolute !important;
            bottom: 17px !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            z-index: 20 !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            gap: 6px !important;
          }

          .image-banner-swiper .swiper-pagination-bullet {
            width: 8px !important;
            height: 8px !important;
            background: rgba(255, 255, 255, 0.75) !important;
            opacity: 1 !important;
            border-radius: 50% !important;
            margin: 0 !important;
            cursor: pointer !important;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.45) !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            border: none !important;
          }

          .image-banner-swiper .swiper-pagination-bullet-active {
            background: #00B875 !important;
            width: 22px !important;
            height: 8px !important;
            border-radius: 99px !important;
            box-shadow: 0 2px 8px rgba(0, 184, 117, 0.7), 0 1px 3px rgba(0, 0, 0, 0.4) !important;
          }
        }

        @media (max-width: 575px) {
          .image-banner-slider-section { padding: 6px 0 12px !important; }
          .image-banner-slider-section .container-fluid { padding-left: 0 !important; padding-right: 0 !important; }
          .image-banner-prev-btn, .image-banner-next-btn { display: none !important; }
          .image-slide-card { border-radius: 12px !important; aspect-ratio: 16 / 8.5 !important; min-height: auto !important; }
          .image-slide-card img { border-radius: 11px !important; }
        }
      `}</style>
    </section>
  )
}

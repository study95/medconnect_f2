import React, { memo } from 'react'
import { Container } from 'react-bootstrap'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay } from 'swiper/modules'
import { useNavigate, Link } from 'react-router-dom'
import useHospitals from '../../hooks/useHospitals'
import HospitalCard from '../common/HospitalCard'
import { HospitalCardSkeleton } from '../common/Skeletons'
import { useTranslation } from 'react-i18next'
import { IconChevronLeft, IconChevronRight, IconArrowRight, IconBuildingHospital } from '@tabler/icons-react'

/**
 * TopHospitals — Homepage "Top Hospitals" slider.
 *
 * PERFORMANCE OPTIMIZATION:
 * Before: Called useHospitals() internally → separate API call.
 * After:  Receives data as props from aggregated /api/homepage endpoint.
 *         Falls back to useHospitals() if no props (backward compatibility).
 * React.memo prevents re-renders from parent state changes.
 */
const TopHospitals = memo(function TopHospitals({
  hospitals: propHospitals,
  loading: propLoading,
}) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isBn = i18n.language === 'bn'

  // FALLBACK: If no props provided, fetch independently
  const fallback = useHospitals(
    propHospitals === undefined ? { per_page: 10, top_10: true } : false
  )

  const hospitals = (propHospitals !== undefined ? propHospitals : fallback.hospitals)?.slice(0, 10)
  const loading = propLoading !== undefined ? propLoading : fallback.loading
  const error = propHospitals !== undefined ? null : fallback.error

  if (!loading && (!hospitals || hospitals.length === 0)) {
    return null
  }

  return (
    <section id="top-hospitals-section" style={{ padding: '20px 0 20px', background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '10%', right: '-5%', width: '30%', height: '40%', background: 'rgba(37, 99, 235, 0.02)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: '25%', height: '35%', background: 'rgba(34, 197, 94, 0.03)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <Container>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'nowrap', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#D1FAE5', color: '#065F46', fontSize: 12, fontWeight: 800, padding: '6px 14px', borderRadius: 99, boxShadow: '0 4px 10px rgba(6, 95, 70, 0.05)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <IconBuildingHospital size={16} stroke={2.5} />
            <span>TOP HOSPITALS / শীর্ষ হাসপাতাল</span>
          </div>

          <Link to="/hospitals" style={{ color: '#059669', fontWeight: 800, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            সব দেখুন <IconArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', gap: 24, overflow: 'hidden', padding: '10px 0 40px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ flex: 1, minWidth: 280, maxWidth: 360 }}>
                <HospitalCardSkeleton />
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: 24, padding: '48px', textAlign: 'center', color: '#991B1B' }}>
            <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{isBn ? 'লোডিং সমস্যা হয়েছে' : 'Failed to load hospitals'}</p>
            <p style={{ fontSize: 14, margin: 0 }}>{error}</p>
          </div>
        ) : (
          <>
            {/* Desktop Swiper Slider */}
            <div className="top-hospitals-desktop-carousel">
              <Swiper
                modules={[Autoplay]}
                autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                spaceBetween={24} slidesPerView={1} loop={hospitals.length > 3}
                breakpoints={{ 576: { slidesPerView: 1.5 }, 768: { slidesPerView: 2 }, 1024: { slidesPerView: 2.5 }, 1280: { slidesPerView: 3 } }}
                style={{ padding: '16px 8px 48px', margin: '0 -8px' }} className="top-hospitals-swiper"
              >
                {hospitals.map((hospital, index) => (
                  <SwiperSlide key={hospital.id || index} style={{ height: 'auto' }}>
                    <div style={{ height: '100%', position: 'relative' }}>
                      <HospitalCard hospital={hospital} index={index} />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Mobile Native Horizontal Scroll Container */}
            <div className="top-hospitals-mobile-scroll">
              {hospitals.map((hospital, index) => (
                <div key={hospital.id || index} className="top-hospitals-mobile-card-wrapper">
                  <div style={{ height: '100%', position: 'relative' }}>
                    <HospitalCard hospital={hospital} index={index} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Container>

      <style>{`
        /* Desktop/Mobile toggles */
        .top-hospitals-desktop-carousel {
          display: block;
        }
        .top-hospitals-mobile-scroll {
          display: none;
        }

        @media (max-width: 767px) {
          .top-hospitals-desktop-carousel {
            display: none !important;
          }
          .top-hospitals-mobile-scroll {
            display: flex !important;
            overflow-x: auto !important;
            scroll-behavior: smooth !important;
            -webkit-overflow-scrolling: touch !important;
            gap: 16px !important;
            padding: 8px 16px 24px 16px !important;
            margin: 0 -16px !important;
            scrollbar-width: none !important;
          }
          .top-hospitals-mobile-scroll::-webkit-scrollbar {
            display: none !important;
          }
          .top-hospitals-mobile-card-wrapper {
            flex: 0 0 82% !important;
            min-width: 270px !important;
            max-width: 320px !important;
          }
          #top-hospitals-section {
            border-top: 1.5px dashed #CBD5E1 !important;
          }
        }
      `}</style>
    </section>
  )
})

export default TopHospitals

import React, { memo } from 'react'
import { Container } from 'react-bootstrap'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay } from 'swiper/modules'
import { useNavigate, Link } from 'react-router-dom'
import useDoctors from '../../hooks/useDoctors'
import DoctorCard from '../common/DoctorCard'
import { DoctorCardSkeleton } from '../common/Skeletons'
import { useTranslation } from 'react-i18next'
import { IconChevronLeft, IconChevronRight, IconArrowRight, IconEye } from '@tabler/icons-react'

/**
 * MostViewedDoctors — Homepage "Most Viewed" doctor slider.
 *
 * PERFORMANCE OPTIMIZATION:
 * Before: This component called useDoctors() internally → separate API call.
 * After:  Receives data as props from the aggregated /api/homepage endpoint.
 *         Falls back to useDoctors() if no props (backward compatibility).
 *
 * React.memo prevents re-renders when unrelated parent state changes.
 */
const MostViewedDoctors = memo(function MostViewedDoctors({
  doctors: propDoctors,
  loading: propLoading,
}) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  // FALLBACK: If no props provided (e.g., used standalone), fetch independently
  const fallback = useDoctors(
    propDoctors === undefined ? { per_page: 10, top_10: true } : false
  )

  const doctors = (propDoctors !== undefined ? propDoctors : fallback.doctors)?.slice(0, 10)
  const loading = propLoading !== undefined ? propLoading : fallback.loading
  const error = propDoctors !== undefined ? null : fallback.error

  if (!loading && (!doctors || doctors.length === 0)) {
    return null
  }

  return (
    <section style={{ padding: '20px 0 20px', background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '10%', left: '-5%', width: '30%', height: '40%', background: 'rgba(34, 197, 94, 0.03)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '25%', height: '35%', background: 'rgba(37, 99, 235, 0.02)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <Container>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'nowrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#D1FAE5', color: '#065F46', fontSize: 12, fontWeight: 800, padding: '6px 14px', borderRadius: 99, boxShadow: '0 4px 10px rgba(6, 95, 70, 0.05)', whiteSpace: 'nowrap' }}>
            <IconEye size={16} stroke={2.5} />
            <span>MOST POPULAR / সর্বাধিক পঠিত</span>
          </div>

          <Link to="/doctors" style={{ color: '#059669', fontWeight: 800, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            সব দেখুন <IconArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', gap: 24, overflow: 'hidden', padding: '10px 0 40px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ flex: 1, minWidth: 280, maxWidth: 360 }}>
                <DoctorCardSkeleton />
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: 24, padding: '48px', textAlign: 'center', color: '#991B1B' }}>
            <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>লোডিং সমস্যা হয়েছে</p>
            <p style={{ fontSize: 14, margin: 0 }}>{error}</p>
          </div>
        ) : (
          <>
            {/* Desktop Swiper Slider */}
            <div className="most-viewed-desktop-carousel">
              <Swiper
                modules={[Autoplay]}
                autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                spaceBetween={24} slidesPerView={1} loop={doctors.length > 3}
                breakpoints={{ 576: { slidesPerView: 1.5 }, 768: { slidesPerView: 2 }, 1024: { slidesPerView: 2.5 }, 1280: { slidesPerView: 3 } }}
                style={{ padding: '16px 8px 16px', margin: '0 -8px' }} className="most-viewed-swiper"
              >
                {doctors.map((doctor, index) => (
                  <SwiperSlide key={doctor.id || index} style={{ height: 'auto' }}>
                    <DoctorCard doctor={doctor} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Mobile Native Horizontal Scroll Container */}
            <div className="most-viewed-mobile-scroll">
              {doctors.map((doctor, index) => (
                <div key={doctor.id || index} className="most-viewed-mobile-card-wrapper">
                  <DoctorCard doctor={doctor} />
                </div>
              ))}
            </div>
          </>
        )}
      </Container>

      <style>{`
        /* Desktop/Mobile toggles */
        .most-viewed-desktop-carousel {
          display: block;
        }
        .most-viewed-mobile-scroll {
          display: none;
        }

        @media (max-width: 767px) {
          .most-viewed-desktop-carousel {
            display: none !important;
          }
          .most-viewed-mobile-scroll {
            display: flex !important;
            overflow-x: auto !important;
            scroll-behavior: smooth !important;
            -webkit-overflow-scrolling: touch !important;
            gap: 16px !important;
            padding: 8px 16px 12px 16px !important;
            margin: 0 -16px !important;
            scrollbar-width: none !important;
          }
          .most-viewed-mobile-scroll::-webkit-scrollbar {
            display: none !important;
          }
          .most-viewed-mobile-card-wrapper {
            flex: 0 0 82% !important;
            min-width: 270px !important;
            max-width: 320px !important;
          }
          .most-viewed-header-container {
            margin-bottom: 24px !important;
          }
          .most-viewed-badge {
            font-size: 9px !important;
            padding: 4px 10px !important;
            margin-bottom: 8px !important;
          }
          .most-viewed-badge-icon {
            width: 12px !important;
            height: 12px !important;
          }
          .most-viewed-title-row {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
          }
          .most-viewed-title {
            font-size: 20px !important;
            margin: 0 !important;
            line-height: 1.2 !important;
          }
          .most-viewed-mobile-link {
            display: inline-flex !important;
          }
          .most-viewed-desc {
            display: none !important;
          }
          .most-viewed-actions-desktop {
            display: none !important;
          }
        }
      `}</style>
    </section>
  )
})

export default MostViewedDoctors

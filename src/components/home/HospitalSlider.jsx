// WHY SWIPER?
// Swiper is the best free slider library for React.
// It handles touch/swipe on mobile automatically,
// has smooth CSS transitions, and is very lightweight.
//
// HOW IT WORKS HERE:
// - Fetches hospitals from API
// - Shows each hospital as a slide with image + text overlay
// - Auto-plays, loops, shows navigation arrows

import { Container } from 'react-bootstrap'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import { useNavigate } from 'react-router-dom'
import useHospitals from '../../hooks/useHospitals'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../context/ThemeContext'
import { translateMetadata } from '../../utils/translationUtils'



// Hospital background images (place these in /public/images/hospitals/)
const HOSPITAL_IMAGES = [
  '/images/hospitals/hospital-1.jpg',
  '/images/hospitals/hospital-2.jpg',
  '/images/hospitals/hospital-3.jpg',
  '/images/hospitals/hospital-4.jpg',
  '/images/hospitals/hospital-5.jpg',
]

// Fallback gradient colors if image is missing
const FALLBACK_COLORS = [
  'linear-gradient(135deg, #00A88C, #008a74)',
  'linear-gradient(135deg, #00C9A7, #008a74)',
  'linear-gradient(135deg, #7C3AED, #5B21B6)',
  'linear-gradient(135deg, #DB2777, #9D174D)',
  'linear-gradient(135deg, #D97706, #B45309)',
]

function HospitalSlider() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const { theme } = useTheme()

  const { hospitals, loading } = useHospitals({ per_page: 6 })

  if (loading || hospitals.length === 0) return null

  return (
    <section style={{ padding: '100px 0', background: 'var(--mc-white)', borderTop: '1px solid var(--mc-border)', position: 'relative' }}>

      <Container>
        {/* Elite Section Header */}
        <div className="text-center mb-5">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--mc-primary-light)', color: '#00A88C', fontSize: 11, fontWeight: 900,
            padding: '6px 16px', borderRadius: 99, marginBottom: 16, border: '1px solid var(--mc-border)',
            textTransform: 'uppercase', letterSpacing: '0.1em'
          }}>
            🏢 {t('global_network')}
          </div>
          <h2 style={{ fontWeight: 950, fontSize: 'clamp(28px, 4vw, 42px)', color: 'var(--mc-text)', letterSpacing: '-1.5px', marginBottom: 12 }}>
            {t('partner')} <span style={{ color: '#00A88C' }}>{t('medical_centers')}</span>
          </h2>
          <p style={{ color: 'var(--mc-text-muted)', fontSize: 16, fontWeight: 500, maxWidth: 500, margin: '0 auto' }}>
            {t('hospital_slider_desc')}
          </p>

        </div>

        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={28}
          slidesPerView={1}
          navigation={true}
          pagination={{ clickable: true }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          loop={hospitals.length > 3}
          breakpoints={{
            576:  { slidesPerView: 2 },
            992:  { slidesPerView: 3 },
            1200: { slidesPerView: 4 },
          }}
          style={{ paddingBottom: 60 }}
        >
          {hospitals.map((hospital, index) => (
            <SwiperSlide key={hospital.id}>
              <div
                onClick={() => navigate('/hospitals')}
                style={{
                  borderRadius: 24, overflow: 'hidden',
                  cursor: 'pointer', position: 'relative',
                  height: 260,
                  boxShadow: 'var(--mc-shadow)',
                  border: '1px solid var(--mc-border)',
                  background: 'var(--mc-white)',
                  transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)'
                }}

                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 25px 60px rgba(0,168,140,0.12)'
                  e.currentTarget.style.borderColor = '#00A88C20'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.04)'
                  e.currentTarget.style.borderColor = '#E5EAF2'
                }}
              >
                <img
                  src={HOSPITAL_IMAGES[index % HOSPITAL_IMAGES.length]}
                  alt={hospital.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                
                {/* ADVANCED GLASS OVERLAY */}
                <div style={{
                  position: 'absolute', bottom: 12, left: 12, right: 12,
                  background: 'var(--mc-white)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 16, padding: '16px',
                  border: '1px solid var(--mc-border)',
                  boxShadow: 'var(--mc-shadow)'
                }}>

                  <h6 style={{ color: 'var(--mc-text)', fontWeight: 900, marginBottom: 4, fontSize: 13, textTransform: 'uppercase' }}>
                    {hospital.name}
                  </h6>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12 }}>📍</span>
                    <p style={{ color: 'var(--mc-text-muted)', fontSize: 11, margin: 0, fontWeight: 700 }}>
                      {translateMetadata(hospital.address || 'Dhaka, Bangladesh', language, t)}
                    </p>

                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="text-center">
          <button
            onClick={() => navigate('/hospitals')}
            style={{
              padding: '14px 40px', borderRadius: 14,
              border: 'none', background: 'var(--mc-primary)',
              color: 'white', fontWeight: 800, fontSize: 13,
              cursor: 'pointer', transition: '0.3s',
              letterSpacing: '0.05em', boxShadow: 'var(--mc-shadow)'
            }}

            onMouseEnter={(e) => e.target.style.background = '#00A88C'}
            onMouseLeave={(e) => e.target.style.background = '#1A1D2E'}
          >
            {t('discover_all_centers')} →
          </button>

        </div>
      </Container>
    </section>
  )
}

export default HospitalSlider

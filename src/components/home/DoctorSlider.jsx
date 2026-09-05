// Shows first 8 doctors in a Swiper slider.
// "More Doctors" button navigates to the full DoctorsPage.

import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import { useNavigate } from 'react-router-dom'
import { getDoctors } from '../../api/doctorApi'
import DoctorCard from '../common/DoctorCard'
import { useTranslation } from 'react-i18next'


function DoctorSlider() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { t } = useTranslation()


  useEffect(() => {
    // Fetch first 6 doctors for the slider (per_page=6)
    getDoctors({ per_page: 6 })
      .then((res) => {
        const data = res.data?.data || res.data || []
        setDoctors(Array.isArray(data) ? data : [])
      })
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <section style={{ padding: '70px 0', background: 'var(--mc-bg)' }}>
      <Container>
        <div className="text-center mb-5">
          <span className="section-tag">{t('our_doctors')}</span>
          <h2 className="section-title" style={{ color: 'var(--mc-text)' }}>{t('top_specialists')}</h2>
          <p className="section-subtitle" style={{ color: 'var(--mc-text-muted)' }}>{t('top_specialists_desc')}</p>
        </div>
        <div className="d-flex gap-4 placeholder-glow overflow-hidden">
          {[1,2,3,4].map(k => (
            <div key={k} style={{ 
              flex: 1, minWidth: 260, height: 350, 
              background: 'white', borderRadius: 24, 
              border: '1px solid var(--mc-border)', padding: 20 
            }}>
              <span className="placeholder" style={{ width: '100%', height: 180, borderRadius: 16, marginBottom: 16, display: 'block' }}></span>
              <span className="placeholder col-8" style={{ height: 20, marginBottom: 8, display: 'block' }}></span>
              <span className="placeholder col-5" style={{ height: 16, marginBottom: 20, display: 'block' }}></span>
              <div className="d-flex gap-2">
                <span className="placeholder col-4" style={{ height: 30, borderRadius: 8 }}></span>
                <span className="placeholder col-4" style={{ height: 30, borderRadius: 8 }}></span>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )

  if (doctors.length === 0) return null

  return (
    <section style={{ padding: '70px 0', background: 'var(--mc-bg)' }}>

      <Container>
        {/* Section header */}
        <div className="text-center mb-5">
          <span className="section-tag">{t('our_doctors')}</span>
          <h2 className="section-title" style={{ color: 'var(--mc-text)' }}>{t('top_specialists')}</h2>

          <p className="section-subtitle" style={{ color: 'var(--mc-text-muted)' }}>
            {t('top_specialists_desc')}
          </p>
        </div>


        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={20}
          slidesPerView={1}
          navigation={true}
          pagination={{ clickable: true }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          loop={doctors.length > 3}
          breakpoints={{
            576: { slidesPerView: 1 },
            640: { slidesPerView: 2 },
            768: { slidesPerView: 2 },
            992: { slidesPerView: 3 },
            1200: { slidesPerView: 3 },
          }}
          className="premium-slider"
        >
          {doctors.map((doctor) => (
            <SwiperSlide key={doctor.id} style={{ height: 'auto' }}>
              <div style={{ height: '100%', padding: '10px 5px' }}>
                <DoctorCard doctor={doctor} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* More Doctors button */}
        <div className="text-center mt-2">
          <button
            onClick={() => navigate('/doctors')}
            style={{
              padding: '12px 36px', borderRadius: 10,
              background: '#00A88C', border: 'none',
              color: 'white', fontWeight: 700, fontSize: 15,
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 16px rgba(0,168,140,0.25)',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#008a74'
              e.target.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#00A88C'
              e.target.style.transform = 'translateY(0)'
            }}
          >
            {t('view_all_doctors')} →
          </button>

        </div>
      </Container>
    </section>
  )
}

export default DoctorSlider

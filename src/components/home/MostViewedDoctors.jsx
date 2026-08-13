import React, { memo, useRef } from 'react'
import { Container } from 'react-bootstrap'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay, EffectFade } from 'swiper/modules'
import { useNavigate } from 'react-router-dom'
import useDoctors from '../../hooks/useDoctors'
import DoctorCard from '../common/DoctorCard'
import { DoctorCardSkeleton } from '../common/Skeletons'
import { useTranslation } from 'react-i18next'
import {
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconCalendarEvent,
  IconHeart,
  IconStethoscope,
  IconBuildingHospital,
  IconMapPin,
  IconClock,
  IconShieldCheck
} from '@tabler/icons-react'
import { useFavorites } from '../../context/FavoritesContext'
import { getMediaUrl } from '../../utils/mediaUtils'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/effect-fade'

/**
 * DoctorBannerCard — Showcase Banner Card matching HospitalBannerCard design for mobile/banner slider
 */
function DoctorBannerCard({ doctor }) {
  const navigate = useNavigate()
  const { isDoctorFavorite, toggleFavoriteDoctor } = useFavorites()
  const isFavorite = isDoctorFavorite ? isDoctorFavorite(doctor?.id) : false

  const photo = doctor?.photo_url
    ? getMediaUrl(doctor.photo_url)
    : doctor?.image || doctor?.photo || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1200&q=80'

  const specialtyName = doctor?.specialty?.name || doctor?.specialty_name || 'বিশেষজ্ঞ ডাক্তার'
  const mainName = doctor?.name || 'Dr. Ahasan Habib'
  const degrees = doctor?.degree || doctor?.degrees || 'MBBS, FCPS'
  const hospitalName = doctor?.hospitals?.[0]?.name || doctor?.hospital_name || doctor?.working_in || 'পপুলার ডায়াগনস্টিক সেন্টার'
  const locationText = doctor?.district?.name_bn || doctor?.district?.name || doctor?.address || 'ঢাকা'
  const experienceText = doctor?.experience ? `${doctor.experience} বছর অভিজ্ঞতা` : '১০ বছর অভিজ্ঞতা'
  const feeText = doctor?.fee ? `৳${doctor.fee} ফি` : '৳১০০০ ফি'

  return (
    <div
      onClick={() => navigate(`/doctors/${doctor?.id}`)}
      className="doc-banner-card"
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
        background: '#FFFFFF',
        boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
        minHeight: 310,
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#00B875'
        e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 184, 117, 0.12)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#E2E8F0'
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.06)'
      }}
    >
      {/* Background Image */}
      <div
        className="doc-banner-bg-img"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '68%',
          backgroundImage: `url('${photo}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          zIndex: 1
        }}
      />

      {/* Left White Gradient Overlay */}
      <div
        className="doc-banner-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          background: 'linear-gradient(90deg, #FFFFFF 0%, rgba(255, 255, 255, 0.98) 45%, rgba(255, 255, 255, 0.68) 70%, transparent 100%)',
          zIndex: 2
        }}
      />

      {/* Floating Favorite Heart Icon Top Right */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          if (toggleFavoriteDoctor) toggleFavoriteDoctor(doctor)
        }}
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 10,
          background: '#FFFFFF',
          border: 'none',
          borderRadius: 10,
          width: 38,
          height: 38,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title="পছন্দের তালিকায় রাখুন"
      >
        <IconHeart size={20} fill={isFavorite ? '#EF4444' : 'none'} color={isFavorite ? '#EF4444' : '#F43F5E'} />
      </button>

      {/* Banner Content Container */}
      <div
        className="doc-banner-content"
        style={{
          position: 'relative',
          zIndex: 3,
          padding: '24px 28px',
          maxWidth: '600px',
          width: '100%'
        }}
      >
        {/* Top Tagline Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          border: '1.5px solid #00B875',
          borderRadius: 99,
          padding: '4px 14px',
          background: '#F0FDF4',
          color: '#00B875',
          fontSize: 12.5,
          fontWeight: 700,
          marginBottom: 12,
          fontFamily: "'Hind Siliguri', sans-serif"
        }}>
          <IconStethoscope size={16} color="#00B875" />
          <span>{specialtyName}</span>
        </div>

        {/* Doctor Main Name */}
        <h3 className="doc-title-h3" style={{
          fontSize: 'clamp(22px, 2.8vw, 36px)',
          fontWeight: 900,
          color: '#0F172A',
          lineHeight: 1.15,
          margin: '0 0 4px 0',
          fontFamily: "'Hind Siliguri', sans-serif"
        }}>
          {mainName}
        </h3>

        {/* Doctor Degrees */}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#00B875', marginBottom: 12, fontFamily: "'Hind Siliguri', sans-serif" }}>
          {degrees}
        </div>

        {/* Pulse ECG Line Divider & Subtitle */}
        <div className="doc-subtitle-row" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ height: 1, background: '#E2E8F0', flex: 1, maxWidth: 160, position: 'relative' }}>
            <div style={{ position: 'absolute', top: -7, right: 0, width: 24, height: 16, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="12" viewBox="0 0 24 14" fill="none">
                <path d="M0 7H4L7 1L10 13L14 3L17 9L19 7H24" stroke="#00B875" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 600, fontFamily: "'Hind Siliguri', sans-serif" }}>
            অভিজ্ঞ ও বিশ্বস্ত চিকিৎসা সেবায় সর্বদা নিয়োজিত
          </span>
        </div>

        {/* Hospital & Location Pills */}
        <div className="doc-pills-col" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          <div className="doc-pill-item" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            padding: '6px 14px',
            width: 'fit-content',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <IconBuildingHospital size={17} color="#00B875" />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#334155', fontFamily: "'Hind Siliguri', sans-serif" }}>
              {hospitalName}
            </span>
          </div>

          <div className="doc-pill-item" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            padding: '6px 14px',
            width: 'fit-content',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <IconMapPin size={17} color="#00B875" />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#334155', fontFamily: "'Hind Siliguri', sans-serif" }}>
              {locationText} • {experienceText} • {feeText}
            </span>
          </div>
        </div>

        {/* Action Buttons Row (2 buttons strictly in 1 row) */}
        <div className="doc-buttons-row" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          width: '100%',
          marginTop: 14
        }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/doctors/${doctor?.id}`)
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              borderRadius: 8,
              padding: '10px 8px',
              fontSize: 13,
              fontWeight: 700,
              color: '#0F172A',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              width: '100%',
              transition: 'all 0.2s ease',
              fontFamily: "'Hind Siliguri', sans-serif"
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#00B875'; e.currentTarget.style.color = '#00B875' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#0F172A' }}
          >
            <IconEye size={16} />
            <span>বিস্তারিত দেখুন</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/doctors/${doctor?.id}`)
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: '#00B875',
              border: 'none',
              borderRadius: 8,
              padding: '10px 8px',
              fontSize: 13,
              fontWeight: 800,
              color: '#FFFFFF',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              width: '100%',
              boxShadow: '0 4px 14px rgba(0, 184, 117, 0.3)',
              transition: 'all 0.2s ease',
              fontFamily: "'Hind Siliguri', sans-serif"
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#009E64'}
            onMouseLeave={e => e.currentTarget.style.background = '#00B875'}
          >
            <IconCalendarEvent size={16} color="#FFFFFF" />
            <span>অ্যাপয়েন্টমেন্ট নিন</span>
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * MostViewedDoctors — Homepage "Most Popular Doctors" Section
 */
const MostViewedDoctors = memo(function MostViewedDoctors({
  doctors: propDoctors,
  loading: propLoading,
}) {
  const navigate = useNavigate()
  const prevRef = useRef(null)
  const nextRef = useRef(null)

  // FALLBACK: If no props provided, fetch independently
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
    <section id="most-viewed-doctors-section" style={{ padding: '16px 0 28px', background: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
      <Container>
        {/* Header with Navigation Arrows */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', gap: '12px', flexWrap: 'nowrap', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#D1FAE5', color: '#00B875', fontSize: 12, fontWeight: 800, padding: '6px 14px', borderRadius: 99, boxShadow: '0 4px 10px rgba(0, 184, 117, 0.08)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <IconEye size={16} stroke={2.5} color="#00B875" />
            <span>MOST POPULAR / সর্বাধিক পঠিত</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Slider Prev / Next Arrows */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                ref={prevRef}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00B875'; e.currentTarget.style.color = '#00B875' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#0F172A' }}
                title="আগের ডাক্তার"
              >
                <IconChevronLeft size={20} />
              </button>
              <button
                ref={nextRef}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00B875'; e.currentTarget.style.color = '#00B875' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#0F172A' }}
                title="পরের ডাক্তার"
              >
                <IconChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', gap: 24, overflow: 'hidden', padding: '10px 0 40px' }}>
            {[1, 2].map(i => (
              <div key={i} style={{ flex: 1, minWidth: 280 }}>
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
          <Swiper
            modules={[Navigation, Autoplay, EffectFade]}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            speed={950}
            autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
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
            loop={doctors.length > 1}
            style={{ padding: '8px 0 16px' }}
            className="most-viewed-banner-swiper"
          >
            {doctors.map((doctor, index) => (
              <SwiperSlide key={doctor.id || index}>
                <DoctorBannerCard doctor={doctor} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </Container>

      <style>{`
        /* Doctor Banner Content Mobile View Overrides */
        @media (max-width: 767px) {
          .doc-banner-card {
            min-height: 430px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-end !important;
          }
          .doc-banner-bg-img {
            width: 100% !important;
            height: 100% !important;
            opacity: 1 !important;
          }
          .doc-banner-overlay {
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.78) 45%, #FFFFFF 85%) !important;
          }
          .doc-banner-content {
            padding: 20px 16px 24px !important;
            max-width: 100% !important;
          }
          .doc-title-h3 {
            font-size: 22px !important;
            margin-bottom: 4px !important;
          }
          .doc-subtitle-row {
            margin-bottom: 12px !important;
          }
          .doc-pills-col {
            flex-direction: row !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
            margin-bottom: 16px !important;
          }
          .doc-pill-item {
            padding: 4px 10px !important;
            font-size: 12px !important;
          }
          .doc-buttons-row {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .doc-buttons-row button {
            width: 100% !important;
            padding: 10px 4px !important;
            font-size: 12px !important;
            justify-content: center !important;
          }
        }
      `}</style>
    </section>
  )
})

export default MostViewedDoctors

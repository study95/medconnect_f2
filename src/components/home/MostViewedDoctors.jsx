import React, { memo, useRef } from 'react'
import { Container } from 'react-bootstrap'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay, EffectFade } from 'swiper/modules'
import { useNavigate } from 'react-router-dom'
import { getDoctorUrl, getBookingUrl } from '../../utils/identifierHelper'
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
  IconShieldCheck,
  IconStarFilled
} from '@tabler/icons-react'
import { useFavorites } from '../../context/FavoritesContext'
import { getMediaUrl } from '../../utils/mediaUtils'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/effect-fade'

// Helper: Convert English digits to Bengali digits
const toBnNumber = (n) => {
  if (n === null || n === undefined) return '০'
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(n).replace(/\d/g, (d) => bnDigits[Number(d)] ?? d)
}

const getDoctorSpecialtyTitle = (doc) => {
  return doc?.specialty?.name_bn || doc?.specialty?.name || doc?.specialty_name || doc?.department || 'বিশেষজ্ঞ ডাক্তার'
}

const getDoctorHospitalTitle = (doc) => {
  const hName = doc?.hospitals?.[0]?.name_bn || doc?.hospitals?.[0]?.name || doc?.hospital?.name_bn || doc?.hospital?.name || doc?.hospital_name || doc?.working_in || ''
  const dist = doc?.district?.name_bn || doc?.district?.name || doc?.city || ''
  if (hName && dist) return `${hName}, ${dist}`
  return hName || dist || 'বাংলাদেশ'
}

const getDoctorRating = (doc) => {
  const r = Number(doc?.rating_avg || doc?.rating || doc?.avg_rating || 5)
  return (r > 0 ? r : 5).toFixed(1)
}

const getDoctorReviewsCount = (doc) => {
  const c = Number(doc?.review_count || doc?.reviews_count || doc?.total_reviews || 0)
  return c > 0 ? c : 1
}

/**
 * DoctorBannerCard — Showcase Banner Card matching HospitalBannerCard design for mobile/banner slider
 */
function DoctorBannerCard({ doctor }) {
  const navigate = useNavigate()
  const { isDoctorFavorite, toggleFavoriteDoctor } = useFavorites()
  const isFavorite = isDoctorFavorite ? isDoctorFavorite(doctor?.id) : false

  const photo = getMediaUrl(doctor?.photo || doctor?.photo_url || doctor?.image || doctor?.avatar, 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1200&q=80')

  const specialtyName = doctor?.specialty?.name || doctor?.specialty_name || 'বিশেষজ্ঞ ডাক্তার'
  const mainName = doctor?.name || 'Dr. Ahasan Habib'
  const degrees = doctor?.degree || doctor?.degrees || 'MBBS, FCPS'
  const hospitalName = doctor?.hospitals?.[0]?.name || doctor?.hospital_name || doctor?.working_in || 'পপুলার ডায়াগনস্টিক সেন্টার'
  const locationText = doctor?.district?.name_bn || doctor?.district?.name || doctor?.address || 'ঢাকা'
  const experienceText = doctor?.experience ? `${doctor.experience} বছর অভিজ্ঞতা` : '১০ বছর অভিজ্ঞতা'
  const feeText = doctor?.fee ? `৳${doctor.fee} ফি` : '৳১০০০ ফি'

  return (
    <div
      onClick={() => navigate(getDoctorUrl(doctor))}
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
      {/* Right Side Doctor Photo Container */}
      <div
        className="doc-banner-photo-wrap"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '38%',
          minWidth: '280px',
          maxWidth: '420px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          overflow: 'hidden',
          zIndex: 1
        }}
      >
        <img
          src={photo}
          alt={mainName}
          className="doc-banner-photo-img"
          loading="lazy"
          decoding="async"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 12%',
            display: 'block'
          }}
        />

        {/* Subtle Left Fade Gradient — Blends smoothly into the card without obscuring the face */}
        <div
          className="doc-banner-left-fade"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '80px',
            background: 'linear-gradient(90deg, #FFFFFF 0%, rgba(255, 255, 255, 0.4) 40%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 2
          }}
        />
      </div>

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
          maxWidth: '620px',
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
              navigate(getDoctorUrl(doctor))
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
              navigate(getBookingUrl(doctor))
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
  const { isDoctorFavorite, toggleFavoriteDoctor } = useFavorites()

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
      {/* ── Mobile Layout (< 768px): Matching "আজ যেসব ডাক্তার বসবেন" Design ── */}
      <div className="most-viewed-mobile-wrapper">
        <div className="most-viewed-mobile-header">
          <h3 className="most-viewed-mobile-title">সর্বাধিক পঠিত ডাক্তার</h3>
          <button
            type="button"
            className="most-viewed-mobile-all-link"
            onClick={() => navigate('/doctors?top_10=1')}
          >
            <span>সব দেখুন</span>
            <span className="most-viewed-mobile-all-arrow">→</span>
          </button>
        </div>

        {loading ? (
          <div className="most-viewed-mobile-scroll">
            {[1, 2, 3].map((n) => (
              <div key={n} className="most-viewed-mobile-card" style={{ opacity: 0.7 }}>
                <div style={{ width: 76, height: 76, borderRadius: '50%', background: '#E2E8F0', marginBottom: 12 }} />
                <div style={{ width: '80%', height: 16, background: '#E2E8F0', borderRadius: 4, marginBottom: 6 }} />
                <div style={{ width: '60%', height: 12, background: '#F1F5F9', borderRadius: 4, marginBottom: 6 }} />
                <div style={{ width: '70%', height: 12, background: '#F1F5F9', borderRadius: 4, marginBottom: 10 }} />
                <div style={{ width: '100%', height: 38, borderRadius: 999, background: '#E2E8F0', marginTop: 'auto' }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: 16, padding: '20px', textAlign: 'center', color: '#991B1B', margin: '0 4px' }}>
            <p style={{ fontSize: 13, margin: 0 }}>ডাক্তারদের তথ্য লোড করা সম্ভব হয়নি</p>
          </div>
        ) : (
          <div className="most-viewed-mobile-scroll">
            {doctors.map((doc) => {
              const isFav = isDoctorFavorite ? isDoctorFavorite(doc.id) : false
              const photo = doc.photo || doc.photo_url || doc.image || doc.avatar || doc.profile_image
              const docImg = photo ? getMediaUrl(photo) : 'https://img.freepik.com/free-photo/doctor-with-stethoscope-hands-crossed_1291-63.jpg'
              const docName = doc.name_bn || doc.name || doc.doctor_name || 'ডা. বিশেষজ্ঞ'
              const specialty = getDoctorSpecialtyTitle(doc)
              const hospital = getDoctorHospitalTitle(doc)
              const rating = getDoctorRating(doc)
              const reviewsCount = getDoctorReviewsCount(doc)

              return (
                <div
                  key={doc.id}
                  className="most-viewed-mobile-card"
                  onClick={() => navigate(getDoctorUrl(doc))}
                >
                  {/* Wishlist Heart Button */}
                  <button
                    type="button"
                    className={`most-viewed-mobile-fav-btn ${isFav ? 'active' : ''}`}
                    aria-label="Wishlist"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (toggleFavoriteDoctor) toggleFavoriteDoctor(doc)
                    }}
                  >
                    <IconHeart size={18} fill={isFav ? '#EF4444' : 'none'} color={isFav ? '#EF4444' : '#94A3B8'} stroke={1.8} />
                  </button>

                  {/* Doctor Avatar Circle */}
                  <div className="most-viewed-mobile-avatar-wrap">
                    <img
                      src={docImg}
                      alt={docName}
                      className="most-viewed-mobile-avatar-img"
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = 'https://img.freepik.com/free-photo/doctor-with-stethoscope-hands-crossed_1291-63.jpg'
                      }}
                    />
                  </div>

                  {/* Doctor Name */}
                  <h4 className="most-viewed-mobile-name" title={docName}>
                    {docName}
                  </h4>

                  {/* Specialty */}
                  <div className="most-viewed-mobile-specialty" title={specialty}>
                    {specialty}
                  </div>

                  {/* Hospital & Location */}
                  <div className="most-viewed-mobile-hospital" title={hospital}>
                    {hospital}
                  </div>

                  {/* Star Rating & Review Count */}
                  <div className="most-viewed-mobile-rating">
                    <IconStarFilled size={15} color="#F59E0B" />
                    <span className="most-viewed-mobile-rating-val">{toBnNumber(rating)}</span>
                    <span className="most-viewed-mobile-rating-count">({toBnNumber(reviewsCount)})</span>
                  </div>

                  {/* Action Button: অ্যাপয়েন্টমেন্ট নিন */}
                  <button
                    type="button"
                    className="most-viewed-mobile-book-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(getBookingUrl(doc))
                    }}
                  >
                    অ্যাপয়েন্টমেন্ট নিন
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Desktop Layout (>= 768px): Banner Showcase Slider ── */}
      <div className="most-viewed-desktop-wrapper">
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
      </div>

      <style>{`
        /* Desktop vs Mobile Toggle */
        .most-viewed-mobile-wrapper {
          display: none;
        }
        .most-viewed-desktop-wrapper {
          display: block;
        }

        @media (max-width: 767px) {
          #most-viewed-doctors-section {
            padding: 10px 12px 20px 12px !important;
          }
          .most-viewed-desktop-wrapper {
            display: none !important;
          }
          .most-viewed-mobile-wrapper {
            display: block !important;
            width: 100%;
          }

          .most-viewed-mobile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            padding: 0 4px;
          }

          .most-viewed-mobile-title {
            font-size: 17px;
            font-weight: 800;
            color: #0F172A;
            margin: 0;
            line-height: 1.2;
            font-family: 'Hind Siliguri', sans-serif;
            letter-spacing: -0.01em;
          }

          .most-viewed-mobile-all-link {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            font-weight: 700;
            color: #00803D;
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px 6px;
            font-family: 'Hind Siliguri', sans-serif;
            text-decoration: none;
            transition: color 0.15s ease;
          }

          .most-viewed-mobile-all-arrow {
            font-size: 15px;
            line-height: 1;
          }

          .most-viewed-mobile-scroll {
            display: flex;
            align-items: stretch;
            gap: 12px;
            overflow-x: auto;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            padding: 4px 2px 14px 2px;
            scrollbar-width: none;
          }

          .most-viewed-mobile-scroll::-webkit-scrollbar {
            display: none;
          }

          .most-viewed-mobile-card {
            flex: 0 0 178px;
            width: 178px;
            min-width: 178px;
            max-width: 178px;
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 18px;
            padding: 16px 12px 14px 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            position: relative;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            box-sizing: border-box;
            user-select: none;
          }

          .most-viewed-mobile-card:active {
            transform: scale(0.98);
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
          }

          .most-viewed-mobile-fav-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: transparent;
            border: none;
            padding: 4px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #94A3B8;
            transition: transform 0.2s ease;
            z-index: 2;
          }

          .most-viewed-mobile-fav-btn:active {
            transform: scale(1.2);
          }

          .most-viewed-mobile-fav-btn.active {
            color: #EF4444;
          }

          .most-viewed-mobile-avatar-wrap {
            width: 76px;
            height: 76px;
            border-radius: 50%;
            overflow: hidden;
            margin-bottom: 12px;
            background: #F1F5F9;
            border: 2px solid #FFFFFF;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .most-viewed-mobile-avatar-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: top center;
            display: block;
          }

          .most-viewed-mobile-name {
            font-size: 14px;
            font-weight: 800;
            color: #0F172A;
            line-height: 1.25;
            margin: 0 0 4px 0;
            font-family: 'Hind Siliguri', sans-serif;
            letter-spacing: -0.01em;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
            width: 100%;
          }

          .most-viewed-mobile-specialty {
            font-size: 11.5px;
            font-weight: 600;
            color: #64748B;
            line-height: 1.25;
            margin-bottom: 2px;
            font-family: 'Hind Siliguri', sans-serif;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
            width: 100%;
          }

          .most-viewed-mobile-hospital {
            font-size: 11px;
            font-weight: 500;
            color: #94A3B8;
            line-height: 1.25;
            margin-bottom: 8px;
            font-family: 'Hind Siliguri', sans-serif;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
            width: 100%;
          }

          .most-viewed-mobile-rating {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            margin-bottom: 12px;
            line-height: 1;
          }

          .most-viewed-mobile-rating-val {
            font-size: 13px;
            font-weight: 800;
            color: #0F172A;
            font-family: 'Hind Siliguri', sans-serif;
          }

          .most-viewed-mobile-rating-count {
            font-size: 11.5px;
            font-weight: 600;
            color: #64748B;
            font-family: 'Hind Siliguri', sans-serif;
          }

          .most-viewed-mobile-book-btn {
            width: 100%;
            height: 38px;
            border-radius: 999px;
            background: #00803D;
            color: #FFFFFF;
            border: none;
            font-size: 13px;
            font-weight: 700;
            font-family: 'Hind Siliguri', sans-serif;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 128, 61, 0.2);
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: auto;
          }

          .most-viewed-mobile-book-btn:active {
            transform: scale(0.97);
            background: #006630;
          }
        }
      `}</style>
    </section>
  )
})

export default MostViewedDoctors

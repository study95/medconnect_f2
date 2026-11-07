import React, { memo } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { useNavigate, Link } from 'react-router-dom'
import { getDoctorUrl, getBookingUrl } from '../../utils/identifierHelper'
import useDoctors from '../../hooks/useDoctors'
import DoctorCard from '../common/DoctorCard'
import { IconHeart, IconStarFilled, IconArrowRight } from '@tabler/icons-react'
import { useFavorites } from '../../context/FavoritesContext'
import { getMediaUrl } from '../../utils/mediaUtils'

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
 * RecentlyAddedSection — Displays recently joined doctors with mobile horizontal swipe slider
 * and desktop 3-card showcase.
 */
const RecentlyAddedSection = memo(function RecentlyAddedSection({
  doctors: propDoctors,
  hospitals: propHospitals,
  loading: propLoading,
}) {
  const navigate = useNavigate()
  const { isDoctorFavorite, toggleFavoriteDoctor } = useFavorites()

  // FALLBACK: If no props provided, fetch recent doctors
  const fallback = useDoctors(
    propDoctors === undefined ? { per_page: 8, sort: 'latest' } : false
  )

  const doctors = (propDoctors !== undefined && propDoctors?.length > 0 ? propDoctors : fallback.doctors)?.slice(0, 8)
  const loading = propLoading !== undefined ? propLoading : fallback.loading

  if (!loading && (!doctors || doctors.length === 0)) {
    return null
  }

  return (
    <section id="recently-added-doctors-section" style={{ padding: '8px 0 20px', background: '#FFFFFF', position: 'relative', overflow: 'hidden' }}>
      {/* ── Mobile Layout (< 768px): Horizontal Swipe Carousel (Matching সর্বাধিক পঠিত ডাক্তার) ── */}
      <div className="recent-mobile-wrapper">
        <div className="recent-mobile-header">
          <h3 className="recent-mobile-title">সম্প্রতি যুক্ত ডাক্তার</h3>
          <button
            type="button"
            className="recent-mobile-all-link"
            onClick={() => navigate('/doctors')}
          >
            সব দেখুন
          </button>
        </div>

        {loading ? (
          <div className="recent-mobile-scroll">
            {[1, 2, 3].map((n) => (
              <div key={n} className="recent-mobile-card" style={{ opacity: 0.7 }}>
                <div style={{ width: 76, height: 76, borderRadius: '50%', background: '#E2E8F0', marginBottom: 12 }} />
                <div style={{ width: '80%', height: 16, background: '#E2E8F0', borderRadius: 4, marginBottom: 6 }} />
                <div style={{ width: '60%', height: 12, background: '#F1F5F9', borderRadius: 4, marginBottom: 6 }} />
                <div style={{ width: '70%', height: 12, background: '#F1F5F9', borderRadius: 4, marginBottom: 10 }} />
                <div style={{ width: '100%', height: 38, borderRadius: 999, background: '#E2E8F0', marginTop: 'auto' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="recent-mobile-scroll">
            {doctors.map((doc) => {
              const isFav = isDoctorFavorite ? isDoctorFavorite(doc.id) : false
              const photo = doc.photo || doc.photo_url || doc.image || doc.avatar || doc.profile_image
              const docImg = photo ? getMediaUrl(photo) : '/images/default-doctor.png'
              const docName = doc.name_bn || doc.name || doc.doctor_name || 'ডা. বিশেষজ্ঞ'
              const specialty = getDoctorSpecialtyTitle(doc)
              const hospital = getDoctorHospitalTitle(doc)
              const rating = getDoctorRating(doc)
              const reviewsCount = getDoctorReviewsCount(doc)

              return (
                <div
                  key={doc.id}
                  className="recent-mobile-card"
                  onClick={() => navigate(getDoctorUrl(doc))}
                >
                  {/* Wishlist Heart Button */}
                  <button
                    type="button"
                    className={`recent-mobile-fav-btn ${isFav ? 'active' : ''}`}
                    aria-label="Wishlist"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (toggleFavoriteDoctor) toggleFavoriteDoctor(doc)
                    }}
                  >
                    <IconHeart size={18} fill={isFav ? '#EF4444' : 'none'} color={isFav ? '#EF4444' : '#94A3B8'} stroke={1.8} />
                  </button>

                  {/* Doctor Avatar Circle */}
                  <div className="recent-mobile-avatar-wrap">
                    <img
                      src={docImg}
                      alt={docName}
                      className="recent-mobile-avatar-img"
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = '/images/default-doctor.png'
                      }}
                    />
                  </div>

                  {/* Doctor Name */}
                  <h4 className="recent-mobile-name" title={docName}>
                    {docName}
                  </h4>

                  {/* Specialty */}
                  <div className="recent-mobile-specialty" title={specialty}>
                    {specialty}
                  </div>

                  {/* Hospital & Location */}
                  <div className="recent-mobile-hospital" title={hospital}>
                    {hospital}
                  </div>

                  {/* Star Rating & Review Count */}
                  <div className="recent-mobile-rating">
                    <IconStarFilled size={15} color="#F59E0B" />
                    <span className="recent-mobile-rating-val">{toBnNumber(rating)}</span>
                    <span className="recent-mobile-rating-count">({toBnNumber(reviewsCount)})</span>
                  </div>

                  {/* Action Button: অ্যাপয়েন্টমেন্ট নিন */}
                  <button
                    type="button"
                    className="recent-mobile-book-btn"
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

      {/* ── Desktop Layout (>= 768px): 3-Column Doctor Card Grid (Image 2 Style) ── */}
      <div className="recent-desktop-wrapper">
        <Container>
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h2 className="fw-bold mb-0 text-dark" style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontFamily: "'Hind Siliguri', sans-serif" }}>
                সম্প্রতি যুক্ত বিশেষজ্ঞ ডাক্তার
              </h2>
            </div>
            <Link
              to="/doctors"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#FFFFFF',
                color: '#00B875',
                border: '1.5px solid #00B875',
                padding: '6px 16px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                fontFamily: "'Hind Siliguri', sans-serif",
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 184, 117, 0.08)'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#00B875'; e.currentTarget.style.color = '#FFFFFF' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#00B875' }}
            >
              <span>সকল ডাক্তার</span>
              <IconArrowRight size={15} />
            </Link>
          </div>

          {doctors && doctors.length > 0 && (
            <Row className="g-3">
              {doctors.slice(0, 3).map((doc) => (
                <Col key={doc.id} xs={12} sm={6} md={4}>
                  <DoctorCard doctor={doc} />
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </div>

      <style>{`
        /* Desktop vs Mobile display toggle */
        .recent-mobile-wrapper {
          display: none;
        }
        .recent-desktop-wrapper {
          display: block;
        }

        @media (max-width: 767.98px) {
          .recent-desktop-wrapper {
            display: none !important;
          }
          .recent-mobile-wrapper {
            display: block !important;
            padding: 8px 12px 14px 12px;
          }

          .recent-mobile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 0 4px;
          }

          .recent-mobile-title {
            font-size: 17px;
            font-weight: 800;
            color: #0F172A;
            margin: 0;
            line-height: 1.2;
            font-family: 'Hind Siliguri', sans-serif;
            letter-spacing: -0.01em;
          }

          .recent-mobile-all-link {
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

          .recent-mobile-scroll {
            display: flex;
            align-items: stretch;
            gap: 12px;
            overflow-x: auto;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            padding: 4px 2px 14px 2px;
            scrollbar-width: none;
          }

          .recent-mobile-scroll::-webkit-scrollbar {
            display: none;
          }

          .recent-mobile-card {
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

          .recent-mobile-card:active {
            transform: scale(0.98);
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
          }

          .recent-mobile-fav-btn {
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

          .recent-mobile-fav-btn:active {
            transform: scale(1.2);
          }

          .recent-mobile-fav-btn.active {
            color: #EF4444;
          }

          .recent-mobile-avatar-wrap {
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

          .recent-mobile-avatar-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: top center;
            display: block;
          }

          .recent-mobile-name {
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

          .recent-mobile-specialty {
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

          .recent-mobile-hospital {
            font-size: 11.5px;
            font-weight: 500;
            color: #64748B;
            line-height: 1.25;
            margin-bottom: 8px;
            font-family: 'Hind Siliguri', sans-serif;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
            width: 100%;
          }

          .recent-mobile-rating {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            margin-bottom: 12px;
            line-height: 1;
          }

          .recent-mobile-rating-val {
            font-size: 13px;
            font-weight: 800;
            color: #0F172A;
            font-family: 'Hind Siliguri', sans-serif;
          }

          .recent-mobile-rating-count {
            font-size: 11.5px;
            font-weight: 600;
            color: #64748B;
            font-family: 'Hind Siliguri', sans-serif;
          }

          .recent-mobile-book-btn {
            width: 100%;
            height: 38px;
            border-radius: 999px;
            background: #FFFFFF;
            color: #00B875;
            border: 1.5px solid #00B875;
            font-size: 13px;
            font-weight: 700;
            font-family: 'Hind Siliguri', sans-serif;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0, 184, 117, 0.08);
            transition: all 0.22s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: auto;
          }

          .recent-mobile-book-btn:hover {
            background: #00B875;
            color: #FFFFFF !important;
            border-color: #00B875;
            box-shadow: 0 4px 14px rgba(0, 184, 117, 0.25);
          }

          .recent-mobile-book-btn:active {
            transform: scale(0.97);
            background: #009E64;
            color: #FFFFFF !important;
            border-color: #009E64;
          }
        }
      `}</style>
    </section>
  )
})

export default RecentlyAddedSection

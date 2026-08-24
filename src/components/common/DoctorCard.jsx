import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconStarFilled, IconStethoscope, IconBuildingHospital, IconMapPin, IconHeart, IconShare, IconEye, IconCalendarEvent
} from '@tabler/icons-react'
import { getMediaUrl } from '../../utils/mediaUtils'
import { getDoctorUrl, getBookingUrl } from '../../utils/identifierHelper'
import OptimizedImage from './OptimizedImage'
import { useFavorites } from '../../context/FavoritesContext'

const DEMO_AVATAR = 'https://img.freepik.com/free-photo/doctor-with-stethoscope-hands-crossed_1291-63.jpg'

const enToBn = {'0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯'};
const toBnNum = (str) => str ? String(str).replace(/\d/g, d => enToBn[d]) : '';

// Verified Badge Icon (Green)
const VerifiedBlueBadge = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M10.374 2.378c.95-.504 2.102-.504 3.052 0l1.107.587c.453.24.966.35 1.478.318l1.247-.078c1.074-.067 2.072.51 2.52 1.487l.52 1.139c.212.467.553.858.986 1.133l1.054.67c.907.577 1.348 1.666 1.114 2.704l-.271 1.22c-.11.498-.07 1.016.117 1.49l.455 1.168c.394 1.012.046 2.167-.879 2.793l-1.071.724c-.439.297-.76.712-.927 1.199l-.409 1.185c-.352 1.026-1.378 1.684-2.457 1.579l-1.248-.121c-.512-.05-1.026.04-1.488.261l-1.127.549c-.968.472-2.12.472-3.088 0l-1.127-.549c-.462-.221-.976-.311-1.488-.261l-1.248.121c-1.079.105-2.105-.553-2.457-1.579l-.409-1.185c-.167-.487-.488-.902-.927-1.199l-1.071-.724c-.925-.626-1.273-1.781-.879-2.793l.455-1.168c.187-.474.227-.992.117-1.49l-.271-1.22c-.234-1.038.207-2.127 1.114-2.704l1.054-.67c.433-.275.774-.666.986-1.133l.52-1.139c.448-.977 1.446-1.554 2.52-1.487l1.247.078c.512.032 1.025-.078 1.478-.318l1.107-.587z" fill="#00B875"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M16.707 8.293a1 1 0 010 1.414l-5.5 5.5a1 1 0 01-1.414 0l-2.5-2.5a1 1 0 111.414-1.414L10.5 13.086l4.793-4.793a1 1 0 011.414 0z" fill="white"/>
  </svg>
)

function DoctorCard({ doctor, index = 0, showBookingButton = true, viewMode = 'grid' }) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const { isDoctorFavorite, toggleFavoriteDoctor } = useFavorites()
  const isFavorite = isDoctorFavorite(doctor.id)

  const doctorPhoto = doctor?.photo || doctor?.photo_url || doctor?.image || doctor?.avatar || doctor?.profile_image
  const specialtyName = doctor.specialty_name || doctor.specialty?.name_bn || doctor.specialty?.name || 'বিশেষজ্ঞ'
  const experience = (() => {
    const exps = Array.isArray(doctor?.experiences) ? doctor.experiences : []
    let totalMonths = 0
    exps.forEach(exp => {
      const d = (exp.duration || '').toLowerCase()
      const yr = d.match(/(\d+)\s*year/)
      const mo = d.match(/(\d+)\s*month/)
      if (yr) totalMonths += parseInt(yr[1]) * 12
      if (mo) totalMonths += parseInt(mo[1])
    })
    if (totalMonths === 0) return toBnNum(doctor.experience || '১০')
    const yrs = Math.floor(totalMonths / 12)
    const mos = totalMonths % 12
    // If there are remaining months beyond whole years, show "X+" format
    if (mos > 0 && yrs > 0) return toBnNum(String(yrs)) + '+'
    if (yrs === 0) return toBnNum(String(mos)) + ' মাস '  // edge: only months
    return toBnNum(String(yrs)) + '+'
  })()
  const degrees = doctor.degree || doctor.qualifications || 'MBBS, MD'
  const fee = toBnNum(doctor.fee || '৫০০')

  // Find the currently-working experience entry
  const currentExp = (() => {
    const exps = Array.isArray(doctor?.experiences) ? doctor.experiences : []
    return exps.find(exp =>
      exp?.is_current ||
      exp?.currently_working ||
      (typeof exp?.period === 'string' && /present|বর্তমান/i.test(exp.period)) ||
      (typeof exp?.end_date === 'string' && /present|বর্তমান/i.test(exp.end_date))
    ) || null
  })()

  const locationText = (() => {
    if (currentExp?.address) return currentExp.address
    return [
      doctor.upazila?.name_bn || doctor.upazila?.name,
      doctor.district?.name_bn || doctor.district?.name || doctor.hospital?.district?.name_bn || 'ঢাকা'
    ].filter(Boolean).join(', ')
  })()

  const primaryHospital = currentExp?.hospital_name ||
    doctor.workplace || doctor.workplace_bn ||
    doctor.hospital?.name || doctor.chambers?.[0]?.hospital_name ||
    doctor.chamber_address || 'পপুলার ডায়াগনস্টিক সেন্টার'

  const handleDetails = (e) => {
    if (e) e.stopPropagation()
    navigate(getDoctorUrl(doctor))
  }

  const handleBook = (e) => {
    if (e) e.stopPropagation()
    navigate(getBookingUrl(doctor))
  }

  const handleShare = (e) => {
    if (e) e.stopPropagation()
    const url = `${window.location.origin}${getDoctorUrl(doctor)}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  /* ── 1. LIST VIEW CARD ── */
  if (viewMode === 'list') {
    return (
      <>
        <style>{`
          .doc-card-actions {
            display: flex;
            gap: 8px;
            align-items: center;
          }
          .doc-list-image-box {
            width: 240px;
            min-width: 240px;
            align-self: stretch;
            position: relative;
            background: #F1F5F9;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
          }
          .doc-list-image-box .doc-list-img-wrapper {
            width: 100% !important;
            height: 100% !important;
            min-height: 100% !important;
            flex: 1 1 auto !important;
          }
          .doc-list-image-box .doc-list-img-wrapper img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }
          .doc-btn-detail,
          .doc-btn-book {
            height: 40px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            white-space: nowrap;
            font-family: 'Hind Siliguri', sans-serif;
            transition: all 0.2s ease;
            box-sizing: border-box;
          }
          .doc-btn-detail {
            background: #FFFFFF;
            color: #0F172A;
            border: 1.5px solid #CBD5E1;
            padding: 0 16px;
          }
          .doc-btn-detail:hover {
            border-color: #00B875;
            color: #00B875;
          }
          .doc-btn-book {
            background: #00B875;
            color: #FFFFFF;
            border: none;
            padding: 0 18px;
            font-weight: 800;
            box-shadow: 0 4px 12px rgba(0, 184, 117, 0.25);
          }
          .doc-btn-book:hover {
            background: #009E64;
          }
          @media (max-width: 767px) {
            .doc-list-card {
              flex-direction: column !important;
            }
            .doc-list-image-box {
              width: 100% !important;
              min-width: 100% !important;
              height: 200px !important;
              align-self: auto !important;
            }
            .doc-card-bottom {
              width: 100% !important;
              display: flex !important;
              margin-top: 14px !important;
            }
            .doc-card-actions {
              width: 100% !important;
              display: flex !important;
              gap: 8px !important;
            }
            .doc-btn-detail,
            .doc-btn-book {
              flex: 1 1 0% !important;
              width: 50% !important;
              padding: 0 4px !important;
              font-size: 12.5px !important;
              height: 40px !important;
              min-width: 0 !important;
              white-space: nowrap !important;
            }
          }
        `}</style>
        <div
          onClick={handleDetails}
          className="doc-list-card"
          style={{
            background: 'white',
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            padding: 0,
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            marginBottom: 16
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#94A3B8'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(15, 23, 42, 0.08)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#E2E8F0'
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          {/* Featured Image Box */}
          <div className="doc-list-image-box" style={{
            width: 240,
            minWidth: 240,
            alignSelf: 'stretch',
            position: 'relative',
            background: '#F1F5F9',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <OptimizedImage
              className="doc-list-img-wrapper"
              src={getMediaUrl(doctorPhoto)}
              fallback={DEMO_AVATAR}
              alt={doctor.name}
              width="100%"
              height="100%"
              borderRadius={0}
              style={{ objectFit: 'cover', width: '100%', height: '100%', minHeight: '100%', flex: 1 }}
            />

            {/* Verified Blue Badge Icon (Top Right of Doctor Image) */}
            <div style={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
            }}>
              <VerifiedBlueBadge size={22} />
            </div>

            {/* Rating Badge (Bottom Right of Image) */}
            <div style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              background: 'rgba(15, 23, 42, 0.8)',
              color: 'white',
              borderRadius: 4,
              padding: '3px 8px',
              fontSize: 11.5,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              zIndex: 5,
              backdropFilter: 'blur(4px)'
            }}>
              <IconStarFilled size={12} color="#FBBF24" />
              <span>৪.৯ (১২০)</span>
            </div>
          </div>

          {/* Right Details Box */}
          <div style={{
            flex: 1,
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minWidth: 0
          }}>
            {/* Top Title, Specialty & Hospital Details */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <h3 style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: '#0F172A',
                    margin: '0 0 4px 0',
                    fontFamily: "'Hind Siliguri', sans-serif",
                    lineHeight: 1.3
                  }}>
                    {doctor.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{
                      background: '#00B875',
                      color: 'white',
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontFamily: "'Hind Siliguri', sans-serif"
                    }}>
                      {specialtyName}
                    </span>
                  </div>

                  {/* Degree */}
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#64748B', marginBottom: 3, fontFamily: "'Hind Siliguri', sans-serif" }}>
                    {degrees}
                  </div>

                  {/* Hospital Name */}
                  <div style={{
                    fontSize: 12.5,
                    color: '#334155',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontFamily: "'Hind Siliguri', sans-serif",
                    marginTop: 2
                  }}>
                    <IconBuildingHospital size={15} color="#64748B" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{primaryHospital}</span>
                  </div>

                  {/* Location */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    color: '#64748B',
                    fontSize: 12.5,
                    fontWeight: 500,
                    fontFamily: "'Hind Siliguri', sans-serif",
                    marginTop: 3
                  }}>
                    <IconMapPin size={14} color="#94A3B8" />
                    <span>{locationText || 'ঢাকা'}</span>
                  </div>
                </div>

                {/* Share & Heart Action Icons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={handleShare}
                    title={copied ? "লিংক কপি করা হয়েছে" : "শেয়ার করুন"}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 4,
                      color: copied ? '#008767' : '#64748B',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <IconShare size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleFavoriteDoctor(doctor) }}
                    title="পছন্দের তালিকায় রাখুন"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 4,
                      color: isFavorite ? '#EF4444' : '#64748B',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <IconHeart size={18} fill={isFavorite ? '#EF4444' : 'none'} />
                  </button>
                </div>
              </div>

              {/* Badges Strip */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                <span style={{
                  background: '#F1F5F9',
                  color: '#475569',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}>
                  {experience} বছর অভিজ্ঞতা
                </span>
                <span style={{
                  background: '#F1F5F9',
                  color: '#475569',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}>
                  ফি ৳{fee}
                </span>
              </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="doc-card-bottom" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <div className="doc-card-actions">
                <button
                  type="button"
                  onClick={handleDetails}
                  className="doc-btn-detail"
                >
                  <IconEye size={16} />
                  <span>বিস্তারিত দেখুন</span>
                </button>
                <button
                  type="button"
                  onClick={handleBook}
                  className="doc-btn-book"
                >
                  <IconCalendarEvent size={16} color="#FFFFFF" />
                  <span>অ্যাপয়েন্টমেন্ট নিন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  /* ── 2. STANDARD GRID VIEW CARD ── */
  return (
    <div
      onClick={handleDetails}
      style={{
        background: 'white',
        borderRadius: 14,
        border: '1px solid #E5E7EB',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#00B875'
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 184, 117, 0.10)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#E5E7EB'
        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.03)'
      }}
    >
      {/* Heart Wishlist Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          toggleFavoriteDoctor(doctor)
        }}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 15,
          background: 'rgba(255, 255, 255, 0.98)',
          border: '1px solid #E2E8F0',
          borderRadius: '50%',
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#EF4444',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
        }}
      >
        <IconHeart size={16} fill={isFavorite ? '#EF4444' : 'none'} color="#EF4444" />
      </button>

      {/* Doctor Top Avatar & Main Info */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
        {/* Avatar Container with Blue Verified Badge on Top Right of Image */}
        <div style={{ flexShrink: 0, position: 'relative', width: 90, height: 95 }}>
          <OptimizedImage
            src={getMediaUrl(doctorPhoto)}
            fallback={DEMO_AVATAR}
            alt={doctor.name}
            width={90}
            height={95}
            borderRadius={12}
            style={{ border: '1px solid #F1F5F9', objectFit: 'cover', width: 90, height: 95 }}
          />
          {/* Verified Badge Icon on Image Top Right */}
          <div style={{
            position: 'absolute',
            top: -5,
            right: -5,
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.18))'
          }}>
            <VerifiedBlueBadge size={19} />
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, paddingRight: 24 }}>
          <h4 style={{
            fontWeight: 800, color: '#0F172A', fontSize: 15.5,
            margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: "'Hind Siliguri', sans-serif",
            lineHeight: 1.25
          }} title={doctor.name}>
            {doctor.name}
          </h4>

          <div style={{ marginTop: 2, marginBottom: 2 }}>
            <span style={{
              display: 'inline-block',
              background: '#00B875',
              color: 'white',
              fontSize: 11.5,
              fontWeight: 700,
              padding: '2px 10px 2px 8px',
              borderRadius: '4px 2px 2px 4px',
              clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)',
              fontFamily: "'Hind Siliguri', sans-serif",
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {specialtyName}
            </span>
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', fontFamily: "'Hind Siliguri', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {degrees}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: "'Hind Siliguri', sans-serif" }}>
            <IconBuildingHospital size={14} color="#64748B" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {primaryHospital}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748B', fontSize: 12, fontWeight: 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
            <IconMapPin size={14} color="#00B875" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {locationText || 'ঢাকা'}
            </span>
          </div>

          <div style={{ fontSize: 12, color: '#334155', fontWeight: 700, fontFamily: "'Hind Siliguri', sans-serif", marginTop: 1 }}>
            {experience} বছর অভিজ্ঞতা • ৳{fee} ফি
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto', width: '100%' }}>
        <button
          type="button"
          onClick={handleDetails}
          style={{
            flex: 1,
            height: 38,
            borderRadius: 8,
            border: '1.5px solid #CBD5E1',
            background: 'white',
            color: '#0F172A',
            fontWeight: 700,
            fontSize: 'clamp(11.5px, 3.2vw, 13px)',
            padding: '0 4px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            fontFamily: "'Hind Siliguri', sans-serif",
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#00B875'; e.currentTarget.style.color = '#00B875' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#0F172A' }}
        >
          <IconEye size={15} style={{ flexShrink: 0 }} />
          <span>বিস্তারিত দেখুন</span>
        </button>
        <button
          type="button"
          onClick={handleBook}
          style={{
            flex: 1,
            height: 38,
            borderRadius: 8,
            border: 'none',
            background: '#00B875',
            color: 'white',
            fontWeight: 800,
            fontSize: 'clamp(11.5px, 3.2vw, 13px)',
            padding: '0 4px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            boxShadow: '0 4px 12px rgba(0, 184, 117, 0.25)',
            fontFamily: "'Hind Siliguri', sans-serif",
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#009E64'}
          onMouseLeave={e => e.currentTarget.style.background = '#00B875'}
        >
          <IconCalendarEvent size={15} color="#FFFFFF" style={{ flexShrink: 0 }} />
          <span>অ্যাপয়েন্টমেন্ট নিন</span>
        </button>
      </div>
    </div>
  )
}

export default memo(DoctorCard)

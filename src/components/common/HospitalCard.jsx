import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMediaUrl } from '../../utils/mediaUtils'
import { IconMapPin, IconPhone, IconMail, IconWorld, IconShieldCheck, IconHeart, IconBed, IconPlus, IconShare, IconCamera, IconEye, IconCalendarEvent } from '@tabler/icons-react'
import OptimizedImage from './OptimizedImage'
import { useFavorites } from '../../context/FavoritesContext'

const DEMO_HOSPITAL = 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80'

const DEFAULT_HOSPITAL_GALLERY = [
  'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=600&q=80'
]

function HospitalCardImageSlider({ hospital, width = 250, height = 180 }) {
  const photos = hospital.photos && hospital.photos.length > 0
    ? hospital.photos.map(p => getMediaUrl(p))
    : hospital.photo_url
      ? [getMediaUrl(hospital.photo_url), ...DEFAULT_HOSPITAL_GALLERY.slice(1)]
      : DEFAULT_HOSPITAL_GALLERY

  const [activeIdx, setActiveIdx] = useState(0)

  const handlePrev = (e) => {
    e.stopPropagation()
    setActiveIdx(prev => (prev === 0 ? photos.length - 1 : prev - 1))
  }

  const handleNext = (e) => {
    e.stopPropagation()
    setActiveIdx(prev => (prev === photos.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="hosp-list-image-box" style={{
      width: width || 250,
      minWidth: width || 250,
      alignSelf: 'stretch',
      position: 'relative',
      background: '#F1F5F9',
      flexShrink: 0,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <OptimizedImage
        className="hosp-list-img-wrapper"
        src={photos[activeIdx]}
        fallback={DEFAULT_HOSPITAL_GALLERY[0]}
        alt={hospital.name}
        width="100%"
        height="100%"
        borderRadius={0}
        style={{ objectFit: 'cover', width: '100%', height: '100%', minHeight: '100%', flex: 1, transition: 'all 0.3s ease' }}
      />

      {/* Prev Arrow Button */}
      <button
        type="button"
        onClick={handlePrev}
        style={{
          position: 'absolute',
          left: 6,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(15, 23, 42, 0.65)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 6,
          fontSize: 14,
          backdropFilter: 'blur(4px)'
        }}
        title="আগের ছবি"
      >
        ‹
      </button>

      {/* Next Arrow Button */}
      <button
        type="button"
        onClick={handleNext}
        style={{
          position: 'absolute',
          right: 6,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(15, 23, 42, 0.65)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 6,
          fontSize: 14,
          backdropFilter: 'blur(4px)'
        }}
        title="পরের ছবি"
      >
        ›
      </button>

      {/* Photo Count Badge (Bottom Right of Image) */}
      <div style={{
        position: 'absolute',
        bottom: 8,
        right: 8,
        background: 'rgba(15, 23, 42, 0.75)',
        color: 'white',
        borderRadius: 4,
        padding: '3px 7px',
        fontSize: 11,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        zIndex: 5,
        backdropFilter: 'blur(4px)'
      }}>
        <IconCamera size={13} />
        <span>{photos.length}</span>
      </div>
    </div>
  )
}

function HospitalCard({ hospital, index = 0, viewMode = 'list' }) {
  const navigate = useNavigate()
  const { isHospitalFavorite, toggleFavoriteHospital } = useFavorites()
  const isFavorite = isHospitalFavorite(hospital.id)
  const [copied, setCopied] = useState(false)

  const handleShare = (e) => {
    e.stopPropagation()
    const url = `${window.location.origin}/hospitals/${hospital.id}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const locationText = [
    hospital.upazila?.name_bn || hospital.upazila?.name,
    hospital.district?.name_bn || hospital.district?.name || 'ঢাকা'
  ].filter(Boolean).join(', ')

  /* ── 1. COMPACT MAP VIEW CARD (Matching Right Column in Map Screenshot) ── */
  if (viewMode === 'map-compact') {
    return (
      <div
        onClick={() => navigate(`/hospitals/${hospital.id}`)}
        style={{
          background: 'white',
          borderRadius: 8,
          border: '1px solid #E2E8F0',
          padding: 10,
          cursor: 'pointer',
          display: 'flex',
          gap: 12,
          marginBottom: 10,
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#00A88C'
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#E2E8F0'
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)'
        }}
      >
        <OptimizedImage
          src={getMediaUrl(hospital.photo_url)}
          fallback={DEMO_HOSPITAL}
          alt={hospital.name}
          width={105}
          height={82}
          borderRadius={6}
          style={{ objectFit: 'cover', flexShrink: 0 }}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h4 style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {hospital.name}
              </h4>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleFavoriteHospital(hospital) }}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: isFavorite ? '#EF4444' : '#94A3B8' }}
              >
                <IconHeart size={14} fill={isFavorite ? '#EF4444' : 'none'} />
              </button>
            </div>
            <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <IconMapPin size={12} color="#94A3B8" />
              <span>{locationText || 'ঢাকা'}</span>
            </div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span>🛏️ ২৫০+ শয্যা</span>
              <span>•</span>
              <span>🚑 ২৪/৭ জরুরি</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, background: '#F1F5F9', color: '#334155', padding: '2px 8px', borderRadius: 4, fontFamily: "'Hind Siliguri', sans-serif" }}>
              {hospital.type === 'private' ? 'প্রাইভেট' : hospital.type === 'government' ? 'সরকারি' : 'হাসপাতাল'}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0B192C', display: 'flex', alignItems: 'center', gap: 2 }}>
              View →
            </span>
          </div>
        </div>
      </div>
    )
  }

  /* ── 2. DESKTOP/MOBILE LIST VIEW CARD ── */
  if (viewMode === 'list') {
    return (
      <>
        <style>{`
          .hosp-card-actions {
            display: flex;
            gap: 8px;
            align-items: center;
          }
          .hosp-list-image-box {
            width: 250px;
            min-width: 250px;
            align-self: stretch;
            position: relative;
            background: #F1F5F9;
            flex-shrink: 0;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          .hosp-list-image-box .hosp-list-img-wrapper {
            width: 100% !important;
            height: 100% !important;
            min-height: 100% !important;
            flex: 1 1 auto !important;
          }
          .hosp-list-image-box .hosp-list-img-wrapper img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }
          .hosp-btn-detail,
          .hosp-btn-book {
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
          }
          .hosp-btn-detail {
            background: #FFFFFF;
            color: #0F172A;
            border: 1.5px solid #CBD5E1;
            padding: 0 16px;
          }
          .hosp-btn-detail:hover {
            border-color: #00B875;
            color: #00B875;
          }
          .hosp-btn-book {
            background: #00B875;
            color: #FFFFFF;
            border: none;
            padding: 0 18px;
            font-weight: 800;
            box-shadow: 0 4px 12px rgba(0, 184, 117, 0.25);
          }
          .hosp-btn-book:hover {
            background: #009E64;
          }
          @media (max-width: 767px) {
            .hosp-list-card {
              flex-direction: column !important;
            }
            .hosp-list-image-box {
              width: 100% !important;
              min-width: 100% !important;
              height: 200px !important;
              align-self: auto !important;
            }
            .hosp-card-bottom {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 12px !important;
              margin-top: 14px !important;
            }
            .hosp-card-actions {
              width: 100% !important;
              display: flex !important;
              gap: 8px !important;
            }
            .hosp-btn-detail,
            .hosp-btn-book {
              flex: 1 !important;
              padding: 0 4px !important;
              font-size: 12.5px !important;
              height: 40px !important;
              white-space: nowrap !important;
            }
          }
        `}</style>
        <div
          onClick={() => navigate(`/hospitals/${hospital.id}`)}
          className="hosp-list-card"
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
          {/* Featured Image Box with Interactive Slider */}
          <HospitalCardImageSlider hospital={hospital} width={250} height={180} />

          {/* Right Details Box */}
          <div style={{
            flex: 1,
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minWidth: 0
          }}>
            {/* Top Title & Action Buttons */}
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
                    {hospital.name}
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    color: '#64748B',
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: "'Hind Siliguri', sans-serif"
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
                    onClick={(e) => { e.stopPropagation(); toggleFavoriteHospital(hospital) }}
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
                  background: '#E2E8F0',
                  color: '#475569',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  ACTIVE
                </span>
                <span style={{
                  background: '#F1F5F9',
                  color: '#475569',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 4
                }}>
                  {hospital.hospital_type || (hospital.type === 'private' ? 'প্রাইভেট' : hospital.type === 'government' ? 'সরকারি' : 'হাসপাতাল')}
                </span>
                <span style={{
                  background: '#F1F5F9',
                  color: '#475569',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 4
                }}>
                  ২৫০+ শয্যা
                </span>
                {hospital.has_emergency && (
                  <span style={{
                    background: '#FEF2F2',
                    color: '#EF4444',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 4
                  }}>
                    ২৪/৭ জরুরি
                  </span>
                )}
              </div>
            </div>

            {/* Subtext & Bottom Buttons */}
            <div className="hosp-card-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', fontFamily: "'Hind Siliguri', sans-serif" }}>
                  ১৫+ বিশেষায়িত বিভাগ
                </span>
              </div>

              {/* Action Buttons */}
              <div className="hosp-card-actions">
                <button
                  type="button"
                  onClick={() => navigate(`/hospitals/${hospital.id}`)}
                  className="hosp-btn-detail"
                >
                  <IconEye size={16} />
                  <span>বিস্তারিত দেখুন</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); navigate(`/doctors?hospital_id=${hospital.id}`) }}
                  className="hosp-btn-book"
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

  /* ── 3. STANDARD GRID VIEW CARD ── */
  return (
    <div
      onClick={() => navigate(`/hospitals/${hospital.id}`)}
      style={{
        background: 'white', borderRadius: 8, border: '1px solid #E2E8F0',
        padding: '16px', cursor: 'pointer', transition: '0.3s',
        position: 'relative', overflow: 'hidden', height: '100%',
        display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#00A88C'
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 168, 140, 0.08)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#E2E8F0'
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleFavoriteHospital(hospital)
        }}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 15,
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #E2E8F0',
          borderRadius: '50%',
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#EF4444'
        }}
      >
        <IconHeart size={16} fill={isFavorite ? '#EF4444' : 'none'} color="#EF4444" />
      </button>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div style={{ flexShrink: 0, position: 'relative' }}>
          <OptimizedImage
            src={getMediaUrl(hospital.photo_url)}
            fallback={DEMO_HOSPITAL}
            alt={hospital.name}
            width={90}
            height={95}
            borderRadius={8}
            style={{ border: '1px solid #F1F5F9', objectFit: 'cover' }}
          />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <h4 style={{
            fontWeight: 800, color: '#0F172A', fontSize: 15,
            marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }} title={hospital.name}>
            {hospital.name}
          </h4>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13, fontWeight: 500 }}>
            <IconMapPin size={14} color="#00A88C" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {locationText || 'ঢাকা'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13, fontWeight: 500 }}>
            <IconBed size={14} color="#00A88C" />
            <span>২৫০+ শয্যা সুবিধা</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
        <button
          onClick={() => navigate(`/hospitals/${hospital.id}`)}
          style={{
            flex: 1,
            height: 38,
            borderRadius: 8,
            border: '1.5px solid #CBD5E1',
            background: 'white',
            color: '#0F172A',
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            whiteSpace: 'nowrap',
            fontFamily: "'Hind Siliguri', sans-serif"
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#00B875'; e.currentTarget.style.color = '#00B875' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#0F172A' }}
        >
          <IconEye size={15} />
          <span>বিস্তারিত দেখুন</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/doctors?hospital_id=${hospital.id}`) }}
          style={{
            flex: 1,
            height: 38,
            borderRadius: 8,
            border: 'none',
            background: '#00B875',
            color: 'white',
            fontWeight: 800,
            fontSize: 12,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0, 184, 117, 0.25)',
            fontFamily: "'Hind Siliguri', sans-serif"
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#009E64'}
          onMouseLeave={e => e.currentTarget.style.background = '#00B875'}
        >
          <IconCalendarEvent size={15} color="#FFFFFF" />
          <span>অ্যাপয়েন্টমেন্ট নিন</span>
        </button>
      </div>
    </div>
  )
}

export default memo(HospitalCard)

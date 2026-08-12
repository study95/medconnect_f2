import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMediaUrl } from '../../utils/mediaUtils'
import { IconMapPin, IconPhone, IconMail, IconWorld, IconShieldCheck, IconHeart, IconBed, IconPlus, IconShare, IconCamera } from '@tabler/icons-react'
import OptimizedImage from './OptimizedImage'
import { useFavorites } from '../../context/FavoritesContext'

const DEMO_HOSPITAL = 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80'

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
              <span>@ {locationText || 'uttara'}</span>
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
          @media (max-width: 767px) {
            .hosp-list-card {
              flex-direction: column !important;
            }
            .hosp-list-image-box {
              width: 100% !important;
              min-width: 100% !important;
              height: 180px !important;
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
          <div className="hosp-list-image-box" style={{
            width: 250,
            minWidth: 250,
            height: 180,
            position: 'relative',
            background: '#F1F5F9',
            flexShrink: 0
          }}>
            <OptimizedImage
              src={getMediaUrl(hospital.photo_url)}
              fallback={DEMO_HOSPITAL}
              alt={hospital.name}
              width={250}
              height={180}
              borderRadius={0}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />

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
              backdropFilter: 'blur(4px)'
            }}>
              <IconCamera size={13} />
              <span>5</span>
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
                    <span>@ {locationText || 'uttara, dhaka'}</span>
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
                  {hospital.type === 'private' ? 'প্রাইভেট' : hospital.type === 'government' ? 'সরকারি' : 'হাসপাতাল'}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', fontFamily: "'Hind Siliguri', sans-serif" }}>
                  ১৫+ বিশেষায়িত বিভাগ
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => navigate(`/hospitals/${hospital.id}`)}
                  style={{
                    background: '#0B192C',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 18px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: "'Hind Siliguri', sans-serif"
                  }}
                >
                  View details
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); navigate(`/doctors?hospital_id=${hospital.id}`) }}
                  style={{
                    background: 'white',
                    color: '#0B192C',
                    border: '1.5px solid #0B192C',
                    borderRadius: 6,
                    padding: '8px 18px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: "'Hind Siliguri', sans-serif"
                  }}
                >
                  Contact
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
            flex: 1, height: 36, borderRadius: 6, border: '1px solid #E2E8F0',
            background: 'white', color: '#475569', fontWeight: 700, fontSize: 13,
            cursor: 'pointer'
          }}
        >
          View details
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/doctors?hospital_id=${hospital.id}`) }}
          style={{
            flex: 1, height: 36, borderRadius: 6, border: 'none',
            background: '#0B192C', color: 'white', fontWeight: 700, fontSize: 13,
            cursor: 'pointer'
          }}
        >
          Contact
        </button>
      </div>
    </div>
  )
}

export default memo(HospitalCard)

import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMediaUrl } from '../../utils/mediaUtils'
import { IconMapPin, IconPhone, IconMail, IconWorld, IconShieldCheck, IconHeart, IconBed, IconPlus } from '@tabler/icons-react'
import OptimizedImage from './OptimizedImage'
import { useFavorites } from '../../context/FavoritesContext'

const DEMO_HOSPITAL = 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=400&q=80'

function HospitalCard({ hospital, index = 0 }) {
  const navigate = useNavigate()
  const { isHospitalFavorite, toggleFavoriteHospital } = useFavorites()
  const isFavorite = isHospitalFavorite(hospital.id)

  return (
    <div
      onClick={() => navigate(`/hospitals/${hospital.id}`)}
      style={{
        background: 'white', borderRadius: 7, border: '1.5px solid #F1F5F9',
        padding: '16px', cursor: 'pointer', transition: '0.3s',
        position: 'relative', overflow: 'hidden', height: '100%',
        display: 'flex', flexDirection: 'column'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#00A88C'
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 168, 140, 0.08)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#F1F5F9'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Wishlist / Favorite Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleFavoriteHospital(hospital)
        }}
        className="d-flex"
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 15,
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1.5px solid #F1F5F9',
          borderRadius: '50%',
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#EF4444',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.borderColor = '#EF4444'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.borderColor = '#F1F5F9'
        }}
      >
        <IconHeart 
          size={16} 
          fill={isFavorite ? '#EF4444' : 'none'} 
          stroke={2.5} 
          color="#EF4444"
        />
      </button>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        {/* Hospital Photo — lazy loaded */}
        <div style={{ flexShrink: 0, position: 'relative' }}>
          <OptimizedImage
            src={getMediaUrl(hospital.photo_url)}
            fallback={DEMO_HOSPITAL}
            alt={hospital.name}
            width={100}
            height={110}
            borderRadius={12}
            style={{ border: '1px solid #F1F5F9' }}
          />
          {/* Rosette Verified Badge (Bottom Center of image, matching DoctorCard!) */}
          <div style={{
            position: 'absolute',
            bottom: -3,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            background: '#D1FAE5',
            color: '#065F46',
            padding: '2px 8px',
            borderRadius: 99,
            fontSize: 9,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            boxShadow: '0 4px 10px rgba(6, 95, 70, 0.08)',
            whiteSpace: 'nowrap',
            border: '1.5px solid white'
          }}>
            <span style={{ 
              background: '#065F46', 
              color: '#D1FAE5', 
              borderRadius: '50%', 
              width: 12, 
              height: 12, 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: 8,
              fontWeight: 900
            }}>✓</span>
            VERIFIED
          </div>
        </div>

        {/* Hospital Info */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <h4 style={{ 
            fontWeight: 800, color: '#1E293B', fontSize: 16, 
            marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%'
          }} title={hospital.name}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {hospital.name}
            </span>
          </h4>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13, fontWeight: 500 }}>
            <IconMapPin size={14} color="#00A88C" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {hospital.district?.name_bn || hospital.district?.name || 'ঢাকা'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13, fontWeight: 500 }}>
            <IconBed size={14} color="#00A88C" />
            <span>২৫০+ বেড সুবিধা</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13, fontWeight: 500 }}>
            <IconPlus size={14} color="#00A88C" />
            <span>১৫+ বিশেষায়িত বিভাগ</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
        <button
          onClick={() => navigate(`/hospitals/${hospital.id}`)}
          style={{
            flex: 1, height: 38, borderRadius: 8, border: '1px solid #E2E8F0',
            background: 'white', color: '#475569', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', transition: '0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}
        >
          বিস্তারিত দেখুন
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/doctors?hospital_id=${hospital.id}`); }}
          style={{
            flex: 1, height: 38, borderRadius: 8, border: 'none',
            background: '#006B54', color: 'white', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', transition: '0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#005a46'}
          onMouseLeave={e => e.currentTarget.style.background = '#006B54'}
        >
          অ্যাপয়েন্টমেন্ট নিন
        </button>
      </div>
    </div>
  )
}

export default memo(HospitalCard)

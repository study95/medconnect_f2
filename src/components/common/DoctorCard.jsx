import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from 'react-bootstrap'
import {
  IconStarFilled, IconStethoscope, IconShieldCheck, IconBuildingHospital, IconCalendarPlus, IconMapPin, IconClock, IconX, IconHeart, IconUsers
} from '@tabler/icons-react'
import { getMediaUrl } from '../../utils/mediaUtils'
import OptimizedImage from './OptimizedImage'
import { useFavorites } from '../../context/FavoritesContext'

const DEMO_AVATAR = 'https://img.freepik.com/free-photo/doctor-with-stethoscope-hands-crossed_1291-63.jpg'

const enToBn = {'0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯'};
const toBnNum = (str) => str ? String(str).replace(/\d/g, d => enToBn[d]) : '';

function DoctorCard({ doctor, index = 0, showBookingButton = false }) {
  const navigate = useNavigate()
  const [showHospitalModal, setShowHospitalModal] = useState(false)
  const { isDoctorFavorite, toggleFavoriteDoctor } = useFavorites()
  const isFavorite = isDoctorFavorite(doctor.id)

  const specialtyName = doctor.specialty_name || doctor.specialty?.name_bn || doctor.specialty?.name || 'বিশেষজ্ঞ'
  const experience = toBnNum(doctor.experience || '১০')
  const degrees = doctor.degree || 'MBBS, MD'
  const fee = toBnNum(doctor.fee || '৫০০')

  const handleDetails = (e) => {
    e.stopPropagation()
    navigate(`/doctors/${doctor.id}`)
  }

  const handleBook = (e) => {
    e.stopPropagation()
    navigate(`/book-appointment/${doctor.id}`)
  }

  const handleHospital = (e) => {
    e.stopPropagation()
    if (doctor.chambers && doctor.chambers.length > 0) {
      setShowHospitalModal(true)
    } else {
      const hospitalId = doctor.hospital_id || doctor.hospital?.id
      if (hospitalId) {
        navigate(`/hospitals/${hospitalId}`)
      } else {
        navigate(`/doctors/${doctor.id}`)
      }
    }
  }

  const handleBookChamber = (chamberId, e) => {
    e.stopPropagation()
    navigate(`/book-appointment/${doctor.id}?chamberId=${chamberId}`)
  }

  return (
    <div
      onClick={handleDetails}
      style={{
        position: 'relative',
        background: 'white', 
        borderRadius: 7, 
        border: '1px solid #E2E8F0',
        cursor: 'pointer', 
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
        height: showBookingButton ? '100%' : 'auto'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#00A88C'
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 168, 140, 0.06)'
        e.currentTarget.style.transform = 'translateY(-3px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#E2E8F0'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.02)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Wishlist / Favorite Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleFavoriteDoctor(doctor)
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

      {/* Inner Info Row */}
      <div style={{ display: 'flex', gap: 16, padding: '14px 16px 8px 16px' }}>
        
        {/* Left Column (Photo & Verified Rosette) */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', width: 80 }}>
          <div style={{ position: 'relative', width: 80, height: 80 }}>
            <OptimizedImage
              src={getMediaUrl(doctor.photo)}
              fallback={DEMO_AVATAR}
              alt={doctor.name}
              width={80}
              height={80}
              borderRadius={7}
              style={{ objectFit: 'cover', background: '#F1F5F9' }}
            />
            {/* Verified Badge - Blue Scalloped Icon at Bottom Right */}
            <div
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 0
              }}
              title="ভেরিফাইড ডাক্তার"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2C12.55 2 13.06 2.25 13.42 2.68L14.41 3.86C14.73 4.24 15.22 4.45 15.71 4.42L17.25 4.33C18.3 4.27 19.17 5.09 19.26 6.14L19.39 7.68C19.43 8.18 19.67 8.64 20.07 8.93L21.3 9.85C22.14 10.48 22.31 11.67 21.68 12.51C21.6 12.62 21.5 12.72 21.4 12.81L20.24 13.82C19.86 14.15 19.65 14.63 19.66 15.13L19.7 16.68C19.73 17.74 18.89 18.62 17.83 18.68L16.29 18.77C15.79 18.8 15.33 19.04 15.04 19.45L14.12 20.68C13.49 21.52 12.3 21.69 11.46 21.06C11.35 20.98 11.25 20.88 11.16 20.78L10.15 19.62C9.82 19.24 9.34 19.03 8.84 19.04L7.29 19.08C6.23 19.11 5.35 18.27 5.29 17.21L5.2 15.67C5.17 15.17 4.93 14.71 4.53 14.42L3.3 13.5C2.46 12.87 2.29 11.68 2.92 10.84C3 10.73 3.1 10.63 3.2 10.54L4.36 9.53C4.74 9.2 4.95 8.72 4.94 8.22L4.9 6.67C4.87 5.61 5.71 4.73 6.77 4.67L8.31 4.58C8.81 4.55 9.27 4.31 9.56 3.9L10.48 2.67C11.08 1.83 12.24 1.62 13.1 2.21"
                  fill="#0084FF"
                />
                <path
                  d="M9 12.2L11 14.2L15.5 9.2"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column (Info) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, paddingRight: 24 }}>
          
          {/* Name & Degrees */}
          <h3 style={{ 
            color: '#0F172A', 
            fontSize: 14, 
            fontWeight: 800, 
            margin: '0 0 2px 0',
            lineHeight: 1.3,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%'
          }} title={doctor.name}>
            {doctor.name}
          </h3>
          <div style={{ color: '#475569', fontSize: 13, marginBottom: 6 }}>
            {degrees}
          </div>

          {/* Specialty Line (Light BG, Icon Left) */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#047857',
            background: '#ECFDF5',
            padding: '3px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 700,
            width: 'fit-content',
            maxWidth: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            <IconShieldCheck size={14} stroke={2.5} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {specialtyName}
            </span>
          </div>

          {/* Experience Line */}
          <div style={{ marginTop: 4, fontSize: 12, color: '#475569', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#0F172A', fontWeight: 700 }}>
              {experience} {String(experience).includes('বছর') ? '' : 'বছর+'}
            </span>
            <span style={{ color: '#64748B' }}>অভিজ্ঞতা</span>
          </div>
          
        </div>
      </div>

      {/* 3-Column Stats Row (Fee, Rating & Reviews, Patients) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 6px',
        borderTop: '1px solid #F1F5F9',
        background: '#FAFBFD'
      }}>
        {/* Column 1: Consultation Fee */}
        <div style={{ flex: 1, textAlign: 'center', padding: '0 2px' }}>
          <div style={{ fontSize: 10, color: '#64748B', fontWeight: 500, marginBottom: 1, whiteSpace: 'nowrap' }}>
            ভিজিট ফি
          </div>
          <div style={{ fontSize: 15, color: '#047857', fontWeight: 800, lineHeight: 1.1 }}>
            ৳{fee}
          </div>
        </div>

        {/* Divider 1 */}
        <div style={{ width: 1, height: 22, background: '#E2E8F0', flexShrink: 0 }} />

        {/* Column 2: Rating */}
        <div style={{ flex: 1, textAlign: 'center', padding: '0 2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginBottom: 1 }}>
            <IconStarFilled size={14} color="#F59E0B" />
            <span style={{ fontSize: 14, color: '#0F172A', fontWeight: 800, lineHeight: 1.1 }}>৫.০</span>
          </div>
          <div style={{ fontSize: 10, color: '#64748B', fontWeight: 500, whiteSpace: 'nowrap' }}>
            (১৩৪৫ রিভিউ)
          </div>
        </div>

        {/* Divider 2 */}
        <div style={{ width: 1, height: 22, background: '#E2E8F0', flexShrink: 0 }} />

        {/* Column 3: Patients */}
        <div style={{ flex: 1, textAlign: 'center', padding: '0 2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginBottom: 1 }}>
            <IconUsers size={15} color="#2563EB" />
            <span style={{ fontSize: 14, color: '#0F172A', fontWeight: 800, lineHeight: 1.1 }}>৪,৮৬৩</span>
          </div>
          <div style={{ fontSize: 10, color: '#64748B', fontWeight: 500, whiteSpace: 'nowrap' }}>
            রোগী
          </div>
        </div>
      </div>

      {/* Two action buttons at bottom */}
      {showBookingButton && (
        <div style={{ display: 'flex', borderTop: '1px solid #F1F5F9' }}>
          <button
            onClick={handleHospital}
            style={{
              flex: 1,
              background: '#F0FDF4',
              color: '#065F46',
              border: 'none',
              borderRight: '1px solid #E5EAF0',
              padding: '11px 10px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              transition: 'all 0.2s',
              userSelect: 'none'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#DCFCE7'; e.currentTarget.style.color = '#047857' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F0FDF4'; e.currentTarget.style.color = '#065F46' }}
          >
            <IconBuildingHospital size={15} stroke={2.2} />
            হাসপাতাল দেখুন
          </button>
          <button
            onClick={handleBook}
            style={{
              flex: 1,
              background: '#059669',
              color: 'white',
              border: 'none',
              padding: '11px 10px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              transition: 'all 0.2s',
              userSelect: 'none'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#047857'}
            onMouseLeave={e => e.currentTarget.style.background = '#059669'}
          >
            <IconCalendarPlus size={15} stroke={2.2} />
            অ্যাপয়েন্টমেন্ট নিন
          </button>
        </div>
      )}

      {/* Hospital List Modal */}
      <Modal 
        show={showHospitalModal} 
        onHide={(e) => { if(e) e.stopPropagation(); setShowHospitalModal(false); }}
        centered
        size="lg"
        onClick={e => e.stopPropagation()}
      >
        <Modal.Header style={{ borderBottom: '1px solid #F1F5F9', padding: '20px 24px' }}>
          <Modal.Title style={{ fontSize: 20, fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F0FDF4', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconBuildingHospital size={24} />
            </div>
            {doctor.name} - এর চেম্বারসমূহ
          </Modal.Title>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowHospitalModal(false); }}
            style={{ background: '#F1F5F9', border: 'none', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', transition: '0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}
            onMouseLeave={e => e.currentTarget.style.background = '#F1F5F9'}
          >
            <IconX size={20} />
          </button>
        </Modal.Header>
        <Modal.Body style={{ padding: '24px', background: '#F8FAFC' }}>
          {doctor.chambers && doctor.chambers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {doctor.chambers.map((chamber, i) => (
                <div key={chamber.id || i} style={{ background: 'white', borderRadius: 16, padding: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 800, color: '#1E293B', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <IconMapPin size={18} color="#059669" />
                        {chamber.hospital?.name || chamber.hospital_name || 'চেম্বার'}
                      </h4>
                      <p style={{ fontSize: 13, color: '#64748B', margin: 0, paddingLeft: 24 }}>{chamber.address || chamber.hospital?.address || 'ঠিকানা দেওয়া নেই'}</p>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#059669', background: '#F0FDF4', padding: '6px 12px', borderRadius: 8 }}>
                      ৳ {toBnNum(chamber.fee) || fee}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#F8FAFC', padding: '12px', borderRadius: 10, marginTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <IconClock size={16} color="#64748B" />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
                        {chamber.day || 'শনি - বৃহস্পতি'} ({chamber.start_time || '5:00 PM'} - {chamber.end_time || '9:00 PM'})
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                    <button 
                      onClick={(e) => handleBookChamber(chamber.id, e)}
                      style={{ background: '#059669', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <IconCalendarPlus size={16} />
                      অ্যাপয়েন্টমেন্ট নিন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B', fontWeight: 600 }}>
              কোনো চেম্বার তথ্য পাওয়া যায়নি।
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default memo(DoctorCard)

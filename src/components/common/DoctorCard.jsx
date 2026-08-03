import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from 'react-bootstrap'
import {
  IconStarFilled, IconStethoscope, IconShieldCheck, IconBuildingHospital, IconCalendarPlus, IconMapPin, IconClock, IconX, IconExternalLink, IconHeart
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
        border: '1.5px solid #F1F5F9',
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
        e.currentTarget.style.borderColor = '#F1F5F9'
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
      <div style={{ display: 'flex', gap: 16, padding: showBookingButton ? '16px' : '16px 16px 12px 16px', flex: 1 }}>
        
        {/* Left Column (Photo, Verified Rosette, Experience) */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', width: 80 }}>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <OptimizedImage
              src={getMediaUrl(doctor.photo)}
              fallback={DEMO_AVATAR}
              alt={doctor.name}
              width={80}
              height={80}
              borderRadius={7}
              style={{ objectFit: 'cover', background: '#F1F5F9' }}
            />
            {/* Rosette Verified Badge */}
            <div style={{
              position: 'absolute',
              bottom: -8,
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
          
          {/* Experience Stack Below Photo */}
          <div style={{ textAlign: 'center', marginTop: 2 }}>
            <div style={{ color: '#0F172A', fontWeight: 800, fontSize: 14 }}>
              {experience} {String(experience).includes('বছর') ? '' : 'বছর+'}
            </div>
            <div style={{ color: '#64748B', fontSize: 12, fontWeight: 500 }}>
              অভিজ্ঞতা
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
            margin: '0 0 0px 0',
            lineHeight: 1.3,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%'
          }} title={doctor.name}>
            {doctor.name}
          </h3>
          <div style={{ color: '#475569', fontSize: 13, marginBottom: 2 }}>
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
            marginBottom: 4,
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

          {/* Visiting Fee */}
          <div style={{ marginTop: 2, fontSize: 13, color: '#475569', fontWeight: 500 }}>
            <span style={{ color: '#64748B' }}>ভিজিট ফি:</span>{' '}
            <span style={{ color: '#0F172A', fontWeight: 800, fontSize: 14 }}>৳{fee}</span>
          </div>

          {/* Ratings & Visits (Single Row, No Wrapping) */}
          <div 
            className={showBookingButton ? "d-flex" : "d-none d-md-flex"} 
            style={{ alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 4, whiteSpace: 'nowrap' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
              <IconStarFilled size={15} color="#F59E0B" />
              <span style={{ color: '#475569', fontSize: 12, fontWeight: 600 }}>৫</span>
              <span style={{ color: '#94A3B8', fontSize: 12 }}>(১৩৪৫)</span>
            </div>
            <span style={{ color: '#E2E8F0' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
              <IconStethoscope size={15} color="#3B82F6" />
              <span style={{ color: '#475569', fontSize: 12 }}>৪,৮৬৩ ভিজিট</span>
            </div>
          </div>

          {/* Know about doctor link */}
          <div style={{ marginTop: 0 }}>
            <span
              onClick={handleDetails}
              style={{
                color: '#2563EB',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                gap: 4
              }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              ডাক্তার সম্পর্কে জানুন
              <IconExternalLink size={14} stroke={2.2} />
            </span>
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

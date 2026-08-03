import { useState } from 'react'
import { Container } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAppointments } from '../api/appointmentApi'
import { AppointmentListSkeleton } from '../components/common/Skeletons'
import { useTranslation } from 'react-i18next'
import { MapPin, Calendar, Clock, ChevronRight, Circle } from 'lucide-react'

const STATUS_MAP = {
  pending: 'আসন্ন',
  confirmed: 'আসন্ন',
  cancelled: 'বাতিল',
  completed: 'সম্পন্ন'
}

const STATUS_STYLES = {
  pending:   { bg: '#ECFDF5', color: '#047857', dot: '#10B981' },
  confirmed: { bg: '#ECFDF5', color: '#047857', dot: '#10B981' },
  cancelled: { bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' },
  completed: { bg: '#EFF6FF', color: '#2563EB', dot: '#3B82F6' },
}

const getAvatarColors = (name) => {
  const colors = [
    { bg: '#E0F2FE', text: '#0369A1' }, // Blue
    { bg: '#FCE7F3', text: '#BE185D' }, // Pink
    { bg: '#FEF3C7', text: '#B45309' }, // Yellow
    { bg: '#D1FAE5', text: '#047857' }, // Green
    { bg: '#F3E8FF', text: '#7E22CE' }, // Purple
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.replace('Dr.', '').replace('ডা.', '').trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

function MyAppointmentsPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const language = i18n.language

  const { data: appointments = [], isLoading: loading, isError, error: queryError } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: async () => {
      const res = await getAppointments()
      const data = res.data?.data || res.data || []
      return Array.isArray(data) ? data : []
    },
  })

  const error = isError ? (queryError?.message || t('failed_load_appointments') || 'Failed to load appointments.') : ''

  return (
    <div className="page-wrapper" style={{ background: '#FAFAFA', minHeight: '100vh', paddingBottom: 60 }}>
      {/* Header Section */}
      <Container style={{ paddingTop: 40, paddingBottom: 24, textAlign: 'center' }}>
        <h2 style={{ fontWeight: 800, color: '#111827', fontSize: 24, marginBottom: 8, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          আমার অ্যাপয়েন্টমেন্ট
        </h2>
        <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>
          আপনার সকল অ্যাপয়েন্টমেন্ট এক জায়গায়
        </p>
      </Container>

      {/* List Section */}
      <Container>
        {loading && <AppointmentListSkeleton count={4} />}
        {error && <div style={{ textAlign: 'center', color: '#c53030', padding: 40 }}>⚠️ {error}</div>}
        
        {!loading && !error && appointments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
            <h5 style={{ fontWeight: 700, color: '#111827', marginBottom: 8 }}>{t('no_appointments')}</h5>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>{t('book_first_appt')}</p>
            <button onClick={() => navigate('/doctors')} style={{ background: '#00A88C', color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer' }}>
              {t('find_doctor')}
            </button>
          </div>
        )}

        {!loading && appointments.length > 0 && (
          <div className="row g-3 g-lg-4">
            {appointments.map(appt => {
              const status = appt.status || 'pending'
              const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.pending
              const doctorName = appt.doctor_name || 'Assigned Doctor'
              const avatarColor = getAvatarColors(doctorName)
              const initials = getInitials(doctorName)
              
              // In a real app we might have these on the doctor object, falling back to dummy strings
              const specialty = appt.doctor?.specialty?.name || 'জেনারেল ফিজিশিয়ান'
              const qualifications = appt.doctor?.degree || 'MBBS, BCS (Health)'
              const location = appt.hospital?.name || 'ইবনে সিনা হাসপাতাল, খুলনা'
              
              // Pick specialty color (hardcoded based on mockup, but could be dynamic)
              let specialtyColor = '#059669'; // Default green
              if (specialty.includes('কার্ডিওলজিস্ট') || specialty.toLowerCase().includes('cardio')) specialtyColor = '#2563EB';

              return (
                <div key={appt.id} className="col-12 col-lg-6">
                  <div 
                    onClick={() => navigate(`/my-appointments/${appt.id}`)}
                    style={{ 
                      background: '#FFFFFF', 
                      borderRadius: 16, 
                      border: '1px solid #E5E7EB', 
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease',
                      gap: 12,
                      height: '100%'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = '0 6px 12px -2px rgba(0,0,0,0.1), 0 3px 6px -3px rgba(0,0,0,0.06)';
                      e.currentTarget.style.borderColor = '#D1D5DB';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }}
                  >
                    
                    {/* Left Side: Avatar and Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                      {/* Avatar */}
                      {appt.doctor?.image ? (
                        <img 
                          src={appt.doctor.image} 
                          alt={doctorName} 
                          style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} 
                        />
                      ) : (
                        <div style={{ 
                          width: 60, height: 60, borderRadius: '50%', 
                          background: avatarColor.bg, color: avatarColor.text, 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          fontSize: 22, fontWeight: 700, flexShrink: 0
                        }}>
                          {initials}
                        </div>
                      )}

                      {/* Info */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                        <h4 style={{ fontWeight: 700, color: '#111827', fontSize: '1.05rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {doctorName}
                        </h4>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: specialtyColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {specialty}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#4B5563', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {qualifications}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <MapPin size={12} color="#6B7280" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: '0.8rem', color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Status, Date, Time */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                        {/* Status Badge */}
                        <div style={{ 
                          display: 'flex', alignItems: 'center', gap: 6, 
                          background: statusStyle.bg, padding: '4px 10px', borderRadius: 9999 
                        }}>
                          <Circle size={6} fill={statusStyle.dot} color={statusStyle.dot} />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: statusStyle.color }}>
                            {STATUS_MAP[status] || STATUS_MAP.pending}
                          </span>
                        </div>

                        {/* Date & Time block */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={13} color="#6B7280" />
                            <span style={{ fontSize: '0.8rem', color: '#4B5563', fontWeight: 500 }}>
                              {appt.date ? new Date(appt.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' }) : 'N/A'}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Clock size={13} color="#6B7280" />
                            <span style={{ fontSize: '0.8rem', color: '#4B5563', fontWeight: 500 }}>
                              {appt.time || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight size={20} color="#9CA3AF" />
                    </div>

                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Container>
    </div>
  )
}

export default MyAppointmentsPage

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Stethoscope, Building, Clock, Activity, Radio } from 'lucide-react'

const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBn = (str) => (str !== null && str !== undefined ? String(str).replace(/\d/g, (d) => enToBn[d] || d) : '—')

/**
 * PatientLiveQueueSummaryCard
 * Orange-themed Doctor Live Serial Board with clear top-right Live Badge.
 */
export default function PatientLiveQueueSummaryCard({ appointment }) {
  const navigate = useNavigate()

  if (!appointment) return null

  const doctorName = appointment.doctor?.name || appointment.doctor_name || 'নির্ধারিত চিকিৎসক'
  const hospitalName = appointment.chamber?.hospital?.name || appointment.hospital?.name || appointment.hospital_name || ''
  const timeSlot = appointment.time_slot || appointment.appointment_time || appointment.schedule || 'আজকের শিডিউল'
  
  const mySerial = Number(appointment.serial_number || appointment.serial_no || 0)
  const currentServing = appointment.current_serial !== undefined && appointment.current_serial !== null ? Number(appointment.current_serial) : null
  
  let patientsAhead = 0
  if (mySerial > 0 && currentServing !== null) {
    patientsAhead = Math.max(0, mySerial - currentServing - 1)
  } else if (appointment.waiting_count !== undefined && appointment.waiting_count !== null) {
    patientsAhead = Math.max(0, Number(appointment.waiting_count))
  }

  const rawStatus = (appointment.queue_status || appointment.status || 'waiting').toLowerCase()
  const isServingNow = rawStatus === 'serving' || (currentServing !== null && currentServing === mySerial)
  const isOnBreak = rawStatus === 'break' || Boolean(appointment.is_on_break || appointment.chamber?.is_on_break)

  let statusText = 'অপেক্ষমাণ'
  let statusBadgeBg = '#EFF6FF'
  let statusBadgeColor = '#1E40AF'
  let statusBadgeBorder = '#BFDBFE'

  if (isServingNow) {
    statusText = 'রুমে প্রবেশ করুন'
    statusBadgeBg = '#ECFDF5'
    statusBadgeColor = '#065F46'
    statusBadgeBorder = '#6EE7B7'
  } else if (isOnBreak) {
    statusText = 'বিরতিতে আছেন'
    statusBadgeBg = '#FEF2F2'
    statusBadgeColor = '#991B1B'
    statusBadgeBorder = '#FECACA'
  } else if (currentServing !== null && mySerial === currentServing + 1) {
    statusText = 'প্রস্তুত থাকুন'
    statusBadgeBg = '#FFFBEB'
    statusBadgeColor = '#92400E'
    statusBadgeBorder = '#FDE68A'
  }

  const apptId = appointment.id || appointment._id || appointment.appointment_id || appointment.registration_id

  const handleOpenTicket = () => {
    navigate('/my-appointments/' + apptId, { state: { appointment } })
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #EA580C 0%, #D97706 100%)',
      borderRadius: 18,
      padding: '18px 20px',
      marginBottom: 24,
      color: '#FFFFFF',
      boxShadow: '0 8px 25px rgba(234, 88, 12, 0.3)',
      border: '2px solid #FDBA74',
      fontFamily: "'Hind Siliguri', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top Bar: Title on Left, Dynamic Live Badge on Right */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div style={{
          fontSize: '1.05rem',
          fontWeight: 900,
          color: '#FFFFFF',
          letterSpacing: '-0.2px',
          textShadow: '0 1px 3px rgba(0,0,0,0.25)',
        }}>
          ডাক্তারের লাইভ সিরিয়াল বোর্ড
        </div>

        {/* Dynamic Glowing Live Radar Beacon */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: '#0F172A',
          padding: '4px 12px',
          borderRadius: 999,
          border: '1.5px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          <Radio size={14} color="#4ADE80" className="animate-pulse" />
          <span style={{
            fontSize: '0.82rem',
            fontWeight: 900,
            color: '#4ADE80',
            letterSpacing: '0.5px',
          }}>
            লাইভ
          </span>
        </div>
      </div>

      {/* Action Button & Doctor Info Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        paddingBottom: 14,
        marginBottom: 14,
        borderBottom: '1.5px solid rgba(255, 255, 255, 0.25)',
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontSize: '1.05rem',
            fontWeight: 900,
            color: '#FFFFFF',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}>
            <Stethoscope size={18} color="#FEF08A" />
            <span>{doctorName}</span>
            {hospitalName && (
              <span style={{ color: '#FEF9C3', fontSize: '0.85rem', fontWeight: 700 }}>
                ({hospitalName})
              </span>
            )}
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            marginTop: 4,
            fontSize: '0.82rem',
            fontWeight: 800,
            color: '#FFFBEB',
          }}>
            <Clock size={14} color="#FEF08A" />
            <span>সময়: {timeSlot}</span>
          </div>
        </div>

        {/* High-Contrast CTA Button */}
        <button
          onClick={handleOpenTicket}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#FFFFFF',
            color: '#C2410C',
            padding: '8px 18px',
            borderRadius: 12,
            fontWeight: 900,
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#FFF7ED'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#FFFFFF'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <span>ডাক্তার সিরিয়াল লাইভ দেখুন</span>
          <ArrowRight size={16} color="#C2410C" />
        </button>
      </div>

      {/* 4 Crystal-Clear White Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
      }}>
        {/* 1. Current Serving */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 12,
          padding: '10px 8px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #FED7AA',
        }}>
          <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700 }}>
            বর্তমান সিরিয়াল
          </div>
          <div style={{
            fontSize: '1.45rem',
            fontWeight: 900,
            color: currentServing ? '#0F172A' : '#94A3B8',
            marginTop: 2,
            lineHeight: 1.1,
          }}>
            {currentServing ? toBn(String(currentServing).padStart(2, '0')) : '—'}
          </div>
        </div>

        {/* 2. Your Serial (Highlighted) */}
        <div style={{
          background: '#ECFDF5',
          borderRadius: 12,
          padding: '10px 8px',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(16,185,129,0.18)',
          border: '2px solid #10B981',
        }}>
          <div style={{ fontSize: '0.76rem', color: '#047857', fontWeight: 800 }}>
            আপনার সিরিয়াল
          </div>
          <div style={{
            fontSize: '1.45rem',
            fontWeight: 900,
            color: '#065F46',
            marginTop: 2,
            lineHeight: 1.1,
          }}>
            {toBn(String(mySerial).padStart(2, '0'))}
          </div>
        </div>

        {/* 3. Patients Ahead */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 12,
          padding: '10px 8px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #FED7AA',
        }}>
          <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700 }}>
            পূর্বে অপেক্ষমাণ
          </div>
          <div style={{
            fontSize: '1.35rem',
            fontWeight: 900,
            color: '#0F172A',
            marginTop: 2,
            lineHeight: 1.1,
          }}>
            {isServingNow ? '০' : toBn(patientsAhead)} জন
          </div>
        </div>

        {/* 4. Status */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 12,
          padding: '10px 6px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #FED7AA',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>
            বর্তমান অবস্থা
          </div>
          <div style={{
            fontSize: '0.76rem',
            fontWeight: 800,
            background: statusBadgeBg,
            color: statusBadgeColor,
            border: '1px solid ' + statusBadgeBorder,
            padding: '3px 6px',
            borderRadius: 6,
            marginTop: 3,
            whiteSpace: 'nowrap',
          }}>
            {statusText}
          </div>
        </div>
      </div>
    </div>
  )
}

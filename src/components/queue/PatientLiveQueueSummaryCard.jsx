import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Stethoscope, Clock, CalendarClock, Radio, Coffee, Users, Sparkles, MapPin, Activity } from 'lucide-react'
import { subscribeToPublicChamber, subscribeToAppointment } from '../../utils/echoService'
import { getMediaUrl } from '../../utils/mediaUtils'

const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBn = (str) => (str !== null && str !== undefined ? String(str).replace(/\d/g, (d) => enToBn[d] || d) : '—')

/**
 * Format any time string (e.g. "17:40:00", "17:40", "05:40 PM") to 12-hour Bangla time string.
 */
const formatTime12h = (timeStr) => {
  if (!timeStr) return null
  const cleaned = String(timeStr).trim()
  if (!cleaned || cleaned === 'null' || cleaned === 'undefined') return null

  // If already in range like "17:00:00 - 21:00:00"
  if (cleaned.includes('-')) {
    const parts = cleaned.split('-').map(p => formatTime12h(p.trim())).filter(Boolean)
    if (parts.length === 2) return `${parts[0]} - ${parts[1]}`
  }

  const m = cleaned.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM|am|pm)?$/i)
  if (m) {
    let hours = parseInt(m[1], 10)
    const minutes = m[2]
    const meridiem = (m[3] || '').toUpperCase()

    if (meridiem === 'PM' && hours < 12) hours += 12
    if (meridiem === 'AM' && hours === 12) hours = 0

    let period = 'সকাল'
    if (hours >= 12 && hours < 16) {
      period = 'দুপুর'
    } else if (hours >= 16 && hours < 18) {
      period = 'বিকেল'
    } else if (hours >= 18 && hours < 20) {
      period = 'সন্ধ্যা'
    } else if (hours >= 20 || hours < 5) {
      period = 'রাত'
    }
    const h12 = hours % 12 || 12
    return `${period} ${toBn(h12)}:${toBn(minutes)}`
  }

  return toBn(cleaned)
}

/**
 * PatientLiveQueueSummaryCard
 * Real-time dynamic live serial summary card for Patient Profile.
 * Subscribes to chamber & appointment WebSocket updates for instant notifications.
 */
export default function PatientLiveQueueSummaryCard({ appointment }) {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)

  // Real-time reactive state
  const [currentServing, setCurrentServing] = useState(() => {
    const s = appointment?.current_serial ?? appointment?.currently_serving_serial
    return s !== undefined && s !== null ? Number(s) : null
  })

  const [waitingCount, setWaitingCount] = useState(() => {
    const w = appointment?.waiting_count
    return w !== undefined && w !== null ? Number(w) : null
  })

  const [queueStatus, setQueueStatus] = useState(() => {
    return (appointment?.queue_status || appointment?.status || 'waiting').toLowerCase()
  })

  const [isOnBreak, setIsOnBreak] = useState(() => {
    return Boolean(appointment?.is_on_break || appointment?.chamber?.is_on_break)
  })

  const [breakReason, setBreakReason] = useState(() => {
    return appointment?.break_reason || appointment?.chamber?.break_reason || null
  })

  const [breakResumeTime, setBreakResumeTime] = useState(() => {
    return appointment?.break_resume_time || appointment?.chamber?.break_resume_time || null
  })

  // Sync state if appointment prop changes (e.g. from async HTTP fetch)
  useEffect(() => {
    if (!appointment) return
    const s = appointment.current_serial ?? appointment.currently_serving_serial
    if (s !== undefined && s !== null) setCurrentServing(Number(s))

    const w = appointment.waiting_count
    if (w !== undefined && w !== null) setWaitingCount(Number(w))

    if (appointment.queue_status || appointment.status) {
      setQueueStatus((appointment.queue_status || appointment.status).toLowerCase())
    }

    setIsOnBreak(Boolean(appointment.is_on_break || appointment.chamber?.is_on_break))
    setBreakReason(appointment.break_reason || appointment.chamber?.break_reason || null)
    setBreakResumeTime(appointment.break_resume_time || appointment.chamber?.break_resume_time || null)
    setImgError(false)
  }, [appointment])

  // Live WebSocket Subscription (Chamber & Appointment Channels)
  useEffect(() => {
    const displayToken = appointment?.chamber?.display_token || appointment?.display_token
    const regId = appointment?.registration_id
    if (!displayToken && !regId) return

    const handleUpdate = (payload) => {
      if (!payload) return

      if (payload.current_serial !== undefined) {
        setCurrentServing(payload.current_serial !== null ? Number(payload.current_serial) : null)
      }

      if (payload.waiting_count !== undefined) {
        setWaitingCount(Number(payload.waiting_count))
      }

      if (payload.event_type === 'BREAK') {
        setIsOnBreak(true)
        if (payload.break_reason !== undefined) setBreakReason(payload.break_reason)
        if (payload.break_resume_time !== undefined) setBreakResumeTime(payload.break_resume_time)
      } else if (payload.event_type === 'RESUME') {
        setIsOnBreak(false)
        setBreakReason(null)
        setBreakResumeTime(null)
      }

      if (payload.is_on_break !== undefined) {
        setIsOnBreak(Boolean(payload.is_on_break))
      }

      if (payload.break_reason !== undefined) {
        setBreakReason(payload.break_reason)
      }

      if (payload.break_resume_time !== undefined) {
        setBreakResumeTime(payload.break_resume_time)
      }

      if (payload.queue_status) {
        setQueueStatus(payload.queue_status.toLowerCase())
      }
    }

    let unsubChamber = null
    let unsubAppt = null

    if (displayToken) {
      unsubChamber = subscribeToPublicChamber(displayToken, handleUpdate)
    }
    if (regId) {
      unsubAppt = subscribeToAppointment(regId, handleUpdate)
    }

    return () => {
      if (unsubChamber) unsubChamber()
      if (unsubAppt) unsubAppt()
    }
  }, [appointment?.chamber?.display_token, appointment?.display_token, appointment?.registration_id])

  if (!appointment) return null

  const doctorName = appointment.doctor?.name || appointment.doctor_name || 'নির্ধারিত চিকিৎসক'
  const doctorPhoto = appointment.doctor?.photo || appointment.doctor?.photo_url || appointment.doctor_photo || appointment.doctor_photo_url || appointment.doctor?.avatar || appointment.doctor?.image
  const doctorPhotoUrl = doctorPhoto ? getMediaUrl(doctorPhoto) : null

  const hospitalName = (appointment.chamber?.hospital?.name || appointment.hospital?.name || appointment.hospital_name || '').trim()
  const chamberName = (appointment.chamber?.name || appointment.chamber_name || '').trim()

  // Clean deduplicated chamber & hospital display
  let chamberDisplay = chamberName
  if (hospitalName && (!chamberName || hospitalName.toLowerCase() !== chamberName.toLowerCase())) {
    chamberDisplay = chamberName ? `${chamberName} • ${hospitalName}` : hospitalName
  } else if (!chamberDisplay) {
    chamberDisplay = hospitalName
  }

  // Accurate Booking Time & Chamber Schedule resolution
  const bookingTimeRaw = appointment.time || appointment.appointment_time || appointment.time_slot
  const formattedBookingTime = formatTime12h(bookingTimeRaw)

  const chamberStart = appointment.chamber?.start_time ? formatTime12h(appointment.chamber.start_time) : null
  const chamberEnd = appointment.chamber?.end_time ? formatTime12h(appointment.chamber.end_time) : null
  const chamberScheduleText = (chamberStart && chamberEnd) ? `${chamberStart} - ${chamberEnd}` : null

  const mySerial = Number(appointment.serial_number || appointment.serial_no || 0)

  const isServingNow = queueStatus === 'serving' || (currentServing !== null && currentServing === mySerial)
  const isNextInLine = currentServing !== null && mySerial === currentServing + 1

  // Synchronized math with PatientLiveQueueTracker
  let patientsAhead = 0
  if (mySerial > 0) {
    if (isServingNow) {
      patientsAhead = 0
    } else if (currentServing !== null && currentServing > 0) {
      patientsAhead = Math.max(0, mySerial - currentServing - 1)
    } else {
      // Chamber has not started serving yet: all serials prior to mySerial are waiting ahead
      patientsAhead = Math.max(0, mySerial - 1)
    }
  }

  let statusText = 'অপেক্ষমাণ'
  let statusBadgeBg = '#EFF6FF'
  let statusBadgeColor = '#1D4ED8'
  let statusBadgeBorder = '#BFDBFE'

  if (isOnBreak) {
    statusText = breakReason ? breakReason : 'বিরতিতে আছেন'
    statusBadgeBg = '#FEF2F2'
    statusBadgeColor = '#B91C1C'
    statusBadgeBorder = '#FECACA'
  } else if (isServingNow) {
    statusText = 'রুমে প্রবেশ করুন'
    statusBadgeBg = '#ECFDF5'
    statusBadgeColor = '#047857'
    statusBadgeBorder = '#6EE7B7'
  } else if (isNextInLine) {
    statusText = 'প্রস্তুত থাকুন'
    statusBadgeBg = '#FFFBEB'
    statusBadgeColor = '#B45309'
    statusBadgeBorder = '#FDE68A'
  }

  const apptId = appointment.id || appointment._id || appointment.appointment_id || appointment.registration_id

  const handleOpenTicket = () => {
    navigate('/my-appointments/' + apptId, { state: { appointment } })
  }

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 18,
      padding: '16px 14px',
      marginBottom: 20,
      color: '#0F172A',
      boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
      border: '1.5px solid #E2E8F0',
      fontFamily: "'Hind Siliguri', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
      width: '100%',
    }}>
      {/* Inline styles for pulse animations */}
      <style>{`
        @keyframes livePulseRadar {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      {/* Top Header Row: Card Title & Broadcast Live Beacon */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingBottom: 10,
        borderBottom: '1px solid #F1F5F9',
        width: '100%',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          fontSize: '0.98rem',
          fontWeight: 900,
          color: '#0F172A',
          letterSpacing: '-0.2px',
        }}>
          <Activity size={18} color="#0D9488" />
          <span>ডাক্তারের লাইভ সিরিয়াল বোর্ড</span>
        </div>

        {/* Real Broadcast Red LIVE Beacon */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: '#FEF2F2',
          border: '1.5px solid #FCA5A5',
          padding: '3px 10px',
          borderRadius: 999,
          boxShadow: '0 1px 4px rgba(239, 68, 68, 0.12)',
          flexShrink: 0,
        }}>
          <span style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 8,
            width: 8,
          }}>
            <span style={{
              position: 'absolute',
              display: 'inline-flex',
              height: 14,
              width: 14,
              borderRadius: '50%',
              backgroundColor: '#EF4444',
              animation: 'livePulseRadar 1.8s ease-out infinite',
            }} />
            <span style={{
              position: 'relative',
              display: 'inline-flex',
              borderRadius: '50%',
              height: 7,
              width: 7,
              backgroundColor: '#DC2626',
            }} />
          </span>
          <span style={{
            fontSize: '0.74rem',
            fontWeight: 900,
            color: '#DC2626',
            letterSpacing: '0.6px',
            lineHeight: 1,
          }}>
            লাইভ
          </span>
        </div>
      </div>

      {/* Break Alert Banner (Shown during Doctor Breaks) */}
      {isOnBreak && (
        <div style={{
          background: '#FFFBEB',
          border: '1.5px solid #FDE68A',
          borderRadius: 12,
          padding: '10px 12px',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: '#92400E',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <Coffee size={18} color="#D97706" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.84rem', fontWeight: 800, lineHeight: 1.35 }}>
            <span>{breakReason || 'চা বিরতি'} চলছে</span>
            {breakResumeTime && (
              <span style={{ marginLeft: 6, color: '#B45309', fontWeight: 700 }}>
                • চেম্বার ফেরার সময়: {toBn(breakResumeTime)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Doctor & Schedule Profile Strip */}
      <div style={{
        background: '#F8FAFC',
        borderRadius: 14,
        padding: '12px',
        marginBottom: 12,
        border: '1px solid #E2E8F0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Doctor Photo with Fallback Stethoscope Avatar */}
          {doctorPhotoUrl && !imgError ? (
            <img
              src={doctorPhotoUrl}
              alt={doctorName}
              onError={() => setImgError(true)}
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                objectFit: 'cover',
                border: '2px solid #10B981',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              }}
            />
          ) : (
            <div style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: '#ECFDF5',
              border: '1.5px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              flexShrink: 0,
            }}>
              <Stethoscope size={22} />
            </div>
          )}

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: '1rem',
              fontWeight: 900,
              color: '#0F172A',
              lineHeight: 1.25,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {doctorName}
            </div>
            {chamberDisplay && (
              <div style={{
                fontSize: '0.8rem',
                color: '#64748B',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                <MapPin size={12} color="#94A3B8" style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{chamberDisplay}</span>
              </div>
            )}
          </div>
        </div>

        {/* Schedule & Booking Time Strip (Perfect Vertical & Horizontal Alignment) */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 10,
          border: '1px solid #E2E8F0',
          marginTop: 10,
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          {/* Row 1: Booking Time */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem',
            color: '#334155',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
              <Clock size={14} color="#0D9488" style={{ flexShrink: 0 }} />
              <span>আপনার বুকিং সময়:</span>
            </div>
            <div style={{
              fontWeight: 900,
              color: '#0F172A',
              background: '#F1F5F9',
              padding: '2px 8px',
              borderRadius: 6,
              fontSize: '0.82rem',
            }}>
              {formattedBookingTime || 'আজকের শিডিউল'}
            </div>
          </div>

          {/* Row 2: Chamber Schedule */}
          {chamberScheduleText && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: '#64748B',
              borderTop: '1px dashed #E2E8F0',
              paddingTop: 6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <CalendarClock size={14} color="#64748B" style={{ flexShrink: 0 }} />
                <span>চেম্বার শিডিউল:</span>
              </div>
              <div style={{ fontWeight: 700, color: '#475569' }}>
                {chamberScheduleText}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2x2 Clean Minimal Stat Grid - Centered Numbers, Zero Clutter */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
        width: '100%',
        boxSizing: 'border-box',
        marginBottom: 12,
      }}>
        {/* Card 1: Current Serving */}
        <div style={{
          background: '#F8FAFC',
          borderRadius: 12,
          padding: '12px 8px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: 74,
          boxSizing: 'border-box',
        }}>
          <div style={{
            fontSize: '0.78rem',
            color: '#64748B',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}>
            <Radio size={13} color="#0D9488" />
            <span>বর্তমান সিরিয়াল</span>
          </div>
          <div style={{
            fontSize: '1.55rem',
            fontWeight: 900,
            color: currentServing ? '#0F172A' : '#94A3B8',
            marginTop: 4,
            lineHeight: 1.1,
            textAlign: 'center',
          }}>
            {currentServing ? toBn(String(currentServing).padStart(2, '0')) : '—'}
          </div>
        </div>

        {/* Card 2: Your Serial (Highlighted Emerald Hero) */}
        <div style={{
          background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
          borderRadius: 12,
          padding: '12px 8px',
          boxShadow: '0 2px 10px rgba(16,185,129,0.15)',
          border: '1.5px solid #10B981',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: 74,
          boxSizing: 'border-box',
        }}>
          <div style={{
            fontSize: '0.78rem',
            color: '#047857',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}>
            <Sparkles size={13} color="#059669" />
            <span>আপনার সিরিয়াল</span>
          </div>
          <div style={{
            fontSize: '1.55rem',
            fontWeight: 900,
            color: '#065F46',
            marginTop: 4,
            lineHeight: 1.1,
            textAlign: 'center',
          }}>
            {toBn(String(mySerial).padStart(2, '0'))}
          </div>
        </div>

        {/* Card 3: Patients Ahead */}
        <div style={{
          background: '#F8FAFC',
          borderRadius: 12,
          padding: '12px 8px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: 74,
          boxSizing: 'border-box',
        }}>
          <div style={{
            fontSize: '0.78rem',
            color: '#64748B',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}>
            <Users size={13} color="#0284C7" />
            <span>পূর্বে অপেক্ষমাণ</span>
          </div>
          <div style={{
            fontSize: '1.55rem',
            fontWeight: 900,
            color: '#0F172A',
            marginTop: 4,
            lineHeight: 1.1,
            textAlign: 'center',
          }}>
            {isServingNow ? '০' : toBn(patientsAhead)} জন
          </div>
        </div>

        {/* Card 4: Status */}
        <div style={{
          background: '#F8FAFC',
          borderRadius: 12,
          padding: '12px 8px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: 74,
          boxSizing: 'border-box',
        }}>
          <div style={{
            fontSize: '0.78rem',
            color: '#64748B',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}>
            <Activity size={13} color="#6366F1" />
            <span>সিরিয়াল অবস্থা</span>
          </div>
          <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center' }}>
            <span style={{
              display: 'inline-block',
              fontSize: '0.82rem',
              fontWeight: 800,
              background: statusBadgeBg,
              color: statusBadgeColor,
              border: '1px solid ' + statusBadgeBorder,
              padding: '3px 10px',
              borderRadius: 6,
              lineHeight: 1.2,
              textAlign: 'center',
            }}>
              {statusText}
            </span>
          </div>
        </div>
      </div>

      {/* Full-Width Mobile-Optimized Emerald CTA Button */}
      <button
        onClick={handleOpenTicket}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: 'linear-gradient(135deg, #059669 0%, #0D9488 100%)',
          color: '#FFFFFF',
          padding: '12px 16px',
          borderRadius: 12,
          fontWeight: 800,
          fontSize: '0.92rem',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(5, 150, 105, 0.28)',
          transition: 'all 0.2s ease',
          boxSizing: 'border-box',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 6px 18px rgba(5, 150, 105, 0.35)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(5, 150, 105, 0.28)'
        }}
      >
        <span>ডাক্তার সিরিয়াল ও টিকেট লাইভ দেখুন</span>
        <ArrowRight size={16} color="#FFFFFF" />
      </button>
    </div>
  )
}

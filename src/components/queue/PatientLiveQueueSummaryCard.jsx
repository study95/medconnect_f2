import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Stethoscope, Clock, Radio, Coffee } from 'lucide-react'
import { subscribeToPublicChamber, subscribeToAppointment } from '../../utils/echoService'

const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBn = (str) => (str !== null && str !== undefined ? String(str).replace(/\d/g, (d) => enToBn[d] || d) : '—')

/**
 * PatientLiveQueueSummaryCard
 * Real-time dynamic live serial summary card for Patient Profile.
 * Subscribes to chamber & appointment WebSocket updates for instant break notifications.
 */
export default function PatientLiveQueueSummaryCard({ appointment }) {
  const navigate = useNavigate()

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
  const hospitalName = appointment.chamber?.hospital?.name || appointment.hospital?.name || appointment.hospital_name || ''
  const timeSlot = appointment.time_slot || appointment.appointment_time || appointment.schedule || 'আজকের শিডিউল'
  const mySerial = Number(appointment.serial_number || appointment.serial_no || 0)

  let patientsAhead = 0
  if (mySerial > 0 && currentServing !== null) {
    patientsAhead = Math.max(0, mySerial - currentServing - 1)
  } else if (waitingCount !== null) {
    patientsAhead = Math.max(0, Number(waitingCount))
  }

  const isServingNow = queueStatus === 'serving' || (currentServing !== null && currentServing === mySerial)

  let statusText = 'অপেক্ষমাণ'
  let statusBadgeBg = '#EFF6FF'
  let statusBadgeColor = '#1E40AF'
  let statusBadgeBorder = '#BFDBFE'

  if (isOnBreak) {
    statusText = breakReason ? breakReason : 'বিরতিতে আছেন'
    statusBadgeBg = '#FEF2F2'
    statusBadgeColor = '#991B1B'
    statusBadgeBorder = '#FECACA'
  } else if (isServingNow) {
    statusText = 'রুমে প্রবেশ করুন'
    statusBadgeBg = '#ECFDF5'
    statusBadgeColor = '#065F46'
    statusBadgeBorder = '#6EE7B7'
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
      borderRadius: 16,
      padding: '14px 12px',
      marginBottom: 20,
      color: '#FFFFFF',
      boxShadow: '0 8px 25px rgba(234, 88, 12, 0.25)',
      border: '1.5px solid #FDBA74',
      fontFamily: "'Hind Siliguri', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
      width: '100%',
    }}>
      {/* Top Bar: Title on Left, Dynamic Live Badge on Right */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        width: '100%',
      }}>
        <div style={{
          fontSize: '0.98rem',
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
          gap: 5,
          background: '#0F172A',
          padding: '3px 10px',
          borderRadius: 999,
          border: '1.5px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          flexShrink: 0,
        }}>
          <Radio size={13} color="#4ADE80" className="animate-pulse" />
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 900,
            color: '#4ADE80',
            letterSpacing: '0.5px',
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
          borderRadius: 10,
          padding: '8px 12px',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: '#92400E',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <Coffee size={17} color="#D97706" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.82rem', fontWeight: 800, lineHeight: 1.3 }}>
            <span>{breakReason || 'চা বিরতি'} চলছে</span>
            {breakResumeTime && (
              <span style={{ marginLeft: 6, color: '#B45309', fontWeight: 700 }}>
                • ফেরার সময়: {breakResumeTime}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Button & Doctor Info Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        paddingBottom: 12,
        marginBottom: 12,
        borderBottom: '1.5px solid rgba(255, 255, 255, 0.25)',
        width: '100%',
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.96rem',
            fontWeight: 900,
            color: '#FFFFFF',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            <Stethoscope size={16} color="#FEF08A" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{doctorName}</span>
            {hospitalName && (
              <span style={{ color: '#FEF9C3', fontSize: '0.8rem', fontWeight: 700, opacity: 0.9, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                ({hospitalName})
              </span>
            )}
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 3,
            fontSize: '0.78rem',
            fontWeight: 800,
            color: '#FFFBEB',
          }}>
            <Clock size={13} color="#FEF08A" />
            <span>সময়: {timeSlot}</span>
          </div>
        </div>

        {/* High-Contrast CTA Button */}
        <button
          onClick={handleOpenTicket}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            background: '#FFFFFF',
            color: '#C2410C',
            padding: '7px 14px',
            borderRadius: 10,
            fontWeight: 900,
            fontSize: '0.82rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            flexShrink: 0,
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
          <ArrowRight size={14} color="#C2410C" />
        </button>
      </div>

      {/* 4 Crystal-Clear White Metric Cards (Zero Clipping, Fluid Width) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 6,
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {/* 1. Current Serving */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 10,
          padding: '8px 4px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #FED7AA',
          minWidth: 0,
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}>
          <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            বর্তমান সিরিয়াল
          </div>
          <div style={{
            fontSize: '1.25rem',
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
          borderRadius: 10,
          padding: '8px 4px',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(16,185,129,0.18)',
          border: '1.5px solid #10B981',
          minWidth: 0,
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}>
          <div style={{ fontSize: '0.68rem', color: '#047857', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            আপনার সিরিয়াল
          </div>
          <div style={{
            fontSize: '1.25rem',
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
          borderRadius: 10,
          padding: '8px 4px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #FED7AA',
          minWidth: 0,
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}>
          <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            পূর্বে অপেক্ষমাণ
          </div>
          <div style={{
            fontSize: '1.2rem',
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
          borderRadius: 10,
          padding: '8px 3px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #FED7AA',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minWidth: 0,
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}>
          <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            বর্তমান অবস্থা
          </div>
          <div style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            background: statusBadgeBg,
            color: statusBadgeColor,
            border: '1px solid ' + statusBadgeBorder,
            padding: '2px 4px',
            borderRadius: 5,
            marginTop: 3,
            whiteSpace: 'nowrap',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {statusText}
          </div>
        </div>
      </div>
    </div>
  )
}

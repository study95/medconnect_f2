import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Stethoscope, Clock, CalendarClock, Radio, Coffee, Users, Sparkles, MapPin, Activity, Hourglass, AlertCircle } from 'lucide-react'
import { subscribeToPublicChamber, subscribeToAppointment, onConnectionStateChange, isWebSocketConnected } from '../../utils/echoService'
import { getPublicDisplayBoard } from '../../api/appointmentApi'
import { getMediaUrl } from '../../utils/mediaUtils'
import { calculateDynamicWaitTime, toBn } from '../../utils/queueWaitHelper'

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

  const [slotDuration, setSlotDuration] = useState(() => {
    return Number(appointment?.slot_duration_minutes || appointment?.chamber?.slot_duration_minutes || 10)
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

  // Periodic minute-tick to update dynamic time range naturally without reload
  const [, setMinuteTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setMinuteTick(t => t + 1)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

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

    if (appointment.slot_duration_minutes || appointment.chamber?.slot_duration_minutes) {
      setSlotDuration(Number(appointment.slot_duration_minutes || appointment.chamber?.slot_duration_minutes))
    }

    setIsOnBreak(Boolean(appointment.is_on_break || appointment.chamber?.is_on_break))
    setBreakReason(appointment.break_reason || appointment.chamber?.break_reason || null)
    setBreakResumeTime(appointment.break_resume_time || appointment.chamber?.break_resume_time || null)
    setImgError(false)
  }, [appointment])

  // Live WebSocket Subscription + Smart Dual-Fallback Polling Engine
  useEffect(() => {
    const displayToken = appointment?.chamber?.display_token || appointment?.display_token
    const regId = appointment?.registration_id
    const myApptPublicId = appointment?.public_id || appointment?.id
    const mySerial = Number(appointment?.serial_number || appointment?.serial_no || 0)
    if (!displayToken && !regId && !myApptPublicId) return

    let isSubscribed = true
    let isWsConnected = isWebSocketConnected ? isWebSocketConnected() : false

    const handleUpdate = (payload) => {
      if (!payload || !isSubscribed) return

      if (payload.current_serial !== undefined) {
        setCurrentServing(payload.current_serial !== null ? Number(payload.current_serial) : null)
      }

      if (payload.waiting_count !== undefined) {
        setWaitingCount(Number(payload.waiting_count))
      }

      if (payload.slot_duration_minutes !== undefined) {
        setSlotDuration(Number(payload.slot_duration_minutes))
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

      // Check if update is specifically targeted to this appointment
      const isTargetedToMe = (payload.appointment_public_id && (payload.appointment_public_id === myApptPublicId || payload.appointment_public_id === appointment?.id)) ||
                            (payload.registration_id && payload.registration_id === regId) ||
                            (payload.serial_number && Number(payload.serial_number) === mySerial)

      if (isTargetedToMe) {
        if (payload.queue_status) {
          setQueueStatus(payload.queue_status.toLowerCase())
        }
      } else if (payload.event_type === 'CALL_NEXT' && payload.current_serial !== undefined) {
        if (Number(payload.current_serial) === mySerial) {
          setQueueStatus('serving')
        } else if (Number(payload.current_serial) > mySerial) {
          setQueueStatus(prev => prev === 'no_show' ? 'no_show' : 'completed')
        }
      }
    }

    // Robust HTTP Polling fallback function (using public_id & serial_number)
    const fetchLatestQueueState = async () => {
      if (!displayToken || !isSubscribed) return
      try {
        const res = await getPublicDisplayBoard(displayToken)
        if (!isSubscribed) return
        const qData = res.data?.data || res.data
        if (!qData) return

        const serving = qData.currently_serving
        if (serving && serving.serial_number !== undefined) {
          setCurrentServing(Number(serving.serial_number))
        } else {
          setCurrentServing(null)
        }

        const stats = qData.statistics
        if (stats?.total_waiting !== undefined) {
          setWaitingCount(Number(stats.total_waiting))
        }

        const ch = qData.chamber
        if (ch?.slot_duration_minutes) {
          setSlotDuration(Number(ch.slot_duration_minutes))
        }

        const brk = qData.break
        if (brk) {
          setIsOnBreak(Boolean(brk.is_on_break))
          setBreakReason(brk.reason || null)
          setBreakResumeTime(brk.resume_time || null)
        }

        // Match patient by public_id, serial_number, or registration_id
        const isMyPatient = (p) => {
          if (!p) return false
          if (myApptPublicId && (p.id === myApptPublicId || p.public_id === myApptPublicId)) return true
          if (mySerial > 0 && p.serial_number !== undefined && Number(p.serial_number) === mySerial) return true
          if (regId && p.registration_id && p.registration_id === regId) return true
          return false
        }

        if (isMyPatient(serving)) {
          setQueueStatus('serving')
        } else {
          const inWaiting = (qData.waiting_patients || []).some(isMyPatient)
          const inCompleted = (qData.completed_patients || []).some(isMyPatient)
          const inNoShow = (qData.no_show_patients || []).some(isMyPatient)
          if (inCompleted) setQueueStatus('completed')
          else if (inNoShow) setQueueStatus('no_show')
          else if (inWaiting) setQueueStatus('waiting')
        }
      } catch (err) {
        // Silent background polling
      }
    }

    // 1. Initial immediate fetch to guarantee latest queue state
    fetchLatestQueueState()

    // 2. Setup WebSocket channel subscriptions
    let unsubChamber = null
    let unsubAppt = null
    try {
      if (displayToken) {
        unsubChamber = subscribeToPublicChamber(displayToken, handleUpdate)
      }
      const apptChannelKey = myApptPublicId || regId
      if (apptChannelKey) {
        unsubAppt = subscribeToAppointment(apptChannelKey, handleUpdate)
      }
    } catch (e) {
      console.warn('WebSocket subscription init failed, relying on polling fallback:', e)
    }

    // 3. Listen to WebSocket connection state transitions
    const unsubConn = onConnectionStateChange ? onConnectionStateChange((state) => {
      isWsConnected = state === 'connected'
      if (!isWsConnected) {
        fetchLatestQueueState()
      }
    }) : null

    // 4. Polling timer: 5 seconds interval
    const intervalTimer = setInterval(() => {
      fetchLatestQueueState()
    }, 5000)

    // 5. Visibility / Window focus listener (for mobile phone unlock or tab switch)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLatestQueueState()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isSubscribed = false
      if (unsubChamber) unsubChamber()
      if (unsubAppt) unsubAppt()
      if (unsubConn) unsubConn()
      clearInterval(intervalTimer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [appointment?.chamber?.display_token, appointment?.display_token, appointment?.public_id, appointment?.id, appointment?.registration_id, appointment?.serial_number, appointment?.serial_no])

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

  const isNoShow = queueStatus === 'no_show'
  const isCompleted = queueStatus === 'completed'
  const isCancelled = queueStatus === 'cancelled'
  const isServingNow = !isNoShow && !isCompleted && !isCancelled && (queueStatus === 'serving' || (currentServing !== null && currentServing === mySerial))
  const isNextInLine = !isNoShow && !isCompleted && !isCancelled && !isServingNow && currentServing !== null && mySerial === currentServing + 1

  // Synchronized math with PatientLiveQueueTracker
  let patientsAhead = 0
  if (mySerial > 0) {
    if (isServingNow || isNoShow) {
      patientsAhead = 0
    } else if (currentServing !== null && currentServing > 0) {
      // Total consultations before this patient: active patient in room + all preceding waiting patients
      patientsAhead = Math.max(0, mySerial - currentServing)
    } else {
      // Chamber has not started serving yet: all serials prior to mySerial are waiting ahead
      patientsAhead = Math.max(0, mySerial - 1)
    }
  }

  // Dynamic Intelligent Wait Time Calculation (Aware of pre-chamber vs active chamber)
  const dynamicWait = calculateDynamicWaitTime({
    patientsAhead,
    slotDurationMinutes: slotDuration,
    isOnBreak,
    breakResumeTime,
    isServingNow,
    isNextInLine,
    isNoShow,
    currentServing,
    bookingTimeRaw,
    chamberStartTimeRaw: appointment.chamber?.start_time,
  })

  let statusText = 'অপেক্ষমাণ'
  let statusBadgeBg = '#EFF6FF'
  let statusBadgeColor = '#1D4ED8'
  let statusBadgeBorder = '#BFDBFE'

  if (isNoShow) {
    statusText = 'অনুপস্থিত চিহ্নিত'
    statusBadgeBg = '#FEF2F2'
    statusBadgeColor = '#DC2626'
    statusBadgeBorder = '#FCA5A5'
  } else if (isOnBreak) {
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

      {/* Top Header Row: Card Title & Real Status Beacon */}
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

        {/* Dynamic Beacon: Real Red LIVE if chamber active, or Scheduled Badge if waiting to start */}
        {dynamicWait.isChamberActive ? (
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
        ) : (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            background: '#F1F5F9',
            border: '1.5px solid #CBD5E1',
            padding: '3px 10px',
            borderRadius: 999,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            flexShrink: 0,
          }}>
            <Clock size={12} color="#64748B" />
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              color: '#475569',
              letterSpacing: '0.2px',
              lineHeight: 1,
            }}>
              শুরুর অপেক্ষায়
            </span>
          </div>
        )}
      </div>

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

        {/* Schedule & Booking Time Strip */}
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

      {/* Dynamic Wait & Status Banner (Aware of pre-chamber vs live) */}
      <div style={{
        background: isNoShow
          ? '#FEF2F2'
          : (!dynamicWait.isChamberActive
            ? '#F8FAFC'
            : (isOnBreak ? '#FFFBEB' : (isServingNow ? '#ECFDF5' : '#F0FDF4'))),
        borderRadius: 14,
        padding: '11px 13px',
        marginBottom: 12,
        border: isNoShow
          ? '1.5px solid #FCA5A5'
          : (!dynamicWait.isChamberActive
            ? '1.5px solid #E2E8F0'
            : (isOnBreak ? '1.5px solid #FCD34D' : (isServingNow ? '1.5px solid #6EE7B7' : '1px solid #BBF7D0'))),
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        {/* Row 1: Wait / Chamber Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.84rem',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 800,
            color: isNoShow
              ? '#991B1B'
              : (!dynamicWait.isChamberActive
                ? '#475569'
                : (isOnBreak ? '#92400E' : (isServingNow ? '#065F46' : '#166534'))),
          }}>
            {isNoShow ? (
              <AlertCircle size={15} color="#DC2626" style={{ flexShrink: 0 }} />
            ) : (
              <Hourglass size={15} color={!dynamicWait.isChamberActive ? '#64748B' : (isOnBreak ? '#D97706' : (isServingNow ? '#059669' : '#16A34A'))} style={{ flexShrink: 0 }} />
            )}
            <span>{isNoShow ? 'বর্তমান অবস্থা:' : (!dynamicWait.isChamberActive ? 'চেম্বার অবস্থা:' : (isServingNow ? 'বর্তমান অবস্থা:' : 'আনুমানিক অপেক্ষা:'))}</span>
          </div>
          <div style={{
            fontWeight: 900,
            fontSize: '0.86rem',
            color: isNoShow
              ? '#DC2626'
              : (!dynamicWait.isChamberActive
                ? '#0F172A'
                : (isOnBreak ? '#B45309' : (isServingNow ? '#047857' : '#15803D'))),
            background: '#FFFFFF',
            padding: '2px 9px',
            borderRadius: 6,
            border: '1px solid ' + (isNoShow ? '#FECACA' : (!dynamicWait.isChamberActive ? '#E2E8F0' : (isOnBreak ? '#FDE68A' : (isServingNow ? '#A7F3D0' : '#DCFCE7')))),
          }}>
            {isNoShow ? 'অনুপস্থিত (No-Show)' : dynamicWait.waitRangeText}
          </div>
        </div>

        {/* Row 2: Estimated Serial Time Window */}
        {!isServingNow && !isNoShow && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: '#475569',
            borderTop: '1px dashed ' + (!dynamicWait.isChamberActive ? '#E2E8F0' : (isOnBreak ? '#FDE68A' : '#DCFCE7')),
            paddingTop: 6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
              <Sparkles size={13} color="#0D9488" style={{ flexShrink: 0 }} />
              <span>{!dynamicWait.isChamberActive ? 'নির্ধারিত পরামর্শ সময়:' : 'সম্ভাব্য সিরিয়াল সময়:'}</span>
            </div>
            <div style={{ fontWeight: 800, color: '#0F172A' }}>
              {dynamicWait.estTimeWindowText}
            </div>
          </div>
        )}

        {/* Status Notice (e.g. chamber starts at 5:00 PM notice, or break notice) */}
        {dynamicWait.statusNotice && (
          <div style={{
            fontSize: '0.73rem',
            fontWeight: 600,
            color: isNoShow ? '#B91C1C' : (!dynamicWait.isChamberActive ? '#64748B' : '#047857'),
            borderTop: '1px solid #F1F5F9',
            paddingTop: 5,
            marginTop: 1,
            lineHeight: 1.35,
          }}>
            {isNoShow ? '⚠️ ' : 'ℹ️ '} {dynamicWait.statusNotice}
          </div>
        )}

        {/* Doctor Break Notice with Dynamic Minutes Badge */}
        {isOnBreak && (
          <div style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            color: '#B45309',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginTop: 2,
          }}>
            <Coffee size={13} color="#D97706" style={{ flexShrink: 0 }} />
            <span>{breakReason || 'চা বিরতি'} চলছে (+{toBn(dynamicWait.remainingBreakMinutes)} মিনিট যুক্ত হয়েছে)</span>
          </div>
        )}
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

        {/* Card 2: Your Serial (Highlighted Emerald Hero / Muted Red if No-Show) */}
        <div style={{
          background: isNoShow
            ? '#FEF2F2'
            : 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
          borderRadius: 12,
          padding: '12px 8px',
          boxShadow: isNoShow ? '0 2px 10px rgba(239,68,68,0.1)' : '0 2px 10px rgba(16,185,129,0.15)',
          border: isNoShow ? '1.5px solid #FCA5A5' : '1.5px solid #10B981',
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
            color: isNoShow ? '#DC2626' : '#047857',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}>
            {isNoShow ? (
              <AlertCircle size={13} color="#DC2626" />
            ) : (
              <Sparkles size={13} color="#059669" />
            )}
            <span>আপনার সিরিয়াল</span>
          </div>
          <div style={{
            fontSize: '1.55rem',
            fontWeight: 900,
            color: isNoShow ? '#991B1B' : '#065F46',
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
            {(isServingNow || isNoShow) ? '০' : toBn(patientsAhead)} জন
          </div>
        </div>

        {/* Card 4: Dynamic Wait Time / Countdown + Serial Status */}
        <div style={{
          background: isNoShow
            ? '#FEF2F2'
            : isServingNow
            ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)'
            : (isNextInLine ? '#FFFBEB' : '#F8FAFC'),
          borderRadius: 12,
          padding: '10px 6px',
          border: isNoShow
            ? '1.5px solid #FCA5A5'
            : isServingNow
            ? '1.5px solid #10B981'
            : (isNextInLine ? '1.5px solid #FCD34D' : '1px solid #E2E8F0'),
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
            color: isNoShow
              ? '#DC2626'
              : (isServingNow ? '#047857' : (isNextInLine ? '#B45309' : '#64748B')),
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}>
            {isNoShow ? (
              <AlertCircle size={13} color="#DC2626" />
            ) : isServingNow ? (
              <Sparkles size={13} color="#059669" />
            ) : isNextInLine ? (
              <ArrowRight size={13} color="#D97706" />
            ) : (
              <Clock size={13} color="#6366F1" />
            )}
            <span>{isNoShow ? 'সিরিয়াল অবস্থা' : (isServingNow ? 'সিরিয়াল অবস্থা' : 'আনুমানিক বাকি')}</span>
          </div>

          <div style={{
            fontSize: (isServingNow || isNoShow) ? '1.15rem' : '1.3rem',
            fontWeight: 900,
            color: isNoShow
              ? '#991B1B'
              : (isServingNow ? '#065F46' : (isNextInLine ? '#B45309' : '#0F172A')),
            marginTop: 3,
            lineHeight: 1.15,
            textAlign: 'center',
            letterSpacing: '-0.3px',
          }}>
            {isNoShow
              ? 'অনুপস্থিত'
              : (isServingNow ? 'প্রবেশ করুন' : (isNextInLine ? 'প্রস্তুত থাকুন' : dynamicWait.highWaitText))}
          </div>

          <div style={{ marginTop: 4, display: 'flex', justifyContent: 'center' }}>
            <span style={{
              display: 'inline-block',
              fontSize: '0.72rem',
              fontWeight: 800,
              background: isNoShow ? '#FEE2E2' : (isServingNow ? '#ECFDF5' : statusBadgeBg),
              color: isNoShow ? '#DC2626' : (isServingNow ? '#047857' : statusBadgeColor),
              border: '1px solid ' + (isNoShow ? '#FECACA' : (isServingNow ? '#A7F3D0' : statusBadgeBorder)),
              padding: '2px 8px',
              borderRadius: 6,
              lineHeight: 1.2,
              textAlign: 'center',
            }}>
              {isNoShow
                ? 'স্থগিত রয়েছে'
                : (isServingNow ? 'ডাকা হয়েছে' : (!dynamicWait.isChamberActive ? 'শুরুর অপেক্ষায়' : statusText))}
            </span>
          </div>
        </div>
      </div>

      {/* Actionable Notice for No-Show / Absent Patient */}
      {isNoShow && (
        <div style={{
          background: '#FFF5F5',
          border: '1.5px solid #FECACA',
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          boxShadow: '0 1px 3px rgba(220, 38, 38, 0.06)',
        }}>
          <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.82rem', color: '#991B1B', lineHeight: 1.45 }}>
            <strong style={{ display: 'block', marginBottom: 2 }}>সিরিয়াল স্থগিত (অনুপস্থিত চিহ্নিত)</strong>
            আপনার সিরিয়াল পূর্বে ডাকা হয়েছিল, কিন্তু নির্ধারিত সময়ে উপস্থিত না থাকায় ডাক্তার আপনাকে সাময়িকভাবে অনুপস্থিত করেছেন। আপনি চেম্বারে এসে থাকলে অবিলম্বে <strong>রিসেপশন বা চেম্বার সহকারীকে</strong> বলুন আপনাকে সিরিয়ালে পুনরায় যুক্ত (Recall) করতে।
          </div>
        </div>
      )}

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

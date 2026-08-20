import React, { useState, useEffect, useMemo } from 'react'
import { 
  Radio, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Coffee, 
  Sparkles, 
  WifiOff, 
  RefreshCw, 
  CalendarClock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react'
import { subscribeToAppointment, subscribeToChamber, onConnectionStateChange } from '../../utils/echoService'

const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBn = (str) => (str !== null && str !== undefined ? String(str).replace(/\d/g, (d) => enToBn[d] || d) : '—')

const formatSerial = (num) => {
  if (num === null || num === undefined) return '—'
  const str = String(num).padStart(2, '0')
  return toBn(str)
}

/**
 * Get current date string in YYYY-MM-DD format based on local client time.
 */
const getLocalDateString = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * PatientLiveQueueTracker Component
 * Real-time zero-polling live queue monitor for patients.
 *
 * Props:
 * - appointment: full appointment object (optional fallback source)
 * - registration_id: appointment official registration ID (string)
 * - display_token: chamber 32-character display token (string)
 * - appointment_date: YYYY-MM-DD string
 * - serial_number: assigned serial number (number|string)
 */
export default function PatientLiveQueueTracker({
  appointment = null,
  registration_id = null,
  display_token = null,
  appointment_date = null,
  serial_number = null,
}) {
  // Resolve props with fallback to appointment object
  const regId = registration_id || appointment?.registration_id || ''
  const chamberToken = display_token || appointment?.chamber?.display_token || appointment?.display_token || ''
  const rawDate = appointment_date || appointment?.appointment_date || appointment?.date || ''
  const mySerial = Number(serial_number || appointment?.serial_number || appointment?.serial_no || 0)

  // Clean date string comparison (YYYY-MM-DD)
  const apptDateStr = useMemo(() => {
    if (!rawDate) return ''
    return String(rawDate).split('T')[0].trim()
  }, [rawDate])

  const todayStr = useMemo(() => getLocalDateString(), [])

  // Determine timeline classification
  const dateCategory = useMemo(() => {
    if (!apptDateStr) return 'today'
    if (apptDateStr > todayStr) return 'future'
    if (apptDateStr < todayStr) return 'past'
    return 'today'
  }, [apptDateStr, todayStr])

  // Real-time dynamic state
  const [currentServingSerial, setCurrentServingSerial] = useState(() => {
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

  const [isReconnecting, setIsReconnecting] = useState(false)
  const [lastSequenceNumber, setLastSequenceNumber] = useState(0)

  // Sync state if appointment prop updates after initial HTTP fetch
  useEffect(() => {
    if (!appointment) return
    const s = appointment.current_serial ?? appointment.currently_serving_serial
    if (s !== undefined && s !== null) {
      setCurrentServingSerial(Number(s))
    }
    const w = appointment.waiting_count
    if (w !== undefined && w !== null) {
      setWaitingCount(Number(w))
    }
    if (appointment.queue_status || appointment.status) {
      setQueueStatus((appointment.queue_status || appointment.status).toLowerCase())
    }
    if (appointment.is_on_break !== undefined || appointment.chamber?.is_on_break !== undefined) {
      setIsOnBreak(Boolean(appointment.is_on_break || appointment.chamber?.is_on_break))
    }
    if (appointment.break_reason || appointment.chamber?.break_reason) {
      setBreakReason(appointment.break_reason || appointment.chamber?.break_reason)
    }
    if (appointment.break_resume_time || appointment.chamber?.break_resume_time) {
      setBreakResumeTime(appointment.break_resume_time || appointment.chamber?.break_resume_time)
    }
  }, [appointment])

  // WebSocket lifecycle listener (Active ONLY for today's appointments)
  useEffect(() => {
    if (dateCategory !== 'today') {
      return
    }

    // Monitor connectivity state (Only show banner if active connection was lost)
    const unsubscribeConn = onConnectionStateChange((state, previousState) => {
      if (state === 'connected') {
        setIsReconnecting(false)
      } else if (previousState === 'connected' && (state === 'connecting' || state === 'unavailable' || state === 'disconnected')) {
        setIsReconnecting(true)
      }
    })

    // Handler for real-time queue payload
    const handleQueueUpdate = (payload) => {
      if (!payload) return

      // Drop out-of-order or duplicate packets
      if (typeof payload.sequence_number === 'number') {
        if (payload.sequence_number <= lastSequenceNumber) {
          return
        }
        setLastSequenceNumber(payload.sequence_number)
      }

      if (payload.current_serial !== undefined) {
        setCurrentServingSerial(payload.current_serial !== null ? Number(payload.current_serial) : null)
      }

      if (payload.waiting_count !== undefined) {
        setWaitingCount(Number(payload.waiting_count))
      }

      if (payload.break_reason !== undefined) {
        setBreakReason(payload.break_reason)
      }

      if (payload.break_resume_time !== undefined) {
        setBreakResumeTime(payload.break_resume_time)
      }

      if (payload.event_type === 'BREAK') {
        setIsOnBreak(true)
      } else if (payload.event_type === 'RESUME') {
        setIsOnBreak(false)
        setBreakReason(null)
        setBreakResumeTime(null)
      }

      // If update is targeted to this appointment or changes global status
      if (payload.registration_id === regId && payload.queue_status) {
        setQueueStatus(payload.queue_status.toLowerCase())
      } else if (payload.event_type === 'CALL_NEXT' && payload.current_serial !== undefined) {
        if (Number(payload.current_serial) === mySerial) {
          setQueueStatus('serving')
        } else if (Number(payload.current_serial) > mySerial) {
          setQueueStatus('completed')
        }
      }
    }

    // Subscribe to appointment private channel
    let unsubscribeAppt = () => {}
    if (regId) {
      unsubscribeAppt = subscribeToAppointment(regId, handleQueueUpdate)
    }

    // Subscribe to chamber private channel for general line movement & breaks
    let unsubscribeChamber = () => {}
    if (chamberToken) {
      unsubscribeChamber = subscribeToChamber(chamberToken, handleQueueUpdate)
    }

    return () => {
      unsubscribeConn()
      unsubscribeAppt()
      unsubscribeChamber()
    }
  }, [dateCategory, regId, chamberToken, mySerial, lastSequenceNumber])

  // =========================================================================
  // STATE 1: FUTURE APPOINTMENT
  // =========================================================================
  if (dateCategory === 'future') {
    return (
      <div style={{
        background: '#F8FAFC',
        border: '1px dashed #CBD5E1',
        borderRadius: 14,
        padding: '16px 18px',
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: '#2563EB',
        }}>
          <CalendarClock size={22} />
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1E293B', marginBottom: 2 }}>
            লাইভ কিউ ট্র্যাকিং
          </div>
          <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, lineHeight: 1.4 }}>
            Live queue will be available on your appointment day. (অ্যাপয়েন্টমেন্টের দিন লাইভ সিরিয়াল আপডেট দেখা যাবে)
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // STATE 2: PAST APPOINTMENT
  // =========================================================================
  if (dateCategory === 'past') {
    return (
      <div style={{
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: 14,
        padding: '16px 18px',
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: '#F1F5F9',
          border: '1px solid #CBD5E1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: '#64748B',
        }}>
          <CheckCircle2 size={22} />
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#334155', marginBottom: 2 }}>
            অ্যাপয়েন্টমেন্ট সম্পন্ন
          </div>
          <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
            Appointment completed. (নির্ধারিত তারিখ অতিক্রান্ত হয়েছে)
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // STATE 3: TODAY'S LIVE QUEUE TRACKING
  // =========================================================================

  // Calculate position metrics
  const isServingNow = queueStatus === 'serving' || (currentServingSerial !== null && currentServingSerial === mySerial)
  const isCompleted = queueStatus === 'completed' || (currentServingSerial !== null && mySerial > 0 && currentServingSerial > mySerial)
  const isNoShow = queueStatus === 'no_show'
  const isCancelled = queueStatus === 'cancelled'
  const isNextInLine = !isServingNow && !isCompleted && currentServingSerial !== null && mySerial === currentServingSerial + 1

  let patientsAhead = 0
  if (mySerial > 0 && currentServingSerial !== null) {
    patientsAhead = Math.max(0, mySerial - currentServingSerial - (isServingNow ? 0 : 1))
  } else if (waitingCount !== null && mySerial > 0) {
    patientsAhead = Math.max(0, mySerial - 1)
  }

  // Visual Theme Configuration
  let theme = {
    bg: '#F0FDF4',
    border: '#86EFAC',
    badgeBg: '#DCFCE7',
    badgeText: '#15803D',
    statusText: 'অপেক্ষমাণ তালিকায় আছেন',
    statusDesc: patientsAhead === 0 ? 'আপনার সিরিয়াল শীঘ্রই শুরু হবে।' : `আপনার পূর্বে আরও ${toBn(patientsAhead)} জন রোগী অপেক্ষমাণ আছেন।`,
    icon: Users,
    iconColor: '#16A34A',
  }

  if (isServingNow) {
    theme = {
      bg: '#ECFDF5',
      border: '#10B981',
      badgeBg: '#10B981',
      badgeText: '#FFFFFF',
      statusText: 'বর্তমানে ডাকা হয়েছে — চিকিৎসকের রুমে প্রবেশ করুন',
      statusDesc: 'আপনার সিরিয়াল নম্বর চেম্বারে প্রদর্শিত হচ্ছে।',
      icon: Sparkles,
      iconColor: '#059669',
    }
  } else if (isNextInLine) {
    theme = {
      bg: '#FFFBEB',
      border: '#FCD34D',
      badgeBg: '#FEF3C7',
      badgeText: '#B45309',
      statusText: 'পরবর্তী সিরিয়াল আপনার — প্রস্তুত থাকুন',
      statusDesc: 'বর্তমান রোগীর পরামর্শ সম্পন্ন হলেই আপনাকে ডাকা হবে।',
      icon: ArrowRight,
      iconColor: '#D97706',
    }
  } else if (isOnBreak) {
    const title = breakReason ? `চিকিৎসক সাময়িক বিরতিতে আছেন (${breakReason})` : 'চিকিৎসক সাময়িক বিরতিতে আছেন'
    const desc = breakResumeTime
      ? `সম্ভাব্য পুনরায় শুরুর সময়: ${toBn(breakResumeTime)}। বিরতি শেষে সিরিয়াল পুনরায় শুরু হবে।`
      : 'বিরতি শেষে সিরিয়াল আবার শুরু হবে।'

    theme = {
      bg: '#FFF7ED',
      border: '#FDBA74',
      badgeBg: '#FFEDD5',
      badgeText: '#C2410C',
      statusText: title,
      statusDesc: desc,
      icon: Coffee,
      iconColor: '#EA580C',
    }
  } else if (isCompleted) {
    theme = {
      bg: '#F8FAFC',
      border: '#CBD5E1',
      badgeBg: '#F1F5F9',
      badgeText: '#475569',
      statusText: 'পরামর্শ সম্পন্ন হয়েছে',
      statusDesc: 'আপনার আজকের অ্যাপয়েন্টমেন্ট সফলভাবে সম্পন্ন হয়েছে।',
      icon: CheckCircle2,
      iconColor: '#64748B',
    }
  } else if (isNoShow) {
    theme = {
      bg: '#FEF2F2',
      border: '#FCA5A5',
      badgeBg: '#FEE2E2',
      badgeText: '#B91C1C',
      statusText: 'অনুপস্থিত চিহ্নিত (No-Show)',
      statusDesc: 'চেম্বারে উপস্থিত হয়ে পুনরায় সিরিয়ালে যুক্ত হওয়ার জন্য অনুরোধ করুন।',
      icon: AlertCircle,
      iconColor: '#DC2626',
    }
  } else if (isCancelled) {
    theme = {
      bg: '#FEF2F2',
      border: '#FCA5A5',
      badgeBg: '#FEE2E2',
      badgeText: '#B91C1C',
      statusText: 'অ্যাপয়েন্টমেন্ট বাতিল করা হয়েছে',
      statusDesc: 'এই অ্যাপয়েন্টমেন্টটি বর্তমানে বাতিল অবস্থায় রয়েছে।',
      icon: AlertCircle,
      iconColor: '#DC2626',
    }
  }

  const StatusIcon = theme.icon

  return (
    <div style={{
      background: theme.bg,
      border: `1.5px solid ${theme.border}`,
      borderRadius: 16,
      padding: '16px 18px',
      marginBottom: 18,
      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Reconnecting Overlay Banner */}
      {isReconnecting && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          background: 'rgba(245, 158, 11, 0.95)',
          color: '#FFFFFF',
          fontSize: 11.5,
          fontWeight: 700,
          padding: '3px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          zIndex: 10,
        }}>
          <RefreshCw size={12} className="spin" />
          <span>পুনরায় সংযোগ করা হচ্ছে... (Reconnecting live queue...)</span>
        </div>
      )}

      {/* Top Header Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
        paddingTop: isReconnecting ? 18 : 0,
      }}>
        {/* Live Indicator Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: theme.badgeBg,
          color: theme.badgeText,
          padding: '4px 10px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.2px',
        }}>
          <span style={{ position: 'relative', display: 'flex', width: 7, height: 7 }}>
            <span style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'currentColor',
              opacity: 0.75,
              animation: 'pingDot 1.4s cubic-bezier(0, 0, 0.2, 1) infinite',
            }} />
            <span style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'currentColor' }} />
          </span>
          <span>লাইভ কিউ ট্র্যাকার</span>
        </div>

        {/* Security / Verification Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748B', fontSize: 11, fontWeight: 600 }}>
          <ShieldCheck size={13} color="#00966D" />
          <span>রিয়েল-টাইম লাইভ</span>
        </div>
      </div>

      {/* Serial Comparison Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        marginBottom: 14,
      }}>
        {/* Current Serving Serial Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 12,
          padding: '12px 14px',
          border: '1px solid #E2E8F0',
          textAlign: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' }}>
            বর্তমান সিরিয়াল
          </div>
          <div style={{
            fontSize: 26,
            fontWeight: 900,
            color: currentServingSerial ? '#0F172A' : '#94A3B8',
            fontFamily: 'monospace',
            lineHeight: 1,
          }}>
            {formatSerial(currentServingSerial)}
          </div>
          <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 4, fontWeight: 600 }}>
            {currentServingSerial ? 'রুমে রোগী আছেন' : 'শুরুর অপেক্ষায়'}
          </div>
        </div>

        {/* Your Serial Card */}
        <div style={{
          background: isServingNow ? '#10B981' : '#FFFFFF',
          borderRadius: 12,
          padding: '12px 14px',
          border: `1.5px solid ${isServingNow ? '#059669' : '#00966D'}`,
          textAlign: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
          color: isServingNow ? '#FFFFFF' : '#0F172A',
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: isServingNow ? '#E6FFFA' : '#00966D',
            marginBottom: 4,
            textTransform: 'uppercase',
          }}>
            আপনার সিরিয়াল
          </div>
          <div style={{
            fontSize: 26,
            fontWeight: 900,
            fontFamily: 'monospace',
            lineHeight: 1,
            color: isServingNow ? '#FFFFFF' : '#00966D',
          }}>
            {formatSerial(mySerial)}
          </div>
          <div style={{
            fontSize: 10.5,
            color: isServingNow ? '#E6FFFA' : '#64748B',
            marginTop: 4,
            fontWeight: 600,
          }}>
            {isServingNow ? 'প্রবেশ করুন' : `${toBn(patientsAhead)} জন পূর্বে`}
          </div>
        </div>
      </div>

      {/* Dynamic Status Banner */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 12,
        padding: '12px 14px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: theme.badgeBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: theme.iconColor,
          marginTop: 2,
        }}>
          <StatusIcon size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>
            {theme.statusText}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 500, lineHeight: 1.4 }}>
            {theme.statusDesc}
          </div>
        </div>
      </div>
    </div>
  )
}

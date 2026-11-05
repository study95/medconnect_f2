import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { getPublicDisplayBoard, getPublicHospitalDisplayBoard } from '../api/appointmentApi'
import { getDoctorUrl } from '../utils/identifierHelper'
import { soundService } from '../utils/soundUtils'
import { subscribeToPublicChamber, onConnectionStateChange, isWebSocketConnected } from '../utils/echoService'
import { QRCodeSVG } from 'qrcode.react'
import { 
  Coffee,
  Clock, 
  User, 
  CheckCircle, 
  AlertCircle, 
  Building2, 
  Stethoscope, 
  Maximize, 
  Minimize, 
  Volume2, 
  VolumeX, 
  Radio, 
  Sparkles,
  Users,
  PhoneCall,
  Headphones,
  Calendar,
  Volume1,
  ChevronRight,
  Info,
  Megaphone,
  Phone
} from 'lucide-react'

const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBn = (str) => str !== null && str !== undefined ? String(str).replace(/\d/g, d => enToBn[d] || d) : ''

const bnMonths = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
]

const bnDays = [
  'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
]

const formatSerial3 = (num) => {
  if (num === null || num === undefined) return '000'
  return String(num).padStart(3, '0')
}

const getInitials = (name = '') => {
  const parts = name.replace(/ডা\.|Dr\./g, '').trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (parts[0]?.[0] || 'D').toUpperCase()
}

const formatTime12h = (timeStr) => {
  if (!timeStr) return ''
  try {
    const parts = timeStr.split(':')
    let hour = parseInt(parts[0], 10)
    const min = parts[1] || '00'
    const ampm = hour >= 12 ? 'PM' : 'AM'
    hour = hour % 12 || 12
    const hourStr = String(hour).padStart(2, '0')
    return `${toBn(hourStr)}:${toBn(min)} ${ampm}`
  } catch (e) {
    return timeStr
  }
}

/**
 * Isolated Real-time Clock Component.
 * Self-contained 1-second interval prevents entire display page from re-rendering every second.
 */
const LiveDisplayClock = React.memo(function LiveDisplayClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const dayNameBn = bnDays[time.getDay()]
  const dateBn = `${toBn(time.getDate())} ${bnMonths[time.getMonth()]} ${toBn(time.getFullYear())}`

  const hourRaw = time.getHours()
  const minRaw = time.getMinutes()
  const secRaw = time.getSeconds()
  const ampm = hourRaw >= 12 ? 'PM' : 'AM'
  const hour12 = hourRaw % 12 || 12

  const hourStr = String(hour12).padStart(2, '0')
  const minStr = String(minRaw).padStart(2, '0')
  const secStr = String(secRaw).padStart(2, '0')
  const timeBnDigits = `${toBn(hourStr)}:${toBn(minStr)}:${toBn(secStr)} ${ampm}`

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      {/* Date Widget */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'rgba(30, 41, 59, 0.45)',
        padding: '8px 16px',
        borderRadius: 12,
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ color: '#00B875', display: 'flex', alignItems: 'center' }}>
          <Calendar size={22} />
        </div>
        <div>
          <div style={{ fontSize: '1.08rem', fontWeight: 800, color: '#F8FAFC', lineHeight: 1.2 }}>
            {dateBn}
          </div>
          <div style={{ fontSize: '0.92rem', color: '#CBD5E1', fontWeight: 700 }}>
            {dayNameBn}
          </div>
        </div>
      </div>

      {/* Clock Widget */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'rgba(30, 41, 59, 0.45)',
        padding: '8px 18px',
        borderRadius: 12,
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ color: '#00B875', display: 'flex', alignItems: 'center' }}>
          <Clock size={22} />
        </div>
        <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#34D399', fontFamily: 'monospace', letterSpacing: '1.5px', lineHeight: 1, textShadow: '0 0 15px rgba(52,211,153,0.35)' }}>
          {timeBnDigits}
        </div>
      </div>
    </div>
  )
})

export default function PublicDisplayBoardPage() {
  const { token, hospitalId } = useParams()
  const isHospitalMaster = Boolean(hospitalId)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Track previous serving serial to detect new calls and trigger chime audio
  const prevServingRef = useRef(null)

  // Fullscreen state listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  const [isWsConnected, setIsWsConnected] = useState(false)

  // Track active WebSocket connection state
  useEffect(() => {
    setIsWsConnected(isWebSocketConnected())
    const unsubConn = onConnectionStateChange((state) => {
      setIsWsConnected(state === 'connected')
    })
    return () => unsubConn()
  }, [])

  // Ref to hold latest data for real-time sound announcement without stale closures
  const dataRef = useRef(data)
  useEffect(() => {
    dataRef.current = data
  }, [data])

  // Centralized fetchQueue function (initial load & instant push reload from fast Redis cache)
  const fetchQueue = useRef(() => {})
  fetchQueue.current = (silent = false) => {
    const apiCall = isHospitalMaster 
      ? getPublicHospitalDisplayBoard(hospitalId)
      : getPublicDisplayBoard(token)

    apiCall
      .then(res => {
        const payload = res.data?.data || res.data
        setData(payload)
        setError('')
        setLoading(false)

        // Audio notification check on serial call
        if (!isHospitalMaster && payload?.currently_serving) {
          const currentSerial = payload.currently_serving.serial_number
          if (prevServingRef.current !== null && prevServingRef.current !== currentSerial) {
            if (soundEnabled) {
              soundService.announceSerial({
                serialNumber: currentSerial,
                roomNumber: payload.chamber?.room_number,
                doctorName: payload.doctor?.name_bn || payload.doctor?.name,
                lang: 'bn'
              })
            }
          }
          prevServingRef.current = currentSerial
        }
      })
      .catch(err => {
        if (!silent) {
          setError(err.response?.data?.message || 'ডিসপ্লে লোড করা সম্ভব হয়নি')
          setLoading(false)
        }
      })
  }

  // 1. Initial snapshot load
  useEffect(() => {
    fetchQueue.current(false)
  }, [token, hospitalId, isHospitalMaster])

  // 2. Real-time Laravel Reverb WebSocket subscription (Zero Polling) + 45s Resilient Safety Heartbeat
  useEffect(() => {
    const cleanupFns = []

    const handleRealtimeUpdate = (event) => {
      // Audio chime announcement on new serial call
      if (!isHospitalMaster && event?.current_serial) {
        if (prevServingRef.current !== null && prevServingRef.current !== event.current_serial) {
          if (soundEnabled) {
            const currentData = dataRef.current
            soundService.announceSerial({
              serialNumber: event.current_serial,
              roomNumber: currentData?.chamber?.room_number,
              doctorName: currentData?.doctor?.name_bn || currentData?.doctor?.name,
              lang: 'bn'
            })
          }
        }
        prevServingRef.current = event.current_serial
      }

      // Immediately pull fresh snapshot from ultra-fast Redis cache (< 15ms)
      fetchQueue.current(true)
    }

    // Subscribe to chamber's public websocket channel
    if (token) {
      const unsub = subscribeToPublicChamber(token, handleRealtimeUpdate)
      cleanupFns.push(unsub)
    }

    // If hospital master board, subscribe to all active chambers
    if (isHospitalMaster && data?.doctor_queues?.length > 0) {
      data.doctor_queues.forEach(dq => {
        const chToken = dq.chamber?.display_token
        if (chToken) {
          const unsub = subscribeToPublicChamber(chToken, handleRealtimeUpdate)
          cleanupFns.push(unsub)
        }
      })
    }

    return () => {
      cleanupFns.forEach(fn => {
        try { fn() } catch (e) {}
      })
    }
  }, [token, hospitalId, isHospitalMaster, soundEnabled, data?.doctor_queues?.length])

  // 3. Smart Adaptive Polling & Heartbeat:
  // - When WebSocket is connected: relaxed 45s safety heartbeat
  // - When WebSocket is disconnected: rapid 3.5s fallback polling (zero delay on break & queue updates)
  useEffect(() => {
    const pollInterval = isWsConnected ? 45000 : 3500
    const timer = setInterval(() => {
      fetchQueue.current(true)
    }, pollInterval)

    return () => clearInterval(timer)
  }, [isWsConnected])

  // Window visibility & focus listener: immediate refresh when tab is foregrounded
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchQueue.current(true)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleVisibility)
    }
  }, [])


  if (loading && !data) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#070B13',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Hind Siliguri", sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border text-success mb-3" style={{ width: '3.5rem', height: '3.5rem', borderWidth: 4 }} />
          <h2 style={{ fontWeight: 800, color: '#34D399', letterSpacing: 0.5 }}>লাইভ সিরিয়াল ডিসপ্লে বোর্ড প্রস্তুত হচ্ছে...</h2>
          <p style={{ color: '#94A3B8' }}>অনুগ্রহ করে অপেক্ষা করুন</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#070B13',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Hind Siliguri", sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: 500,
          padding: '40px 32px',
          background: '#111827',
          borderRadius: 20,
          border: '1px solid #1F2937',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
        }}>
          <AlertCircle size={56} color="#EF4444" style={{ marginBottom: 16 }} />
          <h3 style={{ fontWeight: 800, color: '#F87171', margin: '0 0 12px 0' }}>{error}</h3>
          <p style={{ color: '#94A3B8', margin: 0, lineHeight: 1.6 }}>
            অনুগ্রহ করে সঠিক ডিসপ্লে লিংক অথবা হাসপাতাল আইডির তথ্য যাচাই করুন।
          </p>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════
  // RENDER: SINGLE DOCTOR / MASTER DISPLAY BOARD MATCHING PIC 1
  // ══════════════════════════════════════════════════════════════════
  const doctor = data?.doctor || {}
  const chamber = data?.chamber || {}
  const stats = data?.statistics || data?.summary || {}
  const currentlyServing = data?.currently_serving
  const nextInLine = data?.next_in_line
  const waitingPatients = data?.waiting_patients || []
  const hospital = data?.hospital || {}

  const hospitalName = hospital.name_bn || hospital.name || chamber.hospital_name || 'DrBooklet হাসপাতাল'
  const hospitalTagline = hospital.address || 'আপনার স্বাস্থ্য, আমাদের অধিকার'
  // Use hospital profile Hot Number (Hotline) ONLY, not the verified personal mobile number
  const supportPhone = hospital.hotline || hospital.hot_number || chamber.hospital_hotline || ''

  const BASE = import.meta.env.VITE_APP_URL || 'http://127.0.0.1:8000'
  const rawHospLogo = hospital.logo || hospital.hospital_logo || hospital.logo_url || hospital.photo || hospital.photo_url || hospital.image || chamber.hospital_logo || chamber.hospital_photo
  const hospitalLogo = rawHospLogo ? (rawHospLogo.startsWith('http') ? rawHospLogo : `${BASE}/storage/${rawHospLogo}`) : '/doctorBookletLogo.png'

  const rawDocPhoto = doctor.photo || doctor.photo_url || doctor.image || doctor.avatar
  const doctorPhoto = rawDocPhoto ? (rawDocPhoto.startsWith('http') ? rawDocPhoto : `${BASE}/storage/${rawDocPhoto}`) : null
  const doctorUrl = doctor ? `${window.location.origin}${getDoctorUrl(doctor)}` : `${window.location.origin}/doctors`

  const totalPatientsCount = stats.total_patients || (waitingPatients.length + (stats.total_completed || 0) + (currentlyServing ? 1 : 0)) || 0
  const completedCount = stats.total_completed || 0
  const waitingCount = stats.total_waiting !== undefined ? stats.total_waiting : waitingPatients.length
  const avgTimeMinutes = stats.avg_consultation_minutes || 15

  const isOnBreak = chamber.is_on_break || data?.break?.is_on_break
  const breakReason = chamber.break_reason || data?.break?.reason || 'সেশন সাময়িক বিরতি'
  const breakMessage = chamber.break_message || data?.break?.message || ''
  const breakResumeTime = chamber.break_resume_time || data?.break?.resume_time || ''

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080C14',
      color: '#F8FAFC',
      fontFamily: '"Hind Siliguri", sans-serif',
      padding: '16px 22px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      userSelect: 'none',
      overflowX: 'hidden'
    }}>
      {/* ── Keyframe Animations & Styles ── */}
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 15px rgba(74,222,128,0.4)); }
          50% { opacity: 0.85; transform: scale(1.02); filter: drop-shadow(0 0 35px rgba(74,222,128,0.75)); }
        }

        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }

        .pulse-live-dot {
          animation: pingDot 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @keyframes pingDot {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(2); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }

        .marquee-track {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 26s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }

        /* Custom Scrollbar for Queue Table */
        .queue-scroll-area::-webkit-scrollbar {
          width: 5px;
        }
        .queue-scroll-area::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .queue-scroll-area::-webkit-scrollbar-thumb {
          background: rgba(0, 184, 117, 0.25);
          border-radius: 4px;
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════
          1. TOP HEADER BAR (BRAND LOGO + DATE + CLOCK + VOICE ANNOUNCEMENT)
          ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#0E1422',
        padding: '12px 22px',
        borderRadius: 16,
        border: '1px solid #1E293B',
        marginBottom: 16,
        boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
        gap: 16,
        flexWrap: 'wrap'
      }}>
        {/* Left: Brand / Hospital Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: hospitalLogo !== '/doctorBookletLogo.png' ? '#FFFFFF' : '#00B875',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 18px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            flexShrink: 0,
            border: '1.5px solid rgba(255,255,255,0.1)',
            padding: 4
          }}>
            <img 
              src={hospitalLogo} 
              alt={hospitalName} 
              onError={(e) => {
                e.target.src = '/doctorBookletLogo.png'
              }}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.3px', lineHeight: 1.2 }}>
              {hospitalName}
            </h1>
            <div style={{ fontSize: '0.86rem', color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>
              {hospitalTagline}
            </div>
          </div>
        </div>

        {/* Center: Live Calendar & Digital Clock (Isolated from full page re-renders) */}
        <LiveDisplayClock />

        {/* Right: Sound Alert Status & Fullscreen Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Real-time WebSocket connection state pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '7px 14px',
            borderRadius: 999,
            background: 'rgba(5, 150, 105, 0.18)',
            border: '1px solid #059669',
            fontSize: '0.82rem',
            fontWeight: 800,
            color: '#34D399',
            boxShadow: '0 0 10px rgba(5, 150, 105, 0.15)'
          }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#10B981',
                display: 'inline-block'
              }}
              className="pulse-live-dot"
            />
            <span>লাইভ ডিসপ্লে</span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              background: soundEnabled ? '#044E38' : '#1E293B',
              color: soundEnabled ? '#6EE7B7' : '#94A3B8',
              border: `1.5px solid ${soundEnabled ? '#059669' : '#334155'}`,
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: soundEnabled ? '0 0 15px rgba(5, 150, 105, 0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}
            title={soundEnabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span>দয়া করে সিরিয়াল শুনে প্রবেশ করুন</span>
          </button>

          <button
            onClick={toggleFullscreen}
            style={{
              width: 42, height: 42,
              borderRadius: 12,
              border: '1px solid #334155',
              background: '#1E293B',
              color: '#F8FAFC',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            title={isFullscreen ? 'ফুলস্ক্রিন বন্ধ' : 'ফুলস্ক্রিন'}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2. MAIN CONTENT GRID (3 COLUMNS AS IN PIC 1)
          ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.3fr 1.3fr',
        gap: 16,
        flex: 1,
        marginBottom: 16,
        alignItems: 'stretch'
      }}>

        {/* ── LEFT COLUMN: DOCTOR INFO & DYNAMIC QR CODE CARD ── */}
        <div style={{
          background: '#0E1422',
          borderRadius: 18,
          border: '1px solid #1E293B',
          padding: '18px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 8px 25px rgba(0,0,0,0.35)',
          gap: 12
        }}>
          <div>
            {/* 1. Seamless Circular Avatar with Face-Focus Centering (Solution 1) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ position: 'relative', width: 124, height: 124 }}>
                {/* Seamless Circular Frame with Glow */}
                <div style={{
                  width: 124,
                  height: 124,
                  borderRadius: '50%',
                  border: `3.5px solid ${isOnBreak ? '#F59E0B' : '#10B981'}`,
                  padding: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isOnBreak 
                    ? '0 0 25px rgba(245,158,11,0.45)' 
                    : '0 0 25px rgba(16,185,129,0.45)',
                  transition: 'all 0.3s ease'
                }}>
                  {doctorPhoto ? (
                    <img 
                      src={doctorPhoto} 
                      alt={doctor.name_bn || doctor.name}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }}
                    />
                  ) : null}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00B875, #047857)',
                    color: '#FFFFFF',
                    display: doctorPhoto ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 40,
                    fontWeight: 900
                  }}>
                    {getInitials(doctor.name_bn || doctor.name)}
                  </div>
                </div>

                {/* Small, Sleek Proportioned Status Dot */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    right: 8,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: isOnBreak ? '#F59E0B' : '#10B981',
                    border: '2.5px solid #0E1422',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isOnBreak ? '0 0 10px #F59E0B' : '0 0 10px #10B981',
                    transition: 'all 0.3s ease'
                  }}
                  title={isOnBreak ? 'বিরতিতে রয়েছেন' : 'রোগী দেখছেন'}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      boxShadow: '0 0 6px #FFFFFF'
                    }}
                    className={isOnBreak ? "" : "pulse-live-dot"}
                  />
                </div>
              </div>
            </div>

            {/* 2. Centered Doctor Title, Name, Degree, Specialty */}
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: '0.95rem', color: '#CBD5E1', fontWeight: 700, marginBottom: 2 }}>
                {doctor.designation || 'সহযোগী অধ্যাপক ডা.'}
              </div>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: 900,
                color: '#FFFFFF',
                margin: '0 0 4px 0',
                lineHeight: 1.25,
                letterSpacing: '0.3px',
                textShadow: '0 2px 8px rgba(0,0,0,0.4)'
              }}>
                {doctor.name_bn || doctor.name || 'ডা. প্রিয়তোষ'}
              </h2>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34D399', marginBottom: 4 }}>
                {doctor.specialty?.name_bn || doctor.specialty?.name || 'কার্ডিওলজি বিশেষজ্ঞ'}
              </div>
              <div style={{ fontSize: '0.92rem', color: '#E2E8F0', fontWeight: 600, lineHeight: 1.35, padding: '0 4px' }}>
                {doctor.degree || 'এমবিবিএস, এফসিপিএস (কার্ডিওলজি)'}
              </div>
            </div>

            {/* 3. Chamber Key-Value Info List (5 Rows Matching Image 1) */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.06)',
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              marginBottom: 12
            }}>
              {/* 1. Chamber No */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#E2E8F0', fontSize: '0.96rem', fontWeight: 700 }}>
                  <Building2 size={18} color="#00E699" />
                  <span>চেম্বার নং</span>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#00E699', fontFamily: 'monospace', background: 'rgba(0, 230, 153, 0.12)', border: '1px solid rgba(0, 230, 153, 0.35)', padding: '2px 12px', borderRadius: 8 }}>
                  {formatSerial3(chamber.room_number || '003')}
                </div>
              </div>

              {/* 2. Current Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#E2E8F0', fontSize: '0.96rem', fontWeight: 700 }}>
                  <User size={18} color="#00E699" />
                  <span>বর্তমান অবস্থা</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.98rem', fontWeight: 800, color: isOnBreak ? '#F59E0B' : '#34D399' }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: isOnBreak ? '#F59E0B' : '#10B981',
                    display: 'inline-block',
                    boxShadow: isOnBreak ? '0 0 8px #F59E0B' : '0 0 8px #10B981'
                  }} />
                  <span>{isOnBreak ? 'বিরতিতে রয়েছেন' : 'রোগী দেখছেন'}</span>
                </div>
              </div>

              {/* 3. Total Patients Today */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#E2E8F0', fontSize: '0.96rem', fontWeight: 700 }}>
                  <Users size={18} color="#00E699" />
                  <span>আজকের মোট রোগী</span>
                </div>
                <div style={{ fontSize: '1.12rem', fontWeight: 900, color: '#00E699' }}>
                  {toBn(totalPatientsCount)} জন
                </div>
              </div>

              {/* 4. Completed Patients */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#E2E8F0', fontSize: '0.96rem', fontWeight: 700 }}>
                  <CheckCircle size={18} color="#00E699" />
                  <span>সম্পন্ন হয়েছে</span>
                </div>
                <div style={{ fontSize: '1.12rem', fontWeight: 900, color: '#00E699' }}>
                  {toBn(completedCount)} জন
                </div>
              </div>

              {/* 5. Avg Time */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#E2E8F0', fontSize: '0.96rem', fontWeight: 700 }}>
                  <Clock size={18} color="#FB923C" />
                  <span>গড় সময়</span>
                </div>
                <div style={{ fontSize: '1.12rem', fontWeight: 900, color: '#FB923C' }}>
                  {toBn(avgTimeMinutes)} মিনিট
                </div>
              </div>
            </div>
          </div>

          {/* 4. DYNAMIC QR CODE BOX */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 14,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            border: '1.5px solid #E2E8F0'
          }}>
            {/* QR Code Image */}
            <div style={{
              width: 62, height: 62,
              borderRadius: 8,
              overflow: 'hidden',
              flexShrink: 0,
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <QRCodeSVG 
                value={doctorUrl} 
                size={58}
                level="M"
                includeMargin={false}
              />
            </div>

            {/* QR Code Text Description */}
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.25 }}>
                ডাক্তারের প্রোফাইল
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', lineHeight: 1.2, marginTop: 1 }}>
                ও অ্যাপয়েন্টমেন্ট নিতে
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#00966D', marginTop: 3 }}>
                QR কোড স্ক্যান করুন
              </div>
            </div>
          </div>
        </div>

        {/* ── CENTER COLUMN: NOW SERVING HERO BOX & NEXT IN LINE ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* NOW SERVING HERO BOX */}
          <div style={{
            background: 'linear-gradient(145deg, #05261C 0%, #031711 100%)',
            borderRadius: 20,
            border: '2px solid #059669',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: '0 12px 40px rgba(5, 150, 105, 0.25)',
            position: 'relative',
            overflow: 'hidden',
            flex: 1
          }}>
            {/* Top Header Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#047857',
              color: '#A7F3D0',
              padding: '6px 20px',
              borderRadius: 999,
              fontSize: '0.92rem',
              fontWeight: 800,
              letterSpacing: 0.5,
              boxShadow: '0 2px 10px rgba(4,120,87,0.4)',
              marginTop: 2
            }}>
              <Volume1 size={18} />
              <span>{isOnBreak ? 'সেশন বিরতি (SESSION BREAK)' : 'বর্তমান সিরিয়াল (NOW SERVING)'}</span>
            </div>

            {isOnBreak ? (
              <div style={{ padding: '20px 10px', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '3.4rem', fontWeight: 900, color: '#FDE047', margin: '10px 0', textShadow: '0 0 35px rgba(250,204,21,0.65)', letterSpacing: '0.5px' }}>
                  {breakReason}
                </div>
                {breakMessage && (
                  <div style={{ fontSize: '1.45rem', color: '#FEF08A', margin: '10px 0', fontWeight: 700, lineHeight: 1.3 }}>
                    {breakMessage}
                  </div>
                )}
                {breakResumeTime && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 12,
                    marginTop: 14,
                    background: 'rgba(245, 158, 11, 0.16)',
                    border: '2px solid #F59E0B',
                    padding: '10px 24px',
                    borderRadius: 14,
                    boxShadow: '0 4px 20px rgba(245, 158, 11, 0.25)'
                  }}>
                    <span style={{ color: '#FDE68A', fontSize: '1.25rem', fontWeight: 800 }}>⏰ সম্ভাব্য ফেরার সময়:</span>
                    <span style={{ color: '#FFFFFF', fontSize: '1.55rem', fontWeight: 900, background: '#78350F', padding: '4px 14px', borderRadius: 8, border: '1px solid #F59E0B' }}>
                      {breakResumeTime}
                    </span>
                  </div>
                )}
              </div>
            ) : currentlyServing ? (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'space-around', padding: '6px 0' }}>
                {/* Huge Glowing 3-Digit Serial Number */}
                <div style={{
                  fontSize: '7.5rem',
                  fontWeight: 900,
                  color: '#4ADE80',
                  fontFamily: 'monospace',
                  lineHeight: 1,
                  letterSpacing: '4px',
                  textShadow: '0 0 45px rgba(74,222,128,0.7)',
                  animation: 'pulseGlow 3s ease-in-out infinite',
                  margin: '4px 0'
                }}>
                  {formatSerial3(currentlyServing.serial_number)}
                </div>

                {/* Sub-badge under serial */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#044E38',
                  color: '#6EE7B7',
                  border: '1px solid #059669',
                  padding: '4px 16px',
                  borderRadius: 999,
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  marginBottom: 10
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 8px #34D399' }} />
                  <span>এখন চেম্বারে উপস্থিত</span>
                </div>

                {/* Patient Information Box (Matching Pic 1) */}
                <div style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  borderRadius: 16,
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'rgba(52, 211, 153, 0.15)',
                      border: '1.5px solid #34D399',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#34D399', flexShrink: 0
                    }}>
                      <User size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', color: '#CBD5E1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        বর্তমান সেবাগ্রহণকারী রোগী
                      </div>
                      <div style={{ fontSize: '2.05rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.25, margin: '2px 0' }}>
                        {currentlyServing.patient_name || 'রোগীর নাম'}
                      </div>
                      <div style={{ fontSize: '0.98rem', color: '#A7F3D0', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399', display: 'inline-block', boxShadow: '0 0 8px #34D399' }} />
                        ডাক্তারের পরামর্শ চলছে
                      </div>
                    </div>
                  </div>

                  {currentlyServing.appointment_time && (
                    <div style={{
                      background: 'rgba(5, 150, 105, 0.25)',
                      border: '1px solid #059669',
                      borderRadius: 10,
                      padding: '6px 12px',
                      textAlign: 'center',
                      flexShrink: 0
                    }}>
                      <div style={{ fontSize: '0.82rem', color: '#A7F3D0', fontWeight: 700 }}>নির্ধারিত সময়</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34D399', fontFamily: 'monospace' }}>
                        {formatTime12h(currentlyServing.appointment_time)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: '40px 10px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '3.4rem', color: '#34D399', fontWeight: 900, marginBottom: 10, textShadow: '0 0 30px rgba(52,211,153,0.45)' }}>
                  অপেক্ষারত...
                </div>
                <p style={{ color: '#F1F5F9', fontSize: '1.4rem', margin: 0, fontWeight: 700 }}>
                  পরবর্তী সিরিয়াল শীঘ্রই ডাকা হবে
                </p>
              </div>
            )}
          </div>

          {/* NEXT IN LINE CARD (AMBER GLOW BOX) */}
          <div style={{
            background: '#111827',
            border: '1.5px solid #D97706',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 6px 20px rgba(217,119,6,0.18)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: '#78350F',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FBBF24', flexShrink: 0
              }}>
                <Clock size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', color: '#FCD34D', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  পরবর্তী সিরিয়াল (NEXT IN LINE)
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FBBF24', fontFamily: 'monospace' }}>
                    {nextInLine ? formatSerial3(nextInLine.serial_number) : '---'}
                  </span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                    {nextInLine ? nextInLine.patient_name : 'পরবর্তী কোনো রোগী নেই'}
                  </span>
                </div>
                {nextInLine && (
                  <div style={{ fontSize: '0.76rem', color: '#FDE68A', fontWeight: 600, marginTop: 2 }}>
                    দয়া করে চেম্বারের সামনে প্রস্তুত থাকুন
                  </div>
                )}
              </div>
            </div>

            <div style={{ color: '#F59E0B' }}>
              <ChevronRight size={26} strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: LIVE QUEUE WAITING LIST ── */}
        <div style={{
          background: '#0E1422',
          borderRadius: 18,
          border: '1px solid #1E293B',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 8px 25px rgba(0,0,0,0.35)'
        }}>
          <div>
            {/* Header with waiting count badge */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
              paddingBottom: 10,
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#F1F5F9', fontSize: '1.05rem', fontWeight: 800 }}>
                <Users size={19} color="#00B875" />
                <span>অপেক্ষমান রোগীর তালিকা (Live Queue)</span>
              </div>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                color: '#38BDF8',
                background: '#075985',
                padding: '3px 12px',
                borderRadius: 999
              }}>
                {toBn(waitingCount)} জন লাইনে
              </span>
            </div>

            {/* Table Column Headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '0.8fr 1.6fr 1fr 1fr',
              padding: '8px 12px',
              fontSize: '0.96rem',
              fontWeight: 900,
              color: '#E2E8F0',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 8,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              marginBottom: 8
            }}>
              <div>সিরিয়াল নং</div>
              <div>রোগীর নাম</div>
              <div style={{ textAlign: 'center' }}>অবস্থা</div>
              <div style={{ textAlign: 'right' }}>সময়</div>
            </div>

            {/* Scrollable Queue Rows */}
            <div className="queue-scroll-area" style={{
              maxHeight: '38vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}>
              {/* 1. Currently Serving Row in Queue (if any) */}
              {currentlyServing && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '0.8fr 1.6fr 1fr 1fr',
                  alignItems: 'center',
                  padding: '9px 12px',
                  borderRadius: 10,
                  background: '#064E3B',
                  border: '1px solid #059669',
                  boxShadow: '0 2px 8px rgba(5,150,105,0.25)'
                }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#6EE7B7', fontFamily: 'monospace' }}>
                    {formatSerial3(currentlyServing.serial_number)}
                  </div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentlyServing.patient_name}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, background: '#10B981', color: '#fff', padding: '2px 8px', borderRadius: 6 }}>
                      চলমান
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#A7F3D0', textAlign: 'right' }}>
                    {currentlyServing.appointment_time ? currentlyServing.appointment_time.slice(0, 8) : '08:05 AM'}
                  </div>
                </div>
              )}

              {/* 2. Waiting Patients Rows */}
              {waitingPatients.length === 0 && !currentlyServing ? (
                <div style={{ textAlign: 'center', padding: '50px 0', color: '#94A3B8' }}>
                  <CheckCircle size={46} style={{ marginBottom: 12, color: '#34D399', opacity: 0.8 }} />
                  <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#E2E8F0' }}>বর্তমানে কোনো অপেক্ষমাণ রোগী নেই</p>
                  <p style={{ margin: '6px 0 0', fontSize: '0.95rem', color: '#94A3B8' }}>নতুন সিরিয়াল যুক্ত হলে এখানে দেখা যাবে</p>
                </div>
              ) : (
                waitingPatients.map((item, idx) => {
                  const isNext = idx === 0 && !currentlyServing ? false : idx === 0
                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '0.8fr 1.6fr 1fr 1fr',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: 10,
                        background: isNext ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${isNext ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.04)'}`
                      }}
                    >
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: isNext ? '#FDE047' : '#FFFFFF', fontFamily: 'monospace' }}>
                        {formatSerial3(item.serial_number)}
                      </div>
                      <div style={{ fontSize: '1.12rem', fontWeight: 800, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.patient_name}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          background: isNext ? '#78350F' : '#1E293B',
                          color: isNext ? '#FDE68A' : '#CBD5E1',
                          padding: '4px 10px',
                          borderRadius: 6
                        }}>
                          {isNext ? 'পরবর্তী' : 'অপেক্ষমান'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#E2E8F0', textAlign: 'right', fontFamily: 'monospace' }}>
                        {item.appointment_time ? item.appointment_time.slice(0, 8) : '08:15 AM'}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Bottom Hint */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#94A3B8',
            fontSize: '0.82rem',
            fontWeight: 600,
            paddingTop: 10,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            marginTop: 10
          }}>
            <Info size={15} color="#00B875" style={{ flexShrink: 0 }} />
            <span>সিরিয়াল মিস না করতে অনুরোধ করে অপেক্ষা করুন | ধন্যবাদ</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3. BOTTOM KPI SUMMARY ROW (4 TILES AS IN PIC 1)
          ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14,
        marginBottom: 14
      }}>
        {/* Tile 1: মোট অপেক্ষমান */}
        <div style={{
          background: '#0E1422',
          borderRadius: 14,
          border: '1px solid #1E293B',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94A3B8', fontSize: '0.86rem', fontWeight: 700, marginBottom: 4 }}>
            <Users size={16} color="#38BDF8" />
            <span>মোট অপেক্ষমান</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#38BDF8', lineHeight: 1.1 }}>
            {toBn(waitingCount)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>জন</div>
        </div>

        {/* Tile 2: সম্পন্ন সেবা */}
        <div style={{
          background: '#0E1422',
          borderRadius: 14,
          border: '1px solid #1E293B',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94A3B8', fontSize: '0.86rem', fontWeight: 700, marginBottom: 4 }}>
            <CheckCircle size={16} color="#34D399" />
            <span>সম্পন্ন সেবা</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#34D399', lineHeight: 1.1 }}>
            {toBn(completedCount)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>জন</div>
        </div>

        {/* Tile 3: আজকের মোট রোগী */}
        <div style={{
          background: '#0E1422',
          borderRadius: 14,
          border: '1px solid #1E293B',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94A3B8', fontSize: '0.86rem', fontWeight: 700, marginBottom: 4 }}>
            <Users size={16} color="#FBBF24" />
            <span>আজকের মোট রোগী</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FBBF24', lineHeight: 1.1 }}>
            {toBn(totalPatientsCount)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>জন</div>
        </div>

        {/* Tile 4: গড় প্রতীক্ষার সময় */}
        <div style={{
          background: '#0E1422',
          borderRadius: 14,
          border: '1px solid #1E293B',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94A3B8', fontSize: '0.86rem', fontWeight: 700, marginBottom: 4 }}>
            <Clock size={16} color="#F472B6" />
            <span>গড় প্রতীক্ষার সময়</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F472B6', lineHeight: 1.1 }}>
            {toBn(avgTimeMinutes)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>মিনিট</div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          4. BOTTOM BROADCAST TICKER & CALL BUTTON (AS IN PIC 1)
          ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14
      }}>
        {/* News Announcement Marquee Ticker */}
        <div style={{
          flex: 1,
          background: '#0E1422',
          borderRadius: 14,
          padding: '6px 14px',
          border: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          overflow: 'hidden',
          boxShadow: '0 4px 18px rgba(0,0,0,0.3)'
        }}>
          {/* Announcement Badge (Matching Dashboard Green #00B875) */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: '#00B875',
            borderRadius: 12,
            padding: '8px 18px',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(0, 184, 117, 0.35)',
            border: 'none'
          }}>
            <div style={{
              width: 30, height: 30,
              borderRadius: '50%',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00B875',
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
            }}>
              <Megaphone size={17} />
            </div>
            <span style={{
              fontSize: '1.05rem',
              fontWeight: 900,
              color: '#FFFFFF',
              fontFamily: '"Hind Siliguri", sans-serif',
              letterSpacing: '0.3px'
            }}>
              ঘোষণা
            </span>
          </div>

          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            <div className="marquee-track" style={{
              color: '#E2E8F0',
              fontSize: '0.98rem',
              fontWeight: 600
            }}>
              {nextInLine ? `পরবর্তী সিরিয়াল ${formatSerial3(nextInLine.serial_number)} (${nextInLine.patient_name}) ● ` : ''}
              অনুগ্রহ করে নির্ধারিত সিরিয়াল অনুযায়ী চেম্বারে প্রবেশ করুন ● মোবাইল ফোন সাইলেন্ট রাখুন ● সিরিয়াল মিস না করতে অনুগ্রহ করে অপেক্ষমাণ কক্ষে বসুন ● ধন্যবাদ
            </div>
          </div>
        </div>

        {/* Right Phone Contact Button (Matching Dashboard Green #00B875) */}
        {supportPhone ? (
          <div style={{
            background: '#00B875',
            borderRadius: 12,
            padding: '8px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 4px 14px rgba(0, 184, 117, 0.35)',
            border: 'none',
            flexShrink: 0
          }}>
            <div style={{
              width: 42, height: 42,
              borderRadius: '50%',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00B875',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
            }}>
              <Phone size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#FFFFFF', fontWeight: 700, lineHeight: 1.2, opacity: 0.95 }}>
                সিরিয়ালের জন্য কল করুন
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.5px', lineHeight: 1.2 }}>
                {supportPhone}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

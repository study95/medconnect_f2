import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../../context/AuthContext'
import { useDialog } from '../../../hooks/useDialog'
import { DIALOG_MESSAGES, DIALOG_BUTTONS } from '../../../utils/dialogMessages'
import { getHospitals, getDoctors, getChambers } from '../../../api/adminApi'
import { 
  getHospitalLiveQueue, 
  getLiveQueue, 
  callNextPatient, 
  completeConsultation, 
  markNoShow, 
  recallNoShow, 
  regenerateChamberToken,
  setChamberBreak
} from '../../../api/appointmentApi'
import { soundService } from '../../../utils/soundUtils'
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Play, 
  CheckCircle2, 
  UserX, 
  RotateCcw, 
  RefreshCw, 
  Calendar, 
  ExternalLink, 
  Copy, 
  QrCode, 
  Building2, 
  Stethoscope, 
  Clock, 
  Users, 
  Sparkles,
  ArrowRight,
  Maximize2,
  Phone,
  Radio,
  CheckCircle,
  AlertCircle,
  CalendarCheck,
  Award,
  Coffee,
  Pause,
  PlayCircle,
  X,
  MessageSquare,
  FileText
} from 'lucide-react'

const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBn = (str) => str !== null && str !== undefined ? String(str).replace(/\d/g, d => enToBn[d] || d) : ''
const formatSerial3 = (num) => {
  if (num === null || num === undefined) return '000'
  return String(num).padStart(3, '0')
}

const dayMapBn = {
  'Sunday': 'রবিবার',
  'Monday': 'সোমবার',
  'Tuesday': 'মঙ্গলবার',
  'Wednesday': 'বুধবার',
  'Thursday': 'বৃহস্পতিবার',
  'Friday': 'শুক্রবার',
  'Saturday': 'শনিবার'
}

const getDayNameBn = (dayNameEn) => {
  if (!dayNameEn) return ''
  return dayMapBn[dayNameEn] || dayNameEn
}

const formatTime12h = (timeStr) => {
  if (!timeStr) return ''
  try {
    const parts = timeStr.split(':')
    let hour = parseInt(parts[0], 10)
    const minute = parts[1] || '00'
    const ampm = hour >= 12 ? 'PM' : 'AM'
    hour = hour % 12 || 12
    const hourStr = hour < 10 ? `0${hour}` : `${hour}`
    return `${toBn(hourStr)}:${toBn(minute)} ${ampm}`
  } catch (e) {
    return timeStr
  }
}

const formatDateBn = (dateStr) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr + 'T00:00:00')
    const day = toBn(d.getDate())
    const monthsBn = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
    const month = monthsBn[d.getMonth()]
    const year = toBn(d.getFullYear())
    return `${day} ${month}, ${year}`
  } catch (e) {
    return dateStr
  }
}

const getNextDateForDay = (targetDayName) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const targetIndex = days.findIndex(d => d.toLowerCase() === (targetDayName || '').toLowerCase())
  if (targetIndex === -1) return new Date().toISOString().split('T')[0]
  
  const now = new Date()
  const currentDayIndex = now.getDay()
  let diff = targetIndex - currentDayIndex
  if (diff < 0) diff += 7
  const nextDate = new Date(now)
  nextDate.setDate(now.getDate() + diff)
  return nextDate.toISOString().split('T')[0]
}

export default function SerialDisplayManagerPage() {
  const navigate = useNavigate()
  const { user, isAdmin, isManager, isDoctor } = useAuth()
  const { confirm, showError } = useDialog()
  const isDoctorOnly = !isAdmin && !isManager && isDoctor

  // Selection states
  const [hospitals, setHospitals] = useState([])
  const [doctorChambersList, setDoctorChambersList] = useState([])
  const [selectedHospitalId, setSelectedHospitalId] = useState('')
  const [selectedChamberId, setSelectedChamberId] = useState('')
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [viewMode, setViewMode] = useState('controller') // 'controller' | 'overview'

  // Data states
  const [hospitalQueueData, setHospitalQueueData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Settings
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrModalData, setQrModalData] = useState({ title: '', url: '' })

  // Break / Pause notice modal states
  const [showBreakModal, setShowBreakModal] = useState(false)
  const [breakTargetChamber, setBreakTargetChamber] = useState(null)
  const [breakReason, setBreakReason] = useState('নামাজের বিরতি')
  const [breakResumeTime, setBreakResumeTime] = useState('১৫ মিনিট পর')
  const [breakCustomMessage, setBreakCustomMessage] = useState('')
  const [breakLoading, setBreakLoading] = useState(false)

  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  // 1. Initial Data Fetch: Load Hospitals & Chambers scoped to Role
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true)

        if (isDoctorOnly) {
          // Doctor role: fetch strictly this doctor's chambers
          const chamberRes = await getChambers({ per_page: 1000 })
          const chambers = chamberRes.data?.data?.data || chamberRes.data?.data || chamberRes.data || []
          setDoctorChambersList(chambers)

          // Extract unique hospitals from doctor's chambers
          const hospMap = new Map()
          chambers.forEach(ch => {
            if (ch.hospital && ch.hospital.id) {
              hospMap.set(ch.hospital.id.toString(), ch.hospital)
            } else if (ch.hospital_id) {
              hospMap.set(ch.hospital_id.toString(), { id: ch.hospital_id, name: ch.hospital_name || 'হাসপাতাল চেম্বার' })
            }
          })
          const doctorHospitals = Array.from(hospMap.values())
          setHospitals(doctorHospitals)

          // Determine current selected day of week
          const currentDayOfWeek = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
          const todayChamber = chambers.find(ch => (ch.day || '').toLowerCase() === currentDayOfWeek.toLowerCase() && ch.is_active)

          if (todayChamber && todayChamber.hospital_id) {
            setSelectedHospitalId(todayChamber.hospital_id.toString())
            setSelectedChamberId(todayChamber.id.toString())
          } else if (doctorHospitals.length > 0) {
            setSelectedHospitalId(doctorHospitals[0].id.toString())
            if (chambers[0]) {
              setSelectedChamberId(chambers[0].id.toString())
            }
          }
        } else {
          // Admin / Manager: fetch all hospitals
          const hospRes = await getHospitals({ per_page: 1000 })
          const list = hospRes.data?.data?.data || hospRes.data?.data || hospRes.data || []
          setHospitals(list)

          if (isManager || (!isAdmin && user?.registration_type === 'hospital')) {
            const myHosp = list.find(h => h.user_id === user?.id || (user?.email && h.email === user?.email)) || list[0]
            if (myHosp) {
              setSelectedHospitalId(myHosp.id.toString())
            }
          } else if (list.length > 0 && !selectedHospitalId) {
            setSelectedHospitalId(list[0].id.toString())
          }
        }
      } catch (err) {
        console.error('Failed to load initial data', err)
      } finally {
        setLoading(false)
      }
    }

    initData()
  }, [isAdmin, isManager, isDoctor, user])

  // 2. Fetch Live Queue Data (Runs whenever hospital or date changes)
  const fetchHospitalData = async (silent = false) => {
    if (!selectedHospitalId) return
    try {
      if (!silent) setLoading(true)

      let data = null
      if (selectedHospitalId === 'all') {
        const targetHospitals = hospitals.filter(h => h.id && h.id !== 'all')
        if (targetHospitals.length > 0) {
          const results = await Promise.all(
            targetHospitals.map(h => getHospitalLiveQueue(h.id, selectedDate).catch(() => null))
          )

          let allDoctorQueues = []
          let totalChambers = 0
          let activeSessions = 0
          let totalWaiting = 0
          let totalCompleted = 0
          let totalBooked = 0

          results.forEach(res => {
            if (res && res.data) {
              const hData = res.data?.data || res.data
              const queues = hData?.doctor_queues || []
              allDoctorQueues = allDoctorQueues.concat(queues)
              const summ = hData?.summary || {}
              totalChambers += summ.total_chambers || queues.length || 0
              activeSessions += summ.active_sessions || (queues.filter(q => q.currently_serving).length) || 0
              totalWaiting += summ.total_waiting || 0
              totalCompleted += summ.total_completed || 0
              totalBooked += summ.total_booked || 0
            }
          })

          data = {
            hospital: {
              id: 'all',
              name: 'All Hospitals & Locations',
              name_bn: isDoctorOnly ? 'সকল চেম্বার ও হাসপাতাল' : 'সকল হাসপাতাল'
            },
            summary: {
              total_chambers: totalChambers,
              active_sessions: activeSessions,
              total_waiting: totalWaiting,
              total_completed: totalCompleted,
              total_booked: totalBooked,
            },
            doctor_queues: allDoctorQueues
          }
        }
      } else {
        const res = await getHospitalLiveQueue(selectedHospitalId, selectedDate)
        data = res.data?.data || res.data
      }

      if (isMountedRef.current && data) {
        setHospitalQueueData(data)
        
        let doctorQueues = data?.doctor_queues || []

        // If doctor only, guarantee strictly own profile filter
        if (isDoctorOnly) {
          doctorQueues = doctorQueues.filter(dq => 
            String(dq.doctor?.user_id) === String(user?.id) ||
            dq.doctor?.email?.toLowerCase() === user?.email?.toLowerCase() ||
            (user?.doctor?.id && String(dq.doctor?.id) === String(user.doctor.id)) ||
            (user?.name && dq.doctor?.name?.toLowerCase().includes(user.name.toLowerCase()))
          )
        }

        if (doctorQueues.length > 0) {
          // Prioritize chamber that is scheduled on the selected date or has active serving
          const currentDayOfWeek = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
          const activeScheduled = doctorQueues.find(dq => 
            (dq.chamber?.day || '').toLowerCase() === currentDayOfWeek.toLowerCase() ||
            dq.is_scheduled_today ||
            dq.currently_serving
          )

          const currentExists = doctorQueues.some(dq => dq.chamber?.id?.toString() === selectedChamberId)
          if (!selectedChamberId || !currentExists) {
            setSelectedChamberId(activeScheduled ? activeScheduled.chamber?.id?.toString() : doctorQueues[0].chamber?.id?.toString())
          }
        }
      }
    } catch (err) {
      if (!silent) {
        console.error('Failed to fetch queue data', err)
      }
    } finally {
      if (!silent && isMountedRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedHospitalId) {
      fetchHospitalData(false)
    }
  }, [selectedHospitalId, selectedDate])

  // 3. Auto Refresh Interval (Every 5 seconds)
  useEffect(() => {
    if (!autoRefresh || !selectedHospitalId) return

    const interval = setInterval(() => {
      fetchHospitalData(true)
    }, 5000)

    return () => clearInterval(interval)
  }, [autoRefresh, selectedHospitalId, selectedDate, selectedChamberId])

  // Process and filter active doctor list
  let rawDoctorsList = hospitalQueueData?.doctor_queues || []
  if (isDoctorOnly) {
    rawDoctorsList = rawDoctorsList.filter(dq => 
      String(dq.doctor?.user_id) === String(user?.id) ||
      dq.doctor?.email?.toLowerCase() === user?.email?.toLowerCase() ||
      (user?.doctor?.id && String(dq.doctor?.id) === String(user.doctor.id)) ||
      (user?.name && dq.doctor?.name?.toLowerCase().includes(user.name.toLowerCase()))
    )
  }
  const activeDoctorsList = rawDoctorsList

  // Current active doctor chamber queue from the aggregated data
  const currentChamberQueue = activeDoctorsList.find(
    dq => dq.chamber?.id?.toString() === selectedChamberId
  ) || activeDoctorsList[0]

  // Queue Action Handlers
  const handleCallNext = async (targetAppointmentId = null) => {
    if (!currentChamberQueue) return
    const docId = currentChamberQueue.doctor?.id
    const chamberId = currentChamberQueue.chamber?.id

    try {
      setActionLoading(true)
      const res = await callNextPatient(docId, chamberId, selectedDate, targetAppointmentId)
      const patient = res.data?.data

      if (patient) {
        toast.success(`সিরিয়াল ${formatSerial3(patient.serial_number)} (${patient.patient_name || 'রোগী'}) কে ডাকা হয়েছে`)
        if (soundEnabled) {
          soundService.announceSerial({
            serialNumber: patient.serial_number,
            roomNumber: currentChamberQueue.chamber?.room_number,
            doctorName: currentChamberQueue.doctor?.name_bn || currentChamberQueue.doctor?.name,
            lang: 'bn'
          })
        }
      } else {
        toast.info('কিউ-তে কোনো অপেক্ষমাণ রোগী নেই')
      }

      await fetchHospitalData(true)
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleComplete = async (appointmentId) => {
    try {
      setActionLoading(true)
      await completeConsultation(appointmentId)
      await fetchHospitalData(true)
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleNoShow = async (appointmentId) => {
    try {
      setActionLoading(true)
      await markNoShow(appointmentId)
      await fetchHospitalData(true)
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRecall = async (appointmentId) => {
    try {
      setActionLoading(true)
      await recallNoShow(appointmentId)
      await fetchHospitalData(true)
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRegenerateToken = async (chamberId) => {
    const isConfirmed = await confirm({
      title: DIALOG_MESSAGES.SERIAL_RESET_CONFIRM.title,
      message: DIALOG_MESSAGES.SERIAL_RESET_CONFIRM.message,
      confirmText: DIALOG_BUTTONS.CONFIRM,
      cancelText: DIALOG_BUTTONS.CANCEL,
      variant: 'danger',
    })
    if (!isConfirmed) return
    try {
      setActionLoading(true)
      await regenerateChamberToken(chamberId)
      await fetchHospitalData(true)
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  // ── Break Notice Handlers ──
  const handleOpenBreakModal = (chamberQueue = null) => {
    const target = chamberQueue || currentChamberQueue
    if (!target) return
    const ch = target.chamber || {}
    setBreakTargetChamber(target)
    setBreakReason(ch.break_reason || 'নামাজের বিরতি')
    setBreakResumeTime(ch.break_resume_time || '১৫ মিনিট পর')
    setBreakCustomMessage(ch.break_message || '')
    setShowBreakModal(true)
  }

  const handleSaveBreak = async () => {
    const targetChamberId = breakTargetChamber?.chamber?.id || currentChamberQueue?.chamber?.id
    if (!targetChamberId) {
      showError({
        title: DIALOG_MESSAGES.ERROR.title,
        message: 'কোনো চেম্বার নির্বাচন করা নেই।',
      })
      return
    }

    try {
      setBreakLoading(true)
      await setChamberBreak(targetChamberId, {
        is_on_break: true,
        break_reason: breakReason,
        break_resume_time: breakResumeTime,
        break_message: breakCustomMessage
      })
      setShowBreakModal(false)
      await fetchHospitalData(true)
    } catch (err) {
      console.error(err)
    } finally {
      setBreakLoading(false)
    }
  }

    const handleEndBreak = async (chamberId = null) => {
    const targetChamberId = chamberId || breakTargetChamber?.chamber?.id || currentChamberQueue?.chamber?.id
    if (!targetChamberId) return

    try {
      setBreakLoading(true)
      await setChamberBreak(targetChamberId, {
        is_on_break: false
      })
      setShowBreakModal(false)
      await fetchHospitalData(true)
    } catch (err) {
      console.error(err)
    } finally {
      setBreakLoading(false)
    }
  }

  const copyToClipboard = (text, label = 'লিংক') => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} কপি করা হয়েছে!`)
  }

  const openQrModal = (title, url) => {
    setQrModalData({ title, url })
    setShowQrModal(true)
  }

  const currentHospital = hospitalQueueData?.hospital || hospitals.find(h => h.id.toString() === selectedHospitalId)
  const hospitalSummary = hospitalQueueData?.summary || {}

  const currentlyServing = currentChamberQueue?.currently_serving
  const nextInLine = currentChamberQueue?.next_in_line
  const waitingPatients = currentChamberQueue?.waiting_patients || []
  const completedPatients = currentChamberQueue?.completed_patients || []
  const noShowPatients = currentChamberQueue?.no_show_patients || []
  const stats = currentChamberQueue?.statistics || {}

  const singleTvUrl = currentChamberQueue?.chamber?.display_token 
    ? `${window.location.origin}/display/${currentChamberQueue.chamber.display_token}`
    : ''

  const hospitalTvUrl = selectedHospitalId 
    ? `${window.location.origin}/display/hospital/${selectedHospitalId}`
    : ''

  // Selected date weekday helper
  const selectedDayOfWeek = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
  const selectedDayBn = getDayNameBn(selectedDayOfWeek)

  const isCurrentChamberScheduledToday = currentChamberQueue 
    ? ((currentChamberQueue.chamber?.day || '').toLowerCase() === selectedDayOfWeek.toLowerCase() || currentChamberQueue.is_scheduled_today)
    : false

  return (
    <div className="admin-container" style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 60 }}>
      {/* ── Page Header Bar ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
        background: 'var(--admin-card-bg)',
        padding: '20px 24px',
        borderRadius: 16,
        border: '1px solid var(--admin-border)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ 
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
              width: 36, height: 36, borderRadius: 10, background: 'rgba(0, 184, 117, 0.12)', color: '#00B875' 
            }}>
              <Tv size={20} />
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--admin-text)' }}>
              সিরিয়াল ডিসপ্লে ও লাইভ কিউ কন্ট্রোল
            </h2>
            <span style={{ 
              fontSize: 11, fontWeight: 800, color: '#00B875', background: 'rgba(0, 184, 117, 0.1)', 
              padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.5px' 
            }}>
              {isDoctorOnly ? 'Doctor Control Panel' : 'Live Monitor'}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-text-muted)', fontWeight: 500 }}>
            {isDoctorOnly 
              ? 'আপনার চেম্বার নির্বাচন করুন, তারিখ অনুযায়ী রানিং সেশন মনিটর করুন এবং লাইভ সিরিয়াল পরিচালনা করুন।'
              : 'হাসপাতাল ভিত্তিক ডাক্তার অনুযায়ী সিরিয়াল পরিচালনা করুন এবং পেশাদার টিভি ডিসপ্লে বোর্ড মনিটর করুন।'}
          </p>
        </div>

        {/* Top Control Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Break & Notice Button */}
          {currentChamberQueue && (
            <button
              onClick={() => handleOpenBreakModal()}
              className="admin-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: 40,
                borderRadius: 10,
                background: currentChamberQueue.chamber?.is_on_break ? '#FEF3C7' : 'transparent',
                color: currentChamberQueue.chamber?.is_on_break ? '#92400E' : 'var(--admin-text)',
                border: currentChamberQueue.chamber?.is_on_break ? '1.5px solid #F59E0B' : '1px solid var(--admin-border)',
                fontWeight: 700,
                fontSize: 13
              }}
              title="টিভি স্ক্রিনে সাময়িক বিরতির নোটিশ দেখান"
            >
              {currentChamberQueue.chamber?.is_on_break ? (
                <>
                  <Pause size={16} color="#B45309" className="pulse-anim" />
                  <span>বিরতি চলছে ({currentChamberQueue.chamber?.break_reason || 'বিরতি'})</span>
                </>
              ) : (
                <>
                  <Coffee size={16} />
                  <span>সেশন বিরতি / নোটিশ</span>
                </>
              )}
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const next = !soundEnabled
              setSoundEnabled(next)
              soundService.setMuted(!next)
              if (next) soundService.playChime()
              toast.success(next ? 'সাউন্ড এলার্ট চালু হয়েছে' : 'সাউন্ড এলার্ট বন্ধ')
            }}
            className={`admin-btn ${soundEnabled ? 'admin-btn-primary' : 'admin-btn-outline'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, borderRadius: 10 }}
            title={soundEnabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span style={{ fontSize: 13 }}>{soundEnabled ? 'সাউন্ড অন' : 'মিউট'}</span>
          </button>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="admin-btn admin-btn-outline"
            style={{ 
              display: 'flex', alignItems: 'center', gap: 6, height: 40, borderRadius: 10,
              borderColor: autoRefresh ? '#00B875' : 'var(--admin-border)',
              color: autoRefresh ? '#00B875' : 'var(--admin-text)'
            }}
          >
            <span style={{ 
              width: 8, height: 8, borderRadius: '50%', 
              background: autoRefresh ? '#00B875' : '#94A3B8',
              boxShadow: autoRefresh ? '0 0 8px #00B875' : 'none'
            }} />
            <span style={{ fontSize: 13 }}>{autoRefresh ? 'লাইভ সিঙ্ক' : 'পজ'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={() => fetchHospitalData(false)}
            disabled={loading}
            className="admin-btn admin-btn-outline"
            style={{
              height: 40,
              width: 40,
              padding: 0,
              borderRadius: 10,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
            title="রিফ্রেশ করুন"
          >
            <RefreshCw size={16} className={loading ? 'spin-anim' : ''} />
          </button>
        </div>
      </div>

      {/* ── Filters & View Switcher Bar ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 24,
        background: 'var(--admin-card-bg)',
        padding: '16px 20px',
        borderRadius: 14,
        border: '1px solid var(--admin-border)'
      }}>
        {/* Hospital / Branch Selector */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
            {isDoctorOnly ? 'চেম্বার হাসপাতাল / লোকেশন' : 'হাসপাতাল নির্বাচন (Hospital)'}
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedHospitalId}
              onChange={(e) => {
                setSelectedHospitalId(e.target.value)
                setSelectedChamberId('')
              }}
              disabled={isManager}
              style={{
                width: '100%', height: 42, borderRadius: 10, border: '1px solid var(--admin-border)',
                background: 'var(--admin-bg)', color: 'var(--admin-text)', padding: '0 12px', fontSize: 13,
                fontWeight: 700, outline: 'none', cursor: isManager ? 'not-allowed' : 'pointer'
              }}
            >
              {hospitals.length > 0 && (
                <option value="all">
                  {isDoctorOnly ? '✨ সকল চেম্বার ও হাসপাতাল (All Locations)' : '✨ সকল হাসপাতাল (All Locations)'}
                </option>
              )}
              {hospitals.length === 0 ? (
                <option value="">কোনো চেম্বার হাসপাতাল যুক্ত নেই</option>
              ) : (
                hospitals.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name_bn || h.name} {h.district?.name ? `(${h.district.name})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Date Selector */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>
              তারিখ (Date)
            </label>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#00B875' }}>
              {selectedDayBn}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                flex: 1, height: 42, borderRadius: 10, border: '1px solid var(--admin-border)',
                background: 'var(--admin-bg)', color: 'var(--admin-text)', padding: '0 12px', fontSize: 13,
                fontWeight: 600, outline: 'none'
              }}
            />
            <button
              type="button"
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="admin-btn admin-btn-outline"
              style={{ height: 42, padding: '0 14px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}
            >
              আজ
            </button>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
            ভিউ মোড (Display Mode)
          </label>
          <div style={{ display: 'flex', background: 'var(--admin-bg)', padding: 3, borderRadius: 10, border: '1px solid var(--admin-border)' }}>
            <button
              type="button"
              onClick={() => setViewMode('controller')}
              style={{
                flex: 1, height: 34, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', transition: '0.2s',
                background: viewMode === 'controller' ? '#00B875' : 'transparent',
                color: viewMode === 'controller' ? '#fff' : 'var(--admin-text)'
              }}
            >
              👨‍⚕️ {isDoctorOnly ? 'আমার কিউ কন্ট্রোলার' : 'ডাক্তার কন্ট্রোলার'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('overview')}
              style={{
                flex: 1, height: 34, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', transition: '0.2s',
                background: viewMode === 'overview' ? '#00B875' : 'transparent',
                color: viewMode === 'overview' ? '#fff' : 'var(--admin-text)'
              }}
            >
              🏥 {isDoctorOnly ? 'চেম্বার ওভারভিউ' : 'হাসপাতাল মাস্টার বোর্ড'}
            </button>
          </div>
        </div>

        {/* Master TV Launch Button */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
            পাবলিক টিভি বোর্ড (TV Screens)
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={isDoctorOnly && singleTvUrl ? singleTvUrl : hospitalTvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-primary"
              style={{ flex: 1, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, textDecoration: 'none', fontSize: 13 }}
            >
              <ExternalLink size={15} /> {isDoctorOnly ? 'রুম টিভি স্ক্রিন' : 'হাসপাতাল টিভি'}
            </a>
            <button
              type="button"
              onClick={() => openQrModal(isDoctorOnly ? 'রুম টিভি ডিসপ্লে বোর্ড' : 'হাসপাতাল মাস্টার টিভি বোর্ড', isDoctorOnly && singleTvUrl ? singleTvUrl : hospitalTvUrl)}
              className="admin-btn admin-btn-outline"
              style={{
                height: 42,
                width: 42,
                padding: 0,
                borderRadius: 10,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              title="QR কোড দেখুন"
            >
              <QrCode size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary Counters Bar ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 14,
        marginBottom: 24
      }}>
        <div className="admin-card" style={{ padding: '16px 20px', borderLeft: '4px solid #00B875' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>
            {isDoctorOnly ? 'মোট চেম্বার' : 'সক্রিয় চেম্বার'}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#00B875', marginTop: 4 }}>
            {toBn(activeDoctorsList.length || hospitalSummary.total_chambers || 0)} <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)' }}>টি</span>
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>
            {isDoctorOnly ? 'আজকের রানিং সেশন' : 'রানিং সেশন'}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#3B82F6', marginTop: 4 }}>
            {toBn(hospitalSummary.active_sessions || (currentlyServing ? 1 : 0))} <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)' }}>{isDoctorOnly ? 'টি সক্রিয়' : 'জন ডাক্তার'}</span>
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>মোট অপেক্ষমাণ</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#F59E0B', marginTop: 4 }}>
            {toBn(isDoctorOnly ? (stats.total_waiting || 0) : (hospitalSummary.total_waiting || 0))} <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)' }}>জন</span>
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>সম্পন্ন সেবা</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981', marginTop: 4 }}>
            {toBn(isDoctorOnly ? (stats.total_completed || 0) : (hospitalSummary.total_completed || 0))} <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)' }}>জন</span>
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px', borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>মোট বুকিং</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#8B5CF6', marginTop: 4 }}>
            {toBn(isDoctorOnly ? (stats.total_booked || 0) : (hospitalSummary.total_booked || 0))} <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)' }}>টি</span>
          </div>
        </div>
      </div>

      {/* ── View Mode 1: Doctor Controller ── */}
      {viewMode === 'controller' && (
        <div>
          {/* Doctor Chamber / Session Selection Cards */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isDoctorOnly ? `আপনার চেম্বার ও সেশন সমূহ (${activeDoctorsList.length} টি)` : `ডাক্তার চেম্বার নির্বাচন করুন (${activeDoctorsList.length} জন)`}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(0, 184, 117, 0.1)', color: '#00B875' }}>
                  তারিখ: {formatDateBn(selectedDate)} ({selectedDayBn})
                </span>
              </div>
              {currentChamberQueue && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <a
                    href={singleTvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, fontWeight: 700, color: '#00B875', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <ExternalLink size={13} /> রুমের টিভি স্ক্রিন
                  </a>
                  <button
                    onClick={() => openQrModal(`${currentChamberQueue.doctor?.name_bn || currentChamberQueue.doctor?.name} - রুম ডিসপ্লে`, singleTvUrl)}
                    style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', padding: 0 }}
                    title="রুম QR কোড"
                  >
                    <QrCode size={14} />
                  </button>
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              gap: 12,
              overflowX: 'auto',
              paddingBottom: 8,
              scrollbarWidth: 'thin'
            }}>
              {activeDoctorsList.length === 0 ? (
                <div style={{ padding: '24px', background: 'var(--admin-card-bg)', borderRadius: 12, border: '1px dashed var(--admin-border)', width: '100%', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                  এই হাসপাতালে নির্বাচিত তারিখে কোনো সক্রিয় চেম্বার শিডিউল পাওয়া যায়নি।
                </div>
              ) : (
                activeDoctorsList.map((dq) => {
                  const isSelected = dq.chamber?.id?.toString() === selectedChamberId
                  const isServing = !!dq.currently_serving
                  const chamberDay = dq.chamber?.day || ''
                  const chamberDayBn = getDayNameBn(chamberDay)
                  const isTodaySession = chamberDay.toLowerCase() === selectedDayOfWeek.toLowerCase() || dq.is_scheduled_today
                  const timeFormatted = dq.chamber?.start_time ? `${formatTime12h(dq.chamber.start_time)} - ${formatTime12h(dq.chamber.end_time)}` : ''

                  return (
                    <div
                      key={dq.chamber?.id}
                      onClick={() => setSelectedChamberId(dq.chamber?.id?.toString())}
                      style={{
                        minWidth: 280,
                        maxWidth: 320,
                        padding: '14px 16px',
                        borderRadius: 14,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: isSelected ? 'var(--admin-card-bg)' : 'var(--admin-bg)',
                        border: isSelected ? '2px solid #00B875' : '1px solid var(--admin-border)',
                        boxShadow: isSelected ? '0 6px 20px rgba(0, 184, 117, 0.15)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        flexShrink: 0,
                        position: 'relative'
                      }}
                    >
                      {/* Top Row: Doctor/Chamber Name & Room */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: isSelected ? '#00B875' : 'var(--admin-text)' }}>
                            {isDoctorOnly ? (dq.chamber?.hospital_name || currentHospital?.name || 'চেম্বার') : (dq.doctor?.name_bn || dq.doctor?.name)}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 600 }}>
                            {isDoctorOnly ? (dq.doctor?.name_bn || dq.doctor?.name) : (dq.doctor?.specialty?.name_bn || dq.doctor?.specialty?.name || 'বিশেষজ্ঞ')}
                          </div>
                        </div>

                        {dq.chamber?.room_number && (
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: 'rgba(0,0,0,0.06)', color: 'var(--admin-text)', whiteSpace: 'nowrap' }}>
                            রুম {toBn(dq.chamber.room_number)}
                          </span>
                        )}
                      </div>

                      {/* Day & Time Slot details */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 600 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} color="#00B875" /> {chamberDayBn || 'প্রতিদিন'}
                        </span>
                        {timeFormatted && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} /> {timeFormatted}
                          </span>
                        )}
                      </div>

                      {/* Session Status Badge & Waiting Count */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontWeight: 700, paddingTop: 4, borderTop: '1px dashed var(--admin-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ 
                            width: 8, height: 8, borderRadius: '50%', 
                            background: dq.chamber?.is_on_break ? '#F59E0B' : (isServing ? '#00B875' : (isTodaySession ? '#3B82F6' : '#94A3B8')),
                            boxShadow: dq.chamber?.is_on_break ? '0 0 6px #F59E0B' : (isServing ? '0 0 6px #00B875' : 'none')
                          }} />
                          <span style={{ color: dq.chamber?.is_on_break ? '#D97706' : (isServing ? '#00B875' : (isTodaySession ? '#3B82F6' : 'var(--admin-text-muted)')) }}>
                            {dq.chamber?.is_on_break 
                              ? `⏸️ বিরতি (${dq.chamber.break_reason || 'বিরতি'})` 
                              : (isServing ? `চলছে: ${formatSerial3(dq.currently_serving.serial_number)}` : (isTodaySession ? 'আজকের সেশন' : `শিডিউল: ${chamberDayBn}`))}
                          </span>
                        </div>
                        <span style={{ color: '#F59E0B' }}>
                          অপেক্ষমাণ: {toBn(dq.statistics?.total_waiting || 0)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Off-Day Notification / Schedule Switcher when selected date is not active for this chamber */}
          {currentChamberQueue && !isCurrentChamberScheduledToday && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.03) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 14,
              padding: '14px 20px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <AlertCircle size={22} color="#F59E0B" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--admin-text)' }}>
                    নির্বাচিত তারিখে ({formatDateBn(selectedDate)} - {selectedDayBn}) এই চেম্বারের নির্ধারিত সেশন নেই
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                    এই চেম্বারের নিয়মিত শিডিউল: <strong style={{ color: '#00B875' }}>{getDayNameBn(currentChamberQueue.chamber?.day)}</strong> ({formatTime12h(currentChamberQueue.chamber?.start_time)} - {formatTime12h(currentChamberQueue.chamber?.end_time)})
                  </div>
                </div>
              </div>

              {currentChamberQueue.chamber?.day && (
                <button
                  onClick={() => setSelectedDate(getNextDateForDay(currentChamberQueue.chamber?.day))}
                  className="admin-btn admin-btn-sm"
                  style={{
                    background: '#F59E0B',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 14px',
                    fontWeight: 800,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <CalendarCheck size={14} /> পরবর্তী সেশন ({getDayNameBn(currentChamberQueue.chamber?.day)}) দেখুন
                </button>
              )}
            </div>
          )}

          {/* Main Queue Controller Canvas */}
          {currentChamberQueue && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              
              {/* Left Column: Currently Serving Hero & Quick Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Doctor Chamber Profile Card */}
                <div className="admin-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 12,
                      background: 'rgba(0, 184, 117, 0.1)', color: '#00B875',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18
                    }}>
                      <Stethoscope size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--admin-text)' }}>
                        {currentChamberQueue.doctor?.name_bn || currentChamberQueue.doctor?.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', fontWeight: 600 }}>
                        {currentChamberQueue.doctor?.degree_bn || currentChamberQueue.doctor?.degree || currentChamberQueue.doctor?.specialty?.name || 'বিশেষজ্ঞ'}
                        {currentChamberQueue.doctor?.bmdc ? ` • BMDC: ${currentChamberQueue.doctor.bmdc}` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      পরামর্শ ফি
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#00B875' }}>
                      ৳ {toBn(currentChamberQueue.chamber?.fee || 500)}
                    </div>
                  </div>
                </div>

                {/* Break Notification Banner when Chamber is on break */}
                {currentChamberQueue.chamber?.is_on_break && (
                  <div style={{
                    background: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)',
                    border: '2px solid #F59E0B',
                    borderRadius: 18,
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                    boxShadow: '0 8px 25px rgba(245,158,11,0.18)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: '#F59E0B', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Coffee size={26} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 900, fontSize: 16, color: '#92400E' }}>
                            {currentChamberQueue.chamber.break_reason || 'সেশন সাময়িক বিরতি'}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: '#FDE68A', color: '#78350F' }}>
                            টিভি ডিসপ্লেতে লাইভ রয়েছে
                          </span>
                        </div>
                        {currentChamberQueue.chamber.break_message && (
                          <div style={{ fontSize: 13, color: '#78350F', marginTop: 2, fontWeight: 600 }}>
                            বার্তা: {currentChamberQueue.chamber.break_message}
                          </div>
                        )}
                        {currentChamberQueue.chamber.break_resume_time && (
                          <div style={{ fontSize: 12, color: '#B45309', marginTop: 2, fontWeight: 700 }}>
                            ⏰ সম্ভাব্য ফেরার সময়: <strong style={{ color: '#92400E' }}>{currentChamberQueue.chamber.break_resume_time}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => handleOpenBreakModal()}
                        className="admin-btn admin-btn-sm admin-btn-outline"
                        style={{ borderRadius: 8 }}
                      >
                        এডিট
                      </button>
                      <button
                        onClick={() => handleEndBreak()}
                        disabled={breakLoading}
                        className="admin-btn admin-btn-sm"
                        style={{
                          background: '#059669', color: '#fff', border: 'none',
                          borderRadius: 8, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6
                        }}
                      >
                        <PlayCircle size={15} /> বিরতি শেষ ও সেশন চালু
                      </button>
                    </div>
                  </div>
                )}

                {/* Currently Serving Hero Box */}
                <div style={{
                  background: 'linear-gradient(145deg, #0F172A 0%, #132E27 100%)',
                  borderRadius: 20,
                  padding: '24px',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 14px 40px rgba(15, 23, 42, 0.2)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      background: 'rgba(0, 184, 117, 0.15)', color: '#34D399', padding: '5px 14px',
                      borderRadius: 999, fontSize: 12, fontWeight: 800, letterSpacing: '0.5px',
                      border: '1px solid rgba(52, 211, 153, 0.3)'
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399', display: 'inline-block' }} className="pulse-anim" />
                      বর্তমান সেবাধীন রোগী (NOW SERVING)
                    </div>
                    {currentChamberQueue.chamber?.room_number && (
                      <div style={{
                        fontSize: 12, fontWeight: 800, color: '#38BDF8',
                        background: 'rgba(56, 189, 248, 0.12)', padding: '4px 10px',
                        borderRadius: 8, border: '1px solid rgba(56, 189, 248, 0.25)'
                      }}>
                        🚪 রুম {toBn(currentChamberQueue.chamber.room_number)}
                      </div>
                    )}
                  </div>

                  {currentlyServing ? (
                    <div style={{ padding: '16px 12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.08)', margin: '8px 0 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        চলতি টোকেন / সিরিয়াল
                      </div>
                      <div style={{ fontSize: '4.5rem', fontWeight: 900, color: '#34D399', lineHeight: 1.1, margin: '6px 0', textShadow: '0 4px 20px rgba(52,211,153,0.35)' }}>
                        {formatSerial3(currentlyServing.serial_number)}
                      </div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF' }}>
                        {currentlyServing.patient_name || 'রোগীর নাম'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                        {currentlyServing.patient_age && (
                          <span style={{ fontSize: 12, color: '#CBD5E1', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 6 }}>
                            বয়স: {toBn(currentlyServing.patient_age)} বছর
                          </span>
                        )}
                        {currentlyServing.appointment_time && (
                          <span style={{ fontSize: 12, color: '#CBD5E1', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 6 }}>
                            সময়: {formatTime12h(currentlyServing.appointment_time)}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons for Current Patient */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
                        {/* Prescription Action Button - Hidden from Hospital Panel */}
                        {!isManager && (isDoctor || isAdmin) && (
                          (currentlyServing.has_prescription || currentlyServing.prescription_id) ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/prescriptions/view/${currentlyServing.prescription_id || currentlyServing.id}?return_to=/admin/serial-display`)}
                              className="admin-btn"
                              style={{
                                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                                color: '#FFFFFF',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                height: 46,
                                borderRadius: 10,
                                fontWeight: 800,
                                fontSize: 13,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              title="প্রেসক্রিপশন দেখুন (View Prescription)"
                            >
                              <CheckCircle size={16} /> ✓ প্রেসক্রিপশন সম্পন্ন (প্রেসক্রিপশন দেখুন)
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/prescriptions/create?appointment_id=${currentlyServing.id}&return_to=/admin/serial-display`)}
                              className="admin-btn"
                              style={{
                                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                                color: '#FFFFFF',
                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                height: 46,
                                borderRadius: 10,
                                fontWeight: 800,
                                fontSize: 13,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              title="এই রোগীর প্রেসক্রিপশন লিখুন"
                            >
                              <FileText size={16} /> 📝 প্রেসক্রিপশন লিখুন (Write Prescription)
                            </button>
                          )
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <button
                            type="button"
                            onClick={() => handleComplete(currentlyServing.id)}
                            disabled={actionLoading}
                            className="admin-btn"
                            style={{
                              background: '#10B981', color: '#fff', border: 'none',
                              height: 44, borderRadius: 10, fontWeight: 800, fontSize: 13,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              boxShadow: '0 4px 14px rgba(16,185,129,0.3)', cursor: 'pointer'
                            }}
                          >
                            <CheckCircle size={16} /> সম্পন্ন করুন
                          </button>
                          {(() => {
                            const hasPrescription = Boolean(currentlyServing.has_prescription || currentlyServing.prescription_id)
                            return (
                              <button
                                type="button"
                                onClick={() => handleNoShow(currentlyServing.id)}
                                disabled={actionLoading || hasPrescription}
                                className="admin-btn"
                                style={{
                                  background: hasPrescription ? 'rgba(255, 255, 255, 0.08)' : '#EF4444',
                                  color: hasPrescription ? '#94A3B8' : '#fff',
                                  border: hasPrescription ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                                  height: 44,
                                  borderRadius: 10,
                                  fontWeight: 800,
                                  fontSize: 13,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  boxShadow: hasPrescription ? 'none' : '0 4px 14px rgba(239,68,68,0.3)',
                                  cursor: hasPrescription ? 'not-allowed' : 'pointer',
                                  opacity: hasPrescription ? 0.65 : 1,
                                  transition: 'all 0.2s ease'
                                }}
                                title={hasPrescription ? 'প্রেসক্রিপশন তৈরি হওয়ায় অনুপস্থিত মার্ক করা সম্ভব নয়' : 'অনুপস্থিত (No-Show)'}
                              >
                                <UserX size={16} /> অনুপস্থিত (No-Show)
                              </button>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '28px 16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 16, border: '1px dashed rgba(255, 255, 255, 0.12)', margin: '8px 0 16px' }}>
                      <div style={{
                        width: 54, height: 54, borderRadius: '50%',
                        background: 'rgba(0, 184, 117, 0.12)', color: '#34D399',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 12, border: '1px solid rgba(52, 211, 153, 0.25)'
                      }}>
                        <Users size={26} />
                      </div>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#FFFFFF' }}>
                        বর্তমানে কোনো রোগী ডাকা হয়নি
                      </h3>
                      <p style={{ margin: '6px 0 0', fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>
                        পরবর্তী রোগীকে চেম্বারে ডাকতে নিচের <strong style={{ color: '#34D399' }}>'পরবর্তী সিরিয়াল ডাকুন'</strong> বাটনে চাপ দিন।
                      </p>
                    </div>
                  )}

                  {/* Primary Next Patient Call Trigger & Quick Break Button */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button
                      type="button"
                      onClick={() => handleCallNext()}
                      disabled={actionLoading || waitingPatients.length === 0 || currentChamberQueue.chamber?.is_on_break}
                      className="admin-btn"
                      style={{
                        flex: 1,
                        height: 48,
                        background: 'linear-gradient(135deg, #00B875 0%, #059669 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 12,
                        fontWeight: 800,
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 6px 18px rgba(0, 184, 117, 0.35)',
                        cursor: waitingPatients.length === 0 || currentChamberQueue.chamber?.is_on_break ? 'not-allowed' : 'pointer',
                        opacity: waitingPatients.length === 0 || currentChamberQueue.chamber?.is_on_break ? 0.6 : 1
                      }}
                    >
                      <Play size={17} fill="#FFFFFF" /> পরবর্তী সিরিয়াল ডাকুন {nextInLine ? `(${formatSerial3(nextInLine.serial_number)})` : ''}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenBreakModal()}
                      className="admin-btn"
                      style={{
                        height: 48,
                        padding: '0 16px',
                        borderRadius: 12,
                        background: currentChamberQueue.chamber?.is_on_break ? '#F59E0B' : 'rgba(255,255,255,0.08)',
                        color: currentChamberQueue.chamber?.is_on_break ? '#000000' : '#FFFFFF',
                        border: currentChamberQueue.chamber?.is_on_break ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.15)',
                        fontWeight: 800,
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer'
                      }}
                      title={currentChamberQueue.chamber?.is_on_break ? 'বিরতি সেটিংস' : 'সেশন বিরতি দিন'}
                    >
                      <Coffee size={17} />
                      {currentChamberQueue.chamber?.is_on_break ? 'বিরতি চলছে' : 'বিরতি'}
                    </button>
                  </div>
                </div>

                {/* Next in Line Preview Box */}
                {nextInLine && (
                  <div className="admin-card" style={{ padding: '16px 20px', borderLeft: '4px solid #3B82F6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase' }}>
                          পরবর্তী অপেক্ষমাণ রোগী (NEXT IN LINE)
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--admin-text)', marginTop: 4 }}>
                          সিরিয়াল {formatSerial3(nextInLine.serial_number)} — {nextInLine.patient_name}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCallNext(nextInLine.id)}
                        disabled={actionLoading}
                        className="admin-btn admin-btn-sm admin-btn-primary"
                        style={{ borderRadius: 8, padding: '6px 14px', fontSize: 12 }}
                      >
                        এখনই ডাকুন
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Waiting Queue List & History */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Waiting Patients List Table */}
                <div className="admin-card" style={{ flex: 1 }}>
                  <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Users size={18} color="#00B875" /> অপেক্ষমাণ কিউ তালিকা
                    </h3>
                    <span style={{ fontSize: 12, fontWeight: 800, background: 'rgba(0, 184, 117, 0.1)', color: '#00B875', padding: '4px 10px', borderRadius: 20 }}>
                      {toBn(waitingPatients.length)} জন লাইনে
                    </span>
                  </div>

                  <div className="admin-card-body" style={{ padding: 0, maxHeight: 360, overflowY: 'auto' }}>
                    {waitingPatients.length === 0 ? (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                        <div style={{ fontWeight: 700 }}>বর্তমানে কোনো অপেক্ষমাণ রোগী নেই</div>
                      </div>
                    ) : (
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th style={{ width: 80 }}>সিরিয়াল</th>
                            <th>রোগীর নাম</th>
                            <th>সময় / বয়স</th>
                            <th style={{ textAlign: 'right' }}>একশন</th>
                          </tr>
                        </thead>
                        <tbody>
                          {waitingPatients.map((p, idx) => (
                            <tr key={p.id}>
                              <td>
                                <span style={{
                                  display: 'inline-block', padding: '4px 10px', borderRadius: 8,
                                  background: idx === 0 ? 'rgba(0, 184, 117, 0.15)' : 'var(--admin-bg)',
                                  color: idx === 0 ? '#00B875' : 'var(--admin-text)',
                                  fontWeight: 800, fontSize: 13,
                                  fontFamily: 'monospace'
                                }}>
                                  {formatSerial3(p.serial_number)}
                                </span>
                              </td>
                              <td>
                                <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{p.patient_name}</div>
                                {p.estimated_wait_minutes > 0 && (
                                  <div style={{ fontSize: 11, color: '#94A3B8' }}>
                                    আনুমানিক অপেক্ষা: ~{toBn(p.estimated_wait_minutes)} মিনিট
                                  </div>
                                )}
                              </td>
                              <td>
                                <div style={{ fontSize: 12, color: 'var(--admin-text)' }}>
                                  {p.appointment_time ? formatTime12h(p.appointment_time) : '—'}
                                </div>
                                {p.patient_age && (
                                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                                    {toBn(p.patient_age)} বছর
                                  </div>
                                )}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  onClick={() => handleCallNext(p.id)}
                                  disabled={actionLoading}
                                  className="admin-btn admin-btn-sm admin-btn-outline"
                                  style={{ borderRadius: 8, padding: '4px 10px', fontSize: 11 }}
                                >
                                  ডাকুন
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Completed Patients Summary Box */}
                {completedPatients.length > 0 && (
                  <div className="admin-card">
                    <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10B981' }}>
                        <CheckCircle2 size={16} /> সম্পন্ন পরামর্শ ({toBn(completedPatients.length)})
                      </h3>
                    </div>
                    <div className="admin-card-body" style={{ padding: 0, maxHeight: 180, overflowY: 'auto' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {completedPatients.map((p) => (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid var(--admin-border)' }}>
                            <div>
                              <span style={{ fontWeight: 800, color: '#10B981', marginRight: 8, fontFamily: 'monospace' }}>{formatSerial3(p.serial_number)}</span>
                              <span style={{ fontSize: 13, color: 'var(--admin-text)' }}>{p.patient_name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                                {p.serving_completed_at ? new Date(p.serving_completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'সম্পন্ন'}
                              </span>
                              {!isManager && (isDoctor || isAdmin) && (
                                (p.has_prescription || p.prescription_id) ? (
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/admin/prescriptions/view/${p.prescription_id || p.id}?return_to=/admin/serial-display`)}
                                    className="admin-btn admin-btn-sm"
                                    style={{
                                      borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                                      background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)',
                                      display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer'
                                    }}
                                    title="প্রেসক্রিপশন দেখুন"
                                  >
                                    <CheckCircle size={12} /> Rx (দেখুন)
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/admin/prescriptions/create?appointment_id=${p.id}&return_to=/admin/serial-display`)}
                                    className="admin-btn admin-btn-sm"
                                    style={{
                                      borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                                      background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.25)',
                                      display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer'
                                    }}
                                    title="প্রেসক্রিপশন লিখুন"
                                  >
                                    <FileText size={12} /> + Rx
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* No-Show / Missed Patients Box */}
                {noShowPatients.length > 0 && (
                  <div className="admin-card">
                    <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#EF4444' }}>
                        <UserX size={16} /> অনুপস্থিত রোগী ({toBn(noShowPatients.length)})
                      </h3>
                    </div>
                    <div className="admin-card-body" style={{ padding: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {noShowPatients.map((p) => (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--admin-border)' }}>
                            <div>
                              <span style={{ fontWeight: 800, color: 'var(--admin-text)', marginRight: 8, fontFamily: 'monospace' }}>{formatSerial3(p.serial_number)}</span>
                              <span style={{ fontSize: 13, color: 'var(--admin-text)' }}>{p.patient_name}</span>
                            </div>
                            <button
                              onClick={() => handleRecall(p.id)}
                              disabled={actionLoading}
                              className="admin-btn admin-btn-sm admin-btn-outline"
                              style={{ borderRadius: 8, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <RotateCcw size={12} /> কিউ-তে আনুন
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── View Mode 2: Chamber Overview Live Grid ── */}
      {viewMode === 'overview' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--admin-text)' }}>
              {isDoctorOnly ? 'আপনার চেম্বার সেশন ওভারভিউ' : 'হাসপাতাল ওভারভিউ ও টিভি ডিসপ্লে প্রিভিউ'}
            </h3>
            <a
              href={isDoctorOnly && singleTvUrl ? singleTvUrl : hospitalTvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', borderRadius: 10 }}
            >
              <Maximize2 size={16} /> ফুলস্ক্রিন টিভি বোর্ড খুলুন
            </a>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20
          }}>
            {activeDoctorsList.map((dq) => {
              const serving = dq.currently_serving
              const waitingCount = dq.statistics?.total_waiting || 0
              const isServing = !!serving
              const chamberDay = dq.chamber?.day || ''
              const chamberDayBn = getDayNameBn(chamberDay)
              const isTodaySession = chamberDay.toLowerCase() === selectedDayOfWeek.toLowerCase() || dq.is_scheduled_today

              return (
                <div
                  key={dq.chamber?.id}
                  className="admin-card"
                  style={{
                    padding: '20px',
                    borderTop: isServing ? '4px solid #00B875' : (isTodaySession ? '4px solid #3B82F6' : '4px solid #94A3B8'),
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 16
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--admin-text)' }}>
                          {isDoctorOnly ? (dq.chamber?.hospital_name || 'চেম্বার') : (dq.doctor?.name_bn || dq.doctor?.name)}
                        </h4>
                        <div style={{ fontSize: 12, color: '#00B875', fontWeight: 700, marginTop: 2 }}>
                          {isDoctorOnly ? `${chamberDayBn} • ${formatTime12h(dq.chamber?.start_time)} - ${formatTime12h(dq.chamber?.end_time)}` : (dq.doctor?.specialty?.name_bn || dq.doctor?.specialty?.name || 'বিশেষজ্ঞ')}
                        </div>
                      </div>
                      {dq.chamber?.room_number && (
                        <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: '#0F172A', color: '#38BDF8' }}>
                          রুম {toBn(dq.chamber.room_number)}
                        </span>
                      )}
                    </div>

                    {/* Live Serial Box or Break Box */}
                    {dq.chamber?.is_on_break ? (
                      <div style={{
                        margin: '16px 0',
                        padding: '16px',
                        borderRadius: 12,
                        background: '#FEF3C7',
                        border: '1.5px solid #F59E0B',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#B45309', textTransform: 'uppercase' }}>
                          ⏸️ সাময়িক বিরতি চলছে
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#92400E', margin: '4px 0' }}>
                          {dq.chamber.break_reason || 'সেশন বিরতি'}
                        </div>
                        {dq.chamber.break_resume_time && (
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#B45309' }}>
                            সময়: {dq.chamber.break_resume_time}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        margin: '16px 0',
                        padding: '16px',
                        borderRadius: 12,
                        background: isServing ? 'rgba(0, 184, 117, 0.08)' : 'var(--admin-bg)',
                        border: isServing ? '1.5px solid rgba(0, 184, 117, 0.3)' : '1px solid var(--admin-border)',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: isServing ? '#00B875' : 'var(--admin-text-muted)', textTransform: 'uppercase' }}>
                          {isServing ? 'বর্তমান সিরিয়াল' : (isTodaySession ? 'সেশন স্ট্যাটাস' : `শিডিউল: ${chamberDayBn}`)}
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: isServing ? '#00B875' : 'var(--admin-text-muted)', margin: '4px 0', fontFamily: 'monospace' }}>
                          {isServing ? formatSerial3(serving.serial_number) : (isTodaySession ? 'বিশ্রামে' : 'অফ-ডে')}
                        </div>
                        {serving && (
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text)' }}>
                            {serving.patient_name}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--admin-text-muted)', fontWeight: 600 }}>
                      <span>অপেক্ষমাণ: <strong style={{ color: '#F59E0B' }}>{toBn(waitingCount)} জন</strong></span>
                      <span>সম্পন্ন: <strong style={{ color: '#10B981' }}>{toBn(dq.statistics?.total_completed || 0)} জন</strong></span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--admin-border)' }}>
                    <button
                      onClick={() => {
                        setSelectedChamberId(dq.chamber?.id?.toString())
                        setViewMode('controller')
                      }}
                      className="admin-btn admin-btn-sm admin-btn-primary"
                      style={{ flex: 1, borderRadius: 8, fontSize: 12 }}
                    >
                      সিরিয়াল পরিচালনা
                    </button>
                    <button
                      onClick={() => handleOpenBreakModal(dq)}
                      className="admin-btn admin-btn-sm"
                      style={{
                        borderRadius: 8,
                        fontSize: 12,
                        background: dq.chamber?.is_on_break ? '#FEF3C7' : 'var(--admin-bg)',
                        color: dq.chamber?.is_on_break ? '#92400E' : 'var(--admin-text)',
                        border: dq.chamber?.is_on_break ? '1px solid #F59E0B' : '1px solid var(--admin-border)',
                        padding: '0 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                      title="বিরতি ও নোটিশ কন্ট্রোল"
                    >
                      <Coffee size={13} />
                    </button>
                    {dq.chamber?.display_token && (
                      <a
                        href={`${window.location.origin}/display/${dq.chamber.display_token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-btn admin-btn-sm admin-btn-outline"
                        style={{ borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px', textDecoration: 'none' }}
                        title="টিভি স্ক্রিন"
                      >
                        <Tv size={14} />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Session Break & Notice Modal ── */}
      {showBreakModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--admin-card-bg)',
            width: '100%',
            maxWidth: 540,
            maxHeight: '92vh',
            borderRadius: 20,
            border: '1px solid var(--admin-border)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Sticky Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 22px',
              borderBottom: '1px solid var(--admin-border)',
              background: 'var(--admin-card-bg)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Coffee size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--admin-text)' }}>
                    সেশন সাময়িক বিরতি ও নোটিশ কন্ট্রোল
                  </h3>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 600 }}>
                    টিভি ডিসপ্লে বোর্ডে বিরতির কারণ ও সম্ভাব্য সময় দেখান
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBreakModal(false)}
                style={{
                  background: 'var(--admin-bg)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: '50%',
                  width: 30,
                  height: 30,
                  color: 'var(--admin-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{
              padding: '16px 22px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}>
              {/* If Currently on Break: Top Active Banner */}
              {(breakTargetChamber?.chamber?.is_on_break || currentChamberQueue?.chamber?.is_on_break) && (
                <div style={{
                  background: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)',
                  border: '1.5px solid #F59E0B',
                  borderRadius: 12,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} className="pulse-anim" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#92400E' }}>
                        বর্তমানে সেশন বিরতি লাইভ রয়েছে
                      </div>
                      <div style={{ fontSize: 11, color: '#B45309', fontWeight: 600 }}>
                        কারণ: {breakTargetChamber?.chamber?.break_reason || currentChamberQueue?.chamber?.break_reason} ({breakTargetChamber?.chamber?.break_resume_time || currentChamberQueue?.chamber?.break_resume_time})
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEndBreak(breakTargetChamber?.chamber?.id || currentChamberQueue?.chamber?.id)}
                    disabled={breakLoading}
                    className="admin-btn admin-btn-sm"
                    style={{
                      background: '#059669',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 800,
                      fontSize: 12,
                      padding: '7px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    <PlayCircle size={14} /> বিরতি শেষ করুন
                  </button>
                </div>
              )}

              {/* Selected Doctor & Chamber Info */}
              <div style={{
                background: 'var(--admin-bg)',
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid var(--admin-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    ডাক্তার ও চেম্বার:
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--admin-text)', marginTop: 2 }}>
                    {breakTargetChamber?.doctor?.name_bn || breakTargetChamber?.doctor?.name || currentChamberQueue?.doctor?.name_bn || currentChamberQueue?.doctor?.name} 
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#00B875', marginLeft: 8 }}>
                      ({breakTargetChamber?.chamber?.hospital_name || currentHospital?.name || 'হাসপাতাল চেম্বার'})
                    </span>
                  </div>
                </div>
                {breakTargetChamber?.chamber?.room_number && (
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: '#0F172A', color: '#38BDF8' }}>
                    রুম {toBn(breakTargetChamber.chamber.room_number)}
                  </span>
                )}
              </div>

              {/* Presets: Reason Selection */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--admin-text)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  ১. বিরতির কারণ নির্বাচন করুন (Break Reason)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {[
                    { label: '🕌 নামাজের বিরতি', value: 'নামাজের বিরতি' },
                    { label: '🍽️ লাঞ্চ বিরতি', value: 'লাঞ্চ বিরতি' },
                    { label: '🏥 অপারেশন থিয়েটার', value: 'অপারেশন থিয়েটার (OT)' },
                    { label: '☕ চা / নাস্তা বিরতি', value: 'চা বিরতি' },
                    { label: '🚨 জরুরি রোগী / কল', value: 'জরুরি কল' },
                    { label: '✍️ সাধারণ বিরতি', value: 'সাময়িক বিরতি' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setBreakReason(item.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: breakReason === item.value ? '2px solid #00B875' : '1px solid var(--admin-border)',
                        background: breakReason === item.value ? 'rgba(0, 184, 117, 0.1)' : 'var(--admin-bg)',
                        color: breakReason === item.value ? '#00B875' : 'var(--admin-text)',
                        fontWeight: breakReason === item.value ? 800 : 600,
                        fontSize: 12,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Presets: Estimated Resume Time */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--admin-text)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  ২. আনুমানিক ফেরার / শুরু হওয়ার সময় (Estimated Return Time)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {['১০ মিনিট পর', '১৫ মিনিট পর', '২০ মিনিট পর', '৩০ মিনিট পর', '৪৫ মিনিট পর', '১ ঘণ্টা পর'].map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setBreakResumeTime(time)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 8,
                        border: breakResumeTime === time ? '1.5px solid #F59E0B' : '1px solid var(--admin-border)',
                        background: breakResumeTime === time ? '#FEF3C7' : 'var(--admin-bg)',
                        color: breakResumeTime === time ? '#92400E' : 'var(--admin-text)',
                        fontWeight: breakResumeTime === time ? 800 : 600,
                        fontSize: 11,
                        cursor: 'pointer'
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="বা নির্দিষ্ট সময় লিখুন (যেমন: ০২:৩০ PM বা ২০ মিনিট)"
                  value={breakResumeTime}
                  onChange={(e) => setBreakResumeTime(e.target.value)}
                  className="admin-form-input"
                  style={{ width: '100%', height: 36, fontSize: 12, borderRadius: 8 }}
                />
              </div>

              {/* Custom Message Field */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--admin-text)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  ৩. অতিরিক্ত বার্তা / নোটিশ (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  placeholder="যেমন: জরুরি অপারেশনের জন্য সেশন সাময়িক বন্ধ রয়েছে। অনুগ্রহ করে অপেক্ষা করুন।"
                  value={breakCustomMessage}
                  onChange={(e) => setBreakCustomMessage(e.target.value)}
                  className="admin-form-input"
                  style={{ width: '100%', fontSize: 12, borderRadius: 8, padding: '8px 12px' }}
                />
              </div>
            </div>

            {/* Modal Clean Sticky Footer */}
            <div style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
              alignItems: 'center',
              padding: '14px 22px',
              borderTop: '1px solid var(--admin-border)',
              background: 'var(--admin-bg)',
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={() => setShowBreakModal(false)}
                className="admin-btn admin-btn-outline"
                style={{ height: 40, padding: '0 18px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}
              >
                বাতিল
              </button>

              <button
                type="button"
                onClick={handleSaveBreak}
                disabled={breakLoading}
                className="admin-btn"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: '#fff',
                  border: 'none',
                  height: 40,
                  padding: '0 20px',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
                  cursor: 'pointer'
                }}
              >
                <Radio size={15} /> বিরতি ঘোষণা ও টিভিতে দেখান
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QR Code & Share Display Modal ── */}
      {showQrModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
          overflowY: 'auto'
        }}>
          <div style={{
            background: 'var(--admin-card-bg)',
            width: '100%',
            maxWidth: 440,
            maxHeight: 'calc(100vh - 32px)',
            borderRadius: 20,
            padding: 24,
            border: '1px solid var(--admin-border)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            textAlign: 'center',
            overflowY: 'auto',
            margin: 'auto'
          }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--admin-text)' }}>
              {qrModalData.title}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', margin: '8px 0 16px' }}>
              স্মার্ট টিভি, অ্যান্ড্রয়েড টিভি অথবা ট্যাবলেটে ডিসপ্লে বোর্ড খুলতে নিচের কিউআর কোড স্ক্যান করুন।
            </p>

            {/* QR Image */}
            <div style={{
              background: '#fff',
              padding: 14,
              borderRadius: 16,
              display: 'inline-block',
              border: '2px solid #E2E8F0',
              marginBottom: 16
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrModalData.url)}`}
                alt="Display QR Code"
                style={{ width: 170, height: 170, display: 'block' }}
              />
            </div>

            {/* URL Copy box */}
            <div style={{
              display: 'flex',
              gap: 8,
              background: 'var(--admin-bg)',
              padding: 6,
              borderRadius: 10,
              border: '1px solid var(--admin-border)',
              marginBottom: 16
            }}>
              <input
                type="text"
                readOnly
                value={qrModalData.url}
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 12, padding: '0 8px', color: 'var(--admin-text)' }}
              />
              <button
                onClick={() => copyToClipboard(qrModalData.url)}
                className="admin-btn admin-btn-sm admin-btn-primary"
                style={{ borderRadius: 8 }}
              >
                <Copy size={13} /> কপি
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <a
                href={qrModalData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn admin-btn-primary"
                style={{ flex: 1, height: 42, borderRadius: 10, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}
              >
                <ExternalLink size={15} /> সরাসরি খুলুন
              </a>
              <button
                onClick={() => setShowQrModal(false)}
                className="admin-btn admin-btn-outline"
                style={{ height: 42, padding: '0 20px', borderRadius: 10, fontSize: 13 }}
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulseGlow {
          0% { opacity: 0.6; transform: scale(0.96); }
          50% { opacity: 1; transform: scale(1.04); }
          100% { opacity: 0.6; transform: scale(0.96); }
        }
        .pulse-anim { animation: pulseGlow 2s infinite ease-in-out; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin-anim { animation: spin 1s linear infinite; }
      `}} />
    </div>
  )
}

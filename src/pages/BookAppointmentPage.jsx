import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Container, Row, Col } from 'react-bootstrap'
import { createAppointment } from '../api/appointmentApi'
import { sendOtp, verifyOtp } from '../api/authApi'
import { useAuth } from '../context/AuthContext'
import { getMediaUrl } from '../utils/mediaUtils'
import { BookAppointmentSkeleton } from '../components/common/Skeletons'
import BreadcrumbHUD from '../components/common/BreadcrumbHUD'
import { useTranslation } from 'react-i18next'
import { translateMetadata } from '../utils/translationUtils'
import { toast } from 'react-toastify'
import useDoctorDetail from '../hooks/useDoctorDetail'
import {
  IconCalendarEvent, IconClock, IconMapPin, IconPhone,
  IconShieldCheck, IconUser, IconLock, IconDeviceMobile,
  IconArrowRight, IconCheck, IconX, IconStethoscope,
  IconCalendarPlus, IconNotes, IconLoader2, IconChevronLeft, IconChevronRight,
  IconInfoCircle, IconCircleCheck, IconPlus, IconMinus, IconBuildingHospital
} from '@tabler/icons-react'


const DEMO_AVATAR = 'https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg'

export default function BookAppointmentPage() {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const chamberIdParam = searchParams.get('chamberId')
  const { user, isLoggedIn, storeAuth } = useAuth()
  const { t, i18n } = useTranslation()
  const language = i18n.language

  const { doctor, chambers: rawChambers, loading } = useDoctorDetail(doctorId)

  const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const chambers = useMemo(() => {
    const strictChambers = (Array.isArray(rawChambers) ? rawChambers : [])
      .filter(c => String(c.doctor_id) === String(doctorId))
    return strictChambers.sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day))
  }, [rawChambers, doctorId])

  // Current selected month state for calendar
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Form state
  const [form, setForm] = useState({
    doctor_id: doctorId || '',
    appointment_date: '', // format YYYY-MM-DD
    appointment_time: '',
    reason_type: '',
    notes: ''
  })
  
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [selectedChamberId, setSelectedChamberId] = useState(null)
  
  // Chamber Filter State
  const [chamberFilter, setChamberFilter] = useState('')

  const uniqueHospitals = useMemo(() => {
    const names = chambers.map(c => c.hospital?.name).filter(Boolean);
    return [...new Set(names)];
  }, [chambers]);

  const filteredChambers = useMemo(() => {
    if (!chamberFilter) return chambers;
    return chambers.filter(c => c.hospital?.name === chamberFilter);
  }, [chambers, chamberFilter]);

  
  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState('choose')
  const [mobileNumber, setMobileNumber] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const otpInputRefs = useRef([])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0]

  useEffect(() => {
    if (chambers.length > 0 && chamberIdParam) {
      const targetChamber = chambers.find(c => String(c.id) === String(chamberIdParam))
      if (targetChamber) {
        handleChamberSelect(targetChamber.id)
      }
    }
  }, [chambers, chamberIdParam])

  // Helper functions for time parsing
  const parseTime = (str) => {
    if (!str) return 0;
    let period = ''
    if (str.toLowerCase().includes('pm')) period = 'PM'
    if (str.toLowerCase().includes('am')) period = 'AM'
    let [h, m] = str.replace(/[a-zA-Z\s]/g, '').trim().split(':').map(Number)
    if (period === 'PM' && h < 12) h += 12
    if (period === 'AM' && h === 12) h = 0
    return h * 60 + (m || 0)
  }
  
  const formatTime = (mins) => {
    let h = Math.floor((mins % (24 * 60)) / 60)
    let m = mins % 60
    let p = h >= 12 ? 'PM' : 'AM'
    let h12 = h % 12 || 12
    return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${p}`
  }

  const formatTimeBn = (timeStr) => {
    if (!timeStr) return '';
    try {
      let timeUpper = timeStr.toUpperCase();
      let isPM = timeUpper.includes('PM');
      let isAM = timeUpper.includes('AM');
      let cleanStr = timeStr.replace(/[a-zA-Z\s]/g, '').trim();
      let parts = cleanStr.split(':');
      let h = parseInt(parts[0], 10);
      let m = parseInt(parts[1] || '0', 10);
      
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;

      let periodBn = '';
      if (h >= 6 && h < 12) periodBn = 'সকাল';
      else if (h >= 12 && h < 15) periodBn = 'দুপুর';
      else if (h >= 15 && h < 18) periodBn = 'বিকাল';
      else if (h >= 18 && h < 20) periodBn = 'সন্ধ্যা';
      else periodBn = 'রাত';
      
      let h12 = h % 12 || 12;
      let timeEn = `${h12}:${String(m).padStart(2, '0')}`;
      
      const enToBn = {'0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯'};
      let timeBn = timeEn.replace(/\d/g, d => enToBn[d]);
      
      return `${periodBn} ${timeBn}`;
    } catch {
      return timeStr;
    }
  }

  // Handle Chamber Selection
  const handleChamberSelect = (chamberId) => {
    setSelectedChamberId(chamberId);
    
    const chamber = chambers.find(c => c.id === chamberId);
    if (!chamber) return;

    // Find next valid date for this chamber's day
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayIndex = dayNames.indexOf(chamber.day);
    
    if (targetDayIndex !== -1) {
      let d = new Date(today.getTime());
      while (d.getDay() !== targetDayIndex) {
        d.setDate(d.getDate() + 1);
      }
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      // Get first 10-minute slot
      const startMins = parseTime(chamber.start_time);
      const firstSlotStr = formatTime(startMins);
      
      setForm(prev => ({ ...prev, appointment_date: dateStr, appointment_time: firstSlotStr }));
      setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }

  // Date Selection Logic
  const handleDateSelect = (dateString, dayNameEng) => {
    const availableChambers = selectedChamberId 
      ? chambers.filter(c => c.id === selectedChamberId && c.day === dayNameEng)
      : chambers.filter(c => c.day === dayNameEng);
      
    if (availableChambers.length === 0) {
      toast.error('এই দিনে নির্ধারিত চেম্বার নেই')
      return
    }
    
    const targetChamber = availableChambers[0]
    if (!selectedChamberId) setSelectedChamberId(targetChamber.id)
    
    const startMins = parseTime(targetChamber.start_time);
    const firstSlotStr = formatTime(startMins);
    
    setForm(prev => ({ ...prev, appointment_date: dateString, appointment_time: firstSlotStr }))
  }

  // Generate 10-Minute Time Slots
  const getGroupedTimeSlots = () => {
    if (!form.appointment_date || !selectedChamberId) return {}
    const chamber = chambers.find(c => c.id === selectedChamberId)
    if (!chamber) return {}

    const generateSlots = (startStr, endStr) => {
      try {
        const startMins = parseTime(startStr)
        let endMins = parseTime(endStr)
        if (endMins < startMins) endMins += 24 * 60
        let slots = []
        // Use 10 minute intervals
        for (let cur = startMins; cur <= endMins; cur += 10) slots.push(formatTime(cur))
        return slots
      } catch { return [] }
    }

    const slots = generateSlots(chamber.start_time, chamber.end_time)
    
    // Group slots
    const grouped = { morning: [], noon: [], afternoon: [], evening: [] }
    slots.forEach(slot => {
      const isPM = slot.includes('PM')
      const h = parseInt(slot.split(':')[0])
      
      let hour24 = h
      if (isPM && h !== 12) hour24 += 12
      if (!isPM && h === 12) hour24 = 0

      if (hour24 >= 8 && hour24 < 12) grouped.morning.push(slot)
      else if (hour24 >= 12 && hour24 < 15) grouped.noon.push(slot)
      else if (hour24 >= 15 && hour24 < 18) grouped.afternoon.push(slot)
      else grouped.evening.push(slot)
    })
    return grouped
  }

  const groupedSlots = getGroupedTimeSlots()

  const [expandedGroups, setExpandedGroups] = useState({
    morning: true, noon: false, afternoon: false, evening: false
  })

  const toggleGroup = (grp) => {
    setExpandedGroups(prev => ({ ...prev, [grp]: !prev[grp] }))
  }

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleConfirmClick = (e) => {
    e.preventDefault()
    if (!selectedChamberId) {
      toast.error('চেম্বার নির্বাচন করুন')
      return
    }
    if (!form.appointment_date) {
      toast.error('তারিখ নির্বাচন করুন')
      return
    }
    if (!form.appointment_time) {
      toast.error('সময় স্লট নির্বাচন করুন')
      return
    }
    if (!isLoggedIn) {
      setShowAuthModal(true)
      setAuthMode('choose')
      return
    }
    submitAppointment()
  }

  const submitAppointment = async (guestMobile = null) => {
    setSubmitting(true)
    try {
      const payload = { ...form, chamber_id: selectedChamberId }
      
      if (payload.appointment_time && (payload.appointment_time.includes('AM') || payload.appointment_time.includes('PM'))) {
        const [time, period] = payload.appointment_time.split(' ')
        let [h, m] = time.split(':').map(Number)
        if (period === 'PM' && h < 12) h += 12
        if (period === 'AM' && h === 12) h = 0
        payload.appointment_time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`
      }

      payload.payment_status = 'Unpaid'
      if (guestMobile) {
        payload.guest_mobile = guestMobile
        payload.booking_type = 'guest'
      }

      await createAppointment(payload)
      setSuccess(true)
      setShowAuthModal(false)
      window.scrollTo(0, 0)
    } catch (err) {
      const apiMsg = err.response?.data?.message || ''
      toast.error(apiMsg || t('booking_failed'))
    } finally {
      setSubmitting(false)
    }
  }

  // Auth Functions (Same as previous)
  const handleSendOtp = async () => {
    if (!mobileNumber || mobileNumber.length < 11) { toast.error('সঠিক মোবাইল নম্বর দিন'); return }
    setOtpSending(true)
    try {
      await sendOtp({ mobile: mobileNumber })
      setAuthMode('otp-verify')
      toast.success('OTP পাঠানো হয়েছে!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP পাঠাতে সমস্যা হয়েছে')
    } finally {
      setOtpSending(false)
    }
  }

  const handleVerifyOtp = async () => {
    const otp = otpDigits.join('')
    if (otp.length < 4) { toast.error('সম্পূর্ণ OTP কোড দিন'); return }
    setOtpVerifying(true)
    try {
      const res = await verifyOtp({ mobile: mobileNumber, otp })
      if (res.data?.token) {
        storeAuth(res.data.token, res.data.user || { mobile: mobileNumber }, 'patient')
        toast.success('যাচাই সফল! অ্যাপয়েন্টমেন্ট নিশ্চিত হচ্ছে...')
        setTimeout(() => submitAppointment(), 500)
      } else {
        toast.success('মোবাইল যাচাই সফল!')
        submitAppointment(mobileNumber)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP যাচাই ব্যর্থ হয়েছে')
    } finally {
      setOtpVerifying(false)
    }
  }

  const handleOtpDigitChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1)
    if (value && !/^\d$/.test(value)) return
    const newDigits = [...otpDigits]
    newDigits[index] = value
    setOtpDigits(newDigits)
    if (value && index < 5) otpInputRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) otpInputRefs.current[index - 1]?.focus()
  }

  const inputStyle = {
    borderRadius: 8, border: '1px solid #E5EAF0', padding: '12px 16px', fontSize: 14,
    width: '100%', outline: 'none', background: 'white', fontFamily: "'Hind Siliguri', sans-serif"
  }

  // Generate Calendar Days
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay()

  const generateCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    
    let days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }
  
  const monthNames = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
  const dayNamesBn = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি']
  const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

  const isDateAvailable = (dateNum) => {
    if (!dateNum) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dateNum)
    if (date < today) return false
    const dayName = dayNamesEn[date.getDay()]
    if (selectedChamberId) {
      return chambers.some(c => c.id === selectedChamberId && c.day === dayName)
    }
    return chambers.some(c => c.day === dayName)
  }

  const getFormatDateBn = (dateStr) => {
    if(!dateStr) return ''
    const d = new Date(dateStr)
    return `${dayNamesBn[d.getDay()]}বার, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`
  }

  const dayToBn = {
    'Saturday': 'শনিবার',
    'Sunday': 'রবিবার',
    'Monday': 'সোমবার',
    'Tuesday': 'মঙ্গলবার',
    'Wednesday': 'বুধবার',
    'Thursday': 'বৃহস্পতিবার',
    'Friday': 'শুক্রবার'
  };

  if (success) return (
    <div className="page-wrapper d-flex align-items-center justify-content-center" style={{ minHeight: '80vh', background: '#F8FAFB' }}>
      <div style={{ background: 'white', borderRadius: 32, padding: '60px 40px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,168,140,0.1)', maxWidth: 500 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#006450', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <IconCheck size={40} color="white" stroke={3} />
        </div>
        <h2 style={{ fontWeight: 900, color: '#0F172A', marginBottom: 12, fontFamily: '"Hind Siliguri", "Noto Sans Bengali", sans-serif' }}>বুকিং নিশ্চিত হয়েছে! 🎉</h2>
        <p style={{ color: '#64748B', fontSize: 16, marginBottom: 40, fontFamily: '"Hind Siliguri", "Noto Sans Bengali", sans-serif', lineHeight: 1.6 }}>আপনার অ্যাপয়েন্টমেন্ট সফলভাবে সম্পন্ন হয়েছে। সুস্বাস্থ্য কামনায় সবসময় আপনার পাশে আছি আমরা।</p>
        <div className="d-flex gap-3 justify-content-center flex-wrap">
          <button onClick={() => navigate('/my-appointments')} style={{ padding: '12px 24px', borderRadius: 8, background: '#006450', color: 'white', border: 'none', cursor: 'pointer' }}>আমার অ্যাপয়েন্টমেন্ট</button>
          <button onClick={() => navigate('/')} style={{ padding: '12px 24px', borderRadius: 8, border: '1px solid #E5EAF0', background: 'white', cursor: 'pointer' }}>হোম</button>
        </div>
      </div>
    </div>
  )

  const renderAuthModal = () => {
    if (!showAuthModal) return null
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', boxSizing: 'border-box' }}>
        <div className="auth-modal-content" style={{ boxSizing: 'border-box', background: 'white', borderRadius: 24, padding: '32px 24px', maxWidth: 420, width: '100%', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
          <button onClick={() => setShowAuthModal(false)} style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: '#F1F5F9', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', transition: 'all 0.2s' }}><IconX size={20} /></button>
          
          {authMode !== 'choose' && (
            <button onClick={() => setAuthMode('choose')} style={{ position: 'absolute', top: 16, left: 16, border: 'none', background: '#F1F5F9', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', transition: 'all 0.2s' }}><IconChevronLeft size={20} /></button>
          )}
          
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, background: '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <IconShieldCheck size={28} color="#006450" />
            </div>
            <h4 style={{ fontWeight: 800, color: '#1E293B', margin: 0 }}>যাচাইকরণ প্রয়োজন</h4>
            <p style={{ color: '#64748B', fontSize: 14, marginTop: 6, marginBottom: 0 }}>অ্যাপয়েন্টমেন্ট নিশ্চিত করতে যাচাই করুন</p>
          </div>
          
          {authMode === 'choose' && (
            <div className="d-flex flex-column gap-3">
               <button onClick={() => navigate('/login', { state: { from: { pathname: `/book-appointment/${doctorId}` } } })} style={{ padding: '16px', borderRadius: 16, border: '1px solid #E2E8F0', background: 'white', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                 <div style={{ padding: 10, background: '#F0FDF4', borderRadius: 12 }}><IconLock color="#006450" size={24} /></div>
                 <div>
                   <strong style={{ color: '#1E293B', fontSize: 15, display: 'block' }}>লগইন করুন</strong>
                   <span style={{ color: '#64748B', fontSize: 13 }}>ইমেইল বা মোবাইল দিয়ে লগইন করুন</span>
                 </div>
               </button>
               <button onClick={() => setAuthMode('otp-send')} style={{ padding: '16px', borderRadius: 16, border: '1px solid #E2E8F0', background: 'white', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                 <div style={{ padding: 10, background: '#F0FDF4', borderRadius: 12 }}><IconDeviceMobile color="#006450" size={24} /></div>
                 <div>
                   <strong style={{ color: '#1E293B', fontSize: 15, display: 'block' }}>মোবাইল যাচাই (OTP)</strong>
                   <span style={{ color: '#64748B', fontSize: 13 }}>OTP এর মাধ্যমে বুকিং নিশ্চিত করুন</span>
                 </div>
               </button>
            </div>
          )}
          {authMode === 'otp-send' && (
            <div>
              <label style={{ fontSize: 14, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 8 }}>আপনার মোবাইল নম্বর দিন</label>
              <input type="text" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} placeholder="যেমন: 01XXXXXXXXX" style={{boxSizing: 'border-box', width: '100%', padding: '14px 16px', marginBottom: 20, borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 15, outline: 'none', transition: 'all 0.2s'}} />
              <button onClick={handleSendOtp} disabled={otpSending} style={{width: '100%', padding: '14px', background: '#006450', color: 'white', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8}}>
                {otpSending ? <IconLoader2 size={20} className="spin-icon" /> : <IconArrowRight size={20} />} OTP পাঠান
              </button>
            </div>
          )}
          {authMode === 'otp-verify' && (
            <div>
              <label style={{ fontSize: 14, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 12, textAlign: 'center' }}>OTP কোড দিন</label>
              <div style={{display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24, flexWrap: 'nowrap'}}>
                 {otpDigits.map((d, i) => (
                   <input key={i} ref={el => otpInputRefs.current[i] = el} type="text" maxLength={1} value={d} onChange={e=>handleOtpDigitChange(i, e.target.value)} onKeyDown={e=>handleOtpKeyDown(i, e)} style={{width: 'clamp(36px, 12vw, 48px)', height: 'clamp(44px, 14vw, 56px)', textAlign: 'center', border: '1.5px solid #CBD5E1', borderRadius: 12, fontSize: 20, fontWeight: 800, color: '#006450', background: '#F8FAFC', outline: 'none'}} />
                 ))}
              </div>
              <button onClick={handleVerifyOtp} disabled={otpVerifying} style={{width: '100%', padding: '14px', background: '#006450', color: 'white', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8}}>
                {otpVerifying ? <IconLoader2 size={20} className="spin-icon" /> : <IconCheck size={20} />} যাচাই করুন
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFB', minHeight: '100vh', paddingBottom: 60, fontFamily: "'Hind Siliguri', sans-serif" }}>
      {/* HEADER */}
      <div className="d-none d-md-block" style={{ background: 'white', padding: '16px 0', borderBottom: '1px solid #E5EAF0', marginBottom: 30 }}>
        <Container>
          <BreadcrumbHUD variant="dark" links={[{ label: 'হোম', path: '/' }, { label: 'অ্যাপয়েন্টমেন্ট', path: '/doctors' }, { label: doctor?.name || 'Doctor', path: `/doctors/${doctorId}` }, { label: 'অ্যাপয়েন্টমেন্ট নিন' }]} />
        </Container>
      </div>

      <div className="d-md-none mobile-filter-hero" style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', background: 'white', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 1040, marginBottom: 20 }}>
        <button 
          type="button"
          onClick={() => navigate(-1)} 
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#1E293B' }}
        >
          <IconChevronLeft size={24} />
        </button>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#1E293B', fontFamily: "'Hind Siliguri', sans-serif" }}>অ্যাপয়েন্টমেন্ট নিন</span>
      </div>

      {loading ? (
        <Container><BookAppointmentSkeleton /></Container>
      ) : (
        <Container>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-flex', padding: '16px', background: '#E8F5E9', borderRadius: '50%', marginBottom: 16 }}>
              <IconCalendarEvent size={32} color="#006450" />
            </div>
            <h2 style={{ fontWeight: 800, color: '#006450', marginBottom: 8 }}>অ্যাপয়েন্টমেন্ট নিন</h2>
            <p style={{ color: '#64748B', fontSize: 16 }}>{doctor?.name} এর সাথে আপনার সাক্ষাতের সময় নির্ধারণ করুন</p>
          </div>

          <Row className="g-4">
            {/* LEFT SIDEBAR - DOCTOR PROFILE */}
            <Col lg={4}>
              <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #E5EAF0', position: 'sticky', top: 20 }}>
                {/* Image and Basic Info */}
                <div style={{ padding: '24px', textAlign: 'center', background: '#F8FAFB', borderBottom: '1px solid #E5EAF0' }}>
                   <img src={getMediaUrl(doctor?.photo) || DEMO_AVATAR} alt={doctor?.name} style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', marginBottom: 16 }} />
                   <h4 style={{ color: '#006450', fontWeight: 800, marginBottom: 4 }}>{doctor?.name}</h4>
                   <p style={{ color: '#006450', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{translateMetadata(doctor?.degree, language, t)}</p>
                   <p style={{ color: '#1F2937', fontWeight: 700, fontSize: 13, marginBottom: 0 }}>কনসালটেন্ট কার্ডিওলজিস্ট</p>
                   <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '6px 12px', background: '#E8F5E9', color: '#006450', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                     <IconCircleCheck size={14} /> {doctor?.specialty_name || doctor?.specialty?.name_bn || doctor?.specialty?.name || 'কার্ডিওলজি বিভাগ'}
                   </div>
                </div>

                {/* Stats */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5EAF0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4B5563', fontSize: 13 }}><IconCalendarEvent size={16} color="#10B981" /> অভিজ্ঞতা</span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>১০+ বছর</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4B5563', fontSize: 13 }}><IconUser size={16} color="#10B981" /> চিকিৎসা প্রদান করেছেন</span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>১৫০০+</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4B5563', fontSize: 13 }}><IconCheck size={16} color="#10B981" /> সাফল্য রেটিং</span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>৯৮%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4B5563', fontSize: 13 }}><IconMapPin size={16} color="#10B981" /> চেম্বার</span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>ঢাকা, বাংলাদেশ</span>
                  </div>
                </div>

                {/* Chamber Times Summary */}
                <div style={{ padding: '24px' }}>
                  <h6 style={{ fontWeight: 800, marginBottom: 16 }}>চেম্বারের সময়সূচী</h6>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {chambers.length > 0 ? chambers.map(c => (
                      <div key={c.id} style={{ background: '#F8FAFB', padding: '12px', borderRadius: 8, borderLeft: '4px solid #006450' }}>
                        <p style={{ fontSize: 13, color: '#1F2937', marginBottom: 4, fontWeight: 700 }}>{c.hospital?.name || 'চেম্বার'}</p>
                        {c.address && <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{c.address}</p>}
                        <p style={{ fontSize: 12, color: '#4B5563', marginBottom: 0, display: 'flex', gap: 6, alignItems: 'center' }}>
                          <IconClock size={14} color="#006450" /> {dayToBn[c.day]} | {formatTimeBn(c.start_time)} - {formatTimeBn(c.end_time)}
                        </p>
                      </div>
                    )) : (
                      <p style={{ fontSize: 13, color: '#6B7280' }}>কোনো চেম্বার তথ্য নেই</p>
                    )}
                  </div>
                </div>
              </div>
            </Col>

            {/* RIGHT MAIN AREA - BOOKING FORM */}
            <Col lg={8}>
              
              {/* Step 1: Chamber Selection */}
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5EAF0', marginBottom: 24, padding: '24px' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
                   <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#006450', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>১</div>
                   <h5 style={{ margin: 0, fontWeight: 800, color: '#006450' }}>চেম্বার নির্বাচন করুন</h5>
                </div>
                
                {uniqueHospitals.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <select value={chamberFilter} onChange={e => setChamberFilter(e.target.value)} style={inputStyle}>
                      <option value="">সব হাসপাতাল/চেম্বার</option>
                      {uniqueHospitals.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                )}
                
                <div className="chamber-grid">
                  {filteredChambers.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => handleChamberSelect(c.id)}
                      className={`chamber-card ${selectedChamberId === c.id ? 'selected' : 'unselected'}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ padding: 8, background: selectedChamberId === c.id ? '#006450' : '#F3F4F6', borderRadius: '50%', color: selectedChamberId === c.id ? 'white' : '#6B7280' }}>
                          <IconBuildingHospital size={20} />
                        </div>
                        <div>
                          <h6 style={{ fontWeight: 700, fontSize: 14, color: '#1F2937', marginBottom: 4 }}>{c.hospital?.name || 'চেম্বার'}</h6>
                          {c.address && <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>{c.address}</p>}
                          <p style={{ fontSize: 13, color: '#4B5563', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}><IconCalendarEvent size={14}/> {dayToBn[c.day]}</p>
                          <p style={{ fontSize: 13, color: '#4B5563', marginBottom: 0, display: 'flex', alignItems: 'center', gap: 4 }}><IconClock size={14}/> {formatTimeBn(c.start_time)} - {formatTimeBn(c.end_time)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredChambers.length === 0 && <p style={{color: '#6B7280'}}>ডাক্তারের কোনো চেম্বার নেই</p>}
                </div>
              </div>

              {/* Step 2: Date & Time Selection */}
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5EAF0', marginBottom: 24, overflow: 'hidden' }}>
                <div style={{ padding: '24px', display: 'flex', gap: 16, alignItems: 'center' }}>
                   <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#006450', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>২</div>
                   <h5 style={{ margin: 0, fontWeight: 800, color: '#006450' }}>তারিখ ও সময় নির্বাচন করুন</h5>
                </div>
                
                {selectedChamberId ? (
                  <div style={{ padding: '0 24px 24px', borderBottom: '1px solid #E5EAF0' }}>
                    <Row className="g-4">
                      {/* Left: Custom Calendar */}
                      <Col md={6}>
                        <div style={{ border: '1px solid #E5EAF0', borderRadius: 12, padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <button type="button" onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><IconChevronLeft size={20} /></button>
                            <span style={{ fontWeight: 800, color: '#006450' }}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                            <button type="button" onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><IconChevronRight size={20} /></button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: 8 }}>
                            {dayNamesBn.map(d => <div key={d} style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>{d}</div>)}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                            {generateCalendar().map((dayNum, i) => {
                              if (!dayNum) return <div key={i} />
                              
                              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                              const available = isDateAvailable(dayNum)
                              const isSelected = form.appointment_date === dateStr
                              
                              return (
                                <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => available && handleDateSelect(dateStr, dayNamesEn[new Date(dateStr).getDay()])}
                                    style={{
                                      width: 32, height: 32, borderRadius: '50%',
                                      border: 'none',
                                      background: isSelected ? '#006450' : (available ? '#E8F5E9' : 'transparent'),
                                      color: isSelected ? 'white' : (available ? '#006450' : '#D1D5DB'),
                                      fontWeight: isSelected ? 800 : (available ? 700 : 500),
                                      cursor: available ? 'pointer' : 'not-allowed',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 13
                                    }}
                                  >
                                    {dayNum}
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                          
                          {/* Selected Date Indicator */}
                          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #E5EAF0', display: 'flex', alignItems: 'center', gap: 8, color: '#4B5563', fontSize: 13, fontWeight: 600 }}>
                            <IconCalendarEvent size={18} color="#006450" /> {getFormatDateBn(form.appointment_date) || 'তারিখ নির্বাচন করুন'}
                          </div>
                        </div>
                      </Col>

                      {/* Right: Time Slots Accordion */}
                      <Col md={6}>
                         <h6 style={{ fontWeight: 800, color: '#006450', marginBottom: 4 }}>সময় স্লট নির্বাচন করুন (১০ মিনিট)</h6>
                         <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>একটি সময় স্লট নির্বাচন করুন</p>
                         
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingRight: '4px' }}>
                            {/* Morning */}
                            {groupedSlots.morning?.length > 0 && (
                              <div style={{ border: '1px solid #E5EAF0', borderRadius: 8, overflow: 'hidden' }}>
                                <div onClick={() => toggleGroup('morning')} style={{ padding: '12px 16px', background: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{fontSize: 18}}>☀️</span> <span style={{ fontWeight: 700, color: '#006450', fontSize: 14 }}>সকাল <small style={{color: '#6B7280', fontWeight: 'normal'}}>(৮:০০ - ১২:০০)</small></span></div>
                                  {expandedGroups.morning ? <IconMinus size={16} color="#006450" /> : <IconPlus size={16} color="#006450" />}
                                </div>
                                {expandedGroups.morning && (
                                  <div className="time-slot-grid">
                                     {groupedSlots.morning.map(slot => (
                                       <button key={slot} type="button" onClick={() => setForm(prev => ({...prev, appointment_time: slot}))} className={`time-slot-btn ${form.appointment_time === slot ? 'selected' : 'unselected'}`}>{formatTimeBn(slot)}</button>
                                     ))}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Noon */}
                            {groupedSlots.noon?.length > 0 && (
                              <div style={{ border: '1px solid #E5EAF0', borderRadius: 8, overflow: 'hidden' }}>
                                <div onClick={() => toggleGroup('noon')} style={{ padding: '12px 16px', background: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{fontSize: 18}}>🌤️</span> <span style={{ fontWeight: 700, color: '#374151', fontSize: 14 }}>দুপুর <small style={{color: '#6B7280', fontWeight: 'normal'}}>(১২:০০ - ৩:০০)</small></span></div>
                                  {expandedGroups.noon ? <IconMinus size={16} color="#10B981" /> : <IconPlus size={16} color="#10B981" />}
                                </div>
                                {expandedGroups.noon && (
                                  <div className="time-slot-grid">
                                     {groupedSlots.noon.map(slot => (
                                       <button key={slot} type="button" onClick={() => setForm(prev => ({...prev, appointment_time: slot}))} className={`time-slot-btn ${form.appointment_time === slot ? 'selected' : 'unselected'}`}>{formatTimeBn(slot)}</button>
                                     ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Afternoon */}
                            {groupedSlots.afternoon?.length > 0 && (
                              <div style={{ border: '1px solid #E5EAF0', borderRadius: 8, overflow: 'hidden' }}>
                                <div onClick={() => toggleGroup('afternoon')} style={{ padding: '12px 16px', background: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{fontSize: 18}}>🌅</span> <span style={{ fontWeight: 700, color: '#374151', fontSize: 14 }}>বিকাল <small style={{color: '#6B7280', fontWeight: 'normal'}}>(৩:০০ - ৬:০০)</small></span></div>
                                  {expandedGroups.afternoon ? <IconMinus size={16} color="#10B981" /> : <IconPlus size={16} color="#10B981" />}
                                </div>
                                {expandedGroups.afternoon && (
                                  <div className="time-slot-grid">
                                     {groupedSlots.afternoon.map(slot => (
                                       <button key={slot} type="button" onClick={() => setForm(prev => ({...prev, appointment_time: slot}))} className={`time-slot-btn ${form.appointment_time === slot ? 'selected' : 'unselected'}`}>{formatTimeBn(slot)}</button>
                                     ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Evening/Night */}
                            {groupedSlots.evening?.length > 0 && (
                              <div style={{ border: '1px solid #E5EAF0', borderRadius: 8, overflow: 'hidden' }}>
                                <div onClick={() => toggleGroup('evening')} style={{ padding: '12px 16px', background: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{fontSize: 18}}>🌙</span> <span style={{ fontWeight: 700, color: '#374151', fontSize: 14 }}>সন্ধ্যা / রাত <small style={{color: '#6B7280', fontWeight: 'normal'}}>(৬:০০ - ৯:০০)</small></span></div>
                                  {expandedGroups.evening ? <IconMinus size={16} color="#10B981" /> : <IconPlus size={16} color="#10B981" />}
                                </div>
                                {expandedGroups.evening && (
                                  <div className="time-slot-grid">
                                     {groupedSlots.evening.map(slot => (
                                       <button key={slot} type="button" onClick={() => setForm(prev => ({...prev, appointment_time: slot}))} className={`time-slot-btn ${form.appointment_time === slot ? 'selected' : 'unselected'}`}>{formatTimeBn(slot)}</button>
                                     ))}
                                  </div>
                                )}
                              </div>
                            )}
                         </div>
                      </Col>
                    </Row>
                  </div>
                ) : (
                  <div style={{ padding: '40px 24px', textAlign: 'center', color: '#6B7280' }}>
                    <IconCalendarPlus size={48} color="#D1D5DB" style={{ marginBottom: 16 }} />
                    <p style={{ fontSize: 16, fontWeight: 600 }}>তারিখ ও সময় দেখতে প্রথমে একটি চেম্বার নির্বাচন করুন</p>
                  </div>
                )}
                
                {/* Info Note */}
                <div style={{ padding: '16px 24px', background: '#F8FAFB', display: 'flex', alignItems: 'center', gap: 10 }}>
                   <IconInfoCircle size={20} color="#006450" />
                   <span style={{ fontSize: 13, color: '#006450', fontWeight: 700 }}>অনুগ্রহ করে আপনার নির্ধারিত সময়ের কমপক্ষে ১৫ মিনিট আগে হাসপাতালে উপস্থিত থাকুন।</span>
                </div>
              </div>


              {/* Step 3: Appointment Details */}
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5EAF0', padding: '24px' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
                   <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#006450', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>৩</div>
                   <h5 style={{ margin: 0, fontWeight: 800, color: '#006450' }}>অ্যাপয়েন্টমেন্টের বিবরণ</h5>
                </div>
                
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 800, color: '#374151', marginBottom: 8, display: 'block' }}>পরামর্শের কারণ</label>
                  <select name="reason_type" value={form.reason_type} onChange={handleChange} style={inputStyle}>
                    <option value="">পরামর্শের কারণ নির্বাচন করুন</option>
                    <option value="new_consult">নতুন পরামর্শ</option>
                    <option value="follow_up">ফলো-আপ</option>
                    <option value="report_show">রিপোর্ট দেখানো</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 13, fontWeight: 800, color: '#374151', marginBottom: 8, display: 'block' }}>সমস্যা / পরামর্শের কারণ</label>
                  <div style={{ position: 'relative' }}>
                    <textarea 
                      name="notes" 
                      value={form.notes} 
                      onChange={e => { if (e.target.value.length <= 300) handleChange(e) }} 
                      placeholder="আপনার সমস্যাটি সংক্ষেপে লিখুন..."
                      rows={4}
                      style={{ ...inputStyle, resize: 'none' }}
                    />
                    <div style={{ position: 'absolute', bottom: 12, right: 16, fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>
                      {form.notes.length}/300
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F9FAFB', padding: '16px', borderRadius: 8, marginBottom: 24 }}>
                   <IconShieldCheck size={20} color="#6B7280" />
                   <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>নোট: অ্যাপয়েন্টমেন্টটি নিশ্চিত করতে আমাদের সাথে যোগাযোগ করুন।</span>
                </div>

                <div className="action-buttons">
                   <button type="button" onClick={() => navigate(-1)} className="btn-cancel">
                     বাতিল করুন
                   </button>
                   <button onClick={handleConfirmClick} disabled={submitting} className="btn-confirm">
                     {submitting ? <IconLoader2 className="spin-icon" size={18} /> : <IconCalendarEvent size={18} />}
                     অ্যাপয়েন্টমেন্ট নিশ্চিত করুন
                   </button>
                </div>
              </div>

            </Col>
          </Row>
        </Container>
      )}

      {renderAuthModal()}
      
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700;800;900&display=swap');
        .spin-icon { animation: spin-anim 1s linear infinite; }
        @keyframes spin-anim { to { transform: rotate(360deg); } }
        
        /* Ensure all form controls, buttons, selects and textareas use the clear font */
        .page-wrapper input,
        .page-wrapper select,
        .page-wrapper textarea,
        .page-wrapper button {
          font-family: 'Hind Siliguri', sans-serif !important;
        }

        .action-buttons {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
          margin-top: 24px;
        }
        .btn-cancel {
          padding: 14px 28px;
          border-radius: 12px;
          border: 1px solid #CBD5E1;
          background: white;
          color: #475569;
          font-weight: 700;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .btn-cancel:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
        }
        .btn-confirm {
          padding: 14px 28px;
          border-radius: 12px;
          border: none;
          background: #006450;
          color: white;
          font-weight: 800;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 15px rgba(0, 100, 80, 0.2);
          transition: all 0.2s ease;
        }
        .btn-confirm:hover:not(:disabled) {
          background: #004d3e;
          box-shadow: 0 6px 20px rgba(0, 100, 80, 0.3);
          transform: translateY(-2px);
        }
        .btn-confirm:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          box-shadow: none;
        }
        
        .chamber-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .chamber-card {
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .chamber-card.selected {
          border: 2px solid #006450;
          background: #F0FDF4;
          box-shadow: 0 8px 20px rgba(0, 100, 80, 0.08);
        }
        .chamber-card.unselected {
          border: 1px solid #E5EAF0;
          background: white;
        }
        .chamber-card.unselected:hover {
          border-color: #006450;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }
        
        .time-slot-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          max-height: 250px;
          overflow-y: auto;
          padding: 16px;
        }
        .time-slot-btn {
          padding: 10px 8px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Hind Siliguri', sans-serif;
          letter-spacing: 0.5px;
        }
        .time-slot-btn.selected {
          border: none;
          background: #006450;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 100, 80, 0.25);
          transform: scale(1.02);
        }
        .time-slot-btn.unselected {
          border: 1px solid #CBD5E1;
          background: white;
          color: #334155;
        }
        .time-slot-btn.unselected:hover {
          border-color: #006450;
          color: #006450;
          background: #F0FDF4;
        }

        @media (max-width: 768px) {
          .chamber-grid {
            grid-template-columns: 1fr !important;
          }
          .action-buttons {
            flex-direction: column-reverse;
            gap: 12px;
            margin-top: 24px;
          }
          .page-wrapper {
            padding-bottom: 100px !important;
          }
          .btn-cancel, .btn-confirm {
            width: 100%;
            padding: 16px;
            font-size: 16px;
          }
          .time-slot-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px;
          }
        }
      `}} />
    </div>
  )
}

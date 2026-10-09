import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Container, Row, Col, Nav } from 'react-bootstrap'
import { createAppointment, getBookedSlots } from '../api/appointmentApi'
import { sendOtp, verifyOtp, patientCheckIdentifier } from '../api/authApi'
import { useAuth } from '../context/AuthContext'
import { getMediaUrl } from '../utils/mediaUtils'
import { BookAppointmentSkeleton } from '../components/common/Skeletons'
import { useTranslation } from 'react-i18next'
import { translateMetadata } from '../utils/translationUtils'
import useDoctorDetail from '../hooks/useDoctorDetail'
import useUserLocation from '../hooks/useUserLocation'
import { calculateDistance, formatDistance } from '../utils/geoUtils'
import { getBangladeshTodayStr } from '../utils/dateUtils'
import {
  IconCalendarEvent, IconClock, IconMapPin, IconPhone,
  IconShieldCheck, IconUser, IconLock, IconDeviceMobile,
  IconArrowRight, IconCheck, IconX, IconStethoscope,
  IconCalendarPlus, IconNotes, IconLoader2, IconChevronLeft, IconChevronRight,
  IconChevronDown, IconInfoCircle, IconCircleCheck, IconPlus, IconMinus, IconBuildingHospital,
  IconEye, IconEyeOff, IconMail, IconAlertTriangle, IconRefresh,
  IconPrinter, IconTicket, IconCopy, IconNavigation, IconUsers
} from '@tabler/icons-react'

const DEMO_AVATAR = 'https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg'

const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBnNum = (str) => str ? String(str).replace(/\d/g, d => enToBn[d] || d) : ''

const reasonTypeBn = {
  new_consult: 'নতুন পরামর্শ',
  follow_up: 'ফলো-আপ',
  report_show: 'রিপোর্ট দেখানো'
}

export default function BookAppointmentPage() {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const chamberIdParam = searchParams.get('chamberId')
  const { user, isLoggedIn, storeAuth, registerPatient, loginAsPatient, login, isAdmin, isDoctor, isManager, isStaff } = useAuth()

  // Check if current logged-in user is doctor, hospital/manager, or admin (privileged staff bypass OTP)
  const isPrivilegedStaff = Boolean(
    isAdmin || isDoctor || isManager || isStaff ||
    user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'hospital' || user?.role === 'manager' ||
    user?.roles?.some(r => {
      const name = typeof r === 'string' ? r : r.name
      return ['admin', 'doctor', 'hospital', 'manager', 'super-admin'].includes(String(name).toLowerCase())
    })
  )
  const { t, i18n } = useTranslation()
  const language = i18n.language

  const { doctor, chambers: rawChambers, loading } = useDoctorDetail(doctorId)
  const { location: userLocation, hasLocation, requestLocation, loading: locationLoading } = useUserLocation()

  // Registration state for unauthenticated patient
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: ''
  })
  const [showRegPass, setShowRegPass] = useState(false)
  const [showRegConfirmPass, setShowRegConfirmPass] = useState(false)
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  // Inline Login state
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' })
  const [showLoginPass, setShowLoginPass] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const chambers = useMemo(() => {
    const list = Array.isArray(rawChambers) ? rawChambers : []
    return list.sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day))
  }, [rawChambers])

  // Current selected month state for calendar
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Form state
  const [form, setForm] = useState({
    doctor_id: doctorId || '',
    appointment_date: '', // format YYYY-MM-DD
    appointment_time: '',
    booking_for: 'myself', // 'myself', 'family', 'relative', 'friend', 'other'
    patient_name: '',
    patient_age: '',
    patient_relation: 'পিতা',
    patient_gender: 'পুরুষ',
    patient_phone: '',
    booker_name: '',
    reason_type: '',
    notes: ''
  })

  useEffect(() => {
    if (doctor?.id) {
      setForm(prev => ({ ...prev, doctor_id: doctor.id }))
    }
  }, [doctor?.id])
  
  const isTestSuccess = Boolean(searchParams.get('test_success'))
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(isTestSuccess)
  const [confirmedAppointment, setConfirmedAppointment] = useState(() => {
    if (isTestSuccess) {
      return {
        id: 'AP-DBCA6N',
        public_id: 'AP-DBCA6N',
        tracking_id: 'AP-DBCA6N',
        doctor_id: 'DR-NR45FQ',
        doctor_name: 'ডা. প্রিয়তোষ দাস',
        specialty: 'হৃদরোগ ও মেডিসিন বিশেষজ্ঞ',
        degree: 'MBBS, FCPS (Cardiology)',
        hospital_name: 'পপুলার ডায়াগনস্টিক সেন্টার, ধানমন্ডি',
        chamber_address: 'বাড়ি #১৬, রোড #২, ধানমন্ডি, ঢাকা',
        appointment_date: '2026-09-28',
        appointment_time: '17:30:00',
        serial_number: 8,
        booking_for: 'myself',
        patient_name: 'রাকিব হাসান',
        patient_phone: '01712345678',
        fee: 1000,
        payment_status: 'Unpaid',
        status: 'pending',
        created_at: new Date().toISOString()
      }
    }
    return null
  })
  const [copiedId, setCopiedId] = useState(false)
  const [copiedCreds, setCopiedCreds] = useState(false)
  const [newAccountCredentials, setNewAccountCredentials] = useState(null)
  const [selectedChamberId, setSelectedChamberId] = useState(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [bookedSlots, setBookedSlots] = useState([])


  // Professional Warning Modal State
  const [warningModal, setWarningModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'warning',
    viewAppointments: false,
    confirmText: 'ঠিক আছে',
    onClose: null
  })

  const showWarning = (title, message, options = {}) => {
    setWarningModal({
      show: true,
      title,
      message,
      type: options.type || 'warning',
      viewAppointments: options.viewAppointments || false,
      confirmText: options.confirmText || 'ঠিক আছে',
      onClose: options.onClose || null
    })
  }

  const selectedChamber = useMemo(() => {
    return chambers.find(c => c.id === selectedChamberId) || null
  }, [chambers, selectedChamberId])

  const STEPS = [
    { id: 1, key: 'chamber', label: 'চেম্বার নির্বাচন করুন', shortLabel: 'চেম্বার', icon: <IconBuildingHospital size={16} /> },
    { id: 2, key: 'datetime', label: 'তারিখ ও সময় নির্বাচন করুন', shortLabel: 'তারিখ ও সময়', icon: <IconCalendarEvent size={16} /> },
    { id: 3, key: 'details', label: 'অ্যাপয়েন্টমেন্টের বিবরণ', shortLabel: 'বিবরণ', icon: <IconNotes size={16} /> }
  ]
  
  // Chamber Filter State
  const [chamberFilter, setChamberFilter] = useState('')

  const uniqueHospitals = useMemo(() => {
    const names = chambers.map(c => c.chamber_name || c.hospital?.name).filter(Boolean);
    return [...new Set(names)];
  }, [chambers]);

  const filteredChambers = useMemo(() => {
    if (!chamberFilter) return chambers;
    return chambers.filter(c => (c.chamber_name || c.hospital?.name) === chamberFilter);
  }, [chambers, chamberFilter]);

  const groupedChambers = useMemo(() => {
    if (!filteredChambers || filteredChambers.length === 0) return []
    const map = new Map()
    filteredChambers.forEach((chamber) => {
      const hospId = chamber.hospital_id || chamber.hospital?.id || chamber.chamber_name || chamber.address || 'default'
      if (!map.has(hospId)) {
        const chamberName = chamber.chamber_name || chamber.hospital?.name || 'চেম্বার'
        const lat = chamber.latitude || chamber.hospital?.latitude || null
        const lng = chamber.longitude || chamber.hospital?.longitude || null
        map.set(hospId, {
          hospitalId: chamber.hospital_id || chamber.hospital?.id,
          chamber_name: chamberName,
          hospitalName: chamberName,
          is_personal: !chamber.hospital_id && !chamber.hospital?.id,
          address: chamber.address || chamber.hospital?.address || chamber.hospital?.location || 'ঢাকা, বাংলাদেশ',
          latitude: lat,
          longitude: lng,
          schedules: []
        })
      }
      map.get(hospId).schedules.push(chamber)
    })

    const list = Array.from(map.values())

    // Compute live distance if user location is available
    if (userLocation?.latitude && userLocation?.longitude) {
      let minDistance = Infinity
      let closestGroup = null

      list.forEach(group => {
        if (group.latitude && group.longitude) {
          const dist = calculateDistance(userLocation.latitude, userLocation.longitude, group.latitude, group.longitude)
          if (dist !== null) {
            group.distanceKm = dist
            group.formattedDistance = formatDistance(dist)
            if (dist < minDistance) {
              minDistance = dist
              closestGroup = group
            }
          }
        }
      })

      // If there are multiple distinct chambers and a valid closest one is identified
      if (closestGroup && minDistance !== Infinity && list.length > 1) {
        closestGroup.isClosest = true
      }
    }

    return list
  }, [filteredChambers, userLocation])
  
  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState('choose')
  const [mobileNumber, setMobileNumber] = useState('')
  const [mobileWarning, setMobileWarning] = useState('')
  const [checkingMobile, setCheckingMobile] = useState(false)
  const [isExistingPatient, setIsExistingPatient] = useState(false)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const otpInputRefs = useRef([])

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpTimer <= 0) return
    const interval = setInterval(() => {
      setOtpTimer(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [otpTimer])

  const formatOtpTimer = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    const str = `${mins}:${secs < 10 ? '0' : ''}${secs}`
    return toBnNum(str)
  }

  // Translate raw API error messages to user-friendly Bengali
  const translateApiError = (msg) => {
    if (!msg) return null
    const lower = msg.toLowerCase()
    if (lower.includes('invalid otp') || lower.includes('wrong otp') || lower.includes('incorrect otp') || lower.includes('ভুল ওটিপি') || lower.includes('সঠিক নয়') || lower.includes('সঠিক নয়')) {
      return 'ভুল OTP কোড! সঠিক OTP কোডটি লিখুন।'
    }
    if (lower.includes('otp expired')) {
      return 'OTP কোডের মেয়াদ শেষ হয়েছে। পুনরায় OTP পাঠান।'
    }
    if (lower.includes('already registered') || lower.includes('already exist')) {
      return 'এই মোবাইল নম্বরটি ইতিমধ্যে নিবন্ধিত। অনুগ্রহ করে সরাসরি লগইন করুন।'
    }
    if (lower.includes('network') || lower.includes('connection') || lower.includes('timeout')) {
      return 'ইন্টারনেট সংযোগে সমস্যা হয়েছে। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।'
    }
    if (lower.includes('too many') || lower.includes('slow down') || lower.includes('rate limit') || lower.includes('throttl')) {
      return 'অতিরিক্ত ওটিপি অনুরোধ করা হয়েছে। অনুগ্রহ করে অপেক্ষা করুন।'
    }
    return msg
  }



  const todayISO = getBangladeshTodayStr()
  const [bYear, bMonth, bDay] = todayISO.split('-').map(Number)
  const today = new Date(bYear, bMonth - 1, bDay, 0, 0, 0)

  useEffect(() => {
    if (chambers.length > 0 && chamberIdParam) {
      const paramStr = String(chamberIdParam).trim().toLowerCase()
      const targetChamber = chambers.find(c => 
        String(c.id).trim().toLowerCase() === paramStr ||
        (c.public_id && String(c.public_id).trim().toLowerCase() === paramStr) ||
        (c.chamber_id && String(c.chamber_id).trim().toLowerCase() === paramStr)
      )
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
      
      let timeBn = timeEn.replace(/\d/g, d => enToBn[d]);
      
      return `${periodBn} ${timeBn}`;
    } catch {
      return timeStr;
    }
  }

  // Handle Chamber Selection with optional auto-forward
  const handleChamberSelect = (chamberId, autoForward = true) => {
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
      
      setForm(prev => ({ ...prev, appointment_date: dateStr, appointment_time: '' }));
      setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }

    if (autoForward) {
      setTimeout(() => {
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 220);
    }
  }

  // Handle Time Slot Selection with auto-forward to Step 3
  const handleSlotSelect = (slot, autoForward = true) => {
    if (isSlotBooked(slot)) return;
    setForm(prev => ({ ...prev, appointment_time: slot }));

    if (autoForward) {
      setTimeout(() => {
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 240);
    }
  }

  // Date Selection Logic
  const handleDateSelect = (dateString, dayNameEng) => {
    const availableChambers = selectedChamberId 
      ? chambers.filter(c => c.id === selectedChamberId && c.day === dayNameEng)
      : chambers.filter(c => c.day === dayNameEng);
      
    if (availableChambers.length === 0) {
      return
    }
    
    const targetChamber = availableChambers[0]
    if (!selectedChamberId) setSelectedChamberId(targetChamber.id)
    
    setForm(prev => ({ ...prev, appointment_date: dateString, appointment_time: '' }))
  }

  // Fetch booked slots for selected doctor, date, and chamber with 15s live poll
  useEffect(() => {
    const activeDoctorId = doctorId || form.doctor_id || doctor?.public_id || doctor?.id
    if (!activeDoctorId || !form.appointment_date) {
      setBookedSlots([])
      return
    }
    let active = true

    const fetchSlots = () => {
      getBookedSlots(activeDoctorId, { date: form.appointment_date, chamber_id: selectedChamberId })
        .then(res => {
          if (active && res.data?.booked_slots) {
            setBookedSlots(res.data.booked_slots)
          }
        })
        .catch(() => {
          if (active) setBookedSlots([])
        })
    }

    fetchSlots()
    const interval = setInterval(fetchSlots, 15000)

    return () => { 
      active = false
      clearInterval(interval)
    }
  }, [doctorId, form.doctor_id, doctor?.public_id, doctor?.id, form.appointment_date, selectedChamberId])

  const toMinutes = (timeStr) => {
    if (!timeStr) return -1
    try {
      let isPM = /pm/i.test(timeStr)
      let isAM = /am/i.test(timeStr)
      let clean = String(timeStr).replace(/[a-zA-Z\s]/g, '').trim()
      let parts = clean.split(':').map(Number)
      let h = parts[0]
      let m = parts[1] || 0
      if (isPM && h < 12) h += 12
      if (isAM && h === 12) h = 0
      return h * 60 + m
    } catch {
      return -1
    }
  }

  const isSlotBooked = (slot) => {
    if (!slot) return false
    const slotMins = toMinutes(slot)
    if (slotMins < 0) return false

    if (Array.isArray(bookedSlots)) {
      const chamber = chambers.find(c => c.id === selectedChamberId || c.public_id === selectedChamberId || String(c.id) === String(selectedChamberId))
      const duration = Math.max(1, Number(chamber?.slot_duration_minutes) || 15)
      const isServerBooked = bookedSlots.some(bs => {
        const bsMins = toMinutes(bs)
        if (bsMins < 0) return false
        if (bsMins === slotMins) return true
        // Overlap check: does this slot interval overlap with booked appointment?
        const slotEnd = slotMins + duration
        const bsEnd = bsMins + duration
        return (slotMins < bsEnd && bsMins < slotEnd)
      })
      if (isServerBooked) return true
    }

    return false
  }

  useEffect(() => {
    if (form.appointment_time && isSlotBooked(form.appointment_time)) {
      setForm(prev => ({ ...prev, appointment_time: '' }))
    }
  }, [bookedSlots, form.appointment_date])

  // Generate Time Slots based on chamber slot duration (default 15 mins)
  const getGroupedTimeSlots = () => {
    if (!form.appointment_date || !selectedChamberId) return {}
    const chamber = chambers.find(c => c.id === selectedChamberId || c.public_id === selectedChamberId || String(c.id) === String(selectedChamberId))
    if (!chamber) return {}

    const slotDuration = Math.max(1, Number(chamber.slot_duration_minutes) || 15)

    const generateSlots = (startStr, endStr, duration = 15) => {
      try {
        const startMins = parseTime(startStr)
        let endMins = parseTime(endStr)
        if (endMins < startMins) endMins += 24 * 60
        let slots = []
        for (let cur = startMins; cur <= endMins; cur += duration) slots.push(formatTime(cur))
        return slots
      } catch { return [] }
    }

    const slots = generateSlots(chamber.start_time, chamber.end_time, slotDuration)
    
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

  const [expandedGroups, setExpandedGroups] = useState(() => {
    const order = ['morning', 'noon', 'afternoon', 'evening']
    const firstGroup = order.find(grp => groupedSlots[grp]?.length > 0)
    if (firstGroup) {
      return {
        morning: firstGroup === 'morning',
        noon: firstGroup === 'noon',
        afternoon: firstGroup === 'afternoon',
        evening: firstGroup === 'evening'
      }
    }
    return { morning: true, noon: false, afternoon: false, evening: false }
  })

  // Auto-expand the first available slot group (or the group with the selected slot) by default
  useEffect(() => {
    const order = ['morning', 'noon', 'afternoon', 'evening']
    let targetGroup = null

    if (form.appointment_time) {
      targetGroup = order.find(grp => groupedSlots[grp]?.includes(form.appointment_time))
    }

    if (!targetGroup) {
      targetGroup = order.find(grp => groupedSlots[grp]?.length > 0)
    }

    if (targetGroup) {
      setExpandedGroups({
        morning: targetGroup === 'morning',
        noon: targetGroup === 'noon',
        afternoon: targetGroup === 'afternoon',
        evening: targetGroup === 'evening'
      })
    }
  }, [form.appointment_date, selectedChamberId, chambers])

  const toggleGroup = (grp) => {
    setExpandedGroups(prev => ({ ...prev, [grp]: !prev[grp] }))
  }

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleConfirmClick = (e) => {
    e.preventDefault()
    if (!selectedChamberId) {
      showWarning('চেম্বার নির্বাচন করুন', 'অনুগ্রহ করে প্রথমে একটি চেম্বার নির্বাচন করুন।', {
        onClose: () => setCurrentStep(1)
      })
      return
    }
    if (!form.appointment_date) {
      showWarning('তারিখ নির্বাচন করুন', 'অনুগ্রহ করে অ্যাপয়েন্টমেন্টের তারিখ নির্বাচন করুন।', {
        onClose: () => setCurrentStep(2)
      })
      return
    }
    if (!form.appointment_time || isSlotBooked(form.appointment_time)) {
      showWarning('সময় স্লট নির্বাচন করুন', 'এই সময় স্লটটি ইতিমধ্যে বুক করা হয়েছে। অনুগ্রহ করে অন্য সময় স্লট নির্বাচন করুন।', {
        onClose: () => setCurrentStep(2)
      })
      return
    }
    if (form.booking_for === 'myself') {
      if (!isLoggedIn && (!form.patient_name || !form.patient_name.trim())) {
        showWarning('আপনার নাম আবশ্যক', 'অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।', {
          onClose: () => setCurrentStep(3)
        })
        return
      }
    } else {
      if (!isLoggedIn && (!form.booker_name || !form.booker_name.trim())) {
        showWarning('আপনার নাম আবশ্যক', 'অনুগ্রহ করে আপনার (বুকিংকারীর) পূর্ণ নাম লিখুন।', {
          onClose: () => setCurrentStep(3)
        })
        return
      }
      if (!form.patient_name || !form.patient_name.trim()) {
        showWarning('রোগীর নাম আবশ্যক', 'অনুগ্রহ করে রোগীর পূর্ণ নাম লিখুন।', {
          onClose: () => setCurrentStep(3)
        })
        return
      }
      if (!form.patient_age || !form.patient_age.toString().trim()) {
        showWarning('রোগীর বয়স আবশ্যক', 'অনুগ্রহ করে রোগীর সঠিক বয়স লিখুন।', {
          onClose: () => setCurrentStep(3)
        })
        return
      }
      const parsedAge = parseInt(form.patient_age.toString().trim(), 10)
      if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
        showWarning('সঠিক বয়স লিখুন', 'অনুগ্রহ করে ১ থেকে ১২০ এর মধ্যে সঠিক বয়স লিখুন।', {
          onClose: () => setCurrentStep(3)
        })
        return
      }
      if (!form.patient_relation || !form.patient_relation.trim()) {
        showWarning('সম্পর্ক উল্লেখ করুন', 'অনুগ্রহ করে রোগীর সাথে আপনার সম্পর্ক লিখুন।', {
          onClose: () => setCurrentStep(3)
        })
        return
      }
      if (form.patient_phone && form.patient_phone.trim()) {
        const cleanPhone = form.patient_phone.replace(/\D/g, '')
        if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
          showWarning('সঠিক মোবাইল নম্বর দিন', 'অনুগ্রহ করে সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)।', {
            onClose: () => setCurrentStep(3)
          })
          return
        }
      }
    }
    // 1. Privileged Staff (Doctor, Hospital, Admin): Direct booking, NO OTP required!
    if (isPrivilegedStaff) {
      submitAppointment()
      return
    }

    // 2. Regular User / Patient / Guest: Require OTP verification on EVERY booking!
    const targetMobile = (user?.phone || user?.mobile || form.patient_phone || mobileNumber || '').replace(/\D/g, '')

    if (targetMobile && /^01[3-9]\d{8}$/.test(targetMobile)) {
      setMobileNumber(targetMobile)
      setShowAuthModal(true)
      handleSendBookingOtp(targetMobile)
      return
    }

    // If mobile number not yet available, show modal to input mobile number
    setShowAuthModal(true)
    if (!isLoggedIn) {
      setAuthMode('choose')
    } else {
      setAuthMode('otp-send')
    }
  }

  const submitAppointment = async (guestMobile = null) => {
    const activeDocId = form.doctor_id || doctor?.id || doctor?.public_id || doctorId
    if (!activeDocId) {
      showWarning(
        'ডাক্তার নির্বাচন করুন',
        'ডাক্তারের তথ্য সঠিকভাবে পাওয়া যায়নি। অনুগ্রহ করে পেজটি রিফ্রেশ করুন।',
        { type: 'error' }
      )
      return
    }

    if (!form.appointment_date) {
      showWarning(
        'তারিখ নির্বাচন করুন',
        'অনুগ্রহ করে অ্যাপয়েন্টমেন্টের তারিখ নির্বাচন করুন।',
        { onClose: () => setCurrentStep(2) }
      )
      return
    }

    if (!form.appointment_time) {
      showWarning(
        'সময় স্লট নির্বাচন করুন',
        'অনুগ্রহ করে অ্যাপয়েন্টমেন্টের জন্য একটি উপযুক্ত সময় স্লট নির্বাচন করুন।',
        { onClose: () => setCurrentStep(2) }
      )
      return
    }

    setSubmitting(true)
    try {
      const cleanPatientPhone = (form.patient_phone && form.patient_phone.trim()) ? form.patient_phone.replace(/\D/g, '') : null
      const payload = { 
        ...form, 
        doctor_id: activeDocId,
        chamber_id: selectedChamberId,
        booking_for: form.booking_for || 'myself',
        patient_name: form.patient_name || null,
        patient_age: form.patient_age || null,
        patient_relation: form.booking_for !== 'myself' ? form.patient_relation : null,
        patient_gender: form.patient_gender || 'পুরুষ',
        patient_phone: form.booking_for !== 'myself' ? cleanPatientPhone : null
      }
      
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

      const res = await createAppointment(payload)
      const resData = res?.data?.data || res?.data || {}
      const isOther = (payload.booking_for && payload.booking_for !== 'myself' && payload.patient_name)
      const patientDisplayName = isOther ? payload.patient_name : (form.patient_name || user?.name || 'রোগী')

      const newAppt = {
        id: resData.id || resData.public_id || Date.now(),
        registration_id: resData.registration_id || resData.registration_no,
        tracking_id: resData.public_id || resData.id || resData.registration_id,
        doctor_id: payload.doctor_id,
        doctor_name: resData.doctor_name || doctor?.name || 'ডাক্তার',
        specialty: doctor?.specialty?.name_bn || doctor?.specialty?.name || 'বিশেষজ্ঞ চিকিৎসা',
        degree: doctor?.degree || 'MBBS',
        hospital_name: resData.hospital_name || resData.chamber_name || selectedChamber?.chamber_name || selectedChamber?.hospital?.name || doctor?.workplace || 'হাসপাতাল / চেম্বার',
        chamber_address: resData.chamber_address || resData.hospital_address || selectedChamber?.address || selectedChamber?.hospital?.address || 'ঢাকা, বাংলাদেশ',
        appointment_date: resData.date || payload.appointment_date,
        appointment_time: resData.time || form.appointment_time || payload.appointment_time,
        serial_number: resData.serial_number ?? null,
        booking_for: payload.booking_for || 'myself',
        patient_name: resData.patient_name || patientDisplayName,
        patient_phone: resData.patient_phone || payload.patient_phone || form.patient_phone || user?.mobile || null,
        patient_age: payload.patient_age,
        patient_relation: payload.patient_relation,
        for_patient_name: payload.patient_name,
        for_patient_age: payload.patient_age,
        for_patient_relation: payload.patient_relation,
        fee: resData.amount || selectedChamber?.fee || doctor?.fee || doctor?.consultation_fee || null,
        payment_status: resData.payment_status || 'Unpaid',
        notes: payload.notes,
        status: resData.status || 'pending',
        created_at: resData.created_at || new Date().toISOString()
      }

      setConfirmedAppointment(newAppt)
      setSuccess(true)
      setShowAuthModal(false)
      window.scrollTo(0, 0)
    } catch (err) {
      let rawMsg = err.response?.data?.message || err.response?.data?.error || ''
      const validationErrors = err.response?.data?.errors

      if (validationErrors && typeof validationErrors === 'object') {
        const errorEntries = Object.entries(validationErrors)
        if (errorEntries.length > 0) {
          const [firstField, fieldMsgs] = errorEntries[0]
          const firstMsg = Array.isArray(fieldMsgs) ? fieldMsgs[0] : fieldMsgs

          if (firstField === 'appointment_time') {
            rawMsg = 'অনুগ্রহ করে অ্যাপয়েন্টমেন্টের জন্য একটি বৈধ সময় স্লট নির্বাচন করুন।'
          } else if (firstField === 'appointment_date') {
            rawMsg = 'অনুগ্রহ করে সঠিক অ্যাপয়েন্টমেন্টের তারিখ নির্বাচন করুন।'
          } else if (firstField === 'doctor_id' || firstField === 'chamber_id') {
            rawMsg = 'ডাক্তার বা চেম্বার সঠিকভাবে নির্বাচন করা হয়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
          } else if (firstField === 'payment_status') {
            rawMsg = 'পেমেন্ট পদ্ধতি সঠিকভাবে নির্বাচন করা হয়নি।'
          } else if (firstMsg) {
            rawMsg = firstMsg
          }
        }
      }

      if (!rawMsg || rawMsg.toLowerCase().includes('validation failed')) {
        rawMsg = 'প্রদত্ত তথ্যে কিছু অসম্পূর্ণতা রয়েছে। অনুগ্রহ করে তারিখ, সময় স্লট ও রোগীর তথ্য পুনরায় যাচাই করুন।'
      }

      const lower = rawMsg.toLowerCase()
      console.error('Booking submission error:', rawMsg, err)

      if (
        lower.includes('already booked this doctor') ||
        lower.includes('you already booked') ||
        rawMsg.includes('ইতিমধ্যে একটি অ্যাপয়েন্টমেন্ট বুক করেছেন') ||
        rawMsg.includes('ইতিমধ্যে বুক করেছেন')
      ) {
        showWarning(
          'ইতিমধ্যে বুক করা হয়েছে',
          'আপনি এই ডাক্তারের জন্য এই তারিখে ইতিমধ্যে একটি অ্যাপয়েন্টমেন্ট বুক করেছেন। আপনার পূর্ববর্তী অ্যাপয়েন্টমেন্টের তালিকা দেখতে নিচের বোতামে চাপুন।',
          { viewAppointments: true, confirmText: 'ঠিক আছে' }
        )
      } else if (
        lower.includes('time slot is already booked') || 
        lower.includes('slot is already booked') ||
        (validationErrors && validationErrors.appointment_time) ||
        rawMsg.includes('সময় স্লট')
      ) {
        showWarning(
          'সময় স্লট বুক করা হয়েছে',
          'এই সময় স্লটটি ইতিমধ্যে অন্য একজন রোগী বুক করে ফেলেছেন অথবা খালি নেই। অনুগ্রহ করে অন্য একটি সময় স্লট নির্বাচন করুন।',
          {
            onClose: () => setCurrentStep(2)
          }
        )
      } else if (lower.includes('outside doctor schedule')) {
        showWarning(
          'সময়সূচির বাইরে',
          'নির্বাচিত সময়টি ডাক্তারের চেম্বারের সময়সূচির বাইরে। অনুগ্রহ করে সঠিক সময় স্লট নির্বাচন করুন।',
          {
            onClose: () => setCurrentStep(2)
          }
        )
      } else if (lower.includes('currently unavailable') || lower.includes('clinic authority') || lower.includes('enable the service')) {
        showWarning(
          'বুকিং সম্পন্ন করা যায়নি',
          'এই ডাক্তারের অনলাইন বুকিং সেবাটি বর্তমানে বন্ধ রয়েছে। অনুগ্রহ করে হাসপাতাল বা চেম্বার কর্তৃপক্ষের সাথে যোগাযোগ করুন।',
          { type: 'error' }
        )
      } else {
        showWarning(
          'বুকিং সম্পন্ন করা যায়নি',
          rawMsg || 'অ্যাপয়েন্টমেন্ট বুকিং সম্পন্ন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
          { type: 'error' }
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Auth Functions
  const handleSendBookingOtp = async (phone) => {
    const trimmed = (phone || mobileNumber || '').trim().replace(/\D/g, '')
    if (!trimmed || !/^01[3-9]\d{8}$/.test(trimmed)) {
      setMobileWarning('অনুগ্রহ করে সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।')
      setAuthMode('otp-send')
      return
    }
    setOtpSending(true)
    setOtpError('')
    setMobileWarning('')

    const activeDoctorId = doctorId || form.doctor_id || doctor?.public_id || doctor?.id

    // 1. Instant live check of slot before sending OTP SMS to completely eliminate OTP loss
    if (activeDoctorId && form.appointment_date && form.appointment_time && selectedChamberId) {
      try {
        const slotCheckRes = await getBookedSlots(activeDoctorId, { date: form.appointment_date, chamber_id: selectedChamberId })
        const booked = slotCheckRes.data?.booked_slots || []
        setBookedSlots(booked)
        if (booked.includes(form.appointment_time)) {
          setOtpSending(false)
          setShowAuthModal(false)
          showWarning('সময় স্লট ইতোমধ্যে বুক করা হয়েছে', 'এইমাত্র অন্য একজন রোগী এই সময় স্লটটি বুক করে ফেলেছেন। অনুগ্রহ করে অন্য সময় স্লট নির্বাচন করুন।', {
            onClose: () => setCurrentStep(2)
          })
          return
        }
      } catch (checkErr) {
        console.warn('Pre-OTP slot check warning:', checkErr)
      }
    }

    setAuthMode('otp-verify')
    try {
      await sendOtp({ 
        mobile: trimmed, 
        phone: trimmed, 
        type: 'appointment',
        doctor_id: activeDoctorId,
        chamber_id: selectedChamberId,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        booking_for: form.booking_for || 'myself',
        patient_name: (form.patient_name || '').trim(),
        patient_phone: (form.patient_phone || '').trim() || trimmed
      })
      setOtpTimer(60)
      setOtpDigits(['', '', '', '', '', ''])
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    } catch (err) {
      if (err.response?.data?.duplicate_booking || err.response?.data?.limit_exceeded) {
        setOtpSending(false)
        setShowAuthModal(false)
        showWarning(
          err.response?.data?.duplicate_booking ? 'ডুপ্লিকেট বুকিং রোধ' : 'বুকিং সীমা অতিক্রান্ত',
          err.response?.data?.message || 'এই তারিখে এই ডাক্তারের জন্য ইতিমধ্যে একটি অ্যাপয়েন্টমেন্ট রয়েছে।',
          { type: 'warning' }
        )
        return
      }
      if (err.response?.data?.slot_booked) {
        setOtpSending(false)
        setShowAuthModal(false)
        showWarning('সময় স্লট ইতোমধ্যে বুক করা হয়েছে', err.response?.data?.message || 'এই সময় স্লটটি ইতোমধ্যে বুক হয়ে গেছে। অনুগ্রহ করে অন্য সময় স্লট নির্বাচন করুন।', {
          onClose: () => setCurrentStep(2)
        })
        return
      }
      console.error('Send booking OTP error:', err)
      const rawMsg = err.response?.data?.message || err.response?.data?.error
      const cooldown = Number(err.response?.data?.cooldown_seconds || err.response?.data?.retry_after_seconds) || (err.response?.status === 429 ? 60 : 0)
      const errorMsg = translateApiError(rawMsg) || rawMsg || 'OTP পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'

      if (cooldown > 0) {
        setOtpTimer(cooldown)
        setAuthMode('otp-verify')
        setOtpError(errorMsg)
      } else {
        setMobileWarning(errorMsg)
        setAuthMode('otp-send')
      }
    } finally {
      setOtpSending(false)
    }
  }

  const handleSendOtp = async () => {
    const trimmed = (mobileNumber || '').trim().replace(/\D/g, '')
    setMobileWarning('')

    if (!isLoggedIn) {
      if (form.booking_for === 'myself' && (!form.patient_name || !form.patient_name.trim())) {
        setMobileWarning('অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।')
        return
      }
      if (form.booking_for !== 'myself' && (!form.booker_name || !form.booker_name.trim())) {
        setMobileWarning('অনুগ্রহ করে আপনার (বুকিংকারীর) নাম লিখুন।')
        return
      }
    }

    if (!trimmed || !/^01[3-9]\d{8}$/.test(trimmed)) {
      setMobileWarning('অনুগ্রহ করে সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।')
      return
    }
    setOtpSending(true)
    setOtpError('')
    
    // Check if number is registered as patient ONLY for unauthenticated guests
    if (!isLoggedIn) {
      let isRegistered = false
      try {
        const checkRes = await patientCheckIdentifier({ identifier: trimmed, role: 'patient' })
        if (checkRes.data?.is_registered || checkRes.data?.success) {
          isRegistered = true
        }
      } catch (e) {
        isRegistered = false
      }

      if (isRegistered) {
        setIsExistingPatient(true)
        setMobileWarning('এই মোবাইল নম্বরটি ইতিমধ্যে নিবন্ধিত! অনুগ্রহ করে পাসওয়ার্ড দিয়ে সরাসরি লগইন করুন অথবা OTP দিয়ে লগইন করুন।')
        setOtpSending(false)
        return
      }

      setIsExistingPatient(false)
    }

    const activeDoctorId = doctorId || form.doctor_id || doctor?.public_id || doctor?.id

    // 1. Instant live check of slot before sending OTP SMS
    if (activeDoctorId && form.appointment_date && form.appointment_time && selectedChamberId) {
      try {
        const slotCheckRes = await getBookedSlots(activeDoctorId, { date: form.appointment_date, chamber_id: selectedChamberId })
        const booked = slotCheckRes.data?.booked_slots || []
        setBookedSlots(booked)
        if (booked.includes(form.appointment_time)) {
          setOtpSending(false)
          setShowAuthModal(false)
          showWarning('সময় স্লট ইতোমধ্যে বুক করা হয়েছে', 'এইমাত্র অন্য একজন রোগী এই সময় স্লটটি বুক করে ফেলেছেন। অনুগ্রহ করে অন্য সময় স্লট নির্বাচন করুন।', {
            onClose: () => setCurrentStep(2)
          })
          return
        }
      } catch (checkErr) {
        console.warn('Pre-OTP slot check warning:', checkErr)
      }
    }

    try {
      await sendOtp({ 
        mobile: trimmed, 
        phone: trimmed, 
        type: 'appointment',
        doctor_id: activeDoctorId,
        chamber_id: selectedChamberId,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        booking_for: form.booking_for || 'myself',
        patient_name: (form.patient_name || '').trim(),
        patient_phone: (form.patient_phone || '').trim() || trimmed
      })
      setAuthMode('otp-verify')
      setOtpTimer(60)
      setOtpDigits(['', '', '', '', '', ''])
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    } catch (err) {
      if (err.response?.data?.duplicate_booking || err.response?.data?.limit_exceeded) {
        setOtpSending(false)
        setShowAuthModal(false)
        showWarning(
          err.response?.data?.duplicate_booking ? 'ডুপ্লিকেট বুকিং রোধ' : 'বুকিং সীমা অতিক্রান্ত',
          err.response?.data?.message || 'এই তারিখে এই ডাক্তারের জন্য ইতিমধ্যে একটি অ্যাপয়েন্টমেন্ট রয়েছে।',
          { type: 'warning' }
        )
        return
      }
      if (err.response?.data?.slot_booked) {
        setOtpSending(false)
        setShowAuthModal(false)
        showWarning('সময় স্লট ইতোমধ্যে বুক করা হয়েছে', err.response?.data?.message || 'এই সময় স্লটটি ইতোমধ্যে বুক হয়ে গেছে। অনুগ্রহ করে অন্য সময় স্লট নির্বাচন করুন।', {
          onClose: () => setCurrentStep(2)
        })
        return
      }
      console.error('sendOtp error:', err)
      const rawMsg = err.response?.data?.message || err.response?.data?.error
      const cooldown = Number(err.response?.data?.cooldown_seconds || err.response?.data?.retry_after_seconds) || (err.response?.status === 429 ? 60 : 0)
      const errorMsg = translateApiError(rawMsg) || rawMsg || 'OTP পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
      if (cooldown > 0) {
        setOtpTimer(cooldown)
        setAuthMode('otp-verify')
        setOtpError(errorMsg)
      } else {
        setMobileWarning(errorMsg)
      }
    } finally {
      setOtpSending(false)
    }
  }

  const handleSendLoginOtp = async () => {
    const trimmed = (mobileNumber || '').trim().replace(/\D/g, '')
    setOtpSending(true)
    setOtpError('')
    try {
      await sendOtp({ mobile: trimmed, phone: trimmed, type: 'appointment' })
      setIsExistingPatient(true)
      setAuthMode('otp-verify')
      setOtpTimer(60)
      setOtpDigits(['', '', '', '', '', ''])
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    } catch (err) {
      console.error('Login OTP error:', err)
      const rawMsg = err.response?.data?.message || err.response?.data?.error
      const cooldown = Number(err.response?.data?.cooldown_seconds || err.response?.data?.retry_after_seconds) || (err.response?.status === 429 ? 60 : 0)
      const errorMsg = translateApiError(rawMsg) || rawMsg || 'OTP পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
      if (cooldown > 0) {
        setOtpTimer(cooldown)
        setAuthMode('otp-verify')
        setOtpError(errorMsg)
      } else {
        setMobileWarning(errorMsg)
      }
    } finally {
      setOtpSending(false)
    }
  }

  const handleResendOtp = async () => {
    if (otpTimer > 0 || otpSending) return
    const trimmed = (mobileNumber || user?.phone || user?.mobile || '').trim().replace(/\D/g, '')
    if (!trimmed || !/^01[3-9]\d{8}$/.test(trimmed)) {
      setOtpError('অনুগ্রহ করে সঠিক মোবাইল নম্বর দিন।')
      return
    }
    setOtpSending(true)
    setOtpError('')
    const activeDoctorId = doctorId || form.doctor_id || doctor?.public_id || doctor?.id
    try {
      await sendOtp({ 
        mobile: trimmed, 
        phone: trimmed, 
        type: 'appointment',
        doctor_id: activeDoctorId,
        chamber_id: selectedChamberId,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        booking_for: form.booking_for || 'myself',
        patient_name: (form.patient_name || '').trim(),
        patient_phone: (form.patient_phone || '').trim() || trimmed
      })
      setOtpTimer(60)
      setOtpDigits(['', '', '', '', '', ''])
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    } catch (err) {
      if (err.response?.data?.duplicate_booking || err.response?.data?.limit_exceeded) {
        setOtpSending(false)
        setShowAuthModal(false)
        showWarning(
          err.response?.data?.duplicate_booking ? 'ডুপ্লিকেট বুকিং রোধ' : 'বুকিং সীমা অতিক্রান্ত',
          err.response?.data?.message || 'এই তারিখে এই ডাক্তারের জন্য ইতিমধ্যে একটি অ্যাপয়েন্টমেন্ট রয়েছে।',
          { type: 'warning' }
        )
        return
      }
      console.error(err)
      const rawMsg = err.response?.data?.message || err.response?.data?.error
      const cooldown = Number(err.response?.data?.cooldown_seconds || err.response?.data?.retry_after_seconds) || (err.response?.status === 429 ? 60 : 0)
      if (cooldown > 0) {
        setOtpTimer(cooldown)
      }
      const errorMsg = translateApiError(rawMsg) || rawMsg || 'OTP পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
      setOtpError(errorMsg)
    } finally {
      setOtpSending(false)
    }
  }

  const handleVerifyOtp = async () => {
    setOtpError('')
    const otp = otpDigits.join('').trim()
    if (otp.length < 6) {
      setOtpError('অনুগ্রহ করে ৬ সংখ্যার সঠিক OTP কোড দিন।')
      return
    }
    setOtpVerifying(true)
    const cleanMobile = (mobileNumber || user?.phone || user?.mobile || '').trim().replace(/\D/g, '')
    const authUserName = form.booking_for === 'myself'
      ? (form.patient_name || 'রোগী')
      : (isLoggedIn ? (user?.name || 'বুকিংকারী') : (form.booker_name?.trim() || 'বুকিংকারী'))

    try {
      const res = await verifyOtp({ 
        mobile: cleanMobile, 
        otp, 
        auto_register: !isLoggedIn, 
        type: 'quick_appointment',
        patient_name: authUserName
      })

      const resData = res?.data || {}

      if (resData.success || resData.token) {
        if (!isLoggedIn && resData.token) {
          storeAuth(resData.token, resData.user || { mobile: cleanMobile, name: authUserName }, 'patient')

          if (resData.is_new_account && resData.credentials) {
            setNewAccountCredentials(resData.credentials)
          } else {
            setNewAccountCredentials(null)
          }
        }

        setShowAuthModal(false)
        await submitAppointment()
      } else {
        setOtpError('OTP যাচাইকরণ সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।')
      }
    } catch (err) {
      console.error('Verify OTP error:', err)
      const rawMsg = err.response?.data?.message || err.response?.data?.error || ''
      const errorMsg = translateApiError(rawMsg) || rawMsg || 'ভুল OTP কোড! সঠিক OTP কোডটি লিখুন।'
      setOtpError(errorMsg)
    } finally {
      setOtpVerifying(false)
    }
  }

  const handleRegisterAndBook = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setRegError('')

    if (!regForm.name || !regForm.name.trim()) {
      setRegError('অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।')
      return
    }
    if (!regForm.password || regForm.password.length < 6) {
      setRegError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।')
      return
    }
    if (regForm.password !== regForm.confirm_password) {
      setRegError('পাসওয়ার্ড দুটি মিলছে না!')
      return
    }

    setRegLoading(true)
    try {
      const payload = new FormData()
      payload.append('name', regForm.name.trim())
      payload.append('phone', mobileNumber.trim())
      payload.append('mobile', mobileNumber.trim())
      if (regForm.email && regForm.email.trim()) {
        payload.append('email', regForm.email.trim())
      }
      payload.append('password', regForm.password)
      payload.append('role', 'user')
      payload.append('type', 'patient')

      const res = await registerPatient(payload)
      if (res.success) {
        setShowAuthModal(false)
        await submitAppointment()
      } else {
        setRegError(res.message || 'রেজিস্ট্রেশন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।')
      }
    } catch (err) {
      console.error(err)
      setRegError('রেজিস্ট্রেশন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।')
    } finally {
      setRegLoading(false)
    }
  }

  const handleLoginAndBook = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setLoginError('')

    if (!loginForm.identifier || !loginForm.identifier.trim()) {
      setLoginError('অনুগ্রহ করে আপনার ইমেইল বা মোবাইল নম্বর দিন।')
      return
    }
    if (!loginForm.password) {
      setLoginError('অনুগ্রহ করে আপনার পাসওয়ার্ড দিন।')
      return
    }

    setLoginLoading(true)
    try {
      const res = await loginAsPatient(loginForm.identifier.trim(), loginForm.password)
      if (res.success) {
        setShowAuthModal(false)
        await submitAppointment()
      } else {
        setLoginError(res.message || 'লগইন ব্যর্থ হয়েছে। সঠিক তথ্য দিন।')
      }
    } catch (err) {
      console.error(err)
      setLoginError('লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleOtpDigitChange = (index, value) => {
    if (otpError) setOtpError('')
    if (value.length > 1) value = value.slice(-1)
    if (value && !/^\d$/.test(value)) return
    const newDigits = [...otpDigits]
    newDigits[index] = value
    setOtpDigits(newDigits)
    if (value && index < 5) otpInputRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index, e) => {
    if (otpError) setOtpError('')
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) otpInputRefs.current[index - 1]?.focus()
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    if (otpError) setOtpError('')
    const pastedData = e.clipboardData.getData('text').trim()
    if (/^\d{1,6}$/.test(pastedData)) {
      const digits = pastedData.slice(0, 6).split('')
      const newDigits = ['', '', '', '', '', '']
      digits.forEach((d, i) => { newDigits[i] = d })
      setOtpDigits(newDigits)
      const targetFocus = Math.min(digits.length, 5)
      otpInputRefs.current[targetFocus]?.focus()
    }
  }

  const inputStyle = {
    borderRadius: 12, border: '1.5px solid #E2E8F0', padding: '12px 16px', fontSize: 14,
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
    return `${dayNamesBn[d.getDay()]}বার, ${toBnNum(d.getDate())} ${monthNames[d.getMonth()]} ${toBnNum(d.getFullYear())}`
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

  if (success) {
    const appt = confirmedAppointment || {}
    const trackingId = appt.tracking_id || appt.id || ''
    const serialNo = appt.serial_number ? toBnNum(appt.serial_number) : null
    const formattedDate = getFormatDateBn(appt.appointment_date) || appt.appointment_date || 'তারিখ নির্ধারিত'
    const formattedTime = formatTimeBn(appt.appointment_time) || appt.appointment_time || 'সময় নির্ধারিত'
    const patientName = appt.patient_name || form?.patient_name || user?.name || 'রোগী'
    const patientPhone = appt.patient_phone || form?.patient_phone || user?.mobile || ''
    const feeVal = appt.fee || form?.fee || selectedChamber?.fee || doctor?.fee || doctor?.consultation_fee || null

    const handleCopyTrackingId = () => {
      if (!trackingId) return
      navigator.clipboard.writeText(trackingId)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }

    const handlePrint = () => {
      window.print()
    }

    return (
      <div className="page-wrapper d-flex align-items-center justify-content-center py-5 px-3" style={{ minHeight: '85vh', background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
        {/* Print & Animation Styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * { visibility: hidden !important; }
            #printable-booking-slip, #printable-booking-slip * { visibility: visible !important; }
            #printable-booking-slip {
              position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; max-width: 650px !important;
              box-shadow: none !important; border: 2px solid #00B875 !important; border-radius: 14px !important; margin: 0 auto !important; padding: 20px !important;
              background: #ffffff !important;
            }
            .no-print { display: none !important; }
          }

          @keyframes bookLivePulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }

          .quick-cred-box {
            background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%);
            border: 1.5px solid #86EFAC;
            border-radius: 14px;
            padding: 13px 14px;
            margin-bottom: 16px;
            text-align: left;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.08);
          }
          .quick-cred-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 10px;
          }
          .quick-cred-title {
            font-size: 13px;
            fontWeight: 800;
            color: #065F46;
            display: flex;
            align-items: center;
            gap: 6px;
            font-family: 'Hind Siliguri', sans-serif;
            line-height: 1.35;
            flex: 1;
            min-width: 0;
          }
          .quick-cred-copy-btn {
            background: #10B981;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 5px 12px;
            font-size: 11.5px;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-family: 'Hind Siliguri', sans-serif;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);
            transition: all 0.15s ease;
          }
          .quick-cred-copy-btn:hover {
            background: #059669;
          }
          .quick-cred-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            background: #ffffff;
            padding: 10px 12px;
            border-radius: 10px;
            border: 1px solid #D1FAE5;
          }
          @media (max-width: 480px) {
            .quick-cred-grid {
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              padding: 9px;
            }
            .quick-cred-full-col {
              grid-column: span 2;
            }
          }
          .quick-cred-cell {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 8px 10px;
          }
          .quick-cred-lbl {
            font-size: 10.5px;
            color: #64748B;
            font-weight: 600;
            font-family: 'Hind Siliguri', sans-serif;
            margin-bottom: 2px;
          }
          .quick-cred-val {
            font-size: 13px;
            font-weight: 800;
            word-break: break-word;
          }
          .quick-cred-full-inner {
            display: flex;
            flex-direction: column;
          }
          @media (max-width: 480px) {
            .quick-cred-full-inner {
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
            }
            .quick-cred-full-inner .quick-cred-lbl {
              margin-bottom: 0;
            }
          }

          .quick-summary-box {
            background: #F8FAFC;
            border-radius: 14px;
            padding: 14px 16px;
            border: 1px solid #E2E8F0;
            text-align: left;
            margin-bottom: 16px;
          }
          .quick-summary-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8px;
            padding-bottom: 10px;
            margin-bottom: 10px;
            border-bottom: 1px dashed #E2E8F0;
          }
          .quick-summary-doc {
            font-size: 15px;
            font-weight: 800;
            color: #0F172A;
            font-family: 'Hind Siliguri', sans-serif;
            line-height: 1.3;
          }
          .quick-summary-spec {
            font-size: 12.5px;
            color: #00B875;
            font-weight: 700;
            font-family: 'Hind Siliguri', sans-serif;
            margin-top: 2px;
          }
          .quick-badge-status {
            font-size: 11.5px;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 20px;
            font-family: 'Hind Siliguri', sans-serif;
            white-space: nowrap;
            flex-shrink: 0;
          }
          .quick-badge-paid {
            background: #DCFCE7;
            color: #15803D;
          }
          .quick-badge-unpaid {
            background: #FEF3C7;
            color: #B45309;
          }
          .quick-summary-rows {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .quick-row-item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 10px;
            font-size: 12.5px;
            font-family: 'Hind Siliguri', sans-serif;
            line-height: 1.4;
          }
          @media (max-width: 420px) {
            .quick-row-item {
              flex-direction: column;
              gap: 1px;
              margin-bottom: 4px;
            }
            .quick-row-item:last-child {
              margin-bottom: 0;
            }
          }
          .quick-row-lbl {
            color: #64748B;
            font-weight: 600;
            flex-shrink: 0;
          }
          .quick-row-val {
            color: #1E293B;
            font-weight: 700;
            text-align: right;
            word-break: break-word;
          }
          @media (max-width: 420px) {
            .quick-row-val {
              text-align: left;
            }
          }
        `}} />

        <div style={{ width: '100%', maxWidth: 580 }}>
          {/* Main Booking Slip Card */}
          <div
            id="printable-booking-slip"
            style={{
              background: '#ffffff',
              borderRadius: 20,
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
              overflow: 'hidden',
              position: 'relative',
              padding: '24px 20px'
            }}
          >
            {/* Success Icon */}
            <div style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: '#DCFCE7',
              color: '#00B875',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <IconCircleCheck size={36} />
            </div>

            {/* Title & Subtitle */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 5, fontFamily: "'Hind Siliguri', sans-serif", lineHeight: 1.3 }}>
                অ্যাপয়েন্টমেন্ট বুকিং সফল হয়েছে! 🎉
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                {trackingId && (
                  <p style={{ fontSize: 13, color: '#64748B', margin: 0, fontFamily: "'Hind Siliguri', sans-serif" }}>
                    আপনার ট্র্যাকিং আইডি: <strong style={{ color: '#00B875', fontWeight: 800 }}>{trackingId}</strong>
                    <button
                      onClick={handleCopyTrackingId}
                      type="button"
                      className="no-print"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: copiedId ? '#16a34a' : '#64748B', marginLeft: 6,
                        padding: 0, verticalAlign: 'middle'
                      }}
                      title="আইডি কপি করুন"
                    >
                      {copiedId ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    </button>
                  </p>
                )}
                {serialNo && (
                  <span style={{
                    background: '#DCFCE7',
                    color: '#047857',
                    padding: '2px 10px',
                    borderRadius: 999,
                    fontWeight: 800,
                    fontSize: 12.5,
                    border: '1px solid #86EFAC',
                    fontFamily: "'Hind Siliguri', sans-serif",
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}>
                    সিরিয়াল নং: {serialNo}
                  </span>
                )}
              </div>
            </div>

            {/* AUTO-REGISTERED ACCOUNT CREDENTIALS */}
            {newAccountCredentials && (
              <div className="quick-cred-box">
                <div className="quick-cred-head">
                  <div className="quick-cred-title">
                    <span style={{ fontSize: 15 }}>🎉</span>
                    <span>আপনার রোগী অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে!</span>
                  </div>
                  <button
                    type="button"
                    className="no-print quick-cred-copy-btn"
                    onClick={() => {
                      const copyText = `পাবলিক আইডি: ${newAccountCredentials.patient_public_id}\nমোবাইল নম্বর: ${newAccountCredentials.login_phone}\nপাসওয়ার্ড: ${newAccountCredentials.temp_password}`
                      navigator.clipboard?.writeText(copyText)
                      setCopiedCreds(true)
                      setTimeout(() => setCopiedCreds(false), 2000)
                    }}
                  >
                    <IconCopy size={13} />
                    <span>{copiedCreds ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
                  </button>
                </div>

                <div className="quick-cred-grid">
                  <div className="quick-cred-cell">
                    <div className="quick-cred-lbl">লগইন মোবাইল</div>
                    <div className="quick-cred-val" style={{ color: '#0F172A' }}>
                      {newAccountCredentials.login_phone}
                    </div>
                  </div>

                  <div className="quick-cred-cell">
                    <div className="quick-cred-lbl">পাসওয়ার্ড</div>
                    <div className="quick-cred-val" style={{ color: '#059669', letterSpacing: '0.5px' }}>
                      {newAccountCredentials.temp_password}
                    </div>
                  </div>

                  <div className="quick-cred-cell quick-cred-full-col">
                    <div className="quick-cred-full-inner">
                      <div className="quick-cred-lbl">পাবলিক আইডি:</div>
                      <div className="quick-cred-val" style={{ color: '#0F172A' }}>
                        {newAccountCredentials.patient_public_id}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{
                  fontSize: 11.5,
                  color: '#047857',
                  marginTop: 9,
                  lineHeight: 1.45,
                  fontFamily: "'Hind Siliguri', sans-serif",
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 5
                }}>
                  <span style={{ flexShrink: 0, marginTop: 1, fontSize: 13 }}>ℹ️</span>
                  <span>আপনার অ্যাকাউন্টে স্বয়ংক্রিয়ভাবে লগইন হয়ে গেছে। পরবর্তীতে লগইন করার জন্য উপরের তথ্যটি সংরক্ষণ করুন।</span>
                </div>
              </div>
            )}

            {/* APPOINTMENT SUMMARY CARD (Quick Appointment style) */}
            <div className="quick-summary-box">
              <div className="quick-summary-top">
                <div>
                  <div className="quick-summary-doc">
                    {appt.doctor_name || doctor?.name || 'ডাক্তার'}
                  </div>
                  <div className="quick-summary-spec">
                    {appt.specialty || doctor?.specialty?.name_bn || doctor?.specialty?.name || 'বিশেষজ্ঞ চিকিৎসা'}
                    {appt.degree ? ` • ${appt.degree}` : ''}
                  </div>
                </div>
                <span className={`quick-badge-status ${appt.payment_status === 'Paid' ? 'quick-badge-paid' : 'quick-badge-unpaid'}`}>
                  {appt.payment_status === 'Paid' ? 'পরিশোধিত' : 'পরিশোধ বাকি (চেম্বারে দিবেন)'}
                </span>
              </div>

              <div className="quick-summary-rows">
                {serialNo && (
                  <div className="quick-row-item">
                    <span className="quick-row-lbl">সিরিয়াল নম্বর:</span>
                    <span className="quick-row-val" style={{ color: '#00B875', fontWeight: 800, fontSize: 13.5 }}>
                      {serialNo}
                    </span>
                  </div>
                )}
                <div className="quick-row-item">
                  <span className="quick-row-lbl">হাসপাতাল/চেম্বার:</span>
                  <span className="quick-row-val">
                    {appt.hospital_name || doctor?.hospital_name || 'চেম্বার'}
                    {appt.chamber_address ? ` (${appt.chamber_address})` : ''}
                  </span>
                </div>
                <div className="quick-row-item">
                  <span className="quick-row-lbl">তারিখ ও সময়:</span>
                  <span className="quick-row-val">{formattedDate} ({formattedTime})</span>
                </div>
                <div className="quick-row-item">
                  <span className="quick-row-lbl">রোগীর নাম:</span>
                  <span className="quick-row-val">{patientName}</span>
                </div>
                {patientPhone && (
                  <div className="quick-row-item">
                    <span className="quick-row-lbl">রোগীর ফোন নম্বর:</span>
                    <span className="quick-row-val">+880 {String(patientPhone).replace(/^\+?880?|^0/, '')}</span>
                  </div>
                )}
                {feeVal && (
                  <div className="quick-row-item">
                    <span className="quick-row-lbl">পরামর্শ ফি:</span>
                    <span className="quick-row-val" style={{ color: '#00B875', fontWeight: 800 }}>
                      ৳ {toBnNum(feeVal)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 📡 INTERACTIVE LIVE SERIAL TRACKER BANNER */}
            <div className="no-print" style={{
              background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 50%, #EFF6FF 100%)',
              border: '1.5px solid #6EE7B7',
              borderRadius: 14,
              padding: '13px 15px',
              marginBottom: 16,
              textAlign: 'left',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{
                    display: 'inline-block',
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: '#EF4444',
                    boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)',
                    animation: 'bookLivePulse 1.8s infinite'
                  }} />
                  <strong style={{ fontSize: 13, color: '#065F46', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    লাইভ সিরিয়াল ট্র্যাকিং সুবিধা
                  </strong>
                </div>
                <span style={{
                  background: '#D1FAE5',
                  color: '#047857',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}>
                  নতুন ফিচার
                </span>
              </div>

              <p style={{
                fontSize: 12,
                color: '#334155',
                lineHeight: 1.5,
                margin: '0 0 10px',
                fontFamily: "'Hind Siliguri', sans-serif"
              }}>
                📢 <strong>চেম্বারে গিয়ে ভিড়ের মাঝে দীর্ঘক্ষণ অপেক্ষা করার দিন শেষ!</strong> আমাদের প্ল্যাটফর্মে ঘরে বসেই রিয়েল-টাইমে দেখতে পারবেন ডাক্তার বর্তমানে <strong>কত নম্বর সিরিয়ালের রোগী</strong> দেখছেন।
              </p>

              {trackingId && (
                <button
                  type="button"
                  onClick={() => navigate(`/appointment-ticket/${trackingId}`)}
                  style={{
                    background: 'linear-gradient(135deg, #00B875 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 8px rgba(0, 184, 117, 0.25)',
                    fontFamily: "'Hind Siliguri', sans-serif"
                  }}
                >
                  <span>📡 লাইভ সিরিয়াল ট্র্যাক করুন</span>
                  <span>➔</span>
                </button>
              )}
            </div>

            {/* Helpful Instruction Box */}
            <div style={{
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              borderRadius: 12, padding: '12px 14px', marginBottom: 18,
              display: 'flex', gap: 10, alignItems: 'flex-start',
              textAlign: 'left'
            }}>
              <IconInfoCircle size={18} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.5, fontFamily: "'Hind Siliguri', sans-serif" }}>
                <strong>জরুরি পরামর্শ:</strong> নির্ধারিত সময়ের অন্তত <strong>১৫ মিনিট পূর্বে</strong> চেম্বারে উপস্থিত থাকুন। রিসেপশনে আপনার সিরিয়াল নম্বর ও আইডি প্রদর্শন করুন।
              </div>
            </div>

            {/* Actions Footer */}
            <div className="no-print" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}>
              {/* Primary Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
                {trackingId ? (
                  <button
                    onClick={() => navigate(`/appointment-ticket/${trackingId}`)}
                    type="button"
                    style={{
                      height: 44, borderRadius: 12,
                      background: '#00B875',
                      color: 'white', border: 'none', cursor: 'pointer',
                      fontWeight: 800, fontSize: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      boxShadow: '0 4px 12px rgba(0, 184, 117, 0.25)',
                      fontFamily: "'Hind Siliguri', sans-serif"
                    }}
                  >
                    <IconTicket size={17} />
                    <span>টিকিট ও লাইভ সিরিয়াল</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/my-appointments')}
                    type="button"
                    style={{
                      height: 44, borderRadius: 12,
                      background: '#00B875', color: 'white', border: 'none',
                      cursor: 'pointer', fontWeight: 800, fontSize: 14,
                      fontFamily: "'Hind Siliguri', sans-serif"
                    }}
                  >
                    আমার অ্যাপয়েন্টমেন্ট
                  </button>
                )}

                <button
                  onClick={handlePrint}
                  type="button"
                  style={{
                    height: 44, borderRadius: 12,
                    background: '#F1F5F9', color: '#334155',
                    border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: 13.5,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    fontFamily: "'Hind Siliguri', sans-serif"
                  }}
                >
                  <IconPrinter size={17} />
                  <span>প্রিন্ট / ডাউনলোড</span>
                </button>
              </div>

              {/* Secondary Links */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 4 }}>
                <button
                  onClick={() => navigate('/my-appointments')}
                  type="button"
                  style={{
                    background: 'none', border: 'none', color: '#00B875',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    fontFamily: "'Hind Siliguri', sans-serif"
                  }}
                >
                  আমার সকল অ্যাপয়েন্টমেন্ট
                </button>
                <span style={{ color: '#CBD5E1' }}>•</span>
                <button
                  onClick={() => navigate('/')}
                  type="button"
                  style={{
                    background: 'none', border: 'none', color: '#64748B',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    fontFamily: "'Hind Siliguri', sans-serif"
                  }}
                >
                  হোমপেজে যান
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderAuthModal = () => {
    if (!showAuthModal) return null
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', boxSizing: 'border-box' }}>
        <div className="auth-modal-content" style={{ boxSizing: 'border-box', background: 'white', borderRadius: 24, padding: '28px 24px', maxWidth: authMode === 'account-details' ? 460 : 420, width: '100%', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
          <button onClick={() => { setShowAuthModal(false); setOtpError(''); }} style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: '#F1F5F9', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', transition: 'all 0.2s', zIndex: 2 }}><IconX size={20} /></button>
          
          {authMode !== 'choose' && !isLoggedIn && (
            <button onClick={() => { setAuthMode(authMode === 'account-details' ? 'otp-verify' : 'choose'); setOtpError(''); setLoginError(''); setMobileWarning(''); }} style={{ position: 'absolute', top: 16, left: 16, border: 'none', background: '#F1F5F9', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', transition: 'all 0.2s', zIndex: 2 }}><IconChevronLeft size={20} /></button>
          )}
          
          {authMode !== 'account-details' && authMode !== 'login' && (
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, background: '#E8F8F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <IconShieldCheck size={28} color="#00B875" />
              </div>
              <h4 style={{ fontWeight: 800, color: '#1E293B', margin: 0 }}>
                {isLoggedIn ? 'বুকিং নিশ্চিতকরণ (OTP)' : 'যাচাইকরণ প্রয়োজন'}
              </h4>
              <p style={{ color: '#64748B', fontSize: 14, marginTop: 6, marginBottom: 0 }}>
                {isLoggedIn ? 'নিরাপদ বুকিং নিশ্চিত করতে মোবাইলে পাঠানো কোডটি দিন' : 'অ্যাপয়েন্টমেন্ট নিশ্চিত করতে যাচাই করুন'}
              </p>
            </div>
          )}
          
          {authMode === 'choose' && (
            <div className="d-flex flex-column gap-3">
               <button onClick={() => { setAuthMode('login'); setLoginError(''); setOtpError(''); }} style={{ padding: '16px', borderRadius: 16, border: '1px solid #E2E8F0', background: 'white', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                 <div style={{ padding: 10, background: '#F0FDF4', borderRadius: 12 }}><IconLock color="#00B875" size={24} /></div>
                 <div>
                   <strong style={{ color: '#1E293B', fontSize: 15, display: 'block' }}>লগইন করুন</strong>
                   <span style={{ color: '#64748B', fontSize: 13 }}>ইমেইল বা মোবাইল দিয়ে লগইন করুন</span>
                 </div>
               </button>
               <button onClick={() => {
                 if (!mobileNumber && form.patient_phone) {
                   setMobileNumber(form.patient_phone.replace(/\D/g, ''))
                 }
                 setAuthMode('otp-send')
                 setOtpError('')
                 setLoginError('')
               }} style={{ padding: '16px', borderRadius: 16, border: '1px solid #E2E8F0', background: 'white', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                 <div style={{ padding: 10, background: '#F0FDF4', borderRadius: 12 }}><IconDeviceMobile color="#00B875" size={24} /></div>
                 <div>
                   <strong style={{ color: '#1E293B', fontSize: 15, display: 'block' }}>মোবাইল যাচাই (OTP)</strong>
                   <span style={{ color: '#64748B', fontSize: 13 }}>OTP এর মাধ্যমে বুকিং নিশ্চিত করুন</span>
                 </div>
               </button>
            </div>
          )}
          {authMode === 'login' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, background: '#E8F8F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <IconLock size={26} color="#00B875" />
                </div>
                <h4 style={{ fontWeight: 800, color: '#1E293B', margin: 0 }}>লগইন করুন</h4>
                <p style={{ color: '#64748B', fontSize: 14, marginTop: 6, marginBottom: 0 }}>লগইন করে অ্যাপয়েন্টমেন্ট নিশ্চিত করুন</p>
              </div>

              <form onSubmit={handleLoginAndBook} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', display: 'block', marginBottom: 6 }}>ইমেইল বা মোবাইল নম্বর</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'absolute', left: 14, color: '#94A3B8', pointerEvents: 'none' }}><IconUser size={18} /></div>
                    <input 
                      type="text" 
                      value={loginForm.identifier} 
                      onChange={e => { setLoginForm(prev => ({ ...prev, identifier: e.target.value })); setLoginError(''); }} 
                      placeholder="যেমন: 01XXXXXXXXX বা email@domain.com" 
                      style={{ ...inputStyle, paddingLeft: 42, background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', display: 'block', marginBottom: 6 }}>পাসওয়ার্ড</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'absolute', left: 14, color: '#94A3B8', pointerEvents: 'none' }}><IconLock size={18} /></div>
                    <input 
                      type={showLoginPass ? 'text' : 'password'} 
                      value={loginForm.password} 
                      onChange={e => { setLoginForm(prev => ({ ...prev, password: e.target.value })); setLoginError(''); }} 
                      placeholder="আপনার পাসওয়ার্ড দিন" 
                      style={{ ...inputStyle, paddingLeft: 42, paddingRight: 40, background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}
                    />
                    <button type="button" onClick={() => setShowLoginPass(p => !p)} style={{ position: 'absolute', right: 12, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                      {showLoginPass ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 10,
                    padding: '8px 12px',
                    color: '#DC2626',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <IconInfoCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
                    <span>{loginError}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loginLoading || submitting}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: '#00B875',
                    color: 'white',
                    borderRadius: 14,
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 6,
                    cursor: (loginLoading || submitting) ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(0, 184, 117, 0.3)',
                    transition: 'all 0.2s'
                  }}
                >
                  {(loginLoading || submitting) ? <IconLoader2 size={20} className="spin-icon" /> : <IconCheck size={20} />}
                  {(loginLoading || submitting) ? 'লগইন ও বুকিং নিশ্চিত করা হচ্ছে...' : 'লগইন ও বুকিং নিশ্চিত করুন'}
                </button>

                <div style={{ textAlign: 'center', marginTop: 6 }}>
                  <button 
                    type="button" 
                    onClick={() => { setAuthMode('otp-send'); setOtpError(''); setLoginError(''); }}
                    style={{ background: 'none', border: 'none', color: '#00B875', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    মোবাইল যাচাই (OTP) দিয়ে বুক করুন
                  </button>
                </div>
              </form>
            </div>
          )}
          {authMode === 'otp-send' && (
            <div>
              {!isLoggedIn && form.booking_for === 'myself' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                    আপনার পূর্ণ নাম <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={form.patient_name || ''}
                    onChange={e => {
                      setForm(prev => ({ ...prev, patient_name: e.target.value }))
                      setMobileWarning('')
                    }}
                    placeholder="যেমন: মোঃ আরিফ হোসেন"
                    style={{
                      boxSizing: 'border-box',
                      width: '100%',
                      padding: '13px 16px',
                      borderRadius: 12,
                      border: '1.5px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: 14.5,
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                  />
                </div>
              )}
              {!isLoggedIn && form.booking_for !== 'myself' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                    আপনার (বুকিংকারীর) নাম <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={form.booker_name || ''}
                    onChange={e => {
                      setForm(prev => ({ ...prev, booker_name: e.target.value }))
                      setMobileWarning('')
                    }}
                    placeholder="আপনার পূর্ণ নাম লিখুন"
                    style={{
                      boxSizing: 'border-box',
                      width: '100%',
                      padding: '13px 16px',
                      borderRadius: 12,
                      border: '1.5px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: 14.5,
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                  />
                </div>
              )}
              <label style={{ fontSize: 13.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                আপনার মোবাইল নম্বর দিন <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={mobileNumber}
                onChange={e => {
                  setMobileNumber(e.target.value)
                  setMobileWarning('')
                  setOtpError('')
                }}
                placeholder="যেমন: 01XXXXXXXXX"
                maxLength={11}
                style={{
                  boxSizing: 'border-box',
                  width: '100%',
                  padding: '13px 16px',
                  marginBottom: mobileWarning ? 12 : 20,
                  borderRadius: 12,
                  border: mobileWarning ? '1.5px solid #F59E0B' : '1.5px solid #CBD5E1',
                  background: mobileWarning ? '#FFFBEB' : '#FFFFFF',
                  fontSize: 14.5,
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
              />

              {mobileWarning && (
                <div style={{
                  background: '#FFFBEB',
                  border: '1px solid #FCD34D',
                  borderRadius: 12,
                  padding: '12px 14px',
                  marginBottom: 18,
                  color: '#92400E',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  lineHeight: 1.4
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <IconAlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{mobileWarning}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginForm(prev => ({ ...prev, identifier: mobileNumber }))
                        setAuthMode('login')
                        setLoginError('')
                      }}
                      style={{
                        background: '#D97706',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        padding: '7px 14px',
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <IconLock size={14} /> সরাসরি লগইন করুন
                    </button>
                    {isExistingPatient && (
                      <button
                        type="button"
                        onClick={handleSendLoginOtp}
                        disabled={otpSending}
                        style={{
                          background: '#00B875',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          padding: '7px 14px',
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: otpSending ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        {otpSending ? <IconLoader2 size={14} className="spin-icon" /> : <IconDeviceMobile size={14} />} OTP দিয়ে এগিয়ে যান
                      </button>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleSendOtp}
                disabled={otpSending}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#00B875',
                  color: 'white',
                  borderRadius: 12,
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: otpSending ? 'not-allowed' : 'pointer'
                }}
              >
                {otpSending ? <IconLoader2 size={20} className="spin-icon" /> : <IconArrowRight size={20} />} OTP পাঠান
              </button>
            </div>
          )}
          {authMode === 'otp-verify' && (
            <div>
              <label style={{ fontSize: 14, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4, textAlign: 'center' }}>
                {isLoggedIn ? 'বুকিং নিশ্চিত করতে OTP কোড দিন' : isExistingPatient ? 'অ্যাকাউন্টে লগইন করতে OTP কোড দিন' : 'যাচাই করতে OTP কোড দিন'}
              </label>
              <div style={{ textAlign: 'center', fontSize: 12.5, color: '#64748B', marginBottom: 14 }}>
                <span style={{ color: '#00B875', fontWeight: 700 }}>+880 {(mobileNumber || user?.phone || user?.mobile || '').replace(/^\+?880?|^0/, '')}</span> নম্বরে পাঠানো ৬ সংখ্যার কোডটি লিখুন
                {!isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => { setAuthMode('otp-send'); setOtpError(''); setMobileWarning(''); }}
                    style={{ background: 'none', border: 'none', color: '#0284C7', fontSize: 12, cursor: 'pointer', padding: 0, marginLeft: 6, textDecoration: 'underline' }}
                  >
                    (পরিবর্তন)
                  </button>
                )}
              </div>
              <div style={{display: 'flex', gap: 8, justifyContent: 'center', marginBottom: otpError ? 12 : 24, flexWrap: 'nowrap'}} onPaste={handleOtpPaste}>
                 {otpDigits.map((d, i) => (
                   <input
                     key={i}
                     ref={el => otpInputRefs.current[i] = el}
                     type="text"
                     inputMode="numeric"
                     maxLength={1}
                     value={d}
                     onChange={e=>handleOtpDigitChange(i, e.target.value)}
                     onKeyDown={e=>handleOtpKeyDown(i, e)}
                     style={{
                       width: 'clamp(36px, 12vw, 48px)',
                       height: 'clamp(44px, 14vw, 56px)',
                       textAlign: 'center',
                       border: otpError ? '1.5px solid #EF4444' : '1.5px solid #CBD5E1',
                       borderRadius: 12,
                       fontSize: 20,
                       fontWeight: 800,
                       color: otpError ? '#EF4444' : '#00B875',
                       background: otpError ? '#FEF2F2' : '#F8FAFC',
                       outline: 'none',
                       transition: 'all 0.2s ease'
                     }}
                   />
                 ))}
              </div>

              {otpError && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 12,
                  padding: '9px 14px',
                  marginBottom: 16,
                  color: '#DC2626',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  lineHeight: 1.4,
                  textAlign: 'center'
                }}>
                  <IconInfoCircle size={17} color="#DC2626" style={{ flexShrink: 0 }} />
                  <span>{otpError}</span>
                </div>
              )}

              <button onClick={handleVerifyOtp} disabled={otpVerifying} style={{width: '100%', padding: '14px', background: '#00B875', color: 'white', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: otpVerifying ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0, 184, 117, 0.25)'}}>
                {otpVerifying ? <IconLoader2 size={20} className="spin-icon" /> : <IconCheck size={20} />} যাচাই করুন
              </button>

              {/* Resend OTP with Live Countdown Timer */}
              <div style={{ marginTop: 18, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {otpTimer > 0 ? (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#64748B',
                    fontSize: 13,
                    fontWeight: 600,
                    background: '#F8FAFC',
                    padding: '8px 16px',
                    borderRadius: 99,
                    border: '1px solid #E2E8F0'
                  }}>
                    <IconRefresh size={15} style={{ opacity: 0.6 }} />
                    <span>পুনরায় OTP পাঠান <strong style={{ color: '#00B875', fontWeight: 800 }}>({formatOtpTimer(otpTimer)})</strong></span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={otpSending}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#00B875',
                      fontWeight: 700,
                      fontSize: 13.5,
                      cursor: otpSending ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      borderRadius: 99,
                      transition: 'all 0.2s'
                    }}
                  >
                    <IconRefresh size={16} className={otpSending ? 'spin-icon' : ''} />
                    <span>কোড পাননি? <strong style={{ textDecoration: 'underline' }}>আবার OTP পাঠান</strong></span>
                  </button>
                )}
              </div>
            </div>
          )}
          {authMode === 'account-details' && (
            <div style={{ paddingTop: 4 }}>
              {/* Step indicator dots at top */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 18 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00B875' }} />
                <div style={{ width: 24, height: 8, borderRadius: 99, background: '#00B875' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E2E8F0' }} />
              </div>

              {/* Account Type dropdown */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', display: 'block', marginBottom: 6 }}>
                  অ্যাকাউন্টের ধরন (Account Type)
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1.5px solid #E2E8F0',
                  background: '#FFFFFF'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <IconUser size={18} color="#00B875" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>রোগী (Patient)</span>
                  </div>
                  <IconChevronDown size={18} color="#64748B" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, color: '#00B875', fontSize: 12, fontWeight: 700 }}>
                  <IconUser size={14} /> আপনি রোগী হিসেবে রেজিস্টার করছেন।
                </div>
              </div>

              {/* Header Title */}
              <div style={{ marginTop: 14, marginBottom: 14 }}>
                <h4 style={{ fontWeight: 900, color: '#0F172A', fontSize: 20, margin: 0 }}>অ্যাকাউন্ট তথ্য দিন</h4>
                <p style={{ color: '#64748B', fontSize: 13, marginTop: 4, marginBottom: 0 }}>আপনার নাম, ইমেইল ও পাসওয়ার্ড সেট করুন</p>
              </div>

              {/* Verified Mobile Box */}
              <div style={{
                background: '#E8F8F2',
                border: '1px solid #A7F3D0',
                borderRadius: 10,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#00B875',
                fontSize: 13.5,
                fontWeight: 800,
                marginBottom: 16
              }}>
                <IconCircleCheck size={18} color="#00B875" stroke={2.5} />
                <span>যাচাইকৃত মোবাইল: {mobileNumber}</span>
              </div>

              {/* Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Full Name */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', display: 'block', marginBottom: 6 }}>পূর্ণ নাম</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'absolute', left: 14, color: '#94A3B8', pointerEvents: 'none' }}><IconUser size={18} /></div>
                    <input 
                      type="text" 
                      value={regForm.name} 
                      onChange={e => setRegForm(prev => ({ ...prev, name: e.target.value }))} 
                      placeholder="আপনার পূর্ণ নাম" 
                      style={{ ...inputStyle, paddingLeft: 42, background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', display: 'block', marginBottom: 6 }}>ইমেইল ঠিকানা</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'absolute', left: 14, color: '#94A3B8', pointerEvents: 'none' }}><IconMail size={18} /></div>
                    <input 
                      type="email" 
                      value={regForm.email} 
                      onChange={e => setRegForm(prev => ({ ...prev, email: e.target.value }))} 
                      placeholder="আপনার ইমেইল ঠিকানা (ঐচ্ছিক)" 
                      style={{ ...inputStyle, paddingLeft: 42, background: '#EFF6FF', border: '1.5px solid #DBEAFE' }}
                    />
                  </div>
                </div>

                {/* Passwords in 2 columns */}
                <Row className="g-2">
                  <Col xs={6}>
                    <div>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: '#1E293B', display: 'block', marginBottom: 6 }}>পাসওয়ার্ড</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <div style={{ position: 'absolute', left: 12, color: '#94A3B8', pointerEvents: 'none' }}><IconLock size={16} /></div>
                        <input 
                          type={showRegPass ? 'text' : 'password'} 
                          value={regForm.password} 
                          onChange={e => setRegForm(prev => ({ ...prev, password: e.target.value }))} 
                          placeholder="••••••" 
                          style={{ ...inputStyle, paddingLeft: 34, paddingRight: 32, fontSize: 13, background: '#EFF6FF', border: '1.5px solid #DBEAFE' }}
                        />
                        <button type="button" onClick={() => setShowRegPass(p => !p)} style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                          {showRegPass ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                        </button>
                      </div>
                    </div>
                  </Col>

                  <Col xs={6}>
                    <div>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: '#1E293B', display: 'block', marginBottom: 6 }}>পাসওয়ার্ড নিশ্চিত</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <div style={{ position: 'absolute', left: 12, color: '#94A3B8', pointerEvents: 'none' }}><IconLock size={16} /></div>
                        <input 
                          type={showRegConfirmPass ? 'text' : 'password'} 
                          value={regForm.confirm_password} 
                          onChange={e => setRegForm(prev => ({ ...prev, confirm_password: e.target.value }))} 
                          placeholder="আবার লিখুন" 
                          style={{ ...inputStyle, paddingLeft: 34, paddingRight: 32, fontSize: 13, background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}
                        />
                        <button type="button" onClick={() => setShowRegConfirmPass(p => !p)} style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                          {showRegConfirmPass ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                        </button>
                      </div>
                    </div>
                  </Col>
                </Row>

                {regError && (
                  <div style={{ color: '#EF4444', fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                    {regError}
                  </div>
                )}

                <button 
                  type="button"
                  onClick={handleRegisterAndBook} 
                  disabled={regLoading || submitting}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: '#00B875',
                    color: 'white',
                    borderRadius: 14,
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 8,
                    cursor: (regLoading || submitting) ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(0, 184, 117, 0.3)'
                  }}
                >
                  {(regLoading || submitting) ? <IconLoader2 size={20} className="spin-icon" /> : null}
                  {(regLoading || submitting) ? 'বুকিং প্রক্রিয়াধীন...' : 'রেজিস্ট্রেশন ও বুকিং নিশ্চিত করুন'} <IconArrowRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderWarningModal = () => {
    if (!warningModal.show) return null
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', boxSizing: 'border-box' }}>
        <div style={{ background: '#FFFFFF', borderRadius: 24, padding: '32px 26px 24px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', position: 'relative', boxSizing: 'border-box', fontFamily: "'Hind Siliguri', sans-serif" }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: warningModal.type === 'error' ? '#FEF2F2' : '#FFFBEB',
            border: warningModal.type === 'error' ? '2px solid #FECACA' : '2px solid #FDE68A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: warningModal.type === 'error' ? '0 8px 16px rgba(239, 68, 68, 0.12)' : '0 8px 16px rgba(245, 158, 11, 0.12)'
          }}>
            {warningModal.type === 'error' ? (
              <IconInfoCircle size={34} color="#DC2626" />
            ) : (
              <IconAlertTriangle size={34} color="#D97706" />
            )}
          </div>

          <h4 style={{ fontSize: 20, fontWeight: 800, color: '#1E293B', marginBottom: 10 }}>
            {warningModal.title || 'সতর্কবার্তা'}
          </h4>

          <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
            {warningModal.message}
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
            {warningModal.viewAppointments && (
              <button
                type="button"
                onClick={() => {
                  setWarningModal({ show: false, title: '', message: '' })
                  navigate('/my-appointments')
                }}
                style={{
                  flex: 1,
                  minHeight: 46,
                  padding: '10px 16px',
                  borderRadius: 12,
                  background: '#00B875',
                  color: 'white',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  boxShadow: '0 4px 12px rgba(0, 184, 117, 0.25)',
                  transition: 'all 0.2s',
                  fontFamily: "'Hind Siliguri', sans-serif",
                  whiteSpace: 'nowrap'
                }}
              >
                <IconCalendarEvent size={18} />
                <span>অ্যাপয়েন্টমেন্ট তালিকা</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const onClose = warningModal.onClose
                setWarningModal({ show: false, title: '', message: '' })
                if (onClose) onClose()
              }}
              style={{
                flex: warningModal.viewAppointments ? 1 : 1,
                minHeight: 46,
                padding: '10px 18px',
                borderRadius: 12,
                background: warningModal.viewAppointments ? '#F1F5F9' : '#00B875',
                color: warningModal.viewAppointments ? '#334155' : 'white',
                border: warningModal.viewAppointments ? '1.5px solid #E2E8F0' : 'none',
                fontWeight: 700,
                fontSize: 14.5,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'Hind Siliguri', sans-serif",
                whiteSpace: 'nowrap'
              }}
            >
              {warningModal.confirmText || 'ঠিক আছে'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFB', minHeight: '100vh', paddingTop: 20, paddingBottom: 60, fontFamily: "'Hind Siliguri', sans-serif" }}>

      {/* Sticky Mobile Top Nav Header */}
      <div className="d-lg-none mobile-nav-header" style={{
        padding: '12px 16px',
        borderBottom: '1px solid #E2E8F0',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1040,
        marginBottom: 12,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: 10,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#1E293B'
            }}
          >
            <IconChevronLeft size={20} />
          </button>
          <div>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', display: 'block', lineHeight: 1.2 }}>অ্যাপয়েন্টমেন্ট নিন</span>
            <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>ধাপ {toBnNum(currentStep)} / ৩</span>
          </div>
        </div>

        {/* Step Progress Pill Indicator */}
        <div style={{
          background: '#E8F8F2',
          color: '#00B875',
          border: '1px solid #A7F3D0',
          borderRadius: 20,
          padding: '4px 10px',
          fontSize: 11.5,
          fontWeight: 800
        }}>
          {currentStep === 1 ? 'চেম্বার' : (currentStep === 2 ? 'তারিখ ও সময়' : 'রোগীর তথ্য')}
        </div>
      </div>

      {loading ? (
        <Container><BookAppointmentSkeleton /></Container>
      ) : (
        <Container style={{ maxWidth: 1100, paddingLeft: 12, paddingRight: 12 }}>
          {/* Desktop Top Title Banner */}
          <div className="d-none d-lg-block" style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', padding: '14px', background: '#E8F8F2', borderRadius: '50%', marginBottom: 10 }}>
              <IconCalendarEvent size={28} color="#00B875" />
            </div>
            <h2 style={{ fontWeight: 800, color: '#00B875', marginBottom: 6, fontSize: 26 }}>অ্যাপয়েন্টমেন্ট বুকিং</h2>
            <p style={{ color: '#64748B', fontSize: 15, margin: 0 }}>{doctor?.name} এর সাথে আপনার সাক্ষাতের সময় নির্ধারণ করুন</p>
          </div>

          {/* Mobile Doctor Compact Summary Card */}
          <div className="d-lg-none mobile-doctor-summary-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img 
                src={getMediaUrl(doctor?.photo) || DEMO_AVATAR} 
                alt={doctor?.name} 
                style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #00B875', flexShrink: 0 }} 
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h6 style={{ fontWeight: 800, color: '#0F172A', fontSize: 14.5, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {doctor?.name}
                </h6>
                <div style={{ fontSize: 12, color: '#00B875', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
                  {doctor?.specialty_name || doctor?.specialty?.name_bn || doctor?.specialty?.name || 'বিশেষজ্ঞ চিকিৎসা'}
                </div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {translateMetadata(doctor?.degree, language, t)}
                </div>
              </div>
              {(selectedChamber?.fee || doctor?.fee || doctor?.consultation_fee) && (
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <span style={{ fontSize: 10, color: '#64748B', display: 'block', fontWeight: 600 }}>ভিজিট ফি</span>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: '#00B875', background: '#E8F8F2', padding: '2px 7px', borderRadius: 6, border: '1px solid #A7F3D0' }}>
                    ৳{toBnNum(selectedChamber?.fee || doctor?.fee || doctor?.consultation_fee)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Row className="g-4">
            {/* LEFT SIDEBAR - DOCTOR PROFILE (Desktop Only) */}
            <Col lg={4} className="d-none d-lg-block">
              <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #E5EAF0', position: 'sticky', top: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
                {/* Image and Basic Info */}
                <div style={{ padding: '24px', textAlign: 'center', background: '#F8FAFB', borderBottom: '1px solid #E5EAF0' }}>
                   <img src={getMediaUrl(doctor?.photo) || DEMO_AVATAR} alt={doctor?.name} style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', marginBottom: 14 }} />
                   <h4 style={{ color: '#00B875', fontWeight: 800, marginBottom: 4, fontSize: 19 }}>{doctor?.name}</h4>
                   <p style={{ color: '#00B875', fontWeight: 600, fontSize: 13.5, marginBottom: 4 }}>{translateMetadata(doctor?.degree, language, t)}</p>
                   <p style={{ color: '#1F2937', fontWeight: 700, fontSize: 12.5, marginBottom: 0 }}>কনসালটেন্ট কার্ডিওলজিস্ট</p>
                   <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '5px 12px', background: '#E8F8F2', color: '#00B875', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                     <IconCircleCheck size={14} /> {doctor?.specialty_name || doctor?.specialty?.name_bn || doctor?.specialty?.name || 'কার্ডিওলজি বিভাগ'}
                   </div>
                </div>

                {/* Stats */}
                <div style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4B5563', fontSize: 12.5 }}><IconCalendarEvent size={15} color="#00B875" /> অভিজ্ঞতা</span>
                    <span style={{ fontWeight: 700, fontSize: 12.5 }}>১০+ বছর</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4B5563', fontSize: 12.5 }}><IconUser size={15} color="#00B875" /> চিকিৎসা প্রদান</span>
                    <span style={{ fontWeight: 700, fontSize: 12.5 }}>১৫০০+ রোগী</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4B5563', fontSize: 12.5 }}><IconCheck size={15} color="#00B875" /> সাফল্য রেটিং</span>
                    <span style={{ fontWeight: 700, fontSize: 12.5 }}>৯৮%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4B5563', fontSize: 12.5 }}><IconMapPin size={15} color="#00B875" /> চেম্বার</span>
                    <span style={{ fontWeight: 700, fontSize: 12.5 }}>ঢাকা, বাংলাদেশ</span>
                  </div>
                </div>
              </div>
            </Col>

            {/* RIGHT MAIN AREA - BOOKING FORM WITH INTERACTIVE STEPPER */}
            <Col lg={8} xs={12}>
              <div className="booking-card-main">
                {/* Modern Interactive Step Wizard Progress Bar */}
                <div className="wizard-stepper-container">
                  {/* Progress track line */}
                  <div className="stepper-track-bg">
                    <div 
                      className="stepper-track-fill" 
                      style={{ 
                        width: currentStep === 1 ? '16%' : (currentStep === 2 ? '50%' : '100%') 
                      }} 
                    />
                  </div>

                  <div className="stepper-steps-wrapper">
                    {STEPS.map((step) => {
                      const isCompleted = (step.id === 1 && selectedChamberId) || (step.id === 2 && form.appointment_date && form.appointment_time && !isSlotBooked(form.appointment_time))
                      const isActive = currentStep === step.id
                      const isAccessible = step.id === 1 || (step.id === 2 && selectedChamberId) || (step.id === 3 && selectedChamberId && form.appointment_date && form.appointment_time && !isSlotBooked(form.appointment_time))

                      return (
                        <div
                          key={step.id}
                          onClick={() => {
                            if (isAccessible || isCompleted) {
                              setCurrentStep(step.id)
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }
                          }}
                          className={`stepper-step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isAccessible ? 'accessible' : 'locked'}`}
                        >
                          {/* Step Icon / Circle */}
                          <div className="stepper-circle">
                            {isCompleted && !isActive ? (
                              <IconCheck size={14} stroke={3} />
                            ) : (
                              <span>{toBnNum(step.id)}</span>
                            )}
                          </div>

                          {/* Step Label */}
                          <div className="stepper-label-wrap">
                            <span className="step-tag">ধাপ {toBnNum(step.id)}</span>
                            <span className="step-title">{step.shortLabel || step.label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Step 1: Chamber Selection */}
                {currentStep === 1 && (
                  <div>
                    {/* Location Status / Activation Banner */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                      {!hasLocation ? (
                        <button
                          type="button"
                          onClick={requestLocation}
                          disabled={locationLoading}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#ECFDF5',
                            color: '#059669',
                            border: '1px solid #A7F3D0',
                            borderRadius: 8,
                            padding: '6px 14px',
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: locationLoading ? 'not-allowed' : 'pointer',
                            fontFamily: "'Hind Siliguri', sans-serif",
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <IconNavigation size={15} color="#059669" />
                          <span>{locationLoading ? 'লোকেশন যাচাই হচ্ছে...' : '📍 নিকটতম চেম্বার ও দূরত্ব জানতে লোকেশন চালু করুন'}</span>
                        </button>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: '#ECFDF5',
                          color: '#059669',
                          border: '1px solid #A7F3D0',
                          borderRadius: 8,
                          padding: '5px 12px',
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: "'Hind Siliguri', sans-serif"
                        }}>
                          <IconNavigation size={14} color="#059669" />
                          <span>আপনার লোকেশন অনুযায়ী নিকটতম চেম্বার শনাক্ত করা হয়েছে</span>
                        </span>
                      )}
                    </div>
                  
                  {uniqueHospitals.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <div style={{ position: 'absolute', left: 16, pointerEvents: 'none', color: '#00B875', display: 'flex', alignItems: 'center' }}>
                          <IconBuildingHospital size={20} />
                        </div>
                        <select 
                          value={chamberFilter} 
                          onChange={e => setChamberFilter(e.target.value)} 
                          style={{
                            ...inputStyle,
                            paddingLeft: 46,
                            paddingRight: 44,
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            cursor: 'pointer',
                            height: 48,
                            fontWeight: 700,
                            color: '#1E293B',
                            background: '#F8FAFC',
                            border: '1.5px solid #E2E8F0',
                            borderRadius: 12,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                            transition: 'all 0.2s ease',
                            fontSize: 14
                          }}
                        >
                          <option value="">সব হাসপাতাল/চেম্বার (সকল চেম্বার)</option>
                          {uniqueHospitals.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <div style={{ position: 'absolute', right: 16, pointerEvents: 'none', color: '#00B875', display: 'flex', alignItems: 'center' }}>
                          <IconChevronDown size={18} stroke={2.5} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="chamber-grid">
                    {groupedChambers.map(group => {
                      const isGroupSelected = group.schedules.some(s => s.id === selectedChamberId)
                      return (
                        <div 
                          key={group.hospitalId || group.hospitalName} 
                          className={`chamber-card ${isGroupSelected ? 'selected' : 'unselected'}`}
                          style={{ cursor: 'default' }}
                        >
                          <div>
                            {/* Card Top: Icon, Hospital Name & Badge */}
                            <div className="chamber-card-top">
                              <div className="chamber-title-wrap">
                                <div className="chamber-icon-box">
                                  <IconBuildingHospital size={20} />
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <h6 className="chamber-hospital-name">
                                    {group.chamber_name || group.hospitalName}
                                  </h6>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                {group.isClosest && (
                                  <span style={{
                                    background: '#ECFDF5',
                                    color: '#059669',
                                    padding: '2px 8px',
                                    borderRadius: 12,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    border: '1px solid #A7F3D0',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    ✨ নিকটতম
                                  </span>
                                )}
                                {group.schedules.length > 1 && (
                                  <span style={{
                                    background: '#F1F5F9',
                                    color: '#334155',
                                    padding: '2px 8px',
                                    borderRadius: 12,
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    border: '1px solid #E2E8F0',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {toBnNum(group.schedules.length)}টি শিডিউল
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Address Row & Distance */}
                            <div className="chamber-address-row" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                              <IconMapPin size={13} color="#00B875" style={{ flexShrink: 0 }} />
                              <span className="chamber-address-text">{group.address}</span>
                              {group.formattedDistance && (
                                <span style={{
                                  color: '#059669',
                                  fontWeight: 700,
                                  fontSize: 12,
                                  fontFamily: "'Hind Siliguri', sans-serif",
                                  marginLeft: 4
                                }}>
                                  • {group.formattedDistance} দূরে
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Schedules list in this hospital */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                            {group.schedules.map(sch => {
                              const isSchSelected = selectedChamberId === sch.id
                              const fee = sch.fee || doctor?.fee || doctor?.consultation_fee
                              return (
                                <div
                                  key={sch.id}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleChamberSelect(sch.id)
                                  }}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 8,
                                    padding: '10px 12px',
                                    borderRadius: 10,
                                    border: isSchSelected ? '2px solid #00B875' : '1px solid #E2E8F0',
                                    background: isSchSelected ? '#E8F8F2' : '#F8FAFC',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {/* Row 1: Day + Time */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <span style={{
                                      fontWeight: 800,
                                      fontSize: 13,
                                      color: isSchSelected ? '#007A65' : '#1E293B',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      flexShrink: 0
                                    }}>
                                      <IconCalendarEvent size={14} color="#00B875" />
                                      {dayToBn[sch.day] || sch.day}
                                    </span>
                                    <span style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                      <IconClock size={13} color="#00B875" />
                                      {formatTimeBn(sch.start_time)} - {formatTimeBn(sch.end_time)}
                                    </span>
                                    {sch.slot_duration_minutes && (
                                      <span style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: '#0369A1',
                                        background: '#E0F2FE',
                                        padding: '1px 7px',
                                        borderRadius: 6,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 3
                                      }}>
                                        ⏱️ {toBnNum(sch.slot_duration_minutes)} মি. স্লট
                                      </span>
                                    )}
                                  </div>

                                  {/* Row 2: Fee + Select Button */}
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                    {fee ? (
                                      <span style={{
                                        fontSize: 12,
                                        fontWeight: 800,
                                        color: isSchSelected ? '#007A65' : '#00B875',
                                        background: isSchSelected ? '#FFFFFF' : '#E8F8F2',
                                        padding: '3px 10px',
                                        borderRadius: 6,
                                        border: '1px solid #A7F3D0'
                                      }}>
                                        ৳{toBnNum(fee)}
                                      </span>
                                    ) : <span />}

                                    {isSchSelected ? (
                                      <span className="chamber-check-badge" style={{ width: 24, height: 24 }}>
                                        <IconCheck size={14} stroke={3} />
                                      </span>
                                    ) : (
                                      <span style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: '#00B875',
                                        background: 'white',
                                        border: '1px solid #00B875',
                                        borderRadius: 6,
                                        padding: '3px 10px',
                                        whiteSpace: 'nowrap'
                                      }}>
                                        নির্বাচন করুন
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                    {groupedChambers.length === 0 && <p style={{color: '#6B7280'}}>ডাক্তারের কোনো চেম্বার নেই</p>}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                    <button 
                      type="button" 
                      onClick={() => setCurrentStep(2)} 
                      disabled={!selectedChamberId}
                      className="btn-confirm"
                      style={{ padding: '12px 24px', fontSize: 14 }}
                    >
                      পরবর্তী ধাপ <IconArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Date & Time Selection */}
              {currentStep === 2 && (
                <div>
                  
                  {selectedChamberId ? (
                    <div>
                      <Row className="g-4">
                        {/* Left: Custom Calendar */}
                        <Col md={6}>
                          <div style={{ border: '1px solid #E5EAF0', borderRadius: 12, padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                              <button type="button" onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><IconChevronLeft size={20} /></button>
                              <span style={{ fontWeight: 800, color: '#00B875' }}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
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
                                        background: isSelected ? '#00B875' : (available ? '#E8F8F2' : 'transparent'),
                                        color: isSelected ? 'white' : (available ? '#00B875' : '#D1D5DB'),
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
                              <IconCalendarEvent size={18} color="#00B875" /> {getFormatDateBn(form.appointment_date) || 'তারিখ নির্বাচন করুন'}
                            </div>
                          </div>
                        </Col>

                        {/* Right: Time Slots Accordion */}
                        <Col md={6}>
                           <h6 style={{ fontWeight: 800, color: '#00B875', marginBottom: 4 }}>
                             সময় স্লট নির্বাচন করুন ({toBnNum(selectedChamber?.slot_duration_minutes || 15)} মিনিট)
                           </h6>
                           <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>একটি সময় স্লট নির্বাচন করুন</p>
                           
                           <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingRight: '4px' }}>
                              {/* Morning */}
                              {groupedSlots.morning?.length > 0 && (
                                <div style={{ border: '1px solid #E5EAF0', borderRadius: 8, overflow: 'hidden' }}>
                                  <div onClick={() => toggleGroup('morning')} style={{ padding: '12px 16px', background: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{fontSize: 18}}>☀️</span> <span style={{ fontWeight: 700, color: '#00B875', fontSize: 14 }}>সকাল <small style={{color: '#6B7280', fontWeight: 'normal'}}>(৮:০০ - ১২:০০)</small></span></div>
                                    {expandedGroups.morning ? <IconMinus size={16} color="#00B875" /> : <IconPlus size={16} color="#00B875" />}
                                  </div>
                                  {expandedGroups.morning && (
                                    <div className="time-slot-grid">
                                       {groupedSlots.morning.map(slot => {
                                         const booked = isSlotBooked(slot)
                                         const isSelected = form.appointment_time === slot && !booked
                                         return (
                                           <button 
                                             key={slot} 
                                             type="button" 
                                             disabled={booked} 
                                             onClick={() => !booked && handleSlotSelect(slot)} 
                                             className={`time-slot-btn ${booked ? 'booked' : (isSelected ? 'selected' : 'unselected')}`}
                                             title={booked ? 'ইতিমধ্যে বুক করা হয়েছে' : formatTimeBn(slot)}
                                           >
                                             <span>{formatTimeBn(slot)}</span>
                                             {booked && <span className="booked-tag">(বুকড)</span>}
                                           </button>
                                         )
                                       })}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Noon */}
                              {groupedSlots.noon?.length > 0 && (
                                <div style={{ border: '1px solid #E5EAF0', borderRadius: 8, overflow: 'hidden' }}>
                                  <div onClick={() => toggleGroup('noon')} style={{ padding: '12px 16px', background: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{fontSize: 18}}>🌤️</span> <span style={{ fontWeight: 700, color: '#374151', fontSize: 14 }}>দুপুর <small style={{color: '#6B7280', fontWeight: 'normal'}}>(১২:০০ - ৩:০০)</small></span></div>
                                    {expandedGroups.noon ? <IconMinus size={16} color="#00B875" /> : <IconPlus size={16} color="#00B875" />}
                                  </div>
                                  {expandedGroups.noon && (
                                    <div className="time-slot-grid">
                                       {groupedSlots.noon.map(slot => {
                                         const booked = isSlotBooked(slot)
                                         const isSelected = form.appointment_time === slot && !booked
                                         return (
                                           <button 
                                             key={slot} 
                                             type="button" 
                                             disabled={booked} 
                                             onClick={() => !booked && handleSlotSelect(slot)} 
                                             className={`time-slot-btn ${booked ? 'booked' : (isSelected ? 'selected' : 'unselected')}`}
                                             title={booked ? 'ইতিমধ্যে বুক করা হয়েছে' : formatTimeBn(slot)}
                                           >
                                             <span>{formatTimeBn(slot)}</span>
                                             {booked && <span className="booked-tag">(বুকড)</span>}
                                           </button>
                                         )
                                       })}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Afternoon */}
                              {groupedSlots.afternoon?.length > 0 && (
                                <div style={{ border: '1px solid #E5EAF0', borderRadius: 8, overflow: 'hidden' }}>
                                  <div onClick={() => toggleGroup('afternoon')} style={{ padding: '12px 16px', background: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{fontSize: 18}}>🌅</span> <span style={{ fontWeight: 700, color: '#374151', fontSize: 14 }}>বিকাল <small style={{color: '#6B7280', fontWeight: 'normal'}}>(৩:০০ - ৬:০০)</small></span></div>
                                    {expandedGroups.afternoon ? <IconMinus size={16} color="#00B875" /> : <IconPlus size={16} color="#00B875" />}
                                  </div>
                                  {expandedGroups.afternoon && (
                                    <div className="time-slot-grid">
                                       {groupedSlots.afternoon.map(slot => {
                                         const booked = isSlotBooked(slot)
                                         const isSelected = form.appointment_time === slot && !booked
                                         return (
                                           <button 
                                             key={slot} 
                                             type="button" 
                                             disabled={booked} 
                                             onClick={() => !booked && handleSlotSelect(slot)} 
                                             className={`time-slot-btn ${booked ? 'booked' : (isSelected ? 'selected' : 'unselected')}`}
                                             title={booked ? 'ইতিমধ্যে বুক করা হয়েছে' : formatTimeBn(slot)}
                                           >
                                             <span>{formatTimeBn(slot)}</span>
                                             {booked && <span className="booked-tag">(বুকড)</span>}
                                           </button>
                                         )
                                       })}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Evening/Night */}
                              {groupedSlots.evening?.length > 0 && (
                                <div style={{ border: '1px solid #E5EAF0', borderRadius: 8, overflow: 'hidden' }}>
                                  <div onClick={() => toggleGroup('evening')} style={{ padding: '12px 16px', background: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{fontSize: 18}}>🌙</span> <span style={{ fontWeight: 700, color: '#374151', fontSize: 14 }}>সন্ধ্যা / রাত <small style={{color: '#6B7280', fontWeight: 'normal'}}>(৬:০০ - ৯:০০)</small></span></div>
                                    {expandedGroups.evening ? <IconMinus size={16} color="#00B875" /> : <IconPlus size={16} color="#00B875" />}
                                  </div>
                                  {expandedGroups.evening && (
                                    <div className="time-slot-grid">
                                       {groupedSlots.evening.map(slot => {
                                         const booked = isSlotBooked(slot)
                                         const isSelected = form.appointment_time === slot && !booked
                                         return (
                                           <button 
                                             key={slot} 
                                             type="button" 
                                             disabled={booked} 
                                             onClick={() => !booked && handleSlotSelect(slot)} 
                                             className={`time-slot-btn ${booked ? 'booked' : (isSelected ? 'selected' : 'unselected')}`}
                                             title={booked ? 'ইতিমধ্যে বুক করা হয়েছে' : formatTimeBn(slot)}
                                           >
                                             <span>{formatTimeBn(slot)}</span>
                                             {booked && <span className="booked-tag">(বুকড)</span>}
                                           </button>
                                         )
                                       })}
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
                      <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>তারিখ ও সময় দেখতে প্রথমে একটি চেম্বার নির্বাচন করুন</p>
                      <button type="button" onClick={() => setCurrentStep(1)} className="btn-confirm" style={{ margin: '0 auto', padding: '10px 20px', fontSize: 14 }}>
                        চেম্বার নির্বাচন করুন
                      </button>
                    </div>
                  )}
                  
                  {/* Info Note */}
                  <div style={{ padding: '12px 16px', background: '#F8FAFB', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, marginTop: 20 }}>
                     <IconInfoCircle size={20} color="#00B875" />
                     <span style={{ fontSize: 13, color: '#00B875', fontWeight: 700 }}>অনুগ্রহ করে আপনার নির্ধারিত সময়ের কমপক্ষে ১৫ মিনিট আগে হাসপাতালে উপস্থিত থাকুন।</span>
                  </div>

                  {/* Step 2 Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                    <button 
                      type="button" 
                      onClick={() => setCurrentStep(1)} 
                      className="btn-cancel"
                      style={{ padding: '12px 20px', fontSize: 14 }}
                    >
                      <IconChevronLeft size={18} /> আগের ধাপ
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setCurrentStep(3)} 
                      disabled={!form.appointment_date || !form.appointment_time || isSlotBooked(form.appointment_time)}
                      className="btn-confirm"
                      style={{ padding: '12px 24px', fontSize: 14 }}
                    >
                      পরবর্তী ধাপ <IconArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Appointment Details */}
              {currentStep === 3 && (
                <div>
                  {/* কার জন্য অ্যাপয়েন্টমেন্ট */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 13, fontWeight: 800, color: '#374151', marginBottom: 10, display: 'block' }}>
                      কার জন্য অ্যাপয়েন্টমেন্ট নিতে চাচ্ছেন? <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: 12
                    }}>
                      {/* Option 1: Myself */}
                      <div
                        onClick={() => setForm(prev => ({ ...prev, booking_for: 'myself' }))}
                        style={{
                          background: form.booking_for === 'myself' ? '#F0FDF4' : '#FFFFFF',
                          border: form.booking_for === 'myself' ? '2px solid #00B875' : '1.5px solid #E2E8F0',
                          borderRadius: 14,
                          padding: '14px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: form.booking_for === 'myself' ? '0 4px 12px rgba(0, 184, 117, 0.12)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: form.booking_for === 'myself' ? '#DCFCE7' : '#F1F5F9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <IconUser size={24} color={form.booking_for === 'myself' ? '#00B875' : '#64748B'} />
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: "'Hind Siliguri', sans-serif" }}>
                              নিজের জন্য
                            </div>
                            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                              আমি নিজে ডাক্তার দেখাতে চাই
                            </div>
                          </div>
                        </div>
                        {form.booking_for === 'myself' && (
                          <div style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: '#00B875',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            flexShrink: 0
                          }}>
                            <IconCheck size={14} stroke={3} />
                          </div>
                        )}
                      </div>

                      {/* Option 2: Relative / Family */}
                      <div
                        onClick={() => setForm(prev => ({ ...prev, booking_for: 'relative' }))}
                        style={{
                          background: form.booking_for !== 'myself' ? '#F0FDF4' : '#FFFFFF',
                          border: form.booking_for !== 'myself' ? '2px solid #00B875' : '1.5px solid #E2E8F0',
                          borderRadius: 14,
                          padding: '14px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: form.booking_for !== 'myself' ? '0 4px 12px rgba(0, 184, 117, 0.12)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: form.booking_for !== 'myself' ? '#DCFCE7' : '#F1F5F9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <IconUsers size={24} color={form.booking_for !== 'myself' ? '#00B875' : '#64748B'} />
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: "'Hind Siliguri', sans-serif" }}>
                              আত্মীয়স্বজনের জন্য
                            </div>
                            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                              পরিবারের সদস্য বা অন্য কারো জন্য
                            </div>
                          </div>
                        </div>
                        {form.booking_for !== 'myself' && (
                          <div style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: '#00B875',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            flexShrink: 0
                          }}>
                            <IconCheck size={14} stroke={3} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* নিজের জন্য রোগীর তথ্য (যদি লগইন না থাকে) */}
                  {form.booking_for === 'myself' && !isLoggedIn && (
                    <div style={{
                      background: '#F8FAFC',
                      border: '1.5px dashed #CBD5E1',
                      borderRadius: 14,
                      padding: '18px 20px',
                      marginBottom: 20
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: '#00B875', fontWeight: 800, fontSize: 14 }}>
                        <IconUser size={18} /> আপনার তথ্য দিন
                      </div>
                      <Row className="g-3">
                        <Col md={12}>
                          <div>
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }}>
                              আপনার পূর্ণ নাম <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <input 
                              type="text" 
                              name="patient_name" 
                              value={form.patient_name || ''} 
                              onChange={handleChange} 
                              placeholder="আপনার পূর্ণ নাম লিখুন (যেমন: মোঃ আরিফ হোসেন)" 
                              style={inputStyle}
                            />
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )}

                  {/* অন্যান্যদের জন্য রোগীর তথ্য */}
                  {form.booking_for && form.booking_for !== 'myself' && (
                    <div style={{
                      background: '#F8FAFC',
                      border: '1.5px dashed #CBD5E1',
                      borderRadius: 14,
                      padding: '18px 20px',
                      marginBottom: 20
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: '#00B875', fontWeight: 800, fontSize: 14 }}>
                        <IconUser size={18} /> রোগীর প্রয়োজনীয় তথ্য দিন
                      </div>
                      
                      <Row className="g-3">
                        {/* Booker Name for unauthenticated user */}
                        {!isLoggedIn && (
                          <Col md={12}>
                            <div>
                              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }}>
                                আপনার (বুকিংকারীর) নাম <span style={{ color: '#EF4444' }}>*</span>
                              </label>
                              <input 
                                type="text" 
                                name="booker_name" 
                                value={form.booker_name || ''} 
                                onChange={handleChange} 
                                placeholder="আপনার পূর্ণ নাম লিখুন (যেমন: মোঃ আরিফ হোসেন)" 
                                style={inputStyle}
                              />
                            </div>
                          </Col>
                        )}

                        {/* Patient Name */}
                        <Col md={12}>
                          <div>
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }}>
                              রোগীর নাম <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <input 
                              type="text" 
                              name="patient_name" 
                              value={form.patient_name || ''} 
                              onChange={handleChange} 
                              placeholder="রোগীর পুরো নাম লিখুন" 
                              style={inputStyle}
                            />
                          </div>
                        </Col>

                        {/* Age in Years */}
                        <Col md={6}>
                          <div>
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }}>
                              রোগীর বয়স (বছর) <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <input 
                              type="tel" 
                              name="patient_age" 
                              maxLength={3}
                              value={form.patient_age || ''} 
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 3)
                                setForm(prev => ({ ...prev, patient_age: val }))
                              }} 
                              placeholder="যেমন: ২৫" 
                              style={inputStyle}
                            />
                          </div>
                        </Col>

                        {/* Gender */}
                        <Col md={6}>
                          <div>
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }}>
                              লিঙ্গ <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <select
                              name="patient_gender"
                              value={form.patient_gender || 'পুরুষ'}
                              onChange={handleChange}
                              style={{
                                ...inputStyle,
                                appearance: 'auto',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="পুরুষ">পুরুষ</option>
                              <option value="মহিলা">মহিলা</option>
                              <option value="অন্যান্য">অন্যান্য</option>
                            </select>
                          </div>
                        </Col>

                        {/* Relationship */}
                        <Col md={6}>
                          <div>
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }}>
                              রোগীর সাথে সম্পর্ক <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <select
                              name="patient_relation"
                              value={form.patient_relation || 'পিতা'}
                              onChange={handleChange}
                              style={{
                                ...inputStyle,
                                appearance: 'auto',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="পিতা">পিতা</option>
                              <option value="মাতা">মাতা</option>
                              <option value="স্ত্রী">স্ত্রী</option>
                              <option value="স্বামী">স্বামী</option>
                              <option value="সন্তান">সন্তান</option>
                              <option value="ভাই">ভাই</option>
                              <option value="বোন">বোন</option>
                              <option value="অন্যান্য">অন্যান্য</option>
                            </select>
                          </div>
                        </Col>

                        {/* Mobile Number (Optional) */}
                        <Col md={6}>
                          <div>
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }}>
                              রোগীর মোবাইল নম্বর <span style={{ color: '#6B7280', fontWeight: 500 }}>(ঐচ্ছিক)</span>
                            </label>
                            <input 
                              type="tel" 
                              name="patient_phone" 
                              maxLength={11}
                              value={form.patient_phone || ''} 
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 11)
                                setForm(prev => ({ ...prev, patient_phone: val }))
                              }} 
                              placeholder="যেমন: 017XXXXXXXX" 
                              style={inputStyle}
                            />
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )}
                  


                  {/* Summary of Selected Chamber & Details (Strict 3-Column Aligned Grid) */}
                  <div style={{ 
                    background: '#F0FDF4', 
                    border: '1px solid #BBF7D0', 
                    borderRadius: 14, 
                    padding: '16px 20px', 
                    marginBottom: 24 
                  }}>
                    <Row className="g-3 align-items-center">
                      {/* Column 1: Chamber (Top) & Patient (Bottom) */}
                      <Col xs={12} md={5}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <IconBuildingHospital size={20} color="#00B875" />
                            <div>
                              <small style={{ color: '#64748B', display: 'block', fontSize: 11 }}>নির্বাচিত চেম্বার</small>
                              <strong style={{ color: '#00B875', fontSize: 13.5 }}>{selectedChamber?.chamber_name || selectedChamber?.hospital?.name || 'চেম্বার'}</strong>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <IconUser size={20} color="#00B875" style={{ marginTop: 2, flexShrink: 0 }} />
                            <div>
                              <small style={{ color: '#64748B', display: 'block', fontSize: 11 }}>
                                {form.booking_for !== 'myself' ? 'রোগীর তথ্য (আত্মীয়স্বজন)' : 'রোগীর নাম'}
                              </small>
                              {form.booking_for !== 'myself' ? (
                                <div>
                                  <strong style={{ color: '#1F2937', fontSize: 13.5, display: 'block' }}>
                                    {form.patient_name?.trim() ? form.patient_name : 'নাম লিখুন...'}
                                  </strong>
                                  <div style={{ fontSize: 11.5, color: '#475569', marginTop: 3, display: 'flex', flexWrap: 'wrap', gap: '4px 6px' }}>
                                    {form.patient_relation && (
                                      <span style={{ background: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                        {form.patient_relation}
                                      </span>
                                    )}
                                    {form.patient_age && (
                                      <span style={{ background: '#F1F5F9', padding: '1px 6px', borderRadius: 4 }}>
                                        {toBnNum(form.patient_age)} বছর
                                      </span>
                                    )}
                                    {form.patient_gender && (
                                      <span style={{ background: '#F1F5F9', padding: '1px 6px', borderRadius: 4 }}>
                                        {form.patient_gender}
                                      </span>
                                    )}
                                    {form.patient_phone && (
                                      <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                                        মোবাইল: {toBnNum(form.patient_phone)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <strong style={{ color: '#1F2937', fontSize: 13.5 }}>
                                  {isLoggedIn 
                                    ? (user?.name ? `${user.name} (নিজের জন্য)` : 'নিজের জন্য')
                                    : (form.patient_name?.trim() ? `${form.patient_name} (নিজের জন্য)` : 'নিজের জন্য')}
                                </strong>
                              )}
                            </div>
                          </div>
                        </div>
                      </Col>

                      {/* Column 2: Date (Top) & Time (Bottom) */}
                      <Col xs={12} md={4}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <IconCalendarEvent size={20} color="#00B875" />
                            <div>
                              <small style={{ color: '#64748B', display: 'block', fontSize: 11 }}>তারিখ</small>
                              <strong style={{ color: '#1F2937', fontSize: 13.5 }}>{getFormatDateBn(form.appointment_date) || 'নির্বাচন করা হয়নি'}</strong>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <IconClock size={20} color="#00B875" />
                            <div>
                              <small style={{ color: '#64748B', display: 'block', fontSize: 11 }}>সময়</small>
                              <strong style={{ color: '#1F2937', fontSize: 13.5 }}>{formatTimeBn(form.appointment_time) || 'নির্বাচন করা হয়নি'}</strong>
                            </div>
                          </div>
                        </div>
                      </Col>

                      {/* Column 3: Consultation Fee */}
                      <Col xs={12} md={3}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                          {(selectedChamber?.fee || doctor?.fee || doctor?.consultation_fee) && (
                            <div>
                              <small style={{ color: '#64748B', display: 'block', fontSize: 11, marginBottom: 4 }}>পরামর্শ ফি</small>
                              <div style={{ background: '#E8F8F2', padding: '6px 14px', borderRadius: 10, border: '1px solid #A7F3D0', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <strong style={{ color: '#00B875', fontSize: 14, fontWeight: 800 }}>৳ {toBnNum(selectedChamber?.fee || doctor?.fee || doctor?.consultation_fee)}</strong>
                              </div>
                            </div>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </div>

                  <div className="action-buttons">
                     <button type="button" onClick={() => setCurrentStep(2)} className="btn-cancel">
                       <IconChevronLeft size={18} /> আগের ধাপ
                     </button>
                     <button onClick={handleConfirmClick} disabled={submitting} className="btn-confirm">
                       {submitting ? <IconLoader2 className="spin-icon" size={18} /> : <IconCalendarEvent size={18} />}
                       অ্যাপয়েন্টমেন্ট নিশ্চিত করুন
                     </button>
                  </div>
                </div>
              )}
            </div>
          </Col>
          </Row>
        </Container>
      )}

      {renderAuthModal()}
      {renderWarningModal()}
      
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

        /* Modern Wizard Stepper Styles */
        .wizard-stepper-container {
          position: relative;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 18px 24px;
          margin-bottom: 24px;
        }
        .stepper-track-bg {
          position: absolute;
          top: 36px;
          left: 55px;
          right: 55px;
          height: 4px;
          background: #E2E8F0;
          border-radius: 99px;
          z-index: 1;
        }
        .stepper-track-fill {
          height: 100%;
          background: linear-gradient(90deg, #00B875, #059669);
          border-radius: 99px;
          transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .stepper-steps-wrapper {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .stepper-step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          flex: 1;
          user-select: none;
          transition: all 0.2s ease;
        }
        .stepper-step-item.accessible {
          cursor: pointer;
        }
        .stepper-step-item.locked {
          cursor: not-allowed;
          opacity: 0.65;
        }
        .stepper-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          background: #FFFFFF;
          border: 2px solid #CBD5E1;
          color: #64748B;
          margin-bottom: 8px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }
        .stepper-step-item.active .stepper-circle {
          background: #00B875;
          border-color: #00B875;
          color: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(0, 184, 117, 0.2), 0 4px 12px rgba(0, 184, 117, 0.3);
          transform: scale(1.08);
        }
        .stepper-step-item.completed .stepper-circle {
          background: #E8F8F2;
          border-color: #00B875;
          color: #00B875;
        }
        .stepper-label-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .step-tag {
          font-size: 11px;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .stepper-step-item.active .step-tag {
          color: #00B875;
        }
        .step-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #334155;
          line-height: 1.2;
        }
        .stepper-step-item.active .step-title {
          color: #0F172A;
          font-weight: 800;
        }
        .stepper-step-item.completed .step-title {
          color: #00B875;
        }

        .mobile-doctor-summary-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 12px 14px;
          margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        }

        @media (max-width: 768px) {
          .wizard-stepper-container {
            padding: 12px 10px;
            border-radius: 14px;
            margin-bottom: 16px;
          }
          .stepper-track-bg {
            top: 26px;
            left: 28px;
            right: 28px;
          }
          .stepper-circle {
            width: 28px;
            height: 28px;
            font-size: 12px;
            margin-bottom: 4px;
          }
          .step-tag {
            font-size: 9.5px;
          }
          .step-title {
            font-size: 11.5px;
          }
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
          background: #00B875;
          color: white;
          font-weight: 800;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 15px rgba(0, 184, 117, 0.25);
          transition: all 0.2s ease;
        }
        .btn-confirm:hover:not(:disabled) {
          background: #009E64;
          box-shadow: 0 6px 20px rgba(0, 184, 117, 0.35);
          transform: translateY(-2px);
        }
        .btn-confirm:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          box-shadow: none;
        }
        
        .booking-card-main {
          background: white;
          border-radius: 16px;
          border: 1px solid #E5EAF0;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
          box-sizing: border-box;
          width: 100%;
        }

        .chamber-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          width: 100%;
          box-sizing: border-box;
        }
        .chamber-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-radius: 16px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          box-sizing: border-box;
          position: relative;
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
        }
        .chamber-card.selected {
          border: 2px solid #00B875;
          background: #F0FDF4;
          box-shadow: 0 6px 20px rgba(0, 184, 117, 0.12);
        }
        .chamber-card.unselected:hover {
          border-color: #00B875;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          transform: translateY(-2px);
        }

        .chamber-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 8px;
          width: 100%;
        }
        .chamber-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }
        .chamber-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #E8F8F2;
          color: #00B875;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .chamber-card.selected .chamber-icon-box {
          background: #00B875;
          color: #FFFFFF;
        }
        .chamber-hospital-name {
          font-weight: 800;
          font-size: 15px;
          color: #1E293B;
          margin: 0;
          line-height: 1.3;
          word-break: break-word;
        }

        .chamber-top-right {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .chamber-fee-badge {
          background: #E8F8F2;
          color: #00B875;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid #A7F3D0;
          white-space: nowrap;
        }
        .chamber-card.selected .chamber-fee-badge {
          background: #00B875;
          color: #FFFFFF;
          border: none;
        }
        .chamber-check-badge {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #00B875;
          color: #FFFFFF;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .chamber-address-row {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #64748B;
          font-size: 12.5px;
          margin-bottom: 12px;
          width: 100%;
          min-width: 0;
        }
        .chamber-address-text {
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
          min-width: 0;
        }

        .chamber-schedule-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 6px;
          background: #F8FAFC;
          padding: 7px 10px;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
          font-size: 12px;
          margin-top: 4px;
          width: 100%;
          box-sizing: border-box;
        }
        .chamber-card.selected .chamber-schedule-bar {
          background: #FFFFFF;
          border-color: #BBF7D0;
        }
        .chamber-day-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #00B875;
          font-weight: 800;
          white-space: nowrap;
        }
        .chamber-time-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #475569;
          font-weight: 600;
          font-size: 11.5px;
          white-space: nowrap;
        }

        .time-slot-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(115px, 1fr));
          gap: 10px;
          max-height: 250px;
          overflow-y: auto;
          padding: 12px;
        }
        .time-slot-btn {
          padding: 8px 10px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Hind Siliguri', sans-serif;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-sizing: border-box;
          line-height: 1.3;
        }
        .time-slot-btn.selected {
          border: 1.5px solid #00B875;
          background: #00B875;
          color: white;
          box-shadow: 0 2px 8px rgba(0, 184, 117, 0.25);
          font-weight: 600;
        }
        .time-slot-btn.unselected {
          border: 1px solid #CBD5E1;
          background: white;
          color: #334155;
        }
        .time-slot-btn.unselected:hover {
          border-color: #00B875;
          color: #00B875;
          background: #F0FDF4;
        }
        .time-slot-btn.booked,
        .time-slot-btn:disabled {
          border: 1px dashed #CBD5E1;
          background: #F1F5F9;
          color: #94A3B8;
          cursor: not-allowed;
          opacity: 0.65;
          text-decoration: none;
          box-shadow: none;
        }
        .time-slot-btn .booked-tag {
          font-size: 10.5px;
          font-weight: 500;
          color: #EF4444;
          text-decoration: none;
          display: inline-block;
          margin-left: 4px;
        }

        @media (max-width: 768px) {
          .booking-card-main {
            padding: 16px 12px !important;
            border-radius: 14px !important;
          }
          .chamber-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .chamber-card {
            padding: 14px 12px !important;
          }
          .chamber-hospital-name {
            font-size: 14.5px !important;
          }
          .chamber-schedule-bar {
            padding: 6px 8px !important;
          }
          .chamber-day-badge {
            font-size: 11.5px !important;
          }
          .chamber-time-badge {
            font-size: 11px !important;
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
            grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)) !important;
            gap: 8px;
          }
        }
      `}} />
    </div>
  )
}

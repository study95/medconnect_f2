import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Container, Modal } from 'react-bootstrap'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  IconCalendarEvent, IconClock, IconMapPin, IconUser,
  IconStethoscope, IconSearch, IconChevronDown, IconChevronUp, IconX,
  IconCheck, IconArrowRight, IconHeart, IconBrain, IconBone,
  IconBabyCarriage, IconDroplet, IconDental, IconActivity, IconCalendar,
  IconUsers, IconShieldCheck, IconLock, IconDeviceMobile, IconMail, IconLoader2,
  IconTicket, IconPrinter, IconEdit, IconCircleCheck, IconAlertTriangle, IconAlertCircle,
  IconChevronLeft, IconChevronRight, IconCopy
} from '@tabler/icons-react'
import useSpecialties from '../hooks/useSpecialties'
import { getDoctors, getDoctorById } from '../api/doctorApi'
import { getBookedSlots, createAppointment } from '../api/appointmentApi'
import { sendOtp, verifyOtp, patientCheckIdentifier } from '../api/authApi'
import { useAuth } from '../context/AuthContext'
import SeoHead from '../components/common/SeoHead'
import { toast } from 'react-hot-toast'
import {
  getBangladeshDateStr,
  getBangladeshTodayStr,
  getBangladeshTomorrowStr,
  getDayNameFromDateStr,
  dayNameToBn
} from '../utils/dateUtils'

const enToBnDigits = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBengaliNumber = (str) => (str !== null && str !== undefined && str !== '') ? String(str).replace(/\d/g, d => enToBnDigits[d] || d) : ''

const bnMonths = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
const bnMonthsShort = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে']
const bnDaysShort = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি']

export default function QuickAppointmentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { specialties } = useSpecialties()

  // Date selection state
  const [dateMode, setDateMode] = useState('today') // 'today', 'tomorrow', 'next_7_days', 'custom'
  const [customDate, setCustomDate] = useState('')
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [selectedAppointmentDate, setSelectedAppointmentDate] = useState('')

  // Specialty selection state
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState(searchParams.get('specialty_id') || '')
  const [specialtySearch, setSpecialtySearch] = useState('')
  const [isSpecialtyDropdownOpen, setIsSpecialtyDropdownOpen] = useState(false)
  const [isAllSpecialtiesModalOpen, setIsAllSpecialtiesModalOpen] = useState(false)

  // Doctor selection state
  const [doctorsList, setDoctorsList] = useState([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [doctorSearch, setDoctorSearch] = useState('')
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false)

  // Chamber selection state
  const [selectedChamberId, setSelectedChamberId] = useState('')

  // Slot selection state
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [showAllSlots, setShowAllSlots] = useState(false)

  // Auth context
  const {
    user,
    token,
    isLoggedIn,
    storeAuth,
    isAdmin,
    isDoctor,
    isManager,
    isStaff
  } = useAuth() || {}

  const isPrivilegedStaff = Boolean(isAdmin || isDoctor || isManager || isStaff)

  // Booking Wizard Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [modalStep, setModalStep] = useState(1) // 1: Who for, 1.5: Relative info, 2: Phone, 3: OTP, 4: Confirm info, 5: Success ticket
  const [bookingFor, setBookingFor] = useState('myself') // 'myself' or 'relative'

  // Relative info form
  const [relativeForm, setRelativeForm] = useState({
    name: '',
    age: '',
    gender: 'পুরুষ',
    phone: '',
    relation: 'পিতা'
  })
  const [relativeErrors, setRelativeErrors] = useState({
    name: '',
    age: '',
    phone: ''
  })

  // Patient name for 'myself' when unauthenticated
  const [selfPatientName, setSelfPatientName] = useState('')
  const [selfNameError, setSelfNameError] = useState('')

  // Booker name when unauthenticated and booking for relative
  const [bookerName, setBookerName] = useState('')
  const [bookerNameError, setBookerNameError] = useState('')

  // Auth & OTP state
  const [mobileNumber, setMobileNumber] = useState('')
  const [phoneInputError, setPhoneInputError] = useState('')
  const [isEditingCustomMobile, setIsEditingCustomMobile] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpTimer, setOtpTimer] = useState(0)
  const [isOtpSending, setIsOtpSending] = useState(false)
  const [isOtpVerifying, setIsOtpVerifying] = useState(false)
  const [isOtpVerified, setIsOtpVerified] = useState(false)
  const [isSubmittingAppointment, setIsSubmittingAppointment] = useState(false)
  const [bookingErrorModal, setBookingErrorModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    viewAppointments: false,
    confirmText: 'ঠিক আছে',
    onConfirm: null
  })

  // Live OTP countdown timer (active whenever cooldown is remaining)
  useEffect(() => {
    if (otpTimer <= 0) return
    const interval = setInterval(() => {
      setOtpTimer(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [otpTimer])

  // Helper to format seconds to Bengali MM:SS
  const formatOtpTimerBn = (seconds) => {
    const s = Math.max(0, parseInt(seconds, 10) || 0)
    const m = Math.floor(s / 60)
    const remS = s % 60
    const mStr = m < 10 ? `0${m}` : `${m}`
    const sStr = remS < 10 ? `0${remS}` : `${remS}`
    return `${toBengaliNumber(mStr)}:${toBengaliNumber(sStr)}`
  }

  // Auto-registered new account credentials state
  const [newAccountCredentials, setNewAccountCredentials] = useState(null)

  // Phone check in users table
  const [phoneCheck, setPhoneCheck] = useState({
    checking: false,
    checked: false,
    isRegistered: false,
    message: ''
  })
  const [registeredPhoneNotice, setRegisteredPhoneNotice] = useState(null)
  const [step2Error, setStep2Error] = useState('')
  const [otpNotice, setOtpNotice] = useState('')

  // Confirmed appointment ticket result
  const [confirmedAppointmentData, setConfirmedAppointmentData] = useState(null)

  // Sync logged in user mobile if available
  useEffect(() => {
    if (user?.mobile || user?.phone) {
      setMobileNumber(user.mobile || user.phone)
      if (user.name && !selfPatientName) {
        setSelfPatientName(user.name)
      }
    }
  }, [user])

  // Compute dynamic formatted date string (YYYY-MM-DD) strictly in Asia/Dhaka
  const selectedDateStr = useMemo(() => {
    if (dateMode === 'today') {
      return getBangladeshTodayStr()
    }
    if (dateMode === 'tomorrow') {
      return getBangladeshTomorrowStr()
    }
    if (dateMode === 'custom' && customDate) {
      return customDate
    }
    return getBangladeshTodayStr()
  }, [dateMode, customDate])

  // Helper to format custom date string to Bengali (e.g. 2026-10-15 -> ১৫ অক্টোবর)
  const formatCustomDateBn = (dateStr) => {
    if (!dateStr) return 'তারিখ দিন'
    try {
      const [y, m, d] = dateStr.split('-').map(Number)
      return `${toBengaliNumber(d)} ${bnMonths[m - 1]}`
    } catch {
      return dateStr
    }
  }

  // Helper to check if a chamber is open on a given date (strictly in Asia/Dhaka)
  const isChamberOpenOnDate = (chamber, dateStrOrObj) => {
    if (!chamber) return false
    const dateStr = typeof dateStrOrObj === 'string' ? dateStrOrObj : getBangladeshDateStr(dateStrOrObj)
    const dayEn = getDayNameFromDateStr(dateStr).toLowerCase()
    const dayBn = (dayNameToBn[dayEn.charAt(0).toUpperCase() + dayEn.slice(1)] || '').toLowerCase()
    const dayShortBn = dayBn.slice(0, 3)
    const dayShortEn = dayEn.slice(0, 3)

    const rawDayStr = [
      chamber.day,
      chamber.day_bn,
      Array.isArray(chamber.days) ? chamber.days.join(' ') : chamber.days
    ].filter(Boolean).join(' ').toLowerCase()

    if (!rawDayStr) return true
    if (
      rawDayStr.includes('daily') ||
      rawDayStr.includes('everyday') ||
      rawDayStr.includes('every day') ||
      rawDayStr.includes('প্রতিদিন') ||
      rawDayStr.includes('সব দিন')
    ) {
      return true
    }

    return (
      rawDayStr.includes(dayEn) ||
      rawDayStr.includes(dayBn) ||
      rawDayStr.includes(dayShortBn) ||
      rawDayStr.includes(dayShortEn)
    )
  }

  // All doctor chambers (active ones)
  const doctorChambers = useMemo(() => {
    if (!selectedDoctor?.chambers) return []
    return selectedDoctor.chambers.filter(c => c.is_active !== 0 && c.is_active !== false)
  }, [selectedDoctor])

  // Filter doctor chambers to ONLY show chambers open on selectedDateStr
  const filteredChambers = useMemo(() => {
    if (!doctorChambers || doctorChambers.length === 0) return []
    if (!selectedDateStr) return doctorChambers
    return doctorChambers.filter(ch => isChamberOpenOnDate(ch, selectedDateStr))
  }, [doctorChambers, selectedDateStr])

  // Compute doctor's next available date if no chamber open on current selectedDateStr
  const nextAvailableInfo = useMemo(() => {
    if (!selectedDoctor || !doctorChambers || doctorChambers.length === 0) return null
    if (filteredChambers.length > 0) return null

    // Search upcoming 14 days in Asia/Dhaka
    const todayStr = getBangladeshTodayStr()
    const [y, m, d] = todayStr.split('-').map(Number)
    const baseDate = new Date(y, m - 1, d, 12, 0, 0)

    for (let i = 1; i <= 14; i++) {
      const nextDate = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000)
      const nextDateStr = getBangladeshDateStr(nextDate)
      const matches = doctorChambers.filter(ch => isChamberOpenOnDate(ch, nextDateStr))
      if (matches.length > 0) {
        const dayEn = getDayNameFromDateStr(nextDateStr)
        const dayBn = dayNameToBn[dayEn] || dayEn
        const [ny, nm, nd] = nextDateStr.split('-').map(Number)
        const dateBn = `${toBengaliNumber(nd)} ${bnMonths[nm - 1]}`
        return {
          dateStr: nextDateStr,
          dayLabel: i === 1 ? 'আগামীকাল' : `${dayBn} (${dateBn})`,
          chamber: matches[0],
          isTomorrow: i === 1
        }
      }
    }
    return null
  }, [selectedDoctor, doctorChambers, filteredChambers, selectedDateStr])

  // Handle 1-click jump to doctor's next available chamber schedule
  const handleJumpToNextAvailable = () => {
    if (!nextAvailableInfo) return
    if (nextAvailableInfo.isTomorrow) {
      setDateMode('tomorrow')
    } else {
      setDateMode('custom')
      setCustomDate(nextAvailableInfo.dateStr)
    }
    setSelectedAppointmentDate(nextAvailableInfo.dateStr)
    if (nextAvailableInfo.chamber) {
      setSelectedChamberId(String(nextAvailableInfo.chamber.id))
    }
  }

  // Auto-select chamber if doctor has only 1 matching open chamber on selected date
  useEffect(() => {
    if (selectedDoctor && filteredChambers.length > 0) {
      if (filteredChambers.length === 1) {
        setSelectedChamberId(String(filteredChambers[0].id))
      } else {
        if (!filteredChambers.some(c => String(c.id) === String(selectedChamberId))) {
          setSelectedChamberId('')
        }
      }
    } else {
      setSelectedChamberId('')
    }
  }, [selectedDoctor, filteredChambers])

  // Compute Bengali labels for date chips (strictly in Asia/Dhaka)
  const dateLabels = useMemo(() => {
    const todayStr = getBangladeshTodayStr()
    const tomorrowStr = getBangladeshTomorrowStr()

    const formatBnFromStr = (str) => {
      const [y, m, d] = str.split('-').map(Number)
      return `${toBengaliNumber(d)} ${bnMonths[m - 1]}`
    }

    return {
      today: formatBnFromStr(todayStr),
      tomorrow: formatBnFromStr(tomorrowStr)
    }
  }, [])

  // Fetch doctors dynamically when specialty, search or date changes
  useEffect(() => {
    let isMounted = true
    setLoadingDoctors(true)
    const params = { per_page: 50 }
    if (selectedSpecialtyId) params.specialty_id = selectedSpecialtyId
    if (doctorSearch.trim()) params.search = doctorSearch.trim()
    params.date = dateMode === 'custom' ? (customDate || 'today') : dateMode

    getDoctors(params)
      .then((res) => {
        if (!isMounted) return
        const docs = res.data?.data || res.data || []
        setDoctorsList(docs)

        // Clear selected doctor if they are no longer in the filtered list
        if (selectedDoctor && !docs.some(d => String(d.id) === String(selectedDoctor.id))) {
          setSelectedDoctor(null)
          setSelectedChamberId('')
        }
      })
      .catch(() => {
        if (isMounted) setDoctorsList([])
      })
      .finally(() => {
        if (isMounted) setLoadingDoctors(false)
      })

    return () => { isMounted = false }
  }, [selectedSpecialtyId, doctorSearch, dateMode, customDate])

  // Helper to format Chamber display label with Hospital Name (without address) and Day info
  const getChamberLabel = (ch) => {
    if (!ch) return 'চেম্বার'
    const hospName = ch.hospital?.name_bn || ch.hospital?.name_en || ch.hospital?.name || ch.hospital_name || ch.chamber_name_bn || ch.chamber_name || 'হাসপাতাল/চেম্বার'
    
    const dayNameBn = ch.day_bn || (ch.day ? (
      { 'saturday': 'শনিবার', 'sunday': 'রবিবার', 'monday': 'সোমবার', 'tuesday': 'মঙ্গলবার', 'wednesday': 'বুধবার', 'thursday': 'বৃহস্পতিবার', 'friday': 'শুক্রবার' }[String(ch.day).toLowerCase()] || ch.day
    ) : '')

    if (dayNameBn) {
      return `${hospName} (${dayNameBn})`
    }
    return hospName
  }

  // Format time to Bengali (e.g. "5:00 PM" -> "বিকাল ৫:০০")
  const formatTimeBn = (timeStr) => {
    if (!timeStr) return ''
    try {
      const parts = String(timeStr).trim().split(' ')
      const [h, m] = (parts[0] || '').split(':').map(Number)
      const period = (parts[1] || '').toUpperCase()

      let periodBn = ''
      if (period === 'AM') {
        periodBn = (h >= 6 && h < 12) ? 'সকাল' : 'রাত'
      } else {
        if (h === 12 || h < 3) periodBn = 'দুপুর'
        else if (h >= 3 && h < 6) periodBn = 'বিকাল'
        else if (h >= 6 && h < 8) periodBn = 'সন্ধ্যা'
        else periodBn = 'রাত'
      }

      const time12Bn = `${toBengaliNumber(h)}:${toBengaliNumber(m < 10 ? '0' + m : m)}`
      return `${periodBn} ${time12Bn}`
    } catch {
      return timeStr
    }
  }

  // Dynamic Serial & Time Slot Generator based on Chamber Operating Hours
  const generateSlotsForChamber = (chamber, bookedTimes = []) => {
    if (!chamber) return []

    const startTimeStr = chamber.start_time || '17:00'
    const endTimeStr = chamber.end_time || '21:00'

    const parseTimeToMinutes = (tStr) => {
      if (!tStr) return 17 * 60
      const clean = String(tStr).trim()
      const [h, m] = clean.split(':').map(Number)
      return (isNaN(h) ? 17 : h) * 60 + (isNaN(m) ? 0 : m)
    }

    const startMin = parseTimeToMinutes(startTimeStr)
    const endMin = parseTimeToMinutes(endTimeStr)

    const slots = []
    const step = Math.max(5, Number(chamber?.slot_duration_minutes) || 15)

    for (let min = startMin; min < endMin; min += step) {
      const h = Math.floor(min / 60)
      const m = min % 60
      const period = h >= 12 ? 'PM' : 'AM'
      const displayH = h % 12 === 0 ? 12 : h % 12
      const displayM = m < 10 ? `0${m}` : m

      const time12 = `${displayH}:${displayM} ${period}`
      const time12Pad = `${displayH < 10 ? '0' + displayH : displayH}:${displayM} ${period}`
      const time24 = `${h < 10 ? '0' + h : h}:${displayM}`
      const timeBnStr = formatTimeBn(time12)

      // Check if slot is taken in any formatted representation
      const isBooked = (bookedTimes || []).some(b => {
        const s = String(b).trim().toLowerCase()
        return (
          s === time12.toLowerCase() ||
          s === time12Pad.toLowerCase() ||
          s === time24.toLowerCase() ||
          s.startsWith(time24) ||
          s.includes(time12.toLowerCase())
        )
      })

      slots.push({
        value: time12,
        label: timeBnStr,
        isBooked: Boolean(isBooked)
      })
    }

    // Fallback slot list if slots couldn't be computed from start/end times
    if (slots.length === 0) {
      for (let i = 1; i <= 15; i++) {
        const fallbackVal = `Time-${i}`
        const isBooked = (bookedTimes || []).some(b => String(b).includes(fallbackVal))
        slots.push({
          value: fallbackVal,
          label: `সময়সূচী ${toBengaliNumber(i)}`,
          isBooked: Boolean(isBooked)
        })
      }
    }

    return slots
  }

  // Fetch available slots when doctor, date or chamber changes
  useEffect(() => {
    if (!selectedDoctor?.id || !selectedDateStr || !selectedChamberId) {
      setAvailableSlots([])
      setSelectedTimeSlot('')
      return
    }

    const currentChamber = (doctorChambers || []).find(c => String(c.id) === String(selectedChamberId))

    const refreshSlots = (isInitial = false) => {
      if (isInitial) setLoadingSlots(true)
      getBookedSlots(selectedDoctor.id, { date: selectedDateStr, chamber_id: selectedChamberId })
        .then((res) => {
          const booked = res.data?.booked_slots || res.data?.booked || []
          const generated = generateSlotsForChamber(currentChamber, booked)
          setAvailableSlots(generated)
          if (isInitial) {
            const firstAvailable = generated.find(s => !s.isBooked)
            if (firstAvailable) {
              setSelectedTimeSlot(firstAvailable.value)
            } else {
              setSelectedTimeSlot('')
            }
          } else {
            // If currently selected slot became booked in background, deselect and inform
            setSelectedTimeSlot(prev => {
              if (prev && booked.includes(prev)) {
                toast.error('আপনার নির্বাচিত সময় স্লটটি এইমাত্র অন্য কেউ বুক করে ফেলেছেন। অন্য স্লট বেছে নিন।', { id: 'slot-poll-alert' })
                return ''
              }
              return prev
            })
          }
        })
        .catch(() => {
          if (isInitial) {
            const generated = generateSlotsForChamber(currentChamber, [])
            setAvailableSlots(generated)
            const firstAvailable = generated.find(s => !s.isBooked)
            setSelectedTimeSlot(firstAvailable ? firstAvailable.value : '')
          }
        })
        .finally(() => {
          if (isInitial) setLoadingSlots(false)
        })
    }

    refreshSlots(true)
    const interval = setInterval(() => {
      if (isBookingModalOpen && modalStep === 1) {
        refreshSlots(false)
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [selectedDoctor, selectedDateStr, selectedChamberId, doctorChambers, isBookingModalOpen, modalStep])

  // Reset showAllSlots when doctor, date or chamber changes
  useEffect(() => {
    setShowAllSlots(false)
  }, [selectedDoctor?.id, selectedDateStr, selectedChamberId])

  // If the user's selected slot is beyond the first 6 slots, auto-expand so it remains visible
  useEffect(() => {
    if (selectedTimeSlot && availableSlots.length > 0) {
      const idx = availableSlots.findIndex(s => (typeof s === 'object' ? s.value : s) === selectedTimeSlot)
      if (idx >= 6) {
        setShowAllSlots(true)
      }
    }
  }, [selectedTimeSlot, availableSlots])

  // Visible slots based on showAllSlots toggle (default: first 6 slots)
  const visibleSlots = useMemo(() => {
    if (showAllSlots || availableSlots.length <= 6) {
      return availableSlots
    }
    return availableSlots.slice(0, 6)
  }, [availableSlots, showAllSlots])

  // Click outside listener refs for dropdowns and auto-scroll refs for errors
  const specRef = useRef(null)
  const docRef = useRef(null)
  const chamberRef = useRef(null)
  const slotRef = useRef(null)

  // Form errors state for inline field validation
  const [formErrors, setFormErrors] = useState({
    doctor: '',
    chamber: '',
    slot: ''
  })

  // Clear errors dynamically when selections change
  useEffect(() => {
    if (selectedDoctor) setFormErrors(prev => ({ ...prev, doctor: '' }))
  }, [selectedDoctor])

  useEffect(() => {
    if (selectedChamberId) setFormErrors(prev => ({ ...prev, chamber: '' }))
  }, [selectedChamberId])

  useEffect(() => {
    if (selectedTimeSlot) setFormErrors(prev => ({ ...prev, slot: '' }))
  }, [selectedTimeSlot])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (specRef.current && !specRef.current.contains(e.target)) {
        setIsSpecialtyDropdownOpen(false)
      }
      if (docRef.current && !docRef.current.contains(e.target)) {
        setIsDoctorDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Selected specialty object
  const selectedSpecialtyObj = useMemo(() => {
    return specialties.find(s => String(s.id) === String(selectedSpecialtyId))
  }, [specialties, selectedSpecialtyId])

  // Filtered specialties for dropdown search
  const filteredSpecialties = useMemo(() => {
    if (!specialtySearch.trim()) return specialties
    const q = specialtySearch.toLowerCase()
    return specialties.filter(s => (s.name || '').toLowerCase().includes(q) || (s.name_bn || '').includes(q))
  }, [specialties, specialtySearch])

  // Open Wizard Handler with Inline Field Validation
  const handleProceedBooking = () => {
    const errors = { doctor: '', chamber: '', slot: '' }
    let hasErr = false

    if (!selectedDoctor) {
      errors.doctor = 'অনুগ্রহ করে একজন ডাক্তার নির্বাচন করুন।'
      hasErr = true
    }
    if (!selectedChamberId) {
      errors.chamber = 'অনুগ্রহ করে ডাক্তারের একটি চেম্বার সিলেক্ট করুন।'
      hasErr = true
    }
    const chosenSlotObj = availableSlots.find(s => (typeof s === 'object' ? s.value : s) === selectedTimeSlot)
    if (!selectedTimeSlot) {
      errors.slot = 'অনুগ্রহ করে সিরিয়াল বা সময় নির্বাচন করুন।'
      hasErr = true
    } else if (chosenSlotObj && chosenSlotObj.isBooked) {
      errors.slot = 'নির্বাচিত সময়টি ইতিমধ্যে বুক করা হয়েছে। অনুগ্রহ করে অন্য সময় নির্বাচন করুন।'
      hasErr = true
    }

    if (hasErr) {
      setFormErrors(errors)
      // Auto scroll to the first invalid field
      if (errors.doctor && docRef.current) {
        docRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (errors.chamber && chamberRef.current) {
        chamberRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (errors.slot && slotRef.current) {
        slotRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setFormErrors({ doctor: '', chamber: '', slot: '' })
    setModalStep(1)
    setOtp('')
    setOtpNotice('')
    setStep2Error('')
    setIsBookingModalOpen(true)
  }

  // Handle Close Booking Wizard
  const handleCloseWizard = () => {
    setIsBookingModalOpen(false)
    setOtp('')
    setOtpNotice('')
    setStep2Error('')
    setRegisteredPhoneNotice(null)
    setRelativeErrors({ name: '', age: '', phone: '' })
    setPhoneInputError('')
    setSelfNameError('')
    setBookerNameError('')
  }

  // Handle Step 1 Next
  const handleStep1Next = () => {
    if (isLoggedIn && (user?.phone || user?.mobile) && !mobileNumber) {
      setMobileNumber(user.phone || user.mobile)
    }
    if (bookingFor === 'relative') {
      setModalStep(1.5)
      return
    }
    // Privileged Staff (Doctor, Hospital, Admin): Direct to Step 4, NO OTP!
    if (isPrivilegedStaff) {
      setModalStep(4)
      return
    }
    setModalStep(2)
  }

  // Handle Step 1.5 Relative Info Submit
  const handleRelativeInfoSubmit = (e) => {
    if (e) e.preventDefault()
    const newErrors = { name: '', age: '', phone: '' }
    let hasError = false

    if (!relativeForm.name.trim()) {
      newErrors.name = 'রোগীর পূর্ণ নাম লিখুন'
      hasError = true
    }

    const cleanAge = relativeForm.age.trim()
    if (!cleanAge) {
      newErrors.age = 'রোগীর বয়স লিখুন'
      hasError = true
    } else {
      const parsedAge = parseInt(cleanAge, 10)
      if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
        newErrors.age = 'সঠিক বয়স লিখুন (১ থেকে ১২০ এর মধ্যে)'
        hasError = true
      }
    }

    if (relativeForm.phone && relativeForm.phone.trim()) {
      const cleanPhone = relativeForm.phone.replace(/\D/g, '')
      if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
        newErrors.phone = 'সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)'
        hasError = true
      }
    }

    setRelativeErrors(newErrors)
    if (hasError) return

    // Privileged Staff (Doctor, Hospital, Admin): Direct to Step 4, NO OTP!
    if (isPrivilegedStaff) {
      if (relativeForm.phone) {
        setMobileNumber(relativeForm.phone.replace(/\D/g, ''))
      } else if (user?.phone || user?.mobile) {
        setMobileNumber(user.phone || user.mobile)
      }
      setPhoneInputError('')
      setModalStep(4)
      return
    }

    // For Booker's OTP step: If logged in, keep/restore booker's own phone. Do NOT overwrite with relative's phone.
    if (isLoggedIn && (user?.phone || user?.mobile)) {
      setMobileNumber(user.phone || user.mobile)
    }
    setPhoneInputError('')
    setModalStep(2)
  }

  // Handle Send OTP
  const handleSendOtpSubmit = async (e) => {
    if (e) e.preventDefault()
    if (isOtpSending) return
    if (otpTimer > 0) {
      toast.error(`অনুগ্রহ করে ${otpTimer} সেকেন্ড অপেক্ষা করুন`, { id: 'otp-wait' })
      return
    }

    const cleanMobile = (mobileNumber || user?.phone || user?.mobile || '').replace(/\D/g, '')
    if (mobileNumber !== cleanMobile) {
      setMobileNumber(cleanMobile)
    }

    setPhoneInputError('')
    setSelfNameError('')
    setBookerNameError('')

    // 1. Strict Bangladeshi 11-digit mobile validation (013 - 019)
    if (!cleanMobile || cleanMobile.length !== 11 || !/^01[3-9]\d{8}$/.test(cleanMobile)) {
      setPhoneInputError('সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX বা 019XXXXXXXX)')
      return
    }

    // 2. Full Name validation for unauthenticated booking
    if (bookingFor === 'myself' && !isLoggedIn && !selfPatientName.trim()) {
      setSelfNameError('আপনার পূর্ণ নাম লিখুন')
      return
    }
    if (bookingFor === 'relative' && !isLoggedIn && !bookerName.trim()) {
      setBookerNameError('আপনার (বুকিংকারীর) পূর্ণ নাম লিখুন')
      return
    }

    setIsOtpSending(true)
    setStep2Error('')

    // 3. Check if number is registered in users table ONLY for unauthenticated guest booking
    try {
      if (!isLoggedIn) {
        let isRegistered = false
        try {
          const checkRes = await patientCheckIdentifier({ identifier: cleanMobile })
          isRegistered = Boolean(checkRes.data?.is_registered || checkRes.data?.success)
        } catch {
          isRegistered = false
        }

        // If registered: Strictly BLOCK OTP sending for unauthenticated guest and alert smartly
        if (isRegistered) {
          setRegisteredPhoneNotice({
            phone: cleanMobile,
            message: 'এই মোবাইল নম্বরটি ইতিমধ্যে আমাদের সিস্টেমে নিবন্ধিত আছে।'
          })
          setIsOtpSending(false)
          return
        }
      }

      // If NOT registered or already logged-in: proceed with OTP sending
      setRegisteredPhoneNotice(null)
      setOtpNotice('')

      const rawTimeSlot = typeof selectedTimeSlot === 'object' ? selectedTimeSlot.value : selectedTimeSlot

      // 1. Instant live slot check right before sending OTP SMS to completely prevent SMS loss
      if (selectedDoctor?.id && selectedChamberId && selectedDateStr && rawTimeSlot) {
        try {
          const slotCheckRes = await getBookedSlots(selectedDoctor.id, { date: selectedDateStr, chamber_id: selectedChamberId })
          const booked = slotCheckRes.data?.booked_slots || slotCheckRes.data?.booked || []
          const currentChamber = (doctorChambers || []).find(c => String(c.id) === String(selectedChamberId))
          const generated = generateSlotsForChamber(currentChamber, booked)
          setAvailableSlots(generated)

          if (booked.includes(rawTimeSlot)) {
            setIsOtpSending(false)
            setSelectedTimeSlot('')
            setBookingErrorModal({
              isOpen: true,
              title: 'সময় স্লট বুক করা হয়েছে',
              message: 'এই সময় স্লটটি এইমাত্র অন্য একজন রোগী বুক করে ফেলেছেন। অনুগ্রহ করে অন্য সময় স্লট নির্বাচন করুন।',
              confirmText: 'সময় স্লট পরিবর্তন করুন',
              onConfirm: () => {
                setBookingErrorModal({ isOpen: false, title: '', message: '' })
                setModalStep(1)
              }
            })
            return
          }
        } catch (e) {
          console.warn('Pre-OTP slot check warning:', e)
        }
      }

      const res = await sendOtp({ 
        mobile: cleanMobile, 
        phone: cleanMobile, 
        type: 'appointment',
        doctor_id: selectedDoctor?.id,
        chamber_id: selectedChamberId,
        appointment_date: selectedDateStr,
        appointment_time: rawTimeSlot,
        booking_for: bookingFor,
        patient_name: bookingFor === 'relative' ? (relativeForm.name || '').trim() : (selfPatientName || user?.name || '').trim(),
        patient_phone: bookingFor === 'relative' ? (relativeForm.phone || '').trim() : cleanMobile
      })
      const cooldown = res.data?.cooldown_seconds || 60
      setOtpTimer(cooldown)
      setOtp('')
      toast.success('আপনার মোবাইলে ওটিপি কোড পাঠানো হয়েছে', { id: 'otp-ok' })
      setModalStep(3)
    } catch (err) {
      if (err.response?.data?.duplicate_booking || err.response?.data?.limit_exceeded) {
        setIsOtpSending(false)
        const msg = err.response?.data?.message || 'এই তারিখে এই ডাক্তারের জন্য ইতিমধ্যে একটি অ্যাপয়েন্টমেন্ট বুক করা রয়েছে।'
        setStep2Error(msg)
        setBookingErrorModal({
          isOpen: true,
          title: 'ইতিমধ্যে বুক করা হয়েছে',
          message: msg,
          viewAppointments: true,
          confirmText: 'ঠিক আছে',
          onConfirm: () => {
            setBookingErrorModal({ isOpen: false, title: '', message: '' })
            setIsBookingModalOpen(false)
            setModalStep(1)
            setStep2Error('')
            setOtpNotice('')
            setOtp('')
            setIsOtpVerified(false)
          }
        })
        return
      }
      if (err.response?.data?.slot_booked) {
        setIsOtpSending(false)
        setSelectedTimeSlot('')
        const msg = err.response?.data?.message || 'এই সময় স্লটটি ইতোমধ্যে অন্য একজন রোগী বুক করে ফেলেছেন। অনুগ্রহ করে অন্য সময় স্লট নির্বাচন করুন।'
        setBookingErrorModal({
          isOpen: true,
          title: 'সময় স্লট বুক করা হয়েছে',
          message: msg,
          confirmText: 'সময় স্লট পরিবর্তন করুন',
          onConfirm: () => {
            setBookingErrorModal({ isOpen: false, title: '', message: '' })
            setModalStep(1)
          }
        })
        return
      }
      if (err.response?.status === 429) {
        const cooldown = err.response?.data?.cooldown_seconds || err.response?.data?.retry_after_seconds || 60
        setOtpTimer(cooldown)
        const friendlyMsg = err.response?.data?.message || 'অতিরিক্ত ওটিপি অনুরোধের কারণে সাময়িক অপেক্ষা করতে হবে।'
        setStep2Error(friendlyMsg)
        setOtpNotice(friendlyMsg)
        setBookingErrorModal({
          isOpen: true,
          title: 'অতিরিক্ত অনুরোধ',
          message: friendlyMsg,
          confirmText: 'ঠিক আছে',
          onConfirm: () => {
            setBookingErrorModal({ isOpen: false, title: '', message: '' })
            setModalStep(3)
          }
        })
      } else {
        const friendlyMsg = err.response?.data?.message || 'ওটিপি পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
        setStep2Error(friendlyMsg)
        setBookingErrorModal({
          isOpen: true,
          title: 'ওটিপি পাঠানো যায়নি',
          message: friendlyMsg,
          confirmText: 'ঠিক আছে',
          onConfirm: () => {
            setBookingErrorModal({ isOpen: false, title: '', message: '' })
          }
        })
      }
    } finally {
      setIsOtpSending(false)
    }
  }

  // Handle Resend OTP in Step 3
  const handleResendOtp = async () => {
    if (otpTimer > 0 || isOtpSending) return
    const cleanMobile = (mobileNumber || user?.phone || user?.mobile || '').replace(/\D/g, '')
    if (!cleanMobile || cleanMobile.length !== 11) {
      setBookingErrorModal({
        isOpen: true,
        title: 'মোবাইল নম্বর পাওয়া যায়নি',
        message: 'অনুগ্রহ করে সঠিক মোবাইল নম্বর প্রদান করুন।',
        confirmText: 'ঠিক আছে',
        onConfirm: () => setBookingErrorModal({ isOpen: false, title: '', message: '' })
      })
      return
    }
    setIsOtpSending(true)
    setOtpNotice('')
    try {
      const rawTimeSlot = typeof selectedTimeSlot === 'object' ? selectedTimeSlot.value : selectedTimeSlot
      const res = await sendOtp({ 
        mobile: cleanMobile, 
        phone: cleanMobile, 
        type: 'appointment',
        doctor_id: selectedDoctor?.id,
        chamber_id: selectedChamberId,
        appointment_date: selectedDateStr,
        appointment_time: rawTimeSlot,
        booking_for: bookingFor,
        patient_name: bookingFor === 'relative' ? (relativeForm.name || '').trim() : (selfPatientName || user?.name || '').trim(),
        patient_phone: bookingFor === 'relative' ? (relativeForm.phone || '').trim() : cleanMobile
      })
      const cooldown = res.data?.cooldown_seconds || 60
      setOtpTimer(cooldown)
      setOtp('')
      toast.success('নতুন ওটিপি কোড পাঠানো হয়েছে', { id: 'resend-ok' })
    } catch (err) {
      if (err.response?.data?.duplicate_booking || err.response?.data?.limit_exceeded) {
        const msg = err.response?.data?.message || 'এই তারিখে এই ডাক্তারের জন্য ইতিমধ্যে একটি অ্যাপয়েন্টমেন্ট বুক করা রয়েছে।'
        setOtpNotice(msg)
        setBookingErrorModal({
          isOpen: true,
          title: 'ইতিমধ্যে বুক করা হয়েছে',
          message: msg,
          viewAppointments: true,
          confirmText: 'ঠিক আছে',
          onConfirm: () => {
            setBookingErrorModal({ isOpen: false, title: '', message: '' })
            setIsBookingModalOpen(false)
            setModalStep(1)
            setStep2Error('')
            setOtpNotice('')
            setOtp('')
            setIsOtpVerified(false)
          }
        })
        return
      }
      const cooldown = err.response?.data?.cooldown_seconds || err.response?.data?.retry_after_seconds || 60
      if (err.response?.status === 429) {
        setOtpTimer(cooldown)
        const friendlyMsg = err.response?.data?.message || 'অতিরিক্ত ওটিপি অনুরোধের কারণে সাময়িক অপেক্ষা করতে হবে।'
        setOtpNotice(friendlyMsg)
        setBookingErrorModal({
          isOpen: true,
          title: 'অতিরিক্ত অনুরোধ',
          message: friendlyMsg,
          confirmText: 'ঠিক আছে',
          onConfirm: () => setBookingErrorModal({ isOpen: false, title: '', message: '' })
        })
      } else {
        const friendlyMsg = err.response?.data?.message || 'ওটিপি পুনরায় পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
        setOtpNotice(friendlyMsg)
        setBookingErrorModal({
          isOpen: true,
          title: 'ওটিপি পাঠানো যায়নি',
          message: friendlyMsg,
          confirmText: 'ঠিক আছে',
          onConfirm: () => setBookingErrorModal({ isOpen: false, title: '', message: '' })
        })
      }
    } finally {
      setIsOtpSending(false)
    }
  }

  // Handle Verify OTP
  const handleVerifyOtpSubmit = async (e) => {
    if (e) e.preventDefault()
    if (isOtpVerifying) return

    const trimmedOtp = (otp || '').trim()
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setOtpNotice('সঠিক ৬ সংখ্যার ওটিপি কোডটি লিখুন')
      return
    }

    const cleanMobile = (mobileNumber || user?.phone || user?.mobile || '').replace(/\D/g, '')
    if (!cleanMobile || cleanMobile.length !== 11) {
      setOtpNotice('মোবাইল নম্বর পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।')
      return
    }

    setIsOtpVerifying(true)
    setOtpNotice('')
    const targetPatientName = bookingFor === 'relative' 
      ? relativeForm.name 
      : (selfPatientName.trim() || user?.name || 'রোগী')

    const authUserName = bookingFor === 'relative'
      ? (isLoggedIn ? (user?.name || 'বুকিংকারী') : (bookerName.trim() || 'বুকিংকারী'))
      : targetPatientName

    try {
      const res = await verifyOtp({
        mobile: cleanMobile,
        otp: trimmedOtp,
        auto_register: !isLoggedIn,
        type: 'quick_appointment',
        patient_name: authUserName
      })

      const resData = res.data || {}

      // 1. Immediately advance to Step 4 and clear error notices
      setIsOtpVerified(true)
      setOtpNotice('')
      setModalStep(4)

      // 2. Safely perform session storage in try-catch so it NEVER blocks transition to Step 4
      try {
        if (!isLoggedIn) {
          if (resData.token && typeof storeAuth === 'function') {
            storeAuth(resData.token, resData.user || { mobile: cleanMobile, name: targetPatientName }, 'patient')
          }

          if (resData.is_new_account && resData.credentials) {
            setNewAccountCredentials(resData.credentials)
          } else {
            setNewAccountCredentials(null)
          }
        } else {
          setNewAccountCredentials(null)
        }
      } catch (authErr) {
        console.warn('Session store warning:', authErr)
      }

      // 3. Optional non-blocking toast
      try {
        toast.success('ওটিপি সফলভাবে যাচাই করা হয়েছে', { id: 'otp-v-ok' })
      } catch {}
    } catch (err) {
      console.error('Verify OTP failed:', err)
      const rawMsg = err.response?.data?.message || err.response?.data?.error
      const errorMsg = rawMsg || (err.message && !err.message.includes('status code') ? err.message : 'ভুল ওটিপি কোড। অনুগ্রহ করে সঠিক কোডটি দিন।')
      setOtpNotice(errorMsg)
    } finally {
      setIsOtpVerifying(false)
    }
  }

  // Handle Finalize Appointment Submit
  const handleFinalizeAppointment = async () => {
    setIsSubmittingAppointment(true)
    const currentChamber = (doctorChambers || []).find(c => String(c.id) === String(selectedChamberId))
    const rawTimeSlot = typeof selectedTimeSlot === 'object' ? selectedTimeSlot.value : selectedTimeSlot

    const cleanRelPhone = relativeForm.phone ? relativeForm.phone.replace(/\D/g, '') : ''
    const patientDisplayName = bookingFor === 'relative' 
      ? relativeForm.name 
      : (selfPatientName.trim() || user?.name || 'রোগী')

    const payload = {
      doctor_id: selectedDoctor.id,
      chamber_id: selectedChamberId,
      appointment_date: selectedDateStr,
      appointment_time: rawTimeSlot || '17:00:00',
      booking_for: bookingFor,
      patient_name: patientDisplayName,
      patient_age: bookingFor === 'relative' ? relativeForm.age : '',
      patient_relation: bookingFor === 'relative' ? relativeForm.relation : '',
      patient_gender: bookingFor === 'relative' ? relativeForm.gender : '',
      patient_phone: bookingFor === 'relative' 
        ? (cleanRelPhone || (mobileNumber ? mobileNumber.replace(/\D/g, '') : ''))
        : (mobileNumber ? mobileNumber.replace(/\D/g, '') : ''),
      payment_status: 'Unpaid',
      notes: bookingFor === 'relative' 
        ? `আত্মীয়স্বজনের জন্য বুকিং (${relativeForm.relation || 'আত্মীয়'})${relativeForm.gender ? `, লিঙ্গ: ${relativeForm.gender}` : ''}${cleanRelPhone ? `, রোগীর ফোন: ${cleanRelPhone}` : ''}`
        : 'সরাসরি দ্রুত বুকিং'
    }

    try {
      const res = await createAppointment(payload)
      const appt = res.data?.data || res.data || {}
      setConfirmedAppointmentData({
        id: appt.public_id || appt.tracking_id || appt.id || 'AP-CONFIRMED',
        serial_number: appt.serial_number || res.data?.serial_number || '',
        doctor_name: selectedDoctor.name || selectedDoctor.name_bn,
        specialty: selectedDoctor.specialty?.name || selectedDoctor.specialty?.name_bn || selectedDoctor.specialty_name || 'বিশেষজ্ঞ',
        hospital_name: getChamberLabel(currentChamber),
        appointment_date: selectedDateStr,
        appointment_time: rawTimeSlot,
        patient_name: patientDisplayName,
        patient_phone: bookingFor === 'relative' ? (cleanRelPhone || (mobileNumber ? mobileNumber.replace(/\D/g, '') : '')) : (mobileNumber ? mobileNumber.replace(/\D/g, '') : ''),
        booking_for: bookingFor,
        relation: bookingFor === 'relative' ? relativeForm.relation : '',
        booker_phone: mobileNumber ? mobileNumber.replace(/\D/g, '') : '',
        payment_status: 'Unpaid (চেম্বারে দিবেন)'
      })
      setModalStep(5)
      toast.success('অ্যাপয়েন্টমেন্ট বুকিং সফল হয়েছে!', { id: 'book-ok' })
    } catch (err) {
      console.error('Appointment booking failed:', err)
      let errorMsg = err.response?.data?.message || err.response?.data?.error || 'অ্যাপয়েন্টমেন্ট বুকিং সম্পন্ন করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
      const validationErrors = err.response?.data?.errors

      if (validationErrors && typeof validationErrors === 'object') {
        const errorEntries = Object.entries(validationErrors)
        if (errorEntries.length > 0) {
          const [firstField, fieldMsgs] = errorEntries[0]
          const firstMsg = Array.isArray(fieldMsgs) ? fieldMsgs[0] : fieldMsgs

          if (firstField === 'appointment_time') {
            errorMsg = 'অনুগ্রহ করে অ্যাপয়েন্টমেন্টের জন্য একটি বৈধ সময় স্লট নির্বাচন করুন।'
          } else if (firstField === 'appointment_date') {
            errorMsg = 'অনুগ্রহ করে সঠিক অ্যাপয়েন্টমেন্টের তারিখ নির্বাচন করুন।'
          } else if (firstField === 'doctor_id' || firstField === 'chamber_id') {
            errorMsg = 'ডাক্তার বা চেম্বার সঠিকভাবে নির্বাচন করা হয়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
          } else if (firstField === 'payment_status') {
            errorMsg = 'পেমেন্ট পদ্ধতি সঠিকভাবে নির্বাচন করা হয়নি।'
          } else if (firstMsg) {
            errorMsg = firstMsg
          }
        }
      }

      if (!errorMsg || errorMsg.toLowerCase().includes('validation failed')) {
        errorMsg = 'প্রদত্ত তথ্যে কিছু অসম্পূর্ণতা রয়েছে। অনুগ্রহ করে তারিখ, সময় স্লট ও রোগীর তথ্য পুনরায় যাচাই করুন।'
      }

      setIsBookingModalOpen(false)
      setBookingErrorModal({
        isOpen: true,
        title: 'বুকিং সম্পন্ন করা সম্ভব হয়নি',
        message: errorMsg
      })
    } finally {
      setIsSubmittingAppointment(false)
    }
  }

  // Handle printing single clean one-page appointment slip
  const handlePrintSlip = () => {
    if (!confirmedAppointmentData) return

    const trackingId = confirmedAppointmentData.id || ''
    const serialNumber = confirmedAppointmentData.serial_number ? toBengaliNumber(confirmedAppointmentData.serial_number) : ''
    const doctorName = confirmedAppointmentData.doctor_name || ''
    const specialty = confirmedAppointmentData.specialty || ''
    const hospitalName = confirmedAppointmentData.hospital_name || ''
    const appointmentDate = confirmedAppointmentData.appointment_date || ''
    const appointmentTime = confirmedAppointmentData.appointment_time || ''
    const patientName = confirmedAppointmentData.patient_name || ''
    const patientPhone = confirmedAppointmentData.patient_phone || ''
    const patientRelation = confirmedAppointmentData.relation || ''
    const paymentStatus = confirmedAppointmentData.payment_status || 'Unpaid (চেম্বারে দিবেন)'
    const cleanMobile = confirmedAppointmentData.booker_phone || mobileNumber || ''
    const isRelative = confirmedAppointmentData.booking_for === 'relative'

    const credentialsHtml = newAccountCredentials ? `
      <div style="background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 700; color: #065F46; margin-bottom: 8px;">
          ✓ রোগী অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে (ভবিষ্যতে লগইনের জন্য সংরক্ষণ করুন):
        </div>
        <div style="display: flex; gap: 20px; font-size: 13px; color: #0F172A; flex-wrap: wrap;">
          <div><span style="color: #64748B;">পাবলিক আইডি:</span> <strong>${newAccountCredentials.patient_public_id || 'N/A'}</strong></div>
          <div><span style="color: #64748B;">লগইন মোবাইল:</span> <strong>${newAccountCredentials.login_phone || cleanMobile}</strong></div>
          <div><span style="color: #64748B;">পাসওয়ার্ড:</span> <strong style="color: #059669; letter-spacing: 1px;">${newAccountCredentials.temp_password || 'N/A'}</strong></div>
        </div>
      </div>
    ` : ''

    const printHtml = `
      <!DOCTYPE html>
      <html lang="bn">
      <head>
        <meta charset="UTF-8">
        <title>DoctorBooklet Appointment Slip - ${trackingId}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 20mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 10px;
            background: #ffffff;
            color: #0F172A;
            font-family: 'Hind Siliguri', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
          }
          .ticket-card {
            width: 100%;
            max-width: 650px;
            margin: 0 auto;
            border: 2px solid #00B875;
            border-radius: 16px;
            padding: 24px 28px;
            background: #ffffff;
            page-break-inside: avoid;
          }
          .ticket-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px dashed #E2E8F0;
            padding-bottom: 14px;
            margin-bottom: 16px;
          }
          .brand-logo {
            font-size: 22px;
            font-weight: 800;
            color: #00B875;
            letter-spacing: -0.5px;
          }
          .brand-sub {
            font-size: 12px;
            color: #64748B;
            font-weight: 500;
          }
          .tracking-badge {
            text-align: right;
            background: #F0FDF4;
            border: 1px solid #BBF7D0;
            padding: 6px 14px;
            border-radius: 10px;
          }
          .tracking-label {
            font-size: 11px;
            color: #166534;
            font-weight: 600;
          }
          .tracking-id {
            font-size: 18px;
            font-weight: 800;
            color: #0F172A;
            font-family: monospace, sans-serif;
            letter-spacing: 1px;
          }
          .title-banner {
            background: #F8FAFC;
            border-radius: 10px;
            padding: 9px 14px;
            margin-bottom: 16px;
            text-align: center;
          }
          .title-banner h2 {
            margin: 0;
            font-size: 17px;
            font-weight: 800;
            color: #0F172A;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          .info-table td {
            padding: 9px 12px;
            font-size: 14px;
            border-bottom: 1px solid #F1F5F9;
            vertical-align: top;
          }
          .info-table td.label {
            width: 32%;
            font-weight: 700;
            color: #475569;
          }
          .info-table td.value {
            width: 68%;
            font-weight: 600;
            color: #0F172A;
          }
          .highlight-doc {
            font-size: 16.5px;
            font-weight: 800;
            color: #0F172A;
          }
          .highlight-spec {
            font-size: 13px;
            color: #00B875;
            font-weight: 700;
            margin-top: 2px;
          }
          .payment-badge {
            display: inline-block;
            background: #FEF3C7;
            color: #B45309;
            border: 1px solid #FDE68A;
            padding: 3px 10px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 13px;
          }
          .instructions-box {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 10px;
            padding: 12px 14px;
            font-size: 12.5px;
            color: #475569;
            line-height: 1.6;
            margin-bottom: 16px;
          }
          .instructions-box strong {
            color: #1E293B;
          }
          .ticket-footer {
            text-align: center;
            font-size: 11px;
            color: #94A3B8;
            border-top: 1px solid #E2E8F0;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="ticket-card">
          <div class="ticket-header">
            <div>
              <div class="brand-logo">🩺 DoctorBooklet</div>
              <div class="brand-sub">স্মার্ট অনলাইন ডাক্তার সিরিয়াল ও বুকিং প্ল্যাটফর্ম</div>
            </div>
            <div class="tracking-badge">
              <div class="tracking-label">অ্যাপয়েন্টমেন্ট ট্র্যাকিং আইডি</div>
              <div class="tracking-id">${trackingId}</div>
              ${serialNumber ? `<div style="font-size: 13.5px; font-weight: 800; color: #00B875; margin-top: 4px;">সিরিয়াল নং: ${serialNumber}</div>` : ''}
            </div>
          </div>

          <div class="title-banner">
            <h2>অ্যাপয়েন্টমেন্ট কনফার্মেশন ও রোগী প্রবেশপত্র (Confirmation Slip)</h2>
          </div>

          ${credentialsHtml}

          <table class="info-table">
            ${serialNumber ? `
            <tr>
              <td class="label">সিরিয়াল নম্বর:</td>
              <td class="value">
                <strong style="color: #00B875; font-size: 16px;">${serialNumber}</strong>
              </td>
            </tr>
            ` : ''}
            <tr>
              <td class="label">ডাক্তারের নাম:</td>
              <td class="value">
                <span class="highlight-doc">${doctorName}</span>
                <div class="highlight-spec">${specialty}</div>
              </td>
            </tr>
            <tr>
              <td class="label">হাসপাতাল / চেম্বার:</td>
              <td class="value"><strong>${hospitalName}</strong></td>
            </tr>
            <tr>
              <td class="label">সাক্ষাতের তারিখ ও সময়:</td>
              <td class="value"><strong>${appointmentDate}</strong> (${appointmentTime})</td>
            </tr>
            <tr>
              <td class="label">রোগীর নাম:</td>
              <td class="value"><strong>${patientName}</strong> ${patientRelation ? '(' + patientRelation + ')' : ''}</td>
            </tr>
            ${patientPhone ? `
            <tr>
              <td class="label">রোগীর ফোন নম্বর:</td>
              <td class="value"><strong>+880 ${patientPhone.replace(/^\+?880?|^0/, '')}</strong></td>
            </tr>
            ` : ''}
            ${isRelative && cleanMobile ? `
            <tr>
              <td class="label">বুকিংকারীর মোবাইল:</td>
              <td class="value"><strong>+880 ${cleanMobile.replace(/^\+?880?|^0/, '')}</strong></td>
            </tr>
            ` : (!patientPhone && cleanMobile ? `
            <tr>
              <td class="label">মোবাইল নম্বর:</td>
              <td class="value"><strong>+880 ${cleanMobile.replace(/^\+?880?|^0/, '')}</strong></td>
            </tr>
            ` : '')}
            <tr>
              <td class="label">পেমেন্ট স্ট্যাটাস:</td>
              <td class="value">
                <span class="payment-badge">${paymentStatus}</span>
              </td>
            </tr>
          </table>

          <div class="instructions-box">
            <strong>জরুরি নির্দেশনা:</strong>
            <br>• নির্ধারিত সময়ের অন্তত ১৫-২০ মিনিট পূর্বে চেম্বারে উপস্থিত থাকবেন।
            <br>• চেম্বার রিসেপশনে এই ট্র্যাকিং স্লিপটি বা ট্র্যাকিং নম্বরটি প্রদর্শন করবেন।
            <br>• পূর্বের কোনো চিকিৎসা রিপোর্ট বা প্রেসক্রিপশন থাকলে সাথে নিয়ে আসবেন।
          </div>

          <div class="ticket-footer">
            কম্পিউটার দ্বারা তৈরি প্রমাণপত্র • DoctorBooklet ডিজিটাল হেলথকেয়ার নেটওয়ার্ক
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
        </script>
      </body>
      </html>
    `

    const printWin = window.open('', '_blank', 'width=780,height=900,menubar=no,toolbar=no,location=no,status=no')
    if (printWin) {
      printWin.document.open()
      printWin.document.write(printHtml)
      printWin.document.close()
    } else {
      window.print()
    }
  }

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh', paddingTop: 'var(--header-height, 100px)', paddingBottom: 60, fontFamily: "'Inter', sans-serif" }}>
      <SeoHead
        title="দ্রুত অ্যাপয়েন্টমেন্ট নিন | DoctorBooklet"
        description="আপনার পরিচিত ডাক্তারের সিরিয়াল খুব সহজে ও দ্রুত বুকিং করুন। অনলাইন সিরিয়াল সার্ভিস।"
      />

      <Container className="py-3 py-md-4 d-flex justify-content-center">
        <div style={{
          width: '100%',
          maxWidth: 620,
          background: 'white',
          borderRadius: 20,
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden'
        }}>
          {/* ── TOP HERO HEADER BANNER ── */}
          <div style={{
            backgroundImage: "url('/images/quick-appointment-hero.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center right',
            backgroundRepeat: 'no-repeat',
            padding: '22px 18px',
            minHeight: 125,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden'
          }}>
            <div style={{ maxWidth: '62%', zIndex: 2 }}>
              <h1 style={{
                fontSize: 'clamp(16px, 4.3vw, 21px)',
                fontWeight: 800,
                color: '#064E3B',
                marginBottom: 5,
                letterSpacing: '-0.3px',
                whiteSpace: 'nowrap',
                lineHeight: 1.25,
                fontFamily: "'Hind Siliguri', sans-serif"
              }}>
                দ্রুত অ্যাপয়েন্টমেন্ট নিন
              </h1>
              <p style={{
                fontSize: 'clamp(11px, 3.1vw, 13px)',
                color: '#1E3A2F',
                margin: 0,
                fontWeight: 600,
                lineHeight: 1.4,
                fontFamily: "'Hind Siliguri', sans-serif"
              }}>
                আপনার পরিচিত ডাক্তারের সিরিয়াল সহজে বুক করুন
              </p>
            </div>
          </div>

          {/* ── WIZARD FORM BODY ── */}
          <div style={{ padding: '24px 20px' }}>
            
            {/* ── STEP 1: DATE SELECTION ── */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <IconCalendarEvent size={20} color="#00B875" />
                <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: "'Hind Siliguri', sans-serif" }}>
                  কবে ডাক্তার দেখাতে চান?
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10
              }}>
                {/* 1. Today Card */}
                <button
                  type="button"
                  onClick={() => {
                    setDateMode('today')
                    const todayStr = getBangladeshTodayStr()
                    setSelectedAppointmentDate(todayStr)
                  }}
                  style={{
                    background: dateMode === 'today' ? '#00B875' : '#FFFFFF',
                    border: dateMode === 'today' ? '1.5px solid #00B875' : '1.5px solid #E2E8F0',
                    borderRadius: 14,
                    padding: '10px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: dateMode === 'today' ? '0 4px 14px rgba(0, 184, 117, 0.32)' : 'none',
                    transition: 'all 0.18s ease',
                    outline: 'none',
                    minHeight: 62
                  }}
                >
                  <span style={{
                    fontSize: 15,
                    fontWeight: dateMode === 'today' ? 800 : 700,
                    color: dateMode === 'today' ? '#FFFFFF' : '#0F172A',
                    fontFamily: "'Hind Siliguri', sans-serif",
                    lineHeight: 1.2
                  }}>
                    আজ
                  </span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: dateMode === 'today' ? 700 : 500,
                    color: dateMode === 'today' ? '#E6F9F0' : '#64748B',
                    marginTop: 3,
                    fontFamily: "'Hind Siliguri', sans-serif",
                    lineHeight: 1.2
                  }}>
                    {dateLabels.today}
                  </span>
                </button>

                {/* 2. Tomorrow Card */}
                <button
                  type="button"
                  onClick={() => {
                    setDateMode('tomorrow')
                    const tomorrowStr = getBangladeshTomorrowStr()
                    setSelectedAppointmentDate(tomorrowStr)
                  }}
                  style={{
                    background: dateMode === 'tomorrow' ? '#00B875' : '#FFFFFF',
                    border: dateMode === 'tomorrow' ? '1.5px solid #00B875' : '1.5px solid #E2E8F0',
                    borderRadius: 14,
                    padding: '10px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: dateMode === 'tomorrow' ? '0 4px 14px rgba(0, 184, 117, 0.32)' : 'none',
                    transition: 'all 0.18s ease',
                    outline: 'none',
                    minHeight: 62
                  }}
                >
                  <span style={{
                    fontSize: 15,
                    fontWeight: dateMode === 'tomorrow' ? 800 : 700,
                    color: dateMode === 'tomorrow' ? '#FFFFFF' : '#0F172A',
                    fontFamily: "'Hind Siliguri', sans-serif",
                    lineHeight: 1.2
                  }}>
                    আগামীকাল
                  </span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: dateMode === 'tomorrow' ? 700 : 500,
                    color: dateMode === 'tomorrow' ? '#E6F9F0' : '#64748B',
                    marginTop: 3,
                    fontFamily: "'Hind Siliguri', sans-serif",
                    lineHeight: 1.2
                  }}>
                    {dateLabels.tomorrow}
                  </span>
                </button>

                {/* 3. Custom Date Picker Card */}
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(true)}
                  style={{
                    background: dateMode === 'custom' ? '#00B875' : '#FFFFFF',
                    border: dateMode === 'custom' ? '1.5px solid #00B875' : '1.5px solid #E2E8F0',
                    borderRadius: 14,
                    padding: '10px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: dateMode === 'custom' ? '0 4px 14px rgba(0, 184, 117, 0.32)' : 'none',
                    transition: 'all 0.18s ease',
                    outline: 'none',
                    minHeight: 62
                  }}
                >
                  <span style={{
                    fontSize: 15,
                    fontWeight: dateMode === 'custom' ? 800 : 700,
                    color: dateMode === 'custom' ? '#FFFFFF' : '#0F172A',
                    fontFamily: "'Hind Siliguri', sans-serif",
                    lineHeight: 1.2
                  }}>
                    অন্য তারিখ
                  </span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: dateMode === 'custom' ? 700 : 500,
                    color: dateMode === 'custom' ? '#E6F9F0' : '#64748B',
                    marginTop: 3,
                    fontFamily: "'Hind Siliguri', sans-serif",
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    padding: '0 4px'
                  }}>
                    {dateMode === 'custom' && customDate ? formatCustomDateBn(customDate) : 'পছন্দ করুন'}
                  </span>
                </button>
              </div>
            </div>

            {/* ── STEP 2: SPECIALTY SELECTION ── */}
            <div style={{ marginBottom: 24, position: 'relative' }} ref={specRef}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconStethoscope size={20} color="#00B875" />
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    কোন স্পেশালিস্ট?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAllSpecialtiesModalOpen(true)}
                  style={{ background: 'none', border: 'none', color: '#00B875', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Hind Siliguri', sans-serif" }}
                >
                  সকল স্পেশালিটি দেখুন ❯
                </button>
              </div>

              {/* Direct Typing Input Field */}
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'white',
                border: '1.5px solid #CBD5E1',
                borderRadius: 12,
                height: 46,
                padding: '0 14px'
              }}>
                <IconSearch size={18} color="#94A3B8" style={{ flexShrink: 0, marginRight: 10 }} />
                <input
                  type="text"
                  placeholder="স্পেশালিস্ট লিখুন (যেমন: মেডিসিন, গাইনি...)"
                  value={isSpecialtyDropdownOpen ? specialtySearch : (selectedSpecialtyObj ? (selectedSpecialtyObj.name_bn || selectedSpecialtyObj.name) : specialtySearch)}
                  onFocus={() => {
                    setIsSpecialtyDropdownOpen(true)
                    if (selectedSpecialtyObj && !specialtySearch) {
                      setSpecialtySearch(selectedSpecialtyObj.name_bn || selectedSpecialtyObj.name || '')
                    }
                  }}
                  onChange={(e) => {
                    setSpecialtySearch(e.target.value)
                    if (selectedSpecialtyId) setSelectedSpecialtyId('')
                    setIsSpecialtyDropdownOpen(true)
                  }}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: 14,
                    fontWeight: selectedSpecialtyObj && !isSpecialtyDropdownOpen ? 700 : 500,
                    color: (selectedSpecialtyObj || (isSpecialtyDropdownOpen && specialtySearch)) ? '#0F172A' : '#0F172A',
                    background: 'transparent',
                    fontFamily: "'Hind Siliguri', sans-serif",
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                />
                {(selectedSpecialtyId || specialtySearch) ? (
                  <button
                    type="button"
                    onClick={() => { setSelectedSpecialtyId(''); setSpecialtySearch(''); setIsSpecialtyDropdownOpen(false) }}
                    style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 }}
                  >
                    <IconX size={16} />
                  </button>
                ) : (
                  <IconChevronDown size={18} color="#94A3B8" style={{ flexShrink: 0 }} />
                )}
              </div>

              {/* Specialty Dropdown List (No extra search box inside) */}
              {isSpecialtyDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 100,
                  background: 'white',
                  borderRadius: 12,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                  border: '1px solid #E2E8F0',
                  marginTop: 6,
                  padding: 6,
                  maxHeight: 240,
                  overflowY: 'auto'
                }}>
                  {filteredSpecialties.length === 0 ? (
                    <div style={{ padding: 12, textAlign: 'center', fontSize: 13, color: '#64748B', fontFamily: "'Hind Siliguri', sans-serif" }}>
                      কোনো স্পেশালিটি পাওয়া যায়নি।
                    </div>
                  ) : (
                    filteredSpecialties.map(spec => {
                      const docCount = spec.doctors_count ?? spec.doctor_count ?? (Array.isArray(spec.doctors) ? spec.doctors.length : 0)
                      return (
                        <div
                          key={spec.id}
                          onClick={() => {
                            setSelectedSpecialtyId(String(spec.id))
                            setSpecialtySearch(spec.name_bn || spec.name)
                            setIsSpecialtyDropdownOpen(false)
                          }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            fontSize: 14,
                            fontWeight: String(spec.id) === selectedSpecialtyId ? 700 : 600,
                            color: String(spec.id) === selectedSpecialtyId ? '#00B875' : '#1E293B',
                            background: String(spec.id) === selectedSpecialtyId ? '#F0FDF4' : 'transparent',
                            cursor: 'pointer',
                            fontFamily: "'Hind Siliguri', sans-serif"
                          }}
                        >
                          <span>{spec.name_bn || spec.name}</span>
                          <span style={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: String(spec.id) === selectedSpecialtyId ? '#00B875' : '#64748B',
                            background: String(spec.id) === selectedSpecialtyId ? '#DCFCE7' : '#F1F5F9',
                            padding: '2px 8px',
                            borderRadius: 10,
                            flexShrink: 0
                          }}>
                            {toBengaliNumber(docCount)} জন
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            {/* ── STEP 3: DOCTOR SELECTION ── */}
            <div style={{ marginBottom: 24, position: 'relative' }} ref={docRef}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <IconUser size={20} color="#00B875" />
                <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: "'Hind Siliguri', sans-serif" }}>
                  ডাক্তারের নাম
                </span>
              </div>

              {!selectedDoctor ? (
                <>
                  {/* Direct Typing Input Field */}
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    background: 'white',
                    border: formErrors.doctor ? '1.5px solid #EF4444' : '1.5px solid #CBD5E1',
                    borderRadius: 12,
                    height: 46,
                    padding: '0 14px'
                  }}>
                    <IconSearch size={18} color="#94A3B8" style={{ flexShrink: 0, marginRight: 10 }} />
                    <input
                      type="text"
                      placeholder="ডাক্তারের নাম লিখুন..."
                      value={doctorSearch}
                      onFocus={() => setIsDoctorDropdownOpen(true)}
                      onChange={(e) => {
                        setDoctorSearch(e.target.value)
                        setIsDoctorDropdownOpen(true)
                      }}
                      style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        fontSize: 14,
                        fontWeight: doctorSearch ? 600 : 500,
                        color: '#0F172A',
                        background: 'transparent',
                        fontFamily: "'Hind Siliguri', sans-serif",
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    />
                    {doctorSearch ? (
                      <button
                        type="button"
                        onClick={() => { setDoctorSearch(''); setIsDoctorDropdownOpen(false) }}
                        style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 }}
                      >
                        <IconX size={16} />
                      </button>
                    ) : (
                      <IconChevronDown size={18} color="#94A3B8" style={{ flexShrink: 0 }} />
                    )}
                  </div>

                  {formErrors.doctor && (
                    <div style={{ color: '#DC2626', fontSize: 12.5, fontWeight: 500, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Hind Siliguri', sans-serif" }}>
                      <IconAlertTriangle size={16} />
                      <span>{formErrors.doctor}</span>
                    </div>
                  )}

                  {/* Doctor Dropdown List (No extra search box inside) */}
                  {isDoctorDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 100,
                      background: 'white',
                      borderRadius: 12,
                      boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                      border: '1px solid #E2E8F0',
                      marginTop: 6,
                      padding: 6,
                      maxHeight: 260,
                      overflowY: 'auto'
                    }}>
                      {loadingDoctors ? (
                        <div style={{ padding: 12, textAlign: 'center', fontSize: 13, color: '#64748B', fontFamily: "'Hind Siliguri', sans-serif" }}>
                          ডাক্তার লোড হচ্ছে...
                        </div>
                      ) : doctorsList.length === 0 ? (
                        <div style={{ padding: 12, textAlign: 'center', fontSize: 13, color: '#64748B', fontFamily: "'Hind Siliguri', sans-serif" }}>
                          কোনো ডাক্তার পাওয়া যায়নি।
                        </div>
                      ) : (
                        doctorsList.map(doc => (
                          <div
                            key={doc.id}
                            onClick={() => {
                              setSelectedDoctor(doc)
                              setDoctorSearch('')
                              setIsDoctorDropdownOpen(false)
                            }}
                            style={{
                              padding: '10px 12px',
                              borderRadius: 8,
                              cursor: 'pointer',
                              borderBottom: '1px solid #F1F5F9'
                            }}
                          >
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', fontFamily: "'Hind Siliguri', sans-serif" }}>
                              {doc.name || doc.name_bn}
                            </div>
                            <div style={{ fontSize: 12, color: '#00B875', fontWeight: 600, fontFamily: "'Hind Siliguri', sans-serif" }}>
                              {doc.specialty?.name || doc.specialty?.name_bn || doc.specialty_name || 'বিশেষজ্ঞ'}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Selected Doctor Active Green Card Chip */
                <div style={{
                  background: '#F0FDF4',
                  border: '1.5px solid #A7F3D0',
                  borderRadius: 12,
                  minHeight: 46,
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12
                }}>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A', fontFamily: "'Hind Siliguri', sans-serif" }}>
                      {selectedDoctor.name || selectedDoctor.name_bn}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#00B875', fontWeight: 700, fontFamily: "'Hind Siliguri', sans-serif" }}>
                      {selectedDoctor.specialty?.name || selectedDoctor.specialty?.name_bn || selectedDoctor.specialty_name || 'বিশেষজ্ঞ'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedDoctor(null); setSelectedChamberId(''); setDoctorSearch('') }}
                    style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', padding: 4, display: 'flex' }}
                  >
                    <IconX size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* ── STEP 4: CHAMBER SELECTION ── */}
            <div style={{ marginBottom: 24 }} ref={chamberRef}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <IconMapPin size={20} color="#00B875" />
                <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: "'Hind Siliguri', sans-serif" }}>
                  চেম্বার নির্বাচন করুন
                </span>
              </div>

              <select
                value={selectedChamberId}
                onChange={(e) => setSelectedChamberId(e.target.value)}
                disabled={!selectedDoctor}
                style={{
                  width: '100%',
                  height: 46,
                  borderRadius: 12,
                  border: formErrors.chamber ? '1.5px solid #EF4444' : '1.5px solid #CBD5E1',
                  padding: '0 14px',
                  fontSize: 14,
                  fontWeight: selectedChamberId ? 700 : 500,
                  color: selectedChamberId ? '#0F172A' : '#94A3B8',
                  background: !selectedDoctor ? '#F8FAFC' : 'white',
                  outline: 'none',
                  cursor: !selectedDoctor ? 'not-allowed' : 'pointer',
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}
              >
                <option value="" disabled hidden style={{ color: '#94A3B8' }}>
                  {!selectedDoctor
                    ? 'ডাক্তারের চেম্বার সিলেক্ট করুন...'
                    : filteredChambers.length === 0
                      ? 'এই তারিখে চেম্বার খোলা নেই (তালিকা নিচে দেখুন)'
                      : 'ডাক্তারের চেম্বার সিলেক্ট করুন...'}
                </option>
                {filteredChambers.length > 0 ? (
                  filteredChambers.map(ch => (
                    <option key={ch.id} value={ch.id} style={{ color: '#0F172A', fontWeight: 600 }}>
                      {getChamberLabel(ch)}
                    </option>
                  ))
                ) : (
                  doctorChambers.map(ch => {
                    const dayNameBn = dayNameToBn[ch.day] || ch.day || ''
                    return (
                      <option key={ch.id} value="" disabled style={{ color: '#64748B' }}>
                        {getChamberLabel(ch)} {dayNameBn ? `(${dayNameBn}বার খোলা)` : ''}
                      </option>
                    )
                  })
                )}
              </select>

              {selectedDoctor && filteredChambers.length === 0 && (
                <div style={{
                  marginTop: 10,
                  background: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                    <IconAlertTriangle size={19} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.45 }}>
                      <strong style={{ color: '#0F172A' }}>
                        {selectedDateStr ? `${formatCustomDateBn(selectedDateStr)} তারিখে এই ডাক্তারের কোনো চেম্বার খোলা নেই।` : 'নির্বাচিত তারিখে চেম্বার খোলা নেই।'}
                      </strong>
                      {doctorChambers.length > 0 && (
                        <div style={{ marginTop: 3, color: '#64748B', fontSize: 12.5 }}>
                          ডাক্তার সাহেবের চেম্বার বসার দিনসমূহ: <span style={{ fontWeight: 700, color: '#0F172A' }}>{[...new Set(doctorChambers.map(c => dayNameToBn[c.day] || c.day).filter(Boolean))].join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {nextAvailableInfo && (
                    <button
                      type="button"
                      onClick={handleJumpToNextAvailable}
                      style={{
                        background: '#00B875',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 10,
                        padding: '9px 14px',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 7,
                        boxShadow: '0 3px 10px rgba(0, 184, 117, 0.28)',
                        transition: 'all 0.15s ease',
                        fontFamily: "'Hind Siliguri', sans-serif"
                      }}
                    >
                      <IconCalendarEvent size={16} />
                      <span>পরবর্তী উপলব্ধ দিন ({nextAvailableInfo.dayLabel})-এ অ্যাপয়েন্টমেন্ট নিন ➔</span>
                    </button>
                  )}
                </div>
              )}

              {formErrors.chamber && (
                <div style={{ color: '#DC2626', fontSize: 12.5, fontWeight: 500, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Hind Siliguri', sans-serif" }}>
                  <IconAlertTriangle size={16} />
                  <span>{formErrors.chamber}</span>
                </div>
              )}
            </div>

            {/* ── STEP 5: SERIAL / TIME SLOT SELECTION (GRID) ── */}
            <div style={{ marginBottom: 28 }} ref={slotRef}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                  <IconClock size={19} color="#00B875" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A', fontFamily: "'Hind Siliguri', sans-serif", whiteSpace: 'nowrap' }}>
                    সিরিয়াল / সময়
                  </span>
                </div>
                {selectedChamberId && !loadingSlots && availableSlots.length > 0 && (() => {
                  const freeCount = availableSlots.filter(s => !s.isBooked).length
                  const bookedCount = availableSlots.filter(s => s.isBooked).length
                  return (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      background: freeCount > 0 ? '#E8F8F2' : '#FEF2F2',
                      border: freeCount > 0 ? '1px solid #A7F3D0' : '1px solid #FECACA',
                      padding: '3px 9px',
                      borderRadius: 20,
                      fontFamily: "'Hind Siliguri', sans-serif",
                      fontSize: 11.5,
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      <span style={{ color: freeCount > 0 ? '#00B875' : '#EF4444' }}>
                        {toBengaliNumber(freeCount)} টি খালি
                      </span>
                      {bookedCount > 0 && (
                        <>
                          <span style={{ color: '#94A3B8', fontSize: 10 }}>•</span>
                          <span style={{ color: '#64748B', fontWeight: 600 }}>
                            {toBengaliNumber(bookedCount)} টি বুকড
                          </span>
                        </>
                      )}
                    </div>
                  )
                })()}
              </div>

              <style dangerouslySetInnerHTML={{ __html: `
                .quick-slots-grid {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 8px;
                }
                @media (min-width: 640px) {
                  .quick-slots-grid {
                    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
                    gap: 10px;
                  }
                }
              `}} />

              {!selectedChamberId ? (
                <div style={{
                  padding: '22px 16px',
                  borderRadius: 12,
                  background: '#F8FAFC',
                  border: '1.5px dashed #CBD5E1',
                  textAlign: 'center',
                  color: '#64748B',
                  fontSize: 13.5,
                  fontWeight: 600,
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}>
                  অনুগ্রহ করে প্রথমে ডাক্তারের চেম্বার সিলেক্ট করুন
                </div>
              ) : loadingSlots ? (
                <div style={{
                  padding: '28px 16px',
                  borderRadius: 12,
                  background: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  color: '#00B875',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}>
                  <IconLoader2 size={20} className="animate-spin" />
                  <span>সময়সূচী লোড হচ্ছে...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div style={{
                  padding: '22px 16px',
                  borderRadius: 12,
                  background: '#FEF2F2',
                  border: '1.5px solid #FECACA',
                  textAlign: 'center',
                  color: '#DC2626',
                  fontSize: 13.5,
                  fontWeight: 600,
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}>
                  এই তারিখে চেম্বারের কোনো সিরিয়াল বা সময়সূচী পাওয়া যায়নি। অনুগ্রহ করে অন্য দিন নির্বাচন করুন।
                </div>
              ) : (
                <>
                  <div className="quick-slots-grid">
                    {visibleSlots.map((slot, idx) => {
                      const slotVal = typeof slot === 'object' ? slot.value : slot
                      const isBooked = Boolean(typeof slot === 'object' && slot.isBooked)
                      const isSelected = selectedTimeSlot === slotVal && !isBooked

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isBooked}
                          onClick={() => {
                            if (!isBooked) {
                              setSelectedTimeSlot(slotVal)
                            }
                          }}
                          title={isBooked ? 'এই সময় স্লটটি ইতিমধ্যে বুক করা হয়েছে' : `সময়সূচী: ${slotVal}`}
                          style={{
                            padding: '8px 4px',
                            borderRadius: 10,
                            border: isSelected 
                              ? '2px solid #00B875' 
                              : isBooked 
                                ? '1.5px dashed #CBD5E1' 
                                : '1.5px solid #E2E8F0',
                            background: isSelected 
                              ? '#00B875' 
                              : isBooked 
                                ? '#F8FAFC' 
                                : '#FFFFFF',
                            color: isSelected 
                              ? '#FFFFFF' 
                              : isBooked 
                                ? '#94A3B8' 
                                : '#0F172A',
                            cursor: isBooked ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: isSelected 
                              ? '0 4px 14px rgba(0, 184, 117, 0.3)' 
                              : '0 1px 3px rgba(0,0,0,0.02)',
                            transition: 'all 0.15s ease',
                            outline: 'none',
                            opacity: isBooked ? 0.75 : 1,
                            fontFamily: "'Hind Siliguri', sans-serif"
                          }}
                        >
                          <span style={{
                            fontSize: 12.5,
                            fontWeight: 800,
                            letterSpacing: '0.1px',
                            textDecoration: isBooked ? 'line-through' : 'none',
                            color: isSelected ? '#FFFFFF' : isBooked ? '#94A3B8' : '#0F172A',
                            lineHeight: 1.2
                          }}>
                            {slotVal}
                          </span>
                          {isBooked ? (
                            <span style={{
                              fontSize: 9.5,
                              fontWeight: 700,
                              color: '#DC2626',
                              background: '#FEE2E2',
                              padding: '1px 5px',
                              borderRadius: 4,
                              marginTop: 3,
                              lineHeight: 1.2
                            }}>
                              বুক করা
                            </span>
                          ) : (
                            typeof slot === 'object' && slot.label && !slotVal.startsWith('Time-') && (
                              <span style={{
                                fontSize: 10,
                                fontWeight: isSelected ? 600 : 500,
                                color: isSelected ? '#E6F9F0' : '#64748B',
                                marginTop: 2,
                                lineHeight: 1.2
                              }}>
                                {slot.label}
                              </span>
                            )
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {availableSlots.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setShowAllSlots(prev => !prev)}
                      style={{
                        width: '100%',
                        marginTop: 10,
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: '1.5px dashed #CBD5E1',
                        background: '#F8FAFC',
                        color: '#00B875',
                        fontSize: 13,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        fontFamily: "'Hind Siliguri', sans-serif",
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                      }}
                    >
                      {showAllSlots ? (
                        <>
                          <IconChevronUp size={16} stroke={2.5} />
                          <span>সংক্ষেপ করুন</span>
                        </>
                      ) : (
                        <>
                          <IconChevronDown size={16} stroke={2.5} />
                          <span>আরও {toBengaliNumber(availableSlots.length - 6)}টি সময় দেখুন</span>
                        </>
                      )}
                    </button>
                  )}
                </>
              )}

              {formErrors.slot && (
                <div style={{ color: '#DC2626', fontSize: 12.5, fontWeight: 500, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Hind Siliguri', sans-serif" }}>
                  <IconAlertTriangle size={16} />
                  <span>{formErrors.slot}</span>
                </div>
              )}
            </div>

            {/* ── CTA BOOKING BUTTON ── */}
            <button
              type="button"
              onClick={handleProceedBooking}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 12,
                background: '#00B875',
                color: 'white',
                border: 'none',
                fontWeight: 800,
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                cursor: 'pointer',
                fontFamily: "'Hind Siliguri', sans-serif",
                boxShadow: '0 6px 20px rgba(0, 184, 117, 0.28)',
                transition: 'all 0.2s ease'
              }}
            >
              <IconCalendarEvent size={22} />
              <span>অ্যাপয়েন্টমেন্ট নিন ➔</span>
            </button>

          </div>
        </div>
      </Container>

      {/* ── CUSTOM DATE PICKER MODAL ── */}
      <Modal show={isDatePickerOpen} onHide={() => setIsDatePickerOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Hind Siliguri', sans-serif" }}>
            তারিখ নির্বাচন করুন
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 20 }}>
          <input
            type="date"
            min={getBangladeshTodayStr()}
            value={customDate}
            onChange={(e) => {
              setCustomDate(e.target.value)
              setDateMode('custom')
              setSelectedAppointmentDate(e.target.value)
              setIsDatePickerOpen(false)
            }}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 15 }}
          />
        </Modal.Body>
      </Modal>

      {/* ── ALL SPECIALTIES MODAL ── */}
      <Modal show={isAllSpecialtiesModalOpen} onHide={() => setIsAllSpecialtiesModalOpen(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Hind Siliguri', sans-serif" }}>
            সকল বিশেষজ্ঞ বিভাগ ({toBengaliNumber(specialties?.length || 0)})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 20, maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
            {specialties.map(spec => {
              const docCount = spec.doctors_count ?? spec.doctor_count ?? (Array.isArray(spec.doctors) ? spec.doctors.length : 0)
              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => {
                    setSelectedSpecialtyId(String(spec.id))
                    setIsAllSpecialtiesModalOpen(false)
                  }}
                  style={{
                    background: String(spec.id) === selectedSpecialtyId ? '#F0FDF4' : 'white',
                    border: String(spec.id) === selectedSpecialtyId ? '2px solid #00B875' : '1px solid #E2E8F0',
                    borderRadius: 10,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    cursor: 'pointer',
                    fontFamily: "'Hind Siliguri', sans-serif"
                  }}
                >
                  <span style={{
                    fontWeight: 700,
                    fontSize: 13.5,
                    color: String(spec.id) === selectedSpecialtyId ? '#00B875' : '#1E293B',
                    textAlign: 'left'
                  }}>
                    {spec.name_bn || spec.name}
                  </span>
                  <span style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: String(spec.id) === selectedSpecialtyId ? '#00B875' : '#64748B',
                    background: String(spec.id) === selectedSpecialtyId ? '#DCFCE7' : '#F1F5F9',
                    padding: '3px 8px',
                    borderRadius: 12,
                    flexShrink: 0
                  }}>
                    {toBengaliNumber(docCount)} জন
                  </span>
                </button>
              )
            })}
          </div>
        </Modal.Body>
      </Modal>

      {/* ── 5-STEP APPOINTMENT BOOKING WIZARD MODAL ── */}
      <Modal
        show={isBookingModalOpen && !bookingErrorModal.isOpen}
        onHide={handleCloseWizard}
        centered
        size="md"
        contentClassName="border-0 shadow-lg quick-wizard-modal-content"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Modal.Body className="quick-booking-modal-body" style={{ padding: '24px 20px', borderRadius: 20 }}>
          {/* Header Close Button & Step Indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {modalStep > 1 && modalStep < 5 && (
                <button
                  type="button"
                  onClick={() => {
                    if (modalStep === 1.5) setModalStep(1)
                    else if (modalStep === 2) setModalStep(bookingFor === 'relative' ? 1.5 : 1)
                    else if (modalStep === 3) setModalStep(2)
                    else if (modalStep === 4) setModalStep(isPrivilegedStaff ? (bookingFor === 'relative' ? 1.5 : 1) : 3)
                  }}
                  style={{
                    background: '#F1F5F9',
                    border: 'none',
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748B',
                    transition: 'all 0.15s ease'
                  }}
                  title="আগের ধাপ"
                >
                  <IconChevronLeft size={18} />
                </button>
              )}
              <span style={{
                background: '#F1F5F9',
                color: '#475569',
                fontSize: 12.5,
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: 20,
                fontFamily: "'Hind Siliguri', sans-serif"
              }}>
                {modalStep === 1 && '১. কার জন্য অ্যাপয়েন্টমেন্ট'}
                {modalStep === 1.5 && 'রোগীর তথ্য প্রদান'}
                {modalStep === 2 && '২. মোবাইল নম্বর'}
                {modalStep === 3 && '৩. ওটিপি ভেরিফিকেশন'}
                {modalStep === 4 && (isPrivilegedStaff ? 'তথ্য নিশ্চিতকরণ' : (isLoggedIn ? 'তথ্য নিশ্চিতকরণ' : '৪. নিজের তথ্য'))}
                {modalStep === 5 && 'বুকিং টিকেট'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCloseWizard}
              style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
            >
              <IconX size={20} />
            </button>
          </div>

          {/* STEP 1: WHO IS APPOINTMENT FOR? (Matching Image 2 Step 1) */}
          {modalStep === 1 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 4, fontFamily: "'Hind Siliguri', sans-serif" }}>
                অ্যাপয়েন্টমেন্ট কার জন্য?
              </h2>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20, fontFamily: "'Hind Siliguri', sans-serif" }}>
                দয়া করে নির্বাচন করুন
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {/* Option 1: Myself */}
                <div
                  onClick={() => setBookingFor('myself')}
                  style={{
                    background: bookingFor === 'myself' ? '#F0FDF4' : 'white',
                    border: bookingFor === 'myself' ? '2px solid #00B875' : '1.5px solid #E2E8F0',
                    borderRadius: 14,
                    padding: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: bookingFor === 'myself' ? '#DCFCE7' : '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconUser size={26} color={bookingFor === 'myself' ? '#00B875' : '#64748B'} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', fontFamily: "'Hind Siliguri', sans-serif" }}>
                        নিজের জন্য
                      </div>
                      <div style={{ fontSize: 12.5, color: '#64748B', fontWeight: 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                        {isPrivilegedStaff ? 'আমার নিজের অ্যাপয়েন্টমেন্টের জন্য' : 'আমি নিজে ডাক্তার দেখাতে চাই'}
                      </div>
                    </div>
                  </div>
                  {bookingFor === 'myself' && (
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: '#00B875',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <IconCheck size={16} />
                    </div>
                  )}
                </div>

                {/* Option 2: Relative */}
                <div
                  onClick={() => setBookingFor('relative')}
                  style={{
                    background: bookingFor === 'relative' ? '#F0FDF4' : 'white',
                    border: bookingFor === 'relative' ? '2px solid #00B875' : '1.5px solid #E2E8F0',
                    borderRadius: 14,
                    padding: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: bookingFor === 'relative' ? '#DCFCE7' : '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconUsers size={26} color={bookingFor === 'relative' ? '#00B875' : '#64748B'} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', fontFamily: "'Hind Siliguri', sans-serif" }}>
                        {isPrivilegedStaff ? 'রোগী বা অন্য কারো জন্য' : 'আত্মীয়স্বজনের জন্য'}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#64748B', fontWeight: 500, fontFamily: "'Hind Siliguri', sans-serif" }}>
                        {isPrivilegedStaff ? 'রোগী বা পরিবারের সদস্যের জন্য' : 'পরিবারের সদস্য বা অন্য কারো জন্য'}
                      </div>
                    </div>
                  </div>
                  {bookingFor === 'relative' && (
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: '#00B875',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <IconCheck size={16} />
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleStep1Next}
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 12,
                  background: '#00B875',
                  color: 'white',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: 15,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  fontFamily: "'Hind Siliguri', sans-serif"
                }}
              >
                <span>পরবর্তী ধাপ ➔</span>
              </button>
            </div>
          )}

          {/* STEP 1.5: RELATIVE INFORMATION FORM (Matching Image 3) */}
          {modalStep === 1.5 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 4, fontFamily: "'Hind Siliguri', sans-serif" }}>
                আত্মীয়স্বজনের তথ্য দিন
              </h2>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20, fontFamily: "'Hind Siliguri', sans-serif" }}>
                যার জন্য অ্যাপয়েন্টমেন্ট নিচ্ছেন, তার তথ্য প্রদান করুন
              </p>

              <form onSubmit={handleRelativeInfoSubmit}>
                {/* Patient Full Name */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13.5, fontWeight: 700, color: '#1E293B', marginBottom: 6, display: 'block', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    রোগীর পূর্ণ নাম <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="নাম লিখুন"
                    value={relativeForm.name}
                    onChange={(e) => {
                      setRelativeForm(prev => ({ ...prev, name: e.target.value }))
                      if (relativeErrors.name) setRelativeErrors(prev => ({ ...prev, name: '' }))
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: relativeErrors.name ? '1.5px solid #EF4444' : '1.5px solid #CBD5E1',
                      fontSize: 14,
                      outline: 'none',
                      fontFamily: "'Hind Siliguri', sans-serif",
                      background: relativeErrors.name ? '#FEF2F2' : 'white',
                      transition: 'border-color 0.15s, background-color 0.15s'
                    }}
                  />
                  {relativeErrors.name && (
                    <div style={{ color: '#EF4444', fontSize: 12, marginTop: 5, display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Hind Siliguri', sans-serif" }}>
                      <IconAlertCircle size={14} style={{ flexShrink: 0 }} />
                      <span>{relativeErrors.name}</span>
                    </div>
                  )}
                </div>

                {/* Grid: Age & Gender */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 13.5, fontWeight: 700, color: '#1E293B', marginBottom: 6, display: 'block', fontFamily: "'Hind Siliguri', sans-serif" }}>
                      বয়স <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="যেমন: ২৫"
                      maxLength={3}
                      value={relativeForm.age}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 3)
                        setRelativeForm(prev => ({ ...prev, age: val }))
                        if (relativeErrors.age) setRelativeErrors(prev => ({ ...prev, age: '' }))
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: relativeErrors.age ? '1.5px solid #EF4444' : '1.5px solid #CBD5E1',
                        fontSize: 14,
                        outline: 'none',
                        fontFamily: "'Hind Siliguri', sans-serif",
                        background: relativeErrors.age ? '#FEF2F2' : 'white',
                        transition: 'border-color 0.15s, background-color 0.15s'
                      }}
                    />
                    {relativeErrors.age && (
                      <div style={{ color: '#EF4444', fontSize: 12, marginTop: 5, display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Hind Siliguri', sans-serif" }}>
                        <IconAlertCircle size={14} style={{ flexShrink: 0 }} />
                        <span>{relativeErrors.age}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: 13.5, fontWeight: 700, color: '#1E293B', marginBottom: 6, display: 'block', fontFamily: "'Hind Siliguri', sans-serif" }}>
                      লিঙ্গ <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <select
                      value={relativeForm.gender}
                      onChange={(e) => setRelativeForm(prev => ({ ...prev, gender: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1.5px solid #CBD5E1',
                        fontSize: 14,
                        outline: 'none',
                        background: 'white',
                        fontFamily: "'Hind Siliguri', sans-serif"
                      }}
                    >
                      <option value="পুরুষ">পুরুষ</option>
                      <option value="মহিলা">মহিলা</option>
                      <option value="অন্যান্য">অন্যান্য</option>
                    </select>
                  </div>
                </div>

                {/* Patient Mobile Number (Optional) */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13.5, fontWeight: 700, color: '#1E293B', marginBottom: 6, display: 'block', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    মোবাইল নম্বর <span style={{ color: '#64748B', fontWeight: 500 }}>(ঐচ্ছিক)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="যেমন: 017XXXXXXXX (ঐচ্ছিক)"
                    maxLength={11}
                    value={relativeForm.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 11)
                      setRelativeForm(prev => ({ ...prev, phone: val }))
                      if (relativeErrors.phone) setRelativeErrors(prev => ({ ...prev, phone: '' }))
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: relativeErrors.phone ? '1.5px solid #EF4444' : '1.5px solid #CBD5E1',
                      fontSize: 14,
                      outline: 'none',
                      fontFamily: "'Hind Siliguri', sans-serif",
                      background: relativeErrors.phone ? '#FEF2F2' : 'white',
                      transition: 'border-color 0.15s, background-color 0.15s'
                    }}
                  />
                  {relativeErrors.phone && (
                    <div style={{ color: '#EF4444', fontSize: 12, marginTop: 5, display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Hind Siliguri', sans-serif" }}>
                      <IconAlertCircle size={14} style={{ flexShrink: 0 }} />
                      <span>{relativeErrors.phone}</span>
                    </div>
                  )}
                </div>

                {/* Relationship with Patient */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13.5, fontWeight: 700, color: '#1E293B', marginBottom: 6, display: 'block', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    রোগীর সাথে সম্পর্ক <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={relativeForm.relation}
                    onChange={(e) => setRelativeForm(prev => ({ ...prev, relation: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 14,
                      outline: 'none',
                      background: 'white',
                      fontFamily: "'Hind Siliguri', sans-serif"
                    }}
                  >
                    <option value="পিতা">পিতা</option>
                    <option value="মাতা">মাতা</option>
                    <option value="স্ত্রী">স্ত্রী</option>
                    <option value="স্বামী">স্বামী</option>
                    <option value="সন্তান">সন্তান</option>
                    <option value="ভাই">ভাই</option>
                    <option value="বোন">বোন</option>
                    <option value="রোগী">রোগী</option>
                    <option value="অন্যান্য">অন্যান্য</option>
                  </select>
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 12,
                    background: '#00B875',
                    color: 'white',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 15,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    fontFamily: "'Hind Siliguri', sans-serif"
                  }}
                >
                  <span>তথ্য নিশ্চিত করুন ➔</span>
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: ENTER MOBILE NUMBER (Matching Image 2 Step 2) */}
          {modalStep === 2 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 4, fontFamily: "'Hind Siliguri', sans-serif" }}>
                {bookingFor === 'relative' ? 'বুকিংকারীর মোবাইল নম্বর' : 'মোবাইল নম্বর দিন'}
              </h2>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20, fontFamily: "'Hind Siliguri', sans-serif" }}>
                {bookingFor === 'relative' 
                  ? 'বুকিং নিশ্চিত করতে আপনার (বুকিংকারীর) মোবাইলে OTP পাঠানো হবে'
                  : 'আপনার মোবাইল নম্বরে OTP পাঠানো হবে'}
              </p>

              <form onSubmit={handleSendOtpSubmit}>
                {/* Patient Name for unauthenticated myself */}
                {bookingFor === 'myself' && !isLoggedIn && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13.5, fontWeight: 700, color: '#1E293B', marginBottom: 6, display: 'block', fontFamily: "'Hind Siliguri', sans-serif" }}>
                      আপনার পূর্ণ নাম <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: মোঃ রহিম উদ্দিন"
                      value={selfPatientName}
                      onChange={(e) => {
                        setSelfPatientName(e.target.value)
                        if (selfNameError) setSelfNameError('')
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: selfNameError ? '1.5px solid #EF4444' : '1.5px solid #CBD5E1',
                        fontSize: 14,
                        outline: 'none',
                        fontFamily: "'Hind Siliguri', sans-serif",
                        background: selfNameError ? '#FEF2F2' : 'white',
                        transition: 'border-color 0.15s, background-color 0.15s'
                      }}
                    />
                    {selfNameError && (
                      <div style={{ color: '#EF4444', fontSize: 12, marginTop: 5, display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Hind Siliguri', sans-serif" }}>
                        <IconAlertCircle size={14} style={{ flexShrink: 0 }} />
                        <span>{selfNameError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Booker Name for unauthenticated relative booking */}
                {bookingFor === 'relative' && !isLoggedIn && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13.5, fontWeight: 700, color: '#1E293B', marginBottom: 6, display: 'block', fontFamily: "'Hind Siliguri', sans-serif" }}>
                      আপনার (বুকিংকারীর) পূর্ণ নাম <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: মোঃ আরিফ হোসেন"
                      value={bookerName}
                      onChange={(e) => {
                        setBookerName(e.target.value)
                        if (bookerNameError) setBookerNameError('')
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: bookerNameError ? '1.5px solid #EF4444' : '1.5px solid #CBD5E1',
                        fontSize: 14,
                        outline: 'none',
                        fontFamily: "'Hind Siliguri', sans-serif",
                        background: bookerNameError ? '#FEF2F2' : 'white',
                        transition: 'border-color 0.15s, background-color 0.15s'
                      }}
                    />
                    {bookerNameError && (
                      <div style={{ color: '#EF4444', fontSize: 12, marginTop: 5, display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Hind Siliguri', sans-serif" }}>
                        <IconAlertCircle size={14} style={{ flexShrink: 0 }} />
                        <span>{bookerNameError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* If user logged in and not editing custom number: show profile card */}
                {isLoggedIn && !isEditingCustomMobile && (mobileNumber || user?.mobile || user?.phone) ? (
                  <div style={{
                    background: '#F8FAFC',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '14px 16px',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12
                  }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#64748B', fontFamily: "'Hind Siliguri', sans-serif", fontWeight: 600 }}>
                        নিবন্ধিত মোবাইল নম্বর
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 2, letterSpacing: '0.5px' }}>
                        +880 {(mobileNumber || user?.phone || user?.mobile || '').replace(/^\+?880?|^0/, '')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingCustomMobile(true)
                        setMobileNumber('')
                      }}
                      style={{
                        background: '#EEF2FF',
                        color: '#4F46E5',
                        border: '1px solid #C7D2FE',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: "'Hind Siliguri', sans-serif"
                      }}
                    >
                      নম্বর পরিবর্তন করুন
                    </button>
                  </div>
                ) : (
                  <div style={{ marginBottom: 16 }}>
                    {isLoggedIn && isEditingCustomMobile && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label style={{ fontSize: 13.5, fontWeight: 700, color: '#1E293B', fontFamily: "'Hind Siliguri', sans-serif" }}>
                          নতুন মোবাইল নম্বর দিন
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setMobileNumber(user?.phone || user?.mobile || '')
                            setIsEditingCustomMobile(false)
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#6366F1',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontFamily: "'Hind Siliguri', sans-serif"
                          }}
                        >
                          প্রোফাইল নম্বর ব্যবহার করুন
                        </button>
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      border: phoneInputError ? '1.5px solid #EF4444' : (registeredPhoneNotice ? '1.5px solid #F59E0B' : '1.5px solid #CBD5E1'),
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: phoneInputError ? '#FEF2F2' : 'white',
                      transition: 'border-color 0.15s, background-color 0.15s'
                    }}>
                      <div style={{
                        padding: '10px 12px',
                        background: '#F8FAFC',
                        borderRight: '1px solid #CBD5E1',
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <span>🇧🇩</span>
                        <span>+880</span>
                      </div>
                      <input
                        type="tel"
                        required
                        inputMode="numeric"
                        maxLength={11}
                        placeholder="01XXXXXXXXX"
                        value={mobileNumber}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 11)
                          setMobileNumber(digitsOnly)
                          if (phoneInputError) {
                            setPhoneInputError('')
                          }
                          if (registeredPhoneNotice) {
                            setRegisteredPhoneNotice(null)
                          }
                          if (step2Error) {
                            setStep2Error('')
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          border: 'none',
                          fontSize: 15,
                          outline: 'none',
                          fontWeight: 600,
                          fontFamily: "'Hind Siliguri', sans-serif",
                          background: 'transparent'
                        }}
                      />
                    </div>

                    {phoneInputError && (
                      <div style={{ color: '#EF4444', fontSize: 12, marginTop: 5, display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Hind Siliguri', sans-serif" }}>
                        <IconAlertCircle size={14} style={{ flexShrink: 0 }} />
                        <span>{phoneInputError}</span>
                      </div>
                    )}

                    {/* Inline smart alert when phone is already registered */}
                    {registeredPhoneNotice && (
                      <div style={{
                        marginTop: 10,
                        padding: '12px 14px',
                        borderRadius: 12,
                        background: '#FFFBEB',
                        border: '1.5px solid #FDE68A',
                        textAlign: 'left',
                        fontFamily: "'Hind Siliguri', sans-serif"
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 13.5,
                          fontWeight: 800,
                          color: '#B45309',
                          marginBottom: 4
                        }}>
                          <IconAlertTriangle size={17} color="#D97706" style={{ flexShrink: 0 }} />
                          <span>{registeredPhoneNotice.message}</span>
                        </div>
                        <div style={{ fontSize: 12.5, color: '#92400E', marginBottom: 10, lineHeight: 1.45 }}>
                          এই নম্বরে নতুন অ্যাকাউন্ট তৈরি করা যাবে না। অনুগ্রহ করে আপনার নিজস্ব নতুন মোবাইল নম্বর দিন অথবা পূর্বে অ্যাকাউন্ট থাকলে লগইন করুন।
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setMobileNumber('')
                              setRegisteredPhoneNotice(null)
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
                              fontFamily: "'Hind Siliguri', sans-serif"
                            }}
                          >
                            নম্বর পরিবর্তন করুন
                          </button>
                          <Link
                            to="/login/patient"
                            style={{
                              background: 'white',
                              color: '#B45309',
                              border: '1px solid #FCD34D',
                              borderRadius: 8,
                              padding: '6px 14px',
                              fontSize: 12.5,
                              fontWeight: 700,
                              textDecoration: 'none',
                              fontFamily: "'Hind Siliguri', sans-serif"
                            }}
                          >
                            লগইন করুন ➔
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Step 2 Error alert (Rate-limit or send error) */}
                    {step2Error && (
                      <div style={{
                        marginTop: 10,
                        padding: '10px 14px',
                        borderRadius: 12,
                        background: '#FEF2F2',
                        border: '1.5px solid #FECACA',
                        textAlign: 'left',
                        fontFamily: "'Hind Siliguri', sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        color: '#DC2626',
                        fontWeight: 600
                      }}>
                        <IconAlertCircle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
                        <span>{step2Error}</span>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginBottom: 20 }}>
                  <IconLock size={14} color="#00B875" />
                  <span style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>আপনার তথ্য সম্পূর্ণ নিরাপদ</span>
                </div>

                <button
                  type="submit"
                  disabled={isOtpSending || Boolean(registeredPhoneNotice) || otpTimer > 0}
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 12,
                    background: (registeredPhoneNotice || otpTimer > 0) ? '#94A3B8' : '#00B875',
                    color: 'white',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 15,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: (isOtpSending || registeredPhoneNotice || otpTimer > 0) ? 'not-allowed' : 'pointer',
                    fontFamily: "'Hind Siliguri', sans-serif"
                  }}
                >
                  {isOtpSending ? (
                    <IconLoader2 className="spin" size={20} />
                  ) : registeredPhoneNotice ? (
                    <span>নতুন নম্বর দিন</span>
                  ) : otpTimer > 0 ? (
                    <span>পুনরায় ওটিপি পাঠাতে অপেক্ষা করুন ({formatOtpTimerBn(otpTimer)})</span>
                  ) : (
                    <span>ওটিপি পাঠান</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: OTP VERIFICATION (Matching Image 2 Step 3) */}
          {modalStep === 3 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 4, fontFamily: "'Hind Siliguri', sans-serif" }}>
                ওটিপি যাচাই করুন
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 6 }}>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0, fontFamily: "'Hind Siliguri', sans-serif" }}>
                  মোবাইল নম্বর <strong>(+880 {mobileNumber})</strong>-এ পাঠানো ওটিপি কোড লিখুন
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setModalStep(2)
                    setOtp('')
                    setOtpNotice('')
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6366F1',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                    fontFamily: "'Hind Siliguri', sans-serif"
                  }}
                >
                  নম্বর পরিবর্তন করুন
                </button>
              </div>

              {/* Inline Standard Patient-Friendly Alert (No toast) */}
              {otpNotice && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 12,
                  padding: '11px 14px',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  textAlign: 'left'
                }}>
                  <IconAlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{
                    fontSize: 13,
                    color: '#991B1B',
                    lineHeight: 1.5,
                    fontWeight: 600,
                    fontFamily: "'Hind Siliguri', sans-serif"
                  }}>
                    {otpNotice}
                  </div>
                </div>
              )}

              <form onSubmit={handleVerifyOtpSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <input
                    type="text"
                    maxLength={6}
                    inputMode="numeric"
                    required
                    placeholder="4 2 8 9 0 1"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                      if (otpNotice) setOtpNotice('')
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '2px solid #00B875',
                      fontSize: 22,
                      fontWeight: 800,
                      textAlign: 'center',
                      letterSpacing: 8,
                      color: '#0F172A',
                      outline: 'none',
                      background: '#F0FDF4'
                    }}
                  />
                </div>

                {/* Single Clean Timer / Resend Action (Never double timer) */}
                <div style={{ textAlign: 'center', marginBottom: 20, minHeight: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {otpTimer > 0 ? (
                    <div style={{
                      fontSize: 13,
                      color: '#475569',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#F8FAFC',
                      padding: '6px 14px',
                      borderRadius: 20,
                      border: '1px solid #E2E8F0',
                      fontFamily: "'Hind Siliguri', sans-serif"
                    }}>
                      <IconClock size={15} color="#00B875" />
                      <span>পুনরায় ওটিপি পাঠানোর বাকি: <strong style={{ color: '#0F172A', fontWeight: 800 }}>{formatOtpTimerBn(otpTimer)}</strong></span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isOtpSending}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#00B875',
                        fontSize: 13.5,
                        fontWeight: 800,
                        cursor: isOtpSending ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontFamily: "'Hind Siliguri', sans-serif",
                        padding: '4px 8px'
                      }}
                    >
                      {isOtpSending ? (
                        <>
                          <IconLoader2 className="spin" size={14} />
                          <span>পাঠানো হচ্ছে...</span>
                        </>
                      ) : (
                        <span>আবার ওটিপি পাঠান ↻</span>
                      )}
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isOtpVerifying || !otp.trim() || otp.trim().length !== 6}
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 12,
                    background: (isOtpVerifying || !otp.trim() || otp.trim().length !== 6) ? '#94A3B8' : '#00B875',
                    color: 'white',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 15,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: (isOtpVerifying || !otp.trim() || otp.trim().length !== 6) ? 'not-allowed' : 'pointer',
                    fontFamily: "'Hind Siliguri', sans-serif"
                  }}
                >
                  {isOtpVerifying ? (
                    <IconLoader2 className="spin" size={20} />
                  ) : (
                    <span>যাচাই করুন</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 4: CONFIRM DETAILS & SUBMIT (Matching Image 2 Step 4) */}
          {modalStep === 4 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 4, fontFamily: "'Hind Siliguri', sans-serif" }}>
                {isPrivilegedStaff ? 'অ্যাপয়েন্টমেন্টের তথ্য নিশ্চিত করুন' : 'নিজের তথ্য নিশ্চিত করুন'}
              </h2>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16, fontFamily: "'Hind Siliguri', sans-serif" }}>
                {isPrivilegedStaff ? 'তথ্য যাচাই করে অ্যাপয়েন্টমেন্ট নিশ্চিত করুন' : 'অ্যাপয়েন্টমেন্টের জন্য আপনার তথ্য ব্যবহার করা হবে'}
              </p>

              <div style={{
                background: '#F8FAFC',
                borderRadius: 14,
                padding: 16,
                border: '1px solid #E2E8F0',
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                  <IconUser size={18} color="#00B875" />
                  <div>
                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, fontFamily: "'Hind Siliguri', sans-serif" }}>রোগীর নাম</div>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A', fontFamily: "'Hind Siliguri', sans-serif" }}>
                      {bookingFor === 'relative' ? `${relativeForm.name} (${relativeForm.relation || 'আত্মীয়'})` : (selfPatientName || user?.name || 'রোগী')}
                    </div>
                  </div>
                </div>

                {bookingFor === 'relative' && relativeForm.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                    <IconDeviceMobile size={18} color="#00B875" />
                    <div>
                      <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, fontFamily: "'Hind Siliguri', sans-serif" }}>রোগীর যোগাযোগের নম্বর</div>
                      <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A' }}>
                        +880 {relativeForm.phone.replace(/^\+?880?|^0/, '')}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                  <IconDeviceMobile size={18} color="#6366F1" />
                  <div>
                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, fontFamily: "'Hind Siliguri', sans-serif" }}>
                      {bookingFor === 'relative' ? 'বুকিংকারীর মোবাইল নম্বর' : 'মোবাইল নম্বর'}
                    </div>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A' }}>
                      +880 {(mobileNumber || user?.phone || user?.mobile || '').replace(/^\+?880?|^0/, '')}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <IconStethoscope size={18} color="#00B875" />
                  <div>
                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, fontFamily: "'Hind Siliguri', sans-serif" }}>ডাক্তার ও সময়</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', fontFamily: "'Hind Siliguri', sans-serif" }}>
                      {selectedDoctor?.name || selectedDoctor?.name_bn} — ({selectedDateStr}, {typeof selectedTimeSlot === 'object' ? selectedTimeSlot.label : selectedTimeSlot})
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinalizeAppointment}
                disabled={isSubmittingAppointment}
                style={{
                  width: '100%',
                  height: 50,
                  borderRadius: 12,
                  background: '#00B875',
                  color: 'white',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  cursor: isSubmittingAppointment ? 'not-allowed' : 'pointer',
                  fontFamily: "'Hind Siliguri', sans-serif",
                  boxShadow: '0 6px 20px rgba(0, 184, 117, 0.28)'
                }}
              >
                {isSubmittingAppointment ? (
                  <IconLoader2 className="spin" size={22} />
                ) : (
                  <span>অ্যাপয়েন্টমেন্টটি সম্পন্ন করুন ➔</span>
                )}
              </button>
            </div>
          )}

          {/* STEP 5: SUCCESS BOOKING TICKET */}
          {modalStep === 5 && confirmedAppointmentData && (
            <div style={{ textAlign: 'center' }}>
              {/* Responsive & Print styles */}
              <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                  @page {
                    size: A4 portrait;
                    margin: 12mm 15mm;
                  }
                  body * {
                    visibility: hidden !important;
                  }
                  #printable-quick-appointment-slip, #printable-quick-appointment-slip * {
                    visibility: visible !important;
                  }
                  #printable-quick-appointment-slip {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    max-width: 650px !important;
                    margin: 0 auto !important;
                    padding: 20px !important;
                    background: #ffffff !important;
                    border: 2px solid #00B875 !important;
                    border-radius: 14px !important;
                    box-shadow: none !important;
                    page-break-inside: avoid !important;
                  }
                  .quick-modal-no-print {
                    display: none !important;
                  }
                }

                @media (max-width: 520px) {
                  .quick-booking-modal-body {
                    padding: 18px 14px !important;
                  }
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
                @media (max-width: 480px) {
                  .quick-cred-box {
                    padding: 11px 12px;
                    border-radius: 12px;
                  }
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
                  font-weight: 800;
                  color: #065F46;
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  font-family: 'Hind Siliguri', sans-serif;
                  line-height: 1.35;
                  flex: 1;
                  min-width: 0;
                }
                @media (max-width: 400px) {
                  .quick-cred-title {
                    font-size: 12px;
                  }
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
                  margin-bottom: 18px;
                }
                @media (max-width: 480px) {
                  .quick-summary-box {
                    padding: 12px 14px;
                    margin-bottom: 16px;
                  }
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

                .quick-footer-actions {
                  display: flex;
                  gap: 10px;
                }
                .quick-btn-print {
                  flex: 1;
                  height: 44px;
                  border-radius: 12px;
                  background: #F1F5F9;
                  color: #334155;
                  border: none;
                  font-weight: 700;
                  font-size: 13.5px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 7px;
                  cursor: pointer;
                  font-family: 'Hind Siliguri', sans-serif;
                  transition: background 0.15s;
                  white-space: nowrap;
                }
                .quick-btn-print:hover {
                  background: #E2E8F0;
                }
                .quick-btn-finish {
                  flex: 1;
                  height: 44px;
                  border-radius: 12px;
                  background: #00B875;
                  color: white;
                  border: none;
                  font-weight: 800;
                  font-size: 14px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 7px;
                  cursor: pointer;
                  font-family: 'Hind Siliguri', sans-serif;
                  box-shadow: 0 4px 12px rgba(0, 184, 117, 0.25);
                  transition: background 0.15s;
                  white-space: nowrap;
                }
                .quick-btn-finish:hover {
                  background: #009E64;
                }

                @keyframes quickLivePulse {
                  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
                  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
              `}} />

              <div id="printable-quick-appointment-slip">
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

                <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0F172A', marginBottom: 5, fontFamily: "'Hind Siliguri', sans-serif", lineHeight: 1.3 }}>
                  অ্যাপয়েন্টমেন্ট বুকিং সফল হয়েছে!
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: newAccountCredentials ? 14 : 18 }}>
                  <p style={{ fontSize: 13, color: '#64748B', margin: 0, fontFamily: "'Hind Siliguri', sans-serif" }}>
                    আপনার ট্র্যাকিং আইডি: <strong style={{ color: '#00B875', fontWeight: 800 }}>{confirmedAppointmentData.id}</strong>
                  </p>
                  {confirmedAppointmentData.serial_number && (
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
                      সিরিয়াল নং: {toBengaliNumber(confirmedAppointmentData.serial_number)}
                    </span>
                  )}
                </div>

                {/* NEW AUTO-REGISTERED ACCOUNT CREDENTIALS */}
                {newAccountCredentials && (
                  <div className="quick-cred-box">
                    <div className="quick-cred-head">
                      <div className="quick-cred-title">
                        <span style={{ fontSize: 15 }}>🎉</span>
                        <span>আপনার রোগী অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে!</span>
                      </div>
                      <button
                        type="button"
                        className="quick-modal-no-print quick-cred-copy-btn"
                        onClick={() => {
                          const copyText = `পাবলিক আইডি: ${newAccountCredentials.patient_public_id}\nমোবাইল নম্বর: ${newAccountCredentials.login_phone}\nপাসওয়ার্ড: ${newAccountCredentials.temp_password}`
                          navigator.clipboard?.writeText(copyText)
                          toast.success('লগইন তথ্য কপি করা হয়েছে!')
                        }}
                      >
                        <IconCopy size={13} />
                        <span>কপি করুন</span>
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
                      <span>পরবর্তীতে অ্যাপয়েন্টমেন্ট ও প্রেসক্রিপশন দেখতে এই তথ্য দিয়ে লগইন করুন। প্রোফাইল থেকে যেকোনো সময় পাসওয়ার্ড পরিবর্তন করতে পারবেন।</span>
                    </div>
                  </div>
                )}

                {/* APPOINTMENT SUMMARY CARD */}
                <div className="quick-summary-box">
                  <div className="quick-summary-top">
                    <div>
                      <div className="quick-summary-doc">
                        {confirmedAppointmentData.doctor_name}
                      </div>
                      <div className="quick-summary-spec">
                        {confirmedAppointmentData.specialty}
                      </div>
                    </div>
                    <span className={`quick-badge-status ${confirmedAppointmentData.payment_status === 'পরিশোধিত' ? 'quick-badge-paid' : 'quick-badge-unpaid'}`}>
                      {confirmedAppointmentData.payment_status}
                    </span>
                  </div>

                  <div className="quick-summary-rows">
                    {confirmedAppointmentData.serial_number && (
                      <div className="quick-row-item">
                        <span className="quick-row-lbl">সিরিয়াল নম্বর:</span>
                        <span className="quick-row-val" style={{ color: '#00B875', fontWeight: 800, fontSize: 13.5 }}>
                          {toBengaliNumber(confirmedAppointmentData.serial_number)}
                        </span>
                      </div>
                    )}
                    <div className="quick-row-item">
                      <span className="quick-row-lbl">হাসপাতাল/চেম্বার:</span>
                      <span className="quick-row-val">{confirmedAppointmentData.hospital_name}</span>
                    </div>
                    <div className="quick-row-item">
                      <span className="quick-row-lbl">তারিখ ও সময়:</span>
                      <span className="quick-row-val">{confirmedAppointmentData.appointment_date} ({confirmedAppointmentData.appointment_time})</span>
                    </div>
                    <div className="quick-row-item">
                      <span className="quick-row-lbl">রোগীর নাম:</span>
                      <span className="quick-row-val">{confirmedAppointmentData.patient_name} {confirmedAppointmentData.relation ? `(${confirmedAppointmentData.relation})` : ''}</span>
                    </div>
                    {confirmedAppointmentData.patient_phone && (
                      <div className="quick-row-item">
                        <span className="quick-row-lbl">রোগীর ফোন নম্বর:</span>
                        <span className="quick-row-val">+880 {confirmedAppointmentData.patient_phone.replace(/^\+?880?|^0/, '')}</span>
                      </div>
                    )}
                    {confirmedAppointmentData.booking_for === 'relative' && confirmedAppointmentData.booker_phone && (
                      <div className="quick-row-item">
                        <span className="quick-row-lbl">বুকিংকারীর মোবাইল:</span>
                        <span className="quick-row-val">+880 {confirmedAppointmentData.booker_phone.replace(/^\+?880?|^0/, '')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 📡 INTERACTIVE LIVE SERIAL TRACKER BANNER */}
                <div className="quick-modal-no-print" style={{
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
                        animation: 'quickLivePulse 1.8s infinite'
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

                  <button
                    type="button"
                    onClick={() => {
                      setIsBookingModalOpen(false)
                      navigate(`/appointment-ticket/${confirmedAppointmentData.id}`)
                    }}
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
                </div>
              </div>

              <div className="quick-modal-no-print quick-footer-actions">
                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="quick-btn-print"
                >
                  <IconPrinter size={17} />
                  <span>প্রিন্ট/ডাউনলোড</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsBookingModalOpen(false)
                    setModalStep(1)
                  }}
                  className="quick-btn-finish"
                >
                  <span>সম্পন্ন ➔</span>
                </button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* ── BOOKING REJECTION / ERROR ALERT POPUP MODAL ── */}
      <Modal
        show={bookingErrorModal.isOpen}
        onHide={() => {
          if (bookingErrorModal.onConfirm) {
            bookingErrorModal.onConfirm()
          } else {
            setBookingErrorModal({ isOpen: false, title: '', message: '' })
            setIsBookingModalOpen(false)
            setModalStep(1)
            setOtp('')
            setOtpNotice('')
            setStep2Error('')
            setIsOtpVerified(false)
          }
        }}
        centered
        backdrop="static"
        keyboard={false}
        contentClassName="rounded-4 border-0 shadow-lg"
      >
        <Modal.Body style={{ padding: '32px 24px 26px', textAlign: 'center' }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: '#FEF2F2',
            border: '2px solid #FEE2E2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#DC2626'
          }}>
            <IconAlertCircle size={32} stroke={2.2} />
          </div>

          <h4 style={{
            fontSize: 18,
            fontWeight: 800,
            color: '#0F172A',
            marginBottom: 12,
            fontFamily: "'Hind Siliguri', sans-serif"
          }}>
            {bookingErrorModal.title || 'বুকিং সম্পন্ন করা সম্ভব হয়নি'}
          </h4>

          <p style={{
            fontSize: 14.5,
            color: '#475569',
            lineHeight: 1.6,
            marginBottom: 24,
            fontFamily: "'Hind Siliguri', sans-serif",
            padding: '0 6px'
          }}>
            {bookingErrorModal.message}
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
            {bookingErrorModal.viewAppointments && (
              <button
                type="button"
                onClick={() => {
                  setBookingErrorModal({ isOpen: false, title: '', message: '' })
                  setIsBookingModalOpen(false)
                  navigate('/my-appointments')
                }}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 12,
                  background: '#0EA5E9',
                  color: 'white',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 800,
                  fontFamily: "'Hind Siliguri', sans-serif",
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                <IconTicket size={18} />
                <span>অ্যাপয়েন্টমেন্ট তালিকা</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (bookingErrorModal.onConfirm) {
                  bookingErrorModal.onConfirm()
                } else {
                  setBookingErrorModal({ isOpen: false, title: '', message: '' })
                  setIsBookingModalOpen(false)
                  setModalStep(1)
                  setOtp('')
                  setOtpNotice('')
                  setStep2Error('')
                  setIsOtpVerified(false)
                }
              }}
              style={{
                flex: bookingErrorModal.viewAppointments ? 1 : 'none',
                width: bookingErrorModal.viewAppointments ? 'auto' : '100%',
                height: 46,
                borderRadius: 12,
                background: '#00B875',
                color: 'white',
                border: 'none',
                fontSize: 15,
                fontWeight: 800,
                fontFamily: "'Hind Siliguri', sans-serif",
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 184, 117, 0.28)',
                transition: 'all 0.15s ease'
              }}
            >
              {bookingErrorModal.confirmText || 'ঠিক আছে'}
            </button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  )
}

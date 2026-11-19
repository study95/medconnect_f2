import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Form, Button, Row, Col, Modal } from 'react-bootstrap'
import {
  Mail, Lock, User, ShieldCheck, Hotel, Phone,
  UserCircle, Shield, Clock, CalendarCheck,
  Heart, CheckCircle, Stethoscope, Search, Eye, EyeOff, ArrowRight, ChevronDown, AlertTriangle, LockKeyhole,
  Plus, Info, X, Loader2, FileText, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useDialog } from '../hooks/useDialog'
import { sendOtp, verifyOtp } from '../api/authApi'
import { getSpecialties } from '../api/adminApi'
import { getHospitals } from '../api/hospitalApi'
import { translateToBangla, getErrorMessage } from '../utils/errorHelper'
import { validateStrongPassword } from '../utils/passwordValidator'
import LegalDocumentModal from '../components/common/LegalDocumentModal'
import CustomCheckbox from '../components/common/CustomCheckbox'
import { useSiteSettings } from '../utils/contentService'
import { getMediaUrl } from '../utils/mediaUtils'
import '../styles/auth-premium.css'

const HOSPITAL_TYPES = [
  { id: 'Private Hospital', name: 'Private Hospital (বেসরকারি হাসপাতাল)' },
  { id: 'Govt Hospital', name: 'Govt Hospital (সরকারি হাসপাতাল)' },
  { id: 'Clinic', name: 'Clinic (ক্লিনিক)' },
  { id: 'Diagnostic Center', name: 'Diagnostic Center (ডায়াগনস্টিক সেন্টার)' },
  { id: 'Specialized Hospital (Maa-O-Shishu)', name: 'Specialized Hospital - Maa-O-Shishu (মা ও শিশু হাসপাতাল)' },
  { id: 'Specialized Hospital (Eye)', name: 'Specialized Hospital - Eye (চক্ষু হাসপাতাল)' },
  { id: 'Specialized Hospital (Cancer)', name: 'Specialized Hospital - Cancer (ক্যান্সার হাসপাতাল)' },
  { id: 'Specialized Hospital (Dental)', name: 'Specialized Hospital - Dental (ডেন্টাল হাসপাতাল)' },
  { id: 'Specialized Hospital (Other)', name: 'Specialized Hospital - Other (অন্যান্য বিশেষায়িত হাসপাতাল)' }
]

const RegisterPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const site = useSiteSettings()
  const { registerPatient, registerDoctor, registerHospital } = useAuth()
  const { showSuccess, showError, showWarning } = useDialog()

  // Derive initial role from URL path
  const pathRole = location.pathname === '/register/doctor'
    ? 'doctor'
    : location.pathname === '/register/hospital'
      ? 'hospital'
      : location.pathname === '/register/patient'
        ? 'patient'
        : ''

  const [role, setRole] = useState(pathRole)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Mobile OTP, 2: Details Form, 3: Success Screen
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false)
  const [specialties, setSpecialties] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [initialLoadingSpecialties, setInitialLoadingSpecialties] = useState(true)
  const [initialLoadingHospitals, setInitialLoadingHospitals] = useState(true)

  useEffect(() => {
    getSpecialties().then(res => {
      setSpecialties(res.data?.data || res.data || [])
    }).catch(() => {}).finally(() => setInitialLoadingSpecialties(false))

    getHospitals({ per_page: 100 }).then(res => {
      setHospitals(res.data?.data || res.data || [])
    }).catch(() => {}).finally(() => setInitialLoadingHospitals(false))
  }, [])

  // Sync role when URL changes
  useEffect(() => {
    const newRole = location.pathname === '/register/doctor'
      ? 'doctor'
      : location.pathname === '/register/hospital'
        ? 'hospital'
        : location.pathname === '/register/patient'
          ? 'patient'
          : ''
    if (newRole) setRole(newRole)
  }, [location.pathname])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlRole = params.get('role')
    if (urlRole && ['patient', 'doctor', 'hospital'].includes(urlRole)) {
      setRole(urlRole)
    }
  }, [])

  const [form, setForm] = useState({
    name: '', hospital_name: '', email: '', mobile: '',
    specialty_id: '', custom_specialty_name: '', workplace: '', hospital_id: '', bmdc_number: '',
    hospital_type: '', license_number: '', address: '', hotline: '', official_email: '',
    password: '', confirm: ''
  })

  // Doctor Specialty Searchable & Creatable Combobox State
  const [specialtySearch, setSpecialtySearch] = useState('')
  const [specialtyDropdownOpen, setSpecialtyDropdownOpen] = useState(false)
  const specialtyDropdownRef = useRef(null)

  // Doctor Hospital / Workplace Searchable & Creatable Combobox State
  const [hospitalSearch, setHospitalSearch] = useState('')
  const [hospitalDropdownOpen, setHospitalDropdownOpen] = useState(false)
  const [loadingHospitals, setLoadingHospitals] = useState(false)
  const hospitalDropdownRef = useRef(null)

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (specialtyDropdownRef.current && !specialtyDropdownRef.current.contains(e.target)) {
        setSpecialtyDropdownOpen(false)
      }
      if (hospitalDropdownRef.current && !hospitalDropdownRef.current.contains(e.target)) {
        setHospitalDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Dynamic server-side debounced search for hospitals
  useEffect(() => {
    if (!hospitalDropdownOpen || !hospitalSearch.trim() || hospitalSearch.trim().length < 2) {
      setLoadingHospitals(false)
      return
    }
    // If a hospital is already chosen and its name equals current search, don't trigger search
    if (form.hospital_id) {
      setLoadingHospitals(false)
      return
    }

    setLoadingHospitals(true)
    const timer = setTimeout(() => {
      getHospitals({ search: hospitalSearch.trim(), per_page: 50 })
        .then(res => {
          const results = res.data?.data || res.data || []
          setHospitals(prev => {
            const map = new Map()
            results.forEach(h => map.set(h.id, h))
            prev.forEach(h => {
              if (!map.has(h.id)) map.set(h.id, h)
            })
            return Array.from(map.values())
          })
        })
        .catch(() => {})
        .finally(() => setLoadingHospitals(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [hospitalSearch, hospitalDropdownOpen, form.hospital_id])

  const filteredSpecialties = useMemo(() => {
    if (!specialtySearch.trim()) return specialties
    const q = specialtySearch.trim().toLowerCase()
    return specialties.filter(s => s.name?.toLowerCase().includes(q))
  }, [specialties, specialtySearch])

  const hasExactSpecialtyMatch = useMemo(() => {
    if (!specialtySearch.trim()) return false
    const q = specialtySearch.trim().toLowerCase()
    return specialties.some(s => s.name?.trim().toLowerCase() === q)
  }, [specialties, specialtySearch])

  const handleSelectSpecialty = (s) => {
    setForm(prev => ({
      ...prev,
      specialty_id: s.id,
      custom_specialty_name: ''
    }))
    setSpecialtySearch(s.name)
    setSpecialtyDropdownOpen(false)
    if (fieldErrors.specialty_id) {
      setFieldErrors(prev => ({ ...prev, specialty_id: null }))
    }
  }

  const handleSelectCustomSpecialty = (name) => {
    const cleanName = (name || '').trim()
    if (!cleanName) return
    setForm(prev => ({
      ...prev,
      specialty_id: '',
      custom_specialty_name: cleanName
    }))
    setSpecialtySearch(cleanName)
    setSpecialtyDropdownOpen(false)
    if (fieldErrors.specialty_id) {
      setFieldErrors(prev => ({ ...prev, specialty_id: null }))
    }
  }

  const handleClearSpecialty = () => {
    setForm(prev => ({
      ...prev,
      specialty_id: '',
      custom_specialty_name: ''
    }))
    setSpecialtySearch('')
    setSpecialtyDropdownOpen(false)
  }

  // Hospital Combobox Helpers
  const filteredHospitals = useMemo(() => {
    if (!hospitalSearch.trim()) return hospitals
    const q = hospitalSearch.trim().toLowerCase()
    return hospitals.filter(h =>
      (h.name && h.name.toLowerCase().includes(q)) ||
      (h.name_bn && h.name_bn.toLowerCase().includes(q)) ||
      (h.address && h.address.toLowerCase().includes(q)) ||
      (h.district?.name && h.district.name.toLowerCase().includes(q)) ||
      (h.district?.bangla_name && h.district.bangla_name.toLowerCase().includes(q))
    )
  }, [hospitals, hospitalSearch])

  const hasExactHospitalMatch = useMemo(() => {
    if (!hospitalSearch.trim()) return false
    const q = hospitalSearch.trim().toLowerCase()
    return hospitals.some(h =>
      h.name?.trim().toLowerCase() === q ||
      h.name_bn?.trim().toLowerCase() === q
    )
  }, [hospitals, hospitalSearch])

  const handleSelectHospital = (h) => {
    const displayName = h.name_bn || h.name
    setForm(prev => ({
      ...prev,
      hospital_id: h.id,
      workplace: displayName
    }))
    setHospitalSearch(displayName)
    setHospitalDropdownOpen(false)
    if (fieldErrors.workplace) {
      setFieldErrors(prev => ({ ...prev, workplace: null }))
    }
  }

  const handleSelectCustomHospital = (name) => {
    const cleanName = (name || '').trim()
    if (!cleanName) return
    setForm(prev => ({
      ...prev,
      hospital_id: '',
      workplace: cleanName
    }))
    setHospitalSearch(cleanName)
    setHospitalDropdownOpen(false)
    if (fieldErrors.workplace) {
      setFieldErrors(prev => ({ ...prev, workplace: null }))
    }
  }

  const handleClearHospital = () => {
    setForm(prev => ({
      ...prev,
      hospital_id: '',
      workplace: ''
    }))
    setHospitalSearch('')
    setHospitalDropdownOpen(false)
  }

  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const [throttleTimer, setThrottleTimer] = useState(0)
  const [verifying, setVerifying] = useState(false)
  const [verificationToken, setVerificationToken] = useState(() => {
    return sessionStorage.getItem('doctor_reg_token') || ''
  })
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [legalModal, setLegalModal] = useState({ open: false, type: 'terms' })
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef([])

  // State for OTP Session Renewal on Step 2
  const [isOtpSessionExpired, setIsOtpSessionExpired] = useState(false)
  const [showOtpRenewModal, setShowOtpRenewModal] = useState(false)
  const [renewOtpDigits, setRenewOtpDigits] = useState(['', '', '', '', '', ''])
  const [renewOtpSending, setRenewOtpSending] = useState(false)
  const [renewOtpVerifying, setRenewOtpVerifying] = useState(false)
  const [renewOtpTimer, setRenewOtpTimer] = useState(0)
  const [renewOtpError, setRenewOtpError] = useState('')
  const renewOtpRefs = useRef([])

  // Restore step and mobile if page was accidentally refreshed after OTP verification
  useEffect(() => {
    const savedToken = sessionStorage.getItem('doctor_reg_token')
    const savedMobile = sessionStorage.getItem('reg_verified_mobile')
    if (savedToken && savedMobile && step === 1) {
      setForm(prev => ({ ...prev, mobile: savedMobile }))
      setVerificationToken(savedToken)
      setStep(2)
    }
  }, [])

  // Countdown timer effect for Renew OTP cooldown
  useEffect(() => {
    let interval = null
    if (renewOtpTimer > 0) {
      interval = setInterval(() => {
        setRenewOtpTimer(prev => prev - 1)
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [renewOtpTimer])

  // Countdown timer effect for OTP resend cooldown
  useEffect(() => {
    let interval = null
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1)
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [otpTimer])

  // Countdown timer effect for rate-limit throttle cooldown
  useEffect(() => {
    let interval = null
    if (throttleTimer > 0) {
      interval = setInterval(() => {
        setThrottleTimer(prev => {
          if (prev <= 1) {
            setFieldErrors(f => ({ ...f, mobile: '' }))
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [throttleTimer])

  const formatCountdown = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    const str = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    return str.replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d])
  }

  const roleConfigs = {
    patient: {
      label: 'রোগী',
      desc: 'স্বাস্থ্য ব্যবস্থাপনা ও অ্যাপয়েন্টমেন্ট নিন',
      icon: <User size={15} />,
      btnClass: 'patient-btn',
      color: '#00B875',
    },
    doctor: {
      label: 'ডাক্তার',
      desc: 'রোগী পরিচালনা ও সেবা দিন',
      icon: <ShieldCheck size={15} />,
      btnClass: 'doctor-btn',
      color: '#00B875',
    },
    hospital: {
      label: 'হাসপাতাল',
      desc: 'আপনার চিকিৎসা প্রতিষ্ঠান পরিচালনা করুন',
      icon: <Hotel size={15} />,
      btnClass: 'hospital-btn',
      color: '#00B875',
    }
  }

  const cfg = roleConfigs[role] || { label: '', icon: null, btnClass: 'patient-btn', color: '#00B875' }

  const leftPanelContent = {
    1: {
      title: 'পরিচয় যাচাই করুন',
      subtitle: 'আপনার সক্রিয় মোবাইল নম্বর দিয়ে পরিচয় নিশ্চিত করুন। এটি আপনার অ্যাকাউন্টের নিরাপত্তা সুনিশ্চিত করবে।',
      features: [
        { icon: <Shield size={16} />, text: 'OTP দিয়ে নিরাপদ যাচাই' },
        { icon: <Phone size={16} />, text: 'মোবাইলে তাৎক্ষণিক কোড পাঠানো হবে' },
        { icon: <Lock size={16} />, text: 'আপনার তথ্য সম্পূর্ণ এনক্রিপ্টেড' },
        { icon: <Clock size={16} />, text: 'মাত্র ১ মিনিটে সম্পন্ন করুন' },
      ]
    },
    2: {
      title: 'প্রায় সম্পন্ন! 🎉',
      subtitle: 'আপনার মোবাইল যাচাই সফল হয়েছে। এখন নাম, ইমেইল ও পাসওয়ার্ড দিয়ে রেজিস্টার সম্পন্ন করুন।',
      features: [
        { icon: <CheckCircle size={16} />, text: 'মোবাইল নম্বর যাচাই সম্পন্ন' },
        { icon: <UserCircle size={16} />, text: 'আপনার নাম ও ইমেইল ঠিকানা দিন' },
        { icon: <Lock size={16} />, text: 'একটি শক্তিশালী পাসওয়ার্ড সেট করুন' },
        { icon: <Heart size={16} />, text: 'পরে প্রোফাইল থেকে বাকি তথ্য আপডেট করতে পারবেন' },
      ]
    },
    3: {
      title: 'অভিনন্দন! 🎊',
      subtitle: 'আপনার Doctor Booklet অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। এখন আপনি সকল স্বাস্থ্যসেবা সুবিধা পেতে প্রস্তুত।',
      features: [
        { icon: <Stethoscope size={16} />, text: 'বিশেষজ্ঞ ডাক্তারদের সাথে সংযুক্ত হন' },
        { icon: <CalendarCheck size={16} />, text: 'সহজে অ্যাপয়েন্টমেন্ট বুকিং' },
        { icon: <Heart size={16} />, text: 'স্বাস্থ্য রেকর্ড সংরক্ষণ' },
        { icon: <Shield size={16} />, text: 'সম্পূর্ণ নিরাপদ ও গোপনীয়' },
      ]
    }
  }

  const handleLockedFieldClick = () => {
    if (!role) {
      setFieldErrors(prev => ({ ...prev, role: 'অনুগ্রহ করে প্রথমে ভূমিকা নির্বাচন করুন।' }))
    }
  }

  const [fieldErrors, setFieldErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    let updatedValue = value
    if (name === 'mobile') {
      // Allow only digits
      updatedValue = value.replace(/\D/g, '').slice(0, 11)
      if (isAlreadyRegistered) {
        setIsAlreadyRegistered(false)
      }
    }
    setFieldErrors(prev => ({ ...prev, [name]: '', mobile: name === 'mobile' ? '' : prev.mobile, general: '' }))
    setForm(prev => ({ ...prev, [name]: updatedValue }))
  }

  const handleSendOTP = async () => {
    if (otpTimer > 0 && otpSent) return
    setFieldErrors({})
    if (!role) {
      setFieldErrors({ role: 'অনুগ্রহ করে প্রথমে ভূমিকা নির্বাচন করুন।' })
      return
    }

    const mobileNum = form.mobile ? form.mobile.trim() : ''
    const bdMobileRegex = /^01[3-9]\d{8}$/

    if (!mobileNum) {
      setFieldErrors({ mobile: 'অনুগ্রহ করে মোবাইল নম্বর লিখুন।' })
      return
    }

    if (!bdMobileRegex.test(mobileNum)) {
      setFieldErrors({ mobile: 'সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)' })
      return
    }

    setLoading(true)
    setIsAlreadyRegistered(false)

    try {
      const res = await sendOtp({ mobile: mobileNum, type: 'registration' })

      if (res.data && res.data.already_registered) {
        setLoading(false)
        setIsAlreadyRegistered(true)
        setFieldErrors({ mobile: '' })
        return
      }

      if (res.data && res.data.success === false) {
        setLoading(false)
        if (res.data.retry_after_seconds || res.data.cooldown_seconds) {
          setThrottleTimer(Number(res.data.retry_after_seconds || res.data.cooldown_seconds))
        }
        setFieldErrors({ mobile: translateToBangla(res.data.message || 'OTP পাঠানো ব্যর্থ হয়েছে।') })
        return
      }

      setLoading(false)
      setOtpSent(true)
      setOtpDigits(['', '', '', '', '', ''])
      setOtp('')
      const cooldown = res.data?.cooldown_seconds || 60
      setOtpTimer(cooldown)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)

    } catch (err) {
      setLoading(false)
      const status = err.response?.status
      const errMsg = err.response?.data?.message || err.response?.data?.error || ''
      const isAlready = status === 409 || err.response?.data?.already_registered || errMsg.toLowerCase().includes('already') || errMsg.toLowerCase().includes('registered')

      if (isAlready) {
        setIsAlreadyRegistered(true)
        setFieldErrors({ mobile: '' })
        return
      }

      const retryAfter = err.response?.data?.retry_after_seconds || err.response?.data?.cooldown_seconds
      if (status === 429 && retryAfter) {
        setThrottleTimer(Number(retryAfter))
        setFieldErrors({ mobile: errMsg || 'ওটিপি অনুরোধের সীমা পৌঁছেছে।' })
        return
      }

      const displayError = getErrorMessage(err, 'মোবাইল নম্বরটি সঠিক নয় অথবা সিস্টেম সমস্যা হয়েছে। আবার চেষ্টা করুন।')
      setFieldErrors({ mobile: displayError })
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    setFieldErrors(prev => ({ ...prev, otp: '' }))
    const raw = e.clipboardData?.getData('text')?.trim() || ''
    const bnToEn = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' }
    const normalized = raw.replace(/[০-৯]/g, d => bnToEn[d] || d)
    const cleanDigits = normalized.replace(/\D/g, '')

    if (cleanDigits.length > 0) {
      const digits = cleanDigits.slice(0, 6).split('')
      const newDigits = ['', '', '', '', '', '']
      digits.forEach((d, i) => { newDigits[i] = d })
      setOtpDigits(newDigits)
      setOtp(newDigits.join(''))
      const targetFocus = Math.min(digits.length - 1, 5)
      setTimeout(() => otpRefs.current[targetFocus]?.focus(), 10)
    }
  }

  const handleOtpDigitChange = (index, value) => {
    const bnToEn = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' }
    const normalized = String(value).replace(/[০-৯]/g, d => bnToEn[d] || d)
    const cleanDigits = normalized.replace(/\D/g, '')

    // If multiple digits pasted / autofilled directly into this input
    if (cleanDigits.length > 1) {
      const digits = cleanDigits.slice(0, 6).split('')
      const newDigits = [...otpDigits]
      digits.forEach((d, i) => {
        if (index + i < 6) newDigits[index + i] = d
      })
      setOtpDigits(newDigits)
      setOtp(newDigits.join(''))
      setFieldErrors(prev => ({ ...prev, otp: '' }))
      const nextFocus = Math.min(index + digits.length - 1, 5)
      setTimeout(() => otpRefs.current[nextFocus]?.focus(), 10)
      return
    }

    const singleDigit = cleanDigits.slice(-1)
    const newDigits = [...otpDigits]
    newDigits[index] = singleDigit
    setOtpDigits(newDigits)
    setOtp(newDigits.join(''))
    setFieldErrors(prev => ({ ...prev, otp: '' }))

    if (singleDigit && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const entered = otpDigits.join('')
      if (entered.length === 6 && !verifying) {
        handleVerifyOTP()
      }
    }
  }

  const handleVerifyOTP = async () => {
    setFieldErrors({})
    const currentOtp = (otp && otp.length === 6) ? otp : otpDigits.join('')
    if (currentOtp.length !== 6) {
      setFieldErrors({ otp: '৬ সংখ্যার OTP কোড লিখুন' })
      return
    }
    setVerifying(true)
    try {
      const res = await verifyOtp({ mobile: form.mobile, otp: currentOtp })
      if (res.data?.success) {
        const vToken = res.data?.verification_token || ''
        setVerificationToken(vToken)
        sessionStorage.setItem('doctor_reg_token', vToken)
        sessionStorage.setItem('reg_verified_mobile', form.mobile)
        setIsOtpSessionExpired(false)
        setStep(2)
      } else {
        setFieldErrors({ otp: res.data?.message || 'ভুল ওটিপি কোড!' })
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'ভুল ওটিপি কোড! অনুগ্রহ করে আবার চেষ্টা করুন।'
      setFieldErrors({ otp: errMsg })
      if (err.response?.status === 429 || errMsg.includes('সীমা') || errMsg.includes('মেয়াদ')) {
        setOtpDigits(['', '', '', '', '', ''])
        setOtp('')
        setTimeout(() => otpRefs.current[0]?.focus(), 50)
      }
    } finally {
      setVerifying(false)
    }
  }

  // ── INLINE OTP SESSION RENEWAL HANDLERS ──
  const handleRenewPaste = (e) => {
    e.preventDefault()
    setRenewOtpError('')
    const raw = e.clipboardData?.getData('text')?.trim() || ''
    const bnToEn = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' }
    const normalized = raw.replace(/[০-৯]/g, d => bnToEn[d] || d)
    const cleanDigits = normalized.replace(/\D/g, '')

    if (cleanDigits.length > 0) {
      const digits = cleanDigits.slice(0, 6).split('')
      const newDigits = ['', '', '', '', '', '']
      digits.forEach((d, i) => { newDigits[i] = d })
      setRenewOtpDigits(newDigits)
      const targetFocus = Math.min(digits.length - 1, 5)
      setTimeout(() => renewOtpRefs.current[targetFocus]?.focus(), 10)
    }
  }

  const handleRenewDigitChange = (index, value) => {
    const bnToEn = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' }
    const normalized = String(value).replace(/[০-৯]/g, d => bnToEn[d] || d)
    const cleanDigits = normalized.replace(/\D/g, '')

    if (cleanDigits.length > 1) {
      const digits = cleanDigits.slice(0, 6).split('')
      const newDigits = [...renewOtpDigits]
      digits.forEach((d, i) => {
        if (index + i < 6) newDigits[index + i] = d
      })
      setRenewOtpDigits(newDigits)
      setRenewOtpError('')
      const nextFocus = Math.min(index + digits.length - 1, 5)
      setTimeout(() => renewOtpRefs.current[nextFocus]?.focus(), 10)
      return
    }

    const singleDigit = cleanDigits.slice(-1)
    const newDigits = [...renewOtpDigits]
    newDigits[index] = singleDigit
    setRenewOtpDigits(newDigits)
    setRenewOtpError('')

    if (singleDigit && index < 5) {
      renewOtpRefs.current[index + 1]?.focus()
    }
  }

  const handleRenewKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !renewOtpDigits[index] && index > 0) {
      renewOtpRefs.current[index - 1]?.focus()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const entered = renewOtpDigits.join('')
      if (entered.length === 6 && !renewOtpVerifying) {
        handleVerifyRenewOtp()
      }
    }
  }

  const handleTriggerRenewOtp = async () => {
    setRenewOtpError('')
    setRenewOtpSending(true)
    const mobileToUse = (form.mobile || sessionStorage.getItem('reg_verified_mobile') || '').trim()
    try {
      const res = await sendOtp({ mobile: mobileToUse, type: 'registration' })
      if (res.data?.success === false) {
        setRenewOtpError(translateToBangla(res.data?.message || 'ওটিপি পাঠাতে সমস্যা হয়েছে।'))
      } else {
        const cooldown = res.data?.cooldown_seconds || 60
        setRenewOtpTimer(cooldown)
        setRenewOtpDigits(['', '', '', '', '', ''])
        setTimeout(() => renewOtpRefs.current[0]?.focus(), 150)
      }
    } catch (err) {
      setRenewOtpError(getErrorMessage(err, 'ওটিপি পাঠাতে সমস্যা হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।'))
    } finally {
      setRenewOtpSending(false)
    }
  }

  const handleOpenRenewModal = () => {
    setShowOtpRenewModal(true)
    handleTriggerRenewOtp()
  }

  const handleVerifyRenewOtp = async () => {
    setRenewOtpError('')
    const entered = renewOtpDigits.join('')
    if (entered.length !== 6) {
      setRenewOtpError('অনুগ্রহ করে সঠিক ৬ সংখ্যার ওটিপি কোড লিখুন।')
      return
    }

    setRenewOtpVerifying(true)
    const mobileToUse = (form.mobile || sessionStorage.getItem('reg_verified_mobile') || '').trim()
    try {
      const res = await verifyOtp({ mobile: mobileToUse, otp: entered })
      if (res.data?.success) {
        const newToken = res.data?.verification_token || ''
        setVerificationToken(newToken)
        sessionStorage.setItem('doctor_reg_token', newToken)
        setShowOtpRenewModal(false)
        setIsOtpSessionExpired(false)
        setFieldErrors(prev => ({ ...prev, general: '' }))
        toast.success('ওটিপি সফলভাবে যাচাই করা হয়েছে! এবার অ্যাকাউন্ট তৈরি সম্পন্ন করা হচ্ছে...')
        setTimeout(() => {
          handleSubmit(null, newToken)
        }, 350)
      } else {
        setRenewOtpError(res.data?.message || 'ভুল ওটিপি কোড! অনুগ্রহ করে আবার চেষ্টা করুন।')
      }
    } catch (err) {
      setRenewOtpError(getErrorMessage(err, 'ভুল ওটিপি কোড! অনুগ্রহ করে আবার চেষ্টা করুন।'))
    } finally {
      setRenewOtpVerifying(false)
    }
  }

  const scrollToFirstError = (errorsObj) => {
    if (!errorsObj || typeof errorsObj !== 'object') return
    const keys = Object.keys(errorsObj).filter(k => !!errorsObj[k])
    if (keys.length === 0) return

    // Order of fields from top of form to bottom
    const fieldOrder = [
      'name',
      'email',
      'hospital_name',
      'hospital_type',
      'license_number',
      'address',
      'specialty_id',
      'workplace',
      'bmdc_number',
      'password',
      'confirm',
      'terms',
      'general'
    ]

    const firstKey = fieldOrder.find(k => keys.includes(k)) || keys[0]

    setTimeout(() => {
      let targetEl = null

      if (firstKey === 'specialty_id') {
        targetEl = specialtyDropdownRef.current || document.querySelector('[name="specialty_search"]')
      } else if (firstKey === 'workplace') {
        targetEl = hospitalDropdownRef.current || document.querySelector('[name="hospital_search"]')
      } else if (firstKey === 'terms') {
        targetEl = document.querySelector('input[type="checkbox"]')
      } else if (firstKey === 'general') {
        targetEl = document.querySelector('.auth-card-premium') || document.querySelector('.auth-main-card')
      } else {
        targetEl = document.querySelector(`[name="${firstKey}"]`)
      }

      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        if (typeof targetEl.focus === 'function' && firstKey !== 'terms') {
          targetEl.focus({ preventScroll: true })
        }
      }
    }, 120)
  }

  const handleSubmit = async (e, tokenOverride = null) => {
    if (e && e.preventDefault) e.preventDefault()
    setFieldErrors({})

    if (!agreedToTerms) {
      const err = { terms: 'রেজিস্ট্রেশন সম্পন্ন করতে ব্যবহারের শর্তাবলী ও গোপনীয়তা নীতিতে সম্মতি প্রদান করুন।' }
      setFieldErrors(err)
      scrollToFirstError(err)
      return
    }

    if (form.password !== form.confirm) {
      const err = { confirm: 'পাসওয়ার্ড মিলছে না!' }
      setFieldErrors(err)
      scrollToFirstError(err)
      return
    }
    const pwdCheck = validateStrongPassword(form.password)
    if (!pwdCheck.valid) {
      const err = { password: pwdCheck.message }
      setFieldErrors(err)
      scrollToFirstError(err)
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('name', role === 'hospital' ? form.hospital_name : form.name)
    if (role === 'hospital') formData.append('hospital_name', form.hospital_name)
    formData.append('email', form.email)
    formData.append('mobile', form.mobile)
    formData.append('password', form.password)

    const activeToken = tokenOverride || verificationToken || sessionStorage.getItem('doctor_reg_token') || ''
    if (activeToken) formData.append('verification_token', activeToken)

    if (role === 'doctor') {
      if (!form.specialty_id && !form.custom_specialty_name?.trim()) {
        setLoading(false)
        const err = { specialty_id: 'স্পেশালটি নির্বাচন করা বা নতুন নাম লেখা বাধ্যতামূলক।' }
        setFieldErrors(err)
        scrollToFirstError(err)
        return
      }
      if (!form.workplace || !form.workplace.trim()) {
        setLoading(false)
        const err = { workplace: 'বর্তমান কর্মস্থল / হাসপাতাল নির্বাচন করা বা নাম লেখা বাধ্যতামূলক।' }
        setFieldErrors(err)
        scrollToFirstError(err)
        return
      }
      if (!form.bmdc_number || !form.bmdc_number.trim()) {
        setLoading(false)
        const err = { bmdc_number: 'বিএমডিসি নম্বর দেওয়া বাধ্যতামূলক।' }
        setFieldErrors(err)
        scrollToFirstError(err)
        return
      }
      if (form.custom_specialty_name?.trim()) {
        formData.append('custom_specialty_name', form.custom_specialty_name.trim())
      } else {
        formData.append('specialty_id', form.specialty_id)
      }
      if (form.hospital_id) {
        formData.append('hospital_id', form.hospital_id)
      }
      formData.append('workplace', form.workplace)
      formData.append('bmdc_number', form.bmdc_number)
      formData.append('bmdc', form.bmdc_number)
    }

    if (role === 'hospital') {
      if (!form.hospital_name || !form.hospital_name.trim()) {
        setLoading(false)
        const err = { hospital_name: 'হাসপাতালের নাম দেওয়া বাধ্যতামূলক।' }
        setFieldErrors(err)
        scrollToFirstError(err)
        return
      }
      if (!form.hospital_type) {
        setLoading(false)
        const err = { hospital_type: 'হাসপাতালের ধরন নির্বাচন করা বাধ্যতামূলক।' }
        setFieldErrors(err)
        scrollToFirstError(err)
        return
      }
      if (!form.license_number || !form.license_number.trim()) {
        setLoading(false)
        const err = { license_number: 'লাইসেন্স নম্বর দেওয়া বাধ্যতামূলক।' }
        setFieldErrors(err)
        scrollToFirstError(err)
        return
      }
      if (!form.address || !form.address.trim()) {
        setLoading(false)
        const err = { address: 'হাসপাতালের ঠিকানা দেওয়া বাধ্যতামূলক।' }
        setFieldErrors(err)
        scrollToFirstError(err)
        return
      }
      formData.append('hospital_name', form.hospital_name)
      formData.append('hospital_type', form.hospital_type)
      formData.append('license_number', form.license_number)
      formData.append('address', form.address)
      if (form.hotline) formData.append('hotline', form.hotline)
      if (form.official_email) {
        formData.append('official_email', form.official_email)
        if (!form.email) formData.append('email', form.official_email)
      }
    }

    let result
    if (role === 'patient') result = await registerPatient(formData)
    else if (role === 'doctor') result = await registerDoctor(formData)
    else result = await registerHospital(formData)

    setLoading(false)
    if (result.success) {
      sessionStorage.removeItem('doctor_reg_token')
      sessionStorage.removeItem('reg_verified_mobile')
      setIsOtpSessionExpired(false)

      const roleTitle = role === 'doctor'
        ? 'ডাক্তার নিবন্ধন সফল হয়েছে! 🩺'
        : (role === 'hospital' ? 'হাসপাতাল নিবন্ধন সফল হয়েছে! 🏥' : 'রেজিস্ট্রেশন সফল হয়েছে! 🎉')
      const roleMsg = role === 'patient'
        ? 'আপনার Doctor Booklet অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। প্রোফাইল আপডেট করে সেবা গ্রহণ করতে পারেন।'
        : 'আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। প্রোফাইল অনুমোদনের জন্য পরবর্তী ভেরিফিকেশন ধাপে যান।'

      await showSuccess({
        title: roleTitle,
        message: roleMsg,
        confirmText: role === 'patient' ? 'প্রোফাইলে যান' : 'পরবর্তী ধাপে যান',
        autoCloseMs: 2500
      })

      if (role === 'doctor' || role === 'hospital') {
        navigate('/pending-verification', {
          replace: true,
          state: {
            type: role,
            name: role === 'hospital' ? (form.hospital_name || form.name) : form.name,
            phone: form.phone || form.mobile,
            mobile: form.phone || form.mobile,
            email: form.email,
            bmdc: form.bmdc_number || form.bmdc,
            bmdc_number: form.bmdc_number || form.bmdc,
            license_number: form.license_number,
            workplace: form.workplace || form.workplace_bn,
            hospital_name: form.hospital_name || form.name,
            created_at: new Date().toISOString()
          }
        })
        return
      }
      setStep(3)
    } else {
      const errMsg = result.message || ''
      const isOtpExpired = result.is_otp_expired ||
        errMsg.toLowerCase().includes('otp') ||
        errMsg.includes('ওটিপি') ||
        errMsg.includes('যাচাই করা হয়নি') ||
        errMsg.includes('মেয়াদ শেষ')

      if (isOtpExpired) {
        setIsOtpSessionExpired(true)
        setFieldErrors({ general: 'নিরাপত্তাজনিত কারণে আপনার ভেরিফিকেশন সেশনের মেয়াদ শেষ হয়েছে।' })
        handleOpenRenewModal()
        return
      }

      const serverErrors = result.errors || {}
      const mappedErrors = {}

      // 1. Map backend field errors if present
      Object.keys(serverErrors).forEach(k => {
        const val = Array.isArray(serverErrors[k]) ? serverErrors[k][0] : serverErrors[k]
        if (k === 'bmdc' || k === 'bmdc_number') mappedErrors.bmdc_number = val
        else if (k === 'phone' || k === 'mobile') mappedErrors.mobile = val
        else if (k === 'custom_specialty_name') mappedErrors.specialty_id = val
        else mappedErrors[k] = val
      })

      // 2. Identify field from error message text if not already mapped
      if (errMsg) {
        const lower = errMsg.toLowerCase()
        if ((lower.includes('bmdc') || errMsg.includes('বিএমডিসি')) && !mappedErrors.bmdc_number) {
          mappedErrors.bmdc_number = errMsg
        } else if ((lower.includes('email') || errMsg.includes('ইমেইল')) && !mappedErrors.email) {
          mappedErrors.email = errMsg
        } else if ((lower.includes('license') || errMsg.includes('লাইসেন্স')) && !mappedErrors.license_number) {
          mappedErrors.license_number = errMsg
        } else if ((lower.includes('hospital') || errMsg.includes('হাসপাতাল')) && !mappedErrors.hospital_name) {
          mappedErrors.hospital_name = errMsg
        } else if ((lower.includes('specialty') || errMsg.includes('স্পেশালটি')) && !mappedErrors.specialty_id) {
          mappedErrors.specialty_id = errMsg
        } else if ((lower.includes('phone') || lower.includes('mobile') || errMsg.includes('মোবাইল')) && !mappedErrors.mobile) {
          mappedErrors.mobile = errMsg
        } else if (Object.keys(mappedErrors).length === 0) {
          mappedErrors.general = translateToBangla(errMsg)
        }
      }

      // If mobile conflict specifically on Step 1
      if (mappedErrors.mobile && (errMsg.toLowerCase().includes('already') || errMsg.includes('ইতিমধ্যে নিবন্ধিত'))) {
        setStep(1)
        setOtpSent(false)
        setIsAlreadyRegistered(true)
      }

      setFieldErrors(mappedErrors)
      scrollToFirstError(mappedErrors)

      // Suppress redundant floating toast when field-specific inline error is already shown!
      // Only show error dialog if it's an unmapped general system error
      if (errMsg && Object.keys(mappedErrors).length === 0) {
        showError({
          title: 'নিবন্ধন সম্পন্ন হয়নি',
          message: errMsg,
          confirmText: 'ঠিক আছে'
        })
      }
    }
  }

  const StepIndicator = ({ currentStep }) => {
    const steps = [1, 2, 3]
    return (
      <div className="auth-step-indicator">
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              className={`auth-step-dot ${currentStep === s ? 'active' : ''} ${currentStep > s ? 'completed' : ''}`}
            />
            {i < steps.length - 1 && (
              <div className={`auth-step-line ${currentStep > s ? 'completed' : ''}`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  const panelContent = leftPanelContent[step] || leftPanelContent[1]

  return (
    <div className="auth-premium-wrapper">
      <div className="auth-mesh-bg" />

      {/* SPLIT CONTAINER CENTERED IN PAGE */}
      <div className="auth-split-container fade-in-up">
        
        {/* ===== LEFT PANEL — EXECUTIVE NAVY BRANDING ===== */}
        <div className="auth-info-panel">
          <div>
            <Link to="/" className="info-panel-logo mb-4 text-decoration-none" style={{ cursor: 'pointer' }}>
              <img 
                src={site?.logo_url ? getMediaUrl(site.logo_url, '/doctorBookletLogo.png') : '/doctorBookletLogo.png'} 
                alt={site?.name || 'Doctor Booklet Logo'} 
                onError={(e) => { e.target.src = '/doctorBookletLogo.png' }}
                style={{ height: '38px', width: 'auto', objectFit: 'contain' }} 
              />
            </Link>

            <h2 className="info-panel-title">{panelContent.title}</h2>
            <p className="info-panel-subtitle">{panelContent.subtitle}</p>

            <ul className="info-feature-list">
              {panelContent.features.map((f, i) => (
                <li key={i} className="info-feature-item">
                  <span className="info-feature-icon">{f.icon}</span>
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="info-trust-badge">
            <Shield size={14} />
            <span>SSL সুরক্ষিত · গোপনীয়তা বজায় থাকবে</span>
          </div>
        </div>

        {/* ===== RIGHT PANEL — CLEAN WHITE ACTIVE FORM ===== */}
        <div className="auth-form-panel">
          <div className="slide-in-right">
            
            {/* Step Indicator */}
            <StepIndicator currentStep={step} />

            {/* Account Type Selection Dropdown & Info Message (Steps 1 & 2) */}
            {step !== 3 && (
              <>
                <Form.Group style={{ marginBottom: 6 }}>
                  <Form.Label className="auth-label-premium">
                    অ্যাকাউন্টের ধরন (Account Type) <span style={{ color: '#EF4444', marginLeft: 2, fontWeight: 700 }}>*</span>
                  </Form.Label>
                  <div className="input-group-premium" style={{ position: 'relative' }}>
                    <span className="input-icon-premium" style={{ color: role ? cfg.color : '#94A3B8' }}>
                      {role ? cfg.icon : <User size={15} />}
                    </span>
                    <Form.Select
                      id="register-role-select"
                      value={role}
                      onChange={(e) => {
                        const val = e.target.value
                        setRole(val)
                        setFieldErrors(prev => ({ ...prev, role: '' }))
                        if (val === 'doctor') navigate('/register/doctor', { replace: true })
                        else if (val === 'hospital') navigate('/register/hospital', { replace: true })
                        else if (val === 'patient') navigate('/register/patient', { replace: true })
                      }}
                      className="auth-input-premium"
                      style={{
                        paddingLeft: 46,
                        paddingRight: 42,
                        cursor: 'pointer',
                        fontWeight: role ? 600 : 400,
                        color: role ? '#0F172A' : '#94A3B8',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                      }}
                    >
                      <option value="" disabled>— অ্যাকাউন্টের ধরন বেছে নিন —</option>
                      <option value="patient">রোগী (Patient)</option>
                      <option value="doctor">ডাক্তার (Doctor)</option>
                      <option value="hospital">হাসপাতাল (Hospital)</option>
                    </Form.Select>
                    <span style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      pointerEvents: 'none', color: '#64748B', display: 'flex', alignItems: 'center'
                    }}>
                      <ChevronDown size={17} />
                    </span>
                  </div>
                </Form.Group>

                {/* Inline Red Error for Role */}
                {fieldErrors.role && (
                  <p className="fade-in-up" style={{ color: '#DC2626', fontSize: 12.5, fontWeight: 600, marginTop: 4, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0 }} /> {fieldErrors.role}
                  </p>
                )}

                {/* Dynamic Role Selected Message */}
                {role && (
                  <p
                    key={role}
                    className="fade-in-up"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: role === 'patient' ? '#0D9488' : role === 'doctor' ? '#2563EB' : '#4F46E5',
                      fontWeight: 600,
                      fontSize: 12.5,
                      marginTop: 4,
                      marginBottom: 10,
                    }}
                  >
                    {role === 'patient' && (<><User size={14} style={{ flexShrink: 0 }} /> আপনি রোগী হিসেবে রেজিস্টার করছেন।</>)}
                    {role === 'doctor' && (<><ShieldCheck size={14} style={{ flexShrink: 0 }} /> আপনি ডাক্তার হিসেবে রেজিস্টার করছেন।</>)}
                    {role === 'hospital' && (<><Hotel size={14} style={{ flexShrink: 0 }} /> আপনি হাসপাতাল হিসেবে রেজিস্টার করছেন।</>)}
                  </p>
                )}
              </>
            )}

            {/* ===== STEP 1: MOBILE VERIFICATION ===== */}
            {step === 1 && (
              <div className="slide-in-right" key="step1">
                <h3 style={{ fontWeight: 800, color: '#0F172A', fontSize: 22, marginBottom: 4, letterSpacing: '-0.5px' }}>
                  মোবাইল নম্বর যাচাই
                </h3>
                <p style={{ color: '#64748B', fontWeight: 500, fontSize: 13.5, marginBottom: 20 }}>
                  আপনার সক্রিয় মোবাইল নম্বর দিন
                </p>

                <Form.Group style={{ marginBottom: 18 }}>
                  <Form.Label className="auth-label-premium" style={{ color: !role ? '#94A3B8' : undefined }}>
                    মোবাইল নম্বর <span style={{ color: !role ? '#94A3B8' : '#EF4444', marginLeft: 2, fontWeight: 700 }}>*</span> {!role && <LockKeyhole size={12} style={{ marginLeft: 4, opacity: 0.6 }} />}
                  </Form.Label>
                  <div
                    className="input-group-premium"
                    onClick={handleLockedFieldClick}
                    style={{
                      cursor: !role ? 'not-allowed' : undefined,
                      opacity: !role ? 0.55 : 1,
                      transition: 'opacity 0.3s',
                      position: 'relative',
                    }}
                  >
                    {!role && (
                      <div style={{
                        position: 'absolute', inset: 0, zIndex: 10,
                        borderRadius: 10, cursor: 'not-allowed',
                        background: 'rgba(248,250,252,0.6)',
                      }} />
                    )}
                    <span className="input-icon-premium"><Phone size={17} /></span>
                    <Form.Control
                      name="mobile" type="tel" placeholder="01XXXXXXXXX"
                      value={form.mobile} onChange={handleChange} required
                      className="auth-input-premium" disabled={otpSent || !role}
                      style={{ paddingRight: 118, cursor: (!otpSent && !role) ? 'not-allowed' : undefined }}
                      maxLength={11}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (role && (form.mobile || '').replace(/[^\d]/g, '').length === 11 && !loading && otpTimer === 0 && throttleTimer === 0) {
                            handleSendOTP()
                          }
                        }
                      }}
                    />
                    {!otpSent ? (
                      <button
                        type="button"
                        onClick={() => role ? handleSendOTP() : handleLockedFieldClick()}
                        disabled={loading || !role || (form.mobile || '').replace(/[^\d]/g, '').length < 11 || otpTimer > 0 || throttleTimer > 0}
                        style={{
                          position: 'absolute',
                          right: 5,
                          top: 5,
                          bottom: 5,
                          padding: '0 14px',
                          background: (role && (form.mobile || '').replace(/[^\d]/g, '').length === 11 && !loading && otpTimer === 0 && throttleTimer === 0)
                            ? 'linear-gradient(135deg, #00B875 0%, #059669 100%)'
                            : '#E2E8F0',
                          color: (role && (form.mobile || '').replace(/[^\d]/g, '').length === 11 && !loading && otpTimer === 0 && throttleTimer === 0)
                            ? '#FFFFFF'
                            : '#94A3B8',
                          border: 'none',
                          borderRadius: 8,
                          fontSize: 12.5,
                          fontWeight: 700,
                          zIndex: 11,
                          cursor: (loading || !role || (form.mobile || '').replace(/[^\d]/g, '').length < 11 || otpTimer > 0 || throttleTimer > 0) ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          transition: 'all 0.2s',
                          boxShadow: (role && (form.mobile || '').replace(/[^\d]/g, '').length === 11 && !loading && otpTimer === 0 && throttleTimer === 0)
                            ? '0 2px 8px rgba(0, 184, 117, 0.25)'
                            : 'none'
                        }}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm" style={{ width: 13, height: 13 }} role="status" aria-hidden="true" />
                            <span style={{ fontSize: 11 }}>যাচাই...</span>
                          </>
                        ) : otpTimer > 0 ? (
                          <span style={{ fontSize: 11 }}>অপেক্ষা ({formatCountdown(otpTimer)})</span>
                        ) : throttleTimer > 0 ? (
                          <span style={{ fontSize: 11 }}>অপেক্ষা ({formatCountdown(throttleTimer)})</span>
                        ) : (
                          'OTP পাঠান'
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtpDigits(['','','','','','']); setOtp(''); setFieldErrors({}); }}
                        style={{
                          position: 'absolute',
                          right: 6,
                          top: 6,
                          bottom: 6,
                          padding: '0 12px',
                          background: '#ECFDF5',
                          border: '1px solid #A7F3D0',
                          borderRadius: 8,
                          color: '#059669',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          zIndex: 11,
                          transition: 'all 0.2s'
                        }}
                      >
                        <span>পরিবর্তন</span>
                      </button>
                    )}
                  </div>

                  {/* Cooldown notice if number was changed while cooldown is active */}
                  {otpTimer > 0 && !otpSent && !isAlreadyRegistered && throttleTimer === 0 && (
                    <div className="fade-in-up" style={{
                      marginTop: 8,
                      padding: '7px 12px',
                      background: '#F0FDF4',
                      border: '1px solid #D1FAE5',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      fontFamily: "'Hind Siliguri', sans-serif"
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#065F46', fontWeight: 600 }}>
                        <Clock size={14} color="#059669" style={{ flexShrink: 0 }} />
                        <span>নতুন নম্বরে ওটিপি পাঠাতে অপেক্ষা করুন</span>
                      </div>
                      <span style={{
                        padding: '2px 8px',
                        background: '#FFFFFF',
                        border: '1px solid #A7F3D0',
                        borderRadius: 6,
                        color: '#047857',
                        fontFamily: "'Inter', monospace",
                        fontWeight: 800,
                        fontSize: 12,
                        letterSpacing: '0.3px',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 1px 2px rgba(4, 120, 87, 0.05)',
                        flexShrink: 0
                      }}>
                        {formatCountdown(otpTimer)}
                      </span>
                    </div>
                  )}

                  {/* Rate limit throttle live countdown alert card */}
                  {throttleTimer > 0 && !isAlreadyRegistered && (
                    <div className="fade-in-up" style={{
                      marginTop: 10,
                      padding: '10px 14px',
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      borderRadius: 10,
                      color: '#991B1B',
                      fontSize: 12.5,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Clock size={16} color="#DC2626" style={{ flexShrink: 0 }} />
                        <span>ওটিপি অনুরোধের সীমা পূর্ণ হয়েছে। বাকি সময়:</span>
                      </div>
                      <span style={{
                        padding: '2px 8px',
                        background: '#FEE2E2',
                        border: '1px solid #FCA5A5',
                        borderRadius: 6,
                        color: '#B91C1C',
                        fontFamily: "'Inter', monospace",
                        fontWeight: 800,
                        fontSize: 13,
                        whiteSpace: 'nowrap'
                      }}>
                        ⏳ {formatCountdown(throttleTimer)}
                      </span>
                    </div>
                  )}

                  {/* Inline Red Error under Mobile Field (only when not throttling) */}
                  {fieldErrors.mobile && !isAlreadyRegistered && throttleTimer === 0 && (
                    <p className="fade-in-up" style={{ color: '#DC2626', fontSize: 12.5, fontWeight: 600, marginTop: 6, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0 }} /> {fieldErrors.mobile}
                    </p>
                  )}
                </Form.Group>

                {/* Already Registered Alert Box */}
                {isAlreadyRegistered && (
                  <div className="slide-in-right" style={{
                    marginTop: 16,
                    padding: '14px 16px',
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertTriangle size={16} color="#DC2626" />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#991B1B' }}>
                        এই নম্বরটি ইতিমধ্যে নিবন্ধিত!
                      </span>
                    </div>
                    <Button
                      onClick={() => navigate('/login')}
                      style={{
                        background: '#DC2626',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 700,
                        padding: '6px 14px',
                        color: '#FFFFFF',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      লগইন করুন →
                    </Button>
                  </div>
                )}

                {/* OTP Input Fields */}
                {otpSent && !isAlreadyRegistered && (
                  <div className="slide-in-right">
                    <Form.Group style={{ marginBottom: 22 }}>
                      <Form.Label className="auth-label-premium" style={{ marginBottom: 10 }}>৬ সংখ্যার OTP কোড লিখুন</Form.Label>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }} onPaste={handleOtpPaste}>
                        {otpDigits.map((digit, i) => (
                          <input
                            key={i}
                            ref={el => otpRefs.current[i] = el}
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={digit}
                            onChange={e => handleOtpDigitChange(i, e.target.value)}
                            onKeyDown={e => handleOtpKeyDown(i, e)}
                            onPaste={handleOtpPaste}
                            style={{
                              width: 44, height: 50, textAlign: 'center',
                              fontSize: 20, fontWeight: 800, borderRadius: 10,
                              border: digit ? '2px solid #00B875' : '1.5px solid #CBD5E1',
                              background: digit ? '#F0FDF4' : '#FFFFFF',
                              outline: 'none', transition: 'all 0.2s',
                              color: '#0F172A', fontFamily: "'Inter', monospace",
                              boxShadow: digit ? '0 2px 8px rgba(0, 184, 117, 0.15)' : 'none'
                            }}
                            onFocus={e => { e.target.style.borderColor = '#00B875'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 184, 117, 0.15)' }}
                            onBlur={e => { e.target.style.borderColor = digit ? '#00B875' : '#CBD5E1'; e.target.style.boxShadow = digit ? '0 2px 8px rgba(0, 184, 117, 0.15)' : 'none' }}
                          />
                        ))}
                      </div>

                      {/* Premium Error Alert Card for OTP */}
                      {fieldErrors.otp && (
                        <div className="fade-in-up" style={{
                          marginTop: 12,
                          marginBottom: 4,
                          padding: '9px 14px',
                          background: '#FEF2F2',
                          border: '1px solid #FECACA',
                          borderRadius: 10,
                          color: '#DC2626',
                          fontSize: 12.5,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          textAlign: 'center',
                          lineHeight: 1.4
                        }}>
                          <AlertTriangle size={15} color="#DC2626" style={{ flexShrink: 0 }} />
                          <span>{fieldErrors.otp}</span>
                        </div>
                      )}

                      <div style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 14, fontWeight: 500 }}>
                        <span>কোড পাননি? </span>
                        {otpTimer > 0 ? (
                          <span style={{
                            color: '#94A3B8',
                            fontWeight: 500,
                            cursor: 'not-allowed',
                            userSelect: 'none',
                            opacity: 0.65
                          }}>
                            পুনরায় পাঠান ({`${Math.floor(otpTimer / 60)}:${(otpTimer % 60).toString().padStart(2, '0')}`.replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d])})
                          </span>
                        ) : throttleTimer > 0 ? (
                          <span style={{
                            color: '#94A3B8',
                            fontWeight: 500,
                            cursor: 'not-allowed',
                            userSelect: 'none',
                            opacity: 0.65
                          }}>
                            পুনরায় পাঠান ({formatCountdown(throttleTimer)})
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendOTP}
                            disabled={loading}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#00B875',
                              fontWeight: 700,
                              fontSize: 13,
                              cursor: loading ? 'not-allowed' : 'pointer',
                              textDecoration: 'underline',
                              padding: 0
                            }}
                          >
                            {loading ? 'পাঠানো হচ্ছে...' : 'পুনরায় পাঠান'}
                          </button>
                        )}
                      </div>
                    </Form.Group>

                    <Button
                      onClick={handleVerifyOTP} disabled={verifying || otp.length !== 6}
                      className={`w-100 auth-btn-premium ${cfg.btnClass}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      {verifying
                        ? <><span className="spinner-border spinner-border-sm me-2" /> যাচাই হচ্ছে...</>
                        : <><span>যাচাই করুন ও চালিয়ে যান</span> <ArrowRight size={17} /></>
                      }
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ===== STEP 2: DETAILS FORM ===== */}
            {step === 2 && (
              <div className="slide-in-right" key="step2">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap', gap: 6 }}>
                  <div>
                    <h3 style={{ fontWeight: 800, color: '#0F172A', fontSize: 22, marginBottom: 4, letterSpacing: '-0.5px' }}>
                      অ্যাকাউন্ট তথ্য দিন
                    </h3>
                    <p style={{ color: '#64748B', fontWeight: 500, fontSize: 13.5, margin: 0 }}>
                      আপনার নাম, ইমেইল ও পাসওয়ার্ড সেট করুন
                    </p>
                  </div>
                  <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, background: '#F8FAFC', padding: '4px 10px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <span style={{ color: '#EF4444', fontWeight: 800, marginRight: 2 }}>*</span> চিহ্নিত ফিল্ড আবশ্যক
                  </span>
                </div>

                <Form onSubmit={handleSubmit}>
                  {/* Verified Badge */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: '#F0FDF4', border: '1px solid #CCFBF1',
                    borderRadius: 0, padding: '8px 14px', marginBottom: 16
                  }}>
                    <CheckCircle size={16} color="#0D9488" />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0F766E' }}>
                      যাচাইকৃত মোবাইল: {form.mobile}
                    </span>
                  </div>

                  {role !== 'hospital' && (
                    <Form.Group style={{ marginBottom: 14 }}>
                      <Form.Label className="auth-label-premium">
                        পূর্ণ নাম <span style={{ color: '#EF4444', marginLeft: 2, fontWeight: 700 }}>*</span>
                      </Form.Label>
                      <div className="input-group-premium">
                        <span className="input-icon-premium"><UserCircle size={17} /></span>
                        <Form.Control
                          name="name"
                          type="text"
                          placeholder="আপনার পূর্ণ নাম"
                          value={form.name}
                          onChange={handleChange} required
                          className={`auth-input-premium ${fieldErrors.name ? 'is-invalid error' : ''}`}
                        />
                      </div>
                      {fieldErrors.name && (
                        <p className="fade-in-up" style={{ color: '#DC2626', fontSize: 12.5, fontWeight: 600, marginTop: 4, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0 }} /> {fieldErrors.name}
                        </p>
                      )}
                    </Form.Group>
                  )}

                  {role !== 'hospital' && (
                    <Form.Group style={{ marginBottom: 14 }}>
                      <Form.Label className="auth-label-premium">
                        ইমেইল ঠিকানা <span style={{ color: '#EF4444', marginLeft: 2, fontWeight: 700 }}>*</span>
                      </Form.Label>
                      <div className="input-group-premium">
                        <span className="input-icon-premium"><Mail size={17} /></span>
                        <Form.Control
                          name="email" type="email"
                          placeholder="name@example.com"
                          value={form.email} onChange={handleChange} required
                          className={`auth-input-premium ${fieldErrors.email ? 'is-invalid error' : ''}`}
                        />
                      </div>
                      {fieldErrors.email && (
                        <p className="fade-in-up" style={{ color: '#DC2626', fontSize: 12.5, fontWeight: 600, marginTop: 4, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0 }} /> {fieldErrors.email}
                        </p>
                      )}
                    </Form.Group>
                  )}

                  {role === 'hospital' && (
                    <>
                      <Form.Group style={{ marginBottom: 14 }}>
                        <Form.Label className="auth-label-premium">
                          হাসপাতালের নাম (Hospital Name) <span style={{ color: '#EF4444', marginLeft: 2, fontWeight: 700 }}>*</span>
                        </Form.Label>
                        <div className="input-group-premium">
                          <span className="input-icon-premium"><Hotel size={17} /></span>
                          <Form.Control
                            name="hospital_name"
                            type="text"
                            placeholder="যেমনঃ অ্যাপোলো স্পেশালাইজড হাসপাতাল"
                            value={form.hospital_name}
                            onChange={handleChange}
                            required
                            className={`auth-input-premium ${fieldErrors.hospital_name ? 'is-invalid error' : ''}`}
                          />
                        </div>
                        {fieldErrors.hospital_name && (
                          <p className="fade-in-up" style={{ color: '#DC2626', fontSize: 12.5, fontWeight: 600, marginTop: 4, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0 }} /> {fieldErrors.hospital_name}
                          </p>
                        )}
                      </Form.Group>

                      <Form.Group style={{ marginBottom: 14 }}>
                        <Form.Label className="auth-label-premium">
                          হাসপাতালের ধরন (Type of Hospital) <span style={{ color: '#EF4444', marginLeft: 2, fontWeight: 700 }}>*</span>
                        </Form.Label>
                        <div className="input-group-premium">
                          <span className="input-icon-premium"><Hotel size={17} /></span>
                          <Form.Select
                            name="hospital_type"
                            value={form.hospital_type}
                            onChange={handleChange}
                            required
                            className={`auth-input-premium ${fieldErrors.hospital_type ? 'is-invalid error' : ''}`}
                          >
                            <option value="">হাসপাতালের ধরন নির্বাচন করুন</option>
                            {HOSPITAL_TYPES.map(ht => (
                              <option key={ht.id} value={ht.id}>{ht.name}</option>
                            ))}
                          </Form.Select>
                        </div>
                        {fieldErrors.hospital_type && (
                          <p className="fade-in-up" style={{ color: '#DC2626', fontSize: 12.5, fontWeight: 600, marginTop: 4, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0 }} /> {fieldErrors.hospital_type}
                          </p>
                        )}
                      </Form.Group>

                      <Form.Group style={{ marginBottom: 14 }}>
                        <Form.Label className="auth-label-premium">
                          লাইসেন্স নম্বর (License Number) <span style={{ color: '#EF4444', marginLeft: 2, fontWeight: 700 }}>*</span>
                        </Form.Label>
                        <div className="input-group-premium">
                          <span className="input-icon-premium"><ShieldCheck size={17} /></span>
                          <Form.Control
                            name="license_number"
                            type="text"
                            placeholder="যেমনঃ HS-REG-99281"
                            value={form.license_number}
                            onChange={handleChange}
                            required
                            className={`auth-input-premium ${fieldErrors.license_number ? 'is-invalid error' : ''}`}
                          />
                        </div>
                        {fieldErrors.license_number && (
                          <p className="fade-in-up" style={{ color: '#DC2626', fontSize: 12.5, fontWeight: 600, marginTop: 4, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0 }} /> {fieldErrors.license_number}
                          </p>
                        )}
                      </Form.Group>

                      <Form.Group style={{ marginBottom: 14 }}>
                        <Form.Label className="auth-label-premium">
                          হাসপাতালের ঠিকানা (Hospital Address) <span style={{ color: '#EF4444', marginLeft: 2, fontWeight: 700 }}>*</span>
                        </Form.Label>
                        <div className="input-group-premium">
                          <span className="input-icon-premium"><Hotel size={17} /></span>
                          <Form.Control
                            name="address"
                            type="text"
                            placeholder="সম্পূর্ণ ঠিকানা লিখুন (যেমনঃ ধানমন্ডি, ঢাকা)"
                            value={form.address}
                            onChange={handleChange}
                            required
                            className={`auth-input-premium ${fieldErrors.address ? 'is-invalid error' : ''}`}
                          />
                        </div>
                        {fieldErrors.address && (
                          <p className="fade-in-up" style={{ color: '#DC2626', fontSize: 12.5, fontWeight: 600, marginTop: 4, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0 }} /> {fieldErrors.address}
                          </p>
                        )}
                      </Form.Group>

                      <Row className="g-2" style={{ marginBottom: 14 }}>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="auth-label-premium">
                              হটলাইন নম্বর (Hotline) <span style={{ color: '#94A3B8', fontWeight: 500, fontSize: 11.5 }}>(ঐচ্ছিক)</span>
                            </Form.Label>
                            <div className="input-group-premium">
                              <span className="input-icon-premium"><Phone size={17} /></span>
                              <Form.Control
                                name="hotline"
                                type="text"
                                placeholder="যেমনঃ 10616"
                                value={form.hotline}
                                onChange={handleChange}
                                className="auth-input-premium"
                              />
                            </div>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="auth-label-premium">
                              অফিসিয়াল ইমেইল (Official Email) <span style={{ color: '#94A3B8', fontWeight: 500, fontSize: 11.5 }}>(ঐচ্ছিক)</span>
                            </Form.Label>
                            <div className="input-group-premium">
                              <span className="input-icon-premium"><Mail size={17} /></span>
                              <Form.Control
                                name="official_email"
                                type="email"
                                placeholder="info@hospital.com"
                                value={form.official_email}
                                onChange={(e) => {
                                  handleChange(e)
                                  setForm(f => ({ ...f, email: e.target.value }))
                                }}
                                className="auth-input-premium"
                              />
                            </div>
                          </Form.Group>
                        </Col>
                      </Row>
                    </>
                  )}

                  {role === 'doctor' && (
                    <>
                      <Form.Group style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <Form.Label className="auth-label-premium" style={{ marginBottom: 0 }}>
                            স্পেশালটি (Specialty) <span style={{ color: '#EF4444', marginLeft: 2, fontWeight: 700 }}>*</span>
                          </Form.Label>
                          {form.custom_specialty_name && (
                            <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: 12, fontWeight: 700, border: '1px solid #FDE68A' }}>
                              নতুন রিকোয়েস্ট
                            </span>
                          )}
                        </div>

                        <div ref={specialtyDropdownRef} style={{ position: 'relative' }}>
                          <div className="input-group-premium">
                            <span className="input-icon-premium"><Stethoscope size={17} /></span>
                            <Form.Control
                              type="text"
                              placeholder="স্পেশালটি খুঁজুন বা নতুন নাম লিখুন..."
                              value={specialtySearch}
                              onChange={(e) => {
                                const val = e.target.value
                                setSpecialtySearch(val)
                                setSpecialtyDropdownOpen(true)
                                if (form.specialty_id || form.custom_specialty_name) {
                                  setForm(prev => ({ ...prev, specialty_id: '', custom_specialty_name: '' }))
                                }
                              }}
                              onFocus={() => setSpecialtyDropdownOpen(true)}
                              name="specialty_search"
                              className={`auth-input-premium ${fieldErrors.specialty_id ? 'is-invalid error' : ''}`}
                              style={{ paddingRight: specialtySearch ? 36 : 14 }}
                              autoComplete="off"
                            />
                            {specialtySearch && (
                              <button
                                type="button"
                                onClick={handleClearSpecialty}
                                style={{
                                  position: 'absolute',
                                  right: 12,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  background: 'none',
                                  border: 'none',
                                  padding: 4,
                                  color: '#94A3B8',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  zIndex: 10
                                }}
                                title="মুছুন"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>

                          {/* Searchable & Creatable Dropdown Panel */}
                          {specialtyDropdownOpen && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 'calc(100% + 4px)',
                                left: 0,
                                right: 0,
                                background: '#FFFFFF',
                                borderRadius: 12,
                                border: '1.5px solid #00B875',
                                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
                                maxHeight: 250,
                                overflowY: 'auto',
                                zIndex: 1050,
                                padding: '6px 0'
                              }}
                            >
                              {/* Option 1: Creatable Button when user types something not exactly in the list */}
                              {specialtySearch.trim() && !hasExactSpecialtyMatch && (
                                <div
                                  onClick={() => handleSelectCustomSpecialty(specialtySearch)}
                                  style={{
                                    padding: '10px 14px',
                                    borderBottom: filteredSpecialties.length > 0 ? '1px dashed #E2E8F0' : 'none',
                                    background: '#F0FDF4',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 9,
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: '#047857',
                                    transition: 'background 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#DCFCE7'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = '#F0FDF4'}
                                >
                                  <div style={{ width: 22, height: 22, borderRadius: 6, background: '#00B875', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Plus size={14} color="#FFFFFF" strokeWidth={3} />
                                  </div>
                                  <span>নতুন হিসেবে দিন: <strong style={{ color: '#0F172A' }}>"{specialtySearch.trim()}"</strong></span>
                                </div>
                              )}

                              {/* Option 2: Filtered Existing Specialties List */}
                              {filteredSpecialties.length > 0 ? (
                                filteredSpecialties.map(s => {
                                  const isSelected = String(form.specialty_id) === String(s.id)
                                  return (
                                    <div
                                      key={s.id}
                                      onClick={() => handleSelectSpecialty(s)}
                                      style={{
                                        padding: '9px 16px',
                                        cursor: 'pointer',
                                        fontSize: 13.5,
                                        fontWeight: isSelected ? 700 : 500,
                                        color: isSelected ? '#00B875' : '#334155',
                                        background: isSelected ? '#F0FDF4' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.15s ease'
                                      }}
                                      onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = '#F8FAFC')}
                                      onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = 'transparent')}
                                    >
                                      <span>{s.name}</span>
                                      {isSelected && <CheckCircle size={15} color="#00B875" />}
                                    </div>
                                  )
                                })
                              ) : initialLoadingSpecialties ? (
                                <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                  <Loader2 size={16} className="animate-spin" style={{ color: '#00B875' }} />
                                  <span>স্পেশালটির তালিকা লোড হচ্ছে...</span>
                                </div>
                              ) : !specialtySearch.trim() ? (
                                <div style={{ padding: '12px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                                  কোনো স্পেশালটি পাওয়া যায়নি
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>

                        {/* Informational Guidance Tag for Custom Specialty */}
                        {form.custom_specialty_name && (
                          <div
                            className="fade-in-up"
                            style={{
                              marginTop: 8,
                              padding: '10px 12px',
                              borderRadius: 10,
                              background: '#F0FDF4',
                              border: '1px solid #BBF7D0',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 8,
                              fontSize: 12.5,
                              color: '#166534',
                              lineHeight: 1.4
                            }}
                          >
                            <Info size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
                            <div>
                              <span>আপনার দেওয়া <strong>"{form.custom_specialty_name}"</strong> নতুন স্পেশালটি হিসেবে আপনার প্রোফাইলে যুক্ত হবে।</span>
                            </div>
                          </div>
                        )}

                        {fieldErrors.specialty_id && (
                          <p className="fade-in-up" style={{ color: '#DC2626', fontSize: 12.5, fontWeight: 600, marginTop: 4, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0 }} /> {fieldErrors.specialty_id}
                          </p>
                        )}
                      </Form.Group>

                      <Form.Group style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <Form.Label className="auth-label-premium" style={{ marginBottom: 0 }}>
                            বর্তমান কর্মস্থল / হাসপাতাল (Hospital / Workplace) <span style={{ color: '#EF4444', marginLeft: 2, fontWeight: 700 }}>*</span>
                          </Form.Label>
                          {form.hospital_id ? (
                            <span style={{ fontSize: 11, background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: 12, fontWeight: 700, border: '1px solid #BBF7D0' }}>
                              তালিকাভুক্ত হাসপাতাল
                            </span>
                          ) : form.workplace ? (
                            <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: 12, fontWeight: 700, border: '1px solid #FDE68A' }}>
                              কাস্টম কর্মস্থল
                            </span>
                          ) : null}
                        </div>

                        <div ref={hospitalDropdownRef} style={{ position: 'relative' }}>
                          <div className="input-group-premium">
                            <span className="input-icon-premium"><Hotel size={17} /></span>
                            <Form.Control
                              type="text"
                              placeholder="হাসপাতাল খুঁজুন বা নতুন নাম লিখুন..."
                              value={hospitalSearch}
                              onChange={(e) => {
                                const val = e.target.value
                                setHospitalSearch(val)
                                setHospitalDropdownOpen(true)
                                setForm(prev => ({ ...prev, hospital_id: '', workplace: val }))
                                if (fieldErrors.workplace) {
                                  setFieldErrors(prev => ({ ...prev, workplace: null }))
                                }
                              }}
                              onFocus={() => setHospitalDropdownOpen(true)}
                              name="hospital_search"
                              className={`auth-input-premium ${fieldErrors.workplace ? 'is-invalid error' : ''}`}
                              style={{ paddingRight: hospitalSearch ? 36 : 14 }}
                              autoComplete="off"
                            />
                            {loadingHospitals ? (
                              <div
                                style={{
                                  position: 'absolute',
                                  right: 12,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#00B875',
                                  zIndex: 10
                                }}
                              >
                                <Loader2 size={16} className="animate-spin" />
                              </div>
                            ) : hospitalSearch ? (
                              <button
                                type="button"
                                onClick={handleClearHospital}
                                style={{
                                  position: 'absolute',
                                  right: 12,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  background: 'none',
                                  border: 'none',
                                  padding: 4,
                                  color: '#94A3B8',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  zIndex: 10
                                }}
                                title="মুছুন"
                              >
                                <X size={16} />
                              </button>
                            ) : null}
                          </div>

                          {/* Searchable & Creatable Dropdown Panel */}
                          {hospitalDropdownOpen && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 'calc(100% + 4px)',
                                left: 0,
                                right: 0,
                                background: '#FFFFFF',
                                borderRadius: 12,
                                border: '1.5px solid #00B875',
                                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
                                maxHeight: 250,
                                overflowY: 'auto',
                                zIndex: 1050,
                                padding: '6px 0'
                              }}
                            >
                              {/* Option 1: Creatable Button when user types something not exactly in the list */}
                              {hospitalSearch.trim() && !hasExactHospitalMatch && (
                                <div
                                  onClick={() => handleSelectCustomHospital(hospitalSearch)}
                                  style={{
                                    padding: '10px 14px',
                                    borderBottom: filteredHospitals.length > 0 ? '1px dashed #E2E8F0' : 'none',
                                    background: '#F0FDF4',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 9,
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: '#047857',
                                    transition: 'background 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#DCFCE7'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = '#F0FDF4'}
                                >
                                  <div style={{ width: 22, height: 22, borderRadius: 6, background: '#00B875', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Plus size={14} color="#FFFFFF" strokeWidth={3} />
                                  </div>
                                  <span>নতুন হিসেবে দিন: <strong style={{ color: '#0F172A' }}>"{hospitalSearch.trim()}"</strong></span>
                                </div>
                              )}

                              {/* Loading Indicator */}
                              {loadingHospitals && (
                                <div style={{ padding: '8px 16px', fontSize: 12.5, color: '#047857', display: 'flex', alignItems: 'center', gap: 7, background: '#F0FDF4', borderBottom: '1px solid #E2E8F0' }}>
                                  <Loader2 size={14} className="animate-spin" style={{ color: '#00B875' }} />
                                  <span>হাসপাতাল খোঁজা হচ্ছে...</span>
                                </div>
                              )}

                              {/* Initial Loading or Filtered Existing Hospitals List */}
                              {initialLoadingHospitals ? (
                                <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                  <Loader2 size={16} className="animate-spin" style={{ color: '#00B875' }} />
                                  <span>হাসপাতালের তালিকা লোড হচ্ছে...</span>
                                </div>
                              ) : filteredHospitals.length > 0 ? (
                                filteredHospitals.map(h => {
                                  const isSelected = form.hospital_id && (String(form.hospital_id) === String(h.id) || String(form.hospital_id) === String(h.public_id))
                                  const nameDisplay = h.name_bn || h.name
                                  const locationSubtitle = [h.upazila?.name, h.district?.name || h.district_slug].filter(Boolean).join(', ')

                                  return (
                                    <div
                                      key={h.id || h.public_id}
                                      onClick={() => handleSelectHospital(h)}
                                      style={{
                                        padding: '9px 16px',
                                        cursor: 'pointer',
                                        fontSize: 13.5,
                                        fontWeight: isSelected ? 700 : 500,
                                        color: isSelected ? '#00B875' : '#334155',
                                        background: isSelected ? '#F0FDF4' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.15s ease'
                                      }}
                                      onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = '#F8FAFC')}
                                      onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = 'transparent')}
                                    >
                                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span>{nameDisplay}</span>
                                        {locationSubtitle && (
                                          <span style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 400 }}>
                                            📍 {locationSubtitle}
                                          </span>
                                        )}
                                      </div>
                                      {isSelected && <CheckCircle size={15} color="#00B875" style={{ flexShrink: 0 }} />}
                                    </div>
                                  )
                                })
                              ) : !loadingHospitals ? (
                                <div style={{ padding: '12px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                                  {hospitalSearch.trim() ? 'তালিকায় কোনো বিদ্যমান হাসপাতাল মেলেনি' : 'কোনো হাসপাতাল পাওয়া যায়নি'}
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>

                        {/* Informational Guidance Tag for Custom Hospital */}
                        {form.workplace && !form.hospital_id && (
                          <div
                            className="fade-in-up"
                            style={{
                              marginTop: 8,
                              padding: '10px 12px',
                              borderRadius: 10,
                              background: '#F0FDF4',
                              border: '1px solid #BBF7D0',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 8,
                              fontSize: 12.5,
                              color: '#166534',
                              lineHeight: 1.4
                            }}
                          >
                            <Info size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
                            <div>
                              <span>আপনার কর্মস্থল হিসেবে <strong>"{form.workplace}"</strong> সংরক্ষিত হবে।</span>
                            </div>
                          </div>
                        )}

                        {fieldErrors.workplace && (
                          <p className="fade-in-up" style={{ color: '#DC2626', fontSize: 12.5, fontWeight: 600, marginTop: 4, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0 }} /> {fieldErrors.workplace}
                          </p>
                        )}
                      </Form.Group>

                      <Form.Group style={{ marginBottom: 14 }}>
                        <Form.Label className="auth-label-premium">
                          বিএমডিসি নম্বর (BMDC Reg No.) <span style={{ color: '#EF4444', marginLeft: 2, fontWeight: 700 }}>*</span>
                        </Form.Label>
                        <div className="input-group-premium">
                          <span className="input-icon-premium"><ShieldCheck size={17} /></span>
                          <Form.Control
                            name="bmdc_number"
                            type="text"
                            placeholder="যেমনঃ A-12345"
                            value={form.bmdc_number}
                            onChange={handleChange}
                            required
                            className={`auth-input-premium ${fieldErrors.bmdc_number ? 'is-invalid error' : ''}`}
                          />
                        </div>
                        {fieldErrors.bmdc_number && (
                          <p className="fade-in-up" style={{ color: '#DC2626', fontSize: 12.5, fontWeight: 600, marginTop: 4, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0 }} /> {fieldErrors.bmdc_number}
                          </p>
                        )}

                        {/* BMDC Verification Notice / Hint */}
                        <div
                          style={{
                            marginTop: 8,
                            padding: '10px 12px',
                            borderRadius: 10,
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 8,
                            fontSize: 12.5,
                            color: '#1E40AF',
                            lineHeight: 1.45
                          }}
                        >
                          <FileText size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: 2 }} />
                          <div>
                            <strong>সনদপত্র যাচাইকরণ নির্দেশনা:</strong> ডাক্তার প্রোফাইল সক্রিয় ও অনুমোদনের জন্য পরবর্তী ধাপে আপনার <strong>BMDC সার্টিফিকেটের ছবি বা PDF</strong> আপলোড করতে হবে।
                          </div>
                        </div>
                      </Form.Group>
                    </>
                  )}

                  <Row className="g-2" style={{ marginBottom: 18 }}>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="auth-label-premium">
                          পাসওয়ার্ড <span style={{ color: '#EF4444', marginLeft: 2, fontWeight: 700 }}>*</span>
                        </Form.Label>
                        <div className="input-group-premium">
                          <span className="input-icon-premium"><Lock size={17} /></span>
                          <Form.Control
                            name="password" type={showPass ? 'text' : 'password'}
                            placeholder="কমপক্ষে ৬ অক্ষর"
                            value={form.password} onChange={handleChange} required
                            className={`auth-input-premium ${fieldErrors.password ? 'is-invalid error' : ''}`}
                          />
                          <button type="button" className="input-link-premium" style={{ color: '#94A3B8', border: 'none', background: 'none' }} onClick={() => setShowPass(!showPass)}>
                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {fieldErrors.password && (
                          <p className="fade-in-up" style={{ color: '#DC2626', fontSize: 12.5, fontWeight: 600, marginTop: 4, marginBottom: 0 }}>
                            {fieldErrors.password}
                          </p>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="auth-label-premium">
                          পাসওয়ার্ড নিশ্চিত <span style={{ color: '#EF4444', marginLeft: 2, fontWeight: 700 }}>*</span>
                        </Form.Label>
                        <div className="input-group-premium">
                          <span className="input-icon-premium"><Lock size={17} /></span>
                          <Form.Control
                            name="confirm" type={showConfirm ? 'text' : 'password'}
                            placeholder="আবার লিখুন"
                            value={form.confirm} onChange={handleChange} required
                            className={`auth-input-premium ${fieldErrors.confirm ? 'is-invalid error' : ''}`}
                          />
                          <button type="button" className="input-link-premium" style={{ color: '#94A3B8', border: 'none', background: 'none' }} onClick={() => setShowConfirm(!showConfirm)}>
                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {fieldErrors.confirm && (
                          <p className="fade-in-up" style={{ color: '#DC2626', fontSize: 12.5, fontWeight: 600, marginTop: 4, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <AlertTriangle size={13} style={{ flexShrink: 0 }} /> {fieldErrors.confirm}
                          </p>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* ── TERMS & PRIVACY CONSENT CHECKBOX ── */}
                  <div style={{
                    marginBottom: 18,
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: agreedToTerms ? 'rgba(0, 184, 117, 0.05)' : '#F8FAFC',
                    border: agreedToTerms ? '1.5px solid #00B875' : '1.5px solid #E2E8F0',
                    transition: 'all 0.25s ease'
                  }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      cursor: 'pointer',
                      margin: 0,
                      userSelect: 'none'
                    }}>
                      <CustomCheckbox
                        checked={agreedToTerms}
                        onChange={(e) => {
                          setAgreedToTerms(e.target.checked)
                          if (fieldErrors.terms) setFieldErrors(prev => ({ ...prev, terms: '' }))
                        }}
                        color="#10B981"
                        style={{ marginTop: 2 }}
                      />
                      <span style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, fontWeight: 500 }}>
                        আমি Doctor Booklet-এর{' '}
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setLegalModal({ open: true, type: 'terms' })
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            color: '#00B875',
                            fontWeight: 700,
                            textDecoration: 'underline',
                            cursor: 'pointer'
                          }}
                        >
                          ব্যবহারের শর্তাবলী
                        </button>{' '}
                        এবং{' '}
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setLegalModal({ open: true, type: 'privacy' })
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            color: '#00B875',
                            fontWeight: 700,
                            textDecoration: 'underline',
                            cursor: 'pointer'
                          }}
                        >
                          গোপনীয়তা নীতি
                        </button>{' '}
                        পড়েছি এবং এতে সম্মতি জানাচ্ছি। <span style={{ color: '#EF4444' }}>*</span>
                      </span>
                    </label>
                  </div>

                  {fieldErrors.terms && (
                    <p className="fade-in-up" style={{ color: '#DC2626', fontSize: 12.5, fontWeight: 600, marginTop: -10, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0 }} /> {fieldErrors.terms}
                    </p>
                  )}

                  {fieldErrors.general && (
                    <div className="fade-in-up" style={{
                      background: '#FEF2F2',
                      border: '1.5px solid #FCA5A5',
                      borderRadius: 12,
                      padding: '12px 16px',
                      marginBottom: 16,
                      textAlign: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#DC2626', fontWeight: 700, fontSize: 13.5, marginBottom: isOtpSessionExpired ? 6 : 0 }}>
                        <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                        <span>{fieldErrors.general}</span>
                      </div>
                      {isOtpSessionExpired && (
                        <div>
                          <p style={{ color: '#4B5563', fontSize: 12.5, margin: '4px 0 10px 0', lineHeight: 1.5 }}>
                            আপনার ফরমের সকল তথ্য অক্ষত রয়েছে। অ্যাকাউন্ট তৈরি সম্পন্ন করতে ওটিপি কোড দিয়ে সেশন রিনিউ করুন।
                          </p>
                          <Button
                            type="button"
                            onClick={handleOpenRenewModal}
                            style={{
                              background: '#0D9488',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 8,
                              padding: '7px 20px',
                              fontSize: 13,
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              cursor: 'pointer'
                            }}
                          >
                            <RefreshCw size={14} /> পুনরায় ওটিপি কোড দিন
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit" 
                    disabled={loading || !agreedToTerms}
                    className={`w-100 auth-btn-premium ${cfg.btnClass}`}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: 8,
                      opacity: (!agreedToTerms || loading) ? 0.6 : 1,
                      cursor: (!agreedToTerms || loading) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      filter: (!agreedToTerms && !loading) ? 'grayscale(35%)' : 'none'
                    }}
                  >
                    {loading
                      ? <><span className="spinner-border spinner-border-sm me-2" /> প্রসেস হচ্ছে...</>
                      : <><span>রেজিস্ট্রেশন সম্পন্ন করুন</span> <ArrowRight size={17} /></>
                    }
                  </Button>
                </Form>
              </div>
            )}

            {/* ===== STEP 3: SUCCESS SCREEN ===== */}
            {step === 3 && (
              <div className="auth-success-container" key="step3">
                <div className="auth-success-icon">
                  <CheckCircle size={36} color="#0D9488" />
                </div>

                <h2 style={{ fontWeight: 800, color: '#0F172A', fontSize: 24, marginBottom: 6, letterSpacing: '-0.5px' }}>
                  রেজিস্ট্রেশন সফল! 🎉
                </h2>
                <p style={{ color: '#64748B', fontWeight: 500, fontSize: 14, lineHeight: 1.6, maxWidth: 360, margin: '0 auto 28px' }}>
                  আপনার Doctor Booklet অ্যাকাউন্ট তৈরি হয়েছে। এখন প্রোফাইল আপডেট করুন অথবা ডাক্তার খুঁজে দেখুন।
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 300, margin: '0 auto' }}>
                  <Button
                    onClick={() => navigate('/profile')}
                    className={`auth-btn-premium ${cfg.btnClass}`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <UserCircle size={18} />
                    প্রোফাইল আপডেট করুন
                  </Button>

                  <button
                    onClick={() => navigate('/doctors')}
                    style={{
                      padding: '12px', fontSize: 14, fontWeight: 700, width: '100%',
                      background: '#F8FAFC', color: '#0F172A',
                      border: '1px solid #E2E8F0', borderRadius: 0,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = '#F1F5F9' }}
                    onMouseOut={e => { e.currentTarget.style.background = '#F8FAFC' }}
                  >
                    <Search size={18} />
                    ডাক্তার খুঁজুন
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            {step !== 3 && (
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <p style={{ fontSize: 13.5, fontWeight: 500, color: '#64748B', margin: 0 }}>
                  ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
                  <Link to={role ? `/login/${role}` : '/login'} style={{ color: '#0D9488', fontWeight: 700, textDecoration: 'none' }}>
                    এখানে লগইন করুন
                  </Link>
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
      {/* ── LEGAL DOCUMENT MODAL ── */}
      <LegalDocumentModal
        show={legalModal.open}
        type={legalModal.type}
        onClose={() => setLegalModal({ open: false, type: 'terms' })}
        onAgree={() => {
          setAgreedToTerms(true)
          if (fieldErrors.terms) setFieldErrors(prev => ({ ...prev, terms: '' }))
        }}
      />

      {/* ── OTP SESSION RENEWAL MODAL ── */}
      <Modal
        show={showOtpRenewModal}
        onHide={() => setShowOtpRenewModal(false)}
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton style={{ borderBottom: '1px solid #E2E8F0', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#CCFBF1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={22} color="#0D9488" />
            </div>
            <div>
              <Modal.Title style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                ওটিপি সেশন রিনিউ করুন
              </Modal.Title>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                নিরাপত্তার স্বার্থে নতুন ওটিপি কোড দিয়ে ভেরিফাই করুন
              </p>
            </div>
          </div>
        </Modal.Header>
        <Modal.Body style={{ padding: '24px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 13.5, color: '#334155', marginBottom: 18, lineHeight: 1.5 }}>
            আপনার ফরমের তথ্য সুরক্ষিত আছে। নিবন্ধিত মোবাইল <strong>{form.mobile}</strong> এ একটি নতুন ৬-সংখ্যার ওটিপি কোড পাঠানো হয়েছে:
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 18 }}>
            {renewOtpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={el => renewOtpRefs.current[idx] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleRenewDigitChange(idx, e.target.value)}
                onKeyDown={e => handleRenewKeyDown(idx, e)}
                onPaste={handleRenewPaste}
                style={{
                  width: 44,
                  height: 48,
                  fontSize: 20,
                  fontWeight: 700,
                  textAlign: 'center',
                  borderRadius: 10,
                  border: renewOtpError ? '2px solid #EF4444' : '1.5px solid #CBD5E1',
                  background: '#F8FAFC',
                  outline: 'none',
                  color: '#0F172A'
                }}
              />
            ))}
          </div>

          {renewOtpError && (
            <p style={{ color: '#DC2626', fontSize: 12.5, fontWeight: 600, marginBottom: 14 }}>
              <AlertTriangle size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              {renewOtpError}
            </p>
          )}

          <div style={{ marginBottom: 20, fontSize: 13, color: '#64748B' }}>
            {renewOtpTimer > 0 ? (
              <span>পুনরায় ওটিপি পাঠাতে অপেক্ষা করুন: <strong>{formatCountdown(renewOtpTimer)}</strong></span>
            ) : (
              <button
                type="button"
                onClick={handleTriggerRenewOtp}
                disabled={renewOtpSending}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0D9488',
                  fontWeight: 700,
                  cursor: renewOtpSending ? 'not-allowed' : 'pointer',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                {renewOtpSending ? 'ওটিপি পাঠানো হচ্ছে...' : 'পুনরায় ওটিপি পাঠান'}
              </button>
            )}
          </div>

          <Button
            onClick={handleVerifyRenewOtp}
            disabled={renewOtpVerifying || renewOtpDigits.join('').length !== 6}
            style={{
              width: '100%',
              background: '#0D9488',
              border: 'none',
              padding: '11px 0',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14.5,
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: (renewOtpVerifying || renewOtpDigits.join('').length !== 6) ? 'not-allowed' : 'pointer'
            }}
          >
            {renewOtpVerifying ? (
              <><span className="spinner-border spinner-border-sm me-2" /> যাচাই করা হচ্ছে...</>
            ) : (
              <><span>যাচাই করে সম্পন্ন করুন</span> <ArrowRight size={17} /></>
            )}
          </Button>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default RegisterPage

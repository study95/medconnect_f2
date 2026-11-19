// PendingVerificationPage.jsx
// Pixel-perfect match for the user's mobile onboarding design
// Fully dynamic data with real status checking, Benglai date formatting, and details drawer

import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Check, Hourglass, ShieldCheck, History, ArrowRight,
  Headset, Phone, ChevronDown, ChevronUp, RefreshCw,
  User, Building2, FileText, Calendar, Mail, AlertCircle,
  UploadCloud, CheckCircle2, Loader2, Trash2, Eye, ExternalLink, ArrowUpCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useDialog } from '../../hooks/useDialog'
import { uploadDoctorVerificationDocuments, deleteDoctorVerificationDocument, submitDoctorVerificationApplication } from '../../api/doctorApi'
import { uploadHospitalVerificationDocuments, deleteHospitalVerificationDocument, submitHospitalVerificationApplication } from '../../api/hospitalApi'
import { getMediaUrl } from '../../utils/mediaUtils'
import CustomCheckbox from '../../components/common/CustomCheckbox'
import '../../styles/dialog.css'

// Helper to convert date to beautiful Bengali date & time string
const formatBengaliDateTime = (dateInput) => {
  const d = dateInput ? new Date(dateInput) : new Date()
  const validDate = isNaN(d.getTime()) ? new Date() : d

  const bngMonths = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ]
  const toBngNum = (num) => String(num).replace(/[0-9]/g, (digit) => '০১২৩৪৫৬৭৮৯'[digit])

  const day = toBngNum(validDate.getDate())
  const month = bngMonths[validDate.getMonth()]
  const year = toBngNum(validDate.getFullYear())

  const hours = validDate.getHours()
  const minutes = toBngNum(String(validDate.getMinutes()).padStart(2, '0'))

  let period = 'সকাল'
  if (hours >= 12 && hours < 15) period = 'দুপুর'
  else if (hours >= 15 && hours < 18) period = 'বিকাল'
  else if (hours >= 18 && hours < 20) period = 'সন্ধ্যা'
  else if (hours >= 20 || hours < 6) period = 'রাত'

  const displayHours = hours % 12 === 0 ? 12 : hours % 12
  const timeStr = `${period} ${toBngNum(displayHours)}:${minutes}`

  return {
    date: `${day} ${month} ${year}`,
    time: timeStr
  }
}

export default function PendingVerificationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, fetchCurrentUser, isDoctor, isManager, isAdmin, isPatient, isLoggedIn, loading, logout } = useAuth()
  const { showSuccess, showError, showWarning } = useDialog()

  const [refreshing, setRefreshing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Determine user role
  const stateType = location.state?.type
  const isHospital = stateType === 'hospital' ||
    user?.registration_type === 'hospital' ||
    Boolean(user?.hospital) ||
    user?.role_id === 3 ||
    location.pathname.includes('hospital')

  const roleLabel = isHospital ? 'হাসপাতাল' : 'ডাক্তার'

  // Verification Document Upload State (Doctor & Hospital)
  const [bmdcDoc, setBmdcDoc] = useState(user?.doctor?.bmdc_document || null)
  const [nidDoc, setNidDoc] = useState(user?.doctor?.nid_document || null)
  const [licenseDoc, setLicenseDoc] = useState(user?.hospital?.license_document || null)
  const [tradeDoc, setTradeDoc] = useState(user?.hospital?.trade_license_document || null)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [activeUploadType, setActiveUploadType] = useState(null)
  const [deletingDoc, setDeletingDoc] = useState(false)
  const [activeDeleteType, setActiveDeleteType] = useState(null)
  const [submittingFinal, setSubmittingFinal] = useState(false)
  const [agreedToSubmit, setAgreedToSubmit] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [statusCheckFeedback, setStatusCheckFeedback] = useState(null)
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    type: null, // 'delete' | 'submit'
    docType: null, // 'bmdc' | 'nid' | 'license' | 'trade_license'
    title: '',
    message: '',
    confirmText: '',
    cancelText: 'বাতিল',
    variant: 'danger', // 'danger' | 'success'
  })
  const [showCelebrationModal, setShowCelebrationModal] = useState(false)
  const [flowerPetals, setFlowerPetals] = useState([])
  const bmdcFileInputRef = useRef(null)
  const nidFileInputRef = useRef(null)
  const licenseFileInputRef = useRef(null)
  const tradeFileInputRef = useRef(null)
  const statusFeedbackTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (statusFeedbackTimerRef.current) {
        clearTimeout(statusFeedbackTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (user?.doctor?.bmdc_document) setBmdcDoc(user.doctor.bmdc_document)
    if (user?.doctor?.nid_document) setNidDoc(user.doctor.nid_document)
    if (user?.hospital?.license_document) setLicenseDoc(user.hospital.license_document)
    if (user?.hospital?.trade_license_document) setTradeDoc(user.hospital.trade_license_document)
  }, [user])

  // Falling flowers & petals generator on celebration
  useEffect(() => {
    if (showCelebrationModal) {
      const items = ['🌸', '🌺', '🌼', '🌷', '💐', '🍃', '✨', '🎉']
      const petals = Array.from({ length: 42 }).map((_, i) => ({
        id: i,
        char: items[i % items.length],
        left: (Math.random() * 94 + 3).toFixed(1),
        size: Math.floor(Math.random() * 16) + 18,
        duration: (Math.random() * 3 + 3.2).toFixed(2),
        delay: (Math.random() * 2).toFixed(2),
        drift: (Math.random() * 80 - 40).toFixed(0),
      }))
      setFlowerPetals(petals)
    } else {
      setFlowerPetals([])
    }
  }, [showCelebrationModal])

  // Verification Status & Lock Mode (Dual support for Doctor & Hospital)
  const rawVerificationStatus = isHospital
    ? user?.hospital?.verification_status
    : user?.doctor?.verification_status
  const defaultStatus = isHospital
    ? (user?.hospital?.license_document ? 'submitted' : 'draft')
    : (user?.doctor?.bmdc_document ? 'submitted' : 'draft')
  const verificationStatus = rawVerificationStatus || defaultStatus
  const isLocked = verificationStatus === 'submitted' || verificationStatus === 'approved'
  const isRevisionRequested = verificationStatus === 'revision_requested'

  const doc1 = isHospital ? licenseDoc : bmdcDoc
  const doc2 = isHospital ? tradeDoc : nidDoc
  const doc1Name = isHospital ? 'হাসপাতাল লাইসেন্স / DGHS সনদ' : 'বিএমডিসি সনদপত্র'
  const doc2Name = isHospital ? 'ট্রেড লাইসেন্স / পরিচালকের NID' : 'জাতীয় পরিচয়পত্র (NID)'
  const hasBothDocs = Boolean(doc1 && doc2)

  const handleUploadFile = async (file, type) => {
    if (!file) return
    if (isLocked) {
      showWarning({
        title: 'আবেদন লক করা আছে',
        message: 'আপনার আবেদনটি পর্যালোচনার জন্য জমা রয়েছে এবং লক করা আছে।',
        confirmText: 'ঠিক আছে'
      })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('ফাইলের সাইজ অতিরিক্ত বড় (সর্বোচ্চ ১০ MB অনুমোদিত)।')
      showWarning({
        title: 'ফাইলের আকার বড়',
        message: 'ফাইলের সাইজ সর্বোচ্চ ১০ MB পর্যন্ত হতে পারে। দয়া করে ছোট ফাইল আপলোড করুন।',
        confirmText: 'ঠিক আছে'
      })
      return
    }

    setUploadError(null)
    setUploadingDoc(true)
    setActiveUploadType(type)

    try {
      const formData = new FormData()
      if (isHospital) {
        if (type === 'license') {
          formData.append('license_document', file)
        } else {
          formData.append('trade_license_document', file)
        }
        const res = await uploadHospitalVerificationDocuments(formData)
        if (res.data?.success) {
          const docData = res.data.data
          if (type === 'license') {
            setLicenseDoc(docData?.license_document || file.name)
          } else {
            setTradeDoc(docData?.trade_license_document || file.name)
          }
          await showSuccess({
            title: type === 'license' ? 'লাইসেন্স আপলোড সম্পন্ন' : 'ট্রেড লাইসেন্স / NID আপলোড সম্পন্ন',
            message: type === 'license'
              ? 'আপনার হাসপাতালের লাইসেন্স / DGHS সনদ সফলভাবে আপলোড হয়েছে।'
              : 'আপনার ট্রেড লাইসেন্স / পরিচালকের NID সফলভাবে আপলোড হয়েছে।',
            confirmText: 'ঠিক আছে',
            autoCloseMs: 2200
          })
          if (fetchCurrentUser) fetchCurrentUser()
        }
      } else {
        if (type === 'bmdc') {
          formData.append('bmdc_document', file)
        } else {
          formData.append('nid_document', file)
        }

        const res = await uploadDoctorVerificationDocuments(formData)
        if (res.data?.success) {
          const docData = res.data.data
          if (type === 'bmdc') {
            setBmdcDoc(docData?.bmdc_document || file.name)
          } else {
            setNidDoc(docData?.nid_document || file.name)
          }
          await showSuccess({
            title: type === 'bmdc' ? 'সনদপত্র আপলোড সম্পন্ন' : 'এনআইডি আপলোড সম্পন্ন',
            message: type === 'bmdc' ? 'আপনার বিএমডিসি সনদ সফলভাবে আপলোড হয়েছে।' : 'আপনার জাতীয় পরিচয়পত্র (NID) সফলভাবে আপলোড হয়েছে।',
            confirmText: 'ঠিক আছে',
            autoCloseMs: 2200
          })
          if (fetchCurrentUser) fetchCurrentUser()
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'ডকুমেন্ট আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।'
      setUploadError(msg)
      showError({
        title: 'আপলোড ব্যর্থ হয়েছে',
        message: msg,
        confirmText: 'ঠিক আছে'
      })
    } finally {
      setUploadingDoc(false)
      setActiveUploadType(null)
    }
  }

  const promptDeleteFile = (type) => {
    if (isLocked) {
      showWarning({
        title: 'আবেদনটি লক রয়েছে',
        message: 'আবেদনটি লক রয়েছে। জমা দেওয়ার পর কোনো নথি মোছা সম্ভব নয়।',
        confirmText: 'ঠিক আছে'
      })
      return
    }
    let docLabel = ''
    if (isHospital) {
      docLabel = type === 'license' ? 'হাসপাতালের লাইসেন্স' : 'ট্রেড লাইসেন্স / পরিচালকের NID'
    } else {
      docLabel = type === 'bmdc' ? 'বিএমডিসি সনদপত্র' : 'জাতীয় পরিচয়পত্র (NID)'
    }
    setDialogState({
      isOpen: true,
      type: 'delete',
      docType: type,
      title: `${docLabel} মুছে ফেলতে চান?`,
      message: `আপনি কি নিশ্চিতভাবে আপনার ${docLabel} মুছে ফেলতে চান? মুছে ফেললে পুনরায় নতুন ফাইল আপলোড করার সুযোগ থাকবে।`,
      confirmText: 'হ্যাঁ, মুছুন',
      cancelText: 'বাতিল',
      variant: 'danger'
    })
  }

  const confirmDeleteFile = async () => {
    const type = dialogState.docType
    setDialogState((prev) => ({ ...prev, isOpen: false }))
    if (!type) return

    setUploadError(null)
    setDeletingDoc(true)
    setActiveDeleteType(type)

    let docLabel = ''
    if (isHospital) {
      docLabel = type === 'license' ? 'হাসপাতালের লাইসেন্স' : 'ট্রেড লাইসেন্স / পরিচালকের NID'
    } else {
      docLabel = type === 'bmdc' ? 'বিএমডিসি সনদপত্র' : 'জাতীয় পরিচয়পত্র (NID)'
    }

    try {
      if (isHospital) {
        const res = await deleteHospitalVerificationDocument(type)
        if (res.data?.success) {
          if (type === 'license') {
            setLicenseDoc(null)
            if (licenseFileInputRef.current) licenseFileInputRef.current.value = ''
          } else {
            setTradeDoc(null)
            if (tradeFileInputRef.current) tradeFileInputRef.current.value = ''
          }
          await showSuccess({
            title: 'ডকুমেন্ট মোছা হয়েছে',
            message: `${docLabel} সফলভাবে মুছে ফেলা হয়েছে।`,
            confirmText: 'ঠিক আছে',
            autoCloseMs: 2000
          })
          if (fetchCurrentUser) fetchCurrentUser()
        }
      } else {
        const res = await deleteDoctorVerificationDocument(type)
        if (res.data?.success) {
          if (type === 'bmdc') {
            setBmdcDoc(null)
            if (bmdcFileInputRef.current) bmdcFileInputRef.current.value = ''
          } else {
            setNidDoc(null)
            if (nidFileInputRef.current) nidFileInputRef.current.value = ''
          }
          await showSuccess({
            title: 'ডকুমেন্ট মোছা হয়েছে',
            message: `${docLabel} সফলভাবে মুছে ফেলা হয়েছে।`,
            confirmText: 'ঠিক আছে',
            autoCloseMs: 2000
          })
          if (fetchCurrentUser) fetchCurrentUser()
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'ডকুমেন্ট মুছতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
      setUploadError(msg)
      showError({
        title: 'মুছতে সমস্যা হয়েছে',
        message: msg,
        confirmText: 'ঠিক আছে'
      })
    } finally {
      setDeletingDoc(false)
      setActiveDeleteType(null)
    }
  }

  const promptFinalSubmit = () => {
    const doc1 = isHospital ? licenseDoc : bmdcDoc
    const doc2 = isHospital ? tradeDoc : nidDoc
    const doc1Name = isHospital ? 'হাসপাতাল লাইসেন্স / DGHS সনদ' : 'বিএমডিসি সনদ'
    const doc2Name = isHospital ? 'ট্রেড লাইসেন্স / পরিচালকের NID' : 'জাতীয় পরিচয়পত্র (NID)'

    if (!doc1 || !doc2) {
      showWarning({
        title: 'নথি অপূর্ণ রয়েছে',
        message: `চূড়ান্ত আবেদন জমা দেওয়ার জন্য ${doc1Name} ও ${doc2Name} উভয়ই আপলোড করা আবশ্যক!`,
        confirmText: 'ঠিক আছে'
      })
      return
    }
    if (!agreedToSubmit) {
      showWarning({
        title: 'সম্মতি প্রদান আবশ্যক',
        message: 'অনুগ্রহ করে আবেদনের তথ্যাবলী সঠিক নিশ্চিত করে সম্মতি বক্সে টিক চিহ্ন প্রদান করুন।',
        confirmText: 'ঠিক আছে'
      })
      return
    }

    setDialogState({
      isOpen: true,
      type: 'submit',
      docType: null,
      title: 'চূড়ান্ত আবেদন জমা নিশ্চিতকরণ',
      message: 'আপনি কি নিশ্চিত যে আপনার আবেদনটি চূড়ান্তভাবে জমা দিতে চান? জমা দেওয়ার পর অ্যাডমিনের যাচাই শেষ না হওয়া পর্যন্ত এটি লক থাকবে এবং কোনো তথ্য পরিবর্তন করা যাবে না।',
      confirmText: 'হ্যাঁ, নিশ্চিতভাবে জমা দিন',
      cancelText: 'পুনরায় পর্যালোচনা করুন',
      variant: 'success'
    })
  }

  const confirmFinalSubmit = async () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }))
    setSubmittingFinal(true)
    setUploadError(null)

    try {
      const res = isHospital
        ? await submitHospitalVerificationApplication()
        : await submitDoctorVerificationApplication()
      if (res.data?.success) {
        setShowCelebrationModal(true)
        if (fetchCurrentUser) await fetchCurrentUser()
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'আবেদন জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
      setUploadError(msg)
      toast.error(msg)
    } finally {
      setSubmittingFinal(false)
    }
  }

  // Name resolution
  const displayName = location.state?.name ||
    user?.hospital?.name ||
    user?.hospital?.name_bn ||
    user?.doctor?.name ||
    user?.doctor?.name_bn ||
    user?.name ||
    (isHospital ? 'হাসপাতাল কর্তৃপক্ষ' : 'ডাক্তার')

  // Mobile / Email resolution (strictly use real user/state data, no dummy values)
  const rawPhone = user?.phone || user?.mobile || location.state?.phone || location.state?.mobile || ''
  const toBngDigits = (num) => String(num || '').replace(/[0-9]/g, (digit) => '০১২৩৪৫৬৭৮৯'[digit])
  const mobileDisplay = rawPhone ? toBngDigits(rawPhone) : 'প্রদান করা হয়নি'
  const emailAddress = user?.email || location.state?.email || 'প্রদান করা হয়নি'

  // License / BMDC resolution
  const licenseNumber = user?.bmdc ||
    user?.bmdc_number ||
    user?.doctor?.bmdc ||
    user?.doctor?.bmdc_number ||
    user?.bmdc_reg_no ||
    user?.license_number ||
    user?.hospital?.license_number ||
    user?.dghs_reg_no ||
    location.state?.bmdc ||
    location.state?.bmdc_number ||
    location.state?.license_number ||
    'যাচাই প্রক্রিয়াধীন'

  // Workplace / Hospital name resolution
  const workplace = user?.doctor?.workplace ||
    user?.doctor?.workplace_bn ||
    location.state?.workplace ||
    location.state?.hospital_name ||
    user?.hospital?.name ||
    ''

  // Submission Date & Time
  const submissionTimestamp = user?.created_at || location.state?.created_at || null
  const { date: submissionDate, time: submissionTime } = formatBengaliDateTime(submissionTimestamp)

  // Route Protection & Auto-Redirect checks
  useEffect(() => {
    if (loading) return

    // 1. If guest with no registration state -> Redirect to Login
    if (!isLoggedIn && !location.state?.type) {
      navigate('/login', { replace: true })
      return
    }

    // 2. If approved Admin / Doctor / Hospital -> Redirect to their dashboard
    if (isAdmin) {
      toast.success('আপনার অ্যাকাউন্ট অনুমোদিত!')
      navigate('/admin', { replace: true })
      return
    }
    if (isDoctor) {
      toast.success('আপনার ডাক্তার অ্যাকাউন্ট অনুমোদিত হয়েছে!')
      navigate('/doctor', { replace: true })
      return
    }
    if (isManager) {
      toast.success('আপনার হাসপাতাল অ্যাকাউন্ট অনুমোদিত হয়েছে!')
      navigate('/hospital', { replace: true })
      return
    }

    // 3. If regular patient with no pending doctor/hospital application -> Redirect to Home
    const isDoctorApp = location.state?.type === 'doctor' || user?.registration_type === 'doctor' || !!user?.doctor || user?.role_id === 2
    const isHospitalApp = location.state?.type === 'hospital' || user?.registration_type === 'hospital' || !!user?.hospital || user?.role_id === 3

    if (isLoggedIn && !isDoctorApp && !isHospitalApp && (isPatient || user?.role_id === 4)) {
      navigate('/', { replace: true })
      return
    }
  }, [loading, isLoggedIn, isAdmin, isDoctor, isManager, isPatient, user, location.state, navigate])

  // Instant fetch on mount to sync user profile and details immediately
  useEffect(() => {
    if (isLoggedIn && fetchCurrentUser) {
      fetchCurrentUser()
    }
  }, [isLoggedIn])

  // Real-time status sync: Periodic polling fallback & tab focus listener
  useEffect(() => {
    if (!isLoggedIn) return

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchCurrentUser?.()
      }
    }, 5000)

    const handleFocus = () => {
      fetchCurrentUser?.()
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', handleFocus)
    }
  }, [isLoggedIn, fetchCurrentUser])

  // Live status check
  const handleCheckStatus = async () => {
    if (statusFeedbackTimerRef.current) {
      clearTimeout(statusFeedbackTimerRef.current)
    }
    setRefreshing(true)
    setStatusCheckFeedback(null)
    try {
      if (fetchCurrentUser) {
        await fetchCurrentUser()
      }

      if (isAdmin) {
        await showSuccess({
          title: 'অভিনন্দন! 🎉',
          message: 'আপনার অ্যাকাউন্ট অনুমোদিত হয়েছে।',
          confirmText: 'অ্যাডমিন ড্যাশবোর্ডে যান',
          autoCloseMs: 2000
        })
        navigate('/admin', { replace: true })
        return
      }
      if (isDoctor) {
        await showSuccess({
          title: 'অভিনন্দন! 🩺',
          message: 'আপনার ডাক্তার অ্যাকাউন্ট সফলভাবে অনুমোদিত হয়েছে।',
          confirmText: 'ডাক্তার প্যানেলে যান',
          autoCloseMs: 2000
        })
        navigate('/doctor', { replace: true })
        return
      }
      if (isManager) {
        await showSuccess({
          title: 'অভিনন্দন! 🏥',
          message: 'আপনার হাসপাতাল অ্যাকাউন্ট সফলভাবে অনুমোদিত হয়েছে।',
          confirmText: 'হাসপাতাল প্যানেলে যান',
          autoCloseMs: 2000
        })
        navigate('/hospital', { replace: true })
        return
      }

      setTimeout(() => {
        setRefreshing(false)
        setStatusCheckFeedback({
          type: 'pending',
          text: 'আপনার আবেদনটি বর্তমানে যাচাই প্রক্রিয়াধীন রয়েছে'
        })

        // Auto fade-out after 3.5 seconds to keep the screen clean & fresh
        statusFeedbackTimerRef.current = setTimeout(() => {
          setStatusCheckFeedback(null)
        }, 3500)
      }, 500)
    } catch {
      setRefreshing(false)
      setStatusCheckFeedback({
        type: 'error',
        text: 'স্ট্যাটাস আপডেট চেক করতে সাময়িক সমস্যা হয়েছে। আবার চেষ্টা করুন।'
      })
      statusFeedbackTimerRef.current = setTimeout(() => {
        setStatusCheckFeedback(null)
      }, 3500)
    }
  }

  // Loading state while auth initializes
  if (loading && !location.state?.type) {
    return (
      <div className="pv-page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">লোড হচ্ছে...</span>
        </div>
      </div>
    )
  }

  // Prevent flash of page content for unauthorized visitors
  if (!isLoggedIn && !location.state?.type) {
    return null
  }

  return (
    <div className="pv-page-container">
      <div className="pv-content-wrapper">

        {/* ===== MAIN WHITE CARD ===== */}
        <div className="pv-main-card">

          {/* Top Illustration */}
          <div className="pv-illustration-wrapper">
            <img
              src="/images/pending-verification-hero.png"
              alt="আবেদন যাচাইকরণ প্রক্রিয়াধীন"
              className="pv-illustration-img"
              loading="eager"
            />
          </div>

          {/* Applicant Role & Identity Badge */}
          <div className="pv-applicant-badge-container">
            <span className="pv-applicant-badge">
              <span className="pv-applicant-dot" />
              {isHospital ? <Building2 size={15} className="pv-applicant-icon" /> : <User size={15} className="pv-applicant-icon" />}
              <span className="pv-applicant-text">
                {displayName} — {roleLabel} হিসেবে আবেদন
              </span>
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="pv-main-title">
            {isRevisionRequested
              ? 'নথিপত্র সংশোধনের অনুরোধ করা হয়েছে'
              : isLocked
                ? 'আপনার আবেদন অনুমোদনের অপেক্ষায়'
                : !hasBothDocs
                  ? (isHospital
                      ? (!doc1 && !doc2
                          ? 'হাসপাতালের লাইসেন্স ও ট্রেড লাইসেন্স জমা দিন'
                          : (!doc1 ? 'হাসপাতালের লাইসেন্স সনদ জমা দিন' : 'ট্রেড লাইসেন্স / NID জমা দিন'))
                      : (!doc1 && !doc2
                          ? 'আপনার বিএমডিসি সনদ ও জাতীয় পরিচয়পত্র জমা দিন'
                          : (!doc1 ? 'আপনার বিএমডিসি সনদপত্র জমা দিন' : 'আপনার জাতীয় পরিচয়পত্র (NID) জমা দিন')))
                  : 'চূড়ান্ত আবেদন জমা দিয়ে যাচাই শুরু করুন'}
          </h1>

          {/* Subtitle */}
          <p className="pv-main-subtitle">
            {isRevisionRequested ? (
              <>
                প্রশাসকের নির্দেশনা অনুযায়ী অনুগ্রহ করে আপনার সঠিক ও স্পষ্ট নথি পুনরায় আপলোড করে চূড়ান্ত জমা দিন।
              </>
            ) : isLocked ? (
              <>
                আপনার সকল তথ্য ও কাগজপত্র সফলভাবে জমা হয়েছে।<br />
                এটি এখন প্রশাসক দলের মাধ্যমে যাচাই করা হচ্ছে।
              </>
            ) : !hasBothDocs ? (
              isHospital ? (
                <>
                  হাসপাতালের সঠিকতা ও সেবাগ্রহীতাদের সুরক্ষা নিশ্চিত করতে লাইসেন্স ও ট্রেড লাইসেন্স/NID উভয় নথি যাচাই বাধ্যতামূলক।<br />
                  উভয় নথি আপলোড করে চূড়ান্ত আবেদন সম্পন্ন করুন।
                </>
              ) : (
                <>
                  রোগীর নিরাপত্তা ও চিকিৎসকের পেশাদারিত্ব নিশ্চিত করতে বিএমডিসি (BMDC) সনদ ও জাতীয় পরিচয়পত্র (NID) উভয়ই যাচাই বাধ্যতামূলক।<br />
                  উভয় নথি আপলোড করে চূড়ান্ত আবেদন সম্পন্ন করুন।
                </>
              )
            ) : (
              <>
                আপনার সকল প্রয়োজনীয় কাগজপত্র আপলোড সম্পন্ন হয়েছে। নিচের অংশে নিশ্চিতকরণ বক্সে টিক দিয়ে<br />
                আবেদনটি চূড়ান্ত জমা দিন, যেন অ্যাডমিন প্যানেল দ্রুত যাচাই করে প্রোফাইল সক্রিয় করতে পারে।
              </>
            )}
          </p>

          {/* ===== 3-STEP HORIZONTAL PROGRESS STEPPER ===== */}
          <div className="pv-stepper-box">
            <div className="pv-stepper-track">

              {/* Step 1: তথ্য জমা (Done) */}
              <div className="pv-step-node">
                <div className="pv-step-icon-circle pv-node-done">
                  <Check size={18} strokeWidth={3} />
                </div>
                <div className="pv-step-text-group">
                  <span className="pv-step-title pv-title-done">তথ্য জমা</span>
                  <span className="pv-step-time-info">{submissionDate}</span>
                  <span className="pv-step-time-info">{submissionTime}</span>
                </div>
              </div>

              {/* Connecting Line 1 (Green) */}
              <div className="pv-step-connector pv-connector-done" />

              {/* Step 2: যাচাই চলছে / জমা দিন */}
              <div className="pv-step-node">
                <div
                  className={`pv-step-icon-circle ${!hasBothDocs ? 'pv-node-pending' : 'pv-node-active'}`}
                  style={
                    !hasBothDocs
                      ? { borderColor: '#EAB308', color: '#CA8A04', background: '#FEF9C3' }
                      : !isLocked
                        ? { borderColor: '#3B82F6', color: '#1D4ED8', background: '#EFF6FF' }
                        : {}
                  }
                >
                  <Hourglass size={16} strokeWidth={2.4} />
                </div>
                <div className="pv-step-text-group">
                  <span
                    className={`pv-step-title ${!hasBothDocs ? '' : 'pv-title-active'}`}
                    style={
                      !hasBothDocs
                        ? { color: '#B45309', fontWeight: 700 }
                        : !isLocked
                          ? { color: '#1D4ED8', fontWeight: 700 }
                          : {}
                    }
                  >
                    {!hasBothDocs
                      ? (!doc1 && !doc2
                          ? 'নথি দিন'
                          : (!doc1
                              ? (isHospital ? 'লাইসেন্স দিন' : 'সনদ দিন')
                              : (isHospital ? 'ট্রেড লাইসেন্স' : 'এনআইডি দিন')))
                      : (!isLocked ? 'জমা দিন' : 'যাচাই চলছে')}
                  </span>
                </div>
              </div>

              {/* Connecting Line 2 (Dashed gray) */}
              <div className="pv-step-connector pv-connector-pending" />

              {/* Step 3: অনুমোদিত হবে (Pending / Future) */}
              <div className="pv-step-node">
                <div className="pv-step-icon-circle pv-node-pending">
                  <Check size={16} strokeWidth={2.2} />
                </div>
                <div className="pv-step-text-group">
                  <span className="pv-step-title pv-title-pending">অনুমোদিত হবে</span>
                </div>
              </div>

            </div>
          </div>

          {/* ===== VERIFICATION DOCUMENTS UPLOAD CARD (DOCTOR & HOSPITAL) ===== */}
          <div style={{ marginTop: 18, marginBottom: 16 }}>
            {/* Locked Notice if submitted or approved */}
            {isLocked && (
              <div style={{
                padding: '12px 14px',
                borderRadius: 12,
                background: '#F0FDF4',
                border: '1.5px solid #86EFAC',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                fontSize: 13,
                color: '#166534'
              }}>
                <ShieldCheck size={20} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <strong>আবেদন পর্যালোচনার জন্য জমা রয়েছে (লকড):</strong> আপনার কাগজপত্র চূড়ান্তভাবে জমা হয়েছে। অ্যাডমিন কর্তৃক যাচাই প্রক্রিয়া শেষ না হওয়া পর্যন্ত এটি লক থাকবে এবং কোনো তথ্য পরিবর্তন করা যাবে না।
                </div>
              </div>
            )}

            {/* Revision Alert if Requested */}
            {isRevisionRequested && (isHospital ? user?.hospital?.verification_notes : user?.doctor?.verification_notes) && (
              <div style={{
                padding: '12px 14px',
                borderRadius: 12,
                background: '#FEF3C7',
                border: '1px solid #FDE68A',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                fontSize: 13,
                color: '#92400E'
              }}>
                <AlertCircle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <strong>অ্যাডমিন রিভিউ নোট:</strong> {isHospital ? user?.hospital?.verification_notes : user?.doctor?.verification_notes}
                  <div style={{ marginTop: 4, fontSize: 12, color: '#B45309' }}>
                    অনুগ্রহ করে নির্দেশনা অনুযায়ী সঠিক ও স্পষ্ট নথিটি পুনরায় আপলোড করে চূড়ান্ত জমা দিন।
                  </div>
                </div>
              </div>
            )}

            {/* Document 1 Slot: BMDC Certificate (Doctor) or Hospital License (Hospital) */}
            <div style={{
              background: doc1 ? '#F0FDF4' : '#FFFFFF',
              border: doc1 ? '1.5px solid #86EFAC' : '1.5px dashed #00B875',
              borderRadius: 14,
              padding: '12px 12px',
              marginBottom: 10,
              boxShadow: doc1 ? 'none' : '0 2px 10px rgba(0, 184, 117, 0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: doc1 ? 8 : 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <FileText size={16} color={doc1 ? '#16A34A' : '#00B875'} style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {isHospital ? 'হাসপাতাল লাইসেন্স / DGHS সনদপত্র' : 'বিএমডিসি সনদপত্র'} <span style={{ color: '#DC2626' }}>*</span>
                  </span>
                </div>
                {doc1 ? (
                  <span style={{ fontSize: 10.5, background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3.5, flexShrink: 0 }}>
                    <CheckCircle2 size={11} /> {isLocked ? 'যাচাই চলছে' : 'সংরক্ষিত'}
                  </span>
                ) : (
                  <span style={{ fontSize: 10.5, background: '#FEF2F2', color: '#DC2626', padding: '2px 8px', borderRadius: 10, fontWeight: 700, flexShrink: 0 }}>
                    আপলোড আবশ্যক
                  </span>
                )}
              </div>

              {doc1 ? (
                <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #DCFCE7', padding: '10px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={16} color="#166534" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#166534', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {isHospital ? 'Hospital License' : 'BMDC Certificate'}
                      </span>
                      <span style={{ fontSize: 11, color: '#65A30D' }}>সনদপত্র সংরক্ষিত রয়েছে</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                    <a
                      href={getMediaUrl(doc1)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pv-doc-action-btn pv-doc-action-view"
                    >
                      <Eye size={13} />
                      <span>{isLocked ? 'সনদপত্র দেখুন' : 'দেখুন'}</span>
                    </a>
                    {!isLocked && (
                      <>
                        <button
                          type="button"
                          onClick={() => isHospital ? licenseFileInputRef.current?.click() : bmdcFileInputRef.current?.click()}
                          disabled={uploadingDoc || deletingDoc}
                          className="pv-doc-action-btn pv-doc-action-change"
                        >
                          <RefreshCw size={12} />
                          <span>পরিবর্তন</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => promptDeleteFile(isHospital ? 'license' : 'bmdc')}
                          disabled={uploadingDoc || deletingDoc}
                          className="pv-doc-action-btn pv-doc-action-delete"
                        >
                          {deletingDoc && activeDeleteType === (isHospital ? 'license' : 'bmdc') ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                          <span>মুছুন</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => !uploadingDoc && !deletingDoc && !isLocked && (isHospital ? licenseFileInputRef.current?.click() : bmdcFileInputRef.current?.click())}
                  style={{
                    padding: '12px 10px',
                    background: '#F8FAFC',
                    borderRadius: 10,
                    cursor: (uploadingDoc || deletingDoc || isLocked) ? 'not-allowed' : 'pointer',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => !uploadingDoc && !deletingDoc && !isLocked && (e.currentTarget.style.background = '#F0FDF4')}
                  onMouseLeave={(e) => !uploadingDoc && !deletingDoc && !isLocked && (e.currentTarget.style.background = '#F8FAFC')}
                >
                  {uploadingDoc && activeUploadType === (isHospital ? 'license' : 'bmdc') ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#00B875', fontSize: 12.5, fontWeight: 600 }}>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{isHospital ? 'হাসপাতালের লাইসেন্স আপলোড হচ্ছে...' : 'BMDC সনদ আপলোড হচ্ছে...'}</span>
                    </div>
                  ) : (
                    <>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <UploadCloud size={18} color="#00B875" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, textAlign: 'left' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                          {isHospital ? 'লাইসেন্স সনদ আপলোড করতে ট্যাপ করুন' : 'সনদপত্র আপলোড করতে ট্যাপ করুন'}
                        </span>
                        <span style={{ fontSize: 10.5, color: '#94A3B8' }}>
                          JPG, PNG বা PDF (সর্বোচ্চ ১০ MB)
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <input
                ref={isHospital ? licenseFileInputRef : bmdcFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleUploadFile(f, isHospital ? 'license' : 'bmdc')
                }}
              />
            </div>

            {/* Document 2 Slot: NID (Doctor) or Trade License / Director NID (Hospital) */}
            <div style={{
              background: doc2 ? '#F0FDF4' : '#FFFFFF',
              border: doc2 ? '1.5px solid #86EFAC' : (isLocked ? '1px solid #E2E8F0' : '1.5px dashed #00B875'),
              borderRadius: 14,
              padding: '12px 12px',
              marginBottom: 10,
              boxShadow: doc2 ? 'none' : '0 2px 10px rgba(0, 184, 117, 0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: doc2 ? 8 : 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <ShieldCheck size={16} color={doc2 ? '#16A34A' : '#00B875'} style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {isHospital ? 'ট্রেড লাইসেন্স / পরিচালকের NID' : 'জাতীয় পরিচয়পত্র / NID'} <span style={{ color: '#EF4444', fontWeight: 800 }}>*</span>
                  </span>
                </div>
                {doc2 ? (
                  <span style={{ fontSize: 10.5, background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3.5, flexShrink: 0 }}>
                    <CheckCircle2 size={11} /> {isLocked ? 'যাচাই চলছে' : 'সংরক্ষিত'}
                  </span>
                ) : (
                  <span style={{ fontSize: 10.5, background: '#FEE2E2', color: '#B91C1C', padding: '2px 8px', borderRadius: 10, fontWeight: 700, flexShrink: 0 }}>
                    আপলোড আবশ্যক
                  </span>
                )}
              </div>

              {doc2 ? (
                <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #DCFCE7', padding: '10px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ShieldCheck size={16} color="#166534" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#166534', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {isHospital ? 'Trade License / Director NID' : 'NID Card'}
                      </span>
                      <span style={{ fontSize: 11, color: '#65A30D' }}>নথি সংরক্ষিত রয়েছে</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                    <a
                      href={getMediaUrl(doc2)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pv-doc-action-btn pv-doc-action-view"
                    >
                      <Eye size={13} />
                      <span>{isLocked ? 'নথি দেখুন' : 'দেখুন'}</span>
                    </a>
                    {!isLocked && (
                      <>
                        <button
                          type="button"
                          onClick={() => isHospital ? tradeFileInputRef.current?.click() : nidFileInputRef.current?.click()}
                          disabled={uploadingDoc || deletingDoc}
                          className="pv-doc-action-btn pv-doc-action-change"
                        >
                          <RefreshCw size={12} />
                          <span>পরিবর্তন</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => promptDeleteFile(isHospital ? 'trade_license' : 'nid')}
                          disabled={uploadingDoc || deletingDoc}
                          className="pv-doc-action-btn pv-doc-action-delete"
                        >
                          {deletingDoc && activeDeleteType === (isHospital ? 'trade_license' : 'nid') ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                          <span>মুছুন</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : isLocked ? (
                <div style={{ padding: '6px 0', fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
                  {isHospital ? 'ট্রেড লাইসেন্স আপলোড করা হয়নি।' : 'জাতীয় পরিচয়পত্র আপলোড করা হয়নি।'}
                </div>
              ) : (
                <div
                  onClick={() => !uploadingDoc && !deletingDoc && !isLocked && (isHospital ? tradeFileInputRef.current?.click() : nidFileInputRef.current?.click())}
                  style={{
                    padding: '12px 10px',
                    background: '#F8FAFC',
                    borderRadius: 10,
                    cursor: (uploadingDoc || deletingDoc || isLocked) ? 'not-allowed' : 'pointer',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => !uploadingDoc && !deletingDoc && !isLocked && (e.currentTarget.style.background = '#EFF6FF')}
                  onMouseLeave={(e) => !uploadingDoc && !deletingDoc && !isLocked && (e.currentTarget.style.background = '#F8FAFC')}
                >
                  {uploadingDoc && activeUploadType === (isHospital ? 'trade_license' : 'nid') ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2563EB', fontSize: 12.5, fontWeight: 600 }}>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{isHospital ? 'ট্রেড লাইসেন্স আপলোড হচ্ছে...' : 'NID আপলোড হচ্ছে...'}</span>
                    </div>
                  ) : (
                    <>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <UploadCloud size={18} color="#3B82F6" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, textAlign: 'left' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                          {isHospital ? 'ট্রেড লাইসেন্স / পরিচালকের NID আপলোড করতে ট্যাপ করুন' : 'পরিচয়পত্র আপলোড করতে ট্যাপ করুন'}
                        </span>
                        <span style={{ fontSize: 10.5, color: '#94A3B8' }}>
                          JPG, PNG বা PDF (সর্বোচ্চ ১০ MB)
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <input
                ref={isHospital ? tradeFileInputRef : nidFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleUploadFile(f, isHospital ? 'trade_license' : 'nid')
                }}
              />
            </div>

            {uploadError && (
              <p style={{ color: '#DC2626', fontSize: 12, marginTop: 6, marginBottom: 0 }}>
                ⚠️ {uploadError}
              </p>
            )}

            {/* ===== FINAL SUBMISSION & APPLICATION LOCK CARD ===== */}
            {!isLocked && (
              <div style={{
                marginTop: 14,
                padding: '16px',
                background: hasBothDocs ? '#F0FDF4' : '#F8FAFC',
                border: hasBothDocs ? '1.5px solid #00B875' : '1.5px solid #E2E8F0',
                borderRadius: 16,
                transition: 'all 0.25s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <ShieldCheck size={18} color={hasBothDocs ? '#16A34A' : '#94A3B8'} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>
                    {isRevisionRequested ? 'সংশোধিত আবেদন পুনরায় জমা দিন' : 'চূড়ান্ত আবেদন জমা দিন'}
                  </span>
                </div>
                <p style={{ fontSize: 12.5, color: '#64748B', margin: '0 0 12px', lineHeight: 1.45 }}>
                  {hasBothDocs
                    ? 'আপনার সকল নথি যাচাই করে নিশ্চিত করুন। চূড়ান্ত জমা দেওয়ার পর অ্যাডমিনের অনুমোদন প্রক্রিয়া শেষ না হওয়া পর্যন্ত কোনো নথি পরিবর্তন করা যাবে না।'
                    : (!doc1 && !doc2
                        ? `আবেদন চূড়ান্ত জমা দেওয়ার জন্য ${doc1Name} এবং ${doc2Name} উভয় নথি আপলোড করা বাধ্যতামূলক।`
                        : (!doc1
                            ? `আবেদন চূড়ান্ত জমা দেওয়ার জন্য ${doc1Name} আপলোড করা বাধ্যতামূলক।`
                            : `আবেদন চূড়ান্ত জমা দেওয়ার জন্য ${doc2Name} আপলোড করা বাধ্যতামূলক।`))
                  }
                </p>

                {hasBothDocs && (
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer', marginBottom: 14, fontSize: 12.5, color: '#334155', fontWeight: 600, userSelect: 'none' }}>
                    <CustomCheckbox
                      checked={agreedToSubmit}
                      onChange={(e) => setAgreedToSubmit(e.target.checked)}
                      style={{ marginTop: 1 }}
                    />
                    <span style={{ lineHeight: 1.45 }}>
                      {isHospital
                        ? 'আমি নিশ্চিত করছি যে প্রদত্ত হাসপাতালের লাইসেন্স, ট্রেড লাইসেন্স / পরিচালকের NID ও যাবতীয় তথ্যাবলী সম্পূর্ণ সত্য ও নির্ভুল।'
                        : 'আমি নিশ্চিত করছি যে প্রদত্ত বিএমডিসি সনদ, জাতীয় পরিচয়পত্র (NID) ও তথ্যাবলী সম্পূর্ণ সত্য ও নির্ভুল।'}
                    </span>
                  </label>
                )}

                <button
                  type="button"
                  onClick={promptFinalSubmit}
                  disabled={!hasBothDocs || !agreedToSubmit || submittingFinal}
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    borderRadius: 10,
                    border: 'none',
                    background: (hasBothDocs && agreedToSubmit)
                      ? 'linear-gradient(135deg, #064E3B 0%, #00B875 100%)'
                      : '#E2E8F0',
                    color: (hasBothDocs && agreedToSubmit) ? '#FFFFFF' : '#94A3B8',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: (hasBothDocs && agreedToSubmit && !submittingFinal) ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s ease',
                    boxShadow: (hasBothDocs && agreedToSubmit) ? '0 4px 14px rgba(0, 184, 117, 0.25)' : 'none'
                  }}
                >
                  {submittingFinal ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>আবেদন জমা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <span>{isRevisionRequested ? 'সংশোধিত আবেদন পুনরায় জমা দিন' : 'চূড়ান্ত আবেদন জমা দিন'}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ===== INFO NOTICE BOX ===== */}
          <div className="pv-notice-box">
            <div className="pv-notice-icon-circle">
              <ShieldCheck size={20} strokeWidth={2.4} />
            </div>
            <div className="pv-notice-content">
              <h4 className="pv-notice-heading">আমরা আপনার তথ্য যাচাই করছি</h4>
              <p className="pv-notice-desc">
                সাধারণত ১–৩ কার্যদিবসের মধ্যে অনুমোদন সম্পন্ন করা হয়। অনুমোদন হলে আপনাকে আমরা নোটিফিকেশন পাঠাবো।
              </p>
            </div>
          </div>

          {/* ===== VIEW APPLICATION DETAILS ACCORDION BUTTON ===== */}
          <div className="pv-details-toggle-card">
            <button
              type="button"
              className="pv-details-toggle-btn"
              onClick={() => setShowDetails(!showDetails)}
              aria-expanded={showDetails}
            >
              <div className="pv-details-btn-left">
                <History size={18} className="pv-details-history-icon" />
                <span className="pv-details-btn-text">আবেদন বিস্তারিত দেখুন</span>
              </div>
              <div className="pv-details-btn-right">
                {showDetails ? (
                  <ChevronUp size={18} className="pv-details-arrow" />
                ) : (
                  <ArrowRight size={18} className="pv-details-arrow" />
                )}
              </div>
            </button>

            {/* Expandable Details Drawer */}
            {showDetails && (
              <div className="pv-details-expanded-panel">
                <div className="pv-details-divider" />
                <div className="pv-details-grid">
                  <div className="pv-details-item">
                    <span className="pv-item-label">
                      <User size={13} /> আবেদনকারীর নাম
                    </span>
                    <span className="pv-item-value">{displayName}</span>
                  </div>

                  <div className="pv-details-item">
                    <span className="pv-item-label">
                      <Building2 size={13} /> অ্যাকাউন্টের ধরন
                    </span>
                    <span className="pv-item-value">{roleLabel}</span>
                  </div>

                  <div className="pv-details-item">
                    <span className="pv-item-label">
                      <FileText size={13} /> {isHospital ? 'লাইসেন্স নম্বর' : 'বিএমডিসি নম্বর'}
                    </span>
                    <span className="pv-item-value">{licenseNumber}</span>
                  </div>

                  {isHospital ? (
                    <>
                      <div className="pv-details-item">
                        <span className="pv-item-label">
                          <ShieldCheck size={13} /> লাইসেন্স সনদ স্ট্যাটাস
                        </span>
                        <span className="pv-item-value" style={{ color: licenseDoc ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
                          {licenseDoc ? '✓ জমা হয়েছে' : '⚠️ বাকি আছে'}
                        </span>
                      </div>
                      <div className="pv-details-item">
                        <span className="pv-item-label">
                          <ShieldCheck size={13} /> ট্রেড লাইসেন্স স্ট্যাটাস
                        </span>
                        <span className="pv-item-value" style={{ color: tradeDoc ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
                          {tradeDoc ? '✓ জমা হয়েছে' : '⚠️ বাকি আছে'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="pv-details-item">
                        <span className="pv-item-label">
                          <ShieldCheck size={13} /> BMDC সনদ স্ট্যাটাস
                        </span>
                        <span className="pv-item-value" style={{ color: bmdcDoc ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
                          {bmdcDoc ? '✓ জমা হয়েছে' : '⚠️ বাকি আছে'}
                        </span>
                      </div>
                      <div className="pv-details-item">
                        <span className="pv-item-label">
                          <ShieldCheck size={13} /> NID কার্ড স্ট্যাটাস
                        </span>
                        <span className="pv-item-value" style={{ color: nidDoc ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
                          {nidDoc ? '✓ জমা হয়েছে' : '⚠️ বাকি আছে'}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="pv-details-item">
                    <span className="pv-item-label">
                      <Phone size={13} /> মোবাইল নম্বর
                    </span>
                    <span className="pv-item-value">{mobileDisplay}</span>
                  </div>

                  <div className="pv-details-item pv-item-full">
                    <span className="pv-item-label">
                      <Mail size={13} /> নিবন্ধিত ইমেইল
                    </span>
                    <span className="pv-item-value">{emailAddress}</span>
                  </div>

                  {workplace && (
                    <div className="pv-details-item pv-item-full">
                      <span className="pv-item-label">
                        <Building2 size={13} /> {isHospital ? 'হাসপাতালের নাম' : 'কর্মস্থল / চেম্বার'}
                      </span>
                      <span className="pv-item-value">{workplace}</span>
                    </div>
                  )}

                  <div className="pv-details-item pv-item-full">
                    <span className="pv-item-label">
                      <AlertCircle size={13} /> বর্তমান অবস্থা
                    </span>
                    <span className="pv-item-value pv-status-badge">
                      যাচাই প্রক্রিয়াধীন (In Review)
                    </span>
                  </div>
                </div>

                {/* Status Refresh Action Inside Details */}
                <div className="pv-refresh-action-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleCheckStatus}
                    disabled={refreshing}
                    className="pv-refresh-submit-btn"
                  >
                    <RefreshCw size={14} className={refreshing ? 'pv-spin-anim' : ''} />
                    <span>{refreshing ? 'চেক হচ্ছে...' : 'স্ট্যাটাস রিফ্রেশ করুন'}</span>
                  </button>

                  {statusCheckFeedback && (
                    <div className="fade-in-up" style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: statusCheckFeedback.type === 'error' ? '#DC2626' : '#0F766E',
                      background: statusCheckFeedback.type === 'error' ? '#FEF2F2' : '#F0FDF4',
                      border: `1px solid ${statusCheckFeedback.type === 'error' ? '#FECACA' : '#CCFBF1'}`,
                      padding: '6px 14px',
                      borderRadius: 20,
                      marginTop: 4,
                      textAlign: 'center',
                      lineHeight: 1.4
                    }}>
                      {statusCheckFeedback.type === 'error' ? (
                        <AlertCircle size={14} style={{ flexShrink: 0 }} />
                      ) : (
                        <CheckCircle2 size={14} style={{ flexShrink: 0, color: '#0D9488' }} />
                      )}
                      <span>{statusCheckFeedback.text}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ===== BOTTOM HELPLINE / CONTACT SUPPORT CARD ===== */}
        <div className="pv-helpline-card">
          <div className="pv-helpline-left">
            <div className="pv-headset-icon-wrap">
              <Headset size={24} color="#0F172A" />
            </div>
            <div className="pv-helpline-text-group">
              <span className="pv-helpline-query">কোনো সহায়তা প্রয়োজন?</span>
              <span className="pv-helpline-subtext">আমাদের সাথে যোগাযোগ করুন</span>
            </div>
          </div>

          <a href="tel:09613868438" className="pv-call-pill-btn" title="সরাসরি কল করুন">
            <Phone size={14} className="pv-phone-pill-icon" />
            <span>09613868438</span>
          </a>
        </div>

        {/* Sign out / Switch Account Action */}
        <div style={{ textAlign: 'center', marginTop: 4, marginBottom: 8 }}>
          <button
            type="button"
            onClick={() => {
              if (logout) logout()
              navigate('/login', { replace: true })
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#059669',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
              fontFamily: "'Hind Siliguri', sans-serif"
            }}
          >
            অন্য অ্যাকাউন্ট দিয়ে সাইন ইন করুন / লগআউট
          </button>
        </div>

      </div>

      {/* ===== ENTERPRISE CUSTOM CONFIRMATION MODAL ===== */}
      {dialogState.isOpen && (
        <div
          className="db-dialog-overlay"
          onClick={() => !deletingDoc && !submittingFinal && setDialogState((prev) => ({ ...prev, isOpen: false }))}
        >
          <div
            className="db-dialog-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{ maxWidth: 420 }}
          >
            <div className={`db-dialog-icon-wrapper ${dialogState.variant === 'danger' ? 'danger' : 'success'}`}>
              {dialogState.variant === 'danger' ? (
                <Trash2 size={28} strokeWidth={2.2} />
              ) : (
                <ShieldCheck size={30} strokeWidth={2.2} />
              )}
            </div>

            <h3 className="db-dialog-title" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
              {dialogState.title}
            </h3>
            <p className="db-dialog-body" style={{ fontFamily: "'Hind Siliguri', sans-serif", fontSize: 13.5, lineHeight: 1.55 }}>
              {dialogState.message}
            </p>

            <div className="db-dialog-actions" style={{ gap: 10 }}>
              <button
                type="button"
                className="db-dialog-btn db-dialog-btn-cancel"
                onClick={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
                disabled={deletingDoc || submittingFinal}
                style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
              >
                {dialogState.cancelText}
              </button>
              <button
                type="button"
                className={`db-dialog-btn ${dialogState.variant === 'danger' ? 'db-dialog-btn-danger' : 'db-dialog-btn-primary'}`}
                onClick={() => {
                  if (dialogState.type === 'delete') {
                    confirmDeleteFile()
                  } else if (dialogState.type === 'submit') {
                    confirmFinalSubmit()
                  }
                }}
                disabled={deletingDoc || submittingFinal}
                style={{ fontFamily: "'Hind Siliguri', sans-serif", gap: 6 }}
              >
                {(deletingDoc || submittingFinal) ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>অপেক্ষা করুন...</span>
                  </>
                ) : (
                  <span>{dialogState.confirmText}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CELEBRATION CONGRATULATORY MODAL WITH FALLING FLOWERS ===== */}
      {showCelebrationModal && (
        <div className="pv-celebration-overlay" onClick={() => setShowCelebrationModal(false)}>
          {/* Falling Flower Petals & Confetti */}
          <div className="pv-petals-container" aria-hidden="true">
            {flowerPetals.map((p) => (
              <span
                key={p.id}
                className="pv-petal"
                style={{
                  left: `${p.left}%`,
                  fontSize: `${p.size}px`,
                  animationDuration: `${p.duration}s`,
                  animationDelay: `${p.delay}s`,
                  '--drift': `${p.drift}px`,
                }}
              >
                {p.char}
              </span>
            ))}
          </div>

          {/* Celebration Card */}
          <div
            className="pv-celebration-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Top Glowing Flower Badge */}
            <div className="pv-celebration-badge-glow">
              <div className="pv-celebration-badge-inner">
                <span style={{ fontSize: 34 }}>🌸</span>
              </div>
            </div>

            {/* Congratulatory Greeting */}
            <span className="pv-celebration-tag">
              ✨ উষ্ণ সংবর্ধনা ও অভিনন্দন ✨
            </span>
            <h2 className="pv-celebration-title">
              {isHospital
                ? (displayName || 'সম্মানিত হাসপাতাল কর্তৃপক্ষ')
                : (displayName ? (displayName.startsWith('Dr.') || displayName.startsWith('ডা.') ? displayName : `ডা. ${displayName}`) : 'সম্মানিত চিকিৎসক')}
            </h2>
            <p className="pv-celebration-welcome">
              ডক্টর বুকলেট (Doctor Booklet) পরিবারে আপনাকে আন্তরিক স্বাগতম!
            </p>

            <div className="pv-celebration-divider" />

            <div className="pv-celebration-message-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#166534', fontWeight: 700, fontSize: 13.5, marginBottom: 6 }}>
                <CheckCircle2 size={18} color="#16A34A" />
                <span>আপনার আবেদন সফলভাবে গৃহীত হয়েছে</span>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: '#334155', lineHeight: 1.55 }}>
                {isHospital
                  ? 'আপনার হাসপাতালের লাইসেন্স ও প্রয়োজনীয় যাবতীয় নথিপত্র চূড়ান্তভাবে আমাদের ভেরিফিকেশন প্যানেলে জমা হয়েছে। তথ্যের সুরক্ষার স্বার্থে সকল নথি লক করা হয়েছে।'
                  : 'আপনার বিএমডিসি সনদপত্র ও প্রয়োজনীয় তথ্যাবলী চূড়ান্তভাবে আমাদের ভেরিফিকেশন প্যানেলে জমা হয়েছে। তথ্যের সুরক্ষার স্বার্থে সকল নথি লক করা হয়েছে।'}
              </p>
            </div>

            {/* Timeline pill */}
            <div className="pv-celebration-timeline">
              <Hourglass size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                {isHospital
                  ? 'আমাদের যাচাইকরণ দল দ্রুত এটি পর্যালোচনা করে <strong>১–৩ কার্যদিবসের</strong> মধ্যে আপনার হাসপাতাল প্রোফাইল সম্পূর্ণ সক্রিয় করবে।'
                  : 'আমাদের চিকিৎসক যাচাইকরণ দল দ্রুত এটি পর্যালোচনা করে <strong>১–৩ কার্যদিবসের</strong> মধ্যে আপনার প্রোফাইল সম্পূর্ণ সক্রিয় করবে।'}
              </span>
            </div>

            {/* Action button */}
            <button
              type="button"
              className="pv-celebration-btn"
              onClick={() => setShowCelebrationModal(false)}
            >
              <span>ধন্যবাদ, বুঝতে পেরেছি</span>
              <Check size={17} strokeWidth={2.8} />
            </button>
          </div>
        </div>
      )}

      {/* ===== STYLES ===== */}
      <style>{`
        .pv-page-container {
          min-height: calc(100vh - 58px);
          width: 100%;
          background: #F0FDF4;
          background: linear-gradient(180deg, #F0FDF4 0%, #E6F8EE 50%, #F0FDF4 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 24px 16px 90px 16px;
          box-sizing: border-box;
          font-family: 'Inter', 'Hind Siliguri', system-ui, -apple-system, sans-serif;
        }

        .pv-content-wrapper {
          width: 100%;
          max-width: 460px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* Main Card */
        .pv-main-card {
          background: #FFFFFF;
          border-radius: 24px;
          padding: 24px 20px;
          box-shadow: 0 10px 30px rgba(0, 184, 117, 0.08), 0 2px 12px rgba(15, 23, 42, 0.04);
          border: 1px solid rgba(226, 232, 240, 0.85);
          box-sizing: border-box;
        }

        /* Illustration */
        .pv-illustration-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 2px;
        }

        .pv-illustration-img {
          width: 100%;
          max-width: 320px;
          height: auto;
          max-height: 220px;
          object-fit: contain;
          display: block;
        }

        /* Applicant Badge */
        .pv-applicant-badge-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 0;
          margin-bottom: 14px;
        }

        .pv-applicant-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #ECFDF5;
          border: 1.5px solid #A7F3D0;
          padding: 5px 15px;
          border-radius: 999px;
          color: #065F46;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.08);
          max-width: 100%;
        }

        .pv-applicant-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10B981;
          flex-shrink: 0;
        }

        .pv-applicant-icon {
          color: #059669;
          flex-shrink: 0;
        }

        .pv-applicant-text {
          font-size: 13.5px;
          font-weight: 800;
          font-family: 'Hind Siliguri', sans-serif;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Titles */
        .pv-main-title {
          font-size: 20px;
          font-weight: 800;
          color: #0F2942;
          text-align: center;
          margin: 0 0 8px 0;
          line-height: 1.35;
          letter-spacing: -0.3px;
        }

        .pv-main-subtitle {
          font-size: 13.5px;
          color: #475569;
          text-align: center;
          margin: 0 0 24px 0;
          line-height: 1.55;
          font-weight: 500;
        }

        /* Stepper */
        .pv-stepper-box {
          margin-bottom: 22px;
          padding: 0 4px;
        }

        .pv-stepper-track {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          position: relative;
        }

        .pv-step-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 90px;
          z-index: 2;
        }

        .pv-step-icon-circle {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        }

        .pv-node-done {
          background: #00B875;
          color: #FFFFFF;
          box-shadow: 0 4px 10px rgba(0, 184, 117, 0.3);
        }

        .pv-node-active {
          background: #F59E0B;
          color: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2), 0 4px 10px rgba(245, 158, 11, 0.3);
          animation: pvPulseNode 2s infinite ease-in-out;
        }

        @keyframes pvPulseNode {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2), 0 4px 10px rgba(245, 158, 11, 0.3);
          }
          50% {
            box-shadow: 0 0 0 7px rgba(245, 158, 11, 0.28), 0 4px 12px rgba(245, 158, 11, 0.4);
          }
        }

        .pv-node-pending {
          background: #E2E8F0;
          color: #94A3B8;
        }

        .pv-step-text-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 8px;
          text-align: center;
        }

        .pv-step-title {
          font-size: 13px;
          font-weight: 700;
          line-height: 1.25;
        }

        .pv-title-done {
          color: #00B875;
        }

        .pv-title-active {
          color: #D97706;
        }

        .pv-title-pending {
          color: #64748B;
        }

        .pv-step-time-info {
          font-size: 11px;
          color: #64748B;
          margin-top: 2px;
          line-height: 1.3;
          white-space: nowrap;
        }

        .pv-step-connector {
          flex: 1;
          height: 2px;
          margin-top: 16px;
          z-index: 1;
        }

        .pv-connector-done {
          background: #00B875;
        }

        .pv-connector-pending {
          background: repeating-linear-gradient(
            to right,
            #CBD5E1,
            #CBD5E1 5px,
            transparent 5px,
            transparent 9px
          );
        }

        /* Notice Box */
        .pv-notice-box {
          background: #EDFBF4;
          border-radius: 16px;
          padding: 14px 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
          border: 1px solid rgba(0, 184, 117, 0.15);
        }

        .pv-notice-icon-circle {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #DCFCE7;
          color: #00B875;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .pv-notice-content {
          flex: 1;
        }

        .pv-notice-heading {
          font-size: 13.5px;
          font-weight: 700;
          color: #065F46;
          margin: 0 0 3px 0;
          line-height: 1.3;
        }

        .pv-notice-desc {
          font-size: 12px;
          color: #33614B;
          margin: 0;
          line-height: 1.45;
          font-weight: 500;
        }

        /* Accordion Toggle */
        .pv-details-toggle-card {
          border: 1.5px solid #E2E8F0;
          border-radius: 14px;
          background: #FFFFFF;
          overflow: hidden;
          transition: border-color 0.2s;
        }

        .pv-details-toggle-card:hover {
          border-color: #CBD5E1;
        }

        .pv-details-toggle-btn {
          width: 100%;
          background: transparent;
          border: none;
          padding: 13px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          outline: none;
        }

        .pv-details-btn-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pv-details-history-icon {
          color: #0F5132;
        }

        .pv-details-btn-text {
          font-size: 13.5px;
          font-weight: 700;
          color: #0F2942;
        }

        .pv-details-arrow {
          color: #00B875;
          transition: transform 0.2s ease;
        }

        .pv-details-expanded-panel {
          padding: 0 16px 14px 16px;
          animation: pvFadeSlideDown 0.25s ease-out;
        }

        @keyframes pvFadeSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .pv-details-divider {
          height: 1px;
          background: #E2E8F0;
          margin-bottom: 12px;
        }

        .pv-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .pv-details-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .pv-item-full {
          grid-column: 1 / -1;
        }

        .pv-item-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748B;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .pv-item-value {
          font-size: 13px;
          font-weight: 700;
          color: #0F172A;
          word-break: break-word;
        }

        .pv-status-badge {
          color: #D97706;
          display: inline-block;
        }

        .pv-refresh-action-row {
          margin-top: 14px;
          padding-top: 10px;
          border-top: 1px dashed #E2E8F0;
          display: flex;
          justify-content: flex-end;
        }

        .pv-refresh-submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #00B875;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .pv-refresh-submit-btn:hover:not(:disabled) {
          background: #059669;
        }

        .pv-spin-anim {
          animation: pvSpin 0.8s linear infinite;
        }

        @keyframes pvSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Bottom Helpline Card */
        .pv-helpline-card {
          background: #FFFFFF;
          border-radius: 18px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid rgba(226, 232, 240, 0.85);
          box-shadow: 0 4px 16px rgba(0, 184, 117, 0.05), 0 2px 6px rgba(15, 23, 42, 0.03);
          box-sizing: border-box;
        }

        .pv-helpline-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pv-headset-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pv-helpline-text-group {
          display: flex;
          flex-direction: column;
        }

        .pv-helpline-query {
          font-size: 13.5px;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.25;
        }

        .pv-helpline-subtext {
          font-size: 12px;
          color: #64748B;
          margin-top: 1px;
        }

        .pv-call-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #E6F8EE;
          color: #00875A;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 13.5px;
          font-weight: 700;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
          white-space: nowrap;
        }

        .pv-call-pill-btn:hover {
          background: #D1FAE5;
          transform: translateY(-1px);
        }

        .pv-phone-pill-icon {
          color: #00875A;
        }

        /* Document Action Equal-width 3-button Group */
        .pv-doc-action-btn {
          flex: 1;
          height: 34px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4.5px;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.15s ease;
          box-sizing: border-box;
          font-family: inherit;
          outline: none;
          white-space: nowrap;
          user-select: none;
        }

        .pv-doc-action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .pv-doc-action-view {
          background: #FFFFFF;
          color: #059669;
          border: 1px solid #A7F3D0;
        }
        .pv-doc-action-view:hover:not(:disabled) {
          background: #ECFDF5;
          border-color: #059669;
        }

        .pv-doc-action-change {
          background: #FFFFFF;
          color: #475569;
          border: 1px solid #CBD5E1;
        }
        .pv-doc-action-change:hover:not(:disabled) {
          background: #F8FAFC;
          border-color: #94A3B8;
        }

        .pv-doc-action-delete {
          background: #FFF1F2;
          color: #DC2626;
          border: 1px solid #FECDD3;
        }
        .pv-doc-action-delete:hover:not(:disabled) {
          background: #FFE4E6;
          border-color: #FDA4AF;
        }

        /* Desktop Polish (Matching Mobile Structure) */
        @media (min-width: 992px) {
          .pv-page-container {
            padding: 36px 16px 90px 16px !important;
          }

          .pv-main-card {
            box-shadow: 0 16px 40px rgba(0, 184, 117, 0.08), 0 4px 16px rgba(15, 23, 42, 0.04) !important;
          }
        }

        /* ===== CELEBRATION MODAL & FALLING FLOWERS ===== */
        .pv-celebration-overlay {
          position: fixed;
          inset: 0;
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          overflow: hidden;
          animation: pvFadeIn 250ms ease-out forwards;
        }

        .pv-petals-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 1;
        }

        .pv-petal {
          position: absolute;
          top: -45px;
          user-select: none;
          opacity: 0.95;
          animation-name: pvFlowerFall;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation-iteration-count: infinite;
          filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.15));
        }

        @keyframes pvFlowerFall {
          0% {
            transform: translateY(0) rotate(0deg) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            transform: translateY(50vh) rotate(180deg) translateX(var(--drift, 30px));
          }
          90% {
            opacity: 0.85;
          }
          100% {
            transform: translateY(105vh) rotate(360deg) translateX(calc(var(--drift, 30px) * -1));
            opacity: 0;
          }
        }

        .pv-celebration-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          background: #FFFFFF;
          border-radius: 24px;
          padding: 30px 22px 24px 22px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.8);
          animation: pvCelebrationBounce 420ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          border: 2px solid #86EFAC;
          box-sizing: border-box;
        }

        @keyframes pvCelebrationBounce {
          0% {
            opacity: 0;
            transform: scale(0.68) translateY(45px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes pvFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .pv-celebration-badge-glow {
          width: 78px;
          height: 78px;
          border-radius: 50%;
          background: linear-gradient(135deg, #A7F3D0 0%, #34D399 50%, #10B981 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.15), 0 8px 24px rgba(16, 185, 129, 0.35);
          margin-bottom: 14px;
          animation: pvPulseBadge 2.2s infinite ease-in-out;
        }

        @keyframes pvPulseBadge {
          0%, 100% {
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.15), 0 8px 24px rgba(16, 185, 129, 0.35);
          }
          50% {
            box-shadow: 0 0 0 14px rgba(16, 185, 129, 0.22), 0 12px 30px rgba(16, 185, 129, 0.45);
          }
        }

        .pv-celebration-badge-inner {
          width: 62px;
          height: 62px;
          border-radius: 50%;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pv-celebration-tag {
          font-size: 12px;
          font-weight: 800;
          color: #059669;
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          padding: 3px 12px;
          border-radius: 999px;
          margin-bottom: 8px;
          letter-spacing: 0.3px;
        }

        .pv-celebration-title {
          font-size: 20px;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 4px 0;
          letter-spacing: -0.3px;
        }

        .pv-celebration-welcome {
          font-size: 13.5px;
          color: #059669;
          font-weight: 700;
          margin: 0 0 12px 0;
        }

        .pv-celebration-divider {
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, #A7F3D0, #10B981, #A7F3D0);
          border-radius: 2px;
          margin-bottom: 14px;
        }

        .pv-celebration-message-box {
          background: #F0FDF4;
          border: 1px solid #BBF7D0;
          border-radius: 14px;
          padding: 12px 14px;
          text-align: left;
          width: 100%;
          box-sizing: border-box;
          margin-bottom: 12px;
        }

        .pv-celebration-timeline {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: #FEF9C3;
          border: 1px solid #FDE68A;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 12px;
          color: #854D0E;
          line-height: 1.45;
          text-align: left;
          width: 100%;
          box-sizing: border-box;
          margin-bottom: 18px;
        }

        .pv-celebration-btn {
          width: 100%;
          height: 44px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #064E3B 0%, #00B875 100%);
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(0, 184, 117, 0.35);
        }

        .pv-celebration-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(0, 184, 117, 0.45);
        }

        /* Responsive adjustments */
        @media (max-width: 991px) {
          .pv-page-container {
            margin-top: 59px !important;
            min-height: calc(100vh - 59px) !important;
            padding: 20px 14px 85px 14px !important;
          }
        }

        @media (max-width: 480px) {
          .pv-page-container {
            margin-top: 58px !important;
            padding: 16px 12px 85px 12px !important;
          }

          .pv-main-card {
            padding: 20px 14px;
            border-radius: 20px;
          }

          .pv-main-title {
            font-size: 18.5px;
          }

          .pv-main-subtitle {
            font-size: 13px;
            margin-bottom: 20px;
          }

          .pv-step-node {
            width: 82px;
          }

          .pv-step-title {
            font-size: 12px;
          }

          .pv-step-time-info {
            font-size: 10px;
          }

          .pv-notice-box {
            padding: 12px 14px;
          }

          .pv-helpline-card {
            padding: 12px 14px;
            border-radius: 16px;
          }

          .pv-helpline-query {
            font-size: 12.5px;
          }

          .pv-call-pill-btn {
            padding: 7px 13px;
            font-size: 12.5px;
          }

          .pv-details-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
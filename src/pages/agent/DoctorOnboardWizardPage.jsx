import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { 
  User, 
  Award, 
  FileCheck, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  Loader2, 
  Stethoscope,
  Sparkles,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  Calendar,
  Check,
  ChevronRight,
  ExternalLink,
  Plus,
  X,
  Info,
  Edit3,
  FileText,
  ShieldAlert,
  PhoneCall,
  Navigation,
  MapPin,
  RotateCcw
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import agentApi from '../../api/agentApi'
import axiosInstance from '../../api/axiosInstance'
import PresignedDropzone from '../../features/agent/components/PresignedDropzone'
import { getMediaUrl } from '../../utils/mediaUtils'
import { useActiveMedicalDegrees } from '../../features/credentials/useDoctorCredentials'

const enToBnDigits = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBengaliNumber = (str) => (str !== null && str !== undefined && str !== '') ? String(str).replace(/\d/g, d => enToBnDigits[d] || d) : ''

const INITIAL_DOCTOR_FORM = {
  name: '',
  name_bn: '',
  phone: '',
  email: '',
  specialty_id: '',
  custom_specialty_name: '',
  bmdc: '',
  degree: 'MBBS',
  workplace: '',
  experience_years: '',
  division_id: '',
  district_id: '',
  upazila_id: '',
  union_id: '',
  address: '',
  latitude: '',
  longitude: '',
  google_map_url: '',
  fee: '1000',
  bio: '',
  documents: {
    doctor_bmdc_cert: null,
    doctor_nid: null,
  },
}

export default function DoctorOnboardWizardPage() {
  const navigate = useNavigate()
  const { user, isAdmin, isSuperAdmin } = useAuth()
  const { degrees: masterDegrees = [] } = useActiveMedicalDegrees()
  const isAgentSuspended = !isAdmin && !isSuperAdmin && (user?.agent?.status === 'suspended' || user?.agent?.status === 'inactive')

  const [searchParams] = useSearchParams()
  const editCode = searchParams.get('edit_code')
  const [isEditingRevision, setIsEditingRevision] = useState(false)
  const [revisionOriginalRequest, setRevisionOriginalRequest] = useState(null)
  const [loadingEditData, setLoadingEditData] = useState(false)

  // Auto-Save Draft states
  const draftKey = `doctor_onboard_draft_${user?.id || 'session'}`
  const [draftRestored, setDraftRestored] = useState(false)
  const isInitializedRef = useRef(false)

  const [currentStep, setCurrentStep] = useState(1)
  const [specialties, setSpecialties] = useState([])
  const [specialtySearch, setSpecialtySearch] = useState('')
  const [specialtyDropdownOpen, setSpecialtyDropdownOpen] = useState(false)
  const specialtyDropdownRef = useRef(null)

  // Workplace suggestions state
  const [hospitalsList, setHospitalsList] = useState([])
  const [workplaceDropdownOpen, setWorkplaceDropdownOpen] = useState(false)
  const workplaceDropdownRef = useRef(null)

  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [errorList, setErrorList] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})

  // Location Cascading States
  const [divisions, setDivisions] = useState([])
  const [districts, setDistricts] = useState([])
  const [upazilas, setUpazilas] = useState([])
  const [unions, setUnions] = useState([])
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingUpazilas, setLoadingUpazilas] = useState(false)
  const [loadingUnions, setLoadingUnions] = useState(false)
  const [locatingGps, setLocatingGps] = useState(false)

  const [formData, setFormData] = useState(INITIAL_DOCTOR_FORM)

  // 1. Auto-Restore Draft on Mount (when !editCode)
  useEffect(() => {
    if (editCode) {
      isInitializedRef.current = true
      return
    }

    try {
      const saved = localStorage.getItem(draftKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.formData) {
          const d = parsed.formData
          const hasData = Boolean(
            d.name || d.name_bn || d.phone || d.email || d.bmdc ||
            d.specialty_id || d.custom_specialty_name || d.workplace ||
            d.experience_years || d.division_id || d.district_id ||
            d.address || d.bio || (d.documents?.doctor_bmdc_cert?.file_key) ||
            (d.documents?.doctor_nid?.file_key) || (parsed.currentStep && parsed.currentStep > 1)
          )

          if (hasData) {
            setFormData({
              ...INITIAL_DOCTOR_FORM,
              ...d,
              documents: {
                ...INITIAL_DOCTOR_FORM.documents,
                ...(d.documents || {})
              }
            })
            if (parsed.currentStep && parsed.currentStep >= 1 && parsed.currentStep <= 5) {
              setCurrentStep(parsed.currentStep)
            }
            if (parsed.specialtySearch) {
              setSpecialtySearch(parsed.specialtySearch)
            }
            setDraftRestored(true)
          }
        }
      }
    } catch (e) {
      console.warn('Failed to restore doctor onboard draft:', e)
    } finally {
      isInitializedRef.current = true
    }
  }, [draftKey, editCode])

  // 2. Auto-Save Draft whenever formData, currentStep, or specialtySearch changes
  useEffect(() => {
    if (editCode || isEditingRevision || !isInitializedRef.current) return

    const d = formData
    const hasData = Boolean(
      d.name || d.name_bn || d.phone || d.email || d.bmdc ||
      d.specialty_id || d.custom_specialty_name || d.workplace ||
      d.experience_years || d.division_id || d.district_id ||
      d.address || d.bio || (d.documents?.doctor_bmdc_cert?.file_key) ||
      (d.documents?.doctor_nid?.file_key) || currentStep > 1
    )

    if (hasData) {
      try {
        localStorage.setItem(draftKey, JSON.stringify({
          formData,
          currentStep,
          specialtySearch,
          savedAt: new Date().toISOString()
        }))
      } catch (e) {
        console.warn('Failed to auto-save doctor onboard draft:', e)
      }
    }
  }, [formData, currentStep, specialtySearch, draftKey, editCode, isEditingRevision])

  // Discard / Reset Draft
  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(draftKey)
    } catch (e) {
      console.warn('Failed to clear doctor onboard draft:', e)
    }
    setFormData(INITIAL_DOCTOR_FORM)
    setCurrentStep(1)
    setSpecialtySearch('')
    setDraftRestored(false)
    setFieldErrors({})
    setErrorList([])
    setErrorMessage(null)
  }

  // Load divisions on mount
  useEffect(() => {
    axiosInstance.get('/divisions')
      .then((res) => {
        const list = res.data?.data || res.data || []
        setDivisions(Array.isArray(list) ? list : [])
      })
      .catch((err) => console.error('Failed to load divisions:', err))
  }, [])

  // Load cascading districts when division_id changes
  useEffect(() => {
    if (!formData.division_id) {
      setDistricts([])
      return
    }
    setLoadingDistricts(true)
    axiosInstance.get('/districts', { params: { division_id: formData.division_id } })
      .then((res) => {
        const list = res.data?.data || res.data || []
        setDistricts(Array.isArray(list) ? list : [])
      })
      .catch((err) => console.error('Failed to load districts:', err))
      .finally(() => setLoadingDistricts(false))
  }, [formData.division_id])

  // Load cascading upazilas when district_id changes
  useEffect(() => {
    if (!formData.district_id) {
      setUpazilas([])
      return
    }
    setLoadingUpazilas(true)
    axiosInstance.get('/upazilas', { params: { district_id: formData.district_id } })
      .then((res) => {
        const list = res.data?.data || res.data || []
        setUpazilas(Array.isArray(list) ? list : [])
      })
      .catch((err) => console.error('Failed to load upazilas:', err))
      .finally(() => setLoadingUpazilas(false))
  }, [formData.district_id])

  // Load cascading unions when upazila_id changes
  useEffect(() => {
    if (!formData.upazila_id) {
      setUnions([])
      return
    }
    setLoadingUnions(true)
    axiosInstance.get('/unions', { params: { upazila_id: formData.upazila_id } })
      .then((res) => {
        const list = res.data?.data || res.data || []
        setUnions(Array.isArray(list) ? list : [])
      })
      .catch((err) => console.error('Failed to load unions:', err))
      .finally(() => setLoadingUnions(false))
  }, [formData.upazila_id])

  // GPS Geolocation Detection
  const handleDetectGpsLocation = () => {
    if (!navigator.geolocation) {
      toast.error('আপনার ব্রাউজারে জিপিএস সনাক্তকরণ সমর্থন করে না।')
      return
    }

    setLocatingGps(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setFormData((prev) => ({
          ...prev,
          latitude: latitude.toFixed(7),
          longitude: longitude.toFixed(7),
          google_map_url: `https://www.google.com/maps?q=${latitude},${longitude}`
        }))
        toast.success(`সঠিক জিপিএস অবস্থান সনাক্ত হয়েছে (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`)
        setLocatingGps(false)
      },
      (error) => {
        console.warn('Geolocation error:', error)
        toast.error('জিপিএস লোকেশন সনাক্ত করা যায়নি। অনুগ্রহ করে ব্রাউজারের লোকেশন পারমিশন দিন বা ম্যানুয়ালি ইনপুট দিন।')
        setLocatingGps(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // Load existing data if editing an application under revision
  useEffect(() => {
    if (editCode) {
      setLoadingEditData(true)
      agentApi.getOnboardingRequestByCode(editCode)
        .then((res) => {
          const req = res.data
          if (req) {
            setRevisionOriginalRequest(req)
            setIsEditingRevision(true)
            const p = req.payload || {}
            
            const docsObj = {}
            if (Array.isArray(req.documents)) {
              req.documents.forEach((key, idx) => {
                const fieldKey = idx === 0 ? 'doctor_bmdc_cert' : (idx === 1 ? 'doctor_nid' : `doc_${idx}`)
                docsObj[fieldKey] = {
                  file_key: key,
                  name: key.split('/').pop() || `Document #${idx + 1}`,
                  preview_url: getMediaUrl(key)
                }
              })
            }

            setFormData({
              name: p.name || '',
              name_bn: p.name_bn || '',
              phone: p.phone || '',
              email: p.email || '',
              specialty_id: p.specialty_id ? String(p.specialty_id) : '',
              custom_specialty_name: p.custom_specialty_name || '',
              bmdc: p.bmdc || '',
              degree: p.degree || 'MBBS',
              workplace: p.workplace || '',
              experience_years: p.experience_years ? String(p.experience_years) : '',
              division_id: p.division_id ? String(p.division_id) : '',
              district_id: p.district_id ? String(p.district_id) : '',
              upazila_id: p.upazila_id ? String(p.upazila_id) : '',
              union_id: p.union_id ? String(p.union_id) : '',
              address: p.address || '',
              latitude: p.latitude !== undefined && p.latitude !== null ? String(p.latitude) : '',
              longitude: p.longitude !== undefined && p.longitude !== null ? String(p.longitude) : '',
              google_map_url: p.google_map_url || '',
              fee: p.fee ? String(p.fee) : '1000',
              bio: p.bio || '',
              documents: docsObj,
            })
            if (p.specialty_name) {
              setSpecialtySearch(p.specialty_name)
            }
            toast.success(`আবেদন #${editCode}-এর তথ্য সফলভাবে লোড হয়েছে। সংশোধন করে সাবমিট করুন।`, {
              id: 'edit-data-loaded'
            })
          }
        })
        .catch((err) => {
          console.error('Failed to load request for editing:', err)
          toast.error('অনবোর্ডিং আবেদনটির তথ্য লোড করা যায়নি।')
        })
        .finally(() => setLoadingEditData(false))
    }
  }, [editCode])

  const activeDocumentKeys = Object.values(formData.documents || {})
    .filter(Boolean)
    .map((d) => d.file_key)
  const activeDocumentCount = activeDocumentKeys.length

  useEffect(() => {
    // Fetch available specialties
    axiosInstance.get('/specialties')
      .then((res) => {
        const list = res.data?.data || res.data || []
        setSpecialties(Array.isArray(list) ? list : [])
      })
      .catch((err) => console.error('Failed to load specialties:', err))
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (specialtyDropdownRef.current && !specialtyDropdownRef.current.contains(e.target)) {
        setSpecialtyDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredSpecialties = specialties.filter((s) => {
    if (!specialtySearch.trim()) return true
    const q = specialtySearch.toLowerCase()
    const nameMatch = s.name && s.name.toLowerCase().includes(q)
    const bnMatch = (s.bangla_name || s.name_bn) && (s.bangla_name || s.name_bn).toLowerCase().includes(q)
    return nameMatch || bnMatch
  })

  const hasExactSpecialtyMatch = specialties.some(
    (s) => s.name && s.name.toLowerCase().trim() === specialtySearch.toLowerCase().trim()
  )

  const handleSelectSpecialty = (s) => {
    setFormData((prev) => ({
      ...prev,
      specialty_id: s.id,
      custom_specialty_name: ''
    }))
    setSpecialtySearch(s.name)
    setSpecialtyDropdownOpen(false)
    if (fieldErrors.specialty_id) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next.specialty_id
        return next
      })
    }
  }

  // Fetch registered hospitals for workplace suggestions
  useEffect(() => {
    axiosInstance.get('/hospitals', { params: { per_page: 80 } })
      .then((res) => {
        const raw = res.data
        let list = []
        if (raw?.data?.data && Array.isArray(raw.data.data)) {
          list = raw.data.data
        } else if (raw?.data && Array.isArray(raw.data)) {
          list = raw.data
        } else if (Array.isArray(raw)) {
          list = raw
        }
        setHospitalsList(list)
      })
      .catch((err) => console.error('Failed to load hospitals for suggestions:', err))
  }, [])

  // Close workplace dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (workplaceDropdownRef.current && !workplaceDropdownRef.current.contains(e.target)) {
        setWorkplaceDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredHospitals = (hospitalsList || []).filter((h) => {
    const q = (formData.workplace || '').trim().toLowerCase()
    if (!q) return true
    const nameMatch = h.name && h.name.toLowerCase().includes(q)
    const bnMatch = (h.name_bn || h.bangla_name) && (h.name_bn || h.bangla_name).toLowerCase().includes(q)
    return nameMatch || bnMatch
  }).slice(0, 8)

  const handleSelectCustomSpecialty = (customName) => {
    const cleanName = customName.trim()
    if (!cleanName) return
    setFormData((prev) => ({
      ...prev,
      specialty_id: '',
      custom_specialty_name: cleanName
    }))
    setSpecialtySearch(cleanName)
    setSpecialtyDropdownOpen(false)
    if (fieldErrors.specialty_id) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next.specialty_id
        return next
      })
    }
  }

  const handleClearSpecialty = () => {
    setFormData((prev) => ({
      ...prev,
      specialty_id: '',
      custom_specialty_name: ''
    }))
    setSpecialtySearch('')
    setSpecialtyDropdownOpen(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleDocumentUploaded = (category, fileKey, fileName, fileSizeText) => {
    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [category]: { file_key: fileKey, file_name: fileName, file_size: fileSizeText },
      },
    }))
    if (fieldErrors.document_keys) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next.document_keys
        return next
      })
    }
    toast.success('ডকুমেন্ট সফলভাবে সংযুক্ত হয়েছে!')
  }

  const handleDocumentRemoved = (category) => {
    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [category]: null,
      },
    }))
  }

  const getFieldError = (name) => {
    const err = fieldErrors[name]
    if (!err) return null
    return Array.isArray(err) ? err[0] : err
  }

  const validateStep = (step) => {
    setErrorMessage(null)
    const errs = {}

    if (step === 1) {
      if (!formData.name.trim()) errs.name = 'ডাক্তারের পুরো নাম (ইংরেজিতে) আবশ্যক।'
      if (!formData.phone.trim()) {
        errs.phone = 'মোবাইল ফোন নম্বর আবশ্যক।'
      } else if (!/^01[3-9]\d{8}$/.test(formData.phone)) {
        errs.phone = 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।'
      }
      if (formData.email?.trim() && !formData.email.includes('@')) {
        errs.email = 'সঠিক ইমেইল ফরম্যাট দিন (যেমন: doctor@example.com)।'
      }
    }

    if (step === 2) {
      if (!formData.bmdc.trim()) {
        errs.bmdc = 'BMDC রেজিস্ট্রেশন নম্বর আবশ্যক (যেমন: A-18293)।'
      } else if (formData.bmdc.includes('@') || !/^[A-Za-z0-9\-\s]+$/.test(formData.bmdc.trim())) {
        errs.bmdc = 'সঠিক BMDC রেজিস্ট্রেশন নম্বর লিখুন (যেমন: A-18293)। কোনো ইমেইল ঠিকানা গ্রহণযোগ্য নয়।'
      }
      if (!formData.specialty_id && !formData.custom_specialty_name?.trim()) {
        errs.specialty_id = 'মেডিকেল স্পেশালিটি নির্বাচন করুন অথবা নতুন নাম লিখুন।'
      }
      if (!formData.workplace.trim()) errs.workplace = 'বর্তমান কর্মস্থল বা চেম্বারের নাম আবশ্যক।'
    }

    if (step === 3) {
      if (!formData.division_id) errs.division_id = 'প্রশাসনিক বিভাগ নির্বাচন করুন।'
      if (!formData.district_id) errs.district_id = 'জেলা নির্বাচন করুন।'
      if (!formData.address?.trim()) errs.address = 'চেম্বার বা হাসপাতালের বিস্তারিত ঠিকানা লিখুন।'
      if (!formData.fee || parseFloat(formData.fee) <= 0) errs.fee = 'পরামর্শ ভিজিট ফি (টাকা) প্রদান করুন।'
    }

    if (step === 4) {
      if (!formData.documents?.doctor_bmdc_cert?.file_key) {
        errs.document_keys = 'BMDC রেজিস্ট্রেশন সনদপত্রটি আপলোড করতে হবে।'
      } else if (!formData.documents?.doctor_nid?.file_key) {
        errs.document_keys = 'ডাক্তারের জাতীয় পরিচয়পত্র (NID) আপলোড করা বাধ্যতামূলক।'
      }
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      const list = Object.values(errs)
      setErrorList(list)
      setErrorMessage(list[0])
      return list[0]
    }

    setFieldErrors({})
    setErrorList([])
    return null
  }

  const nextStep = () => {
    const err = validateStep(currentStep)
    if (err) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setCurrentStep((s) => Math.min(5, s + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const prevStep = () => {
    setErrorMessage(null)
    setCurrentStep((s) => Math.max(1, s - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validateStep(4)
    if (err) {
      setCurrentStep(4)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSubmitting(true)
    setErrorMessage(null)
    setErrorList([])
    setFieldErrors({})

    try {
      const payload = {
        name: formData.name.trim(),
        name_bn: formData.name_bn ? formData.name_bn.trim() : null,
        phone: formData.phone.trim(),
        email: formData.email?.trim() ? formData.email.trim() : null,
        specialty_id: formData.specialty_id ? parseInt(formData.specialty_id, 10) : null,
        custom_specialty_name: formData.custom_specialty_name ? formData.custom_specialty_name.trim() : null,
        bmdc: formData.bmdc.trim(),
        degree: formData.degree ? formData.degree.trim() : 'MBBS',
        workplace: formData.workplace.trim(),
        experience_years: formData.experience_years ? parseInt(formData.experience_years, 10) : null,
        division_id: formData.division_id ? parseInt(formData.division_id, 10) : null,
        district_id: formData.district_id ? parseInt(formData.district_id, 10) : null,
        upazila_id: formData.upazila_id ? parseInt(formData.upazila_id, 10) : null,
        union_id: formData.union_id ? parseInt(formData.union_id, 10) : null,
        address: formData.address ? formData.address.trim() : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        google_map_url: formData.google_map_url ? formData.google_map_url.trim() : null,
        fee: parseFloat(formData.fee),
        bio: formData.bio ? formData.bio.trim() : null,
        document_keys: activeDocumentKeys,
      }

      if (isEditingRevision && editCode) {
        const res = await agentApi.resubmitOnboardingRequest(editCode, payload)
        toast.success('সংশোধিত আবেদনটি সফলভাবে পুনরায় সাবমিট করা হয়েছে! ভেরিফিকেশনের জন্য পাঠানো হয়েছে।')
        navigate('/agent/tracker')
      } else {
        const res = await agentApi.submitDoctorOnboarding(payload)
        try {
          localStorage.removeItem(draftKey)
        } catch (e) {
          console.warn('Failed to clear draft upon submission:', e)
        }
        toast.success('Doctor onboarding application submitted successfully! Under review.')
        navigate('/agent/tracker')
      }
    } catch (err) {
      console.error('Submission failed:', err)
      const data = err?.response?.data
      const backendErrors = data?.errors ? { ...data.errors } : {}

      const extracted = []
      if (typeof backendErrors === 'object' && Object.keys(backendErrors).length > 0) {
        Object.entries(backendErrors).forEach(([field, msgs]) => {
          if (Array.isArray(msgs)) {
            msgs.forEach((m) => extracted.push(m))
          } else if (typeof msgs === 'string') {
            extracted.push(msgs)
          }
        })
      }

      if (extracted.length === 0) {
        if (data?.error?.message) extracted.push(data.error.message)
        else if (data?.message) extracted.push(data.message)
        else extracted.push('ডাক্তার অনবোর্ডিং আবেদন জমা দিতে সমস্যা হয়েছে। তথ্য যাচাই করুন।')
      }

      const sanitizeDoctorError = (msg) => {
        if (typeof msg !== 'string') return msg
        const lower = msg.toLowerCase()
        if (lower.includes('duplicate') || lower.includes('collision') || lower.includes('already exists')) {
          if (lower.includes('bmdc')) {
            return 'এই বিএমডিসি (BMDC) রেজিস্ট্রেশন নম্বরটি দিয়ে ইতোমধ্যে একজন চিকিৎসকের প্রোফাইল সিস্টেমে নিবন্ধিত রয়েছে।'
          }
          if (lower.includes('phone') || lower.includes('mobile')) {
            return 'এই মোবাইল নম্বরটি দিয়ে ইতোমধ্যে একজন চিকিৎসকের প্রোফাইল সিস্টেমে নিবন্ধিত রয়েছে।'
          }
          return 'প্রদত্ত তথ্য (BMDC বা মোবাইল নম্বর) দিয়ে ইতোমধ্যে একজন চিকিৎসকের প্রোফাইল সিস্টেমে নিবন্ধিত রয়েছে।'
        }
        return msg
      }

      const sanitized = extracted.map(sanitizeDoctorError)

      // Map top-level error (e.g. duplicate error) directly to fieldErrors so the exact field gets the red border and error message under it!
      const topError = sanitized[0] || ''
      if (topError.includes('মোবাইল') || topError.toLowerCase().includes('phone')) {
        backendErrors.phone = topError
      } else if (topError.includes('বিএমডিসি') || topError.toLowerCase().includes('bmdc')) {
        backendErrors.bmdc = topError
      } else if (topError.includes('ইমেইল') || topError.toLowerCase().includes('email')) {
        backendErrors.email = topError
      }

      setFieldErrors(backendErrors)
      setErrorList(sanitized)
      setErrorMessage(sanitized[0])
      // toast.error() omitted per security & clean UI requirement (no popup toast, inline alert only)

      // Auto jump to step where error exists
      if (backendErrors.name || backendErrors.phone || backendErrors.email) {
        setCurrentStep(1)
      } else if (backendErrors.bmdc || backendErrors.specialty_id || backendErrors.workplace || backendErrors.degree) {
        setCurrentStep(2)
      } else if (backendErrors.fee || backendErrors.bio || backendErrors.division_id || backendErrors.district_id || backendErrors.address) {
        setCurrentStep(3)
      } else if (backendErrors.document_keys) {
        setCurrentStep(4)
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSubmitting(false)
    }
  }

  const steps = [
    { num: 1, label: 'ব্যক্তিগত তথ্য', desc: 'নাম ও যোগাযোগ', icon: User },
    { num: 2, label: 'ডিগ্রি ও স্পেশালটি', desc: 'BMDC ও অভিজ্ঞতা', icon: Award },
    { num: 3, label: 'চেম্বার লোকেশন ও ফি', desc: 'এলাকা ও ভিজিট ফি', icon: MapPin },
    { num: 4, label: 'সনদপত্র ও ফাইল', desc: 'BMDC ও NID সনদ', icon: FileCheck },
    { num: 5, label: 'রিভিউ ও সাবমিট', desc: 'চূড়ান্ত যাচাই', icon: CheckCircle2 },
  ]

  const selectedSpecialtyName = formData.custom_specialty_name
    ? formData.custom_specialty_name
    : (specialties.find(s => String(s.id) === String(formData.specialty_id))?.name || 'General Practitioner')

  const selectedDivision = divisions.find(d => String(d.id) === String(formData.division_id))
  const selectedDistrict = districts.find(d => String(d.id) === String(formData.district_id))
  const selectedUpazila = upazilas.find(u => String(u.id) === String(formData.upazila_id))
  const selectedUnion = unions.find(un => String(un.id) === String(formData.union_id))

  const formatLocationPart = (item) => {
    if (!item) return ''
    const bn = item.bangla_name || item.name_bn
    return bn ? `${item.name} (${bn})` : item.name
  }

  const locationBreadcrumb = [
    formatLocationPart(selectedDivision),
    formatLocationPart(selectedDistrict),
    formatLocationPart(selectedUpazila),
    formatLocationPart(selectedUnion),
  ].filter(Boolean)

  if (isAgentSuspended) {
    return (
      <div style={{ minHeight: '100%', background: '#F8FAFC' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 20px 48px' }}>
          {/* Breadcrumb HUD */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748B', marginBottom: 16 }}>
            <Link to="/agent" style={{ color: 'inherit', textDecoration: 'none' }}>Partner Desk</Link>
            <ChevronRight size={13} />
            <span>Onboarding</span>
            <ChevronRight size={13} />
            <span style={{ color: '#EF4444', fontWeight: 700 }}>Access Restricted</span>
          </div>

          {/* Suspended Notice Card */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            border: '1.5px solid #FECDD3',
            padding: '48px 32px',
            boxShadow: '0 10px 30px -5px rgba(239, 68, 68, 0.08)',
            textAlign: 'center',
            maxWidth: 680,
            margin: '20px auto 0'
          }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FEE2E2 0%, #FECDD3 100%)',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 0 8px rgba(239, 68, 68, 0.08)'
            }}>
              <ShieldAlert size={36} />
            </div>

            <span style={{
              fontSize: 12,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#DC2626',
              background: '#FEF2F2',
              padding: '4px 12px',
              borderRadius: 20,
              border: '1px solid #FECDD3'
            }}>
              Agent Account Suspended
            </span>

            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: '14px 0 8px', letterSpacing: '-0.02em' }}>
              আপনার ফিল্ড এজেন্ট অ্যাকাউন্টটি স্থগিত রয়েছে
            </h2>

            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, maxWidth: 520, margin: '0 auto 24px' }}>
              প্রশাসনিক নির্দেশনার কারণে এজেন্ট কোড <strong>({user?.agent?.agent_code || 'AGT-PARTNER'})</strong> সাময়িকভাবে স্থগিত করা হয়েছে। স্থগিত থাকাকালীন নতুন কোনো চিকিৎসক অনবোর্ডিং ফর্ম পূরণ বা জমা দেওয়া যাবে না।
            </p>

            <div style={{
              background: '#F8FAFC',
              borderRadius: 14,
              border: '1px solid #E2E8F0',
              padding: '16px 20px',
              textAlign: 'left',
              marginBottom: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                কী করণীয় (Next Steps):
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#334155' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} />
                <span>আপনার পূর্ববর্তী সাবমিশন ও ওয়ালেট হিস্ট্রি দেখতে পারবেন (Read-Only Access)।</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#334155' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} />
                <span>অ্যাকাউন্ট পুনর্বহালের জন্য কেন্দ্রীয় অ্যাডমিন বা হেল্পডেস্কে যোগাযোগ করুন।</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Link
                to="/agent"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 22px',
                  borderRadius: 10,
                  background: '#0F172A',
                  color: '#FFFFFF',
                  fontSize: 13.5,
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)'
                }}
              >
                <span>ড্যাশবোর্ডে ফিরে যান</span>
              </Link>

              <Link
                to="/agent/tracker"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 22px',
                  borderRadius: 10,
                  background: '#FFFFFF',
                  border: '1.5px solid #CBD5E1',
                  color: '#334155',
                  fontSize: 13.5,
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                <span>পূর্ববর্তী সাবমিশন ট্র্যাকার</span>
              </Link>

              <Link
                to="/support"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 22px',
                  borderRadius: 10,
                  background: '#FEF2F2',
                  border: '1.5px solid #FECDD3',
                  color: '#DC2626',
                  fontSize: 13.5,
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                <PhoneCall size={15} />
                <span>হেল্পডেস্ক সহায়তা</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100%', background: '#F8FAFC' }}>
      <style>{`
        .doctor-wizard-container {
          max-width: 860px;
          margin: 0 auto;
          padding: 24px 20px 48px;
        }
        .doctor-wizard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 16px;
        }
        .doctor-wizard-title-wrap {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
          flex: 1;
        }
        .doctor-wizard-title-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #00B875 0%, #0284c7 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(0, 184, 117, 0.3);
          flex-shrink: 0;
        }
        .doctor-wizard-title-h1 {
          font-size: 22px;
          font-weight: 900;
          color: #0F172A;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .doctor-wizard-subtitle {
          font-size: 13px;
          color: #64748B;
          margin: 3px 0 0;
        }
        .doctor-wizard-badges {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .doctor-wizard-stepper-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 20px;
          padding: 20px 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          margin-bottom: 24px;
          position: relative;
        }
        .doctor-wizard-main-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          margin-bottom: 32px;
        }
        .doctor-wizard-nav-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #F1F5F9;
        }

        @media (max-width: 768px) {
          .doctor-wizard-container {
            padding: 14px 12px calc(80px + env(safe-area-inset-bottom, 0px)) !important;
          }
          .doctor-wizard-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
            margin-bottom: 16px !important;
          }
          .doctor-wizard-title-icon {
            width: 40px !important;
            height: 40px !important;
            border-radius: 10px !important;
          }
          .doctor-wizard-title-h1 {
            font-size: 17px !important;
            white-space: normal !important;
            line-height: 1.3 !important;
          }
          .doctor-wizard-subtitle {
            font-size: 12px !important;
          }
          .doctor-wizard-badges {
            width: 100% !important;
            justify-content: space-between !important;
          }
          .doctor-wizard-draft-badge {
            padding: 4px 8px !important;
            font-size: 11px !important;
          }
          .doctor-wizard-step-pill {
            padding: 4px 10px !important;
            font-size: 11.5px !important;
          }
          .doctor-wizard-stepper-card {
            padding: 14px 12px 12px !important;
            border-radius: 16px !important;
            margin-bottom: 16px !important;
          }
          .doctor-wizard-stepper-label {
            display: none !important;
          }
          .doctor-wizard-stepper-circle {
            width: 32px !important;
            height: 32px !important;
            font-size: 12px !important;
          }
          .doctor-wizard-stepper-item {
            padding: 0 2px !important;
          }
          .doctor-wizard-line-bg,
          .doctor-wizard-line-active {
            top: 16px !important;
            left: 18px !important;
            right: 18px !important;
          }
          .doctor-wizard-main-card {
            padding: 18px 14px !important;
            border-radius: 16px !important;
            margin-bottom: 20px !important;
          }
          .doctor-form-grid-2 {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .doctor-wizard-nav-controls {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            margin-top: 20px !important;
            padding-top: 16px !important;
            gap: 10px !important;
          }
          .doctor-wizard-btn-prev {
            flex: 0 0 auto !important;
            min-height: 46px !important;
            padding: 12px 18px !important;
            font-size: 13.5px !important;
            font-weight: 700 !important;
            white-space: nowrap !important;
            justify-content: center !important;
            border-radius: 12px !important;
            box-sizing: border-box !important;
          }
          .doctor-wizard-btn-next,
          .doctor-wizard-btn-submit {
            flex: 1 !important;
            min-width: 0 !important;
            min-height: 46px !important;
            padding: 12px 16px !important;
            font-size: 13.5px !important;
            font-weight: 800 !important;
            white-space: nowrap !important;
            justify-content: center !important;
            text-align: center !important;
            border-radius: 12px !important;
            box-sizing: border-box !important;
          }
          .doctor-review-card {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 14px;
            padding: 16px 18px;
            box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
          }
          .doctor-review-card-header {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            margin-bottom: 12px !important;
            padding-bottom: 8px !important;
            border-bottom: 1px solid #F1F5F9 !important;
            gap: 8px !important;
          }
          .doctor-review-edit-btn {
            background: #F0F9FF !important;
            border: 1px solid #BAE6FD !important;
            color: #0284C7 !important;
            font-size: 11.5px !important;
            font-weight: 700 !important;
            cursor: pointer !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            padding: 3px 9px !important;
            border-radius: 6px !important;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            transition: all 0.15s ease !important;
          }
          .doctor-review-grid {
            display: grid !important;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
            gap: 12px !important;
          }
          .doctor-review-cell {
            background: #F8FAFC;
            border-radius: 10px;
            padding: 8px 12px;
            border: 1px solid #F1F5F9;
          }
          .doctor-review-cell-full {
            grid-column: 1 / -1 !important;
          }
          .doctor-doc-card {
            padding: 14px 12px !important;
            border-radius: 14px !important;
          }
          .doctor-doc-guidance {
            padding: 10px 12px !important;
            border-radius: 12px !important;
          }
          .doctor-doc-title {
            font-size: 13px !important;
          }
          .doctor-doc-subtitle {
            font-size: 11px !important;
          }
          .doctor-doc-badge {
            font-size: 10px !important;
            padding: 2.5px 7px !important;
          }
          @media (max-width: 768px) {
            .doctor-review-card {
              padding: 12px 12px !important;
              border-radius: 13px !important;
              margin-bottom: 10px !important;
            }
            .doctor-review-grid {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 8px !important;
            }
            .doctor-review-cell {
              padding: 7px 9px !important;
              border-radius: 8px !important;
            }
            .doctor-review-title {
              font-size: 13px !important;
            }
            .doctor-review-label {
              font-size: 10px !important;
            }
            .doctor-review-val {
              font-size: 12px !important;
            }
          }
        }
      `}</style>
      <div className="doctor-wizard-container">
        {/* Breadcrumb HUD */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748B', marginBottom: 16 }}>
          <Link to="/agent" style={{ color: 'inherit', textDecoration: 'none' }}>Partner Desk</Link>
          <ChevronRight size={13} />
          <span>Onboarding</span>
          <ChevronRight size={13} />
          <span style={{ color: '#00B875', fontWeight: 700 }}>
            {isEditingRevision ? `Application Revision #${editCode}` : 'Doctor Onboarding'}
          </span>
        </div>

        {/* Page Header */}
        <div className="doctor-wizard-header">
          <div className="doctor-wizard-title-wrap">
            <div className="doctor-wizard-title-icon">
              <Stethoscope size={24} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 className="doctor-wizard-title-h1">
                {isEditingRevision ? 'ডাক্তার আবেদন সংশোধন ফর্ম' : 'নতুন ডাক্তার অনবোর্ডিং ফর্ম'}
              </h1>
              <p className="doctor-wizard-subtitle">
                {isEditingRevision 
                  ? `আবেদন #${editCode} • সংশোধিত তথ্য জমা দিন`
                  : <>ডাক্তারের তথ্য ও BMDC যাচাই সাপেক্ষে <strong>৳৫০০ কমিশন</strong>।</>}
              </p>
            </div>
          </div>

          <div className="doctor-wizard-badges">
            {!isEditingRevision && (
              <span className="doctor-wizard-draft-badge" style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: '#059669',
                background: '#ECFDF5',
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid #A7F3D0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                whiteSpace: 'nowrap'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                অটো-সেভ ড্রাফট সক্রিয়
              </span>
            )}
            <div className="doctor-wizard-step-pill" style={{
              background: isEditingRevision ? 'rgba(245, 158, 11, 0.12)' : 'rgba(0, 184, 117, 0.1)',
              border: isEditingRevision ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(0, 184, 117, 0.25)',
              borderRadius: 10,
              padding: '6px 14px',
              fontSize: 12.5,
              fontWeight: 800,
              color: isEditingRevision ? '#D97706' : '#00B875',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap'
            }}>
              <Sparkles size={14} />
              <span>ধাপ {toBengaliNumber(currentStep)} / ৫</span>
            </div>
          </div>
        </div>

        {/* ── Auto-Save Draft Restored Banner ── */}
        {draftRestored && !isEditingRevision && (
          <div style={{
            marginBottom: 20,
            padding: '12px 18px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
            border: '1.5px solid #A7F3D0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#10B981',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>
                  পূর্বের ড্রাফট থেকে তথ্য ও ধাপ স্বয়ংক্রিয়ভাবে উদ্ধার করা হয়েছে
                </div>
                <div style={{ fontSize: 11.5, color: '#047857' }}>
                  আপনি যেখান থেকে ফর্ম পূরণ রেখে গিয়েছিলেন সেখান থেকেই আবার সক্রিয় রয়েছে।
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDiscardDraft}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                background: '#FFFFFF',
                border: '1.5px solid #FCA5A5',
                color: '#DC2626',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease'
              }}
              title="ড্রাফট মুছে নতুন ফাঁকা ফর্ম শুরু করুন"
            >
              <RotateCcw size={13} />
              <span>নতুন ফর্ম শুরু করুন (Reset)</span>
            </button>
          </div>
        )}

        {/* ── Admin Revision Instructions Banner ── */}
        {isEditingRevision && revisionOriginalRequest && (
          <div style={{
            marginBottom: 24,
            padding: '16px 20px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.12) 100%)',
            border: '1.5px solid rgba(245, 158, 11, 0.35)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.08)'
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: '#F59E0B',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <AlertCircle size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: '#92400E' }}>
                  অ্যাডমিন সংশোধন নির্দেশনা (Admin Revision Required)
                </h4>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#D97706',
                  background: '#FEF3C7',
                  padding: '2px 8px',
                  borderRadius: 6,
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  {revisionOriginalRequest.request_code}
                </span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#B45309', lineHeight: 1.5 }}>
                <strong>এডমিনের কমেন্ট:</strong> {revisionOriginalRequest.admin_notes || 'অনুগ্রহ করে ভুল বা অসম্পূর্ণ তথ্য ও নথিপত্র সংশোধন করে পুনরায় জমা দিন।'}
              </p>
            </div>
          </div>
        )}

        {/* ── Stepper Progress Bar ── */}
        <div className="doctor-wizard-stepper-card">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative'
          }}>
            {/* Background line connecting steps */}
            <div className="doctor-wizard-line-bg" style={{
              position: 'absolute',
              top: 20,
              left: 30,
              right: 30,
              height: 2,
              background: '#E2E8F0',
              zIndex: 0
            }} />

            {/* Active connecting line */}
            <div className="doctor-wizard-line-active" style={{
              position: 'absolute',
              top: 20,
              left: 30,
              width: `${((currentStep - 1) / (steps.length - 1)) * 92}%`,
              height: 2,
              background: 'linear-gradient(90deg, #00B875, #0284c7)',
              transition: 'width 0.3s ease',
              zIndex: 0
            }} />

            {steps.map((s) => {
              const Icon = s.icon
              const isCompleted = currentStep > s.num
              const isCurrent = currentStep === s.num

              return (
                <div 
                  key={s.num} 
                  className="doctor-wizard-stepper-item"
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: '#FFFFFF',
                    padding: '0 8px',
                    cursor: s.num < currentStep ? 'pointer' : 'default'
                  }}
                  onClick={() => {
                    if (s.num < currentStep) setCurrentStep(s.num)
                  }}
                >
                  <div
                    className="doctor-wizard-stepper-circle"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 800,
                      transition: 'all 0.2s ease',
                      background: isCompleted 
                        ? '#00B875' 
                        : isCurrent 
                        ? 'rgba(0, 184, 117, 0.12)' 
                        : '#F1F5F9',
                      color: isCompleted 
                        ? '#FFFFFF' 
                        : isCurrent 
                        ? '#00B875' 
                        : '#94A3B8',
                      border: isCurrent ? '2px solid #00B875' : isCompleted ? 'none' : '1px solid #CBD5E1',
                      boxShadow: isCurrent ? '0 0 0 4px rgba(0, 184, 117, 0.15)' : 'none'
                    }}
                  >
                    {isCompleted ? <Check size={18} strokeWidth={3} /> : <Icon size={16} />}
                  </div>

                  <span className="doctor-wizard-stepper-label" style={{
                    fontSize: 12,
                    fontWeight: isCurrent ? 800 : 600,
                    color: isCurrent ? '#00B875' : isCompleted ? '#0F172A' : '#64748B',
                    marginTop: 6
                  }}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Mobile Active Step Info Bar */}
          <div className="d-block d-sm-none" style={{
            textAlign: 'center',
            marginTop: 10,
            paddingTop: 8,
            borderTop: '1px dashed #E2E8F0'
          }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#00B875' }}>
              ধাপ {toBengaliNumber(currentStep)} / ৫: {steps[currentStep - 1]?.label}
            </span>
            <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginTop: 1 }}>
              {steps[currentStep - 1]?.desc}
            </span>
          </div>
        </div>

        {/* ── Main Form Card ── */}
        <div className="doctor-wizard-main-card">
          {/* STEP 1: Personal Details */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  ধাপ ১: ডাক্তারের প্রাথমিক পরিচিতি ও যোগাযোগ
                </h2>
                <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
                  ডাক্তারের অফিশিয়াল নাম এবং যোগাযোগের মোবাইল ও ইমেইল নম্বর প্রদান করুন।
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ডাক্তারের পুরো নাম (English) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="যেমন: Dr. Md. Rafiqul Islam"
                  style={{
                    width: '100%',
                    height: 44,
                    padding: '0 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${getFieldError('name') ? '#EF4444' : '#CBD5E1'}`,
                    fontSize: 14,
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00B875'}
                  onBlur={(e) => e.target.style.borderColor = getFieldError('name') ? '#EF4444' : '#CBD5E1'}
                />
                {getFieldError('name') && (
                  <span style={{ fontSize: 11.5, color: '#EF4444', marginTop: 4, display: 'block', fontWeight: 600 }}>
                    {getFieldError('name')}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ডাক্তারের নাম (বাংলায় - ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  name="name_bn"
                  value={formData.name_bn}
                  onChange={handleChange}
                  placeholder="যেমন: ডাঃ মোঃ রফিকুল ইসলাম"
                  style={{
                    width: '100%',
                    height: 44,
                    padding: '0 14px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 14,
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00B875'}
                  onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                />
              </div>

              <div className="doctor-form-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    মোবাইল ফোন নম্বর <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="017XXXXXXXX"
                    style={{
                      width: '100%',
                      height: 44,
                      padding: '0 14px',
                      borderRadius: 10,
                      border: `1.5px solid ${getFieldError('phone') ? '#EF4444' : '#CBD5E1'}`,
                      fontSize: 14,
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00B875'}
                    onBlur={(e) => e.target.style.borderColor = getFieldError('phone') ? '#EF4444' : '#CBD5E1'}
                  />
                  {getFieldError('phone') ? (
                    <span style={{ fontSize: 11.5, color: '#EF4444', marginTop: 4, display: 'block', fontWeight: 600 }}>
                      {getFieldError('phone')}
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'block' }}>
                      এসএমএস নোটিফিকেশন ও যোগাযোগের জন্য সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    ইমেইল অ্যাড্রেস (ঐচ্ছিক)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="doctor@example.com"
                    style={{
                      width: '100%',
                      height: 44,
                      padding: '0 14px',
                      borderRadius: 10,
                      border: `1.5px solid ${getFieldError('email') ? '#EF4444' : '#CBD5E1'}`,
                      fontSize: 14,
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00B875'}
                    onBlur={(e) => e.target.style.borderColor = getFieldError('email') ? '#EF4444' : '#CBD5E1'}
                  />
                  {getFieldError('email') && (
                    <span style={{ fontSize: 11.5, color: '#EF4444', marginTop: 4, display: 'block', fontWeight: 600 }}>
                      {getFieldError('email')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Credentials & Specialization */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  ধাপ ২: শিক্ষাগত যোগ্যতা, স্পেশালটি ও বিএমডিসি সনদ
                </h2>
                <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
                  বিএমডিসি লাইসেন্স নম্বর ও ডিগ্রি তথ্য কেন্দ্রীয় রেজিস্ট্রি থেকে ভেরিফাই করা হবে।
                </p>
              </div>

              <div className="doctor-form-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    বিএমডিসি (BMDC) রেজিস্ট্রেশন নম্বর <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="bmdc"
                    required
                    autoComplete="off"
                    value={formData.bmdc}
                    onChange={handleChange}
                    placeholder="যেমন: A-18293"
                    style={{
                      width: '100%',
                      height: 44,
                      padding: '0 14px',
                      borderRadius: 10,
                      border: `1.5px solid ${getFieldError('bmdc') ? '#EF4444' : '#CBD5E1'}`,
                      fontSize: 14,
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00B875'}
                    onBlur={(e) => e.target.style.borderColor = getFieldError('bmdc') ? '#EF4444' : '#CBD5E1'}
                  />
                  {getFieldError('bmdc') ? (
                    <span style={{ fontSize: 11.5, color: '#EF4444', marginTop: 4, display: 'block', fontWeight: 600 }}>
                      {getFieldError('bmdc')}
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: '#0284C7', marginTop: 4, display: 'block' }}>
                      অ্যাকাউন্ট অ্যাক্টিভেশনের পূর্বে বিএমডিসি রেজিস্ট্রি থেকে যাচাই করা হবে।
                    </span>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                      মেডিকেল স্পেশালটি (বিশেষজ্ঞতা) <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    {formData.custom_specialty_name && (
                      <span style={{
                        fontSize: 10.5,
                        background: '#FEF3C7',
                        color: '#92400E',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontWeight: 700,
                        border: '1px solid #FDE68A'
                      }}>
                        নতুন রিকোয়েস্ট
                      </span>
                    )}
                  </div>

                  <div ref={specialtyDropdownRef} style={{ position: 'relative' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: 14, color: '#64748B', pointerEvents: 'none' }}>
                        <Stethoscope size={16} />
                      </span>
                      <input
                        type="text"
                        placeholder="স্পেশালটি খুঁজুন বা নতুন নাম লিখুন..."
                        value={specialtySearch}
                        onChange={(e) => {
                          const val = e.target.value
                          setSpecialtySearch(val)
                          setSpecialtyDropdownOpen(true)
                          if (formData.specialty_id || formData.custom_specialty_name) {
                            setFormData(prev => ({ ...prev, specialty_id: '', custom_specialty_name: '' }))
                          }
                        }}
                        onFocus={() => setSpecialtyDropdownOpen(true)}
                        style={{
                          width: '100%',
                          height: 44,
                          padding: '0 38px 0 38px',
                          borderRadius: 10,
                          border: `1.5px solid ${getFieldError('specialty_id') ? '#EF4444' : (specialtyDropdownOpen ? '#00B875' : '#CBD5E1')}`,
                          fontSize: 13.5,
                          outline: 'none',
                          background: '#FFFFFF',
                          transition: 'border-color 0.15s ease'
                        }}
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
                          maxHeight: 240,
                          overflowY: 'auto',
                          zIndex: 1050,
                          padding: '6px 0'
                        }}
                      >
                        {/* Option 1: Creatable Button when user types something not in list */}
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
                            const isSelected = String(formData.specialty_id) === String(s.id)
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
                                <span>{s.name} {s.bangla_name ? `(${s.bangla_name})` : ''}</span>
                                {isSelected && <Check size={16} color="#00B875" />}
                              </div>
                            )
                          })
                        ) : !specialtySearch.trim() ? (
                          <div style={{ padding: '12px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                            কোনো স্পেশালটি পাওয়া যায়নি
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Informational Guidance Tag for Custom Specialty */}
                  {formData.custom_specialty_name && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        fontSize: 12,
                        color: '#166534',
                        lineHeight: 1.4
                      }}
                    >
                      <Info size={15} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <span>আপনার দেওয়া <strong>"{formData.custom_specialty_name}"</strong> নতুন স্পেশালটি হিসেবে ডাক্তারের আবেদনে যুক্ত হবে এবং অ্যাডমিন অনুমোদনের পর চূড়ান্ত তালিকায় অন্তর্ভুক্ত হবে।</span>
                      </div>
                    </div>
                  )}

                  {getFieldError('specialty_id') && (
                    <span style={{ fontSize: 11.5, color: '#EF4444', marginTop: 4, display: 'block', fontWeight: 600 }}>
                      {getFieldError('specialty_id')}
                    </span>
                  )}
                </div>
              </div>

              <div className="doctor-form-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    মূল মেডিকেল ডিগ্রি <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="degree"
                    list="wizard-doctor-degrees"
                    required
                    autoComplete="off"
                    value={formData.degree}
                    onChange={handleChange}
                    placeholder="যেমন: MBBS, FCPS (Medicine), MD"
                    style={{
                      width: '100%',
                      height: 44,
                      padding: '0 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 14,
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00B875'}
                    onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                  />
                  <datalist id="wizard-doctor-degrees">
                    {masterDegrees.map((d) => (
                      <option key={d.id} value={d.title}>
                        {d.title_bn ? `${d.title} (${d.title_bn})` : d.title}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    ক্লিনিক্যাল অভিজ্ঞতার বছর (ঐচ্ছিক)
                  </label>
                  <input
                    type="number"
                    name="experience_years"
                    min="0"
                    max="60"
                    autoComplete="off"
                    value={formData.experience_years}
                    onChange={handleChange}
                    placeholder="যেমন: 10"
                    style={{
                      width: '100%',
                      height: 44,
                      padding: '0 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 14,
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00B875'}
                    onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                  />
                </div>
              </div>

              <div ref={workplaceDropdownRef} style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  বর্তমান কর্মস্থল / প্রাইমারি হাসপাতাল <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="workplace"
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    value={formData.workplace}
                    onChange={(e) => {
                      handleChange(e)
                      setWorkplaceDropdownOpen(true)
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#00B875'
                      setWorkplaceDropdownOpen(true)
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = getFieldError('workplace') ? '#EF4444' : '#CBD5E1'
                    }}
                    placeholder="যেমন: ঢাকা মেডিকেল কলেজ হাসপাতাল বা নিজস্ব চেম্বার"
                    style={{
                      width: '100%',
                      height: 44,
                      padding: '0 14px',
                      borderRadius: 10,
                      border: `1.5px solid ${getFieldError('workplace') ? '#EF4444' : '#CBD5E1'}`,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                  {/* Positioned Dropdown for Workplace Suggestions */}
                  {workplaceDropdownOpen && filteredHospitals.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: '#FFFFFF',
                        border: '1.5px solid #E2E8F0',
                        borderRadius: 12,
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                        maxHeight: 200,
                        overflowY: 'auto',
                        zIndex: 60,
                      }}
                    >
                      <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                        নিবন্ধিত হাসপাতাল তালিকা থেকে বেছে নিন
                      </div>
                      {filteredHospitals.map((hosp) => (
                        <div
                          key={hosp.id || hosp.slug || hosp.name}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            setFormData(prev => ({ ...prev, workplace: hosp.name }))
                            setWorkplaceDropdownOpen(false)
                            if (fieldErrors.workplace) {
                              setFieldErrors(prev => {
                                const next = { ...prev }
                                delete next.workplace
                                return next
                              })
                            }
                          }}
                          style={{
                            padding: '9px 14px',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#1E293B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid #F8FAFC',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#F0FDF4'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Building2 size={14} color="#00B875" style={{ flexShrink: 0 }} />
                            <span>{hosp.name} {hosp.name_bn ? `(${hosp.name_bn})` : ''}</span>
                          </div>
                          <span style={{ fontSize: 11, color: '#00B875', fontWeight: 600, whiteSpace: 'nowrap' }}>সিলেক্ট করুন</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {getFieldError('workplace') && (
                  <span style={{ fontSize: 11.5, color: '#EF4444', marginTop: 4, display: 'block', fontWeight: 600 }}>
                    {getFieldError('workplace')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Chamber Location, GPS & Visiting Fee */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  ধাপ ৩: চেম্বার/প্র্যাকটিস লোকেশন ও ভিজিটিং ফি
                </h2>
                <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
                  ডাক্তারের চেম্বার বা হাসপাতালের ভৌগোলিক অবস্থান, জিপিএস কো-অর্ডিনেট এবং রোগী দেখার ভিজিট ফি নির্ধারণ করুন।
                </p>
              </div>

              {/* Administrative Cascading Selects */}
              <div className="doctor-form-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                {/* Division */}
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    বিভাগ (Division) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    name="division_id"
                    value={formData.division_id}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      height: 44,
                      padding: '0 14px',
                      borderRadius: 10,
                      border: `1.5px solid ${getFieldError('division_id') ? '#EF4444' : '#CBD5E1'}`,
                      fontSize: 14,
                      outline: 'none',
                      background: '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">-- বিভাগ নির্বাচন করুন --</option>
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} {d.bangla_name ? `(${d.bangla_name})` : ''}</option>
                    ))}
                  </select>
                  {getFieldError('division_id') && (
                    <span style={{ fontSize: 11.5, color: '#EF4444', marginTop: 4, display: 'block', fontWeight: 600 }}>
                      {getFieldError('division_id')}
                    </span>
                  )}
                </div>

                {/* District */}
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    জেলা (District) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    name="district_id"
                    value={formData.district_id}
                    onChange={handleChange}
                    disabled={!formData.division_id || loadingDistricts}
                    style={{
                      width: '100%',
                      height: 44,
                      padding: '0 14px',
                      borderRadius: 10,
                      border: `1.5px solid ${getFieldError('district_id') ? '#EF4444' : '#CBD5E1'}`,
                      fontSize: 14,
                      outline: 'none',
                      background: (!formData.division_id || loadingDistricts) ? '#F8FAFC' : '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">
                      {loadingDistricts ? 'জেলা লোড হচ্ছে...' : '-- জেলা নির্বাচন করুন --'}
                    </option>
                    {districts.map((dst) => (
                      <option key={dst.id} value={dst.id}>{dst.name} {dst.bangla_name ? `(${dst.bangla_name})` : ''}</option>
                    ))}
                  </select>
                  {getFieldError('district_id') && (
                    <span style={{ fontSize: 11.5, color: '#EF4444', marginTop: 4, display: 'block', fontWeight: 600 }}>
                      {getFieldError('district_id')}
                    </span>
                  )}
                </div>

                {/* Upazila */}
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    উপজেলা / থানা (ঐচ্ছিক)
                  </label>
                  <select
                    name="upazila_id"
                    value={formData.upazila_id}
                    onChange={handleChange}
                    disabled={!formData.district_id || loadingUpazilas}
                    style={{
                      width: '100%',
                      height: 44,
                      padding: '0 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 14,
                      outline: 'none',
                      background: (!formData.district_id || loadingUpazilas) ? '#F8FAFC' : '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">
                      {loadingUpazilas ? 'উপজেলা লোড হচ্ছে...' : '-- উপজেলা নির্বাচন করুন --'}
                    </option>
                    {upazilas.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} {u.bangla_name ? `(${u.bangla_name})` : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Union */}
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    ইউনিয়ন / এলাকা (ঐচ্ছিক)
                  </label>
                  <select
                    name="union_id"
                    value={formData.union_id}
                    onChange={handleChange}
                    disabled={!formData.upazila_id || loadingUnions}
                    style={{
                      width: '100%',
                      height: 44,
                      padding: '0 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 14,
                      outline: 'none',
                      background: (!formData.upazila_id || loadingUnions) ? '#F8FAFC' : '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">
                      {loadingUnions ? 'ইউনিয়ন লোড হচ্ছে...' : '-- ইউনিয়ন নির্বাচন করুন --'}
                    </option>
                    {unions.map((un) => (
                      <option key={un.id} value={un.id}>{un.name} {un.bangla_name ? `(${un.bangla_name})` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Detailed Chamber Address */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  চেম্বার বা হাসপাতালের বিস্তারিত ঠিকানা <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  rows={2}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="যেমন: রুম #২০৪, গ্রিন ভিউ হাসপাতাল, বাড়ি #১২, রোড #৪, ধানমন্ডি, ঢাকা"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${getFieldError('address') ? '#EF4444' : '#CBD5E1'}`,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00B875'}
                  onBlur={(e) => e.target.style.borderColor = getFieldError('address') ? '#EF4444' : '#CBD5E1'}
                />
                {getFieldError('address') && (
                  <span style={{ fontSize: 11.5, color: '#EF4444', marginTop: 4, display: 'block', fontWeight: 600 }}>
                    {getFieldError('address')}
                  </span>
                )}
              </div>

              {/* GPS Geolocation Auto-Detection Card */}
              <div style={{
                background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
                border: '1.5px solid #A7F3D0',
                borderRadius: 16,
                padding: '18px 20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: '#065F46', display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Navigation size={16} color="#059669" />
                      জিপিএস লোকেশন সনাক্তকরণ (GPS Geolocation)
                    </h4>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#047857' }}>
                      চেম্বার বা হাসপাতালে উপস্থিত থাকলে নিচের বাটনে ক্লিক করে এক চাপেই ডিভাইসের জিপিএস অবস্থান যুক্ত করুন।
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDetectGpsLocation}
                    disabled={locatingGps}
                    style={{
                      background: '#059669',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 10,
                      padding: '9px 16px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: locatingGps ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {locatingGps ? (
                      <>
                        <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>লোকেশন সনাক্ত হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Navigation size={15} />
                        <span>অটো জিপিএস সনাক্ত করুন</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="doctor-form-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#065F46', marginBottom: 4, textTransform: 'uppercase' }}>
                      অক্ষাংশ (Latitude)
                    </label>
                    <input
                      type="text"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      placeholder="e.g. 23.8103320"
                      style={{
                        width: '100%',
                        height: 40,
                        padding: '0 12px',
                        borderRadius: 8,
                        border: '1.5px solid #A7F3D0',
                        fontSize: 13,
                        outline: 'none',
                        background: '#FFFFFF',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#065F46', marginBottom: 4, textTransform: 'uppercase' }}>
                      দ্রাঘিমাংশ (Longitude)
                    </label>
                    <input
                      type="text"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      placeholder="e.g. 90.4125181"
                      style={{
                        width: '100%',
                        height: 40,
                        padding: '0 12px',
                        borderRadius: 8,
                        border: '1.5px solid #A7F3D0',
                        fontSize: 13,
                        outline: 'none',
                        background: '#FFFFFF',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {formData.latitude && formData.longitude && (
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#047857', fontWeight: 600 }}>
                    <CheckCircle2 size={14} color="#059669" />
                    <span>জিপিএস কো-অর্ডিনেট সেট করা হয়েছে ({formData.latitude}, {formData.longitude})</span>
                  </div>
                )}
              </div>

              {/* Consultation Fee & Bio */}
              <div className="doctor-form-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    রোগী দেখার ভিজিটিং ফি (টাকা) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: 12, fontSize: 15, fontWeight: 800, color: '#00B875' }}>৳</span>
                    <input
                      type="number"
                      name="fee"
                      min="0"
                      required
                      value={formData.fee}
                      onChange={handleChange}
                      placeholder="1000"
                      style={{
                        width: '100%',
                        height: 44,
                        padding: '0 14px 0 34px',
                        borderRadius: 10,
                        border: `1.5px solid ${getFieldError('fee') ? '#EF4444' : '#CBD5E1'}`,
                        fontSize: 15,
                        fontWeight: 800,
                        color: '#0F172A',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#00B875'}
                      onBlur={(e) => e.target.style.borderColor = getFieldError('fee') ? '#EF4444' : '#CBD5E1'}
                    />
                  </div>
                  {getFieldError('fee') && (
                    <span style={{ fontSize: 11.5, color: '#EF4444', marginTop: 4, display: 'block', fontWeight: 600 }}>
                      {getFieldError('fee')}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    ডাক্তারের প্রফেশনাল বায়ো / জীবনবৃত্তান্ত (ঐচ্ছিক)
                  </label>
                  <textarea
                    name="bio"
                    rows={2}
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="ডাক্তারের বিশেষ ক্ষেত্র বা অর্জন সম্পর্কে সংক্ষেপে লিখুন..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 13.5,
                      outline: 'none',
                      lineHeight: 1.4,
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00B875'}
                    onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Documents Upload */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>ধাপ ৪: ভেরিফিকেশন ডকুমেন্ট আপলোড</span>
                  <span className="d-none d-sm-inline-block" style={{ fontSize: 12, background: 'rgba(0, 184, 117, 0.1)', color: '#00B875', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                    ধাপ ৪ / ৫
                  </span>
                </h2>
                <p style={{ fontSize: 12.5, color: '#64748B', margin: '4px 0 0', lineHeight: 1.5 }}>
                  ডাক্তার অ্যাকাউন্ট অ্যাক্টিভেশন ও দ্রুত অনুমোদনের জন্য প্রয়োজনীয় ডকুমেন্টের স্পষ্ট স্ক্যান বা ছবি আপলোড করুন।
                </p>
              </div>

              {/* Guidance Info Banner (Sleek, Compact, Mobile-friendly) */}
              <div className="doctor-doc-guidance" style={{
                background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
                border: '1px solid #A7F3D0',
                borderRadius: 14,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: '#10B981',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <ShieldCheck size={18} />
                </div>
                <div style={{ fontSize: 12, color: '#065F46', lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 800, color: '#064E3B', marginBottom: 2 }}>
                    ডকুমেন্ট আপলোড নির্দেশিকা:
                  </div>
                  <div>• BMDC সনদ (রেজিস্ট্রেশন নম্বর স্পষ্ট) ও NID কার্ড আপলোড করুন • PDF / ছবি (সর্বোচ্চ ১০ MB)</div>
                </div>
              </div>

              {/* Upload Dropzone Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Document 1: BMDC Certificate (Mandatory) */}
                <div className="doctor-doc-card" style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 16,
                  padding: '18px 20px',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'rgba(0, 184, 117, 0.1)',
                        color: '#00B875',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Award size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="doctor-doc-title" style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
                          BMDC রেজিস্ট্রেশন সনদ / লাইসেন্স কপি
                        </div>
                        <div className="doctor-doc-subtitle" style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                          অফিসিয়াল BMDC রেজিস্ট্রেশন সার্টিফিকেটের স্পষ্ট কপি
                        </div>
                      </div>
                    </div>
                    <span className="doctor-doc-badge" style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      background: '#FEE2E2',
                      color: '#DC2626',
                      padding: '3px 8px',
                      borderRadius: 6,
                      border: '1px solid #FECACA',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      বাধ্যতামূলক *
                    </span>
                  </div>

                  <PresignedDropzone
                    category="doctor_bmdc_cert"
                    label="BMDC রেজিস্ট্রেশন সনদ"
                    existingKey={formData.documents?.doctor_bmdc_cert?.file_key}
                    existingFileName={formData.documents?.doctor_bmdc_cert?.file_name}
                    existingFileSize={formData.documents?.doctor_bmdc_cert?.file_size}
                    onUploadSuccess={(fileKey, fileName, sizeStr) => handleDocumentUploaded('doctor_bmdc_cert', fileKey, fileName, sizeStr)}
                    onRemove={() => handleDocumentRemoved('doctor_bmdc_cert')}
                    required={true}
                  />
                </div>

                {/* Document 2: Doctor NID Card (Mandatory) */}
                <div className="doctor-doc-card" style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 16,
                  padding: '18px 20px',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <User size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="doctor-doc-title" style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
                          ডাক্তারের জাতীয় পরিচয়পত্র (NID)
                        </div>
                        <div className="doctor-doc-subtitle" style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                          জাতীয় পরিচয়পত্রের উভয় পাশের স্পষ্ট ছবি বা স্ক্যান কপি
                        </div>
                      </div>
                    </div>
                    <span className="doctor-doc-badge" style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      background: '#FEE2E2',
                      color: '#DC2626',
                      padding: '3px 8px',
                      borderRadius: 6,
                      border: '1px solid #FECACA',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      বাধ্যতামূলক *
                    </span>
                  </div>

                  <PresignedDropzone
                    category="doctor_nid"
                    label="ডাক্তারের জাতীয় পরিচয়পত্র (NID)"
                    existingKey={formData.documents?.doctor_nid?.file_key}
                    existingFileName={formData.documents?.doctor_nid?.file_name}
                    existingFileSize={formData.documents?.doctor_nid?.file_size}
                    onUploadSuccess={(fileKey, fileName, sizeStr) => handleDocumentUploaded('doctor_nid', fileKey, fileName, sizeStr)}
                    onRemove={() => handleDocumentRemoved('doctor_nid')}
                    required={true}
                  />
                </div>
              </div>

              {/* Status Banner */}
              <div style={{
                background: activeDocumentCount >= 2 ? '#F0FDF4' : '#FEF3C7',
                border: activeDocumentCount >= 2 ? '1px solid #86EFAC' : '1px solid #FDE68A',
                borderRadius: 12,
                padding: '10px 14px',
                fontSize: 12,
                fontWeight: 600,
                color: activeDocumentCount >= 2 ? '#065F46' : '#92400E',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <ShieldCheck size={20} style={{ flexShrink: 0 }} />
                <span>
                  {activeDocumentCount >= 2
                    ? `✓ উভয় ভেরিফিকেশন ডকুমেন্ট (BMDC ও NID) নিরাপদে সংরক্ষিত হয়েছে। আপনি পরবর্তী রিভিউ ধাপে যেতে পারেন।`
                    : 'পরবর্তী ধাপে যেতে অনুগ্রহ করে BMDC সনদ ও জাতীয় পরিচয়পত্র (NID) উভয়ই আপলোড করুন।'}
                </span>
              </div>

              {getFieldError('document_keys') && (
                <div style={{
                  padding: '10px 14px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 10,
                  fontSize: 12.5,
                  color: '#DC2626',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <AlertCircle size={16} />
                  <span>{getFieldError('document_keys')}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Review & Submit */}
          {currentStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    ধাপ ৫: চূড়ান্ত পর্যালোচনা ও সাবমিশন
                  </h2>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#00803D',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    padding: '3px 8px',
                    borderRadius: 14,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}>
                    <ShieldCheck size={13} />
                    <span>প্রস্তুত</span>
                  </span>
                </div>
                <p style={{ fontSize: 12.5, color: '#64748B', margin: '4px 0 0', lineHeight: 1.45 }}>
                  অ্যাডমিন অডিটের জন্য সাবমিট করার পূর্বে তথ্য ও প্রমাণপত্র যাচাই করুন।
                </p>
              </div>

              {/* ── CARD 1: Doctor Personal & Contact Profile ── */}
              <div className="doctor-review-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)' }}>
                <div className="doctor-review-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #F1F5F9', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#DCFCE7', color: '#00803D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={15} />
                    </div>
                    <span className="doctor-review-title" style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      ব্যক্তিগত ও যোগাযোগ তথ্য
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="doctor-review-edit-btn"
                    style={{
                      background: '#F0F9FF',
                      border: '1px solid #BAE6FD',
                      color: '#0284C7',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      borderRadius: 6,
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                    title="ধাপ ১ এডিট করুন"
                  >
                    <Edit3 size={12} />
                    <span>এডিট</span>
                  </button>
                </div>

                <div className="doctor-review-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                  <div className="doctor-review-cell" style={{ background: '#F8FAFC', borderRadius: 10, padding: '8px 10px', border: '1px solid #F1F5F9' }}>
                    <div className="doctor-review-label" style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>ডাক্তারের নাম</div>
                    <div className="doctor-review-val" style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                      {formData.name} {formData.name_bn && <span style={{ fontSize: 12, fontWeight: 500, color: '#64748B' }}>({formData.name_bn})</span>}
                    </div>
                  </div>

                  <div className="doctor-review-cell" style={{ background: '#F8FAFC', borderRadius: 10, padding: '8px 10px', border: '1px solid #F1F5F9' }}>
                    <div className="doctor-review-label" style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>মোবাইল নম্বর</div>
                    <div className="doctor-review-val" style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Phone size={12} style={{ color: '#00803D', flexShrink: 0 }} />
                      <span>{formData.phone}</span>
                    </div>
                  </div>

                  <div className="doctor-review-cell" style={{ background: '#F8FAFC', borderRadius: 10, padding: '8px 10px', border: '1px solid #F1F5F9' }}>
                    <div className="doctor-review-label" style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>ইমেইল ঠিকানা</div>
                    <div className="doctor-review-val" style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Mail size={12} style={{ color: '#0284C7', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formData.email || '—'}</span>
                    </div>
                  </div>

                  <div className="doctor-review-cell" style={{ background: '#F8FAFC', borderRadius: 10, padding: '8px 10px', border: '1px solid #F1F5F9' }}>
                    <div className="doctor-review-label" style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>মূল কর্মস্থল</div>
                    <div className="doctor-review-val" style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Building2 size={12} style={{ color: '#8B5CF6', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formData.workplace || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── CARD 2: Medical Credentials & Specialty ── */}
              <div className="doctor-review-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)' }}>
                <div className="doctor-review-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #F1F5F9', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Award size={15} />
                    </div>
                    <span className="doctor-review-title" style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      বিএমডিসি ও পেশাগত তথ্য
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="doctor-review-edit-btn"
                    style={{
                      background: '#F0F9FF',
                      border: '1px solid #BAE6FD',
                      color: '#0284C7',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      borderRadius: 6,
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                    title="ধাপ ২ এডিট করুন"
                  >
                    <Edit3 size={12} />
                    <span>এডিট</span>
                  </button>
                </div>

                <div className="doctor-review-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                  <div className="doctor-review-cell" style={{ background: '#F8FAFC', borderRadius: 10, padding: '8px 10px', border: '1px solid #F1F5F9' }}>
                    <div className="doctor-review-label" style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>BMDC নম্বর</div>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: 13,
                      fontWeight: 800,
                      color: '#065F46',
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      padding: '2px 8px',
                      borderRadius: 6,
                      display: 'inline-block'
                    }}>
                      {formData.bmdc}
                    </span>
                  </div>

                  <div className="doctor-review-cell" style={{ background: '#F8FAFC', borderRadius: 10, padding: '8px 10px', border: '1px solid #F1F5F9' }}>
                    <div className="doctor-review-label" style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>বিশেষজ্ঞতা</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      <span className="doctor-review-val" style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{selectedSpecialtyName}</span>
                      {formData.custom_specialty_name && (
                        <span style={{
                          fontSize: 9.5,
                          background: '#FEF3C7',
                          color: '#92400E',
                          padding: '1px 5px',
                          borderRadius: 4,
                          fontWeight: 700,
                          border: '1px solid #FDE68A'
                        }}>
                          নতুন
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="doctor-review-cell" style={{ background: '#F8FAFC', borderRadius: 10, padding: '8px 10px', border: '1px solid #F1F5F9' }}>
                    <div className="doctor-review-label" style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>মূল ডিগ্রি</div>
                    <div className="doctor-review-val" style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                      {formData.degree || 'MBBS'}
                    </div>
                  </div>

                  <div className="doctor-review-cell" style={{ background: '#F8FAFC', borderRadius: 10, padding: '8px 10px', border: '1px solid #F1F5F9' }}>
                    <div className="doctor-review-label" style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>অভিজ্ঞতা</div>
                    <div className="doctor-review-val" style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                      {formData.experience_years ? `${formData.experience_years} বছর` : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── CARD 3: Chamber Location, GPS & Visiting Fee ── */}
              <div className="doctor-review-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)' }}>
                <div className="doctor-review-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #F1F5F9', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MapPin size={15} />
                    </div>
                    <span className="doctor-review-title" style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      লোকেশন ও ভিজিটিং ফি
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="doctor-review-edit-btn"
                    style={{
                      background: '#F0F9FF',
                      border: '1px solid #BAE6FD',
                      color: '#0284C7',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      borderRadius: 6,
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                    title="ধাপ ৩ এডিট করুন"
                  >
                    <Edit3 size={12} />
                    <span>এডিট</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <div className="doctor-review-cell" style={{ background: '#F8FAFC', borderRadius: 10, padding: '8px 12px', border: '1px solid #F1F5F9', minWidth: 120 }}>
                    <div className="doctor-review-label" style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>ভিজিট ফি</div>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: '#00803D',
                      background: '#DCFCE7',
                      border: '1px solid #86EFAC',
                      padding: '2px 8px',
                      borderRadius: 6,
                      display: 'inline-block'
                    }}>
                      ৳{formData.fee}
                    </span>
                  </div>

                  <div className="doctor-review-cell" style={{ background: '#F8FAFC', borderRadius: 10, padding: '8px 12px', border: '1px solid #F1F5F9', flex: 1, minWidth: 220 }}>
                    <div className="doctor-review-label" style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>
                      এলাকা
                    </div>
                    <div className="doctor-review-val" style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', lineHeight: 1.5 }}>
                      {locationBreadcrumb.length > 0 ? locationBreadcrumb.join(', ') : '—'}
                    </div>
                  </div>

                  {formData.address && (
                    <div className="doctor-review-grid-full doctor-review-cell" style={{ background: '#F8FAFC', borderRadius: 10, padding: '8px 12px', border: '1px solid #F1F5F9', width: '100%', boxSizing: 'border-box' }}>
                      <div className="doctor-review-label" style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>চেম্বার ঠিকানা</div>
                      <div style={{ fontSize: 12.5, color: '#1E293B', fontWeight: 600 }}>
                        {formData.address}
                      </div>
                    </div>
                  )}

                  {formData.latitude && formData.longitude && (
                    <div className="doctor-review-grid-full doctor-review-cell" style={{ background: '#F8FAFC', borderRadius: 10, padding: '8px 12px', border: '1px solid #F1F5F9', width: '100%', boxSizing: 'border-box' }}>
                      <div style={{ fontSize: 11, color: '#047857', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Navigation size={12} color="#059669" />
                        <span>GPS: {formData.latitude}, {formData.longitude}</span>
                      </div>
                    </div>
                  )}

                  {formData.bio && (
                    <div className="doctor-review-grid-full doctor-review-cell" style={{ background: '#F8FAFC', borderRadius: 10, padding: '8px 12px', border: '1px solid #F1F5F9', width: '100%', boxSizing: 'border-box' }}>
                      <div className="doctor-review-label" style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>পরিচিতি (Bio)</div>
                      <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.45 }}>
                        {formData.bio}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── CARD 4: Attached Verification Documents ── */}
              <div className="doctor-review-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)' }}>
                <div className="doctor-review-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #F1F5F9', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F3E8FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileCheck size={15} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <span className="doctor-review-title" style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                        সংযুক্ত প্রমাণপত্র ({activeDocumentCount}টি)
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="doctor-review-edit-btn"
                    style={{
                      background: '#F0F9FF',
                      border: '1px solid #BAE6FD',
                      color: '#0284C7',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      borderRadius: 6,
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                    title="ধাপ ৪ এডিট করুন"
                  >
                    <Edit3 size={12} />
                    <span>এডিট</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {formData.documents?.doctor_bmdc_cert ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10,
                      gap: 8
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                        <FileText size={16} style={{ color: '#0284C7', flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            BMDC রেজিস্ট্রেশন সনদ
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {formData.documents.doctor_bmdc_cert.file_name} • {formData.documents.doctor_bmdc_cert.file_size}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#15803D',
                        background: '#DCFCE7',
                        padding: '2px 7px',
                        borderRadius: 6,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}>
                        <CheckCircle2 size={11} /> সংযুক্ত
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#EF4444', fontStyle: 'italic', padding: '4px 0' }}>
                      BMDC সনদপত্র আপলোড করা হয়নি
                    </div>
                  )}

                  {formData.documents?.doctor_nid ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10,
                      gap: 8
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                        <FileText size={16} style={{ color: '#0284C7', flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            জাতীয় পরিচয়পত্র (NID)
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {formData.documents.doctor_nid.file_name} • {formData.documents.doctor_nid.file_size}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#15803D',
                        background: '#DCFCE7',
                        padding: '2px 7px',
                        borderRadius: 6,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}>
                        <CheckCircle2 size={11} /> সংযুক্ত
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#EF4444', fontStyle: 'italic', padding: '4px 0' }}>
                      জাতীয় পরিচয়পত্র (NID) আপলোড করা হয়নি
                    </div>
                  )}
                </div>
              </div>

              {/* ── Executive Commission & Audit Assurance Card ── */}
              <div style={{
                background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
                border: '1.5px solid #A7F3D0',
                borderRadius: 14,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.08)'
              }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: '#00803D',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 3px 8px rgba(0, 128, 61, 0.25)'
                }}>
                  <Sparkles size={18} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#064E3B' }}>
                      ৳৫০০ পার্টনার কমিশন নিশ্চয়তা
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      background: '#00803D',
                      color: '#FFFFFF',
                      padding: '2px 7px',
                      borderRadius: 6,
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      গ্যারান্টিযুক্ত
                    </span>
                  </div>
                  <p style={{ fontSize: 11.5, color: '#065F46', margin: 0, lineHeight: 1.45 }}>
                    অ্যাডমিন ভেরিফিকেশন ডেস্ক থেকে BMDC সনদপত্র যাচাই হওয়ামাত্র আপনার ওয়ালেটে ক্রেডিট হবে।
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Wizard Navigation Controls ── */}
          <div className="doctor-wizard-nav-controls">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                disabled={submitting}
                className="doctor-wizard-btn-prev"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 20px',
                  borderRadius: 12,
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap'
                }}
              >
                <ArrowLeft size={16} />
                <span>পূর্ববর্তী</span>
              </button>
            ) : <div className="d-none d-sm-block" />}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="doctor-wizard-btn-next"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 24px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #00B875 0%, #009E64 100%)',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 184, 117, 0.3)',
                  transition: 'all 0.15s'
                }}
              >
                <span>পরবর্তী ধাপ</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="doctor-wizard-btn-submit"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 28px',
                  borderRadius: 12,
                  border: 'none',
                  background: isEditingRevision 
                    ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' 
                    : 'linear-gradient(135deg, #00B875 0%, #0284c7 100%)',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: isEditingRevision
                    ? '0 4px 14px rgba(245, 158, 11, 0.35)'
                    : '0 4px 14px rgba(0, 184, 117, 0.35)',
                  opacity: submitting ? 0.7 : 1,
                  transition: 'all 0.15s'
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>{isEditingRevision ? 'সংশোধন জমা দেওয়া হচ্ছে...' : 'আবেদন জমা দেওয়া হচ্ছে...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} strokeWidth={2.5} />
                    <span>{isEditingRevision ? 'সংশোধন নিশ্চিত করে পুনরায় সাবমিট করুন' : 'চূড়ান্ত আবেদন সাবমিট করুন'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

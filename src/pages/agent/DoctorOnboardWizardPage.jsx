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
  MapPin
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import agentApi from '../../api/agentApi'
import axiosInstance from '../../api/axiosInstance'
import PresignedDropzone from '../../features/agent/components/PresignedDropzone'
import { getMediaUrl } from '../../utils/mediaUtils'

export default function DoctorOnboardWizardPage() {
  const navigate = useNavigate()
  const { user, isAdmin, isSuperAdmin } = useAuth()
  const isAgentSuspended = !isAdmin && !isSuperAdmin && (user?.agent?.status === 'suspended' || user?.agent?.status === 'inactive')

  const [searchParams] = useSearchParams()
  const editCode = searchParams.get('edit_code')
  const [isEditingRevision, setIsEditingRevision] = useState(false)
  const [revisionOriginalRequest, setRevisionOriginalRequest] = useState(null)
  const [loadingEditData, setLoadingEditData] = useState(false)

  const [currentStep, setCurrentStep] = useState(1)
  const [specialties, setSpecialties] = useState([])
  const [specialtySearch, setSpecialtySearch] = useState('')
  const [specialtyDropdownOpen, setSpecialtyDropdownOpen] = useState(false)
  const specialtyDropdownRef = useRef(null)
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

  const [formData, setFormData] = useState({
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
  })

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
      if (!formData.bmdc.trim()) errs.bmdc = 'BMDC রেজিস্ট্রেশন নম্বর আবশ্যক (যেমন: A-18293)।'
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
      toast.error(err)
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
      toast.error(err)
      setCurrentStep(4)
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
        toast.success('Doctor onboarding application submitted successfully! Under review.')
        navigate('/agent/tracker')
      }
    } catch (err) {
      console.error('Submission failed:', err)
      const data = err?.response?.data
      const backendErrors = data?.errors || {}
      setFieldErrors(backendErrors)

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
        else extracted.push('Doctor onboarding submission failed. Please verify credentials.')
      }

      setErrorList(extracted)
      setErrorMessage(extracted[0])
      toast.error(extracted[0])

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
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 20px 48px' }}>
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #00B875 0%, #0284c7 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0, 184, 117, 0.3)'
            }}>
              <Stethoscope size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                {isEditingRevision ? 'ডাক্তার আবেদন সংশোধন ফর্ম' : 'নতুন ডাক্তার অনবোর্ডিং ফর্ম'}
              </h1>
              <p style={{ fontSize: 13, color: '#64748B', margin: '3px 0 0' }}>
                {isEditingRevision 
                  ? `আবেদন কোড: ${editCode} • এডমিনের মন্তব্য অনুযায়ী সংশোধন করে পুনরায় জমা দিন`
                  : <>ডাক্তারের তথ্য ও বিএমডিসি সনদ যাচাইয়ের জন্য জমা দিন। অনুমোদন সাপেক্ষে <strong>৳৫০০ কমিশন</strong> লাভ করুন।</>}
              </p>
            </div>
          </div>

          <div style={{
            background: isEditingRevision ? 'rgba(245, 158, 11, 0.12)' : 'rgba(0, 184, 117, 0.1)',
            border: isEditingRevision ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(0, 184, 117, 0.25)',
            borderRadius: 10,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 800,
            color: isEditingRevision ? '#D97706' : '#00B875',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}>
            <Sparkles size={14} />
            <span>ধাপ {currentStep} / ৫</span>
          </div>
        </div>

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
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 20,
          padding: '20px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          marginBottom: 24,
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative'
          }}>
            {/* Background line connecting steps */}
            <div style={{
              position: 'absolute',
              top: 20,
              left: 30,
              right: 30,
              height: 2,
              background: '#E2E8F0',
              zIndex: 0
            }} />

            {/* Active connecting line */}
            <div style={{
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

                  <span style={{
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
        </div>

        {/* ── Error Banner ── */}
        {errorList.length > 0 && (
          <div style={{
            marginBottom: 20,
            padding: '16px 18px',
            borderRadius: 14,
            background: '#FEF2F2',
            border: '1.5px solid #FECDD3',
            color: '#991B1B',
            fontSize: 13,
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, marginBottom: 6, color: '#DC2626' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>ভ্যালিডেশন এরর (Validation Errors Found):</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 22, lineHeight: 1.5 }}>
              {errorList.map((err, i) => (
                <li key={i}>{typeof err === 'string' ? err : JSON.stringify(err)}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Main Form Card ── */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 24,
          padding: '32px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          marginBottom: 32
        }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    বিএমডিসি (BMDC) রেজিস্ট্রেশন নম্বর <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="bmdc"
                    required
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    মূল মেডিকেল ডিগ্রি <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="degree"
                    required
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

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  বর্তমান কর্মস্থল / প্রাইমারি হাসপাতাল <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="workplace"
                  required
                  value={formData.workplace}
                  onChange={handleChange}
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
                  onFocus={(e) => e.target.style.borderColor = '#00B875'}
                  onBlur={(e) => e.target.style.borderColor = getFieldError('workplace') ? '#EF4444' : '#CBD5E1'}
                />
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
                <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>ধাপ ৪: ভেরিফিকেশন ডকুমেন্ট আপলোড</span>
                  <span style={{ fontSize: 12, background: 'rgba(0, 184, 117, 0.1)', color: '#00B875', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                    ধাপ ৪ / ৫
                  </span>
                </h2>
                <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
                  ডাক্তার অ্যাকাউন্ট অ্যাক্টিভেশন ও দ্রুত অনুমোদনের জন্য প্রয়োজনীয় ডকুমেন্টের স্পষ্ট স্ক্যান বা ছবি আপলোড করুন।
                </p>
              </div>

              {/* Guidance Info Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
                border: '1px solid #A7F3D0',
                borderRadius: 14,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12
              }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: '#10B981',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <ShieldCheck size={20} />
                </div>
                <div style={{ fontSize: 12.5, color: '#065F46', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 800, color: '#064E3B', marginBottom: 2 }}>
                    ডকুমেন্ট আপলোড নির্দেশিকা:
                  </div>
                  <div>• <strong>BMDC সনদপত্র:</strong> রেজিস্ট্রেশন নম্বর (যেমন: A-18293) স্পষ্ট দেখা যায় এমন কপি আপলোড করা বাধ্যতামূলক।</div>
                  <div>• <strong>জাতীয় পরিচয়পত্র (NID):</strong> দ্রুত ভেরিফিকেশন সম্পন্ন করতে ডাক্তারের NID কার্ড সংযুক্ত করা সুপারিশকৃত।</div>
                  <div>• <strong>অনুমোদিত ফরম্যাট:</strong> PDF, JPG, PNG বা WEBP (প্রতিটি ফাইল সর্বোচ্চ ১০ MB পর্যন্ত)।</div>
                </div>
              </div>

              {/* Upload Dropzone Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Document 1: BMDC Certificate (Mandatory) */}
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 16,
                  padding: '18px 20px',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'rgba(0, 184, 117, 0.1)',
                        color: '#00B875',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Award size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                          BMDC রেজিস্ট্রেশন সনদ / লাইসেন্স কপি
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B' }}>
                          অফিসিয়াল BMDC রেজিস্ট্রেশন সার্টিফিকেটের স্পষ্ট কপি
                        </div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      background: '#FEE2E2',
                      color: '#DC2626',
                      padding: '3px 8px',
                      borderRadius: 6,
                      border: '1px solid #FECACA'
                    }}>
                      আবশ্যক (Required) *
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

                {/* Document 2: Doctor NID Card (Recommended) */}
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 16,
                  padding: '18px 20px',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <User size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                          ডাক্তারের জাতীয় পরিচয়পত্র (NID)
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B' }}>
                          জাতীয় পরিচয়পত্রের উভয় পাশের স্পষ্ট ছবি বা স্ক্যান কপি
                        </div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: '#FEE2E2',
                      color: '#DC2626',
                      padding: '3px 8px',
                      borderRadius: 6,
                      border: '1px solid #FECACA'
                    }}>
                      আবশ্যক (Required)
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
                  />
                </div>
              </div>

              {/* Status Banner */}
              <div style={{
                background: activeDocumentCount >= 2 ? '#F0FDF4' : '#FEF3C7',
                border: activeDocumentCount >= 2 ? '1px solid #86EFAC' : '1px solid #FDE68A',
                borderRadius: 12,
                padding: '12px 16px',
                fontSize: 12.5,
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    ধাপ ৫: চূড়ান্ত পর্যালোচনা ও সাবমিশন
                  </h2>
                  <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
                    প্রশাসনিক অডিটের জন্য সাবমিট করার পূর্বে চিকিৎসকের সকল সংগৃহীত তথ্য ও প্রমাণপত্র যাচাই করুন।
                  </p>
                </div>
                <div style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#00803D',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  padding: '4px 10px',
                  borderRadius: 20,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <ShieldCheck size={14} />
                  <span>যাচাইয়ের জন্য প্রস্তুত</span>
                </div>
              </div>

              {/* ── CARD 1: Doctor Personal & Contact Profile ── */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '18px 20px',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#DCFCE7', color: '#00803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={16} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>চিকিৎসক ক্যান্ডিডেট ও ব্যক্তিগত তথ্য</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284C7',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      borderRadius: 6
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F0F9FF'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                  >
                    <Edit3 size={13} />
                    <span>পরিবর্তন করুন</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>ডাক্তারের পুরো নাম</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                      {formData.name} {formData.name_bn && <span style={{ fontSize: 12.5, fontWeight: 500, color: '#64748B' }}>({formData.name_bn})</span>}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>মোবাইল নম্বর</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={13} style={{ color: '#00803D' }} />
                      <span>{formData.phone}</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>ইমেইল ঠিকানা</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mail size={13} style={{ color: '#0284C7' }} />
                      <span>{formData.email || '—'}</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>মূল কর্মস্থল / প্রতিষ্ঠান</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Building2 size={13} style={{ color: '#8B5CF6' }} />
                      <span>{formData.workplace || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── CARD 2: Medical Credentials & Specialty ── */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '18px 20px',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Award size={16} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>বিএমডিসি ও চিকিৎসা ক্রেডেনশিয়াল</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284C7',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      borderRadius: 6
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F0F9FF'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                  >
                    <Edit3 size={13} />
                    <span>পরিবর্তন করুন</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>BMDC রেজিস্ট্রেশন নম্বর</div>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: 14,
                      fontWeight: 800,
                      color: '#065F46',
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      padding: '3px 10px',
                      borderRadius: 6,
                      display: 'inline-block'
                    }}>
                      {formData.bmdc}
                    </span>
                  </div>

                  <div>
                    <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>বিশেষজ্ঞতা (Specialty)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{selectedSpecialtyName}</span>
                      {formData.custom_specialty_name && (
                        <span style={{
                          fontSize: 10,
                          background: '#FEF3C7',
                          color: '#92400E',
                          padding: '1px 6px',
                          borderRadius: 6,
                          fontWeight: 700,
                          border: '1px solid #FDE68A'
                        }}>
                          নতুন রিকোয়েস্ট
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>মূল ডিগ্রি (Primary Degree)</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>
                      {formData.degree || 'MBBS'}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── CARD 3: Chamber Location, GPS & Visiting Fee ── */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '18px 20px',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={16} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>চেম্বার লোকেশন ও ভিজিটিং ফি</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284C7',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      borderRadius: 6
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F0F9FF'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                  >
                    <Edit3 size={13} />
                    <span>পরিবর্তন করুন</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>কনসালটেশন ফি (Visiting Fee)</div>
                    <span style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: '#00803D',
                      background: '#DCFCE7',
                      border: '1px solid #86EFAC',
                      padding: '3px 12px',
                      borderRadius: 6,
                      display: 'inline-block'
                    }}>
                      ৳{formData.fee} BDT
                    </span>
                  </div>

                  <div>
                    <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>প্রশাসনিক এলাকা</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>
                      {selectedDistrict?.name || '—'}, {selectedDivision?.name || '—'}
                      {selectedUpazila && <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}> ({selectedUpazila.name})</span>}
                    </div>
                  </div>

                  {formData.address && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>চেম্বার / হাসপাতালের পূর্ণাঙ্গ ঠিকানা</div>
                      <div style={{ fontSize: 13, color: '#1E293B', fontWeight: 600, background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                        {formData.address}
                      </div>
                    </div>
                  )}

                  {formData.latitude && formData.longitude && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: 11.5, color: '#047857', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Navigation size={13} color="#059669" />
                        <span>জিপিএস কো-অর্ডিনেট: {formData.latitude}, {formData.longitude}</span>
                      </div>
                    </div>
                  )}

                  {formData.bio && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>ডাক্তারের পরিচিতি (Bio)</div>
                      <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, background: '#F8FAFC', padding: '10px 12px', borderRadius: 8 }}>
                        {formData.bio}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── CARD 4: Attached Verification Documents ── */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '18px 20px',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F3E8FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileCheck size={16} />
                    </div>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>সংযুক্ত প্রমাণপত্র ও ডকুমেন্টস</span>
                      <span style={{ fontSize: 12, color: '#64748B', marginLeft: 8 }}>({activeDocumentCount}টি ফাইল সংযুক্ত)</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284C7',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      borderRadius: 6
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F0F9FF'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                  >
                    <Edit3 size={13} />
                    <span>পরিবর্তন করুন</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {formData.documents?.doctor_bmdc_cert ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileText size={18} style={{ color: '#0284C7' }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                            বিএমডিসি সার্টিফিকেট (BMDC Certificate)
                          </div>
                          <div style={{ fontSize: 11.5, color: '#64748B' }}>
                            {formData.documents.doctor_bmdc_cert.file_name} • {formData.documents.doctor_bmdc_cert.file_size}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#15803D',
                        background: '#DCFCE7',
                        padding: '3px 8px',
                        borderRadius: 6,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <CheckCircle2 size={12} /> সংযুক্ত
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12.5, color: '#94A3B8', fontStyle: 'italic', padding: '6px 0' }}>
                      BMDC সার্টিফিকেট আপলোড করা হয়নি
                    </div>
                  )}

                  {formData.documents?.doctor_nid ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileText size={18} style={{ color: '#0284C7' }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                            জাতীয় পরিচয়পত্র (NID Card)
                          </div>
                          <div style={{ fontSize: 11.5, color: '#64748B' }}>
                            {formData.documents.doctor_nid.file_name} • {formData.documents.doctor_nid.file_size}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#15803D',
                        background: '#DCFCE7',
                        padding: '3px 8px',
                        borderRadius: 6,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <CheckCircle2 size={12} /> সংযুক্ত
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12.5, color: '#94A3B8', fontStyle: 'italic', padding: '6px 0' }}>
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
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.08)'
              }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: '#00803D',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(0, 128, 61, 0.25)'
                }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#064E3B' }}>
                      ৳৫০০ পার্টনার কমিশন ও অ্যাডমিন অডিট নিশ্চিতকরণ
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      background: '#00803D',
                      color: '#FFFFFF',
                      padding: '2px 8px',
                      borderRadius: 12
                    }}>
                      গ্যারান্টিযুক্ত
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: '#065F46', margin: 0, lineHeight: 1.55 }}>
                    আবেদনটি সাবমিট করার সাথে সাথে কেন্দ্রীয় <strong>Admin Onboarding Verification Desk</strong>-এ তালিকাভুক্ত হবে। জাতীয় BMDC রেজিস্ট্রি ও সনদপত্র যাচাই সম্পন্ন হওয়ামাত্র আপনার ফিল্ড এজেন্ট ওয়ালেটে <strong>৳৫০০ কমিশন</strong> স্বয়ংক্রিয়ভাবে ক্রেডিট হবে।
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Wizard Navigation Controls ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 32,
            paddingTop: 24,
            borderTop: '1px solid #F1F5F9'
          }}>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                disabled={submitting}
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
                  transition: 'all 0.15s'
                }}
              >
                <ArrowLeft size={16} />
                <span>পূর্ববর্তী ধাপ</span>
              </button>
            ) : <div />}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
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

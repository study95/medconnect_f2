import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { 
  Building2, 
  MapPin, 
  FileCheck, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  Loader2, 
  Phone, 
  Mail, 
  PhoneCall, 
  Globe, 
  Crosshair, 
  ExternalLink, 
  Check, 
  ChevronRight, 
  ShieldAlert, 
  ShieldCheck,
  FileText,
  Building,
  Navigation,
  Sparkles,
  DollarSign,
  Info,
  Edit3,
  RotateCcw
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import agentApi from '../../api/agentApi'
import axiosInstance from '../../api/axiosInstance'
import PresignedDropzone from '../../features/agent/components/PresignedDropzone'
import { getMediaUrl } from '../../utils/mediaUtils'

const enToBnDigits = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBengaliNumber = (str) => (str !== null && str !== undefined && str !== '') ? String(str).replace(/\d/g, d => enToBnDigits[d] || d) : ''

const INITIAL_HOSPITAL_FORM = {
  name: '',
  name_bn: '',
  hospital_type: 'private',
  phone: '',
  hotline: '',
  email: '',
  license_number: '',
  division_id: '',
  district_id: '',
  upazila_id: '',
  union_id: '',
  address: '',
  latitude: '',
  longitude: '',
  google_map_url: '',
  documents: {
    hospital_license_doc: null,
    hospital_trade_license_doc: null,
  },
}

export default function HospitalOnboardWizardPage() {
  const navigate = useNavigate()
  const { user, isAdmin, isSuperAdmin } = useAuth()
  const isAgentSuspended = !isAdmin && !isSuperAdmin && (user?.agent?.status === 'suspended' || user?.agent?.status === 'inactive')

  const [searchParams] = useSearchParams()
  const editCode = searchParams.get('edit_code')
  const [isEditingRevision, setIsEditingRevision] = useState(false)
  const [revisionOriginalRequest, setRevisionOriginalRequest] = useState(null)
  const [loadingEditData, setLoadingEditData] = useState(false)

  // Auto-Save Draft states
  const draftKey = `hospital_onboard_draft_${user?.id || 'session'}`
  const [draftRestored, setDraftRestored] = useState(false)
  const isInitializedRef = useRef(false)

  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [locatingGps, setLocatingGps] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [errorList, setErrorList] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})

  // Geographical hierarchy lookups
  const [divisions, setDivisions] = useState([])
  const [districts, setDistricts] = useState([])
  const [upazilas, setUpazilas] = useState([])
  const [unions, setUnions] = useState([])
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingUpazilas, setLoadingUpazilas] = useState(false)
  const [loadingUnions, setLoadingUnions] = useState(false)

  const [formData, setFormData] = useState(INITIAL_HOSPITAL_FORM)

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
            d.name || d.name_bn || d.phone || d.hotline || d.email ||
            d.license_number || d.division_id || d.district_id ||
            d.address || (d.documents?.hospital_license_doc?.file_key) ||
            (d.documents?.hospital_trade_license_doc?.file_key) ||
            (parsed.currentStep && parsed.currentStep > 1)
          )

          if (hasData) {
            setFormData({
              ...INITIAL_HOSPITAL_FORM,
              ...d,
              documents: {
                ...INITIAL_HOSPITAL_FORM.documents,
                ...(d.documents || {})
              }
            })
            if (parsed.currentStep && parsed.currentStep >= 1 && parsed.currentStep <= 4) {
              setCurrentStep(parsed.currentStep)
            }
            setDraftRestored(true)
          }
        }
      }
    } catch (e) {
      console.warn('Failed to restore hospital onboard draft:', e)
    } finally {
      isInitializedRef.current = true
    }
  }, [draftKey, editCode])

  // 2. Auto-Save Draft whenever formData or currentStep changes
  useEffect(() => {
    if (editCode || isEditingRevision || !isInitializedRef.current) return

    const d = formData
    const hasData = Boolean(
      d.name || d.name_bn || d.phone || d.hotline || d.email ||
      d.license_number || d.division_id || d.district_id ||
      d.address || (d.documents?.hospital_license_doc?.file_key) ||
      (d.documents?.hospital_trade_license_doc?.file_key) ||
      currentStep > 1
    )

    if (hasData) {
      try {
        localStorage.setItem(draftKey, JSON.stringify({
          formData,
          currentStep,
          savedAt: new Date().toISOString()
        }))
      } catch (e) {
        console.warn('Failed to auto-save hospital onboard draft:', e)
      }
    }
  }, [formData, currentStep, draftKey, editCode, isEditingRevision])

  // Discard / Reset Draft
  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(draftKey)
    } catch (e) {
      console.warn('Failed to clear hospital onboard draft:', e)
    }
    setFormData(INITIAL_HOSPITAL_FORM)
    setCurrentStep(1)
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
                const fieldKey = idx === 0 ? 'hospital_license_doc' : (idx === 1 ? 'hospital_trade_license_doc' : `doc_${idx}`)
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
              hospital_type: p.hospital_type || 'private',
              phone: p.phone || '',
              hotline: p.hotline || '',
              email: p.email || '',
              license_number: p.license_number || '',
              division_id: p.division_id ? String(p.division_id) : '',
              district_id: p.district_id ? String(p.district_id) : '',
              upazila_id: p.upazila_id ? String(p.upazila_id) : '',
              union_id: p.union_id ? String(p.union_id) : '',
              address: p.address || '',
              latitude: p.latitude !== undefined && p.latitude !== null ? String(p.latitude) : '',
              longitude: p.longitude !== undefined && p.longitude !== null ? String(p.longitude) : '',
              google_map_url: p.google_map_url || '',
              documents: docsObj,
            })
            toast.success(`আবেদন #${editCode}-এর তথ্য সফলভাবে লোড হয়েছে। সংশোধন করে সাবমিট করুন।`, {
              id: 'edit-hospital-loaded'
            })
          }
        })
        .catch((err) => {
          console.error('Failed to load hospital request for editing:', err)
          toast.error('অনবোর্ডিং আবেদনটির তথ্য লোড করা যায়নি।')
        })
        .finally(() => setLoadingEditData(false))
    }
  }, [editCode])

  const activeDocumentKeys = Object.values(formData.documents || {})
    .filter(Boolean)
    .map((d) => d.file_key)

  const activeDocumentCount = Object.values(formData.documents || {})
    .filter(Boolean)
    .filter((d) => d.file_key).length

  const hospitalTypeLabels = {
    private: 'প্রাইভেট হাসপাতাল (Private)',
    clinic: 'ক্লিনিক (Clinic)',
    diagnostic: 'ডায়াগনস্টিক সেন্টার (Diagnostic)',
    public: 'সরকারি হাসপাতাল (Public)'
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'division_id') {
        next.district_id = ''
        next.upazila_id = ''
        next.union_id = ''
      } else if (name === 'district_id') {
        next.upazila_id = ''
        next.union_id = ''
      } else if (name === 'upazila_id') {
        next.union_id = ''
      }
      return next
    })

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  // Handle GPS detection
  const handleDetectGpsLocation = () => {
    if (!navigator.geolocation) {
      toast.error('আপনার ব্রাউজারে জিপিএস অবস্থান সনাক্তকরণের সুবিধা পাওয়া যায়নি।')
      return
    }

    setLocatingGps(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6)
        const lng = position.coords.longitude.toFixed(6)
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          google_map_url: `https://www.google.com/maps?q=${lat},${lng}`
        }))
        setLocatingGps(false)
        toast.success(`সফলভাবে জিপিএস স্থানাঙ্ক সনাক্ত করা হয়েছে! (${lat}, ${lng})`)
      },
      (error) => {
        setLocatingGps(false)
        console.warn('Geolocation error:', error)
        let msg = 'অবস্থান শনাক্ত করা যায়নি।'
        if (error.code === 1) msg = 'লোকেশন এক্সেস অনুমতি প্রত্যাখ্যাত হয়েছে। ব্রাউজারের লোকেশন পারমিশন দিন।'
        else if (error.code === 2) msg = 'ডিভাইসের অবস্থান শনাক্ত করা সম্ভব হয়নি।'
        else if (error.code === 3) msg = 'লোকেশন রিকোয়েস্টের সময়সীমা শেষ হয়েছে।'
        toast.error(msg)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
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
    toast.success('ডকুমেন্ট সফলভাবে আপলোড হয়েছে!')
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
      if (!formData.name.trim()) errs.name = 'হাসপাতালের পূর্ণ নাম (ইংরেজিতে) আবশ্যক।'
      if (!formData.hospital_type) errs.hospital_type = 'হাসপাতালের ধরন নির্বাচন করুন।'
      if (!formData.phone.trim()) {
        errs.phone = 'হাসপাতালের অফিসিয়াল মোবাইল নম্বর আবশ্যক।'
      } else if (!/^01[3-9]\d{8}$/.test(formData.phone.trim())) {
        errs.phone = 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।'
      }
      if (formData.email?.trim() && !formData.email.includes('@')) {
        errs.email = 'সঠিক ইমেইল ফরম্যাট দিন (যেমন: hospital@example.com)।'
      }
    }

    if (step === 2) {
      if (!formData.division_id) errs.division_id = 'বিভাগ নির্বাচন করুন।'
      if (!formData.district_id) errs.district_id = 'জেলা নির্বাচন করুন।'
      if (!formData.address.trim()) errs.address = 'হাসপাতালের পূর্ণাঙ্গ ঠিকানা (রোড, হোল্ডিং বা এলাকার নাম) লিখুন।'
    }

    if (step === 3) {
      if (!formData.license_number.trim()) {
        errs.license_number = 'ট্রেড লাইসেন্স বা ডিজিএইচএস (DGHS) রেজিস্ট্রেশন নম্বর আবশ্যক।'
      }
      if (!formData.documents?.hospital_license_doc?.file_key) {
        errs.document_keys = 'হাসপাতালের DGHS লাইসেন্স বা রেজিস্ট্রেশন সনদপত্র আপলোড করা বাধ্যতামূলক।'
      } else if (!formData.documents?.hospital_trade_license_doc?.file_key) {
        errs.document_keys = 'পৌরসভা বা সিটি কর্পোরেশনের ট্রেড লাইসেন্স আপলোড করা বাধ্যতামূলক।'
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
    setCurrentStep((s) => Math.min(4, s + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const prevStep = () => {
    setErrorMessage(null)
    setCurrentStep((s) => Math.max(1, s - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validateStep(3)
    if (err) {
      setCurrentStep(3)
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
        hospital_type: formData.hospital_type,
        phone: formData.phone.trim(),
        hotline: formData.hotline ? formData.hotline.trim() : null,
        email: formData.email?.trim() ? formData.email.trim() : null,
        license_number: formData.license_number.trim(),
        division_id: formData.division_id ? parseInt(formData.division_id, 10) : null,
        district_id: formData.district_id ? parseInt(formData.district_id, 10) : null,
        upazila_id: formData.upazila_id ? parseInt(formData.upazila_id, 10) : null,
        union_id: formData.union_id ? parseInt(formData.union_id, 10) : null,
        address: formData.address.trim(),
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        google_map_url: formData.google_map_url ? formData.google_map_url.trim() : null,
        document_keys: activeDocumentKeys,
      }

      if (isEditingRevision && editCode) {
        await agentApi.resubmitOnboardingRequest(editCode, payload)
        toast.success('সংশোধিত আবেদনটি সফলভাবে পুনরায় সাবমিট করা হয়েছে! ভেরিফিকেশনের জন্য পাঠানো হয়েছে।')
        navigate('/agent/tracker')
      } else {
        await agentApi.submitHospitalOnboarding(payload)
        try {
          localStorage.removeItem(draftKey)
        } catch (e) {
          console.warn('Failed to clear hospital draft after submit:', e)
        }
        toast.success('হাসপাতাল অনবোর্ডিং আবেদন সফলভাবে জমা দেওয়া হয়েছে! অ্যাডমিন যাচাইয়ের জন্য অপেক্ষমাণ।')
        navigate('/agent/tracker')
      }
    } catch (err) {
      console.error('Hospital onboarding submission failed:', err)
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
        else extracted.push('হাসপাতাল অনবোর্ডিং আবেদন জমা দিতে সমস্যা হয়েছে। তথ্য যাচাই করুন।')
      }

      const sanitizeHospitalError = (msg) => {
        if (typeof msg !== 'string') return msg
        const lower = msg.toLowerCase()
        if (lower.includes('duplicate') || lower.includes('collision') || lower.includes('already exists')) {
          if (lower.includes('license') || lower.includes('dghs')) {
            return 'এই লাইসেন্স বা ডিজিএইচএস (DGHS) নম্বরটি দিয়ে ইতোমধ্যে একটি হাসপাতাল সিস্টেমে নিবন্ধিত রয়েছে।'
          }
          if (lower.includes('phone') || lower.includes('mobile')) {
            return 'এই মোবাইল নম্বরটি দিয়ে ইতোমধ্যে একটি হাসপাতাল সিস্টেমে নিবন্ধিত রয়েছে।'
          }
          return 'প্রদত্ত তথ্য (লাইসেন্স বা মোবাইল নম্বর) দিয়ে ইতোমধ্যে একটি হাসপাতাল সিস্টেমে নিবন্ধিত রয়েছে।'
        }
        return msg
      }

      const sanitized = extracted.map(sanitizeHospitalError)

      // Map top-level error (e.g. duplicate error) directly to fieldErrors so the exact field gets the red border and error message under it!
      const topError = sanitized[0] || ''
      if (topError.includes('মোবাইল') || topError.toLowerCase().includes('phone')) {
        backendErrors.phone = topError
      } else if (topError.includes('লাইসেন্স') || topError.includes('ডিজিএইচএস') || topError.toLowerCase().includes('license')) {
        backendErrors.license_number = topError
      } else if (topError.includes('ইমেইল') || topError.toLowerCase().includes('email')) {
        backendErrors.email = topError
      }

      setFieldErrors(backendErrors)
      setErrorList(sanitized)
      setErrorMessage(sanitized[0] || 'হাসপাতাল অনবোর্ডিং আবেদন জমা দিতে সমস্যা হয়েছে।')
      // toast.error() omitted per security & clean UI requirement (no popup toast, inline alert only)
      // toast.error() omitted per security & clean UI requirement (no popup toast, inline alert only)

      if (backendErrors.name || backendErrors.phone || backendErrors.email || backendErrors.hospital_type) {
        setCurrentStep(1)
      } else if (backendErrors.division_id || backendErrors.district_id || backendErrors.address || backendErrors.latitude) {
        setCurrentStep(2)
      } else if (backendErrors.license_number || backendErrors.document_keys) {
        setCurrentStep(3)
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSubmitting(false)
    }
  }

  const steps = [
    { num: 1, label: 'প্রাথমিক পরিচয়', desc: 'নাম ও যোগাযোগ', icon: Building2 },
    { num: 2, label: 'লোকেশন ও জিপিএস', desc: 'ঠিকানা ও কো-অর্ডিনেট', icon: MapPin },
    { num: 3, label: 'লাইসেন্স ও সনদপত্র', desc: 'DGHS ও ট্রেড লাইসেন্স', icon: FileCheck },
    { num: 4, label: 'রিভিউ ও সাবমিট', desc: 'চূড়ান্ত যাচাই', icon: CheckCircle2 },
  ]

  if (isAgentSuspended) {
    return (
      <div style={{ minHeight: '100%', background: '#F8FAFC' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 20px 48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748B', marginBottom: 16 }}>
            <Link to="/agent" style={{ color: 'inherit', textDecoration: 'none' }}>Partner Desk</Link>
            <ChevronRight size={13} />
            <span>Onboarding</span>
            <ChevronRight size={13} />
            <span style={{ color: '#EF4444', fontWeight: 700 }}>Access Restricted</span>
          </div>

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

            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: '14px 0 8px' }}>
              আপনার ফিল্ড এজেন্ট অ্যাকাউন্টটি স্থগিত রয়েছে
            </h2>

            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, maxWidth: 520, margin: '0 auto 24px' }}>
              প্রশাসনিক নির্দেশনার কারণে এজেন্ট কোড <strong>({user?.agent?.agent_code || 'AGT-PARTNER'})</strong> সাময়িকভাবে স্থগিত করা হয়েছে। নতুন হাসপাতাল অনবোর্ডিং ফর্ম জমা দেওয়া যাবে না।
            </p>

            <Link
              to="/agent/tracker"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 22px',
                borderRadius: 10,
                background: '#0F172A',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none'
              }}
            >
              পূর্ববর্তী সাবমিশন ট্র্যাকার দেখুন
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Selected names for review step
  const selectedDivision = divisions.find(d => String(d.id) === String(formData.division_id))
  const selectedDistrict = districts.find(d => String(d.id) === String(formData.district_id))
  const selectedUpazila = upazilas.find(u => String(u.id) === String(formData.upazila_id))
  const selectedUnion = unions.find(u => String(u.id) === String(formData.union_id))

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

  return (
    <div style={{ minHeight: '100%', background: '#F8FAFC' }}>
      <style>{`
        .hospital-wizard-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 24px 20px 48px;
        }
        .hospital-wizard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 16px;
        }
        .hospital-wizard-title-wrap {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
          flex: 1;
        }
        .hospital-wizard-title-icon {
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
        .hospital-wizard-title-h1 {
          font-size: 22px;
          font-weight: 900;
          color: #0F172A;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .hospital-wizard-subtitle {
          font-size: 13px;
          color: #64748B;
          margin: 3px 0 0;
        }
        .hospital-wizard-badges {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .hospital-wizard-stepper-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 20px;
          padding: 20px 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          margin-bottom: 24px;
          position: relative;
        }
        .hospital-wizard-main-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          margin-bottom: 32px;
        }
        .hospital-wizard-nav-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #F1F5F9;
        }
        .hospital-grid-col-full {
          grid-column: span 2;
        }
        .hospital-gps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .hospital-doc-card {
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-radius: 16px;
          padding: 18px 20px;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .hospital-doc-guidance {
          background: linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%);
          border: 1.5px solid #A7F3D0;
          border-radius: 14px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.06);
        }
        .hospital-doc-title {
          font-size: 13.5px;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.3;
        }
        .hospital-doc-subtitle {
          font-size: 11.5px;
          color: #64748B;
          margin-top: 2px;
        }
        .hospital-doc-badge {
          font-size: 10.5px;
          font-weight: 800;
          background: #FEE2E2;
          color: #DC2626;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid #FECACA;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .hospital-review-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 16px 18px;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
        }
        .hospital-review-card-header {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          margin-bottom: 12px !important;
          padding-bottom: 8px !important;
          border-bottom: 1px solid #F1F5F9 !important;
          gap: 8px !important;
        }
        .hospital-review-title {
          font-size: 13.5px;
          font-weight: 800;
          color: #0F172A;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .hospital-review-edit-btn {
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
        .hospital-review-grid {
          display: grid !important;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
          gap: 12px !important;
        }
        .hospital-review-cell {
          background: #F8FAFC;
          border-radius: 10px;
          padding: 8px 12px;
          border: 1px solid #F1F5F9;
        }
        .hospital-review-cell-full {
          grid-column: 1 / -1 !important;
        }
        .hospital-review-label {
          font-size: 10.5px;
          color: #64748B;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .hospital-review-val {
          font-size: 13px;
          font-weight: 700;
          color: #0F172A;
        }

        @media (max-width: 768px) {
          .hospital-wizard-container {
            padding: 14px 12px calc(80px + env(safe-area-inset-bottom, 0px)) !important;
          }
          .hospital-wizard-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
            margin-bottom: 16px !important;
          }
          .hospital-wizard-title-icon {
            width: 40px !important;
            height: 40px !important;
            border-radius: 10px !important;
          }
          .hospital-wizard-title-h1 {
            font-size: 17px !important;
            white-space: normal !important;
            line-height: 1.3 !important;
          }
          .hospital-wizard-subtitle {
            font-size: 12px !important;
          }
          .hospital-wizard-badges {
            width: 100% !important;
            justify-content: space-between !important;
          }
          .hospital-wizard-draft-badge {
            padding: 4px 8px !important;
            font-size: 11px !important;
          }
          .hospital-wizard-step-pill {
            padding: 4px 10px !important;
            font-size: 11.5px !important;
          }
          .hospital-wizard-stepper-card {
            padding: 14px 12px 12px !important;
            border-radius: 16px !important;
            margin-bottom: 16px !important;
          }
          .hospital-wizard-stepper-label {
            display: none !important;
          }
          .hospital-wizard-stepper-circle {
            width: 32px !important;
            height: 32px !important;
            font-size: 12px !important;
          }
          .hospital-wizard-stepper-item {
            padding: 0 2px !important;
          }
          .hospital-wizard-line-bg,
          .hospital-wizard-line-active {
            top: 16px !important;
            left: 18px !important;
            right: 18px !important;
          }
          .hospital-wizard-main-card {
            padding: 18px 14px !important;
            border-radius: 16px !important;
            margin-bottom: 20px !important;
          }
          .hospital-form-grid-2 {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .hospital-grid-col-full {
            grid-column: 1 / -1 !important;
          }
          .hospital-gps-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .hospital-doc-card {
            padding: 14px 12px !important;
            border-radius: 14px !important;
          }
          .hospital-doc-guidance {
            padding: 10px 12px !important;
            border-radius: 12px !important;
          }
          .hospital-doc-title {
            font-size: 13px !important;
          }
          .hospital-doc-subtitle {
            font-size: 11px !important;
          }
          .hospital-doc-badge {
            font-size: 10px !important;
            padding: 2.5px 7px !important;
          }
          .hospital-review-card {
            padding: 12px 12px !important;
            border-radius: 13px !important;
            margin-bottom: 10px !important;
          }
          .hospital-review-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .hospital-review-cell {
            padding: 7px 9px !important;
            border-radius: 8px !important;
          }
          .hospital-review-title {
            font-size: 13px !important;
          }
          .hospital-review-label {
            font-size: 10px !important;
          }
          .hospital-review-val {
            font-size: 12px !important;
          }
          .hospital-wizard-nav-controls {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            margin-top: 20px !important;
            padding-top: 16px !important;
            gap: 10px !important;
          }
          .hospital-wizard-btn-prev {
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
          .hospital-wizard-btn-next,
          .hospital-wizard-btn-submit {
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
        }
      `}</style>
      <div className="hospital-wizard-container">
        
        {/* Breadcrumb HUD */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748B', marginBottom: 16 }}>
          <Link to="/agent" style={{ color: 'inherit', textDecoration: 'none' }}>Partner Desk</Link>
          <ChevronRight size={13} />
          <span>Onboarding</span>
          <ChevronRight size={13} />
          <span style={{ color: '#00B875', fontWeight: 700 }}>
            {isEditingRevision ? `Application Revision #${editCode}` : 'Hospital Onboarding'}
          </span>
        </div>

        {/* Page Header */}
        <div className="hospital-wizard-header">
          <div className="hospital-wizard-title-wrap">
            <div className="hospital-wizard-title-icon">
              <Building2 size={24} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 className="hospital-wizard-title-h1">
                {isEditingRevision ? 'হাসপাতাল আবেদন সংশোধন ফর্ম' : 'নতুন হাসপাতাল অনবোর্ডিং ফর্ম'}
              </h1>
              <p className="hospital-wizard-subtitle">
                {isEditingRevision 
                  ? `আবেদন #${editCode} • সংশোধিত তথ্য জমা দিন`
                  : <>হাসপাতালের তথ্য ও লাইসেন্স যাচাই সাপেক্ষে <strong>৳১,৫০০ কমিশন</strong>।</>}
              </p>
            </div>
          </div>

          <div className="hospital-wizard-badges">
            {!isEditingRevision && (
              <span className="hospital-wizard-draft-badge" style={{
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
            <div className="hospital-wizard-step-pill" style={{
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
              <span>ধাপ {toBengaliNumber(currentStep)} / ৪</span>
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
        <div className="hospital-wizard-stepper-card">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative'
          }}>
            {/* Background line connecting steps */}
            <div className="hospital-wizard-line-bg" style={{
              position: 'absolute',
              top: 20,
              left: 30,
              right: 30,
              height: 2,
              background: '#E2E8F0',
              zIndex: 0
            }} />

            {/* Active connecting line */}
            <div className="hospital-wizard-line-active" style={{
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
                  className="hospital-wizard-stepper-item"
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
                    className="hospital-wizard-stepper-circle"
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

                  <span className="hospital-wizard-stepper-label" style={{
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
              ধাপ {toBengaliNumber(currentStep)} / ৪: {steps[currentStep - 1]?.label}
            </span>
            <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginTop: 1 }}>
              {steps[currentStep - 1]?.desc}
            </span>
          </div>
        </div>

        {/* ── Main Form Card ── */}
        <div className="hospital-wizard-main-card">

          {/* ═══════════════════════════════════════════════════════
              STEP 1: Hospital Identity & Contact Details
             ═══════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  ধাপ ১: হাসপাতালের প্রাথমিক পরিচিতি ও যোগাযোগ
                </h2>
                <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
                  হাসপাতালের অফিশিয়াল নাম, ধরন এবং প্রশাসনিক মোবাইল ও ইমেইল নম্বর প্রদান করুন।
                </p>
              </div>

              <div className="hospital-form-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {/* Hospital English Name */}
                <div className="hospital-grid-col-full">
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    হাসপাতালের নাম (English) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Popular Diagnostic Centre & Hospital"
                    style={{
                      width: '100%',
                      height: 44,
                      padding: '0 14px',
                      borderRadius: 10,
                      border: `1.5px solid ${getFieldError('name') ? '#EF4444' : '#CBD5E1'}`,
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box'
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

                {/* Hospital Bengali Name */}
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    হাসপাতালের নাম (বাংলায় - ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    name="name_bn"
                    value={formData.name_bn}
                    onChange={handleChange}
                    placeholder="যেমন: পপুলার ডায়াগনস্টিক সেন্টার"
                    style={{
                      width: '100%',
                      height: 44,
                      padding: '0 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00B875'}
                    onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                  />
                </div>

                {/* Hospital Type */}
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    হাসপাতালের ধরন <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    name="hospital_type"
                    value={formData.hospital_type}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      height: 44,
                      padding: '0 14px',
                      borderRadius: 10,
                      border: `1.5px solid ${getFieldError('hospital_type') ? '#EF4444' : '#CBD5E1'}`,
                      fontSize: 14,
                      outline: 'none',
                      background: '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00B875'}
                    onBlur={(e) => e.target.style.borderColor = getFieldError('hospital_type') ? '#EF4444' : '#CBD5E1'}
                  >
                    <option value="private">প্রাইভেট হাসপাতাল (Private Hospital)</option>
                    <option value="clinic">ক্লিনিক (Clinic)</option>
                    <option value="diagnostic">ডায়াগনস্টিক সেন্টার (Diagnostic Centre)</option>
                    <option value="public">সরকারি হাসপাতাল (Government / Public)</option>
                  </select>
                </div>

                {/* Official Phone */}
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    অফিসিয়াল মোবাইল নম্বর <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="01XXXXXXXXX"
                      style={{
                        width: '100%',
                        height: 44,
                        padding: '0 14px 0 38px',
                        borderRadius: 10,
                        border: `1.5px solid ${getFieldError('phone') ? '#EF4444' : '#CBD5E1'}`,
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#00B875'}
                      onBlur={(e) => e.target.style.borderColor = getFieldError('phone') ? '#EF4444' : '#CBD5E1'}
                    />
                    <Phone size={15} color="#94A3B8" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>
                  {getFieldError('phone') && (
                    <span style={{ fontSize: 11.5, color: '#EF4444', marginTop: 4, display: 'block', fontWeight: 600 }}>
                      {getFieldError('phone')}
                    </span>
                  )}
                </div>

                {/* Official Email */}
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    অফিসিয়াল ইমেইল অ্যাড্রেস (ঐচ্ছিক)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="hospital@example.com"
                      style={{
                        width: '100%',
                        height: 44,
                        padding: '0 14px 0 38px',
                        borderRadius: 10,
                        border: `1.5px solid ${getFieldError('email') ? '#EF4444' : '#CBD5E1'}`,
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#00B875'}
                      onBlur={(e) => e.target.style.borderColor = getFieldError('email') ? '#EF4444' : '#CBD5E1'}
                    />
                    <Mail size={15} color="#94A3B8" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>
                  {getFieldError('email') && (
                    <span style={{ fontSize: 11.5, color: '#EF4444', marginTop: 4, display: 'block', fontWeight: 600 }}>
                      {getFieldError('email')}
                    </span>
                  )}
                </div>

                {/* Emergency Hotline */}
                <div className="hospital-grid-col-full">
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    জরুরি হটলাইন নম্বর (ঐচ্ছিক)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      name="hotline"
                      value={formData.hotline}
                      onChange={handleChange}
                      placeholder="e.g. 10678 অথবা 09612345678"
                      style={{
                        width: '100%',
                        height: 44,
                        padding: '0 14px 0 38px',
                        borderRadius: 10,
                        border: '1.5px solid #CBD5E1',
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#00B875'}
                      onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                    />
                    <PhoneCall size={15} color="#94A3B8" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'block' }}>
                    হাসপাতালের সার্বক্ষণিক ইমার্জেন্সি হটলাইন থাকলে তা উল্লেখ করুন।
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP 2: Location, Geographical Hierarchy & GPS
             ═══════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div>
              <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 14, marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  ধাপ ২: ভৌগোলিক এলাকা ও সঠিক জিপিএস লোকেশন
                </h2>
                <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
                  প্রশাসনিক বিভাগ, জেলা, উপজেলা নির্বাচন করুন এবং ম্যাপ ন্যাভিগেশনের জন্য সরাসরি জিপিএস কো-অর্ডিনেট সেট করুন।
                </p>
              </div>

              {/* Administrative Cascading Selects */}
              <div className="hospital-form-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 20 }}>
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
                    onFocus={(e) => e.target.style.borderColor = '#00B875'}
                    onBlur={(e) => e.target.style.borderColor = getFieldError('division_id') ? '#EF4444' : '#CBD5E1'}
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
                    onFocus={(e) => e.target.style.borderColor = '#00B875'}
                    onBlur={(e) => e.target.style.borderColor = getFieldError('district_id') ? '#EF4444' : '#CBD5E1'}
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
                    উপজেলা / থানা (Upazila - ঐচ্ছিক)
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
                    onFocus={(e) => e.target.style.borderColor = '#00B875'}
                    onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
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
                    ইউনিয়ন / ওয়ার্ড (Union - ঐচ্ছিক)
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
                    onFocus={(e) => e.target.style.borderColor = '#00B875'}
                    onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                  >
                    <option value="">
                      {loadingUnions ? 'ইউনিয়ন লোড হচ্ছে...' : '-- ইউনিয়ন নির্বাচন করুন --'}
                    </option>
                    {unions.map((un) => (
                      <option key={un.id} value={un.id}>{un.name} {un.bangla_name ? `(${un.bangla_name})` : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Detailed Physical Address */}
                <div className="hospital-grid-col-full">
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    হাসপাতালের পূর্ণাঙ্গ ঠিকানা (রোড, হোল্ডিং বা এলাকার নাম) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <textarea
                    rows={2}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="যেমন: বাড়ি #১৬, রোড #২, ধানমন্ডি আ/এ, ঢাকা-১২০৫"
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
                      <Navigation size={17} color="#059669" />
                      জিপিএস লোকেশন সনাক্তকরণ (GPS Geolocation)
                    </h4>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: '#047857' }}>
                      হাসপাতালে উপস্থিত থাকলে নিচের বাটনে ক্লিক করে এক চাপেই ডিভাইসের জিপিএস অবস্থান যুক্ত করুন।
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDetectGpsLocation}
                    disabled={locatingGps}
                    className="hospital-gps-header-btn"
                    style={{
                      background: '#059669',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 10,
                      padding: '10px 18px',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: locatingGps ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 10px rgba(5, 150, 105, 0.25)'
                    }}
                  >
                    {locatingGps ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
                    <span>{locatingGps ? 'সনাক্ত করা হচ্ছে...' : '📍 বর্তমান জিপিএস লোকেশন নিন'}</span>
                  </button>
                </div>

                <div className="hospital-gps-grid">
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#065F46', marginBottom: 4, textTransform: 'uppercase' }}>
                      অক্ষাংশ (Latitude)
                    </label>
                    <input
                      type="text"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      placeholder="e.g. 23.746123"
                      style={{
                        width: '100%',
                        height: 40,
                        padding: '0 12px',
                        borderRadius: 8,
                        border: '1px solid #A7F3D0',
                        fontSize: 13,
                        background: '#FFFFFF',
                        boxSizing: 'border-box',
                        outline: 'none'
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
                      placeholder="e.g. 90.374567"
                      style={{
                        width: '100%',
                        height: 40,
                        padding: '0 12px',
                        borderRadius: 8,
                        border: '1px solid #A7F3D0',
                        fontSize: 13,
                        background: '#FFFFFF',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#065F46', marginBottom: 4, textTransform: 'uppercase' }}>
                      গুগল ম্যাপ লিংক (URL - ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      name="google_map_url"
                      value={formData.google_map_url}
                      onChange={handleChange}
                      placeholder="https://maps.google.com/..."
                      style={{
                        width: '100%',
                        height: 40,
                        padding: '0 12px',
                        borderRadius: 8,
                        border: '1px solid #A7F3D0',
                        fontSize: 13,
                        background: '#FFFFFF',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {formData.latitude && formData.longitude && (
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#047857', fontWeight: 600 }}>
                    <CheckCircle2 size={15} color="#059669" />
                    <span>জিপিএস কো-অর্ডিনেট সক্রিয়: ({formData.latitude}, {formData.longitude})</span>
                    <a
                      href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0284C7', textDecoration: 'underline', marginLeft: 8 }}
                    >
                      ম্যাপে অবস্থান যাচাই করুন ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP 3: License & Verification Documents
             ═══════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div>
              <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 14, marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  ধাপ ৩: সরকারি লাইসেন্স ও ভেরিফিকেশন সনদপত্র
                </h2>
                <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
                  স্বাস্থ্য অধিদপ্তর (DGHS) রেজিস্ট্রেশন নম্বর প্রদান করুন এবং অফিশিয়াল লাইসেন্স ফাইল আপলোড করুন।
                </p>
              </div>

              {/* License Number Input */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ট্রেড লাইসেন্স বা ডিজিএইচএস (DGHS) রেজিস্ট্রেশন নম্বর <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleChange}
                  placeholder="e.g. DGHS-REG-10482 বা TRADE/DHAKA/2026/8912"
                  style={{
                    width: '100%',
                    height: 44,
                    padding: '0 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${getFieldError('license_number') ? '#EF4444' : '#CBD5E1'}`,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00B875'}
                  onBlur={(e) => e.target.style.borderColor = getFieldError('license_number') ? '#EF4444' : '#CBD5E1'}
                />
                {getFieldError('license_number') && (
                  <span style={{ fontSize: 11.5, color: '#EF4444', marginTop: 4, display: 'block', fontWeight: 600 }}>
                    {getFieldError('license_number')}
                  </span>
                )}
                <span style={{ fontSize: 11.5, color: '#64748B', marginTop: 4, display: 'block' }}>
                  স্বাস্থ্য অধিদপ্তর কর্তৃক প্রদত্ত লাইসেন্স বা পৌরসভা/সিটি কর্পোরেশনের ট্রেড লাইসেন্স নম্বর।
                </span>
              </div>

              {/* Guidance Info Banner */}
              <div className="hospital-doc-guidance">
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
                  <ShieldCheck size={18} />
                </div>
                <div style={{ fontSize: 12, color: '#065F46', lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 800, color: '#064E3B', marginBottom: 2 }}>
                    ডকুমেন্ট আপলোড নির্দেশিকা:
                  </div>
                  <div>• DGHS লাইসেন্স ও ট্রেড লাইসেন্স উভয় সনদ আপলোড করা বাধ্যতামূলক • PDF / ছবি (সর্বোচ্চ ১০ MB)</div>
                </div>
              </div>

              {/* Presigned Document Dropzones */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* 1. DGHS License Doc (Required) */}
                <div className="hospital-doc-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
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
                        <FileCheck size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="hospital-doc-title">
                          DGHS লাইসেন্স / রেজিস্ট্রেশন সনদ
                        </div>
                        <div className="hospital-doc-subtitle">
                          স্বাস্থ্য অধিদপ্তর কর্তৃক অনুমোদিত সরকারি লাইসেন্স কপি
                        </div>
                      </div>
                    </div>
                    <span className="hospital-doc-badge">
                      বাধ্যতামূলক *
                    </span>
                  </div>

                  <PresignedDropzone
                    category="hospital_license"
                    label="DGHS রেজিস্ট্রেশন সনদপত্র"
                    required
                    existingKey={formData.documents?.hospital_license_doc?.file_key}
                    existingFileName={formData.documents?.hospital_license_doc?.name || formData.documents?.hospital_license_doc?.file_name}
                    existingFileSize={formData.documents?.hospital_license_doc?.file_size}
                    onUploadSuccess={(fileKey, fileName, sizeStr) =>
                      handleDocumentUploaded('hospital_license_doc', fileKey, fileName, sizeStr)
                    }
                    onRemove={() => handleDocumentRemoved('hospital_license_doc')}
                  />
                  {getFieldError('document_keys') && !formData.documents?.hospital_license_doc?.file_key && (
                    <span style={{ fontSize: 11.5, color: '#EF4444', marginTop: 2, display: 'block', fontWeight: 600 }}>
                      {getFieldError('document_keys')}
                    </span>
                  )}
                </div>

                {/* 2. Trade License Doc (Required) */}
                <div className="hospital-doc-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'rgba(2, 132, 199, 0.1)',
                        color: '#0284C7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <FileText size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="hospital-doc-title">
                          পৌরসভা / সিটি কর্পোরেশন ট্রেড লাইসেন্স
                        </div>
                        <div className="hospital-doc-subtitle">
                          হালনাগাদ ট্রেড লাইসেন্স বা ট্যাক্স সার্টিফিকেট
                        </div>
                      </div>
                    </div>
                    <span className="hospital-doc-badge">
                      বাধ্যতামূলক *
                    </span>
                  </div>

                  <PresignedDropzone
                    category="hospital_trade_license"
                    label="ট্রেড লাইসেন্স কপি"
                    required
                    existingKey={formData.documents?.hospital_trade_license_doc?.file_key}
                    existingFileName={formData.documents?.hospital_trade_license_doc?.name || formData.documents?.hospital_trade_license_doc?.file_name}
                    existingFileSize={formData.documents?.hospital_trade_license_doc?.file_size}
                    onUploadSuccess={(fileKey, fileName, sizeStr) =>
                      handleDocumentUploaded('hospital_trade_license_doc', fileKey, fileName, sizeStr)
                    }
                    onRemove={() => handleDocumentRemoved('hospital_trade_license_doc')}
                  />
                  {getFieldError('document_keys') && !formData.documents?.hospital_trade_license_doc?.file_key && (
                    <span style={{ fontSize: 11.5, color: '#EF4444', marginTop: 2, display: 'block', fontWeight: 600 }}>
                      {getFieldError('document_keys')}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Banner */}
              <div style={{
                background: activeDocumentCount >= 2 ? '#F0FDF4' : '#FEF3C7',
                border: activeDocumentCount >= 2 ? '1.5px solid #86EFAC' : '1.5px solid #FDE68A',
                borderRadius: 12,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 14
              }}>
                {activeDocumentCount >= 2 ? (
                  <>
                    <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: '#065F46', fontWeight: 700 }}>
                      সকল আবশ্যক সনদপত্র আপলোড করা হয়েছে ({toBengaliNumber(activeDocumentCount)}/২)। আপনি পরবর্তী ধাপে যেতে পারেন।
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: '#92400E', fontWeight: 700 }}>
                      {activeDocumentCount === 1 
                        ? '১টি সনদপত্র আপলোড হয়েছে। বাকি ১টি সনদপত্র আপলোড সম্পন্ন করুন (১/২)।' 
                        : 'আবেদন সম্পূর্ণ করতে ডিজিএইচএস ও ট্রেড লাইসেন্স আপলোড করুন (০/২)।'}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP 4: Review, Confirm & Submit
             ═══════════════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    ধাপ ৪: চূড়ান্ত পর্যালোচনা ও সাবমিশন
                  </h2>
                  <p style={{ fontSize: 12.5, color: '#64748B', margin: '4px 0 0', lineHeight: 1.45 }}>
                    প্রশাসনিক অডিটের জন্য সাবমিট করার পূর্বে হাসপাতালের সকল সংগৃহীত তথ্য ও প্রমাণপত্র যাচাই করুন।
                  </p>
                </div>
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

              {/* ── CARD 1: Hospital Profile & Contact ── */}
              <div className="hospital-review-card">
                <div className="hospital-review-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#DCFCE7', color: '#00803D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building2 size={15} />
                    </div>
                    <span className="hospital-review-title">
                      হাসপাতালের প্রাথমিক পরিচিতি ও যোগাযোগ
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="hospital-review-edit-btn"
                    title="ধাপ ১ এডিট করুন"
                  >
                    <Edit3 size={12} />
                    <span>এডিট</span>
                  </button>
                </div>

                <div className="hospital-review-grid">
                  <div className="hospital-review-cell">
                    <div className="hospital-review-label">হাসপাতালের পূর্ণ নাম</div>
                    <div className="hospital-review-val">
                      {formData.name} {formData.name_bn && <span style={{ fontSize: 12, fontWeight: 500, color: '#64748B' }}>({formData.name_bn})</span>}
                    </div>
                  </div>

                  <div className="hospital-review-cell">
                    <div className="hospital-review-label">হাসপাতালের ধরন</div>
                    <div>
                      <span style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: '#0369A1',
                        background: '#E0F2FE',
                        border: '1px solid #BAE6FD',
                        padding: '2px 8px',
                        borderRadius: 6,
                        display: 'inline-block'
                      }}>
                        {hospitalTypeLabels[formData.hospital_type] || formData.hospital_type}
                      </span>
                    </div>
                  </div>

                  <div className="hospital-review-cell">
                    <div className="hospital-review-label">অফিসিয়াল মোবাইল</div>
                    <div className="hospital-review-val" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Phone size={12} style={{ color: '#00803D', flexShrink: 0 }} />
                      <span>{formData.phone}</span>
                    </div>
                  </div>

                  <div className="hospital-review-cell">
                    <div className="hospital-review-label">ইমেইল ঠিকানা</div>
                    <div className="hospital-review-val" style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Mail size={12} style={{ color: '#0284C7', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formData.email || '—'}</span>
                    </div>
                  </div>

                  {formData.hotline && (
                    <div className="hospital-review-cell">
                      <div className="hospital-review-label">জরুরি হটলাইন</div>
                      <div className="hospital-review-val" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <PhoneCall size={12} style={{ color: '#8B5CF6', flexShrink: 0 }} />
                        <span>{formData.hotline}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── CARD 2: Location, Address & GPS Coordinates ── */}
              <div className="hospital-review-card">
                <div className="hospital-review-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MapPin size={15} />
                    </div>
                    <span className="hospital-review-title">
                      ভৌগোলিক এলাকা, ঠিকানা ও জিপিএস
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="hospital-review-edit-btn"
                    title="ধাপ ২ এডিট করুন"
                  >
                    <Edit3 size={12} />
                    <span>এডিট</span>
                  </button>
                </div>

                <div className="hospital-review-grid">
                  <div className="hospital-review-cell hospital-review-cell-full">
                    <div className="hospital-review-label">
                      প্রশাসনিক অবস্থান (এলাকা)
                    </div>
                    <div className="hospital-review-val" style={{ lineHeight: 1.5 }}>
                      {locationBreadcrumb.length > 0 ? locationBreadcrumb.join(', ') : '—'}
                    </div>
                  </div>

                  {formData.address && (
                    <div className="hospital-review-cell hospital-review-cell-full">
                      <div className="hospital-review-label">হাসপাতালের পূর্ণাঙ্গ ঠিকানা</div>
                      <div style={{ fontSize: 12.5, color: '#1E293B', fontWeight: 600 }}>
                        {formData.address}
                      </div>
                    </div>
                  )}

                  {formData.latitude && formData.longitude ? (
                    <div className="hospital-review-cell hospital-review-cell-full">
                      <div style={{ fontSize: 11, color: '#047857', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                        <Navigation size={12} color="#059669" />
                        <span>GPS: {formData.latitude}, {formData.longitude}</span>
                        {formData.google_map_url && (
                          <a href={formData.google_map_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0284C7', textDecoration: 'none', marginLeft: 6, fontSize: 11.5 }}>
                            (গুগল ম্যাপে দেখুন ↗)
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="hospital-review-cell hospital-review-cell-full" style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>
                      জিপিএস কো-অর্ডিনেট ইনপুট দেওয়া হয়নি
                    </div>
                  )}
                </div>
              </div>

              {/* ── CARD 3: License & Verification Documents ── */}
              <div className="hospital-review-card">
                <div className="hospital-review-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F3E8FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileCheck size={15} />
                    </div>
                    <span className="hospital-review-title">
                      সরকারি লাইসেন্স ও নথিপত্র ({toBengaliNumber(activeDocumentCount)}টি)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="hospital-review-edit-btn"
                    title="ধাপ ৩ এডিট করুন"
                  >
                    <Edit3 size={12} />
                    <span>এডিট</span>
                  </button>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div className="hospital-review-label" style={{ marginBottom: 3 }}>
                    লাইসেন্স বা ডিজিএইচএস (DGHS) রেজিস্ট্রেশন নম্বর
                  </div>
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
                    {formData.license_number || '—'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Document 1: DGHS License Doc */}
                  {formData.documents?.hospital_license_doc ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10,
                      gap: 8
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <FileText size={16} style={{ color: '#0284C7', flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            DGHS রেজিস্ট্রেশন সনদপত্র
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {formData.documents.hospital_license_doc.file_name} {formData.documents.hospital_license_doc.file_size ? `• ${formData.documents.hospital_license_doc.file_size}` : ''}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10.5,
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
                    <div style={{ fontSize: 12, color: '#DC2626', background: '#FEF2F2', padding: '7px 10px', borderRadius: 8, border: '1px solid #FECACA' }}>
                      ✕ DGHS রেজিস্ট্রেশন সনদপত্র আপলোড করা হয়নি
                    </div>
                  )}

                  {/* Document 2: Trade License Doc */}
                  {formData.documents?.hospital_trade_license_doc ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10,
                      gap: 8
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <FileText size={16} style={{ color: '#0284C7', flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            পৌরসভা / সিটি কর্পোরেশন ট্রেড লাইসেন্স
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {formData.documents.hospital_trade_license_doc.file_name} {formData.documents.hospital_trade_license_doc.file_size ? `• ${formData.documents.hospital_trade_license_doc.file_size}` : ''}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10.5,
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
                    <div style={{ fontSize: 12, color: '#DC2626', background: '#FEF2F2', padding: '7px 10px', borderRadius: 8, border: '1px solid #FECACA' }}>
                      ✕ পৌরসভা / সিটি কর্পোরেশন ট্রেড লাইসেন্স আপলোড করা হয়নি
                    </div>
                  )}
                </div>
              </div>

              {/* ── CARD 4: Executive Commission & Audit Assurance Card ── */}
              <div style={{
                background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
                border: '1.5px solid #A7F3D0',
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.08)'
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#00803D',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(0, 128, 61, 0.25)'
                }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13.5, fontWeight: 900, color: '#064E3B' }}>
                      ৳১,৫০০ পার্টনার কমিশন ও অ্যাডমিন অডিট নিশ্চিতকরণ
                    </span>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      background: '#00803D',
                      color: '#FFFFFF',
                      padding: '2px 7px',
                      borderRadius: 12
                    }}>
                      গ্যারান্টিযুক্ত
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#065F46', margin: 0, lineHeight: 1.5 }}>
                    আবেদনটি সাবমিট করার সাথে সাথে কেন্দ্রীয় <strong>Admin Onboarding Verification Desk</strong>-এ তালিকাভুক্ত হবে। সরকারি DGHS লাইসেন্স ও ট্রেড লাইসেন্স যাচাই সম্পন্ন হওয়ামাত্র আপনার ফিল্ড এজেন্ট ওয়ালেটে <strong>৳১,৫০০ কমিশন</strong> স্বয়ংক্রিয়ভাবে ক্রেডিট হবে।
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Wizard Navigation Controls ── */}
          <div className="hospital-wizard-nav-controls">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                disabled={submitting}
                className="hospital-wizard-btn-prev"
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

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="hospital-wizard-btn-next"
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
                className="hospital-wizard-btn-submit"
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

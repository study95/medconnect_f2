import React, { useState, useEffect } from 'react'
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
  Edit3
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import agentApi from '../../api/agentApi'
import axiosInstance from '../../api/axiosInstance'
import PresignedDropzone from '../../features/agent/components/PresignedDropzone'
import { getMediaUrl } from '../../utils/mediaUtils'

export default function HospitalOnboardWizardPage() {
  const navigate = useNavigate()
  const { user, isAdmin, isSuperAdmin } = useAuth()
  const isAgentSuspended = !isAdmin && !isSuperAdmin && (user?.agent?.status === 'suspended' || user?.agent?.status === 'inactive')

  const [searchParams] = useSearchParams()
  const editCode = searchParams.get('edit_code')
  const [isEditingRevision, setIsEditingRevision] = useState(false)
  const [revisionOriginalRequest, setRevisionOriginalRequest] = useState(null)
  const [loadingEditData, setLoadingEditData] = useState(false)

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

  const [formData, setFormData] = useState({
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
      toast.error(err)
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
      toast.error(err)
      setCurrentStep(3)
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
        toast.success('হাসপাতাল অনবোর্ডিং আবেদন সফলভাবে জমা দেওয়া হয়েছে! অ্যাডমিন যাচাইয়ের জন্য অপেক্ষমাণ।')
        navigate('/agent/tracker')
      }
    } catch (err) {
      console.error('Hospital onboarding submission failed:', err)
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
        else extracted.push('হাসপাতাল অনবোর্ডিং আবেদন জমা দিতে সমস্যা হয়েছে। তথ্য যাচাই করুন।')
      }

      setErrorList(extracted)
      setErrorMessage(extracted[0] || 'Submission failed')
      toast.error(extracted[0] || 'Submission failed')

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
  const selectedDivisionName = divisions.find(d => String(d.id) === String(formData.division_id))?.name || ''
  const selectedDistrictName = districts.find(d => String(d.id) === String(formData.district_id))?.name || ''
  const selectedUpazilaName = upazilas.find(u => String(u.id) === String(formData.upazila_id))?.name || ''
  const selectedUnionName = unions.find(u => String(u.id) === String(formData.union_id))?.name || ''

  return (
    <div style={{ minHeight: '100%', background: '#F8FAFC' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px 48px' }}>
        
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
              <Building2 size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                {isEditingRevision ? 'হাসপাতাল আবেদন সংশোধন ফর্ম' : 'নতুন হাসপাতাল অনবোর্ডিং ফর্ম'}
              </h1>
              <p style={{ fontSize: 13, color: '#64748B', margin: '3px 0 0' }}>
                {isEditingRevision 
                  ? `আবেদন কোড: ${editCode} • এডমিনের মন্তব্য অনুযায়ী সংশোধন করে পুনরায় জমা দিন`
                  : <>হাসপাতালের তথ্য, লোকেশন ও লাইসেন্স যাচাইয়ের জন্য জমা দিন। অনুমোদন সাপেক্ষে <strong>৳১,৫০০ কমিশন</strong> লাভ করুন।</>}
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
            <span>ধাপ {currentStep} / ৪</span>
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
        {(errorList.length > 0 || errorMessage) && (
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
            {errorMessage && <div style={{ marginBottom: 4, fontWeight: 600 }}>{errorMessage}</div>}
            {errorList.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 22, lineHeight: 1.5 }}>
                {errorList.map((err, i) => (
                  <li key={i}>{typeof err === 'string' ? err : JSON.stringify(err)}</li>
                ))}
              </ul>
            )}
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                {/* Hospital English Name */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    হাসপাতালের নাম (English) *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Popular Diagnostic Centre & Hospital"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: 10,
                      border: `1.5px solid ${getFieldError('name') ? '#EF4444' : '#CBD5E1'}`,
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {getFieldError('name') && (
                    <span style={{ fontSize: 11.5, color: '#DC2626', marginTop: 4, display: 'block' }}>
                      {getFieldError('name')}
                    </span>
                  )}
                </div>

                {/* Hospital Bengali Name */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
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
                      padding: '11px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Hospital Type */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    হাসপাতালের ধরন *
                  </label>
                  <select
                    name="hospital_type"
                    value={formData.hospital_type}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: 10,
                      border: `1.5px solid ${getFieldError('hospital_type') ? '#EF4444' : '#CBD5E1'}`,
                      fontSize: 14,
                      outline: 'none',
                      background: '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="private">প্রাইভেট হাসপাতাল (Private Hospital)</option>
                    <option value="clinic">ক্লিনিক (Clinic)</option>
                    <option value="diagnostic">ডায়াগনস্টিক সেন্টার (Diagnostic Centre)</option>
                    <option value="public">সরকারি হাসপাতাল (Government / Public)</option>
                  </select>
                </div>

                {/* Official Phone */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    অফিসিয়াল মোবাইল নম্বর *
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
                        padding: '11px 14px 11px 36px',
                        borderRadius: 10,
                        border: `1.5px solid ${getFieldError('phone') ? '#EF4444' : '#CBD5E1'}`,
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <Phone size={15} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 14 }} />
                  </div>
                  {getFieldError('phone') && (
                    <span style={{ fontSize: 11.5, color: '#DC2626', marginTop: 4, display: 'block' }}>
                      {getFieldError('phone')}
                    </span>
                  )}
                </div>

                {/* Official Email */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
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
                        padding: '11px 14px 11px 36px',
                        borderRadius: 10,
                        border: `1.5px solid ${getFieldError('email') ? '#EF4444' : '#CBD5E1'}`,
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <Mail size={15} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 14 }} />
                  </div>
                  {getFieldError('email') && (
                    <span style={{ fontSize: 11.5, color: '#DC2626', marginTop: 4, display: 'block' }}>
                      {getFieldError('email')}
                    </span>
                  )}
                </div>

                {/* Emergency Hotline */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
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
                        padding: '11px 14px 11px 36px',
                        borderRadius: 10,
                        border: '1.5px solid #CBD5E1',
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <PhoneCall size={15} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 14 }} />
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18, marginBottom: 24 }}>
                {/* Division */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    বিভাগ (Division) *
                  </label>
                  <select
                    name="division_id"
                    value={formData.division_id}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
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
                    <span style={{ fontSize: 11.5, color: '#DC2626', marginTop: 4, display: 'block' }}>
                      {getFieldError('division_id')}
                    </span>
                  )}
                </div>

                {/* District */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    জেলা (District) *
                  </label>
                  <select
                    name="district_id"
                    value={formData.district_id}
                    onChange={handleChange}
                    disabled={!formData.division_id || loadingDistricts}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
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
                    <span style={{ fontSize: 11.5, color: '#DC2626', marginTop: 4, display: 'block' }}>
                      {getFieldError('district_id')}
                    </span>
                  )}
                </div>

                {/* Upazila */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    উপজেলা / থানা (Upazila - ঐচ্ছিক)
                  </label>
                  <select
                    name="upazila_id"
                    value={formData.upazila_id}
                    onChange={handleChange}
                    disabled={!formData.district_id || loadingUpazilas}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
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
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    ইউনিয়ন / ওয়ার্ড (Union - ঐচ্ছিক)
                  </label>
                  <select
                    name="union_id"
                    value={formData.union_id}
                    onChange={handleChange}
                    disabled={!formData.upazila_id || loadingUnions}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
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

                {/* Detailed Physical Address */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    হাসপাতালের পূর্ণাঙ্গ ঠিকানা (রোড, হোল্ডিং বা এলাকার নাম) *
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
                  />
                  {getFieldError('address') && (
                    <span style={{ fontSize: 11.5, color: '#DC2626', marginTop: 4, display: 'block' }}>
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
                padding: '20px 22px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#065F46', display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Navigation size={17} color="#059669" />
                      জিপিএস লোকেশন সনাক্তকরণ (GPS Geolocation)
                    </h4>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#047857' }}>
                      হাসপাতালে উপস্থিত থাকলে নিচের বাটনে ক্লিক করে এক চাপেই ডিভাইসের জিপিএস অবস্থান যুক্ত করুন।
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#065F46', marginBottom: 4 }}>
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
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1px solid #A7F3D0',
                        fontSize: 13,
                        background: '#FFFFFF',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#065F46', marginBottom: 4 }}>
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
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1px solid #A7F3D0',
                        fontSize: 13,
                        background: '#FFFFFF',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#065F46', marginBottom: 4 }}>
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
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1px solid #A7F3D0',
                        fontSize: 13,
                        background: '#FFFFFF',
                        boxSizing: 'border-box'
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
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  ট্রেড লাইসেন্স বা ডিজিএইচএস (DGHS) রেজিস্ট্রেশন নম্বর *
                </label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleChange}
                  placeholder="e.g. DGHS-REG-10482 বা TRADE/DHAKA/2026/8912"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${getFieldError('license_number') ? '#EF4444' : '#CBD5E1'}`,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                {getFieldError('license_number') && (
                  <span style={{ fontSize: 11.5, color: '#DC2626', marginTop: 4, display: 'block' }}>
                    {getFieldError('license_number')}
                  </span>
                )}
                <span style={{ fontSize: 11.5, color: '#64748B', marginTop: 4, display: 'block' }}>
                  স্বাস্থ্য অধিদপ্তর কর্তৃক প্রদত্ত লাইসেন্স বা পৌরসভা/সিটি কর্পোরেশনের ট্রেড লাইসেন্স নম্বর।
                </span>
              </div>

              {/* Guidance Info Banner - Single Row Text */}
              <div style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 12,
                padding: '11px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 20
              }}>
                <ShieldCheck size={18} color="#059669" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#065F46', fontWeight: 600 }}>
                  <strong>নির্দেশনা:</strong> ডিজিএইচএস (DGHS) লাইসেন্স এবং ট্রেড লাইসেন্স উভয় সনদপত্র আপলোড করা বাধ্যতামূলক (অনুমোদিত ফরম্যাট: PDF, JPG, PNG বা WEBP • সর্বোচ্চ ১০ MB)।
                </span>
              </div>

              {/* Presigned Document Dropzones */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                {/* 1. DGHS License Doc (Required) */}
                <div style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 16,
                  padding: '16px 18px',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
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
                      <div style={{
                        fontSize: 13.5,
                        fontWeight: 800,
                        color: '#0F172A',
                        whiteSpace: 'nowrap'
                      }}>
                        DGHS লাইসেন্স / রেজিস্ট্রেশন সনদ
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10.5,
                      background: '#FEE2E2',
                      color: '#DC2626',
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontWeight: 800,
                      border: '1px solid #FECACA',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      বাধ্যতামূলক *
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B', paddingLeft: 40, marginTop: -4 }}>
                    স্বাস্থ্য অধিদপ্তর কর্তৃক অনুমোদিত সরকারি লাইসেন্স কপি
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
                    <span style={{ fontSize: 11.5, color: '#DC2626', marginTop: 2, display: 'block', fontWeight: 600 }}>
                      {getFieldError('document_keys')}
                    </span>
                  )}
                </div>

                {/* 2. Trade License Doc (Required) */}
                <div style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 16,
                  padding: '16px 18px',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
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
                      <div style={{
                        fontSize: 13.5,
                        fontWeight: 800,
                        color: '#0F172A',
                        whiteSpace: 'nowrap'
                      }}>
                        পৌরসভা / সিটি কর্পোরেশন ট্রেড লাইসেন্স
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10.5,
                      background: '#FEE2E2',
                      color: '#DC2626',
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontWeight: 800,
                      border: '1px solid #FECACA',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      বাধ্যতামূলক *
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B', paddingLeft: 40, marginTop: -4 }}>
                    হালনাগাদ ট্রেড লাইসেন্স বা ট্যাক্স সার্টিফিকেট
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
                    <span style={{ fontSize: 11.5, color: '#DC2626', marginTop: 2, display: 'block', fontWeight: 600 }}>
                      {getFieldError('document_keys')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP 4: Review, Confirm & Submit
             ═══════════════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    ধাপ ৪: চূড়ান্ত পর্যালোচনা ও সাবমিশন
                  </h2>
                  <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
                    প্রশাসনিক অডিটের জন্য সাবমিট করার পূর্বে হাসপাতালের সকল সংগৃহীত তথ্য ও প্রমাণপত্র যাচাই করুন।
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

              {/* ── CARD 1: Hospital Profile & Contact ── */}
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
                      <Building2 size={16} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>হাসপাতালের প্রাথমিক পরিচিতি ও যোগাযোগ</span>
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
                    <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>হাসপাতালের পূর্ণ নাম</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                      {formData.name} {formData.name_bn && <span style={{ fontSize: 12.5, fontWeight: 500, color: '#64748B' }}>({formData.name_bn})</span>}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>হাসপাতালের ধরন</div>
                    <div>
                      <span style={{
                        fontSize: 12,
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

                  <div>
                    <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>অফিসিয়াল মোবাইল</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={13} style={{ color: '#00803D' }} />
                      <span>{formData.phone}</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>ইমেইল ঠিকানা</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mail size={13} style={{ color: '#0284C7' }} />
                      <span>{formData.email || '— (ঐচ্ছিক)'}</span>
                    </div>
                  </div>

                  {formData.hotline && (
                    <div>
                      <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>জরুরি হটলাইন</div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <PhoneCall size={13} style={{ color: '#8B5CF6' }} />
                        <span>{formData.hotline}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── CARD 2: Location, Address & GPS Coordinates ── */}
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
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>ভৌগোলিক এলাকা, ঠিকানা ও জিপিএস</span>
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
                    <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>প্রশাসনিক বিভাগ ও জেলা</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>
                      {selectedDistrictName || '—'}, {selectedDivisionName || '—'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>উপজেলা ও ইউনিয়ন</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0F172A' }}>
                      {selectedUpazilaName || '—'} {selectedUnionName && `(${selectedUnionName})`}
                    </div>
                  </div>

                  {formData.address && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>হাসপাতালের পূর্ণাঙ্গ ঠিকানা</div>
                      <div style={{ fontSize: 13, color: '#1E293B', fontWeight: 600, background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                        {formData.address}
                      </div>
                    </div>
                  )}

                  {formData.latitude && formData.longitude ? (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: 11.5, color: '#047857', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Navigation size={13} color="#059669" />
                        <span>জিপিএস কো-অর্ডিনেট: {formData.latitude}, {formData.longitude}</span>
                        {formData.google_map_url && (
                          <a href={formData.google_map_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0284C7', textDecoration: 'none', marginLeft: 8, fontSize: 12 }}>
                            (গুগল ম্যাপে দেখুন ↗)
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ gridColumn: '1 / -1', fontSize: 11.5, color: '#94A3B8', fontStyle: 'italic' }}>
                      জিপিএস কো-অর্ডিনেট ইনপুট দেওয়া হয়নি
                    </div>
                  )}
                </div>
              </div>

              {/* ── CARD 3: License & Verification Documents ── */}
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
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>সরকারি লাইসেন্স ও সংযুক্ত নথিপত্র</span>
                      <span style={{ fontSize: 12, color: '#64748B', marginLeft: 8 }}>({activeDocumentCount}টি ফাইল সংযুক্ত)</span>
                    </div>
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

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                    লাইসেন্স বা ডিজিএইচএস (DGHS) রেজিস্ট্রেশন নম্বর
                  </div>
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
                      padding: '10px 14px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileText size={18} style={{ color: '#0284C7' }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                            DGHS রেজিস্ট্রেশন সনদপত্র
                          </div>
                          <div style={{ fontSize: 11.5, color: '#64748B' }}>
                            {formData.documents.hospital_license_doc.file_name} {formData.documents.hospital_license_doc.file_size ? `• ${formData.documents.hospital_license_doc.file_size}` : ''}
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
                    <div style={{ fontSize: 12.5, color: '#DC2626', background: '#FEF2F2', padding: '8px 12px', borderRadius: 8, border: '1px solid #FECACA' }}>
                      ✕ DGHS রেজিস্ট্রেশন সনদপত্র আপলোড করা হয়নি
                    </div>
                  )}

                  {/* Document 2: Trade License Doc */}
                  {formData.documents?.hospital_trade_license_doc ? (
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
                            পৌরসভা / সিটি কর্পোরেশন ট্রেড লাইসেন্স
                          </div>
                          <div style={{ fontSize: 11.5, color: '#64748B' }}>
                            {formData.documents.hospital_trade_license_doc.file_name} {formData.documents.hospital_trade_license_doc.file_size ? `• ${formData.documents.hospital_trade_license_doc.file_size}` : ''}
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
                    <div style={{ fontSize: 12.5, color: '#DC2626', background: '#FEF2F2', padding: '8px 12px', borderRadius: 8, border: '1px solid #FECACA' }}>
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
                      ৳১,৫০০ পার্টনার কমিশন ও অ্যাডমিন অডিট নিশ্চিতকরণ
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
                    আবেদনটি সাবমিট করার সাথে সাথে কেন্দ্রীয় <strong>Admin Onboarding Verification Desk</strong>-এ তালিকাভুক্ত হবে। সরকারি DGHS লাইসেন্স ও ট্রেড লাইসেন্স যাচাই সম্পন্ন হওয়ামাত্র আপনার ফিল্ড এজেন্ট ওয়ালেটে <strong>৳১,৫০০ কমিশন</strong> স্বয়ংক্রিয়ভাবে ক্রেডিট হবে।
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

            {currentStep < 4 ? (
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

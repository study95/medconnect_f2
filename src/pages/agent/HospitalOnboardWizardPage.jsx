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
  FileText,
  Building,
  Navigation
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import agentApi from '../../api/agentApi'
import axiosInstance from '../../api/axiosInstance'
import PresignedDropzone from '../../features/agent/components/PresignedDropzone'

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
                  preview_url: `/storage/${key}`
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
      if (!formData.email.trim()) {
        errs.email = 'অফিসিয়াল ইমেইল অ্যাড্রেস আবশ্যক।'
      } else if (!formData.email.includes('@')) {
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
        email: formData.email.trim(),
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
    { num: 1, label: 'পরিচয়', desc: 'নাম ও যোগাযোগ', icon: Building2 },
    { num: 2, label: 'লোকেশন ও জিপিএস', desc: 'ঠিকানা ও কো-অর্ডিনেট', icon: MapPin },
    { num: 3, label: 'লাইসেন্স ও ফাইল', desc: 'DGHS সনদপত্র', icon: FileCheck },
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
    <div style={{ minHeight: '100%', background: '#F8FAFC', paddingBottom: 60 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px 48px' }}>
        
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748B', marginBottom: 16 }}>
          <Link to="/agent" style={{ color: 'inherit', textDecoration: 'none' }}>Partner Desk</Link>
          <ChevronRight size={13} />
          <span>Onboarding</span>
          <ChevronRight size={13} />
          <span style={{ color: '#059669', fontWeight: 700 }}>
            {isEditingRevision ? `Edit Application #${editCode}` : 'Hospital Onboarding'}
          </span>
        </div>

        {/* Page Header */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          padding: '24px 28px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)'
              }}>
                <Building2 size={20} />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                {isEditingRevision ? 'হাসপাতাল আবেদন সংশোধন ফর্ম' : 'নতুন হাসপাতাল অনবোর্ডিং ফর্ম'}
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
              হাসপাতালের তথ্য, বিভাগ-জেলা-উপজেলা এবং সঠিক জিপিএস লোকেশন ইনপুট দিয়ে লাইসেন্স সনদপত্র আপলোড করুন।
            </p>
          </div>

          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 12,
            padding: '8px 14px',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
              অ্যাপ্রুভাল কমিশন
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#065F46' }}>
              ৳১,৫০০ <span style={{ fontSize: 11, fontWeight: 600 }}>/ হাসপাতাল</span>
            </div>
          </div>
        </div>

        {/* Revision Alert Banner (If editing) */}
        {isEditingRevision && revisionOriginalRequest?.admin_notes && (
          <div style={{
            marginBottom: 24,
            padding: '16px 20px',
            background: '#FEF2F2',
            border: '1.5px solid #FECACA',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12
          }}>
            <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 800, color: '#991B1B', fontSize: 13.5, marginBottom: 2 }}>
                অ্যাডমিনের সংশোধনের নির্দেশনা:
              </div>
              <div style={{ color: '#7F1D1D', fontSize: 13, lineHeight: 1.5 }}>
                "{revisionOriginalRequest.admin_notes}"
              </div>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div style={{
            marginBottom: 24,
            padding: '14px 18px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#B91C1C',
            fontSize: 13
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, fontWeight: 600 }}>{errorMessage}</div>
          </div>
        )}

        {/* Stepper Header HUD */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
          marginBottom: 24
        }}>
          {steps.map((st) => {
            const isDone = st.num < currentStep
            const isActive = st.num === currentStep
            const StepIcon = st.icon

            return (
              <div
                key={st.num}
                onClick={() => {
                  if (st.num < currentStep) setCurrentStep(st.num)
                }}
                style={{
                  background: isActive ? '#FFFFFF' : (isDone ? '#F0FDF4' : '#FFFFFF'),
                  border: isActive ? '2px solid #10B981' : (isDone ? '1px solid #BBF7D0' : '1px solid #E2E8F0'),
                  borderRadius: 14,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: isDone ? 'pointer' : 'default',
                  boxShadow: isActive ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: isActive ? '#10B981' : (isDone ? '#059669' : '#F1F5F9'),
                  color: (isActive || isDone) ? '#FFFFFF' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 13,
                  flexShrink: 0
                }}>
                  {isDone ? <Check size={16} strokeWidth={3} /> : <StepIcon size={16} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: isActive ? '#059669' : '#94A3B8', textTransform: 'uppercase' }}>
                    ধাপ {st.num}
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {st.label}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Wizard Card Body */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          padding: '32px 32px',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)'
        }}>

          {/* ═══════════════════════════════════════════════════════
              STEP 1: Hospital Identity & Contact Details
             ═══════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div>
              <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #F1F5F9' }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={19} color="#10B981" />
                  হাসপাতালের প্রাথমিক পরিচিতি ও যোগাযোগ
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
                  হাসপাতালের অফিশিয়াল নাম, ধরন এবং যোগাযোগের মোবাইল ও ইমেইল নম্বর প্রদান করুন।
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
                    অফিসিয়াল ইমেইল অ্যাড্রেস *
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
              <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #F1F5F9' }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={19} color="#10B981" />
                  হাসপাতালের লোকেশন ও জিপিএস কো-অর্ডিনেট
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
                  প্রশাসনিক এলাকা নির্বাচন করুন এবং জিপিএস দিয়ে সঠিক অক্ষাংশ ও দ্রাঘিমাংশ সেট করুন।
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
              <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #F1F5F9' }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileCheck size={19} color="#10B981" />
                  লাইসেন্স ও ভেরিফিকেশন সনদপত্র
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
                  স্বাস্থ্য অধিদপ্তর (DGHS) লাইসেন্স নম্বর দিন এবং প্রয়োজনীয় সনদপত্র আপলোড করুন।
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

              {/* Presigned Document Dropzones */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                {/* 1. DGHS License Doc (Required) */}
                <div>
                  <PresignedDropzone
                    category="hospital_license"
                    label="DGHS রেজিস্ট্রেশন / অনুমোদন সনদপত্র *"
                    required
                    existingKey={formData.documents?.hospital_license_doc?.file_key}
                    existingFileName={formData.documents?.hospital_license_doc?.name || formData.documents?.hospital_license_doc?.file_name}
                    existingFileSize={formData.documents?.hospital_license_doc?.file_size}
                    onUploadSuccess={(category, fileKey, fileName, fileSizeText) =>
                      handleDocumentUploaded('hospital_license_doc', fileKey, fileName, fileSizeText)
                    }
                    onRemove={() => handleDocumentRemoved('hospital_license_doc')}
                  />
                  {getFieldError('document_keys') && !formData.documents?.hospital_license_doc?.file_key && (
                    <span style={{ fontSize: 11.5, color: '#DC2626', marginTop: 6, display: 'block' }}>
                      {getFieldError('document_keys')}
                    </span>
                  )}
                </div>

                {/* 2. Trade License Doc (Optional) */}
                <div>
                  <PresignedDropzone
                    category="hospital_trade_license"
                    label="ট্রেড লাইসেন্স বা ট্যাক্স সার্টিফিকেট (ঐচ্ছিক)"
                    existingKey={formData.documents?.hospital_trade_license_doc?.file_key}
                    existingFileName={formData.documents?.hospital_trade_license_doc?.name || formData.documents?.hospital_trade_license_doc?.file_name}
                    existingFileSize={formData.documents?.hospital_trade_license_doc?.file_size}
                    onUploadSuccess={(category, fileKey, fileName, fileSizeText) =>
                      handleDocumentUploaded('hospital_trade_license_doc', fileKey, fileName, fileSizeText)
                    }
                    onRemove={() => handleDocumentRemoved('hospital_trade_license_doc')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP 4: Review, Confirm & Submit
             ═══════════════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <div>
              <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #F1F5F9' }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={19} color="#10B981" />
                  আবেদনের তথ্য চূড়ান্ত পর্যালোচনা ও জমা
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
                  সাবমিট করার পূর্বে সকল তথ্য ও আপলোডকৃত ফাইলসমূহ সতর্কতার সাথে যাচাই করুন।
                </p>
              </div>

              {/* Review Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18, marginBottom: 24 }}>
                {/* Identity Summary Card */}
                <div style={{ background: '#F8FAFC', padding: '16px 18px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building2 size={14} color="#10B981" /> হাসপাতালের পরিচিতি
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                    {formData.name}
                  </div>
                  {formData.name_bn && (
                    <div style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>
                      {formData.name_bn}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: '#334155' }}>
                    <div><strong>ধরন:</strong> {formData.hospital_type.toUpperCase()}</div>
                    <div><strong>ফোন:</strong> {formData.phone}</div>
                    <div><strong>ইমেইল:</strong> {formData.email}</div>
                    {formData.hotline && <div><strong>হটলাইন:</strong> {formData.hotline}</div>}
                  </div>
                </div>

                {/* Location & GPS Summary Card */}
                <div style={{ background: '#F8FAFC', padding: '16px 18px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} color="#059669" /> অবস্থান ও জিপিএস কো-অর্ডিনেট
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                    {[selectedUnionName, selectedUpazilaName, selectedDistrictName, selectedDivisionName].filter(Boolean).join(', ') || 'এলাকা নির্ধারিত হয়নি'}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#475569', marginBottom: 10 }}>
                    <strong>ঠিকানা:</strong> {formData.address || 'প্রদান করা হয়নি'}
                  </div>
                  {formData.latitude && formData.longitude ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ECFDF5', color: '#065F46', padding: '4px 10px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, border: '1px solid #A7F3D0' }}>
                      <CheckCircle2 size={13} color="#059669" />
                      GPS: {formData.latitude}, {formData.longitude}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11.5, color: '#94A3B8', fontStyle: 'italic' }}>
                      জিপিএস কো-অর্ডিনেট ইনপুট দেওয়া হয়নি
                    </div>
                  )}
                </div>

                {/* License & Documents Summary Card */}
                <div style={{ gridColumn: 'span 2', background: '#F8FAFC', padding: '16px 18px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileCheck size={14} color="#059669" /> লাইসেন্স ও আপলোডকৃত নথিপত্র
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
                    লাইসেন্স / DGHS নম্বর: <span style={{ color: '#059669' }}>{formData.license_number}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <div style={{ padding: '8px 12px', background: formData.documents?.hospital_license_doc ? '#F0FDF4' : '#FEF2F2', borderRadius: 8, border: `1px solid ${formData.documents?.hospital_license_doc ? '#BBF7D0' : '#FECACA'}`, fontSize: 12 }}>
                      <span style={{ fontWeight: 700, color: formData.documents?.hospital_license_doc ? '#166534' : '#DC2626' }}>
                        {formData.documents?.hospital_license_doc ? '✓ DGHS সনদপত্র আপলোড করা হয়েছে' : '✕ DGHS সনদপত্র পাওয়া যায়নি'}
                      </span>
                    </div>
                    <div style={{ padding: '8px 12px', background: formData.documents?.hospital_trade_license_doc ? '#F0FDF4' : '#F8FAFC', borderRadius: 8, border: `1px solid ${formData.documents?.hospital_trade_license_doc ? '#BBF7D0' : '#E2E8F0'}`, fontSize: 12 }}>
                      <span style={{ fontWeight: 600, color: formData.documents?.hospital_trade_license_doc ? '#166534' : '#64748B' }}>
                        {formData.documents?.hospital_trade_license_doc ? '✓ ট্রেড লাইসেন্স সংযুক্ত হয়েছে' : 'ট্রেড লাইসেন্স দেওয়া হয়নি (ঐচ্ছিক)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commission Confirmation Box */}
              <div style={{
                background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
                border: '1.5px solid #A7F3D0',
                borderRadius: 14,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Building2 size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#065F46' }}>
                    অ্যাডমিন ভেরিফিকেশন ও স্বয়ংক্রিয় পে-আউট কমিশন
                  </div>
                  <div style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>
                    আবেদনটি জমা দেওয়ার পর কেন্দ্রীয় অ্যাডমিন টিম নথিপত্র ও লাইসেন্স যাচাই করবে। অনুমোদন হওয়া মাত্রই আপনার ওয়ালেটে <strong>৳১,৫০০ কমিশন</strong> ক্রেডিট হবে।
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Action Footer Controls */}
          <div style={{
            marginTop: 32,
            paddingTop: 20,
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                disabled={submitting}
                style={{
                  background: '#FFFFFF',
                  color: '#475569',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: 10,
                  padding: '10px 20px',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <ArrowLeft size={15} />
                <span>পূর্ববর্তী ধাপ</span>
              </button>
            ) : (
              <Link
                to="/agent/tracker"
                style={{
                  color: '#64748B',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                ← ফিরে যান
              </Link>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                style={{
                  background: '#059669',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 24px',
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                }}
              >
                <span>পরবর্তী ধাপ</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  background: submitting ? '#94A3B8' : '#059669',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 10,
                  padding: '11px 28px',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
                }}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                <span>{submitting ? 'জমা দেওয়া হচ্ছে...' : (isEditingRevision ? 'সংশোধিত আবেদন জমা দিন' : 'চূড়ান্ত আবেদন জমা দিন')}</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}

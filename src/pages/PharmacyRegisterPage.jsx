import React, { useState, useEffect, useRef } from 'react'
import { Container, Row, Col, Form, Spinner, Modal } from 'react-bootstrap'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import BreadcrumbHUD from '../components/common/BreadcrumbHUD'
import {
  IconBuildingStore, IconUser, IconPhone, IconMail, IconMapPin, IconClock,
  IconTruck, IconShieldCheck, IconUpload, IconFileText, IconAlertCircle,
  IconCheck, IconCircleCheck, IconLock, IconArrowRight, IconHeart,
  IconFileCheck, IconSparkles, IconInfoCircle, IconDiscount2, IconExternalLink,
  IconCamera, IconX, IconFileTypePdf, IconPhoto, IconBuildingHospital,
  IconArrowLeft, IconCircleDot, IconCertificate, IconMoon, IconEdit, IconTrash, IconEye
} from '@tabler/icons-react'
import { useAuth } from '../context/AuthContext'
import { getMyPharmacy, savePharmacy } from '../api/pharmacyApi'
import { getDivisions, getDistricts, getUpazilas, getUnions } from '../api/locationApi'

const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBn = (str) => str !== null && str !== undefined && str !== '' ? String(str).replace(/\d/g, d => enToBn[d] || d) : ''

const PHARMACY_TYPES = [
  {
    id: 'retail',
    label: 'খুচরা ফার্মেসি',
    sub: 'সাধারণ রিটেল মেডিকেল স্টোর',
    icon: <IconBuildingStore size={22} />
  },
  {
    id: 'model_pharmacy',
    label: 'মডেল ফার্মেসি',
    sub: 'GDP ও ডিজিডিএ মানসম্মত মডেল শপ',
    icon: <IconShieldCheck size={22} />
  },
  {
    id: 'hospital_attached',
    label: 'হাসপাতাল সংলগ্ন',
    sub: 'ক্লিনিক বা হাসপাতালের ফার্মেসি',
    icon: <IconBuildingHospital size={22} />
  },
  {
    id: 'wholesaler',
    label: 'পাইকারি ও খুচরা',
    sub: 'হোলসেল ও রিটেল ড্রাগ ডিস্ট্রিবিউশন',
    icon: <IconTruck size={22} />
  },
]

export default function PharmacyRegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isLoggedIn, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isExisting, setIsExisting] = useState(false)
  const [isEditMode, setIsEditMode] = useState(true)
  const [pharmacyData, setPharmacyData] = useState(null)
  const [previewDocModal, setPreviewDocModal] = useState(null)

  // Form Fields
  const [name, setName] = useState('')
  const [proprietorName, setProprietorName] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [alternateContactNumber, setAlternateContactNumber] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [email, setEmail] = useState('')
  const [pharmacyType, setPharmacyType] = useState('retail')

  // Location Cascade Dropdown States
  const [divisionId, setDivisionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [upazilaId, setUpazilaId] = useState('')
  const [unionId, setUnionId] = useState('')
  const [villageOrArea, setVillageOrArea] = useState('')
  const [addressLine, setAddressLine] = useState('')
  const [googleMapsLink, setGoogleMapsLink] = useState('')

  // Operations & Services
  const [is24Hours, setIs24Hours] = useState(false)
  const [openingTime, setOpeningTime] = useState('08:00')
  const [closingTime, setClosingTime] = useState('23:00')
  const [isHomeDelivery, setIsHomeDelivery] = useState(false)
  const [deliveryNote, setDeliveryNote] = useState('')
  const [discountPercentage, setDiscountPercentage] = useState('0')
  const [hasPharmacist, setHasPharmacist] = useState(false)

  // Legal Documents & Numbers
  const [drugLicenseNumber, setDrugLicenseNumber] = useState('')
  const [drugLicenseFile, setDrugLicenseFile] = useState(null)
  const [hasExistingDrugLicense, setHasExistingDrugLicense] = useState(false)
  const [drugLicenseUrl, setDrugLicenseUrl] = useState('')
  const [drugLicenseExt, setDrugLicenseExt] = useState('')

  const [nidNumber, setNidNumber] = useState('')
  const [nidFile, setNidFile] = useState(null)
  const [hasExistingNid, setHasExistingNid] = useState(false)
  const [nidDocUrl, setNidDocUrl] = useState('')
  const [nidDocExt, setNidDocExt] = useState('')

  const [tradeLicenseNumber, setTradeLicenseNumber] = useState('')
  const [tradeLicenseFile, setTradeLicenseFile] = useState(null)
  const [hasExistingTradeLicense, setHasExistingTradeLicense] = useState(false)
  const [tradeLicenseUrl, setTradeLicenseUrl] = useState('')
  const [tradeLicenseExt, setTradeLicenseExt] = useState('')

  const [pharmacistRegNo, setPharmacistRegNo] = useState('')
  const [pharmacistCertFile, setPharmacistCertFile] = useState(null)
  const [hasExistingPharmacistCert, setHasExistingPharmacistCert] = useState(false)
  const [pharmacistCertUrl, setPharmacistCertUrl] = useState('')
  const [pharmacistCertExt, setPharmacistCertExt] = useState('')
  const [removePharmacistCert, setRemovePharmacistCert] = useState(false)

  // Visual (Single Image for Pharmacy / Shop)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [removeImage, setRemoveImage] = useState(false)

  // Validation & UI State
  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Dropdown list arrays
  const [divisions, setDivisions] = useState([])
  const [districts, setDistricts] = useState([])
  const [upazilas, setUpazilas] = useState([])
  const [unions, setUnions] = useState([])

  const altContactRef = useRef(null)
  const [showAltPhoneHint, setShowAltPhoneHint] = useState(false)
  const initialLoadedRef = useRef(false)

  const clearError = (field) => {
    setFieldErrors(prev => {
      if (!prev[field]) return prev
      const copy = { ...prev }
      delete copy[field]
      return copy
    })
  }

  // Smooth auto-scroll to the first field that failed validation
  const scrollToFirstError = (errors) => {
    const fieldOrder = [
      'name', 'proprietor_name', 'contact_number', 'alternate_contact_number', 'whatsapp_number',
      'division_id', 'district_id', 'upazila_id', 'union_id', 'village_or_area', 'address_line',
      'opening_time', 'closing_time', 'drug_license_number', 'drug_license_file',
      'nid_number', 'nid_file', 'trade_license_number', 'trade_license_file'
    ]

    const errorKeys = Object.keys(errors)
    const firstKey = fieldOrder.find(k => errorKeys.includes(k)) || errorKeys[0]
    if (!firstKey) return

    setTimeout(() => {
      const el = document.getElementById(`field-${firstKey}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('field-highlight-error')
        setTimeout(() => el.classList.remove('field-highlight-error'), 2500)
        const focusable = el.querySelector('input, select') || (el.tagName === 'INPUT' || el.tagName === 'SELECT' ? el : null)
        if (focusable) {
          try { focusable.focus({ preventScroll: true }) } catch {}
        }
      }
    }, 120)
  }

  // Load Divisions on mount
  useEffect(() => {
    getDivisions()
      .then(res => setDivisions(res.data?.data || []))
      .catch(() => {})
  }, [])

  // Cascade: Load Districts
  useEffect(() => {
    if (!divisionId) { setDistricts([]); return }
    getDistricts({ division_id: divisionId })
      .then(res => setDistricts(res.data?.data || []))
      .catch(() => {})
  }, [divisionId])

  // Cascade: Load Upazilas
  useEffect(() => {
    if (!districtId) { setUpazilas([]); return }
    getUpazilas({ district_id: districtId })
      .then(res => setUpazilas(res.data?.data || []))
      .catch(() => {})
  }, [districtId])

  // Cascade: Load Unions
  useEffect(() => {
    if (!upazilaId) { setUnions([]); return }
    getUnions({ upazila_id: upazilaId })
      .then(res => setUnions(res.data?.data || []))
      .catch(() => {})
  }, [upazilaId])

  const populateFormFromPharmacy = (p) => {
    if (!p) return
    setIsExisting(true)
    setPharmacyData(p)
    setName(p.name || '')
    setProprietorName(p.proprietor_name || '')
    setContactNumber(p.contact_number || '')
    setAlternateContactNumber(p.alternate_contact_number || '')
    setWhatsappNumber(p.whatsapp_number || '')
    setEmail(p.email || '')
    setPharmacyType(p.pharmacy_type || 'retail')

    setDivisionId(p.division_id ? String(p.division_id) : '')
    setDistrictId(p.district_id ? String(p.district_id) : '')
    setUpazilaId(p.upazila_id ? String(p.upazila_id) : '')
    setUnionId(p.union_id ? String(p.union_id) : '')
    setVillageOrArea(p.village_or_area || '')
    setAddressLine(p.address_line || '')
    setGoogleMapsLink(p.google_maps_link || '')

    setIs24Hours(Boolean(p.is_24_hours))
    if (p.opening_time) setOpeningTime(p.opening_time.substring(0, 5))
    if (p.closing_time) setClosingTime(p.closing_time.substring(0, 5))
    setIsHomeDelivery(Boolean(p.is_home_delivery_available))
    setDeliveryNote(p.delivery_note || '')
    setDiscountPercentage(String(p.discount_percentage || '0'))
    setHasPharmacist(Boolean(p.has_pharmacist))

    setDrugLicenseNumber(p.drug_license_number || '')
    setDrugLicenseFile(null)
    setHasExistingDrugLicense(Boolean(p.has_drug_license))
    setDrugLicenseUrl(p.drug_license_url || '')
    setDrugLicenseExt(p.drug_license_ext || '')

    setNidNumber(p.nid_number || '')
    setNidFile(null)
    setHasExistingNid(Boolean(p.has_nid_document))
    setNidDocUrl(p.nid_document_url || '')
    setNidDocExt(p.nid_document_ext || '')

    setTradeLicenseNumber(p.trade_license_number || '')
    setTradeLicenseFile(null)
    setHasExistingTradeLicense(Boolean(p.has_trade_license))
    setTradeLicenseUrl(p.trade_license_url || '')
    setTradeLicenseExt(p.trade_license_ext || '')

    setPharmacistRegNo(p.pharmacist_registration_no || '')
    setPharmacistCertFile(null)
    setHasExistingPharmacistCert(Boolean(p.has_pharmacist_certificate))
    setPharmacistCertUrl(p.pharmacist_certificate_url || '')
    setPharmacistCertExt(p.pharmacist_certificate_ext || '')
    setRemovePharmacistCert(false)

    setImageFile(null)
    setImagePreview(p.logo_url || p.banner_url || '')
    setRemoveImage(false)
  }

  // Load current pharmacy profile
  useEffect(() => {
    if (authLoading) return
    if (!isLoggedIn) {
      setLoading(false)
      return
    }

    if (initialLoadedRef.current) return
    initialLoadedRef.current = true

    getMyPharmacy()
      .then(res => {
        if (res.data?.success && res.data?.registered && res.data?.data) {
          populateFormFromPharmacy(res.data.data)
          setIsEditMode(false)
        } else {
          setIsEditMode(true)
          // Pre-fill proprietor name from user name if new
          if (user?.name) {
            setProprietorName(user.name)
          }
          if (user?.phone) {
            setContactNumber(user.phone)
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [authLoading, isLoggedIn, user])

  // Phone input formatting helpers
  const handlePhoneInput = (val, setter, fieldKey) => {
    const cleanDigits = val.replace(/\D/g, '').slice(0, 11)
    setter(cleanDigits)
    clearError(fieldKey)
  }

  const handlePhoneBlur = (val, fieldKey, required = false) => {
    if (!val) {
      if (required) {
        setFieldErrors(prev => ({ ...prev, [fieldKey]: 'মোবাইল নম্বর প্রদান করুন।' }))
      }
      return
    }
    if (!/^01[3-9]\d{8}$/.test(val)) {
      setFieldErrors(prev => ({ ...prev, [fieldKey]: 'সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমনঃ 017XXXXXXXX)।' }))
    }
  }

  // Handle Single Image Upload & Remove Preview
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setRemoveImage(false)
    }
    e.target.value = ''
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview('')
    setRemoveImage(true)
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})
    setGeneralError('')

    const clientErrors = {}
    if (!name.trim()) clientErrors.name = 'ফার্মেসির নাম প্রদান করুন।'
    if (!proprietorName.trim()) clientErrors.proprietor_name = 'মালিক / প্রোপাইটরের নাম প্রদান করুন।'
    if (!contactNumber.trim()) {
      clientErrors.contact_number = 'প্রধান মোবাইল নম্বর প্রদান করুন।'
    } else if (!/^01[3-9]\d{8}$/.test(contactNumber.trim())) {
      clientErrors.contact_number = 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমনঃ 017XXXXXXXX)।'
    }

    if (alternateContactNumber && !/^01[3-9]\d{8}$/.test(alternateContactNumber.trim())) {
      clientErrors.alternate_contact_number = 'সঠিক ১১ ডিজিটের বাংলাদেশী বিকল্প নম্বর দিন।'
    }

    if (whatsappNumber && !/^01[3-9]\d{8}$/.test(whatsappNumber.trim())) {
      clientErrors.whatsapp_number = 'সঠিক ১১ ডিজিটের বাংলাদেশী হোয়াটসঅ্যাপ নম্বর দিন।'
    }

    if (!divisionId) clientErrors.division_id = 'বিভাগ নির্বাচন করুন।'
    if (!districtId) clientErrors.district_id = 'জেলা নির্বাচন করুন।'
    if (!upazilaId) clientErrors.upazila_id = 'উপজেলা নির্বাচন করুন।'

    if (!is24Hours) {
      if (!openingTime) clientErrors.opening_time = 'খোলার সময় নির্ধারণ করুন।'
      if (!closingTime) clientErrors.closing_time = 'বন্ধের সময় নির্ধারণ করুন।'
    }

    // Legal Documents (Only validate on initial submission before Vault Lock)
    if (!isExisting) {
      if (!drugLicenseNumber.trim()) clientErrors.drug_license_number = 'ড্রাগ লাইসেন্স নম্বর প্রদান করা আবশ্যক।'
      if (!hasExistingDrugLicense && !drugLicenseFile) {
        clientErrors.drug_license_file = 'ড্রাগ লাইসেন্সের স্পষ্ট কপি আপলোড করুন।'
      }

      if (!nidNumber.trim()) clientErrors.nid_number = 'জাতীয় পরিচয়পত্র (NID) নম্বর প্রদান করুন।'
      if (!hasExistingNid && !nidFile) {
        clientErrors.nid_file = 'জাতীয় পরিচয়পত্রের (NID) ছবি/কপি আপলোড করুন।'
      }

      if (!tradeLicenseNumber.trim()) clientErrors.trade_license_number = 'ট্রেড লাইসেন্স নম্বর প্রদান করুন।'
      if (!hasExistingTradeLicense && !tradeLicenseFile) {
        clientErrors.trade_license_file = 'ট্রেড লাইসেন্সের ছবি/কপি আপলোড করুন।'
      }
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      scrollToFirstError(clientErrors)
      return
    }

    // If this is the very first submission, show final confirmation modal warning about Section 4 vault lock
    if (!isExisting) {
      setShowConfirmModal(true)
      return
    }

    await executeSavePharmacy()
  }

  // Execute actual API submission
  const executeSavePharmacy = async () => {
    setShowConfirmModal(false)
    setSaving(true)
    const formData = new FormData()
    formData.append('name', name.trim())
    formData.append('proprietor_name', proprietorName.trim())
    formData.append('contact_number', contactNumber.trim())
    if (alternateContactNumber) formData.append('alternate_contact_number', alternateContactNumber.trim())
    if (whatsappNumber) formData.append('whatsapp_number', whatsappNumber.trim())
    if (email) formData.append('email', email.trim())
    formData.append('pharmacy_type', pharmacyType)

    formData.append('division_id', divisionId)
    formData.append('district_id', districtId)
    formData.append('upazila_id', upazilaId)
    if (unionId) formData.append('union_id', unionId)
    if (villageOrArea) formData.append('village_or_area', villageOrArea.trim())
    if (addressLine) formData.append('address_line', addressLine.trim())
    if (googleMapsLink) formData.append('google_maps_link', googleMapsLink.trim())

    formData.append('is_24_hours', is24Hours ? '1' : '0')
    if (!is24Hours) {
      formData.append('opening_time', openingTime)
      formData.append('closing_time', closingTime)
    }
    formData.append('is_home_delivery_available', isHomeDelivery ? '1' : '0')
    if (deliveryNote) formData.append('delivery_note', deliveryNote.trim())
    formData.append('discount_percentage', discountPercentage || '0')
    formData.append('has_pharmacist', hasPharmacist ? '1' : '0')

    // Documents (Only append on initial submission; locked thereafter)
    if (!isExisting) {
      formData.append('drug_license_number', drugLicenseNumber.trim())
      if (drugLicenseFile) formData.append('drug_license_file', drugLicenseFile)

      formData.append('nid_number', nidNumber.trim())
      if (nidFile) formData.append('nid_file', nidFile)

      formData.append('trade_license_number', tradeLicenseNumber.trim())
      if (tradeLicenseFile) formData.append('trade_license_file', tradeLicenseFile)

      if (pharmacistRegNo) formData.append('pharmacist_registration_no', pharmacistRegNo.trim())
      if (pharmacistCertFile) {
        formData.append('pharmacist_certificate_file', pharmacistCertFile)
      }
    }

    if (imageFile) {
      formData.append('logo', imageFile)
      formData.append('remove_banner', '1')
    } else if (removeImage) {
      formData.append('remove_logo', '1')
      formData.append('remove_banner', '1')
    }

    try {
      const res = await savePharmacy(formData)
      if (res.data?.success) {
        setIsExisting(true)
        setPharmacyData(res.data.data)
        populateFormFromPharmacy(res.data.data)
        setIsEditMode(false)
        setSuccessMessage(res.data.message || 'ফার্মেসির আবেদন সফলভাবে জমা হয়েছে!')
        setShowSuccessModal(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (err) {
      if (err.response?.status === 422) {
        const serverErrors = err.response?.data?.errors || {}
        const normalized = {}
        for (const [k, v] of Object.entries(serverErrors)) {
          normalized[k] = Array.isArray(v) ? v[0] : String(v)
        }
        setFieldErrors(normalized)
        scrollToFirstError(normalized)
      } else {
        setGeneralError(err.response?.data?.message || 'সংরক্ষণ ব্যর্থ হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করুন।')
      }
    } finally {
      setSaving(false)
    }
  }

  // Micro-component: Custom Drag & Drop Document Vault Card
  const renderDocUploadCard = ({
    id,
    label,
    numberLabel,
    numberValue,
    onNumberChange,
    numberPlaceholder,
    numberError,
    fileError,
    selectedFile,
    onFileSelect,
    hasExisting,
    existingUrl,
    existingExt,
    onRemoveExisting,
    isLocked = false,
    isRequired = true,
    fileInputRefId,
    helpText,
    acceptedTypes = '.pdf,image/jpeg,image/png,image/webp'
  }) => {
    const isSelectedPdf = selectedFile ? (selectedFile.type?.includes('pdf') || selectedFile.name?.toLowerCase().endsWith('.pdf')) : false
    const selectedObjectUrl = selectedFile && !isSelectedPdf ? URL.createObjectURL(selectedFile) : null
    const isExistingPdf = existingExt === 'pdf'

    return (
      <div
        id={id}
        style={{
          background: isLocked ? '#F8FAFC' : '#FFFFFF',
          borderRadius: 18,
          border: (numberError || fileError) ? '1.5px solid #EF4444' : isLocked ? '1.5px solid #CBD5E1' : '1.5px solid #E2E8F0',
          padding: '20px',
          boxShadow: '0 4px 16px rgba(15,23,42,0.03)',
          transition: 'all 0.2s ease',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconShieldCheck size={18} color="#059669" />
              <span>{label}</span>
              {isRequired && <span style={{ color: '#EF4444' }}>*</span>}
            </span>
            {isLocked ? (
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#B45309',
                background: '#FEF3C7',
                border: '1px solid #FDE68A',
                padding: '2px 8px',
                borderRadius: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}>
                <IconLock size={12} /> লকড (অপরিবর্তনযোগ্য)
              </span>
            ) : hasExisting && !selectedFile ? (
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#065F46',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                padding: '2px 8px',
                borderRadius: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}>
                <IconCheck size={12} /> সংরক্ষিত
              </span>
            ) : null}
          </div>

          {/* Number Input */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4, display: 'block' }}>
              {numberLabel} {isRequired && <span style={{ color: '#EF4444' }}>*</span>}
            </label>
            <input
              type="text"
              value={numberValue}
              disabled={isLocked}
              readOnly={isLocked}
              onChange={e => !isLocked && onNumberChange(e.target.value)}
              placeholder={numberPlaceholder}
              className={`form-control-styled ${numberError ? 'has-field-error' : ''}`}
              style={{
                fontSize: 13,
                height: 42,
                ...(isLocked ? { background: '#F1F5F9', color: '#475569', cursor: 'not-allowed', fontWeight: 700 } : {})
              }}
            />
            {numberError && (
              <div className="field-error-text"><IconAlertCircle size={14} /><span>{numberError}</span></div>
            )}
          </div>

          {/* Dropzone / Upload Box */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>
              কাগজপত্রের ছবি বা পিডিএফ {isRequired && <span style={{ color: '#EF4444' }}>*</span>}
            </label>

            {!isLocked && (
              <input
                id={fileInputRefId}
                type="file"
                accept={acceptedTypes}
                onChange={e => {
                  onFileSelect(e.target.files[0] || null)
                  e.target.value = ''
                }}
                style={{ display: 'none' }}
              />
            )}

            {isLocked ? (
              <div style={{
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: 12,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}>
                {hasExisting && existingUrl ? (
                  <>
                    {isExistingPdf ? (
                      <div style={{
                        width: '100%',
                        height: 115,
                        borderRadius: 10,
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        color: '#DC2626'
                      }}>
                        <IconFileTypePdf size={38} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>সংরক্ষিত পিডিএফ (PDF) ডকুমেন্ট</span>
                      </div>
                    ) : (
                      <div
                        onClick={() => setPreviewDocModal({ title: label, url: existingUrl, isPdf: false })}
                        style={{
                          width: '100%',
                          height: 135,
                          borderRadius: 10,
                          overflow: 'hidden',
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <img
                          src={existingUrl}
                          alt={label}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setPreviewDocModal({ title: label, url: existingUrl, isPdf: isExistingPdf })}
                        style={{
                          background: '#ECFDF5',
                          border: '1px solid #A7F3D0',
                          color: '#047857',
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: 11.5,
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer'
                        }}
                      >
                        <IconEye size={14} /> বড় করে দেখুন
                      </button>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <IconLock size={13} /> অ্যাডমিন ব্যতীত পরিবর্তনযোগ্য নয়
                      </span>
                    </div>
                  </>
                ) : (
                  <div style={{
                    height: 110,
                    borderRadius: 10,
                    background: '#F8FAFC',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    color: '#94A3B8',
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    <IconLock size={20} />
                    <span>আবেদনের সময় কোনো ফাইল যুক্ত করা হয়নি</span>
                  </div>
                )}
              </div>
            ) : selectedFile ? (
              <div style={{
                background: '#F0FDF4',
                border: '1.5px solid #86EFAC',
                borderRadius: 12,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}>
                {selectedObjectUrl && (
                  <div style={{
                    width: '100%',
                    height: 125,
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: '#FFFFFF',
                    border: '1px solid #BBF7D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img
                      src={selectedObjectUrl}
                      alt={label}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isSelectedPdf ? <IconFileTypePdf size={19} /> : <IconPhoto size={19} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedFile.name}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#15803D', fontWeight: 600 }}>
                        নতুন ফাইল নির্বাচিত • {formatFileSize(selectedFile.size)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {selectedObjectUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewDocModal({ title: label, url: selectedObjectUrl, isPdf: false })}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #86EFAC',
                          color: '#15803D',
                          padding: '5px 10px',
                          borderRadius: 8,
                          fontSize: 11.5,
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer'
                        }}
                      >
                        <IconEye size={14} /> দেখুন
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onFileSelect(null)}
                      style={{
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        color: '#DC2626',
                        padding: '5px 10px',
                        borderRadius: 8,
                        fontSize: 11.5,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer'
                      }}
                      title="ফাইল মুছুন"
                    >
                      <IconTrash size={14} /> মুছুন
                    </button>
                  </div>
                </div>
              </div>
            ) : hasExisting ? (
              <div style={{
                background: '#F8FAFC',
                border: '1.5px solid #CBD5E1',
                borderRadius: 12,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}>
                {/* Live Thumbnail / PDF Preview of Saved Document */}
                {existingUrl ? (
                  isExistingPdf ? (
                    <div style={{
                      width: '100%',
                      height: 115,
                      borderRadius: 10,
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      color: '#DC2626'
                    }}>
                      <IconFileTypePdf size={38} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>সংরক্ষিত পিডিএফ (PDF) ডকুমেন্ট</span>
                    </div>
                  ) : (
                    <div
                      onClick={() => setPreviewDocModal({ title: label, url: existingUrl, isPdf: false })}
                      style={{
                        width: '100%',
                        height: 135,
                        borderRadius: 10,
                        overflow: 'hidden',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      <img
                        src={existingUrl}
                        alt={label}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                  )
                ) : null}

                {/* Action Bar: View | Change | Remove */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                  {existingUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewDocModal({ title: label, url: existingUrl, isPdf: isExistingPdf })}
                      style={{
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        color: '#047857',
                        padding: '6px 11px',
                        borderRadius: 8,
                        fontSize: 11.5,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer'
                      }}
                    >
                      <IconEye size={14} /> বড় করে দেখুন
                    </button>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                    <label
                      htmlFor={fileInputRefId}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        color: '#334155',
                        padding: '6px 11px',
                        borderRadius: 8,
                        fontSize: 11.5,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer',
                        margin: 0
                      }}
                    >
                      <IconUpload size={13} /> পরিবর্তন
                    </label>

                    {onRemoveExisting && (
                      <button
                        type="button"
                        onClick={onRemoveExisting}
                        style={{
                          background: '#FEF2F2',
                          border: '1px solid #FECACA',
                          color: '#DC2626',
                          padding: '6px 11px',
                          borderRadius: 8,
                          fontSize: 11.5,
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer'
                        }}
                      >
                        <IconTrash size={14} /> মুছুন
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <label
                htmlFor={fileInputRefId}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#F8FAFC',
                  border: '1.5px dashed #94A3B8',
                  borderRadius: 12,
                  padding: '20px 12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  margin: 0
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                  <IconUpload size={18} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                  ফাইল আপলোড করতে ক্লিক করুন
                </span>
                <span style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                  PDF, JPG, PNG বা WEBP (সর্বোচ্চ ৫ MB)
                </span>
              </label>
            )}

            {fileError && (
              <div className="field-error-text"><IconAlertCircle size={14} /><span>{fileError}</span></div>
            )}
          </div>
        </div>

        {helpText && (
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
            <IconInfoCircle size={13} style={{ flexShrink: 0 }} />
            <span>{helpText}</span>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <Spinner animation="border" style={{ color: '#059669', width: 44, height: 44 }} />
      </div>
    )
  }

  // Guest Gate: If user is not logged in, prompt to login with redirect back
  if (!isLoggedIn) {
    return (
      <div className="pharmacy-register-wrapper">
        <Container>
          <div style={{ marginBottom: 16 }}>
            <BreadcrumbHUD
              links={[
                { label: 'ফার্মেসি তালিকা', path: '/pharmacies' },
                { label: 'ফার্মেসি নিবন্ধন' }
              ]}
              variant="dark"
              showBack={false}
            />
          </div>

          <div style={{
            background: '#FFFFFF',
            borderRadius: 24,
            padding: '44px 24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 8px 30px rgba(15,23,42,0.06)',
            maxWidth: 560,
            margin: '20px auto 40px',
            textAlign: 'center'
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#ECFDF5', color: '#059669',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 18, border: '2px solid #A7F3D0',
              boxShadow: '0 6px 16px rgba(5,150,105,0.15)'
            }}>
              <IconBuildingStore size={36} />
            </div>

            <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: 22, marginBottom: 10 }}>
              ফার্মেসি তালিকাভুক্ত করতে লগইন করুন
            </h3>

            <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              আপনার ফার্মেসি ডক্টর বুকলেট প্ল্যাটফর্মে যুক্ত করে প্রতিদিন শত শত রোগীর কাছে সরাসরি প্রেসক্রিপশন ও ওষুধের অর্ডার পেতে একটি রেজিস্টার্ড একাউন্ট প্রয়োজন।
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 300, margin: '0 auto' }}>
              <Link
                to="/login"
                state={{ from: location.pathname }}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#FFFFFF',
                  padding: '12px 24px',
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 14.5,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 6px 20px rgba(5,150,105,0.28)'
                }}
              >
                <IconUser size={18} />
                লগইন বা সাইন-আপ করুন
              </Link>

              <Link
                to="/pharmacies"
                style={{
                  color: '#64748B',
                  fontWeight: 700,
                  fontSize: 13.5,
                  textDecoration: 'none',
                  padding: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <IconArrowLeft size={16} />
                ফার্মেসি তালিকায় ফিরে যান
              </Link>
            </div>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="pharmacy-register-wrapper">
      <style>{`
        .pharmacy-register-wrapper {
          background: #F8FAFC;
          min-height: 100vh;
          padding-bottom: 60px;
          font-family: 'Hind Siliguri', 'Inter', sans-serif;
        }

        @keyframes fieldErrorGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0); }
          50% { box-shadow: 0 0 0 5px rgba(225, 29, 72, 0.28); }
        }
        .field-highlight-error {
          animation: fieldErrorGlow 0.8s ease-in-out 3;
          border-radius: 14px;
        }
        .field-error-text {
          color: #E11D48;
          font-size: 12px;
          font-weight: 700;
          margin-top: 5px;
          display: flex;
          align-items: center;
          gap: 4px;
          line-height: 1.4;
        }
        .has-field-error {
          border-color: #E11D48 !important;
          box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.15) !important;
        }

        .form-section-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          font-weight: 800;
          color: #065F46;
          background: #ECFDF5;
          padding: 6px 14px;
          border-radius: 10px;
          border: 1px solid #A7F3D0;
          margin-bottom: 18px;
        }

        .form-label-styled {
          font-size: 13px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 6px;
          display: block;
        }

        .form-control-styled {
          width: 100%;
          height: 44px;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1.5px solid #CBD5E1;
          font-size: 14px;
          color: #0F172A;
          background: #FFFFFF;
          outline: none;
          transition: all 0.2s ease;
        }
        .form-control-styled:focus {
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15);
        }

        .input-icon-wrap {
          position: relative;
        }
        .input-icon-wrap .form-control-styled {
          padding-left: 40px;
        }
        .input-left-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        /* Pharmacy Type Card Grid */
        .type-grid-selector {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (max-width: 576px) {
          .type-grid-selector {
            grid-template-columns: 1fr;
          }
        }
        .type-card-item {
          padding: 14px;
          border-radius: 14px;
          border: 1.5px solid #E2E8F0;
          background: #FFFFFF;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .type-card-item:hover {
          border-color: #A7F3D0;
          background: #F0FDF4;
        }
        .type-card-item.active {
          border-color: #059669;
          background: #ECFDF5;
          box-shadow: 0 4px 14px rgba(5, 150, 105, 0.12);
        }

        .register-submit-btn {
          border: none;
          color: #FFFFFF;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .register-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(5, 150, 105, 0.35);
        }

        /* Modern Interactive Toggle Cards */
        .facility-toggle-card {
          background: #FFFFFF;
          border: 2px solid #E2E8F0;
          border-radius: 16px;
          padding: 18px 20px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }
        .facility-toggle-card:hover {
          border-color: #CBD5E1;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
          transform: translateY(-1px);
        }
        .facility-toggle-card.is-active {
          background: #F0FDF4;
          border-color: #059669;
          box-shadow: 0 6px 18px rgba(5, 150, 105, 0.14);
        }

        .custom-pill-switch {
          width: 52px;
          height: 28px;
          border-radius: 9999px;
          background: #CBD5E1;
          padding: 3px;
          display: flex;
          align-items: center;
          transition: background-color 0.25s ease;
          position: relative;
          flex-shrink: 0;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.15);
        }
        .facility-toggle-card.is-active .custom-pill-switch {
          background: #059669;
        }
        .custom-pill-switch-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #FFFFFF;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22);
          transform: translateX(0px);
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .facility-toggle-card.is-active .custom-pill-switch-thumb {
          transform: translateX(24px);
        }

        .custom-pill-badge {
          font-size: 11.5px;
          font-weight: 800;
          padding: 3px 9px;
          border-radius: 6px;
          background: #F1F5F9;
          color: #64748B;
          border: 1px solid #E2E8F0;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s ease;
        }
        .facility-toggle-card.is-active .custom-pill-badge {
          background: #DCFCE7;
          color: #15803D;
          border-color: #86EFAC;
        }
      `}</style>

      {/* ── TOP HERO HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #064E3B 0%, #065F46 50%, #047857 100%)',
        color: '#FFFFFF',
        padding: '32px 0 40px',
        borderBottom: '4px solid #10B981',
        boxShadow: '0 4px 20px rgba(6, 78, 59, 0.15)',
        marginBottom: 24
      }}>
        <Container>
          <BreadcrumbHUD
            links={[
              { label: 'হোম', path: '/' },
              { label: 'ফার্মেসি তালিকা', path: '/pharmacies' },
              { label: isExisting ? 'আমার ফার্মেসি পোর্টাল' : 'ফার্মেসি নিবন্ধন' }
            ]}
            variant="light"
          />

          <Row className="align-items-center mt-3">
            <Col lg={8}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(6px)',
                padding: '5px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 12
              }}>
                <IconShieldCheck size={16} color="#A7F3D0" />
                <span>স্বাস্থ্য অধিদপ্তর ও ড্রাগ প্রশাসন অনুমোদিত নেটওয়ার্ক</span>
              </div>
              <h1 style={{ fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 8 }}>
                {isExisting ? 'আমার ফার্মেসির তথ্য ও ড্রাগ লাইসেন্স' : 'ফার্মেসি লিস্টিং ও ভেরিফিকেশন আবেদন'}
              </h1>
              <p style={{ fontSize: 14.5, color: '#D1FAE5', maxWidth: 640, margin: 0, lineHeight: 1.6 }}>
                আপনার ফার্মেসির সঠিক বাণিজ্যিক তথ্য এবং ড্রাগ লাইসেন্স আপলোড করুন। অ্যাডমিন ভেরিফিকেশন সম্পন্ন হলে ফার্মেসি স্বয়ংক্রিয়ভাবে <strong>ভেরিফাইড ব্যাজ</strong> সহ প্রকাশিত হবে।
              </p>
            </Col>

            <Col lg={4} className="text-lg-end mt-3 mt-lg-0">
              <div style={{
                background: 'rgba(0,0,0,0.22)',
                borderRadius: 16,
                padding: '14px 18px',
                border: '1px solid rgba(255,255,255,0.18)',
                display: 'inline-block',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: 11.5, color: '#A7F3D0', fontWeight: 700, marginBottom: 4 }}>
                  🛡️ এনক্রিপ্টেড সিকিউরিটি
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.4 }}>
                  আপনার NID ও লাইসেন্স শুধু অ্যাডমিন দেখবেন, সাধারণ ওয়েবসাইটে কখনো প্রকাশ হবে না।
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container style={{ maxWidth: 960 }}>
        {/* ── REVIEW STATUS BANNERS ── */}
        {isExisting && pharmacyData && (
          <div style={{ marginBottom: 24 }}>
            {pharmacyData.status === 'pending' && (
              <div style={{
                background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                border: '1.5px solid #FDE68A',
                borderRadius: 18,
                padding: '18px 22px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                boxShadow: '0 4px 16px rgba(217, 119, 6, 0.08)'
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: '#FEF3C7', color: '#D97706',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <IconClock size={26} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 800, color: '#92400E', marginBottom: 2 }}>
                    আবেদনটি অ্যাডমিন পর্যালোচনায় রয়েছে (Pending Admin Verification)
                  </div>
                  <div style={{ fontSize: 13, color: '#B45309', lineHeight: 1.5 }}>
                    আপনার ফার্মেসির তথ্য ও ড্রাগ লাইসেন্স অ্যাডমিন টিম যাচাই করছেন। যাচাই শেষ হলে ফার্মেসি স্বয়ংক্রিয়ভাবে পাবলিক ডিরেক্টরিতে <strong>ভেরিফাইড ব্যাজ</strong> সহ যুক্ত হবে।
                  </div>
                </div>
              </div>
            )}

            {pharmacyData.status === 'active' && pharmacyData.is_verified && (
              <div style={{
                background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                border: '1.5px solid #A7F3D0',
                borderRadius: 18,
                padding: '18px 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                boxShadow: '0 4px 16px rgba(5, 150, 105, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: '#D1FAE5', color: '#059669',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <IconShieldCheck size={28} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15.5, fontWeight: 800, color: '#065F46', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>আপনার ফার্মেসি সক্রিয় ও ড্রাগ লাইসেন্স যাচাইকৃত</span>
                      <IconCircleCheck size={18} color="#059669" />
                    </div>
                    <div style={{ fontSize: 13, color: '#047857', lineHeight: 1.5 }}>
                      রোগীরা এখন সরাসরি পাবলিক তালিকায় আপনার ফার্মেসির তথ্য দেখতে ও WhatsApp এ প্রেসক্রিপশন পাঠাতে পারছেন।
                    </div>
                  </div>
                </div>
                <Link
                  to="/pharmacies"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 18px',
                    borderRadius: 10,
                    background: '#059669',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: 13.5,
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                  }}
                >
                  <span>পাবলিক তালিকায় দেখুন</span>
                  <IconExternalLink size={16} />
                </Link>
              </div>
            )}

            {pharmacyData.status === 'rejected' && (
              <div style={{
                background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
                border: '1.5px solid #FECACA',
                borderRadius: 18,
                padding: '18px 22px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                boxShadow: '0 4px 16px rgba(220, 38, 38, 0.08)'
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: '#FEE2E2', color: '#DC2626',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <IconAlertCircle size={26} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 800, color: '#991B1B', marginBottom: 2 }}>
                    আবেদনে সংশোধনের প্রয়োজন (Action Required)
                  </div>
                  <div style={{ fontSize: 13, color: '#B91C1C', lineHeight: 1.5, marginBottom: 4 }}>
                    <strong>অ্যাডমিনের কারণ:</strong> {pharmacyData.rejection_reason || 'কাগজপত্রে ত্রুটি পাওয়া গেছে।'}
                  </div>
                  <div style={{ fontSize: 12, color: '#7F1D1D' }}>
                    অনুগ্রহ করে নিচের ফরমে সঠিক তথ্য বা নতুন ডকুমেন্ট আপলোড করে পুনরায় সাবমিট করুন।
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SUBMITTED PHARMACY PROFILE SUMMARY VIEW (When isExisting && !isEditMode) ── */}
        {isExisting && pharmacyData && !isEditMode ? (
          <div style={{
            background: '#FFFFFF',
            borderRadius: 24,
            border: '1.5px solid #E2E8F0',
            boxShadow: '0 8px 30px rgba(15,23,42,0.05)',
            overflow: 'hidden'
          }}>
            {/* Top Banner / Cover Header */}
            <div style={{
              position: 'relative',
              background: imagePreview
                ? `linear-gradient(180deg, rgba(15,23,42,0.45) 0%, rgba(15,23,42,0.82) 100%), url(${imagePreview}) center/cover no-repeat`
                : 'linear-gradient(135deg, #064E3B 0%, #059669 100%)',
              padding: '28px 30px',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                <div style={{
                  width: 86,
                  height: 86,
                  borderRadius: 18,
                  background: '#FFFFFF',
                  border: '3px solid rgba(255,255,255,0.9)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
                  flexShrink: 0,
                  color: '#059669'
                }}>
                  {imagePreview ? (
                    <img src={imagePreview} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <IconBuildingStore size={42} />
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                    <h3 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#FFFFFF' }}>
                      {pharmacyData.name || name}
                    </h3>
                    <span style={{
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255,255,255,0.35)',
                      color: '#FFFFFF',
                      fontSize: 11.5,
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: 999
                    }}>
                      {PHARMACY_TYPES.find(t => t.id === (pharmacyData.pharmacy_type || pharmacyType))?.label || 'খুচরা ফার্মেসি'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                    মালিক / প্রোপাইটর: <strong>{pharmacyData.proprietor_name || proprietorName}</strong>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>
                    প্রধান মোবাইল: <strong>{pharmacyData.contact_number || contactNumber}</strong>
                    {(pharmacyData.whatsapp_number || whatsappNumber) ? ` • WhatsApp: ${pharmacyData.whatsapp_number || whatsappNumber}` : ''}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsEditMode(true)
                  window.scrollTo({ top: 180, behavior: 'smooth' })
                }}
                style={{
                  background: '#FFFFFF',
                  color: '#065F46',
                  border: 'none',
                  padding: '12px 22px',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 14,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
                  transition: 'all 0.2s ease'
                }}
              >
                <IconEdit size={18} />
                <span>তথ্য ও ডকুমেন্ট আপডেট করুন</span>
              </button>
            </div>

            {/* Summary Body */}
            <div style={{ padding: '30px' }}>
              {/* Info Cards Grid */}
              <Row className="g-4" style={{ marginBottom: 28 }}>
                {/* 1. Location & Address */}
                <Col md={6}>
                  <div style={{
                    background: '#F8FAFC',
                    borderRadius: 16,
                    border: '1px solid #E2E8F0',
                    padding: '18px 20px',
                    height: '100%'
                  }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <IconMapPin size={18} />
                      <span>ফার্মেসির ঠিকানা ও অবস্থান</span>
                    </div>
                    <div style={{ fontSize: 13.5, color: '#1E293B', fontWeight: 700, marginBottom: 6 }}>
                      {[
                        pharmacyData.union?.bn_name || pharmacyData.union?.name,
                        pharmacyData.upazila?.bn_name || pharmacyData.upazila?.name,
                        pharmacyData.district?.bn_name || pharmacyData.district?.name,
                        pharmacyData.division?.bn_name || pharmacyData.division?.name,
                      ].filter(Boolean).join(', ') || 'নির্ধারিত এলাকা'}
                    </div>
                    {(pharmacyData.village_or_area || villageOrArea) && (
                      <div style={{ fontSize: 12.5, color: '#475569', marginBottom: 4 }}>
                        <strong>গ্রাম/পাড়া/মহল্লা:</strong> {pharmacyData.village_or_area || villageOrArea}
                      </div>
                    )}
                    {(pharmacyData.address_line || addressLine) && (
                      <div style={{ fontSize: 12.5, color: '#475569', marginBottom: 4 }}>
                        <strong>বিস্তারিত ঠিকানা:</strong> {pharmacyData.address_line || addressLine}
                      </div>
                    )}
                    {(pharmacyData.google_maps_link || googleMapsLink) && (
                      <div style={{ marginTop: 8 }}>
                        <a
                          href={pharmacyData.google_maps_link || googleMapsLink}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 12, fontWeight: 700, color: '#059669', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <span>গুগল ম্যাপ লোকেশন দেখুন</span>
                          <IconExternalLink size={13} />
                        </a>
                      </div>
                    )}
                  </div>
                </Col>

                {/* 2. Operating Hours & Facilities */}
                <Col md={6}>
                  <div style={{
                    background: '#F8FAFC',
                    borderRadius: 16,
                    border: '1px solid #E2E8F0',
                    padding: '18px 20px',
                    height: '100%'
                  }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <IconClock size={18} />
                      <span>সময়সূচী ও সুবিধাসমূহ</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#1E293B', fontWeight: 700, marginBottom: 10 }}>
                      খোলা থাকার সময়:{' '}
                      <span style={{ color: '#059669' }}>
                        {is24Hours ? '২৪ ঘণ্টা খোলা (সপ্তাহে ৭ দিন)' : `${openingTime} - ${closingTime}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {is24Hours && (
                        <span style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>
                          🌙 ২৪ ঘণ্টা সেবা
                        </span>
                      )}
                      {isHomeDelivery && (
                        <span style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>
                          🚚 হোম ডেলিভারি সুবিধা
                        </span>
                      )}
                      {hasPharmacist && (
                        <span style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', color: '#6D28D9', fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>
                          👨‍⚕️ রেজিস্টার্ড ফার্মাসিস্ট
                        </span>
                      )}
                      {Number(discountPercentage) > 0 && (
                        <span style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C', fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>
                          🎁 {discountPercentage}% বিশেষ ছাড়
                        </span>
                      )}
                    </div>
                    {(pharmacyData.delivery_note || deliveryNote) && (
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 10 }}>
                        <strong>ডেলিভারি নোট:</strong> {pharmacyData.delivery_note || deliveryNote}
                      </div>
                    )}
                  </div>
                </Col>
              </Row>

              {/* 3. Uploaded Legal Documents Vault Preview */}
              <div style={{ marginBottom: 26 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconShieldCheck size={20} color="#059669" />
                    <span>জমাকৃত সরকারি লাইসেন্স ও কাগজপত্র (Cloudflare R2 + Local সুরক্ষিত ভল্ট)</span>
                  </div>
                </div>

                <Row className="g-3">
                  {[
                    {
                      title: 'ড্রাগ লাইসেন্স',
                      numberLabel: 'লাইসেন্স নম্বর',
                      numberVal: drugLicenseNumber,
                      hasDoc: hasExistingDrugLicense,
                      url: drugLicenseUrl,
                      ext: drugLicenseExt
                    },
                    {
                      title: 'জাতীয় পরিচয়পত্র (NID)',
                      numberLabel: 'NID নম্বর',
                      numberVal: nidNumber,
                      hasDoc: hasExistingNid,
                      url: nidDocUrl,
                      ext: nidDocExt
                    },
                    {
                      title: 'ট্রেড লাইসেন্স',
                      numberLabel: 'লাইসেন্স নম্বর',
                      numberVal: tradeLicenseNumber,
                      hasDoc: hasExistingTradeLicense,
                      url: tradeLicenseUrl,
                      ext: tradeLicenseExt
                    },
                    {
                      title: 'ফার্মাসিস্ট সনদপত্র',
                      numberLabel: 'রেজিঃ নম্বর',
                      numberVal: pharmacistRegNo || 'দেওয়া হয়নি',
                      hasDoc: hasExistingPharmacistCert,
                      url: pharmacistCertUrl,
                      ext: pharmacistCertExt
                    }
                  ].map((doc, idx) => (
                    <Col md={6} lg={3} key={idx}>
                      <div style={{
                        background: '#F8FAFC',
                        border: doc.hasDoc ? '1.5px solid #A7F3D0' : '1.5px dashed #CBD5E1',
                        borderRadius: 16,
                        padding: '14px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A' }}>{doc.title}</span>
                            {doc.hasDoc ? (
                              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#065F46', background: '#ECFDF5', padding: '2px 7px', borderRadius: 6 }}>
                                সংরক্ষিত
                              </span>
                            ) : (
                              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '2px 7px', borderRadius: 6 }}>
                                নেই
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#475569', marginBottom: 10 }}>
                            {doc.numberLabel}: <strong style={{ color: '#0F172A' }}>{doc.numberVal || 'N/A'}</strong>
                          </div>

                          {doc.hasDoc && doc.url ? (
                            doc.ext === 'pdf' ? (
                              <div
                                onClick={() => setPreviewDocModal({ title: doc.title, url: doc.url, isPdf: true })}
                                style={{
                                  height: 110,
                                  borderRadius: 10,
                                  background: '#FFFFFF',
                                  border: '1px solid #E2E8F0',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 4,
                                  color: '#DC2626',
                                  cursor: 'pointer'
                                }}
                              >
                                <IconFileTypePdf size={34} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>পিডিএফ ফাইল</span>
                              </div>
                            ) : (
                              <div
                                onClick={() => setPreviewDocModal({ title: doc.title, url: doc.url, isPdf: false })}
                                style={{
                                  height: 110,
                                  borderRadius: 10,
                                  background: '#FFFFFF',
                                  border: '1px solid #E2E8F0',
                                  overflow: 'hidden',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <img src={doc.url} alt={doc.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              </div>
                            )
                          ) : (
                            <div style={{
                              height: 110,
                              borderRadius: 10,
                              background: '#F1F5F9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11.5,
                              color: '#94A3B8',
                              fontWeight: 600
                            }}>
                              কোনো ফাইল আপলোড নেই
                            </div>
                          )}
                        </div>

                        {doc.hasDoc && doc.url && (
                          <button
                            type="button"
                            onClick={() => setPreviewDocModal({ title: doc.title, url: doc.url, isPdf: doc.ext === 'pdf' })}
                            style={{
                              marginTop: 10,
                              width: '100%',
                              background: '#FFFFFF',
                              border: '1px solid #A7F3D0',
                              color: '#047857',
                              padding: '6px 10px',
                              borderRadius: 8,
                              fontSize: 11.5,
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 5,
                              cursor: 'pointer'
                            }}
                          >
                            <IconEye size={14} /> ডকুমেন্ট দেখুন
                          </button>
                        )}
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>

              {/* Bottom Action Bar */}
              <div style={{
                paddingTop: 20,
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12
              }}>
                <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 600 }}>
                  তথ্য বা ডকুমেন্ট পরিবর্তন করতে ডানপাশের <strong>“তথ্য ও ডকুমেন্ট আপডেট করুন”</strong> বাটনে ক্লিক করুন।
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditMode(true)
                    window.scrollTo({ top: 180, behavior: 'smooth' })
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '12px 26px',
                    borderRadius: 12,
                    fontWeight: 800,
                    fontSize: 14,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    boxShadow: '0 6px 18px rgba(5, 150, 105, 0.25)'
                  }}
                >
                  <IconEdit size={18} />
                  <span>তথ্য ও ডকুমেন্ট আপডেট করুন</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
        /* ── MAIN FORM CONTAINER ── */
        <div style={{
          background: '#FFFFFF',
          borderRadius: 24,
          padding: '36px 32px',
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 6px 25px rgba(15,23,42,0.04)'
        }}>
          {isExisting && isEditMode && (
            <div style={{
              background: '#ECFDF5',
              border: '1.5px solid #A7F3D0',
              borderRadius: 14,
              padding: '12px 18px',
              marginBottom: 26,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconEdit size={20} color="#059669" />
                <span style={{ fontSize: 13.5, fontWeight: 800, color: '#065F46' }}>
                  আপডেট মোড চালু আছে — প্রয়োজনীয় তথ্য বা ডকুমেন্ট পরিবর্তন করে নিচে সেভ করুন।
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (pharmacyData) populateFormFromPharmacy(pharmacyData)
                  setFieldErrors({})
                  setGeneralError('')
                  setIsEditMode(false)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                বাতিল করুন
              </button>
            </div>
          )}
          <Form onSubmit={handleSubmit} noValidate>

            {/* ── ১. সাধারণ ও যোগাযোগের তথ্য ── */}
            <div style={{ marginBottom: 34 }}>
              <div className="form-section-pill">
                <IconBuildingStore size={18} />
                <span>১. সাধারণ ও যোগাযোগের তথ্য</span>
              </div>

              <Row className="g-3">
                <Col md={6} id="field-name">
                  <label className="form-label-styled">ফার্মেসির নাম <span style={{ color: '#E11D48' }}>*</span></label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => { setName(e.target.value); clearError('name') }}
                    placeholder="যেমন: Dirasha Pharmacy (দিরাশা ফার্মেসি)"
                    className={`form-control-styled ${fieldErrors.name ? 'has-field-error' : ''}`}
                  />
                  {fieldErrors.name && (
                    <div className="field-error-text"><IconAlertCircle size={14} /><span>{fieldErrors.name}</span></div>
                  )}
                </Col>

                <Col md={6} id="field-proprietor_name">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label className="form-label-styled" style={{ margin: 0 }}>
                      মালিক / প্রোপাইটরের নাম <span style={{ color: '#E11D48' }}>*</span>
                    </label>
                    {user?.name && proprietorName === user.name && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#065F46',
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        padding: '1px 8px',
                        borderRadius: 6,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3
                      }}>
                        <IconCheck size={12} /> প্রোফাইল থেকে প্রাপ্ত
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={proprietorName}
                    onChange={e => { setProprietorName(e.target.value); clearError('proprietor_name') }}
                    placeholder="মালিকের পূর্ণ নাম"
                    className={`form-control-styled ${fieldErrors.proprietor_name ? 'has-field-error' : ''}`}
                  />
                  {fieldErrors.proprietor_name && (
                    <div className="field-error-text"><IconAlertCircle size={14} /><span>{fieldErrors.proprietor_name}</span></div>
                  )}
                </Col>

                <Col md={4} id="field-contact_number">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label className="form-label-styled" style={{ margin: 0 }}>
                      প্রধান যোগাযোগ নম্বর <span style={{ color: '#E11D48' }}>*</span>
                    </label>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#475569',
                      background: '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      padding: '2px 8px',
                      borderRadius: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <IconLock size={12} /> একাউন্ট নম্বর
                    </span>
                  </div>
                  <div className="input-icon-wrap">
                    <span className="input-left-icon"><IconPhone size={17} /></span>
                    <input
                      type="tel"
                      readOnly
                      value={contactNumber}
                      onClick={() => {
                        setShowAltPhoneHint(true)
                        if (altContactRef.current) altContactRef.current.focus()
                      }}
                      onFocus={() => {
                        setShowAltPhoneHint(true)
                        if (altContactRef.current) altContactRef.current.focus()
                      }}
                      placeholder="01XXXXXXXXX"
                      className={`form-control-styled ${fieldErrors.contact_number ? 'has-field-error' : ''}`}
                      style={{
                        background: '#F8FAFC',
                        color: '#475569',
                        cursor: 'pointer',
                        paddingRight: '36px'
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94A3B8',
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <IconLock size={16} />
                    </span>
                  </div>
                  {fieldErrors.contact_number ? (
                    <div className="field-error-text"><IconAlertCircle size={14} /><span>{fieldErrors.contact_number}</span></div>
                  ) : (
                    <div
                      onClick={() => {
                        setShowAltPhoneHint(true)
                        if (altContactRef.current) altContactRef.current.focus()
                      }}
                      style={{
                        marginTop: 6,
                        fontSize: 11.5,
                        color: showAltPhoneHint ? '#047857' : '#64748B',
                        background: showAltPhoneHint ? '#ECFDF5' : '#F8FAFC',
                        border: showAltPhoneHint ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                        padding: '6px 8px',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <IconInfoCircle size={14} color={showAltPhoneHint ? '#059669' : '#00A88C'} style={{ flexShrink: 0 }} />
                      <span>
                        {showAltPhoneHint ? (
                          <strong>নম্বর পরিবর্তন করতে পাশের 'বিকল্প যোগাযোগ নম্বর' ঘরে লিখুন।</strong>
                        ) : (
                          <>প্রাথমিক নম্বর পরিবর্তনযোগ্য নয়। নতুন নম্বর দিতে <span style={{ color: '#00A88C', fontWeight: 700, textDecoration: 'underline' }}>বিকল্প নম্বর ব্যবহার করুন</span></>
                        )}
                      </span>
                    </div>
                  )}
                </Col>

                <Col md={4} id="field-alternate_contact_number">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label className="form-label-styled" style={{ margin: 0 }}>বিকল্প যোগাযোগ নম্বর (ঐচ্ছিক)</label>
                    {showAltPhoneHint && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#047857',
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        padding: '2px 8px',
                        borderRadius: 6
                      }}>
                        এখানে লিখুন ✍️
                      </span>
                    )}
                  </div>
                  <div className="input-icon-wrap">
                    <span className="input-left-icon"><IconPhone size={17} /></span>
                    <input
                      ref={altContactRef}
                      type="tel"
                      inputMode="numeric"
                      maxLength={11}
                      value={alternateContactNumber}
                      onChange={e => handlePhoneInput(e.target.value, setAlternateContactNumber, 'alternate_contact_number')}
                      onBlur={() => handlePhoneBlur(alternateContactNumber, 'alternate_contact_number', false)}
                      placeholder="01XXXXXXXXX"
                      className={`form-control-styled ${fieldErrors.alternate_contact_number ? 'has-field-error' : ''}`}
                      style={showAltPhoneHint && !fieldErrors.alternate_contact_number ? { borderColor: '#059669', boxShadow: '0 0 0 3px rgba(5, 150, 105, 0.15)' } : {}}
                    />
                  </div>
                  {fieldErrors.alternate_contact_number ? (
                    <div className="field-error-text"><IconAlertCircle size={14} /><span>{fieldErrors.alternate_contact_number}</span></div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#0F766E', marginTop: 5, paddingLeft: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <IconInfoCircle size={13} style={{ flexShrink: 0 }} />
                      <span>ফার্মেসির পাবলিক তালিকায় এই বিকল্প নম্বরটি সরাসরি প্রদর্শিত হবে।</span>
                    </div>
                  )}
                </Col>

                <Col md={4} id="field-whatsapp_number">
                  <label className="form-label-styled">হোয়াটসঅ্যাপ প্রেসক্রিপশন নম্বর (ঐচ্ছিক)</label>
                  <div className="input-icon-wrap">
                    <span className="input-left-icon" style={{ color: '#059669' }}><IconPhone size={17} /></span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={11}
                      value={whatsappNumber}
                      onChange={e => handlePhoneInput(e.target.value, setWhatsappNumber, 'whatsapp_number')}
                      onBlur={() => handlePhoneBlur(whatsappNumber, 'whatsapp_number', false)}
                      placeholder="01XXXXXXXXX"
                      className={`form-control-styled ${fieldErrors.whatsapp_number ? 'has-field-error' : ''}`}
                    />
                  </div>
                  {fieldErrors.whatsapp_number && (
                    <div className="field-error-text"><IconAlertCircle size={14} /><span>{fieldErrors.whatsapp_number}</span></div>
                  )}
                </Col>

                <Col md={6} id="field-email">
                  <label className="form-label-styled">ইমেইল (ঐচ্ছিক)</label>
                  <div className="input-icon-wrap">
                    <span className="input-left-icon"><IconMail size={17} /></span>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="pharmacy@example.com"
                      className="form-control-styled"
                    />
                  </div>
                </Col>

                {/* Interactive Pharmacy Type Selector */}
                <Col md={12} id="field-pharmacy_type" style={{ marginTop: 6 }}>
                  <label className="form-label-styled">ফার্মেসির ধরন নির্বাচন করুন</label>
                  <div className="type-grid-selector">
                    {PHARMACY_TYPES.map(t => {
                      const isSelected = pharmacyType === t.id
                      return (
                        <div
                          key={t.id}
                          className={`type-card-item ${isSelected ? 'active' : ''}`}
                          onClick={() => setPharmacyType(t.id)}
                        >
                          <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: isSelected ? '#059669' : '#F1F5F9',
                            color: isSelected ? '#FFFFFF' : '#475569',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {t.icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 800, color: isSelected ? '#065F46' : '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span>{t.label}</span>
                              {isSelected && <IconCheck size={16} color="#059669" />}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                              {t.sub}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Col>
              </Row>
            </div>

            {/* ── ২. অবস্থান ও পূর্ণাঙ্গ ঠিকানা ── */}
            <div style={{ marginBottom: 34, paddingTop: 24, borderTop: '1px solid #F1F5F9' }}>
              <div className="form-section-pill">
                <IconMapPin size={18} />
                <span>২. ভৌগোলিক অবস্থান ও পূর্ণাঙ্গ ঠিকানা</span>
              </div>

              <Row className="g-3">
                <Col xs={6} md={3} id="field-division_id">
                  <label className="form-label-styled">বিভাগ <span style={{ color: '#E11D48' }}>*</span></label>
                  <select
                    value={divisionId}
                    onChange={e => {
                      setDivisionId(e.target.value)
                      setDistrictId('')
                      setUpazilaId('')
                      setUnionId('')
                      clearError('division_id')
                    }}
                    className={`form-control-styled ${fieldErrors.division_id ? 'has-field-error' : ''}`}
                  >
                    <option value="">নির্বাচন করুন</option>
                    {divisions.map(d => (
                      <option key={d.id} value={d.id}>{d.bangla_name || d.name}</option>
                    ))}
                  </select>
                  {fieldErrors.division_id && (
                    <div className="field-error-text"><IconAlertCircle size={14} /><span>{fieldErrors.division_id}</span></div>
                  )}
                </Col>

                <Col xs={6} md={3} id="field-district_id">
                  <label className="form-label-styled">জেলা <span style={{ color: '#E11D48' }}>*</span></label>
                  <select
                    value={districtId}
                    disabled={!divisionId}
                    onChange={e => {
                      setDistrictId(e.target.value)
                      setUpazilaId('')
                      setUnionId('')
                      clearError('district_id')
                    }}
                    className={`form-control-styled ${fieldErrors.district_id ? 'has-field-error' : ''}`}
                  >
                    <option value="">নির্বাচন করুন</option>
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>{d.bangla_name || d.name}</option>
                    ))}
                  </select>
                  {fieldErrors.district_id && (
                    <div className="field-error-text"><IconAlertCircle size={14} /><span>{fieldErrors.district_id}</span></div>
                  )}
                </Col>

                <Col xs={6} md={3} id="field-upazila_id">
                  <label className="form-label-styled">উপজেলা / থানা <span style={{ color: '#E11D48' }}>*</span></label>
                  <select
                    value={upazilaId}
                    disabled={!districtId}
                    onChange={e => {
                      setUpazilaId(e.target.value)
                      setUnionId('')
                      clearError('upazila_id')
                    }}
                    className={`form-control-styled ${fieldErrors.upazila_id ? 'has-field-error' : ''}`}
                  >
                    <option value="">নির্বাচন করুন</option>
                    {upazilas.map(u => (
                      <option key={u.id} value={u.id}>{u.bangla_name || u.name}</option>
                    ))}
                  </select>
                  {fieldErrors.upazila_id && (
                    <div className="field-error-text"><IconAlertCircle size={14} /><span>{fieldErrors.upazila_id}</span></div>
                  )}
                </Col>

                <Col xs={6} md={3} id="field-union_id">
                  <label className="form-label-styled">ইউনিয়ন / ওয়ার্ড (ঐচ্ছিক)</label>
                  <select
                    value={unionId}
                    disabled={!upazilaId}
                    onChange={e => setUnionId(e.target.value)}
                    className="form-control-styled"
                  >
                    <option value="">নির্বাচন করুন</option>
                    {unions.map(u => (
                      <option key={u.id} value={u.id}>{u.bangla_name || u.name}</option>
                    ))}
                  </select>
                </Col>

                <Col md={6} id="field-village_or_area">
                  <label className="form-label-styled">গ্রাম / পাড়া / বাজার / রোড</label>
                  <input
                    type="text"
                    value={villageOrArea}
                    onChange={e => setVillageOrArea(e.target.value)}
                    placeholder="যেমন: কলেজ রোড, সদর বাজার"
                    className="form-control-styled"
                  />
                </Col>

                <Col md={6} id="field-address_line">
                  <label className="form-label-styled">বিস্তারিত ঠিকানা ও দোকান নম্বর</label>
                  <input
                    type="text"
                    value={addressLine}
                    onChange={e => setAddressLine(e.target.value)}
                    placeholder="যেমন: সিটি প্লাজা, নিচতলা, দোকান নং ১২"
                    className="form-control-styled"
                  />
                </Col>

                <Col md={12} id="field-google_maps_link">
                  <label className="form-label-styled">গুগল ম্যাপস লোকেশন লিংক (ঐচ্ছিক)</label>
                  <div className="input-icon-wrap">
                    <span className="input-left-icon"><IconMapPin size={17} /></span>
                    <input
                      type="url"
                      value={googleMapsLink}
                      onChange={e => setGoogleMapsLink(e.target.value)}
                      placeholder="https://maps.app.goo.gl/..."
                      className="form-control-styled"
                    />
                  </div>
                </Col>
              </Row>
            </div>

            {/* ── ৩. সময়সূচি ও বিশেষ সুবিধাসমূহ ── */}
            <div style={{ marginBottom: 34, paddingTop: 24, borderTop: '1px solid #F1F5F9' }}>
              <div className="form-section-pill">
                <IconClock size={18} />
                <span>৩. সময়সূচি ও বিশেষ সুবিধাসমূহ</span>
              </div>

              {/* 1. 24 Hours Emergency Toggle Card */}
              <div
                className={`facility-toggle-card ${is24Hours ? 'is-active' : ''}`}
                onClick={() => setIs24Hours(!is24Hours)}
                style={{ marginBottom: 20 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      background: is24Hours ? '#059669' : '#F1F5F9',
                      color: is24Hours ? '#FFFFFF' : '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.2s ease'
                    }}>
                      <IconMoon size={24} />
                    </div>
                    <div>
                      <div style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: is24Hours ? '#065F46' : '#0F172A',
                        lineHeight: 1.3
                      }}>
                        ২৪ ঘণ্টা জরুরি সেবা খোলা থাকে
                      </div>
                      <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 3 }}>
                        ফার্মেসি দিবারাত্রি ২৪ ঘণ্টা সার্বক্ষণিক খোলা থাকলে এটি চালু রাখুন (খোলার ও বন্ধের সময় দিতে হবে না)।
                      </div>
                    </div>
                  </div>

                  {/* Switch + Status Badge */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <div className="custom-pill-switch">
                      <div className="custom-pill-switch-thumb">
                        {is24Hours ? (
                          <IconCheck size={13} color="#059669" stroke={3} />
                        ) : (
                          <IconX size={12} color="#94A3B8" stroke={2.5} />
                        )}
                      </div>
                    </div>
                    <span className="custom-pill-badge">
                      {is24Hours ? '✓ চালু আছে' : 'বন্ধ'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Opening & Closing Time (visible only if NOT 24 hours) */}
              {!is24Hours && (
                <Row className="g-3" style={{ marginBottom: 20 }}>
                  <Col xs={6} id="field-opening_time">
                    <label className="form-label-styled">প্রতিদিন খোলার সময় <span style={{ color: '#E11D48' }}>*</span></label>
                    <input
                      type="time"
                      value={openingTime}
                      onChange={e => { setOpeningTime(e.target.value); clearError('opening_time') }}
                      className={`form-control-styled ${fieldErrors.opening_time ? 'has-field-error' : ''}`}
                    />
                    {fieldErrors.opening_time && (
                      <div className="field-error-text"><IconAlertCircle size={14} /><span>{fieldErrors.opening_time}</span></div>
                    )}
                  </Col>

                  <Col xs={6} id="field-closing_time">
                    <label className="form-label-styled">প্রতিদিন বন্ধের সময় <span style={{ color: '#E11D48' }}>*</span></label>
                    <input
                      type="time"
                      value={closingTime}
                      onChange={e => { setClosingTime(e.target.value); clearError('closing_time') }}
                      className={`form-control-styled ${fieldErrors.closing_time ? 'has-field-error' : ''}`}
                    />
                    {fieldErrors.closing_time && (
                      <div className="field-error-text"><IconAlertCircle size={14} /><span>{fieldErrors.closing_time}</span></div>
                    )}
                  </Col>
                </Row>
              )}

              <Row className="g-3">
                {/* 2. Home Delivery Toggle Card */}
                <Col md={6}>
                  <div
                    className={`facility-toggle-card ${isHomeDelivery ? 'is-active' : ''}`}
                    onClick={() => setIsHomeDelivery(!isHomeDelivery)}
                    style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            background: isHomeDelivery ? '#059669' : '#F1F5F9',
                            color: isHomeDelivery ? '#FFFFFF' : '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.2s ease'
                          }}>
                            <IconTruck size={22} />
                          </div>
                          <div>
                            <div style={{
                              fontSize: 15,
                              fontWeight: 800,
                              color: isHomeDelivery ? '#065F46' : '#0F172A',
                              lineHeight: 1.3
                            }}>
                              হোম ডেলিভারি সুবিধা আছে
                            </div>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                              রোগীর ঠিকানায় ওষুধ পৌঁছে দেওয়ার ব্যবস্থা থাকলে চালু রাখুন।
                            </div>
                          </div>
                        </div>

                        {/* Switch + Badge */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                          <div className="custom-pill-switch">
                            <div className="custom-pill-switch-thumb">
                              {isHomeDelivery ? (
                                <IconCheck size={13} color="#059669" stroke={3} />
                              ) : (
                                <IconX size={12} color="#94A3B8" stroke={2.5} />
                              )}
                            </div>
                          </div>
                          <span className="custom-pill-badge">
                            {isHomeDelivery ? '✓ চালু আছে' : 'বন্ধ'}
                          </span>
                        </div>
                      </div>

                      {/* Delivery note input */}
                      {isHomeDelivery && (
                        <div
                          style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(5, 150, 105, 0.15)' }}
                          onClick={e => e.stopPropagation()}
                        >
                          <label style={{ fontSize: 11.5, fontWeight: 700, color: '#065F46', marginBottom: 4, display: 'block' }}>
                            ডেলিভারির শর্ত বা এলাকা (ঐচ্ছিক):
                          </label>
                          <input
                            type="text"
                            value={deliveryNote}
                            onChange={e => setDeliveryNote(e.target.value)}
                            placeholder="যেমন: পৌরসভা এলাকায় ফ্রি বা ৫০ টাকার মধ্যে ডেলিভারি"
                            className="form-control-styled"
                            style={{ fontSize: 13, height: 38 }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Col>

                {/* 3. Graduate / Diploma Pharmacist Toggle Card */}
                <Col md={6}>
                  <div
                    className={`facility-toggle-card ${hasPharmacist ? 'is-active' : ''}`}
                    onClick={() => setHasPharmacist(!hasPharmacist)}
                    style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            background: hasPharmacist ? '#059669' : '#F1F5F9',
                            color: hasPharmacist ? '#FFFFFF' : '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.2s ease'
                          }}>
                            <IconCertificate size={22} />
                          </div>
                          <div>
                            <div style={{
                              fontSize: 15,
                              fontWeight: 800,
                              color: hasPharmacist ? '#065F46' : '#0F172A',
                              lineHeight: 1.3
                            }}>
                              গ্র্যাজুয়েট / ডিপ্লোমা ফার্মাসিস্ট উপস্থিত
                            </div>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                              ফার্মেসীতে সার্বক্ষণিক অনুমোদিত রেজিস্টার্ড ফার্মাসিস্ট উপস্থিত থাকলে চালু রাখুন।
                            </div>
                          </div>
                        </div>

                        {/* Switch + Badge */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                          <div className="custom-pill-switch">
                            <div className="custom-pill-switch-thumb">
                              {hasPharmacist ? (
                                <IconCheck size={13} color="#059669" stroke={3} />
                              ) : (
                                <IconX size={12} color="#94A3B8" stroke={2.5} />
                              )}
                            </div>
                          </div>
                          <span className="custom-pill-badge">
                            {hasPharmacist ? '✓ চালু আছে' : 'বন্ধ'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>

                <Col md={12}>
                  <label className="form-label-styled">সাধারণ ছাড় / ডিসকাউন্ট শতকরা হার (%)</label>
                  <div className="input-icon-wrap" style={{ maxWidth: 280 }}>
                    <span className="input-left-icon"><IconDiscount2 size={18} /></span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={discountPercentage}
                      onChange={e => setDiscountPercentage(e.target.value)}
                      placeholder="যেমন: 5 বা 10"
                      className="form-control-styled"
                    />
                  </div>
                </Col>
              </Row>
            </div>

            {/* ── ৪. সংবেদনশীল আইনি ডকুমেন্টস (Private Vault) ── */}
            <div style={{ marginBottom: 34, paddingTop: 24, borderTop: '1px solid #F1F5F9' }}>
              <div className="form-section-pill" style={{ background: '#FFFBEB', color: '#B45309', borderColor: '#FDE68A' }}>
                <IconShieldCheck size={18} />
                <span>৪. সংবেদনশীল আইনি ভল্ট (গোপনীয় ও সুরক্ষিত)</span>
              </div>

              <div style={{
                background: isExisting ? '#FFF7ED' : '#FEF3C7',
                borderRadius: 14,
                padding: '14px 18px',
                color: isExisting ? '#9A3412' : '#92400E',
                fontSize: 13,
                lineHeight: 1.55,
                marginBottom: 22,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                border: isExisting ? '1.5px solid #FDBA74' : '1px solid #FDE68A'
              }}>
                <IconLock size={22} style={{ flexShrink: 0, color: isExisting ? '#EA580C' : '#B45309' }} />
                {isExisting ? (
                  <span>
                    <strong>আইনি ভল্ট লক করা আছে:</strong> নিরাপত্তার স্বার্থে আপনার জমাকৃত ড্রাগ লাইসেন্স, এনআইডি, ট্রেড লাইসেন্স ও ফার্মাসিস্ট সনদ একবার সাবমিট করার পর নিজে থেকে পরিবর্তন বা মুছে ফেলা যাবে না। কোনো তথ্য বা ডকুমেন্ট সংশোধনের প্রয়োজন হলে অনুগ্রহ করে <strong>অ্যাডমিন সাপোর্টে</strong> যোগাযোগ করুন।
                  </span>
                ) : (
                  <span>
                    আপনার ড্রাগ লাইসেন্স, এনআইডি ও অন্যান্য কাগজপত্র <strong>প্রাইভেট সুরক্ষিত ভল্টে</strong> এনক্রিপ্ট হয়ে সংরক্ষিত থাকবে। <strong>সতর্কতা:</strong> একবার চূড়ান্তভাবে আবেদন সাবমিট করার পর অ্যাডমিনের সহায়তা ছাড়া এই ৪ নম্বর সেকশনের তথ্য বা ডকুমেন্ট আর পরিবর্তন করা যাবে না।
                  </span>
                )}
              </div>

              <Row className="g-4">
                {/* 1. Drug License (Mandatory) */}
                <Col md={6}>
                  {renderDocUploadCard({
                    id: 'field-drug_license_number',
                    label: 'ড্রাগ লাইসেন্স',
                    numberLabel: 'ড্রাগ লাইসেন্স নম্বর',
                    numberValue: drugLicenseNumber,
                    onNumberChange: val => { setDrugLicenseNumber(val); clearError('drug_license_number') },
                    numberPlaceholder: 'যেমন: DL-12345/2026',
                    numberError: fieldErrors.drug_license_number,
                    fileError: fieldErrors.drug_license_file,
                    selectedFile: drugLicenseFile,
                    onFileSelect: f => { setDrugLicenseFile(f); clearError('drug_license_file') },
                    hasExisting: hasExistingDrugLicense,
                    existingUrl: drugLicenseUrl,
                    existingExt: drugLicenseExt,
                    onRemoveExisting: () => {
                      setHasExistingDrugLicense(false)
                      setDrugLicenseUrl('')
                      setDrugLicenseFile(null)
                    },
                    isLocked: isExisting,
                    isRequired: true,
                    fileInputRefId: 'input-drug-license',
                    helpText: 'ফার্মেসির বৈধ ড্রাগ লাইসেন্সের স্পষ্ট কপি আপলোড করুন।'
                  })}
                </Col>

                {/* 2. National ID (NID) */}
                <Col md={6}>
                  {renderDocUploadCard({
                    id: 'field-nid_number',
                    label: 'মালিকের জাতীয় পরিচয়পত্র (NID)',
                    numberLabel: 'NID নম্বর',
                    numberValue: nidNumber,
                    onNumberChange: val => { setNidNumber(val); clearError('nid_number') },
                    numberPlaceholder: '১০, ১৩ বা ১৭ ডিজিটের NID নম্বর',
                    numberError: fieldErrors.nid_number,
                    fileError: fieldErrors.nid_file,
                    selectedFile: nidFile,
                    onFileSelect: f => { setNidFile(f); clearError('nid_file') },
                    hasExisting: hasExistingNid,
                    existingUrl: nidDocUrl,
                    existingExt: nidDocExt,
                    onRemoveExisting: () => {
                      setHasExistingNid(false)
                      setNidDocUrl('')
                      setNidFile(null)
                    },
                    isLocked: isExisting,
                    isRequired: true,
                    fileInputRefId: 'input-nid-file',
                    helpText: 'মালিকের NID কার্ডের উভয় পাশের স্পষ্ট ছবি বা পিডিএফ।'
                  })}
                </Col>

                {/* 3. Trade License */}
                <Col md={6}>
                  {renderDocUploadCard({
                    id: 'field-trade_license_number',
                    label: 'ট্রেড লাইসেন্স',
                    numberLabel: 'ট্রেড লাইসেন্স নম্বর',
                    numberValue: tradeLicenseNumber,
                    onNumberChange: val => { setTradeLicenseNumber(val); clearError('trade_license_number') },
                    numberPlaceholder: 'সিটি কর্পোরেশন/ইউনিয়ন ট্রেড লাইসেন্স নম্বর',
                    numberError: fieldErrors.trade_license_number,
                    fileError: fieldErrors.trade_license_file,
                    selectedFile: tradeLicenseFile,
                    onFileSelect: f => { setTradeLicenseFile(f); clearError('trade_license_file') },
                    hasExisting: hasExistingTradeLicense,
                    existingUrl: tradeLicenseUrl,
                    existingExt: tradeLicenseExt,
                    onRemoveExisting: () => {
                      setHasExistingTradeLicense(false)
                      setTradeLicenseUrl('')
                      setTradeLicenseFile(null)
                    },
                    isLocked: isExisting,
                    isRequired: true,
                    fileInputRefId: 'input-trade-license',
                    helpText: 'চলতি অর্থবছরের হালনাগাদ ট্রেড লাইসেন্স।'
                  })}
                </Col>

                {/* 4. Pharmacist Certificate (Optional) */}
                <Col md={6}>
                  {renderDocUploadCard({
                    id: 'field-pharmacist_registration_no',
                    label: 'ফার্মাসিস্ট রেজিস্ট্রেশন সনদ (ঐচ্ছিক)',
                    numberLabel: 'রেজিস্ট্রেশন নম্বর',
                    numberValue: pharmacistRegNo,
                    onNumberChange: val => setPharmacistRegNo(val),
                    numberPlaceholder: 'ফার্মেসী কাউন্সিল রেজিস্ট্রেশন নম্বর',
                    numberError: null,
                    fileError: null,
                    selectedFile: pharmacistCertFile,
                    onFileSelect: f => {
                      setPharmacistCertFile(f)
                      if (f) setRemovePharmacistCert(false)
                    },
                    hasExisting: hasExistingPharmacistCert,
                    existingUrl: pharmacistCertUrl,
                    existingExt: pharmacistCertExt,
                    onRemoveExisting: () => {
                      setHasExistingPharmacistCert(false)
                      setPharmacistCertUrl('')
                      setPharmacistCertFile(null)
                      setRemovePharmacistCert(true)
                    },
                    isLocked: isExisting,
                    isRequired: false,
                    fileInputRefId: 'input-pharmacist-cert',
                    helpText: 'বাংলাদেশ ফার্মেসী কাউন্সিলের গ্রেড-এ/বি/সি সনদপত্র।'
                  })}
                </Col>
              </Row>
            </div>

            {/* ── ৫. ফার্মেসি বা দোকানের ছবি ── */}
            <div style={{ marginBottom: 34, paddingTop: 24, borderTop: '1px solid #F1F5F9' }}>
              <div className="form-section-pill">
                <IconCamera size={18} />
                <span>৫. ফার্মেসি বা দোকানের ছবি (ঐচ্ছিক)</span>
              </div>

              <div style={{
                background: '#F8FAFC',
                borderRadius: 18,
                border: '1.5px dashed #CBD5E1',
                padding: '24px 20px',
                textAlign: 'center',
                maxWidth: 520,
                margin: '0 auto'
              }}>
                <label style={{ fontSize: 13.5, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>
                  ফার্মেসির লোগো বা দোকানের ছবি
                </label>
                <p style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>
                  লোগো অথবা দোকানের সামনের সাইনবোর্ড/সম্মুখভাগের যেকোনো ১টি ছবি আপলোড করুন
                </p>

                <div style={{
                  width: '100%',
                  maxWidth: 240,
                  height: 130,
                  borderRadius: 14,
                  background: '#FFFFFF',
                  border: '1.5px solid #E2E8F0',
                  margin: '0 auto 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  color: '#94A3B8',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Pharmacy Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: '#94A3B8' }}>
                      <IconBuildingStore size={38} color="#CBD5E1" />
                      <span style={{ fontSize: 12, fontWeight: 600 }}>ছবি সিলেক্ট করা হয়নি</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <label
                    htmlFor="input-pharmacy-image-file"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#FFFFFF',
                      border: '1.5px solid #00A88C',
                      color: '#00A88C',
                      padding: '8px 18px',
                      borderRadius: 10,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      margin: 0,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0, 168, 140, 0.12)'
                    }}
                  >
                    <IconUpload size={15} />
                    <span>{imagePreview ? 'ছবি পরিবর্তন করুন' : 'ছবি আপলোড করুন'}</span>
                    <input id="input-pharmacy-image-file" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                  </label>

                  {imagePreview && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        padding: '8px 16px',
                        borderRadius: 10,
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: '#DC2626',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <IconTrash size={15} />
                      <span>মুছুন</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── GENERAL ERROR BANNER (ZERO TOAST) ── */}
            {generalError && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 12,
                padding: '14px 18px',
                color: '#991B1B',
                fontSize: 13.5,
                fontWeight: 600,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <IconAlertCircle size={20} style={{ flexShrink: 0 }} />
                <span>{generalError}</span>
              </div>
            )}

            {/* ── SUBMIT BUTTON ── */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: '1px solid #F1F5F9', flexWrap: 'wrap' }}>
              {isExisting && isEditMode && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    if (pharmacyData) populateFormFromPharmacy(pharmacyData)
                    setFieldErrors({})
                    setGeneralError('')
                    setIsEditMode(false)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  style={{
                    background: '#F1F5F9',
                    color: '#475569',
                    border: '1px solid #CBD5E1',
                    padding: '14px 24px',
                    borderRadius: 14,
                    fontWeight: 700,
                    fontSize: 14.5,
                    cursor: 'pointer'
                  }}
                >
                  বাতিল করুন
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="register-submit-btn"
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  padding: '14px 32px',
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 15.5,
                  boxShadow: '0 6px 20px rgba(5, 150, 105, 0.28)'
                }}
              >
                {saving ? (
                  <>
                    <Spinner animation="border" size="sm" />
                    <span>সংরক্ষণ ও আপলোড হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <IconBuildingStore size={20} />
                    <span>{isExisting ? 'পরিবর্তন সংরক্ষণ করুন' : 'লিস্টিংয়ের আবেদন জমা দিন'}</span>
                    <IconArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </Form>
        </div>
        )}
      </Container>

      {/* ── DOCUMENT PREVIEW LIGHTBOX MODAL ── */}
      <Modal
        show={Boolean(previewDocModal)}
        onHide={() => setPreviewDocModal(null)}
        centered
        size="lg"
      >
        <Modal.Header closeButton style={{ borderBottom: '1px solid #E2E8F0', padding: '16px 22px' }}>
          <Modal.Title style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconShieldCheck size={20} color="#059669" />
            <span>{previewDocModal?.title || 'ডকুমেন্ট প্রিভিউ'}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '20px', background: '#F8FAFC', textAlign: 'center' }}>
          {previewDocModal?.url && (
            previewDocModal.isPdf ? (
              <iframe
                src={previewDocModal.url}
                title={previewDocModal.title}
                style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 12, background: '#FFFFFF' }}
              />
            ) : (
              <img
                src={previewDocModal.url}
                alt={previewDocModal.title}
                style={{ maxWidth: '100%', maxHeight: '72vh', borderRadius: 12, objectFit: 'contain', boxShadow: '0 4px 20px rgba(15,23,42,0.08)' }}
              />
            )
          )}
        </Modal.Body>
      </Modal>

      {/* ── FINAL SUBMISSION CONFIRMATION MODAL (SECTION 4 VAULT LOCK WARNING) ── */}
      <Modal
        show={showConfirmModal}
        onHide={() => !saving && setShowConfirmModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Body style={{ padding: '32px 26px', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            color: '#B45309', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, boxShadow: '0 8px 24px rgba(180, 83, 9, 0.18)'
          }}>
            <IconLock size={38} />
          </div>

          <h4 style={{ fontWeight: 900, color: '#0F172A', fontSize: 20, marginBottom: 10 }}>
            চূড়ান্ত সাবমিটের পূর্বে গুরুত্বপূর্ণ সতর্কবার্তা
          </h4>

          <div style={{
            background: '#FFFBEB',
            border: '1.5px solid #FDE68A',
            borderRadius: 14,
            padding: '14px 16px',
            textAlign: 'left',
            fontSize: 13,
            color: '#92400E',
            lineHeight: 1.6,
            marginBottom: 18
          }}>
            <div style={{ fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6, color: '#78350F' }}>
              <IconShieldCheck size={18} color="#B45309" />
              <span>৪. সংবেদনশীল আইনি ভল্ট (গোপনীয় ও সুরক্ষিত):</span>
            </div>
            <div>
              আবেদনটি একবার জমা দেওয়ার পর <strong>ড্রাগ লাইসেন্স, জাতীয় পরিচয়পত্র (NID), ট্রেড লাইসেন্স এবং ফার্মাসিস্ট সনদ</strong>—এই অংশের কোনো তথ্য বা ডকুমেন্ট আপনি নিজে আর পরিবর্তন বা আপডেট করতে পারবেন না। পরবর্তীতে কোনো সংশোধনের প্রয়োজন হলে <strong>অ্যাডমিনের সহায়তা</strong> নিতে হবে।
            </div>
          </div>

          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '10px 14px',
            textAlign: 'left',
            fontSize: 12.5,
            color: '#334155',
            marginBottom: 22
          }}>
            <div>• <strong>ড্রাগ লাইসেন্স নম্বর:</strong> {drugLicenseNumber}</div>
            <div>• <strong>NID নম্বর:</strong> {nidNumber}</div>
            <div>• <strong>ট্রেড লাইসেন্স নম্বর:</strong> {tradeLicenseNumber}</div>
            {pharmacistRegNo && <div>• <strong>ফার্মাসিস্ট রেজিঃ নম্বর:</strong> {pharmacistRegNo}</div>}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              disabled={saving}
              onClick={() => setShowConfirmModal(false)}
              style={{
                flex: 1, padding: '12px', borderRadius: 12,
                background: '#F1F5F9', color: '#475569',
                fontWeight: 700, fontSize: 13.5, border: '1px solid #CBD5E1', cursor: 'pointer'
              }}
            >
              ফিরে যান ও যাচাই করুন
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={executeSavePharmacy}
              style={{
                flex: 1.3, padding: '12px', borderRadius: 12,
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#FFFFFF',
                fontWeight: 800, fontSize: 13.5, border: 'none',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.28)'
              }}
            >
              {saving ? (
                <>
                  <Spinner animation="border" size="sm" />
                  <span>জমা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <IconCheck size={18} />
                  <span>হ্যাঁ, চূড়ান্তভাবে জমা দিন</span>
                </>
              )}
            </button>
          </div>
        </Modal.Body>
      </Modal>

      {/* ── SUBMISSION SUCCESS MODAL POPUP (ZERO TOAST) ── */}
      <Modal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Body style={{ padding: '36px 28px', textAlign: 'center' }}>
          <div style={{
            width: 76, height: 76, borderRadius: '50%',
            background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
            color: '#059669', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 18, boxShadow: '0 8px 24px rgba(5, 150, 105, 0.22)'
          }}>
            <IconCircleCheck size={46} />
          </div>

          <h4 style={{ fontWeight: 900, color: '#0F172A', fontSize: 21, marginBottom: 8 }}>
            আবেদন সফলভাবে গৃহীত হয়েছে!
          </h4>
          <p style={{ fontSize: 14, color: '#475569', fontWeight: 600, maxWidth: 390, margin: '0 auto 22px', lineHeight: 1.6 }}>
            {successMessage || 'আপনার ফার্মেসির তথ্য ও ড্রাগ লাইসেন্স সফলভাবে জমা হয়েছে। অ্যাডমিন টিম দ্রুত যাচাইকরণ সম্পন্ন করবেন।'}
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              style={{
                flex: 1, padding: '12px', borderRadius: 12,
                background: '#F1F5F9', color: '#475569',
                fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer'
              }}
            >
              এখানেই থাকুন
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false)
                navigate('/pharmacies')
              }}
              style={{
                flex: 1.4, padding: '12px', borderRadius: 12,
                background: '#059669', color: '#FFFFFF',
                fontWeight: 800, fontSize: 14, border: 'none',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.28)'
              }}
            >
              <span>পাবলিক ডিরেক্টরি দেখুন</span>
              <IconArrowRight size={18} />
            </button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  )
}

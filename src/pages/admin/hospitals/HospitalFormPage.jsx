import { getErrorMessage } from '../../../utils/errorHelper'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../../context/AuthContext'
import { useDialog } from '../../../hooks/useDialog'
import { DIALOG_MESSAGES } from '../../../utils/dialogMessages'
import { getHospital } from '../../../api/adminApi'
import { useAdminHospitalLookups, useAdminHospitalMutations } from '../../../features/hospitals/useAdminHospitals'

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

// Searchable Select Component
function SearchableSelect({ id, label, options, value, onChange, placeholder, disabled = false, error = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.id.toString() === value.toString())
  const filteredOptions = options
    .filter(opt => opt.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  return (
    <div className="admin-form-group" ref={dropdownRef} style={{ position: 'relative', opacity: disabled ? 0.6 : 1 }}>
      <label className="admin-form-label">{label}</label>
      <div
        id={id}
        tabIndex={0}
        className={`admin-form-input ${error ? 'has-error' : ''}`}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer', background: 'var(--admin-card-bg)',
          height: 48, padding: '0 16px', borderRadius: 12,
          fontSize: 14, fontWeight: 500, transition: 'all 0.2s', color: 'var(--admin-text)'
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span style={{ color: selectedOption ? 'var(--admin-text)' : 'var(--admin-text-muted)' }}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <span style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {error && <div className="admin-form-error" style={{ marginTop: 4, color: '#EF4444', fontSize: 12.5, fontWeight: 600 }}>{error}</div>}

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 12, marginTop: 8,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)', overflow: 'hidden', zIndex: 1000
        }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.02)' }}>
            <input
              type="text"
              autoFocus
              placeholder="Search..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--admin-border)', outline: 'none', fontSize: 13, background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>No results</div>
            ) : (
              filteredOptions.map(opt => (
                <div
                  key={opt.id}
                  style={{
                    padding: '10px 16px', fontSize: 14, cursor: 'pointer',
                    background: value.toString() === opt.id.toString() ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    color: 'var(--admin-text)',
                    borderBottom: '1px solid var(--admin-border)'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.03)'}
                  onMouseLeave={(e) => e.target.style.background = value.toString() === opt.id.toString() ? 'rgba(99, 102, 241, 0.1)' : 'transparent'}
                  onClick={() => {
                    onChange(opt.id.toString())
                    setIsOpen(false)
                    setSearch('')
                  }}
                >
                  {opt.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function HospitalFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { showSuccess, showError } = useDialog()
  const isEdit = Boolean(id)
  const canEditPhone = isAdmin || !isEdit

  const [form, setForm] = useState({
    name: '', hospital_type: '', license_number: '', about: '',
    district_id: '', upazila_id: '', union_id: '', division_id: '',
    address: '', latitude: '', longitude: '',
    phone: '', hotline: '', email: '', official_email: '', url: '',
    facebook_url: '', youtube_url: '', x_url: '', linkedin_url: '',
    ambulance_number: '', reserved_doctor_number: '', visited_doctor_number: '',
    nurse_number: '', staff_number: '', ICU_number: '', CCU_number: '', HDU_number: '', Cabin_number: '',
    top_10_hospital: 'no', is_active: true
  })

  // Media States
  const [media, setMedia] = useState({
    photo: null, logo: null, banner: null,
    photoPreview: null, logoPreview: null, bannerPreview: null,
    photoDims: null, logoDims: null, bannerDims: null
  })
  const [removedMedia, setRemovedMedia] = useState({
    photo: false, logo: false, banner: false
  })

  const fileInputRefs = {
    photo: useRef(null),
    logo: useRef(null),
    banner: useRef(null)
  }

  const [tests, setTests] = useState([])

  const { divisions, districts, upazilas, unions } = useAdminHospitalLookups({
    divisionId: form.division_id,
    districtId: form.district_id,
    upazilaId: form.upazila_id,
  })
  const { createHospital: saveNewHospital, updateHospital: saveUpdatedHospital } = useAdminHospitalMutations()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => { if (isEdit) loadHospital() }, [id])

  const loadHospital = async () => {
    setLoading(true)
    try {
      const res = await getHospital(id)
      const h = res.data?.data || res.data
      setForm({
        name: h.name || '',
        hospital_type: h.hospital_type || h.type || '',
        about: h.about || h.bio || '',
        license_number: h.license_number || '',
        division_id: h.division_id ? String(h.division_id) : (h.division?.id ? String(h.division.id) : ''),
        district_id: h.district_id ? String(h.district_id) : (h.district?.id ? String(h.district.id) : ''),
        upazila_id: h.upazila_id ? String(h.upazila_id) : (h.upazila?.id ? String(h.upazila.id) : ''),
        union_id: h.union_id ? String(h.union_id) : (h.union?.id ? String(h.union.id) : ''),
        address: h.address || '',
        latitude: h.latitude ?? '',
        longitude: h.longitude ?? '',
        phone: h.phone || '',
        hotline: h.hotline || '',
        email: h.email || '',
        official_email: h.official_email || h.email || '',
        url: h.url || h.website || '',
        facebook_url: h.facebook_url || '',
        youtube_url: h.youtube_url || '',
        x_url: h.x_url || h.twitter_url || '',
        linkedin_url: h.linkedin_url || '',
        ambulance_number: h.ambulance_number || '',
        reserved_doctor_number: h.reserved_doctor_number ?? '',
        visited_doctor_number: h.visited_doctor_number ?? '',
        nurse_number: h.nurse_number ?? h.nurse_count ?? '',
        staff_number: h.staff_number ?? h.staff_count ?? '',
        ICU_number: h.ICU_number ?? h.icu_beds ?? '',
        CCU_number: h.CCU_number ?? h.ccu_beds ?? '',
        HDU_number: h.HDU_number ?? h.hdu_beds ?? '',
        Cabin_number: h.Cabin_number ?? h.cabin_count ?? '',
        top_10_hospital: h.top_10_hospital === 'yes' ? 'yes' : 'no',
        is_active: h.is_active ?? true
      })
      if (h.medical_test_list) setTests(Array.isArray(h.medical_test_list) ? h.medical_test_list : [])
      setMedia(m => ({
        ...m,
        photoPreview: h.photo_url,
        logoPreview: h.logo_url,
        bannerPreview: h.banner_url
      }))
      setRemovedMedia({ photo: false, logo: false, banner: false })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleMediaChange = (e, type) => {
    const file = e.target.files[0]
    if (file) {
      const maxMb = type === 'banner' ? 5 : 2
      const errorKey = type === 'banner' ? 'hospital_banner' : type === 'logo' ? 'hospital_logo' : 'photo'
      if (file.size > maxMb * 1024 * 1024) {
        const msg = `${type === 'banner' ? 'Banner image' : type === 'logo' ? 'Logo' : 'Profile photo'} must not exceed ${maxMb} MB.`
        toast.error(msg)
        setErrors(prev => ({ ...prev, [errorKey]: msg }))
        return
      }

      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      img.onload = () => {
        setMedia(m => ({
          ...m,
          [type]: file,
          [`${type}Preview`]: objectUrl,
          [`${type}Dims`]: { width: img.naturalWidth, height: img.naturalHeight }
        }))
        setRemovedMedia(prev => ({ ...prev, [type]: false }))
        setErrors(prev => ({ ...prev, [errorKey]: '' }))
      }
      img.onerror = () => {
        setMedia(m => ({
          ...m,
          [type]: file,
          [`${type}Preview`]: objectUrl,
          [`${type}Dims`]: null
        }))
        setRemovedMedia(prev => ({ ...prev, [type]: false }))
        setErrors(prev => ({ ...prev, [errorKey]: '' }))
      }
      img.src = objectUrl
    }
  }

  const handleRemoveMedia = (type) => {
    setMedia(m => ({
      ...m,
      [type]: null,
      [`${type}Preview`]: null,
      [`${type}Dims`]: null
    }))
    setRemovedMedia(prev => ({ ...prev, [type]: true }))
    if (fileInputRefs[type]?.current) {
      fileInputRefs[type].current.value = ''
    }
    const label = type === 'banner' ? 'ব্যানার ছবি' : type === 'logo' ? 'লোগো' : 'প্রোফাইল ছবি'
    toast.success(`${label} সরানো হয়েছে`)
  }

  const scrollToFirstError = (errObj) => {
    const errorKeys = Object.keys(errObj)
    if (errorKeys.length === 0) return

    const fieldOrder = [
      'name',
      'hospital_type',
      'license_number',
      'photo',
      'hospital_logo',
      'hospital_banner',
      'division_id',
      'district_id',
      'address',
      'phone',
      'ambulance_number',
      'hotline',
      'official_email',
      'email'
    ]

    const firstKey = fieldOrder.find(key => errObj[key]) || errorKeys[0]

    let targetEl = document.querySelector(`[name="${firstKey}"]`)
    if (!targetEl) targetEl = document.getElementById(`field-${firstKey}`)
    if (!targetEl && firstKey === 'division_id') targetEl = document.getElementById('field-division_id')
    if (!targetEl && firstKey === 'district_id') targetEl = document.getElementById('field-district_id')
    if (!targetEl && firstKey === 'hospital_type') targetEl = document.getElementById('field-hospital_type')
    if (!targetEl && firstKey === 'photo') targetEl = document.getElementById('field-photo')
    if (!targetEl && firstKey === 'hospital_logo') targetEl = document.getElementById('field-hospital_logo')
    if (!targetEl && firstKey === 'hospital_banner') targetEl = document.getElementById('field-hospital_banner')

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => {
        targetEl.focus?.()
      }, 300)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!form.name || !form.name.trim()) {
      newErrors.name = 'Hospital Name is required.'
    }
    if (!form.hospital_type) {
      newErrors.hospital_type = 'Type of Hospital is required.'
    }
    if (!form.license_number || !form.license_number.trim()) {
      newErrors.license_number = 'Hospital License Number is required.'
    }
    if (!form.division_id) {
      newErrors.division_id = 'Division selection is required.'
    }
    if (!form.district_id) {
      newErrors.district_id = 'District selection is required.'
    }
    if (!form.address || !form.address.trim()) {
      newErrors.address = 'Hospital Address is required.'
    }
    if (!form.phone || !form.phone.trim()) {
      newErrors.phone = 'Mobile / Phone Number is required.'
    } else if (!/^01[3-9]\d{8}$/.test(form.phone.trim())) {
      newErrors.phone = 'Please enter a valid 11-digit Bangladeshi mobile number (e.g. 017XXXXXXXX).'
    }

    if (form.ambulance_number && form.ambulance_number.trim()) {
      if (!/^01[3-9]\d{8}$/.test(form.ambulance_number.trim())) {
        newErrors.ambulance_number = 'Please enter a valid 11-digit Bangladesh mobile number. Example: 01712345678'
      }
    }

    if (form.official_email && form.official_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(form.official_email.trim())) {
        newErrors.official_email = 'Please enter a valid email address (e.g. info@hospital.com).'
      }
    }

    if (form.email && form.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(form.email.trim())) {
        newErrors.email = 'Please enter a valid email address (e.g. info@hospital.com).'
      }
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      scrollToFirstError(newErrors)
      const firstErrMsg = Object.values(newErrors)[0]
      toast.error(firstErrMsg || 'অনুগ্রহ করে প্রয়োজনীয় তথ্যগুলো পূরণ করুন।')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSaving(true)
    const formData = new FormData()

    // Core Fields
    Object.keys(form).forEach(key => {
      let value = form[key]
      if (key === 'is_active') value = value ? '1' : '0'
      if (value !== null && value !== undefined) {
        formData.append(key, value)
      }
    })

    // Medical Tests
    const validTests = tests.filter(t => t.trim() !== '')
    validTests.forEach((t, i) => formData.append(`medical_test_list[${i}]`, t))

    // Files (Upload new file, or explicitly signal removal)
    if (media.photo) {
      formData.append('photo', media.photo)
    } else if (removedMedia.photo) {
      formData.append('photo', '')
    }

    if (media.logo) {
      formData.append('hospital_logo', media.logo)
    } else if (removedMedia.logo) {
      formData.append('hospital_logo', '')
    }

    if (media.banner) {
      formData.append('hospital_banner', media.banner)
    } else if (removedMedia.banner) {
      formData.append('hospital_banner', '')
    }

    try {
      let res
      if (isEdit) {
        formData.append('_method', 'PUT')
        res = await saveUpdatedHospital({ id, formData })
        const successMsg = res?.data?.message || DIALOG_MESSAGES.HOSPITAL_SAVE_SUCCESS.message
        toast.success(successMsg)
        showSuccess({
          title: DIALOG_MESSAGES.UPDATE_SUCCESS.title,
          message: successMsg,
        })
      } else {
        res = await saveNewHospital(formData)
        const successMsg = res?.data?.message || DIALOG_MESSAGES.HOSPITAL_SAVE_SUCCESS.message
        toast.success(successMsg)
        showSuccess({
          title: DIALOG_MESSAGES.SAVE_SUCCESS.title,
          message: successMsg,
        })
      }
      setTimeout(() => navigate('/admin/hospitals'), 1200)
    } catch (err) {
      const backendErrors = err.response?.data?.errors || {}
      const formattedErrors = {}
      Object.keys(backendErrors).forEach(key => {
        const msg = Array.isArray(backendErrors[key]) ? backendErrors[key][0] : backendErrors[key]
        formattedErrors[key] = msg
      })
      setErrors(formattedErrors)
      const firstValidationMsg = Object.values(formattedErrors)[0]
      const errorMsg = firstValidationMsg || (err.response?.data?.message !== 'Validation failed.' && err.response?.data?.message) || getErrorMessage(err, 'হাসপাতালের তথ্য সংরক্ষণে সমস্যা হয়েছে')
      toast.error(errorMsg)
      if (Object.keys(formattedErrors).length > 0) {
        scrollToFirstError(formattedErrors)
      } else {
        showError({
          title: DIALOG_MESSAGES.ERROR.title,
          message: errorMsg,
        })
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /> Loading Data...</div>

  return (
    <div className="admin-container" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>{isEdit ? '🏢 Edit Hospital Profile' : '🏥 Register New Hospital'}</h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Configure facility details, license, capacity, and geographical location</p>
        </div>
        <Link to="/admin/hospitals" className="admin-btn admin-btn-outline" style={{ borderRadius: 12 }}>← Back</Link>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 32 }}>

        {/* Basic Info & Media */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Basic Information</h3>
          </div>
          <div className="admin-card-body" style={{ display: 'grid', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, overflow: 'visible' }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Hospital Name *</label>
                <input
                  className={`admin-form-input ${errors.name ? 'has-error' : ''}`}
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter full hospital name"
                  style={{ height: 48, fontSize: 15, fontWeight: 600 }}
                />
                {errors.name && <div className="admin-form-error" style={{ marginTop: 4, color: '#EF4444', fontSize: 12.5, fontWeight: 600 }}>{errors.name}</div>}
              </div>

              <SearchableSelect
                id="field-hospital_type"
                label="Type of Hospital *"
                options={HOSPITAL_TYPES}
                value={form.hospital_type}
                onChange={(val) => {
                  setForm(f => ({ ...f, hospital_type: val }))
                  if (errors.hospital_type) setErrors(e => ({ ...e, hospital_type: '' }))
                }}
                placeholder="Select Hospital Type (e.g. Clinic, Specialized, etc.)"
                error={errors.hospital_type}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Hospital License Number *</label>
              <input
                className={`admin-form-input ${errors.license_number ? 'has-error' : ''}`}
                name="license_number"
                value={form.license_number}
                onChange={handleChange}
                placeholder="e.g. REG-HS-998234"
                style={{ height: 48, fontSize: 14, fontWeight: 500 }}
              />
              {errors.license_number && <div className="admin-form-error" style={{ marginTop: 4, color: '#EF4444', fontSize: 12.5, fontWeight: 600 }}>{errors.license_number}</div>}
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">About Hospital (হাসপাতাল সম্পর্কে)</label>
              <textarea
                className={`admin-form-input ${errors.about ? 'has-error' : ''}`}
                name="about"
                value={form.about}
                onChange={handleChange}
                placeholder="Describe hospital overview, specialized medical care, mission, facilities..."
                style={{ height: 110, padding: '12px 16px', resize: 'vertical' }}
              />
              {errors.about && <div className="admin-form-error" style={{ marginTop: 4, color: '#EF4444', fontSize: 12.5, fontWeight: 600 }}>{errors.about}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
              {/* Profile Photo Dropzone */}
              <div id="field-photo">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <label className="admin-form-label" style={{ margin: 0 }}>
                    Profile Photo <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-muted)' }}>(Max 2 MB)</span>
                  </label>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#00B875', background: 'rgba(0, 184, 117, 0.08)', padding: '2px 6px', borderRadius: 6 }}>
                    অনুপাত ১:১ (৪০০x৪০০ px)
                  </span>
                </div>
                <div 
                  className="media-dropzone"
                  style={{ 
                    border: `2px dashed ${errors.photo ? '#EF4444' : 'var(--admin-border)'}`, 
                    borderRadius: 16, 
                    padding: 16, 
                    textAlign: 'center', 
                    background: errors.photo ? 'rgba(239, 68, 68, 0.03)' : 'rgba(0,0,0,0.02)',
                    position: 'relative'
                  }}
                >
                  {media.photoPreview ? (
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: 10 }} className="media-preview-container">
                      <img 
                        src={media.photoPreview} 
                        alt="Profile Photo" 
                        style={{ width: 110, height: 110, borderRadius: 14, objectFit: 'cover', display: 'block', border: '1px solid var(--admin-border)' }} 
                      />
                      {/* Hover Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia('photo')}
                        title="ছবিটি মুছে ফেলুন (Remove image)"
                        aria-label="Remove Photo"
                        className="media-remove-btn"
                        style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: '#EF4444',
                          color: '#FFFFFF',
                          border: '2px solid #FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          padding: 0
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 900, lineHeight: 1 }}>✕</span>
                      </button>

                      {media.photoDims && (
                        <div style={{
                          marginTop: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          color: Math.abs(media.photoDims.width - media.photoDims.height) < 40 ? '#059669' : '#D97706',
                          background: Math.abs(media.photoDims.width - media.photoDims.height) < 40 ? '#ECFDF5' : '#FFFBEB',
                          padding: '2px 8px',
                          borderRadius: 6,
                          display: 'inline-block',
                          border: `1px solid ${Math.abs(media.photoDims.width - media.photoDims.height) < 40 ? '#A7F3D0' : '#FDE68A'}`
                        }}>
                          {media.photoDims.width} × {media.photoDims.height} px
                          {Math.abs(media.photoDims.width - media.photoDims.height) < 40 ? ' ✓ পারফেক্ট' : ' (১:১ বাঞ্ছনীয়)'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '14px 0 10px 0', color: 'var(--admin-text-muted)' }}>
                      <div style={{ fontSize: 26, marginBottom: 4 }}>📷</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>কোনো ছবি নির্বাচিত নেই</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>প্রস্তাবিত সাইজ: 400×400 বা 500×500 px (বর্গাকার)</div>
                    </div>
                  )}

                  <input 
                    ref={fileInputRefs.photo}
                    type="file" 
                    onChange={(e) => handleMediaChange(e, 'photo')} 
                    accept="image/*" 
                    style={{ fontSize: 12, color: 'var(--admin-text-muted)', width: '100%', marginTop: 6 }} 
                  />
                </div>
                {errors.photo && <div className="admin-form-error" style={{ marginTop: 6, color: '#EF4444', fontSize: 12.5, fontWeight: 600 }}>{errors.photo}</div>}
              </div>

              {/* Hospital Logo Dropzone */}
              <div id="field-hospital_logo">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <label className="admin-form-label" style={{ margin: 0 }}>
                    Hospital Logo <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-muted)' }}>(Max 2 MB)</span>
                  </label>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#00B875', background: 'rgba(0, 184, 117, 0.08)', padding: '2px 6px', borderRadius: 6 }}>
                    অনুপাত ১:১ (৩০০x৩০০ px)
                  </span>
                </div>
                <div 
                  className="media-dropzone"
                  style={{ 
                    border: `2px dashed ${errors.hospital_logo ? '#EF4444' : 'var(--admin-border)'}`, 
                    borderRadius: 16, 
                    padding: 16, 
                    textAlign: 'center', 
                    background: errors.hospital_logo ? 'rgba(239, 68, 68, 0.03)' : 'rgba(0,0,0,0.02)',
                    position: 'relative'
                  }}
                >
                  {media.logoPreview ? (
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: 10 }} className="media-preview-container">
                      <img 
                        src={media.logoPreview} 
                        alt="Hospital Logo" 
                        style={{ width: 110, height: 110, borderRadius: 14, objectFit: 'contain', display: 'block', background: '#FFFFFF', padding: 6, border: '1px solid var(--admin-border)' }} 
                      />
                      {/* Hover Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia('logo')}
                        title="লোগো মুছে ফেলুন (Remove logo)"
                        aria-label="Remove Logo"
                        className="media-remove-btn"
                        style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: '#EF4444',
                          color: '#FFFFFF',
                          border: '2px solid #FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          padding: 0
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 900, lineHeight: 1 }}>✕</span>
                      </button>

                      {media.logoDims && (
                        <div style={{
                          marginTop: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          color: Math.abs(media.logoDims.width - media.logoDims.height) < 40 ? '#059669' : '#D97706',
                          background: Math.abs(media.logoDims.width - media.logoDims.height) < 40 ? '#ECFDF5' : '#FFFBEB',
                          padding: '2px 8px',
                          borderRadius: 6,
                          display: 'inline-block',
                          border: `1px solid ${Math.abs(media.logoDims.width - media.logoDims.height) < 40 ? '#A7F3D0' : '#FDE68A'}`
                        }}>
                          {media.logoDims.width} × {media.logoDims.height} px
                          {Math.abs(media.logoDims.width - media.logoDims.height) < 40 ? ' ✓ পারফেক্ট' : ' (১:১ বা স্বচ্ছ PNG)'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '14px 0 10px 0', color: 'var(--admin-text-muted)' }}>
                      <div style={{ fontSize: 26, marginBottom: 4 }}>🛡️</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>কোনো লোগো নির্বাচিত নেই</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>প্রস্তাবিত সাইz: 300×300 বা 512×512 px (PNG)</div>
                    </div>
                  )}

                  <input 
                    ref={fileInputRefs.logo}
                    type="file" 
                    onChange={(e) => handleMediaChange(e, 'logo')} 
                    accept="image/*" 
                    style={{ fontSize: 12, color: 'var(--admin-text-muted)', width: '100%', marginTop: 6 }} 
                  />
                </div>
                {errors.hospital_logo && <div className="admin-form-error" style={{ marginTop: 6, color: '#EF4444', fontSize: 12.5, fontWeight: 600 }}>{errors.hospital_logo}</div>}
              </div>

              {/* Banner Image Dropzone */}
              <div id="field-hospital_banner">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <label className="admin-form-label" style={{ margin: 0 }}>
                    Banner Image <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-text-muted)' }}>(Max 5 MB)</span>
                  </label>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#3B82F6', background: 'rgba(59, 130, 246, 0.08)', padding: '2px 6px', borderRadius: 6 }}>
                    অনুপাত ১৬:৯ (১২০০x৪৫০ px)
                  </span>
                </div>
                <div 
                  className="media-dropzone"
                  style={{ 
                    border: `2px dashed ${errors.hospital_banner ? '#EF4444' : 'var(--admin-border)'}`, 
                    borderRadius: 16, 
                    padding: 16, 
                    textAlign: 'center', 
                    background: errors.hospital_banner ? 'rgba(239, 68, 68, 0.03)' : 'rgba(0,0,0,0.02)',
                    position: 'relative'
                  }}
                >
                  {media.bannerPreview ? (
                    <div style={{ position: 'relative', display: 'inline-block', width: '100%', maxWidth: 260, marginBottom: 10 }} className="media-preview-container">
                      <img 
                        src={media.bannerPreview} 
                        alt="Hospital Banner" 
                        style={{ width: '100%', height: 110, borderRadius: 14, objectFit: 'cover', display: 'block', border: '1px solid var(--admin-border)' }} 
                      />
                      {/* Hover Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia('banner')}
                        title="ব্যানার ছবি মুছে ফেলুন (Remove banner)"
                        aria-label="Remove Banner"
                        className="media-remove-btn"
                        style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: '#EF4444',
                          color: '#FFFFFF',
                          border: '2px solid #FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          padding: 0
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 900, lineHeight: 1 }}>✕</span>
                      </button>

                      {media.bannerDims && (
                        <div style={{
                          marginTop: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          color: media.bannerDims.width >= media.bannerDims.height * 1.5 ? '#059669' : '#D97706',
                          background: media.bannerDims.width >= media.bannerDims.height * 1.5 ? '#ECFDF5' : '#FFFBEB',
                          padding: '2px 8px',
                          borderRadius: 6,
                          display: 'inline-block',
                          border: `1px solid ${media.bannerDims.width >= media.bannerDims.height * 1.5 ? '#A7F3D0' : '#FDE68A'}`
                        }}>
                          {media.bannerDims.width} × {media.bannerDims.height} px
                          {media.bannerDims.width >= media.bannerDims.height * 1.5 ? ' ✓ ওয়াইডস্ক্রিন' : ' (১৬:৯ ওয়াইডস্ক্রিন প্রস্তাবিত)'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '14px 0 10px 0', color: 'var(--admin-text-muted)' }}>
                      <div style={{ fontSize: 26, marginBottom: 4 }}>🖼️</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>কোনো ব্যানার নির্বাচিত নেই</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>প্রস্তাবিত সাইজ: 1200×450 বা 1920×600 px (Landscape)</div>
                    </div>
                  )}

                  <input 
                    ref={fileInputRefs.banner}
                    type="file" 
                    onChange={(e) => handleMediaChange(e, 'banner')} 
                    accept="image/*" 
                    style={{ fontSize: 12, color: 'var(--admin-text-muted)', width: '100%', marginTop: 6 }} 
                  />
                </div>
                {errors.hospital_banner && <div className="admin-form-error" style={{ marginTop: 6, color: '#EF4444', fontSize: 12.5, fontWeight: 600 }}>{errors.hospital_banner}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Location & Geography */}
        <div className="admin-card" style={{ overflow: 'visible' }}>
          <div className="admin-card-header" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
            <h3 className="admin-card-title" style={{ color: '#10B981' }}>Geographical Location & Address</h3>
          </div>
          <div className="admin-card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, overflow: 'visible' }}>
            <SearchableSelect id="field-division_id" label="Division *" options={divisions} value={form.division_id} onChange={(val) => { setForm(f => ({ ...f, division_id: val, district_id: '', upazila_id: '', union_id: '' })); if (errors.division_id) setErrors(e => ({ ...e, division_id: '' })) }} placeholder="Select Division" error={errors.division_id} />
            <SearchableSelect id="field-district_id" label="District *" options={districts} value={form.district_id} onChange={(val) => { setForm(f => ({ ...f, district_id: val, upazila_id: '', union_id: '' })); if (errors.district_id) setErrors(e => ({ ...e, district_id: '' })) }} placeholder="Select District" disabled={!form.division_id} error={errors.district_id} />
            <SearchableSelect label="Upazila" options={upazilas} value={form.upazila_id} onChange={(val) => setForm(f => ({ ...f, upazila_id: val, union_id: '' }))} placeholder="Select Upazila" disabled={!form.district_id} />
            <SearchableSelect label="Union" options={unions} value={form.union_id} onChange={(val) => setForm(f => ({ ...f, union_id: val }))} placeholder="Select Union" disabled={!form.upazila_id} />

            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="admin-form-label">Full Hospital Address *</label>
              <textarea
                className={`admin-form-input ${errors.address ? 'has-error' : ''}`}
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Specific location, road, house number, area details..."
                style={{ height: 100, padding: '12px 16px', resize: 'none' }}
              />
              {errors.address && <div className="admin-form-error" style={{ marginTop: 4, color: '#EF4444', fontSize: 12.5, fontWeight: 600 }}>{errors.address}</div>}
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Map Latitude (অক্ষাংশ)</label>
              <input
                type="number"
                step="any"
                className={`admin-form-input ${errors.latitude ? 'has-error' : ''}`}
                name="latitude"
                value={form.latitude}
                onChange={handleChange}
                placeholder="e.g. 23.8103"
              />
              {errors.latitude && <div className="admin-form-error" style={{ marginTop: 4, color: '#EF4444', fontSize: 12.5, fontWeight: 600 }}>{errors.latitude}</div>}
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Map Longitude (দ্রাঘিমাংশ)</label>
              <input
                type="number"
                step="any"
                className={`admin-form-input ${errors.longitude ? 'has-error' : ''}`}
                name="longitude"
                value={form.longitude}
                onChange={handleChange}
                placeholder="e.g. 90.4125"
              />
              {errors.longitude && <div className="admin-form-error" style={{ marginTop: 4, color: '#EF4444', fontSize: 12.5, fontWeight: 600 }}>{errors.longitude}</div>}
            </div>
          </div>
        </div>

        {/* Contact & Hot Numbers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">Contact & Communication</h3>
            </div>
            <div className="admin-card-body" style={{ display: 'grid', gap: 20 }}>
              <div className="admin-form-group">
                <label className="admin-form-label">
                  Mobile / Phone Number * {(!canEditPhone) && <span style={{ fontSize: 11, fontWeight: 600, color: '#00B875', marginLeft: 4 }}>✓ (OTP Verified — Non-editable)</span>}
                </label>
                <input
                  className={`admin-form-input ${errors.phone ? 'has-error' : ''}`}
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="017XXXXXXXX"
                  disabled={!canEditPhone}
                  readOnly={!canEditPhone}
                  title={!canEditPhone ? "Verified phone number cannot be changed" : ""}
                  style={!canEditPhone ? { background: 'rgba(0,0,0,0.04)', cursor: 'not-allowed', color: 'var(--admin-text-muted)' } : {}}
                />
                {errors.phone && <div className="admin-form-error" style={{ marginTop: 4, color: '#EF4444', fontSize: 12.5, fontWeight: 600 }}>{errors.phone}</div>}
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Hot Number (Hotline)</label>
                <input
                  className={`admin-form-input ${errors.hotline ? 'has-error' : ''}`}
                  name="hotline"
                  value={form.hotline}
                  onChange={handleChange}
                  placeholder="e.g. 10616 / 09612345678"
                />
                {errors.hotline && <div className="admin-form-error" style={{ marginTop: 4, color: '#EF4444', fontSize: 12.5, fontWeight: 600 }}>{errors.hotline}</div>}
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Official Email</label>
                <input
                  className={`admin-form-input ${errors.official_email || errors.email ? 'has-error' : ''}`}
                  type="email"
                  name="official_email"
                  value={form.official_email}
                  onChange={(e) => {
                    handleChange(e)
                    setForm(f => ({ ...f, email: e.target.value }))
                  }}
                  placeholder="info@hospital.com"
                />
                {(errors.official_email || errors.email) && (
                  <div className="admin-form-error" style={{ marginTop: 4, color: '#EF4444', fontSize: 12.5, fontWeight: 600 }}>
                    {errors.official_email || errors.email}
                  </div>
                )}
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Website URL</label>
                <input className="admin-form-input" name="url" value={form.url} onChange={handleChange} placeholder="https://..." />
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">Medical Tests Offered</h3>
            </div>
            <div className="admin-card-body">
              {tests.map((test, index) => (
                <div key={index} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <input
                    className="admin-form-input"
                    value={test}
                    onChange={(e) => {
                      const newTests = [...tests]
                      newTests[index] = e.target.value
                      setTests(newTests)
                    }}
                    placeholder="e.g. MRI Scan"
                  />
                  <button type="button" onClick={() => setTests(tests.filter((_, i) => i !== index))} className="admin-btn admin-btn-danger" style={{ padding: '0 15px' }}>✕</button>
                </div>
              ))}
              <button type="button" onClick={() => setTests([...tests, ''])} className="admin-btn admin-btn-outline" style={{ width: '100%', marginTop: 8 }}>+ Add Service/Test</button>
            </div>
          </div>
        </div>

        {/* Social Media Links Card */}
        <div className="admin-card">
          <div className="admin-card-header" style={{ background: 'rgba(99, 102, 241, 0.05)' }}>
            <h3 className="admin-card-title" style={{ color: '#4F46E5' }}>Social Media Profiles (সামাজিক মাধ্যম)</h3>
          </div>
          <div className="admin-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Facebook Page / Profile URL</label>
              <input
                className={`admin-form-input ${errors.facebook_url ? 'has-error' : ''}`}
                name="facebook_url"
                value={form.facebook_url}
                onChange={handleChange}
                placeholder="https://facebook.com/..."
              />
              {errors.facebook_url && <div className="admin-form-error" style={{ marginTop: 4, color: '#EF4444', fontSize: 12.5, fontWeight: 600 }}>{errors.facebook_url}</div>}
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">YouTube Channel URL</label>
              <input
                className={`admin-form-input ${errors.youtube_url ? 'has-error' : ''}`}
                name="youtube_url"
                value={form.youtube_url}
                onChange={handleChange}
                placeholder="https://youtube.com/..."
              />
              {errors.youtube_url && <div className="admin-form-error" style={{ marginTop: 4, color: '#EF4444', fontSize: 12.5, fontWeight: 600 }}>{errors.youtube_url}</div>}
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">X (Twitter) Profile URL</label>
              <input
                className={`admin-form-input ${errors.x_url ? 'has-error' : ''}`}
                name="x_url"
                value={form.x_url}
                onChange={handleChange}
                placeholder="https://x.com/..."
              />
              {errors.x_url && <div className="admin-form-error" style={{ marginTop: 4, color: '#EF4444', fontSize: 12.5, fontWeight: 600 }}>{errors.x_url}</div>}
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">LinkedIn Page URL</label>
              <input
                className={`admin-form-input ${errors.linkedin_url ? 'has-error' : ''}`}
                name="linkedin_url"
                value={form.linkedin_url}
                onChange={handleChange}
                placeholder="https://linkedin.com/company/..."
              />
              {errors.linkedin_url && <div className="admin-form-error" style={{ marginTop: 4, color: '#EF4444', fontSize: 12.5, fontWeight: 600 }}>{errors.linkedin_url}</div>}
            </div>
          </div>
        </div>

        {/* Capacity & Stats */}
        <div className="admin-card">
          <div className="admin-card-header" style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
            <h3 className="admin-card-title" style={{ color: '#3B82F6' }}>Facility Capacity & Statistics</h3>
          </div>
          <div className="admin-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            <div className="admin-form-group" id="field-ambulance_number">
              <label className="admin-form-label">🚑 Ambulance Contact</label>
              <input
                type="text"
                className={`admin-form-input ${errors.ambulance_number ? 'has-error' : ''}`}
                name="ambulance_number"
                value={form.ambulance_number || ''}
                onChange={handleChange}
                placeholder="01712345678"
                maxLength={11}
              />
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                Example: 01712345678
              </div>
              {errors.ambulance_number && (
                <div className="admin-form-error" style={{ marginTop: 4, color: '#EF4444', fontSize: 12.5, fontWeight: 600 }}>
                  {errors.ambulance_number}
                </div>
              )}
            </div>

            {[
              { name: 'reserved_doctor_number', label: 'Reserved Doctors', icon: '👨‍⚕️' },
              { name: 'visited_doctor_number', label: 'Visiting Doctors', icon: '🩺' },
              { name: 'nurse_number', label: 'Total Nurses', icon: '👩‍⚕️' },
              { name: 'staff_number', label: 'Total Staff', icon: '👥' },
              { name: 'ICU_number', label: 'ICU Beds', icon: '🏥' },
              { name: 'CCU_number', label: 'CCU Beds', icon: '💓' },
              { name: 'HDU_number', label: 'HDU Beds', icon: '🛌' },
              { name: 'Cabin_number', label: 'Private Cabins', icon: '🏠' },
            ].map(field => (
              <div key={field.name} className="admin-form-group">
                <label className="admin-form-label">{field.icon} {field.label}</label>
                <input
                  type="number"
                  className="admin-form-input"
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Global Settings */}
        <div className="admin-card" style={{ border: '1px solid rgba(245, 158, 11, 0.2)', background: 'rgba(245, 158, 11, 0.03)' }}>
          <div className="admin-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#D97706' }}>⭐ Visibility & Status</h3>
              <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', margin: '4px 0 0' }}>Configure how this hospital appears to the public</p>
            </div>
            <div style={{ display: 'flex', gap: 40 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#D97706' }}>Top 10 Hospital</span>
                <input type="checkbox" style={{ width: 20, height: 20 }} checked={form.top_10_hospital === 'yes'} onChange={(e) => setForm(f => ({ ...f, top_10_hospital: e.target.checked ? 'yes' : 'no' }))} />
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>Active Status</span>
                <div
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  style={{
                    width: 48, height: 26, borderRadius: 14, padding: 3, cursor: 'pointer',
                    background: form.is_active ? '#10B981' : '#CBD5E1',
                    display: 'flex', transition: '0.3s',
                    justifyContent: form.is_active ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginBottom: 60 }}>
          <Link to="/admin/hospitals" className="admin-btn admin-btn-outline" style={{ padding: '14px 32px' }}>Discard Changes</Link>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving} style={{ padding: '14px 48px', fontSize: 16, fontWeight: 800, borderRadius: 14, boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2)' }}>
            {saving ? 'Processing...' : isEdit ? '💾 Update Hospital Profile' : '🚀 Register Hospital'}
          </button>
        </div>

      </form>

      <style dangerouslySetInnerHTML={{
        __html: `
        .admin-container { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* Media hover remove button effects */
        .media-preview-container {
          position: relative;
          transition: transform 0.2s ease;
        }
        .media-preview-container:hover {
          transform: scale(1.02);
        }
        .media-remove-btn {
          opacity: 0.85;
          transform: scale(0.95);
        }
        .media-preview-container:hover .media-remove-btn {
          opacity: 1;
          transform: scale(1.1);
        }
        .media-remove-btn:hover {
          background: #DC2626 !important;
          transform: scale(1.2) !important;
        }
      `}} />
    </div>
  )
}

// HospitalFormPage.jsx — Premium Hospital Create/Edit Form
import { getErrorMessage } from '../../../utils/errorHelper'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import {
  getHospital, createHospital, updateHospital,
  getDivisions, getDistricts, getUpazilas, getUnions
} from '../../../api/adminApi'

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
  const isEdit = Boolean(id)
  const canEditPhone = isAdmin || !isEdit

  const [form, setForm] = useState({
    name: '', hospital_type: '', license_number: '',
    district_id: '', upazila_id: '', union_id: '', division_id: '',
    address: '', phone: '', hotline: '', email: '', official_email: '', url: '',
    ambulance_number: '', reserved_doctor_number: '', visited_doctor_number: '',
    nurse_number: '', staff_number: '', ICU_number: '', CCU_number: '', HDU_number: '', Cabin_number: '',
    top_10_hospital: 'no', is_active: true
  })

  // Media States
  const [media, setMedia] = useState({
    photo: null, logo: null, banner: null,
    photoPreview: null, logoPreview: null, bannerPreview: null
  })

  const [tests, setTests] = useState([])
  const [locationData, setLocationData] = useState({
    divisions: [], districts: [], upazilas: [], unions: []
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => { loadInitialData() }, [])
  useEffect(() => { if (isEdit) loadHospital() }, [id])

  // Location Cascading Logic
  useEffect(() => {
    if (form.division_id) {
      getDistricts({ division_id: form.division_id }).then(res => setLocationData(p => ({ ...p, districts: res.data?.data || [] })))
    } else {
      setLocationData(p => ({ ...p, districts: [], upazilas: [], unions: [] }))
    }
  }, [form.division_id])

  useEffect(() => {
    if (form.district_id) {
      getUpazilas({ district_id: form.district_id }).then(res => setLocationData(p => ({ ...p, upazilas: res.data?.data || [] })))
    } else {
      setLocationData(p => ({ ...p, upazilas: [], unions: [] }))
    }
  }, [form.district_id])

  useEffect(() => {
    if (form.upazila_id) {
      getUnions({ upazila_id: form.upazila_id }).then(res => setLocationData(p => ({ ...p, unions: res.data?.data || [] })))
    } else {
      setLocationData(p => ({ ...p, unions: [] }))
    }
  }, [form.upazila_id])

  const loadInitialData = async () => {
    try {
      const res = await getDivisions()
      setLocationData(p => ({ ...p, divisions: res.data?.data || [] }))
    } catch (err) { console.error(err) }
  }

  const loadHospital = async () => {
    setLoading(true)
    try {
      const res = await getHospital(id)
      const h = res.data?.data || res.data
      setForm({
        name: h.name || '',
        hospital_type: h.hospital_type || '',
        license_number: h.license_number || '',
        division_id: h.division_id || '',
        district_id: h.district_id || '',
        upazila_id: h.upazila_id || '',
        union_id: h.union_id || '',
        address: h.address || '',
        phone: h.phone || '',
        hotline: h.hotline || '',
        email: h.email || '',
        official_email: h.official_email || h.email || '',
        url: h.url || '',
        ambulance_number: h.ambulance_number || '',
        reserved_doctor_number: h.reserved_doctor_number || '',
        visited_doctor_number: h.visited_doctor_number || '',
        nurse_number: h.nurse_number || '',
        staff_number: h.staff_number || '',
        ICU_number: h.ICU_number || '',
        CCU_number: h.CCU_number || '',
        HDU_number: h.HDU_number || '',
        Cabin_number: h.Cabin_number || '',
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
      setMedia(m => ({
        ...m,
        [type]: file,
        [`${type}Preview`]: URL.createObjectURL(file)
      }))
    }
  }

  const scrollToFirstError = (errObj) => {
    const errorKeys = Object.keys(errObj)
    if (errorKeys.length === 0) return

    const fieldOrder = [
      'name',
      'hospital_type',
      'license_number',
      'division_id',
      'district_id',
      'address',
      'phone',
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

    // Files
    if (media.photo) formData.append('photo', media.photo)
    if (media.logo) formData.append('hospital_logo', media.logo)
    if (media.banner) formData.append('hospital_banner', media.banner)

    try {
      if (isEdit) {
        formData.append('_method', 'PUT')
        await updateHospital(id, formData)
      } else {
        await createHospital(formData)
      }
      navigate('/admin/hospitals')
    } catch (err) {
      const backendErrors = err.response?.data?.errors || {}
      const formattedErrors = {}
      Object.keys(backendErrors).forEach(key => {
        const msg = Array.isArray(backendErrors[key]) ? backendErrors[key][0] : backendErrors[key]
        formattedErrors[key] = msg
      })
      setErrors(formattedErrors)
      if (Object.keys(formattedErrors).length > 0) {
        scrollToFirstError(formattedErrors)
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
              <div>
                <label className="admin-form-label">Profile Photo</label>
                <div style={{ border: '2px dashed var(--admin-border)', borderRadius: 16, padding: 20, textAlign: 'center', background: 'rgba(0,0,0,0.02)' }}>
                  {media.photoPreview && <img src={media.photoPreview} alt="P" style={{ width: 100, height: 100, borderRadius: 12, objectFit: 'cover', marginBottom: 12 }} />}
                  <input type="file" onChange={(e) => handleMediaChange(e, 'photo')} accept="image/*" style={{ fontSize: 12, color: 'var(--admin-text-muted)' }} />
                </div>
              </div>
              <div>
                <label className="admin-form-label">Hospital Logo</label>
                <div style={{ border: '2px dashed var(--admin-border)', borderRadius: 16, padding: 20, textAlign: 'center', background: 'rgba(0,0,0,0.02)' }}>
                  {media.logoPreview && <img src={media.logoPreview} alt="L" style={{ width: 100, height: 100, borderRadius: 12, objectFit: 'contain', marginBottom: 12 }} />}
                  <input type="file" onChange={(e) => handleMediaChange(e, 'logo')} accept="image/*" style={{ fontSize: 12, color: 'var(--admin-text-muted)' }} />
                </div>
              </div>
              <div>
                <label className="admin-form-label">Banner Image</label>
                <div style={{ border: '2px dashed var(--admin-border)', borderRadius: 16, padding: 20, textAlign: 'center', background: 'rgba(0,0,0,0.02)' }}>
                  {media.bannerPreview && <img src={media.bannerPreview} alt="B" style={{ width: 180, height: 100, borderRadius: 12, objectFit: 'cover', marginBottom: 12 }} />}
                  <input type="file" onChange={(e) => handleMediaChange(e, 'banner')} accept="image/*" style={{ fontSize: 12, color: 'var(--admin-text-muted)' }} />
                </div>
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
            <SearchableSelect id="field-division_id" label="Division *" options={locationData.divisions} value={form.division_id} onChange={(val) => { setForm(f => ({ ...f, division_id: val, district_id: '', upazila_id: '', union_id: '' })); if (errors.division_id) setErrors(e => ({ ...e, division_id: '' })) }} placeholder="Select Division" error={errors.division_id} />
            <SearchableSelect id="field-district_id" label="District *" options={locationData.districts} value={form.district_id} onChange={(val) => { setForm(f => ({ ...f, district_id: val, upazila_id: '', union_id: '' })); if (errors.district_id) setErrors(e => ({ ...e, district_id: '' })) }} placeholder="Select District" disabled={!form.division_id} error={errors.district_id} />
            <SearchableSelect label="Upazila" options={locationData.upazilas} value={form.upazila_id} onChange={(val) => setForm(f => ({ ...f, upazila_id: val, union_id: '' }))} placeholder="Select Upazila" disabled={!form.district_id} />
            <SearchableSelect label="Union" options={locationData.unions} value={form.union_id} onChange={(val) => setForm(f => ({ ...f, union_id: val }))} placeholder="Select Union" disabled={!form.upazila_id} />

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

        {/* Capacity & Stats */}
        <div className="admin-card">
          <div className="admin-card-header" style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
            <h3 className="admin-card-title" style={{ color: '#3B82F6' }}>Facility Capacity & Statistics</h3>
          </div>
          <div className="admin-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {[
              { name: 'ambulance_number', label: 'Ambulance Contact', icon: '🚑' },
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
      `}} />
    </div>
  )
}

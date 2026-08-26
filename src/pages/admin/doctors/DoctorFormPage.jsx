import { getErrorMessage } from '../../../utils/errorHelper'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useDialog } from '../../../hooks/useDialog'
import { DIALOG_MESSAGES } from '../../../utils/dialogMessages'
import { 
  getDoctor, createDoctor, updateDoctor, getSpecialties, getHospitals,
  getDivisions, getDistricts, getUpazilas, getUnions 
} from '../../../api/adminApi'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const DEMO_AVATAR = 'https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg'

// Premium Searchable Select Component
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

  const hasErr = !!error

  return (
    <div id={id} className="admin-form-group" ref={dropdownRef} style={{ position: 'relative', opacity: disabled ? 0.6 : 1 }}>
      <label className="admin-form-label">{label}</label>
      <div 
        className={`admin-form-input ${hasErr ? 'has-error' : ''}`}
        style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          cursor: disabled ? 'not-allowed' : 'pointer', background: 'var(--admin-card-bg)', 
          height: 48, padding: '0 16px', borderRadius: 12, border: hasErr ? '1.5px solid #EF4444' : '1px solid var(--admin-border)',
          fontSize: 14, fontWeight: 500, transition: 'all 0.2s', color: 'var(--admin-text)'
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span style={{ color: selectedOption ? 'var(--admin-text)' : 'var(--admin-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <span style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {error && <div className="admin-form-error" style={{ marginTop: 4 }}>{error}</div>}

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

function calculateExperienceDuration(fromDate, toDate, isCurrent) {
  if (!fromDate) return ''

  let startYear, startMonth
  if (fromDate.includes('-')) {
    const parts = fromDate.split('-')
    startYear = parseInt(parts[0], 10)
    startMonth = parts[1] ? parseInt(parts[1], 10) : 1
  } else {
    startYear = parseInt(fromDate, 10)
    startMonth = 1
  }
  if (isNaN(startYear)) return ''

  let endYear, endMonth
  if (isCurrent) {
    const now = new Date()
    endYear = now.getFullYear()
    endMonth = now.getMonth() + 1
  } else if (toDate) {
    if (toDate.includes('-')) {
      const parts = toDate.split('-')
      endYear = parseInt(parts[0], 10)
      endMonth = parts[1] ? parseInt(parts[1], 10) : 12
    } else {
      endYear = parseInt(toDate, 10)
      endMonth = 12
    }
  } else {
    return ''
  }
  if (isNaN(endYear)) return ''

  let totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth)
  if (totalMonths < 0) totalMonths = 0
  if (totalMonths === 0) totalMonths = 1

  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  const parts = []
  if (years > 0) parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`)
  if (months > 0) parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`)

  return parts.length > 0 ? parts.join(' ') : '1 Month'
}

function formatExperiencePeriod(fromDate, toDate, isCurrent) {
  if (!fromDate) return ''
  const formatM = (str) => {
    if (!str) return ''
    if (str.includes('-')) {
      const [y, m] = str.split('-')
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const mIdx = parseInt(m, 10) - 1
      return (monthNames[mIdx] ? `${monthNames[mIdx]} ` : '') + y
    }
    return str
  }
  const fromStr = formatM(fromDate)
  if (isCurrent) return `${fromStr} - Present`
  if (!toDate) return fromStr
  const toStr = formatM(toDate)
  return `${fromStr} - ${toStr}`
}

export default function DoctorFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { showSuccess, showError } = useDialog()
  const isEdit = !!id
  const canEditPhone = isAdmin || !isEdit

  const [form, setForm] = useState({
    name: '', name_bn: '', slug: '', slug_bn: '', 
    specialty_id: '', specialty_bn: '',
    degree: '', degree_bn: '', 
    degree1: '', degree1_bn: '',
    degree2: '', degree2_bn: '',
    degree3: '', degree3_bn: '',
    degree4: '', degree4_bn: '',
    workplace: '', workplace_bn: '', 
    bmdc: '', fee: '', experience: '', phone: '', email: '', bio: '', long_bio: '',
    top_10_doctor: 'no', available_telemedicine: 'no', is_active: true,
    division_id: '', district_id: '', upazila_id: '', union_id: ''
  })

  const emptyExperience = { 
    hospital_name: '', 
    designation: '', 
    department: '', 
    address: '', 
    from_date: '', 
    to_date: '', 
    is_current: false, 
    period: '', 
    duration: '' 
  }
  const [experiences, setExperiences] = useState([])
  
  const updateExperience = (idx, field, value) => {
    const updated = [...experiences]
    const currentItem = { ...updated[idx], [field]: value }

    if (field === 'from_date' || field === 'to_date' || field === 'is_current') {
      const from = field === 'from_date' ? value : currentItem.from_date
      const to = field === 'to_date' ? value : currentItem.to_date
      const curr = field === 'is_current' ? value : currentItem.is_current

      currentItem.duration = calculateExperienceDuration(from, to, curr)
      currentItem.period = formatExperiencePeriod(from, to, curr)
    }

    updated[idx] = currentItem
    setExperiences(updated)
  }

  const [media, setMedia] = useState({
    photo: null, signature: null,
    photoPreview: null, signaturePreview: null
  })

  const [expertise, setExpertise] = useState([])
  const [expertiseInput, setExpertiseInput] = useState('')
  const [dropdowns, setDropdowns] = useState({
    specialties: [], hospitals: [], divisions: [], districts: [], upazilas: [], unions: []
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => { 
    loadInitialData()
    if (isEdit) loadDoctor()
  }, [id])

  // Location Cascading
  useEffect(() => {
    if (form.division_id) {
      getDistricts({ division_id: form.division_id }).then(res => setDropdowns(p => ({ ...p, districts: res.data?.data || [] })))
    } else {
      setDropdowns(p => ({ ...p, districts: [], upazilas: [], unions: [] }))
    }
  }, [form.division_id])

  useEffect(() => {
    if (form.district_id) {
      getUpazilas({ district_id: form.district_id }).then(res => setDropdowns(p => ({ ...p, upazilas: res.data?.data || [] })))
    } else {
      setDropdowns(p => ({ ...p, upazilas: [], unions: [] }))
    }
  }, [form.district_id])

  useEffect(() => {
    if (form.upazila_id) {
      getUnions({ upazila_id: form.upazila_id }).then(res => setDropdowns(p => ({ ...p, unions: res.data?.data || [] })))
    } else {
      setDropdowns(p => ({ ...p, unions: [] }))
    }
  }, [form.upazila_id])

  const loadInitialData = async () => {
    try {
      const [specRes, divRes] = await Promise.all([
        getSpecialties(), getDivisions()
      ])
      setDropdowns(p => ({
        ...p,
        specialties: specRes.data?.data?.data || specRes.data?.data || [],
        divisions: divRes.data?.data || []
      }))
    } catch (err) { console.error(err) }
  }

  const loadDoctor = async () => {
    setLoading(true)
    try {
      const res = await getDoctor(id)
      const d = res.data?.data || res.data
      
      // Explicit mapping to keep state clean and avoid relation objects
      const mappedData = {
        name: d.name || '',
        name_bn: d.name_bn || '',
        slug: d.slug || '',
        slug_bn: d.slug_bn || '',
        specialty_id: (d.specialty_id ?? d.specialty?.id ?? '').toString(),
        specialty_bn: d.specialty_bn || '',
        degree: d.degree || '',
        degree_bn: d.degree_bn || '',
        degree1: d.degree1 || '',
        degree1_bn: d.degree1_bn || '',
        degree2: d.degree2 || '',
        degree2_bn: d.degree2_bn || '',
        degree3: d.degree3 || '',
        degree3_bn: d.degree3_bn || '',
        degree4: d.degree4 || '',
        degree4_bn: d.degree4_bn || '',
        workplace: d.workplace || '',
        workplace_bn: d.workplace_bn || '',
        bmdc: d.bmdc || '',
        fee: d.fee || '',
        experience: d.experience || '',
        phone: d.phone || '',
        email: d.email || '',
        bio: d.bio || '',
        long_bio: d.long_bio || '',
        top_10_doctor: d.top_10_doctor === 'yes' ? 'yes' : 'no',
        available_telemedicine: d.available_telemedicine === 'yes' ? 'yes' : 'no',
        is_active: d.is_active === 1 || d.is_active === true,
        division_id: (d.division_id ?? d.division?.id ?? '').toString(),
        district_id: (d.district_id ?? d.district?.id ?? '').toString(),
        upazila_id: (d.upazila_id ?? d.upazila?.id ?? '').toString(),
        union_id: (d.union_id ?? d.union?.id ?? '').toString()
      }
      
      setForm(mappedData)

      // Load experiences
      if (d.experiences && Array.isArray(d.experiences)) {
        setExperiences(d.experiences.map(exp => ({
          hospital_name: exp.hospital_name || exp.hospital_name_bn || '',
          designation: exp.designation || exp.designation_bn || '',
          department: exp.department || exp.department_bn || '',
          address: exp.address || exp.address_bn || '',
          from_date: exp.from_date || '',
          to_date: exp.to_date || '',
          is_current: Boolean(exp.is_current),
          period: exp.period || exp.period_bn || '',
          duration: exp.duration || exp.duration_bn || calculateExperienceDuration(exp.from_date, exp.to_date, exp.is_current) || ''
        })))
      }
      
      if (d.photo) setMedia(m => ({ ...m, photoPreview: d.photo }))
      if (d.signature_photo) setMedia(m => ({ ...m, signaturePreview: d.signature_photo }))
      if (d.expertise) {
        try { 
          const parsed = Array.isArray(d.expertise) ? d.expertise : JSON.parse(d.expertise)
          setExpertise(parsed || [])
        } catch { 
          setExpertise(d.expertise ? [d.expertise] : []) 
        }
      }
    } catch (err) {
} finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors({ ...errors, [name]: '' })
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

  const scrollToFirstError = (errorObj) => {
    if (!errorObj || Object.keys(errorObj).length === 0) return

    const fieldOrder = [
      'name', 'name_bn', 'slug', 'slug_bn', 'specialty_id', 'specialty_bn',
      'workplace', 'workplace_bn', 'bmdc', 'fee', 'experience', 'degree',
      'division_id', 'district_id', 'upazila_id', 'union_id', 'phone', 'email'
    ]

    const firstErrField = fieldOrder.find(f => errorObj[f]) || Object.keys(errorObj)[0]
    if (!firstErrField) return

    setTimeout(() => {
      const el = document.querySelector(`[name="${firstErrField}"]`) || document.getElementById(`field-${firstErrField}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        if (typeof el.focus === 'function') el.focus()
      } else {
        const errorEl = document.querySelector('.admin-form-error')
        if (errorEl) {
          errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }, 100)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Client-side mandatory field & format validation with field-specific messages
    const newErrors = {}
    if (!form.name || !form.name.trim()) newErrors.name = 'Doctor Name (English) is required.'
    if (!form.name_bn || !form.name_bn.trim()) newErrors.name_bn = 'Doctor Name (Bangla) is required.'
    if (!form.slug || !form.slug.trim()) newErrors.slug = 'Profile Slug is required.'
    if (!form.specialty_id) newErrors.specialty_id = 'Specialty selection is required.'
    if (!form.workplace || !form.workplace.trim()) newErrors.workplace = 'Current Workplace / Hospital is required.'
    if (!form.bmdc || !form.bmdc.trim()) newErrors.bmdc = 'BMDC Registration Number is required.'

    // Phone validation
    if (!form.phone || !form.phone.trim()) {
      newErrors.phone = 'Phone Number is required.'
    } else {
      const bdPhoneRegex = /^01[3-9]\d{8}$/
      if (!bdPhoneRegex.test(form.phone.trim())) {
        newErrors.phone = 'Mobile number must be a valid 11-digit number starting with 013-019.'
      }
    }

    // Email validation
    if (!form.email || !form.email.trim()) {
      newErrors.email = 'Email Address is required.'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(form.email.trim())) {
        newErrors.email = 'Please enter a valid email address (e.g. doctor@example.com).'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      scrollToFirstError(newErrors)
      return
    }

    // Auto-compute total experience from experience entries
    let totalExpMonths = 0
    experiences.forEach(exp => {
      const d = (exp.duration || '').toLowerCase()
      const yr = d.match(/(\d+)\s*year/)
      const mo = d.match(/(\d+)\s*month/)
      if (yr) totalExpMonths += parseInt(yr[1]) * 12
      if (mo) totalExpMonths += parseInt(mo[1])
    })
    const computedExpYears = totalExpMonths > 0 ? Math.floor(totalExpMonths / 12) || 1 : (form.experience || 0)

    setSaving(true)
    const formData = new FormData()
    
    // Clean submission: only send flat values and handle booleans for PHP/Laravel
    Object.keys(form).forEach(key => {
      let value = form[key]
      
      // Override experience with auto-computed value from experiences entries
      if (key === 'experience') value = computedExpYears

      // Convert boolean to 1/0 for consistent Laravel handling via FormData
      if (key === 'is_active') value = value ? '1' : '0'
      
      // Only append if value is present (avoids overwriting with empty/null unless intended)
      if (value !== null && value !== undefined) {
        formData.append(key, value)
      }
    })

    if (expertise.length > 0) formData.append('expertise', JSON.stringify(expertise))
    if (experiences.length > 0) formData.append('experiences', JSON.stringify(experiences))
    if (media.photo) formData.append('photo', media.photo)
    if (media.signature) formData.append('signature_photo', media.signature)

    if (isEdit) formData.append('_method', 'PUT')

    try {
      if (isEdit) {
        await updateDoctor(id, formData)
        showSuccess({
          title: DIALOG_MESSAGES.UPDATE_SUCCESS.title,
          message: DIALOG_MESSAGES.DOCTOR_SAVE_SUCCESS.message,
        })
      } else {
        await createDoctor(formData)
        showSuccess({
          title: DIALOG_MESSAGES.SAVE_SUCCESS.title,
          message: DIALOG_MESSAGES.DOCTOR_SAVE_SUCCESS.message,
        })
      }
      
      setTimeout(() => navigate('/admin/doctors'), 700)
    } catch (err) {
      if (err.response?.data?.errors) {
        const errs = err.response.data.errors
        setErrors(errs)
        scrollToFirstError(errs)
      } else {
        const message = err.response?.data?.message || getErrorMessage(err, 'Failed to save doctor profile.')
        showError({
          title: DIALOG_MESSAGES.ERROR.title,
          message,
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const renderFieldError = (fieldKey) => {
    const err = errors[fieldKey]
    if (!err) return null
    const message = Array.isArray(err) ? err[0] : err
    return <div className="admin-form-error">{message}</div>
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /> Preparing Doctor Profile...</div>

  return (
    <div className="admin-container" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>{isEdit ? '🩺 Edit Doctor Profile' : '👨‍⚕️ Register New Doctor'}</h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Manage professional credentials, media, and geographical presence</p>
        </div>
        <Link to="/admin/doctors" className="admin-btn admin-btn-outline" style={{ borderRadius: 12 }}>← Back to List</Link>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 32 }}>
        
        {/* Core Profile Section */}
        <div className="admin-card" style={{ borderTop: '4px solid #0EA5E9', overflow: 'visible' }}>
          <div className="admin-card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 40, overflow: 'visible' }}>
            {/* Left: Media */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
               <div style={{ textAlign: 'center' }}>
                <label className="admin-form-label">Profile Image</label>
                <div style={{ 
                  width: '100%', aspectRatio: '3/4', borderRadius: 20, border: '2px dashed var(--admin-border)',
                  overflow: 'hidden', background: 'rgba(0,0,0,0.02)', position: 'relative', cursor: 'pointer'
                }}>
                  {media.photoPreview ? (
                    <img src={media.photoPreview} alt="P" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-muted)', fontSize: 40 }}>📷</div>
                  )}
                  <input type="file" onChange={(e) => handleMediaChange(e, 'photo')} accept="image/*" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <label className="admin-form-label">Digital Signature</label>
                <div style={{ 
                  width: '100%', height: 80, borderRadius: 12, border: '2px dashed var(--admin-border)',
                  overflow: 'hidden', background: 'var(--admin-card-bg)', position: 'relative', cursor: 'pointer'
                }}>
                  {media.signaturePreview ? (
                    <img src={media.signaturePreview} alt="S" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-muted)', fontSize: 12 }}>Upload Signature</div>
                  )}
                  <input type="file" onChange={(e) => handleMediaChange(e, 'signature')} accept="image/*" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                </div>
              </div>
            </div>

            {/* Right: Personal Details */}
            <div style={{ display: 'grid', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Doctor Name (English) *</label>
                  <input className="admin-form-input" name="name" value={form.name} onChange={handleChange} placeholder="Dr. John Doe" />
                  {renderFieldError('name')}
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Doctor Name (Bangla) *</label>
                  <input className="admin-form-input" name="name_bn" value={form.name_bn} onChange={handleChange} placeholder="ডাঃ জন ডো" style={{ fontFamily: "'Hind Siliguri', sans-serif" }} />
                  {renderFieldError('name_bn')}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Profile Slug (URL) *</label>
                  <input className="admin-form-input" name="slug" value={form.slug} onChange={handleChange} placeholder="dr-john-doe" />
                  {renderFieldError('slug')}
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Bangla Slug</label>
                  <input className="admin-form-input" name="slug_bn" value={form.slug_bn} onChange={handleChange} placeholder="ডাঃ-জন-ডো" style={{ fontFamily: "'Hind Siliguri', sans-serif" }} />
                  {renderFieldError('slug_bn')}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <SearchableSelect id="field-specialty_id" label="Specialty *" options={dropdowns.specialties} value={form.specialty_id} onChange={(v) => { setForm(f => ({...f, specialty_id: v})); if (errors.specialty_id) setErrors(e => ({...e, specialty_id: ''})); }} placeholder="Select Specialty" error={errors.specialty_id} />
                <div className="admin-form-group">
                  <label className="admin-form-label">Specialty (Bangla)</label>
                  <input className="admin-form-input" name="specialty_bn" value={form.specialty_bn} onChange={handleChange} placeholder="বিশেষজ্ঞ..." />
                  {renderFieldError('specialty_bn')}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Current Workplace / Hospital (English) *</label>
                  <input className="admin-form-input" name="workplace" value={form.workplace} onChange={handleChange} placeholder="e.g. Dhaka Medical College Hospital" />
                  {renderFieldError('workplace')}
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">বর্তমান কর্মস্থল (Bangla)</label>
                  <input className="admin-form-input" name="workplace_bn" value={form.workplace_bn} onChange={handleChange} placeholder="যেমনঃ ঢাকা মেডিকেল কলেজ হাসপাতাল" style={{ fontFamily: "'Hind Siliguri', sans-serif" }} />
                  {renderFieldError('workplace_bn')}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">BMDC Reg No. *</label>
                  <input className="admin-form-input" name="bmdc" value={form.bmdc} onChange={handleChange} placeholder="A-12345" />
                  {renderFieldError('bmdc')}
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Consultation Fee (৳)</label>
                  <input type="number" className="admin-form-input" name="fee" value={form.fee} onChange={handleChange} placeholder="500" />
                  {renderFieldError('fee')}
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Experience (Auto-Calculated)</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    readOnly
                    value={(() => {
                      let totalMonths = 0
                      experiences.forEach(exp => {
                        const d = (exp.duration || '').toLowerCase()
                        const yr = d.match(/(\d+)\s*year/)
                        const mo = d.match(/(\d+)\s*month/)
                        if (yr) totalMonths += parseInt(yr[1]) * 12
                        if (mo) totalMonths += parseInt(mo[1])
                      })
                      if (totalMonths === 0) return form.experience || '—'
                      const yrs = Math.floor(totalMonths / 12)
                      const mos = totalMonths % 12
                      if (yrs === 0) return `${mos} Month${mos !== 1 ? 's' : ''}`
                      if (mos === 0) return `${yrs} Year${yrs !== 1 ? 's' : ''}`
                      return `${yrs} Year${yrs !== 1 ? 's' : ''} ${mos} Month${mos !== 1 ? 's' : ''}`
                    })()}
                    style={{ background: '#F1FFF8', color: '#065F46', fontWeight: 700, cursor: 'not-allowed', border: '1.5px solid #A7F3D0' }}
                    placeholder="Auto-calculated from experience entries"
                  />
                  <small style={{ color: '#6B7280', fontSize: 11 }}>Auto-calculated from Work History entries below</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Qualifications & Degrees */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">Professional Credentials (EN)</h3>
            </div>
            <div className="admin-card-body" style={{ display: 'grid', gap: 16 }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Primary Degrees</label>
                <input className="admin-form-input" name="degree" value={form.degree} onChange={handleChange} placeholder="MBBS, FCPS" />
                {renderFieldError('degree')}
              </div>
              {[1, 2, 3, 4].map(num => (
                <div key={num} className="admin-form-group">
                  <input className="admin-form-input" name={`degree${num}`} value={form[`degree${num}`]} onChange={handleChange} placeholder={`Additional Degree ${num}`} />
                  {renderFieldError(`degree${num}`)}
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">পেশাগত বিবরণ (BN)</h3>
            </div>
            <div className="admin-card-body" style={{ display: 'grid', gap: 16 }}>
              <div className="admin-form-group">
                <label className="admin-form-label">ডিগ্রীসমূহ</label>
                <input className="admin-form-input" name="degree_bn" value={form.degree_bn} onChange={handleChange} placeholder="এমবিবিএস, এফসিপিএস" style={{ fontFamily: "'Hind Siliguri', sans-serif" }} />
                {renderFieldError('degree_bn')}
              </div>
              {[1, 2, 3, 4].map(num => (
                <div key={num} className="admin-form-group">
                  <input className="admin-form-input" name={`degree${num}_bn`} value={form[`degree${num}_bn`]} onChange={handleChange} placeholder={`অতিরিক্ত ডিগ্রী ${num}`} style={{ fontFamily: "'Hind Siliguri', sans-serif" }} />
                  {renderFieldError(`degree${num}_bn`)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Location & Contact Section */}
        <div className="admin-card" style={{ overflow: 'visible' }}>
          <div className="admin-card-header" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
            <h3 className="admin-card-title" style={{ color: '#10B981' }}>Location & Contact Hub</h3>
          </div>
          <div className="admin-card-body" style={{ overflow: 'visible' }}>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
                <SearchableSelect label="Division" options={dropdowns.divisions} value={form.division_id} onChange={(v) => setForm(f => ({...f, division_id: v, district_id: '', upazila_id: '', union_id: ''}))} placeholder="All Divisions" error={errors.division_id} />
                <SearchableSelect label="District" options={dropdowns.districts} value={form.district_id} onChange={(v) => setForm(f => ({...f, district_id: v, upazila_id: '', union_id: ''}))} placeholder="All Districts" disabled={!form.division_id} error={errors.district_id} />
                <SearchableSelect label="Upazila" options={dropdowns.upazilas} value={form.upazila_id} onChange={(v) => setForm(f => ({...f, upazila_id: v, union_id: ''}))} placeholder="All Upazilas" disabled={!form.district_id} error={errors.upazila_id} />
                <SearchableSelect label="Union" options={dropdowns.unions} value={form.union_id} onChange={(v) => setForm(f => ({...f, union_id: v}))} placeholder="All Unions" disabled={!form.upazila_id} error={errors.union_id} />
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
                 <div className="admin-form-group">
                   <label className="admin-form-label">
                     Phone * {(!canEditPhone) && <span style={{ fontSize: 11, fontWeight: 600, color: '#00B875', marginLeft: 4 }}>✓ (OTP Verified — Non-editable)</span>}
                   </label>
                   <input 
                     className={`admin-form-input ${errors.phone ? 'has-error' : ''}`} 
                     name="phone" 
                     value={form.phone} 
                     onChange={handleChange} 
                     placeholder="+880..." 
                     disabled={!canEditPhone}
                     readOnly={!canEditPhone}
                     title={!canEditPhone ? "Verified phone number cannot be changed" : ""}
                     style={!canEditPhone ? { background: 'rgba(0,0,0,0.04)', cursor: 'not-allowed', color: 'var(--admin-text-muted)' } : {}}
                   />
                   {renderFieldError('phone')}
                 </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Email *</label>
                  <input className={`admin-form-input ${errors.email ? 'has-error' : ''}`} type="email" name="email" value={form.email} onChange={handleChange} placeholder="doctor@doctorbooklet.com" />
                  {renderFieldError('email')}
                </div>
             </div>
          </div>
        </div>

        {/* Expertise Tags */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Areas of Expertise</h3>
          </div>
          <div className="admin-card-body">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {expertise.map((exp, idx) => (
                <span key={idx} style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  {exp}
                  <button type="button" onClick={() => setExpertise(expertise.filter((_, i) => i !== idx))} style={{ border: 'none', background: 'transparent', color: '#6366F1', cursor: 'pointer', fontWeight: 800 }}>✕</button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <input 
                className="admin-form-input" 
                value={expertiseInput} 
                onChange={(e) => setExpertiseInput(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (expertiseInput.trim()) { setExpertise([...expertise, expertiseInput.trim()]); setExpertiseInput(''); } } }}
                placeholder="Type expertise (e.g. Heart Surgery) and press Enter" 
              />
            </div>
          </div>
        </div>

        {/* Work History / Experiences */}
        <div className="admin-card" style={{ borderTop: '4px solid #8B5CF6' }}>
          <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="admin-card-title" style={{ color: '#8B5CF6' }}>🏥 Work History / Experiences</h3>
              <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', margin: '2px 0 0' }}>Add past and current hospital appointments, designations, and dynamic duration</p>
            </div>
            <button type="button" onClick={() => setExperiences([{ ...emptyExperience }, ...experiences])} className="admin-btn admin-btn-outline" style={{ borderRadius: 10, fontSize: 13, padding: '8px 18px', borderColor: '#8B5CF6', color: '#8B5CF6' }}>
              + Add Experience
            </button>
          </div>
          <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {experiences.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--admin-text-muted)', fontSize: 14 }}>
                No work history added yet. Click "+ Add Experience" to begin.
              </div>
            )}
            {experiences.map((exp, idx) => (
              <div key={idx} style={{ background: 'rgba(139,92,246,0.03)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 16, padding: 22, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#8B5CF6', background: 'rgba(139,92,246,0.1)', padding: '4px 10px', borderRadius: 8 }}>
                      Experience #{idx + 1}
                    </span>
                    {exp.duration && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#00B875', background: 'rgba(0, 184, 117, 0.1)', padding: '3px 8px', borderRadius: 6 }}>
                        ⏱️ {exp.duration}
                      </span>
                    )}
                  </div>
                  <button type="button" onClick={() => setExperiences(experiences.filter((_, i) => i !== idx))} style={{ border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                    ✕ Remove
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  {/* Hospital / Institute */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Hospital / Institute</label>
                    <input 
                      className="admin-form-input" 
                      value={exp.hospital_name || ''} 
                      onChange={e => updateExperience(idx, 'hospital_name', e.target.value)} 
                      placeholder="e.g. Dhaka Medical College & Hospital" 
                    />
                  </div>

                  {/* Designation */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Designation</label>
                    <input 
                      className="admin-form-input" 
                      value={exp.designation || ''} 
                      onChange={e => updateExperience(idx, 'designation', e.target.value)} 
                      placeholder="e.g. Senior Consultant / Assistant Professor" 
                    />
                  </div>

                  {/* Department */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Department</label>
                    <input 
                      className="admin-form-input" 
                      value={exp.department || ''} 
                      onChange={e => updateExperience(idx, 'department', e.target.value)} 
                      placeholder="e.g. Cardiology / Internal Medicine" 
                    />
                  </div>

                  {/* Address / Location */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Address / Location</label>
                    <input 
                      className="admin-form-input" 
                      value={exp.address || ''} 
                      onChange={e => updateExperience(idx, 'address', e.target.value)} 
                      placeholder="e.g. Ramna, Dhaka, Bangladesh" 
                    />
                  </div>

                  {/* Time (From) */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Time (From)</label>
                    <input 
                      type="month"
                      className="admin-form-input" 
                      value={exp.from_date || ''} 
                      onChange={e => updateExperience(idx, 'from_date', e.target.value)} 
                    />
                  </div>

                  {/* Time (To / Continue) */}
                  <div className="admin-form-group">
                    <label className="admin-form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Time (To / Continue)</span>
                      {exp.is_current && <span style={{ color: '#00B875', fontWeight: 800, fontSize: 11 }}>Present</span>}
                    </label>
                    <input 
                      type="month"
                      className="admin-form-input" 
                      value={exp.is_current ? '' : (exp.to_date || '')} 
                      disabled={exp.is_current}
                      onChange={e => updateExperience(idx, 'to_date', e.target.value)} 
                      placeholder={exp.is_current ? 'Present' : 'Select end date'}
                      style={{ opacity: exp.is_current ? 0.6 : 1 }}
                    />
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, fontWeight: 700, color: '#8B5CF6', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        style={{ accentColor: '#8B5CF6' }}
                        checked={Boolean(exp.is_current)} 
                        onChange={e => updateExperience(idx, 'is_current', e.target.checked)} 
                      />
                      Currently Working Here (Continue)
                    </label>
                  </div>

                  {/* Total Duration / Experience (Dynamic Count) */}
                  <div className="admin-form-group">
                    <label className="admin-form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Total Duration / Experience</span>
                      <span style={{ fontSize: 11, color: '#00B875', fontWeight: 800 }}>⚡ Dynamic Count</span>
                    </label>
                    <input 
                      className="admin-form-input" 
                      value={exp.duration || ''} 
                      onChange={e => updateExperience(idx, 'duration', e.target.value)} 
                      placeholder="e.g. 4 Years 2 Months" 
                      style={{ fontWeight: 700, color: 'var(--admin-text)' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bio & Content */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Biography & Professional Summary</h3>
          </div>
          <div className="admin-card-body" style={{ display: 'grid', gap: 24 }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Short Bio (Quick Preview)</label>
              <textarea className="admin-form-textarea" name="bio" value={form.bio} onChange={handleChange} rows={2} placeholder="Summarize professional background..." />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Detailed Professional Profile (Rich Text)</label>
              <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--admin-border)' }}>
                <ReactQuill theme="snow" value={form.long_bio} onChange={(val) => setForm(f => ({ ...f, long_bio: val }))} style={{ height: 300, marginBottom: 50 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Global Settings */}
        <div className="admin-card" style={{ border: '1px solid rgba(245, 158, 11, 0.2)', background: 'rgba(245, 158, 11, 0.03)' }}>
          <div className="admin-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#D97706' }}>⭐ Profile Promotion & Visibility</h3>
              <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', margin: '4px 0 0' }}>Configure telemedicine access and platform status</p>
            </div>
            <div style={{ display: 'flex', gap: 40 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#D97706' }}>Top 10 Doctor</span>
                <input type="checkbox" style={{ width: 20, height: 20 }} checked={form.top_10_doctor === 'yes'} onChange={(e) => setForm(f => ({ ...f, top_10_doctor: e.target.checked ? 'yes' : 'no' }))} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#6366F1' }}>Telemedicine</span>
                <input type="checkbox" style={{ width: 20, height: 20 }} checked={form.available_telemedicine === 'yes'} onChange={(e) => setForm(f => ({ ...f, available_telemedicine: e.target.checked ? 'yes' : 'no' }))} />
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>Active Profile</span>
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
          <Link to="/admin/doctors" className="admin-btn admin-btn-outline" style={{ padding: '14px 32px' }}>Discard Changes</Link>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving} style={{ padding: '14px 48px', fontSize: 16, fontWeight: 800, borderRadius: 14, boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2)' }}>
            {saving ? 'Processing...' : isEdit ? '💾 Update Profile' : '🚀 Register Doctor'}
          </button>
        </div>

      </form>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-container { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  )
}

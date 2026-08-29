import { getErrorMessage } from '../../../utils/errorHelper'
import toast from 'react-hot-toast'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import {
  getAdminPatient, createAdminPatient, updateAdminPatient,
  getDivisions, getDistricts, getUpazilas, getUnions
} from '../../../api/adminApi'
import { BLOOD_GROUPS, GENDERS, calculateAge } from '../../../utils/dateUtils'

// Premium Searchable Select Component
function SearchableSelect({ label, options, value, onChange, placeholder, disabled = false, error = '' }) {
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
        className={`admin-form-input ${error ? 'border-red-500' : ''}`}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer', background: 'var(--admin-card-bg)',
          height: 48, padding: '0 16px', borderRadius: 12, border: '1px solid var(--admin-border)',
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

export default function PatientFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const isEdit = !!id
  const canEditPhone = isAdmin || !isEdit

  const [form, setForm] = useState({
    name: '', email: '', phone: '', occupation: '', date_of_birth: '',
    gender: '', blood_group: '',
    division_id: '', district_id: '', upazila_id: '', union_id: ''
  })

  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  const [locationData, setLocationData] = useState({
    divisions: [], districts: [], upazilas: [], unions: []
  })

  const [initialLoadDone, setInitialLoadDone] = useState(false)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/patients')
    }
  }, [isAdmin, navigate])

  const ageInfo = calculateAge(form.date_of_birth)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const divRes = await getDivisions()
        const divisions = divRes.data?.data || []
        let districts = [], upazilas = [], unions = []

        if (isEdit) {
          const pRes = await getAdminPatient(id)
          const p = pRes.data?.data || pRes.data

          if (p.division_id) {
            const distRes = await getDistricts({ division_id: p.division_id })
            districts = distRes.data?.data || []
          }
          if (p.district_id) {
            const upazilaRes = await getUpazilas({ district_id: p.district_id })
            upazilas = upazilaRes.data?.data || []
          }
          if (p.upazila_id) {
            const unionRes = await getUnions({ upazila_id: p.upazila_id })
            unions = unionRes.data?.data || []
          }

          setLocationData({ divisions, districts, upazilas, unions })

          let dob = ''
          if (p.date_of_birth) {
            dob = p.date_of_birth.substring(0, 10)
          }

          setForm({
            name: p.name || '',
            email: p.email || '',
            phone: p.mobile || p.phone || '',
            occupation: p.occupation || '',
            date_of_birth: dob,
            gender: p.gender || '',
            blood_group: p.blood_group || '',
            division_id: p.division_id ? p.division_id.toString() : '',
            district_id: p.district_id ? p.district_id.toString() : '',
            upazila_id: p.upazila_id ? p.upazila_id.toString() : '',
            union_id: p.union_id ? p.union_id.toString() : '',
          })

          if (p.profile_pic) setPhotoPreview(p.profile_pic)
        } else {
          setLocationData(ld => ({ ...ld, divisions }))
        }

        setInitialLoadDone(true)
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to load patient profile.'))
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [id])

  useEffect(() => {
    if (!initialLoadDone) return
    if (form.division_id) {
      getDistricts({ division_id: form.division_id }).then(res =>
        setLocationData(p => ({ ...p, districts: res.data?.data || [], upazilas: [], unions: [] }))
      )
    } else {
      setLocationData(p => ({ ...p, districts: [], upazilas: [], unions: [] }))
    }
  }, [form.division_id, initialLoadDone])

  useEffect(() => {
    if (!initialLoadDone) return
    if (form.district_id) {
      getUpazilas({ district_id: form.district_id }).then(res =>
        setLocationData(p => ({ ...p, upazilas: res.data?.data || [], unions: [] }))
      )
    } else {
      setLocationData(p => ({ ...p, upazilas: [], unions: [] }))
    }
  }, [form.district_id, initialLoadDone])

  useEffect(() => {
    if (!initialLoadDone) return
    if (form.upazila_id) {
      getUnions({ upazila_id: form.upazila_id }).then(res =>
        setLocationData(p => ({ ...p, unions: res.data?.data || [] }))
      )
    } else {
      setLocationData(p => ({ ...p, unions: [] }))
    }
  }, [form.upazila_id, initialLoadDone])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData()

    Object.keys(form).forEach(key => {
      if (form[key] !== null && form[key] !== undefined && form[key] !== '') {
        formData.append(key, form[key])
      }
    })

    if (photo instanceof File) {
      formData.append('profile_pic', photo)
    }

    if (isEdit) formData.append('_method', 'PUT')

    try {
      if (isEdit) {
        const res = await updateAdminPatient(id, formData)
        toast.success(res.data?.message || 'Patient profile updated successfully.')
      } else {
        const res = await createAdminPatient(formData)
        toast.success(res.data?.message || 'Patient registered successfully.')
      }
      navigate('/admin/patients')
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors)
        const firstError = Object.values(err.response.data.errors)[0]
        if (firstError) toast.error(Array.isArray(firstError) ? firstError[0] : firstError, { id: 'patient-form-validation' })
      } else {
        console.error('Failed to save patient profile', err)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /> Preparing Patient Profile...</div>

  return (
    <div className="admin-container" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>{isEdit ? '👤 Edit Patient Profile' : '🆕 Register New Patient'}</h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Configure medical background, contact details, and location</p>
        </div>
        <Link to="/admin/patients" className="admin-btn admin-btn-outline" style={{ borderRadius: 12 }}>← Back</Link>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 32 }}>

        {/* Core Identity Section */}
        <div className="admin-card" style={{ borderTop: '4px solid #EC4899' }}>
          <div className="admin-card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 40 }}>
            {/* Photo Section */}
            <div style={{ textAlign: 'center' }}>
              <label className="admin-form-label">Profile Image</label>
              <div style={{
                width: '100%', aspectRatio: '1', borderRadius: 24, border: '2px dashed var(--admin-border)',
                overflow: 'hidden', background: 'rgba(0,0,0,0.02)', position: 'relative', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Patient" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: 'var(--admin-text-muted)', fontSize: 40 }}>👤</div>
                )}
                <input type="file" onChange={handlePhotoChange} accept="image/*" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              </div>
              <p style={{ marginTop: 12, fontSize: 12, color: 'var(--admin-text-muted)' }}>
                {photoPreview ? 'Click to change photo' : 'Click to upload photo'}
              </p>
            </div>

            {/* Personal Details */}
            <div style={{ display: 'grid', gap: 20 }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Full Name *</label>
                <input
                  className="admin-form-input"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Patient Full Name"
                  style={{ height: 48, fontSize: 16, fontWeight: 600 }}
                />
                {errors.name && <div className="admin-form-error">{errors.name}</div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Gender</label>
                  <select className="admin-form-select" name="gender" value={form.gender} onChange={handleChange} style={{ height: 48 }}>
                    <option value="">Select Gender</option>
                    {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Blood Group</label>
                  <select className="admin-form-select" name="blood_group" value={form.blood_group} onChange={handleChange} style={{ height: 48 }}>
                    <option value="">Select Group</option>
                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Date of Birth</label>
                  <input type="date" className="admin-form-input" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} style={{ height: 48 }} />
                  {ageInfo.display && (
                    <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: '#EC4899' }}>🎂 Age: {ageInfo.display}</div>
                  )}
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Occupation</label>
                  <input className="admin-form-input" name="occupation" value={form.occupation} onChange={handleChange} placeholder="e.g. Student, Service" style={{ height: 48 }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="admin-card" style={{ overflow: 'visible' }}>
          <div className="admin-card-header" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
            <h3 className="admin-card-title" style={{ color: '#10B981' }}>📍 Residential Location</h3>
          </div>
          <div className="admin-card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, overflow: 'visible' }}>
            <SearchableSelect label="Division" options={locationData.divisions} value={form.division_id} onChange={(v) => setForm(f => ({ ...f, division_id: v, district_id: '', upazila_id: '', union_id: '' }))} placeholder="Select Division" />
            <SearchableSelect label="District" options={locationData.districts} value={form.district_id} onChange={(v) => setForm(f => ({ ...f, district_id: v, upazila_id: '', union_id: '' }))} placeholder="Select District" disabled={!form.division_id} />
            <SearchableSelect label="Upazila" options={locationData.upazilas} value={form.upazila_id} onChange={(v) => setForm(f => ({ ...f, upazila_id: v, union_id: '' }))} placeholder="Select Upazila" disabled={!form.district_id} />
            <SearchableSelect label="Union" options={locationData.unions} value={form.union_id} onChange={(v) => setForm(f => ({ ...f, union_id: v }))} placeholder="Select Union" disabled={!form.upazila_id} />
          </div>
        </div>

        {/* Contact Section */}
        <div className="admin-card">
          <div className="admin-card-header" style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
            <h3 className="admin-card-title" style={{ color: '#3B82F6' }}>📞 Communication Access</h3>
          </div>
          <div className="admin-card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="admin-form-group">
              <label className="admin-form-label">
                Phone Number * {(!canEditPhone) && <span style={{ fontSize: 11, fontWeight: 600, color: '#00B875', marginLeft: 4 }}>✓ (OTP Verified — Non-editable)</span>}
              </label>
              <input 
                className="admin-form-input" 
                name="phone" 
                value={form.phone} 
                onChange={handleChange} 
                placeholder="01XXXXXXXXX" 
                disabled={!canEditPhone}
                readOnly={!canEditPhone}
                title={!canEditPhone ? "Verified phone number cannot be changed" : ""}
                style={{ height: 48, ...(!canEditPhone ? { background: 'rgba(0,0,0,0.04)', cursor: 'not-allowed', color: 'var(--admin-text-muted)' } : {}) }} 
              />
              {errors.phone && <div className="admin-form-error">{errors.phone}</div>}
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Email Address</label>
              <input className="admin-form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="patient@email.com" style={{ height: 48 }} />
              {errors.email && <div className="admin-form-error">{errors.email}</div>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginBottom: 60 }}>
          <Link to="/admin/patients" className="admin-btn admin-btn-outline" style={{ padding: '14px 32px' }}>Cancel</Link>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving} style={{ padding: '14px 48px', fontSize: 16, fontWeight: 800, borderRadius: 14, boxShadow: '0 10px 15px -3px rgba(236, 72, 153, 0.2)', background: '#EC4899', borderColor: '#EC4899' }}>
            {saving ? 'Processing...' : isEdit ? '💾 Update Patient' : '🚀 Register Patient'}
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

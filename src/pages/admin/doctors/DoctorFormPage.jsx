// DoctorFormPage.jsx — Premium Doctor Create/Edit Form
import { getErrorMessage } from '../../../utils/errorHelper'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { 
  getDoctor, createDoctor, updateDoctor, getSpecialties, getHospitals,
  getDivisions, getDistricts, getUpazilas, getUnions 
} from '../../../api/adminApi'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const DEMO_AVATAR = 'https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg'

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

export default function DoctorFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

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

  const emptyExperience = { hospital_name: '', hospital_name_bn: '', designation: '', designation_bn: '', department: '', department_bn: '', address: '', address_bn: '', period: '', period_bn: '', duration: '', duration_bn: '' }
  const [experiences, setExperiences] = useState([])
  
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
        specialty_id: d.specialty_id || '',
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
        division_id: d.division_id || '',
        district_id: d.district_id || '',
        upazila_id: d.upazila_id || '',
        union_id: d.union_id || ''
      }
      
      setForm(mappedData)

      // Load experiences
      if (d.experiences && Array.isArray(d.experiences)) {
        setExperiences(d.experiences.map(exp => ({
          hospital_name: exp.hospital_name || '',
          hospital_name_bn: exp.hospital_name_bn || '',
          designation: exp.designation || '',
          designation_bn: exp.designation_bn || '',
          department: exp.department || '',
          department_bn: exp.department_bn || '',
          address: exp.address || '',
          address_bn: exp.address_bn || '',
          period: exp.period || '',
          period_bn: exp.period_bn || '',
          duration: exp.duration || '',
          duration_bn: exp.duration_bn || ''
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData()
    
    // Clean submission: only send flat values and handle booleans for PHP/Laravel
    Object.keys(form).forEach(key => {
      let value = form[key]
      
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
      if (isEdit) await updateDoctor(id, formData)
      else await createDoctor(formData)
      
      navigate('/admin/doctors')
    } catch (err) {
if (err.response?.data?.errors) setErrors(err.response.data.errors)
    } finally {
      setSaving(false)
    }
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
                  {errors.name && <div className="admin-form-error">{errors.name}</div>}
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Doctor Name (Bangla) *</label>
                  <input className="admin-form-input" name="name_bn" value={form.name_bn} onChange={handleChange} placeholder="ডাঃ জন ডো" style={{ fontFamily: "'Hind Siliguri', sans-serif" }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Profile Slug (URL) *</label>
                  <input className="admin-form-input" name="slug" value={form.slug} onChange={handleChange} placeholder="dr-john-doe" />
                  {errors.slug && <div className="admin-form-error">{errors.slug}</div>}
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Bangla Slug</label>
                  <input className="admin-form-input" name="slug_bn" value={form.slug_bn} onChange={handleChange} placeholder="ডাঃ-জন-ডো" style={{ fontFamily: "'Hind Siliguri', sans-serif" }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <SearchableSelect label="Specialty *" options={dropdowns.specialties} value={form.specialty_id} onChange={(v) => setForm(f => ({...f, specialty_id: v}))} placeholder="Select Specialty" error={errors.specialty_id} />
                <div className="admin-form-group">
                  <label className="admin-form-label">Specialty (Bangla)</label>
                  <input className="admin-form-input" name="specialty_bn" value={form.specialty_bn} onChange={handleChange} placeholder="বিশেষজ্ঞ..." />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">BMDC Reg No. *</label>
                  <input className="admin-form-input" name="bmdc" value={form.bmdc} onChange={handleChange} placeholder="A-12345" />
                  {errors.bmdc && <div className="admin-form-error">{errors.bmdc}</div>}
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Consultation Fee (৳)</label>
                  <input type="number" className="admin-form-input" name="fee" value={form.fee} onChange={handleChange} placeholder="500" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Experience (Years)</label>
                  <input type="number" className="admin-form-input" name="experience" value={form.experience} onChange={handleChange} placeholder="10" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Qualifications & Workplace */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">Professional Credentials (EN)</h3>
            </div>
            <div className="admin-card-body" style={{ display: 'grid', gap: 16 }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Primary Degrees</label>
                <input className="admin-form-input" name="degree" value={form.degree} onChange={handleChange} placeholder="MBBS, FCPS" />
              </div>
              {[1, 2, 3, 4].map(num => (
                <input key={num} className="admin-form-input" name={`degree${num}`} value={form[`degree${num}`]} onChange={handleChange} placeholder={`Additional Degree ${num}`} />
              ))}
              <div className="admin-form-group" style={{ marginTop: 12 }}>
                <label className="admin-form-label">Current Workplace</label>
                <input className="admin-form-input" name="workplace" value={form.workplace} onChange={handleChange} placeholder="Dhaka Medical College" />
              </div>
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
              </div>
              {[1, 2, 3, 4].map(num => (
                <input key={num} className="admin-form-input" name={`degree${num}_bn`} value={form[`degree${num}_bn`]} onChange={handleChange} placeholder={`অতিরিক্ত ডিগ্রী ${num}`} style={{ fontFamily: "'Hind Siliguri', sans-serif" }} />
              ))}
              <div className="admin-form-group" style={{ marginTop: 12 }}>
                <label className="admin-form-label">বর্তমান কর্মস্থল</label>
                <input className="admin-form-input" name="workplace_bn" value={form.workplace_bn} onChange={handleChange} placeholder="ঢাকা মেডিকেল কলেজ" style={{ fontFamily: "'Hind Siliguri', sans-serif" }} />
              </div>
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
                <SearchableSelect label="Division" options={dropdowns.divisions} value={form.division_id} onChange={(v) => setForm(f => ({...f, division_id: v, district_id: '', upazila_id: '', union_id: ''}))} placeholder="All Divisions" />
                <SearchableSelect label="District" options={dropdowns.districts} value={form.district_id} onChange={(v) => setForm(f => ({...f, district_id: v, upazila_id: '', union_id: ''}))} placeholder="All Districts" disabled={!form.division_id} />
                <SearchableSelect label="Upazila" options={dropdowns.upazilas} value={form.upazila_id} onChange={(v) => setForm(f => ({...f, upazila_id: v, union_id: ''}))} placeholder="All Upazilas" disabled={!form.district_id} />
                <SearchableSelect label="Union" options={dropdowns.unions} value={form.union_id} onChange={(v) => setForm(f => ({...f, union_id: v}))} placeholder="All Unions" disabled={!form.upazila_id} />
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Phone *</label>
                  <input className="admin-form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+880..." />
                  {errors.phone && <div className="admin-form-error">{errors.phone}</div>}
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Email</label>
                  <input className="admin-form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="doctor@doctorbooklet.com" />
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
            <h3 className="admin-card-title" style={{ color: '#8B5CF6' }}>🏥 Work History / Experiences</h3>
            <button type="button" onClick={() => setExperiences([...experiences, { ...emptyExperience }])} className="admin-btn admin-btn-outline" style={{ borderRadius: 10, fontSize: 13, padding: '8px 18px', borderColor: '#8B5CF6', color: '#8B5CF6' }}>
              + Add Experience
            </button>
          </div>
          <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {experiences.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--admin-text-muted)', fontSize: 14 }}>
                No work history added yet. Click "+ Add Experience" to begin.
              </div>
            )}
            {experiences.map((exp, idx) => (
              <div key={idx} style={{ background: 'rgba(139,92,246,0.03)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 16, padding: 24, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#8B5CF6' }}>Experience #{idx + 1}</span>
                  <button type="button" onClick={() => setExperiences(experiences.filter((_, i) => i !== idx))} style={{ border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                    ✕ Remove
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Hospital / Institute (EN)</label>
                    <input className="admin-form-input" value={exp.hospital_name} onChange={e => { const v = [...experiences]; v[idx].hospital_name = e.target.value; setExperiences(v) }} placeholder="Dhaka Medical College" />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Hospital / Institute (BN)</label>
                    <input className="admin-form-input" value={exp.hospital_name_bn} onChange={e => { const v = [...experiences]; v[idx].hospital_name_bn = e.target.value; setExperiences(v) }} placeholder="ঢাকা মেডিকেল কলেজ" style={{ fontFamily: "'Hind Siliguri', sans-serif" }} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Designation (EN)</label>
                    <input className="admin-form-input" value={exp.designation} onChange={e => { const v = [...experiences]; v[idx].designation = e.target.value; setExperiences(v) }} placeholder="Senior Consultant" />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Designation (BN)</label>
                    <input className="admin-form-input" value={exp.designation_bn} onChange={e => { const v = [...experiences]; v[idx].designation_bn = e.target.value; setExperiences(v) }} placeholder="সিনিয়র কনসালট্যান্ট" style={{ fontFamily: "'Hind Siliguri', sans-serif" }} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Department (EN)</label>
                    <input className="admin-form-input" value={exp.department} onChange={e => { const v = [...experiences]; v[idx].department = e.target.value; setExperiences(v) }} placeholder="Cardiology" />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Department (BN)</label>
                    <input className="admin-form-input" value={exp.department_bn} onChange={e => { const v = [...experiences]; v[idx].department_bn = e.target.value; setExperiences(v) }} placeholder="কার্ডিওলজি" style={{ fontFamily: "'Hind Siliguri', sans-serif" }} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Address (EN)</label>
                    <input className="admin-form-input" value={exp.address} onChange={e => { const v = [...experiences]; v[idx].address = e.target.value; setExperiences(v) }} placeholder="Dhaka, Bangladesh" />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Address (BN)</label>
                    <input className="admin-form-input" value={exp.address_bn} onChange={e => { const v = [...experiences]; v[idx].address_bn = e.target.value; setExperiences(v) }} placeholder="ঢাকা, বাংলাদেশ" style={{ fontFamily: "'Hind Siliguri', sans-serif" }} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Time Period (EN)</label>
                    <input className="admin-form-input" value={exp.period} onChange={e => { const v = [...experiences]; v[idx].period = e.target.value; setExperiences(v) }} placeholder="Jan 2018 - Dec 2022" />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Time Period (BN)</label>
                    <input className="admin-form-input" value={exp.period_bn} onChange={e => { const v = [...experiences]; v[idx].period_bn = e.target.value; setExperiences(v) }} placeholder="জানুয়ারি ২০১৮ - ডিসেম্বর ২০২২" style={{ fontFamily: "'Hind Siliguri', sans-serif" }} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Total Duration (EN)</label>
                    <input className="admin-form-input" value={exp.duration} onChange={e => { const v = [...experiences]; v[idx].duration = e.target.value; setExperiences(v) }} placeholder="4 Years" />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Total Duration (BN)</label>
                    <input className="admin-form-input" value={exp.duration_bn} onChange={e => { const v = [...experiences]; v[idx].duration_bn = e.target.value; setExperiences(v) }} placeholder="৪ বছর" style={{ fontFamily: "'Hind Siliguri', sans-serif" }} />
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

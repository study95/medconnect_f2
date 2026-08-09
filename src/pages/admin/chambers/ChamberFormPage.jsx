// ChamberFormPage.jsx — Premium Chamber Create/Edit Form
import { getErrorMessage } from '../../../utils/errorHelper'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { getChamber, createChamber, updateChamber, getDoctors, getHospitals } from '../../../api/adminApi'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

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
          cursor: disabled ? 'not-allowed' : 'pointer', background: disabled ? '#F8FAFC' : 'white', 
          height: 48, padding: '0 16px', borderRadius: 12, border: '1px solid #E2E8F0',
          fontSize: 14, fontWeight: 500, transition: 'all 0.2s',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span style={{ color: selectedOption ? '#1E293B' : '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <span style={{ fontSize: 10, color: '#94A3B8' }}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {error && <div className="admin-form-error" style={{ marginTop: 4 }}>{error}</div>}

      {isOpen && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, marginTop: 8,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden', zIndex: 1000
        }}>
          <div style={{ padding: '12px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
            <input 
              type="text" 
              autoFocus
              placeholder="Search..." 
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', outline: 'none', fontSize: 13 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No results</div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt.id} 
                  style={{ 
                    padding: '10px 16px', fontSize: 14, cursor: 'pointer', 
                    background: value.toString() === opt.id.toString() ? '#F1F5F9' : 'transparent',
                    borderBottom: '1px solid #F8FAFC'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#F8FAFC'}
                  onMouseLeave={(e) => e.target.style.background = value.toString() === opt.id.toString() ? '#F1F5F9' : 'transparent'}
                  onClick={() => {
                    onChange(opt.id.toString())
                    setIsOpen(false)
                    setSearch('')
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#334155' }}>{opt.name}</div>
                  {opt.subtext && <div style={{ fontSize: 11, color: '#64748B' }}>{opt.subtext}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChamberFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin, isManager, isDoctor } = useAuth()
  const isEdit = !!id
  const isDoctorOnly = !isAdmin && !isManager && isDoctor

  const [form, setForm] = useState({ 
    doctor_id: '', 
    hospital_id: '', 
    day: '', 
    start_time: '', 
    end_time: '', 
    fee: '' 
  })
  
  const [doctors, setDoctors] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [myDoctorProfile, setMyDoctorProfile] = useState(null)

  useEffect(() => { loadDropdowns() }, [])
  useEffect(() => { if (isEdit) loadItem() }, [id])

  const loadDropdowns = async () => {
    try {
      const [docRes, hospRes] = await Promise.all([
        getDoctors({ per_page: 500 }), 
        getHospitals({ per_page: 500 })
      ])

      const docData = docRes.data?.data?.data || docRes.data?.data || docRes.data || []
      const hospData = hospRes.data?.data?.data || hospRes.data?.data || hospRes.data || []

      setDoctors(Array.isArray(docData) ? docData.map(d => ({ ...d, subtext: d.specialty?.name })) : [])
      setHospitals(Array.isArray(hospData) ? hospData.map(h => ({ ...h, subtext: h.address })) : [])

      // Auto-set doctor_id for doctor role
      if (isDoctorOnly && !isEdit) {
        const myDoc = docData.find(d =>
          String(d.user_id) === String(user?.id) ||
          d.email?.toLowerCase() === user?.email?.toLowerCase()
        )
        if (myDoc) {
          setMyDoctorProfile(myDoc)
          setForm(prev => ({ ...prev, doctor_id: String(myDoc.id) }))
        }
      }
    } catch (err) {
      console.error('Failed to load dropdowns:', err)
    }
  }

  const loadItem = async () => {
    setLoading(true)
    try {
      const res = await getChamber(id)
      const d = res.data?.data || res.data
      if (!d) throw new Error('Chamber not found')
      setForm({
        doctor_id: String(d.doctor_id || d.doctor?.id || ''),
        hospital_id: String(d.hospital_id || d.hospital?.id || ''),
        day: d.day || '',
        start_time: d.start_time ? d.start_time.substring(0, 5) : '', // HH:mm
        end_time: d.end_time ? d.end_time.substring(0, 5) : '',
        fee: d.fee || ''
      })
    } catch (err) {
} finally {
      setLoading(false)
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.doctor_id) errs.doctor_id = 'Doctor is required'
    if (!form.hospital_id) errs.hospital_id = 'Hospital is required'
    if (!form.day) errs.day = 'Day is required'
    if (!form.start_time) errs.start_time = 'Start time is required'
    if (!form.end_time) errs.end_time = 'End time is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      if (isEdit) await updateChamber(id, form)
      else await createChamber(form)
      
      navigate('/admin/chambers')
    } catch (err) {
} finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /> Synchronizing Schedule...</div>

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">
            {isEdit ? '✏️ Edit Chamber Schedule' : '🕒 Add Clinical Chamber'}
          </h2>
          <p className="admin-page-subtitle">Configure doctor availability and visiting hours at specific hospitals</p>
        </div>
        <Link to="/admin/chambers" className="admin-btn admin-btn-outline" style={{ borderRadius: 12 }}>← Back</Link>
      </div>

      <div className="admin-card" style={{ borderTop: '4px solid #4F46E5', overflow: 'visible' }}>
        <div className="admin-card-body" style={{ overflow: 'visible' }}>
          <form className="admin-form" onSubmit={handleSubmit}>
            
            {/* Top Tier: Doctor & Hospital */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 24 }}>
              <div style={{ background: '#F8FAFC', padding: 20, borderRadius: 16, border: '1px solid #E2E8F0' }}>
                {isDoctorOnly ? (
                  <div className="admin-form-group">
                    <label className="admin-form-label">Practitioner Profile</label>
                    <div style={{ padding: '12px 16px', background: '#EEF2FF', borderRadius: 12, border: '1px solid #C7D2FE', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 20 }}>👨‍⚕️</span>
                      <div>
                        <div style={{ fontWeight: 700, color: '#4338CA' }}>{myDoctorProfile?.name || user?.name}</div>
                        <div style={{ fontSize: 11, color: '#6366F1' }}>Automatic selection for your profile</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <SearchableSelect 
                    label="Assign Doctor *" 
                    placeholder="Search doctor by name..." 
                    options={doctors} 
                    value={form.doctor_id} 
                    onChange={val => { setForm({ ...form, doctor_id: val }); setErrors({ ...errors, doctor_id: '' }) }} 
                    error={errors.doctor_id}
                  />
                )}
              </div>

              <div style={{ background: '#F8FAFC', padding: 20, borderRadius: 16, border: '1px solid #E2E8F0' }}>
                <SearchableSelect 
                  label="Select Hospital *" 
                  placeholder="Search hospital or address..." 
                  options={hospitals} 
                  value={form.hospital_id} 
                  onChange={val => { setForm({ ...form, hospital_id: val }); setErrors({ ...errors, hospital_id: '' }) }} 
                  error={errors.hospital_id}
                />
              </div>
            </div>

            {/* Mid Tier: Schedule Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 24 }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Visiting Day *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {DAYS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => { setForm({ ...form, day: d }); setErrors({ ...errors, day: '' }) }}
                      style={{
                        padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                        border: '1px solid',
                        borderColor: form.day === d ? '#4F46E5' : '#E2E8F0',
                        background: form.day === d ? '#EEF2FF' : 'white',
                        color: form.day === d ? '#4338CA' : '#64748B',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {d.substring(0, 3)}
                    </button>
                  ))}
                </div>
                {errors.day && <div className="admin-form-error" style={{ marginTop: 8 }}>{errors.day}</div>}
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Consultation Fee (৳)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: 11, fontSize: 16, color: '#94A3B8' }}>৳</span>
                  <input 
                    className="admin-form-input" 
                    type="number" 
                    name="fee" 
                    value={form.fee} 
                    onChange={e => setForm({ ...form, fee: e.target.value })} 
                    placeholder="e.g. 500"
                    style={{ paddingLeft: 30, height: 48, fontWeight: 700, color: '#00A88C' }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Tier: Time Ranges */}
            <div style={{ background: '#F0FDFA', padding: 24, borderRadius: 16, border: '1px solid #CCFBF1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div className="admin-form-group">
                <label className="admin-form-label" style={{ color: '#0D9488' }}>Starting Time *</label>
                <input 
                  className="admin-form-input" 
                  type="time" 
                  name="start_time" 
                  value={form.start_time} 
                  onChange={e => { setForm({ ...form, start_time: e.target.value }); setErrors({ ...errors, start_time: '' }) }} 
                  style={{ height: 48, borderColor: errors.start_time ? '#EF4444' : '#E2E8F0' }}
                />
                {errors.start_time && <div className="admin-form-error">{errors.start_time}</div>}
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label" style={{ color: '#0D9488' }}>Ending Time *</label>
                <input 
                  className="admin-form-input" 
                  type="time" 
                  name="end_time" 
                  value={form.end_time} 
                  onChange={e => { setForm({ ...form, end_time: e.target.value }); setErrors({ ...errors, end_time: '' }) }} 
                  style={{ height: 48, borderColor: errors.end_time ? '#EF4444' : '#E2E8F0' }}
                />
                {errors.end_time && <div className="admin-form-error">{errors.end_time}</div>}
              </div>
            </div>

            <div className="admin-form-actions" style={{ marginTop: 40 }}>
              <button 
                type="submit" 
                className="admin-btn admin-btn-primary" 
                disabled={saving}
                style={{ 
                  background: '#4F46E5', padding: '16px 48px', fontSize: 16, fontWeight: 800, borderRadius: 14, 
                  boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.2)' 
                }}
              >
                {saving ? 'Processing...' : isEdit ? '💾 Update Schedule' : '🚀 Publish Chamber'}
              </button>
              <Link to="/admin/chambers" className="admin-btn admin-btn-outline" style={{ padding: '16px 32px', borderRadius: 14 }}>Cancel</Link>
            </div>
          </form>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-form-input:focus { border-color: #4F46E5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
      `}} />
    </div>
  )
}

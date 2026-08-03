// AppointmentFormPage.jsx — Premium Appointment Create/Edit Form
import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useSearchParams, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getErrorMessage } from '../../../utils/errorHelper'
import { 
  getDoctors, getChambers, getPatients, createAppointment, 
  createWalkInPatient, getAppointment, updateAppointment 
} from '../../../api/adminApi'
import { useAuth } from '../../../context/AuthContext'

// Premium Searchable Select for Patients/Doctors
function SearchableSelect({ label, options, value, onChange, placeholder, error, disabled = false }) {
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
    .filter(opt => opt.name?.toLowerCase().includes(search.toLowerCase()) || opt.subtext?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  return (
    <div className="admin-form-group" ref={dropdownRef} style={{ position: 'relative', opacity: disabled ? 0.6 : 1 }}>
      <label className="admin-form-label">{label}</label>
      <div 
        className={`admin-form-input ${error ? 'border-red-500' : ''}`}
        style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          cursor: disabled ? 'not-allowed' : 'pointer', background: disabled ? 'var(--admin-bg)' : 'var(--admin-card-bg)', 
          height: 48, padding: '0 16px', borderRadius: 12, border: '1px solid var(--admin-border)',
          fontSize: 14, fontWeight: 500, transition: 'all 0.2s',
          color: 'var(--admin-text)'
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span style={{ color: selectedOption ? 'var(--admin-text)' : 'var(--admin-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <span style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
      </div>
      {error && <div className="admin-form-error">{error}</div>}

      {isOpen && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 12, marginTop: 8,
          boxShadow: 'var(--admin-shadow-lg)', overflow: 'hidden', zIndex: 1000
        }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg)' }}>
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
          <div style={{ maxHeight: 250, overflowY: 'auto' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>No matches found</div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt.id} 
                  style={{ 
                    padding: '10px 16px', fontSize: 14, cursor: 'pointer', 
                    background: value.toString() === opt.id.toString() ? 'rgba(0, 168, 140, 0.1)' : 'transparent',
                    borderBottom: '1px solid var(--admin-border)'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(0, 168, 140, 0.05)'}
                  onMouseLeave={(e) => e.target.style.background = value.toString() === opt.id.toString() ? 'rgba(0, 168, 140, 0.1)' : 'transparent'}
                  onClick={() => {
                    onChange(opt.id.toString())
                    setIsOpen(false)
                    setSearch('')
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{opt.name}</div>
                  {opt.subtext && <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{opt.subtext}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AppointmentFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const preSelectedDoctorId = searchParams.get('doctor_id')
  const preSelectedPatientId = searchParams.get('patient_id')
  const navigate = useNavigate()
  const { isAdmin, isDoctor, user } = useAuth()
  const isEdit = !!id

  const [form, setForm] = useState({
    patient_id: '',
    doctor_id: '',
    chamber_id: '',
    date: '',
    time: '',
    notes: '',
    serial_number: '',
    status: 'pending'
  })

  // Walk-in patient logic
  const [showWalkIn, setShowWalkIn] = useState(false)
  const [walkIn, setWalkIn] = useState({ name: '', phone: '', email: '' })
  const [creatingPatient, setCreatingPatient] = useState(false)

  const [doctors, setDoctors] = useState([])
  const [chambers, setChambers] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadInitialData()
    if (isEdit) loadAppointment()
    if (preSelectedDoctorId) setForm(f => ({ ...f, doctor_id: preSelectedDoctorId }))
    if (preSelectedPatientId) setForm(f => ({ ...f, patient_id: preSelectedPatientId }))
  }, [id])

  useEffect(() => {
    if (form.doctor_id) fetchChambers(form.doctor_id)
  }, [form.doctor_id])

  const loadInitialData = async () => {
    try {
      const [docRes, patRes] = await Promise.all([
        getDoctors({ per_page: 1000 }),
        getPatients({ per_page: 1000 })
      ])
      setDoctors(docRes.data?.data?.data || docRes.data?.data || [])
      setPatients(patRes.data?.data?.data || patRes.data?.data || [])
    } catch (err) { console.error(err) }
  }

  const fetchChambers = async (docId) => {
    try {
      const res = await getChambers(docId)
      setChambers(res.data?.data || [])
    } catch (err) { console.error(err) }
  }

  const loadAppointment = async () => {
    setLoading(true)
    try {
      const res = await getAppointment(id)
      const a = res.data?.data || res.data
      setForm({
        patient_id: a.patient_id || '',
        doctor_id: a.doctor_id || '',
        chamber_id: a.chamber_id || '',
        date: a.date || '',
        time: a.time || '',
        notes: a.notes || '',
        serial_number: a.serial_number || '',
        status: a.status || 'pending'
      })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load appointment'))
    } finally {
      setLoading(false)
    }
  }

  const handleWalkInSubmit = async (e) => {
    e.preventDefault()
    if (!walkIn.name || !walkIn.phone) return toast.error('Name and Phone are required')
    setCreatingPatient(true)
    try {
      const res = await createWalkInPatient(walkIn)
      const newPatient = res.data?.data || res.data
      setPatients([newPatient, ...patients])
      setForm(f => ({ ...f, patient_id: newPatient.id }))
      setShowWalkIn(false)
      toast.success('Patient record created')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create patient'))
    } finally {
      setCreatingPatient(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      if (isEdit) {
        await updateAppointment(id, form)
        toast.success('Appointment updated successfully')
      } else {
        await createAppointment(form)
        toast.success('Appointment booked successfully')
      }
      navigate('/admin/appointments')
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
        toast.error('Please check the form for errors')
      } else {
        toast.error(getErrorMessage(err, 'Submission failed'))
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-loading" style={{ padding: 100 }}><div className="admin-spinner"></div> Loading...</div>

  return (
    <div className="admin-container" style={{ maxWidth: 1000 }}>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>✨</span>
            {isEdit ? 'Edit Appointment' : 'New Appointment'}
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Fill in the details to schedule a new clinical visit</p>
        </div>
        <Link to="/admin/appointments" className="admin-btn admin-btn-outline">Cancel</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 32 }}>
        {/* Main Form Area */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Booking Information</h3>
          </div>
          <div className="admin-card-body">
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 24 }}>
                <SearchableSelect 
                  label="Select Patient *" 
                  options={patients.map(p => ({ id: p.id, name: p.name, subtext: p.phone }))} 
                  value={form.patient_id} 
                  onChange={v => setForm(f => ({ ...f, patient_id: v }))}
                  placeholder="Search by name or phone..."
                  error={errors.patient_id?.[0]}
                />
                {!form.patient_id && (
                  <button 
                    type="button" 
                    onClick={() => setShowWalkIn(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--admin-primary)', fontSize: 12, fontWeight: 700, padding: '8px 0', cursor: 'pointer' }}
                  >
                    + Add as New Walk-in Patient
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <SearchableSelect 
                  label="Assign Doctor *" 
                  options={doctors.map(d => ({ id: d.id, name: d.name, subtext: d.specialty?.name }))} 
                  value={form.doctor_id} 
                  onChange={v => setForm(f => ({ ...f, doctor_id: v }))}
                  placeholder="Select doctor..."
                  error={errors.doctor_id?.[0]}
                  disabled={isDoctor}
                />
                
                <div className="admin-form-group">
                  <label className="admin-form-label">Hospital/Chamber *</label>
                  <select 
                    className="admin-form-select" 
                    value={form.chamber_id} 
                    onChange={e => setForm(f => ({ ...f, chamber_id: e.target.value }))}
                    disabled={!form.doctor_id}
                    style={{ background: 'var(--admin-card-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)' }}
                  >
                    <option value="">Select Chamber</option>
                    {chambers.map(c => (
                      <option key={c.id} value={c.id}>{c.hospital?.name} ({c.name})</option>
                    ))}
                  </select>
                  {errors.chamber_id && <div className="admin-form-error">{errors.chamber_id[0]}</div>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 24 }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Appointment Date *</label>
                  <input 
                    type="date" 
                    className="admin-form-input" 
                    value={form.date} 
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    style={{ background: 'var(--admin-card-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)' }}
                  />
                  {errors.date && <div className="admin-form-error">{errors.date[0]}</div>}
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Time</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    placeholder="e.g. 10:30 AM" 
                    value={form.time} 
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    style={{ background: 'var(--admin-card-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)' }}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Serial # (Optional)</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    placeholder="SL No." 
                    value={form.serial_number} 
                    onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))}
                    style={{ background: 'var(--admin-card-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)' }}
                  />
                </div>
              </div>

              <div className="admin-form-group" style={{ marginBottom: 32 }}>
                <label className="admin-form-label">Administrative Notes</label>
                <textarea 
                  className="admin-form-input" 
                  rows="4" 
                  placeholder="Internal notes about the patient or appointment..." 
                  value={form.notes} 
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ background: 'var(--admin-card-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving} style={{ padding: '12px 32px' }}>
                  {saving ? 'Saving...' : isEdit ? 'Update Appointment' : 'Confirm Booking'}
                </button>
                <Link to="/admin/appointments" className="admin-btn admin-btn-outline" style={{ padding: '12px 32px' }}>Discard Changes</Link>
              </div>
            </form>
          </div>
        </div>

        {/* Side Guidance / Quick Stats */}
        <div>
          <div className="admin-card" style={{ marginBottom: 24, background: 'var(--admin-sidebar-active)', border: '1px solid var(--admin-sidebar-accent)' }}>
            <div className="admin-card-body" style={{ padding: 24 }}>
              <h4 style={{ margin: '0 0 12px', color: 'var(--admin-sidebar-accent)', fontWeight: 800 }}>Booking Guidelines</h4>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none', color: 'var(--admin-text)', fontSize: 13, lineHeight: 1.6 }}>
                <li style={{ marginBottom: 8 }}>✅ Ensure the patient has a valid phone number for SMS notifications.</li>
                <li style={{ marginBottom: 8 }}>✅ Double check doctor availability before confirming a slot.</li>
                <li>✅ Add serial numbers for walk-in management.</li>
              </ul>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header"><h3 className="admin-card-title">Walk-in Status</h3></div>
            <div className="admin-card-body">
               <p style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
                 You are currently booking as an <strong>Administrative Override</strong>. 
                 This will bypass standard patient slot limitations.
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* Walk-in Patient Modal */}
      {showWalkIn && (
        <div className="modal-overlay">
          <div className="admin-card premium-modal" style={{ maxWidth: 450, padding: 32, background: 'var(--admin-card-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--admin-text)' }}>New Patient Record</h3>
              <button onClick={() => setShowWalkIn(false)} style={{ border: 'none', background: 'var(--admin-bg)', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', color: 'var(--admin-text)' }}>✕</button>
            </div>
            <form onSubmit={handleWalkInSubmit}>
              <div className="admin-form-group" style={{ marginBottom: 16 }}>
                <label className="admin-form-label">Full Name *</label>
                <input type="text" className="admin-form-input" value={walkIn.name} onChange={e => setWalkIn(p => ({ ...p, name: e.target.value }))} required style={{ background: 'var(--admin-card-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)' }} />
              </div>
              <div className="admin-form-group" style={{ marginBottom: 16 }}>
                <label className="admin-form-label">Phone Number *</label>
                <input type="tel" className="admin-form-input" value={walkIn.phone} onChange={e => setWalkIn(p => ({ ...p, phone: e.target.value }))} required style={{ background: 'var(--admin-card-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)' }} />
              </div>
              <div className="admin-form-group" style={{ marginBottom: 24 }}>
                <label className="admin-form-label">Email (Optional)</label>
                <input type="email" className="admin-form-input" value={walkIn.email} onChange={e => setWalkIn(p => ({ ...p, email: e.target.value }))} style={{ background: 'var(--admin-card-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)' }} />
              </div>
              <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', height: 48 }} disabled={creatingPatient}>
                {creatingPatient ? 'Creating...' : 'Create & Select Patient'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; padding: 20px;
        }
      `}} />
    </div>
  )
}

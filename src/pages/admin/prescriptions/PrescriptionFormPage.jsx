// PrescriptionFormPage.jsx — Doctor writes prescription with enhanced medicine autocomplete
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { createPrescription, updatePrescription, getPrescription, getAppointment, createWalkInPatient, searchMedicines } from '../../../api/adminApi'
import { toast } from 'react-toastify'
import { getErrorMessage } from '../../../utils/errorHelper'

const emptyMedicine = { medicine_name: '', dosage: '', duration: '', instructions: '' }

export default function PrescriptionFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const appointmentId = searchParams.get('appointment_id')
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEdit = !!id

  const [form, setForm] = useState({
    appointment_id: appointmentId || '',
    diagnosis: '',
    advice: '',
    follow_up_date: '',
    cc: '',
    oe: '',
    oh: '',
    mh: '',
    investigation: '',
    age: '',
    sex: '',
    weight: '',
    registration_no: '',
    hospital_name: '', hospital_address: '', hospital_phone: '', hospital_email: '',
    chamber_name: '',
    medicines: [{ ...emptyMedicine }]
  })
  const [appointmentInfo, setAppointmentInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('clinical')

  // Walk-in Patient State
  const [showWalkIn, setShowWalkIn] = useState(false)
  const [walkInForm, setWalkInForm] = useState({ name: '', email: '', phone: '' })
  const [registering, setRegistering] = useState(false)

  // Doctor Advice Notes
  const [savedNotes, setSavedNotes] = useState([])

  useEffect(() => {
    if (user?.id) {
      const notesStr = localStorage.getItem(`doctor_advice_notes_${user.id}`)
      if (notesStr) {
        try {
          setSavedNotes(JSON.parse(notesStr))
        } catch (e) { }
      }
    }
  }, [user])

  const appendNoteToAdvice = (e) => {
    const noteId = e.target.value
    if (!noteId) return
    const note = savedNotes.find(n => n.id === noteId)
    if (note) {
      const currentAdvice = form.advice ? form.advice.trim() : ''
      const newAdvice = currentAdvice ? `${currentAdvice}\n\n${note.content}` : note.content
      setForm(prev => ({ ...prev, advice: newAdvice }))
    }
    e.target.value = ''
  }

  // Medicine Suggestions State
  const [medicineSuggestions, setMedicineSuggestions] = useState([])
  const [activeMedicineIndex, setActiveMedicineIndex] = useState(null)
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(-1)
  const medicineSearchTimeout = useRef(null)
  const suggestionsRef = useRef(null)
  const medicineInputRefs = useRef([])

  useEffect(() => {
    if (isEdit) loadPrescription()
    if (appointmentId) loadAppointment(appointmentId)
  }, [id, appointmentId])

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setMedicineSuggestions([])
        setActiveMedicineIndex(null)
        setHighlightedSuggestion(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadPrescription = async () => {
    setLoading(true)
    try {
      const res = await getPrescription(id)
      const p = res.data?.data || res.data
      setForm({
        appointment_id: p.appointment_id || '',
        diagnosis: p.diagnosis || '',
        advice: p.advice || '',
        follow_up_date: p.follow_up_date || '',
        cc: p.cc || '',
        oe: p.oe || '',
        oh: p.oh || '',
        mh: p.mh || '',
        investigation: p.investigation || '',
        age: p.age || '',
        sex: p.sex || '',
        weight: p.weight || '',
        registration_no: p.registration_no || '',
        medicines: p.medicines?.length > 0 ? p.medicines : [{ ...emptyMedicine }]
      })
      if (p.appointment_id) loadAppointment(p.appointment_id)
    } catch (err) { toast.error(getErrorMessage(err, 'Failed to load')) }
    finally { setLoading(false) }
  }

  const loadAppointment = async (aId) => {
    try {
      const res = await getAppointment(aId)
      const data = res.data?.data || res.data
      setAppointmentInfo(data)
      if (data && data.registration_id) {

        let calculatedAge = ''
        if (data.patient_dob && data.patient_dob !== '1900-01-01' && data.patient_dob !== '0000-00-00') {
          const birthDate = new Date(data.patient_dob)
          const today = new Date()
          let years = today.getFullYear() - birthDate.getFullYear()
          let months = today.getMonth() - birthDate.getMonth()
          if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
            years--
            months += 12
          }
          if (years > 0) {
            calculatedAge = `${years}Y ${months > 0 ? `${months}M` : ''}`.trim()
          } else if (months > 0) {
            calculatedAge = `${months}M`
          } else {
            calculatedAge = 'Newborn'
          }
        }

        setForm(prev => ({
          ...prev,
          registration_no: data.registration_id,
          sex: data.patient_gender ? (data.patient_gender.charAt(0).toUpperCase() + data.patient_gender.slice(1)) : '',
          age: calculatedAge || prev.age,
          hospital_name: data.hospital?.name || data.hospital_name || '',
          hospital_address: data.hospital?.address || data.hospital_address || '',
          hospital_phone: data.hospital?.phone || data.hospital_phone || '',
          hospital_email: data.hospital?.email || data.hospital_email || '',
          chamber_name: data.chamber?.name || data.chamber_name || ''
        }))
      }
    } catch { }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // --- MEDICINE SEARCH LOGIC ---
  const onMedicineSearch = (index, value) => {
    handleMedicineChange(index, 'medicine_name', value)
    setActiveMedicineIndex(index)
    setHighlightedSuggestion(-1)

    if (medicineSearchTimeout.current) clearTimeout(medicineSearchTimeout.current)

    if (!value.trim()) {
      setMedicineSuggestions([])
      return
    }

    medicineSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await searchMedicines({ search: value })
        const results = res.data?.data || []
        setMedicineSuggestions(Array.isArray(results) ? results : [])
      } catch (err) { }
    }, 300)
  }

  const selectMedicine = (index, medicineObj) => {
    const updated = [...form.medicines]
    // Build the full display name: "dosage_type medicine_name strength"
    const fullName = [medicineObj.dosage_type, medicineObj.medicine_name || medicineObj.name, medicineObj.strength].filter(Boolean).join(' ')
    updated[index] = {
      ...updated[index],
      medicine_name: fullName || medicineObj.name || medicineObj.medicine_name,
      dosage: medicineObj.dosage || updated[index].dosage || '',
      duration: medicineObj.duration || updated[index].duration || '',
      instructions: medicineObj.instructions || updated[index].instructions || ''
    }
    setForm({ ...form, medicines: updated })
    setMedicineSuggestions([])
    setActiveMedicineIndex(null)
    setHighlightedSuggestion(-1)
  }

  // Keyboard navigation for suggestions
  const handleMedicineKeyDown = (e, index) => {
    if (activeMedicineIndex !== index || medicineSuggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedSuggestion(prev => Math.min(prev + 1, medicineSuggestions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedSuggestion(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedSuggestion >= 0 && highlightedSuggestion < medicineSuggestions.length) {
          selectMedicine(index, medicineSuggestions[highlightedSuggestion])
        }
        break
      case 'Escape':
        setMedicineSuggestions([])
        setActiveMedicineIndex(null)
        setHighlightedSuggestion(-1)
        break
    }
  }

  // Highlight matched text in suggestions
  const highlightMatch = (text, query) => {
    if (!query || !text) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} style={{ background: '#FEF08A', padding: 0, borderRadius: 2, fontWeight: 700 }}>{part}</mark>
      ) : part
    )
  }

  const handleMedicineChange = (index, field, value) => {
    const updated = [...form.medicines]
    updated[index] = { ...updated[index], [field]: value }
    setForm({ ...form, medicines: updated })
  }

  const addMedicine = () => {
    setForm({ ...form, medicines: [...form.medicines, { ...emptyMedicine }] })
  }

  const removeMedicine = (index) => {
    if (form.medicines.length <= 1) return
    setForm({ ...form, medicines: form.medicines.filter((_, i) => i !== index) })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.diagnosis.trim()) { toast.error('Diagnosis is required'); setActiveTab('clinical'); return; }

    const cleanMedicines = form.medicines.filter(m => m.medicine_name.trim())
    if (cleanMedicines.length === 0) { toast.error('At least one medicine is required'); setActiveTab('medicines'); return; }

    setSaving(true)
    try {
      if (isEdit) {
        await updatePrescription(id, { ...form, medicines: cleanMedicines })
        toast.success('Prescription updated!')
      } else {
        await createPrescription({ ...form, medicines: cleanMedicines })
        toast.success('Prescription created!')
      }
      setTimeout(() => navigate('/admin/prescriptions'), 800)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save prescription'))
    } finally {
      setSaving(false)
    }
  }

  const handleWalkInRegister = async () => {
    if (!walkInForm.name) {
      toast.error('Patient name is required')
      return
    }

    setRegistering(true)
    try {
      const res = await createWalkInPatient(walkInForm)
      const data = res.data?.data
      if (data && data.appointment_id) {
        setForm({ ...form, appointment_id: data.appointment_id })
        toast.success(res.data.message || 'Patient registered & Appointment created!')
        loadAppointment(data.appointment_id)
        setShowWalkIn(false)
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to register patient'))
    } finally {
      setRegistering(false)
    }
  }

  // Get current search text for highlighting
  const currentSearchText = activeMedicineIndex !== null ? form.medicines[activeMedicineIndex]?.medicine_name || '' : ''

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /> Loading...</div>

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">{isEdit ? 'Edit Prescription' : '📝 Write Prescription'}</h2>
          <p className="admin-page-subtitle">
            {appointmentInfo ? `Patient: ${appointmentInfo.user_name} | Date: ${appointmentInfo.date}` : 'Fill in the prescription details'}
          </p>
        </div>
        <Link to="/admin/prescriptions" className="admin-btn admin-btn-outline">← Back</Link>
      </div>

      {appointmentInfo && (
        <div style={{
          background: 'var(--admin-sidebar-active)',
          borderRadius: 16, padding: '20px 24px', marginBottom: 24,
          border: '1px solid var(--admin-sidebar-border)', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap'
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #00A88C, #00C9A7)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900
          }}>
            {appointmentInfo.user_name?.charAt(0)?.toUpperCase() || 'P'}
          </div>
          <div>
            <h4 style={{ margin: '0 0 4px', fontWeight: 800, color: 'var(--admin-text)' }}>{appointmentInfo.user_name}</h4>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-text-muted)' }}>
              📅 {appointmentInfo.date} &nbsp; 🕒 {appointmentInfo.time} &nbsp;
              <span style={{ color: '#00A88C', fontWeight: 700 }}>#{appointmentInfo.id}</span>
            </p>
          </div>
        </div>
      )}

      <div className="admin-card" style={{ overflow: 'visible' }}>
        {/* TABS */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--admin-border)', marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => setActiveTab('clinical')}
            style={{
              padding: '16px 24px', background: 'none', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              color: activeTab === 'clinical' ? '#00A88C' : '#6B7280',
              borderBottom: activeTab === 'clinical' ? '3px solid #00A88C' : '3px solid transparent'
            }}>📋 Clinical Info</button>
          <button
            type="button"
            onClick={() => setActiveTab('medicines')}
            style={{
              padding: '16px 24px', background: 'none', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              color: activeTab === 'medicines' ? '#00A88C' : '#6B7280',
              borderBottom: activeTab === 'medicines' ? '3px solid #00A88C' : '3px solid transparent'
            }}>💊 Medicines</button>
          <button
            type="button"
            onClick={() => setActiveTab('advice')}
            style={{
              padding: '16px 24px', background: 'none', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              color: activeTab === 'advice' ? '#00A88C' : '#6B7280',
              borderBottom: activeTab === 'advice' ? '3px solid #00A88C' : '3px solid transparent'
            }}>💬 Advice & Settings</button>
        </div>

        <div className="admin-card-body" style={{ padding: '0 32px 32px', overflow: 'visible' }}>
          <form onSubmit={handleSubmit}>

            {/* TAB: CLINICAL */}
            <div style={{ display: activeTab === 'clinical' ? 'block' : 'none' }}>
              {!appointmentInfo && !isEdit && (
                <div style={{ marginBottom: 30, padding: 24, background: 'var(--admin-sidebar-user-bg)', borderRadius: 16, border: '1px solid var(--admin-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ margin: 0, color: 'var(--admin-text)', fontWeight: 800 }}>Select Patient Appointment</h4>
                    <button type="button" onClick={() => setShowWalkIn(!showWalkIn)} className="admin-btn admin-btn-outline admin-btn-sm" style={{ borderColor: '#00A88C', color: '#00A88C' }}>
                      {showWalkIn ? 'Use Existing Appointment' : '+ Register Walk-in Patient'}
                    </button>
                  </div>

                  {!showWalkIn ? (
                    <div className="admin-form-group" style={{ marginBottom: 0 }}>
                      <label className="admin-form-label">Appointment ID *</label>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <input className="admin-form-input" name="appointment_id" value={form.appointment_id}
                          onChange={handleChange} placeholder="Enter existing Appointment ID" type="number" />
                        <button type="button" className="admin-btn admin-btn-primary" onClick={() => loadAppointment(form.appointment_id)}>
                          Load
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: 16 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                        <div><label className="admin-form-label">Patient Name *</label><input className="admin-form-input" value={walkInForm.name} onChange={e => setWalkInForm({ ...walkInForm, name: e.target.value })} placeholder="John Doe" /></div>
                        <div><label className="admin-form-label">Email *</label><input className="admin-form-input" type="email" value={walkInForm.email} onChange={e => setWalkInForm({ ...walkInForm, email: e.target.value })} placeholder="john@example.com" /></div>
                        <div><label className="admin-form-label">Phone</label><input className="admin-form-input" value={walkInForm.phone} onChange={e => setWalkInForm({ ...walkInForm, phone: e.target.value })} placeholder="+1234567890" /></div>
                      </div>
                      <button type="button" className="admin-btn admin-btn-primary" onClick={handleWalkInRegister} disabled={registering}>
                        {registering ? 'Registering...' : 'Register & Load'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                {/* Clinical details column */}
                <div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Diagnosis / Final Impression *</label>
                    <textarea className="admin-form-textarea" name="diagnosis" value={form.diagnosis} onChange={handleChange} rows={2} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">C/C (Chief Complaint)</label>
                    <textarea className="admin-form-textarea" name="cc" value={form.cc} onChange={handleChange} rows={2} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">O/E (On Examination)</label>
                    <textarea className="admin-form-textarea" name="oe" value={form.oe} onChange={handleChange} rows={2} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">O/H (Occupational History)</label>
                    <input className="admin-form-input" name="oh" value={form.oh} onChange={handleChange} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">M/H (Medical History)</label>
                    <input className="admin-form-input" name="mh" value={form.mh} onChange={handleChange} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Investigations</label>
                    <textarea className="admin-form-textarea" name="investigation" value={form.investigation} onChange={handleChange} rows={2} />
                  </div>
                </div>

                {/* Vitals Column */}
                <div style={{ background: 'var(--admin-sidebar-user-bg)', padding: 20, borderRadius: 16, border: '1px solid var(--admin-border)' }}>
                  <h4 style={{ margin: '0 0 16px', color: 'var(--admin-text)' }}>Vitals & Demographics</h4>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Age</label>
                    <input className="admin-form-input" name="age" value={form.age} onChange={handleChange} placeholder="e.g. 34Y 2M" />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Sex</label>
                    <select className="admin-form-select" name="sex" value={form.sex} onChange={handleChange}>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Weight</label>
                    <input className="admin-form-input" name="weight" value={form.weight} onChange={handleChange} placeholder="e.g. 70 kg" />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Registration No.</label>
                    <input className="admin-form-input" name="registration_no" value={form.registration_no} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>

            {/* TAB: MEDICINES */}
            <div style={{ display: activeTab === 'medicines' ? 'block' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, margin: 0 }}>Type medicine name to get auto-suggestions. Use ↑↓ keys to navigate, Enter to select.</p>
                <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={addMedicine}>+ Add Medicine</button>
              </div>

              {form.medicines.map((med, idx) => (
                <div key={idx} style={{ background: 'var(--admin-sidebar-user-bg)', borderRadius: 14, padding: '16px 20px', marginBottom: 12, border: '1px solid var(--admin-border)', overflow: 'visible' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--admin-primary)' }}>Medicine #{idx + 1}</span>
                    <button type="button" onClick={() => removeMedicine(idx)} style={{ background: 'none', border: 'none', color: 'var(--admin-danger)', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>✕ Remove</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: 12, position: 'relative' }}>
                    <div style={{ position: 'relative' }} ref={suggestionsRef}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>Medicine Name *</label>
                      <input
                        className="admin-form-input"
                        value={med.medicine_name}
                        onChange={e => onMedicineSearch(idx, e.target.value)}
                        onKeyDown={e => handleMedicineKeyDown(e, idx)}
                        onFocus={() => { setActiveMedicineIndex(idx); setHighlightedSuggestion(-1) }}
                        placeholder="Search medicine..."
                        autoComplete="off"
                        ref={el => medicineInputRefs.current[idx] = el}
                      />

                      {/* Enhanced Suggestion Dropdown */}
                      {activeMedicineIndex === idx && medicineSuggestions.length > 0 && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0,
                          background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)',
                          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                          zIndex: 1000, maxHeight: 300, overflowY: 'auto',
                          marginTop: 4
                        }}>
                          {medicineSuggestions.map((s, sIdx) => {
                            const displayName = [s.dosage_type, s.medicine_name || s.name, s.strength].filter(Boolean).join(' ')
                            const isHighlighted = sIdx === highlightedSuggestion
                            return (
                              <div
                                key={s.id}
                                onClick={() => selectMedicine(idx, s)}
                                onMouseEnter={() => setHighlightedSuggestion(sIdx)}
                                style={{
                                  padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                                  borderBottom: sIdx < medicineSuggestions.length - 1 ? '1px solid var(--admin-border)' : 'none',
                                  background: isHighlighted ? 'var(--admin-sidebar-active)' : 'transparent',
                                  transition: 'background 0.1s',
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>
                                    {highlightMatch(displayName, currentSearchText)}
                                  </div>
                                  {(s.generic_name || s.group_name) && (
                                    <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                                      {highlightMatch(s.generic_name || s.group_name, currentSearchText)}
                                    </div>
                                  )}
                                </div>
                                {s.company_name && (
                                  <span style={{ fontSize: 10, color: 'var(--admin-text-muted)', fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>
                                    {s.company_name}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>Dosage</label>
                      <input className="admin-form-input" value={med.dosage} onChange={e => handleMedicineChange(idx, 'dosage', e.target.value)} placeholder="e.g. 1+0+1" />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>Duration</label>
                      <input className="admin-form-input" value={med.duration} onChange={e => handleMedicineChange(idx, 'duration', e.target.value)} placeholder="e.g. 7 Days" />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>Instructions</label>
                      <input className="admin-form-input" value={med.instructions} onChange={e => handleMedicineChange(idx, 'instructions', e.target.value)} placeholder="e.g. After meal" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* TAB: ADVICE */}
            <div style={{ display: activeTab === 'advice' ? 'block' : 'none' }}>
              <div className="admin-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="admin-form-label" style={{ margin: 0 }}>Advice / Recommendations</label>
                  {savedNotes.length > 0 && (
                    <select
                      className="admin-form-select"
                      style={{ width: 'auto', padding: '4px 8px', fontSize: 13 }}
                      onChange={appendNoteToAdvice}
                      defaultValue=""
                    >
                      <option value="">+ Append Saved Note</option>
                      {savedNotes.map(note => (
                        <option key={note.id} value={note.id}>{note.title}</option>
                      ))}
                    </select>
                  )}
                </div>
                <textarea className="admin-form-textarea" name="advice" value={form.advice} onChange={handleChange} rows={6} placeholder="e.g. Drink plenty of water, avoid spicy food..." />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Follow-up Date</label>
                <input className="admin-form-input" type="date" name="follow_up_date" value={form.follow_up_date} onChange={handleChange} style={{ maxWidth: 200 }} />
              </div>
            </div>

            <div className="admin-form-actions" style={{ marginTop: 32, borderTop: '1px solid #E5EAF0', paddingTop: 24 }}>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                {saving ? 'Saving...' : isEdit ? 'Update Prescription' : '✅ Verify and Save Prescription'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

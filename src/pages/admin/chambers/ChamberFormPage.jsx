// ChamberFormPage.jsx — Modern & Premium Chamber Create/Edit Form
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { 
  Calendar, Clock, Building2, User, DollarSign, Check, 
  ArrowLeft, Sparkles, AlertCircle, CheckCircle2, Info, X
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { getChamber, createChamber, updateChamber, getDoctors, getHospitals } from '../../../api/adminApi'
import { getErrorMessage } from '../../../utils/errorHelper'

const DAYS = [
  { id: 'Saturday', label: 'Sat', full: 'Saturday', weekend: true },
  { id: 'Sunday', label: 'Sun', full: 'Sunday' },
  { id: 'Monday', label: 'Mon', full: 'Monday' },
  { id: 'Tuesday', label: 'Tue', full: 'Tuesday' },
  { id: 'Wednesday', label: 'Wed', full: 'Wednesday' },
  { id: 'Thursday', label: 'Thu', full: 'Thursday' },
  { id: 'Friday', label: 'Fri', full: 'Friday', weekend: true },
]

// Helper to format 24h time to 12h AM/PM
function format12Hour(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  if (isNaN(h)) return timeStr
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  const minStr = m < 10 ? `0${m}` : m
  return `${hour12}:${minStr} ${period}`
}

// Calculate time difference in human string
function calculateDuration(start, end) {
  if (!start || !end) return null
  const [h1, m1] = start.split(':').map(Number)
  const [h2, m2] = end.split(':').map(Number)
  if (isNaN(h1) || isNaN(h2)) return null
  let totalMin = (h2 * 60 + m2) - (h1 * 60 + m1)
  if (totalMin <= 0) totalMin += 24 * 60 // crosses midnight
  const hours = Math.floor(totalMin / 60)
  const mins = totalMin % 60
  if (mins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`
  return `${hours > 0 ? `${hours} hr${hours > 1 ? 's ' : ' '}` : ''}${mins} min`
}

// Premium Searchable Dropdown with Rich Preview
function SearchableSelect({ label, icon, options, value, onChange, placeholder, disabled = false, error = '', helperText = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.id.toString() === value.toString())
  const filteredOptions = options
    .filter(opt => 
      opt.name?.toLowerCase().includes(search.toLowerCase()) || 
      opt.subtext?.toLowerCase().includes(search.toLowerCase()) ||
      opt.bmdc?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', opacity: disabled ? 0.7 : 1 }}>
      <label style={{ 
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 12, fontWeight: 700, color: 'var(--admin-text, #1e293b)', 
        marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' 
      }}>
        {icon}
        {label}
      </label>

      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          cursor: disabled ? 'not-allowed' : 'pointer', 
          background: disabled ? 'var(--admin-bg, #f8fafc)' : 'var(--admin-card-bg, #ffffff)', 
          minHeight: 50, padding: '10px 16px', borderRadius: 12, 
          border: error ? '1.5px solid #ef4444' : isOpen ? '1.5px solid #6366f1' : '1.5px solid var(--admin-border, #e2e8f0)',
          boxShadow: isOpen ? '0 0 0 4px rgba(99, 102, 241, 0.12)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          {selectedOption ? (
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--admin-text, #0f172a)' }}>
                {selectedOption.name}
              </div>
              {selectedOption.subtext && (
                <div style={{ fontSize: 12, color: 'var(--admin-text-muted, #64748b)', marginTop: 2 }}>
                  {selectedOption.subtext}
                </div>
              )}
            </div>
          ) : (
            <span style={{ color: 'var(--admin-text-muted, #94a3b8)', fontSize: 14 }}>{placeholder}</span>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--admin-text-muted, #94a3b8)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
      </div>

      {helperText && !error && (
        <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748b)', marginTop: 4 }}>{helperText}</div>
      )}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#ef4444', fontWeight: 600, marginTop: 4 }}>
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {isOpen && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--admin-card-bg, #ffffff)', border: '1.5px solid var(--admin-border, #e2e8f0)', 
          borderRadius: 14, marginTop: 8,
          boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.15)', overflow: 'hidden', zIndex: 1000,
          animation: 'fadeInSlide 0.15s ease-out'
        }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--admin-border, #f1f5f9)', background: 'var(--admin-bg, #f8fafc)' }}>
            <input 
              ref={inputRef}
              type="text" 
              autoFocus
              placeholder="Type to search..." 
              style={{ 
                width: '100%', padding: '8px 12px', borderRadius: 8, 
                border: '1px solid var(--admin-border, #e2e8f0)', outline: 'none', 
                fontSize: 13, background: 'var(--admin-card-bg, #ffffff)',
                color: 'var(--admin-text, #0f172a)'
              }}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--admin-text-muted, #94a3b8)', fontSize: 13 }}>
                No matching results found
              </div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = value.toString() === opt.id.toString()
                return (
                  <div 
                    key={opt.id} 
                    style={{ 
                      padding: '10px 16px', cursor: 'pointer', 
                      background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                      borderBottom: '1px solid var(--admin-border, #f8fafc)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(99, 102, 241, 0.04)' }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                    onClick={() => {
                      onChange(opt.id.toString())
                      setIsOpen(false)
                      setSearch('')
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: isSelected ? 700 : 600, color: isSelected ? '#6366f1' : 'var(--admin-text, #334155)', fontSize: 13.5 }}>
                        {opt.name}
                      </div>
                      {opt.subtext && (
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748b)', marginTop: 2 }}>
                          {opt.subtext}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check size={16} color="#6366f1" />}
                  </div>
                )
              })
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

  // Multi-day selection in Create mode, single day in Edit mode
  const [selectedDays, setSelectedDays] = useState(['Monday'])
  const [form, setForm] = useState({ 
    doctor_id: '', 
    hospital_id: '', 
    day: 'Monday', 
    start_time: '17:00', 
    end_time: '21:00', 
    fee: '500' 
  })
  
  const [doctors, setDoctors] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverFeedback, setServerFeedback] = useState(null)
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

      setDoctors(Array.isArray(docData) ? docData.map(d => ({ 
        ...d, 
        subtext: [d.specialty?.name, d.bmdc ? `BMDC: ${d.bmdc}` : null].filter(Boolean).join(' • ') 
      })) : [])
      
      setHospitals(Array.isArray(hospData) ? hospData.map(h => ({ 
        ...h, 
        subtext: [h.district?.name, h.upazila?.name, h.address].filter(Boolean).join(', ') 
      })) : [])

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
        day: d.day || 'Monday',
        start_time: d.start_time ? d.start_time.substring(0, 5) : '17:00',
        end_time: d.end_time ? d.end_time.substring(0, 5) : '21:00',
        fee: d.fee || '500'
      })
      if (d.day) {
        setSelectedDays([d.day])
      }
    } catch (err) {
      console.error('Failed to load chamber:', err)
    } finally {
      setLoading(false)
    }
  }

  // Toggle day selection (multi-select for Create, single-select for Edit)
  const toggleDay = (dayId) => {
    setErrors(prev => ({ ...prev, days: '', day: '' }))
    if (isEdit) {
      setForm(prev => ({ ...prev, day: dayId }))
      setSelectedDays([dayId])
      return
    }

    if (selectedDays.includes(dayId)) {
      if (selectedDays.length === 1) {
        // Keep at least one or allow unselect
        setSelectedDays([])
      } else {
        setSelectedDays(selectedDays.filter(d => d !== dayId))
      }
    } else {
      setSelectedDays([...selectedDays, dayId])
    }
  }

  // Quick Preset Handlers
  const selectPreset = (preset) => {
    setErrors(prev => ({ ...prev, days: '', day: '' }))
    if (preset === 'all') {
      setSelectedDays(DAYS.map(d => d.id))
    } else if (preset === 'weekdays') {
      setSelectedDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
    } else if (preset === 'bd_weekdays') {
      setSelectedDays(['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'])
    } else if (preset === 'weekend') {
      setSelectedDays(['Friday', 'Saturday'])
    } else if (preset === 'clear') {
      setSelectedDays([])
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.doctor_id) errs.doctor_id = 'Please select a practitioner/doctor'
    if (!form.hospital_id) errs.hospital_id = 'Please select a hospital/clinical facility'
    
    if (isEdit) {
      if (!form.day) errs.day = 'Please select a visiting day'
    } else {
      if (!selectedDays || selectedDays.length === 0) {
        errs.days = 'Please select at least one visiting day'
      }
    }

    if (!form.start_time) errs.start_time = 'Starting time is required'
    if (!form.end_time) errs.end_time = 'Ending time is required'
    if (form.fee === '' || Number(form.fee) < 0) errs.fee = 'Please enter a valid consultation fee'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerFeedback(null)
    if (!validate()) return
    setSaving(true)

    try {
      if (isEdit) {
        // Single update
        await updateChamber(id, {
          doctor_id: form.doctor_id,
          hospital_id: form.hospital_id,
          day: form.day,
          start_time: form.start_time,
          end_time: form.end_time,
          fee: form.fee
        })
        navigate('/admin/chambers')
      } else {
        // Multi-day create: Create a chamber entry for each selected day
        const results = await Promise.allSettled(
          selectedDays.map(day => createChamber({
            doctor_id: form.doctor_id,
            hospital_id: form.hospital_id,
            day: day,
            start_time: form.start_time,
            end_time: form.end_time,
            fee: form.fee
          }))
        )

        const succeeded = results.filter(r => r.status === 'fulfilled')
        const failed = results.filter(r => r.status === 'rejected')

        if (failed.length === 0) {
          // All succeeded
          navigate('/admin/chambers')
        } else if (succeeded.length > 0) {
          // Partial success
          const failedDays = selectedDays.filter((_, idx) => results[idx].status === 'rejected')
          setServerFeedback({
            type: 'warning',
            message: `Created schedule for ${succeeded.length} day(s). Some days (${failedDays.join(', ')}) could not be added because a chamber schedule for this doctor and hospital already exists on those days.`
          })
          // Keep only failed days selected so user can see
          setSelectedDays(failedDays)
        } else {
          // All failed
          const firstErr = results[0]?.reason
          setServerFeedback({
            type: 'error',
            message: getErrorMessage(firstErr, 'Failed to create chamber schedules. The doctor may already be scheduled at this hospital on these days.')
          })
        }
      }
    } catch (err) {
      setServerFeedback({
        type: 'error',
        message: getErrorMessage(err, 'An error occurred while saving the chamber.')
      })
    } finally {
      setSaving(false)
    }
  }

  const selectedDoctorObj = doctors.find(d => String(d.id) === String(form.doctor_id))
  const selectedHospitalObj = hospitals.find(h => String(h.id) === String(form.hospital_id))
  const durationText = calculateDuration(form.start_time, form.end_time)

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--admin-text-muted, #64748b)' }}>
        <div className="admin-spinner" style={{ margin: '0 auto 16px' }} />
        <h4 style={{ fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>Loading Chamber Schedule...</h4>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', paddingBottom: 60 }}>
      {/* ── Page Header ── */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        marginBottom: 24, flexWrap: 'wrap', gap: 16 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ 
            width: 48, height: 48, borderRadius: 16, 
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)'
          }}>
            <Calendar size={24} />
          </div>
          <div>
            <h1 style={{ 
              fontSize: 22, fontWeight: 800, color: 'var(--admin-text, #0f172a)', 
              letterSpacing: '-0.5px', margin: 0 
            }}>
              {isEdit ? 'Edit Chamber Schedule' : 'Add Clinical Chamber'}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--admin-text-muted, #64748b)', margin: '4px 0 0' }}>
              {isEdit 
                ? 'Update doctor visiting hours and consultation fee'
                : 'Select one or multiple days to schedule doctor availability at a hospital'}
            </p>
          </div>
        </div>

        <Link 
          to="/admin/chambers" 
          style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 10,
            border: '1.5px solid var(--admin-border, #e2e8f0)',
            background: 'var(--admin-card-bg, #ffffff)',
            color: 'var(--admin-text, #334155)',
            fontSize: 13, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.15s'
          }}
        >
          <ArrowLeft size={15} /> Back to Chambers
        </Link>
      </div>

      {/* ── Server Alert / Feedback ── */}
      {serverFeedback && (
        <div style={{ 
          padding: '14px 18px', borderRadius: 12, marginBottom: 20,
          background: serverFeedback.type === 'error' ? '#fef2f2' : '#fffbeb',
          border: `1.5px solid ${serverFeedback.type === 'error' ? '#fecaca' : '#fde68a'}`,
          color: serverFeedback.type === 'error' ? '#991b1b' : '#92400e',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 13.5, lineHeight: 1.5, fontWeight: 600 }}>
              {serverFeedback.message}
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setServerFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 2 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Main Form Card ── */}
      <form onSubmit={handleSubmit}>
        <div style={{ 
          background: 'var(--admin-card-bg, #ffffff)', 
          border: '1.5px solid var(--admin-border, #e2e8f0)',
          borderRadius: 20, 
          boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}>

          {/* Section 1: Doctor & Hospital Assignment */}
          <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--admin-border, #f1f5f9)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <div style={{ 
                width: 28, height: 28, borderRadius: 8, 
                background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 
              }}>
                1
              </div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--admin-text, #0f172a)' }}>
                Practitioner & Location Details
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {/* Doctor Selection */}
              <div>
                {isDoctorOnly ? (
                  <div>
                    <label style={{ 
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 12, fontWeight: 700, color: 'var(--admin-text, #1e293b)', 
                      marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' 
                    }}>
                      <User size={14} color="#6366f1" /> Assigned Doctor
                    </label>
                    <div style={{ 
                      padding: '12px 16px', background: '#f5f3ff', borderRadius: 12, 
                      border: '1.5px solid #ddd6fe', display: 'flex', alignItems: 'center', gap: 12 
                    }}>
                      <div style={{ 
                        width: 38, height: 38, borderRadius: 10, background: '#6366f1', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 
                      }}>
                        👨‍⚕️
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#4338ca', fontSize: 14 }}>
                          {myDoctorProfile?.name || user?.name}
                        </div>
                        <div style={{ fontSize: 11, color: '#6366f1', marginTop: 2 }}>
                          {myDoctorProfile?.specialty?.name || 'Your Doctor Profile'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <SearchableSelect 
                    label="Assign Doctor *" 
                    icon={<User size={14} color="#6366f1" />}
                    placeholder="Search doctor by name, specialty, BMDC..." 
                    options={doctors} 
                    value={form.doctor_id} 
                    onChange={val => { setForm({ ...form, doctor_id: val }); setErrors({ ...errors, doctor_id: '' }) }} 
                    error={errors.doctor_id}
                  />
                )}
              </div>

              {/* Hospital Selection */}
              <div>
                <SearchableSelect 
                  label="Select Hospital / Facility *" 
                  icon={<Building2 size={14} color="#6366f1" />}
                  placeholder="Search hospital by name or area..." 
                  options={hospitals} 
                  value={form.hospital_id} 
                  onChange={val => { setForm({ ...form, hospital_id: val }); setErrors({ ...errors, hospital_id: '' }) }} 
                  error={errors.hospital_id}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Visiting Days Selection */}
          <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--admin-border, #f1f5f9)', background: 'rgba(248, 250, 252, 0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ 
                  width: 28, height: 28, borderRadius: 8, 
                  background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 
                }}>
                  2
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--admin-text, #0f172a)' }}>
                    {isEdit ? 'Visiting Day' : 'Select Visiting Days'}
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--admin-text-muted, #64748b)', marginTop: 2 }}>
                    {isEdit ? 'Select the active schedule day' : 'Choose one or multiple days to create schedule slots'}
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons (Create mode only) */}
              {!isEdit && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted, #94a3b8)', textTransform: 'uppercase', marginRight: 4 }}>
                    Presets:
                  </span>
                  <button
                    type="button"
                    onClick={() => selectPreset('all')}
                    style={{
                      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      border: '1px solid #c7d2fe', background: '#eef2ff', color: '#4338ca', cursor: 'pointer'
                    }}
                  >
                    All 7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPreset('bd_weekdays')}
                    style={{
                      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      border: '1px solid #d1fae5', background: '#ecfdf5', color: '#065f46', cursor: 'pointer'
                    }}
                  >
                    Sat – Thu
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPreset('weekdays')}
                    style={{
                      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      border: '1px solid var(--admin-border, #e2e8f0)', background: 'var(--admin-card-bg, #fff)', color: 'var(--admin-text, #334155)', cursor: 'pointer'
                    }}
                  >
                    Mon – Fri
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPreset('weekend')}
                    style={{
                      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      border: '1px solid var(--admin-border, #e2e8f0)', background: 'var(--admin-card-bg, #fff)', color: 'var(--admin-text, #334155)', cursor: 'pointer'
                    }}
                  >
                    Fri & Sat
                  </button>
                  {selectedDays.length > 0 && (
                    <button
                      type="button"
                      onClick={() => selectPreset('clear')}
                      style={{
                        padding: '4px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        border: '1px solid #fee2e2', background: '#fef2f2', color: '#dc2626', cursor: 'pointer'
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Interactive Day Pills */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))', 
              gap: 10, marginTop: 12 
            }}>
              {DAYS.map(d => {
                const isSelected = isEdit ? form.day === d.id : selectedDays.includes(d.id)
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    style={{
                      padding: '12px 10px', borderRadius: 14,
                      border: isSelected ? '2px solid #6366f1' : '1.5px solid var(--admin-border, #e2e8f0)',
                      background: isSelected 
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.08))' 
                        : 'var(--admin-card-bg, #ffffff)',
                      color: isSelected ? '#4338ca' : 'var(--admin-text, #334155)',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      boxShadow: isSelected ? '0 4px 12px rgba(99, 102, 241, 0.15)' : '0 1px 2px rgba(0,0,0,0.03)',
                      transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative'
                    }}
                  >
                    {isSelected && (
                      <div style={{ 
                        position: 'absolute', top: 6, right: 6, 
                        width: 16, height: 16, borderRadius: '50%', background: '#6366f1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' 
                      }}>
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                    <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px' }}>
                      {d.label}
                    </span>
                    <span style={{ 
                      fontSize: 10, fontWeight: 700, 
                      color: isSelected ? '#6366f1' : d.weekend ? '#f59e0b' : 'var(--admin-text-muted, #94a3b8)',
                      textTransform: 'uppercase'
                    }}>
                      {d.full}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Selected Days Summary Badge */}
            {!isEdit && selectedDays.length > 0 && (
              <div style={{ 
                marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, 
                padding: '6px 14px', borderRadius: 20, background: '#f5f3ff', border: '1px solid #ddd6fe' 
              }}>
                <Sparkles size={14} color="#6366f1" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#4338ca' }}>
                  {selectedDays.length} day{selectedDays.length > 1 ? 's' : ''} selected:
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6366f1' }}>
                  {selectedDays.join(', ')}
                </span>
              </div>
            )}

            {(errors.days || errors.day) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#ef4444', fontWeight: 600, marginTop: 10 }}>
                <AlertCircle size={13} /> {errors.days || errors.day}
              </div>
            )}
          </div>

          {/* Section 3: Time Slot & Consultation Fee */}
          <div style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <div style={{ 
                width: 28, height: 28, borderRadius: 8, 
                background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 
              }}>
                3
              </div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--admin-text, #0f172a)' }}>
                Timing & Financial Configuration
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              
              {/* Start Time */}
              <div>
                <label style={{ 
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 700, color: 'var(--admin-text, #1e293b)', 
                  marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' 
                }}>
                  <Clock size={14} color="#6366f1" /> Starting Time *
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="time" 
                    value={form.start_time} 
                    onChange={e => { setForm({ ...form, start_time: e.target.value }); setErrors({ ...errors, start_time: '' }) }}
                    style={{ 
                      width: '100%', height: 48, padding: '0 16px', borderRadius: 12, 
                      border: errors.start_time ? '1.5px solid #ef4444' : '1.5px solid var(--admin-border, #e2e8f0)',
                      background: 'var(--admin-card-bg, #ffffff)', color: 'var(--admin-text, #0f172a)',
                      fontSize: 14, fontWeight: 700, outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748b)', marginTop: 4 }}>
                  Formatted: <strong>{format12Hour(form.start_time) || '—'}</strong>
                </div>
                {errors.start_time && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#ef4444', fontWeight: 600, marginTop: 4 }}>
                    <AlertCircle size={13} /> {errors.start_time}
                  </div>
                )}
              </div>

              {/* End Time */}
              <div>
                <label style={{ 
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 700, color: 'var(--admin-text, #1e293b)', 
                  marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' 
                }}>
                  <Clock size={14} color="#6366f1" /> Ending Time *
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="time" 
                    value={form.end_time} 
                    onChange={e => { setForm({ ...form, end_time: e.target.value }); setErrors({ ...errors, end_time: '' }) }}
                    style={{ 
                      width: '100%', height: 48, padding: '0 16px', borderRadius: 12, 
                      border: errors.end_time ? '1.5px solid #ef4444' : '1.5px solid var(--admin-border, #e2e8f0)',
                      background: 'var(--admin-card-bg, #ffffff)', color: 'var(--admin-text, #0f172a)',
                      fontSize: 14, fontWeight: 700, outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748b)', marginTop: 4 }}>
                  Formatted: <strong>{format12Hour(form.end_time) || '—'}</strong>
                  {durationText && <span style={{ color: '#6366f1', marginLeft: 6 }}>({durationText})</span>}
                </div>
                {errors.end_time && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#ef4444', fontWeight: 600, marginTop: 4 }}>
                    <AlertCircle size={13} /> {errors.end_time}
                  </div>
                )}
              </div>

              {/* Consultation Fee */}
              <div>
                <label style={{ 
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 700, color: 'var(--admin-text, #1e293b)', 
                  marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' 
                }}>
                  <DollarSign size={14} color="#10b981" /> Consultation Fee (৳) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ 
                    position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', 
                    fontSize: 16, fontWeight: 800, color: '#10b981' 
                  }}>
                    ৳
                  </span>
                  <input 
                    type="number" 
                    min="0"
                    step="10"
                    placeholder="e.g. 500" 
                    value={form.fee} 
                    onChange={e => { setForm({ ...form, fee: e.target.value }); setErrors({ ...errors, fee: '' }) }}
                    style={{ 
                      width: '100%', height: 48, paddingLeft: 36, paddingRight: 16, borderRadius: 12, 
                      border: errors.fee ? '1.5px solid #ef4444' : '1.5px solid var(--admin-border, #e2e8f0)',
                      background: 'var(--admin-card-bg, #ffffff)', color: '#0f172a',
                      fontSize: 15, fontWeight: 700, outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748b)', marginTop: 4 }}>
                  Standard patient appointment fee
                </div>
                {errors.fee && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#ef4444', fontWeight: 600, marginTop: 4 }}>
                    <AlertCircle size={13} /> {errors.fee}
                  </div>
                )}
              </div>

            </div>

            {/* Live Schedule Preview Card */}
            {(selectedDoctorObj || selectedHospitalObj) && (
              <div style={{ 
                marginTop: 24, padding: '16px 20px', borderRadius: 14, 
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(16, 185, 129, 0.05))',
                border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 36, height: 36, borderRadius: 10, background: '#6366f1', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>
                      {selectedDoctorObj?.name || 'Doctor'} @ {selectedHospitalObj?.name || 'Hospital'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--admin-text-muted, #64748b)', marginTop: 2 }}>
                      🗓️ {isEdit ? form.day : (selectedDays.join(', ') || 'No days selected')} • 
                      ⏰ {format12Hour(form.start_time)} – {format12Hour(form.end_time)} • 
                      💰 ৳{form.fee || 0}
                    </div>
                  </div>
                </div>

                {!isEdit && selectedDays.length > 1 && (
                  <div style={{ 
                    fontSize: 12, fontWeight: 700, color: '#6366f1', 
                    padding: '4px 10px', borderRadius: 20, background: '#ffffff',
                    border: '1px solid #c7d2fe'
                  }}>
                    Will create {selectedDays.length} schedule entries
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Actions Footer */}
          <div style={{ 
            padding: '20px 28px', background: 'var(--admin-bg, #f8fafc)', 
            borderTop: '1.5px solid var(--admin-border, #e2e8f0)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12
          }}>
            <Link 
              to="/admin/chambers"
              style={{ 
                padding: '12px 24px', borderRadius: 12,
                border: '1.5px solid var(--admin-border, #cbd5e1)',
                background: 'var(--admin-card-bg, #ffffff)', color: 'var(--admin-text, #475569)',
                fontWeight: 700, fontSize: 14, textDecoration: 'none',
                transition: 'all 0.15s'
              }}
            >
              Cancel
            </Link>

            <button 
              type="submit" 
              disabled={saving}
              style={{ 
                padding: '13px 36px', borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#ffffff', fontWeight: 800, fontSize: 14,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {saving ? (
                <>
                  <div className="admin-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Saving Schedules...
                </>
              ) : isEdit ? (
                '💾 Update Schedule'
              ) : (
                <>
                  <Sparkles size={16} />
                  {selectedDays.length > 1 
                    ? `Publish ${selectedDays.length} Chamber Schedules`
                    : 'Publish Chamber Schedule'}
                </>
              )}
            </button>
          </div>

        </div>
      </form>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInSlide {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  )
}

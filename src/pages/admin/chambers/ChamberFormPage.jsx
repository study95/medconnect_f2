// ChamberFormPage.jsx — Modern & Premium Healthcare Chamber Create/Edit Form
import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { 
  Calendar, Clock, Building2, User, DollarSign, Check, 
  ArrowLeft, Sparkles, AlertCircle, CheckCircle2, X,
  Stethoscope, MapPin, Layers, ShieldCheck, ChevronDown
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { toast } from 'react-hot-toast'
import { useDialog } from '../../../hooks/useDialog'
import { DIALOG_MESSAGES } from '../../../utils/dialogMessages'
import { getChamber, getDistricts, getUpazilas, getDivisions } from '../../../api/adminApi'
import { useAdminChamberLookups, useAdminChamberMutations } from '../../../features/chambers/useAdminChambers'
import { getErrorMessage } from '../../../utils/errorHelper'
import CompactUlid from '../../../components/common/CompactUlid'

const DAYS = [
  { id: 'Saturday', label: 'Sat', full: 'Saturday', bn: 'শনি', weekend: true },
  { id: 'Sunday', label: 'Sun', full: 'Sunday', bn: 'রবি' },
  { id: 'Monday', label: 'Mon', full: 'Monday', bn: 'সোম' },
  { id: 'Tuesday', label: 'Tue', full: 'Tuesday', bn: 'মঙ্গল' },
  { id: 'Wednesday', label: 'Wed', full: 'Wednesday', bn: 'বুধ' },
  { id: 'Thursday', label: 'Thu', full: 'Thursday', bn: 'বৃহস্পতি' },
  { id: 'Friday', label: 'Fri', full: 'Friday', bn: 'শুক্র', weekend: true },
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

// Premium Searchable Dropdown with Healthcare Styling
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

  const selectedOption = options.find(opt => {
    if (value === undefined || value === null || value === '') return false
    const valStr = String(value).trim().toLowerCase()
    const optIdStr = String(opt.id || '').trim().toLowerCase()
    const optPublicIdStr = String(opt.public_id || '').trim().toLowerCase()
    const optDoctorIdStr = String(opt.doctor_id || '').trim().toLowerCase()
    const optHospitalIdStr = String(opt.hospital_id || '').trim().toLowerCase()
    
    return (
      optIdStr === valStr ||
      (optPublicIdStr && optPublicIdStr === valStr) ||
      (optDoctorIdStr && optDoctorIdStr === valStr) ||
      (optHospitalIdStr && optHospitalIdStr === valStr)
    )
  })

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
        fontSize: 12.5, fontWeight: 700, color: 'var(--admin-text, #1e293b)', 
        marginBottom: 8, letterSpacing: '0.02em' 
      }}>
        {icon}
        {label}
      </label>

      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          cursor: disabled ? 'not-allowed' : 'pointer', 
          background: disabled ? 'var(--admin-bg, #f8fafc)' : '#ffffff', 
          minHeight: 48, padding: '10px 14px', borderRadius: 12, 
          border: error 
            ? '1.5px solid #ef4444' 
            : isOpen 
              ? '1.5px solid #00A88C' 
              : '1.5px solid var(--admin-border, #e2e8f0)',
          boxShadow: isOpen ? '0 0 0 3px rgba(0, 168, 140, 0.12)' : '0 1px 2px rgba(0, 0, 0, 0.03)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          {selectedOption ? (
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>
                {selectedOption.name}
              </div>
              {selectedOption.subtext && (
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                  {selectedOption.subtext}
                </div>
              )}
            </div>
          ) : (
            <span style={{ color: '#94a3b8', fontSize: 13.5 }}>{placeholder}</span>
          )}
        </div>
        <ChevronDown 
          size={16} 
          color="#64748b" 
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }} 
        />
      </div>

      {helperText && !error && (
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{helperText}</div>
      )}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#ef4444', fontWeight: 600, marginTop: 4 }}>
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {isOpen && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#ffffff', border: '1.5px solid #00A88C', 
          borderRadius: 14, marginTop: 6,
          boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.12)', overflow: 'hidden', zIndex: 1000,
          animation: 'fadeInSlide 0.15s ease-out'
        }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <input 
              ref={inputRef}
              type="text" 
              autoFocus
              placeholder="Type to search..." 
              style={{ 
                width: '100%', padding: '8px 12px', borderRadius: 8, 
                border: '1px solid #e2e8f0', outline: 'none', 
                fontSize: 13, background: '#ffffff',
                color: '#0f172a'
              }}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                No matching results found
              </div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = value.toString() === opt.id.toString()
                return (
                  <div 
                    key={opt.id} 
                    style={{ 
                      padding: '10px 14px', cursor: 'pointer', 
                      background: isSelected ? '#E6F7F4' : 'transparent',
                      borderBottom: '1px solid #f8fafc',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                    onClick={() => {
                      onChange(opt.id.toString())
                      setIsOpen(false)
                      setSearch('')
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: isSelected ? 700 : 600, color: isSelected ? '#008f77' : '#334155', fontSize: 13.5 }}>
                        {opt.name}
                      </div>
                      {opt.subtext && (
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          {opt.subtext}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check size={16} color="#00A88C" />}
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
  const { showSuccess } = useDialog()
  const isEdit = !!id
  const isDoctorOnly = !isAdmin && !isManager && isDoctor

  // Multi-day selection in Create mode, single day in Edit mode
  const [selectedDays, setSelectedDays] = useState(['Monday'])
  const [venueType, setVenueType] = useState('hospital') // 'hospital' | 'private'
  
  const [form, setForm] = useState({ 
    doctor_id: '', 
    hospital_id: '', 
    chamber_name: '',
    division_id: '',
    district_id: '',
    upazila_id: '',
    address: '',
    is_primary: false,
    display_order: '0',
    consultation_type: 'hospital',
    room_number: '',
    day: 'Monday', 
    start_time: '17:00', 
    end_time: '21:00', 
    fee: '500',
    slot_duration_minutes: '15'
  })
  
  const { doctors: lookupDoctors, hospitals: lookupHospitals } = useAdminChamberLookups()
  const { createChamber: saveNewChamber, updateChamber: saveUpdatedChamber } = useAdminChamberMutations()

  const [divisionsList, setDivisionsList] = useState([])
  const [districtsList, setDistrictsList] = useState([])
  const [upazilasList, setUpazilasList] = useState([])
  const [editDoctor, setEditDoctor] = useState(null)
  const [editHospital, setEditHospital] = useState(null)
  const [chamberData, setChamberData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverFeedback, setServerFeedback] = useState(null)
  const [myDoctorProfile, setMyDoctorProfile] = useState(null)

  // Load divisions and districts on mount
  useEffect(() => {
    getDivisions().then(res => {
      const data = res.data?.data?.data || res.data?.data || res.data || []
      setDivisionsList(Array.isArray(data) ? data : [])
    }).catch(() => {})

    getDistricts({ per_page: 200 }).then(res => {
      const data = res.data?.data?.data || res.data?.data || res.data || []
      setDistrictsList(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }, [])

  // Filter districts based on selected division
  const filteredDistricts = useMemo(() => {
    if (!form.division_id) return districtsList
    return districtsList.filter(d => String(d.division_id) === String(form.division_id))
  }, [districtsList, form.division_id])

  // Load upazilas when district changes
  useEffect(() => {
    if (form.district_id) {
      getUpazilas({ district_id: form.district_id, per_page: 200 }).then(res => {
        const data = res.data?.data?.data || res.data?.data || res.data || []
        setUpazilasList(Array.isArray(data) ? data : [])
      }).catch(() => setUpazilasList([]))
    } else {
      setUpazilasList([])
    }
  }, [form.district_id])

  const doctors = useMemo(() => {
    if (!editDoctor) return lookupDoctors
    const exists = lookupDoctors.some(d => String(d.id) === String(editDoctor.id) || (editDoctor.public_id && String(d.public_id) === String(editDoctor.public_id)))
    return exists ? lookupDoctors : [editDoctor, ...lookupDoctors]
  }, [lookupDoctors, editDoctor])

  const hospitals = useMemo(() => {
    if (!editHospital) return lookupHospitals
    const exists = lookupHospitals.some(h => String(h.id) === String(editHospital.id) || (editHospital.public_id && String(h.public_id) === String(editHospital.public_id)))
    return exists ? lookupHospitals : [editHospital, ...lookupHospitals]
  }, [lookupHospitals, editHospital])

  const hasAlertedRef = useRef(false)

  // Security Guard: Hospital managers have view-only access to chambers
  useEffect(() => {
    if (isManager && !isAdmin) {
      if (!hasAlertedRef.current) {
        hasAlertedRef.current = true
        toast.error('হসপিটাল ম্যানেজার চেম্বার তৈরি বা এডিট করতে পারেন না।', { id: 'chamber-manager-restricted' })
      }
      navigate('/admin/chambers', { replace: true })
    }
  }, [isManager, isAdmin, navigate])

  useEffect(() => {
    if (isDoctorOnly && !isEdit && lookupDoctors.length > 0) {
      const myDoc = lookupDoctors.find(d =>
        String(d.user_id) === String(user?.id) ||
        d.email?.toLowerCase() === user?.email?.toLowerCase()
      )
      if (myDoc && !form.doctor_id) {
        setMyDoctorProfile(myDoc)
        setForm(prev => ({ ...prev, doctor_id: String(myDoc.public_id || myDoc.id) }))
      }
    }
  }, [isDoctorOnly, isEdit, lookupDoctors, user])

  useEffect(() => { if (isEdit) loadItem() }, [id])

  const loadItem = async () => {
    setLoading(true)
    try {
      const res = await getChamber(id)
      const d = res.data?.data || res.data
      if (!d) throw new Error('Chamber not found')
      setChamberData(d)

      const docIdentifier = String(d.doctor?.public_id || d.doctor_id || d.doctor?.id || '')
      const hospIdentifier = String(d.hospital?.public_id || d.hospital_id || d.hospital?.id || '')

      if (d.doctor) {
        setEditDoctor({
          ...d.doctor,
          id: String(d.doctor.public_id || d.doctor.id),
          public_id: d.doctor.public_id,
          doctor_id: d.doctor.id,
          name: d.doctor.name,
          subtext: [d.doctor.specialty?.name, d.doctor.bmdc ? `BMDC: ${d.doctor.bmdc}` : null].filter(Boolean).join(' • ')
        })
      }

      if (d.hospital) {
        setEditHospital({
          ...d.hospital,
          id: String(d.hospital.public_id || d.hospital.id),
          public_id: d.hospital.public_id,
          hospital_id: d.hospital.id,
          name: d.hospital.name,
          subtext: [d.hospital.district?.name, d.hospital.upazila?.name, d.hospital.address].filter(Boolean).join(', ')
        })
        setVenueType('hospital')
      } else {
        setVenueType('private')
      }

      setForm({
        doctor_id: docIdentifier,
        hospital_id: hospIdentifier,
        chamber_name: d.chamber_name || '',
        division_id: d.division_id ? String(d.division_id) : (d.division?.id ? String(d.division.id) : (d.district?.division_id ? String(d.district.division_id) : '')),
        district_id: d.district_id ? String(d.district_id) : (d.district?.id ? String(d.district.id) : ''),
        upazila_id: d.upazila_id ? String(d.upazila_id) : (d.upazila?.id ? String(d.upazila.id) : ''),
        address: d.address || '',
        is_primary: Boolean(d.is_primary),
        display_order: String(d.display_order ?? '0'),
        consultation_type: d.consultation_type || (hospIdentifier ? 'hospital' : 'physical'),
        room_number: d.room_number || '',
        day: d.day || 'Monday',
        start_time: d.start_time ? d.start_time.substring(0, 5) : '17:00',
        end_time: d.end_time ? d.end_time.substring(0, 5) : '21:00',
        fee: d.fee || '500',
        slot_duration_minutes: d.slot_duration_minutes ? String(d.slot_duration_minutes) : '15'
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
    
    // If private venue selected, validate chamber details
    if (venueType === 'private' || !form.hospital_id) {
      if (!form.chamber_name || !form.chamber_name.trim()) errs.chamber_name = 'Please provide a chamber or clinic name'
      if (!form.district_id) errs.district_id = 'Please select a district'
      if (!form.address || !form.address.trim()) errs.address = 'Please provide chamber address'
    }
    
    if (form.room_number && form.room_number.length > 50) {
      errs.room_number = 'Room number must not exceed 50 characters.'
    }

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

    const isHospitalMode = venueType === 'hospital' && Boolean(form.hospital_id)
    const selectedDist = districtsList.find(d => String(d.id) === String(form.district_id))
    const resolvedDivisionId = form.division_id 
      ? Number(form.division_id) 
      : (selectedDist?.division_id ? Number(selectedDist.division_id) : null)

    const payloadBase = {
      doctor_id: form.doctor_id,
      hospital_id: isHospitalMode ? form.hospital_id : null,
      chamber_name: isHospitalMode ? null : (form.chamber_name ? form.chamber_name.trim() : null),
      division_id: isHospitalMode ? null : resolvedDivisionId,
      district_id: isHospitalMode ? null : (form.district_id ? Number(form.district_id) : null),
      upazila_id: isHospitalMode ? null : (form.upazila_id ? Number(form.upazila_id) : null),
      address: isHospitalMode ? null : (form.address ? form.address.trim() : null),
      is_primary: Boolean(form.is_primary),
      display_order: Number(form.display_order) || 0,
      consultation_type: isHospitalMode ? 'hospital' : 'physical',
      room_number: form.room_number ? form.room_number.trim() : null,
      start_time: form.start_time,
      end_time: form.end_time,
      fee: form.fee,
      slot_duration_minutes: Number(form.slot_duration_minutes) || 15
    }

    try {
      if (isEdit) {
        await saveUpdatedChamber({
          id: chamberData?.public_id || id,
          data: {
            ...payloadBase,
            day: form.day
          }
        })
        showSuccess({
          title: DIALOG_MESSAGES.UPDATE_SUCCESS.title,
          message: 'চেম্বার শিডিউল সফলভাবে হালনাগাদ করা হয়েছে।',
        })
        setTimeout(() => navigate('/admin/chambers'), 700)
      } else {
        await saveNewChamber({
          ...payloadBase,
          days: selectedDays
        })

        showSuccess({
          title: DIALOG_MESSAGES.SAVE_SUCCESS.title,
          message: `${selectedDays.length}টি দিনের চেম্বার শিডিউল সফলভাবে তৈরি করা হয়েছে।`,
        })
        setTimeout(() => navigate('/admin/chambers'), 700)
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

  const selectedDoctorObj = doctors.find(d => 
    String(d.id) === String(form.doctor_id) || 
    (d.public_id && String(d.public_id) === String(form.doctor_id)) ||
    (d.doctor_id && String(d.doctor_id) === String(form.doctor_id))
  )
  const selectedHospitalObj = hospitals.find(h => 
    String(h.id) === String(form.hospital_id) || 
    (h.public_id && String(h.public_id) === String(form.hospital_id)) ||
    (h.hospital_id && String(h.hospital_id) === String(form.hospital_id))
  )
  const durationText = calculateDuration(form.start_time, form.end_time)
  const estimatedCapacity = useMemo(() => {
    if (!form.start_time || !form.end_time) return 0
    const [h1, m1] = form.start_time.split(':').map(Number)
    const [hEnd, mEnd] = form.end_time.split(':').map(Number)
    if (isNaN(h1) || isNaN(hEnd)) return 0
    let totalMin = (hEnd * 60 + mEnd) - (h1 * 60 + m1)
    if (totalMin <= 0) totalMin += 24 * 60
    const slot = Number(form.slot_duration_minutes) || 15
    return Math.floor(totalMin / Math.max(1, slot))
  }, [form.start_time, form.end_time, form.slot_duration_minutes])

  if (isManager && !isAdmin) {
    return null
  }

  if (loading) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: '#64748b' }}>
        <div className="admin-spinner" style={{ margin: '0 auto 16px', borderColor: '#00A88C transparent #00A88C transparent' }} />
        <h4 style={{ fontWeight: 700, color: '#0f172a' }}>Loading Chamber Schedule...</h4>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 940, margin: '0 auto', paddingBottom: 60 }}>
      {/* ── Page Header ── */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        marginBottom: 24, flexWrap: 'wrap', gap: 16 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ 
            width: 48, height: 48, borderRadius: 16, 
            background: 'linear-gradient(135deg, #00A88C, #00B875)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', boxShadow: '0 8px 20px rgba(0, 168, 140, 0.25)'
          }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ 
                fontSize: 21, fontWeight: 800, color: '#0f172a', 
                letterSpacing: '-0.4px', margin: 0 
              }}>
                {isEdit ? 'Edit Chamber Schedule' : 'Create Clinical Chamber'}
              </h1>
              {isEdit && (chamberData?.public_id || id) && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 10px',
                  borderRadius: 8,
                  background: '#E6F7F4',
                  border: '1px solid #B2E5DC',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#008f77'
                }}>
                  ID: <CompactUlid value={chamberData?.public_id || id} />
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              {isEdit 
                ? 'Update doctor visiting hours, practice venue and consultation fee'
                : 'Configure doctor practice venue, multi-day availability slots and consultation fee'}
            </p>
          </div>
        </div>

        <Link 
          to="/admin/chambers" 
          style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 10,
            border: '1.5px solid var(--admin-border, #e2e8f0)',
            background: '#ffffff',
            color: '#334155',
            fontSize: 13, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'all 0.15s'
          }}
        >
          <ArrowLeft size={15} /> Back to Chambers
        </Link>
      </div>

      {/* ── Server Alert / Feedback ── */}
      {serverFeedback && (
        <div style={{ 
          padding: '14px 18px', borderRadius: 14, marginBottom: 20,
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

      {/* ── Main Form ── */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ════ CARD 1: Practitioner & Venue Setup ════ */}
        <div style={{ 
          background: '#ffffff', 
          border: '1.5px solid #e2e8f0',
          borderRadius: 20, 
          boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.04)',
          position: 'relative',
          zIndex: 30
        }}>
          {/* Section Header */}
          <div style={{ 
            padding: '18px 24px', 
            background: 'linear-gradient(to right, #f8fafc, #ffffff)',
            borderBottom: '1px solid #f1f5f9',
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <div style={{ 
              width: 30, height: 30, borderRadius: 10, 
              background: '#E6F7F4', color: '#00A88C',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 
            }}>
              1
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                Practitioner & Practice Venue
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                Assign the doctor and configure either a hospital facility or private practice
              </p>
            </div>
          </div>

          <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Doctor Selection */}
            <div style={{ position: 'relative', zIndex: 25 }}>
              {isDoctorOnly ? (
                <div>
                  <label style={{ 
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 12.5, fontWeight: 700, color: '#1e293b', 
                    marginBottom: 8, letterSpacing: '0.02em' 
                  }}>
                    <User size={14} color="#00A88C" /> Assigned Doctor
                  </label>
                  <div style={{ 
                    padding: '12px 16px', background: '#F0FDF4', borderRadius: 12, 
                    border: '1.5px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: 12 
                  }}>
                    <div style={{ 
                      width: 40, height: 40, borderRadius: 10, background: '#00A88C', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 
                    }}>
                      👨‍⚕️
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                        {myDoctorProfile?.name || user?.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#008f77', marginTop: 1, fontWeight: 600 }}>
                        {myDoctorProfile?.specialty?.name || 'Your Doctor Profile'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <SearchableSelect 
                  label="Assign Doctor / Practitioner *" 
                  icon={<User size={14} color="#00A88C" />}
                  placeholder="Search doctor by name, specialty, BMDC..." 
                  options={doctors} 
                  value={form.doctor_id} 
                  onChange={val => { setForm({ ...form, doctor_id: val }); setErrors({ ...errors, doctor_id: '' }) }} 
                  error={errors.doctor_id}
                />
              )}
            </div>

            {/* Practice Type Toggle: Hospital vs Private Chamber */}
            <div style={{ position: 'relative', zIndex: 10 }}>
              <label style={{ 
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12.5, fontWeight: 700, color: '#1e293b', 
                marginBottom: 8, letterSpacing: '0.02em' 
              }}>
                <Stethoscope size={14} color="#00A88C" /> Practice Venue Type *
              </label>

              <div style={{ 
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                background: '#f8fafc', padding: 4, borderRadius: 14, border: '1px solid #e2e8f0'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setVenueType('hospital')
                    setErrors(prev => ({ ...prev, chamber_name: '', district_id: '', address: '' }))
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '11px 16px', borderRadius: 10, border: 'none',
                    background: venueType === 'hospital' ? '#ffffff' : 'transparent',
                    color: venueType === 'hospital' ? '#008f77' : '#64748b',
                    fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
                    boxShadow: venueType === 'hospital' ? '0 2px 8px rgba(0, 0, 0, 0.06)' : 'none',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <Building2 size={16} />
                  <span>Hospital / Medical Center</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVenueType('private')
                    setForm(prev => ({ ...prev, hospital_id: '' }))
                    setErrors(prev => ({ ...prev, hospital_id: '' }))
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '11px 16px', borderRadius: 10, border: 'none',
                    background: venueType === 'private' ? '#ffffff' : 'transparent',
                    color: venueType === 'private' ? '#008f77' : '#64748b',
                    fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
                    boxShadow: venueType === 'private' ? '0 2px 8px rgba(0, 0, 0, 0.06)' : 'none',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <Stethoscope size={16} />
                  <span>Private Chamber (ব্যক্তিগত চেম্বার)</span>
                </button>
              </div>
            </div>

            {/* Venue Specific Inputs */}
            {venueType === 'hospital' ? (
              <div style={{ animation: 'fadeInSlide 0.2s ease-out', position: 'relative', zIndex: 20 }}>
                <SearchableSelect 
                  label="Select Hospital / Clinic Facility *" 
                  icon={<Building2 size={14} color="#00A88C" />}
                  placeholder="Search hospital by name or location..." 
                  options={hospitals} 
                  value={form.hospital_id} 
                  onChange={val => { setForm({ ...form, hospital_id: val }); setErrors({ ...errors, hospital_id: '' }) }} 
                  error={errors.hospital_id}
                  helperText="Select the hospital or clinic where the doctor conducts this chamber"
                />
              </div>
            ) : (
              <div style={{ 
                animation: 'fadeInSlide 0.2s ease-out',
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: 16,
                padding: '18px 20px',
                display: 'flex', flexDirection: 'column', gap: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00A88C' }} />
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Private Practice Location Details
                  </span>
                </div>

                {/* Chamber Name */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                    Chamber / Practice Name *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Dr. Rahman's Specialized Clinic" 
                    value={form.chamber_name}
                    onChange={e => { setForm({ ...form, chamber_name: e.target.value }); setErrors({ ...errors, chamber_name: '' }) }}
                    style={{ 
                      width: '100%', height: 46, padding: '0 14px', borderRadius: 10, 
                      border: errors.chamber_name ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1', 
                      outline: 'none', background: '#ffffff', fontSize: 13.5, color: '#0f172a'
                    }}
                  />
                  {errors.chamber_name && <div style={{ fontSize: 11.5, color: '#ef4444', marginTop: 4, fontWeight: 600 }}>{errors.chamber_name}</div>}
                </div>

                {/* Cascading Location Hierarchy */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                  {/* Division */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                      Division (বিভাগ)
                    </label>
                    <select
                      value={form.division_id}
                      onChange={e => {
                        const newDiv = e.target.value
                        setForm(prev => ({ ...prev, division_id: newDiv, district_id: '', upazila_id: '' }))
                        setErrors(prev => ({ ...prev, district_id: '' }))
                      }}
                      style={{ 
                        width: '100%', height: 46, padding: '0 12px', borderRadius: 10, 
                        border: '1.5px solid #cbd5e1', outline: 'none', background: '#ffffff',
                        fontSize: 13, color: '#0f172a'
                      }}
                    >
                      <option value="">-- All Divisions (সব বিভাগ) --</option>
                      {divisionsList.map(div => (
                        <option key={div.id} value={div.id}>
                          {div.name} {div.bangla_name ? `(${div.bangla_name})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* District */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                      District (জেলা) *
                    </label>
                    <select
                      value={form.district_id}
                      onChange={e => {
                        const distId = e.target.value
                        const matched = districtsList.find(d => String(d.id) === String(distId))
                        setForm(prev => ({
                          ...prev,
                          district_id: distId,
                          upazila_id: '',
                          division_id: (matched?.division_id ? String(matched.division_id) : prev.division_id)
                        }))
                        setErrors(prev => ({ ...prev, district_id: '' }))
                      }}
                      style={{ 
                        width: '100%', height: 46, padding: '0 12px', borderRadius: 10, 
                        border: errors.district_id ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1', 
                        outline: 'none', background: '#ffffff', fontSize: 13, color: '#0f172a'
                      }}
                    >
                      <option value="">
                        {form.division_id 
                          ? `-- Select District (${filteredDistricts.length} available) --` 
                          : '-- Select District (বা বিভাগ বেছে নিন) --'
                        }
                      </option>
                      {filteredDistricts.map(d => (
                        <option key={d.id} value={d.id}>{d.name} {d.bangla_name ? `(${d.bangla_name})` : ''}</option>
                      ))}
                    </select>
                    {errors.district_id && <div style={{ fontSize: 11.5, color: '#ef4444', marginTop: 4, fontWeight: 600 }}>{errors.district_id}</div>}
                  </div>

                  {/* Upazila */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                      Upazila / Area (উপজেলা - Optional)
                    </label>
                    <select
                      value={form.upazila_id}
                      onChange={e => setForm(prev => ({ ...prev, upazila_id: e.target.value }))}
                      disabled={!form.district_id}
                      style={{ 
                        width: '100%', height: 46, padding: '0 12px', borderRadius: 10, 
                        border: '1.5px solid #cbd5e1', outline: 'none', 
                        background: form.district_id ? '#ffffff' : '#f1f5f9',
                        fontSize: 13, color: '#0f172a'
                      }}
                    >
                      <option value="">-- Select Upazila --</option>
                      {upazilasList.map(u => (
                        <option key={u.id} value={u.id}>{u.name} {u.bangla_name ? `(${u.bangla_name})` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Full Address */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                    Full Physical Address *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. House 14, Road 5, Block B, Mirpur 12" 
                    value={form.address}
                    onChange={e => { setForm({ ...form, address: e.target.value }); setErrors({ ...errors, address: '' }) }}
                    style={{ 
                      width: '100%', height: 46, padding: '0 14px', borderRadius: 10, 
                      border: errors.address ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1', 
                      outline: 'none', background: '#ffffff', fontSize: 13.5, color: '#0f172a'
                    }}
                  />
                  {errors.address && <div style={{ fontSize: 11.5, color: '#ef4444', marginTop: 4, fontWeight: 600 }}>{errors.address}</div>}
                </div>
              </div>
            )}

            {/* Room Number & Primary Chamber Flags */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {/* Room Number */}
              <div>
                <label style={{ 
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12.5, fontWeight: 700, color: '#1e293b', 
                  marginBottom: 8, letterSpacing: '0.02em' 
                }}>
                  <Building2 size={14} color="#00A88C" /> Room / Counter / Cabin (Optional)
                </label>
                <input 
                  type="text" 
                  maxLength={50}
                  placeholder="e.g. Room 302, Cabin-4, Counter 1" 
                  value={form.room_number || ''} 
                  onChange={e => { 
                    const val = e.target.value;
                    setForm({ ...form, room_number: val });
                    if (val.length > 50) {
                      setErrors({ ...errors, room_number: 'Room number must not exceed 50 characters.' });
                    } else {
                      setErrors({ ...errors, room_number: '' });
                    }
                  }}
                  style={{ 
                    width: '100%', height: 46, padding: '0 14px', borderRadius: 10, 
                    border: errors.room_number ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                    background: '#ffffff', color: '#0f172a',
                    fontSize: 13.5, fontWeight: 500, outline: 'none'
                  }}
                />
              </div>

              {/* Primary Chamber Switch Card */}
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', 
                background: form.is_primary ? '#E6F7F4' : '#f8fafc', 
                borderRadius: 12, border: form.is_primary ? '1.5px solid #00A88C' : '1.5px solid #e2e8f0',
                cursor: 'pointer', transition: 'all 0.15s ease'
              }}
              onClick={() => setForm({ ...form, is_primary: !form.is_primary })}
              >
                <input 
                  type="checkbox" 
                  id="is_primary"
                  checked={form.is_primary}
                  onChange={e => setForm({ ...form, is_primary: e.target.checked })}
                  onClick={e => e.stopPropagation()}
                  style={{ width: 18, height: 18, accentColor: '#00A88C', cursor: 'pointer' }}
                />
                <label htmlFor="is_primary" style={{ cursor: 'pointer', margin: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: form.is_primary ? '#008f77' : '#1e293b' }}>
                    Primary Chamber ⭐
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                    Default location displayed on doctor profile & search
                  </div>
                </label>
              </div>
            </div>

          </div>
        </div>

        {/* ════ CARD 2: Visiting Days Schedule ════ */}
        <div style={{ 
          background: '#ffffff', 
          border: '1.5px solid #e2e8f0',
          borderRadius: 20, 
          boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.04)',
          position: 'relative',
          zIndex: 20
        }}>
          {/* Section Header */}
          <div style={{ 
            padding: '18px 24px', 
            background: 'linear-gradient(to right, #f8fafc, #ffffff)',
            borderBottom: '1px solid #f1f5f9',
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ 
                width: 30, height: 30, borderRadius: 10, 
                background: '#E6F7F4', color: '#00A88C',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 
              }}>
                2
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                  {isEdit ? 'Active Visiting Day' : 'Select Visiting Days'}
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                  {isEdit ? 'Select the active schedule day' : 'Choose one or multiple days to batch-create schedules'}
                </p>
              </div>
            </div>

            {/* Presets (Create Mode) */}
            {!isEdit && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Presets:
                </span>
                <button
                  type="button"
                  onClick={() => selectPreset('all')}
                  style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 700,
                    border: '1px solid #B2E5DC', background: '#E6F7F4', color: '#008f77', cursor: 'pointer'
                  }}
                >
                  All 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => selectPreset('bd_weekdays')}
                  style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 700,
                    border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#166534', cursor: 'pointer'
                  }}
                >
                  Sat – Thu (BD)
                </button>
                <button
                  type="button"
                  onClick={() => selectPreset('weekdays')}
                  style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 700,
                    border: '1px solid #e2e8f0', background: '#ffffff', color: '#475569', cursor: 'pointer'
                  }}
                >
                  Mon – Fri
                </button>
                <button
                  type="button"
                  onClick={() => selectPreset('weekend')}
                  style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 700,
                    border: '1px solid #fed7aa', background: '#fff7ed', color: '#c2410c', cursor: 'pointer'
                  }}
                >
                  Fri & Sat
                </button>
                {selectedDays.length > 0 && (
                  <button
                    type="button"
                    onClick={() => selectPreset('clear')}
                    style={{
                      padding: '5px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700,
                      border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer'
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ padding: '22px 24px' }}>
            {/* Interactive Day Pills */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', 
              gap: 12 
            }}>
              {DAYS.map(d => {
                const isSelected = isEdit ? form.day === d.id : selectedDays.includes(d.id)
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    style={{
                      padding: '14px 10px', borderRadius: 14,
                      border: isSelected ? '2px solid #00A88C' : '1.5px solid #e2e8f0',
                      background: isSelected ? '#E6F7F4' : '#ffffff',
                      color: isSelected ? '#008f77' : '#334155',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      boxShadow: isSelected ? '0 4px 14px rgba(0, 168, 140, 0.15)' : '0 1px 2px rgba(0,0,0,0.02)',
                      transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative'
                    }}
                  >
                    {isSelected && (
                      <div style={{ 
                        position: 'absolute', top: 6, right: 6, 
                        width: 16, height: 16, borderRadius: '50%', background: '#00A88C',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' 
                      }}>
                        <Check size={11} strokeWidth={3} />
                      </div>
                    )}
                    <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px' }}>
                      {d.label}
                    </span>
                    <span style={{ 
                      fontSize: 10.5, fontWeight: 700, 
                      color: isSelected ? '#008f77' : d.weekend ? '#f59e0b' : '#94a3b8',
                      textTransform: 'uppercase'
                    }}>
                      {d.full}
                    </span>
                    <span style={{ fontSize: 11, color: isSelected ? '#00A88C' : '#94a3b8' }}>
                      ({d.bn})
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Selected Days Summary Badge */}
            {!isEdit && selectedDays.length > 0 && (
              <div style={{ 
                marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, 
                padding: '7px 16px', borderRadius: 20, background: '#F0FDF4', border: '1px solid #BBF7D0' 
              }}>
                <Sparkles size={14} color="#00A88C" />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#166534' }}>
                  {selectedDays.length} day{selectedDays.length > 1 ? 's' : ''} selected:
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#008f77' }}>
                  {selectedDays.join(', ')}
                </span>
              </div>
            )}

            {(errors.days || errors.day) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#ef4444', fontWeight: 600, marginTop: 12 }}>
                <AlertCircle size={13} /> {errors.days || errors.day}
              </div>
            )}
          </div>
        </div>

        {/* ════ CARD 3: Shift Timing & Financial Configuration ════ */}
        <div style={{ 
          background: '#ffffff', 
          border: '1.5px solid #e2e8f0',
          borderRadius: 20, 
          boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.04)',
          position: 'relative',
          zIndex: 10
        }}>
          {/* Section Header */}
          <div style={{ 
            padding: '18px 24px', 
            background: 'linear-gradient(to right, #f8fafc, #ffffff)',
            borderBottom: '1px solid #f1f5f9',
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <div style={{ 
              width: 30, height: 30, borderRadius: 10, 
              background: '#E6F7F4', color: '#00A88C',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 
            }}>
              3
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                Shift Timing, Duration & Consultation Fee
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                Specify shift hours, appointment interval and consultation charges
              </p>
            </div>
          </div>

          <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18 }}>
              
              {/* Start Time */}
              <div>
                <label style={{ 
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12.5, fontWeight: 700, color: '#1e293b', 
                  marginBottom: 8, letterSpacing: '0.02em' 
                }}>
                  <Clock size={14} color="#00A88C" /> Starting Time *
                </label>
                <input 
                  type="time" 
                  value={form.start_time} 
                  onChange={e => { setForm({ ...form, start_time: e.target.value }); setErrors({ ...errors, start_time: '' }) }}
                  style={{ 
                    width: '100%', height: 46, padding: '0 14px', borderRadius: 10, 
                    border: errors.start_time ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                    background: '#ffffff', color: '#0f172a',
                    fontSize: 14, fontWeight: 700, outline: 'none'
                  }}
                />
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                  Time: <strong style={{ color: '#008f77' }}>{format12Hour(form.start_time) || '—'}</strong>
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
                  fontSize: 12.5, fontWeight: 700, color: '#1e293b', 
                  marginBottom: 8, letterSpacing: '0.02em' 
                }}>
                  <Clock size={14} color="#00A88C" /> Ending Time *
                </label>
                <input 
                  type="time" 
                  value={form.end_time} 
                  onChange={e => { setForm({ ...form, end_time: e.target.value }); setErrors({ ...errors, end_time: '' }) }}
                  style={{ 
                    width: '100%', height: 46, padding: '0 14px', borderRadius: 10, 
                    border: errors.end_time ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                    background: '#ffffff', color: '#0f172a',
                    fontSize: 14, fontWeight: 700, outline: 'none'
                  }}
                />
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                  Time: <strong style={{ color: '#008f77' }}>{format12Hour(form.end_time) || '—'}</strong>
                  {durationText && <span style={{ color: '#00A88C', marginLeft: 6, fontWeight: 600 }}>({durationText})</span>}
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
                  fontSize: 12.5, fontWeight: 700, color: '#1e293b', 
                  marginBottom: 8, letterSpacing: '0.02em' 
                }}>
                  <DollarSign size={14} color="#00A88C" /> Consultation Fee (৳) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ 
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', 
                    fontSize: 16, fontWeight: 800, color: '#00A88C' 
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
                      width: '100%', height: 46, paddingLeft: 34, paddingRight: 14, borderRadius: 10, 
                      border: errors.fee ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                      background: '#ffffff', color: '#0f172a',
                      fontSize: 14.5, fontWeight: 700, outline: 'none'
                    }}
                  />
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                  Appointment charge per patient
                </div>
                {errors.fee && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#ef4444', fontWeight: 600, marginTop: 4 }}>
                    <AlertCircle size={13} /> {errors.fee}
                  </div>
                )}
              </div>

              {/* Slot Duration */}
              <div>
                <label style={{ 
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12.5, fontWeight: 700, color: '#1e293b', 
                  marginBottom: 8, letterSpacing: '0.02em' 
                }}>
                  <Layers size={14} color="#00A88C" /> Slot Duration (Min) *
                </label>
                <select 
                  value={form.slot_duration_minutes || '15'} 
                  onChange={e => setForm({ ...form, slot_duration_minutes: e.target.value })}
                  style={{ 
                    width: '100%', height: 46, padding: '0 12px', borderRadius: 10, 
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff', color: '#0f172a',
                    fontSize: 13.5, fontWeight: 600, outline: 'none'
                  }}
                >
                  <option value="10">10 mins (Quick Consultation)</option>
                  <option value="15">15 mins (Standard)</option>
                  <option value="20">20 mins (Detailed)</option>
                  <option value="30">30 mins (Extended)</option>
                  <option value="45">45 mins (Specialist Procedure)</option>
                  <option value="60">60 mins (Comprehensive)</option>
                </select>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                  Est. capacity: <strong style={{ color: '#008f77' }}>~{estimatedCapacity} patients/day</strong>
                </div>
              </div>

            </div>

            {/* ── Real-Time Clinical Chamber Preview Card ── */}
            <div style={{ 
              marginTop: 10, 
              background: 'linear-gradient(135deg, #F8FAFC 0%, #F0FDF4 100%)', 
              border: '1.5px solid #B2E5DC', 
              borderRadius: 16, 
              padding: '18px 20px',
              display: 'flex', flexDirection: 'column', gap: 14
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ 
                    width: 38, height: 38, borderRadius: 10, 
                    background: '#00A88C', color: '#ffffff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    <Stethoscope size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                      {selectedDoctorObj?.name || 'Selected Doctor'}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
                      {venueType === 'hospital' 
                        ? (selectedHospitalObj?.name || 'Hospital Not Selected Yet') 
                        : (form.chamber_name || 'Private Practice Chamber')}
                      {form.room_number?.trim() ? ` • Room: ${form.room_number.trim()}` : ''}
                    </div>
                  </div>
                </div>

                {!isEdit && selectedDays.length > 1 && (
                  <span style={{ 
                    fontSize: 12, fontWeight: 700, color: '#008f77', 
                    padding: '4px 12px', borderRadius: 20, background: '#E6F7F4',
                    border: '1px solid #B2E5DC'
                  }}>
                    Batch: {selectedDays.length} schedules will be generated
                  </span>
                )}
              </div>

              {/* Preview Details Strip */}
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                paddingTop: 10, borderTop: '1px solid rgba(0, 168, 140, 0.15)'
              }}>
                <span style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 8, background: '#ffffff', border: '1px solid #e2e8f0',
                  fontSize: 12, fontWeight: 700, color: '#334155' 
                }}>
                  🗓️ {isEdit ? form.day : (selectedDays.join(', ') || 'No days selected')}
                </span>

                <span style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 8, background: '#ffffff', border: '1px solid #e2e8f0',
                  fontSize: 12, fontWeight: 700, color: '#334155' 
                }}>
                  ⏰ {format12Hour(form.start_time)} – {format12Hour(form.end_time)} {durationText ? `(${durationText})` : ''}
                </span>

                <span style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 8, background: '#E6F7F4', border: '1px solid #B2E5DC',
                  fontSize: 12, fontWeight: 800, color: '#008f77' 
                }}>
                  💰 ৳{form.fee || 0}
                </span>

                <span style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 8, background: '#ffffff', border: '1px solid #e2e8f0',
                  fontSize: 12, fontWeight: 600, color: '#64748b' 
                }}>
                  👥 ~{estimatedCapacity} capacity ({form.slot_duration_minutes || 15}m slots)
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ── Form Actions Footer ── */}
        <div style={{ 
          padding: '16px 24px', background: '#ffffff', 
          border: '1.5px solid #e2e8f0', borderRadius: 16,
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12
        }}>
          <Link 
            to="/admin/chambers"
            style={{ 
              padding: '11px 22px', borderRadius: 10,
              border: '1.5px solid #cbd5e1',
              background: '#ffffff', color: '#475569',
              fontWeight: 700, fontSize: 13.5, textDecoration: 'none',
              transition: 'all 0.15s'
            }}
          >
            Cancel
          </Link>

          <button 
            type="submit" 
            disabled={saving}
            style={{ 
              padding: '12px 32px', borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #00A88C 0%, #00B875 100%)',
              color: '#ffffff', fontWeight: 800, fontSize: 14,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(0, 168, 140, 0.35)',
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

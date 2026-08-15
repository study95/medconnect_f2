import { useState, useEffect } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../context/FavoritesContext'
import DoctorCard from '../components/common/DoctorCard'
import HospitalCard from '../components/common/HospitalCard'
import { getMyProfile, updateMyProfile } from '../api/authApi'
import { getAppointments } from '../api/appointmentApi'
import useLocations from '../hooks/useLocations'
import useSpecialties from '../hooks/useSpecialties'
import { calculateAge, BLOOD_GROUPS, GENDERS } from '../utils/dateUtils'
import { getColor, getInitials } from '../utils/avatar'
import BreadcrumbHUD from '../components/common/BreadcrumbHUD'
import { 
  IconUser, IconMail, IconPhone, IconBriefcase, IconCalendar, 
  IconDroplet, IconStethoscope, IconBuildingHospital, 
  IconMapPin, IconEdit, IconLogout, IconX, IconCamera, 
  IconHeart, IconShieldCheck, IconCheck, IconSparkles,
  IconArrowRight, IconArrowLeft, IconActivity, IconBookmark, IconChevronDown, IconChevronUp,
  IconTicket, IconRefresh
} from '@tabler/icons-react'
import '../styles/auth.css'

const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBnNum = (str) => str !== null && str !== undefined ? String(str).replace(/\d/g, d => enToBn[d] || d) : ''

const GENDER_BN = {
  male: 'পুরুষ',
  female: 'নারী',
  other: 'অন্যান্য',
  Male: 'পুরুষ',
  Female: 'নারী',
  Other: 'অন্যান্য'
}

function ProfilePage() {
  const { user, userType, logout, fetchCurrentUser, isDoctor, isAdmin, isManager, isPatient } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { favoriteDoctors, favoriteHospitals } = useFavorites()

  const initialTab = searchParams.get('tab') === 'favorites' ? 'favorites' : 'profile'
  const [mainTab, setMainTab] = useState(initialTab)
  const [favSubTab, setFavSubTab] = useState('doctors')

  // Mobile Sub-Page Screen State: null (main menu) | 'profile' | 'fav_doctors' | 'fav_hospitals'
  const [mobileSubView, setMobileSubView] = useState(searchParams.get('tab') === 'favorites' ? 'fav_doctors' : null)

  const [appointments, setAppointments] = useState([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)

  useEffect(() => {
    if (searchParams.get('tab') === 'favorites') {
      setMainTab('favorites')
      setMobileSubView('fav_doctors')
    }
  }, [searchParams])

  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')
  const [saveErrorMsg, setSaveErrorMsg] = useState('')

  const [form, setForm] = useState({
    name: '', email: '', mobile: '', occupation: '',
    date_of_birth: '', gender: '', blood_group: '',
    division_id: '', district_id: '', upazila_id: '', union_id: '',
    bmdc_number: '', nid: '',
    specialty: '', degree: '', workplace: '', fee: '', experience: '', bio: '',
    hospital_name: '', address: ''
  })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  const {
    divisions, districts, upazilas, unions,
    setSelectedDivision, setSelectedDistrict, setSelectedUpazila, setSelectedUnion,
    loadingDivisions, loadingDistricts, loadingUpazilas, loadingUnions
  } = useLocations()

  const { specialties, loading: loadingSpecialties } = useSpecialties()

  const ageInfo = calculateAge(form.date_of_birth)

  useEffect(() => {
    loadProfile()
    loadAppointmentsList()
  }, [])

  const loadAppointmentsList = async () => {
    setLoadingAppointments(true)
    try {
      const res = await getAppointments()
      let raw = res.data
      if (raw && raw.data) raw = raw.data
      if (raw && raw.data) raw = raw.data
      if (raw && raw.appointments) raw = raw.appointments
      if (raw && raw.items) raw = raw.items

      const serverList = Array.isArray(raw) ? raw : []
      
      let localList = []
      try {
        localList = JSON.parse(localStorage.getItem('my_appointments') || '[]')
      } catch (e) {
        localList = []
      }

      const mergedMap = new Map()
      serverList.forEach((item, idx) => {
        if (item) {
          const key = String(item.id || item._id || item.appointment_id || `server_${idx}`)
          mergedMap.set(key, item)
        }
      })
      localList.forEach((item, idx) => {
        if (item) {
          const key = String(item.id || item._id || item.appointment_id || `local_${idx}`)
          if (!mergedMap.has(key)) {
            mergedMap.set(key, item)
          }
        }
      })

      const combined = Array.from(mergedMap.values())
      setAppointments(combined.length > 0 ? combined : serverList)
    } catch (err) {
      let localList = []
      try {
        localList = JSON.parse(localStorage.getItem('my_appointments') || '[]')
      } catch (e) {
        localList = []
      }
      setAppointments(localList)
    } finally {
      setLoadingAppointments(false)
    }
  }

  const loadProfile = async () => {
    setLoading(true)
    try {
      const res = await getMyProfile()
      const data = res.data?.data || res.data
      setProfileData(data)

      const doc = data?.doctor || {}
      const hosp = data?.hospital || {}
      const pat = data?.patient || {}
      const regType = data?.registration_type

      const divId = regType === 'doctor' ? doc.division_id : regType === 'hospital' ? hosp.division_id : pat.division_id
      const distId = regType === 'doctor' ? doc.district_id : regType === 'hospital' ? hosp.district_id : pat.district_id
      const upzId = regType === 'doctor' ? doc.upazila_id : regType === 'hospital' ? hosp.upazila_id : pat.upazila_id
      const uniId = regType === 'doctor' ? doc.union_id : regType === 'hospital' ? hosp.union_id : pat.union_id

      setForm({
        name: data?.name || '',
        email: data?.email || '',
        mobile: data?.phone || '',
        occupation: pat?.occupation || '',
        date_of_birth: pat?.date_of_birth || '',
        gender: pat?.gender || '',
        blood_group: pat?.blood_group || '',
        division_id: divId || '',
        district_id: distId || '',
        upazila_id: upzId || '',
        union_id: uniId || '',
        bmdc_number: doc?.bmdc || '',
        nid: doc?.nid || '',
        specialty: doc?.specialty?.name_bn || doc?.specialty?.name || '',
        specialty_id: doc?.specialty_id || '',
        degree: doc?.degree || '',
        workplace: doc?.workplace || '',
        fee: doc?.fee || '',
        experience: doc?.experience || '',
        bio: doc?.bio || '',
        hospital_name: hosp?.name || '',
        address: hosp?.address || '',
      })

      const photoUrl = doc?.photo || hosp?.photo || pat?.photo
      if (photoUrl) setPhotoPreview(photoUrl)

      if (divId) setSelectedDivision(String(divId))
      if (distId) setTimeout(() => setSelectedDistrict(String(distId)), 300)
      if (upzId) setTimeout(() => setSelectedUpazila(String(upzId)), 600)
    } catch (err) {
      if (user) {
        setProfileData(user)
        setForm({ name: user.name || '', email: user.email || '', mobile: user.phone || '', occupation: '', date_of_birth: '', gender: '', blood_group: '', division_id: '', district_id: '', upazila_id: '', union_id: '', bmdc_number: '', nid: '', specialty: '', specialty_id: '', degree: '', workplace: '', fee: '', experience: '', bio: '', hospital_name: '', address: '' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSpecialtyChange = (e) => {
    const val = e.target.value
    const spec = specialties.find(s => String(s.id) === String(val))
    setForm({
      ...form,
      specialty_id: val,
      specialty: spec ? (spec.name || spec.name_bn || spec.title) : ''
    })
  }

  const handleDivisionChange = (e) => {
    const val = e.target.value
    setForm({ ...form, division_id: val, district_id: '', upazila_id: '', union_id: '' })
    setSelectedDivision(val)
  }

  const handleDistrictChange = (e) => {
    const val = e.target.value
    setForm({ ...form, district_id: val, upazila_id: '', union_id: '' })
    setSelectedDistrict(val)
  }

  const handleUpazilaChange = (e) => {
    const val = e.target.value
    setForm({ ...form, upazila_id: val, union_id: '' })
    setSelectedUpazila(val)
  }

  const handleUnionChange = (e) => {
    const val = e.target.value
    setForm({ ...form, union_id: val })
    setSelectedUnion(val)
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccessMsg('')
    setSaveErrorMsg('')
    try {
      const formData = new FormData()
      Object.keys(form).forEach(key => {
        if (form[key] !== '' && form[key] !== null && form[key] !== undefined) formData.append(key, form[key])
      })
      if (photo) formData.append('photo', photo)

      await updateMyProfile(formData)

      setSaveSuccessMsg('প্রোফাইল সফলভাবে আপডেট করা হয়েছে!')
      setEditing(false)
      await fetchCurrentUser()
      loadProfile()
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'প্রোফাইল আপডেট করতে ব্যর্থ হয়েছে'
      setSaveErrorMsg(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const isDoctorUser = userType === 'doctor' || isDoctor
  const displayName = form.name || user?.name || 'ব্যবহারকারী'

  // Location Names
  const currentDivName = divisions.find(d => String(d.id) === String(form.division_id))?.name || ''
  const currentDistName = districts.find(d => String(d.id) === String(form.district_id))?.name || ''
  const currentUpzName = upazilas.find(u => String(u.id) === String(form.upazila_id))?.name || ''
  const currentUniName = unions.find(u => String(u.id) === String(form.union_id))?.name || ''

  const fullAddress = [currentUniName, currentUpzName, currentDistName, currentDivName].filter(Boolean).join(', ')

  const registrationNumber = isDoctorUser 
    ? (form.bmdc_number ? `BMDC: ${form.bmdc_number}` : `REG-DOC-${user?.id || '1024'}`)
    : isManager 
      ? `REG-HOSP-${user?.id || '2048'}`
      : `REG-PAT-${user?.id || '8941'}`

  if (loading) {
    return (
      <div className="page-wrapper" style={{ background: '#F8FAFC', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center" style={{ padding: '60px 40px', background: 'white', borderRadius: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0' }}>
          <div className="spinner-border" style={{ width: 48, height: 48, color: '#00B875' }} />
          <p style={{ marginTop: 20, fontWeight: 700, color: '#475569', fontSize: 16 }}>আপনার অ্যাকাউন্ট প্রোফাইল লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper" style={{ background: '#F6F9FC', minHeight: '100vh', paddingBottom: 90 }}>
      {/* ── DESKTOP HEADER & CONTENT (SHOWN ON MEDIUM AND LARGER SCREENS) ── */}
      <div className="d-none d-md-block">
        {/* EXECUTIVE HERO HEADER */}
        <div style={{ 
          background: 'linear-gradient(135deg, #013A28 0%, #064E3B 50%, #00B875 100%)', 
          padding: '52px 0 44px', 
          color: 'white',
          boxShadow: '0 12px 36px rgba(0, 56, 32, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Ambient Shapes */}
          <div style={{ position: 'absolute', top: -120, right: -80, width: 420, height: 420, background: 'radial-gradient(circle, rgba(0, 184, 117, 0.2) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

          <Container>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
              {/* User Profile Title Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 96, height: 96, borderRadius: 28,
                    background: photoPreview ? 'transparent' : getColor(displayName),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 38, fontWeight: 800, color: 'white',
                    overflow: 'hidden', border: '3.5px solid rgba(255,255,255,0.85)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.25)'
                  }}>
                    {photoPreview ? (
                      <img src={photoPreview} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      getInitials(displayName)
                    )}
                  </div>
                  {editing && (
                    <label style={{
                      position: 'absolute', bottom: -4, right: -4,
                      width: 34, height: 34, borderRadius: '50%', background: '#00B875',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', border: '2px solid white'
                    }} title="ছবি আপলোড করুন">
                      <IconCamera size={17} color="white" />
                      <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                    </label>
                  )}
                </div>

                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '4px 14px', borderRadius: 99, fontSize: 12.5, fontWeight: 800, marginBottom: 8, border: '1px solid rgba(255,255,255,0.2)', color: '#DCFCE7' }}>
                    <IconSparkles size={14} color="#34D399" />
                    <span>{isAdmin ? 'সিস্টেম এডমিন' : (isDoctorUser ? 'ডাক্তার অ্যাকাউন্ট' : (isManager ? 'হাসপাতাল পোর্টাল' : 'রোগী প্রোফাইল'))}</span>
                  </div>
                  <h1 style={{ fontSize: 'clamp(24px, 3.2vw, 34px)', fontWeight: 900, margin: 0, letterSpacing: '-0.5px', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    {displayName}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6, flexWrap: 'wrap', fontSize: 13.5, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <IconMail size={15} style={{ opacity: 0.8 }} /> {form.email || user?.email || 'N/A'}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <IconPhone size={15} style={{ opacity: 0.8 }} /> {toBnNum(form.mobile || user?.phone) || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tab Pill Buttons */}
              <div style={{ 
                display: 'flex', 
                background: 'rgba(0, 0, 0, 0.25)', 
                backdropFilter: 'blur(16px)',
                padding: 6, 
                borderRadius: 16, 
                border: '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow: '0 10px 28px rgba(0,0,0,0.18)'
              }}>
                <button
                  onClick={() => { setMainTab('profile'); setSearchParams({ tab: 'profile' }); }}
                  style={{
                    padding: '11px 24px',
                    borderRadius: 12,
                    fontWeight: 800,
                    fontSize: 14,
                    border: 'none',
                    background: mainTab === 'profile' ? '#ffffff' : 'transparent',
                    color: mainTab === 'profile' ? '#064E3B' : 'rgba(255,255,255,0.85)',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: mainTab === 'profile' ? '0 4px 14px rgba(0,0,0,0.12)' : 'none'
                  }}
                >
                  <IconUser size={18} />
                  প্রোফাইল বিবরণ
                </button>
                <button
                  onClick={() => { setMainTab('favorites'); setSearchParams({ tab: 'favorites' }); }}
                  style={{
                    padding: '11px 24px',
                    borderRadius: 12,
                    fontWeight: 800,
                    fontSize: 14,
                    border: 'none',
                    background: mainTab === 'favorites' ? '#00B875' : 'transparent',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: mainTab === 'favorites' ? '0 4px 14px rgba(0,184,117,0.35)' : 'none'
                  }}
                >
                  <IconHeart size={18} />
                  পছন্দের তালিকা ({toBnNum(favoriteDoctors.length + favoriteHospitals.length)})
                </button>
              </div>
            </div>
          </Container>
        </div>

        {/* DESKTOP MAIN CONTENT AREA */}
        <Container style={{ marginTop: 32 }}>
          {saveSuccessMsg && (
            <div style={{ background: '#ECFDF5', border: '1.5px solid #A7F3D0', color: '#065F46', padding: '14px 20px', borderRadius: 14, fontWeight: 700, fontSize: 14.5, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 14px rgba(16,185,129,0.08)' }}>
              <IconCheck size={20} color="#10B981" />
              {saveSuccessMsg}
            </div>
          )}

          {saveErrorMsg && (
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#991B1B', padding: '14px 20px', borderRadius: 14, fontWeight: 700, fontSize: 14.5, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconX size={20} color="#EF4444" />
              {saveErrorMsg}
            </div>
          )}

          {mainTab === 'favorites' ? (
            <div style={{ background: 'white', borderRadius: 24, border: '1px solid #E2E8F0', padding: '36px 30px', boxShadow: '0 10px 35px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 36 }}>
                <button
                  onClick={() => setFavSubTab('doctors')}
                  style={{
                    padding: '12px 28px',
                    borderRadius: 14,
                    fontWeight: 800,
                    fontSize: 15,
                    border: `2px solid ${favSubTab === 'doctors' ? '#00B875' : '#E2E8F0'}`,
                    background: favSubTab === 'doctors' ? '#F0FDF4' : 'white',
                    color: favSubTab === 'doctors' ? '#064E3B' : '#64748B',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    boxShadow: favSubTab === 'doctors' ? '0 4px 14px rgba(0,184,117,0.1)' : 'none'
                  }}
                >
                  <IconStethoscope size={20} />
                  সেভ করা ডাক্তার ({toBnNum(favoriteDoctors.length)})
                </button>
                <button
                  onClick={() => setFavSubTab('hospitals')}
                  style={{
                    padding: '12px 28px',
                    borderRadius: 14,
                    fontWeight: 800,
                    fontSize: 15,
                    border: `2px solid ${favSubTab === 'hospitals' ? '#00B875' : '#E2E8F0'}`,
                    background: favSubTab === 'hospitals' ? '#F0FDF4' : 'white',
                    color: favSubTab === 'hospitals' ? '#064E3B' : '#64748B',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    boxShadow: favSubTab === 'hospitals' ? '0 4px 14px rgba(0,184,117,0.1)' : 'none'
                  }}
                >
                  <IconBuildingHospital size={20} />
                  সেভ করা হাসপাতাল ({toBnNum(favoriteHospitals.length)})
                </button>
              </div>

              {favSubTab === 'doctors' && (
                favoriteDoctors.length > 0 ? (
                  <Row className="g-4">
                    {favoriteDoctors.map((doc, idx) => (
                      <Col key={doc.id || idx} md={6} lg={6}>
                        <DoctorCard doctor={doc} showBookingButton={true} />
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <div style={{ textAlign: 'center', padding: '64px 20px', background: '#F8FAFC', borderRadius: 20, border: '2px dashed #CBD5E1' }}>
                    <div style={{ width: 68, height: 68, background: '#E2E8F0', borderRadius: '50%', color: '#64748B', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                      <IconBookmark size={34} />
                    </div>
                    <h5 style={{ fontWeight: 800, color: '#0F172A', fontSize: 19, marginBottom: 8 }}>কোনো পছন্দের ডাক্তার সেভ করা নেই</h5>
                    <p style={{ color: '#64748B', fontSize: 14.5, marginBottom: 24, maxWidth: 440, margin: '0 auto 24px' }}>
                      আপনি ডাক্তার খুঁজুন পৃষ্ঠা থেকে আপনার পছন্দের যেকোনো ডাক্তার বুকমার্ক করে রাখতে পারেন।
                    </p>
                    <button onClick={() => navigate('/doctors')} style={{ background: '#00B875', color: 'white', border: 'none', padding: '13px 32px', borderRadius: 12, fontWeight: 800, fontSize: 14.5, cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,184,117,0.2)' }}>
                      ডাক্তার খুঁজুন →
                    </button>
                  </div>
                )
              )}

              {favSubTab === 'hospitals' && (
                favoriteHospitals.length > 0 ? (
                  <Row className="g-4">
                    {favoriteHospitals.map((hosp, idx) => (
                      <Col key={hosp.id || idx} md={6} lg={6}>
                        <HospitalCard hospital={hosp} />
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <div style={{ textAlign: 'center', padding: '64px 20px', background: '#F8FAFC', borderRadius: 20, border: '2px dashed #CBD5E1' }}>
                    <div style={{ width: 68, height: 68, background: '#E2E8F0', borderRadius: '50%', color: '#64748B', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                      <IconBuildingHospital size={34} />
                    </div>
                    <h5 style={{ fontWeight: 800, color: '#0F172A', fontSize: 19, marginBottom: 8 }}>কোনো পছন্দের হাসপাতাল সেভ করা নেই</h5>
                    <p style={{ color: '#64748B', fontSize: 14.5, marginBottom: 24, maxWidth: 440, margin: '0 auto 24px' }}>
                      হাসপাতাল খুঁজুন পৃষ্ঠা থেকে আপনার নিকটস্থ সেরা চিকিৎসা প্রতিষ্ঠান সেভ করে রাখুন।
                    </p>
                    <button onClick={() => navigate('/hospitals')} style={{ background: '#00B875', color: 'white', border: 'none', padding: '13px 32px', borderRadius: 12, fontWeight: 800, fontSize: 14.5, cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,184,117,0.2)' }}>
                      হাসপাতাল খুঁজুন →
                    </button>
                  </div>
                )
              )}
            </div>
          ) : (
            /* DESKTOP MAIN PROFILE VIEW & EDIT */
            <Row className="g-4">
              <Col lg={4}>
                <div style={{ background: 'white', borderRadius: 24, border: '1px solid #E2E8F0', padding: '32px 24px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', position: 'sticky', top: 100 }}>
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
                    <div style={{
                      width: 112, height: 112, borderRadius: '50%',
                      background: photoPreview ? 'transparent' : getColor(displayName),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 44, fontWeight: 800, color: 'white', margin: '0 auto',
                      overflow: 'hidden', border: '4px solid #F1F5F9',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                    }}>
                      {photoPreview ? (
                        <img src={photoPreview} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        getInitials(displayName)
                      )}
                    </div>
                    {editing && (
                      <label style={{
                        position: 'absolute', bottom: 2, right: 2,
                        width: 36, height: 36, borderRadius: '50%', background: '#00B875',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', border: '2px solid white'
                      }} title="ছবি পরিবর্তন করুন">
                        <IconCamera size={18} color="white" />
                        <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                      </label>
                    )}
                  </div>

                  <h4 style={{ fontWeight: 900, color: '#0F172A', fontSize: 21, marginBottom: 6 }}>{displayName}</h4>
                  
                  <div style={{ marginBottom: 18 }}>
                    <span style={{
                      fontSize: 13,
                      background: '#F0FDF4',
                      color: '#064E3B',
                      padding: '6px 18px', borderRadius: 99, fontWeight: 800,
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      border: '1px solid #DCFCE7'
                    }}>
                      {isAdmin ? '🛡️ সিস্টেম অ্যাডমিনিস্ট্রেটর' : (isDoctorUser ? '👨‍⚕️ নিবন্ধিত ডাক্তার' : (isManager ? '🏥 হাসপাতাল ম্যানেজার' : '👤 নিবন্ধিত রোগী'))}
                    </span>
                  </div>

                  <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '14px', border: '1px solid #E2E8F0', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <IconShieldCheck size={20} color="#00B875" />
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: '#334155' }}>আইডি: {registrationNumber}</span>
                  </div>

                  {!editing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <button
                        onClick={() => setEditing(true)}
                        style={{
                          width: '100%', padding: '13px', borderRadius: 12,
                          background: '#00B875', border: 'none', color: 'white',
                          fontWeight: 800, fontSize: 14.5, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          boxShadow: '0 4px 14px rgba(0, 184, 117, 0.25)', transition: '0.2s'
                        }}
                      >
                        <IconEdit size={18} />
                        তথ্য সংশোধন করুন
                      </button>
                      
                      <button
                        onClick={() => navigate('/my-appointments')}
                        style={{
                          width: '100%', padding: '13px', borderRadius: 12,
                          background: '#F8FAFC', border: '1.5px solid #E2E8F0', color: '#1E293B',
                          fontWeight: 800, fontSize: 14.5, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          transition: '0.2s'
                        }}
                      >
                        <IconCalendar size={18} color="#00B875" />
                        আমার অ্যাপয়েন্টমেন্ট
                      </button>

                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%', padding: '13px', borderRadius: 12,
                          background: '#FEF2F2', border: '1.5px solid #FCA5A5', color: '#DC2626',
                          fontWeight: 800, fontSize: 14.5, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          marginTop: 4, transition: '0.2s'
                        }}
                      >
                        <IconLogout size={18} />
                        লগআউট করুন
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditing(false); loadProfile(); }}
                      style={{
                        width: '100%', padding: '13px', borderRadius: 12,
                        background: '#F1F5F9', border: '1.5px solid #CBD5E1', color: '#475569',
                        fontWeight: 800, fontSize: 14.5, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                      }}
                    >
                      <IconX size={18} />
                      সংশোধন বাতিল করুন
                    </button>
                  )}
                </div>
              </Col>

              <Col lg={8}>
                {!editing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Card 1: Personal Information */}
                    <div style={{ background: 'white', borderRadius: 24, border: '1px solid #E2E8F0', padding: '30px 28px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, paddingBottom: 16, borderBottom: '1.5px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F0FDF4', color: '#00B875', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconUser size={22} />
                          </div>
                          <h5 style={{ fontWeight: 900, color: '#0F172A', margin: 0, fontSize: 19 }}>ব্যক্তিগত তথ্য</h5>
                        </div>
                        <button
                          onClick={() => setEditing(true)}
                          style={{
                            background: '#F0FDF4', color: '#00B875', border: '1px solid #DCFCE7',
                            padding: '8px 16px', borderRadius: 10, fontWeight: 800, fontSize: 13.5,
                            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
                          }}
                        >
                          <IconEdit size={16} />
                          তথ্য সংশোধন করুন
                        </button>
                      </div>

                      <Row className="g-3">
                        <Col md={6}>
                          <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B', marginBottom: 3 }}>পূর্ণ নাম</div>
                            <div style={{ fontSize: 15.5, fontWeight: 800, color: '#0F172A' }}>{form.name || 'দেওয়া নেই'}</div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B', marginBottom: 3 }}>মোবাইল নম্বর</div>
                            <div style={{ fontSize: 15.5, fontWeight: 800, color: '#0F172A' }}>{toBnNum(form.mobile) || 'দেওয়া নেই'}</div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B', marginBottom: 3 }}>ইমেইল ঠিকানা</div>
                            <div style={{ fontSize: 15.5, fontWeight: 800, color: '#0F172A', wordBreak: 'break-all' }}>{form.email || 'দেওয়া নেই'}</div>
                          </div>
                        </Col>
                        {!isDoctorUser && (
                          <Col md={6}>
                            <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #F1F5F9' }}>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B', marginBottom: 3 }}>পেশা</div>
                              <div style={{ fontSize: 15.5, fontWeight: 800, color: '#0F172A' }}>{form.occupation || 'দেওয়া নেই'}</div>
                            </div>
                          </Col>
                        )}
                        <Col md={6}>
                          <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B', marginBottom: 3 }}>জন্ম তারিখ ও বয়স</div>
                            <div style={{ fontSize: 15.5, fontWeight: 800, color: '#0F172A' }}>
                              {form.date_of_birth ? `${toBnNum(form.date_of_birth)} ${ageInfo?.ageText ? `(${ageInfo.ageText})` : ''}` : 'দেওয়া নেই'}
                            </div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B', marginBottom: 3 }}>লিঙ্গ</div>
                            <div style={{ fontSize: 15.5, fontWeight: 800, color: '#0F172A' }}>{GENDER_BN[form.gender] || form.gender || 'দেওয়া নেই'}</div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B', marginBottom: 3 }}>রক্তের গ্রুপ</div>
                            <div style={{ fontSize: 15.5, fontWeight: 800, color: '#EF4444' }}>{form.blood_group || 'দেওয়া নেই'}</div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B', marginBottom: 3 }}>আইডি / রেজিস্ট্রেশন নম্বর</div>
                            <div style={{ fontSize: 15.5, fontWeight: 800, color: '#00B875' }}>{registrationNumber}</div>
                          </div>
                        </Col>
                      </Row>
                    </div>

                    {/* Card 2: Address & Location */}
                    <div style={{ background: 'white', borderRadius: 24, border: '1px solid #E2E8F0', padding: '30px 28px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, paddingBottom: 16, borderBottom: '1.5px solid #F1F5F9' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconMapPin size={22} />
                        </div>
                        <h5 style={{ fontWeight: 900, color: '#0F172A', margin: 0, fontSize: 19 }}>ঠিকানা ও অবস্থান</h5>
                      </div>

                      <Row className="g-3">
                        <Col md={6}>
                          <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B', marginBottom: 3 }}>বিভাগ</div>
                            <div style={{ fontSize: 15.5, fontWeight: 800, color: '#0F172A' }}>{currentDivName || 'দেওয়া নেই'}</div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B', marginBottom: 3 }}>জেলা</div>
                            <div style={{ fontSize: 15.5, fontWeight: 800, color: '#0F172A' }}>{currentDistName || 'দেওয়া নেই'}</div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B', marginBottom: 3 }}>উপজেলা / থানা</div>
                            <div style={{ fontSize: 15.5, fontWeight: 800, color: '#0F172A' }}>{currentUpzName || 'দেওয়া নেই'}</div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B', marginBottom: 3 }}>ইউনিয়ন / এলাকা</div>
                            <div style={{ fontSize: 15.5, fontWeight: 800, color: '#0F172A' }}>{currentUniName || 'দেওয়া নেই'}</div>
                          </div>
                        </Col>
                        <Col md={12}>
                          <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B', marginBottom: 3 }}>সম্পূর্ণ ঠিকানা</div>
                            <div style={{ fontSize: 15.5, fontWeight: 800, color: '#00B875' }}>{fullAddress || 'দেওয়া নেই'}</div>
                          </div>
                        </Col>
                      </Row>
                    </div>

                    {/* Card 3: Doctor specific details if doctor user */}
                    {isDoctorUser && (
                      <div style={{ background: 'white', borderRadius: 24, border: '1px solid #E2E8F0', padding: '30px 28px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, paddingBottom: 16, borderBottom: '1.5px solid #F1F5F9' }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F0FDF4', color: '#00B875', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconStethoscope size={22} />
                          </div>
                          <h5 style={{ fontWeight: 900, color: '#0F172A', margin: 0, fontSize: 19 }}>পেশাগত তথ্য</h5>
                        </div>
                        <Row className="g-3">
                          <Col md={6}>
                            <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #F1F5F9' }}>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B', marginBottom: 3 }}>বিশেষজ্ঞতা</div>
                              <div style={{ fontSize: 15.5, fontWeight: 800, color: '#0F172A' }}>{form.specialty || 'দেওয়া নেই'}</div>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #F1F5F9' }}>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B', marginBottom: 3 }}>ডিগ্রি / শিক্ষাগত যোগ্যতা</div>
                              <div style={{ fontSize: 15.5, fontWeight: 800, color: '#0F172A' }}>{form.degree || 'দেওয়া নেই'}</div>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #F1F5F9' }}>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B', marginBottom: 3 }}>কর্মস্থল / চেম্বার</div>
                              <div style={{ fontSize: 15.5, fontWeight: 800, color: '#0F172A' }}>{form.workplace || 'দেওয়া নেই'}</div>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #F1F5F9' }}>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B', marginBottom: 3 }}>পরামর্শ ফি</div>
                              <div style={{ fontSize: 15.5, fontWeight: 800, color: '#0F172A' }}>{form.fee ? `৳ ${toBnNum(form.fee)}` : 'দেওয়া নেই'}</div>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ background: 'white', borderRadius: 24, border: '1px solid #E2E8F0', padding: '32px 30px', boxShadow: '0 10px 35px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1.5px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#F0FDF4', color: '#00B875', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconEdit size={22} />
                        </div>
                        <div>
                          <h5 style={{ fontWeight: 900, color: '#0F172A', margin: 0, fontSize: 20 }}>প্রোফাইল তথ্য সংশোধন</h5>
                          <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>আপনার সঠিক তথ্য প্রদান করে প্রোফাইল আপডেট করুন</span>
                        </div>
                      </div>
                      <button
                        onClick={() => { setEditing(false); loadProfile(); }}
                        style={{
                          background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#475569',
                          padding: '8px 16px', borderRadius: 10, fontWeight: 800, fontSize: 13.5,
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
                        }}
                      >
                        <IconX size={16} />
                        বাতিল
                      </button>
                    </div>

                    {/* SECTION 1: Personal & Account Info */}
                    <div style={{ marginBottom: 28 }}>
                      <h6 style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00B875' }}></span>
                        ব্যক্তিগত তথ্য
                      </h6>

                      <Row className="g-3">
                        <Col md={6}>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>পূর্ণ নাম <span style={{ color: '#EF4444' }}>*</span></label>
                          <input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="আপনার নাম লিখুন" style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14 }} />
                        </Col>
                        <Col md={6}>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>ইমেইল ঠিকানা</label>
                          <input className="form-control" name="email" value={form.email} onChange={handleChange} placeholder="example@domain.com" style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14 }} />
                        </Col>
                        <Col md={6}>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>মোবাইল নম্বর (পরিবর্তনযোগ্য নয়)</label>
                          <input className="form-control" name="mobile" value={form.mobile} disabled readOnly style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14, background: '#F1F5F9', color: '#64748B', cursor: 'not-allowed' }} />
                        </Col>
                        {!isDoctorUser && (
                          <Col md={6}>
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>পেশা</label>
                            <input className="form-control" name="occupation" value={form.occupation} onChange={handleChange} placeholder="আপনার পেশা লিখুন (যেমন: চাকরিজীবী, ছাত্র)" style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14 }} />
                          </Col>
                        )}
                        <Col md={6}>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>
                            জন্ম তারিখ {ageInfo?.ageText && <span style={{ color: '#00B875', fontWeight: 800, marginLeft: 6 }}>({ageInfo.ageText})</span>}
                          </label>
                          <input className="form-control" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14 }} />
                        </Col>
                        <Col md={6}>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>লিঙ্গ</label>
                          <select className="form-select" name="gender" value={form.gender} onChange={handleChange} style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14 }}>
                            <option value="">লিঙ্গ নির্বাচন করুন</option>
                            <option value="male">পুরুষ (Male)</option>
                            <option value="female">নারী (Female)</option>
                            <option value="other">অন্যান্য (Other)</option>
                          </select>
                        </Col>
                        <Col md={6}>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>রক্তের গ্রুপ</label>
                          <select className="form-select" name="blood_group" value={form.blood_group} onChange={handleChange} style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14 }}>
                            <option value="">রক্তের গ্রুপ নির্বাচন করুন</option>
                            {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                          </select>
                        </Col>
                      </Row>
                    </div>

                    {/* SECTION 2: Location & Address */}
                    <div style={{ marginBottom: 28, paddingTop: 20, borderTop: '1.5px solid #F1F5F9' }}>
                      <h6 style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB' }}></span>
                        ঠিকানা ও অবস্থান (Location)
                      </h6>

                      <Row className="g-3">
                        <Col md={6}>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>বিভাগ (Division)</label>
                          <select className="form-select" value={form.division_id} onChange={handleDivisionChange} disabled={loadingDivisions} style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14 }}>
                            <option value="">{loadingDivisions ? 'লোড হচ্ছে...' : 'বিভাগ নির্বাচন করুন'}</option>
                            {divisions.map(d => <option key={d.id} value={d.id}>{d.name || d.bangla_name}</option>)}
                          </select>
                        </Col>
                        <Col md={6}>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>জেলা (District)</label>
                          <select className="form-select" value={form.district_id} onChange={handleDistrictChange} disabled={!form.division_id || loadingDistricts} style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14, background: !form.division_id ? '#F1F5F9' : 'white' }}>
                            <option value="">{loadingDistricts ? 'লোড হচ্ছে...' : 'জেলা নির্বাচন করুন'}</option>
                            {districts.map(d => <option key={d.id} value={d.id}>{d.name || d.bangla_name}</option>)}
                          </select>
                        </Col>
                        <Col md={6}>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>উপজেলা / থানা (Upazila)</label>
                          <select className="form-select" value={form.upazila_id} onChange={handleUpazilaChange} disabled={!form.district_id || loadingUpazilas} style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14, background: !form.district_id ? '#F1F5F9' : 'white' }}>
                            <option value="">{loadingUpazilas ? 'লোড হচ্ছে...' : 'উপজেলা নির্বাচন করুন'}</option>
                            {upazilas.map(u => <option key={u.id} value={u.id}>{u.name || u.bangla_name}</option>)}
                          </select>
                        </Col>
                        <Col md={6}>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>ইউনিয়ন / এলাকা (Union)</label>
                          <select className="form-select" value={form.union_id} onChange={handleUnionChange} disabled={!form.upazila_id || loadingUnions} style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14, background: !form.upazila_id ? '#F1F5F9' : 'white' }}>
                            <option value="">{loadingUnions ? 'লোড হচ্ছে...' : 'ইউনিয়ন নির্বাচন করুন'}</option>
                            {unions.map(u => <option key={u.id} value={u.id}>{u.name || u.bangla_name}</option>)}
                          </select>
                        </Col>
                      </Row>
                    </div>

                    {/* SECTION 3: Doctor specific fields if Doctor */}
                    {isDoctorUser && (
                      <div style={{ marginBottom: 28, paddingTop: 20, borderTop: '1.5px solid #F1F5F9' }}>
                        <h6 style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00B875' }}></span>
                          পেশাগত তথ্য (Professional Details)
                        </h6>

                        <Row className="g-3">
                          <Col md={6}>
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>বিশেষজ্ঞতা (Specialty)</label>
                            <select
                              className="form-select"
                              name="specialty_id"
                              value={form.specialty_id}
                              onChange={handleSpecialtyChange}
                              disabled={loadingSpecialties}
                              style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14 }}
                            >
                              <option value="">{loadingSpecialties ? 'লোড হচ্ছে...' : 'বিশেষজ্ঞতা নির্বাচন করুন'}</option>
                              {specialties.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.name || s.name_bn || s.title}
                                </option>
                              ))}
                            </select>
                          </Col>
                          <Col md={6}>
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>ডিগ্রি / শিক্ষাগত যোগ্যতা</label>
                            <input className="form-control" name="degree" value={form.degree} onChange={handleChange} placeholder="যেমন: MBBS, FCPS" style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14 }} />
                          </Col>
                          <Col md={6}>
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>কর্মস্থল / হাসপাতাল</label>
                            <input className="form-control" name="workplace" value={form.workplace} onChange={handleChange} placeholder="বর্তমান কর্মস্থল লিখুন" style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14 }} />
                          </Col>
                          <Col md={6}>
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>পরামর্শ ফি (৳)</label>
                            <input className="form-control" name="fee" type="number" value={form.fee} onChange={handleChange} placeholder="যেমন: 500" style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14 }} />
                          </Col>
                          <Col md={6}>
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>অভিজ্ঞতা (বছরে)</label>
                            <input className="form-control" name="experience" value={form.experience} onChange={handleChange} placeholder="যেমন: 8" style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14 }} />
                          </Col>
                          <Col md={6}>
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>বিএমডিসি নম্বর (পরিবর্তনযোগ্য নয়)</label>
                            <input className="form-control" name="bmdc_number" value={form.bmdc_number} disabled readOnly style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14, background: '#F1F5F9', color: '#64748B', cursor: 'not-allowed' }} />
                          </Col>
                          <Col md={12}>
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>সংক্ষিপ্ত বিবরণ (Bio)</label>
                            <textarea className="form-control" name="bio" rows={3} value={form.bio} onChange={handleChange} placeholder="ডাক্তার সম্পর্কে সংক্ষিপ্ত পরিচিতি লিখুন..." style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 14 }} />
                          </Col>
                        </Row>
                      </div>
                    )}

                    {/* Save & Cancel Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 32, paddingTop: 20, borderTop: '1.5px solid #F1F5F9' }}>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                          background: '#00B875', color: 'white', border: 'none',
                          padding: '13px 32px', borderRadius: 12, fontWeight: 800, fontSize: 15,
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
                          boxShadow: '0 4px 14px rgba(0, 184, 117, 0.25)', transition: 'all 0.2s ease'
                        }}
                      >
                        {saving ? (
                          <>
                            <div className="spinner-border spinner-border-sm" style={{ width: 16, height: 16, borderWidth: 2 }} />
                            <span>সংরক্ষণ করা হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <IconCheck size={18} />
                            <span>পরিবর্তন সংরক্ষণ করুন</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => { setEditing(false); loadProfile(); }}
                        disabled={saving}
                        style={{
                          background: '#F1F5F9', border: '1.5px solid #CBD5E1', color: '#475569',
                          padding: '13px 24px', borderRadius: 12, fontWeight: 800, fontSize: 15,
                          cursor: 'pointer', transition: 'all 0.2s ease'
                        }}
                      >
                        বাতিল করুন
                      </button>
                    </div>
                  </div>
                )}
              </Col>
            </Row>
          )}
        </Container>
      </div>

      {/* ── MOBILE VIEW DESIGN (CLEAN LISTING MENU + DEDICATED FULL SCREEN SUB-PAGES) ── */}
      <div className="d-block d-md-none" style={{ paddingTop: 16 }}>
        <Container>
          
          {mobileSubView === null ? (
            /* MAIN MOBILE MENU HUB */
            <>
              {/* Mobile Top Profile Banner (Name, Address in One Row, Role Badge) */}
              <div style={{
                background: 'linear-gradient(135deg, #013A28 0%, #064E3B 50%, #00B875 100%)',
                borderRadius: 5,
                padding: '22px 18px',
                color: 'white',
                marginBottom: 20,
                boxShadow: '0 10px 30px rgba(0, 184, 117, 0.25)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 5,
                      background: photoPreview ? 'transparent' : getColor(displayName),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 26, fontWeight: 800, color: 'white',
                      overflow: 'hidden', border: '2.5px solid rgba(255,255,255,0.85)',
                      flexShrink: 0
                    }}>
                      {photoPreview ? (
                        <img src={photoPreview} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        getInitials(displayName)
                      )}
                    </div>
                    <label style={{
                      position: 'absolute', bottom: -4, right: -4,
                      width: 26, height: 26, borderRadius: 5, background: '#00B875',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', border: '1.5px solid white'
                    }} title="ছবি পরিবর্তন করুন">
                      <IconCamera size={14} color="white" />
                      <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                    </label>
                  </div>
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    {/* NAME */}
                    <h3 style={{ fontWeight: 900, fontSize: 19, margin: '0 0 3px', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {displayName}
                    </h3>
                    
                    {/* ADDRESS IN ONE ROW */}
                    <div style={{ 
                      fontSize: 12.5, 
                      color: '#DCFCE7', 
                      fontWeight: 700, 
                      marginBottom: 6, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 5, 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis' 
                    }}>
                      <IconMapPin size={14} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {fullAddress || 'মিরপুর, ঢাকা, বাংলাদেশ'}
                      </span>
                    </div>

                    {/* ROLE BADGE */}
                    <div style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', color: '#DCFCE7', padding: '2px 10px', borderRadius: 5, display: 'inline-block', fontWeight: 800 }}>
                      {isAdmin ? 'সিস্টেম এডমিন' : (isDoctorUser ? 'ডাক্তার' : (isManager ? 'হাসপাতাল' : 'রোগী'))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 CLEAN LISTING MENU BUTTONS (NO SERIAL NUMBERS, BORDER-RADIUS: 5PX) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                
                {/* Item 1: Profile See Sub-Page */}
                <button
                  onClick={() => setMobileSubView('profile')}
                  style={{
                    width: '100%',
                    padding: '16px 18px',
                    borderRadius: 5,
                    border: '1.5px solid #E2E8F0',
                    background: 'white',
                    color: '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 5, background: '#F0FDF4', color: '#00B875', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconUser size={20} />
                    </div>
                    <span>প্রোফাইল তথ্য ও বিবরণ</span>
                  </div>
                  <div style={{ width: 28, height: 28, borderRadius: 5, background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconArrowRight size={16} />
                  </div>
                </button>

                {/* Item 2: Appointment list -> Navigates to /my-appointments */}
                <button
                  onClick={() => navigate('/my-appointments')}
                  style={{
                    width: '100%',
                    padding: '16px 18px',
                    borderRadius: 5,
                    border: '1.5px solid #E2E8F0',
                    background: 'white',
                    color: '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 5, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconCalendar size={20} />
                    </div>
                    <span>আমার অ্যাপয়েন্টমেন্টসমূহ ({toBnNum(appointments.length)})</span>
                  </div>
                  <div style={{ width: 28, height: 28, borderRadius: 5, background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconArrowRight size={16} />
                  </div>
                </button>

                {/* Item 3: Favorite Doctor List -> Saved Doctors Sub-Page */}
                <button
                  onClick={() => setMobileSubView('fav_doctors')}
                  style={{
                    width: '100%',
                    padding: '16px 18px',
                    borderRadius: 5,
                    border: '1.5px solid #E2E8F0',
                    background: 'white',
                    color: '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 5, background: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconStethoscope size={20} />
                    </div>
                    <span>পছন্দের ডাক্তার তালিকা ({toBnNum(favoriteDoctors.length)})</span>
                  </div>
                  <div style={{ width: 28, height: 28, borderRadius: 5, background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconArrowRight size={16} />
                  </div>
                </button>

                {/* Item 4: Favorite Hospital List -> Saved Hospitals Sub-Page */}
                <button
                  onClick={() => setMobileSubView('fav_hospitals')}
                  style={{
                    width: '100%',
                    padding: '16px 18px',
                    borderRadius: 5,
                    border: '1.5px solid #E2E8F0',
                    background: 'white',
                    color: '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 5, background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconBuildingHospital size={20} />
                    </div>
                    <span>পছন্দের হাসপাতাল তালিকা ({toBnNum(favoriteHospitals.length)})</span>
                  </div>
                  <div style={{ width: 28, height: 28, borderRadius: 5, background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconArrowRight size={16} />
                  </div>
                </button>

                {/* Item 5: Logout Button */}
                <button
                  onClick={logout}
                  style={{
                    width: '100%',
                    padding: '16px 18px',
                    borderRadius: 5,
                    border: '1.5px solid #FEE2E2',
                    background: 'white',
                    color: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(220, 38, 38, 0.04)',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 5, background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconLogout size={20} />
                    </div>
                    <span>লগআউট</span>
                  </div>
                  <div style={{ width: 28, height: 28, borderRadius: 5, background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconArrowRight size={16} />
                  </div>
                </button>

              </div>
            </>
          ) : (
            /* DEDICATED FULL MOBILE SUB-PAGE SCREEN */
            <div>
              {/* STICKY NAVIGATION HEADER (EXACT SAME STYLE AS USER IMAGE) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 16,
                marginBottom: 16,
                background: 'white',
                padding: '12px 18px',
                borderRadius: 14,
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
              }}>
                <button
                  onClick={() => { setMobileSubView(null); setEditing(false); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#F0FDF4',
                    color: '#00B875',
                    border: '1px solid #DCFCE7',
                    padding: '8px 18px',
                    borderRadius: 12,
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <IconArrowLeft size={18} />
                  ফিরে যান
                </button>

                <h5 style={{ margin: 0, fontWeight: 900, fontSize: 17, color: '#0F172A', fontFamily: "'Hind Siliguri', sans-serif" }}>
                  {mobileSubView === 'profile' && 'প্রোফাইল বিবরণ'}
                  {mobileSubView === 'fav_doctors' && 'পছন্দের ডাক্তার'}
                  {mobileSubView === 'fav_hospitals' && 'পছন্দের হাসপাতাল'}
                </h5>
              </div>

              {/* ── SUB-PAGE 1: PROFILE DETAILS & EDIT ── */}
              {mobileSubView === 'profile' && (
                <div style={{ background: 'white', borderRadius: 5, border: '1.5px solid #E2E8F0', padding: '20px 18px', position: 'relative', boxShadow: '0 8px 25px rgba(0,0,0,0.04)' }}>
                  
                  {/* EDIT ICON AT TOP RIGHT OF PROFILE CARD */}
                  <button
                    onClick={() => setEditing(!editing)}
                    style={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      width: 36,
                      height: 36,
                      borderRadius: 5,
                      background: editing ? '#EF4444' : '#F0FDF4',
                      color: editing ? 'white' : '#00B875',
                      border: editing ? 'none' : '1px solid #DCFCE7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,184,117,0.15)',
                      zIndex: 5
                    }}
                    title={editing ? 'বাতিল' : 'তথ্য সংশোধন করুন'}
                  >
                    {editing ? <IconX size={18} /> : <IconEdit size={18} />}
                  </button>

                  {!editing ? (
                    <div>
                      {/* Avatar & Main Info */}
                      <div style={{ textAlign: 'center', marginBottom: 18 }}>
                        <div style={{
                          width: 86, height: 86, borderRadius: 5,
                          background: photoPreview ? 'transparent' : getColor(displayName),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 34, fontWeight: 800, color: 'white', margin: '0 auto 12px',
                          overflow: 'hidden', border: '3px solid #F0FDF4',
                          boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
                        }}>
                          {photoPreview ? (
                            <img src={photoPreview} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            getInitials(displayName)
                          )}
                        </div>
                        
                        <h4 style={{ fontWeight: 900, color: '#0F172A', fontSize: 20, margin: '0 0 4px' }}>{displayName}</h4>
                        
                        {/* ADDRESS IN ONE ROW */}
                        <div style={{ fontSize: 13, color: '#059669', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <IconMapPin size={15} style={{ flexShrink: 0 }} />
                          <span>{fullAddress || 'মিরপুর, ঢাকা, বাংলাদেশ'}</span>
                        </div>

                        {/* REGISTRATION NUMBER */}
                        <div style={{ fontSize: 12.5, color: '#64748B', fontWeight: 800, background: '#F8FAFC', padding: '4px 14px', borderRadius: 5, display: 'inline-block', border: '1px solid #E2E8F0' }}>
                          🆔 রেজিস্ট্রেশন / আইডি: <span style={{ color: '#00B875' }}>{registrationNumber}</span>
                        </div>
                      </div>

                      <div style={{ height: 1, background: '#E2E8F0', margin: '18px 0' }} />

                      {/* Details Grid */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 5, border: '1px solid #F1F5F9' }}>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>মোবাইল নম্বর</div>
                          <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A' }}>{toBnNum(form.mobile) || 'দেওয়া নেই'}</div>
                        </div>

                        <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 5, border: '1px solid #F1F5F9' }}>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>ইমেইল ঠিকানা</div>
                          <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A', wordBreak: 'break-all' }}>{form.email || 'দেওয়া নেই'}</div>
                        </div>

                        {isPatient && (
                          <Row className="g-2">
                            <Col xs={6}>
                              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 5, border: '1px solid #F1F5F9' }}>
                                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>লিঙ্গ</div>
                                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A' }}>{GENDER_BN[form.gender] || form.gender || 'দেওয়া নেই'}</div>
                              </div>
                            </Col>

                            <Col xs={6}>
                              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 5, border: '1px solid #F1F5F9' }}>
                                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>রক্তের গ্রুপ</div>
                                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#EF4444' }}>{form.blood_group || 'দেওয়া নেই'}</div>
                              </div>
                            </Col>
                          </Row>
                        )}
                      </div>

                      {/* RED LOGOUT BUTTON */}
                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          padding: '13px',
                          borderRadius: 5,
                          background: 'linear-gradient(135deg, #DC2626, #EF4444)',
                          color: 'white',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: 14.5,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          boxShadow: '0 6px 18px rgba(220,38,38,0.22)',
                          marginTop: 20
                        }}
                      >
                        <IconLogout size={18} />
                        লগআউট করুন
                      </button>
                    </div>
                  ) : (
                    /* EDIT FORM (ALL PATIENT TABLE & LOCATION FIELDS) */
                    <div>
                      <h5 style={{ fontWeight: 900, color: '#0F172A', fontSize: 18, marginBottom: 18 }}>
                        ✏️ তথ্য আপডেট করুন
                      </h5>

                      {/* PROFILE PICTURE CHANGE UPLOAD BOX */}
                      <div style={{ textAlign: 'center', marginBottom: 20, background: '#F8FAFC', padding: '16px 14px', borderRadius: 5, border: '1.5px dashed #CBD5E1' }}>
                        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 10 }}>
                          <div style={{
                            width: 86, height: 86, borderRadius: 5,
                            background: photoPreview ? 'transparent' : getColor(displayName),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 34, fontWeight: 800, color: 'white', margin: '0 auto',
                            overflow: 'hidden', border: '3px solid #00B875',
                            boxShadow: '0 6px 18px rgba(0,184,117,0.15)'
                          }}>
                            {photoPreview ? (
                              <img src={photoPreview} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              getInitials(displayName)
                            )}
                          </div>
                        </div>

                        <div>
                          <label style={{
                            background: '#00B875',
                            color: 'white',
                            padding: '8px 20px',
                            borderRadius: 5,
                            fontSize: 13,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            boxShadow: '0 4px 12px rgba(0,184,117,0.2)'
                          }}>
                            <IconCamera size={16} />
                            ছবি পরিবর্তন করুন
                            <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                          </label>
                          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 6 }}>নতুন প্রোফাইল ছবি গ্যালারি থেকে সিলেক্ট করুন</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>পূর্ণ নাম</label>
                          <input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="আপনার নাম লিখুন" style={{ padding: '11px 14px', borderRadius: 5, fontSize: 14 }} />
                        </div>

                        <div>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>মোবাইল নম্বর (পরিবর্তনযোগ্য নয়)</label>
                          <input className="form-control" name="mobile" value={form.mobile} disabled readOnly style={{ padding: '11px 14px', borderRadius: 5, fontSize: 14, background: '#F1F5F9', color: '#64748B', cursor: 'not-allowed' }} />
                        </div>

                        <div>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>ইমেইল ঠিকানা</label>
                          <input className="form-control" name="email" value={form.email} onChange={handleChange} placeholder="example@domain.com" style={{ padding: '11px 14px', borderRadius: 5, fontSize: 14 }} />
                        </div>

                        {!isDoctorUser && (
                          <div>
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>পেশা</label>
                            <input className="form-control" name="occupation" value={form.occupation} onChange={handleChange} placeholder="আপনার পেশা লিখুন" style={{ padding: '11px 14px', borderRadius: 5, fontSize: 14 }} />
                          </div>
                        )}

                        <div>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>জন্ম তারিখ</label>
                          <input className="form-control" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} style={{ padding: '11px 14px', borderRadius: 5, fontSize: 14 }} />
                        </div>

                        <div>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>লিঙ্গ</label>
                          <select className="form-select" name="gender" value={form.gender} onChange={handleChange} style={{ padding: '11px 14px', borderRadius: 5, fontSize: 14 }}>
                            <option value="">লিঙ্গ নির্বাচন করুন</option>
                            <option value="male">পুরুষ</option>
                            <option value="female">নারী</option>
                            <option value="other">অন্যান্য</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>রক্তের গ্রুপ</label>
                          <select className="form-select" name="blood_group" value={form.blood_group} onChange={handleChange} style={{ padding: '11px 14px', borderRadius: 5, fontSize: 14 }}>
                            <option value="">রক্তের গ্রুপ নির্বাচন করুন</option>
                            {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>বিভাগ</label>
                          <select className="form-select" value={form.division_id} onChange={handleDivisionChange} disabled={loadingDivisions} style={{ padding: '11px 14px', borderRadius: 5, fontSize: 14 }}>
                            <option value="">{loadingDivisions ? 'লোড হচ্ছে...' : 'বিভাগ নির্বাচন করুন'}</option>
                            {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>জেলা</label>
                          <select className="form-select" value={form.district_id} onChange={handleDistrictChange} disabled={!form.division_id || loadingDistricts} style={{ padding: '11px 14px', borderRadius: 5, fontSize: 14 }}>
                            <option value="">{loadingDistricts ? 'লোড হচ্ছে...' : 'জেলা নির্বাচন করুন'}</option>
                            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>উপজেলা / থানা</label>
                          <select className="form-select" value={form.upazila_id} onChange={handleUpazilaChange} disabled={!form.district_id || loadingUpazilas} style={{ padding: '11px 14px', borderRadius: 5, fontSize: 14 }}>
                            <option value="">{loadingUpazilas ? 'লোড হচ্ছে...' : 'উপজেলা নির্বাচন করুন'}</option>
                            {upazilas.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>ইউনিয়ন / এলাকা</label>
                          <select className="form-select" value={form.union_id} onChange={handleUnionChange} disabled={!form.upazila_id || loadingUnions} style={{ padding: '11px 14px', borderRadius: 5, fontSize: 14 }}>
                            <option value="">{loadingUnions ? 'লোড হচ্ছে...' : 'ইউনিয়ন নির্বাচন করুন'}</option>
                            {unions.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        </div>

                        {isDoctorUser && (
                          <>
                            <div>
                              <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>বিশেষজ্ঞতা (Specialty)</label>
                              <select
                                className="form-select"
                                name="specialty_id"
                                value={form.specialty_id}
                                onChange={handleSpecialtyChange}
                                disabled={loadingSpecialties}
                                style={{ padding: '11px 14px', borderRadius: 5, fontSize: 14 }}
                              >
                                <option value="">{loadingSpecialties ? 'লোড হচ্ছে...' : 'বিশেষজ্ঞতা নির্বাচন করুন'}</option>
                                {specialties.map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.name || s.name_bn || s.title}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>ডিগ্রি / শিক্ষাগত যোগ্যতা</label>
                              <input className="form-control" name="degree" value={form.degree} onChange={handleChange} placeholder="MBBS, FCPS..." style={{ padding: '11px 14px', borderRadius: 5, fontSize: 14 }} />
                            </div>

                            <div>
                              <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>কর্মস্থল / চেম্বার</label>
                              <input className="form-control" name="workplace" value={form.workplace} onChange={handleChange} placeholder="চেম্বার বা কর্মস্থল লিখুন" style={{ padding: '11px 14px', borderRadius: 5, fontSize: 14 }} />
                            </div>

                            <div>
                              <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>ভিজিট ফি (টাকা)</label>
                              <input className="form-control" name="fee" type="number" value={form.fee} onChange={handleChange} placeholder="৮০০" style={{ padding: '11px 14px', borderRadius: 5, fontSize: 14 }} />
                            </div>

                            <div>
                              <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>অভিজ্ঞতা (বছর)</label>
                              <input className="form-control" name="experience" type="number" value={form.experience} onChange={handleChange} placeholder="১০" style={{ padding: '11px 14px', borderRadius: 5, fontSize: 14 }} />
                            </div>

                            <div>
                              <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>বিএমডিসি নম্বর (পরিবর্তনযোগ্য নয়)</label>
                              <input className="form-control" name="bmdc_number" value={form.bmdc_number} disabled readOnly style={{ padding: '11px 14px', borderRadius: 5, fontSize: 14, background: '#F1F5F9', color: '#64748B', cursor: 'not-allowed' }} />
                            </div>
                          </>
                        )}

                        {isManager && (
                          <>
                            <div>
                              <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>হাসপাতালের নাম</label>
                              <input className="form-control" name="hospital_name" value={form.hospital_name} onChange={handleChange} placeholder="হাসপাতালের নাম লিখুন" style={{ padding: '11px 14px', borderRadius: 5, fontSize: 14 }} />
                            </div>

                            <div>
                              <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>হাসপাতালের ঠিকানা</label>
                              <input className="form-control" name="address" value={form.address} onChange={handleChange} placeholder="ঠিকানা লিখুন" style={{ padding: '11px 14px', borderRadius: 5, fontSize: 14 }} />
                            </div>
                          </>
                        )}

                        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{ flex: 1, padding: '13px', borderRadius: 5, background: '#00B875', color: 'white', border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
                          >
                            {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                          </button>
                          <button
                            onClick={() => setEditing(false)}
                            style={{ flex: 1, padding: '13px', borderRadius: 5, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
                          >
                            বাতিল
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── SUB-PAGE 2: SAVED DOCTORS ── */}
              {mobileSubView === 'fav_doctors' && (
                <div style={{ background: 'white', borderRadius: 24, border: '1.5px solid #E2E8F0', padding: '24px 20px', boxShadow: '0 8px 25px rgba(0,0,0,0.04)' }}>
                  <h5 style={{ fontWeight: 900, color: '#0F172A', fontSize: 18, marginBottom: 20 }}>
                    👨‍⚕️ পছন্দের ডাক্তার তালিকা ({toBnNum(favoriteDoctors.length)})
                  </h5>

                  {favoriteDoctors.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {favoriteDoctors.map((doc, idx) => (
                        <DoctorCard key={doc.id || idx} doctor={doc} showBookingButton={true} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '48px 16px', background: '#FAFAFA', borderRadius: 20, border: '1.5px dashed #CBD5E1' }}>
                      <IconBookmark size={44} color="#94A3B8" style={{ marginBottom: 12 }} />
                      <h6 style={{ fontWeight: 800, color: '#0F172A', marginBottom: 6, fontSize: 16 }}>কোনো পছন্দের ডাক্তার সেভ করা নেই</h6>
                      <button onClick={() => navigate('/doctors')} style={{ background: '#00B875', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 14, fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 14 }}>
                        ডাক্তার খুঁজুন →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── SUB-PAGE 3: SAVED HOSPITALS ── */}
              {mobileSubView === 'fav_hospitals' && (
                <div style={{ background: 'white', borderRadius: 24, border: '1.5px solid #E2E8F0', padding: '24px 20px', boxShadow: '0 8px 25px rgba(0,0,0,0.04)' }}>
                  <h5 style={{ fontWeight: 900, color: '#0F172A', fontSize: 18, marginBottom: 20 }}>
                    🏥 পছন্দের হাসপাতাল তালিকা ({toBnNum(favoriteHospitals.length)})
                  </h5>

                  {favoriteHospitals.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {favoriteHospitals.map((hosp, idx) => (
                        <HospitalCard key={hosp.id || idx} hospital={hosp} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '48px 16px', background: '#FAFAFA', borderRadius: 20, border: '1.5px dashed #CBD5E1' }}>
                      <IconBuildingHospital size={44} color="#94A3B8" style={{ marginBottom: 12 }} />
                      <h6 style={{ fontWeight: 800, color: '#0F172A', marginBottom: 6, fontSize: 16 }}>কোনো পছন্দের হাসপাতাল সেভ করা নেই</h6>
                      <button onClick={() => navigate('/hospitals')} style={{ background: '#00B875', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 14, fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 14 }}>
                        হাসপাতাল খুঁজুন →
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </Container>
      </div>
    </div>
  )
}

export default ProfilePage

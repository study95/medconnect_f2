import { useState, useEffect } from 'react'
import { Container, Row, Col, Modal } from 'react-bootstrap'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../context/FavoritesContext'
import DoctorCard from '../components/common/DoctorCard'
import HospitalCard from '../components/common/HospitalCard'
import { getMyProfile, updateMyProfile } from '../api/authApi'
import useLocations from '../hooks/useLocations'
import { calculateAge, BLOOD_GROUPS, GENDERS } from '../utils/dateUtils'
import { getColor, getInitials } from '../utils/avatar'
import BreadcrumbHUD from '../components/common/BreadcrumbHUD'
import { 
  IconUser, IconMail, IconPhone, IconBriefcase, IconCalendar, 
  IconDroplet, IconStethoscope, IconSchool, IconBuilding, 
  IconAward, IconId, IconFileText, IconBuildingHospital, 
  IconMapPin, IconKey, IconEdit, IconLogout, IconCheck, 
  IconX, IconCamera, IconHeart, IconShieldCheck, IconChevronRight,
  IconClock, IconCalendarPlus
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

  useEffect(() => {
    if (searchParams.get('tab') === 'favorites') {
      setMainTab('favorites')
    }
  }, [searchParams])

  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState(null)

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

  const ageInfo = calculateAge(form.date_of_birth)

  useEffect(() => {
    loadProfile()
  }, [])

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
    try {
      const formData = new FormData()
      Object.keys(form).forEach(key => {
        if (form[key] !== '' && form[key] !== null && form[key] !== undefined) formData.append(key, form[key])
      })
      if (photo) formData.append('photo', photo)

      await updateMyProfile(formData)

      
      setEditing(false)
      await fetchCurrentUser()
      loadProfile()
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'প্রোফাইল আপডেট করতে ব্যর্থ হয়েছে'
      
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

  if (loading) {
    return (
      <div className="page-wrapper" style={{ background: '#F8FAFC', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <div className="spinner-border text-teal" style={{ width: 44, height: 44, color: '#00A88C' }} />
          <p style={{ marginTop: 16, fontWeight: 700, color: '#64748B' }}>তথ্য লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: 80 }}>
      <BreadcrumbHUD links={[{ label: mainTab === 'favorites' ? 'পছন্দের তালিকা' : 'আমার প্রোফাইল' }]} />

      {/* Top Banner Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #004D40 100%)', 
        padding: '48px 0 40px', 
        color: 'white',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 350, height: 350, background: 'radial-gradient(circle, rgba(0,168,140,0.2) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        
        <Container>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', padding: '4px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, marginBottom: 12, border: '1px solid rgba(255,255,255,0.15)' }}>
                <span>✨ অ্যাকাউন্ট ড্যাশবোর্ড</span>
              </div>
              <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
                {mainTab === 'favorites' ? '❤️ আমার পছন্দের তালিকা' : `👤 ${displayName}`}
              </h1>
              <p style={{ color: '#94A3B8', fontSize: 15, margin: '6px 0 0 0', fontWeight: 500 }}>
                {mainTab === 'favorites' ? 'আপনার সেভ করা ডাক্তার ও হাসপাতালসমূহের তালিকা' : 'আপনার অ্যাকাউন্ট এবং ব্যক্তিগত তথ্য পরিচালনা করুন'}
              </p>
            </div>

            {/* Tab Switching Pills */}
            <div style={{ 
              display: 'flex', 
              background: 'rgba(255, 255, 255, 0.1)', 
              backdropFilter: 'blur(12px)',
              padding: 5, 
              borderRadius: 14, 
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}>
              <button
                onClick={() => { setMainTab('profile'); setSearchParams({ tab: 'profile' }); }}
                style={{
                  padding: '10px 22px',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 14,
                  border: 'none',
                  background: mainTab === 'profile' ? '#00A88C' : 'transparent',
                  color: mainTab === 'profile' ? 'white' : '#CBD5E1',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <IconUser size={18} />
                প্রোফাইল তথ্য
              </button>
              <button
                onClick={() => { setMainTab('favorites'); setSearchParams({ tab: 'favorites' }); }}
                style={{
                  padding: '10px 22px',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 14,
                  border: 'none',
                  background: mainTab === 'favorites' ? '#EF4444' : 'transparent',
                  color: mainTab === 'favorites' ? 'white' : '#CBD5E1',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <IconHeart size={18} />
                পছন্দের তালিকা ({toBnNum(favoriteDoctors.length + favoriteHospitals.length)})
              </button>
            </div>
          </div>
        </Container>
      </div>

      <Container style={{ marginTop: 36 }}>
        {mainTab === 'favorites' ? (
          /* ==================== FAVORITES PANEL ==================== */
          <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: '36px 28px', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 36 }}>
              <button
                onClick={() => setFavSubTab('doctors')}
                style={{
                  padding: '12px 28px',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 15,
                  border: `2px solid ${favSubTab === 'doctors' ? '#00A88C' : '#E2E8F0'}`,
                  background: favSubTab === 'doctors' ? '#ECFDF5' : 'white',
                  color: favSubTab === 'doctors' ? '#00A88C' : '#64748B',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: favSubTab === 'doctors' ? '0 4px 12px rgba(0,168,140,0.12)' : 'none'
                }}
              >
                <IconStethoscope size={20} />
                পছন্দের ডাক্তার ({toBnNum(favoriteDoctors.length)})
              </button>
              <button
                onClick={() => setFavSubTab('hospitals')}
                style={{
                  padding: '12px 28px',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 15,
                  border: `2px solid ${favSubTab === 'hospitals' ? '#00A88C' : '#E2E8F0'}`,
                  background: favSubTab === 'hospitals' ? '#ECFDF5' : 'white',
                  color: favSubTab === 'hospitals' ? '#00A88C' : '#64748B',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: favSubTab === 'hospitals' ? '0 4px 12px rgba(0,168,140,0.12)' : 'none'
                }}
              >
                <IconBuildingHospital size={20} />
                পছন্দের হাসপাতাল ({toBnNum(favoriteHospitals.length)})
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
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#F8FAFC', borderRadius: 16, border: '2px dashed #E2E8F0' }}>
                  <div style={{ width: 64, height: 64, background: '#F1F5F9', borderRadius: '50%', color: '#94A3B8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <IconStethoscope size={32} />
                  </div>
                  <h5 style={{ fontWeight: 800, color: '#1E293B', fontSize: 18, marginBottom: 8 }}>কোনো পছন্দের ডাক্তার সেভ করা নেই</h5>
                  <p style={{ color: '#64748B', fontSize: 14, marginBottom: 24, maxWidth: 420, margin: '0 auto 24px' }}>
                    আপনি ডাক্তার খুঁজুন পৃষ্ঠা থেকে আপনার পছন্দের ডাক্তারদের সেভ করে রাখতে পারেন।
                  </p>
                  <button onClick={() => navigate('/doctors')} style={{ background: '#00A88C', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,168,140,0.25)' }}>
                    ডাক্তার খুঁজুন
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
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#F8FAFC', borderRadius: 16, border: '2px dashed #E2E8F0' }}>
                  <div style={{ width: 64, height: 64, background: '#F1F5F9', borderRadius: '50%', color: '#94A3B8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <IconBuildingHospital size={32} />
                  </div>
                  <h5 style={{ fontWeight: 800, color: '#1E293B', fontSize: 18, marginBottom: 8 }}>কোনো পছন্দের হাসপাতাল সেভ করা নেই</h5>
                  <p style={{ color: '#64748B', fontSize: 14, marginBottom: 24, maxWidth: 420, margin: '0 auto 24px' }}>
                    হাসপাতাল খুঁজুন পৃষ্ঠা থেকে আপনার নিকটস্থ সেরা হাসপাতালগুলো সেভ করে রাখুন।
                  </p>
                  <button onClick={() => navigate('/hospitals')} style={{ background: '#00A88C', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,168,140,0.25)' }}>
                    হাসপাতাল খুঁজুন
                  </button>
                </div>
              )
            )}
          </div>
        ) : (
          /* ==================== MAIN PROFILE VIEW & EDIT ==================== */
          <Row className="g-4">
            {/* Left Side: Avatar & Summary Card */}
            <Col lg={4}>
              <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: '32px 24px', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.03)', position: 'sticky', top: 100 }}>
                
                {/* Profile Photo */}
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
                  <div style={{
                    width: 110, height: 110, borderRadius: '50%',
                    background: photoPreview ? 'transparent' : getColor(displayName),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 42, fontWeight: 800, color: 'white', margin: '0 auto',
                    overflow: 'hidden', border: '4px solid #F1F5F9',
                    boxShadow: '0 6px 18px rgba(0,0,0,0.08)'
                  }}>
                    {photoPreview ? (
                      <img src={photoPreview} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      getInitials(displayName)
                    )}
                  </div>
                  {editing && (
                    <label style={{
                      position: 'absolute', bottom: 4, right: 4,
                      width: 36, height: 36, borderRadius: '50%', background: '#00A88C',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', border: '2px solid white'
                    }} title="ছবি পরিবর্তন করুন">
                      <IconCamera size={18} color="white" />
                      <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                    </label>
                  )}
                </div>

                <h4 style={{ fontWeight: 900, color: '#0F172A', fontSize: 20, marginBottom: 6 }}>{displayName}</h4>
                
                {/* Role Pill Badge */}
                <div style={{ marginBottom: 16 }}>
                  <span style={{
                    fontSize: 13,
                    background: isAdmin ? '#FEE2E2' : (isDoctorUser ? '#EEF2FF' : (isManager ? '#ECFDF5' : '#E6F6F4')),
                    color: isAdmin ? '#991B1B' : (isDoctorUser ? '#4338CA' : (isManager ? '#065F46' : '#00A88C')),
                    padding: '5px 16px', borderRadius: 99, fontWeight: 800,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    border: `1px solid ${isAdmin ? '#FECACA' : (isDoctorUser ? '#C7D2FE' : (isManager ? '#A7F3D0' : '#B9E6E1'))}`
                  }}>
                    {isAdmin ? '🛡️ সিস্টেম অ্যাডমিনিস্ট্রেটর' : (isDoctorUser ? '👨‍⚕️ নিবন্ধিত ডাক্তার' : (isManager ? '🏥 হাসপাতাল ম্যানেজার' : '👤 নিবন্ধিত রোগী'))}
                  </span>
                </div>

                {/* Account Status Badge */}
                <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px', border: '1px solid #F1F5F9', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <IconShieldCheck size={18} color="#10B981" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>যাচাইকৃত অ্যাকাউন্ট ({toBnNum(user?.id ? `#${user.id}` : '#১০০১')})</span>
                </div>

                {/* Quick Action Navigation Buttons */}
                {!editing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button
                      onClick={() => setEditing(true)}
                      style={{
                        width: '100%', padding: '12px', borderRadius: 12,
                        background: '#00A88C', border: 'none', color: 'white',
                        fontWeight: 800, fontSize: 14, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: '0 4px 12px rgba(0,168,140,0.2)', transition: '0.2s'
                      }}
                    >
                      <IconEdit size={18} />
                      তথ্য সংশোধন করুন
                    </button>
                    
                    <button
                      onClick={() => navigate('/my-appointments')}
                      style={{
                        width: '100%', padding: '12px', borderRadius: 12,
                        background: '#F8FAFC', border: '1.5px solid #E2E8F0', color: '#1E293B',
                        fontWeight: 800, fontSize: 14, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: '0.2s'
                      }}
                    >
                      <IconCalendar size={18} color="#00A88C" />
                      আমার অ্যাপয়েন্টমেন্ট
                    </button>

                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%', padding: '12px', borderRadius: 12,
                        background: '#FEF2F2', border: '1.5px solid #FCA5A5', color: '#DC2626',
                        fontWeight: 800, fontSize: 14, cursor: 'pointer',
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
                      width: '100%', padding: '12px', borderRadius: 12,
                      background: '#F1F5F9', border: '1.5px solid #CBD5E1', color: '#475569',
                      fontWeight: 800, fontSize: 14, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                  >
                    <IconX size={18} />
                    সংশোধন বাতিল করুন
                  </button>
                )}
              </div>
            </Col>

            {/* Right Side: Information / Form Section */}
            <Col lg={8}>
              {!editing ? (
                /* ================= VIEW MODE ================= */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  
                  {/* Card 1: Personal Details */}
                  <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: '28px 24px', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1.5px solid #F1F5F9' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E6F6F4', color: '#00A88C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconUser size={20} />
                      </div>
                      <h5 style={{ fontWeight: 900, color: '#0F172A', margin: 0, fontSize: 18 }}>ব্যক্তিগত তথ্য</h5>
                    </div>

                    <Row className="g-3">
                      <Col md={6}>
                        <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', border: '1px solid #F1F5F9' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>পূর্ণ নাম</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{form.name || 'দেওয়া নেই'}</div>
                        </div>
                      </Col>

                      <Col md={6}>
                        <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', border: '1px solid #F1F5F9' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>ইমেইল ঠিকানা</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{form.email || 'দেওয়া নেই'}</div>
                        </div>
                      </Col>

                      <Col md={6}>
                        <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', border: '1px solid #F1F5F9' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>মোবাইল নম্বর</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{toBnNum(form.mobile) || 'দেওয়া নেই'}</div>
                        </div>
                      </Col>

                      {isPatient && (
                        <>
                          <Col md={6}>
                            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', border: '1px solid #F1F5F9' }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>পেশা</div>
                              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{form.occupation || 'দেওয়া নেই'}</div>
                            </div>
                          </Col>

                          <Col md={6}>
                            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', border: '1px solid #F1F5F9' }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>জন্ম তারিখ</div>
                              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                                {form.date_of_birth ? `${toBnNum(form.date_of_birth)}${ageInfo.display ? ` (${toBnNum(ageInfo.display)})` : ''}` : 'দেওয়া নেই'}
                              </div>
                            </div>
                          </Col>

                          <Col md={6}>
                            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', border: '1px solid #F1F5F9' }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>লিঙ্গ</div>
                              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{GENDER_BN[form.gender] || form.gender || 'দেওয়া নেই'}</div>
                            </div>
                          </Col>

                          <Col md={6}>
                            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', border: '1px solid #F1F5F9' }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>রক্তের গ্রুপ</div>
                              <div style={{ fontSize: 15, fontWeight: 800, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <IconDroplet size={16} fill="#EF4444" />
                                {form.blood_group || 'দেওয়া নেই'}
                              </div>
                            </div>
                          </Col>
                        </>
                      )}
                    </Row>
                  </div>

                  {/* Card 2: Professional Details (Doctors / Hospitals) */}
                  {isDoctorUser && (
                    <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: '28px 24px', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1.5px solid #F1F5F9' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconStethoscope size={20} />
                        </div>
                        <h5 style={{ fontWeight: 900, color: '#0F172A', margin: 0, fontSize: 18 }}>পেশাগত তথ্য (ডাক্তার)</h5>
                      </div>

                      <Row className="g-3">
                        <Col md={6}>
                          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', border: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>বিশেষজ্ঞতা (Specialty)</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{form.specialty || 'বিশেষজ্ঞ'}</div>
                          </div>
                        </Col>

                        <Col md={6}>
                          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', border: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>ডিগ্রি / শিক্ষাগত যোগ্যতা</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{form.degree || 'দেওয়া নেই'}</div>
                          </div>
                        </Col>

                        <Col md={6}>
                          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', border: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>কর্মস্থল / চেম্বার</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{form.workplace || 'দেওয়া নেই'}</div>
                          </div>
                        </Col>

                        <Col md={6}>
                          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', border: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>ভিজিট ফি</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#059669' }}>{form.fee ? `৳${toBnNum(form.fee)}` : 'দেওয়া নেই'}</div>
                          </div>
                        </Col>

                        <Col md={6}>
                          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', border: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>অভিজ্ঞতা</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{form.experience ? `${toBnNum(form.experience)} বছর+` : 'দেওয়া নেই'}</div>
                          </div>
                        </Col>

                        <Col md={6}>
                          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', border: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>বিএমডিসি (BMDC) নম্বর</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{form.bmdc_number || 'দেওয়া নেই'}</div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )}

                  {isManager && (
                    <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: '28px 24px', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1.5px solid #F1F5F9' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconBuildingHospital size={20} />
                        </div>
                        <h5 style={{ fontWeight: 900, color: '#0F172A', margin: 0, fontSize: 18 }}>হাসপাতালের তথ্য</h5>
                      </div>

                      <Row className="g-3">
                        <Col md={6}>
                          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', border: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>হাসপাতালের নাম</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{form.hospital_name || 'দেওয়া নেই'}</div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', border: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>হাসপাতালের ঠিকানা</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{form.address || 'দেওয়া নেই'}</div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )}

                  {/* Card 3: Address & Location */}
                  <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: '28px 24px', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1.5px solid #F1F5F9' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconMapPin size={20} />
                      </div>
                      <h5 style={{ fontWeight: 900, color: '#0F172A', margin: 0, fontSize: 18 }}>ঠিকানা ও অবস্থান</h5>
                    </div>

                    <Row className="g-3">
                      <Col md={6}>
                        <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', border: '1px solid #F1F5F9' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>বিভাগ</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{currentDivName || 'দেওয়া নেই'}</div>
                        </div>
                      </Col>

                      <Col md={6}>
                        <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', border: '1px solid #F1F5F9' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>জেলা</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{currentDistName || 'দেওয়া নেই'}</div>
                        </div>
                      </Col>

                      <Col md={6}>
                        <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', border: '1px solid #F1F5F9' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>উপজেলা / থানা</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{currentUpzName || 'দেওয়া নেই'}</div>
                        </div>
                      </Col>

                      <Col md={6}>
                        <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', border: '1px solid #F1F5F9' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>ইউনিয়ন / এলাকা</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{currentUniName || 'দেওয়া নেই'}</div>
                        </div>
                      </Col>

                      {fullAddress && (
                        <Col md={12}>
                          <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '14px 16px', border: '1px solid #DCFCE7', color: '#065F46', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <IconMapPin size={18} color="#059669" />
                            <span style={{ fontSize: 14, fontWeight: 700 }}>পূর্ণাঙ্গ ঠিকানা: {fullAddress}</span>
                          </div>
                        </Col>
                      )}
                    </Row>
                  </div>
                </div>
              ) : (
                /* ================= EDIT MODE ================= */
                <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: '32px 28px', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: '1.5px solid #F1F5F9' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#E6F6F4', color: '#00A88C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconEdit size={22} />
                    </div>
                    <div>
                      <h5 style={{ fontWeight: 900, color: '#0F172A', margin: 0, fontSize: 20 }}>তথ্য পরিবর্তন ও সংশোধন করুন</h5>
                      <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>আপনার সকল তথ্য সঠিকভাবে পূরণ করে সংরক্ষণ করুন</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    
                    {/* Section 1: Basic */}
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#00A88C', borderBottom: '1px solid #E2E8F0', paddingBottom: 6 }}>
                      👤 মৌলিক তথ্য
                    </div>

                    <Row className="g-3">
                      <Col md={6}>
                        <div className="auth-input-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>পূর্ণ নাম</label>
                          <input className="auth-input" name="name" value={form.name} onChange={handleChange} placeholder="আপনার নাম লিখুন" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0' }} />
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="auth-input-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>ইমেইল ঠিকানা</label>
                          <input className="auth-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="example@domain.com" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0' }} />
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="auth-input-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>মোবাইল নম্বর</label>
                          <input className="auth-input" name="mobile" value={form.mobile} onChange={handleChange} placeholder="017XXXXXXXX" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0' }} />
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="auth-input-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>পেশা</label>
                          <input className="auth-input" name="occupation" value={form.occupation} onChange={handleChange} placeholder="পেশা লিখুন" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0' }} />
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="auth-input-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>জন্ম তারিখ</label>
                          <input className="auth-input" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0' }} />
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="auth-input-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>লিঙ্গ</label>
                          <select className="auth-select" name="gender" value={form.gender} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0' }}>
                            <option value="">বাছাই করুন</option>
                            <option value="male">পুরুষ</option>
                            <option value="female">নারী</option>
                            <option value="other">অন্যান্য</option>
                          </select>
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="auth-input-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>রক্তের গ্রুপ</label>
                          <select className="auth-select" name="blood_group" value={form.blood_group} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0' }}>
                            <option value="">বাছাই করুন</option>
                            {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                          </select>
                        </div>
                      </Col>
                    </Row>

                    {/* Section 2: Address */}
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#00A88C', borderBottom: '1px solid #E2E8F0', paddingBottom: 6, marginTop: 12 }}>
                      📍 ঠিকানা ও বিভাগসমূহ
                    </div>

                    <Row className="g-3">
                      <Col md={6}>
                        <div className="auth-input-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>বিভাগ</label>
                          <select className="auth-select" value={form.division_id} onChange={handleDivisionChange} disabled={loadingDivisions} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0' }}>
                            <option value="">{loadingDivisions ? 'লোড হচ্ছে...' : 'বিভাগ নির্বাচন করুন'}</option>
                            {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="auth-input-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>জেলা</label>
                          <select className="auth-select" value={form.district_id} onChange={handleDistrictChange} disabled={!form.division_id || loadingDistricts} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0' }}>
                            <option value="">{loadingDistricts ? 'লোড হচ্ছে...' : 'জেলা নির্বাচন করুন'}</option>
                            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="auth-input-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>উপজেলা / থানা</label>
                          <select className="auth-select" value={form.upazila_id} onChange={handleUpazilaChange} disabled={!form.district_id || loadingUpazilas} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0' }}>
                            <option value="">{loadingUpazilas ? 'লোড হচ্ছে...' : 'উপজেলা নির্বাচন করুন'}</option>
                            {upazilas.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="auth-input-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>ইউনিয়ন / এলাকা</label>
                          <select className="auth-select" value={form.union_id} onChange={handleUnionChange} disabled={!form.upazila_id || loadingUnions} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0' }}>
                            <option value="">{loadingUnions ? 'লোড হচ্ছে...' : 'ইউনিয়ন নির্বাচন করুন'}</option>
                            {unions.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        </div>
                      </Col>
                    </Row>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 14, marginTop: 16 }}>
                      <button 
                        onClick={handleSave} 
                        disabled={saving} 
                        style={{ 
                          flex: 1, padding: '12px 24px', borderRadius: 12, 
                          background: '#00A88C', border: 'none', color: 'white', 
                          fontWeight: 800, fontSize: 15, cursor: 'pointer', 
                          boxShadow: '0 4px 12px rgba(0,168,140,0.25)',
                          opacity: saving ? 0.7 : 1 
                        }}
                      >
                        {saving ? '⏳ সংরক্ষণ করা হচ্ছে...' : '💾 পরিবর্তন সংরক্ষণ করুন'}
                      </button>
                      <button 
                        onClick={() => { setEditing(false); loadProfile() }} 
                        style={{ 
                          flex: 1, padding: '12px 24px', borderRadius: 12, 
                          border: '1.5px solid #CBD5E1', background: 'white', 
                          color: '#475569', fontWeight: 800, fontSize: 15, cursor: 'pointer' 
                        }}
                      >
                        বাতিল করুন
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </Col>
          </Row>
        )}
      </Container>
    </div>
  )
}

export default ProfilePage

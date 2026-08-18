import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getMyProfile, updateMyProfile } from '../../api/authApi'
import useLocations from '../../hooks/useLocations'
import { calculateAge, BLOOD_GROUPS, GENDERS } from '../../utils/dateUtils'
import { getMediaUrl } from '../../utils/mediaUtils'
import { getColor, getInitials } from '../../utils/avatar'
import { 
  User, Mail, Phone, MapPin, Briefcase, Key, Edit2, Save, X, 
  Calendar, Activity, GraduationCap, Building2, Search, Settings, ShieldCheck, CheckCircle2 
} from 'lucide-react'
import { toast } from 'react-hot-toast'

function AdminProfilePage() {
  const { user, userType, fetchCurrentUser, isDoctor, isAdmin, isManager, isPatient } = useAuth()
  const navigate = useNavigate()

  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState(null)

  const [form, setForm] = useState({
    name: '', email: '', mobile: '', occupation: '',
    date_of_birth: '', gender: '', blood_group: '',
    division_id: '', district_id: '', upazila_id: '', union_id: '',
    bmdc_number: '', nid: '',
    hospital_name: '', address: '',
    specialty: '', specialty_id: '', degree: '', workplace: '', fee: '', experience: '', bio: ''
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

      const divId = regType === 'doctor' ? doc.division_id : regType === 'hospital' ? hosp.division_id : (pat.division_id || data?.division_id)
      const distId = regType === 'doctor' ? doc.district_id : regType === 'hospital' ? hosp.district_id : (pat.district_id || data?.district_id)
      const upzId = regType === 'doctor' ? doc.upazila_id : regType === 'hospital' ? hosp.upazila_id : (pat.upazila_id || data?.upazila_id)
      const uniId = regType === 'doctor' ? doc.union_id : regType === 'hospital' ? hosp.union_id : (pat.union_id || data?.union_id)

      setForm({
        name: data?.name || user?.name || '',
        email: data?.email || user?.email || '',
        mobile: data?.phone || user?.phone || '',
        occupation: pat?.occupation || (isAdmin ? 'Administrator' : ''),
        date_of_birth: pat?.date_of_birth || '',
        gender: pat?.gender || '',
        blood_group: pat?.blood_group || '',
        division_id: divId || '',
        district_id: distId || '',
        upazila_id: upzId || '',
        union_id: uniId || '',
        bmdc_number: doc?.bmdc || '',
        nid: doc?.nid || '',
        specialty: doc?.specialty?.name || '',
        specialty_id: doc?.specialty_id || '',
        degree: doc?.degree || '',
        workplace: doc?.workplace || '',
        fee: doc?.fee || '',
        experience: doc?.experience || '',
        bio: doc?.bio || '',
        hospital_name: hosp?.name || '',
        address: hosp?.address || '',
      })

      const photoUrl = data?.photo || doc?.photo || hosp?.photo || pat?.photo || user?.photo
      if (photoUrl) setPhotoPreview(photoUrl)

      if (divId) setSelectedDivision(String(divId))
      if (distId) setTimeout(() => setSelectedDistrict(String(distId)), 300)
      if (upzId) setTimeout(() => setSelectedUpazila(String(upzId)), 600)
    } catch (err) {
      if (user) {
        setProfileData(user)
        setForm({
          name: user.name || '', email: user.email || '', mobile: user.phone || '',
          occupation: isAdmin ? 'Administrator' : '', date_of_birth: '', gender: '', blood_group: '',
          division_id: '', district_id: '', upazila_id: '', union_id: '',
          bmdc_number: '', nid: '', specialty: '', specialty_id: '', degree: '', workplace: '',
          fee: '', experience: '', bio: '', hospital_name: '', address: ''
        })
        if (user.photo) setPhotoPreview(user.photo)
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
        if (form[key] !== '' && form[key] !== null && form[key] !== undefined) {
          formData.append(key, form[key])
        }
      })
      if (photo) formData.append('photo', photo)

      await updateMyProfile(formData)

      setEditing(false)
      await fetchCurrentUser()
      loadProfile()
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to update profile'
      toast.error(msg, { id: 'admin-profile-err' })
    } finally {
      setSaving(false)
    }
  }

  const isDoctorUser = userType === 'doctor' || isDoctor
  const displayName = form.name || user?.name || 'Admin'

  const locationSummary = [
    divisions.find(d => String(d.id) === String(form.division_id))?.name,
    districts.find(d => String(d.id) === String(form.district_id))?.name,
    upazilas.find(u => String(u.id) === String(form.upazila_id))?.name,
    unions.find(u => String(u.id) === String(form.union_id))?.name
  ].filter(Boolean).join(', ')

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner-border" style={{ color: 'var(--admin-primary)' }} />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--admin-text)' }}>Admin Profile</h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--admin-text-muted)' }}>Manage your personal account details</p>
        </div>
        {!editing ? (
          <button 
            onClick={() => setEditing(true)} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, 
              background: 'var(--admin-primary)', border: 'none', color: 'white', fontWeight: 600, 
              cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0, 184, 117, 0.2)' 
            }}
          >
            <Edit2 size={16} /> Edit Profile
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={() => { setEditing(false); loadProfile() }} 
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'var(--admin-bg-alt)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontWeight: 600, cursor: 'pointer' }}
            >
              <X size={16} /> Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'var(--admin-primary)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        
        {/* Left Column - Avatar Card */}
        <div style={{ background: 'var(--admin-card-bg, #FFFFFF)', borderRadius: 20, border: '1px solid var(--admin-border)', overflow: 'hidden', height: 'fit-content', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ height: 120, background: `linear-gradient(135deg, ${isDoctorUser ? '#4F46E5' : '#00B875'} 0%, ${isDoctorUser ? '#6366F1' : '#10B981'} 100%)` }} />
          <div style={{ padding: '0 24px 24px', textAlign: 'center', marginTop: -50 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div style={{
                width: 100, height: 100, borderRadius: '50%',
                background: photoPreview ? 'transparent' : getColor(displayName),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, fontWeight: 800, color: 'white',
                border: '4px solid var(--admin-card-bg, #FFFFFF)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                overflow: 'hidden', margin: '0 auto'
              }}>
                {photoPreview ? (
                  <img src={getMediaUrl(photoPreview)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  getInitials(displayName)
                )}
              </div>
              {editing && (
                <label style={{
                  position: 'absolute', bottom: 4, right: 4,
                  width: 32, height: 32, borderRadius: '50%', background: 'var(--admin-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', border: '2px solid white'
                }}>
                  <Edit2 size={14} color="white" />
                  <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                </label>
              )}
            </div>
            
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--admin-text)', marginTop: 16, marginBottom: 4 }}>{displayName}</h3>
            
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 99,
              background: isAdmin ? '#FEE2E2' : (isDoctorUser ? '#EEF2FF' : (isManager ? '#ECFDF5' : '#E6F6F4')),
              color: isAdmin ? '#991B1B' : (isDoctorUser ? '#4338CA' : (isManager ? '#065F46' : '#00B875'))
            }}>
              {isAdmin ? 'Administrator' : (isDoctorUser ? 'Doctor' : (isManager ? 'Hospital' : 'Patient'))}
            </span>

            {!editing && (
              <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--admin-border)', display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--admin-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={16} color="#6B7280" /></div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>User ID</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text)' }}>#{user?.id || profileData?.id}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--admin-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mail size={16} color="#6B7280" /></div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text)' }}>{form.email || user?.email || '—'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--admin-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={16} color="#6B7280" /></div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Phone</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text)' }}>{form.mobile || user?.phone || '—'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Details / Form */}
        <div style={{ background: 'var(--admin-card-bg, #FFFFFF)', borderRadius: 20, border: '1px solid var(--admin-border)', padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={18} color="var(--admin-primary)" />
            {editing ? 'Edit Information' : 'Personal Information'}
          </h3>

          {!editing ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Primary User Details */}
              <div style={{ background: 'var(--admin-bg-alt)', padding: '16px', borderRadius: 12, border: '1px solid var(--admin-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <User size={14} color="#6B7280" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Full Name</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text)' }}>{form.name || user?.name || '—'}</div>
              </div>

              <div style={{ background: 'var(--admin-bg-alt)', padding: '16px', borderRadius: 12, border: '1px solid var(--admin-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Mail size={14} color="#6B7280" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Email Address</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text)' }}>{form.email || user?.email || '—'}</div>
              </div>

              <div style={{ background: 'var(--admin-bg-alt)', padding: '16px', borderRadius: 12, border: '1px solid var(--admin-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Phone size={14} color="#6B7280" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Mobile Number</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text)' }}>{form.mobile || user?.phone || '—'}</div>
              </div>

              <div style={{ background: 'var(--admin-bg-alt)', padding: '16px', borderRadius: 12, border: '1px solid var(--admin-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <ShieldCheck size={14} color="#6B7280" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Role / Status</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{isAdmin ? 'Super Admin' : (isDoctorUser ? 'Doctor' : (isManager ? 'Hospital' : 'User'))}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D' }}>Active</span>
                </div>
              </div>

              {/* Occupation */}
              <div style={{ background: 'var(--admin-bg-alt)', padding: '16px', borderRadius: 12, border: '1px solid var(--admin-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Briefcase size={14} color="#6B7280" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Occupation</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text)' }}>{form.occupation || (isAdmin ? 'System Administrator' : '—')}</div>
              </div>

              {/* Date of Birth */}
              <div style={{ background: 'var(--admin-bg-alt)', padding: '16px', borderRadius: 12, border: '1px solid var(--admin-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Calendar size={14} color="#6B7280" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Date of Birth</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text)' }}>
                  {form.date_of_birth ? `${form.date_of_birth}${ageInfo.display ? ` (${ageInfo.display})` : ''}` : '—'}
                </div>
              </div>

              {/* Gender */}
              <div style={{ background: 'var(--admin-bg-alt)', padding: '16px', borderRadius: 12, border: '1px solid var(--admin-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <User size={14} color="#6B7280" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Gender</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text)' }}>{form.gender || '—'}</div>
              </div>

              {/* Blood Group */}
              <div style={{ background: 'var(--admin-bg-alt)', padding: '16px', borderRadius: 12, border: '1px solid var(--admin-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Activity size={14} color="#6B7280" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Blood Group</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text)' }}>{form.blood_group || '—'}</div>
              </div>

              {/* Location */}
              <div style={{ background: 'var(--admin-bg-alt)', padding: '16px', borderRadius: 12, border: '1px solid var(--admin-border)', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <MapPin size={14} color="#6B7280" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Location</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text)' }}>{locationSummary || 'Not specified'}</div>
              </div>

              {/* Doctor Specific Info */}
              {isDoctorUser && (
                <>
                  {form.specialty && (
                    <div style={{ background: 'var(--admin-bg-alt)', padding: '16px', borderRadius: 12, border: '1px solid var(--admin-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Activity size={14} color="#6B7280" />
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Specialty</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text)' }}>{form.specialty}</div>
                    </div>
                  )}
                  {form.bmdc_number && (
                    <div style={{ background: 'var(--admin-bg-alt)', padding: '16px', borderRadius: 12, border: '1px solid var(--admin-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Key size={14} color="#6B7280" />
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>BMDC Number</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text)' }}>{form.bmdc_number}</div>
                    </div>
                  )}
                </>
              )}

              {/* Hospital Specific Info */}
              {isManager && form.hospital_name && (
                <div style={{ background: 'var(--admin-bg-alt)', padding: '16px', borderRadius: 12, border: '1px solid var(--admin-border)', gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Building2 size={14} color="#6B7280" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Hospital Name</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text)' }}>{form.hospital_name}</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 8 }}>Full Name</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--admin-border)', background: 'var(--admin-bg-alt)', color: 'var(--admin-text)', fontSize: 14, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 8 }}>Email Address</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--admin-border)', background: 'var(--admin-bg-alt)', color: 'var(--admin-text)', fontSize: 14, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 8 }}>
                    Mobile Number {!isAdmin && <span style={{ fontSize: 11, fontWeight: 600, color: '#00B875', marginLeft: 4 }}>✓ (OTP Verified — Non-editable)</span>}
                  </label>
                  <input 
                    type="text" 
                    name="mobile" 
                    value={form.mobile} 
                    onChange={handleChange}
                    disabled={!isAdmin} 
                    readOnly={!isAdmin} 
                    title={!isAdmin ? "Verified mobile number cannot be changed" : ""}
                    style={{ 
                      width: '100%', padding: '12px 16px', borderRadius: 10, 
                      border: '1.5px solid var(--admin-border)', 
                      background: !isAdmin ? 'rgba(0,0,0,0.04)' : 'var(--admin-bg-alt)', 
                      color: !isAdmin ? 'var(--admin-text-muted)' : 'var(--admin-text)', 
                      fontSize: 14, 
                      outline: 'none', 
                      cursor: !isAdmin ? 'not-allowed' : 'text' 
                    }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 8 }}>Occupation</label>
                  <input type="text" name="occupation" value={form.occupation} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--admin-border)', background: 'var(--admin-bg-alt)', color: 'var(--admin-text)', fontSize: 14, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 8 }}>Date of Birth</label>
                  <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--admin-border)', background: 'var(--admin-bg-alt)', color: 'var(--admin-text)', fontSize: 14, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 8 }}>Gender</label>
                  <select name="gender" value={form.gender} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--admin-border)', background: 'var(--admin-bg-alt)', color: 'var(--admin-text)', fontSize: 14, outline: 'none' }}>
                    <option value="">Select Gender</option>
                    {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 8 }}>Blood Group</label>
                  <select name="blood_group" value={form.blood_group} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--admin-border)', background: 'var(--admin-bg-alt)', color: 'var(--admin-text)', fontSize: 14, outline: 'none' }}>
                    <option value="">Select Blood Group</option>
                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
              </div>

              {isManager && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 8 }}>Hospital Name</label>
                    <input type="text" name="hospital_name" value={form.hospital_name} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--admin-border)', background: 'var(--admin-bg-alt)', color: 'var(--admin-text)', fontSize: 14, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 8 }}>Hospital Address</label>
                    <input type="text" name="address" value={form.address} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--admin-border)', background: 'var(--admin-bg-alt)', color: 'var(--admin-text)', fontSize: 14, outline: 'none' }} />
                  </div>
                </div>
              )}

              {isDoctorUser && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 8 }}>BMDC Number</label>
                    <input type="text" name="bmdc_number" value={form.bmdc_number} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--admin-border)', background: 'var(--admin-bg-alt)', color: 'var(--admin-text)', fontSize: 14, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 8 }}>NID</label>
                    <input type="text" name="nid" value={form.nid} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--admin-border)', background: 'var(--admin-bg-alt)', color: 'var(--admin-text)', fontSize: 14, outline: 'none' }} />
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 20, marginTop: 8 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 16 }}>Location Data</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 8 }}>Division</label>
                    <select value={form.division_id} onChange={handleDivisionChange} disabled={loadingDivisions} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--admin-border)', background: 'var(--admin-bg-alt)', color: 'var(--admin-text)', fontSize: 14, outline: 'none' }}>
                      <option value="">{loadingDivisions ? 'Loading...' : 'Select Division'}</option>
                      {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 8 }}>District</label>
                    <select value={form.district_id} onChange={handleDistrictChange} disabled={!form.division_id || loadingDistricts} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--admin-border)', background: 'var(--admin-bg-alt)', color: 'var(--admin-text)', fontSize: 14, outline: 'none' }}>
                      <option value="">{loadingDistricts ? 'Loading...' : 'Select District'}</option>
                      {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 8 }}>Upazila</label>
                    <select value={form.upazila_id} onChange={handleUpazilaChange} disabled={!form.district_id || loadingUpazilas} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--admin-border)', background: 'var(--admin-bg-alt)', color: 'var(--admin-text)', fontSize: 14, outline: 'none' }}>
                      <option value="">{loadingUpazilas ? 'Loading...' : 'Select Upazila'}</option>
                      {upazilas.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 8 }}>Union</label>
                    <select value={form.union_id} onChange={handleUnionChange} disabled={!form.upazila_id || loadingUnions} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--admin-border)', background: 'var(--admin-bg-alt)', color: 'var(--admin-text)', fontSize: 14, outline: 'none' }}>
                      <option value="">{loadingUnions ? 'Loading...' : 'Select Union'}</option>
                      {unions.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminProfilePage

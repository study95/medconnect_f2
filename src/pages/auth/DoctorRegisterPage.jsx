// DoctorRegisterPage.jsx — Doctor registration form
// Fields: BMDC, NID, Specialty, Degree, Workplace, Fee, Experience + personal info
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import useLocations from '../../hooks/useLocations'
import { getSpecialties } from '../../api/adminApi'
import { calculateAge, BLOOD_GROUPS, GENDERS } from '../../utils/dateUtils'
import PasswordInput from '../../components/common/PasswordInput'
import '../../styles/auth.css'

export default function DoctorRegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { registerDoctor } = useAuth()

  const verified = location.state?.verified
  const verifiedMobile = location.state?.mobile || ''

  useEffect(() => {
    if (!verified) {
      
      navigate('/register/doctor/verify')
    }
  }, [verified, navigate])

  const [form, setForm] = useState({
    name: '', email: '', occupation: '', date_of_birth: '',
    gender: '', blood_group: '', mobile: verifiedMobile,
    division_id: '', district_id: '', upazila_id: '', union_id: '',
    bmdc_number: '', nid: '',
    specialty_id: '', degree: '', workplace: '', fee: '', experience: '',
    password: '', password_confirmation: ''
  })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [specialties, setSpecialties] = useState([])

  useEffect(() => {
    getSpecialties().then(res => {
      setSpecialties(res.data?.data || res.data || [])
    }).catch(() => {})
  }, [])

  const {
    divisions, districts, upazilas, unions,
    selectedDivision, selectedDistrict, selectedUpazila,
    setSelectedDivision, setSelectedDistrict, setSelectedUpazila, setSelectedUnion,
    loadingDivisions, loadingDistricts, loadingUpazilas, loadingUnions
  } = useLocations()

  const ageInfo = calculateAge(form.date_of_birth)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleDivisionChange = (e) => {
    const val = e.target.value
    setForm(prev => ({ ...prev, division_id: val, district_id: '', upazila_id: '', union_id: '' }))
    setSelectedDivision(val)
  }

  const handleDistrictChange = (e) => {
    const val = e.target.value
    setForm(prev => ({ ...prev, district_id: val, upazila_id: '', union_id: '' }))
    setSelectedDistrict(val)
  }

  const handleUpazilaChange = (e) => {
    const val = e.target.value
    setForm(prev => ({ ...prev, upazila_id: val, union_id: '' }))
    setSelectedUpazila(val)
  }

  const handleUnionChange = (e) => {
    const val = e.target.value
    setForm(prev => ({ ...prev, union_id: val }))
    setSelectedUnion(val)
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Full Name is required'
    if (!form.email.trim()) errs.email = 'Email Address is required'
    if (!form.bmdc_number.trim()) errs.bmdc_number = 'BMDC Registration Number is required'
    if (!form.specialty_id) errs.specialty_id = 'Specialty selection is required'
    if (!form.workplace.trim()) errs.workplace = 'Current Workplace is required'
    if (!form.nid.trim()) errs.nid = 'NID Number is required'
    if (!form.date_of_birth) errs.date_of_birth = 'Date of birth is required'
    if (!form.gender) errs.gender = 'Gender is required'
    if (!form.password) errs.password = 'Password is required'
    else {
      if (form.password.length < 6) errs.password = 'Minimum 6 characters required'
    }
    if (form.password !== form.password_confirmation) errs.password_confirmation = 'Passwords do not match'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    const formData = new FormData()
    Object.keys(form).forEach(key => {
      if (form[key]) formData.append(key, form[key])
    })
    if (photo) formData.append('profile_pic', photo)

    const result = await registerDoctor(formData)
    setLoading(false)

    if (result.success) {
      
      navigate('/')
    } else {
      if (result.errors) setErrors(result.errors)
      
    }
  }

  if (!verified) return null

  return (
    <div className="auth-page-wrapper" style={{ padding: '80px 20px 40px' }}>
      <button className="auth-back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="auth-register-card">
        {/* Header */}
        <div className="auth-register-header">
          <Link to="/" style={{ display: 'inline-block', marginBottom: 16 }}>
            <img 
              src="/doctorBookletLogo.png" 
              alt="Doctor Booklet Logo" 
              style={{ height: '52px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,168,140,0.2))' }} 
            />
          </Link>
          <div style={{
            width: 44, height: 44, background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
            borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', fontSize: 20
          }}>
            👨‍⚕️
          </div>
          <h3>Doctor Registration</h3>
          <p>Fill in your professional details to create a doctor account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="auth-register-body">
            {/* Profile Photo */}
            <div className="auth-photo-upload">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" />
              ) : (
                <div className="auth-photo-placeholder">
                  <span style={{ fontSize: 28 }}>📷</span>
                  <span>Upload Photo</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handlePhotoChange} />
            </div>

            {/* Professional Info — Doctor-specific */}
            <div className="auth-section-title" style={{ color: '#4F46E5' }}>🏥 Professional Information</div>

            <div className="auth-form-row">
              <div className="auth-input-group">
                <label>BMDC Number * <span style={{ fontSize: 11, color: '#94A3B8' }}>(Unique)</span></label>
                <input className={`auth-input ${errors.bmdc_number ? 'error' : ''}`} name="bmdc_number" value={form.bmdc_number} onChange={handleChange} placeholder="BMDC Registration Number" />
                {errors.bmdc_number && <div className="auth-field-error">{errors.bmdc_number}</div>}
              </div>
              <div className="auth-input-group">
                <label>NID Number * <span style={{ fontSize: 11, color: '#94A3B8' }}>(Unique)</span></label>
                <input className={`auth-input ${errors.nid ? 'error' : ''}`} name="nid" value={form.nid} onChange={handleChange} placeholder="National ID Number" />
                {errors.nid && <div className="auth-field-error">{errors.nid}</div>}
              </div>
            </div>

            <div className="auth-form-row">
              <div className="auth-input-group">
                <label>Specialty *</label>
                <select className={`auth-select ${errors.specialty_id ? 'error' : ''}`} name="specialty_id" value={form.specialty_id} onChange={handleChange}>
                  <option value="">Select Specialty</option>
                  {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {errors.specialty_id && <div className="auth-field-error">{errors.specialty_id}</div>}
              </div>
              <div className="auth-input-group">
                <label>Degree *</label>
                <input className={`auth-input ${errors.degree ? 'error' : ''}`} name="degree" value={form.degree} onChange={handleChange} placeholder="e.g. MBBS, BDS, MD" />
                {errors.degree && <div className="auth-field-error">{errors.degree}</div>}
              </div>
            </div>

            <div className="auth-form-row">
              <div className="auth-input-group">
                <label>Current Workplace *</label>
                <input className={`auth-input ${errors.workplace ? 'error' : ''}`} name="workplace" value={form.workplace} onChange={handleChange} placeholder="e.g. Dhaka Medical College Hospital" />
                {errors.workplace && <div className="auth-field-error">{errors.workplace}</div>}
              </div>
              <div className="auth-input-group">
                <label>Visiting Fee (৳)</label>
                <input className="auth-input" name="fee" type="number" value={form.fee} onChange={handleChange} placeholder="e.g. 500" />
              </div>
            </div>

            <div className="auth-input-group">
              <label>Experience (years)</label>
              <input className="auth-input" name="experience" type="number" value={form.experience} onChange={handleChange} placeholder="e.g. 10" />
            </div>

            {/* Personal Info */}
            <div className="auth-section-title" style={{ color: '#4F46E5' }}>📋 Personal Information</div>

            <div className="auth-form-row">
              <div className="auth-input-group">
                <label>Full Name *</label>
                <input className={`auth-input ${errors.name ? 'error' : ''}`} name="name" value={form.name} onChange={handleChange} placeholder="Dr. John Doe" />
                {errors.name && <div className="auth-field-error">{errors.name}</div>}
              </div>
              <div className="auth-input-group">
                <label>Email Address *</label>
                <input className={`auth-input ${errors.email ? 'error' : ''}`} name="email" type="email" value={form.email} onChange={handleChange} placeholder="doctor@example.com" />
                {errors.email && <div className="auth-field-error">{errors.email}</div>}
              </div>
            </div>

            <div className="auth-form-row">
              <div className="auth-input-group">
                <label>Mobile Number</label>
                <input className="auth-input" value={verifiedMobile} disabled style={{ background: '#EEF2FF', color: '#4338CA', fontWeight: 700 }} />
                <span style={{ fontSize: 11, color: '#4F46E5', fontWeight: 600 }}>✓ Verified</span>
              </div>
              <div className="auth-input-group">
                <label>Occupation</label>
                <input className="auth-input" name="occupation" value={form.occupation} onChange={handleChange} placeholder="e.g. Cardiologist, Surgeon" />
              </div>
            </div>

            <div className="auth-form-row">
              <div className="auth-input-group">
                <label>Date of Birth *</label>
                <input className={`auth-input ${errors.date_of_birth ? 'error' : ''}`} name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} />
                {errors.date_of_birth && <div className="auth-field-error">{errors.date_of_birth}</div>}
                {ageInfo.display && (
                  <div className="age-badge" style={{ background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', borderColor: '#C7D2FE', color: '#4338CA' }}>
                    🎂 {ageInfo.display}
                  </div>
                )}
              </div>
              <div className="auth-input-group">
                <label>Gender *</label>
                <select className={`auth-select ${errors.gender ? 'error' : ''}`} name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">Select Gender</option>
                  {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
                {errors.gender && <div className="auth-field-error">{errors.gender}</div>}
              </div>
            </div>

            <div className="auth-input-group">
              <label>Blood Group</label>
              <select className="auth-select" name="blood_group" value={form.blood_group} onChange={handleChange}>
                <option value="">Select Blood Group</option>
                {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>

            {/* Address */}
            <div className="auth-section-title" style={{ color: '#4F46E5' }}>📍 Address Information</div>

            <div className="auth-form-row">
              <div className="auth-input-group">
                <label>Division</label>
                <select className="auth-select" value={form.division_id} onChange={handleDivisionChange} disabled={loadingDivisions}>
                  <option value="">{loadingDivisions ? 'Loading...' : 'Select Division'}</option>
                  {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="auth-input-group">
                <label>District</label>
                <select className="auth-select" value={form.district_id} onChange={handleDistrictChange} disabled={!form.division_id || loadingDistricts}>
                  <option value="">{loadingDistricts ? 'Loading...' : 'Select District'}</option>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            <div className="auth-form-row">
              <div className="auth-input-group">
                <label>Upazila</label>
                <select className="auth-select" value={form.upazila_id} onChange={handleUpazilaChange} disabled={!form.district_id || loadingUpazilas}>
                  <option value="">{loadingUpazilas ? 'Loading...' : 'Select Upazila'}</option>
                  {upazilas.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="auth-input-group">
                <label>Union</label>
                <select className="auth-select" value={form.union_id} onChange={handleUnionChange} disabled={!form.upazila_id || loadingUnions}>
                  <option value="">{loadingUnions ? 'Loading...' : 'Select Union'}</option>
                  {unions.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>

            {/* Security */}
            <div className="auth-section-title" style={{ color: '#4F46E5' }}>🔒 Security</div>

            <div className="auth-form-row">
              <div className="auth-input-group">
                <label>Password *</label>
                <PasswordInput 
                  className={`auth-input ${errors.password ? 'error' : ''}`} 
                  name="password" 
                  value={form.password} 
                  onChange={handleChange} 
                  placeholder="Min 12 chars, upper, lower, number, symbol" 
                  showStrength={true} 
                />
                {errors.password && <div className="auth-field-error">{errors.password}</div>}
              </div>
              <div className="auth-input-group">
                <label>Confirm Password *</label>
                <PasswordInput 
                  className={`auth-input ${errors.password_confirmation ? 'error' : ''}`} 
                  name="password_confirmation" 
                  value={form.password_confirmation} 
                  onChange={handleChange} 
                  placeholder="Repeat password" 
                  showStrength={false} 
                />
                {errors.password_confirmation && <div className="auth-field-error">{errors.password_confirmation}</div>}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="auth-register-footer">
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
              Already have an account?{' '}
              <span onClick={() => navigate('/login')} style={{ color: '#4F46E5', fontWeight: 700, cursor: 'pointer' }}>
                Login
              </span>
            </p>
            <button type="submit" className="auth-btn-primary doctor-theme" style={{ width: 'auto', padding: '14px 40px' }} disabled={loading}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm" /> Creating...</>
              ) : (
                '🚀 Create Doctor Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

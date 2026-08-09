// PatientRegisterPage.jsx — Full patient registration form
// Fields: Name, Email, Occupation, DOB (with age calc), Gender, Blood Group,
// Profile Pic, Division/District/Upazila/Union (cascading), Password
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import useLocations from '../../hooks/useLocations'
import { calculateAge, BLOOD_GROUPS, GENDERS } from '../../utils/dateUtils'
import PasswordInput from '../../components/common/PasswordInput'
import '../../styles/auth.css'

export default function PatientRegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { registerPatient } = useAuth()

  // Check if mobile is verified
  const verified = location.state?.verified
  const verifiedMobile = location.state?.mobile || ''

  useEffect(() => {
    if (!verified) {
      
      navigate('/register/patient/verify')
    }
  }, [verified, navigate])

  const [form, setForm] = useState({
    name: '', email: '', occupation: '', date_of_birth: '',
    gender: '', blood_group: '', mobile: verifiedMobile,
    division_id: '', district_id: '', upazila_id: '', union_id: '',
    password: '', password_confirmation: ''
  })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Cascading locations
  const {
    divisions, districts, upazilas, unions,
    selectedDivision, selectedDistrict, selectedUpazila,
    setSelectedDivision, setSelectedDistrict, setSelectedUpazila, setSelectedUnion,
    loadingDivisions, loadingDistricts, loadingUpazilas, loadingUnions
  } = useLocations()

  // Calculate age from DOB
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
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    if (!form.date_of_birth) errs.date_of_birth = 'Date of birth is required'
    if (!form.gender) errs.gender = 'Gender is required'
    if (!form.password) errs.password = 'Password is required'
    if (form.password.length < 6) errs.password = 'Minimum 6 characters'
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

    const result = await registerPatient(formData)
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
          <div style={{
            width: 48, height: 48, background: 'linear-gradient(135deg, #00A88C, #00C9A7)',
            borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', fontSize: 24
          }}>
            👤
          </div>
          <h3>Patient Registration</h3>
          <p>Fill in your details to create a patient account</p>
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

            {/* Personal Info */}
            <div className="auth-section-title">📋 Personal Information</div>

            <div className="auth-form-row">
              <div className="auth-input-group">
                <label>Full Name *</label>
                <input className={`auth-input ${errors.name ? 'error' : ''}`} name="name" value={form.name} onChange={handleChange} placeholder="Enter your full name" />
                {errors.name && <div className="auth-field-error">{errors.name}</div>}
              </div>
              <div className="auth-input-group">
                <label>Email Address *</label>
                <input className={`auth-input ${errors.email ? 'error' : ''}`} name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
                {errors.email && <div className="auth-field-error">{errors.email}</div>}
              </div>
            </div>

            <div className="auth-form-row">
              <div className="auth-input-group">
                <label>Mobile Number</label>
                <input className="auth-input" value={verifiedMobile} disabled style={{ background: '#E6F6F4', color: '#065F46', fontWeight: 700 }} />
                <span style={{ fontSize: 11, color: '#00A88C', fontWeight: 600 }}>✓ Verified</span>
              </div>
              <div className="auth-input-group">
                <label>Occupation</label>
                <input className="auth-input" name="occupation" value={form.occupation} onChange={handleChange} placeholder="e.g. Engineer, Teacher" />
              </div>
            </div>

            <div className="auth-form-row">
              <div className="auth-input-group">
                <label>Date of Birth *</label>
                <input className={`auth-input ${errors.date_of_birth ? 'error' : ''}`} name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} />
                {errors.date_of_birth && <div className="auth-field-error">{errors.date_of_birth}</div>}
                {ageInfo.display && (
                  <div className="age-badge">
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
            <div className="auth-section-title">📍 Address Information</div>

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
            <div className="auth-section-title">🔒 Security</div>

            <div className="auth-form-row">
              <div className="auth-input-group">
                <label>Password *</label>
                <PasswordInput 
                  className={`auth-input ${errors.password ? 'error' : ''}`} 
                  name="password" 
                  value={form.password} 
                  onChange={handleChange} 
                  placeholder="Min 6 characters" 
                  showStrength={false} 
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
              <span onClick={() => navigate('/login')} style={{ color: '#00A88C', fontWeight: 700, cursor: 'pointer' }}>
                Login
              </span>
            </p>
            <button type="submit" className="auth-btn-primary" style={{ width: 'auto', padding: '14px 40px' }} disabled={loading}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm" /> Creating...</>
              ) : (
                '🚀 Create Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

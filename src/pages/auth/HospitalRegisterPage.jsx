// HospitalRegisterPage.jsx — Full hospital registration form
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import useLocations from '../../hooks/useLocations'
import { toast } from 'react-toastify'
import PasswordInput from '../../components/common/PasswordInput'
import '../../styles/auth.css'

export default function HospitalRegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { registerHospital } = useAuth()

  // Check if mobile is verified
  const verified = location.state?.verified
  const verifiedMobile = location.state?.mobile || ''

  useEffect(() => {
    if (!verified) {
      toast.error('Please verify your mobile number first')
      navigate('/register/hospital/verify')
    }
  }, [verified, navigate])

  const [form, setForm] = useState({
    name: '', hospital_name: '', email: '', phone: verifiedMobile, address: '',
    division_id: '', district_id: '', upazila_id: '', union_id: '',
    password: '', password_confirmation: '',
    hospital_logo: null, hospital_banner: null
  })
  const [previews, setPreviews] = useState({ logo: null, banner: null })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Cascading locations
  const {
    divisions, districts, upazilas, unions,
    setSelectedDivision, setSelectedDistrict, setSelectedUpazila, setSelectedUnion,
    loadingDivisions, loadingDistricts, loadingUpazilas, loadingUnions
  } = useLocations()

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (files) {
      setForm(prev => ({ ...prev, [name]: files[0] }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [name === 'hospital_logo' ? 'logo' : 'banner']: reader.result }))
      }
      reader.readAsDataURL(files[0])
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
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

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Manager Name is required'
    if (!form.hospital_name.trim()) errs.hospital_name = 'Hospital Name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    if (!form.phone.trim()) errs.phone = 'Phone number is required'
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

    const result = await registerHospital(formData)
    setLoading(false)

    if (result.success) {
      toast.success('Hospital registered successfully!')
      navigate('/admin')
    } else {
      if (result.errors) setErrors(result.errors)
      toast.error(result.message)
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
            width: 48, height: 48, background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
            borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', fontSize: 24
          }}>
            🏥
          </div>
          <h3>Hospital Registration</h3>
          <p>Register your hospital to manage operations</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="auth-register-body">
            
            {/* Hospital Photos */}
            <div className="auth-section-title">🖼️ Hospital Visuals</div>
            <div className="auth-form-row" style={{ marginBottom: 32 }}>
              <div className="auth-input-group" style={{ textAlign: 'center' }}>
                <label>Hospital Logo</label>
                <div className="auth-photo-upload" style={{ width: 120, height: 120 }}>
                  {previews.logo ? <img src={previews.logo} alt="Logo" /> : (
                    <div className="auth-photo-placeholder">
                      <span>Logo</span>
                    </div>
                  )}
                  <input type="file" name="hospital_logo" accept="image/*" onChange={handleChange} />
                </div>
              </div>
              <div className="auth-input-group" style={{ textAlign: 'center', flex: 2 }}>
                <label>Hospital Banner</label>
                <div className="auth-photo-upload" style={{ width: '100%', height: 120, borderRadius: 16 }}>
                  {previews.banner ? <img src={previews.banner} alt="Banner" style={{ objectFit: 'cover' }} /> : (
                    <div className="auth-photo-placeholder">
                      <span>Click to upload hospital banner</span>
                    </div>
                  )}
                  <input type="file" name="hospital_banner" accept="image/*" onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Hospital & Contact Info */}
            <div className="auth-section-title">🏥 Hospital Information</div>

            <div className="auth-form-row">
              <div className="auth-input-group">
                <label>Hospital Name *</label>
                <input className={`auth-input ${errors.hospital_name ? 'error' : ''}`} name="hospital_name" value={form.hospital_name} onChange={handleChange} placeholder="Enter hospital name" />
                {errors.hospital_name && <div className="auth-field-error">{errors.hospital_name}</div>}
              </div>
              <div className="auth-input-group">
                <label>Manager Full Name *</label>
                <input className={`auth-input ${errors.name ? 'error' : ''}`} name="name" value={form.name} onChange={handleChange} placeholder="Enter manager name" />
                {errors.name && <div className="auth-field-error">{errors.name}</div>}
              </div>
            </div>

            <div className="auth-form-row">
              <div className="auth-input-group">
                <label>Official Email *</label>
                <input className={`auth-input ${errors.email ? 'error' : ''}`} name="email" type="email" value={form.email} onChange={handleChange} placeholder="hospital@example.com" />
                {errors.email && <div className="auth-field-error">{errors.email}</div>}
              </div>
              <div className="auth-input-group">
                <label>Phone Number (Verified)</label>
                <input className="auth-input" value={verifiedMobile} disabled style={{ background: '#f0f9ff', color: '#0284c7', fontWeight: 700 }} />
                <span style={{ fontSize: 11, color: '#0284c7', fontWeight: 600 }}>✓ Verified</span>
              </div>
            </div>

            <div className="auth-input-group">
              <label>Detailed Address</label>
              <textarea className="auth-input" name="address" value={form.address} onChange={handleChange} placeholder="Full hospital address" rows={3}></textarea>
            </div>

            {/* Address */}
            <div className="auth-section-title">📍 Location Details</div>

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
              <span onClick={() => navigate('/login')} style={{ color: '#0284c7', fontWeight: 700, cursor: 'pointer' }}>
                Login
              </span>
            </p>
            <button type="submit" className="auth-btn-primary" style={{ width: 'auto', padding: '14px 40px', background: '#0284c7' }} disabled={loading}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm" /> Registering...</>
              ) : (
                '🚀 Register Hospital'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

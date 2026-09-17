// MedicineFormPage.jsx — Add/Edit medicine form with live preview
import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { getMedicine, createMedicine, updateMedicine } from '../../../api/adminApi'
import { getErrorMessage } from '../../../utils/errorHelper'

const DOSAGE_TYPES = [
  { value: 'TAB', label: 'TAB (Tablet)', display: 'Tablet' },
  { value: 'CAP', label: 'CAP (Capsule)', display: 'Capsule' },
  { value: 'SYP', label: 'SYP (Syrup)', display: 'Syrup' },
  { value: 'DROP', label: 'DROP (Drop)', display: 'Drop' },
  { value: 'INJ', label: 'INJ (Injection)', display: 'Injection' },
  { value: 'SUSP', label: 'SUSP (Suspension)', display: 'Suspension' },
  { value: 'SUPP', label: 'SUPP (Suppository)', display: 'Suppository' },
]

const DOSAGE_DISPLAY_MAP = {
  TAB: 'Tablet',
  TABLET: 'Tablet',
  CAP: 'Capsule',
  CAPSULE: 'Capsule',
  SYP: 'Syrup',
  SYRUP: 'Syrup',
  DROP: 'Drop',
  DROPS: 'Drop',
  INJ: 'Injection',
  INJECTION: 'Injection',
  SUSP: 'Suspension',
  SUSPENSION: 'Suspension',
  SUPP: 'Suppository',
  SUPPOSITORY: 'Suppository',
}

const getDosageDisplay = (type) => {
  if (!type) return ''
  const upper = String(type).trim().toUpperCase()
  return DOSAGE_DISPLAY_MAP[upper] || type
}

export default function MedicineFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission, isAdmin, loading: authLoading } = useAuth()
  const isEdit = !!id

  useEffect(() => {
    if (!authLoading) {
      const canCreate = !isEdit && (isAdmin || hasPermission('medicine.create'))
      const canUpdate = isEdit && (isAdmin || hasPermission('medicine.update'))
      
      if (!isAdmin && !canCreate && !canUpdate) {
        navigate('/admin/medicines')
      }
    }
  }, [authLoading, isAdmin, hasPermission, isEdit, navigate])

  const [form, setForm] = useState({
    medicine_name: '',
    generic_name: '',
    strength: '',
    dosage_type: '',
    company_name: '',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEdit) loadMedicine()
  }, [id])

  const loadMedicine = async () => {
    setLoading(true)
    try {
      const res = await getMedicine(id)
      const med = res.data?.data || res.data
      setForm({
        medicine_name: med.medicine_name || '',
        generic_name: med.generic_name || '',
        strength: med.strength || '',
        dosage_type: med.dosage_type || '',
        company_name: med.company_name || '',
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null })
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.medicine_name.trim()) errs.medicine_name = 'Medicine name is required'
    if (!form.dosage_type) errs.dosage_type = 'Dosage type is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      if (isEdit) {
        await updateMedicine(id, form)
      } else {
        await createMedicine(form)
      }
      setTimeout(() => navigate('/admin/medicines'), 600)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /> Loading...</div>

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">{isEdit ? '✏️ Edit Medicine' : '💊 Add Medicine'}</h2>
          <p className="admin-page-subtitle">{isEdit ? 'Update medicine details' : 'Add a new medicine to the database'}</p>
        </div>
        <Link to="/admin/medicines" className="admin-btn admin-btn-outline">← Back</Link>
      </div>

      <div className="admin-card">
        <div className="admin-card-body" style={{ padding: 32 }}>
          {/* Live Preview — Styled like Image 1: Name [Badge] Strength */}
          {(form.medicine_name || form.dosage_type || form.strength) && (
            <div style={{
              background: 'linear-gradient(135deg, #E6F6F4, #F0F7FF)',
              border: '1px solid #B2DFDB',
              borderRadius: 14,
              padding: '16px 24px',
              marginBottom: 28,
              display: 'flex',
              alignItems: 'center',
              gap: 14
            }}>
              <span style={{ fontSize: 24 }}>💊</span>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Preview — Medicine View
                </span>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>
                    {form.medicine_name || (form.generic_name ? form.generic_name : 'Medicine Name')}
                  </span>
                  {form.dosage_type && (
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      background: '#F1F5F9',
                      color: '#475569',
                      padding: '2px 8px',
                      borderRadius: 6,
                      border: '1px solid #E2E8F0',
                      lineHeight: '18px',
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}>
                      {getDosageDisplay(form.dosage_type)}
                    </span>
                  )}
                  {form.strength && (
                    <span style={{ fontSize: 15, fontWeight: 500, color: '#64748B' }}>
                      {form.strength}
                    </span>
                  )}
                </div>
                {(form.generic_name || form.company_name) && (
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                    {form.generic_name && form.medicine_name && (
                      <span>Generic: <strong style={{ color: '#334155' }}>{form.generic_name}</strong></span>
                    )}
                    {form.generic_name && form.medicine_name && form.company_name && <span> • </span>}
                    {form.company_name && (
                      <span>Company: <strong style={{ color: '#334155' }}>{form.company_name}</strong></span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
            {/* Medicine Name */}
            <div className="admin-form-group">
              <label className="admin-form-label">Medicine Name *</label>
              <input
                className={`admin-form-input ${errors.medicine_name ? 'border-danger' : ''}`}
                name="medicine_name"
                value={form.medicine_name}
                onChange={handleChange}
                placeholder="e.g., Napa"
              />
              {errors.medicine_name && <div className="admin-form-error">{errors.medicine_name}</div>}
            </div>

            {/* Generic Name */}
            <div className="admin-form-group">
              <label className="admin-form-label">Generic Name (Group Name)</label>
              <input
                className="admin-form-input"
                name="generic_name"
                value={form.generic_name}
                onChange={handleChange}
                placeholder="e.g., Paracetamol"
              />
            </div>

            <div className="admin-form-row">
              {/* Dosage Type */}
              <div className="admin-form-group">
                <label className="admin-form-label">Dosage Type *</label>
                <select
                  className={`admin-form-select ${errors.dosage_type ? 'border-danger' : ''}`}
                  name="dosage_type"
                  value={form.dosage_type}
                  onChange={handleChange}
                >
                  <option value="">Select type</option>
                  {DOSAGE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                  {form.dosage_type && !DOSAGE_TYPES.some(t => t.value === form.dosage_type) && (
                    <option value={form.dosage_type}>{form.dosage_type}</option>
                  )}
                </select>
                {errors.dosage_type && <div className="admin-form-error">{errors.dosage_type}</div>}
              </div>

              {/* Strength */}
              <div className="admin-form-group">
                <label className="admin-form-label">Strength (Power)</label>
                <input
                  className="admin-form-input"
                  name="strength"
                  value={form.strength}
                  onChange={handleChange}
                  placeholder="e.g., 500mg"
                />
              </div>
            </div>

            {/* Company Name */}
            <div className="admin-form-group">
              <label className="admin-form-label">Company Name</label>
              <input
                className="admin-form-input"
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                placeholder="e.g., Beximco"
              />
            </div>

            <div className="admin-form-actions">
              <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                {saving ? 'Saving...' : isEdit ? 'Update Medicine' : '✅ Save Medicine'}
              </button>
              <Link to="/admin/medicines" className="admin-btn admin-btn-outline">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

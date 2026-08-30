// SpecialtyFormPage.jsx — Premium Specialty Create/Edit Form
import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAdminSpecialtyDetail, useAdminSpecialtyMutations } from '../../../hooks/admin/useAdminSpecialties'
import { getErrorMessage } from '../../../utils/errorHelper'

export default function SpecialtyFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState({ name: '', slug: '' })
  const [errors, setErrors] = useState({})

  // Enterprise TanStack Query Hooks
  const { specialty: fetchedSpecialty, isLoading: loading } = useAdminSpecialtyDetail(isEdit ? id : null)
  const { createSpecialty: saveNewSpecialty, updateSpecialty: saveUpdatedSpecialty, isCreating, isUpdating } = useAdminSpecialtyMutations()
  const saving = isCreating || isUpdating

  useEffect(() => {
    if (fetchedSpecialty) {
      setForm({
        name: fetchedSpecialty.name || '',
        slug: fetchedSpecialty.slug || '',
      })
    }
  }, [fetchedSpecialty])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) {
      errs.name = 'Specialty name is required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Specialty name is required')
      return
    }

    setErrors({})
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
      }

      if (isEdit) {
        const res = await saveUpdatedSpecialty({ id, data: payload })
        toast.success(res?.data?.message || 'Specialty updated successfully')
      } else {
        const res = await saveNewSpecialty(payload)
        toast.success(res?.data?.message || 'Specialty created successfully')
      }
      navigate('/admin/specialties')
    } catch (err) {
      const backendErrors = err.response?.data?.errors
      if (backendErrors && typeof backendErrors === 'object') {
        const formattedErrors = {}
        Object.keys(backendErrors).forEach((key) => {
          const val = backendErrors[key]
          formattedErrors[key] = Array.isArray(val) ? val[0] : val
        })
        setErrors(formattedErrors)
        const firstError = Object.values(formattedErrors)[0]
        if (firstError) toast.error(firstError, { id: 'specialty-form-validation' })
      } else {
        const status = err.response?.status
        const msg = err.response?.data?.message || err.response?.data?.error
        if (status === 409) {
          const dupMsg = msg || 'Specialty already exists.'
          setErrors({ name: dupMsg })
        }
        console.error('Failed to save specialty', err)
      }
    }
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /> Preparing...</div>

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">{isEdit ? '✏️ Edit Specialty' : '🏷️ New Specialty'}</h2>
          <p className="admin-page-subtitle">Define professional medical categories for doctor indexing</p>
        </div>
        <Link to="/admin/specialties" className="admin-btn admin-btn-outline" style={{ borderRadius: 12 }}>← Back</Link>
      </div>

      <div className="admin-card" style={{ borderTop: '4px solid #0EA5E9' }}>
        <div className="admin-card-body">
          <form className="admin-form" onSubmit={handleSubmit}>
            
            <div className="admin-form-group">
              <label className="admin-form-label">Specialty Name *</label>
              <input 
                className={`admin-form-input ${errors.name ? 'border-red-500' : ''}`} 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                placeholder="e.g. Pediatrics, Cardiology, etc."
                style={{ height: 48, fontSize: 15, fontWeight: 500, borderColor: errors.name ? '#EF4444' : undefined }}
                autoFocus
              />
              {errors.name && <div className="admin-form-error" style={{ color: '#EF4444', marginTop: 4 }}>{errors.name}</div>}
            </div>

            <div className="admin-form-group" style={{ marginTop: 24 }}>
              <label className="admin-form-label">URL Slug (Auto-generated if empty)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 16, top: 13, color: '#94A3B8', fontSize: 14 }}>/</span>
                <input 
                  className={`admin-form-input ${errors.slug ? 'border-red-500' : ''}`} 
                  name="slug" 
                  value={form.slug} 
                  onChange={handleChange} 
                  placeholder="specialty-url-slug"
                  style={{ height: 48, paddingLeft: 30, fontSize: 14, color: '#64748B', borderColor: errors.slug ? '#EF4444' : undefined }}
                />
              </div>
              {errors.slug && <div className="admin-form-error" style={{ color: '#EF4444', marginTop: 4 }}>{errors.slug}</div>}
              <p style={{ marginTop: 8, fontSize: 12, color: '#94A3B8' }}>
                Use lowercase and hyphens only. Example: <code>cardiology-specialist</code>
              </p>
            </div>

            <div className="admin-form-actions" style={{ marginTop: 32 }}>
              <button 
                type="submit" 
                className="admin-btn admin-btn-primary" 
                disabled={saving}
                style={{
                  background: '#0EA5E9',
                  padding: '14px 40px',
                  fontSize: 16,
                  fontWeight: 800,
                  borderRadius: 12,
                  boxShadow: '0 10px 15px -3px rgba(14, 165, 233, 0.2)',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Processing...' : isEdit ? '💾 Update Specialty' : '🚀 Create Specialty'}
              </button>
              <Link to="/admin/specialties" className="admin-btn admin-btn-outline" style={{ padding: '14px 24px', borderRadius: 12 }}>Cancel</Link>
            </div>
          </form>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-form-input:focus { border-color: #0EA5E9; box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1); }
      `}} />
    </div>
  )
}

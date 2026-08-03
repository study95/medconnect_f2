// SpecialtyFormPage.jsx — Premium Specialty Create/Edit Form
import { toast } from 'react-toastify'
import { getErrorMessage } from '../../../utils/errorHelper'
import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getSpecialty, createSpecialty, updateSpecialty } from '../../../api/adminApi'

export default function SpecialtyFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState({ name: '', slug: '' })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEdit) loadSpecialty()
  }, [id])

  const loadSpecialty = async () => {
    setLoading(true)
    try {
      const res = await getSpecialty(id)
      const d = res.data?.data || res.data
      if (!d) throw new Error('Specialty not found')
      setForm({ name: d.name || '', slug: d.slug || '' })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load specialty'))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setErrors({ name: 'Specialty name is required' })
      return
    }

    setSaving(true)
    try {
      if (isEdit) {
        await updateSpecialty(id, form)
        toast.success('Specialty updated successfully!')
      } else {
        await createSpecialty(form)
        toast.success('Specialty created successfully!')
      }
      navigate('/admin/specialties')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save specialty'))
    } finally {
      setSaving(false)
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
                className="admin-form-input" 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                placeholder="e.g. Pediatrics, Cardiology, etc."
                style={{ height: 48, fontSize: 15, fontWeight: 500 }}
              />
              {errors.name && <div className="admin-form-error">{errors.name}</div>}
            </div>

            <div className="admin-form-group" style={{ marginTop: 24 }}>
              <label className="admin-form-label">URL Slug (Auto-generated if empty)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 16, top: 13, color: '#94A3B8', fontSize: 14 }}>/</span>
                <input 
                  className="admin-form-input" 
                  name="slug" 
                  value={form.slug} 
                  onChange={handleChange} 
                  placeholder="specialty-url-slug"
                  style={{ height: 48, paddingLeft: 30, fontSize: 14, color: '#64748B' }}
                />
              </div>
              <p style={{ marginTop: 8, fontSize: 12, color: '#94A3B8' }}>
                Use lowercase and hyphens only. Example: <code>cardiology-specialist</code>
              </p>
            </div>

            <div className="admin-form-actions" style={{ marginTop: 32 }}>
              <button 
                type="submit" 
                className="admin-btn admin-btn-primary" 
                disabled={saving}
                style={{ background: '#0EA5E9', padding: '14px 40px', fontSize: 16, fontWeight: 800, borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(14, 165, 233, 0.2)' }}
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

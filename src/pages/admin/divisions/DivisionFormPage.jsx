// DivisionFormPage.jsx — Premium Division Create/Edit Form
import { getErrorMessage } from '../../../utils/errorHelper'
import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getDivision, createDivision, updateDivision } from '../../../api/adminApi'

export default function DivisionFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState({ name: '', bangla_name: '' })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEdit) loadDivision()
  }, [id])

  const loadDivision = async () => {
    setLoading(true)
    try {
      const res = await getDivision(id)
      const d = res.data?.data || res.data
      if (!d) throw new Error('Division not found')
      setForm({ name: d.name || '', bangla_name: d.bangla_name || '' })
    } catch (err) {
} finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setErrors({ name: 'Division name is required' })
      return
    }

    setSaving(true)
    try {
      if (isEdit) {
        await updateDivision(id, form)
        
      } else {
        await createDivision(form)
        
      }
      navigate('/admin/divisions')
    } catch (err) {
} finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /> Loading...</div>

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">{isEdit ? '✏️ Edit Division' : '🏢 Add New Division'}</h2>
          <p className="admin-page-subtitle">Configure top-level administrative territories for national health coverage</p>
        </div>
        <Link to="/admin/divisions" className="admin-btn admin-btn-outline" style={{ borderRadius: 12 }}>← Back</Link>
      </div>

      <div className="admin-card" style={{ borderTop: '4px solid #EF4444' }}>
        <div className="admin-card-body">
          <form className="admin-form" onSubmit={handleSubmit}>
            
            <div className="admin-form-group">
              <label className="admin-form-label">Division Name (English) *</label>
              <input 
                className="admin-form-input" 
                name="name" 
                value={form.name} 
                onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({}) }} 
                placeholder="e.g. Dhaka, Chittagong, etc."
                style={{ height: 48, fontSize: 15, fontWeight: 500 }}
              />
              {errors.name && <div className="admin-form-error">{errors.name}</div>}
              <p style={{ marginTop: 8, fontSize: 12, color: '#94A3B8' }}>
                This will be used as the primary identifier in location dropdowns.
              </p>
            </div>

            <div className="admin-form-group" style={{ marginTop: 20 }}>
              <label className="admin-form-label">Division Name (Bangla)</label>
              <input 
                className="admin-form-input" 
                name="bangla_name" 
                value={form.bangla_name} 
                onChange={(e) => { setForm({ ...form, bangla_name: e.target.value }); setErrors({}) }} 
                placeholder="e.g. ঢাকা, চট্টগ্রাম, etc."
                style={{ height: 48, fontSize: 15, fontWeight: 500 }}
              />
              <p style={{ marginTop: 8, fontSize: 12, color: '#94A3B8' }}>
                Localized name for Bangla interface.
              </p>
            </div>

            <div className="admin-form-actions" style={{ marginTop: 32 }}>
              <button 
                type="submit" 
                className="admin-btn admin-btn-primary" 
                disabled={saving}
                style={{ background: '#EF4444', padding: '14px 40px', fontSize: 16, fontWeight: 800, borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.2)' }}
              >
                {saving ? 'Processing...' : isEdit ? '💾 Update Division' : '🚀 Create Division'}
              </button>
              <Link to="/admin/divisions" className="admin-btn admin-btn-outline" style={{ padding: '14px 24px', borderRadius: 12 }}>Cancel</Link>
            </div>
          </form>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-form-input:focus { border-color: #EF4444; box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1); }
      `}} />
    </div>
  )
}

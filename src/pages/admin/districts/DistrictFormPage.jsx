// DistrictFormPage.jsx — Premium District Create/Edit Form
import { getErrorMessage } from '../../../utils/errorHelper'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getDistrict, createDistrict, updateDistrict, getDivisions } from '../../../api/adminApi'

// Premium Searchable Select Component
function SearchableSelect({ label, options, value, onChange, placeholder, disabled = false, error = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.id.toString() === value.toString())
  const filteredOptions = options
    .filter(opt => opt.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  return (
    <div className="admin-form-group" ref={dropdownRef} style={{ position: 'relative', opacity: disabled ? 0.6 : 1 }}>
      <label className="admin-form-label">{label}</label>
      <div 
        className={`admin-form-input ${error ? 'border-red-500' : ''}`}
        style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          cursor: disabled ? 'not-allowed' : 'pointer', background: 'white', 
          height: 48, padding: '0 16px', borderRadius: 12, border: '1px solid #E2E8F0',
          fontSize: 14, fontWeight: 500, transition: 'all 0.2s'
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span style={{ color: selectedOption ? '#1E293B' : '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? (selectedOption.bangla_name || selectedOption.name) : placeholder}
        </span>
        <span style={{ fontSize: 10, color: '#94A3B8' }}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {error && <div className="admin-form-error" style={{ marginTop: 4 }}>{error}</div>}

      {isOpen && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, marginTop: 8,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden', zIndex: 1000
        }}>
          <div style={{ padding: '12px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
            <input 
              type="text" 
              autoFocus
              placeholder="Search..." 
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', outline: 'none', fontSize: 13 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No results</div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt.id} 
                  style={{ 
                    padding: '10px 16px', fontSize: 14, cursor: 'pointer', 
                    background: value.toString() === opt.id.toString() ? '#F1F5F9' : 'transparent'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#F8FAFC'}
                  onMouseLeave={(e) => e.target.style.background = value.toString() === opt.id.toString() ? '#F1F5F9' : 'transparent'}
                  onClick={() => {
                    onChange(opt.id.toString())
                    setIsOpen(false)
                    setSearch('')
                  }}
                >
                  {opt.bangla_name || opt.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DistrictFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState({ name: '', bangla_name: '', division_id: '' })
  const [divisions, setDivisions] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadDivisions()
    if (isEdit) loadDistrict()
  }, [id])

  const loadDivisions = async () => {
    try {
      const res = await getDivisions()
      setDivisions(res.data?.data || [])
    } catch (err) {
      console.error('Failed to load divisions:', err)
    }
  }

  const loadDistrict = async () => {
    setLoading(true)
    try {
      const res = await getDistrict(id)
      const d = res.data?.data || res.data
      if (!d) throw new Error('District not found')
      setForm({
        name: d.name || '',
        bangla_name: d.bangla_name || '',
        division_id: d.division_id || ''
      })
    } catch (err) {
} finally {
      setLoading(false)
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'District name is required'
    if (!form.division_id) errs.division_id = 'Division is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      if (isEdit) {
        await updateDistrict(id, form)
        
      } else {
        await createDistrict(form)
        
      }
      navigate('/admin/districts')
    } catch (err) {
} finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /> Loading Data...</div>

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">{isEdit ? '✏️ Edit District' : '🏙️ Add New District'}</h2>
          <p className="admin-page-subtitle">Define secondary administrative boundaries for clinical mapping</p>
        </div>
        <Link to="/admin/districts" className="admin-btn admin-btn-outline" style={{ borderRadius: 12 }}>← Back</Link>
      </div>

      <div className="admin-card" style={{ borderTop: '4px solid #F59E0B', overflow: 'visible' }}>
        <div className="admin-card-body" style={{ overflow: 'visible' }}>
          <form className="admin-form" onSubmit={handleSubmit}>
            
            <div className="admin-form-group">
              <label className="admin-form-label">District Name (English) *</label>
              <input 
                className="admin-form-input" 
                name="name" 
                value={form.name} 
                onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: '' }) }} 
                placeholder="e.g. Gazipur"
                style={{ height: 48 }}
              />
              {errors.name && <div className="admin-form-error">{errors.name}</div>}
            </div>

            <div className="admin-form-group" style={{ marginTop: 20 }}>
              <label className="admin-form-label">District Name (Bangla)</label>
              <input 
                className="admin-form-input" 
                name="bangla_name" 
                value={form.bangla_name} 
                onChange={(e) => { setForm({ ...form, bangla_name: e.target.value }); setErrors({ ...errors, bangla_name: '' }) }} 
                placeholder="e.g. গাজীপুর"
                style={{ height: 48 }}
              />
            </div>

            <div style={{ background: '#FFFBEB', padding: 20, borderRadius: 16, border: '1px solid #FEF3C7', margin: '24px 0' }}>
              <SearchableSelect 
                label="Parent Division *" 
                options={divisions} 
                value={form.division_id} 
                onChange={(val) => {
                  setForm({ ...form, division_id: val })
                  setErrors({ ...errors, division_id: '' })
                }} 
                placeholder="Select parent division..." 
                error={errors.division_id}
              />
            </div>

            <div className="admin-form-actions" style={{ marginTop: 32 }}>
              <button 
                type="submit" 
                className="admin-btn admin-btn-primary" 
                disabled={saving}
                style={{ background: '#F59E0B', padding: '14px 40px', fontSize: 16, fontWeight: 800, borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.2)' }}
              >
                {saving ? 'Processing...' : isEdit ? '💾 Update District' : '🚀 Create District'}
              </button>
              <Link to="/admin/districts" className="admin-btn admin-btn-outline" style={{ padding: '14px 24px', borderRadius: 12 }}>Cancel</Link>
            </div>
          </form>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-form-input:focus { border-color: #F59E0B; box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1); }
      `}} />
    </div>
  )
}

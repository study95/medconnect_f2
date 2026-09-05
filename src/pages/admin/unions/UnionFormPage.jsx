import { getErrorMessage } from '../../../utils/errorHelper'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { 
  useUnionDetail, 
  useDivisions, 
  useDistricts, 
  useUpazilas, 
  useAdminLocationMutations 
} from '../../../hooks/admin/useAdminLocations'

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

  const selectedOption = (options || []).find(opt => opt && String(opt.id) === String(value || ''))
  const filteredOptions = (options || [])
    .filter(opt => opt && opt.name?.toLowerCase().includes(search.toLowerCase()))
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
          {selectedOption ? selectedOption.name : placeholder}
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
                    background: String(value || '') === String(opt.id) ? '#F1F5F9' : 'transparent'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#F8FAFC'}
                  onMouseLeave={(e) => e.target.style.background = String(value || '') === String(opt.id) ? '#F1F5F9' : 'transparent'}
                  onClick={() => {
                    onChange(opt.id.toString())
                    setIsOpen(false)
                    setSearch('')
                  }}
                >
                  {opt.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function UnionFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState({ 
    name: '', 
    division_id: '', 
    district_id: '',
    upazila_id: '' 
  })
  
  const [errors, setErrors] = useState({})

  // Enterprise TanStack Query Hooks
  const { divisions } = useDivisions()
  const { districts = [] } = useDistricts(form.division_id || null)
  const { upazilas = [] } = useUpazilas(form.district_id || null)
  const { union, isLoading: loading } = useUnionDetail(id)
  const {
    createUnion: saveCreateUnion,
    updateUnion: saveUpdateUnion,
    isCreatingUnion,
    isUpdatingUnion,
  } = useAdminLocationMutations()

  const saving = isCreatingUnion || isUpdatingUnion

  useEffect(() => {
    if (union) {
      const upazila = union.upazila || {}
      const district = upazila.district || {}
      setForm({
        name: union.name || '',
        division_id: district.division_id || '',
        district_id: upazila.district_id || '',
        upazila_id: union.upazila_id || '',
      })
    }
  }, [union])

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Union name is required'
    if (!form.division_id) errs.division_id = 'Division is required'
    if (!form.district_id) errs.district_id = 'District is required'
    if (!form.upazila_id) errs.upazila_id = 'Upazila is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      if (!form.name.trim()) toast.error('Union name is required')
      else if (!form.division_id) toast.error('Division is required')
      else if (!form.district_id) toast.error('District is required')
      else if (!form.upazila_id) toast.error('Upazila is required')
      return
    }

    try {
      const payload = {
        name: form.name.trim(),
        upazila_id: form.upazila_id
      }

      if (isEdit) {
        const res = await saveUpdateUnion(id, payload)
        toast.success(res?.data?.message || 'Union updated successfully')
      } else {
        const res = await saveCreateUnion(payload)
        toast.success(res?.data?.message || 'Union created successfully')
      }
      navigate('/admin/unions')
    } catch (err) {
      console.error('Failed to save union', err)
      toast.error(getErrorMessage(err, 'Failed to save union'))
    }
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /> Initializing Form...</div>

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 160 }}>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">{isEdit ? '✏️ Edit Union' : '🏘️ Add New Union'}</h2>
          <p className="admin-page-subtitle">Configure rural administrative units for village-level targeting</p>
        </div>
        <Link to="/admin/unions" className="admin-btn admin-btn-outline" style={{ borderRadius: 12 }}>← Back to List</Link>
      </div>

      <div className="admin-card" style={{ borderTop: '4px solid #4F46E5', overflow: 'visible' }}>
        <div className="admin-card-body" style={{ overflow: 'visible' }}>
          <form className="admin-form" onSubmit={handleSubmit}>
            
            <div className="admin-form-group" style={{ marginBottom: 24 }}>
              <label className="admin-form-label">Union Name *</label>
              <input 
                className="admin-form-input" 
                name="name" 
                value={form.name} 
                onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: '' }) }} 
                placeholder="e.g. Ashulia"
                style={{ height: 48 }}
              />
              {errors.name && <div className="admin-form-error">{errors.name}</div>}
            </div>

            <div style={{ background: '#F5F3FF', padding: 24, borderRadius: 16, border: '1px solid #DDD6FE', marginBottom: 24 }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: 14, fontWeight: 800, color: '#4338CA', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Geographical Hierarchy
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                <SearchableSelect 
                  label="Division *" 
                  options={divisions} 
                  value={form.division_id} 
                  onChange={(val) => {
                    setForm({ ...form, division_id: val, district_id: '', upazila_id: '' })
                    setErrors({ ...errors, division_id: '' })
                  }} 
                  placeholder="Select" 
                  error={errors.division_id}
                />

                <SearchableSelect 
                  label="District *" 
                  options={districts} 
                  value={form.district_id} 
                  onChange={(val) => {
                    setForm({ ...form, district_id: val, upazila_id: '' })
                    setErrors({ ...errors, district_id: '' })
                  }} 
                  placeholder="Select" 
                  disabled={!form.division_id}
                  error={errors.district_id}
                />

                <SearchableSelect 
                  label="Upazila *" 
                  options={upazilas} 
                  value={form.upazila_id} 
                  onChange={(val) => {
                    setForm({ ...form, upazila_id: val })
                    setErrors({ ...errors, upazila_id: '' })
                  }} 
                  placeholder="Select" 
                  disabled={!form.district_id}
                  error={errors.upazila_id}
                />
              </div>
              <p style={{ margin: '12px 0 0', fontSize: 12, color: '#5B21B6', opacity: 0.8 }}>
                Select parent regions to filter the child dropdowns.
              </p>
            </div>

            <div className="admin-form-actions" style={{ marginTop: 32 }}>
              <button 
                type="submit" 
                className="admin-btn admin-btn-primary" 
                disabled={saving}
                style={{ background: '#4F46E5', padding: '14px 40px', fontSize: 16, fontWeight: 800, borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.2)' }}
              >
                {saving ? 'Processing...' : isEdit ? '💾 Update Union' : '🚀 Create Union'}
              </button>
              <Link to="/admin/unions" className="admin-btn admin-btn-outline" style={{ padding: '14px 24px', borderRadius: 12 }}>Cancel</Link>
            </div>
          </form>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-form-input:focus { border-color: #4F46E5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
      `}} />
    </div>
  )
}

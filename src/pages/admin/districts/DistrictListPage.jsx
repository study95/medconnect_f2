// DistrictListPage.jsx — Premium District Management (Admin)
import { getErrorMessage } from '../../../utils/errorHelper'
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getDistricts, getDivisions, deleteDistrict } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'

// Premium Searchable Select for Filtering
function SearchableSelect({ label, options, value, onChange, placeholder, disabled = false }) {
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
    <div className="searchable-select-container" ref={dropdownRef} style={{ position: 'relative', flex: '1 1 220px', opacity: disabled ? 0.6 : 1 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div 
        className="status-select" 
        style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          cursor: disabled ? 'not-allowed' : 'pointer', background: 'white', 
          height: 42, padding: '0 14px', border: '1px solid #E2E8F0', borderRadius: 10, 
          fontSize: 13, fontWeight: 500, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span style={{ color: selectedOption ? '#1E293B' : '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? (selectedOption.bangla_name || selectedOption.name) : placeholder}
        </span>
        <span style={{ fontSize: 10, color: '#94A3B8' }}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, marginTop: 6,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden', zIndex: 1000
        }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
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
            <div 
              style={{ padding: '10px 14px', fontSize: 12, cursor: 'pointer', color: '#F59E0B', fontWeight: 700, textAlign: 'center', background: '#FFFBEB' }}
              onClick={() => { onChange(''); setIsOpen(false); setSearch('') }}
            >
              ✕ Clear Filter
            </div>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>No matching results</div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt.id} 
                  style={{ 
                    padding: '10px 14px', fontSize: 13, cursor: 'pointer', 
                    background: value.toString() === opt.id.toString() ? '#F1F5F9' : 'transparent',
                    borderBottom: '1px solid #F8FAFC'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#F8FAFC'}
                  onMouseLeave={(e) => e.target.style.background = value.toString() === opt.id.toString() ? '#F1F5F9' : 'transparent'}
                  onClick={() => {
                    onChange(opt.id.toString())
                    setIsOpen(false)
                    setSearch('')
                  }}
                >
                  <div style={{ fontWeight: value.toString() === opt.id.toString() ? 700 : 500, color: '#334155' }}>
                    {opt.bangla_name || opt.name}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DistrictListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [divisions, setDivisions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [divisionFilter, setDivisionFilter] = useState('')
  
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadDivisions()
  }, [])

  useEffect(() => {
    fetchDistricts()
  }, [])

  const loadDivisions = async () => {
    try {
      const res = await getDivisions()
      setDivisions(res.data?.data || [])
    } catch {}
  }

  const fetchDistricts = async () => {
    try {
      setLoading(true)
      const params = divisionFilter ? { division_id: divisionFilter } : {}
      const res = await getDistricts(params)
      setItems(res.data.data || res.data || [])
    } catch (err) {
} finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteDistrict(deleteTarget.id)
      setItems(items.filter(i => i.id !== deleteTarget.id))
      
    } catch (err) {
} finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const filtered = items.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">
            <span style={{ marginRight: 12 }}>🏙️</span>
            District Management
          </h2>
          <p className="admin-page-subtitle">Configure major regional boundaries for hospital and clinic networks</p>
        </div>
        <Link to="/admin/districts/create" className="admin-btn admin-btn-primary" style={{ background: '#F59E0B', borderRadius: 12 }}>
          + Add New District
        </Link>
      </div>

      <div className="admin-card" style={{ marginBottom: 28, borderTop: '4px solid #F59E0B', overflow: 'visible' }}>
        <div className="admin-card-body" style={{ overflow: 'visible' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, alignItems: 'flex-end' }}>
            
            <div style={{ flex: '1 1 300px' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Search</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="status-select" 
                  placeholder="District name..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: '100%', height: 42, paddingLeft: 40, border: '1px solid #E2E8F0', borderRadius: 10 }}
                />
                <span style={{ position: 'absolute', left: 14, top: 11, fontSize: 16 }}>🔍</span>
              </div>
            </div>

            <SearchableSelect 
              label="Division Filter"
              placeholder="All Divisions"
              options={divisions}
              value={divisionFilter}
              onChange={setDivisionFilter}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="admin-btn admin-btn-primary" onClick={fetchDistricts} style={{ height: 42, background: '#F59E0B', padding: '0 24px', borderRadius: 10 }}>Refresh</button>
              {(search || divisionFilter) && (
                <button 
                  className="admin-btn admin-btn-outline" 
                  onClick={() => { setSearch(''); setDivisionFilter('') }} 
                  style={{ height: 42, color: '#EF4444', borderColor: '#FEE2E2', background: '#FEF2F2', borderRadius: 10 }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header" style={{ background: '#F8FAFC' }}>
          <h3 className="admin-card-title">All Registered Districts</h3>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', background: '#E2E8F0', padding: '4px 10px', borderRadius: 20 }}>
            {filtered.length} Entries Found
          </span>
        </div>

        {loading ? (
          <div className="admin-loading" style={{ padding: 60 }}><div className="admin-spinner" /> Loading Records...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty" style={{ padding: 60 }}>
            <div className="admin-empty-icon">🏙️</div>
            <h4>No Districts Registered</h4>
            <p>Expand your search or create a new district entry above.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 80, paddingLeft: 24 }}>ID</th>
                  <th>District Name</th>
                  <th>Bangla Name</th>
                  <th>Parent Division</th>
                  <th style={{ textAlign: 'right', paddingRight: 24 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id}>
                    <td style={{ paddingLeft: 24 }}>
                      <span style={{ fontWeight: 800, color: '#94A3B8', fontSize: 12 }}>#{item.id}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{item.name}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: '#64748B', fontSize: 13 }}>{item.bangla_name || '—'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'inline-block', fontSize: 11, color: '#B45309', background: '#FFFBEB', padding: '4px 12px', borderRadius: 8, fontWeight: 800 }}>
                        {item.division?.name || divisions.find(d => d.id === item.division_id)?.name || '—'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                      <div className="admin-actions" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          className="admin-btn admin-btn-outline admin-btn-sm" 
                          onClick={() => navigate(`/admin/districts/edit/${item.id}`)}
                          style={{ borderRadius: 8 }}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="admin-btn admin-btn-danger admin-btn-sm" 
                          onClick={() => setDeleteTarget(item)}
                          style={{ borderRadius: 8 }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeleteModal 
        show={!!deleteTarget} 
        title="Delete District" 
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? All associated upazilas and clinics will be affected.`} 
        onConfirm={handleDelete} 
        onCancel={() => setDeleteTarget(null)} 
        loading={deleting} 
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-container { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  )
}

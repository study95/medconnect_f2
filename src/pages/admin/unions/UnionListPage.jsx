// UnionListPage.jsx — Premium Union Management with Triple-Tier Cascading Filters
import { toast } from 'react-toastify'
import { getErrorMessage } from '../../../utils/errorHelper'
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  getUnions, getUpazilas, getDistricts, getDivisions, deleteUnion 
} from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'

// Premium Searchable Select Component for Filters
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
    <div className="searchable-select-container" ref={dropdownRef} style={{ position: 'relative', flex: '1 1 180px', opacity: disabled ? 0.6 : 1 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div 
        className="status-select" 
        style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          cursor: disabled ? 'not-allowed' : 'pointer', background: disabled ? '#F8FAFC' : 'white', 
          height: 42, padding: '0 14px', border: '1px solid #E2E8F0', borderRadius: 10, 
          fontSize: 13, fontWeight: 500, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.2s'
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
              style={{ padding: '10px 14px', fontSize: 12, cursor: 'pointer', color: '#4F46E5', fontWeight: 700, textAlign: 'center', background: '#F5F3FF' }}
              onClick={() => { onChange(''); setIsOpen(false); setSearch('') }}
            >
              ✕ Clear Filter
            </div>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>No results</div>
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

export default function UnionListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  // Filtering States
  const [divisionFilter, setDivisionFilter] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [upazilaFilter, setUpazilaFilter] = useState('')
  
  // Dropdown Data
  const [divisions, setDivisions] = useState([])
  const [districts, setDistricts] = useState([])
  const [upazilas, setUpazilas] = useState([])
  
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadDivisions()
  }, [])

  useEffect(() => {
    fetchItems()
  }, [])

  // Cascade: Division -> District
  useEffect(() => {
    if (divisionFilter) {
      getDistricts({ division_id: divisionFilter }).then(res => {
        const data = res.data?.data?.data || res.data?.data || res.data || []
        setDistricts(Array.isArray(data) ? data : [])
      })
    } else {
      setDistricts([]); setDistrictFilter('')
    }
  }, [divisionFilter])

  // Cascade: District -> Upazila
  useEffect(() => {
    if (districtFilter) {
      getUpazilas({ district_id: districtFilter }).then(res => {
        const data = res.data?.data?.data || res.data?.data || res.data || []
        setUpazilas(Array.isArray(data) ? data : [])
      })
    } else {
      setUpazilas([]); setUpazilaFilter('')
    }
  }, [districtFilter])

  const loadDivisions = async () => {
    try {
      const res = await getDivisions()
      setDivisions(res.data?.data || [])
    } catch {}
  }

  const fetchItems = async () => {
    try {
      setLoading(true)
      const params = {}
      if (upazilaFilter) params.upazila_id = upazilaFilter
      else if (districtFilter) params.district_id = districtFilter
      else if (divisionFilter) params.division_id = divisionFilter
      
      const res = await getUnions(params)
      setItems(res.data.data || res.data || [])
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load unions'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteUnion(deleteTarget.id)
      setItems(items.filter(i => i.id !== deleteTarget.id))
      toast.success('Union removed successfully')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Removal failed'))
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const filtered = items.filter(i => 
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.bangla_name?.includes(search)
  )

  const clearFilters = () => {
    setSearch('')
    setDivisionFilter('')
    setDistrictFilter('')
    setUpazilaFilter('')
  }

  const hasActiveFilters = search || divisionFilter || districtFilter || upazilaFilter

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">
            <span style={{ marginRight: 12 }}>🏘️</span>
            Union Management
          </h2>
          <p className="admin-page-subtitle">Granular geographic control for village-level demographic profiling</p>
        </div>
        <Link to="/admin/unions/create" className="admin-btn admin-btn-primary" style={{ background: '#4F46E5', borderRadius: 12, padding: '12px 24px' }}>
          + Add New Union
        </Link>
      </div>

      {/* Advanced Cascading Filter Bar */}
      <div className="admin-card" style={{ marginBottom: 28, borderTop: '4px solid #4F46E5', overflow: 'visible' }}>
        <div className="admin-card-body" style={{ overflow: 'visible' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, alignItems: 'flex-end' }}>
            
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Search Union</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="status-select" 
                  placeholder="Union name..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: '100%', height: 42, paddingLeft: 40, border: '1px solid #E2E8F0', borderRadius: 10 }}
                />
                <span style={{ position: 'absolute', left: 14, top: 11, fontSize: 16 }}>🔍</span>
              </div>
            </div>

            <SearchableSelect label="Division" placeholder="All" options={divisions} value={divisionFilter} onChange={setDivisionFilter} />
            <SearchableSelect label="District" placeholder="All" options={districts} value={districtFilter} onChange={setDistrictFilter} disabled={!divisionFilter} />
            <SearchableSelect label="Upazila" placeholder="All" options={upazilas} value={upazilaFilter} onChange={setUpazilaFilter} disabled={!districtFilter} />

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="admin-btn admin-btn-primary" onClick={fetchItems} style={{ height: 42, background: '#4F46E5', borderRadius: 10 }}>Refresh</button>
              {hasActiveFilters && (
                <button className="admin-btn admin-btn-outline" onClick={clearFilters} style={{ height: 42, color: '#EF4444', borderColor: '#FEE2E2', background: '#FEF2F2', borderRadius: 10 }}>
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header" style={{ background: '#F8FAFC' }}>
          <h3 className="admin-card-title">Regional Union Database</h3>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', background: '#E2E8F0', padding: '4px 10px', borderRadius: 20 }}>
            {filtered.length} Results
          </span>
        </div>

        {loading ? (
          <div className="admin-loading" style={{ padding: 60 }}><div className="admin-spinner" /> Synchronizing...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty" style={{ padding: 60 }}>
            <div className="admin-empty-icon">🏘️</div>
            <h4>No Unions Found</h4>
            <p>Try broadening your filters or add a missing union.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 80, paddingLeft: 24 }}>ID</th>
                  <th>Union Name</th>
                  <th>Bangla Name</th>
                  <th>Geographic Path</th>
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
                      <div style={{ fontWeight: 700, color: '#1E293B' }}>{item.name}</div>
                    </td>
                    <td>
                      <div style={{ color: '#64748B', fontWeight: 500, fontFamily: "'Hind Siliguri', sans-serif" }}>{item.bangla_name || '—'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 10, color: '#4F46E5', background: '#F5F3FF', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                          {item.upazila?.district?.division?.name || '—'}
                        </span>
                        <span style={{ color: '#CBD5E1', fontSize: 10 }}>›</span>
                        <span style={{ fontSize: 10, color: '#1E293B', background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                          {item.upazila?.district?.name || '—'}
                        </span>
                        <span style={{ color: '#CBD5E1', fontSize: 10 }}>›</span>
                        <span style={{ fontSize: 10, color: '#00A88C', background: '#F0FDFA', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                          {item.upazila?.name || '—'}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                      <div className="admin-actions" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          className="admin-btn admin-btn-outline admin-btn-sm" 
                          onClick={() => navigate(`/admin/unions/edit/${item.id}`)}
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
        title="Remove Union" 
        message={`Are you sure you want to remove "${deleteTarget?.name}"? This will affect localized demographic data.`} 
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

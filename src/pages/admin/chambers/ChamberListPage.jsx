// ChamberListPage.jsx — Premium Doctor Chamber Management
import { getErrorMessage } from '../../../utils/errorHelper'
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { getChambers, deleteChamber, getDoctors, getHospitals, toggleChamberActive } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'

// Premium Searchable Select for Filters
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
    <div className="searchable-select-container" ref={dropdownRef} style={{ position: 'relative', flex: '1 1 200px', opacity: disabled ? 0.6 : 1 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div 
        className="status-select" 
        style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          cursor: disabled ? 'not-allowed' : 'pointer', background: 'var(--admin-card-bg)', 
          height: 42, padding: '0 14px', border: '1px solid var(--admin-border)', borderRadius: 10, 
          fontSize: 13, fontWeight: 500, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', color: 'var(--admin-text)'
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span style={{ color: selectedOption ? 'var(--admin-text)' : 'var(--admin-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <span style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 12, marginTop: 6,
          boxShadow: 'var(--admin-shadow-lg)', overflow: 'hidden', zIndex: 1000
        }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg)' }}>
            <input 
              type="text" 
              autoFocus
              placeholder="Search..." 
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--admin-border)', outline: 'none', fontSize: 13, background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div style={{ maxHeight: 250, overflowY: 'auto' }}>
            <div 
              style={{ padding: '10px 14px', fontSize: 12, cursor: 'pointer', color: 'var(--admin-primary)', fontWeight: 700, textAlign: 'center', background: 'rgba(0, 168, 140, 0.05)' }}
              onClick={() => { onChange(''); setIsOpen(false); setSearch('') }}
            >
              ✕ Clear Filter
            </div>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 12 }}>No matching results</div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt.id} 
                  style={{ 
                    padding: '10px 14px', fontSize: 13, cursor: 'pointer', 
                    background: value.toString() === opt.id.toString() ? 'rgba(0, 168, 140, 0.1)' : 'transparent',
                    borderBottom: '1px solid var(--admin-border)'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.03)'}
                  onMouseLeave={(e) => e.target.style.background = value.toString() === opt.id.toString() ? 'rgba(0, 168, 140, 0.1)' : 'transparent'}
                  onClick={() => {
                    onChange(opt.id.toString())
                    setIsOpen(false)
                    setSearch('')
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{opt.name}</div>
                  {opt.subtext && <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{opt.subtext}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChamberListPage() {
  const { user, isAdmin, isManager, isDoctor } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Advanced Filters
  const [doctorId, setDoctorId] = useState('')
  const [hospitalId, setHospitalId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  // Filter Options
  const [doctors, setDoctors] = useState([])
  const [hospitals, setHospitals] = useState([])

  const isDoctorOnly = !isAdmin && !isManager && isDoctor

  useEffect(() => { 
    fetchData() 
    fetchOptions()
  }, [])

  // Refetch when filters change (debounced search could be better but this is fine for internal admin)
  useEffect(() => {
    fetchData()
  }, [doctorId, hospitalId, statusFilter])

  const fetchOptions = async () => {
    try {
      const [docRes, hospRes] = await Promise.all([
        getDoctors({ per_page: 1000 }),
        getHospitals({ per_page: 1000 })
      ])
      setDoctors(docRes.data?.data?.data || docRes.data?.data || docRes.data || [])
      setHospitals(hospRes.data?.data?.data || hospRes.data?.data || hospRes.data || [])
    } catch (err) {
      console.error('Failed to load filter options', err)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = {}
      if (search.trim()) params.search = search.trim()
      
      if (!isDoctorOnly) {
        if (doctorId) params.doctor_id = doctorId
        if (hospitalId) params.hospital_id = hospitalId
        if (statusFilter !== '') params.is_active = statusFilter
      }

      const res = await getChambers(params)
      setItems(res.data?.data?.data || res.data?.data || res.data || [])
    } catch (err) {
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setDoctorId('')
    setHospitalId('')
    setStatusFilter('')
    setTimeout(fetchData, 0)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteChamber(deleteTarget.id)
      setItems(items.filter(i => i.id !== deleteTarget.id))
      
    } catch (err) {
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleToggle = async (id) => {
    try {
      const res = await toggleChamberActive(id)
      
      setItems(items.map(i => i.id === id ? { ...i, is_active: !i.is_active } : i))
    } catch (err) {
    }
  }

  const hasActiveFilters = Boolean(search || doctorId || hospitalId || statusFilter !== '')

  // Pagination derived data
  const filtered = items
  useEffect(() => { setCurrentPage(1) }, [filtered.length])
  const paginatedData = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>📅</span>
            {isDoctorOnly ? 'My Clinical Schedule' : 'Chamber Management'}
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Configure visiting hours, hospitals, and consultation fees</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`admin-btn ${showFilters || hasActiveFilters ? 'admin-btn-primary' : 'admin-btn-outline'}`}
            onClick={() => setShowFilters(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Filter size={14} /> Filters {hasActiveFilters ? '●' : ''}
            {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <Link to="/admin/chambers/create" className="admin-btn admin-btn-primary" style={{ borderRadius: 12, padding: '12px 24px' }}>
            + Add New Schedule
          </Link>
        </div>
      </div>

      {/* Advanced Cascading Filter Bar */}
      {showFilters && (
        <div className="admin-card" style={{ marginBottom: 28, borderTop: '4px solid var(--admin-primary)', overflow: 'visible' }}>
          <div className="admin-card-body" style={{ overflow: 'visible' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, alignItems: 'flex-end' }}>
              
              <div style={{ flex: '1 1 240px' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Search</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    className="status-select" 
                    placeholder="Doctor, hospital or day..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: '100%', height: 42, paddingLeft: 40, border: '1px solid var(--admin-border)', borderRadius: 10, background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }}
                  />
                  <span style={{ position: 'absolute', left: 14, top: 11, fontSize: 16 }}>🔍</span>
                </div>
              </div>

              {!isDoctorOnly && (
                <>
                  <SearchableSelect 
                    label="Doctor Filter"
                    placeholder="All Doctors"
                    options={doctors}
                    value={doctorId}
                    onChange={setDoctorId}
                  />

                  <SearchableSelect 
                    label="Hospital Filter"
                    placeholder="All Hospitals"
                    options={hospitals}
                    value={hospitalId}
                    onChange={setHospitalId}
                  />
                </>
              )}

              <div style={{ flex: '1 1 140px' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</label>
                <select 
                  className="status-select" 
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value)} 
                  style={{ width: '100%', height: 42, border: '1px solid var(--admin-border)', borderRadius: 10, background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }}
                >
                  <option value="">All Status</option>
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="admin-btn admin-btn-primary" onClick={fetchData} style={{ height: 42, padding: '0 24px' }}>Refresh</button>
                {hasActiveFilters && (
                  <button className="admin-btn admin-btn-outline" onClick={clearFilters} style={{ height: 42, color: 'var(--admin-danger)', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show Entries Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--admin-text-muted)', fontWeight: 600 }}>
          Show
          <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setCurrentPage(1) }} style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', outline: 'none', minWidth: 70 }}>
            {[10, 25, 50, 100, 500].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          entries
        </div>
        <div style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
          Showing <strong>{filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1}</strong>–<strong>{Math.min(currentPage * perPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> entries
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">{isDoctorOnly ? 'My Active Schedules' : 'Global Chamber Records'}</h3>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', background: 'var(--admin-bg)', padding: '4px 10px', borderRadius: 20 }}>
            {items.length} Entries
          </span>
        </div>

        <div className="admin-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="admin-loading" style={{ padding: 60 }}><div className="admin-spinner" /> Loading Data...</div>
          ) : items.length === 0 ? (
            <div className="admin-empty" style={{ padding: 60 }}>
              <div className="admin-empty-icon">📅</div>
              <h4 style={{ color: 'var(--admin-text)' }}>No schedules found</h4>
              <p style={{ color: 'var(--admin-text-muted)' }}>Try broadening your search or add a new clinical chamber.</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    {!isDoctorOnly && <th style={{ paddingLeft: 24 }}>Practitioner</th>}
                    <th>Hospital Environment</th>
                    <th>Clinical Schedule</th>
                    <th>Consultation Fee</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right', paddingRight: 24 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map(item => (
                    <tr key={item.id} style={{ opacity: item.is_active === false ? 0.6 : 1, transition: 'opacity 0.3s' }}>
                      {!isDoctorOnly && (
                        <td style={{ paddingLeft: 24 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👨‍⚕️</div>
                            <div>
                              <div style={{ fontWeight: 800, color: 'var(--admin-text)' }}>{item.doctor?.name || '—'}</div>
                              <div style={{ fontSize: 11, color: 'var(--admin-primary)', fontWeight: 600 }}>{item.doctor?.specialty?.name || 'General'}</div>
                            </div>
                          </div>
                        </td>
                      )}
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{item.hospital?.name || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          📍 {item.hospital?.address || '—'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ 
                            padding: '4px 10px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', 
                            borderRadius: 8, fontWeight: 800, fontSize: 11, textTransform: 'uppercase' 
                          }}>
                            {item.day}
                          </span>
                          <div style={{ fontSize: 13, color: 'var(--admin-text)', fontWeight: 600 }}>
                            {item.start_time ? item.start_time.substring(0, 5) : '--:--'} 
                            <span style={{ margin: '0 4px', color: 'var(--admin-text-muted)' }}>-</span>
                            {item.end_time ? item.end_time.substring(0, 5) : '--:--'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 10px', borderRadius: 8, fontWeight: 800 }}>
                          <span style={{ fontSize: 12 }}>৳</span>
                          {item.fee || 0}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggle(item.id)}
                          style={{ 
                            border: 'none', cursor: 'pointer', background: 'transparent', padding: 0,
                            display: 'flex', alignItems: 'center', gap: 6
                          }}
                        >
                          <div style={{ 
                            width: 32, height: 18, background: item.is_active !== false ? 'var(--admin-primary)' : 'var(--admin-border)', 
                            borderRadius: 20, position: 'relative', transition: 'all 0.3s' 
                          }}>
                            <div style={{ 
                              width: 14, height: 14, background: 'white', borderRadius: '50%',
                              position: 'absolute', top: 2, left: item.is_active !== false ? 16 : 2,
                              transition: 'all 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: item.is_active !== false ? 'var(--admin-primary)' : 'var(--admin-text-muted)' }}>
                            {item.is_active !== false ? 'ACTIVE' : 'OFF'}
                          </span>
                        </button>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: 24 }}>
                        <div className="admin-actions" style={{ justifyContent: 'flex-end' }}>
                          <button 
                            className="admin-btn admin-btn-outline admin-btn-sm" 
                            onClick={() => navigate(`/admin/chambers/edit/${item.id}`)}
                            style={{ borderRadius: 8 }}
                          >
                            ✏️ Edit
                          </button>
                          {(isAdmin || isDoctorOnly) && (
                            <button 
                              className="admin-btn admin-btn-danger admin-btn-sm" 
                              onClick={() => setDeleteTarget(item)}
                              style={{ borderRadius: 8 }}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Pagination */}
      {(() => {
        const totalPages = Math.ceil(filtered.length / perPage)
        if (filtered.length === 0) return null
        const pages = []
        if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i) }
        else {
          pages.push(1)
          if (currentPage > 3) pages.push('...')
          const start = Math.max(2, currentPage - 1)
          const end = Math.min(totalPages - 1, currentPage + 1)
          for (let i = start; i <= end; i++) pages.push(i)
          if (currentPage < totalPages - 2) pages.push('...')
          pages.push(totalPages)
        }
        const btnBase = { height: 34, minWidth: 34, padding: '0 10px', borderRadius: 8, border: '1.5px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }
        const btnActive = { ...btnBase, border: 'none', background: 'linear-gradient(135deg, #00B875, #009E64)', color: '#fff', boxShadow: '0 2px 8px rgba(0,184,117,0.35)' }
        const btnDisabled = { ...btnBase, opacity: 0.4, cursor: 'not-allowed' }
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', fontWeight: 500 }}>
              Showing <strong>{filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1}</strong>–<strong>{Math.min(currentPage * perPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> entries
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={() => currentPage > 1 && setCurrentPage(1)} style={currentPage === 1 ? btnDisabled : btnBase}>«</button>
                <button onClick={() => currentPage > 1 && setCurrentPage(p => p - 1)} style={currentPage === 1 ? btnDisabled : btnBase}>‹</button>
                {pages.map((p, i) => p === '...' ? <span key={`d${i}`} style={{ width: 30, textAlign: 'center', color: 'var(--admin-text-muted)', fontWeight: 700 }}>…</span> : <button key={p} onClick={() => setCurrentPage(p)} style={p === currentPage ? btnActive : btnBase}>{p}</button>)}
                <button onClick={() => currentPage < totalPages && setCurrentPage(p => p + 1)} style={currentPage === totalPages ? btnDisabled : btnBase}>›</button>
                <button onClick={() => currentPage < totalPages && setCurrentPage(totalPages)} style={currentPage === totalPages ? btnDisabled : btnBase}>»</button>
              </div>
            )}
          </div>
        )
      })()}

      <DeleteModal 
        show={!!deleteTarget} 
        title="Delete Schedule" 
        message="This will permanently remove this clinical visiting record. This action cannot be undone." 
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

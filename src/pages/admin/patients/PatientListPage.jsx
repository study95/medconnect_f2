// PatientListPage.jsx — Premium Admin patient management (separate table from users)
import { useState, useEffect, useRef } from 'react'
import { Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { getMediaUrl } from '../../../utils/mediaUtils'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { getPatients, deleteAdminPatient, getDivisions, getDistricts, getUpazilas, getUnions } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'
import { getErrorMessage } from '../../../utils/errorHelper'

// Custom Searchable Dropdown Component (Premium Select)
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
    <div style={{ position: 'relative', flex: '1 1 180px', opacity: disabled ? 0.6 : 1 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div 
        className="status-select" 
        style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          cursor: disabled ? 'not-allowed' : 'pointer', background: 'var(--admin-card-bg)', 
          height: 42, padding: '0 14px', border: '1px solid var(--admin-border)', borderRadius: 10, 
          fontSize: 13, fontWeight: 500, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.2s',
          color: 'var(--admin-text)'
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
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)', overflow: 'hidden', zIndex: 1000
        }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.02)' }}>
            <input 
              type="text" 
              autoFocus
              placeholder="Search..." 
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--admin-border)', outline: 'none', fontSize: 13, background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 12 }}>No matches</div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt.id} 
                  style={{ 
                    padding: '10px 14px', fontSize: 13, cursor: 'pointer', 
                    background: value.toString() === opt.id.toString() ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    borderBottom: '1px solid var(--admin-border)',
                    color: 'var(--admin-text)'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.03)'}
                  onMouseLeave={(e) => e.target.style.background = value.toString() === opt.id.toString() ? 'rgba(99, 102, 241, 0.1)' : 'transparent'}
                  onClick={() => {
                    onChange(opt.id.toString())
                    setIsOpen(false)
                    setSearch('')
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{opt.name}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PatientListPage() {
  const { isAdmin, isManager } = useAuth()
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [divisionId, setDivisionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [upazilaId, setUpazilaId] = useState('')
  const [unionId, setUnionId] = useState('')
  
  const [divisions, setDivisions] = useState([])
  const [districts, setDistricts] = useState([])
  const [upazilas, setUpazilas] = useState([])
  const [unions, setUnions] = useState([])
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const hasFilters = Boolean(search || divisionId || districtId || upazilaId || unionId || dateFrom)

  useEffect(() => { 
    fetchPatients()
    loadInitialLocations()
  }, [])

  useEffect(() => { setCurrentPage(1) }, [patients.length])

  const loadInitialLocations = async () => {
    try {
      const res = await getDivisions()
      setDivisions(res.data?.data || [])
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    if (divisionId) {
      getDistricts({ division_id: divisionId }).then(res => setDistricts(res.data?.data || []))
    } else {
      setDistricts([]); setDistrictId(''); setUpazilas([]); setUpazilaId(''); setUnions([]); setUnionId('')
    }
  }, [divisionId])

  useEffect(() => {
    if (districtId) {
      getUpazilas({ district_id: districtId }).then(res => setUpazilas(res.data?.data || []))
    } else {
      setUpazilas([]); setUpazilaId(''); setUnions([]); setUnionId('')
    }
  }, [districtId])

  useEffect(() => {
    if (upazilaId) {
      getUnions({ upazila_id: upazilaId }).then(res => setUnions(res.data?.data || []))
    } else {
      setUnions([]); setUnionId('')
    }
  }, [upazilaId])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const params = {}
      if (search.trim()) params.search = search.trim()
      if (divisionId) params.division_id = divisionId
      if (districtId) params.district_id = districtId
      if (upazilaId) params.upazila_id = upazilaId
      if (unionId) params.union_id = unionId
      if (dateFrom) params.date_from = dateFrom

      const res = await getPatients(params)
      setPatients(res.data?.data?.data || res.data?.data || [])
    } catch (err) {
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setDateFrom('')
    setDivisionId(''); setDistrictId(''); setUpazilaId(''); setUnionId('')
    setTimeout(fetchPatients, 0)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteAdminPatient(deleteTarget.id)
      setPatients(patients.filter(p => p.id !== deleteTarget.id))
    } catch (err) {  } finally { setDeleting(false); setDeleteTarget(null) }
  }

  const paginatedData = patients.slice((currentPage - 1) * perPage, currentPage * perPage)

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>👤</span>
            Patient Registry
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Manage medical accounts and clinical profiles</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`admin-btn ${showFilters || hasFilters ? 'admin-btn-primary' : 'admin-btn-outline'}`}
            onClick={() => setShowFilters(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Filter size={14} /> Filters {hasFilters ? '●' : ''}
            {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {isAdmin && (
            <Link to="/admin/patients/create" className="admin-btn admin-btn-primary">
              + Register New Patient
            </Link>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="admin-card" style={{ marginBottom: 28, borderTop: '4px solid #6366F1', overflow: 'visible' }}>
          <div className="admin-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20, alignItems: 'flex-end' }}>
              
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Search</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    className="status-select" 
                    placeholder="Name, email, phone..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: '100%', height: 42, paddingLeft: 40, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  />
                  <span style={{ position: 'absolute', left: 14, top: 11, fontSize: 16 }}>🔍</span>
                </div>
              </div>

              <SearchableSelect label="Division" placeholder="All Divisions" options={divisions} value={divisionId} onChange={setDivisionId} />
              <SearchableSelect label="District" placeholder="All Districts" options={districts} value={districtId} onChange={setDistrictId} disabled={!divisionId} />
              <SearchableSelect label="Upazila" placeholder="All Upazilas" options={upazilas} value={upazilaId} onChange={setUpazilaId} disabled={!districtId} />
              <SearchableSelect label="Union" placeholder="All Unions" options={unions} value={unionId} onChange={setUnionId} disabled={!upazilaId} />

              <div style={{ minWidth: 140 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Joined From</label>
                <input type="date" className="status-select" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', height: 42, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }} />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="admin-btn admin-btn-primary" onClick={fetchPatients} style={{ height: 42, padding: '0 20px', background: '#6366F1' }}>Filter</button>
                {hasFilters && (
                  <button className="admin-btn admin-btn-outline" onClick={clearFilters} style={{ height: 42, color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>Reset</button>
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
          Showing <strong>{patients.length === 0 ? 0 : (currentPage - 1) * perPage + 1}</strong>–<strong>{Math.min(currentPage * perPage, patients.length)}</strong> of <strong>{patients.length}</strong> entries
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Patient Records</h3>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', background: 'var(--admin-bg)', padding: '4px 12px', borderRadius: 20 }}>
            {patients.length} Accounts Found
          </span>
        </div>

        {loading ? (
          <div className="admin-loading" style={{ padding: 60 }}><div className="admin-spinner" /> Loading registry...</div>
        ) : patients.length === 0 ? (
          <div className="admin-empty" style={{ padding: 60 }}>
            <div className="admin-empty-icon">👥</div>
            <h4>No patients found</h4>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 80, paddingLeft: 24, color: 'var(--admin-text-muted)' }}>Identity</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Patient Contact</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Clinical Info</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Geographic Location</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Joined Date</th>
                  <th style={{ textAlign: 'right', paddingRight: 24, color: 'var(--admin-text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(p => (
                  <tr key={p.id}>
                    <td style={{ paddingLeft: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12, overflow: 'hidden',
                          background: 'rgba(99, 102, 241, 0.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid var(--admin-border)'
                        }}>
                          {p.profile_pic ? (
                            <img
                              src={getMediaUrl(p.profile_pic)}
                              alt={p.name || ''}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.nextElementSibling && (e.target.nextElementSibling.style.display = 'block');
                              }}
                            />
                          ) : null}
                          <span
                            style={{
                              fontSize: 18,
                              fontWeight: 900,
                              color: '#6366F1',
                              display: p.profile_pic ? 'none' : 'block'
                            }}
                          >
                            {p.name?.charAt(0)?.toUpperCase() || 'P'}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>#{p.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text)' }}>{p.mobile || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{p.email || 'No email'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: 'rgba(99, 102, 241, 0.05)', color: '#6366F1', textTransform: 'capitalize' }}>
                          {p.gender || '—'}
                        </span>
                        {p.blood_group && (
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.05)', color: '#DC2626' }}>
                            🩸 {p.blood_group}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', maxWidth: 180, lineHeight: 1.5 }}>
                        {[p.division?.name, p.district?.name, p.upazila?.name, p.union?.name].filter(Boolean).join(', ') || '—'}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                      <div className="admin-actions" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          className="admin-btn admin-btn-outline admin-btn-sm" 
                          style={{ color: '#6366F1', borderColor: 'rgba(99, 102, 241, 0.2)', background: 'rgba(99, 102, 241, 0.05)' }} 
                          onClick={() => navigate(`/admin/users/${p.user_id || p.id}`)}
                        >
                          👁️ View
                        </button>
                        {isAdmin && (
                          <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => navigate(`/admin/patients/edit/${p.id}`)}>
                            ✏️ Edit
                          </button>
                        )}
                        {isAdmin && (
                          <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => setDeleteTarget(p)}>
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

      {/* Bottom Pagination */}
      {(() => {
        const totalPages = Math.ceil(patients.length / perPage)
        if (patients.length === 0) return null
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
              Showing <strong>{patients.length === 0 ? 0 : (currentPage - 1) * perPage + 1}</strong>–<strong>{Math.min(currentPage * perPage, patients.length)}</strong> of <strong>{patients.length}</strong> entries
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

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />

      <DeleteModal
        show={!!deleteTarget}
        title="Remove Patient"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All associated clinical records will be removed.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}

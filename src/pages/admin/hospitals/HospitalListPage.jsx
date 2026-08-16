// HospitalListPage.jsx — Premium Hospital Management
import { getMediaUrl } from '../../../utils/mediaUtils'
import { getErrorMessage } from '../../../utils/errorHelper'
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import {
  getHospitals, deleteHospital, updateHospital,
  getDivisions, getDistricts, getUpazilas, getUnions
} from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'

// Custom Searchable Dropdown Component
function SearchableSelect({ label, options, value, onChange, placeholder, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

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
    <div className="searchable-select-container" ref={dropdownRef} style={{ position: 'relative', width: '100%', opacity: disabled ? 0.6 : 1 }}>
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
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🔍</span>
            <input
              ref={inputRef}
              type="text"
              autoFocus
              placeholder="Type to search..."
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, width: '100%', color: 'var(--admin-text)' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ maxHeight: 250, overflowY: 'auto' }}>
            <div
              style={{ padding: '10px 14px', fontSize: 12, cursor: 'pointer', color: '#10B981', fontWeight: 700, textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)' }}
              onClick={() => { onChange(''); setIsOpen(false); setSearch('') }}
            >
              ✕ Clear Selection
            </div>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '20px 14px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 12 }}>No matching results</div>
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
                  onMouseEnter={(e) => e.target.style.background = 'rgba(0, 168, 140, 0.05)'}
                  onMouseLeave={(e) => e.target.style.background = value.toString() === opt.id.toString() ? 'rgba(99, 102, 241, 0.1)' : 'transparent'}
                  onClick={() => {
                    onChange(opt.id.toString())
                    setIsOpen(false)
                    setSearch('')
                  }}
                >
                  <div style={{ fontWeight: value.toString() === opt.id.toString() ? 700 : 500 }}>{opt.name}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function HospitalListPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [hospitals, setHospitals] = useState([])
  const [hospitalsOptions, setHospitalsOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Filters
  const [search, setSearch] = useState('')
  const [hospitalIdFilter, setHospitalIdFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Location Filters
  const [divisionId, setDivisionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [upazilaId, setUpazilaId] = useState('')
  const [unionId, setUnionId] = useState('')

  const [divisions, setDivisions] = useState([])
  const [districts, setDistricts] = useState([])
  const [upazilas, setUpazilas] = useState([])
  const [unions, setUnions] = useState([])

  useEffect(() => {
    fetchHospitals()
    loadInitialLocations()
  }, [])

  useEffect(() => {
    loadHospitalOptions()
  }, [divisionId, districtId, upazilaId, unionId])

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

  const loadHospitalOptions = async () => {
    try {
      const params = { per_page: 500 }
      if (divisionId) params.division_id = divisionId
      if (districtId) params.district_id = districtId
      if (upazilaId) params.upazila_id = upazilaId
      if (unionId) params.union_id = unionId
      const res = await getHospitals(params)
      setHospitalsOptions(res.data?.data?.data || res.data?.data || [])
    } catch (err) { console.error(err) }
  }

  const fetchHospitals = async () => {
    try {
      setLoading(true)
      const res = await getHospitals({ per_page: 500 })
      setHospitals(res.data?.data?.data || res.data?.data || [])
    } catch (err) {
} finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteHospital(deleteTarget.id)
      setHospitals(hospitals.filter(h => h.id !== deleteTarget.id))
      
    } catch (err) {
} finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleToggleStatus = async (hospital) => {
    try {
      const newStatus = !hospital.is_active
      await updateHospital(hospital.id, { is_active: newStatus ? 1 : 0 })
      setHospitals(hospitals.map(h => h.id === hospital.id ? { ...h, is_active: newStatus } : h))
      
    } catch (err) {
}
  }

  const clearFilters = () => {
    setSearch('')
    setHospitalIdFilter('')
    setStatusFilter('')
    setDivisionId('')
    setDistrictId('')
    setUpazilaId('')
    setUnionId('')
  }

  const filtered = hospitals.filter(h => {
    const matchText = !search || h.name?.toLowerCase().includes(search.toLowerCase()) || h.email?.toLowerCase().includes(search.toLowerCase())
    const matchHospital = !hospitalIdFilter || String(h.id) === String(hospitalIdFilter)
    const matchStatus = !statusFilter || (statusFilter === 'active' ? h.is_active : !h.is_active)
    const matchDivision = !divisionId || String(h.division_id) === String(divisionId)
    const matchDistrict = !districtId || String(h.district_id) === String(districtId)
    const matchUpazila = !upazilaId || String(h.upazila_id) === String(upazilaId)
    const matchUnion = !unionId || String(h.union_id) === String(unionId)
    return matchText && matchHospital && matchStatus && matchDivision && matchDistrict && matchUpazila && matchUnion
  })

  const hasFilters = search || hospitalIdFilter || statusFilter || divisionId || districtId || upazilaId || unionId

  useEffect(() => { setCurrentPage(1) }, [filtered.length])

  const paginatedData = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>🏥</span>
            Hospital Management
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>{hospitals.length} total facilities registered</p>
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
            <Link to="/admin/hospitals/create" className="admin-btn admin-btn-primary">
              + Add Hospital
            </Link>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="admin-card" style={{ marginBottom: 28, borderTop: '4px solid #10B981', overflow: 'visible' }}>
          <div className="admin-card-body" style={{ overflow: 'visible' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, alignItems: 'flex-end' }}>

              <div style={{ flex: '1 1 240px' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Search</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="status-select"
                    placeholder="Facility name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: '100%', height: 42, paddingLeft: 40, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  />
                  <span style={{ position: 'absolute', left: 14, top: 11, fontSize: 16 }}>🔍</span>
                </div>
              </div>

              <SearchableSelect label="Division" options={divisions} value={divisionId} onChange={setDivisionId} placeholder="All Divisions" />
              <SearchableSelect label="District" options={districts} value={districtId} onChange={setDistrictId} placeholder="All Districts" disabled={!divisionId} />
              <SearchableSelect label="Upazila" options={upazilas} value={upazilaId} onChange={setUpazilaId} placeholder="All Upazilas" disabled={!districtId} />
              <SearchableSelect label="Union" options={unions} value={unionId} onChange={setUnionId} placeholder="All Unions" disabled={!upazilaId} />

              <SearchableSelect label="Select Hospital" options={hospitalsOptions} value={hospitalIdFilter} onChange={setHospitalIdFilter} placeholder="All Facilities" />

              <div style={{ flex: '1 1 140px' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</label>
                <select className="status-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '100%', height: 42, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}>
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="admin-btn admin-btn-primary" onClick={fetchHospitals} style={{ height: 42, padding: '0 24px' }}>Refresh</button>
                {hasFilters && (
                  <button className="admin-btn admin-btn-outline" onClick={clearFilters} style={{ height: 42, color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>
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
          <h3 className="admin-card-title">Registered Facilities</h3>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', background: 'var(--admin-bg)', padding: '4px 10px', borderRadius: 20 }}>
            {filtered.length} Hospitals Showing
          </span>
        </div>

        {loading ? (
          <div className="admin-loading" style={{ padding: 60 }}><div className="admin-spinner" /> Loading hospitals...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty" style={{ padding: 60 }}>
            <div className="admin-empty-icon" style={{ fontSize: 48, marginBottom: 16 }}>🏥</div>
            <h4>No hospitals matching filters</h4>
            <p>Try adjusting your location or search terms</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 24, color: 'var(--admin-text-muted)' }}>Facility Name</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Location Profile</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Contact Details</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Status</th>
                  <th style={{ textAlign: 'right', paddingRight: 24, color: 'var(--admin-text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(h => (
                  <tr key={h.id}>
                    <td style={{ paddingLeft: 24 }}>
                      <Link to={`/admin/hospitals/view/${h.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                        {h.photo_url || h.logo_url || h.photo || h.hospital_logo ? (
                          <img
                            src={getMediaUrl(h.photo_url || h.logo_url || h.photo || h.hospital_logo)}
                            alt={h.name || 'H'}
                            style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--admin-border)' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: 'rgba(0,0,0,0.02)',
                            display: (h.photo_url || h.logo_url || h.photo || h.hospital_logo) ? 'none' : 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20,
                            border: '1px solid var(--admin-border)'
                          }}
                        >
                          🏥
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{h.name}</div>
                          {(h.top_10_hospital === 'yes' || h.top_10_hospital === true) && (
                            <span style={{ fontSize: 10, fontWeight: 800, color: '#92400E', background: 'rgba(254, 243, 199, 0.2)', padding: '2px 8px', borderRadius: 6, display: 'inline-block', marginTop: 4, border: '1px solid rgba(146, 64, 14, 0.2)' }}>
                              ⭐ TOP 10
                            </span>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', maxWidth: 300, lineHeight: 1.5 }}>
                        <div style={{ fontWeight: 600, color: 'var(--admin-text)', marginBottom: 2 }}>
                          {[h.division?.name || h.division_name, h.district?.name || h.district_name].filter(Boolean).join(' > ')}
                        </div>
                        <div style={{ marginBottom: 2 }}>
                          {[h.upazila?.name || h.upazila_name, h.union?.name || h.union_name].filter(Boolean).join(', ') || 'Area N/A'}
                        </div>
                        {h.address && (
                          <div style={{ fontSize: 10, color: 'var(--admin-text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--admin-border)', marginTop: 4, paddingTop: 2 }}>
                            📍 {h.address}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--admin-text)', fontSize: 13 }}>📞 {h.phone || 'N/A'}</div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>✉️ {h.email || 'N/A'}</div>
                    </td>
                    <td>
                      {isAdmin ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            onClick={() => handleToggleStatus(h)}
                            style={{
                              width: 44, height: 24, borderRadius: 12, padding: 2, cursor: 'pointer',
                              background: h.is_active ? '#10B981' : '#CBD5E1',
                              display: 'flex', transition: '0.2s',
                              justifyContent: h.is_active ? 'flex-end' : 'flex-start'
                            }}
                          >
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 800, color: h.is_active ? '#10B981' : 'var(--admin-text-muted)', textTransform: 'uppercase' }}>
                            {h.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      ) : (
                        <span style={{
                          fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 8,
                          background: h.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.05)',
                          color: h.is_active ? '#10B981' : 'var(--admin-text-muted)',
                          textTransform: 'uppercase'
                        }}>
                          {h.is_active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                      <div className="admin-actions" style={{ justifyContent: 'flex-end' }}>
                        <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => navigate(`/admin/hospitals/view/${h.id}`)} title="View Detail">
                          👁️
                        </button>
                        {h.url && (
                          <a href={h.url} target="_blank" rel="noreferrer" className="admin-btn admin-btn-outline admin-btn-sm" style={{ padding: '6px 12px' }}>
                            🌐 Site
                          </a>
                        )}
                        <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => navigate(`/admin/hospitals/edit/${h.id}`)}>
                          ✏️ Edit
                        </button>
                        {isAdmin && (
                          <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => setDeleteTarget(h)}>
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
                <button onClick={() => currentPage > 1 && setCurrentPage(1)} style={currentPage === 1 ? btnDisabled : btnBase} title="First">«</button>
                <button onClick={() => currentPage > 1 && setCurrentPage(p => p - 1)} style={currentPage === 1 ? btnDisabled : btnBase} title="Prev">‹</button>
                {pages.map((p, i) => p === '...' ? <span key={`d${i}`} style={{ width: 30, textAlign: 'center', color: 'var(--admin-text-muted)', fontWeight: 700 }}>…</span> : <button key={p} onClick={() => setCurrentPage(p)} style={p === currentPage ? btnActive : btnBase}>{p}</button>)}
                <button onClick={() => currentPage < totalPages && setCurrentPage(p => p + 1)} style={currentPage === totalPages ? btnDisabled : btnBase} title="Next">›</button>
                <button onClick={() => currentPage < totalPages && setCurrentPage(totalPages)} style={currentPage === totalPages ? btnDisabled : btnBase} title="Last">»</button>
              </div>
            )}
          </div>
        )
      })()}

      <DeleteModal
        show={!!deleteTarget}
        title="Delete Hospital"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        .admin-container { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  )
}

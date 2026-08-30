// HospitalListPage.jsx — Premium Hospital Management
import { getMediaUrl } from '../../../utils/mediaUtils'
import { getErrorMessage } from '../../../utils/errorHelper'
import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useAdminHospitals, useAdminHospitalLookups, useAdminHospitalMutations } from '../../../features/hospitals/useAdminHospitals'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'

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
    <div className="searchable-select-container" ref={dropdownRef} style={{ position: 'relative', flex: '1 1 180px', minWidth: 150, opacity: disabled ? 0.6 : 1 }}>
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
  const [deleteTarget, setDeleteTarget] = useState(null)
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

  // Server-side filter memo for TanStack Query
  const serverFilters = useMemo(() => {
    const params = {}
    if (divisionId) params.division_id = divisionId
    if (districtId) params.district_id = districtId
    if (upazilaId) params.upazila_id = upazilaId
    if (unionId) params.union_id = unionId
    if (statusFilter !== '') params.is_active = statusFilter === 'active' ? 1 : 0
    return params
  }, [divisionId, districtId, upazilaId, unionId, statusFilter])

  // Enterprise TanStack Query Hooks
  const { hospitals, isLoading: loading, isFetching: refreshing, refetch: fetchHospitals } = useAdminHospitals(serverFilters)
  const { divisions, districts, upazilas, unions, hospitalsOptions } = useAdminHospitalLookups({ divisionId, districtId, upazilaId })
  const { deleteHospital, isDeleting: deleting, toggleStatus } = useAdminHospitalMutations()

  const handleDivisionChange = (val) => {
    setDivisionId(val)
    setDistrictId('')
    setUpazilaId('')
    setUnionId('')
    setHospitalIdFilter('')
  }

  const handleDistrictChange = (val) => {
    setDistrictId(val)
    setUpazilaId('')
    setUnionId('')
    setHospitalIdFilter('')
  }

  const handleUpazilaChange = (val) => {
    setUpazilaId(val)
    setUnionId('')
    setHospitalIdFilter('')
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteHospital(deleteTarget.id)
    } catch (err) {
      console.error('Failed to delete hospital', err)
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleToggleStatus = async (hospital) => {
    try {
      await toggleStatus({ id: hospital.id, is_active: !hospital.is_active })
    } catch (err) {
      console.error('Failed to toggle hospital status', err)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setDivisionId('')
    setDistrictId('')
    setUpazilaId('')
    setUnionId('')
    setHospitalIdFilter('')
    setStatusFilter('')
  }

  const filtered = hospitals.filter(h => {
    if (search && search.trim()) {
      const q = search.trim().toLowerCase()
      const matchesSearch =
        h.name?.toLowerCase().includes(q) ||
        h.phone?.toLowerCase().includes(q) ||
        h.email?.toLowerCase().includes(q) ||
        h.address?.toLowerCase().includes(q) ||
        h.branch_name?.toLowerCase().includes(q)
      if (!matchesSearch) return false
    }

    if (hospitalIdFilter && h.id.toString() !== hospitalIdFilter.toString()) return false
    if (statusFilter && (statusFilter === 'active' ? !h.is_active : h.is_active)) return false

    if (divisionId && (h.division_id || h.division?.id)?.toString() !== divisionId.toString()) return false
    if (districtId && (h.district_id || h.district?.id)?.toString() !== districtId.toString()) return false
    if (upazilaId && (h.upazila_id || h.upazila?.id)?.toString() !== upazilaId.toString()) return false
    if (unionId && (h.union_id || h.union?.id)?.toString() !== unionId.toString()) return false

    return true
  })

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
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search hospital by name, phone, branch, email..."
        onRefresh={fetchHospitals}
        refreshing={loading}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={Boolean(divisionId || districtId || upazilaId || unionId || hospitalIdFilter || statusFilter !== '')}
        onClearFilters={clearFilters}
        activeFilters={[
          divisionId && { key: 'division', label: `Division: ${divisions.find(d => String(d.id) === String(divisionId))?.name || divisionId}`, onRemove: () => handleDivisionChange('') },
          districtId && { key: 'district', label: `District: ${districts.find(d => String(d.id) === String(districtId))?.name || districtId}`, onRemove: () => handleDistrictChange('') },
          upazilaId && { key: 'upazila', label: `Upazila: ${upazilas.find(u => String(u.id) === String(upazilaId))?.name || upazilaId}`, onRemove: () => handleUpazilaChange('') },
          unionId && { key: 'union', label: `Union: ${unions.find(u => String(u.id) === String(unionId))?.name || unionId}`, onRemove: () => setUnionId('') },
          hospitalIdFilter && { key: 'hospital', label: `Facility: ${hospitalsOptions.find(h => String(h.id) === String(hospitalIdFilter))?.name || hospitalIdFilter}`, onRemove: () => setHospitalIdFilter('') },
          statusFilter !== '' && { key: 'status', label: `Status: ${statusFilter === 'active' ? 'Active' : 'Inactive'}`, onRemove: () => setStatusFilter('') },
        ].filter(Boolean)}
        actions={
          isAdmin && (
            <Link to="/admin/hospitals/create" className="admin-btn admin-btn-primary" style={{ height: 38, display: 'inline-flex', alignItems: 'center' }}>
              + Add New Hospital
            </Link>
          )
        }
      >
        <SearchableSelect label="Division" placeholder="All Divisions" options={divisions} value={divisionId} onChange={handleDivisionChange} />
        <SearchableSelect label="District" placeholder="All Districts" options={districts} value={districtId} onChange={handleDistrictChange} disabled={!divisionId} />
        <SearchableSelect label="Upazila" placeholder="All Upazilas" options={upazilas} value={upazilaId} onChange={handleUpazilaChange} disabled={!districtId} />
        <SearchableSelect label="Union" placeholder="All Unions" options={unions} value={unionId} onChange={setUnionId} disabled={!upazilaId} />
        <SearchableSelect label="Hospital / Clinic" placeholder="All Facilities" options={hospitalsOptions} value={hospitalIdFilter} onChange={setHospitalIdFilter} />
        <div style={{ flex: '1 1 140px', minWidth: 120 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
          <select className="status-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '100%', height: 42, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 10, padding: '0 14px', fontSize: 13, fontWeight: 500, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </ListToolbar>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Registered Facilities</h3>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', background: 'var(--admin-bg)', padding: '4px 10px', borderRadius: 20 }}>
            {filtered.length} Hospitals Showing
          </span>
        </div>

        {loading ? (
          <TableSkeleton rowCount={8} columnWidths={['120px', '30%', '20%', '15%', '15%', '8%']} headers={['Logo', 'Hospital Details', 'Location', 'Branch Info', 'Status', 'Actions']} />
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={Boolean(divisionId || districtId || upazilaId || unionId || hospitalIdFilter || statusFilter || search)} searchQuery={search} onClearFilters={clearFilters} onClearSearch={() => setSearch('')} icon="🏥" title="No hospitals found" description="Try changing your search keywords or reset active filters." primaryAction={isAdmin ? { label: '+ Add New Hospital', to: '/admin/hospitals/create' } : undefined} />
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
                          <CompactUlid value={h.public_id || h.id} />
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

      <TableFooter
        total={filtered.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        perPage={perPage}
        setPerPage={setPerPage}
      />

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

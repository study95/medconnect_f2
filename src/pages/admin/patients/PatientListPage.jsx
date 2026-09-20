import { useState, useRef, useMemo, useEffect } from 'react'
import { Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { getMediaUrl } from '../../../utils/mediaUtils'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useAdminPatients, useAdminPatientLookups, useAdminPatientMutations } from '../../../features/patients/useAdminPatients'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'
import { getErrorMessage } from '../../../utils/errorHelper'
import toast from 'react-hot-toast'

// Custom Searchable Dropdown Component (Premium Select)
function TableCheckbox({ checked, indeterminate, onChange, title }) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        margin: 0,
        position: 'relative',
        userSelect: 'none',
        verticalAlign: 'middle',
      }}
      title={title}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 0,
          height: 0,
          margin: 0,
          pointerEvents: 'none',
        }}
      />
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          border: checked || indeterminate ? '1.5px solid #10B981' : '1.5px solid #D1D5DB',
          background: checked || indeterminate ? '#10B981' : '#FFFFFF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease-in-out',
          boxShadow: checked || indeterminate ? '0 1px 3px rgba(16, 185, 129, 0.3)' : '0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        {checked && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {!checked && indeterminate && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </span>
    </label>
  )
}

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
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [divisionId, setDivisionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [upazilaId, setUpazilaId] = useState('')
  const [unionId, setUnionId] = useState('')
  
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const hasFilters = Boolean(search || divisionId || districtId || upazilaId || unionId || dateFrom)

  // Cached cascading location lookups
  const { divisions, districts, upazilas, unions } = useAdminPatientLookups({
    divisionId,
    districtId,
    upazilaId,
  })

  // Memoized server filters for TanStack Query
  const serverFilters = useMemo(() => {
    const params = {}
    if (divisionId) params.division_id = divisionId
    if (districtId) params.district_id = districtId
    if (upazilaId) params.upazila_id = upazilaId
    if (unionId) params.union_id = unionId
    if (dateFrom) params.date_from = dateFrom
    return params
  }, [divisionId, districtId, upazilaId, unionId, dateFrom])

  // Enterprise TanStack Query Hooks
  const { patients, isLoading: loading, refetch: fetchPatients } = useAdminPatients(serverFilters)
  const {
    deletePatient,
    isDeleting: deleting,
    bulkDeletePatients,
    isBulkDeleting: bulkDeleting,
  } = useAdminPatientMutations()

  const clearFilters = () => {
    setSearch('')
    setDateFrom('')
    setDivisionId(''); setDistrictId(''); setUpazilaId(''); setUnionId('')
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deletePatient(deleteTarget.id)
      toast.success('Patient deleted successfully.')
      setSelectedIds(prev => prev.filter(id => id !== deleteTarget.id))
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete patient.'))
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    try {
      const res = await bulkDeletePatients(selectedIds)
      toast.success(res.data?.message || `Successfully deleted ${selectedIds.length} patient(s).`)
      setSelectedIds([])
      setShowBulkDeleteModal(false)
    } catch (err) {
      console.error('Failed to delete selected patients', err)
      toast.error(err.response?.data?.message || 'Failed to delete selected patients')
    }
  }

  // Client-side real-time filtering
  const filtered = useMemo(() => {
    return patients.filter(patient => {
      const searchLower = search.trim().toLowerCase()
      if (!searchLower) return true

      const id = String(patient.public_id || patient.id || '').toLowerCase()
      const regNo = String(patient.registration_number || patient.user?.registration_number || '').toLowerCase()
      const patientId = String(patient.patient_id || patient.user?.patient_id || '').toLowerCase()
      const name = String(patient.name || patient.user?.name || '').toLowerCase()
      const phone = String(patient.phone || patient.mobile || patient.user?.phone || patient.user?.mobile || '').toLowerCase()
      const email = String(patient.email || patient.user?.email || '').toLowerCase()
      const blood = String(patient.blood_group || '').toLowerCase()
      const gender = String(patient.gender || '').toLowerCase()
      const occupation = String(patient.occupation || '').toLowerCase()
      const divisionName = String(patient.division?.name || '').toLowerCase()
      const districtName = String(patient.district?.name || '').toLowerCase()
      const upazilaName = String(patient.upazila?.name || '').toLowerCase()
      const unionName = String(patient.union?.name || '').toLowerCase()

      return id.includes(searchLower) ||
        regNo.includes(searchLower) ||
        patientId.includes(searchLower) ||
        name.includes(searchLower) ||
        phone.includes(searchLower) ||
        email.includes(searchLower) ||
        blood.includes(searchLower) ||
        gender.includes(searchLower) ||
        occupation.includes(searchLower) ||
        divisionName.includes(searchLower) ||
        districtName.includes(searchLower) ||
        upazilaName.includes(searchLower) ||
        unionName.includes(searchLower)
    })
  }, [patients, search])

  const paginatedData = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  useEffect(() => { 
    setCurrentPage(1) 
  }, [filtered.length])

  const isAllSelected = paginatedData.length > 0 && paginatedData.every(p => selectedIds.includes(p.id))
  const isSomeSelected = paginatedData.some(p => selectedIds.includes(p.id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const pageIds = paginatedData.map(p => p.id)
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)))
    } else {
      const newIds = paginatedData.map(p => p.id).filter(id => !selectedIds.includes(id))
      setSelectedIds(prev => [...prev, ...newIds])
    }
  }

  const toggleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

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
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by ID, patient name, phone, email, blood group, location..."
        onRefresh={fetchPatients}
        refreshing={loading}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={Boolean(divisionId || districtId || upazilaId || unionId || dateFrom || search)}
        onClearFilters={clearFilters}
        activeFilters={[
          divisionId && { key: 'division', label: `Division: ${divisions.find(d => String(d.id) === String(divisionId))?.name || divisionId}`, onRemove: () => setDivisionId('') },
          districtId && { key: 'district', label: `District: ${districts.find(d => String(d.id) === String(districtId))?.name || districtId}`, onRemove: () => setDistrictId('') },
          upazilaId && { key: 'upazila', label: `Upazila: ${upazilas.find(u => String(u.id) === String(upazilaId))?.name || upazilaId}`, onRemove: () => setUpazilaId('') },
          unionId && { key: 'union', label: `Union: ${unions.find(u => String(u.id) === String(unionId))?.name || unionId}`, onRemove: () => setUnionId('') },
          dateFrom && { key: 'date', label: `Registered From: ${dateFrom}`, onRemove: () => setDateFrom('') },
        ].filter(Boolean)}
        actions={
          isAdmin && (
            <Link to="/admin/patients/create" className="admin-btn admin-btn-primary" style={{ height: 38, display: 'inline-flex', alignItems: 'center' }}>
              + Register New Patient
            </Link>
          )
        }
      >
        <SearchableSelect label="Division" placeholder="All Divisions" options={divisions} value={divisionId} onChange={setDivisionId} />
        <SearchableSelect label="District" placeholder="All Districts" options={districts} value={districtId} onChange={setDistrictId} disabled={!divisionId} />
        <SearchableSelect label="Upazila" placeholder="All Upazilas" options={upazilas} value={upazilaId} onChange={setUpazilaId} disabled={!districtId} />
        <SearchableSelect label="Union" placeholder="All Unions" options={unions} value={unionId} onChange={setUnionId} disabled={!upazilaId} />
        <div style={{ minWidth: 150 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Registered From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }} />
        </div>
      </ListToolbar>

      <div className="admin-card">
        <div
          className="admin-card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '14px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 className="admin-card-title" style={{ margin: 0 }}>Patient Records</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {selectedIds.length > 0 && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%)',
                  border: '1px solid #FECDD3',
                  borderRadius: 20,
                  padding: '4px 6px 4px 14px',
                  boxShadow: '0 2px 6px rgba(225, 29, 72, 0.08)',
                  animation: 'fadeInSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#E11D48',
                      color: '#ffffff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    ✓
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#9F1239', letterSpacing: '-0.01em' }}>
                    {selectedIds.length} <span style={{ fontWeight: 600, color: '#BE123C' }}>selected</span>
                  </span>
                </div>

                <div style={{ width: 1, height: 16, background: '#FDA4AF', opacity: 0.6 }} />

                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#9F1239',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 12,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(225, 29, 72, 0.1)'
                    e.currentTarget.style.color = '#881337'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#9F1239'
                  }}
                >
                  Deselect
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowBulkDeleteModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '5px 14px',
                      borderRadius: 16,
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(225, 29, 72, 0.25)',
                      transition: 'transform 0.1s ease, box-shadow 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(225, 29, 72, 0.35)'
                      e.currentTarget.style.transform = 'translateY(-0.5px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(225, 29, 72, 0.25)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                    <span>Delete ({selectedIds.length})</span>
                  </button>
                )}
              </div>
            )}
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--admin-text-muted, #64748B)',
                background: 'var(--admin-bg, #F8FAFC)',
                padding: '4px 10px',
                borderRadius: 8,
                border: '1px solid var(--admin-border, #E2E8F0)',
              }}
            >
              <strong style={{ color: 'var(--admin-text, #0F172A)' }}>{filtered.length}</strong> Accounts Found
            </div>
          </div>
        </div>

        {loading ? (
          <TableSkeleton 
            rowCount={8} 
            columnWidths={isAdmin ? ['44px', '110px', '20%', '18%', '16%', '20%', '14%', '130px'] : ['110px', '22%', '20%', '18%', '20%', '15%', '80px']} 
            headers={isAdmin ? ['', 'ID', 'Patient', 'Contact Info', 'Clinical Info', 'Location Profile', 'Registered', 'Actions'] : ['ID', 'Patient', 'Contact Info', 'Clinical Info', 'Location Profile', 'Registered', 'Actions']} 
          />
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={Boolean(divisionId || districtId || upazilaId || unionId || dateFrom || search)} searchQuery={search} onClearFilters={clearFilters} onClearSearch={() => setSearch('')} icon="👤" title="No patients found" description="Try changing your search keywords or clear applied filters." primaryAction={isAdmin ? { label: '+ Register New Patient', to: '/admin/patients/create' } : undefined} />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  {isAdmin && (
                    <th style={{ width: 44, textAlign: 'center', paddingLeft: 16 }}>
                      <TableCheckbox
                        checked={isAllSelected}
                        indeterminate={isSomeSelected && !isAllSelected}
                        onChange={toggleSelectAll}
                        title={isAllSelected ? 'Deselect all' : 'Select all on this page'}
                      />
                    </th>
                  )}
                  <th style={{ width: 130, color: 'var(--admin-text-muted)' }}>ID</th>
                  <th style={{ width: '20%', color: 'var(--admin-text-muted)' }}>Patient</th>
                  <th style={{ width: '18%', color: 'var(--admin-text-muted)' }}>Contact Info</th>
                  <th style={{ width: '16%', color: 'var(--admin-text-muted)' }}>Clinical Info</th>
                  <th style={{ width: '20%', color: 'var(--admin-text-muted)' }}>Location Profile</th>
                  <th style={{ width: '14%', color: 'var(--admin-text-muted)' }}>Registered</th>
                  <th style={{ width: isAdmin ? 130 : 80, textAlign: 'right', paddingRight: 24, color: 'var(--admin-text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(patient => {
                  const isSelected = selectedIds.includes(patient.id)
                  const displayName = patient.name || patient.user?.name || 'Unnamed'
                  const displayPhone = patient.phone || patient.mobile || patient.user?.phone || patient.user?.mobile
                  const displayEmail = patient.email || patient.user?.email

                  return (
                    <tr
                      key={patient.id}
                      style={{
                        background: isSelected ? 'rgba(16, 185, 129, 0.06)' : undefined,
                        transition: 'background 0.15s'
                      }}
                    >
                      {isAdmin && (
                        <td style={{ width: 44, textAlign: 'center', paddingLeft: 16 }} onClick={e => e.stopPropagation()}>
                          <TableCheckbox
                            checked={isSelected}
                            onChange={() => toggleSelectOne(patient.id)}
                            title="Select row"
                          />
                        </td>
                      )}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <CompactUlid value={patient.public_id || patient.id} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, overflow: 'hidden', flexShrink: 0 }}>
                            {patient.profile_pic || patient.photo ? (
                              <img src={getMediaUrl(patient.profile_pic || patient.photo)} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none' }} />
                            ) : (
                              displayName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--admin-text)', fontSize: 13.5 }}>{displayName}</div>
                            {patient.patient_id && (
                              <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontFamily: 'monospace' }}>#{patient.patient_id}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, color: 'var(--admin-text)' }}>{displayPhone || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{displayEmail || ''}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ 
                            fontSize: 11, 
                            fontWeight: 700, 
                            padding: '2px 8px', 
                            borderRadius: 12, 
                            background: patient.blood_group ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.1)', 
                            color: patient.blood_group ? '#EF4444' : 'var(--admin-text-muted)' 
                          }}>
                            {patient.blood_group || 'Blood N/A'}
                          </span>
                          <span style={{ 
                            fontSize: 11, 
                            fontWeight: 600, 
                            padding: '2px 8px', 
                            borderRadius: 12, 
                            background: 'rgba(99, 102, 241, 0.1)', 
                            color: '#6366f1' 
                          }}>
                            {patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'Gender N/A'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--admin-text)' }}>
                          {[patient.division?.name, patient.district?.name].filter(Boolean).join(', ') || 'No regional profile'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                          {[patient.upazila?.name, patient.union?.name].filter(Boolean).join(', ')}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12, color: 'var(--admin-text)', fontWeight: 500 }}>
                          {patient.created_at ? new Date(patient.created_at).toLocaleDateString('en-GB') : '—'}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>
                          {patient.created_at ? new Date(patient.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: 24 }}>
                        <div className="admin-actions" style={{ justifyContent: 'flex-end', display: 'inline-flex', gap: 6 }}>
                          <Link
                            to={`/admin/patients/view/${patient.id}`}
                            className="admin-action-btn admin-action-btn-view"
                            title="View patient details"
                          >
                            <img src="/icons/view.png" alt="View" />
                          </Link>
                          {isAdmin && (
                            <Link
                              to={`/admin/patients/edit/${patient.id}`}
                              className="admin-action-btn admin-action-btn-edit"
                              title="Edit patient profile"
                            >
                              <img src="/icons/edit.png" alt="Edit" />
                            </Link>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => setDeleteTarget(patient)}
                              className="admin-action-btn admin-action-btn-delete"
                              title="Delete patient account"
                            >
                              <img src="/icons/delete.png" alt="Delete" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
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

      <DeleteModal
        show={showBulkDeleteModal}
        title="Bulk Delete Patients"
        message={`Are you sure you want to delete ${selectedIds.length} selected patient(s)? All associated clinical records will be removed. This action cannot be undone.`}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteModal(false)}
        loading={bulkDeleting}
      />
    </div>
  )
}

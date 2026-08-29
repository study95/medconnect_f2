// PatientListPage.jsx — Premium Admin patient management (separate table from users)
import { useState, useEffect, useRef, useMemo } from 'react'
import { Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { getMediaUrl } from '../../../utils/mediaUtils'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { getPatients, deleteAdminPatient, getDivisions, getDistricts, getUpazilas, getUnions } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'
import { getErrorMessage } from '../../../utils/errorHelper'
import toast from 'react-hot-toast'

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
    loadInitialLocations()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, divisionId, districtId, upazilaId, unionId, dateFrom])

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
      const params = { per_page: 500 }
      if (search.trim()) params.search = search.trim()
      if (divisionId) params.division_id = divisionId
      if (districtId) params.district_id = districtId
      if (upazilaId) params.upazila_id = upazilaId
      if (unionId) params.union_id = unionId
      if (dateFrom) params.date_from = dateFrom

      const res = await getPatients(params)
      setPatients(res.data?.data?.data || res.data?.data || [])
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load patients list.'))
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setDateFrom('')
    setDivisionId(''); setDistrictId(''); setUpazilaId(''); setUnionId('')
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await deleteAdminPatient(deleteTarget.id)
      setPatients(patients.filter(p => p.id !== deleteTarget.id))
      toast.success(res.data?.message || 'Patient deleted successfully.')
    } catch (err) {
      console.error('Failed to delete patient', err)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
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
        <div className="admin-card-header">
          <h3 className="admin-card-title">Patient Records</h3>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', background: 'var(--admin-bg)', padding: '4px 12px', borderRadius: 20 }}>
            {filtered.length} Accounts Found
          </span>
        </div>

        {loading ? (
          <TableSkeleton rowCount={8} columnWidths={['110px', '20%', '18%', '16%', '20%', '14%', '130px']} headers={['ID', 'Patient', 'Contact Info', 'Clinical Info', 'Location Profile', 'Registered', 'Actions']} />
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={Boolean(divisionId || districtId || upazilaId || unionId || dateFrom || search)} searchQuery={search} onClearFilters={clearFilters} onClearSearch={() => setSearch('')} icon="👤" title="No patients found" description="Try changing your search keywords or clear applied filters." primaryAction={isAdmin ? { label: '+ Register New Patient', to: '/admin/patients/create' } : undefined} />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 110, paddingLeft: 24, color: 'var(--admin-text-muted)' }}>ID</th>
                  <th style={{ width: '20%', color: 'var(--admin-text-muted)' }}>Patient</th>
                  <th style={{ width: '18%', color: 'var(--admin-text-muted)' }}>Contact Info</th>
                  <th style={{ width: '16%', color: 'var(--admin-text-muted)' }}>Clinical Info</th>
                  <th style={{ width: '20%', color: 'var(--admin-text-muted)' }}>Location Profile</th>
                  <th style={{ width: '14%', color: 'var(--admin-text-muted)' }}>Registered</th>
                  <th style={{ width: 130, textAlign: 'right', paddingRight: 24, color: 'var(--admin-text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(patient => {
                  const displayName = patient.name || patient.user?.name || 'Unnamed'
                  const displayPhone = patient.phone || patient.mobile || patient.user?.phone || patient.user?.mobile
                  const displayEmail = patient.email || patient.user?.email

                  return (
                    <tr key={patient.id} style={{ transition: 'background 0.15s' }}>
                      <td style={{ paddingLeft: 24 }}>
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
                            <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 13.5 }}>{displayName}</div>
                            {patient.occupation && <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{patient.occupation}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--admin-text)', fontSize: 13 }}>{displayPhone || '—'}</div>
                        <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{displayEmail || 'No email registered'}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ background: '#FEE2E2', color: '#EF4444', padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
                            {patient.blood_group || 'N/A'}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--admin-text)' }}>
                            {patient.gender ? (patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)) : 'Unknown'}
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
                            className="admin-btn admin-btn-outline admin-btn-sm"
                            style={{ padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                            title="View patient details"
                          >
                            👁️ View
                          </Link>
                          <Link
                            to={`/admin/patients/edit/${patient.id}`}
                            className="admin-btn admin-btn-outline admin-btn-sm"
                            style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center' }}
                            title="Edit patient profile"
                          >
                            ✏️
                          </Link>
                          {isAdmin && (
                            <button
                              onClick={() => setDeleteTarget(patient)}
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              style={{ padding: '4px 8px' }}
                              title="Delete patient account"
                            >
                              🗑️
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
    </div>
  )
}

// ChamberListPage.jsx — Premium Doctor Chamber Management
import { getErrorMessage } from '../../../utils/errorHelper'
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { getChambers, deleteChamber, getDoctors, getHospitals, toggleChamberActive } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'

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
  const { user, isAdmin, isManager, isDoctor, hasPermission } = useAuth()
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
  const [dayFilter, setDayFilter] = useState('')
  
  // Filter Options
  const [doctors, setDoctors] = useState([])
  const [hospitals, setHospitals] = useState([])

  const isDoctorOnly = !isAdmin && !isManager && isDoctor

  useEffect(() => { 
    fetchData() 
    fetchOptions()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData()
    }, 300)
    return () => clearTimeout(timer)
  }, [doctorId, hospitalId, statusFilter, search])

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
      if (search && search.trim()) params.search = search.trim()
      
      if (!isDoctorOnly) {
        if (doctorId) params.doctor_id = doctorId
        if (hospitalId) params.hospital_id = hospitalId
        if (statusFilter !== '') params.is_active = statusFilter
      }

      const res = await getChambers(params)
      setItems(res.data?.data?.data || res.data?.data || res.data || [])
    } catch (err) {
      console.error('Failed to load chambers', err)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setDoctorId('')
    setHospitalId('')
    setStatusFilter('')
    setDayFilter('')
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteChamber(deleteTarget.id)
      setItems(items.filter(i => i.id !== deleteTarget.id))
    } catch (err) {
      console.error(err)
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
      console.error(err)
    }
  }

  const hasActiveFilters = Boolean(search || doctorId || hospitalId || statusFilter !== '' || dayFilter)

  const filtered = items.filter(i => {
    if (dayFilter && i.day !== dayFilter) return false
    if (search && search.trim()) {
      const q = search.trim().toLowerCase()
      const docName = (i.doctor?.name || i.doctor_name || '').toLowerCase()
      const docNameBn = (i.doctor?.name_bn || '').toLowerCase()
      const docSpecialty = (i.doctor?.specialty?.name || (i.doctor?.specialties?.map(s => s.name).join(' ')) || '').toLowerCase()
      const bmdc = (i.doctor?.bmdc || '').toLowerCase()
      const hospName = (i.hospital?.name || i.hospital_name || '').toLowerCase()
      const hospNameBn = (i.hospital?.name_bn || '').toLowerCase()
      const hospAddress = (i.hospital?.address || i.address || '').toLowerCase()
      const day = (i.day || '').toLowerCase()
      const room = (i.room_number || '').toLowerCase()
      const fee = String(i.fee || '')
      const id = String(i.id || '')
      const publicId = (i.public_id || '').toLowerCase()

      const matches = docName.includes(q) ||
        docNameBn.includes(q) ||
        docSpecialty.includes(q) ||
        bmdc.includes(q) ||
        hospName.includes(q) ||
        hospNameBn.includes(q) ||
        hospAddress.includes(q) ||
        day.includes(q) ||
        room.includes(q) ||
        fee.includes(q) ||
        id.includes(q) ||
        publicId.includes(q)

      if (!matches) return false
    }
    return true
  })

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
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search chamber by doctor, hospital, day, room..."
        onRefresh={fetchData}
        refreshing={loading}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={Boolean(doctorId || hospitalId || statusFilter || dayFilter)}
        onClearFilters={clearFilters}
        activeFilters={[
          doctorId && { key: 'doctor', label: `Doctor: ${doctors.find(d => String(d.id) === String(doctorId))?.name || doctorId}`, onRemove: () => setDoctorId('') },
          hospitalId && { key: 'hospital', label: `Hospital: ${hospitals.find(h => String(h.id) === String(hospitalId))?.name || hospitalId}`, onRemove: () => setHospitalId('') },
          dayFilter && { key: 'day', label: `Day: ${dayFilter}`, onRemove: () => setDayFilter('') },
        ].filter(Boolean)}
        actions={
          (isAdmin || hasPermission('chamber.create')) && (
            <Link to="/admin/chambers/create" className="admin-btn admin-btn-primary" style={{ height: 38, display: 'inline-flex', alignItems: 'center' }}>
              + Add New Chamber
            </Link>
          )
        }
      >
        {!isDoctorOnly && (
          <SearchableSelect label="Doctor" placeholder="All Doctors" options={doctors} value={doctorId} onChange={setDoctorId} />
        )}
        <SearchableSelect label="Hospital" placeholder="All Hospitals" options={hospitals} value={hospitalId} onChange={setHospitalId} />
        <div style={{ minWidth: 140 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Day</label>
          <select value={dayFilter} onChange={e => setDayFilter(e.target.value)} style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }}>
            <option value="">All Days</option>
            {['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </ListToolbar>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Active Chamber Routines</h3>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', background: 'var(--admin-bg)', padding: '4px 12px', borderRadius: 20 }}>
            {filtered.length} Routines
          </span>
        </div>

        {loading ? (
          <TableSkeleton rowCount={8} columnWidths={['100px', '22%', '22%', '15%', '15%', '10%', '16%']} headers={['ID', 'Doctor', 'Hospital', 'Schedule', 'Fee', 'Status', 'Actions']} />
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters} searchQuery={search} onClearFilters={clearFilters} onClearSearch={() => setSearch('')} icon="📅" title="No chambers found" description="Try adjusting your filter preferences or schedule a new chamber routine." primaryAction={(isAdmin || hasPermission('chamber.create')) ? { label: '+ Add New Chamber', to: '/admin/chambers/create' } : undefined} />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 80, paddingLeft: 24, color: 'var(--admin-text-muted)' }}>ID</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Doctor</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Hospital & Location</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Schedule & Capacity</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Consultation Fee</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Active Status</th>
                  <th style={{ textAlign: 'right', paddingRight: 24, color: 'var(--admin-text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(chamber => (
                  <tr key={chamber.id} style={{ transition: 'background 0.15s' }}>
                    <td style={{ paddingLeft: 24 }}>
                      <CompactUlid value={chamber.id} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 13.5 }}>{chamber.doctor?.name || 'Unknown Doctor'}</div>
                      <div style={{ fontSize: 11, color: '#00A88C', fontWeight: 600 }}>{chamber.doctor?.specialties?.map(s => s.name).join(', ') || 'Specialist'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--admin-text)', fontSize: 13 }}>{chamber.hospital?.name || 'Independent Clinic'}</div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>Room: {chamber.room_number || 'N/A'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 6, background: 'rgba(0, 168, 140, 0.1)', color: '#00A88C', fontWeight: 700, fontSize: 11.5, marginBottom: 2 }}>
                        {chamber.day || 'Daily'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--admin-text)', fontWeight: 500 }}>
                        {chamber.start_time} - {chamber.end_time}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--admin-text-muted)' }}>Max: {chamber.max_patients || 'Unlimited'} patients</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 13 }}>৳{chamber.fee || 0}</div>
                      {chamber.followup_fee > 0 && (
                        <div style={{ fontSize: 10.5, color: 'var(--admin-text-muted)' }}>Followup: ৳{chamber.followup_fee}</div>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggle(chamber.id)}
                        className={`admin-badge ${chamber.is_active ? 'admin-badge-success' : 'admin-badge-danger'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Click to toggle status"
                      >
                        {chamber.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          onClick={() => navigate(`/admin/chambers/edit/${chamber.id}`)}
                          className="admin-btn admin-btn-outline admin-btn-sm"
                          style={{ padding: '4px 8px' }}
                          title="Edit chamber routine"
                        >
                          ✏️
                        </button>
                        {(isAdmin || hasPermission('chamber.delete')) && (
                          <button
                            onClick={() => setDeleteTarget(chamber)}
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            style={{ padding: '4px 8px' }}
                            title="Delete chamber routine"
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

      <TableFooter
        total={filtered.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        perPage={perPage}
        setPerPage={setPerPage}
      />

      <DeleteModal
        show={!!deleteTarget}
        title="Remove Chamber Routine"
        message="Are you sure you want to delete this chamber visiting routine? Future appointments may be affected."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
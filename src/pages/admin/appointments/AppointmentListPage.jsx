import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../../context/AuthContext'
import { useAdminAppointments, useAdminAppointmentLookups, useAdminAppointmentMutations } from '../../../features/appointments/useAdminAppointments'
import StatusBadge from '../../../components/admin/StatusBadge'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'
import SearchableSelect from '../../../components/common/SearchableSelect'
import useDebounce from '../../../hooks/useDebounce'

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

export default function AppointmentListPage() {
  const { user, isAdmin, isDoctor, isManager } = useAuth()
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [changingStatus, setChangingStatus] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)

  // Filters State
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 350)
  const [date, setDate] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [hospitalId, setHospitalId] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Reset to page 1 whenever any filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, date, month, year, doctorId, hospitalId, roleFilter, activeTab])

  // Memoized server filters for TanStack Query
  const serverFilters = useMemo(() => {
    const params = {
      page: currentPage,
      per_page: perPage,
    }
    if (debouncedSearch && debouncedSearch.trim()) params.search = debouncedSearch.trim()
    if (date) params.date = date
    if (month) params.month = month
    if (year) params.year = year
    if (doctorId) params.doctor_id = doctorId
    if (hospitalId) params.hospital_id = hospitalId
    if (roleFilter) params.role = roleFilter
    if (activeTab !== 'all') params.status = activeTab
    return params
  }, [currentPage, perPage, debouncedSearch, date, month, year, doctorId, hospitalId, roleFilter, activeTab])

  // Enterprise TanStack Query Hooks
  const { appointments, total, isLoading: loading, refetch: fetchAppointments } = useAdminAppointments(serverFilters)
  const { doctors, hospitals } = useAdminAppointmentLookups()
  const {
    deleteAppointment,
    isDeleting: deleting,
    bulkDeleteAppointments,
    isBulkDeleting: bulkDeleting,
    updateAppointmentStatus,
  } = useAdminAppointmentMutations()

  const handleStatusChange = async (id, newStatus) => {
    setChangingStatus(id)
    try {
      await updateAppointmentStatus({ id, status: newStatus })
    } catch (err) {
      console.error('Failed to update status', err)
    } finally {
      setChangingStatus(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteAppointment(deleteTarget.id)
      toast.success('Appointment deleted successfully')
      setSelectedIds(prev => prev.filter(id => id !== deleteTarget.id))
    } catch (err) {
      console.error('Failed to delete appointment', err)
      toast.error('Failed to delete appointment')
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    try {
      const res = await bulkDeleteAppointments(selectedIds)
      toast.success(res.data?.message || `Successfully deleted ${selectedIds.length} appointment(s)`)
      setSelectedIds([])
      setShowBulkDeleteModal(false)
    } catch (err) {
      console.error('Failed to delete selected appointments', err)
      toast.error(err.response?.data?.message || 'Failed to delete selected appointments')
    }
  }

  const isAllSelected = appointments.length > 0 && appointments.every(a => selectedIds.includes(a.id))
  const isSomeSelected = appointments.some(a => selectedIds.includes(a.id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const pageIds = appointments.map(a => a.id)
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)))
    } else {
      const newIds = appointments.map(a => a.id).filter(id => !selectedIds.includes(id))
      setSelectedIds(prev => [...prev, ...newIds])
    }
  }

  const toggleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const clearFilters = () => {
    setSearch('')
    setDate('')
    setMonth('')
    setYear('')
    setDoctorId('')
    setHospitalId('')
    setRoleFilter('')
    setActiveTab('all')
  }

  const roleOptions = [
    { id: 'patient', name: '😷 Patient' },
    { id: 'doctor', name: '👨‍⚕️ Doctor' },
    { id: 'manager', name: '🏥 Hospital' },
    { id: 'admin', name: '🔧 Admin' }
  ]

  const months = [
    { id: 1, name: 'January' }, { id: 2, name: 'February' }, { id: 3, name: 'March' },
    { id: 4, name: 'April' }, { id: 5, name: 'May' }, { id: 6, name: 'June' },
    { id: 7, name: 'July' }, { id: 8, name: 'August' }, { id: 9, name: 'September' },
    { id: 10, name: 'October' }, { id: 11, name: 'November' }, { id: 12, name: 'December' }
  ]

  const years = Array.from({ length: 5 }, (_, i) => ({ id: new Date().getFullYear() + i, name: String(new Date().getFullYear() + i) }))


  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>📅</span>
            Appointment Management
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Track patient bookings and manage clinical schedules</p>
        </div>
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by ID, patient name, doctor, hospital, serial, phone..."
        onRefresh={fetchAppointments}
        refreshing={loading}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={Boolean(date || month || year || doctorId || hospitalId || roleFilter || activeTab !== 'all' || search)}
        onClearFilters={clearFilters}
        activeFilters={[
          date && { key: 'date', label: `Date: ${date}`, onRemove: () => setDate('') },
          month && { key: 'month', label: `Month: ${months.find(m => String(m.id) === String(month))?.name || month}`, onRemove: () => setMonth('') },
          year && { key: 'year', label: `Year: ${year}`, onRemove: () => setYear('') },
          doctorId && { key: 'doctor', label: `Doctor: ${doctors.find(d => String(d.id) === String(doctorId))?.name || doctorId}`, onRemove: () => setDoctorId('') },
          hospitalId && { key: 'hospital', label: `Hospital: ${hospitals.find(h => String(h.id) === String(hospitalId))?.name || hospitalId}`, onRemove: () => setHospitalId('') },
          roleFilter && { key: 'role', label: `Role: ${roleFilter}`, onRemove: () => setRoleFilter('') },
          activeTab !== 'all' && { key: 'status', label: `Status: ${activeTab.toUpperCase()}`, onRemove: () => setActiveTab('all') },
        ].filter(Boolean)}
      >
        <div style={{ minWidth: 140 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }} />
        </div>
        <div style={{ minWidth: 130 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Month</label>
          <select value={month} onChange={e => setMonth(e.target.value)} style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }}>
            <option value="">All Months</option>
            {months.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 110 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Year</label>
          <select value={year} onChange={e => setYear(e.target.value)} style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }}>
            <option value="">All Years</option>
            {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
        </div>
        <SearchableSelect label="Doctor" placeholder="All Doctors" options={doctors} value={doctorId} onChange={setDoctorId} />
        {!isManager && (
          <SearchableSelect label="Hospital" placeholder="All Hospitals" options={hospitals} value={hospitalId} onChange={setHospitalId} />
        )}
        <SearchableSelect label="Role" placeholder="All Roles" options={roleOptions} value={roleFilter} onChange={setRoleFilter} />
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
            <h3 className="admin-card-title" style={{ margin: 0 }}>Patient Appointments</h3>
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
              <strong style={{ color: 'var(--admin-text, #0F172A)' }}>{total}</strong> Results
            </div>
          </div>
        </div>

        <div className="admin-card-body" style={{ padding: 0 }}>
          {loading ? (
            <TableSkeleton 
              rowCount={8} 
              columnWidths={isAdmin ? ['44px', '120px', '22%', '20%', '18%', '12%', '16%'] : ['120px', '22%', '20%', '18%', '12%', '16%']} 
              headers={isAdmin ? ['', 'ID & Serial', 'Patient Info', 'Doctor & Chamber', 'Appointment Schedule', 'Status & Payment', 'Actions'] : ['ID & Serial', 'Patient Info', 'Doctor & Chamber', 'Appointment Schedule', 'Status & Payment', 'Actions']} 
            />
          ) : appointments.length === 0 ? (
            <EmptyState hasFilters={Boolean(date || month || year || doctorId || hospitalId || roleFilter || activeTab !== 'all' || search)} searchQuery={search} onClearFilters={clearFilters} onClearSearch={() => setSearch('')} icon="📅" title="No appointments found" description="Try selecting a different date range or reset active filters." />
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
                    <th style={{ width: 135 }}>ID</th>
                    <th style={{ minWidth: 170 }}>Patient Details</th>
                    <th style={{ minWidth: 160 }}>Doctor Information</th>
                    <th style={{ minWidth: 170 }}>Facility & Venue</th>
                    <th>Booked By</th>
                    <th>Schedule</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right', paddingRight: 24 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(appt => {
                    const isSelected = selectedIds.includes(appt.id)
                    return (
                    <tr
                      key={appt.id}
                      style={{
                        background: isSelected ? 'rgba(16, 185, 129, 0.06)' : undefined,
                        transition: 'background 0.15s',
                      }}
                    >
                      {isAdmin && (
                        <td style={{ width: 44, textAlign: 'center', paddingLeft: 16 }} onClick={e => e.stopPropagation()}>
                          <TableCheckbox
                            checked={isSelected}
                            onChange={() => toggleSelectOne(appt.id)}
                            title="Select row"
                          />
                        </td>
                      )}
                      <td style={{ whiteSpace: 'nowrap' }}><CompactUlid value={appt.public_id || appt.id} /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: 'var(--admin-text)', flexShrink: 0 }}>
                            {(appt.patient?.name || appt.user_name || 'P').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{appt.patient?.name || appt.user_name || 'Unknown Patient'}</div>
                            {(appt.patient_public_id || appt.patient?.public_id || appt.patient?.patient_id) ? (
                              <div style={{ marginTop: 4 }}>
                                <CompactUlid value={appt.patient_public_id || appt.patient?.public_id || appt.patient?.patient_id} />
                              </div>
                            ) : (
                              <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>—</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{appt.doctor?.name || appt.doctor_name || 'No Doctor assigned'}</div>
                        <div style={{ fontSize: 11, color: 'var(--admin-primary)', fontWeight: 600 }}>{appt.doctor?.specialty?.name || 'General Practitioner'}</div>
                        {(appt.doctor_public_id || appt.doctor?.public_id || appt.doctor?.id) && (
                          <div style={{ marginTop: 4 }}>
                            <CompactUlid value={appt.doctor_public_id || appt.doctor?.public_id || appt.doctor?.id} />
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{appt.hospital?.name || appt.hospital_name || '—'}</div>
                        {(appt.hospital_public_id || appt.hospital?.public_id || appt.hospital?.id) && (
                          <div style={{ marginTop: 4 }}>
                            <CompactUlid value={appt.hospital_public_id || appt.hospital?.public_id || appt.hospital?.id} />
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, overflow: 'hidden', background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 16 }}>{appt.created_by_role === 'patient' ? '👤' : '👨‍⚕️'}</span>
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--admin-text)' }}>{appt.created_by_name || 'Unknown'}</div>
                            <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: appt.created_by_role === 'patient' ? '#6366F1' : '#0D9488' }}>
                              {appt.created_by_role || 'System'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>
                            {appt.date ? new Date(appt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(0, 168, 140, 0.1)', color: '#00A88C', padding: '2px 6px', borderRadius: 4 }}>
                            Serial-{appt.serial_number || 1}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>{appt.time || '10:00 AM'}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <select
                            className={`status-select-minimal status-${appt.status}`}
                            value={appt.status}
                            disabled={changingStatus === appt.id}
                            onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: 24 }}>
                        <div className="admin-actions" style={{ justifyContent: 'flex-end' }}>
                          <Link to={`/admin/appointments/view/${appt.id}`} className="admin-action-btn admin-action-btn-view" title="View Details">
                            <img src="/icons/view.png" alt="View" />
                          </Link>
                          {isAdmin && (
                            <Link to={`/admin/appointments/edit/${appt.id}`} className="admin-action-btn admin-action-btn-edit" title="Edit Appointment">
                              <img src="/icons/edit.png" alt="Edit" />
                            </Link>
                          )}
                          {(isDoctor || isAdmin) && (
                            <Link 
                              to={appt.prescription_id ? `/admin/prescriptions/view/${appt.prescription_id}` : `/admin/prescriptions/create?appointment_id=${appt.id}`}
                              className="admin-btn admin-btn-outline admin-btn-sm"
                              style={{ color: 'var(--admin-primary)', borderColor: 'rgba(0, 168, 140, 0.2)', background: 'rgba(0, 168, 140, 0.05)', fontWeight: 800 }}
                            >
                              Rx
                            </Link>
                          )}
                          {isAdmin && (
                            <button className="admin-action-btn admin-action-btn-delete" title="Delete" onClick={() => setDeleteTarget(appt)}>
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
      </div>

      <TableFooter
        total={total}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        perPage={perPage}
        setPerPage={(val) => {
          setPerPage(val)
          setCurrentPage(1)
        }}
      />

      <DeleteModal
        show={!!deleteTarget}
        title="Delete Appointment"
        message="Are you sure you want to delete this appointment? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      <DeleteModal
        show={showBulkDeleteModal}
        title="Bulk Delete Appointments"
        message={`Are you sure you want to delete ${selectedIds.length} selected appointment(s)? This action cannot be undone.`}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteModal(false)}
        loading={bulkDeleting}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-container { animation: fadeIn 0.4s ease-out; }
        
        .status-tab {
          padding: 8px 20px;
          background: var(--admin-card-bg);
          border: 1px solid var(--admin-border);
          border-radius: 30px;
          font-size: 13px;
          font-weight: 700;
          color: var(--admin-text-muted);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .status-tab span {
          background: var(--admin-bg);
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
        }
        .status-tab.active {
          background: var(--tab-color, var(--admin-primary));
          color: white;
          border-color: var(--tab-color, var(--admin-primary));
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .status-tab.active span {
          background: rgba(255,255,255,0.2);
          color: white;
        }

        .status-select-minimal {
          border: none;
          background: var(--admin-bg);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          outline: none;
          color: var(--admin-text);
        }
        .status-select-minimal.status-pending { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
        .status-select-minimal.status-confirmed { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .status-select-minimal.status-completed { background: rgba(99, 102, 241, 0.15); color: #6366f1; }
        .status-select-minimal.status-cancelled { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  )
}

// AppointmentListPage.jsx — Admin appointment management with premium filters
import { useState, useRef, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useAdminAppointments, useAdminAppointmentLookups, useAdminAppointmentMutations } from '../../../features/appointments/useAdminAppointments'
import StatusBadge from '../../../components/admin/StatusBadge'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'

// Custom Searchable Dropdown Component (Premium Select)
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
    <div className="searchable-select-container" ref={dropdownRef} style={{ position: 'relative', flex: '1 1 200px', opacity: disabled ? 0.6 : 1 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div 
        className="status-select" 
        style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          cursor: disabled ? 'not-allowed' : 'pointer', background: disabled ? 'var(--admin-bg)' : 'var(--admin-card-bg)', 
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
          boxShadow: 'var(--admin-shadow-lg)', overflow: 'hidden', zIndex: 1000
        }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--admin-text-muted)' }}>🔍</span>
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
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '20px 14px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 12 }}>No matching results</div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt.id} 
                  style={{ 
                    padding: '10px 14px', fontSize: 13, cursor: 'pointer', 
                    background: value.toString() === opt.id.toString() ? 'rgba(0, 168, 140, 0.1)' : 'transparent',
                    borderBottom: '1px solid var(--admin-border)'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(0, 168, 140, 0.05)'}
                  onMouseLeave={(e) => e.target.style.background = value.toString() === opt.id.toString() ? 'rgba(0, 168, 140, 0.1)' : 'transparent'}
                  onClick={() => {
                    onChange(opt.id.toString())
                    setIsOpen(false)
                    setSearch('')
                  }}
                >
                  <div style={{ fontWeight: value.toString() === opt.id.toString() ? 700 : 500, color: 'var(--admin-text)' }}>{opt.name}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AppointmentListPage() {
  const { user, isAdmin, isDoctor, isManager } = useAuth()
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [changingStatus, setChangingStatus] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filters State
  const [search, setSearch] = useState('')
  const [date, setDate] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [hospitalId, setHospitalId] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Memoized server filters for TanStack Query
  const serverFilters = useMemo(() => {
    const params = {}
    if (date) params.date = date
    if (month) params.month = month
    if (year) params.year = year
    if (doctorId) params.doctor_id = doctorId
    if (hospitalId) params.hospital_id = hospitalId
    if (roleFilter) params.role = roleFilter
    if (activeTab !== 'all') params.status = activeTab
    return params
  }, [date, month, year, doctorId, hospitalId, roleFilter, activeTab])

  // Enterprise TanStack Query Hooks
  const { appointments, isLoading: loading, refetch: fetchAppointments } = useAdminAppointments(serverFilters)
  const { doctors, hospitals } = useAdminAppointmentLookups()
  const { deleteAppointment, isDeleting: deleting, updateAppointmentStatus } = useAdminAppointmentMutations()

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
    } catch (err) {
      console.error('Failed to delete appointment', err)
    } finally {
      setDeleteTarget(null)
    }
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

  const filtered = appointments.filter(appt => {
    if (!search) return true
    const q = search.toLowerCase().trim()
    const id = String(appt.public_id || appt.id || '').toLowerCase()
    const patientName = String(appt.patient_name || appt.patient?.name || appt.user_name || appt.user?.name || '').toLowerCase()
    const patientPhone = String(appt.patient_phone || appt.patient?.phone || appt.patient?.mobile || appt.user_phone || appt.user?.phone || appt.payment_number || '').toLowerCase()
    const doctorName = String(appt.doctor_name || appt.doctor?.name || '').toLowerCase()
    const specialtyName = String(appt.doctor?.specialty?.name || '').toLowerCase()
    const hospitalName = String(appt.hospital_name || appt.hospital?.name || appt.chamber?.hospital?.name || appt.chamber_name || '').toLowerCase()
    const serial = String(appt.serial_number || '').toLowerCase()
    const bookedBy = String(appt.created_by_user?.name || appt.created_by_name || appt.created_by_role || '').toLowerCase()
    const regId = String(appt.registration_id || '').toLowerCase()
    const txId = String(appt.transaction_id || '').toLowerCase()

    return id.includes(q) ||
      patientName.includes(q) ||
      patientPhone.includes(q) ||
      doctorName.includes(q) ||
      specialtyName.includes(q) ||
      hospitalName.includes(q) ||
      serial.includes(q) ||
      bookedBy.includes(q) ||
      regId.includes(q) ||
      txId.includes(q)
  })

  const paginatedData = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [filtered.length])

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
        <SearchableSelect label="Hospital" placeholder="All Hospitals" options={hospitals} value={hospitalId} onChange={setHospitalId} />
        <SearchableSelect label="Role" placeholder="All Roles" options={roleOptions} value={roleFilter} onChange={setRoleFilter} />
      </ListToolbar>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Patient Appointments</h3>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', background: 'var(--admin-bg)', padding: '4px 10px', borderRadius: 20 }}>
            {filtered.length} Results
          </span>
        </div>

        <div className="admin-card-body" style={{ padding: 0 }}>
          {loading ? (
            <TableSkeleton rowCount={8} columnWidths={['120px', '22%', '20%', '18%', '12%', '16%']} headers={['ID & Serial', 'Patient Info', 'Doctor & Chamber', 'Appointment Schedule', 'Status & Payment', 'Actions']} />
          ) : filtered.length === 0 ? (
            <EmptyState hasFilters={Boolean(date || month || year || doctorId || hospitalId || roleFilter || activeTab !== 'all' || search)} searchQuery={search} onClearFilters={clearFilters} onClearSearch={() => setSearch('')} icon="📅" title="No appointments found" description="Try selecting a different date range or reset active filters." />
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 24 }}>ID</th>
                    <th>Patient Details</th>
                    <th>Doctor Information</th>
                    <th>Facility & Venue</th>
                    <th>Booked By</th>
                    <th>Schedule</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right', paddingRight: 24 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map(appt => (
                    <tr key={appt.id}>
                      <td style={{ paddingLeft: 24 }}><CompactUlid value={appt.public_id || appt.id} /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: 'var(--admin-text)' }}>
                            {(appt.patient?.name || appt.user_name || 'P').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{appt.patient?.name || appt.user_name || 'Unknown Patient'}</div>
                            <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{appt.patient?.phone || appt.patient?.mobile || appt.patient?.email || appt.user_email || 'No contact info'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{appt.doctor?.name || appt.doctor_name || 'No Doctor assigned'}</div>
                        <div style={{ fontSize: 11, color: 'var(--admin-primary)', fontWeight: 600 }}>{appt.doctor?.specialty?.name || 'General Practitioner'}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{appt.hospital?.name || appt.hospital_name || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{appt.chamber_name || 'General Appointment'}</div>
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
                          <Link to={`/admin/appointments/view/${appt.id}`} className="admin-btn admin-btn-outline admin-btn-sm">👁️ View</Link>
                          {isAdmin && (
                            <Link to={`/admin/appointments/edit/${appt.id}`} className="admin-btn admin-btn-outline admin-btn-sm">✏️</Link>
                          )}
                          {(isDoctor || isAdmin) && (
                            <Link 
                              to={appt.prescription_id ? `/admin/prescriptions/view/${appt.prescription_id}` : `/admin/prescriptions/create?appointment_id=${appt.id}`}
                              className="admin-btn admin-btn-outline admin-btn-sm"
                              style={{ color: 'var(--admin-primary)', borderColor: 'rgba(0, 168, 140, 0.2)', background: 'rgba(0, 168, 140, 0.05)' }}
                            >
                              Rx
                            </Link>
                          )}
                          {(isAdmin || isManager) && (
                            <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => setDeleteTarget(appt)}>🗑️</button>
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

      <TableFooter
        total={filtered.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        perPage={perPage}
        setPerPage={setPerPage}
      />

      <DeleteModal
        show={!!deleteTarget}
        title="Delete Appointment"
        message="Are you sure you want to delete this appointment? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
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

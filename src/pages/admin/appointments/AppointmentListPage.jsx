// AppointmentListPage.jsx — Admin appointment management with premium filters
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { getAppointments, updateAppointment, deleteAppointment, getDoctors, getHospitals } from '../../../api/adminApi'
import StatusBadge from '../../../components/admin/StatusBadge'
import DeleteModal from '../../../components/admin/DeleteModal'
import { getErrorMessage } from '../../../utils/errorHelper'

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
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [doctors, setDoctors] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [changingStatus, setChangingStatus] = useState(null)

  // Filters State
  const [search, setSearch] = useState('')
  const [date, setDate] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [hospitalId, setHospitalId] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    loadInitialData()
    fetchAppointments()
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [date, month, year, doctorId, hospitalId, roleFilter, activeTab])

  const loadInitialData = async () => {
    try {
      const [docRes, hospRes] = await Promise.all([
        getDoctors({ per_page: 500 }),
        getHospitals({ per_page: 500 })
      ])
      setDoctors(docRes.data?.data?.data || docRes.data?.data || [])
      setHospitals(hospRes.data?.data?.data || hospRes.data?.data || [])
    } catch (err) {
      console.error('Failed to load filter data', err)
    }
  }

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const params = { per_page: 100 }
      if (search) params.search = search
      if (date) params.date = date
      if (month) params.month = month
      if (year) params.year = year
      if (doctorId) params.doctor_id = doctorId
      if (hospitalId) params.hospital_id = hospitalId
      if (roleFilter) params.role = roleFilter
      if (activeTab !== 'all') params.status = activeTab

      const res = await getAppointments(params)
      setAppointments(res.data?.data?.data || res.data?.data || [])
    } catch (err) {
} finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    setChangingStatus(id)
    try {
      await updateAppointment(id, { status: newStatus })
      setAppointments(appointments.map(a => a.id === id ? { ...a, status: newStatus } : a))
      
    } catch (err) {
} finally {
      setChangingStatus(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteAppointment(deleteTarget.id)
      setAppointments(appointments.filter(a => a.id !== deleteTarget.id))
      
    } catch (err) {
} finally {
      setDeleting(false)
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
    setTimeout(fetchAppointments, 0)
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

  const stats = {
    all: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  }

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
        <button className="admin-btn admin-btn-primary" onClick={() => navigate('/admin/appointments/create')}>
          + New Appointment
        </button>
      </div>

      {/* Advanced Filter Card */}
      <div className="admin-card" style={{ marginBottom: 28, borderTop: '4px solid var(--admin-primary)', overflow: 'visible' }}>
        <div className="admin-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, alignItems: 'flex-end' }}>
            
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Search</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="status-select" 
                  placeholder="Doctor, patient, or date..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: '100%', height: 42, paddingLeft: 40, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                />
                <span style={{ position: 'absolute', left: 14, top: 11, fontSize: 16 }}>🔍</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Date</label>
              <input type="date" className="status-select" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', height: 42, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }} />
            </div>

            <SearchableSelect label="Month" options={months} value={month} onChange={setMonth} placeholder="All Months" />
            <SearchableSelect label="Year" options={years} value={year} onChange={setYear} placeholder="All" />
            <SearchableSelect label="Doctor Filter" options={doctors} value={doctorId} onChange={setDoctorId} placeholder="All Doctors" />
            <SearchableSelect label="Hospital Filter" options={hospitals} value={hospitalId} onChange={setHospitalId} placeholder="All Hospitals" />
            <SearchableSelect label="Role" options={roleOptions} value={roleFilter} onChange={setRoleFilter} placeholder="All Roles" />

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="admin-btn admin-btn-primary" onClick={fetchAppointments} style={{ height: 42, padding: '0 24px' }}>Refresh</button>
              {(search || date || month || year || doctorId || hospitalId || roleFilter) && (
                <button className="admin-btn admin-btn-outline" onClick={clearFilters} style={{ height: 42, color: 'var(--admin-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>Reset</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs / Counters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
        <div className={`status-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')} style={{ '--tab-color': '#00A88C' }}>
          All <span>{stats.all}</span>
        </div>
        <div className={`status-tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')} style={{ '--tab-color': '#F59E0B' }}>
          ⏳ Pending <span>{stats.pending}</span>
        </div>
        <div className={`status-tab ${activeTab === 'confirmed' ? 'active' : ''}`} onClick={() => setActiveTab('confirmed')} style={{ '--tab-color': '#10B981' }}>
          ✅ Confirmed <span>{stats.confirmed}</span>
        </div>
        <div className={`status-tab ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')} style={{ '--tab-color': '#6366F1' }}>
          ✔ Completed <span>{stats.completed}</span>
        </div>
        <div className={`status-tab ${activeTab === 'cancelled' ? 'active' : ''}`} onClick={() => setActiveTab('cancelled')} style={{ '--tab-color': '#EF4444' }}>
          ❌ Cancelled <span>{stats.cancelled}</span>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Patient Appointments</h3>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', background: 'var(--admin-bg)', padding: '4px 10px', borderRadius: 20 }}>
            {appointments.length} Results
          </span>
        </div>

        <div className="admin-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="admin-loading" style={{ padding: 60 }}><div className="admin-spinner" /> Loading records...</div>
          ) : appointments.length === 0 ? (
            <div className="admin-empty" style={{ padding: 60 }}>No appointments found.</div>
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
                    {isAdmin && <th>Economics</th>}
                    <th style={{ textAlign: 'right', paddingRight: 24 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(appt => (
                    <tr key={appt.id}>
                      <td style={{ paddingLeft: 24, fontWeight: 700, color: 'var(--admin-text-muted)' }}>#{appt.id}</td>
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
                        <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>
                          {appt.date ? new Date(appt.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 500 }}>{appt.time || 'Schedule not set'}</div>
                      </td>
                      <td>
                        {(isAdmin || isDoctor) ? (
                          <select
                            className={`status-select-minimal status-${appt.status}`}
                            value={appt.status}
                            onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                            disabled={changingStatus === appt.id}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        ) : (
                          <StatusBadge status={appt.status} />
                        )}
                      </td>
                      {isAdmin && (
                        <td>
                          {appt.commission_rate > 0 ? (
                            <div>
                              <div style={{ fontWeight: 800, color: 'var(--admin-text)' }}>৳{appt.commission_amount}</div>
                              <div style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>{appt.commission_rate}% Commission</div>
                            </div>
                          ) : <span style={{ color: 'var(--admin-text-muted)' }}>—</span>}
                        </td>
                      )}
                      <td style={{ textAlign: 'right', paddingRight: 24 }}>
                        <div className="admin-actions" style={{ justifyContent: 'flex-end' }}>
                          <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => navigate(`/admin/appointments/view/${appt.id}`)} title="View Details">👁️</button>
                          {(isAdmin || (isManager && new Date(appt.date) >= new Date().setHours(0,0,0,0))) && (
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

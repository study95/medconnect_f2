// ChamberListPage.jsx — Premium Doctor Chamber Management
import { getErrorMessage } from '../../../utils/errorHelper'
import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Filter, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../../context/AuthContext'
import { useDialog } from '../../../hooks/useDialog'
import { useAdminChambers, useAdminChamberLookups, useAdminChamberMutations } from '../../../features/chambers/useAdminChambers'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
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

// Helper to format 24h time to 12h AM/PM
function format12Hour(timeStr) {
  if (!timeStr) return '—'
  const parts = timeStr.split(':')
  if (parts.length < 2) return timeStr
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (isNaN(h)) return timeStr
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  const minStr = m < 10 ? `0${m}` : m
  return `${hour12}:${minStr} ${period}`
}

// Chamber Details Preview Modal
function ChamberDetailModal({ chamber, onClose, onEdit, canEdit }) {
  if (!chamber) return null

  return (
    <div 
      className="db-dialog-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--admin-card-bg, #ffffff)',
          borderRadius: 20,
          border: '1.5px solid var(--admin-border, #e2e8f0)',
          maxWidth: 560,
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          animation: 'fadeInSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--admin-border, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--admin-bg, #f8fafc)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #00A88C, #008f77)',
              color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 16
            }}>
              🏥
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--admin-text, #0f172a)' }}>
                Chamber Routine Details
              </h3>
              <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748b)', marginTop: 2 }}>
                Routine #{chamber.id} {chamber.public_id ? `• ${chamber.public_id}` : ''}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
              background: chamber.is_active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: chamber.is_active ? '#10B981' : '#EF4444',
              border: `1px solid ${chamber.is_active ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
            }}>
              {chamber.is_active ? '● ACTIVE' : '○ INACTIVE'}
            </span>
            <button
              onClick={onClose}
              style={{
                width: 30, height: 30, borderRadius: 8, border: 'none',
                background: 'transparent', cursor: 'pointer', color: 'var(--admin-text-muted, #64748b)',
                fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '22px 24px', maxHeight: 'calc(85vh - 130px)', overflowY: 'auto' }}>
          
          {/* Doctor Profile Box */}
          <div style={{
            padding: '14px 16px', borderRadius: 14,
            background: 'rgba(0, 168, 140, 0.04)',
            border: '1px solid rgba(0, 168, 140, 0.15)',
            marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 12,
              background: '#00A88C', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, flexShrink: 0
            }}>
              👨‍⚕️
            </div>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--admin-text, #0f172a)', fontSize: 15 }}>
                {chamber.doctor?.name || 'Assigned Doctor'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#00A88C' }}>
                  BMDC: {chamber.doctor?.bmdc || '—'}
                </span>
                {chamber.doctor?.specialty?.name && (
                  <>
                    <span style={{ color: 'var(--admin-border, #cbd5e1)' }}>•</span>
                    <span style={{ fontSize: 11.5, color: 'var(--admin-text-muted, #64748b)' }}>
                      {chamber.doctor.specialty.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            
            {/* Hospital / Facility */}
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--admin-bg, #f8fafc)', border: '1px solid var(--admin-border, #e2e8f0)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted, #64748b)', textTransform: 'uppercase', marginBottom: 4 }}>
                🏥 Hospital & Facility
              </div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--admin-text, #0f172a)' }}>
                {chamber.hospital?.name || 'Independent Clinic'}
              </div>
              {chamber.hospital?.address && (
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748b)', marginTop: 2 }}>
                  {chamber.hospital.address}
                </div>
              )}
            </div>

            {/* Room / Counter */}
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--admin-bg, #f8fafc)', border: '1px solid var(--admin-border, #e2e8f0)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted, #64748b)', textTransform: 'uppercase', marginBottom: 4 }}>
                🚪 Room / Counter
              </div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: chamber.room_number ? 'var(--admin-text, #0f172a)' : 'var(--admin-text-muted, #94a3b8)' }}>
                {chamber.room_number ? `Room: ${chamber.room_number}` : 'Not specified'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748b)', marginTop: 2 }}>
                {chamber.room_number ? 'Designated clinic room' : 'General OPD'}
              </div>
            </div>

            {/* Visiting Day & Time */}
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--admin-bg, #f8fafc)', border: '1px solid var(--admin-border, #e2e8f0)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted, #64748b)', textTransform: 'uppercase', marginBottom: 4 }}>
                🗓️ Schedule & Day
              </div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: '#00A88C' }}>
                {chamber.day || 'Daily'}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text, #0f172a)', marginTop: 2 }}>
                ⏰ {format12Hour(chamber.start_time)} – {format12Hour(chamber.end_time)}
              </div>
            </div>

            {/* Consultation Fee */}
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--admin-bg, #f8fafc)', border: '1px solid var(--admin-border, #e2e8f0)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted, #64748b)', textTransform: 'uppercase', marginBottom: 4 }}>
                💰 Consultation Fee
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#10B981' }}>
                ৳{chamber.fee || 0}
              </div>
              {chamber.slot_duration_minutes && (
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748b)', marginTop: 2 }}>
                  Slot: {chamber.slot_duration_minutes} mins {chamber.capacity ? `(${chamber.capacity} max)` : ''}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Modal Actions Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--admin-border, #e2e8f0)',
          background: 'var(--admin-bg, #f8fafc)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 10
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              border: '1.5px solid var(--admin-border, #cbd5e1)',
              background: 'var(--admin-card-bg, #ffffff)',
              color: 'var(--admin-text, #475569)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={() => { onClose(); onEdit(chamber.id) }}
              style={{
                padding: '8px 20px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #00A88C, #008f77)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 168, 140, 0.3)'
              }}
            >
              ✏️ Edit Chamber
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ChamberListPage() {
  const { user, isAdmin, isManager, isDoctor, hasPermission } = useAuth()
  const { showDialog } = useDialog()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [viewTarget, setViewTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Advanced Filters
  const [searchParams, setSearchParams] = useSearchParams()
  const initialStatus = searchParams.get('status') || 'all'
  const [doctorId, setDoctorId] = useState('')
  const [hospitalId, setHospitalId] = useState('')
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [dayFilter, setDayFilter] = useState('')

  const isDoctorOnly = !isAdmin && !isManager && isDoctor

  const canCreateChamber = Boolean(
    isAdmin || 
    isDoctor || 
    isManager || 
    hasPermission('chamber.create') || 
    hasPermission('doctor_chamber.create')
  )

  const handleStatusChange = (newStatus) => {
    setStatusFilter(newStatus)
    const newParams = new URLSearchParams(searchParams)
    if (newStatus && newStatus !== 'all') {
      newParams.set('status', newStatus)
    } else {
      newParams.delete('status')
    }
    setSearchParams(newParams, { replace: true })
  }

  // Server-side filter memo for TanStack Query
  const serverFilters = useMemo(() => {
    const params = {}
    if (!isDoctorOnly) {
      if (doctorId) params.doctor_id = doctorId
      if (hospitalId) params.hospital_id = hospitalId
    }
    if (statusFilter && statusFilter !== 'all') {
      params.status = statusFilter
    }
    return params
  }, [isDoctorOnly, doctorId, hospitalId, statusFilter])

  // Enterprise TanStack Query Hooks
  const { chambers: items, isLoading: loading, isFetching: refreshing, refetch: fetchData } = useAdminChambers(serverFilters)
  const { doctors, hospitals } = useAdminChamberLookups()
  const { deleteChamber, isDeleting: deleting, toggleChamberActive } = useAdminChamberMutations()

  const clearFilters = () => {
    setSearch('')
    setDoctorId('')
    setHospitalId('')
    setStatusFilter('all')
    setDayFilter('')
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('status')
    setSearchParams(newParams, { replace: true })
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteChamber(deleteTarget.id)
    } catch (err) {
      console.error('Failed to delete chamber', err)
    } finally {
      setDeleteTarget(null)
    }
  }

  const [togglingIds, setTogglingIds] = useState(new Set())

  const canToggleChamber = (chamber) => {
    if (!chamber) return false
    // Admin or staff with chamber permissions
    if (isAdmin || hasPermission('chamber.edit') || hasPermission('chamber.update') || user?.registration_type === 'admin') {
      return true
    }

    // Doctor: owns their chambers (backend enforces strict ownership)
    if (isDoctor || user?.registration_type === 'doctor') {
      if (user?.public_id && (chamber.doctor_id === user.public_id || chamber.doctor?.id === user.public_id || chamber.doctor?.public_id === user.public_id)) return true
      if (user?.doctor_id && (String(chamber.doctor_id) === String(user.doctor_id) || String(chamber.doctor?.id) === String(user.doctor_id))) return true
      if (chamber.doctor?.user_id && String(chamber.doctor.user_id) === String(user?.id)) return true
      if (user?.name && chamber.doctor?.name && chamber.doctor.name.toLowerCase() === user.name.toLowerCase()) return true
      if (!isAdmin && !isManager) return true
      return true
    }

    // Hospital Manager: manages their hospital's chambers
    if (isManager || user?.registration_type === 'hospital' || user?.registration_type === 'manager') {
      if (user?.public_id && (chamber.hospital_id === user.public_id || chamber.hospital?.id === user.public_id || chamber.hospital?.public_id === user.public_id)) return true
      if (user?.hospital_id && (String(chamber.hospital_id) === String(user.hospital_id) || String(chamber.hospital?.id) === String(user.hospital_id))) return true
      if (chamber.hospital?.user_id && String(chamber.hospital.user_id) === String(user?.id)) return true
      if (!isAdmin && !isDoctor) return true
      return true
    }

    return false
  }

  const handleToggle = async (chamber) => {
    if (!chamber || togglingIds.has(chamber.id)) return
    if (!canToggleChamber(chamber)) return

    const willDeactivate = Boolean(chamber.is_active)

    const confirmed = await showDialog({
      type: 'confirm',
      title: willDeactivate ? 'Disable Chamber?' : 'Enable Chamber?',
      message: willDeactivate
        ? 'Patients will no longer be able to book appointments for this chamber until you enable it again.'
        : 'Patients will be able to book appointments for this chamber again.',
      confirmText: willDeactivate ? 'Disable Chamber' : 'Enable Chamber',
      cancelText: 'Cancel',
      variant: willDeactivate ? 'danger' : 'primary',
      preventBackdropClose: true,
    })

    if (!confirmed) return

    setTogglingIds(prev => new Set(prev).add(chamber.id))

    try {
      await toggleChamberActive(chamber.id)
      if (willDeactivate) {
        toast.success('Chamber deactivated successfully.')
      } else {
        toast.success('Chamber activated successfully.')
      }
    } catch (err) {
      console.error('Failed to toggle chamber status', err)
      toast.error(getErrorMessage(err, 'Failed to update chamber status.'))
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev)
        next.delete(chamber.id)
        return next
      })
    }
  }

  const hasActiveFilters = Boolean(search || doctorId || hospitalId || (statusFilter && statusFilter !== 'all') || dayFilter)

  const filtered = items.filter(i => {
    if (dayFilter && i.day !== dayFilter) return false
    if (statusFilter === 'active' && !i.is_active) return false
    if (statusFilter === 'inactive' && i.is_active) return false
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
        hasActiveFilters={Boolean(doctorId || hospitalId || (statusFilter && statusFilter !== 'all') || dayFilter)}
        onClearFilters={clearFilters}
        activeFilters={[
          doctorId && { key: 'doctor', label: `Doctor: ${doctors.find(d => String(d.id) === String(doctorId))?.name || doctorId}`, onRemove: () => setDoctorId('') },
          hospitalId && { key: 'hospital', label: `Hospital: ${hospitals.find(h => String(h.id) === String(hospitalId))?.name || hospitalId}`, onRemove: () => setHospitalId('') },
          dayFilter && { key: 'day', label: `Day: ${dayFilter}`, onRemove: () => setDayFilter('') },
          (statusFilter && statusFilter !== 'all') && { key: 'status', label: `Status: ${statusFilter === 'active' ? 'Active' : 'Inactive'}`, onRemove: () => handleStatusChange('all') },
        ].filter(Boolean)}
        actions={
          canCreateChamber && (
            <Link
              to="/admin/chambers/create"
              className="admin-btn admin-btn-primary"
              style={{
                height: 38,
                padding: '0 16px',
                borderRadius: 9,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              <Plus size={15} />
              <span>Create Chamber</span>
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
        <div style={{ minWidth: 140 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Status</label>
          <select 
            value={statusFilter} 
            onChange={e => handleStatusChange(e.target.value)} 
            style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
          <TableSkeleton rowCount={8} columnWidths={['60px', '22%', '22%', '15%', '15%', '10%', '16%']} headers={['SL', 'Doctor', 'Hospital', 'Schedule', 'Fee', 'Status', 'Actions']} />
        ) : filtered.length === 0 ? (
          <EmptyState
            hasFilters={hasActiveFilters}
            searchQuery={search}
            onClearFilters={clearFilters}
            onClearSearch={() => setSearch('')}
            icon="📅"
            title={
              hasActiveFilters
                ? 'No chambers found'
                : 'No Chamber Schedule Yet'
            }
            description={
              hasActiveFilters
                ? 'Try adjusting your filter preferences or search query.'
                : 'Create your first chamber schedule so patients can book appointments.'
            }
            primaryAction={
              canCreateChamber
                ? {
                    label: 'Create Chamber',
                    to: '/admin/chambers/create',
                    icon: Plus,
                    variant: 'primary',
                  }
                : undefined
            }
          />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 60, paddingLeft: 24, color: 'var(--admin-text-muted)' }}>SL</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Doctor</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Hospital & Location</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Schedule & Capacity</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Consultation Fee</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Active Status</th>
                  <th style={{ textAlign: 'right', paddingRight: 24, color: 'var(--admin-text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((chamber, idx) => (
                  <tr key={chamber.id} style={{ transition: 'background 0.15s' }}>
                    <td style={{ paddingLeft: 24 }}>
                      <span style={{ 
                        fontSize: 12.5, 
                        fontWeight: 700, 
                        color: 'var(--admin-text-muted)',
                        fontVariantNumeric: 'tabular-nums' 
                      }}>
                        {String((currentPage - 1) * perPage + idx + 1).padStart(2, '0')}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 13.5 }}>{chamber.doctor?.name || 'Unknown Doctor'}</div>
                      <div style={{ fontSize: 11, color: '#00A88C', fontWeight: 600, marginTop: 2 }}>
                        BMDC: {chamber.doctor?.bmdc || '—'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--admin-text)', fontSize: 13 }}>{chamber.hospital?.name || 'Independent Clinic'}</div>
                      {chamber.room_number && (
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>Room: {chamber.room_number}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 6, background: 'rgba(0, 168, 140, 0.1)', color: '#00A88C', fontWeight: 700, fontSize: 11.5, marginBottom: 2 }}>
                        {chamber.day || 'Daily'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--admin-text)', fontWeight: 500 }}>
                        {format12Hour(chamber.start_time)} – {format12Hour(chamber.end_time)}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--admin-text-muted)' }}>
                        {chamber.capacity && Number(chamber.capacity) > 0 
                          ? `Capacity: ${chamber.capacity} Patients` 
                          : 'Capacity: Open'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 13 }}>৳{chamber.fee || 0}</div>
                      {chamber.slot_duration_minutes && (
                        <div style={{ fontSize: 10.5, color: 'var(--admin-text-muted)' }}>{chamber.slot_duration_minutes} min slots</div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {canToggleChamber(chamber) ? (
                          <>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={Boolean(chamber.is_active)}
                              aria-label="Toggle chamber availability"
                              disabled={togglingIds.has(chamber.id)}
                              onClick={() => handleToggle(chamber)}
                              onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.35)' }}
                              onBlur={(e) => { e.currentTarget.style.boxShadow = chamber.is_active ? '0 2px 5px rgba(16, 185, 129, 0.3)' : '0 1px 2px rgba(0,0,0,0.1)' }}
                              className="chamber-toggle-btn"
                              style={{
                                width: 44,
                                height: 22,
                                borderRadius: 12,
                                padding: '2px 3px',
                                cursor: togglingIds.has(chamber.id) ? 'wait' : 'pointer',
                                background: chamber.is_active ? '#10B981' : '#94A3B8',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                justifyContent: chamber.is_active ? 'flex-end' : 'flex-start',
                                border: 'none',
                                outline: 'none',
                                opacity: togglingIds.has(chamber.id) ? 0.65 : 1,
                                boxShadow: chamber.is_active ? '0 2px 5px rgba(16, 185, 129, 0.3)' : '0 1px 2px rgba(0,0,0,0.1)'
                              }}
                              title={`Click to ${chamber.is_active ? 'deactivate' : 'activate'} chamber`}
                            >
                              {togglingIds.has(chamber.id) ? (
                                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <div className="admin-spinner" style={{ width: 10, height: 10, borderWidth: 1.5, borderColor: '#10B981 transparent #10B981 transparent' }} />
                                </div>
                              ) : (
                                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
                              )}
                            </button>
                            <span style={{ 
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '1px 6px',
                              borderRadius: 5,
                              fontSize: 11, 
                              fontWeight: 800, 
                              letterSpacing: '0.04em',
                              background: chamber.is_active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.15)',
                              color: chamber.is_active ? '#059669' : '#64748b'
                            }}>
                              {chamber.is_active ? 'ON' : 'OFF'}
                            </span>
                          </>
                        ) : (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            background: chamber.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                            color: chamber.is_active ? '#10B981' : 'var(--admin-text-muted)',
                          }}>
                            <span style={{ fontSize: 7 }}>{chamber.is_active ? '●' : '○'}</span>
                            <span>{chamber.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          onClick={() => setViewTarget(chamber)}
                          className="admin-btn admin-btn-outline admin-btn-sm chamber-action-btn"
                          style={{ 
                            padding: '4px 8px', 
                            color: '#0284c7', 
                            borderColor: 'rgba(2, 132, 199, 0.25)', 
                            background: 'rgba(2, 132, 199, 0.06)' 
                          }}
                          aria-label="View chamber routine details"
                          title="View chamber routine details"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => navigate(`/admin/chambers/edit/${chamber.id}`)}
                          className="admin-btn admin-btn-outline admin-btn-sm chamber-action-btn"
                          style={{ padding: '4px 8px' }}
                          aria-label="Edit chamber routine"
                          title="Edit chamber routine"
                        >
                          ✏️
                        </button>
                        {(isAdmin || hasPermission('chamber.delete')) && (
                          <button
                            onClick={() => setDeleteTarget(chamber)}
                            className="admin-btn admin-btn-danger admin-btn-sm chamber-delete-btn"
                            style={{ padding: '4px 8px' }}
                            aria-label="Delete chamber routine"
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

      <ChamberDetailModal
        chamber={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={(id) => navigate(`/admin/chambers/edit/${id}`)}
        canEdit={isAdmin || hasPermission('chamber.edit') || hasPermission('chamber.update') || isDoctor || isManager}
      />

      <DeleteModal
        show={!!deleteTarget}
        title="Remove Chamber Routine"
        message="Are you sure you want to delete this chamber visiting routine? Future appointments may be affected."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        .chamber-toggle-btn:focus-visible {
          outline: 2px solid #10B981 !important;
          outline-offset: 2px !important;
        }
        .chamber-action-btn:focus-visible {
          outline: 2px solid #0284c7 !important;
          outline-offset: 2px !important;
        }
        .chamber-delete-btn:focus-visible {
          outline: 2px solid #ef4444 !important;
          outline-offset: 2px !important;
        }
        @keyframes fadeInSlide {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}} />
    </div>
  )
}
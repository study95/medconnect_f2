// DoctorListPage.jsx — Admin doctor management + Doctor own profile
import { useState, useEffect, useRef, useMemo } from 'react'
import { Filter, ChevronDown, ChevronUp, Award } from 'lucide-react'
import { getMediaUrl } from '../../../utils/mediaUtils'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useAdminDoctors, useAdminDoctorLookups, useAdminDoctorMutations } from '../../../features/doctors/useAdminDoctors'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../../../utils/errorHelper'

const DEMO_AVATAR = 'https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg'

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
    <div className="searchable-select-container" ref={dropdownRef} style={{ position: 'relative', flex: '1 1 180px', opacity: disabled ? 0.6 : 1 }}>
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

export default function DoctorListPage() {
  const { user, isAdmin, isManager, isDoctor } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)

  // Filters State
  const [divisionId, setDivisionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [upazilaId, setUpazilaId] = useState('')
  const [unionId, setUnionId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [top10Filter, setTop10Filter] = useState('')
  const [telemedicineFilter, setTelemedicineFilter] = useState('')
  const [specialtyId, setSpecialtyId] = useState('')

  // Server-side filter memo for TanStack Query
  const serverFilters = useMemo(() => {
    const params = {}
    if (divisionId) params.division_id = divisionId
    if (districtId) params.district_id = districtId
    if (upazilaId) params.upazila_id = upazilaId
    if (unionId) params.union_id = unionId
    if (statusFilter !== '') params.is_active = statusFilter
    if (top10Filter !== '') params.top_10_doctor = top10Filter
    if (telemedicineFilter !== '') params.available_telemedicine = telemedicineFilter
    if (specialtyId) params.specialty_id = specialtyId
    return params
  }, [divisionId, districtId, upazilaId, unionId, statusFilter, top10Filter, telemedicineFilter, specialtyId])

  // Enterprise TanStack Query Hooks
  const { doctors, isLoading: loading, isFetching: refreshing, refetch: fetchDoctors } = useAdminDoctors(serverFilters)
  const { divisions, specialties, districts, upazilas, unions } = useAdminDoctorLookups({ divisionId, districtId, upazilaId })
  const {
    deleteDoctor,
    isDeleting: deleting,
    bulkDeleteDoctors,
    isBulkDeleting: bulkDeleting,
    toggleStatus,
  } = useAdminDoctorMutations()

  const handleDivisionChange = (val) => {
    setDivisionId(val)
    setDistrictId('')
    setUpazilaId('')
    setUnionId('')
  }

  const handleDistrictChange = (val) => {
    setDistrictId(val)
    setUpazilaId('')
    setUnionId('')
  }

  const handleUpazilaChange = (val) => {
    setUpazilaId(val)
    setUnionId('')
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteDoctor(deleteTarget.id)
      toast.success('Doctor deleted successfully.')
      setSelectedIds(prev => prev.filter(id => id !== deleteTarget.id))
    } catch (err) {
      console.error('Failed to delete doctor', err)
      toast.error('Failed to delete doctor.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    try {
      const res = await bulkDeleteDoctors(selectedIds)
      toast.success(res.data?.message || `Successfully deleted ${selectedIds.length} doctor(s).`)
      setSelectedIds([])
      setShowBulkDeleteModal(false)
    } catch (err) {
      console.error('Failed to delete selected doctors', err)
      toast.error(err.response?.data?.message || 'Failed to delete selected doctors')
    }
  }

  const clearFilters = () => {
    setSearch('')
    setDivisionId('')
    setDistrictId('')
    setUpazilaId('')
    setUnionId('')
    setStatusFilter('')
    setTop10Filter('')
    setTelemedicineFilter('')
    setSpecialtyId('')
  }

  const handleToggleStatus = async (doctor) => {
    try {
      await toggleStatus({ id: doctor.id, is_active: !doctor.is_active })
    } catch (err) {
      console.error('Failed to toggle doctor status', err)
    }
  }

  const isDoctorOnly = !isAdmin && !isManager && isDoctor
  let allowedDoctors = doctors
  if (isDoctorOnly) {
    allowedDoctors = doctors.filter(d =>
      String(d.user_id) === String(user?.id) ||
      d.email?.toLowerCase() === user?.email?.toLowerCase()
    )
  }

  const filtered = useMemo(() => {
    return allowedDoctors.filter(d => {
      if (!search || !search.trim()) return true
      const q = search.trim().toLowerCase()
      const id = String(d.public_id || d.id || '').toLowerCase()
      const name = String(d.name || '').toLowerCase()
      const nameBn = String(d.name_bn || '').toLowerCase()
      const specialtyName = String(d.specialty?.name || '').toLowerCase()
      const specialtyBn = String(d.specialty?.name_bn || d.specialty?.bangla_name || '').toLowerCase()
      const workplace = String(d.workplace || '').toLowerCase()
      const workplaceBn = String(d.workplace_bn || '').toLowerCase()
      const bmdc = String(d.bmdc || '').toLowerCase()
      const email = String(d.email || '').toLowerCase()
      const phone = String(d.phone || '').toLowerCase()
      const degree = String(d.degree || '').toLowerCase()
      const hospitalName = String(d.hospital?.name || '').toLowerCase()
      const location = [
        d.division?.name,
        d.district?.name,
        d.upazila?.name,
        d.union?.name
      ].filter(Boolean).join(' ').toLowerCase()

      return id.includes(q) ||
        name.includes(q) ||
        nameBn.includes(q) ||
        specialtyName.includes(q) ||
        specialtyBn.includes(q) ||
        workplace.includes(q) ||
        workplaceBn.includes(q) ||
        bmdc.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        degree.includes(q) ||
        hospitalName.includes(q) ||
        location.includes(q)
    })
  }, [allowedDoctors, search])

  const myProfile = isDoctorOnly ? allowedDoctors[0] : null

  // Ensure doctor's own profile view is always freshly fetched on mount
  useEffect(() => {
    if (isDoctorOnly) {
      fetchDoctors()
    }
  }, [isDoctorOnly])

  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => { setCurrentPage(1) }, [filtered.length])

  if (isDoctorOnly) {
    if (loading) return <div className="admin-loading" style={{ padding: 60 }}><div className="admin-spinner" /> Loading profile...</div>

    if (!myProfile) {
      return (
        <div className="admin-container">
          <div className="admin-page-header">
            <div>
              <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>My Profile</h2>
              <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Your doctor profile is not linked yet</p>
            </div>
          </div>
          <div className="admin-card">
            <div className="admin-card-body" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>👨‍⚕️</div>
              <h4 style={{ fontWeight: 700, marginBottom: 8, color: 'var(--admin-text)' }}>No Profile Found</h4>
              <p style={{ color: 'var(--admin-text-muted)', maxWidth: 400, margin: '0 auto 20px' }}>
                Your user account ({user?.email}) is not linked to any doctor profile yet.
                Please contact the administrator to link your profile.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="dr-profile-wrapper">
        <style>{`
          .dr-profile-wrapper {
            max-width: 1200px;
            margin: 0 auto;
            padding: 16px 12px 48px;
            animation: fadeIn 0.4s ease-out;
          }
          .dr-page-top-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            margin-bottom: 22px;
            flex-wrap: wrap;
          }
          .dr-page-top-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .dr-page-top-title {
            font-size: 24px;
            font-weight: 900;
            color: #0f172a;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 10px;
            letter-spacing: -0.02em;
          }
          .dr-page-top-sub {
            font-size: 13.5px;
            color: #64748b;
            margin: 0;
          }
          .dr-edit-btn {
            background: linear-gradient(135deg, #00A88C 0%, #0284c7 100%);
            color: #ffffff;
            border: none;
            padding: 10px 22px;
            border-radius: 12px;
            font-weight: 800;
            font-size: 13.5px;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(0, 168, 140, 0.25);
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
          }
          .dr-edit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 168, 140, 0.35);
            filter: brightness(1.06);
          }
          .dr-profile-header-card {
            background: #ffffff;
            border-radius: 20px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
            position: relative;
            overflow: hidden;
            padding: 26px 30px;
            display: flex;
            align-items: center;
            gap: 26px;
            flex-wrap: wrap;
          }
          .dr-profile-header-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 5px;
            background: linear-gradient(90deg, #00A88C 0%, #0284c7 50%, #38bdf8 100%);
          }
          .dr-avatar-container {
            width: 125px;
            height: 155px;
            border-radius: 16px;
            border: 2px solid #f1f5f9;
            box-shadow: 0 6px 18px rgba(0,0,0,0.07);
            overflow: hidden;
            flex-shrink: 0;
            background: linear-gradient(135deg, #00A88C, #00C9A7);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
          .dr-avatar-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .dr-header-meta {
            flex: 1;
            min-width: 260px;
          }
          .dr-name-title {
            font-size: 28px;
            font-weight: 900;
            color: #0f172a;
            margin: 0 0 6px;
            letter-spacing: -0.5px;
            display: flex;
            align-items: baseline;
            flex-wrap: wrap;
            gap: 8px;
          }
          .dr-name-bn {
            font-size: 19px;
            font-weight: 600;
            color: #64748b;
          }
          .dr-meta-badges {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 10px;
          }
          .dr-meta-pill {
            padding: 5px 12px;
            border-radius: 8px;
            font-size: 12.5px;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 5px;
          }
          .dr-quick-stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-top: 24px;
          }
          .dr-stat-tile {
            background: #ffffff;
            border-radius: 16px;
            padding: 16px 20px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.02);
            display: flex;
            align-items: center;
            gap: 16px;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .dr-stat-tile:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0,0,0,0.06);
          }
          .dr-stat-icon-wrap {
            width: 48px;
            height: 48px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            flex-shrink: 0;
          }
          .dr-stat-value {
            font-size: 19px;
            font-weight: 900;
            color: #0f172a;
            line-height: 1.2;
          }
          .dr-stat-label {
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
            margin-top: 2px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .dr-main-grid {
            display: grid;
            grid-template-columns: 360px 1fr;
            gap: 22px;
            margin-top: 22px;
            align-items: flex-start;
          }
          .dr-card {
            background: #ffffff;
            border-radius: 18px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.02);
            padding: 22px 24px;
            margin-bottom: 20px;
          }
          .dr-card-title {
            font-size: 14.5px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            white-space: nowrap;
          }
          .dr-card-title-left {
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
          }
          .dr-sig-box {
            background: #f8fafc;
            border: 1.5px dashed #cbd5e1;
            border-radius: 14px;
            padding: 16px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 90px;
            transition: all 0.2s ease;
          }
          .dr-sig-box:hover {
            border-color: #00A88C;
            background: #f0fdfa;
          }
          .dr-sig-img {
            max-width: 100%;
            max-height: 70px;
            object-fit: contain;
            display: block;
          }
          .dr-contact-list {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
          .dr-contact-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            font-size: 13.5px;
          }
          .dr-contact-icon {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            background: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
          }
          .dr-contact-text-label {
            font-size: 10.5px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .dr-contact-text-val {
            font-weight: 700;
            color: #0f172a;
            margin-top: 1px;
            word-break: break-word;
          }
          .dr-chamber-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 18px;
            margin-bottom: 12px;
          }
          .dr-chamber-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 10px;
            flex-wrap: wrap;
          }
          .dr-chamber-name {
            font-size: 16px;
            font-weight: 800;
            color: #b91c1c;
          }
          .dr-chamber-address {
            font-size: 12.5px;
            color: #64748b;
            margin-top: 3px;
          }
          .dr-schedule-chip {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 8px 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
            margin-top: 6px;
          }

          /* Tablet & Mobile Responsiveness */
          @media (max-width: 900px) {
            .dr-main-grid {
              grid-template-columns: 1fr;
              gap: 16px;
            }
            .dr-quick-stats-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }
          }
          @media (max-width: 640px) {
            .dr-page-top-bar {
              flex-direction: column;
              align-items: stretch;
              text-align: center;
            }
            .dr-edit-btn {
              justify-content: center;
            }
            .dr-profile-header-card {
              padding: 20px 16px;
              flex-direction: column;
              text-align: center;
              gap: 16px;
            }
            .dr-avatar-container {
              width: 110px;
              height: 140px;
              margin: 0 auto;
            }
            .dr-name-title {
              font-size: 22px;
              justify-content: center;
            }
            .dr-meta-badges {
              justify-content: center;
            }
            .dr-quick-stats-grid {
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            .dr-stat-tile {
              padding: 14px 12px;
              gap: 10px;
            }
            .dr-stat-icon-wrap {
              width: 40px;
              height: 40px;
              font-size: 18px;
            }
            .dr-stat-value {
              font-size: 16px;
            }
            .dr-card {
              padding: 18px 16px;
              border-radius: 16px;
            }
          }
        `}</style>

        {/* 1. Page Header Bar */}
        <div className="dr-page-top-bar">
          <div className="dr-page-top-info">
            <h2 className="dr-page-top-title">
              <span>👨‍⚕️</span> My Profile
            </h2>
            <p className="dr-page-top-sub">
              Manage your credentials, visiting chambers, and clinical practice
            </p>
          </div>

          <button
            className="dr-edit-btn"
            onClick={() => navigate(isDoctorOnly ? `/doctor/my-profile/edit/${myProfile.public_id || myProfile.id}` : `/admin/doctors/edit/${myProfile.public_id || myProfile.id}`)}
          >
            ✏️ Edit Profile
          </button>
        </div>

        {/* 2. Unified Doctor Profile Card */}
        <div className="dr-profile-header-card">
          {/* Avatar Photo */}
          <div className="dr-avatar-container">
            {myProfile.photo ? (
              <img 
                src={getMediaUrl(myProfile.photo)} 
                alt={myProfile.name} 
                onError={(e) => { e.target.onerror = null; e.target.src = DEMO_AVATAR; }} 
                className="dr-avatar-img"
              />
            ) : (
              <span style={{ fontSize: 56, fontWeight: 900 }}>{myProfile.name?.charAt(0)?.toUpperCase()}</span>
            )}
          </div>

          {/* Header Meta */}
          <div className="dr-header-meta">
            <h1 className="dr-name-title">
              <span>{myProfile.name}</span>
              {myProfile.name_bn && (
                <span className="dr-name-bn">({myProfile.name_bn})</span>
              )}
            </h1>

            <div style={{ fontSize: 14.5, color: '#00A88C', fontWeight: 800, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span>🩺 {myProfile.specialty?.name || 'General Physician'}</span>
              {(myProfile.specialty?.name_bn || myProfile.specialty?.bangla_name) && (
                <span style={{ color: '#64748b', fontWeight: 600 }}>({myProfile.specialty?.name_bn || myProfile.specialty?.bangla_name})</span>
              )}
            </div>

            <div className="dr-meta-badges">
              {/* Active Practitioner Status */}
              <span className="dr-meta-pill" style={{ 
                background: myProfile.is_active !== false && myProfile.is_active !== 0 && myProfile.is_active !== '0' && myProfile.is_active !== 'no' ? '#ecfdf5' : '#fef2f2', 
                color: myProfile.is_active !== false && myProfile.is_active !== 0 && myProfile.is_active !== '0' && myProfile.is_active !== 'no' ? '#065f46' : '#991b1b', 
                border: myProfile.is_active !== false && myProfile.is_active !== 0 && myProfile.is_active !== '0' && myProfile.is_active !== 'no' ? '1px solid #a7f3d0' : '1px solid #fecaca' 
              }}>
                <span style={{ 
                  color: myProfile.is_active !== false && myProfile.is_active !== 0 && myProfile.is_active !== '0' && myProfile.is_active !== 'no' ? '#10b981' : '#ef4444', 
                  fontSize: 10 
                }}>●</span> {myProfile.is_active !== false && myProfile.is_active !== 0 && myProfile.is_active !== '0' && myProfile.is_active !== 'no' ? 'Active Practitioner' : 'Inactive'}
              </span>

              {/* Telemedicine: ONLY if strictly enabled ('yes' or true) */}
              {(myProfile.available_telemedicine === 'yes' || myProfile.available_telemedicine === true || myProfile.available_telemedicine === 1 || myProfile.available_telemedicine === '1') && (
                <span className="dr-meta-pill" style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>
                  📱 Telemedicine Enabled
                </span>
              )}

              {/* Verified Profile */}
              <span className="dr-meta-pill" style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
                🛡️ Verified Profile
              </span>

              {/* BMDC */}
              {myProfile.bmdc && (
                <span className="dr-meta-pill" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Award size={13} color="#1d4ed8" style={{ flexShrink: 0 }} /> BMDC: <strong>{myProfile.bmdc}</strong>
                </span>
              )}

              {/* Experience */}
              {myProfile.experience ? (
                <span className="dr-meta-pill" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                  ⭐ {myProfile.experience} Years Experience
                </span>
              ) : null}

              {/* Workplace */}
              {myProfile.workplace && (
                <span className="dr-meta-pill" style={{ background: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0' }}>
                  🏥 {myProfile.workplace}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Quick Stat Tiles */}
        <div className="dr-quick-stats-grid">
          <div className="dr-stat-tile">
            <div className="dr-stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
              ⭐
            </div>
            <div>
              <div className="dr-stat-value" style={{ color: '#b45309' }}>
                {myProfile.experience || 1}
              </div>
              <div className="dr-stat-label">Years Experience</div>
            </div>
          </div>

          <div className="dr-stat-tile">
            <div className="dr-stat-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' }}>
              🏥
            </div>
            <div>
              <div className="dr-stat-value">
                {myProfile.grouped_chambers?.length || (myProfile.chambers?.length ? 1 : 0)}
              </div>
              <div className="dr-stat-label">Active Chambers</div>
            </div>
          </div>

          <div className="dr-stat-tile">
            <div className="dr-stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              🎓
            </div>
            <div>
              <div className="dr-stat-value" style={{ fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                {myProfile.degree || 'MBBS'}
              </div>
              <div className="dr-stat-label">Primary Degree</div>
            </div>
          </div>

          <div className="dr-stat-tile">
            <div className="dr-stat-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              📍
            </div>
            <div>
              <div className="dr-stat-value" style={{ fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                {myProfile.district?.name || myProfile.upazila?.name || 'Bangladesh'}
              </div>
              <div className="dr-stat-label">Location Area</div>
            </div>
          </div>
        </div>

        {/* 4. Main 2-Column Responsive Body */}
        <div className="dr-main-grid">
          
          {/* Left Column: Official Digital Signature & Contact */}
          <div>
            {/* Signature Card (Exact Markable Area) */}
            <div className="dr-card">
              <div className="dr-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', whiteSpace: 'nowrap', flexWrap: 'nowrap', gap: 8 }}>
                <div className="dr-card-title-left" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                  <span>✍️</span> Official Digital Signature
                </div>
                {(myProfile.signature_photo || myProfile.signature) && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#047857', background: '#ecfdf5', padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    ✓ Active on Rx
                  </span>
                )}
              </div>

              <div className="dr-sig-box">
                {(myProfile.signature_photo || myProfile.signature) ? (
                  <img 
                    src={getMediaUrl(myProfile.signature_photo || myProfile.signature)} 
                    alt="Official Signature" 
                    className="dr-sig-img"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div style={{ padding: '12px 0' }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>📝</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>No signature uploaded yet</div>
                    <button
                      onClick={() => navigate(isDoctorOnly ? `/doctor/my-profile/edit/${myProfile.public_id || myProfile.id}` : `/admin/doctors/edit/${myProfile.public_id || myProfile.id}`)}
                      style={{ marginTop: 8, fontSize: 11.5, color: '#00A88C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                    >
                      + Upload Signature
                    </button>
                  </div>
                )}
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 11.5, color: '#64748b', textAlign: 'center', lineHeight: 1.4 }}>
                This signature is automatically placed onto your digital prescriptions and clinical tickets.
              </p>
            </div>

            {/* Contact Information Card */}
            <div className="dr-card">
              <div className="dr-card-title">
                <div className="dr-card-title-left">
                  <span>📞</span> Contact &amp; Clinical Workplace
                </div>
              </div>

              <div className="dr-contact-list">
                <div className="dr-contact-item">
                  <div className="dr-contact-icon">🏥</div>
                  <div>
                    <div className="dr-contact-text-label">Workplace / Hospital</div>
                    <div className="dr-contact-text-val">
                      {myProfile.workplace || '—'}
                      {myProfile.workplace_bn && (
                        <span style={{ display: 'block', fontSize: 12.5, color: '#64748b', fontWeight: 500, marginTop: 2 }}>
                          {myProfile.workplace_bn}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="dr-contact-item">
                  <div className="dr-contact-icon">📱</div>
                  <div>
                    <div className="dr-contact-text-label">Contact Phone</div>
                    <div className="dr-contact-text-val">
                      {myProfile.phone ? (
                        <a href={`tel:${myProfile.phone}`} style={{ color: '#0f172a', textDecoration: 'none' }}>
                          {myProfile.phone}
                        </a>
                      ) : '—'}
                    </div>
                  </div>
                </div>

                <div className="dr-contact-item">
                  <div className="dr-contact-icon">✉️</div>
                  <div>
                    <div className="dr-contact-text-label">Email Address</div>
                    <div className="dr-contact-text-val">
                      {myProfile.email ? (
                        <a href={`mailto:${myProfile.email}`} style={{ color: '#0284c7', textDecoration: 'none' }}>
                          {myProfile.email}
                        </a>
                      ) : '—'}
                    </div>
                  </div>
                </div>

                <div className="dr-contact-item">
                  <div className="dr-contact-icon">📍</div>
                  <div>
                    <div className="dr-contact-text-label">District &amp; Upazila</div>
                    <div className="dr-contact-text-val">
                      {[myProfile.upazila?.name, myProfile.district?.name, myProfile.division?.name].filter(Boolean).join(', ') || 'Bangladesh'}
                    </div>
                  </div>
                </div>

                {myProfile.hospital?.name && (
                  <div className="dr-contact-item">
                    <div className="dr-contact-icon">🏢</div>
                    <div>
                      <div className="dr-contact-text-label">Primary Hospital</div>
                      <div className="dr-contact-text-val">
                        {myProfile.hospital.name}
                        {myProfile.hospital.address && (
                          <span style={{ display: 'block', fontSize: 12, color: '#64748b', fontWeight: 500, marginTop: 2 }}>
                            {myProfile.hospital.address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Qualifications, Chambers, Biography */}
          <div>
            {/* Degrees & Qualifications Card */}
            <div className="dr-card">
              <div className="dr-card-title">
                <div className="dr-card-title-left">
                  <span>🎓</span> Medical Degrees &amp; Qualifications
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: 14, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 24 }}>📜</div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Primary Degree</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                      {myProfile.degree || 'MBBS'}
                      {myProfile.degree_bn && (
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginLeft: 8 }}>
                          ({myProfile.degree_bn})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Degrees */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {[1, 2, 3, 4].map(num => {
                    const en = myProfile[`degree${num}`]
                    const bn = myProfile[`degree${num}_bn`]
                    if (!en && !bn) return null
                    return (
                      <div key={num} style={{ background: 'rgba(0, 168, 140, 0.08)', color: '#00A88C', border: '1px solid rgba(0, 168, 140, 0.2)', padding: '6px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span>• {en || bn}</span>
                        {en && bn && <span style={{ color: '#64748b', fontWeight: 500 }}>({bn})</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Chambers & Visiting Schedule Card */}
            <div className="dr-card">
              <div className="dr-card-title">
                <div className="dr-card-title-left">
                  <span>🏥</span> Chambers &amp; Visiting Schedules
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#00A88C' }}>
                  {(() => {
                    if (myProfile.grouped_chambers && myProfile.grouped_chambers.length > 0) return myProfile.grouped_chambers.length
                    if (myProfile.chambers && myProfile.chambers.length > 0) {
                      const hSet = new Set(myProfile.chambers.map(c => c.hospital_id || c.hospital?.id || 'default'))
                      return hSet.size
                    }
                    return 0
                  })()} {((myProfile.grouped_chambers?.length || myProfile.chambers?.length || 0) > 1) ? 'Branches' : 'Branch'}
                </span>
              </div>

              {((myProfile.grouped_chambers && myProfile.grouped_chambers.length > 0) || (myProfile.chambers && myProfile.chambers.length > 0)) ? (
                <div>
                  {(() => {
                    if (myProfile.grouped_chambers && myProfile.grouped_chambers.length > 0) {
                      return myProfile.grouped_chambers
                    }
                    if (myProfile.chambers && myProfile.chambers.length > 0) {
                      const grpMap = {}
                      myProfile.chambers.forEach(c => {
                        const hId = c.hospital?.id || c.hospital_id || 'default'
                        if (!grpMap[hId]) {
                          grpMap[hId] = {
                            hospital_name: c.hospital?.name || myProfile.workplace || 'Chamber Branch',
                            hospital_name_bn: c.hospital?.name_bn || null,
                            address: c.hospital?.address || c.address || '',
                            phone: c.hospital?.hotline || c.hospital?.phone || null,
                            schedules: []
                          }
                        }
                        grpMap[hId].schedules.push(c)
                      })
                      return Object.values(grpMap)
                    }
                    return []
                  })().map((grp, idx) => (
                    <div key={idx} className="dr-chamber-card">
                      <div className="dr-chamber-header">
                        <div>
                          <div className="dr-chamber-name">
                            {grp.hospital_name}
                          </div>
                          {grp.address && (
                            <div className="dr-chamber-address">
                              📍 {grp.address}
                            </div>
                          )}
                        </div>
                        {grp.phone && (
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0284c7', background: '#f0f9ff', padding: '4px 10px', borderRadius: 8 }}>
                            📞 {grp.phone}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(grp.schedules || []).map((sch, sIdx) => (
                          <div key={sIdx} className="dr-schedule-chip">
                            <span style={{ fontWeight: 800, color: '#0f172a' }}>
                              🗓️ {sch.day_bn || sch.day}
                              {sch.room_number && (
                                <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600, marginLeft: 8 }}>
                                  (Room: {sch.room_number})
                                </span>
                              )}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ color: '#00A88C', fontWeight: 700, fontSize: 12.5 }}>
                                ⏰ {sch.formatted_time || (sch.start_time_formatted ? `${sch.start_time_formatted} - ${sch.end_time_formatted}` : sch.start_time)}
                              </span>
                              {sch.fee && (
                                <span style={{ background: '#ecfdf5', color: '#047857', fontWeight: 800, fontSize: 11.5, padding: '2px 8px', borderRadius: 6 }}>
                                  ৳{sch.fee}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 14 }}>
                  No chamber schedules configured yet.
                </div>
              )}
            </div>

            {/* Short Biography Card */}
            {myProfile.bio && (
              <div className="dr-card">
                <div className="dr-card-title">
                  <div className="dr-card-title-left">
                    <span>📝</span> Professional Biography
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 14.5, color: '#334155', lineHeight: 1.7 }}>
                  {myProfile.bio}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const paginatedData = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  const isAllSelected = paginatedData.length > 0 && paginatedData.every(d => selectedIds.includes(d.id))
  const isSomeSelected = paginatedData.some(d => selectedIds.includes(d.id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const pageIds = paginatedData.map(d => d.id)
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)))
    } else {
      const newIds = paginatedData.map(d => d.id).filter(id => !selectedIds.includes(id))
      setSelectedIds(prev => [...prev, ...newIds])
    }
  }

  const toggleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>👨‍⚕️</span>
            {isDoctorOnly ? 'My Profile' : 'Doctor Management'}
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Manage medical professionals and their clinical associations</p>
        </div>
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search doctor by ID, name, BMDC, phone, specialty..."
        onRefresh={fetchDoctors}
        refreshing={loading}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={Boolean(divisionId || districtId || upazilaId || unionId || specialtyId || statusFilter !== '' || top10Filter !== '' || telemedicineFilter !== '')}
        onClearFilters={clearFilters}
        activeFilters={[
          divisionId && { key: 'division', label: `Division: ${divisions.find(d => String(d.id) === String(divisionId))?.name || divisionId}`, onRemove: () => handleDivisionChange('') },
          districtId && { key: 'district', label: `District: ${districts.find(d => String(d.id) === String(districtId))?.name || districtId}`, onRemove: () => handleDistrictChange('') },
          upazilaId && { key: 'upazila', label: `Upazila: ${upazilas.find(u => String(u.id) === String(upazilaId))?.name || upazilaId}`, onRemove: () => handleUpazilaChange('') },
          unionId && { key: 'union', label: `Union: ${unions.find(u => String(u.id) === String(unionId))?.name || unionId}`, onRemove: () => setUnionId('') },
          specialtyId && { key: 'specialty', label: `Specialty: ${specialties.find(s => String(s.id) === String(specialtyId))?.name || specialtyId}`, onRemove: () => setSpecialtyId('') },
          statusFilter !== '' && { key: 'status', label: `Status: ${statusFilter === '1' ? 'Active' : 'Inactive'}`, onRemove: () => setStatusFilter('') },
          top10Filter !== '' && { key: 'top10', label: `Top 10: ${top10Filter === 'yes' ? 'Yes' : 'No'}`, onRemove: () => setTop10Filter('') },
          telemedicineFilter !== '' && { key: 'tele', label: `Telemedicine: ${telemedicineFilter === 'yes' ? 'Yes' : 'No'}`, onRemove: () => setTelemedicineFilter('') },
        ].filter(Boolean)}
        actions={
          isAdmin ? (
            <Link to="/admin/doctors/create" className="admin-btn admin-btn-primary" style={{ height: 38, display: 'inline-flex', alignItems: 'center' }}>
              + Add New Doctor
            </Link>
          ) : (isDoctorOnly && !myProfile) && (
            <Link to="/admin/doctors/create" className="admin-btn admin-btn-primary" style={{ height: 38, display: 'inline-flex', alignItems: 'center' }}>
              ✨ Create My Profile
            </Link>
          )
        }
      >
        <SearchableSelect
          label="Division"
          placeholder="All Divisions"
          options={divisions}
          value={divisionId}
          onChange={handleDivisionChange}
        />
        <SearchableSelect
          label="District"
          placeholder="All Districts"
          options={districts}
          value={districtId}
          onChange={handleDistrictChange}
          disabled={!divisionId}
        />
        <SearchableSelect
          label="Upazila"
          placeholder="All Upazilas"
          options={upazilas}
          value={upazilaId}
          onChange={handleUpazilaChange}
          disabled={!districtId}
        />
        <SearchableSelect
          label="Union"
          placeholder="All Unions"
          options={unions}
          value={unionId}
          onChange={setUnionId}
          disabled={!upazilaId}
        />
        <SearchableSelect
          label="Specialty"
          placeholder="All Specialties"
          options={specialties}
          value={specialtyId}
          onChange={setSpecialtyId}
        />
        <div style={{ minWidth: 120 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Status</label>
          <select className="status-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '100%', height: 38, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 8 }}>
            <option value="">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>
        <div style={{ minWidth: 120 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Top 10</label>
          <select className="status-select" value={top10Filter} onChange={e => setTop10Filter(e.target.value)} style={{ width: '100%', height: 38, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 8 }}>
            <option value="">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div style={{ minWidth: 120 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Telemedicine</label>
          <select className="status-select" value={telemedicineFilter} onChange={e => setTelemedicineFilter(e.target.value)} style={{ width: '100%', height: 38, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 8 }}>
            <option value="">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
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
            <h3 className="admin-card-title" style={{ margin: 0 }}>All Registered Doctors</h3>
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
              <strong style={{ color: 'var(--admin-text, #0F172A)' }}>{filtered.length}</strong> Records Found
            </div>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rowCount={8} columnWidths={['44px', '135px', '80px', '22%', '18%', '16%', '12%', '14%', '6%']} headers={['', 'ID', 'Photo', 'Professional Details', 'Workplace Identity', 'Location Profile', 'Account Status', 'Contact Info', 'Actions']} />
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={Boolean(divisionId || districtId || upazilaId || unionId || specialtyId || statusFilter || top10Filter || telemedicineFilter || search)} searchQuery={search} onClearFilters={clearFilters} onClearSearch={() => setSearch('')} icon="👨‍⚕️" title="No doctors found" description="Try adjusting your search criteria or clear your active filters." primaryAction={isAdmin ? { label: '+ Add New Doctor', to: '/admin/doctors/create' } : undefined} />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 44, textAlign: 'center', paddingLeft: 16 }}>
                    <TableCheckbox
                      checked={isAllSelected}
                      indeterminate={isSomeSelected && !isAllSelected}
                      onChange={toggleSelectAll}
                      title={isAllSelected ? 'Deselect all' : 'Select all on this page'}
                    />
                  </th>
                  <th style={{ width: 135, color: 'var(--admin-text-muted)' }}>ID</th>
                  <th style={{ width: 80, color: 'var(--admin-text-muted)' }}>Photo</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Professional Details</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Workplace Identity</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Location Profile</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Account Status</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Contact Info</th>
                  <th style={{ textAlign: 'right', paddingRight: 24, color: 'var(--admin-text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(doctor => {
                  const isSelected = selectedIds.includes(doctor.id)
                  return (
                  <tr
                    key={doctor.id}
                    style={{
                      background: isSelected ? 'rgba(16, 185, 129, 0.06)' : undefined,
                      transition: 'background 0.15s'
                    }}
                  >
                    <td style={{ width: 44, textAlign: 'center', paddingLeft: 16 }} onClick={e => e.stopPropagation()}>
                      <TableCheckbox
                        checked={isSelected}
                        onChange={() => toggleSelectOne(doctor.id)}
                        title="Select row"
                      />
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <CompactUlid value={doctor.public_id || doctor.id} />
                    </td>
                    <td>
                      <div style={{
                        width: 48, height: 48, borderRadius: 10, overflow: 'hidden',
                        background: 'rgba(0, 168, 140, 0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(0, 168, 140, 0.1)'
                      }}>
                        {doctor.photo ? (
                          <img
                            src={getMediaUrl(doctor.photo)}
                            alt={doctor.name || ''}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <span style={{ fontSize: 18, fontWeight: 900, color: '#00A88C', display: doctor.photo ? 'none' : 'block' }}>
                          {doctor.name?.charAt(0) || 'D'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 15 }}>{doctor.name}</div>
                      <div style={{ fontSize: 11, color: '#00A88C', fontWeight: 700, marginTop: 2 }}>BMDC: {doctor.bmdc || 'N/A'}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                        {doctor.specialty?.name || 'General Physician'}
                      </div>
                    </td>
                    <td>
                      {doctor.workplace ? (
                        <>
                          <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 13.5 }}>
                            {doctor.workplace}
                          </div>
                          {doctor.workplace_bn && (
                            <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2, fontFamily: "'Hind Siliguri', sans-serif" }}>
                              {doctor.workplace_bn}
                            </div>
                          )}
                        </>
                      ) : doctor.workplace_bn ? (
                        <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 13.5, fontFamily: "'Hind Siliguri', sans-serif" }}>
                          {doctor.workplace_bn}
                        </div>
                      ) : doctor.hospital?.name ? (
                        <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 13.5 }}>
                          {doctor.hospital.name}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>
                          —
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', maxWidth: 160, lineHeight: 1.5 }}>
                        {[
                          doctor.division?.name,
                          doctor.district?.name,
                          doctor.upazila?.name,
                          doctor.union?.name
                        ].filter(Boolean).join(', ') || '—'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {isAdmin ? (
                            <div
                              onClick={() => handleToggleStatus(doctor)}
                              style={{
                                width: 34, height: 18, borderRadius: 10, padding: 2, cursor: 'pointer',
                                background: doctor.is_active ? '#10B981' : '#CBD5E1',
                                display: 'flex', transition: '0.2s',
                                justifyContent: doctor.is_active ? 'flex-end' : 'flex-start'
                              }}
                            >
                              <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }} />
                            </div>
                          ) : (
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: doctor.is_active ? '#10B981' : '#CBD5E1' }} />
                          )}
                          <span style={{ fontSize: 11, fontWeight: 700, color: doctor.is_active ? '#10B981' : 'var(--admin-text-muted)' }}>
                            {doctor.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(doctor.top_10_doctor === 'yes' || doctor.top_10_doctor === true) && (
                            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(254, 243, 199, 0.2)', color: '#D97706', border: '1px solid rgba(217, 119, 6, 0.2)' }}>⭐ TOP 10</span>
                          )}
                          {(doctor.available_telemedicine === 'yes' || doctor.available_telemedicine === true) && (
                            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', border: '1px solid rgba(99, 102, 241, 0.2)' }}>📹 TELE</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text)' }}>{doctor.phone || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{doctor.email || '—'}</div>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                      <div className="admin-actions" style={{ justifyContent: 'flex-end', gap: 10 }}>
                        <button 
                          className="admin-action-btn admin-action-btn-view" 
                          title="View Profile" 
                          onClick={() => navigate(`/admin/doctors/view/${doctor.id}`)}
                        >
                          <img src="/icons/view.png" alt="View" />
                        </button>
                        {isAdmin && (
                          <>
                            <button 
                              className="admin-action-btn admin-action-btn-edit" 
                              title="Edit Doctor" 
                              onClick={() => navigate(`/admin/doctors/edit/${doctor.id}`)}
                            >
                              <img src="/icons/edit.png" alt="Edit" />
                            </button>
                            <button 
                              className="admin-action-btn admin-action-btn-delete" 
                              title="Delete Doctor" 
                              onClick={() => setDeleteTarget(doctor)}
                            >
                              <img src="/icons/delete.png" alt="Delete" />
                            </button>
                          </>
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

      <style dangerouslySetInnerHTML={{
        __html: `
        .admin-container { animation: fadeIn 0.4s ease-out; }
        .profile-info-group { padding: 12px 0; border-bottom: 1px solid var(--admin-border); }
        .profile-info-group:last-child { border-bottom: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />

      <DeleteModal
        show={!!deleteTarget}
        title="Delete Doctor"
        message={`Are you sure you want to delete Dr. ${deleteTarget?.name}? All associated chamber and appointment data will be affected.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      <DeleteModal
        show={showBulkDeleteModal}
        title="Bulk Delete Doctors"
        message={`Are you sure you want to delete ${selectedIds.length} selected doctor(s)? All associated chamber and appointment data will be affected. This action cannot be undone.`}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteModal(false)}
        loading={bulkDeleting}
      />
    </div>
  )
}

// UserListPage.jsx — User management (Admin only)
import { useState, useEffect, useMemo } from 'react'
import { Search, RotateCcw, X, Filter, ShieldCheck } from 'lucide-react'
import { getMediaUrl } from '../../../utils/mediaUtils'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useAdminUsers, useAdminPermissions, useAdminUserMutations } from '../../../hooks/admin/useAdminUsers'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'
import { getErrorMessage } from '../../../utils/errorHelper'
import toast from 'react-hot-toast'

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

const ROLES = ['admin', 'manager', 'doctor', 'user']
const ROLE_LABELS = { admin: 'ADMIN', manager: 'HOSPITAL', doctor: 'DOCTOR', user: 'USER' }

const SECTION_CONFIG = {
  doctor: { title: 'Doctors Management', icon: '👨‍⚕️' },
  doctor_chamber: { title: 'Chamber Management', icon: '🏥' },
  hospital: { title: 'Hospitals Management', icon: '🏥' },
  patient: { title: 'Patients Management', icon: '👤' },
  appointment: { title: 'Appointments', icon: '📅' },
  medicine: { title: 'Medicines Management', icon: '💊' },
  prescription: { title: 'Prescriptions', icon: '📋' },
  specialty: { title: 'Medical Specialties', icon: '🩺' },
  division: { title: 'Divisions', icon: '📍' },
  district: { title: 'Districts', icon: '🏙️' },
  upazila: { title: 'Upazilas', icon: '🏘️' },
  union: { title: 'Unions', icon: '🏡' },
  payment: { title: 'Payments & Financials', icon: '💳' },
  subscription: { title: 'Subscriptions', icon: '📦' },
  report: { title: 'Reports & Analytics', icon: '📊' },
  audit: { title: 'Audit Logs', icon: '🔍' },
  user: { title: 'User Management', icon: '👥' },
}

// Helper to get initials for avatar
const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name[0].toUpperCase()
}

// Badge color helper
const getTypeStyles = (type) => {
  switch (type) {
    case 'doctor': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', icon: '👨‍⚕️' }
    case 'hospital': return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', icon: '🏥' }
    default: return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', icon: '👤' }
  }
}

export default function UserListPage() {
  const { user: currentUser, hasPermission, isAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [changingRole, setChangingRole] = useState(null)
  const [roleChangeTarget, setRoleChangeTarget] = useState(null)
  
  // Permissions State
  const [selectedUserForPerms, setSelectedUserForPerms] = useState(null)
  const [userPermissions, setUserPermissions] = useState([]) 
  const [permSearch, setPermSearch] = useState('')

  // Pagination state
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Server-side filter memo for TanStack Query
  const serverFilters = useMemo(() => {
    const params = {}
    if (roleFilter) params.role = roleFilter
    if (typeFilter) params.registration_type = typeFilter
    if (search) params.search = search
    return params
  }, [roleFilter, typeFilter, search])

  // Enterprise TanStack Query Hooks
  const { users, isLoading: loading, refetch: fetchUsers } = useAdminUsers(serverFilters)
  const { permissions: availablePermissions } = useAdminPermissions()
  const {
    updateUserRole: saveUserRole,
    updateUserPermissions: saveUserPermissions,
    isUpdatingPermissions: savingPerms,
    deleteUser: saveDeleteUser,
    isDeleting: deleting,
    bulkDeleteUsers,
    isBulkDeleting: bulkDeleting,
  } = useAdminUserMutations()

  const clearFilters = () => {
    setRoleFilter('')
    setTypeFilter('')
    setSearch('')
  }

  const getUserRole = (u) => {
    let roles = []
    if (Array.isArray(u.roles) && u.roles.length > 0) {
      roles = u.roles.map(r => typeof r === 'string' ? r : (r.name || 'user'))
    } else if (u.role) {
      roles = [u.role]
    }
    if (roles.includes('admin')) return 'admin'
    if (roles.includes('doctor')) return 'doctor'
    if (roles.includes('manager') || roles.includes('hospital')) return 'manager'
    return 'user'
  }

  const initiateRoleChange = (targetUser, newRole) => {
    const currentRole = getUserRole(targetUser)
    if (currentRole === newRole) return
    setRoleChangeTarget({
      user: targetUser,
      oldRole: currentRole,
      newRole,
    })
  }

  const confirmRoleChange = async () => {
    if (!roleChangeTarget) return
    const { user: targetUser, newRole } = roleChangeTarget
    setChangingRole(targetUser.id)
    try {
      await saveUserRole({ userId: targetUser.id, role: newRole })
      toast.success(`${targetUser.name}-এর রোল সফলভাবে ${ROLE_LABELS[newRole] || newRole.toUpperCase()}-এ পরিবর্তন করা হয়েছে।`)
    } catch (err) {
      console.error('Failed to update role:', err)
      toast.error(getErrorMessage(err, 'রোল পরিবর্তন করতে ব্যর্থ হয়েছে।'))
    } finally {
      setChangingRole(null)
      setRoleChangeTarget(null)
    }
  }

  const cancelRoleChange = () => {
    setRoleChangeTarget(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await saveDeleteUser(deleteTarget.id)
      toast.success('User deleted successfully.')
      setSelectedIds(prev => prev.filter(id => id !== deleteTarget.id))
    } catch (err) {
      console.error('Failed to delete user:', err)
      toast.error('Failed to delete user.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    try {
      const res = await bulkDeleteUsers(selectedIds)
      toast.success(res.data?.message || `Successfully deleted ${selectedIds.length} user(s).`)
      setSelectedIds([])
      setShowBulkDeleteModal(false)
    } catch (err) {
      console.error('Failed to delete selected users:', err)
      toast.error(err.response?.data?.message || 'Failed to delete selected users')
    }
  }

  const handleOpenPerms = (user) => {
    setSelectedUserForPerms(user)
    setPermSearch('')
    const activeNames = (user.permissions || []).map(p => typeof p === 'string' ? p : p.name)
    setUserPermissions(activeNames)
  }

  const togglePermission = (permName) => {
    if (userPermissions.includes(permName)) {
      setUserPermissions(userPermissions.filter(p => p !== permName))
    } else {
      setUserPermissions([...userPermissions, permName])
    }
  }

  const groupedPermissions = useMemo(() => {
    const queryLower = permSearch.toLowerCase().trim()
    const groups = {}

    availablePermissions.forEach(p => {
      const permName = typeof p === 'string' ? p : p.name
      if (!permName) return

      const readable = permName.replace(/[._]/g, ' ')
      if (queryLower && !permName.toLowerCase().includes(queryLower) && !readable.toLowerCase().includes(queryLower)) {
        return
      }

      let prefix = permName.split('.')[0]
      if (!prefix || prefix === permName) {
        prefix = permName.split('_')[0]
      }

      const config = SECTION_CONFIG[prefix] || {
        title: prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/_/g, ' '),
        icon: '⚙️'
      }

      if (!groups[prefix]) {
        groups[prefix] = {
          key: prefix,
          title: config.title,
          icon: config.icon,
          items: []
        }
      }
      groups[prefix].items.push(p)
    })

    return Object.values(groups)
  }, [availablePermissions, permSearch])

  const toggleSectionPermissions = (sectionItems) => {
    const itemNames = sectionItems.map(p => typeof p === 'string' ? p : p.name)
    const allSelected = itemNames.every(name => userPermissions.includes(name))
    if (allSelected) {
      setUserPermissions(userPermissions.filter(p => !itemNames.includes(p)))
    } else {
      const newPerms = new Set([...userPermissions, ...itemNames])
      setUserPermissions(Array.from(newPerms))
    }
  }

  const selectAllPermissions = () => {
    const allNames = availablePermissions.map(p => typeof p === 'string' ? p : p.name)
    setUserPermissions(allNames)
  }

  const clearAllPermissions = () => {
    setUserPermissions([])
  }

  const savePermissions = async () => {
    try {
      await saveUserPermissions({ userId: selectedUserForPerms.id, permissions: userPermissions })
      setSelectedUserForPerms(null)
    } catch (err) {
      console.error('Failed to update user permissions:', err)
    }
  }

  const filtered = users.filter(u => {
    const searchLower = search.trim().toLowerCase()
    const id = String(u.public_id || u.id || '').toLowerCase()
    const name = String(u.name || '').toLowerCase()
    const email = String(u.email || '').toLowerCase()
    const phone = String(u.phone || '').toLowerCase()
    const regNum = String(u.registration_number || '').toLowerCase()
    const regType = String(u.registration_type || '').toLowerCase()
    const role = String(getUserRole(u) || '').toLowerCase()

    const matchesSearch = !searchLower || 
      id.includes(searchLower) ||
      name.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(searchLower) ||
      regNum.includes(searchLower) ||
      regType.includes(searchLower) ||
      role.includes(searchLower)

    const matchesType = !typeFilter || 
      (typeFilter === 'patient' 
        ? (u.registration_type === 'patient' || u.registration_type === 'user' || !u.registration_type)
        : u.registration_type?.toLowerCase() === typeFilter.toLowerCase())

    const currentRole = getUserRole(u)
    const matchesRole = !roleFilter || (currentRole.toLowerCase() === roleFilter.toLowerCase())

    return matchesSearch && matchesType && matchesRole
  })

  const paginatedData = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  const selectableData = paginatedData.filter(u => u.id !== currentUser?.id)
  const isAllSelected = selectableData.length > 0 && selectableData.every(u => selectedIds.includes(u.id))
  const isSomeSelected = selectableData.some(u => selectedIds.includes(u.id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const pageIds = selectableData.map(u => u.id)
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)))
    } else {
      const newIds = selectableData.map(u => u.id).filter(id => !selectedIds.includes(id))
      setSelectedIds(prev => [...prev, ...newIds])
    }
  }

  const toggleSelectOne = (id) => {
    if (id === currentUser?.id) return
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [filtered.length])

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>👤 User Directory</h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Manage system access, roles, and administrative permissions</p>
        </div>
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by ID, name, email, phone, role..."
        onRefresh={fetchUsers}
        refreshing={loading}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={Boolean(typeFilter || roleFilter || search)}
        onClearFilters={clearFilters}
        activeFilters={[
          typeFilter && { key: 'type', label: `Type: ${typeFilter.toUpperCase()}`, onRemove: () => setTypeFilter('') },
          roleFilter && { key: 'role', label: `Role: ${ROLE_LABELS[roleFilter] || roleFilter.toUpperCase()}`, onRemove: () => setRoleFilter('') },
        ].filter(Boolean)}
      >
        <div style={{ minWidth: 160 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Identity Type</label>
          <select 
            className="admin-form-select" 
            value={typeFilter} 
            onChange={e => setTypeFilter(e.target.value)}
            style={{ width: '100%', height: 38, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 8 }}
          >
            <option value="">All Identity Types</option>
            <option value="doctor">👨‍⚕️ Doctor</option>
            <option value="hospital">🏥 Hospital</option>
            <option value="patient">👤 Patient / User</option>
          </select>
        </div>

        <div style={{ minWidth: 160 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Access Role</label>
          <select 
            className="admin-form-select" 
            value={roleFilter} 
            onChange={e => setRoleFilter(e.target.value)}
            style={{ width: '100%', height: 38, background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 8 }}
          >
            <option value="">All Access Roles</option>
            {ROLES.map(r => (
              <option key={r} value={r}>
                {ROLE_LABELS[r] || r.toUpperCase()}
              </option>
            ))}
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
            <h3 className="admin-card-title" style={{ margin: 0 }}>User Accounts</h3>
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
              <strong style={{ color: 'var(--admin-text, #0F172A)' }}>{filtered.length}</strong> Users Found
            </div>
          </div>
        </div>
        
        <div className="admin-card-body" style={{ padding: 0 }}>
          {loading ? (
          <TableSkeleton rowCount={8} columnWidths={['44px', '120px', '22%', '18%', '16%', '14%', '10%']} headers={['', 'User & Avatar', 'Email & Phone', 'Role & Permissions', 'Location', 'Status', 'Actions']} />
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={Boolean(roleFilter || typeFilter || search)} searchQuery={search} onClearFilters={clearFilters} onClearSearch={() => setSearch('')} icon="👥" title="No users found" description="Try changing your search parameters or reset active filters." />
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
                    <th style={{ paddingLeft: 16, minWidth: 200 }}>Profile</th>
                    <th>Contact Info</th>
                    <th>Identity Type</th>
                    <th>Access Role</th>
                    <th style={{ textAlign: 'right', paddingRight: 24 }}>Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map(u => {
                    const type = getTypeStyles(u.registration_type)
                    const isSelected = selectedIds.includes(u.id)
                    const isSelf = u.id === currentUser?.id
                    return (
                      <tr
                        key={u.id}
                        style={{
                          background: isSelected ? 'rgba(16, 185, 129, 0.06)' : undefined,
                          transition: 'background 0.15s'
                        }}
                      >
                        <td style={{ width: 44, textAlign: 'center', paddingLeft: 16 }} onClick={e => e.stopPropagation()}>
                          {isSelf ? (
                            <span title="You cannot select or delete your own account" style={{ opacity: 0.3, cursor: 'not-allowed', fontSize: 13 }}>🚫</span>
                          ) : (
                            <TableCheckbox
                              checked={isSelected}
                              onChange={() => toggleSelectOne(u.id)}
                              title="Select row"
                            />
                          )}
                        </td>
                        <td style={{ paddingLeft: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ 
                              width: 40, height: 40, borderRadius: 12, overflow: 'hidden',
                              background: 'var(--admin-bg)', border: '1px solid var(--admin-border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 800, fontSize: 14, color: 'var(--admin-primary)',
                              flexShrink: 0
                            }}>
                              {u.profile_pic ? (
                                <img
                                  src={getMediaUrl(u.profile_pic)}
                                  alt={u.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'block';
                                  }}
                                />
                              ) : null}
                              <span style={{ display: u.profile_pic ? 'none' : 'block' }}>
                                {getInitials(u.name)}
                              </span>
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{u.name}</div>
                              <div style={{ marginTop: 3 }}>
                                <CompactUlid value={u.public_id || u.id} />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: 13, color: 'var(--admin-text)' }}>{u.email}</div>
                          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{u.phone}</div>
                        </td>
                        <td>
                          <div style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: 6, 
                            padding: '4px 10px', borderRadius: 8, background: type.bg, color: type.color, 
                            fontSize: 12, fontWeight: 700 
                          }}>
                            <span>{type.icon}</span>
                            {u.registration_type?.toUpperCase() || 'PATIENT'}
                          </div>
                        </td>
                        <td>
                          <select 
                            className="admin-form-select" 
                            style={{ 
                              width: 'auto', minWidth: 100, height: 32, padding: '0 8px', 
                              fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
                              background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)',
                              cursor: changingRole === u.id ? 'wait' : 'pointer'
                            }}
                            value={roleChangeTarget?.user?.id === u.id ? roleChangeTarget.newRole : getUserRole(u)}
                            disabled={changingRole === u.id}
                            onChange={(e) => initiateRoleChange(u, e.target.value)}
                          >
                            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r] || r.toUpperCase()}</option>)}
                          </select>
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: 24 }}>
                          <div className="admin-actions" style={{ justifyContent: 'flex-end' }}>
                            <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => handleOpenPerms(u)}>🔑 Perms</button>
                            {isAdmin && (
                              <button 
                                className="admin-action-btn admin-action-btn-delete" 
                                title="Delete User"
                                onClick={() => setDeleteTarget(u)}
                                disabled={u.id === currentUser.id}
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
      </div>

      <TableFooter
        total={filtered.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        perPage={perPage}
        setPerPage={setPerPage}
      />

      {/* Permissions Modal */}
      {selectedUserForPerms && (
        <div className="modal-overlay" onClick={() => setSelectedUserForPerms(null)}>
          <div className="admin-card" style={{ maxWidth: 800, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="admin-card-title">User Permissions: {selectedUserForPerms.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: 0 }}>Configure granular capability overrides for this user account</p>
              </div>
              <button className="admin-btn admin-btn-sm" onClick={() => setSelectedUserForPerms(null)}>✕</button>
            </div>

            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--admin-border)', display: 'flex', gap: 12, alignItems: 'center', background: 'var(--admin-bg)' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Filter permissions..." 
                  value={permSearch} 
                  onChange={e => setPermSearch(e.target.value)}
                  style={{ width: '100%', height: 36, paddingLeft: 32, paddingRight: 10, borderRadius: 6, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)', fontSize: 13 }}
                />
              </div>
              <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={selectAllPermissions}>Select All</button>
              <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={clearAllPermissions}>Clear All</button>
            </div>

            <div style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {groupedPermissions.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--admin-text-muted)', padding: 30 }}>No permissions match your filter</div>
              ) : (
                groupedPermissions.map(group => (
                  <div key={group.key} style={{ border: '1px solid var(--admin-border)', borderRadius: 8, padding: 14, background: 'var(--admin-card-bg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{group.icon}</span> {group.title}
                      </div>
                      <button 
                        type="button" 
                        className="admin-btn admin-btn-sm admin-btn-outline" 
                        style={{ fontSize: 11, padding: '2px 8px', height: 'auto' }}
                        onClick={() => toggleSectionPermissions(group.items)}
                      >
                        Toggle Group
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                      {group.items.map(p => {
                        const pName = typeof p === 'string' ? p : p.name
                        const isChecked = userPermissions.includes(pName)
                        return (
                          <label key={pName} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', color: 'var(--admin-text)', userSelect: 'none' }}>
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => togglePermission(pName)}
                              style={{ accentColor: 'var(--admin-primary)', width: 15, height: 15 }}
                            />
                            {pName.replace(/[._]/g, ' ')}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="admin-card-footer" style={{ padding: '14px 20px', borderTop: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="admin-btn admin-btn-outline" onClick={() => setSelectedUserForPerms(null)} disabled={savingPerms}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={savePermissions} disabled={savingPerms}>
                {savingPerms ? 'Saving Changes...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Confirmation Modal */}
      {roleChangeTarget && (
        <div className="modal-overlay" onClick={cancelRoleChange}>
          <div 
            className="admin-card" 
            style={{ 
              maxWidth: 520, 
              width: '100%', 
              margin: '0 16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
              borderRadius: 16,
              overflow: 'hidden',
              animation: 'fadeInSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div 
              style={{ 
                padding: '20px 24px 16px', 
                borderBottom: '1px solid var(--admin-border)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                background: 'var(--admin-bg)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div 
                  style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 10, 
                    background: roleChangeTarget.newRole === 'admin' 
                      ? 'rgba(239, 68, 68, 0.12)' 
                      : (roleChangeTarget.newRole === 'user' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)'),
                    color: roleChangeTarget.newRole === 'admin' 
                      ? '#EF4444' 
                      : (roleChangeTarget.newRole === 'user' ? '#F59E0B' : '#10B981'),
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: 20
                  }}
                >
                  {roleChangeTarget.newRole === 'admin' ? '🛡️' : (roleChangeTarget.newRole === 'user' ? '⚠️' : '✨')}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--admin-text)' }}>
                    Confirm Access Role Change
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-text-muted)' }}>
                    Please verify this administrative privilege modification
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={cancelRoleChange}
                disabled={Boolean(changingRole)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: 'var(--admin-text-muted)', 
                  padding: 4, 
                  fontSize: 16,
                  borderRadius: 6
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px' }}>
              {/* User preview card */}
              <div 
                style={{ 
                  background: 'var(--admin-bg)', 
                  border: '1px solid var(--admin-border)', 
                  borderRadius: 12, 
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 16
                }}
              >
                <div 
                  style={{ 
                    width: 38, 
                    height: 38, 
                    borderRadius: 10, 
                    background: 'var(--admin-card-bg)', 
                    border: '1px solid var(--admin-border)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 14,
                    color: 'var(--admin-primary)',
                    flexShrink: 0
                  }}
                >
                  {getInitials(roleChangeTarget.user.name)}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--admin-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {roleChangeTarget.user.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {roleChangeTarget.user.email || roleChangeTarget.user.phone}
                  </div>
                </div>
              </div>

              {/* Role Transition Comparison */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 14, 
                  padding: '14px', 
                  borderRadius: 12, 
                  background: 'var(--admin-card-bg)',
                  border: '1px dashed var(--admin-border)',
                  marginBottom: 16
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Current Role
                  </div>
                  <span 
                    style={{ 
                      padding: '4px 12px', 
                      borderRadius: 8, 
                      fontSize: 12, 
                      fontWeight: 800,
                      background: 'rgba(100, 116, 139, 0.1)',
                      color: 'var(--admin-text-muted)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {ROLE_LABELS[roleChangeTarget.oldRole] || roleChangeTarget.oldRole.toUpperCase()}
                  </span>
                </div>

                <div style={{ fontSize: 18, color: 'var(--admin-text-muted)', fontWeight: 700 }}>
                  ➔
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--admin-primary)', textTransform: 'uppercase', marginBottom: 4 }}>
                    New Role
                  </div>
                  <span 
                    style={{ 
                      padding: '4px 12px', 
                      borderRadius: 8, 
                      fontSize: 12, 
                      fontWeight: 800,
                      background: roleChangeTarget.newRole === 'admin' 
                        ? 'rgba(239, 68, 68, 0.12)' 
                        : (roleChangeTarget.newRole === 'manager' || roleChangeTarget.newRole === 'hospital' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)'),
                      color: roleChangeTarget.newRole === 'admin' 
                        ? '#DC2626' 
                        : (roleChangeTarget.newRole === 'manager' || roleChangeTarget.newRole === 'hospital' ? '#0284C7' : '#059669'),
                      textTransform: 'uppercase',
                      border: '1px solid currentColor'
                    }}
                  >
                    {ROLE_LABELS[roleChangeTarget.newRole] || roleChangeTarget.newRole.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Consequence Note */}
              <div 
                style={{ 
                  borderRadius: 10, 
                  padding: '12px 14px', 
                  fontSize: 12.5, 
                  lineHeight: 1.5,
                  display: 'flex', 
                  gap: 10,
                  alignItems: 'flex-start',
                  background: roleChangeTarget.newRole === 'admin' 
                    ? 'rgba(239, 68, 68, 0.08)' 
                    : (roleChangeTarget.newRole === 'user' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)'),
                  color: roleChangeTarget.newRole === 'admin' 
                    ? '#991B1B' 
                    : (roleChangeTarget.newRole === 'user' ? '#92400E' : '#065F46'),
                  border: `1px solid ${
                    roleChangeTarget.newRole === 'admin' 
                      ? 'rgba(239, 68, 68, 0.25)' 
                      : (roleChangeTarget.newRole === 'user' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)')
                  }`
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>
                  {roleChangeTarget.newRole === 'admin' ? '⚠️' : (roleChangeTarget.newRole === 'user' ? 'ℹ️' : '💡')}
                </span>
                <div>
                  {roleChangeTarget.newRole === 'admin' && (
                    <span><strong>Full Admin Privileges:</strong> This user will have unrestricted administrative access to manage all system settings, finances, doctors, hospitals, and users.</span>
                  )}
                  {(roleChangeTarget.newRole === 'manager' || roleChangeTarget.newRole === 'hospital') && (
                    <span><strong>Hospital Portal Access:</strong> This user will be granted full hospital management access and their linked hospital facility profile will be activated.</span>
                  )}
                  {roleChangeTarget.newRole === 'doctor' && (
                    <span><strong>Doctor Portal Access:</strong> This user will be granted doctor prescription and chamber access and their linked doctor profile will be activated.</span>
                  )}
                  {roleChangeTarget.newRole === 'user' && (
                    <span><strong>Revoke Privileges:</strong> Reverting to regular user will remove portal/dashboard management access and automatically deactivate any linked doctor/hospital profile.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div 
              style={{ 
                padding: '14px 24px', 
                borderTop: '1px solid var(--admin-border)', 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: 10,
                background: 'var(--admin-bg)'
              }}
            >
              <button 
                type="button"
                className="admin-btn admin-btn-outline" 
                onClick={cancelRoleChange}
                disabled={Boolean(changingRole)}
                style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8 }}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="admin-btn"
                onClick={confirmRoleChange}
                disabled={Boolean(changingRole)}
                style={{ 
                  padding: '8px 20px', 
                  fontSize: 13, 
                  borderRadius: 8,
                  fontWeight: 700,
                  background: roleChangeTarget.newRole === 'admin' ? '#DC2626' : 'var(--admin-primary)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: Boolean(changingRole) ? 'wait' : 'pointer'
                }}
              >
                {Boolean(changingRole) ? 'Updating Role...' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteModal 
        show={!!deleteTarget} 
        title="Permanently Delete User" 
        message={`Warning: You are about to delete ${deleteTarget?.name}. This will remove all associated data and access credentials. This action is irreversible.`}
        onConfirm={handleDelete} 
        onCancel={() => setDeleteTarget(null)} 
        loading={deleting} 
      />

      <DeleteModal 
        show={showBulkDeleteModal} 
        title="Bulk Delete Users" 
        message={`Warning: You are about to permanently delete ${selectedIds.length} selected user(s). This will remove all associated credentials and profiles. This action is irreversible.`}
        onConfirm={handleBulkDelete} 
        onCancel={() => setShowBulkDeleteModal(false)} 
        loading={bulkDeleting} 
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; padding: 40px 20px;
        }

        .users-filter-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 12px;
          width: 100%;
        }

        .filter-item-search {
          flex: 1 1 auto;
          min-width: 240px;
          position: relative;
        }

        .filter-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--admin-text-muted);
          pointer-events: none;
        }

        .filter-search-input {
          padding-left: 38px !important;
          padding-right: 32px !important;
          height: 42px !important;
          border-radius: 8px !important;
          background: var(--admin-bg) !important;
          color: var(--admin-text) !important;
          border: 1px solid var(--admin-border) !important;
        }

        .filter-search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--admin-text-muted);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .filter-search-clear:hover {
          color: var(--admin-text);
          background: rgba(0, 0, 0, 0.08);
        }

        .filter-item-select {
          flex: 0 0 210px;
        }

        .filter-select-input {
          height: 42px !important;
          border-radius: 8px !important;
          background: var(--admin-bg) !important;
          color: var(--admin-text) !important;
          border: 1px solid var(--admin-border) !important;
          font-weight: 500 !important;
          cursor: pointer !important;
        }

        .filter-reset-btn {
          height: 42px;
          padding: 0 16px;
          border-radius: 8px;
          flex-shrink: 0;
        }

        @media (max-width: 992px) {
          .users-filter-row {
            flex-wrap: wrap;
          }
          .filter-item-search {
            flex: 1 1 100%;
          }
          .filter-item-select {
            flex: 1 1 calc(50% - 6px);
          }
        }

        @media (max-width: 576px) {
          .filter-item-select {
            flex: 1 1 100%;
          }
        }
      `}} />
    </div>
  )
}

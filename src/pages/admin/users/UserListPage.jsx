// UserListPage.jsx — User management (Admin only)
import { useState, useEffect, useMemo } from 'react'
import { Search, RotateCcw, X, Filter, ShieldCheck } from 'lucide-react'
import { getMediaUrl } from '../../../utils/mediaUtils'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { getUsers, updateUserRole, deleteUser, getAllPermissions, updateUserPermissions } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'
import { getErrorMessage } from '../../../utils/errorHelper'

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
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [changingRole, setChangingRole] = useState(null)
  
  // Permissions State
  const [availablePermissions, setAvailablePermissions] = useState([])
  const [selectedUserForPerms, setSelectedUserForPerms] = useState(null)
  const [userPermissions, setUserPermissions] = useState([]) 
  const [permSearch, setPermSearch] = useState('')
  const [savingPerms, setSavingPerms] = useState(false)

  // Pagination state
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const hasFilters = Boolean(search || roleFilter || typeFilter)

  useEffect(() => { 
    fetchAvailablePermissions()
  }, [])

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, roleFilter, typeFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, roleFilter, typeFilter])

  const fetchAvailablePermissions = async () => {
    try {
      const res = await getAllPermissions()
      setAvailablePermissions(res.data?.data || [])
    } catch(err) { console.error(err) }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = {}
      if (roleFilter) params.role = roleFilter
      if (typeFilter) params.user_type = typeFilter
      if (search) params.search = search
      const res = await getUsers(params)
      const data = res.data?.data?.data || res.data?.data || res.data?.users || (Array.isArray(res.data) ? res.data : [])
      setUsers(data)
    } catch (err) {
    } finally {
      setLoading(false)
    }
  }

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

  const handleRoleChange = async (userId, newRole) => {
    setChangingRole(userId)
    try {
      const res = await updateUserRole(userId, newRole)
      const updatedUser = res.data?.data || res.data
      setUsers(users.map(u => {
        if (u.id === userId) {
          return { 
            ...u, 
            ...updatedUser, 
            role: newRole, 
            roles: [newRole],
            permissions: updatedUser?.permissions || u.permissions 
          }
        }
        return u
      }))
    } catch (err) {
      console.error('Failed to update role:', err)
    } finally {
      setChangingRole(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteUser(deleteTarget.id)
      setUsers(users.filter(u => u.id !== deleteTarget.id))
    } catch (err) {
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
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
    setSavingPerms(true)
    try {
      await updateUserPermissions(selectedUserForPerms.id, userPermissions)
      setSelectedUserForPerms(null)
      fetchUsers()
    } catch (err) {
    } finally {
      setSavingPerms(false)
    }
  }

  const filtered = users.filter(u => {
    const searchLower = search.trim().toLowerCase()
    const matchesSearch = !searchLower || 
      (u.name && u.name.toLowerCase().includes(searchLower)) ||
      (u.email && u.email.toLowerCase().includes(searchLower)) ||
      (u.phone && String(u.phone).toLowerCase().includes(searchLower))

    const matchesType = !typeFilter || 
      (typeFilter === 'patient' 
        ? (u.registration_type === 'patient' || u.registration_type === 'user' || !u.registration_type)
        : u.registration_type?.toLowerCase() === typeFilter.toLowerCase())

    const currentRole = getUserRole(u)
    const matchesRole = !roleFilter || (currentRole.toLowerCase() === roleFilter.toLowerCase())

    return matchesSearch && matchesType && matchesRole
  })

  const paginatedData = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

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
        searchPlaceholder="Search profile name, contact info (email, phone)..."
        onRefresh={fetchUsers}
        refreshing={loading}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={Boolean(typeFilter || roleFilter)}
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
        <div className="admin-card-header">
          <h3 className="admin-card-title">User Accounts</h3>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-muted)' }}>{filtered.length} total found</span>
        </div>
        
        <div className="admin-card-body" style={{ padding: 0 }}>
          {loading ? (
          <TableSkeleton rowCount={8} columnWidths={['120px', '22%', '18%', '16%', '14%', '10%']} headers={['User & Avatar', 'Email & Phone', 'Role & Permissions', 'Location', 'Status', 'Actions']} />
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={Boolean(roleFilter || statusFilter || divisionFilter || districtFilter || upazilaFilter || unionFilter || search)} searchQuery={search} onClearFilters={clearFilters} onClearSearch={() => setSearch('')} icon="👥" title="No users found" description="Try changing your search parameters or reset active filters." primaryAction={isAdmin ? { label: '+ Add User', onClick: () => setShowAddModal(true) } : undefined} />
        ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 24 }}>Profile</th>
                    <th>Contact Info</th>
                    <th>Identity Type</th>
                    <th>Access Role</th>
                    <th style={{ textAlign: 'right', paddingRight: 24 }}>Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map(u => {
                    const type = getTypeStyles(u.registration_type)
                    return (
                      <tr key={u.id}>
                        <td style={{ paddingLeft: 24 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ 
                              width: 40, height: 40, borderRadius: 12, overflow: 'hidden',
                              background: 'var(--admin-bg)', border: '1px solid var(--admin-border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 800, fontSize: 14, color: 'var(--admin-primary)'
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
                              <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>ID: <CompactUlid value={u.public_id || u.id} /></div>
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
                              background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)'
                            }}
                            value={getUserRole(u)}
                            disabled={changingRole === u.id}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          >
                            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r] || r.toUpperCase()}</option>)}
                          </select>
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: 24 }}>
                          <div className="admin-actions" style={{ justifyContent: 'flex-end' }}>
                            <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => handleOpenPerms(u)}>🔑 Perms</button>
                            {isAdmin && (
                              <button 
                                className="admin-btn admin-btn-sm admin-btn-danger" 
                                onClick={() => setDeleteTarget(u)}
                                disabled={u.id === currentUser.id}
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
        title="Permanently Delete User" 
        message={`Warning: You are about to delete ${deleteTarget?.name}. This will remove all associated data and access credentials. This action is irreversible.`}
        onConfirm={handleDelete} 
        onCancel={() => setDeleteTarget(null)} 
        loading={deleting} 
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

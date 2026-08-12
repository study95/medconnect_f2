// UserListPage.jsx — User management (Admin only)
import { useState, useEffect, useMemo } from 'react'
import { Search, RotateCcw, X, Filter, ShieldCheck } from 'lucide-react'
import { getMediaUrl } from '../../../utils/mediaUtils'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { getUsers, updateUserRole, deleteUser, getAllPermissions, updateUserPermissions } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'
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

  const hasFilters = Boolean(search || roleFilter || typeFilter)

  useEffect(() => { 
    fetchAvailablePermissions()
  }, [])

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
    if (u.role) return u.role
    if (Array.isArray(u.roles) && u.roles.length > 0) return u.roles[0]
    if (u.registration_type === 'hospital') return 'manager'
    if (u.registration_type === 'doctor') return 'doctor'
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

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>👤 User Directory</h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Manage system access, roles, and administrative permissions</p>
        </div>
      </div>

      {/* Filter Bar Container — Desktop View One Row */}
      <div 
        className="user-directory-filter-card"
        style={{
          background: 'var(--admin-card-bg)',
          border: '1px solid var(--admin-border)',
          borderRadius: 'var(--admin-radius)',
          padding: '16px 20px',
          marginBottom: '20px',
          boxShadow: 'var(--admin-shadow-sm)'
        }}
      >
        <div className="users-filter-row">
          {/* Search Bar: Profile Name, Email, Phone */}
          <div className="filter-item-search">
            <Search className="filter-search-icon" size={18} />
            <input 
              type="text" 
              className="admin-form-input filter-search-input" 
              placeholder="Search profile name, contact info (email, phone)..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button 
                type="button" 
                className="filter-search-clear"
                onClick={() => setSearch('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Identity Type Dropdown Filter */}
          <div className="filter-item-select">
            <select 
              className="admin-form-select filter-select-input" 
              value={typeFilter} 
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="">All Identity Types</option>
              <option value="doctor">👨‍⚕️ Doctor</option>
              <option value="hospital">🏥 Hospital</option>
              <option value="patient">👤 Patient / User</option>
            </select>
          </div>

          {/* Access Role Dropdown Filter */}
          <div className="filter-item-select">
            <select 
              className="admin-form-select filter-select-input" 
              value={roleFilter} 
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="">All Access Roles</option>
              {ROLES.map(r => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r] || r.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          {hasFilters && (
            <button 
              type="button" 
              className="admin-btn admin-btn-outline filter-reset-btn" 
              onClick={clearFilters}
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">User Accounts</h3>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-muted)' }}>{filtered.length} total found</span>
        </div>
        
        <div className="admin-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="admin-loading"><div className="admin-spinner" /> Loading users...</div>
          ) : filtered.length === 0 ? (
            <div className="admin-empty">No users found matching your criteria.</div>
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
                  {filtered.map(u => {
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
                              <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>ID: #{u.id}</div>
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

      {/* Permissions Modal */}
      {selectedUserForPerms && (
        <div className="modal-overlay" onClick={() => setSelectedUserForPerms(null)}>
          <div 
            className="admin-card premium-modal" 
            style={{ 
              maxWidth: 720, 
              width: '95%',
              maxHeight: 'calc(100vh - 80px)',
              margin: 'auto 0',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--admin-card-bg)',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ 
              padding: '20px 24px', 
              borderBottom: '1px solid var(--admin-border)',
              background: 'var(--admin-bg)',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'rgba(0, 168, 140, 0.1)',
                  color: 'var(--admin-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--admin-text)' }}>Administrative Permissions</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--admin-text-muted)' }}>
                    Managing access rights for: <strong style={{ color: 'var(--admin-primary)' }}>{selectedUserForPerms.name}</strong> ({getUserRole(selectedUserForPerms).toUpperCase()})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUserForPerms(null)} 
                style={{ 
                  background: 'var(--admin-card-bg)', 
                  border: '1px solid var(--admin-border)', 
                  width: 32, 
                  height: 32, 
                  borderRadius: 8, 
                  color: 'var(--admin-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Sub-Header: Search bar & Quick Actions */}
            <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid var(--admin-border)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Search Bar */}
                <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
                  <input 
                    type="text"
                    className="admin-form-input"
                    placeholder="Search permissions (e.g. doctor, view, create)..."
                    value={permSearch}
                    onChange={e => setPermSearch(e.target.value)}
                    style={{
                      paddingLeft: 36,
                      paddingRight: 30,
                      height: 38,
                      fontSize: 13,
                      borderRadius: 8,
                      background: 'var(--admin-bg)',
                      color: 'var(--admin-text)',
                      border: '1px solid var(--admin-border)'
                    }}
                  />
                  {permSearch && (
                    <button 
                      onClick={() => setPermSearch('')} 
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', fontSize: 13 }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Quick Action Buttons */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button 
                    type="button"
                    className="admin-btn admin-btn-sm admin-btn-outline"
                    onClick={selectAllPermissions}
                    style={{ height: 38, padding: '0 12px', fontSize: 12, borderRadius: 8 }}
                  >
                    Select All ({availablePermissions.length})
                  </button>
                  <button 
                    type="button"
                    className="admin-btn admin-btn-sm admin-btn-outline"
                    onClick={clearAllPermissions}
                    style={{ height: 38, padding: '0 12px', fontSize: 12, borderRadius: 8, color: 'var(--admin-danger)' }}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Status summary tag */}
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--admin-text-muted)' }}>
                <span>Active Permissions Selected: <strong style={{ color: 'var(--admin-primary)' }}>{userPermissions.length}</strong> of {availablePermissions.length}</span>
                {permSearch && <span>Filtered by: "{permSearch}"</span>}
              </div>
            </div>
            
            {/* Modal Body: Section Wise Permissions Grid */}
            <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
              {groupedPermissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--admin-text-muted)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                  No permissions matching "<strong>{permSearch}</strong>"
                </div>
              ) : (
                groupedPermissions.map(group => {
                  const sectionItemNames = group.items.map(p => typeof p === 'string' ? p : p.name)
                  const selectedCount = sectionItemNames.filter(name => userPermissions.includes(name)).length
                  const isAllSectionSelected = selectedCount === sectionItemNames.length && sectionItemNames.length > 0

                  return (
                    <div 
                      key={group.key} 
                      style={{ 
                        marginBottom: 20, 
                        background: 'var(--admin-bg)', 
                        borderRadius: 12, 
                        border: '1px solid var(--admin-border)',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Section Header */}
                      <div style={{ 
                        padding: '10px 16px', 
                        background: 'rgba(0, 0, 0, 0.02)', 
                        borderBottom: '1px solid var(--admin-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>{group.icon}</span>
                          <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--admin-text)' }}>{group.title}</span>
                          <span style={{ 
                            fontSize: 11, 
                            fontWeight: 700, 
                            padding: '2px 8px', 
                            borderRadius: 12, 
                            background: selectedCount > 0 ? 'rgba(0, 168, 140, 0.12)' : 'var(--admin-card-bg)',
                            color: selectedCount > 0 ? 'var(--admin-primary)' : 'var(--admin-text-muted)',
                            border: '1px solid var(--admin-border)'
                          }}>
                            {selectedCount} / {sectionItemNames.length}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSectionPermissions(group.items)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--admin-primary)',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: '2px 6px'
                          }}
                        >
                          {isAllSectionSelected ? 'Deselect Section' : 'Select Section'}
                        </button>
                      </div>

                      {/* Section Permission Grid */}
                      <div style={{ 
                        padding: 12, 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', 
                        gap: 8 
                      }}>
                        {group.items.map(p => {
                          const permName = typeof p === 'string' ? p : p.name
                          const isSelected = userPermissions.includes(permName)
                          return (
                            <div 
                              key={p.id || permName} 
                              onClick={() => togglePermission(permName)}
                              style={{ 
                                padding: '10px 12px', 
                                borderRadius: 8, 
                                border: '1.5px solid', 
                                borderColor: isSelected ? 'var(--admin-primary)' : 'var(--admin-border)',
                                background: isSelected ? 'rgba(0, 168, 140, 0.06)' : 'var(--admin-card-bg)',
                                cursor: 'pointer', 
                                transition: 'all 0.15s ease', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 10
                              }}
                            >
                              <div style={{ 
                                width: 18, 
                                height: 18, 
                                borderRadius: 5, 
                                border: '1.5px solid',
                                borderColor: isSelected ? 'var(--admin-primary)' : 'var(--admin-text-muted)',
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                background: isSelected ? 'var(--admin-primary)' : 'transparent',
                                flexShrink: 0
                              }}>
                                {isSelected && <span style={{ color: 'white', fontSize: 11, fontWeight: 900 }}>✓</span>}
                              </div>
                              <span style={{ 
                                fontSize: 12.5, 
                                fontWeight: isSelected ? 700 : 500, 
                                color: isSelected ? 'var(--admin-text)' : 'var(--admin-text-muted)',
                                wordBreak: 'break-word'
                              }}>
                                {permName}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Modal Footer Actions */}
            <div style={{ 
              padding: '16px 24px', 
              borderTop: '1px solid var(--admin-border)',
              background: 'var(--admin-bg)',
              display: 'flex', 
              gap: 12 
            }}>
              <button 
                className="admin-btn admin-btn-primary" 
                style={{ flex: 1, padding: '10px 16px', height: 42, fontSize: 14, fontWeight: 700, borderRadius: 8 }} 
                onClick={savePermissions} 
                disabled={savingPerms}
              >
                {savingPerms ? 'Saving Permissions...' : 'Update Permissions'}
              </button>
              <button 
                className="admin-btn admin-btn-outline" 
                style={{ flex: 1, padding: '10px 16px', height: 42, fontSize: 14, fontWeight: 600, borderRadius: 8 }} 
                onClick={() => setSelectedUserForPerms(null)}
              >
                Cancel
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

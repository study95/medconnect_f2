// UserListPage.jsx — User management (Admin only)
import { useState, useEffect } from 'react'
import { getMediaUrl } from '../../../utils/mediaUtils'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { getUsers, updateUserRole, deleteUser, getAllPermissions, updateUserPermissions } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'
import { getErrorMessage } from '../../../utils/errorHelper'

const ROLES = ['admin', 'manager', 'doctor', 'user']
const ROLE_LABELS = { admin: 'ADMIN', manager: 'HOSPITAL', doctor: 'DOCTOR', user: 'USER' }

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
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [changingRole, setChangingRole] = useState(null)
  
  // Permissions State
  const [availablePermissions, setAvailablePermissions] = useState([])
  const [selectedUserForPerms, setSelectedUserForPerms] = useState(null)
  const [userPermissions, setUserPermissions] = useState([]) 
  const [savingPerms, setSavingPerms] = useState(false)

  useEffect(() => { 
    fetchUsers()
    fetchAvailablePermissions()
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [roleFilter, typeFilter, dateFrom, dateTo])

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
      if (typeFilter) params.registration_type = typeFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
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
    setDateFrom('')
    setDateTo('')
    setSearch('')
  }

  const handleRoleChange = async (userId, newRole) => {
    setChangingRole(userId)
    try {
      await updateUserRole(userId, newRole)
      
      fetchUsers()
    } catch (err) {
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
    setUserPermissions(user.permissions?.map(p => p.name) || [])
  }

  const togglePermission = (permName) => {
    if (userPermissions.includes(permName)) {
      setUserPermissions(userPermissions.filter(p => p !== permName))
    } else {
      setUserPermissions([...userPermissions, permName])
    }
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

  const filtered = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  )

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>👤 User Directory</h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Manage system access, roles, and administrative permissions</p>
        </div>
      </div>

      <div className="admin-filters-bar">
        <div className="admin-filters-grid">
          <div className="admin-form-group">
            <label className="admin-form-label">Search Identity</label>
            <input 
              type="text" 
              className="admin-form-input" 
              placeholder="Name, email or phone..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'var(--admin-card-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)' }}
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">System Role</label>
            <select 
              className="admin-form-select" 
              value={roleFilter} 
              onChange={e => setRoleFilter(e.target.value)}
              style={{ background: 'var(--admin-card-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)' }}
            >
              <option value="">All Roles</option>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r] || r.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Entity Type</label>
            <select 
              className="admin-form-select" 
              value={typeFilter} 
              onChange={e => setTypeFilter(e.target.value)}
              style={{ background: 'var(--admin-card-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)' }}
            >
              <option value="">All Types</option>
              <option value="doctor">Doctor</option>
              <option value="hospital">Hospital</option>
              <option value="patient">Patient/User</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="admin-btn admin-btn-primary" onClick={fetchUsers} style={{ flex: 1 }}>Filter</button>
            <button className="admin-btn admin-btn-outline" onClick={clearFilters}>Reset</button>
          </div>
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
                            value={u.role || 'user'}
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
          <div className="admin-card premium-modal" style={{ maxWidth: 600, background: 'var(--admin-card-bg)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--admin-text)' }}>Administrative Permissions</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--admin-text-muted)' }}>Managing for: <strong>{selectedUserForPerms.name}</strong></p>
              </div>
              <button onClick={() => setSelectedUserForPerms(null)} style={{ background: 'var(--admin-bg)', border: 'none', width: 32, height: 32, borderRadius: 8, color: 'var(--admin-text)' }}>✕</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxHeight: 400, overflowY: 'auto', padding: 4 }}>
              {availablePermissions.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => togglePermission(p.name)}
                  style={{ 
                    padding: '12px 16px', borderRadius: 12, border: '1.5px solid', 
                    borderColor: userPermissions.includes(p.name) ? 'var(--admin-primary)' : 'var(--admin-border)',
                    background: userPermissions.includes(p.name) ? 'rgba(0, 168, 140, 0.05)' : 'transparent',
                    cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12
                  }}
                >
                  <div style={{ 
                    width: 18, height: 18, borderRadius: 6, border: '2px solid',
                    borderColor: userPermissions.includes(p.name) ? 'var(--admin-primary)' : 'var(--admin-text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: userPermissions.includes(p.name) ? 'var(--admin-primary)' : 'transparent'
                  }}>
                    {userPermissions.includes(p.name) && <span style={{ color: 'white', fontSize: 10 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: userPermissions.includes(p.name) ? 'var(--admin-text)' : 'var(--admin-text-muted)' }}>{p.name.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button className="admin-btn admin-btn-primary" style={{ flex: 1, padding: 12 }} onClick={savePermissions} disabled={savingPerms}>
                {savingPerms ? 'Saving...' : 'Update Permissions'}
              </button>
              <button className="admin-btn admin-btn-outline" style={{ flex: 1, padding: 12 }} onClick={() => setSelectedUserForPerms(null)}>Cancel</button>
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
          z-index: 9999; padding: 20px;
        }
      `}} />
    </div>
  )
}

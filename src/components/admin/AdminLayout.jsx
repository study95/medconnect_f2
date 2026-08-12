import { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'
import ExpiryWarningBanner from './ExpiryWarningBanner'
import NotificationPopup from './NotificationPopup'
import { IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand, IconExternalLink } from '@tabler/icons-react'
import { Bell, ChevronDown, User, Lock, LogOut } from 'lucide-react'
import { useSubscription } from '../../context/SubscriptionContext'
import { getMediaUrl } from '../../utils/mediaUtils'
import '../../styles/admin.css'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true'
  })

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('admin_sidebar_collapsed', newState)
  }

  const { user, getRoles, logout } = useAuth()
  const roleName = getRoles()[0] || 'user'
  const { unreadCount } = useSubscription()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <div className="admin-wrapper">
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          duration: 3500,
          style: {
            background: 'var(--admin-card-bg)',
            color: 'var(--admin-text)',
            border: '1px solid var(--admin-border)',
            borderRadius: '0px',
            fontSize: '13px',
            fontWeight: '600',
            boxShadow: '0 10px 25px rgba(0,0,0,0.12)'
          },
          success: {
            iconTheme: {
              primary: '#00A88C',
              secondary: '#ffffff'
            }
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#ffffff'
            }
          }
        }}
      />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      <div className={`admin-main ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Premium Header */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
            <button
              type="button"
              className="header-collapse-btn"
              onClick={toggleCollapse}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <IconLayoutSidebarLeftExpand size={20} /> : <IconLayoutSidebarLeftCollapse size={20} />}
            </button>
            
            <div style={{ marginLeft: 8, display: 'flex', alignItems: 'center' }}>
              <span className="admin-header-role-title" style={{ 
                fontSize: 16, 
                fontWeight: 900, 
                background: 'linear-gradient(135deg, var(--admin-primary), #0ea5e9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                display: 'inline-block',
                whiteSpace: 'nowrap'
              }}>
                {roleName === 'admin' ? 'Admin Panel' : roleName === 'manager' ? 'Manager Panel' : roleName === 'doctor' ? 'Doctor Panel' : 'User Panel'}
              </span>
            </div>
          </div>

          <div className="admin-header-right">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Notification Bell */}
              <Link to="/admin/notifications" style={{ position: 'relative', color: 'var(--admin-text)', display: 'flex', alignItems: 'center' }}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -5, right: -5,
                    background: '#EF4444', color: 'white', borderRadius: 10,
                    padding: '1px 5px', fontSize: 10, fontWeight: 800
                  }}>
                    {unreadCount}
                  </span>
                )}
              </Link>

              <div className="header-divider" style={{ width: 1, height: 24, background: 'var(--admin-border)' }} />

              {/* User Dropdown */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', 
                    border: 'none', cursor: 'pointer', padding: 0 
                  }}
                >
                  <div className="header-user-details" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text)' }}>{user?.name || 'User'}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--admin-primary)', textTransform: 'uppercase' }}>{roleName}</span>
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: '1.5px solid rgba(0, 168, 140, 0.3)', background: 'rgba(0, 168, 140, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {user?.photo ? (
                      <img src={getMediaUrl(user.photo)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontWeight: 800, color: 'var(--admin-primary)', fontSize: 14 }}>{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <ChevronDown size={16} color="var(--admin-text-muted)" style={{ transition: '0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                </button>

                {dropdownOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setDropdownOpen(false)} />
                    <div style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: 12, width: 220,
                      background: 'var(--admin-bg)', border: '1px solid var(--admin-border)',
                      borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100,
                      overflow: 'hidden', display: 'flex', flexDirection: 'column'
                    }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg-alt)' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--admin-text)' }}>{user?.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{user?.email}</div>
                      </div>
                      <div style={{ padding: 8 }}>
                        <Link to="/admin/profile" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', color: 'var(--admin-text)', textDecoration: 'none', fontSize: 13, fontWeight: 600, borderRadius: 8, transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--admin-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <User size={16} /> Update Profile
                        </Link>
                        <Link to="/admin/password" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', color: 'var(--admin-text)', textDecoration: 'none', fontSize: 13, fontWeight: 600, borderRadius: 8, transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--admin-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <Lock size={16} /> Update Password
                        </Link>
                      </div>
                      <div style={{ padding: 8, borderTop: '1px solid var(--admin-border)' }}>
                        <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', color: '#EF4444', background: 'transparent', border: 'none', fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="header-divider" style={{ width: 1, height: 24, background: 'var(--admin-border)' }} />
              
              <Link to="/" className="admin-back-link" title="Go to Website">
                <span className="back-link-text">Go to Website</span> <IconExternalLink size={15} />
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content — rendered by nested routes via <Outlet /> */}
        <main className="admin-content">
          <ExpiryWarningBanner />
          <Outlet />
        </main>
      </div>

      {/* Notification Popup — shows on login for unread popup notifications */}
      <NotificationPopup />
    </div>
  )
}

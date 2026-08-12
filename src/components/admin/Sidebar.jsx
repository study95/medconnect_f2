import { NavLink, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { getMediaUrl } from '../../utils/mediaUtils'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

import { useSubscription } from '../../context/SubscriptionContext'
import { Sun, Moon, LogOut, ChevronLeft, ChevronRight, LayoutDashboard, Map, MapPin, Building2, Building, Stethoscope, BriefcaseMedical, CalendarCheck, CreditCard, FileText, ClipboardPlus, Pill, Sparkles, Receipt, ShoppingCart, Users, UserPlus, FileEdit, Zap, History, Bell, Package, Ticket, Gift, MessageSquare, Shield } from 'lucide-react'

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
  const { user, isAdmin, isDoctor, isManager, getRoles, hasPermission, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const handleToggleTheme = () => {
    toggleTheme()
    toast.success(`Switched to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`)
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
  }

  const { unreadCount } = useSubscription()
  const location = useLocation()

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const roleName = getRoles()[0] || 'user'

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />

      <aside className={`admin-sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* ===== ZONE 1: Brand (Sticky Top) ===== */}
        <div className="sidebar-brand-wrapper">
          <NavLink to="/admin" className="sidebar-brand" onClick={onClose}>
            <div className="sidebar-brand-logo-img">
              <img
                src="/doctorBookletLogo.png"
                alt="Doctor Booklet"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={e => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
              <span style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                fontWeight: 900,
                fontSize: 15,
                color: 'white'
              }}>DB</span>
            </div>
            <div className="sidebar-brand-text">
              Doctor <span>Booklet</span>
            </div>
          </NavLink>
        </div>


        {/* ===== ZONE 2: Navigation (Scrollable) ===== */}
        <nav className="sidebar-nav">
          {/* Dashboard — visible to all staff */}
          <NavLink
            to="/admin"
            end
            className={`sidebar-nav-item ${isActive('/admin') && location.pathname === '/admin' ? 'active' : ''}`}
            onClick={onClose}
            title={isCollapsed ? 'Dashboard' : undefined}
          >
            <span className="nav-icon"><LayoutDashboard size={18} /></span>
            <span className="nav-text">Dashboard</span>
          </NavLink>

          {/* Core Management — restricted if not admin/manager and no permissions */}
          {(isAdmin || isManager || hasPermission('division.view') || hasPermission('district.view') || hasPermission('specialty.view')) && (
            <>
              <div className="sidebar-section-title">Management</div>

              {(isAdmin || hasPermission('division.view')) && (
                <NavLink
                  to="/admin/divisions"
                  className={`sidebar-nav-item ${isActive('/admin/divisions') ? 'active' : ''}`}
                  onClick={onClose}
                  title={isCollapsed ? 'Divisions' : undefined}
                >
                  <span className="nav-icon"><Map size={18} /></span>
                  <span className="nav-text">Divisions</span>
                </NavLink>
              )}

              {(isAdmin || hasPermission('district.view')) && (
                <NavLink
                  to="/admin/districts"
                  className={`sidebar-nav-item ${isActive('/admin/districts') ? 'active' : ''}`}
                  onClick={onClose}
                  title={isCollapsed ? 'Districts' : undefined}
                >
                  <span className="nav-icon"><MapPin size={18} /></span>
                  <span className="nav-text">Districts</span>
                </NavLink>
              )}

              {(isAdmin || hasPermission('upazila.view')) && (
                <NavLink
                  to="/admin/upazilas"
                  className={`sidebar-nav-item ${isActive('/admin/upazilas') ? 'active' : ''}`}
                  onClick={onClose}
                  title={isCollapsed ? 'Upazilas' : undefined}
                >
                  <span className="nav-icon"><Building size={18} /></span>
                  <span className="nav-text">Upazilas</span>
                </NavLink>
              )}

              {(isAdmin || hasPermission('union.view')) && (
                <NavLink
                  to="/admin/unions"
                  className={`sidebar-nav-item ${isActive('/admin/unions') ? 'active' : ''}`}
                  onClick={onClose}
                  title={isCollapsed ? 'Unions' : undefined}
                >
                  <span className="nav-icon"><Building2 size={18} /></span>
                  <span className="nav-text">Unions</span>
                </NavLink>
              )}

              {(isAdmin || hasPermission('specialty.view')) && (
                <NavLink
                  to="/admin/specialties"
                  className={`sidebar-nav-item ${isActive('/admin/specialties') ? 'active' : ''}`}
                  onClick={onClose}
                  title={isCollapsed ? 'Specialties' : undefined}
                >
                  <span className="nav-icon"><Sparkles size={18} /></span>
                  <span className="nav-text">Specialties</span>
                </NavLink>
              )}
            </>
          )}

          {/* Hospitals — admin, manager, or permission */}
          {(isAdmin || isManager || hasPermission('hospital.view')) && (
            <>
              <div className="sidebar-section-title">Facilities</div>

              <NavLink
                to="/admin/hospitals"
                className={`sidebar-nav-item ${isActive('/admin/hospitals') ? 'active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? (isManager ? 'My Hospital' : 'Hospitals') : undefined}
              >
                <span className="nav-icon"><Building2 size={18} /></span>
                <span className="nav-text">{isManager ? 'My Hospital' : 'Hospitals'}</span>
              </NavLink>
            </>
          )}

          {/* Clinical Section */}
          <div className="sidebar-section-title">
            {isDoctor ? 'My Profile' : 'Clinical'}
          </div>

          {(isAdmin || isManager || isDoctor || hasPermission('doctor.view')) && (
            <NavLink
              to="/admin/doctors"
              className={`sidebar-nav-item ${isActive('/admin/doctors') ? 'active' : ''}`}
              onClick={onClose}
              title={isCollapsed ? (isDoctor ? 'My Profile' : 'Doctors') : undefined}
            >
              <span className="nav-icon"><Stethoscope size={18} /></span>
              <span className="nav-text">{isDoctor ? 'My Profile' : 'Doctors'}</span>
            </NavLink>
          )}

          {(isAdmin || isManager || isDoctor || hasPermission('doctor_chamber.view')) && (
            <NavLink
              to="/admin/chambers"
              className={`sidebar-nav-item ${isActive('/admin/chambers') ? 'active' : ''}`}
              onClick={onClose}
              title={isCollapsed ? (isDoctor ? 'My Chambers' : 'Chambers') : undefined}
            >
              <span className="nav-icon"><BriefcaseMedical size={18} /></span>
              <span className="nav-text">{isDoctor ? 'My Chambers' : 'Chambers'}</span>
            </NavLink>
          )}

          {/* Bookings Section */}
          <div className="sidebar-section-title">
            {isDoctor ? 'My Patients' : 'Bookings'}
          </div>

          {(isAdmin || isManager || isDoctor || hasPermission('appointment.view')) && (
            <NavLink
              to="/admin/appointments"
              className={`sidebar-nav-item ${isActive('/admin/appointments') ? 'active' : ''}`}
              onClick={onClose}
              title={isCollapsed ? 'Appointments' : undefined}
            >
              <span className="nav-icon"><CalendarCheck size={18} /></span>
              <span className="nav-text">Appointments</span>
            </NavLink>
          )}

          {(isAdmin || isManager || isDoctor || hasPermission('payment.view')) && (
            <NavLink
              to="/admin/payments"
              className={`sidebar-nav-item ${isActive('/admin/payments') ? 'active' : ''}`}
              onClick={onClose}
              title={isCollapsed ? 'Payments' : undefined}
            >
              <span className="nav-icon"><CreditCard size={18} /></span>
              <span className="nav-text">Payments</span>
            </NavLink>
          )}

          {(isAdmin || isDoctor || (isManager && false) || hasPermission('prescription.view')) && (
            <NavLink
              to="/admin/prescriptions"
              className={`sidebar-nav-item ${isActive('/admin/prescriptions') ? 'active' : ''}`}
              onClick={onClose}
              title={isCollapsed ? 'Prescriptions' : undefined}
            >
              <span className="nav-icon"><FileText size={18} /></span>
              <span className="nav-text">Prescriptions</span>
            </NavLink>
          )}

          {isDoctor && (
            <NavLink
              to="/admin/notes"
              className={`sidebar-nav-item ${isActive('/admin/notes') ? 'active' : ''}`}
              onClick={onClose}
              title={isCollapsed ? 'My Notes' : undefined}
            >
              <span className="nav-icon"><ClipboardPlus size={18} /></span>
              <span className="nav-text">My Notes</span>
            </NavLink>
          )}

          {(isAdmin || isDoctor || (isManager && false) || hasPermission('medicine.view')) && (
            <NavLink
              to="/admin/medicines"
              className={`sidebar-nav-item ${isActive('/admin/medicines') ? 'active' : ''}`}
              onClick={onClose}
              title={isCollapsed ? 'Medicines' : undefined}
            >
              <span className="nav-icon"><Pill size={18} /></span>
              <span className="nav-text">Medicines</span>
            </NavLink>
          )}

          {/* Marketing Section — Admin & Manager */}
          {(isAdmin || isManager || hasPermission('commission.view')) && (
            <>
              <div className="sidebar-section-title">Promotion</div>
              <NavLink
                to="/admin/highlights"
                className={`sidebar-nav-item ${isActive('/admin/highlights') ? 'active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? 'Highlights' : undefined}
              >
                <span className="nav-icon"><Sparkles size={18} /></span>
                <span className="nav-text">Highlights</span>
              </NavLink>

              <NavLink
                to="/admin/commission"
                className={`sidebar-nav-item ${isActive('/admin/commission') ? 'active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? 'Commission' : undefined}
              >
                <span className="nav-icon"><Receipt size={18} /></span>
                <span className="nav-text">Commission & Service</span>
              </NavLink>

              <NavLink
                to="/admin/reports/commission"
                className={`sidebar-nav-item ${isActive('/admin/reports/commission') ? 'active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? 'Commission Report' : undefined}
              >
                <span className="nav-icon"><Receipt size={18} /></span>
                <span className="nav-text">Commission Report</span>
              </NavLink>

              <NavLink
                to="/admin/reports/purchase"
                className={`sidebar-nav-item ${isActive('/admin/reports/purchase') ? 'active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? 'Purchase Report' : undefined}
              >
                <span className="nav-icon"><ShoppingCart size={18} /></span>
                <span className="nav-text">Purchase Report</span>
              </NavLink>
            </>
          )}

          {/* System Admin Section */}
          {(isAdmin || isManager || hasPermission('user.view') || hasPermission('payment.view') || hasPermission('content.update') || hasPermission('patient.view')) && (
            <>
              <div className="sidebar-section-title">System</div>

              {(isAdmin || isManager || hasPermission('patient.view')) && (
                <NavLink
                  to="/admin/patients"
                  className={`sidebar-nav-item ${isActive('/admin/patients') ? 'active' : ''}`}
                  onClick={onClose}
                  title={isCollapsed ? 'Patients' : undefined}
                >
                  <span className="nav-icon"><Users size={18} /></span>
                  <span className="nav-text">Patients</span>
                </NavLink>
              )}

              {(isAdmin || hasPermission('user.view')) && (
                <NavLink
                  to="/admin/users"
                  className={`sidebar-nav-item ${isActive('/admin/users') ? 'active' : ''}`}
                  onClick={onClose}
                  title={isCollapsed ? 'Users' : undefined}
                >
                  <span className="nav-icon"><UserPlus size={18} /></span>
                  <span className="nav-text">Users</span>
                </NavLink>
              )}


              {(isAdmin || hasPermission('content.update')) && (
                <>
                  <NavLink
                    to="/admin/content"
                    className={`sidebar-nav-item ${isActive('/admin/content') ? 'active' : ''}`}
                    onClick={onClose}
                    title={isCollapsed ? 'Content CMS' : undefined}
                  >
                    <span className="nav-icon"><FileEdit size={18} /></span>
                    <span className="nav-text">Content CMS</span>
                  </NavLink>

                  <NavLink
                    to="/admin/services"
                    className={`sidebar-nav-item ${isActive('/admin/services') ? 'active' : ''}`}
                    onClick={onClose}
                    title={isCollapsed ? 'Services' : undefined}
                  >
                    <span className="nav-icon"><BriefcaseMedical size={18} /></span>
                    <span className="nav-text">Services</span>
                  </NavLink>
                </>
              )}

              {isAdmin && (
                <NavLink
                  to="/admin/audit-logs"
                  className={`sidebar-nav-item ${isActive('/admin/audit-logs') ? 'active' : ''}`}
                  onClick={onClose}
                  title={isCollapsed ? 'Audit Log' : undefined}
                >
                  <span className="nav-icon"><Shield size={18} /></span>
                  <span className="nav-text">Audit Log</span>
                </NavLink>
              )}
            </>
          )}

          {/* Subscription Section — Doctor */}
          {isDoctor && (
            <>
              <div className="sidebar-section-title">SUBSCRIPTION</div>

              <NavLink
                to="/admin/subscription"
                className={`sidebar-nav-item ${isActive('/admin/subscription') && !isActive('/admin/subscription/') ? 'active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? 'Plans' : undefined}
              >
                <span className="nav-icon"><Zap size={18} /></span>
                <span className="nav-text">Plans</span>
              </NavLink>

              <NavLink
                to="/admin/subscription/history"
                className={`sidebar-nav-item ${isActive('/admin/subscription/history') ? 'active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? 'My Subscriptions' : undefined}
              >
                <span className="nav-icon"><History size={18} /></span>
                <span className="nav-text">My Subscriptions</span>
              </NavLink>


            </>
          )}

          {/* Admin Subscription Management */}
          {isAdmin && (
            <>
              <div className="sidebar-section-title">SUBSCRIPTION MGT</div>

              <NavLink
                to="/admin/subscriptions"
                className={`sidebar-nav-item ${isActive('/admin/subscriptions') && location.pathname === '/admin/subscriptions' ? 'active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? 'Doctor Subs' : undefined}
              >
                <span className="nav-icon"><CreditCard size={18} /></span>
                <span className="nav-text">Doctor Subs</span>
              </NavLink>

              <NavLink
                to="/admin/subscription-packages"
                className={`sidebar-nav-item ${isActive('/admin/subscription-packages') ? 'active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? 'Packages' : undefined}
              >
                <span className="nav-icon"><Package size={18} /></span>
                <span className="nav-text">Packages</span>
              </NavLink>

              <NavLink
                to="/admin/promo-codes"
                className={`sidebar-nav-item ${isActive('/admin/promo-codes') ? 'active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? 'Promo Codes' : undefined}
              >
                <span className="nav-icon"><Ticket size={18} /></span>
                <span className="nav-text">Promo Codes</span>
              </NavLink>

              <NavLink
                to="/admin/trial-days"
                className={`sidebar-nav-item ${isActive('/admin/trial-days') ? 'active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? 'Trial Days' : undefined}
              >
                <span className="nav-icon"><Gift size={18} /></span>
                <span className="nav-text">Trial Days</span>
              </NavLink>

              <NavLink
                to="/admin/messages"
                className={`sidebar-nav-item ${isActive('/admin/messages') ? 'active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? 'Messages' : undefined}
              >
                <span className="nav-icon"><MessageSquare size={18} /></span>
                <span className="nav-text">Messages</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* ===== ZONE 3: Controls (Fixed Bottom) ===== */}
        <div className="sidebar-controls" style={{
          display: 'flex',
          flexDirection: isCollapsed ? 'column' : 'row',
          gap: 8, padding: '16px 20px',
          borderTop: '1px solid var(--admin-sidebar-border)',
          flexShrink: 0,
          background: 'rgba(0,0,0,0.05)'
        }}>
          <button
            className="sidebar-control-btn"
            onClick={handleToggleTheme}
            title={isCollapsed ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : undefined}
            style={{
              flex: 1, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, background: 'var(--admin-sidebar-user-bg)', border: '1px solid var(--admin-sidebar-border)',
              color: 'var(--admin-sidebar-text)', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: '0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'var(--admin-sidebar-hover)'}
            onMouseLeave={(e) => e.target.style.background = 'var(--admin-sidebar-user-bg)'}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            <span className="control-text">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
          <button
            className="sidebar-control-btn"
            onClick={handleLogout}
            title={isCollapsed ? 'Logout' : undefined}
            style={{
              flex: 1, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: '0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
          >
            <LogOut size={14} />
            <span className="control-text">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

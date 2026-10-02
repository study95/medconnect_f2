import { useState, useEffect, useCallback } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { getMediaUrl } from '../../utils/mediaUtils'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useSubscription } from '../../context/SubscriptionContext'
import { getPrescriptions } from '../../api/adminApi'

import {
  Sun, Moon, LogOut, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  LayoutDashboard, Map, MapPin, Building2, Building, Stethoscope, BriefcaseMedical,
  CalendarCheck, CreditCard, FileText, ClipboardPlus, Pill, Sparkles, Receipt,
  ShoppingCart, Users, UserPlus, FileEdit, Zap, History, Bell, Package, Ticket,
  Gift, MessageSquare, Shield, Tv, CalendarOff, DollarSign, Layers, Settings,
  Tag, Clock, Megaphone
} from 'lucide-react'

// ─── Collapsible Section Component ────────────────────────────────────────────
function SidebarSection({ id, label, routes = [], isCollapsed: sidebarCollapsed, openSections, onToggle, children }) {
  const location = useLocation()

  // Force open if the current page belongs to this section
  const isActiveSection = routes.some(r =>
    location.pathname === r ||
    location.pathname.startsWith(r + '/') ||
    location.pathname.startsWith(r + '?')
  )

  const isOpen = isActiveSection || openSections[id] !== false // default open

  // When sidebar is icon-only, always show children (can't show section headers)
  if (sidebarCollapsed) {
    return <>{children}</>
  }

  return (
    <div className="sidebar-section-group">
      <button
        className={`sidebar-section-header${isActiveSection ? ' active-section' : ''}`}
        onClick={() => onToggle(id)}
        title={label}
      >
        <span className="sidebar-section-label">{label}</span>
        <span className="sidebar-section-chevron">
          {isOpen
            ? <ChevronUp size={12} />
            : <ChevronDown size={12} />
          }
        </span>
      </button>
      {isOpen && <div className="sidebar-section-items">{children}</div>}
    </div>
  )
}

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

  const portalBase = isDoctor ? '/doctor' : (isManager ? '/hospital' : '/admin')
  const pLink = (subpath) => `${portalBase}${subpath.startsWith('/') ? subpath : '/' + subpath}`

  const isActive = (path) => {
    const full = path.startsWith('/') ? path : `${portalBase}/${path}`
    const p = full.split('?')[0]
    return location.pathname === full || location.pathname === p || (p !== portalBase && location.pathname.startsWith(p + '/'))
  }

  const roleName = getRoles()[0] || 'user'

  const doctorScopeId = user?.doctor?.id
    ? `doc_${user.doctor.id}`
    : (user?.doctor_id ? `doc_${user.doctor_id}` : (user?.id ? `usr_${user.id}` : null))

  // ─── Section open/close state (persisted in localStorage) ─────────────────
  const STORAGE_KEY = `sidebar_sections_${roleName}`

  const [openSections, setOpenSections] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const handleToggleSection = (id) => {
    setOpenSections(prev => {
      const current = prev[id] !== false // default open
      const next = { ...prev, [id]: !current }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  // ─── Prescription Drafts Count Badge ──────────────────────────────────────
  const [rxDraftCount, setRxDraftCount] = useState(0)

  const updateRxDraftCount = useCallback(async () => {
    if (!isDoctor) return
    try {
      const res = await getPrescriptions({ per_page: 200 })
      const allPrescriptions = res.data?.data?.data || res.data?.data || res.data || []
      const dbDrafts = Array.isArray(allPrescriptions) ? allPrescriptions.filter(p => p.status === 'draft') : []
      let count = dbDrafts.length

      if (doctorScopeId) {
        try {
          const prefix = `dr_rx_draft_${doctorScopeId}_`
          const keysToInspect = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith(prefix)) {
              keysToInspect.push(key)
            }
          }

          for (const key of keysToInspect) {
            try {
              const raw = localStorage.getItem(key)
              if (!raw) continue
              const item = JSON.parse(raw)
              if (!item?.form) {
                localStorage.removeItem(key)
                continue
              }

              const activeId = item.activeDraftId
              const apptId = item.form?.appointment_id || item.appointmentInfo?.id || item.appointmentInfo?.public_id || item.appointment_id

              const keyMatches = (p) => {
                if (p.public_id && key.toUpperCase().includes(p.public_id.toUpperCase())) return true
                if (p.id && key.endsWith(`_rx_${p.id}`)) return true
                if (p.appointment_id && key.endsWith(`_${p.appointment_id}`)) return true
                if (p.appointment_public_id && key.toUpperCase().includes(p.appointment_public_id.toUpperCase())) return true
                return false
              }

              const dbMatch = Array.isArray(allPrescriptions) ? allPrescriptions.find(p =>
                (activeId && (String(p.id) === String(activeId) || (p.public_id && String(p.public_id).toUpperCase() === String(activeId).toUpperCase()))) ||
                (apptId && (String(p.appointment_id) === String(apptId) || (p.appointment_public_id && String(p.appointment_public_id).toUpperCase() === String(apptId).toUpperCase()))) ||
                keyMatches(p)
              ) : null

              if (dbMatch) {
                if (dbMatch.status === 'finalized' || dbMatch.status === 'locked') {
                  localStorage.removeItem(key)
                }
                continue
              }

              const hasMeds = Array.isArray(item.form.medicines) && item.form.medicines.some(m => (m.medicine_name || '').trim().length > 0)
              const hasContent = !!(item.form.diagnosis?.trim() || item.form.advice?.trim() || item.form.patient_name?.trim() || hasMeds)
              if (hasContent) {
                count++
              } else {
                localStorage.removeItem(key)
              }
            } catch (err) {}
          }
        } catch (e) {}
      }
      setRxDraftCount(count)
    } catch (e) {
      if (doctorScopeId) {
        try {
          let localCount = 0
          const prefix = `dr_rx_draft_${doctorScopeId}_`
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith(prefix)) {
              const item = JSON.parse(localStorage.getItem(key))
              if (item?.form && !item.activeDraftId) {
                const hasMeds = Array.isArray(item.form.medicines) && item.form.medicines.some(m => (m.medicine_name || '').trim().length > 0)
                const hasContent = !!(item.form.diagnosis?.trim() || item.form.advice?.trim() || item.form.patient_name?.trim() || hasMeds)
                if (hasContent) localCount++
              }
            }
          }
          setRxDraftCount(localCount)
        } catch (err) {}
      }
    }
  }, [isDoctor, doctorScopeId])

  useEffect(() => {
    updateRxDraftCount()

    const handleDraftEvent = (e) => {
      if (typeof e.detail === 'number') {
        setRxDraftCount(e.detail)
      } else {
        updateRxDraftCount()
      }
    }
    window.addEventListener('rx-draft-count-updated', handleDraftEvent)
    return () => window.removeEventListener('rx-draft-count-updated', handleDraftEvent)
  }, [updateRxDraftCount, location.pathname])

  // ─── Shared props for SidebarSection ──────────────────────────────────────
  const sectionProps = { isCollapsed, openSections, onToggle: handleToggleSection }

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
          <NavLink to={portalBase} className="sidebar-brand" onClick={onClose}>
            {isCollapsed ? (
              <div className="sidebar-brand-logo-img">
                <img
                  src="/favicon.png"
                  alt="Doctor Booklet"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            ) : (
              <img
                src="/doctorBookletLogo.png"
                alt="Doctor Booklet"
                className="sidebar-full-logo"
                style={{ height: '40px', maxWidth: '175px', objectFit: 'contain' }}
              />
            )}
          </NavLink>
        </div>


        {/* ===== ZONE 2: Navigation (Scrollable) ===== */}
        <nav className="sidebar-nav">
          {/* Dashboard — visible to all staff */}
          <NavLink
            to={portalBase}
            end
            className={`sidebar-nav-item ${(location.pathname === portalBase || location.pathname === `${portalBase}/` || location.pathname === `${portalBase}/dashboard`) ? 'active' : ''}`}
            onClick={onClose}
            title={isCollapsed ? 'Dashboard' : undefined}
          >
            <span className="nav-icon"><LayoutDashboard size={18} /></span>
            <span className="nav-text">Dashboard</span>
          </NavLink>

          {/* ── GEOGRAPHY ── Admin only */}
          {(isAdmin || hasPermission('division.view') || hasPermission('district.view') || hasPermission('specialty.view')) && (
            <SidebarSection id="geography" label="Geography" routes={['/admin/divisions', '/admin/districts', '/admin/upazilas', '/admin/unions']} {...sectionProps}>
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
            </SidebarSection>
          )}

          {/* ── CONFIGURATION ── Admin only */}
          {(isAdmin || hasPermission('specialty.view') || hasPermission('medicine.view')) && (
            <SidebarSection id="configuration" label="Configuration" routes={['/admin/specialties', '/admin/medicines', '/doctor/medicines', '/hospital/medicines']} {...sectionProps}>
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

              {(isAdmin || hasPermission('medicine.view')) && (
                <NavLink
                  to={pLink('/medicines')}
                  className={`sidebar-nav-item ${isActive(pLink('/medicines')) ? 'active' : ''}`}
                  onClick={onClose}
                  title={isCollapsed ? 'Medicines' : undefined}
                >
                  <span className="nav-icon"><Pill size={18} /></span>
                  <span className="nav-text">Medicines</span>
                </NavLink>
              )}
            </SidebarSection>
          )}

          {/* ── CLINICAL ── Admin, Manager, Doctor */}
          {(isAdmin || isManager || isDoctor || hasPermission('doctor.view') || hasPermission('hospital.view')) && (
            <SidebarSection
              id="clinical"
              label={isDoctor ? 'My Profile' : 'Clinical'}
              routes={[
                '/admin/doctors', '/admin/hospitals', '/admin/chambers', '/admin/doctor-leaves',
                '/doctor/my-profile', '/doctor/chambers', '/doctor/my-leaves', '/doctor/hospital-subscription', '/doctor/hospital-reviews',
                '/hospital/my-hospital', '/hospital/doctors', '/hospital/chambers', '/hospital/doctor-leaves', '/hospital/hospital-subscription', '/hospital/hospital-reviews',
              ]}
              {...sectionProps}
            >
              {/* Doctors */}
              {(isAdmin || isManager || isDoctor || hasPermission('doctor.view')) && (
                <NavLink
                  to={isDoctor ? pLink('/my-profile') : (isManager ? pLink('/doctors') : '/admin/doctors')}
                  className={`sidebar-nav-item ${isActive(isDoctor ? pLink('/my-profile') : (isManager ? pLink('/doctors') : '/admin/doctors')) ? 'active' : ''}`}
                  onClick={onClose}
                  title={isCollapsed ? (isDoctor ? 'My Profile' : 'Doctors') : undefined}
                >
                  <span className="nav-icon"><Stethoscope size={18} /></span>
                  <span className="nav-text">{isDoctor ? 'My Profile' : 'Doctors'}</span>
                </NavLink>
              )}

              {/* Hospitals */}
              {(isAdmin || isManager || hasPermission('hospital.view')) && (
                <NavLink
                  to={isManager ? pLink('/my-hospital') : '/admin/hospitals'}
                  className={`sidebar-nav-item ${isActive(isManager ? pLink('/my-hospital') : '/admin/hospitals') ? 'active' : ''}`}
                  onClick={onClose}
                  title={isCollapsed ? (isManager ? 'My Hospital' : 'Hospitals') : undefined}
                >
                  <span className="nav-icon"><Building2 size={18} /></span>
                  <span className="nav-text">{isManager ? 'My Hospital' : 'Hospitals'}</span>
                </NavLink>
              )}

              {/* Chambers */}
              {(isAdmin || isManager || isDoctor || hasPermission('doctor_chamber.view')) && (
                <NavLink
                  to={pLink('/chambers')}
                  className={`sidebar-nav-item ${isActive(pLink('/chambers')) ? 'active' : ''}`}
                  onClick={onClose}
                  title={isCollapsed ? (isDoctor ? 'My Chambers' : 'Chambers') : undefined}
                >
                  <span className="nav-icon"><BriefcaseMedical size={18} /></span>
                  <span className="nav-text">{isDoctor ? 'My Chambers' : 'Chambers'}</span>
                </NavLink>
              )}

              {/* Doctor Leaves */}
              {isDoctor && (
                <NavLink
                  to={pLink('/my-leaves')}
                  className={`sidebar-nav-item ${isActive(pLink('/my-leaves')) ? 'active' : ''}`}
                  onClick={onClose}
                  title={isCollapsed ? 'My Leaves' : undefined}
                >
                  <span className="nav-icon"><CalendarOff size={18} /></span>
                  <span className="nav-text">My Leaves</span>
                </NavLink>
              )}

              {(isAdmin || isManager || hasPermission('doctor_leave.view')) && !isDoctor && (
                <NavLink
                  to="/admin/doctor-leaves"
                  className={`sidebar-nav-item ${isActive('/admin/doctor-leaves') ? 'active' : ''}`}
                  onClick={onClose}
                  title={isCollapsed ? 'Doctor Leaves' : undefined}
                >
                  <span className="nav-icon"><CalendarOff size={18} /></span>
                  <span className="nav-text">Doctor Leaves</span>
                </NavLink>
              )}

              {/* Manager-only hospital extras */}
              {isManager && (
                <>
                  <NavLink
                    to={pLink('/hospital-subscription')}
                    className={`sidebar-nav-item ${isActive(pLink('/hospital-subscription')) ? 'active' : ''}`}
                    onClick={onClose}
                    title={isCollapsed ? 'Hospital Plan & Seats' : undefined}
                  >
                    <span className="nav-icon"><Zap size={18} /></span>
                    <span className="nav-text">Hospital Plan & Seats</span>
                  </NavLink>

                  <NavLink
                    to={pLink('/subscription/history')}
                    className={`sidebar-nav-item ${isActive(pLink('/subscription/history')) ? 'active' : ''}`}
                    onClick={onClose}
                    title={isCollapsed ? 'Subscription History' : undefined}
                  >
                    <span className="nav-icon"><History size={18} /></span>
                    <span className="nav-text">Subscription History</span>
                  </NavLink>

                  <NavLink
                    to={pLink('/hospital-reviews')}
                    className={`sidebar-nav-item ${isActive(pLink('/hospital-reviews')) ? 'active' : ''}`}
                    onClick={onClose}
                    title={isCollapsed ? 'Hospital Reviews' : undefined}
                  >
                    <span className="nav-icon"><MessageSquare size={18} /></span>
                    <span className="nav-text">Hospital Reviews</span>
                  </NavLink>
                </>
              )}
            </SidebarSection>
          )}

          {/* ── BOOKINGS ── Admin, Manager, Doctor */}
          {(isAdmin || isManager || isDoctor || hasPermission('appointment.view') || hasPermission('patient.view')) && (
            <SidebarSection
              id="bookings"
              label={isDoctor ? 'My Patients' : 'Bookings'}
              routes={[
                '/admin/patients', '/admin/appointments', '/admin/serial-display', '/admin/prescriptions',
                '/doctor/patients', '/doctor/appointments', '/doctor/serial-display', '/doctor/prescriptions', '/doctor/notes', '/doctor/doctor-reviews',
                '/hospital/patients', '/hospital/appointments', '/hospital/serial-display', '/hospital/prescriptions',
              ]}
              {...sectionProps}
            >
              {/* Patients */}
              {(isAdmin || isManager || isDoctor || hasPermission('patient.view')) && (
                <NavLink
                  to={pLink('/patients')}
                  className={`sidebar-nav-item ${isActive(pLink('/patients')) ? 'active' : ''}`}
                  onClick={onClose}
                  title={isCollapsed ? (isDoctor ? 'My Patients' : 'Patients') : undefined}
                >
                  <span className="nav-icon"><Users size={18} /></span>
                  <span className="nav-text">{isDoctor ? 'My Patients' : 'Patients'}</span>
                </NavLink>
              )}

              {/* Appointments + Serial Display */}
              {(isAdmin || isManager || isDoctor || hasPermission('appointment.view')) && (
                <>
                  <NavLink
                    to={pLink('/appointments')}
                    className={`sidebar-nav-item ${isActive(pLink('/appointments')) ? 'active' : ''}`}
                    onClick={onClose}
                    title={isCollapsed ? 'Appointments' : undefined}
                  >
                    <span className="nav-icon"><CalendarCheck size={18} /></span>
                    <span className="nav-text">Appointments</span>
                  </NavLink>

                  <NavLink
                    to={pLink('/serial-display')}
                    className={`sidebar-nav-item ${isActive(pLink('/serial-display')) ? 'active' : ''}`}
                    onClick={onClose}
                    title={isCollapsed ? 'Serial Display' : undefined}
                  >
                    <span className="nav-icon"><Tv size={18} /></span>
                    <span className="nav-text">Serial Display</span>
                  </NavLink>
                </>
              )}

              {/* Prescriptions */}
              {!isManager && (isAdmin || isDoctor || hasPermission('prescription.view')) && (() => {
                const rxPath = pLink('/prescriptions')
                const isDraftActive = location.pathname === rxPath && location.search.includes('tab=draft')
                const isMainPrescriptionActive = (location.pathname === rxPath || location.pathname.startsWith(rxPath + '/')) && !isDraftActive

                return (
                  <>
                    <Link
                      to={rxPath}
                      className={`sidebar-nav-item ${isMainPrescriptionActive ? 'active' : ''}`}
                      onClick={onClose}
                      title={isCollapsed ? 'Prescriptions' : undefined}
                    >
                      <span className="nav-icon"><FileText size={18} /></span>
                      <span className="nav-text">Prescriptions</span>
                    </Link>

                    {isDoctor && (
                      <Link
                        to={`${rxPath}?tab=draft`}
                        className={`sidebar-nav-item ${isDraftActive ? 'active' : ''}`}
                        onClick={onClose}
                        title={isCollapsed ? `Prescription Drafts (${rxDraftCount})` : undefined}
                      >
                        <span className="nav-icon">
                          <Clock size={18} />
                        </span>
                        <span className="nav-text">Rx Drafts (খসড়া)</span>
                        {!isCollapsed && (
                          <span
                            style={{
                              marginLeft: 'auto',
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '1.5px 7px',
                              borderRadius: 10,
                              lineHeight: '14px',
                              background: isDraftActive ? '#ffffff' : '#FEF3C7',
                              color: isDraftActive ? '#00B875' : '#D97706',
                              border: isDraftActive ? 'none' : '1px solid #FDE68A',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {rxDraftCount}
                          </span>
                        )}
                      </Link>
                    )}
                  </>
                )
              })()}

              {/* Doctor-only extras */}
              {isDoctor && (
                <NavLink
                  to={pLink('/notes')}
                  className={`sidebar-nav-item ${isActive(pLink('/notes')) ? 'active' : ''}`}
                  onClick={onClose}
                  title={isCollapsed ? 'My Notes' : undefined}
                >
                  <span className="nav-icon"><ClipboardPlus size={18} /></span>
                  <span className="nav-text">My Notes</span>
                </NavLink>
              )}

              {isDoctor && (
                <NavLink
                  to={pLink('/doctor-reviews')}
                  className={`sidebar-nav-item ${isActive(pLink('/doctor-reviews')) ? 'active' : ''}`}
                  onClick={onClose}
                  title={isCollapsed ? 'Patient Reviews' : undefined}
                >
                  <span className="nav-icon"><MessageSquare size={18} /></span>
                  <span className="nav-text">Patient Reviews</span>
                </NavLink>
              )}
            </SidebarSection>
          )}

          {/* ── FINANCE ── Admin, Manager, Doctor */}
          {(isAdmin || isManager || isDoctor || hasPermission('payment.view') || hasPermission('commission.view')) && (
            <SidebarSection id="finance" label="Finance" routes={['/admin/payments', '/admin/commission', '/admin/reports', '/admin/billing', '/doctor/payments', '/hospital/payments']} {...sectionProps}>
              {/* Payments */}
              {(isAdmin || isManager || isDoctor || hasPermission('payment.view')) && (
                <NavLink
                  to={pLink('/payments')}
                  className={`sidebar-nav-item ${isActive(pLink('/payments')) ? 'active' : ''}`}
                  onClick={onClose}
                  title={isCollapsed ? 'Patient Payments' : undefined}
                >
                  <span className="nav-icon"><CreditCard size={18} /></span>
                  <span className="nav-text">Patient Payments</span>
                </NavLink>
              )}

              {/* Commission & Reports — Admin, Manager, Doctor */}
              {(isAdmin || isManager || isDoctor || hasPermission('commission.view')) && (
                <>
                  {isAdmin && (
                    <NavLink
                      to="/admin/commission"
                      className={`sidebar-nav-item ${isActive('/admin/commission') ? 'active' : ''}`}
                      onClick={onClose}
                      title={isCollapsed ? 'Commission Controls' : undefined}
                    >
                      <span className="nav-icon"><Settings size={18} /></span>
                      <span className="nav-text">Commission Controls</span>
                    </NavLink>
                  )}

                  {isAdmin && (
                    <NavLink
                      to="/admin/reports/commission"
                      className={`sidebar-nav-item ${isActive('/admin/reports/commission') ? 'active' : ''}`}
                      onClick={onClose}
                      title={isCollapsed ? 'Commission Report' : undefined}
                    >
                      <span className="nav-icon"><FileText size={18} /></span>
                      <span className="nav-text">Commission Report</span>
                    </NavLink>
                  )}

                  {isManager && (
                    <NavLink
                      to={pLink('/commission-report')}
                      className={`sidebar-nav-item ${isActive(pLink('/commission-report')) ? 'active' : ''}`}
                      onClick={onClose}
                      title={isCollapsed ? 'Commission & Settlement' : undefined}
                    >
                      <span className="nav-icon"><FileText size={18} /></span>
                      <span className="nav-text">Commission & Settlement</span>
                    </NavLink>
                  )}

                  {isDoctor && (
                    <NavLink
                      to={pLink('/commission-report')}
                      className={`sidebar-nav-item ${isActive(pLink('/commission-report')) ? 'active' : ''}`}
                      onClick={onClose}
                      title={isCollapsed ? 'Earnings & Commission' : undefined}
                    >
                      <span className="nav-icon"><FileText size={18} /></span>
                      <span className="nav-text">Earnings & Commission</span>
                    </NavLink>
                  )}
                </>
              )}

              {/* Enterprise Billing & Subscriber Management — Admin only */}
              {isAdmin && (
                <>
                  <NavLink
                    to="/admin/billing/subscribers"
                    className={`sidebar-nav-item ${isActive('/admin/billing/subscribers') ? 'active' : ''}`}
                    onClick={onClose}
                    title={isCollapsed ? 'Subscriber Management' : undefined}
                  >
                    <span className="nav-icon"><Users size={18} /></span>
                    <span className="nav-text">Subscriber Management</span>
                  </NavLink>

                  <NavLink
                    to="/admin/billing/dashboard"
                    className={`sidebar-nav-item ${isActive('/admin/billing/dashboard') || (isActive('/admin/billing') && !isActive('/admin/billing/subscribers')) ? 'active' : ''}`}
                    onClick={onClose}
                    title={isCollapsed ? 'Enterprise Billing Suite' : undefined}
                  >
                    <span className="nav-icon"><Layers size={18} /></span>
                    <span className="nav-text">Enterprise Billing Suite</span>
                  </NavLink>
                </>
              )}
            </SidebarSection>
          )}

          {/* ── PROMOTION ── Admin + Manager */}
          {(isAdmin || isManager || hasPermission('commission.view')) && (
            <SidebarSection id="promotion" label="Promotion" routes={['/admin/highlights']} {...sectionProps}>
              <NavLink
                to="/admin/highlights"
                className={`sidebar-nav-item ${isActive('/admin/highlights') ? 'active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? 'Highlights' : undefined}
              >
                <span className="nav-icon"><Sparkles size={18} /></span>
                <span className="nav-text">Highlights</span>
              </NavLink>
            </SidebarSection>
          )}

          {/* ── MODERATION ── Admin only */}
          {isAdmin && (
            <SidebarSection id="moderation" label="Moderation" routes={['/admin/reviews']} {...sectionProps}>
              <NavLink
                to="/admin/reviews/moderation"
                className={`sidebar-nav-item ${isActive('/admin/reviews/moderation') ? 'active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? 'Review Moderation' : undefined}
              >
                <span className="nav-icon"><MessageSquare size={18} /></span>
                <span className="nav-text">Review Moderation</span>
              </NavLink>

              <NavLink
                to="/admin/reviews/reports"
                className={`sidebar-nav-item ${isActive('/admin/reviews/reports') ? 'active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? 'Dispute Reports' : undefined}
              >
                <span className="nav-icon"><Shield size={18} /></span>
                <span className="nav-text">Dispute Reports</span>
              </NavLink>
            </SidebarSection>
          )}

          {/* ── SYSTEM ── Admin, Manager, Doctor */}
          {(isAdmin || isManager || isDoctor || hasPermission('user.view') || hasPermission('content.update')) && (
            <SidebarSection id="system" label="System" routes={['/admin/users', '/admin/content', '/admin/services', '/admin/sms-settings', '/admin/audit-logs']} {...sectionProps}>
              {/* Users — Admin only */}
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

              {/* Content CMS & Support Ticket */}
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
                    title={isCollapsed ? 'Support Ticket' : undefined}
                  >
                    <span className="nav-icon"><Ticket size={18} /></span>
                    <span className="nav-text">Support Ticket</span>
                  </NavLink>
                </>
              )}

              {/* SMS Settings — Admin only */}
              {isAdmin && (
                <NavLink
                  to="/admin/sms-settings"
                  className={`sidebar-nav-item ${isActive('/admin/sms-settings') ? 'active' : ''}`}
                  onClick={onClose}
                  title={isCollapsed ? 'SMS & OTP Settings' : undefined}
                >
                  <span className="nav-icon"><MessageSquare size={18} /></span>
                  <span className="nav-text">SMS & OTP Settings</span>
                </NavLink>
              )}

              {/* Audit Log — Admin only */}
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
            </SidebarSection>
          )}

          {/* ── COMMUNICATION ── Admin only */}
          {isAdmin && (
            <SidebarSection id="communication" label="Communication" routes={['/admin/messages']} {...sectionProps}>
              <NavLink
                to="/admin/messages"
                className={`sidebar-nav-item ${isActive('/admin/messages') ? 'active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? 'Notices & Broadcasts' : undefined}
              >
                <span className="nav-icon"><Megaphone size={18} /></span>
                <span className="nav-text">Notices & Broadcasts</span>
              </NavLink>
            </SidebarSection>
          )}

          {/* ── SUBSCRIPTION ── Doctor only */}
          {isDoctor && (
            <SidebarSection id="subscription" label="Subscription" routes={['/doctor/subscription']} {...sectionProps}>
              <NavLink
                to={pLink('/subscription')}
                className={`sidebar-nav-item ${isActive(pLink('/subscription')) && !isActive(pLink('/subscription/history')) ? 'active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? 'Plans' : undefined}
              >
                <span className="nav-icon"><Zap size={18} /></span>
                <span className="nav-text">Plans</span>
              </NavLink>

              <NavLink
                to={pLink('/subscription/history')}
                className={`sidebar-nav-item ${isActive(pLink('/subscription/history')) ? 'active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? 'My Subscriptions' : undefined}
              >
                <span className="nav-icon"><History size={18} /></span>
                <span className="nav-text">My Subscriptions</span>
              </NavLink>
            </SidebarSection>
          )}

        </nav>

      </aside>

    </>
  )
}

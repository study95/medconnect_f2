import React, { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Stethoscope, 
  Building2,
  ClipboardList, 
  Wallet, 
  LogOut, 
  ArrowUpRight, 
  Sparkles, 
  User, 
  ShieldCheck, 
  PhoneCall, 
  ChevronDown,
  Menu,
  X,
  Lock,
  KeyRound,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import agentApi from '../../api/agentApi'
import AgentProfileModal from '../../features/agent/components/AgentProfileModal'
import AgentPasswordModal from '../../features/agent/components/AgentPasswordModal'
import AgentTwoFactorModal from '../../features/agent/components/AgentTwoFactorModal'

export default function AgentLayout() {
  const { user, logout, isAdmin, isSuperAdmin, fetchCurrentUser } = useAuth()
  const isAgentSuspended = !isAdmin && !isSuperAdmin && (user?.agent?.status === 'suspended' || user?.agent?.status === 'inactive')
  const location = useLocation()
  const navigate = useNavigate()
  const [balance, setBalance] = useState(null)
  
  // Profile, Password, 2FA & Dropdown States
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Fetch live wallet balance
  useEffect(() => {
    let isMounted = true
    agentApi.getWalletStatement({ per_page: 1 })
      .then((res) => {
        if (isMounted && res.data?.summary?.available_balance !== undefined) {
          setBalance(res.data.summary.available_balance)
        }
      })
      .catch(() => {})

    return () => { isMounted = false }
  }, [location.pathname])

  // Handle outside click & escape to close user dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false)
      }
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setUserDropdownOpen(false)
      }
    }

    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [userDropdownOpen])

  const agentCode = user?.agent?.public_id || user?.agent?.agent_code || user?.public_id || user?.agent_code || 'AGT-PARTNER'
  const agentPhone = user?.agent?.phone || user?.phone || ''

  const navLinks = [
    { to: '/agent', label: 'Overview', icon: LayoutDashboard, exact: true },
    { to: '/agent/onboard/doctor', label: 'Onboard Doctor', icon: Stethoscope },
    { to: '/agent/onboard/hospital', label: 'Onboard Hospital', icon: Building2 },
    { to: '/agent/tracker', label: 'Submissions', icon: ClipboardList },
    { to: '/agent/wallet', label: 'Wallet', icon: Wallet },
  ]

  const isLinkActive = (item) => {
    if (item.exact) {
      return location.pathname === item.to || location.pathname === `${item.to}/` || location.pathname === '/agent/dashboard'
    }
    return location.pathname.startsWith(item.to)
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login/agent', { replace: true })
    } catch (err) {
      navigate('/login/agent', { replace: true })
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top Enterprise Header ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
      }}>
        <div style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '0 20px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16
        }}>
          {/* Left: Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link to="/agent" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <img 
                src="/doctorBookletLogo.png" 
                alt="Doctor Booklet" 
                style={{ height: 38, width: 'auto', objectFit: 'contain' }}
              />
            </Link>
          </div>

          {/* Center: Desktop Navigation Bar */}
          <nav className="d-none d-lg-flex align-items-center gap-1" style={{
            background: '#F1F5F9',
            padding: '3px 4px',
            borderRadius: 10,
            border: '1px solid #E2E8F0',
            flexShrink: 0
          }}>
            {navLinks.map((item) => {
              const active = isLinkActive(item)
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    color: active ? '#065F46' : '#475569',
                    background: active ? '#FFFFFF' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  <Icon size={14} color={active ? '#059669' : '#64748B'} />
                  <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right: Balance Pill, Agent ID Dropdown Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {/* Live Wallet Pill */}
            <Link
              to="/agent/wallet"
              title="Click to view statement and withdraw"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '5px 12px',
                borderRadius: 20,
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#10B981',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Wallet size={11} />
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
                  Balance
                </span>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#065F46' }}>
                  ৳{balance !== null ? parseFloat(balance).toFixed(2) : '0.00'}
                </span>
              </div>
            </Link>

            {/* Admin Desk Shortcut (if admin) */}
            {(isAdmin || isSuperAdmin) && (
              <Link
                to="/admin/dashboard"
                className="d-none d-xl-inline-flex align-items-center gap-1"
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#0284C7',
                  background: 'rgba(2, 132, 199, 0.08)',
                  border: '1px solid rgba(2, 132, 199, 0.2)',
                  textDecoration: 'none'
                }}
              >
                <span>Admin</span>
                <ArrowUpRight size={13} />
              </Link>
            )}

            {/* Agent Identity & Profile Dropdown Container */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 10px 4px 6px',
                  borderRadius: 20,
                  background: userDropdownOpen ? '#F1F5F9' : '#F8FAFC',
                  border: userDropdownOpen ? '1px solid #059669' : '1px solid #E2E8F0',
                  boxShadow: userDropdownOpen ? '0 0 0 3px rgba(5, 150, 105, 0.12)' : 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  outline: 'none'
                }}
                title="Account Settings & Profile"
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #065F46 0%, #0D9488 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  boxShadow: '0 2px 4px rgba(6, 95, 70, 0.2)'
                }}>
                  {user?.photo ? (
                    <img src={user.photo} alt={user?.name || 'Agent'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'A'}</span>
                  )}
                </div>

                <div className="d-none d-sm-block" style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', maxWidth: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.name || 'Field Agent'}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>
                    {agentCode}
                  </div>
                </div>

                <ChevronDown
                  size={14}
                  color={userDropdownOpen ? '#059669' : '#64748B'}
                  style={{
                    transition: 'transform 0.2s ease',
                    transform: userDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                />
              </button>

              {/* Floating Dropdown Card */}
              {userDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 270,
                  background: '#FFFFFF',
                  borderRadius: 16,
                  boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.16), 0 2px 8px rgba(15, 23, 42, 0.04)',
                  border: '1px solid #E2E8F0',
                  padding: '8px 0',
                  zIndex: 1000,
                  animation: 'userDropdownFadeIn 0.15s ease-out',
                  fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                }}>
                  {/* Dropdown Header with Agent Identity */}
                  <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #065F46 0%, #0D9488 100%)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 15,
                        fontWeight: 800,
                        flexShrink: 0
                      }}>
                        {user?.photo ? (
                          <img src={user.photo} alt={user?.name || 'Agent'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'A'}</span>
                        )}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user?.name || 'Field Agent'}
                        </div>
                        {agentPhone && (
                          <div style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                            <PhoneCall size={10} />
                            <span>{agentPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{
                      marginTop: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#F8FAFC',
                      padding: '5px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      border: '1px solid #F1F5F9'
                    }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#065F46' }}>{agentCode}</span>
                      <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <ShieldCheck size={12} /> Verified
                      </span>
                    </div>
                  </div>

                  {/* Menu Options */}
                  <div style={{ padding: '6px 8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false)
                        setProfileModalOpen(true)
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 12px',
                        borderRadius: 10,
                        border: 'none',
                        background: 'transparent',
                        color: '#334155',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <User size={16} color="#059669" />
                      <span>প্রোফাইল আপডেট</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false)
                        setPasswordModalOpen(true)
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 12px',
                        borderRadius: 10,
                        border: 'none',
                        background: 'transparent',
                        color: '#334155',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <Lock size={16} color="#0284C7" />
                      <span>পাসওয়ার্ড পরিবর্তন</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false)
                        setTwoFactorModalOpen(true)
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderRadius: 10,
                        border: 'none',
                        background: 'transparent',
                        color: '#334155',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ShieldCheck size={16} color="#059669" />
                        <span>২-ধাপ নিরাপত্তা (2FA)</span>
                      </div>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 6,
                        background: user?.google2fa_enabled ? 'rgba(16, 185, 129, 0.12)' : '#F1F5F9',
                        color: user?.google2fa_enabled ? '#059669' : '#64748B'
                      }}>
                        {user?.google2fa_enabled ? 'সক্রিয়' : 'সেটআপ'}
                      </span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />

                  {/* Logout Button */}
                  <div style={{ padding: '4px 8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false)
                        handleLogout()
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 12px',
                        borderRadius: 10,
                        border: 'none',
                        background: 'transparent',
                        color: '#DC2626',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF2F2' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <LogOut size={16} color="#DC2626" />
                      <span>লগআউট (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Routed Page Content ── */}
      <main style={{ flex: 1, paddingBottom: 72 }}>
        {isAgentSuspended && (
          <div style={{
            background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%)',
            borderBottom: '1.5px solid #FECDD3',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            color: '#B91C1C',
            fontSize: 13,
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.06)'
          }}>
            <ShieldAlert size={18} style={{ flexShrink: 0, color: '#DC2626' }} />
            <span>সতর্কবার্তা: আপনার ফিল্ড এজেন্ট অ্যাকাউন্টটি বর্তমানে সাময়িকভাবে স্থগিত (Suspended) রয়েছে। নতুন কোনো অনবোর্ডিং বা কমিশন উত্তোলন করা যাবে না।</span>
            <Link
              to="/support"
              style={{
                marginLeft: 8,
                padding: '3px 10px',
                borderRadius: 6,
                background: '#DC2626',
                color: '#FFFFFF',
                fontSize: 11.5,
                fontWeight: 800,
                textDecoration: 'none'
              }}
            >
              যোগাযোগ করুন
            </Link>
          </div>
        )}
        <Outlet />
      </main>

      {/* ── Mobile Field Force Bottom Navigation Bar (Thumb Friendly) ── */}
      <nav 
        className="d-lg-none"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 62,
          background: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 1000,
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.06)',
          padding: '0 8px'
        }}
      >
        {navLinks.map((item) => {
          const active = isLinkActive(item)
          const Icon = item.icon
          const isOnboard = item.to.includes('onboard')

          if (isOnboard) {
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  marginTop: -20
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #065F46 0%, #10B981 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 14px rgba(6, 95, 70, 0.35)',
                  border: '3px solid #FFFFFF'
                }}>
                  <Stethoscope size={22} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#065F46', marginTop: 2 }}>
                  + Onboard
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.to}
              to={item.to}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                textDecoration: 'none',
                color: active ? '#065F46' : '#94A3B8',
                padding: '6px 12px',
                borderRadius: 8,
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={19} color={active ? '#065F46' : '#94A3B8'} />
              <span style={{ fontSize: 10, fontWeight: active ? 800 : 600 }}>
                {item.label.replace('+ ', '')}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* ── Profile, Password & 2FA Modals ── */}
      <AgentProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
      <AgentPasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
      <AgentTwoFactorModal
        isOpen={twoFactorModalOpen}
        onClose={() => setTwoFactorModalOpen(false)}
        onStatusChange={() => {
          if (typeof fetchCurrentUser === 'function') {
            fetchCurrentUser(true)
          }
        }}
      />

      <style>{`
        @keyframes userDropdownFadeIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Navbar, Nav, NavDropdown, Container, Button } from 'react-bootstrap'
import { useAuth } from '../../context/AuthContext'
import { getColor, getInitials } from '../../utils/avatar'
import { LayoutGrid, User, LogOut, Calendar, Phone, Mail, ChevronDown, ChevronUp, ExternalLink, CalendarClock, LogIn, UserPlus, Stethoscope, Building2 } from 'lucide-react'
import { getContent } from '../../utils/contentService'

function AppNavbar() {
  const { user, isLoggedIn, isStaff, isAdmin, isDoctor, isManager, isPatient, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const cms = getContent()
  const [showTopbar, setShowTopbar] = useState(true)
  const isAuthPage = ['/login', '/register'].includes(location.pathname)

  useEffect(() => {
    const handleScroll = () => {
      // Background scroll effect
      const isScrolled = window.scrollY > 20
      setScrolled(prev => prev !== isScrolled ? isScrolled : prev)

      // Calculate scroll progress percentage
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolledPct = height > 0 ? (winScroll / height) * 100 : 0;
      
      document.querySelectorAll('.scroll-progress-bar').forEach(el => {
        el.style.width = `${scrolledPct}%`;
      });
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const closeMenu = () => setExpanded(false)

  const handleLogout = () => {
    closeMenu()
    logout()
    navigate('/')
  }

  const getUserTypeLabel = () => {
    if (isAdmin) return 'অ্যাডমিনিস্ট্রেটর'
    if (isDoctor) return 'ডাক্তার'
    if (isManager) return 'হাসপাতাল ম্যানেজার'
    if (isPatient) return 'রোগী'
    return 'ব্যবহারকারী'
  }

  const getAdminLinkLabel = () => {
    if (isAdmin) return 'অ্যাডমিন প্যানেল'
    if (isDoctor) return 'ডাক্তার প্যানেল'
    if (isManager) return 'হাসপাতাল প্যানেল'
    return 'ম্যানেজমেন্ট প্যানেল'
  }

  const NAV_LINKS = [
    { label: 'হোম', path: '/' },
    { label: 'ডাক্তার', path: '/doctors' },
    { label: 'হাসপাতাল', path: '/hospitals' },
    { label: 'সেবা সমূহ', path: '/services' },
    { label: 'যোগাযোগ', path: '/contact' },
  ]

  const navbarStyle = {
    background: scrolled
      ? 'rgba(255, 255, 255, 0.97)'
      : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderBottom: scrolled ? '1px solid #E5EAF2' : '1px solid rgba(0,168,140,0.08)',
    height: scrolled ? '72px' : '82px',
    transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
    boxShadow: scrolled ? '0 8px 30px rgba(0,0,0,0.08)' : 'none',
  }

  return (
    <>
      <style>{`
        :root {
          --header-height: ${showTopbar ? (scrolled ? '112px' : '122px') : (scrolled ? '72px' : '82px')};
        }
        .page-wrapper {
          padding-top: var(--header-height) !important;
          transition: padding-top 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (max-width: 991px) {
          :root {
            --header-height: 66px;
          }
          .page-wrapper {
            padding-top: var(--header-height) !important;
          }
        }
        .navbar-nav .dropdown-toggle::after { display: none !important; }
        .premium-link { position: relative; }
        .premium-link::after {
          content: ''; position: absolute; bottom: 4px; left: 50%; width: 0; height: 2px;
          background: #00A88C; transition: 0.3s; transform: translateX(-50%); border-radius: 2px;
        }
        .premium-link:hover::after, .premium-link.active-link::after { width: 60%; }
        
        /* Scroll Progress Bar - Moved to bottom of header */
        .scroll-progress-container {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: rgba(0, 212, 175, 0.05);
          z-index: 10001;
        }
        .scroll-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #00D4AF, #00A88C, #00D4AF);
          width: 0%;
          transition: width 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 12px rgba(0, 212, 175, 0.6);
        }

        /* Dynamic Support Badge - Professional Look */
        .support-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 100px;
          background: rgba(0, 168, 140, 0.04);
          border: 1.5px solid rgba(0, 168, 140, 0.1);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          text-decoration: none !important;
          position: relative;
          overflow: hidden;
        }
        .support-badge:hover {
          background: rgba(0, 168, 140, 0.08);
          border-color: #00A88C;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 168, 140, 0.1);
        }
        .support-badge::before {
          content: '';
          position: absolute;
          width: 8px;
          height: 8px;
          background: #00D4AF;
          border-radius: 50%;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          animation: support-pulse-dot 2s infinite;
          display: none; /* Only if we want a dot */
        }
        .support-icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .support-icon-wrapper::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 1px solid #00D4AF;
          animation: support-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes support-ping {
          0% { transform: scale(1); opacity: 0.8; }
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
        .support-text {
          font-size: 13px;
          font-weight: 800;
          color: #00A88C;
          font-family: 'Hind Siliguri', sans-serif;
        }
        
        .vibrant-btn {
          background: linear-gradient(135deg, #00D4AF 0%, #00A88C 100%) !important;
          border: none !important;
          box-shadow: 0 6px 18px rgba(0, 168, 140, 0.3) !important;
          transition: all 0.3s ease !important;
        }
        .vibrant-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 168, 140, 0.4) !important;
          filter: brightness(1.1);
        }
        
        .mobile-appointment-btn {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(0, 212, 175, 0.12) 0%, rgba(0, 168, 140, 0.06) 100%);
          border: 1.5px solid #00A88C;
          color: #007A67;
          font-size: 13px;
          font-weight: 800;
          padding: 7px 15px;
          border-radius: 50px;
          text-decoration: none !important;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: none !important;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
          font-family: 'Hind Siliguri', sans-serif;
        }
        .mobile-appointment-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.7) 50%,
            transparent 100%
          );
          transform: skewX(-25deg);
          animation: light-focus-sweep 2.8s infinite ease-in-out;
          pointer-events: none;
        }
        @keyframes light-focus-sweep {
          0% {
            left: -100%;
          }
          60%, 100% {
            left: 200%;
          }
        }
        .mobile-appointment-btn:active {
          transform: scale(0.95);
        }

        .dropdown-menu {
          border: 1px solid var(--mc-border) !important;
          border-radius: 20px !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.12) !important;
          background: white !important;
          overflow: hidden !important;
          min-width: 240px !important;
          padding: 0 !important;
          animation: slideUp 0.25s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .dropdown-item {
          padding: 12px 20px !important;
          font-weight: 700 !important;
          font-size: 14px !important;
          color: var(--mc-text) !important;
          transition: 0.2s !important;
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          font-family: 'Hind Siliguri', sans-serif !important;
        }
        .dropdown-item:hover {
          background: var(--mc-primary-light) !important;
          color: var(--mc-primary) !important;
          padding-left: 26px !important;
        }

        @media (max-width: 991px) {
          .navbar-collapse { display: none !important; }
          .mobile-drawer {
            position: fixed; top: 0; right: 0; width: 310px; height: 100vh;
            background: white; z-index: 2000;
            transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
            padding: 36px 24px; display: flex; flex-direction: column;
            box-shadow: -20px 0 60px rgba(0,0,0,0.12); border-left: 1px solid #E5EAF2;
          }
          .mobile-drawer.open { transform: translateX(0); }
          .drawer-backdrop {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.45); backdrop-filter: blur(4px);
            z-index: 1999; opacity: 0; visibility: hidden; transition: all 0.4s ease;
          }
          .drawer-backdrop.show { opacity: 1; visibility: visible; }
        }
        .topbar-link { color: rgba(255,255,255,0.9); text-decoration: none; font-size: 12px; font-weight: 700; transition: 0.2s; }
        .topbar-link:hover { color: white; }
        .topbar-pill-btn {
          background: rgba(255, 255, 255, 0.12);
          color: #FFFFFF;
          padding: 4px 14px;
          border-radius: 99px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'Hind Siliguri', sans-serif;
          backdrop-filter: blur(8px);
        }
        .topbar-pill-btn:hover {
          background: rgba(255, 255, 255, 0.22);
          border-color: rgba(255, 255, 255, 0.35);
          color: #FFFFFF;
          transform: translateY(-1px);
        }
        .topbar-cta-btn {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          color: #FFFFFF;
          padding: 4px 16px;
          border-radius: 99px;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'Hind Siliguri', sans-serif;
          border: 1px solid rgba(255, 255, 255, 0.25);
        }
        .topbar-cta-btn:hover {
          color: #FFFFFF;
          box-shadow: 0 6px 18px rgba(16, 185, 129, 0.5);
          transform: translateY(-1px);
          filter: brightness(1.08);
        }
      `}</style>

      <header className={`fixed-top ${isAuthPage ? 'd-lg-none' : ''}`} style={{ zIndex: 1050, top: 0, position: 'fixed', left: 0, right: 0 }}>
        {/* Toggle Handle for Desktop Top Bar */}
        <div className="d-none d-lg-block" style={{
          position: 'absolute',
          top: showTopbar ? '37px' : '0px',
          right: '24px',
          zIndex: 1060,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <button 
            onClick={() => setShowTopbar(!showTopbar)}
            style={{
              background: '#044E3B',
              color: 'white',
              border: 'none',
              borderRadius: '0 0 4px 4px',
              padding: '2px 8px',
              height: 22,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(4, 78, 59, 0.2)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#065F46' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#044E3B' }}
            title={showTopbar ? 'Hide top bar' : 'Show top bar'}
          >
            {showTopbar ? <ChevronUp size={16} strokeWidth={2.5} /> : <ChevronDown size={16} strokeWidth={2.5} />}
          </button>
        </div>

        {/* MOBILE TOP BAR (Home Page) */}
        <div className="d-lg-none" style={{
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(15px)',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          padding: '12px 0',
        }}>
          {/* Scroll Progress Bar at Bottom of Mobile Header */}
          <div className="scroll-progress-container">
            <div className="scroll-progress-bar" style={{ width: '0%' }}></div>
          </div>

          <Container className="d-flex justify-content-between align-items-center">
            {/* LOGO */}
            <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
              <img 
                src="/doctorBookletLogo.png" 
                alt="Doctor Booklet Logo" 
                style={{ 
                  height: '38px', 
                  width: 'auto', 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 6px rgba(0, 168, 140, 0.2))'
                }} 
              />
              <span style={{ fontSize: 19, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>
                Doctor <span style={{ color: '#00A88C' }}>Booklet</span>
              </span>
            </Link>

            <div className="d-flex align-items-center" style={{ marginRight: '8px' }}>
              {location.pathname === '/doctors' ? (
                !isLoggedIn ? (
                  <Link 
                    to="/login" 
                    style={{ 
                      background: 'linear-gradient(135deg, #00A88C 0%, #008a74 100%)',
                      border: 'none',
                      color: 'white', 
                      fontSize: '13px', 
                      fontWeight: '800', 
                      padding: '8px 18px', 
                      borderRadius: '10px', 
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      boxShadow: '0 4px 10px rgba(0, 168, 140, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>লগইন</span>
                  </Link>
                ) : (
                  <Link to="/profile" style={{
                    width: 36, height: 36, background: 'linear-gradient(135deg, #00D4AF, #00A88C)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 800, fontSize: 13, textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(0,168,140,0.2)'
                  }}>
                    {getInitials(user?.name)}
                  </Link>
                )
              ) : (
                <Link 
                  to="/doctors" 
                  className="mobile-appointment-btn"
                >
                  <CalendarClock size={16} strokeWidth={2.5} color="#00A88C" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,168,140,0.3))' }} />
                  <span>অ্যাপয়েন্টমেন্ট</span>
                </Link>
              )}
            </div>
          </Container>
        </div>

        {/* DESKTOP TOP BAR */}
        <div className="d-none d-lg-block" style={{
          background: 'linear-gradient(90deg, #044E3B 0%, #0F766E 100%)',
          color: 'white', fontSize: '12px', fontWeight: '700',
          maxHeight: showTopbar ? '40px' : '0px',
          padding: showTopbar ? '7px 0' : '0px',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderBottom: showTopbar ? '1px solid rgba(255,255,255,0.1)' : 'none',
        }}>
          <Container className="d-flex justify-content-between align-items-center">
            <div className="d-flex gap-3 align-items-center">
              <a href={`tel:${cms.site?.phone || '01700000000'}`} className="topbar-link d-flex align-items-center gap-1.5" style={{ textDecoration: 'none' }}>
                <Phone size={13} strokeWidth={2.5} />
                <span>{cms.site?.phone || '017 XXXX XXXX'}</span>
              </a>
              <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.25)' }} />
              <a href={`mailto:${cms.site?.email || 'info@doctorbooklet.com.bd'}`} className="topbar-link d-flex align-items-center gap-1.5" style={{ textDecoration: 'none' }}>
                <Mail size={13} strokeWidth={2.5} />
                <span>{cms.site?.email || 'info@doctorbooklet.com.bd'}</span>
              </a>
            </div>

            <div className="d-flex gap-2.5 align-items-center">
              <Link to="/register-doctor" className="topbar-pill-btn d-none d-lg-flex align-items-center gap-2">
                <Stethoscope size={14} strokeWidth={2.2} style={{ color: '#6EE7B7' }} />
                <span>আপনি কি ডাক্তার?</span>
              </Link>

              <Link to="/register-hospital" className="topbar-pill-btn d-none d-lg-flex align-items-center gap-2">
                <Building2 size={14} strokeWidth={2.2} style={{ color: '#6EE7B7' }} />
                <span>আপনার কি হাসপাতাল আছে?</span>
              </Link>

              <Link to="/doctors" className="topbar-cta-btn d-flex align-items-center gap-2">
                <CalendarClock size={14} strokeWidth={2.5} />
                <span>নতুন অ্যাপয়েন্টমেন্ট</span>
              </Link>
            </div>
          </Container>
        </div>

        {/* DRAWER BACKDROP */}
        <div className={`drawer-backdrop ${expanded ? 'show' : ''} d-lg-none`} onClick={closeMenu} style={{ zIndex: 1999 }} />

        {/* MOBILE DRAWER */}
        <div className={`mobile-drawer ${expanded ? 'open' : ''} d-lg-none`} style={{ zIndex: 2000 }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img 
                src="/doctorBookletLogo.png" 
                alt="Doctor Booklet Logo" 
                style={{ 
                  height: '34px', 
                  width: 'auto', 
                  objectFit: 'contain'
                }} 
              />
              <span style={{ fontWeight: 900, fontSize: 17, color: '#0F172A' }}>Doctor <span style={{ color: '#00A88C' }}>Booklet</span></span>
            </div>
            <button onClick={closeMenu} style={{ background: 'none', border: 'none', color: '#64748B', padding: 4 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <Nav className="flex-column gap-1">
            {NAV_LINKS.map(item => (
              <Nav.Link
                key={item.path}
                as={Link}
                to={item.path}
                onClick={closeMenu}
                style={{
                  color: location.pathname === item.path ? '#00A88C' : '#0F172A',
                  background: location.pathname === item.path ? '#F0FDF4' : 'transparent',
                  fontWeight: 700, fontSize: 15, padding: '12px 16px', borderRadius: 12,
                }}
              >
                {item.label}
              </Nav.Link>
            ))}
            <div style={{ height: 1, background: '#F1F5F9', margin: '12px 0' }} />
            <Nav.Link as={Link} to="/register-doctor" onClick={closeMenu} style={{ fontWeight: 700, fontSize: 14, padding: '12px 16px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Stethoscope size={18} color="#00A88C" /> <span>আপনি কি ডাক্তার?</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/register-hospital" onClick={closeMenu} style={{ fontWeight: 700, fontSize: 14, padding: '12px 16px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Building2 size={18} color="#00A88C" /> <span>আপনার কি হাসপাতাল আছে?</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/doctors" onClick={closeMenu} style={{ fontWeight: 800, fontSize: 14, padding: '12px 16px', color: '#00A88C', display: 'flex', alignItems: 'center', gap: 10 }}>
              <CalendarClock size={18} color="#00A88C" /> <span>নতুন অ্যাপয়েন্টমেন্ট</span>
            </Nav.Link>
          </Nav>

          <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1px dashed #E5EAF2' }}>
            {isLoggedIn ? (
              <div>
                <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '14px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, background: getColor(user?.name), borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                    {getInitials(user?.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>{user?.name}</div>
                    <div style={{ fontSize: 11, color: '#00A88C', fontWeight: 700 }}>{getUserTypeLabel()}</div>
                  </div>
                </div>
                <Nav.Link as={Link} to="/profile" onClick={closeMenu} style={{ color: '#0F172A', fontWeight: 700, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderRadius: 10 }}>
                  <User size={16} /> প্রোফাইল
                </Nav.Link>
                <Nav.Link as={Link} to="/profile?tab=favorites" onClick={closeMenu} style={{ color: '#0F172A', fontWeight: 700, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderRadius: 10 }}>
                  ❤️ পছন্দের তালিকা
                </Nav.Link>
                <Nav.Link as={Link} to="/my-appointments" onClick={closeMenu} style={{ color: '#0F172A', fontWeight: 700, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderRadius: 10 }}>
                  <Calendar size={16} /> আমার অ্যাপয়েন্টমেন্ট
                </Nav.Link>
                {isStaff && (
                  <Nav.Link as={Link} to="/admin" onClick={closeMenu} style={{ color: '#00A88C', fontWeight: 800, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderRadius: 10 }}>
                    <LayoutGrid size={16} /> {getAdminLinkLabel()}
                  </Nav.Link>
                )}
                <Button variant="link" onClick={handleLogout} className="w-100 text-start text-danger text-decoration-none d-flex align-items-center gap-2 px-3 py-2 fw-bold">
                  <LogOut size={16} /> সাইন আউট
                </Button>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #00D4AF 0%, #00A88C 100%)',
                borderRadius: '14px',
                padding: '4px',
                boxShadow: '0 4px 16px rgba(0, 168, 140, 0.25)',
                width: '100%'
              }}>
                <Link 
                  to="/login" 
                  onClick={closeMenu} 
                  style={{ 
                    flex: 1,
                    color: 'white',
                    borderRadius: '10px', 
                    padding: '11px', 
                    fontWeight: 800, 
                    fontSize: 14,
                    textAlign: 'center',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: '0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <LogIn size={16} /> লগইন
                </Link>

                <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.35)' }} />

                <Link 
                  to="/register" 
                  onClick={closeMenu} 
                  style={{ 
                    flex: 1,
                    color: 'white',
                    borderRadius: '10px', 
                    padding: '11px', 
                    fontWeight: 800, 
                    fontSize: 14,
                    textAlign: 'center',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: '0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <UserPlus size={16} /> রেজিস্টার
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* MAIN NAVBAR (Desktop) */}
        <Navbar
          expand="lg"
          style={{ ...navbarStyle, position: 'relative' }}
          className="d-none d-lg-block"
          expanded={expanded}
          onToggle={(v) => setExpanded(v)}
        >
          {/* Scroll Progress Bar for Desktop Header */}
          <div className="scroll-progress-container">
            <div className="scroll-progress-bar" style={{ width: '0%' }}></div>
          </div>

          <Container>
            {/* LOGO */}
            <Navbar.Brand as={Link} to="/" onClick={closeMenu} className="d-flex align-items-center gap-2">
              <img 
                src="/doctorBookletLogo.png" 
                alt="Doctor Booklet Logo" 
                style={{ 
                  height: '44px', 
                  width: 'auto', 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 8px rgba(0, 168, 140, 0.2))'
                }} 
              />
              <div>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.8px', lineHeight: 1 }}>
                  Doctor <span style={{ color: '#00A88C' }}>Booklet</span>
                </span>
              </div>
            </Navbar.Brand>

            {/* DESKTOP NAV */}
            <Navbar.Collapse id="main-navbar-nav">
              <Nav className="mx-auto gap-1">
                {NAV_LINKS.map(item => (
                  <Nav.Link
                    key={item.path}
                    as={Link}
                    to={item.path}
                    className="premium-link"
                    style={{
                      fontSize: 14, fontWeight: 700, padding: '10px 16px', borderRadius: 10,
                      color: location.pathname === item.path ? '#00A88C' : '#334155',
                      background: location.pathname === item.path ? '#F0FDF4' : 'transparent',
                      transition: '0.2s',
                    }}
                  >
                    {item.label}
                  </Nav.Link>
                ))}
              </Nav>

              {/* RIGHT NAV */}
              <Nav className="align-items-center gap-2">
                {/* Phone CTA */}


                {isLoggedIn ? (
                  <NavDropdown
                    align="end"
                    title={
                      <div style={{
                        background: 'white', padding: '6px 16px 6px 6px', borderRadius: 50,
                        border: '1.5px solid #E5EAF2', display: 'flex', alignItems: 'center', gap: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: '0.2s',
                      }}>
                        <div style={{
                          width: 32, height: 32, background: getColor(user?.name),
                          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 800, fontSize: 13,
                        }}>
                          {getInitials(user?.name)}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#334155' }}>অ্যাকাউন্ট</span>
                      </div>
                    }
                    id="user-dropdown"
                  >
                    <div style={{ padding: '20px', background: 'linear-gradient(135deg, #1A1D2E 0%, #0F172A 100%)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 48, height: 48, background: getColor(user?.name), borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                          {getInitials(user?.name)}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'white' }}>{user?.name}</p>
                          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#00A88C' }}>{getUserTypeLabel()}</p>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '8px' }}>
                      <NavDropdown.Item as={Link} to="/profile" className="rounded-3 mb-1">
                        <User size={15} /> প্রোফাইল
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/profile?tab=favorites" className="rounded-3 mb-1">
                        <span style={{ fontSize: 14 }}>❤️</span> পছন্দের তালিকা
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/my-appointments" className="rounded-3 mb-1">
                        <Calendar size={15} /> আমার অ্যাপয়েন্টমেন্ট
                      </NavDropdown.Item>
                      {isStaff && (
                        <NavDropdown.Item as={Link} to="/admin" className="rounded-3 mb-1" style={{ color: '#00A88C !important' }}>
                          <LayoutGrid size={15} /> {getAdminLinkLabel()}
                        </NavDropdown.Item>
                      )}
                      <div style={{ height: 1, background: '#E5EAF2', margin: '6px 0' }} />
                      <NavDropdown.Item onClick={handleLogout} className="text-danger rounded-3">
                        <LogOut size={15} /> সাইন আউট
                      </NavDropdown.Item>
                    </div>
                  </NavDropdown>
                ) : (
                  /* ONE BUTTON — TWO PARTS (LOGIN | REGISTER) WITHOUT DROPDOWN */
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #00D4AF 0%, #00A88C 100%)',
                    borderRadius: '12px',
                    padding: '3px',
                    boxShadow: '0 4px 16px rgba(0, 168, 140, 0.28)',
                    fontFamily: "'Hind Siliguri', sans-serif"
                  }}>
                    {/* Part 1: Login */}
                    <Link
                      to="/login"
                      onClick={closeMenu}
                      style={{
                        color: 'white',
                        textDecoration: 'none',
                        fontWeight: 800,
                        fontSize: '13px',
                        padding: '7px 16px',
                        borderRadius: '9px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        background: 'transparent'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogIn size={15} strokeWidth={2.5} />
                      <span>লগইন</span>
                    </Link>

                    {/* Divider */}
                    <div style={{ width: '1px', height: '16px', background: 'rgba(255, 255, 255, 0.35)', margin: '0 1px' }} />

                    {/* Part 2: Register */}
                    <Link
                      to="/register"
                      onClick={closeMenu}
                      style={{
                        color: 'white',
                        textDecoration: 'none',
                        fontWeight: 800,
                        fontSize: '13px',
                        padding: '7px 16px',
                        borderRadius: '9px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.25s ease',
                        background: 'transparent'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <UserPlus size={15} strokeWidth={2.5} />
                      <span>রেজিস্টার</span>
                    </Link>
                  </div>
                )}
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </header>
    </>
  )
}

export default AppNavbar

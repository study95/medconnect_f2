import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Navbar, Nav, NavDropdown, Container, Button } from 'react-bootstrap'
import { useAuth } from '../../context/AuthContext'
import { getColor, getInitials } from '../../utils/avatar'
import { 
  LayoutGrid, User, LogOut, Calendar, Phone, Mail, ChevronDown, ChevronUp, 
  CalendarCheck, LogIn, UserPlus, Stethoscope, Building2, 
  ShieldCheck, FileText, HelpCircle, Home, Menu, X 
} from 'lucide-react'
import NotificationDropdown from './NotificationDropdown'
import { getContent } from '../../utils/contentService'

function AppNavbar() {
  const { user, isLoggedIn, isStaff, isAdmin, isDoctor, isManager, isPatient, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const cms = getContent()
  const isAuthPage = ['/login', '/register'].includes(location.pathname)

  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [expanded])

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20
      setScrolled(prev => prev !== isScrolled ? isScrolled : prev)

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
    { label: 'হোম', path: '/', isHome: true },
    { label: 'ডাক্তার', path: '/doctors' },
    { label: 'হাসপাতাল', path: '/hospitals' },
    { label: 'সেবা সমূহ', path: '/services' },
    { label: 'যোগাযোগ', path: '/contact' },
  ]

  return (
    <>
      <style>{`
        :root {
          --header-height: ${scrolled ? '110px' : '116px'};
        }
        .page-wrapper {
          padding-top: var(--header-height) !important;
          transition: padding-top 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (max-width: 991px) {
          :root {
            --header-height: 68px;
          }
          .page-wrapper {
            padding-top: var(--header-height) !important;
          }
        }

        .db-topbar {
          background-color: #00B875;
          color: #ffffff;
          font-size: 13px;
          font-weight: 500;
          height: 40px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
        }

        .db-topbar-link {
          color: #ffffff;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          transition: opacity 0.2s ease;
        }
        .db-topbar-link:hover {
          color: #ffffff;
          opacity: 0.85;
        }

        .db-topbar-auth-btn {
          background-color: rgba(255, 255, 255, 0.2);
          color: #ffffff;
          padding: 4px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: background-color 0.2s ease;
        }
        .db-topbar-auth-btn:hover {
          background-color: rgba(255, 255, 255, 0.3);
          color: #ffffff;
        }

        /* MAIN NAVBAR */
        .db-main-header {
          background: #ffffff;
          box-shadow: ${scrolled ? '0 4px 20px rgba(0,0,0,0.06)' : '0 1px 4px rgba(0,0,0,0.03)'};
          border-bottom: 1px solid #eef2f6;
          height: ${scrolled ? '70px' : '76px'};
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
        }

        .db-nav-item {
          color: #1e293b;
          font-size: 15px;
          font-weight: 700;
          padding: 8px 16px !important;
          border-radius: 8px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
        }
        .db-nav-item:hover {
          color: #00B875;
          background-color: rgba(0, 184, 117, 0.08);
        }
        .db-nav-item.active-item {
          background-color: rgba(0, 184, 117, 0.12) !important;
          color: #00B875 !important;
          font-weight: 700;
        }

        .db-btn-primary {
          background-color: #00B875;
          color: #ffffff;
          border: none;
          padding: 9px 18px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(0, 184, 117, 0.25);
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
        }
        .db-btn-primary:hover {
          background-color: #009E64;
          color: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(0, 184, 117, 0.35);
        }

        .db-btn-outline {
          background-color: #ffffff;
          color: #00B875;
          border: 1.5px solid #00B875;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
        }
        .db-btn-outline:hover {
          background-color: rgba(0, 184, 117, 0.08);
          color: #00B875;
          border-color: #00B875;
          transform: translateY(-1px);
        }

        /* Scroll Progress Bar */
        .scroll-progress-container {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: rgba(0, 184, 117, 0.1);
          z-index: 10;
        }
        .scroll-progress-bar {
          height: 100%;
          background: #00B875;
          width: 0%;
          transition: width 0.15s ease;
        }

        /* Custom Dropdown Styling */
        #topbar-user-dropdown + .dropdown-menu,
        .dropdown-menu {
          border-radius: 14px !important;
          border: 1px solid #E2E8F0 !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08) !important;
          padding: 0 !important;
          overflow: hidden !important;
          min-width: 210px !important;
        }

        .user-dropdown-item,
        .dropdown-menu .dropdown-item {
          font-size: 13.5px !important;
          font-weight: 500 !important;
          color: #1E293B !important;
          padding: 9px 14px !important;
          border-radius: 8px !important;
          display: flex !important;
          align-items: center !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          margin-bottom: 2px !important;
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif !important;
        }

        /* Hover: Dream Green */
        .user-dropdown-item:hover,
        .dropdown-menu .dropdown-item:hover {
          background-color: #E8F8F2 !important; /* Dream Green */
          color: #008A58 !important;
          transform: translateX(2px) !important;
        }
        .user-dropdown-item:hover svg,
        .dropdown-menu .dropdown-item:hover svg {
          color: #00B875 !important;
        }

        /* Selected / Active / Focused: Solid Green */
        .user-dropdown-item:active,
        .user-dropdown-item.active,
        .user-dropdown-item:focus,
        .dropdown-menu .dropdown-item:active,
        .dropdown-menu .dropdown-item.active,
        .dropdown-menu .dropdown-item:focus {
          background-color: #00B875 !important; /* Green */
          background-image: linear-gradient(135deg, #00B875 0%, #00966D 100%) !important;
          color: #FFFFFF !important;
          box-shadow: 0 2px 8px rgba(0, 184, 117, 0.25) !important;
        }
        .user-dropdown-item:active svg,
        .user-dropdown-item.active svg,
        .user-dropdown-item:focus svg,
        .dropdown-menu .dropdown-item:active svg,
        .dropdown-menu .dropdown-item.active svg,
        .dropdown-menu .dropdown-item:focus svg {
          color: #FFFFFF !important;
        }

        /* Logout Item */
        .user-dropdown-logout {
          color: #EF4444 !important;
          font-size: 13.5px !important;
          font-weight: 500 !important;
          padding: 9px 14px !important;
          border-radius: 8px !important;
          display: flex !important;
          align-items: center !important;
          transition: all 0.2s ease !important;
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif !important;
        }
        .user-dropdown-logout:hover {
          background-color: #FEF2F2 !important;
          color: #DC2626 !important;
          transform: translateX(2px) !important;
        }
        .user-dropdown-logout:active,
        .user-dropdown-logout:focus {
          background-color: #EF4444 !important;
          color: #FFFFFF !important;
        }

        /* Mobile Drawer */
        @media (max-width: 991px) {
          .mobile-drawer {
            position: fixed; top: 0; left: 0; right: 0; width: 100%; max-width: 100vw; height: 100vh; height: 100dvh;
            background: white; z-index: 2000;
            transform: translateX(100%); transition: transform 0.35s cubic-bezier(0.165, 0.84, 0.44, 1);
            padding: 20px 24px;
            padding-bottom: calc(32px + env(safe-area-inset-bottom, 0px));
            display: flex; flex-direction: column;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            box-shadow: 0 0 40px rgba(0,0,0,0.15);
          }
          .mobile-drawer.open { transform: translateX(0); }
          .drawer-backdrop {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; height: 100dvh;
            background: rgba(0,0,0,0.45); backdrop-filter: blur(3px);
            z-index: 1999; opacity: 0; visibility: hidden; transition: all 0.3s ease;
          }
          .drawer-backdrop.show { opacity: 1; visibility: visible; }
        }
      `}</style>

      <header className={`fixed-top ${isAuthPage ? 'd-lg-none' : ''}`} style={{ zIndex: 1050, top: 0, position: 'fixed', left: 0, right: 0 }}>
        
        {/* DESKTOP TOP HEADER (DARK GREEN BAR) */}
        <div className="db-topbar d-none d-lg-flex">
          <Container className="d-flex justify-content-between align-items-center">
            {/* Left Info */}
            <div className="d-flex align-items-center gap-3">
              <a href="tel:09613868438" className="db-topbar-link">
                <Phone size={14} strokeWidth={2.2} />
                <span>09613868438</span>
              </a>
              <span style={{ opacity: 0.35, fontSize: 13 }}>|</span>
              <a href="mailto:info@doctorbooklet.com.bd" className="db-topbar-link">
                <Mail size={14} strokeWidth={2.2} />
                <span>info@doctorbooklet.com.bd</span>
              </a>
            </div>

            {/* Right Quick Links & Auth */}
            <div className="d-flex align-items-center" style={{ gap: '20px' }}>
              <Link to="/doctors" className="db-topbar-link">
                <ShieldCheck size={14} strokeWidth={2.2} />
                <span>ডাক্তার পরামর্শ?</span>
              </Link>

              <Link to="/about" className="db-topbar-link">
                <FileText size={14} strokeWidth={2.2} />
                <span>আমাদের সম্পর্কে</span>
              </Link>

              <Link to="/support" className="db-topbar-link">
                <HelpCircle size={14} strokeWidth={2.2} />
                <span>সহায়তা কেন্দ্র</span>
              </Link>

              {isLoggedIn && (
                <NotificationDropdown targetPath={isStaff ? "/admin/notifications" : "/profile"} iconColor="#ffffff" />
              )}

              {isLoggedIn ? (
                <NavDropdown
                  align="end"
                  title={
                    <span className="db-topbar-auth-btn">
                      <User size={14} strokeWidth={2.2} />
                      <span>{user?.name || 'প্রোফাইল'}</span>
                    </span>
                  }
                  id="topbar-user-dropdown"
                >
                  <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg, #003820 0%, #005A34 100%)', color: 'white' }}>
                    <div style={{ fontWeight: 800, fontSize: 14.5 }}>{user?.name}</div>
                    <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 2 }}>{getUserTypeLabel()}</div>
                  </div>
                  <div style={{ padding: '6px' }}>
                    <NavDropdown.Item as={Link} to="/profile" className="user-dropdown-item">
                      <User size={15} className="me-2" /> প্রোফাইল
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/my-appointments" className="user-dropdown-item">
                      <Calendar size={15} className="me-2" /> আমার অ্যাপয়েন্টমেন্ট
                    </NavDropdown.Item>
                    {isStaff && (
                      <NavDropdown.Item as={Link} to="/admin" className="user-dropdown-item">
                        <LayoutGrid size={15} className="me-2" /> {getAdminLinkLabel()}
                      </NavDropdown.Item>
                    )}
                    <NavDropdown.Divider style={{ margin: '4px 0' }} />
                    <NavDropdown.Item onClick={handleLogout} className="user-dropdown-logout">
                      <LogOut size={15} className="me-2" /> সাইন আউট
                    </NavDropdown.Item>
                  </div>
                </NavDropdown>
              ) : (
                <Link to="/login" className="db-topbar-auth-btn">
                  <User size={14} strokeWidth={2.2} />
                  <span>লগইন / রেজিস্টার</span>
                </Link>
              )}
            </div>
          </Container>
        </div>

        {/* DESKTOP MAIN NAVIGATION HEADER (WHITE BAR) */}
        <div className="db-main-header d-none d-lg-flex" style={{ position: 'relative' }}>
          <div className="scroll-progress-container">
            <div className="scroll-progress-bar"></div>
          </div>

          <Container className="d-flex justify-content-between align-items-center">
            {/* Logo */}
            <Link to="/" className="d-flex align-items-center text-decoration-none">
              <img 
                src="/doctorBookletLogo.png" 
                alt="Doctor Booklet Logo" 
                style={{ 
                  height: '46px', 
                  width: 'auto', 
                  objectFit: 'contain'
                }} 
              />
            </Link>

            {/* Menu Items */}
            <Nav className="mx-auto d-flex align-items-center" style={{ gap: '8px' }}>
              {NAV_LINKS.map(item => {
                const isActive = location.pathname === item.path
                return (
                  <Nav.Link
                    key={item.path}
                    as={Link}
                    to={item.path}
                    className={`db-nav-item ${isActive ? 'active-item' : ''}`}
                  >
                    {item.isHome && (
                      <Home size={16} strokeWidth={2.2} style={{ color: isActive ? '#084d2f' : '#1e293b' }} />
                    )}
                    <span>{item.label}</span>
                  </Nav.Link>
                )
              })}
            </Nav>

            {/* Action Buttons */}
            <div className="d-flex align-items-center" style={{ gap: '14px' }}>
              <Link to="/doctors" className="db-btn-primary">
                <CalendarCheck size={18} strokeWidth={2.2} />
                <span>অ্যাপয়েন্টমেন্ট বুক করুন</span>
              </Link>
            </div>
          </Container>
        </div>

        {/* MOBILE HEADER (<992px) */}
        <div className="d-lg-none" style={{
          background: '#ffffff',
          borderBottom: '1px solid #eef2f6',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          padding: '10px 0',
          position: 'relative'
        }}>
          <div className="scroll-progress-container">
            <div className="scroll-progress-bar"></div>
          </div>

          <Container className="d-flex justify-content-between align-items-center">
            {/* Logo */}
            <Link to="/" className="d-flex align-items-center text-decoration-none">
              <img 
                src="/doctorBookletLogo.png" 
                alt="Doctor Booklet" 
                style={{ height: '38px', width: 'auto', objectFit: 'contain' }} 
              />
            </Link>

            {/* Mobile Actions & Menu Toggle */}
            <div className="d-flex align-items-center gap-2">
              <button 
                type="button"
                onClick={() => setExpanded(!expanded)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#003820',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Toggle Navigation"
              >
                {expanded ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </Container>
        </div>

        {/* MOBILE DRAWER */}
        <div className={`drawer-backdrop ${expanded ? 'show' : ''} d-lg-none`} onClick={closeMenu} />
        <div className={`mobile-drawer ${expanded ? 'open' : ''} d-lg-none`}>
          <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom flex-shrink-0">
            <img src="/doctorBookletLogo.png" alt="Doctor Booklet" style={{ height: '34px', width: 'auto' }} />
            <button onClick={closeMenu} style={{ background: 'none', border: 'none', color: '#64748B' }}>
              <X size={22} />
            </button>
          </div>

          <Nav className="flex-column gap-1 mb-3 flex-shrink-0">
            {NAV_LINKS.map(item => (
              <Nav.Link
                key={item.path}
                as={Link}
                to={item.path}
                onClick={closeMenu}
                className={`db-nav-item ${location.pathname === item.path ? 'active-item' : ''}`}
                style={{ width: '100%', justifyContent: 'flex-start' }}
              >
                {item.isHome && <Home size={16} />}
                <span>{item.label}</span>
              </Nav.Link>
            ))}
          </Nav>

          <div style={{ height: '1px', background: '#eef2f6', margin: '12px 0' }} className="flex-shrink-0" />

          <div className="d-flex flex-column gap-2 mb-4 flex-shrink-0">
            <Link to="/doctors" onClick={closeMenu} className="db-topbar-link" style={{ color: '#003820', fontSize: '14px', padding: '6px 0' }}>
              <ShieldCheck size={16} /> <span>ডাক্তার পরামর্শ?</span>
            </Link>
            <Link to="/about" onClick={closeMenu} className="db-topbar-link" style={{ color: '#003820', fontSize: '14px', padding: '6px 0' }}>
              <FileText size={16} /> <span>আমাদের সম্পর্কে</span>
            </Link>
            <Link to="/support" onClick={closeMenu} className="db-topbar-link" style={{ color: '#003820', fontSize: '14px', padding: '6px 0' }}>
              <HelpCircle size={16} /> <span>সহায়তা কেন্দ্র</span>
            </Link>
          </div>

          <div className="mt-auto pt-3 border-top flex-shrink-0" style={{ paddingBottom: '16px' }}>
            {isLoggedIn ? (
              <div>
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px', marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#003820' }}>{user?.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{getUserTypeLabel()}</div>
                </div>
                <Nav.Link as={Link} to="/profile" onClick={closeMenu} style={{ fontWeight: 500, padding: '8px 0', color: '#1e293b' }}>
                  <User size={16} className="me-2" /> প্রোফাইল
                </Nav.Link>
                <Nav.Link as={Link} to="/my-appointments" onClick={closeMenu} style={{ fontWeight: 500, padding: '8px 0', color: '#1e293b' }}>
                  <Calendar size={16} className="me-2" /> আমার অ্যাপয়েন্টমেন্ট
                </Nav.Link>
                {isStaff && (
                  <Nav.Link as={Link} to="/admin" onClick={closeMenu} style={{ fontWeight: 500, padding: '8px 0', color: '#003820' }}>
                    <LayoutGrid size={16} className="me-2" /> {getAdminLinkLabel()}
                  </Nav.Link>
                )}
                <Button variant="link" onClick={handleLogout} className="text-danger p-0 text-decoration-none mt-2 d-flex align-items-center" style={{ fontWeight: 500 }}>
                  <LogOut size={16} className="me-2" /> সাইন আউট
                </Button>
              </div>
            ) : (
              <Link to="/login" onClick={closeMenu} className="db-btn-primary w-100 justify-content-center">
                <User size={16} />
                <span>লগইন / রেজিস্টার</span>
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  )
}

export default AppNavbar

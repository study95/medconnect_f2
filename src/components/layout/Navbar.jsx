import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Navbar, Nav, NavDropdown, Container, Button } from 'react-bootstrap'
import { useAuth } from '../../context/AuthContext'
import { getColor, getInitials } from '../../utils/avatar'
import { 
  LayoutGrid, User, LogOut, Calendar, Phone, Mail, ChevronDown, ChevronUp, 
  CalendarCheck, LogIn, UserPlus, Stethoscope, Building2, 
  ShieldCheck, FileText, HelpCircle, Home, Menu, X,
  Bell, Search, ChevronRight, Activity, Headphones
} from 'lucide-react'
import NotificationDropdown from './NotificationDropdown'
import { getContent } from '../../utils/contentService'
import { useTypewriter } from '../../hooks/useTypewriter'
import SearchTypeaheadDropdown from '../common/SearchTypeaheadDropdown'

const NAV_DOCTOR_SEARCH_PHRASES = [
  'ডাক্তার, বিশেষজ্ঞতা বা হাসপাতাল খুঁজুন...',
  'ডাক্তারের নাম লিখুন... (যেমন: ডাঃ শফিকুল ইসলাম)',
  'বিশেষজ্ঞতা দিয়ে খুঁজুন... (যেমন: মেডিসিন, হৃদরোগ)',
  'হাসপাতাল লিখুন... (যেমন: স্কয়ার, পপুলার)',
  'এলাকা বা শহর দিয়ে খুঁজুন... (যেমন: ধানমন্ডি, সিলেট)'
]

const NAV_HOSPITAL_SEARCH_PHRASES = [
  'হাসপাতাল বা ক্লিনিক খুঁজুন...',
  'হাসপাতালের নাম লিখুন... (যেমন: অ্যাপোলো, ঢাকা মেডিকেল)',
  'ধরন লিখুন... (যেমন: ডায়াগনস্টিক, ক্লিনিক, ট্রমা)',
  'এলাকা দিয়ে খুঁজুন... (যেমন: উত্তরা, সিলেট সদর)'
]

function AppNavbar() {
  const { user, isLoggedIn, isStaff, isAdmin, isDoctor, isManager, isPatient, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const isDetailPath = (prefix) => {
    if (!location.pathname.startsWith(prefix + '/')) return false
    if (location.pathname === prefix || location.pathname.startsWith(prefix + '/view/')) return false
    const segments = location.pathname.replace(new RegExp(`^${prefix}/`), '').split('/').filter(Boolean)
    if (segments.length >= 3) return true
    if (segments.length === 1) {
      const s = segments[0]
      return /^\d+$/.test(s) || (s.length === 26 && /^[0-9A-HJ-KM-NP-TV-Z]+$/i.test(s))
    }
    return false
  }
  const isHospitalDetailPage = isDetailPath('/hospitals')
  const isDoctorDetailPage = isDetailPath('/doctors')
  const isDetailPage = isHospitalDetailPage || isDoctorDetailPage
  const isDoctorsPage = location.pathname === '/doctors' || location.pathname.startsWith('/doctors/')
  const isHospitalsPage = location.pathname === '/hospitals' || location.pathname.startsWith('/hospitals/')
  const isDoctorListing = isDoctorsPage && !isDoctorDetailPage
  const isHospitalListing = isHospitalsPage && !isHospitalDetailPage
  const isSearchableListing = isDoctorListing || isHospitalListing

  const [searchParams, setSearchParams] = useSearchParams()
  const [navSearchText, setNavSearchText] = useState('')
  const [navSearching, setNavSearching] = useState(false)
  const [isTypeaheadOpen, setIsTypeaheadOpen] = useState(false)

  useEffect(() => {
    const handleLoading = (e) => {
      setNavSearching(Boolean(e.detail))
    }
    window.addEventListener('listing-search-loading', handleLoading)
    return () => window.removeEventListener('listing-search-loading', handleLoading)
  }, [])

  const searchPhrases = isHospitalListing ? NAV_HOSPITAL_SEARCH_PHRASES : NAV_DOCTOR_SEARCH_PHRASES
  const animatedPlaceholder = useTypewriter(searchPhrases, 70, 35, 1800)

  useEffect(() => {
    if (isSearchableListing) {
      setNavSearchText(searchParams.get('search') || '')
    } else {
      setNavSearchText('')
    }
  }, [searchParams, isSearchableListing])

  // Synchronize search text in real time with the listing page's search input
  const hadPageQueryRef = useRef(false)

  useEffect(() => {
    const handlePageOpen = (e) => {
      hadPageQueryRef.current = Boolean(e.detail)
    }
    window.addEventListener('listing-typeahead-active', handlePageOpen)
    return () => window.removeEventListener('listing-typeahead-active', handlePageOpen)
  }, [])

  useEffect(() => {
    if (scrolled && hadPageQueryRef.current && navSearchText.trim().length >= 2) {
      setIsTypeaheadOpen(true)
    } else if (!scrolled) {
      setIsTypeaheadOpen(false)
    }
  }, [scrolled, navSearchText])

  useEffect(() => {
    const handleSyncFromPage = (e) => {
      if (typeof e.detail === 'string') {
        setNavSearchText(e.detail)
      }
    }
    window.addEventListener('sync-listing-search', handleSyncFromPage)
    if (isSearchableListing) {
      window.dispatchEvent(new CustomEvent('request-listing-search'))
    }
    return () => window.removeEventListener('sync-listing-search', handleSyncFromPage)
  }, [isSearchableListing, scrolled])

  const handleNavSearchChange = (val) => {
    setNavSearchText(val)
    window.dispatchEvent(new CustomEvent('sync-nav-search', { detail: val }))
  }

  const handleNavSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setIsTypeaheadOpen(false)
    setNavSearching(true)
    const q = navSearchText.trim()
    const next = new URLSearchParams(searchParams)
    if (q) {
      next.set('search', q)
    } else {
      next.delete('search')
    }
    setSearchParams(next)
    window.dispatchEvent(new CustomEvent('submit-listing-search', { detail: q }))
    setTimeout(() => setNavSearching(false), 700)
  }

  const handleNavClearSearch = () => {
    setNavSearchText('')
    setIsTypeaheadOpen(false)
    window.dispatchEvent(new CustomEvent('sync-nav-search', { detail: '' }))
    window.dispatchEvent(new CustomEvent('submit-listing-search', { detail: '' }))
    const next = new URLSearchParams(searchParams)
    next.delete('search')
    setSearchParams(next)
  }

  const handleNavSelectSearchAll = (q, category) => {
    setIsTypeaheadOpen(false)
    if (category === 'hospital' && !isHospitalListing) {
      navigate(`/hospitals?search=${encodeURIComponent(q)}`)
    } else if (category === 'doctor' && !isDoctorListing) {
      navigate(`/doctors?search=${encodeURIComponent(q)}`)
    } else {
      setNavSearchText(q)
      setNavSearching(true)
      const next = new URLSearchParams(searchParams)
      if (q) {
        next.set('search', q)
      } else {
        next.delete('search')
      }
      setSearchParams(next)
      window.dispatchEvent(new CustomEvent('sync-nav-search', { detail: q }))
      window.dispatchEvent(new CustomEvent('submit-listing-search', { detail: q }))
      setTimeout(() => setNavSearching(false), 700)
    }
  }
  const isAuthPage = location.pathname.startsWith('/login') ||
                     (location.pathname === '/register' || location.pathname.startsWith('/register/')) ||
                     location.pathname.startsWith('/pending-verification') ||
                     location.pathname.startsWith('/forgot-password') ||
                     location.pathname.startsWith('/reset-password')


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

  const [topbarVisible, setTopbarVisible] = useState(true)
  const [mobileHeaderVisible, setMobileHeaderVisible] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const lastScrollYRef = useRef(0)

  useEffect(() => {
    setMobileHeaderVisible(true)
  }, [location.pathname])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const deltaY = currentScrollY - lastScrollYRef.current

      if (isSearchableListing) {
        // Desktop topbar
        if (currentScrollY <= 40) {
          setTopbarVisible(true)
          setScrolled(false)
        } else {
          setTopbarVisible(false)
          setScrolled(true)
        }

        // Mobile header: hide when scrolling down, reveal when scrolling up
        if (currentScrollY <= 20) {
          setMobileHeaderVisible(true)
        } else if (deltaY > 6 && currentScrollY > 60) {
          setMobileHeaderVisible(false)
        } else if (deltaY < -6) {
          setMobileHeaderVisible(true)
        }
      } else {
        // On all other pages (Home, About, Services, Contact, etc.)
        setTopbarVisible(true)
        setScrolled(currentScrollY > 20)
        setMobileHeaderVisible(true)
      }

      lastScrollYRef.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isSearchableListing])

  const closeMenu = () => setExpanded(false)

  // Drawer Touch Refs for Edge-Swipe to Open and Swipe to Close
  const drawerRef = useRef(null)
  const backdropRef = useRef(null)
  const isEdgeSwipingRef = useRef(false)
  const isCloseSwipingRef = useRef(false)
  const touchStartXRef = useRef(0)
  const touchStartYRef = useRef(0)
  const currentDragOffsetRef = useRef(0)

  // ── RIGHT EDGE SWIPE-TO-OPEN & SWIPE-TO-CLOSE GESTURE ──
  useEffect(() => {
    const drawer = drawerRef.current
    const backdrop = backdropRef.current
    if (!drawer) return

    const getDrawerWidth = () => Math.min(window.innerWidth * 0.86, 330)

    // 1. Edge-swipe to open (when closed)
    const handleWindowTouchStart = (e) => {
      if (expanded) return
      if (e.touches.length !== 1) return
      const touch = e.touches[0]
      // Trigger only within 28px of right viewport edge
      if (touch.clientX < window.innerWidth - 28) return

      touchStartXRef.current = touch.clientX
      touchStartYRef.current = touch.clientY
      isEdgeSwipingRef.current = true
      currentDragOffsetRef.current = 0
    }

    const handleWindowTouchMove = (e) => {
      if (!isEdgeSwipingRef.current || expanded) return
      const touch = e.touches[0]
      const deltaX = touch.clientX - touchStartXRef.current // negative when moving left
      const deltaY = touch.clientY - touchStartYRef.current

      // If user is mostly scrolling vertically, abort edge swipe
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaX) < 14) {
        isEdgeSwipingRef.current = false
        return
      }

      if (deltaX < -8) {
        if (e.cancelable) e.preventDefault()
        const drawerW = getDrawerWidth()
        const offset = Math.max(0, drawerW + deltaX)
        currentDragOffsetRef.current = deltaX

        drawer.style.transition = 'none'
        drawer.style.transform = `translateX(${offset}px)`

        if (backdrop) {
          const progress = Math.min(1, Math.max(0, (drawerW - offset) / drawerW))
          backdrop.style.transition = 'none'
          backdrop.style.visibility = 'visible'
          backdrop.style.opacity = String(progress)
        }
      }
    }

    const handleWindowTouchEnd = () => {
      if (!isEdgeSwipingRef.current || expanded) return
      isEdgeSwipingRef.current = false
      const dragDistance = -currentDragOffsetRef.current

      if (dragDistance >= 55) {
        // Snap open
        drawer.style.transition = 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
        drawer.style.transform = 'translateX(0)'
        if (backdrop) {
          backdrop.style.transition = 'all 0.28s ease'
          backdrop.style.opacity = '1'
        }
        setTimeout(() => {
          setExpanded(true)
          drawer.style.transform = ''
          drawer.style.transition = ''
          if (backdrop) {
            backdrop.style.opacity = ''
            backdrop.style.visibility = ''
            backdrop.style.transition = ''
          }
        }, 280)
      } else {
        // Snap closed
        drawer.style.transition = 'transform 0.22s ease'
        drawer.style.transform = 'translateX(100%)'
        if (backdrop) {
          backdrop.style.transition = 'all 0.22s ease'
          backdrop.style.opacity = '0'
        }
        setTimeout(() => {
          drawer.style.transform = ''
          drawer.style.transition = ''
          if (backdrop) {
            backdrop.style.visibility = 'hidden'
            backdrop.style.opacity = ''
            backdrop.style.transition = ''
          }
        }, 220)
      }
    }

    // 2. Swipe to close (when open)
    const handleDrawerTouchStart = (e) => {
      if (!expanded) return
      if (e.touches.length !== 1) return
      const touch = e.touches[0]
      touchStartXRef.current = touch.clientX
      touchStartYRef.current = touch.clientY
      isCloseSwipingRef.current = true
      currentDragOffsetRef.current = 0
    }

    const handleDrawerTouchMove = (e) => {
      if (!isCloseSwipingRef.current || !expanded) return
      const touch = e.touches[0]
      const deltaX = touch.clientX - touchStartXRef.current // positive when moving right
      const deltaY = touch.clientY - touchStartYRef.current

      if (deltaX > 10 && deltaX > Math.abs(deltaY) * 1.2) {
        const drawerW = getDrawerWidth()
        currentDragOffsetRef.current = deltaX

        drawer.style.transition = 'none'
        drawer.style.transform = `translateX(${deltaX}px)`

        if (backdrop) {
          const progress = Math.max(0, 1 - deltaX / drawerW)
          backdrop.style.transition = 'none'
          backdrop.style.opacity = String(progress)
        }
      }
    }

    const handleDrawerTouchEnd = () => {
      if (!isCloseSwipingRef.current || !expanded) return
      isCloseSwipingRef.current = false
      const dragDistance = currentDragOffsetRef.current

      if (dragDistance >= 60) {
        // Snap close
        drawer.style.transition = 'transform 0.24s ease'
        drawer.style.transform = 'translateX(100%)'
        if (backdrop) {
          backdrop.style.transition = 'all 0.24s ease'
          backdrop.style.opacity = '0'
        }
        setTimeout(() => {
          closeMenu()
          drawer.style.transform = ''
          drawer.style.transition = ''
          if (backdrop) {
            backdrop.style.opacity = ''
            backdrop.style.visibility = ''
            backdrop.style.transition = ''
          }
        }, 240)
      } else {
        // Snap back open
        drawer.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        drawer.style.transform = 'translateX(0)'
        if (backdrop) {
          backdrop.style.transition = 'all 0.2s ease'
          backdrop.style.opacity = '1'
        }
        setTimeout(() => {
          drawer.style.transform = ''
          drawer.style.transition = ''
          if (backdrop) {
            backdrop.style.opacity = ''
            backdrop.style.transition = ''
          }
        }, 200)
      }
    }

    window.addEventListener('touchstart', handleWindowTouchStart, { passive: true })
    window.addEventListener('touchmove', handleWindowTouchMove, { passive: false })
    window.addEventListener('touchend', handleWindowTouchEnd, { passive: true })

    drawer.addEventListener('touchstart', handleDrawerTouchStart, { passive: true })
    drawer.addEventListener('touchmove', handleDrawerTouchMove, { passive: true })
    drawer.addEventListener('touchend', handleDrawerTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', handleWindowTouchStart)
      window.removeEventListener('touchmove', handleWindowTouchMove)
      window.removeEventListener('touchend', handleWindowTouchEnd)

      drawer.removeEventListener('touchstart', handleDrawerTouchStart)
      drawer.removeEventListener('touchmove', handleDrawerTouchMove)
      drawer.removeEventListener('touchend', handleDrawerTouchEnd)
    }
  }, [expanded])

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

  const getDashboardPath = () => {
    if (isAdmin) return '/admin/dashboard'
    if (isDoctor) return '/doctor/dashboard'
    if (isManager) return '/hospital/dashboard'
    return '/admin/dashboard'
  }

  const NAV_LINKS = [
    { label: 'হোম', path: '/', isHome: true },
    { label: 'ডাক্তার', path: '/doctors' },
    { label: 'হাসপাতাল', path: '/hospitals' },
    { label: 'সেবা সমূহ', path: '/services' },
    { label: 'যোগাযোগ', path: '/contact' },
  ]

  const MOBILE_NAV_LINKS = [
    { label: 'হোম', path: '/', icon: <Home size={17} /> },
    { label: 'ডাক্তার', path: '/doctors', icon: <Stethoscope size={17} /> },
    { label: 'হাসপাতাল', path: '/hospitals', icon: <Building2 size={17} /> },
    { label: 'সেবা সমূহ', path: '/services', icon: <Activity size={17} /> },
    { label: 'যোগাযোগ', path: '/contact', icon: <Headphones size={17} /> },
  ]

  return (
    <>
      <style>{`
        :root {
          --header-height: ${isAuthPage ? '0px' : '102px'};
          --sticky-top: ${topbarVisible ? '134px' : '98px'};
        }
        .page-wrapper {
          padding-top: var(--header-height) !important;
        }
        @media (max-width: 991px) {
          :root {
            --header-height: ${isAuthPage || isDetailPage ? '0px !important' : '58px !important'};
            --sticky-top: ${isAuthPage || isDetailPage ? '0px !important' : (mobileHeaderVisible ? '58px !important' : '0px !important')};
            --mobile-search-top: ${isAuthPage || isDetailPage ? '0px' : (mobileHeaderVisible ? '58px' : '0px')};
          }
          .page-wrapper {
            padding-top: var(--header-height) !important;
          }
          .hospital-detail-page {
            padding-top: 48px !important;
          }
          .doctor-detail-page {
            padding-top: 0 !important;
          }
          body:has(.doctor-detail-page) header.fixed-top,
          body:has(.hospital-detail-page) header.fixed-top {
            display: none !important;
          }
          header.fixed-top {
            transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          }
          header.fixed-top.mobile-header-hidden {
            transform: translateY(-100%);
          }
        }

        .db-topbar {
          background: linear-gradient(90deg, #00B875 0%, #009E64 50%, #008754 100%);
          color: #FFFFFF;
          font-size: 12.5px;
          font-weight: 500;
          height: 36px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
          transition: margin-top 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.22s ease;
          position: relative;
          z-index: 1060;
        }

        .db-topbar.topbar-hidden {
          margin-top: -36px;
          opacity: 0;
          pointer-events: none;
        }

        .db-topbar-link {
          color: rgba(255, 255, 255, 0.92);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12.5px;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .db-topbar-link:hover {
          color: #FFFFFF;
          opacity: 1;
          transform: translateY(-0.5px);
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
        }

        .db-topbar-auth-btn {
          background-color: rgba(255, 255, 255, 0.18);
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.38);
          backdrop-filter: blur(4px);
          padding: 3px 14px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }
        .db-topbar-auth-btn:hover {
          background-color: #FFFFFF;
          color: #00803D;
          border-color: #FFFFFF;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
        }

        /* MAIN NAVBAR (Glassmorphism & Crisp Border) */
        .db-main-header {
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: ${scrolled ? '0 8px 25px rgba(0,0,0,0.06)' : '0 2px 12px rgba(0,0,0,0.02)'};
          border-bottom: 1px solid rgba(226, 232, 240, 0.85);
          height: ${scrolled ? '66px' : '68px'};
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
        }

        .db-nav-item {
          color: #334155;
          font-size: 14.5px;
          font-weight: 700;
          padding: 8px 14px !important;
          border-radius: 8px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          position: relative;
          transition: all 0.2s ease;
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
        }
        .db-nav-item:hover {
          color: #00B875;
          background-color: rgba(0, 184, 117, 0.06);
        }
        .db-nav-item.active-item {
          background-color: transparent !important;
          color: #00B875 !important;
          font-weight: 850;
        }
        .db-nav-item.active-item::after {
          content: '';
          position: absolute;
          bottom: 0px;
          left: 12px;
          right: 12px;
          height: 2.5px;
          background: #00B875;
          border-radius: 99px;
          box-shadow: 0 2px 6px rgba(0, 184, 117, 0.35);
        }

        .db-btn-primary {
          background: linear-gradient(135deg, #00B875 0%, #00966D 100%);
          color: #ffffff;
          border: 1px solid #34D399;
          padding: 9px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.25s ease;
          box-shadow: 0 4px 14px rgba(0, 184, 117, 0.28);
          font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
        }
        .db-btn-primary:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(0, 184, 117, 0.45);
        }

        .db-nav-search-btn {
          background: #00B875;
          color: white;
          border: none;
          border-radius: 99px;
          padding: 5px 16px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Hind Siliguri', sans-serif;
          transition: all 0.15s ease;
          box-shadow: 0 2px 6px rgba(0, 184, 117, 0.3);
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .db-nav-search-btn:hover {
          background: #009E64 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0, 184, 117, 0.4) !important;
        }
        .db-nav-search-btn:active {
          transform: scale(0.94) !important;
          background: #008754 !important;
        }
        .db-nav-search-btn:disabled {
          opacity: 0.8 !important;
          cursor: not-allowed !important;
          transform: none !important;
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
            position: fixed;
            top: 0;
            right: 0;
            left: auto;
            width: 86%;
            max-width: 330px;
            min-width: 280px;
            height: 100vh;
            height: 100dvh;
            background: #FFFFFF;
            z-index: 2000;
            transform: translateX(100%);
            transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
            padding: 16px 16px calc(24px + env(safe-area-inset-bottom, 0px)) 16px;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            box-shadow: -8px 0 36px rgba(15, 23, 42, 0.22);
          }
          .mobile-drawer.open {
            transform: translateX(0);
          }
          .drawer-backdrop {
            position: fixed;
            inset: 0;
            width: 100vw;
            height: 100vh;
            height: 100dvh;
            background: rgba(15, 23, 42, 0.55);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            z-index: 1999;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
          }
          .drawer-backdrop.show {
            opacity: 1;
            visibility: visible;
          }

          .mobile-drawer-close-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #F1F5F9;
            border: 1px solid #E2E8F0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748B;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .mobile-drawer-close-btn:active {
            transform: scale(0.92);
            background: #E2E8F0;
            color: #0F172A;
          }

          .mobile-drawer-user-card {
            background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            padding: 10px 12px;
          }

          .mobile-drawer-section-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #94A3B8;
            margin-bottom: 6px;
            padding-left: 6px;
            font-family: 'Hind Siliguri', sans-serif;
          }

          .mobile-drawer-nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 9px 12px;
            border-radius: 12px;
            color: #1E293B;
            font-weight: 600;
            font-size: 14px;
            text-decoration: none;
            transition: all 0.18s ease;
            background: transparent;
            font-family: 'Hind Siliguri', sans-serif;
          }
          .mobile-drawer-nav-item:hover,
          .mobile-drawer-nav-item:active {
            background: #F8FAFC;
            color: #0F172A;
          }
          .mobile-drawer-nav-item.active {
            background: #E8F8F2 !important;
            color: #00803D !important;
            font-weight: 750;
            box-shadow: 0 1px 4px rgba(0, 128, 61, 0.08);
          }
          .mobile-drawer-nav-item .mobile-drawer-item-icon {
            width: 32px;
            height: 32px;
            border-radius: 9px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #F1F5F9;
            color: #64748B;
            flex-shrink: 0;
            transition: all 0.18s ease;
          }
          .mobile-drawer-nav-item.active .mobile-drawer-item-icon {
            background: #00803D;
            color: #FFFFFF;
          }
          .mobile-drawer-nav-item .mobile-drawer-item-arrow {
            margin-left: auto;
            color: #CBD5E1;
            transition: transform 0.15s ease, color 0.15s ease;
          }
          .mobile-drawer-nav-item.active .mobile-drawer-item-arrow {
            color: #00803D;
          }

          .mobile-drawer-sub-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px;
            border-radius: 10px;
            color: #334155;
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
            transition: background 0.15s ease;
            font-family: 'Hind Siliguri', sans-serif;
          }
          .mobile-drawer-sub-item:hover,
          .mobile-drawer-sub-item:active {
            background: #F8FAFC;
            color: #0F172A;
          }

          .mobile-drawer-helpline-card {
            background: linear-gradient(135deg, #F0FDF4 0%, #E8F8F2 100%);
            border: 1px solid #A7F3D0;
            border-radius: 12px;
            padding: 11px 13px;
            box-shadow: 0 2px 8px rgba(0, 128, 61, 0.06);
            font-family: 'Hind Siliguri', sans-serif;
          }
          .helpline-pulse-box {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #00803D;
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .helpline-title {
            font-size: 11.5px;
            font-weight: 700;
            color: #065F46;
          }
          .helpline-number {
            font-size: 15px;
            font-weight: 800;
            color: #00803D;
            text-decoration: none;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 4px;
          }
          .helpline-badge {
            background: #00803D;
            color: #FFFFFF;
            font-size: 11px;
            font-weight: 700;
            padding: 2px 10px;
            border-radius: 999px;
            box-shadow: 0 2px 6px rgba(0, 128, 61, 0.2);
          }

          .mobile-drawer-login-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            height: 46px;
            border-radius: 12px;
            background: linear-gradient(135deg, #00B875 0%, #00803D 100%);
            color: #FFFFFF !important;
            font-size: 14.5px;
            font-weight: 700;
            text-decoration: none;
            box-shadow: 0 4px 14px rgba(0, 184, 117, 0.32);
            transition: transform 0.15s ease;
            font-family: 'Hind Siliguri', sans-serif;
          }
          .mobile-drawer-login-btn:active {
            transform: scale(0.98);
          }

          .mobile-drawer-logout-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 10px;
            border-radius: 10px;
            background: #FEF2F2;
            border: 1px solid #FEE2E2;
            color: #EF4444;
            font-size: 13.5px;
            font-weight: 700;
            cursor: pointer;
            transition: background 0.15s ease;
            font-family: 'Hind Siliguri', sans-serif;
          }
          .mobile-drawer-logout-btn:active {
            background: #FEE2E2;
          }
        }
      `}</style>

      <header
        className={`fixed-top ${isAuthPage ? 'd-lg-none' : ''} ${isDetailPage ? 'd-none d-lg-block' : ''} ${!mobileHeaderVisible && isSearchableListing && !expanded ? 'mobile-header-hidden' : ''}`}
        style={{ zIndex: 1050, top: 0, position: 'fixed', left: 0, right: 0 }}
      >
        
        {/* DESKTOP TOP HEADER (DARK GREEN BAR) */}
        <div className={`db-topbar d-none d-lg-flex ${!topbarVisible ? 'topbar-hidden' : ''}`}>
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

              {isLoggedIn && isStaff && (
                <NotificationDropdown targetPath={`${getDashboardPath()}/notifications`} iconColor="#ffffff" />
              )}

              {isLoggedIn ? (
                <div ref={userMenuRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(prev => !prev)}
                    className="db-topbar-auth-btn"
                    style={{
                      cursor: 'pointer',
                      border: '1px solid rgba(255, 255, 255, 0.38)',
                      background: userMenuOpen ? '#FFFFFF' : 'rgba(255, 255, 255, 0.18)',
                      color: userMenuOpen ? '#00803D' : '#FFFFFF',
                      boxShadow: userMenuOpen ? '0 2px 10px rgba(0,0,0,0.15)' : 'none'
                    }}
                  >
                    <User size={14} strokeWidth={2.2} />
                    <span>{user?.name || 'প্রোফাইল'}</span>
                    <ChevronDown size={13} style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                  </button>

                  {userMenuOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        width: 230,
                        background: '#FFFFFF',
                        borderRadius: 14,
                        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.06)',
                        border: '1px solid #E2E8F0',
                        overflow: 'hidden',
                        zIndex: 9999,
                        animation: 'fadeInMenu 0.18s ease-out'
                      }}
                    >
                      <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg, #003820 0%, #005A34 100%)', color: 'white' }}>
                        <div style={{ fontWeight: 800, fontSize: 14.5 }}>{user?.name}</div>
                        <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 2 }}>{getUserTypeLabel()}</div>
                      </div>
                      <div style={{ padding: '6px' }}>
                        <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="user-dropdown-item">
                          <User size={15} className="me-2" /> প্রোফাইল
                        </Link>
                        <Link to="/my-appointments" onClick={() => setUserMenuOpen(false)} className="user-dropdown-item">
                          <Calendar size={15} className="me-2" /> আমার অ্যাপয়েন্টমেন্ট
                        </Link>
                        {isStaff && (
                          <Link to={getDashboardPath()} onClick={() => setUserMenuOpen(false)} className="user-dropdown-item">
                            <LayoutGrid size={15} className="me-2" /> {getAdminLinkLabel()}
                          </Link>
                        )}
                        <div style={{ height: 1, background: '#E2E8F0', margin: '4px 0' }} />
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false)
                            handleLogout()
                          }}
                          className="user-dropdown-logout"
                          style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
                        >
                          <LogOut size={15} className="me-2" /> সাইন আউট
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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

            {/* Menu Items or Sticky Listing Search Bar */}
            {isSearchableListing && scrolled ? (
              <div style={{ position: 'relative', width: '100%', maxWidth: 480, margin: '0 auto' }}>
                <form
                  onSubmit={handleNavSearchSubmit}
                  className="db-nav-search-bar"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#F8FAFC',
                    border: '1.5px solid #00B875',
                    borderRadius: 99,
                    padding: '4px 8px 4px 14px',
                    width: '100%',
                    maxWidth: 480,
                    margin: '0 auto',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 2px 10px rgba(0, 184, 117, 0.12)'
                  }}
                >
                  <Search size={17} color="#00B875" style={{ flexShrink: 0 }} />
                  <input
                    type="text"
                    value={navSearchText}
                    onChange={e => {
                      handleNavSearchChange(e.target.value)
                      setIsTypeaheadOpen(true)
                    }}
                    onFocus={() => setIsTypeaheadOpen(true)}
                    placeholder={animatedPlaceholder || (isHospitalListing ? "হাসপাতাল বা ক্লিনিক খুঁজুন..." : "ডাক্তার, বিশেষজ্ঞতা বা হাসপাতাল খুঁজুন...")}
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: '#0F172A',
                      fontFamily: "'Hind Siliguri', 'Inter', sans-serif"
                    }}
                  />
                  {navSearchText && (
                    <button
                      type="button"
                      onClick={handleNavClearSearch}
                      style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                      title="মুছুন"
                    >
                      <X size={15} />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={navSearching}
                    className="db-nav-search-btn"
                  >
                    {navSearching ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" style={{ width: 12, height: 12, borderWidth: 2 }} />
                        <span>খোঁজা হচ্ছে...</span>
                      </>
                    ) : (
                      <span>খুঁজুন</span>
                    )}
                  </button>
                </form>

                <SearchTypeaheadDropdown
                  query={navSearchText}
                  isOpen={isTypeaheadOpen}
                  onClose={() => setIsTypeaheadOpen(false)}
                  onSelectSearchAll={handleNavSelectSearchAll}
                  type={isHospitalListing ? 'hospital' : (isDoctorListing ? 'doctor' : 'all')}
                />
              </div>
            ) : (
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
                        <Home size={16} strokeWidth={2.2} style={{ color: isActive ? '#00B875' : '#475569' }} />
                      )}
                      <span>{item.label}</span>
                    </Nav.Link>
                  )
                })}
              </Nav>
            )}

            {/* Action Buttons */}
            <div className="d-flex align-items-center" style={{ gap: '14px' }}>
              <Link to="/quick-appointment" className="db-btn-primary">
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
          padding: '0',
          position: 'relative',
          height: '58px',
          display: 'flex',
          alignItems: 'center',
          boxSizing: 'border-box'
        }}>
          <Container className="d-flex justify-content-between align-items-center" style={{ height: '100%' }}>
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
              {location.pathname === '/' && (
                <Link
                  to={isLoggedIn ? "/my-appointments" : "/login"}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: '1.5px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    color: '#1E293B',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    textDecoration: 'none'
                  }}
                  title="নোটিফিকেশন"
                >
                  <Bell size={16} />
                  <span style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#EF4444'
                  }} />
                </Link>
              )}

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
        <div ref={backdropRef} className={`drawer-backdrop ${expanded ? 'show' : ''} d-lg-none`} onClick={closeMenu} />
        <div ref={drawerRef} className={`mobile-drawer ${expanded ? 'open' : ''} d-lg-none`}>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-shrink-0">
            <Link to="/" onClick={closeMenu} className="d-flex align-items-center text-decoration-none">
              <img src="/doctorBookletLogo.png" alt="Doctor Booklet" style={{ height: '32px', width: 'auto' }} />
            </Link>
            <button onClick={closeMenu} className="mobile-drawer-close-btn" aria-label="Close menu">
              <X size={19} />
            </button>
          </div>

          {/* User profile strip if logged in */}
          {isLoggedIn && (
            <div className="mobile-drawer-user-card mb-3 d-flex align-items-center gap-2.5 flex-shrink-0">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                style={{ width: 38, height: 38, background: getColor(user?.name), fontSize: 14 }}
              >
                {getInitials(user?.name)}
              </div>
              <div className="overflow-hidden">
                <div className="fw-bold text-dark text-truncate" style={{ fontSize: 13.5 }}>{user?.name}</div>
                <div className="text-muted text-truncate" style={{ fontSize: 11 }}>{getUserTypeLabel()}</div>
              </div>
            </div>
          )}

          {/* Main Navigation items with clean icons and chevrons */}
          <div className="mb-3 flex-shrink-0">
            <div className="mobile-drawer-section-title">প্রধান মেনু</div>
            <div className="d-flex flex-column gap-1">
              {MOBILE_NAV_LINKS.map(item => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMenu}
                    className={`mobile-drawer-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <div className="mobile-drawer-item-icon">
                      {item.icon}
                    </div>
                    <span>{item.label}</span>
                    <ChevronRight size={15} className="mobile-drawer-item-arrow" />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Secondary Quick Links */}
          <div className="mb-3 flex-shrink-0">
            <div className="mobile-drawer-section-title">সহায়তা ও তথ্য</div>
            <div className="d-flex flex-column gap-1">
              <Link to="/doctors" onClick={closeMenu} className="mobile-drawer-sub-item">
                <ShieldCheck size={16} color="#00803D" />
                <span>ডাক্তার পরামর্শ?</span>
              </Link>
              <Link to="/about" onClick={closeMenu} className="mobile-drawer-sub-item">
                <FileText size={16} color="#0284C7" />
                <span>আমাদের সম্পর্কে</span>
              </Link>
              <Link to="/support" onClick={closeMenu} className="mobile-drawer-sub-item">
                <HelpCircle size={16} color="#D97706" />
                <span>সহায়তা কেন্দ্র</span>
              </Link>
            </div>
          </div>

          {/* 24/7 Helpline Quick Card */}
          <div className="mobile-drawer-helpline-card mb-3 flex-shrink-0">
            <div className="d-flex align-items-center gap-2">
              <div className="helpline-pulse-box">
                <Phone size={13} />
              </div>
              <span className="helpline-title">২৪/৭ জরুরি হেল্পলাইন</span>
            </div>
            <a href="tel:09613868438" className="helpline-number">
              <span>০৯৬১৩৮৬৮৪৩৮</span>
              <span className="helpline-badge">কল করুন</span>
            </a>
          </div>

          {/* Bottom Footer Actions (Logged In vs Logged Out) */}
          <div className="mt-auto pt-3 border-top flex-shrink-0">
            {isLoggedIn ? (
              <div className="d-flex flex-column gap-1">
                <Link to="/profile" onClick={closeMenu} className="mobile-drawer-sub-item">
                  <User size={16} className="text-secondary" /> <span>প্রোফাইল</span>
                </Link>
                <Link to="/my-appointments" onClick={closeMenu} className="mobile-drawer-sub-item">
                  <Calendar size={16} className="text-secondary" /> <span>আমার অ্যাপয়েন্টমেন্ট</span>
                </Link>
                {isStaff && (
                  <Link to={getDashboardPath()} onClick={closeMenu} className="mobile-drawer-sub-item" style={{ color: '#00803D', fontWeight: 700 }}>
                    <LayoutGrid size={16} /> <span>{getAdminLinkLabel()}</span>
                  </Link>
                )}
                <button onClick={handleLogout} className="mobile-drawer-logout-btn mt-2">
                  <LogOut size={16} /> <span>সাইন আউট</span>
                </button>
              </div>
            ) : (
              <Link to="/login" onClick={closeMenu} className="mobile-drawer-login-btn">
                <User size={17} />
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

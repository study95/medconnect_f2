import { useState, useEffect } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import { getContent } from '../../utils/contentService'
import { 
  IconPhone, IconMail, IconMapPin, 
  IconBrandFacebook, IconBrandTwitter, IconBrandInstagram, IconBrandLinkedin,
  IconHome, IconStethoscope, IconBuildingHospital, 
  IconInfoCircle, IconServer, IconMessage, IconUserPlus, IconDashboard, 
  IconHelp, IconShieldCheck, IconLock, IconReceiptRefund,
  IconPlus, IconMinus
} from '@tabler/icons-react'

function Footer() {
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992)
  const currentYear = new Date().getFullYear()
  const [cms, setCms] = useState(getContent())

  useEffect(() => {
    const handleUpdate = () => setCms(getContent())
    window.addEventListener('cms-updated', handleUpdate)
    return () => window.removeEventListener('cms-updated', handleUpdate)
  }, [])

  const site = cms.site || {}
  const copyrightText = (site.copyright || `কপিরাইট © ${currentYear}, Doctor Booklet. সর্বস্বত্ব সংরক্ষিত।`).replace('২০২৪', '২০২৬')

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 992)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isAuthPage = location.pathname.startsWith('/login') ||
                     (location.pathname === '/register' || location.pathname.startsWith('/register/')) ||
                     location.pathname.startsWith('/pending-verification') ||
                     location.pathname.startsWith('/forgot-password') ||
                     location.pathname.startsWith('/reset-password')

  const isQuickApptPage = location.pathname.startsWith('/quick-appointment') ||
                         location.pathname.startsWith('/book-appointment')

  if (isAuthPage || isMobile) {
    return null
  }

  const isLinkActive = (to) => {
    if (!to) return false
    if (to === '/' && location.pathname === '/') return true
    if (to.includes('/legal')) {
      if (location.pathname !== '/legal') return false
      const currentTab = new URLSearchParams(location.search).get('tab') || 'terms'
      const targetTab = new URLSearchParams(to.split('?')[1] || '').get('tab') || 'terms'
      return currentTab === targetTab
    }
    if (to !== '/' && location.pathname.startsWith(to)) return true
    return false
  }

  const QUICK_LINKS = [
    { label: 'হোম', to: '/', icon: <IconHome size={16} /> },
    { label: 'সকল ডাক্তার', to: '/doctors', icon: <IconStethoscope size={16} /> },
    { label: 'সকল হাসপাতাল', to: '/hospitals', icon: <IconBuildingHospital size={16} /> },
    { label: 'স্বাস্থ্য সেবা', to: '/services', icon: <IconServer size={16} /> },
    { label: 'যোগাযোগ করুন', to: '/contact', icon: <IconMessage size={16} /> },
  ]

  const PARTNER_LINKS = [
    { label: 'রোগীদের সেবা ও সুবিধা', to: '/register-patient', icon: <IconUserPlus size={16} /> },
    { label: 'আপনি কি ডাক্তার?', to: '/register-doctor', icon: <IconUserPlus size={16} /> },
    { label: 'আপনার কি হাসপাতাল আছে?', to: '/register-hospital', icon: <IconBuildingHospital size={16} /> },
    { label: 'পার্টনার ড্যাশবোর্ড', to: '/login', icon: <IconDashboard size={16} /> },
    { label: 'সাহায্য কেন্দ্র (FAQ)', to: '/support', icon: <IconHelp size={16} /> },
  ]

  const LEGAL_LINKS = [
    { label: 'আমাদের সম্পর্কে', to: '/about', icon: <IconInfoCircle size={16} /> },
    { label: 'ব্যবহারের শর্তাবলী', to: '/legal?tab=terms', icon: <IconShieldCheck size={16} /> },
    { label: 'গোপনীয়তা নীতি', to: '/legal?tab=privacy', icon: <IconLock size={16} /> },
    { label: 'রিফান্ড পলিসি', to: '/legal?tab=refund', icon: <IconReceiptRefund size={16} /> },
  ]

  const SOCIAL_LINKS = [
    { label: 'ফেসবুক', icon: <IconBrandFacebook size={18} />, url: '#' },
    { label: 'টুইটার', icon: <IconBrandTwitter size={18} />, url: '#' },
    { label: 'ইনস্টাগ্রাম', icon: <IconBrandInstagram size={18} />, url: '#' },
    { label: 'লিঙ্কডইন', icon: <IconBrandLinkedin size={18} />, url: '#' },
  ]

  const renderFooterLink = (link) => {
    const active = isLinkActive(link.to)
    return (
      <Link 
        key={link.label} 
        to={link.to} 
        style={{
          color: active ? '#34D399' : 'rgba(255, 255, 255, 0.72)',
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: active ? 700 : 500,
          transition: 'all 0.25s ease',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
        onMouseEnter={e => { 
          e.currentTarget.style.color = '#34D399'
          e.currentTarget.style.transform = 'translateX(6px)' 
        }}
        onMouseLeave={e => { 
          e.currentTarget.style.color = active ? '#34D399' : 'rgba(255, 255, 255, 0.72)'
          e.currentTarget.style.transform = 'translateX(0)' 
        }}
      >
        <span style={{ 
          color: '#34D399', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {link.icon}
        </span>
        <span>{link.label}</span>
      </Link>
    )
  }

  const renderMobileLink = (link) => {
    const active = isLinkActive(link.to)
    return (
      <Link 
        key={link.label} 
        to={link.to} 
        style={{
          color: active ? '#34D399' : 'rgba(255, 255, 255, 0.85)',
          background: active ? 'rgba(0, 184, 117, 0.15)' : 'rgba(255, 255, 255, 0.05)',
          border: active ? '1px solid #34D399' : '1px solid rgba(255, 255, 255, 0.1)',
          textDecoration: 'none',
          fontSize: 15,
          fontWeight: active ? 700 : 600,
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          borderRadius: '12px',
          transition: 'all 0.3s ease',
          marginBottom: '6px',
          gap: 10,
          fontFamily: "'Inter', 'Hind Siliguri', sans-serif"
        }}
      >
        <span style={{ color: '#34D399', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {link.icon}
        </span>
        <span>{link.label}</span>
      </Link>
    )
  }

  return (
    <footer 
      className="d-none d-lg-block"
      style={{ 
        background: 'linear-gradient(180deg, #021B14 0%, #041611 50%, #010D0A 100%)', 
        padding: '56px 0 32px', 
        position: 'relative', 
        overflow: 'hidden',
        color: '#FFFFFF',
        fontFamily: "'Hind Siliguri', sans-serif"
      }}
    >
      {/* Radiant Top Accent Bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent 0%, #00B875 30%, #38BDF8 70%, transparent 100%)',
        zIndex: 2
      }} />

      {/* Atmospheric Background Glows & Subtle Micro-Grid */}
      <div style={{ 
        position: 'absolute', 
        top: '-80px', 
        left: '12%', 
        width: '450px', 
        height: '350px', 
        background: 'radial-gradient(circle, rgba(0, 184, 117, 0.14) 0%, transparent 70%)', 
        filter: 'blur(70px)', 
        pointerEvents: 'none' 
      }} />
      <div style={{ 
        position: 'absolute', 
        bottom: '-100px', 
        right: '10%', 
        width: '500px', 
        height: '400px', 
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)', 
        filter: 'blur(80px)', 
        pointerEvents: 'none' 
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(to right, rgba(52, 211, 153, 0.025) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(52, 211, 153, 0.025) 1px, transparent 1px)
        `,
        backgroundSize: '36px 36px',
        pointerEvents: 'none'
      }} />

      <Container style={{ position: 'relative', zIndex: 1 }}>
        <Row className="g-5">
          {/* 1. BRAND & STORY */}
          <Col lg={4} className="mb-4 mb-lg-0">
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', marginBottom: 22 }}>
              <img 
                src="/doctorBookletLogo.png" 
                alt="Doctor Booklet Logo" 
                style={{ 
                  height: '44px', 
                  width: 'auto', 
                  objectFit: 'contain'
                }} 
              />
            </Link>
            <p style={{ color: 'rgba(255, 255, 255, 0.72)', fontSize: 14, lineHeight: 1.7, marginBottom: 28, maxWidth: 340 }}>
              {site.tagline || 'আমরা আধুনিক প্রযুক্তির মাধ্যমে স্বাস্থ্যসেবাকে আপনার দোরগোড়ায় পৌঁছে দিতে প্রতিশ্রুতিবদ্ধ। বিশ্বস্ত ডাক্তার ও উন্নত হাসপাতালের সাথে যুক্ত থাকুন Doctor Booklet-এর মাধ্যমে।'}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {SOCIAL_LINKS.map((link, i) => (
                <a 
                  key={i} 
                  href={link.url} 
                  style={{ 
                    width: 38, 
                    height: 38, 
                    borderRadius: 10, 
                    background: 'rgba(255, 255, 255, 0.06)', 
                    border: '1px solid rgba(255, 255, 255, 0.12)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    transition: 'all 0.25s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}
                  onMouseEnter={e => { 
                    e.currentTarget.style.background = '#00B875'
                    e.currentTarget.style.color = '#FFFFFF'
                    e.currentTarget.style.borderColor = '#34D399'
                    e.currentTarget.style.transform = 'translateY(-3px)' 
                    e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 184, 117, 0.4)'
                  }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                    e.currentTarget.style.transform = 'translateY(0)' 
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </Col>

          {/* 2. QUICK LINKS */}
          <Col lg={2}>
            <h6 style={{ 
              color: '#FFFFFF', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 22, 
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span style={{ width: 4, height: 14, background: '#34D399', borderRadius: 2 }}></span>
              দ্রুত লিঙ্ক
            </h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {QUICK_LINKS.map(link => renderFooterLink(link))}
            </div>
          </Col>

          {/* 3. FOR PARTNERS */}
          <Col lg={3}>
            <h6 style={{ 
              color: '#FFFFFF', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 22, 
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span style={{ width: 4, height: 14, background: '#34D399', borderRadius: 2 }}></span>
              পার্টনারশিপ
            </h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {PARTNER_LINKS.map(link => renderFooterLink(link))}
            </div>
          </Col>

          {/* 4. LEGAL & CONTACT */}
          <Col lg={3}>
            <h6 style={{ 
              color: '#FFFFFF', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 22, 
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span style={{ width: 4, height: 14, background: '#34D399', borderRadius: 2 }}></span>
              আইনি ও সহায়তা
            </h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {LEGAL_LINKS.map(link => renderFooterLink(link))}
            </div>
          </Col>
        </Row>

        {/* BOTTOM COPYRIGHT BAR */}
        <div style={{ 
          marginTop: 48, paddingTop: 26, borderTop: '1px solid rgba(255, 255, 255, 0.08)', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          flexWrap: 'wrap', gap: 16
        }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.55)', fontSize: 13, margin: 0, fontWeight: 500 }}>
            {copyrightText}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Link 
              to="/legal?tab=terms" 
              style={{ 
                color: isLinkActive('/legal?tab=terms') ? '#34D399' : 'rgba(255, 255, 255, 0.65)', 
                textDecoration: 'none', 
                fontSize: 13, 
                fontWeight: isLinkActive('/legal?tab=terms') ? 700 : 500, 
                transition: 'color 0.2s' 
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#34D399'}
              onMouseLeave={e => e.currentTarget.style.color = isLinkActive('/legal?tab=terms') ? '#34D399' : 'rgba(255, 255, 255, 0.65)'}
            >
              ব্যবহারের শর্তাবলী (Terms)
            </Link>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: 12 }}>•</span>
            <Link 
              to="/legal?tab=privacy" 
              style={{ 
                color: isLinkActive('/legal?tab=privacy') ? '#34D399' : 'rgba(255, 255, 255, 0.65)', 
                textDecoration: 'none', 
                fontSize: 13, 
                fontWeight: isLinkActive('/legal?tab=privacy') ? 700 : 500, 
                transition: 'color 0.2s' 
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#34D399'}
              onMouseLeave={e => e.currentTarget.style.color = isLinkActive('/legal?tab=privacy') ? '#34D399' : 'rgba(255, 255, 255, 0.65)'}
            >
              গোপনীয়তা নীতি (Privacy)
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}

export default Footer

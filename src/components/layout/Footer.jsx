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
  const [openSection, setOpenSection] = useState(null)
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
                     location.pathname.startsWith('/register') ||
                     location.pathname.startsWith('/pending-verification') ||
                     location.pathname.startsWith('/forgot-password') ||
                     location.pathname.startsWith('/reset-password')

  if (isAuthPage) {
    return null
  }

  const isLinkActive = (to) => {
    if (!to) return false
    if (to === '/' && location.pathname === '/') return true
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
    { label: 'আপনি কি ডাক্তার?', to: '/register-doctor', icon: <IconUserPlus size={16} /> },
    { label: 'আপনার কি হাসপাতাল আছে?', to: '/register-hospital', icon: <IconBuildingHospital size={16} /> },
    { label: 'পার্টনার ড্যাশবোর্ড', to: '/login', icon: <IconDashboard size={16} /> },
    { label: 'সাহায্য কেন্দ্র (FAQ)', to: '/support', icon: <IconHelp size={16} /> },
  ]

  const LEGAL_LINKS = [
    { label: 'আমাদের সম্পর্কে', to: '/about', icon: <IconInfoCircle size={16} /> },
    { label: 'ব্যবহারের শর্তাবলী', to: '/legal', icon: <IconShieldCheck size={16} /> },
    { label: 'গোপনীয়তা নীতি', to: '/legal', icon: <IconLock size={16} /> },
    { label: 'রিফান্ড পলিসি', to: '/legal', icon: <IconReceiptRefund size={16} /> },
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
          color: active ? '#00B875' : '#064E3B',
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: active ? 700 : 600,
          transition: 'all 0.25s ease',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
        onMouseEnter={e => { 
          e.currentTarget.style.color = '#00B875'
          e.currentTarget.style.transform = 'translateX(6px)' 
        }}
        onMouseLeave={e => { 
          e.currentTarget.style.color = active ? '#00B875' : '#064E3B'
          e.currentTarget.style.transform = 'translateX(0)' 
        }}
      >
        <span style={{ 
          color: '#00B875', 
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
          color: active ? '#00B875' : '#064E3B',
          background: active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
          border: active ? '1px solid #00B875' : '1px solid #DCFCE7',
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
        <span style={{ color: '#00B875', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {link.icon}
        </span>
        <span>{link.label}</span>
      </Link>
    )
  }

  const AccordionItem = ({ id, title, children }) => {
    const isOpen = openSection === id;
    return (
      <div style={{ 
        borderBottom: '1px solid rgba(0, 184, 117, 0.22)',
        background: isOpen ? 'rgba(0, 184, 117, 0.04)' : 'transparent',
        transition: 'background 0.3s ease'
      }}>
        <div 
          onClick={() => setOpenSection(isOpen ? null : id)}
          style={{ 
            padding: '20px 24px', display: 'flex', justifyContent: 'space-between', 
            alignItems: 'center', cursor: 'pointer',
            fontWeight: 800, fontSize: 16, color: isOpen ? '#00B875' : '#02382B',
            fontFamily: "'Inter', 'Hind Siliguri', sans-serif",
            letterSpacing: '0.2px'
          }}
        >
          <span>{title}</span>
          <div style={{ 
            width: 28, height: 28, borderRadius: '50%', 
            background: isOpen ? 'rgba(0, 184, 117, 0.2)' : 'rgba(0, 184, 117, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease',
            flexShrink: 0
          }}>
            {isOpen ? (
              <IconMinus size={16} stroke={2.5} color="#00B875" />
            ) : (
              <IconPlus size={16} stroke={2.5} color="#00B875" />
            )}
          </div>
        </div>
        <div style={{ 
          maxHeight: isOpen ? '600px' : '0px', 
          overflow: 'hidden', 
          transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: isOpen ? 1 : 0
        }}>
          <div style={{ 
            padding: '0 24px 20px', display: 'flex', flexDirection: 'column'
          }}>
            {children}
          </div>
        </div>
      </div>
    )
  }

  // ─── MOBILE VIEW (ACCORDION) ────────────────────────────────────────────────
  if (isMobile) {
    return (
      <footer style={{ 
        background: 'linear-gradient(145deg, #F0FDF4 0%, #DCFCE7 100%)',
        color: '#02382B',
        fontFamily: "'Inter', 'Hind Siliguri', sans-serif",
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid rgba(0, 184, 117, 0.22)'
      }}>
        {/* Soft Glassmorphism Glows */}
        <div style={{ position: 'absolute', top: -100, right: -50, width: 300, height: 300, background: 'radial-gradient(circle, rgba(0, 184, 117, 0.08) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, left: -50, width: 250, height: 250, background: 'radial-gradient(circle, rgba(0, 184, 117, 0.06) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

        <div style={{ borderTop: '1px solid rgba(0, 184, 117, 0.22)', position: 'relative', zIndex: 2 }}>
          <AccordionItem id="brand" title="ডক্টর বুকলেট সম্পর্কে">
            {LEGAL_LINKS.slice(0, 1).map(link => renderMobileLink(link))}
            {QUICK_LINKS.slice(3, 5).map(link => renderMobileLink(link))}
          </AccordionItem>

          <AccordionItem id="patients" title="রোগীদের জন্য">
            {QUICK_LINKS.slice(0, 3).map(link => renderMobileLink(link))}
          </AccordionItem>

          <AccordionItem id="doctors" title="ডাক্তারদের জন্য">
            {renderMobileLink({ label: 'আপনি কি ডাক্তার?', to: '/register-doctor', icon: <IconUserPlus size={16} /> })}
            {renderMobileLink({ label: 'ডাক্তার ড্যাশবোর্ড', to: '/login', icon: <IconDashboard size={16} /> })}
          </AccordionItem>

          <AccordionItem id="hospitals" title="হাসপাতালের জন্য">
            {renderMobileLink({ label: 'আপনার কি হাসপাতাল আছে?', to: '/register-hospital', icon: <IconBuildingHospital size={16} /> })}
            {renderMobileLink({ label: 'হাসপাতাল ড্যাশবোর্ড', to: '/login', icon: <IconDashboard size={16} /> })}
          </AccordionItem>

          <AccordionItem id="more" title="আরও জানুন">
            {LEGAL_LINKS.slice(1).map(link => renderMobileLink(link))}
            {renderMobileLink({ label: 'সাহায্য কেন্দ্র (FAQ)', to: '/support', icon: <IconHelp size={16} /> })}
          </AccordionItem>

          <AccordionItem id="social" title="সোশ্যাল মিডিয়া">
            {SOCIAL_LINKS.map(link => (
              <a 
                key={link.label} 
                href={link.url} 
                style={{
                  color: '#064E3B',
                  background: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid #DCFCE7',
                  textDecoration: 'none',
                  fontSize: 15,
                  fontWeight: 600,
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
                <span style={{ color: '#00B875', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </a>
            ))}
          </AccordionItem>
        </div>

        {/* Centered Logo & Brand Area */}
        <div style={{ padding: '40px 20px 80px', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <img 
              src="/doctorBookletLogo.png" 
              alt="Doctor Booklet Logo" 
              style={{ 
                height: '44px', 
                width: 'auto', 
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 8px rgba(0, 184, 117, 0.15))' 
              }} 
            />
          </Link>
          
          <p style={{ color: '#064E3B', fontSize: 13, margin: 0, fontWeight: 500, letterSpacing: '0.5px', lineHeight: 1.6, opacity: 0.85 }}>
            {copyrightText}
          </p>
        </div>
      </footer>
    )
  }

  // ─── DESKTOP VIEW (GRID) ────────────────────────────────────────────────────
  return (
    <footer style={{ 
      background: 'linear-gradient(145deg, #F0FDF4 0%, #DCFCE7 100%)', 
      padding: '80px 0 30px', 
      position: 'relative', 
      overflow: 'hidden',
      color: '#02382B',
      fontFamily: "'Hind Siliguri', sans-serif",
      borderTop: '1px solid #BBF7D0'
    }}>
      {/* Aesthetic Background Glows */}
      <div style={{ position: 'absolute', bottom: -120, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 1200, height: 300, background: 'radial-gradient(circle, rgba(0, 184, 117, 0.08) 0%, transparent 75%)', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: 400, height: 400, background: 'radial-gradient(circle, rgba(0, 184, 117, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <Container>
        <Row className="g-5">
          {/* 1. BRAND & STORY */}
          <Col lg={4} className="mb-4 mb-lg-0">
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', marginBottom: 24 }}>
              <img 
                src="/doctorBookletLogo.png" 
                alt="Doctor Booklet Logo" 
                style={{ 
                  height: '48px', 
                  width: 'auto', 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 8px rgba(0, 184, 117, 0.15))' 
                }} 
              />
            </Link>
            <p style={{ color: '#064E3B', fontSize: 15, lineHeight: 1.7, marginBottom: 32, maxWidth: 340, opacity: 0.9 }}>
              {site.tagline || 'আমরা আধুনিক প্রযুক্তির মাধ্যমে স্বাস্থ্যসেবাকে আপনার দোরগোড়ায় পৌঁছে দিতে প্রতিশ্রুতিবদ্ধ। বিশ্বস্ত ডাক্তার ও উন্নত হাসপাতালের সাথে যুক্ত থাকুন Doctor Booklet-এর মাধ্যমে।'}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              {SOCIAL_LINKS.map((link, i) => (
                <a 
                  key={i} 
                  href={link.url} 
                  style={{ 
                    width: 38, 
                    height: 38, 
                    borderRadius: 10, 
                    background: '#FFFFFF', 
                    border: '1px solid #BBF7D0', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#059669', 
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 6px rgba(0, 184, 117, 0.08)'
                  }}
                  onMouseEnter={e => { 
                    e.currentTarget.style.background = '#00B875'
                    e.currentTarget.style.color = '#FFFFFF'
                    e.currentTarget.style.borderColor = '#00B875'
                    e.currentTarget.style.transform = 'translateY(-3px)' 
                    e.currentTarget.style.boxShadow = '0 6px 14px rgba(0, 184, 117, 0.25)'
                  }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.background = '#FFFFFF'
                    e.currentTarget.style.color = '#059669'
                    e.currentTarget.style.borderColor = '#BBF7D0'
                    e.currentTarget.style.transform = 'translateY(0)' 
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 184, 117, 0.08)'
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
              color: '#02382B', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 24, 
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span style={{ width: 4, height: 14, background: '#00B875', borderRadius: 2 }}></span>
              দ্রুত লিঙ্ক
            </h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {QUICK_LINKS.map(link => renderFooterLink(link))}
            </div>
          </Col>

          {/* 3. FOR PARTNERS */}
          <Col lg={3}>
            <h6 style={{ 
              color: '#02382B', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 24, 
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span style={{ width: 4, height: 14, background: '#00B875', borderRadius: 2 }}></span>
              পার্টনারশিপ
            </h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {PARTNER_LINKS.map(link => renderFooterLink(link))}
            </div>
          </Col>

          {/* 4. LEGAL & CONTACT */}
          <Col lg={3}>
            <h6 style={{ 
              color: '#02382B', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 24, 
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span style={{ width: 4, height: 14, background: '#00B875', borderRadius: 2 }}></span>
              আইনি ও সহায়তা
            </h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
              {LEGAL_LINKS.map(link => renderFooterLink(link))}
            </div>
            
            <div className="d-lg-none" style={{ 
              padding: '24px', borderRadius: 20, background: 'rgba(255,255,255,0.7)', 
              border: '1px solid #BBF7D0', maxWidth: 320
            }}>
               <h6 style={{ color: '#02382B', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>যোগাযোগ করুন</h6>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                     <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0, 184, 117, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00B875' }}>
                        <IconPhone size={18} />
                     </div>
                     <div>
                        <p style={{ margin: 0, color: '#065F46', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>হেল্পলাইন</p>
                        <p style={{ margin: 0, color: '#00B875', fontSize: 15, fontWeight: 900 }}>{site.phone || '017 XXXX XXXX'}</p>
                     </div>
                  </div>

                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                     <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0, 184, 117, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00B875' }}>
                        <IconMail size={18} />
                     </div>
                     <div>
                        <p style={{ margin: 0, color: '#065F46', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>ইমেইল</p>
                        <p style={{ margin: 0, color: '#02382B', fontSize: 14, fontWeight: 700 }}>{site.email || 'info@doctorbooklet.com.bd'}</p>
                     </div>
                  </div>

                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                     <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0, 184, 117, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00B875', marginTop: 2 }}>
                        <IconMapPin size={18} />
                     </div>
                     <div>
                        <p style={{ margin: 0, color: '#065F46', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>ঠিকানা</p>
                        <p style={{ margin: 0, color: '#064E3B', fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{site.address || 'বনানী, ঢাকা-১২১৩, বাংলাদেশ'}</p>
                     </div>
                  </div>
               </div>
            </div>
          </Col>
        </Row>

        {/* BOTTOM BAR */}
        <div style={{ 
          marginTop: 60, paddingTop: 30, borderTop: '1px solid #BBF7D0', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          flexWrap: 'wrap', gap: 20
        }}>
          <p style={{ color: '#064E3B', fontSize: 13, margin: 0, fontWeight: 600, opacity: 0.9 }}>
            {copyrightText}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link to="/legal" style={{ color: '#064E3B', textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#00B875'}
                  onMouseLeave={e => e.currentTarget.style.color = '#064E3B'}>
              ব্যবহারের শর্তাবলী (Terms)
            </Link>
            <span style={{ color: '#86EFAC', fontSize: 12 }}>•</span>
            <Link to="/legal" style={{ color: '#064E3B', textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#00B875'}
                  onMouseLeave={e => e.currentTarget.style.color = '#064E3B'}>
              গোপনীয়তা নীতি (Privacy)
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}

export default Footer

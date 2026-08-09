import { useState, useEffect } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import { getContent } from '../../utils/contentService'
import { 
  IconPhone, IconMail, IconMapPin, 
  IconBrandFacebook, IconBrandTwitter, IconBrandInstagram, IconBrandLinkedin,
  IconHome, IconStethoscope, IconBuildingHospital, 
  IconInfoCircle, IconServer, IconMessage, IconUserPlus, IconDashboard, 
  IconHelp, IconShieldCheck, IconLock, IconReceiptRefund
} from '@tabler/icons-react'

function Footer() {
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992)
  const [openSection, setOpenSection] = useState(null)
  const currentYear = new Date().getFullYear()
  const cms = getContent()
  const site = cms.site || {}
  const copyrightText = (site.copyright || `কপিরাইট © ${currentYear}, Doctor Booklet. সর্বস্বত্ব সংরক্ষিত।`).replace('২০২৪', '২০২৬')

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 992)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (['/login', '/register'].includes(location.pathname)) {
    return null
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

  const linkStyle = {
    color: 'rgba(255,255,255,0.6)',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }

  const mobileLinkStyle = {
    color: 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
    fontSize: 15,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    marginBottom: '4px',
    fontFamily: "'Inter', 'Hind Siliguri', sans-serif"
  }

  const AccordionItem = ({ id, title, children }) => {
    const isOpen = openSection === id;
    return (
      <div style={{ 
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: isOpen ? 'rgba(255,255,255,0.02)' : 'transparent',
        transition: 'background 0.4s ease'
      }}>
        <div 
          onClick={() => setOpenSection(isOpen ? null : id)}
          style={{ 
            padding: '22px 24px', display: 'flex', justifyContent: 'space-between', 
            alignItems: 'center', cursor: 'pointer',
            fontWeight: 700, fontSize: 16, color: isOpen ? '#ffffff' : 'rgba(255,255,255,0.9)',
            fontFamily: "'Inter', 'Hind Siliguri', sans-serif",
            letterSpacing: '0.3px'
          }}
        >
          {title}
          <div style={{ 
            width: 28, height: 28, borderRadius: '50%', 
            background: isOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}>
            <span style={{ 
              fontSize: 22, fontWeight: 300, color: isOpen ? 'white' : 'rgba(255,255,255,0.5)',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              lineHeight: 1
            }}>
              {isOpen ? '-' : '+'}
            </span>
          </div>
        </div>
        <div style={{ 
          maxHeight: isOpen ? '500px' : '0px', 
          overflow: 'hidden', 
          transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: isOpen ? 1 : 0
        }}>
          <div style={{ 
            padding: '0 24px 24px', display: 'flex', flexDirection: 'column', 
            background: 'linear-gradient(180deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.02) 100%)'
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
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', // Deep premium royal/slate blue
        color: 'white',
        fontFamily: "'Inter', 'Hind Siliguri', sans-serif",
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Soft Glassmorphism Glows */}
        <div style={{ position: 'absolute', top: -100, right: -50, width: 300, height: 300, background: 'radial-gradient(circle, rgba(0,168,140,0.15) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, left: -50, width: 250, height: 250, background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 2 }}>
          <AccordionItem id="brand" title="মেডকানেক্ট (আমাদের সম্পর্কে)">
            {LEGAL_LINKS.slice(0, 1).map(link => (
              <Link key={link.label} to={link.to} style={mobileLinkStyle}>
                <span style={{ color: '#00D4AF', marginRight: 10 }}>{link.icon}</span> {link.label}
              </Link>
            ))}
            {QUICK_LINKS.slice(3, 5).map(link => (
              <Link key={link.label} to={link.to} style={mobileLinkStyle}>
                <span style={{ color: '#00D4AF', marginRight: 10 }}>{link.icon}</span> {link.label}
              </Link>
            ))}
            <Link to="/contact" style={mobileLinkStyle}>
              <span style={{ color: '#00D4AF', marginRight: 10 }}><IconMessage size={16} /></span> যোগাযোগ করুন
            </Link>
          </AccordionItem>

          <AccordionItem id="patients" title="রোগীদের জন্য">
            {QUICK_LINKS.slice(0, 3).map(link => (
              <Link key={link.label} to={link.to} style={mobileLinkStyle}>
                <span style={{ color: '#00D4AF', marginRight: 10 }}>{link.icon}</span> {link.label}
              </Link>
            ))}
          </AccordionItem>

          <AccordionItem id="doctors" title="ডাক্তারদের জন্য">
            <Link to="/register-doctor" style={mobileLinkStyle}>
              <span style={{ color: '#00D4AF', marginRight: 10 }}><IconUserPlus size={16} /></span> আপনি কি ডাক্তার?
            </Link>
            <Link to="/login" style={mobileLinkStyle}>
              <span style={{ color: '#00D4AF', marginRight: 10 }}><IconDashboard size={16} /></span> ডাক্তার ড্যাশবোর্ড
            </Link>
          </AccordionItem>

          <AccordionItem id="hospitals" title="হাসপাতালের জন্য">
            <Link to="/register-hospital" style={mobileLinkStyle}>
              <span style={{ color: '#00D4AF', marginRight: 10 }}><IconBuildingHospital size={16} /></span> আপনার কি হাসপাতাল আছে?
            </Link>
            <Link to="/login" style={mobileLinkStyle}>
              <span style={{ color: '#00D4AF', marginRight: 10 }}><IconDashboard size={16} /></span> হাসপাতাল ড্যাশবোর্ড
            </Link>
          </AccordionItem>

          <AccordionItem id="more" title="আরও জানুন">
            {LEGAL_LINKS.slice(1).map(link => (
              <Link key={link.label} to={link.to} style={mobileLinkStyle}>
                <span style={{ color: '#00D4AF', marginRight: 10 }}>{link.icon}</span> {link.label}
              </Link>
            ))}
            <Link to="/support" style={mobileLinkStyle}>
              <span style={{ color: '#00D4AF', marginRight: 10 }}><IconHelp size={16} /></span> সাহায্য কেন্দ্র (FAQ)
            </Link>
          </AccordionItem>

          <AccordionItem id="social" title="সোশ্যাল মিডিয়া">
            {SOCIAL_LINKS.map(link => (
              <a key={link.label} href={link.url} style={{ ...mobileLinkStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#00A88C', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {link.icon}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>{link.label}</span>
              </a>
            ))}
          </AccordionItem>
        </div>

        {/* Centered Logo & Brand Area — Single Line Alignment with Logo Image */}
        <div style={{ padding: '40px 20px 80px', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <img 
              src="/doctorBookletLogo.png" 
              alt="Doctor Booklet Logo" 
              style={{ 
                height: '46px', 
                width: 'auto', 
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 12px rgba(0, 212, 175, 0.3))' 
              }} 
            />
          </Link>
          
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0, fontWeight: 500, letterSpacing: '0.5px', lineHeight: 1.6 }}>
            {copyrightText}
          </p>
        </div>
      </footer>
    )
  }

  // ─── DESKTOP VIEW (GRID) ────────────────────────────────────────────────────
  return (
    <footer style={{ 
      background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', 
      padding: '80px 0 30px', 
      position: 'relative', 
      overflow: 'hidden',
      color: 'white',
      fontFamily: "'Hind Siliguri', sans-serif",
      borderTop: '1px solid rgba(255,255,255,0.05)'
    }}>
      {/* Aesthetic Background Glows */}
      <div style={{ position: 'absolute', bottom: -120, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 1200, height: 300, background: 'radial-gradient(circle, rgba(0,168,140,0.1) 0%, transparent 75%)', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: 400, height: 400, background: 'radial-gradient(circle, rgba(0,201,167,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <Container>
        <Row className="g-5">
          {/* 1. BRAND & STORY */}
          <Col lg={4} className="mb-4 mb-lg-0">
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', marginBottom: 24 }}>
              <img 
                src="/doctorBookletLogo.png" 
                alt="Doctor Booklet Logo" 
                style={{ 
                  height: '52px', 
                  width: 'auto', 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 12px rgba(0, 212, 175, 0.3))' 
                }} 
              />
            </Link>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.7, marginBottom: 32, maxWidth: 340 }}>
              {site.tagline || 'আমরা আধুনিক প্রযুক্তির মাধ্যমে স্বাস্থ্যসেবাকে আপনার দোরগোড়ায় পৌঁছে দিতে প্রতিশ্রুতিবদ্ধ। বিশ্বস্ত ডাক্তার ও উন্নত হাসপাতালের সাথে যুক্ত থাকুন Doctor Booklet-এর মাধ্যমে।'}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              {SOCIAL_LINKS.map((link, i) => (
                <a key={i} href={link.url} style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', transition: '0.3s' }}
                   onMouseEnter={e => { e.currentTarget.style.background = '#00A88C'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(-3px)' }}
                   onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  {link.icon}
                </a>
              ))}
            </div>
          </Col>

          {/* 2. QUICK LINKS */}
          <Col lg={2}>
            <h6 style={{ 
              color: 'white', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 24, 
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span style={{ width: 4, height: 14, background: '#00A88C', borderRadius: 2 }}></span>
              দ্রুত লিঙ্ক
            </h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {QUICK_LINKS.map(link => (
                <Link key={link.label} to={link.to} style={linkStyle}
                  onMouseEnter={e => { e.currentTarget.style.color = '#00C9A7'; e.currentTarget.style.transform = 'translateX(6px)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.transform = 'translateX(0)' }}>
                  <span style={{ color: 'rgba(0,212,175,0.6)' }}>{link.icon}</span> {link.label}
                </Link>
              ))}
            </div>
          </Col>

          {/* 3. FOR PARTNERS */}
          <Col lg={3}>
            <h6 style={{ 
              color: 'white', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 24, 
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span style={{ width: 4, height: 14, background: '#00A88C', borderRadius: 2 }}></span>
              পার্টনারশিপ
            </h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {PARTNER_LINKS.map(link => (
                <Link key={link.label} to={link.to} style={linkStyle}
                  onMouseEnter={e => { e.currentTarget.style.color = '#00C9A7'; e.currentTarget.style.transform = 'translateX(6px)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.transform = 'translateX(0)' }}>
                  <span style={{ color: 'rgba(0,212,175,0.6)' }}>{link.icon}</span> {link.label}
                </Link>
              ))}
            </div>
          </Col>

          {/* 4. LEGAL & CONTACT */}
          <Col lg={3}>
            <h6 style={{ 
              color: 'white', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 24, 
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span style={{ width: 4, height: 14, background: '#00A88C', borderRadius: 2 }}></span>
              আইনি ও সহায়তা
            </h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
              {LEGAL_LINKS.map(link => (
                <Link key={link.label} to={link.to} style={linkStyle}
                  onMouseEnter={e => { e.currentTarget.style.color = '#00C9A7'; e.currentTarget.style.transform = 'translateX(6px)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.transform = 'translateX(0)' }}>
                  <span style={{ color: 'rgba(0,212,175,0.6)' }}>{link.icon}</span> {link.label}
                </Link>
              ))}
            </div>
            
            <div className="d-lg-none" style={{ 
              padding: '24px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', 
              border: '1px solid rgba(255,255,255,0.05)', maxWidth: 320
            }}>
               <h6 style={{ color: 'white', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>যোগাযোগ করুন</h6>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                     <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,168,140,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C9A7' }}>
                        <IconPhone size={18} />
                     </div>
                     <div>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>হেল্পলাইন</p>
                        <p style={{ margin: 0, color: '#00C9A7', fontSize: 15, fontWeight: 900 }}>{site.phone || '017 XXXX XXXX'}</p>
                     </div>
                  </div>

                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                     <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,168,140,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C9A7' }}>
                        <IconMail size={18} />
                     </div>
                     <div>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>ইমেইল</p>
                        <p style={{ margin: 0, color: 'white', fontSize: 14, fontWeight: 700 }}>{site.email || 'info@doctorbooklet.com.bd'}</p>
                     </div>
                  </div>

                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                     <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                        <IconMapPin size={18} />
                     </div>
                     <div>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>ঠিকানা</p>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{site.address || 'বনানী, ঢাকা-১২১৩, বাংলাদেশ'}</p>
                     </div>
                  </div>
               </div>
            </div>
          </Col>
        </Row>

        {/* BOTTOM BAR */}
        <div style={{ 
          marginTop: 60, paddingTop: 30, borderTop: '1px solid rgba(255,255,255,0.05)', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          flexWrap: 'wrap', gap: 20
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0, fontWeight: 600 }}>
            {copyrightText}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link to="/legal" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#00C9A7'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
              ব্যবহারের শর্তাবলী (Terms)
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>•</span>
            <Link to="/legal" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#00C9A7'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
              গোপনীয়তা নীতি (Privacy)
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}

export default Footer


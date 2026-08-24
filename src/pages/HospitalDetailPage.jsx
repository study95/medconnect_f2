import { useState, useMemo, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Row, Col, Nav } from 'react-bootstrap'
import useHospitalDetail from '../hooks/useHospitalDetail'
import useDoctors from '../hooks/useDoctors'
import DoctorCard from '../components/common/DoctorCard'
import HospitalCard from '../components/common/HospitalCard'
import useHospitalRelated from '../hooks/useHospitalRelated'
import { HospitalDetailSkeleton } from '../components/common/Skeletons'
import BreadcrumbHUD from '../components/common/BreadcrumbHUD'
import SeoHead from '../components/common/SeoHead'
import { buildHospitalSchema } from '../utils/schemaBuilder'
import { getMediaUrl } from '../utils/mediaUtils'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../context/ThemeContext'
import { useFavorites } from '../context/FavoritesContext'
import { translateMetadata } from '../utils/translationUtils'
import useShare from '../hooks/useShare'
import ShareModal from '../components/common/ShareModal'
import { 
  IconHeart, IconShare, IconCircleCheckFilled, IconMapPin, IconClock, 
  IconPhone, IconWorld, IconStar, IconUsers, IconBed, 
  IconAmbulance, IconStethoscope, IconNurse, IconMicroscope,
  IconChevronRight, IconMessageQuestion, IconPhoto, IconBriefcase,
  IconCalendarEvent, IconCheck, IconDiscountCheckFilled,
  IconScissors, IconEye, IconSend, IconLayoutGrid, IconActivity
} from '@tabler/icons-react'

const DEMO_BANNER = 'https://images.unsplash.com/photo-1587350859728-1176c2bc003f?q=80&w=2070&auto=format&fit=crop'
const DEMO_LOGO = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=2070&auto=format&fit=crop'

function HospitalDetailPage() {
  const { district, upazila, slug, id } = useParams()
  const navigate = useNavigate()
  const { isHospitalFavorite, toggleFavoriteHospital } = useFavorites()
  const { triggerShare, shareModalOpen, shareData, closeShareModal } = useShare()
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const { theme } = useTheme()

  const { hospital, loading: loadingHeader, error: errorHeader, refetch: refetchHospital } = useHospitalDetail({ district, upazila, slug, id })
  const hospitalIdentifier = hospital?.slug || slug || hospital?.public_id || hospital?.id || id
  const { doctors, loading: loadingDocs } = useDoctors({ hospital_id: hospital?.id || hospital?.public_id || id })
  const { doctors: relatedDoctors, relatedHospitals, loading: loadingRelated } = useHospitalRelated(hospitalIdentifier)
  const displayDoctors = relatedDoctors && relatedDoctors.length > 0 ? relatedDoctors : (doctors || [])

  // Canonical SEO URL redirect: if navigated via legacy numeric ID or bare ULID (/hospitals/:id), update URL to canonical SEO route
  useEffect(() => {
    if (id && hospital?.slug && hospital?.district_slug && hospital?.upazila_slug) {
      navigate(`/hospitals/${hospital.district_slug}/${hospital.upazila_slug}/${hospital.slug}`, { replace: true })
    }
  }, [id, hospital?.slug, hospital?.district_slug, hospital?.upazila_slug, navigate])

  const [activeTab, setActiveTab] = useState('summary')
  const activeTabRef = useRef('summary')
  const tabContainerRef = useRef(null)
  const isProgrammaticScroll = useRef(false)
  const scrollTimeout = useRef(null)

  const handleSetActiveTab = (tab) => {
    if (activeTabRef.current !== tab) {
      activeTabRef.current = tab
      setActiveTab(tab)
    }
  }

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      isProgrammaticScroll.current = true;
      handleSetActiveTab(sectionId);

      const isMobile = window.innerWidth < 992;
      const offset = isMobile ? 148 : 205;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      scrollTimeout.current = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 800);
    }
  };

  useEffect(() => {
    const updateActiveTabOnScroll = () => {
      if (isProgrammaticScroll.current) return;

      const sections = ['summary', 'department', 'doctors', 'facilities', 'gallery', 'reviews', 'contact'];
      const isMobile = window.innerWidth < 992;
      const offset = isMobile ? 150 : 220;

      let currentActive = 'summary';

      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= offset) {
            currentActive = id;
          }
        }
      }

      handleSetActiveTab(currentActive);
    };

    window.addEventListener('scroll', updateActiveTabOnScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateActiveTabOnScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (!activeTab) return;
    const container = tabContainerRef.current;
    if (!container) return;

    const activeEl = container.querySelector('.nav-link.active');
    if (!activeEl) return;

    const containerWidth = container.offsetWidth;
    const activeWidth = activeEl.offsetWidth;
    const activeLeft = activeEl.offsetLeft;

    const targetScrollLeft = activeLeft - (containerWidth / 2) + (activeWidth / 2);

    container.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth'
    });
  }, [activeTab]);

  const canonicalPath = `/hospitals/${hospital?.district_slug || district || 'bangladesh'}/${hospital?.upazila_slug || upazila || 'general'}/${hospital?.slug || slug || hospital?.id}`

  const getHospitalSchemaType = (type) => {
    const t = String(type || '').toLowerCase()
    if (t.includes('clinic') || t.includes('diagnostic')) return 'MedicalClinic'
    if (t.includes('chamber') || t.includes('group')) return 'PhysicianGroup'
    if (t.includes('business') || t.includes('pharmacy')) return 'MedicalBusiness'
    return 'Hospital'
  }

  const structuredSchema = useMemo(() => {
    return buildHospitalSchema(hospital)
  }, [hospital])

  if (loadingHeader) return (
    <div className="page-wrapper" style={{ background: '#F8FAFB', minHeight: '100vh' }}>
       <Container className="py-5">
         <HospitalDetailSkeleton />
       </Container>
    </div>
  )

  if (errorHeader || !hospital) return (
    <div className="text-center py-5" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <SeoHead
        title="হাসপাতাল পাওয়া যায়নি — MedConnect"
        description="অনুরোধকৃত হাসপাতালের তথ্য খুঁজে পাওয়া যায়নি।"
        noIndex={true}
      />
      <div style={{ fontSize: 60, marginBottom: 20 }}>🏥</div>
      <h4 style={{ color: '#1E293B', fontWeight: 700 }}>{t('hospital_not_found')}</h4>
      <p style={{ color: '#64748B', maxWidth: 400 }}>{errorHeader || 'অনুরোধকৃত হাসপাতালের তথ্য খুঁজে পাওয়া যায়নি বা এটি নিষ্ক্রিয় রয়েছে।'}</p>
      <button onClick={() => navigate('/hospitals')} className="btn btn-primary mt-3" style={{ borderRadius: 12, padding: '10px 24px' }}>
        হাসপাতাল তালিকায় ফিরে যান
      </button>
    </div>
  )

  const primaryGreen = '#00B875'
  const textColor = '#1E293B'
  const mutedColor = '#64748B'
  const borderColor = '#E2E8F0'

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFB', minHeight: '100vh', paddingBottom: 60, fontFamily: "'Hind Siliguri', sans-serif" }}>
      <SeoHead
        title={`${hospital?.name || 'হাসপাতাল'} — বিস্তারিত ও ডাক্তার তালিকা | MedConnect`}
        description={`${hospital?.name} - ${hospital?.address || 'বাংলাদেশ'}। বিশেষজ্ঞ ডাক্তারদের তালিকা, ওপিডি সিরিয়াল ও ইমার্জেন্সি সেবা।`}
        canonicalUrl={`${window.location.origin}${canonicalPath}`}
        ogImage={hospital?.photo_url ? getMediaUrl(hospital.photo_url) : (hospital?.banner_url ? getMediaUrl(hospital.banner_url) : DEMO_BANNER)}
        ogType="business.business"
        schemaData={structuredSchema}
      />
      
      {/* 1. Breadcrumbs */}
      <div style={{ padding: '12px 0' }}>
        <Container>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: primaryGreen, cursor: 'pointer' }} onClick={() => navigate('/')}>হোম</span>
            <IconChevronRight size={14} color={mutedColor} />
            <span style={{ color: primaryGreen, cursor: 'pointer' }} onClick={() => navigate('/hospitals')}>হাসপাতাল</span>
            <IconChevronRight size={14} color={mutedColor} />
            {hospital?.district?.name && (
              <>
                <span style={{ color: primaryGreen, cursor: 'pointer' }} onClick={() => navigate(`/hospitals?district_id=${hospital.district.id}`)}>{hospital.district.name}</span>
                <IconChevronRight size={14} color={mutedColor} />
              </>
            )}
            {hospital?.upazila?.name && (
              <>
                <span style={{ color: primaryGreen, cursor: 'pointer' }} onClick={() => navigate(`/hospitals?upazila_id=${hospital.upazila.id}`)}>{hospital.upazila.name}</span>
                <IconChevronRight size={14} color={mutedColor} />
              </>
            )}
            <span style={{ color: mutedColor }}>{hospital?.name}</span>
          </div>
        </Container>
      </div>

      {/* 2. Hero Section — Matching Target Design (Image 1) */}
      <section className="hospital-hero-banner" style={{ position: 'relative', marginBottom: 28, overflow: 'hidden' }}>

        {/* Cover Photo Container */}
        <div
          role="img"
          aria-label={`${hospital?.name} — কভার ফটো`}
          style={{
            position: 'relative',
            width: '100%',
            minHeight: 380,
            height: 'clamp(360px, 38vw, 440px)',
            background: '#0F172A',
            display: 'flex',
            alignItems: 'flex-end'
          }}
        >
          {/* Background Image */}
          <img
            src={hospital?.photo_url || DEMO_BANNER}
            alt={`${hospital?.name} Cover`}
            loading="eager"
            decoding="async"
            onError={(e) => { e.target.src = DEMO_BANNER }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 30%'
            }}
          />

          {/* Contrast Gradient Overlay */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.20) 45%, rgba(0,0,0,0.05) 100%)',
              pointerEvents: 'none'
            }}
          />

          {/* Floating Share Button (Top-Right) */}
          <button
            type="button"
            aria-label="শেয়ার করুন"
            onClick={() => hospital && triggerShare({
              title: hospital.name,
              text: (hospital.address || 'হাসপাতাল') + ' | Doctor Booklet',
              url: window.location.href,
              image: hospital.photo_url || DEMO_BANNER
            })}
            style={{
              position: 'absolute',
              top: 18,
              right: 20,
              zIndex: 15,
              height: 36,
              padding: '0 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: 'white',
              fontWeight: 700,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <IconShare size={15} /> শেয়ার
          </button>

          {/* Hero Bottom Content: Floating Info Card + Action Buttons Row */}
          <div style={{ position: 'relative', zIndex: 10, width: '100%', paddingBottom: 22, paddingTop: 30 }}>
            <Container>
              <div
                className="hero-bottom-row"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  flexWrap: 'wrap',
                  gap: 16
                }}
              >

                {/* ── Floating White Info Card ── */}
                <div
                  className="hero-info-card"
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 22,
                    padding: '20px 24px 16px 24px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
                    flex: '1 1 520px',
                    maxWidth: 640,
                    minWidth: 280
                  }}
                >
                  {/* Card Top Section: Logo + Title + Subtitle + Rating */}
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    
                    {/* Logo Box */}
                    <div
                      style={{
                        width: 88,
                        height: 88,
                        minWidth: 88,
                        borderRadius: 16,
                        background: '#F8FAFC',
                        border: '1.5px solid #E2E8F0',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 6,
                        flexShrink: 0
                      }}
                    >
                      <img
                        src={DEMO_LOGO}
                        alt="Logo"
                        loading="lazy"
                        decoding="async"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>

                    {/* Hospital Name, Verified Badge, Subtitle, Rating */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                        <h1
                          style={{
                            fontSize: 'clamp(18px, 2.3vw, 24px)',
                            fontWeight: 900,
                            color: '#1E293B',
                            margin: 0,
                            lineHeight: 1.2
                          }}
                        >
                          {hospital?.name || 'ABC Hospital'}
                        </h1>
                        <IconDiscountCheckFilled size={21} color="#00A88C" style={{ flexShrink: 0 }} />
                      </div>

                      <p style={{ fontSize: 13.5, fontWeight: 700, color: '#64748B', margin: '3px 0 7px 0' }}>
                        মাল্টিস্পেশালিটি হাসপাতাল
                      </p>

                      {/* Rating & NABH Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <IconStar size={16} color="#F59E0B" fill="#F59E0B" />
                          <span style={{ fontSize: 14.5, fontWeight: 900, color: '#1E293B' }}>4.8</span>
                          <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 600 }}>(৩,৫০০+ রিভিউ)</span>
                        </div>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: '#E6F8F3',
                            color: '#008A74',
                            borderRadius: 8,
                            padding: '3px 9px',
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: '0.2px'
                          }}
                        >
                          <IconCircleCheckFilled size={12} color="#00A88C" />
                          NABH Accredited
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Card Divider Line */}
                  <div style={{ margin: '14px 0 12px 0', borderTop: '1px solid #EEF2F6' }} />

                  {/* Card Bottom Row: Location, Phone, Website (Strictly Single Horizontal Row) */}
                  <div
                    className="hero-contact-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      flexWrap: 'nowrap',
                      overflow: 'hidden',
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: '#334155'
                    }}
                  >
                    {/* Location */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
                      <IconMapPin size={15} color="#00A88C" style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={hospital?.address || 'ধানমণ্ডি, ঢাকা'}>
                        {hospital?.address || 'ধানমণ্ডি, ঢাকা'}
                      </span>
                    </div>

                    {/* Phone */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, whiteSpace: 'nowrap' }}>
                      <IconPhone size={15} color="#00A88C" style={{ flexShrink: 0 }} />
                      <span>{hospital?.phone || '011100111w'}</span>
                    </div>

                    {/* Website */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, whiteSpace: 'nowrap' }}>
                      <IconWorld size={15} color="#00A88C" style={{ flexShrink: 0 }} />
                      <a
                        href={hospital?.url ? (hospital.url.startsWith('http') ? hospital.url : `https://${hospital.url}`) : 'https://www.abchospital.com'}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#334155', textDecoration: 'none', whiteSpace: 'nowrap' }}
                      >
                        {hospital?.url || 'www.abchospital.com'}
                      </a>
                    </div>
                  </div>
                </div>

                {/* ── 4 Action Buttons Row ── */}
                <div
                  className="hero-action-btns"
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    paddingBottom: 2
                  }}
                >
                  {/* 1. Appointment (Matching Website Top Header #00B875) */}
                  <button
                    type="button"
                    aria-label="অ্যাপয়েন্টমেন্ট নিন"
                    onClick={() => navigate(`/doctors?hospital_id=${id}`)}
                    style={{
                      height: 48,
                      padding: '0 22px',
                      borderRadius: 12,
                      border: 'none',
                      background: '#00B875',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: 14,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(0, 184, 117, 0.35)',
                      whiteSpace: 'nowrap',
                      transition: 'transform 0.15s, background 0.15s'
                    }}
                  >
                    <IconCalendarEvent size={19} />
                    অ্যাপয়েন্টমেন্ট নিন
                  </button>

                  {/* 2. Call */}
                  <a
                    href={`tel:${hospital?.phone || ''}`}
                    aria-label="কল করুন"
                    style={{
                      height: 48,
                      padding: '0 18px',
                      borderRadius: 12,
                      border: '1.5px solid #E2E8F0',
                      background: '#FFFFFF',
                      color: '#1E293B',
                      fontWeight: 800,
                      fontSize: 14,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.07)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <IconPhone size={18} color="#00A88C" />
                    কল করুন
                  </a>

                  {/* 3. Direction (Paper Plane Icon) */}
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(hospital?.address || hospital?.name || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="দিক নির্দেশনা"
                    style={{
                      height: 48,
                      padding: '0 18px',
                      borderRadius: 12,
                      border: '1.5px solid #E2E8F0',
                      background: '#FFFFFF',
                      color: '#1E293B',
                      fontWeight: 800,
                      fontSize: 14,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.07)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <IconSend size={18} color="#00A88C" />
                    দিক নির্দেশনা
                  </a>

                  {/* 4. Save */}
                  <button
                    type="button"
                    aria-label={hospital && isHospitalFavorite(hospital.id) ? 'সেভ করা হয়েছে' : 'সেভ করুন'}
                    aria-pressed={!!(hospital && isHospitalFavorite(hospital.id))}
                    onClick={() => hospital && toggleFavoriteHospital(hospital)}
                    style={{
                      height: 48,
                      padding: '0 18px',
                      borderRadius: 12,
                      border: `1.5px solid ${hospital && isHospitalFavorite(hospital.id) ? '#EF4444' : '#E2E8F0'}`,
                      background: hospital && isHospitalFavorite(hospital.id) ? '#FEF2F2' : '#FFFFFF',
                      color: hospital && isHospitalFavorite(hospital.id) ? '#EF4444' : '#1E293B',
                      fontWeight: 800,
                      fontSize: 14,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.07)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <IconHeart
                      size={18}
                      fill={hospital && isHospitalFavorite(hospital.id) ? '#EF4444' : 'none'}
                      color="#EF4444"
                    />
                    {hospital && isHospitalFavorite(hospital.id) ? 'সেভড' : 'সেভ করুন'}
                  </button>
                </div>

              </div>
            </Container>
          </div>
        </div>

      </section>

      {/* 3. Navigation Tabs */}
      <div className="sticky-tab-bar" style={{ background: 'white', borderBottom: `1.5px solid ${borderColor}`, position: 'sticky', zIndex: 990 }}>
        <Container>
          <Nav
            ref={tabContainerRef}
            className="flex-nowrap overflow-auto justify-content-between w-100"
            activeKey={activeTab}
            onSelect={(k) => scrollToSection(k)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 12, padding: 0 }}
          >
            {[
              { key: 'summary',    label: 'ওভারভিউ',     icon: <IconLayoutGrid size={18} /> },
              { key: 'department', label: 'বিভাগ সমূহ',  icon: <IconStethoscope size={18} /> },
              { key: 'facilities', label: 'সুবিধা সমূহ', icon: <IconStar size={18} /> },
              { key: 'doctors',    label: 'ডাক্তার',      icon: <IconUsers size={18} /> },
              { key: 'gallery',    label: 'গ্যালারি',     icon: <IconPhoto size={18} /> },
              { key: 'reviews',    label: 'রিভিউ',        icon: <IconStar size={18} /> },
              { key: 'contact',    label: 'অবস্থান',      icon: <IconMapPin size={18} /> }
            ].map(tab => (
              <Nav.Item key={tab.key} style={{ flex: '1 1 0', display: 'flex', justifyContent: 'center' }}>
                <Nav.Link
                  eventKey={tab.key}
                  style={{
                    padding: '18px 0',
                    fontSize: 14.5,
                    fontWeight: 800,
                    color: activeTab === tab.key ? '#00B875' : mutedColor,
                    borderBottom: `3px solid ${activeTab === tab.key ? '#00B875' : 'transparent'}`,
                    borderRadius: 0,
                    transition: '0.2s',
                    background: 'transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    whiteSpace: 'nowrap',
                    width: '100%'
                  }}
                >
                  {tab.icon} {tab.label}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </Container>
      </div>

      {/* 4. Main Content (LG=8 for Content, LG=4 for Sidebar) */}
      <Container style={{ paddingTop: 40, paddingBottom: 80 }}>
        <Row className="g-5">
          {/* Main Content Column */}
          <Col lg={8}>
            <div className="d-flex flex-column" style={{ gap: '60px' }}>
              
              {/* About Section */}
              <div id="summary" className="scroll-section">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 style={{ fontSize: 22, fontWeight: 950, color: textColor, margin: 0 }}>হাসপাতাল সম্পর্কে</h3>
                </div>
                <p style={{ color: '#334155', fontSize: 16, lineHeight: 1.8, margin: 0, textAlign: 'justify' }}>
                  {hospital?.bio || 'ল্যাবএইড হাসপাতাল, ধানমণ্ডি বাংলাদেশের একটি শীর্ষস্থানীয় ও আধুনিক মাল্টিস্পেশালিটি হাসপাতাল। ১৯৮৮ সালে প্রতিষ্ঠিত এই হাসপাতালটি দীর্ঘ সময় ধরে উন্নত চিকিৎসা সেবা প্রদান করে আসছে। এখানে অভিজ্ঞ ডাক্তার, আধুনিক চিকিৎসা সরঞ্জাম ও রোগীদের মানসম্মত পরিবেশ নিশ্চিত করা হয়।'}
                </p>
              </div>

              <div style={{ height: '1px', background: borderColor }} />

              {/* Departments Section */}
              <div id="department" className="scroll-section">
                <h3 style={{ fontSize: 22, fontWeight: 950, color: textColor, marginBottom: 24 }}>আমাদের ডিপার্টমেন্ট সমূহ</h3>
                <Row className="g-3">
                  {[
                    { name: 'কার্ডিওলজি', sub: 'হৃদরোগ বিভাগ', icon: <IconHeart size={28} /> },
                    { name: 'নিউরোলজি', sub: 'স্নায়ুরোগ বিভাগ', icon: <IconActivity size={28} /> },
                    { name: 'গ্যাস্ট্রোএন্টারোলজি', sub: 'হজম ও লিভার বিভাগ', icon: <IconActivity size={28} /> },
                    { name: 'অর্থোপেডিকস', sub: 'হাড় ও জয়েন্ট বিভাগ', icon: <IconActivity size={28} /> },
                    { name: 'ইউরোলজি', sub: 'মূত্র ও কিডনি বিভাগ', icon: <IconScissors size={28} /> },
                    { name: 'গাইনি ও অবস', sub: 'নারী ও প্রসূতি বিভাগ', icon: <IconUsers size={28} /> },
                    { name: 'চক্ষু বিভাগ', sub: 'চোখের সেবা', icon: <IconEye size={28} /> },
                    { name: 'ইএনটি', sub: 'কান, নাক, গলা', icon: <IconStethoscope size={28} /> }
                  ].map((dept, idx) => (
                    <Col key={idx} xs={6} md={4} lg={3}>
                      <div style={{ 
                        padding: '24px 20px', borderRadius: 16, border: `1.5px solid #F1F5F9`, 
                        background: 'white', color: textColor, height: '100%',
                        display: 'flex', flexDirection: 'column', gap: 12, transition: '0.2s', cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                      }} onMouseEnter={e => e.currentTarget.style.borderColor = primaryGreen} onMouseLeave={e => e.currentTarget.style.borderColor = '#F1F5F9'}>
                        <div style={{ color: primaryGreen }}>{dept.icon}</div>
                        <div>
                          <p style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>{dept.name}</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: mutedColor, margin: 0 }}>{dept.sub}</p>
                        </div>
                      </div>
                    </Col>
                  ))}
                  <Col xs={6} md={4} lg={3}>
                    <div style={{ padding: '24px 20px', borderRadius: 16, border: `1.5px solid ${borderColor}`, background: '#F8FAFC', color: mutedColor, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer' }}>
                      <IconChevronRight size={20} /> <span style={{ fontWeight: 900, fontSize: 14 }}>আরও দেখুন</span>
                    </div>
                  </Col>
                </Row>
              </div>

              <div style={{ height: '1px', background: borderColor }} />

              {/* Popular Doctors Section */}
              <div id="doctors" className="scroll-section">
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                  <div>
                    <h3 style={{ fontSize: 22, fontWeight: 950, color: textColor, margin: '0 0 4px 0' }}>জনপ্রিয় ডাক্তার সমূহ</h3>
                    <p style={{ fontSize: 13, color: mutedColor, margin: 0, fontWeight: 600 }}>এই হাসপাতালে কর্মরত বিশেষজ্ঞ চিকিৎসকবৃন্দ</p>
                  </div>
                  {hospital?.id && (
                    <button
                      type="button"
                      onClick={() => navigate(`/doctors?hospital_id=${hospital.id}`)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: primaryGreen,
                        fontWeight: 800,
                        fontSize: 14,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer'
                      }}
                    >
                      সব ডাক্তার দেখুন <IconChevronRight size={16} />
                    </button>
                  )}
                </div>

                {displayDoctors && displayDoctors.length > 0 ? (
                  <Row className="g-3">
                    {displayDoctors.slice(0, 4).map((doc, idx) => (
                      <Col key={doc.id || idx} xs={12} sm={6}>
                        <DoctorCard doctor={doc} viewMode="grid" />
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <div className="text-center py-4 bg-white rounded-4 border">
                    <p style={{ color: mutedColor, margin: 0, fontWeight: 600 }}>এই মুহূর্তে কোনো ডাক্তারের তথ্য পাওয়া যায়নি</p>
                  </div>
                )}
              </div>

              <div style={{ height: '1px', background: borderColor }} />

              {/* Facilities Section */}
              <div id="facilities" className="scroll-section">
                <h3 style={{ fontSize: 22, fontWeight: 950, color: textColor, marginBottom: 24 }}>হাসপাতালের সুবিধাসমূহ</h3>
                <Row className="g-4">
                  {[
                    { icon: <IconAmbulance size={28} />, name: '২৪/৭ অ্যাম্বুলেন্স' },
                    { icon: <IconBed size={28} />, name: 'আইসিইউ (ICU)' },
                    { icon: <IconMicroscope size={28} />, name: 'আধুনিক প্যাথলজি' },
                    { icon: <IconActivity size={28} />, name: 'জরুরী বিভাগ (Emergency)' },
                    { icon: <IconStethoscope size={28} />, name: 'বিশেষজ্ঞ ডাক্তার' },
                    { icon: <IconCheck size={28} />, name: 'ফার্মেসি' },
                  ].map((facility, idx) => (
                    <Col key={idx} xs={6} md={4}>
                      <div style={{ padding: '20px', borderRadius: 16, border: `1.5px solid #F1F5F9`, background: 'white', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ color: '#059669' }}>{facility.icon}</div>
                        <p style={{ fontSize: 16, fontWeight: 800, color: textColor, margin: 0 }}>{facility.name}</p>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>

              <div style={{ height: '1px', background: borderColor }} />

              {/* Gallery Section */}
              <div id="gallery" className="scroll-section">
                <h3 style={{ fontSize: 22, fontWeight: 950, color: textColor, marginBottom: 24 }}>গ্যালারি</h3>
                <Row className="g-3">
                  {[
                    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1453&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?q=80&w=1470&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=1528&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=1470&auto=format&fit=crop'
                  ].map((img, idx) => (
                    <Col key={idx} xs={6} md={6}>
                      <img src={img} alt="Gallery" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 16, border: `1px solid ${borderColor}` }} />
                    </Col>
                  ))}
                </Row>
              </div>

              <div style={{ height: '1px', background: borderColor }} />

              {/* Reviews Section */}
              <div id="reviews" className="scroll-section">
                <h3 style={{ fontSize: 22, fontWeight: 950, color: textColor, marginBottom: 24 }}>রোগী রিভিউ</h3>
                <div style={{ background: 'white', borderRadius: 24, padding: 32, border: `1px solid ${borderColor}` }}>
                  <div className="d-flex align-items-center gap-4 mb-4 pb-4 border-bottom">
                    <div style={{ fontSize: 48, fontWeight: 950, color: textColor, lineHeight: 1 }}>4.8</div>
                    <div>
                      <div className="d-flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map(s => <IconStar key={s} size={22} color="#F59E0B" fill="#F59E0B" />)}
                      </div>
                      <p style={{ fontSize: 15, color: mutedColor, margin: 0, fontWeight: 700 }}>১,২৫৬ জন রোগীর মতামতের ভিত্তিতে</p>
                    </div>
                  </div>
                  
                  <div className="d-flex flex-column gap-4">
                    {[1, 2].map((review) => (
                      <div key={review} className="d-flex gap-3">
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#334155', flexShrink: 0 }}>
                          R
                        </div>
                        <div>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <h5 style={{ fontSize: 16, fontWeight: 900, color: textColor, margin: 0 }}>রাকিবুল ইসলাম</h5>
                            <span style={{ fontSize: 13, color: mutedColor, fontWeight: 600 }}>২ দিন আগে</span>
                          </div>
                          <div className="d-flex gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map(s => <IconStar key={s} size={14} color="#F59E0B" fill="#F59E0B" />)}
                          </div>
                          <p style={{ fontSize: 15, color: '#475569', margin: 0, lineHeight: 1.6 }}>হাসপাতালের পরিবেশ খুব সুন্দর এবং পরিষ্কার। ডাক্তার এবং নার্সদের ব্যবহার অনেক ভালো ছিল। সার্ভিস নিয়ে আমি সন্তুষ্ট।</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button style={{ width: '100%', marginTop: 24, padding: '12px', borderRadius: 12, border: `1px solid ${borderColor}`, background: '#F8FAFC', color: textColor, fontWeight: 800, fontSize: 15 }}>আরও রিভিউ দেখুন</button>
                </div>
              </div>

              <div style={{ height: '1px', background: borderColor }} />

              {/* Contact Section */}
              <div id="contact" className="scroll-section">
                <h3 style={{ fontSize: 22, fontWeight: 950, color: textColor, marginBottom: 24 }}>যোগাযোগের ঠিকানা</h3>
                <div style={{ background: 'white', borderRadius: 24, padding: 32, border: `1px solid ${borderColor}` }}>
                  <div className="d-flex flex-column gap-4">
                    {[
                      { icon: <IconPhone size={24} />, title: 'ফোন নাম্বার', value: hospital?.phone || '+880 2 48119911-15' },
                      { icon: <IconMessageQuestion size={24} />, title: 'ইমেইল এড্রেস', value: hospital?.email || 'info@labaidhospital.com' },
                      { icon: <IconWorld size={24} />, title: 'ওয়েবসাইট', value: hospital?.url || 'www.labaidhospital.com' },
                      { icon: <IconMapPin size={24} />, title: 'লোকেশন', value: hospital?.address || 'ধানমণ্ডি, ঢাকা - ১২০৫, বাংলাদেশ' }
                    ].map((contact, idx) => (
                      <div key={idx} className="d-flex align-items-start gap-3">
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F0FDF4', color: primaryGreen, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {contact.icon}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 800, color: mutedColor, margin: 0, marginBottom: 2 }}>{contact.title}</p>
                          <p style={{ fontSize: 16, fontWeight: 900, color: textColor, margin: 0 }}>{contact.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </Col>

          {/* Sidebar Column */}
          <Col lg={4}>
            <div className="sticky-sidebar d-flex flex-column gap-4">
              
              {/* Info Sidebar Card */}
              <div style={{ background: '#F8FAFC', borderRadius: 24, padding: 32, border: `1.5px solid ${borderColor}` }}>
                <h3 style={{ fontSize: 20, fontWeight: 950, color: textColor, marginBottom: 24 }}>তথ্য এক নজরে</h3>
                <div className="d-flex flex-column gap-3">
                  {[
                    { label: 'প্রতিষ্ঠাবর্ষ', value: hospital?.established_year || '১৯৯৮' },
                    { label: 'প্রতিষ্ঠাতা', value: 'ল্যাবএইড গ্রুপ' },
                    { label: 'হাসপাতালের ধরন', value: 'মাল্টিস্পেশালিটি' },
                    { label: 'বেড সংখ্যা', value: '২৫০+' },
                    { label: 'ICU বেড', value: '৪০+' },
                    { label: 'অপারেশন থিয়েটার', value: '১০+' },
                    { label: 'ডাক্তারের সংখ্যা', value: '১৫০+' },
                    { label: 'নার্স সংখ্যা', value: '৩০০+' },
                    { label: 'অবস্থান', value: 'ধানমণ্ডি, ঢাকা' }
                  ].map((info, idx) => (
                    <div key={idx} className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#334155' }} />
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#475569', margin: 0 }}>{info.label}:</p>
                      </div>
                      <p style={{ fontSize: 15, fontWeight: 900, color: textColor, margin: 0 }}>{info.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Sidebar Card */}
              <div style={{ background: 'white', borderRadius: 24, padding: 32, border: `1px solid ${borderColor}` }}>
                <h3 style={{ fontSize: 20, fontWeight: 950, color: textColor, marginBottom: 24 }}>যোগাযোগ করুন</h3>
                <div className="d-flex flex-column gap-4">
                  {[
                    { icon: <IconPhone size={22} />, value: hospital?.phone || '+880 2 48119911-15' },
                    { icon: <IconMessageQuestion size={22} />, value: hospital?.email || 'info@labaidhospital.com' },
                    { icon: <IconWorld size={22} />, value: hospital?.url || 'www.labaidhospital.com' },
                    { icon: <IconMapPin size={22} />, value: 'ধানমণ্ডি, ঢাকা - ১২০৫' }
                  ].map((contact, idx) => (
                    <div key={idx} className="d-flex align-items-center gap-3">
                      <div style={{ color: primaryGreen }}>{contact.icon}</div>
                      <p style={{ fontSize: 15, fontWeight: 800, color: textColor, margin: 0 }}>{contact.value}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </Col>
        </Row>
      </Container>

      {/* 5. Related Hospitals Section (Internal Linking SEO Discovery) */}
      {relatedHospitals && relatedHospitals.length > 0 && (
        <Container className="pb-4">
          <div className="pt-4 border-top">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 950, color: textColor, margin: '0 0 4px 0' }}>
                  সম্পর্কিত অন্যান্য হাসপাতাল
                </h3>
                <p style={{ fontSize: 13, color: mutedColor, margin: 0, fontWeight: 600 }}>
                  {hospital?.district?.name || 'এই এলাকার'} অন্যান্য উন্নত চিকিৎসাকেন্দ্র ও হাসপাতাল
                </p>
              </div>
              {hospital?.district?.slug && (
                <button
                  type="button"
                  onClick={() => navigate(`/hospitals/${hospital.district_slug || hospital.district?.slug}`)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: primaryGreen,
                    fontWeight: 800,
                    fontSize: 14,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer'
                  }}
                >
                  সব হাসপাতাল <IconChevronRight size={16} />
                </button>
              )}
            </div>

            <Row className="g-3">
              {relatedHospitals.slice(0, 3).map((hosp, idx) => (
                <Col key={hosp.id || idx} xs={12} md={4}>
                  <HospitalCard hospital={hosp} viewMode="grid" />
                </Col>
              ))}
            </Row>
          </div>
        </Container>
      )}

      {/* 6. Bottom Banner CTA */}
      <Container className="pb-5">
        <div style={{ background: '#F0FDF4', borderRadius: 24, padding: '32px 48px', border: '1.5px solid #DCFCE7', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
          <div className="d-flex align-items-center gap-4">
            <div style={{ width: 64, height: 64, borderRadius: 16, background: '#DCFCE7', color: primaryGreen, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconCalendarEvent size={36} /></div>
            <div>
              <h4 style={{ fontSize: 24, fontWeight: 950, color: textColor, marginBottom: 4 }}>সহজে অ্যাপয়েন্টমেন্ট নিন</h4>
              <p style={{ fontSize: 16, color: mutedColor, margin: 0, fontWeight: 800 }}>দ্রুত ও সহজে আপনার পছন্দের ডাক্তার এর সিরিয়াল বুক করুন</p>
            </div>
          </div>
          <button onClick={() => navigate(`/doctors?hospital_id=${id}`)} style={{ padding: '14px 40px', borderRadius: 12, border: 'none', background: primaryGreen, color: 'white', fontWeight: 950, fontSize: 16, marginLeft: 'auto' }}>অ্যাপয়েন্টমেন্ট নিন</button>
        </div>
      </Container>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap');
        .nav-link:hover { color: #00B875 !important; }

        /* Hide horizontal scrollbar for tab navigation container */
        .sticky-tab-bar .nav::-webkit-scrollbar {
          display: none !important;
        }
        .sticky-tab-bar .nav {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }

        .sticky-tab-bar {
          top: var(--header-height);
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          transition: top 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (max-width: 767px) {
          .hero-bottom-row { flex-direction: column !important; align-items: stretch !important; }
          .hero-action-btns { justify-content: center !important; }
        }
        @media (min-width: 992px) {
          .sticky-sidebar {
            position: sticky;
            top: 180px;
            align-self: start;
          }
        }
      ` }} />

      <ShareModal show={shareModalOpen} onHide={closeShareModal} shareData={shareData} />
    </div>
  )
}

export default HospitalDetailPage

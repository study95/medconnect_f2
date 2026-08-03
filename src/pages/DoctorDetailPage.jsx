import { useState, useMemo, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Row, Col, Nav } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../context/ThemeContext'
import { DoctorDetailSkeleton } from '../components/common/Skeletons'
import useDoctorDetail from '../hooks/useDoctorDetail'
import { useFavorites } from '../context/FavoritesContext'
import useShare from '../hooks/useShare'
import ShareModal from '../components/common/ShareModal'

import ErrorBoundary from '../components/common/ErrorBoundary'
import { translateMetadata } from '../utils/translationUtils'
import { 
  IconHeart, IconShare, IconMapPin, IconClock, 
  IconBriefcase, IconCertificate, IconStar, 
  IconSchool, IconUsers, IconAward, IconCheck, IconChevronRight,
  IconHistory, IconDiscountCheckFilled, IconCalendarEvent,
  IconLock, IconSend, IconUserCheck
} from '@tabler/icons-react'

const DEMO_AVATAR = 'https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg'

function DoctorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const { theme } = useTheme()
  const { user, isLoggedIn } = useAuth()

  const { doctor, chambers, loading, error, refetch } = useDoctorDetail(id)
  const { isDoctorFavorite, toggleFavoriteDoctor } = useFavorites()
  const { triggerShare, shareModalOpen, shareData, closeShareModal } = useShare()
  const [activeTab, setActiveTab] = useState('summary')
  const activeTabRef = useRef('summary')
  const tabContainerRef = useRef(null)
  const isProgrammaticScroll = useRef(false)
  const scrollTimeout = useRef(null)

  const [reviews, setReviews] = useState([
    {
      id: 1,
      userName: 'আরিফুর রহমান',
      rating: 5,
      date: '২ দিন আগে',
      comment: 'ডাক্তার সাহেব অত্যন্ত ধৈর্য্য সহকারে কথা শোনেন এবং বিস্তারিত বুঝিয়ে দেন। প্রেসক্রিপশনও অনেক ভালো লেগেছে।',
      verified: true
    },
    {
      id: 2,
      userName: 'মোছাঃ নাসরিন সুলতানা',
      rating: 5,
      date: '১ সপ্তাহ আগে',
      comment: 'উনার চিকিৎসায় আমার আম্মার রক্তচাপ এখন নিয়ন্ত্রণে আছে। নিয়মিত ফলোআপের ব্যবস্থা প্রশংসনীয়।',
      verified: true
    },
    {
      id: 3,
      userName: 'তানভীর আহমেদ',
      rating: 4,
      date: '২ সপ্তাহ আগে',
      comment: 'চেম্বারের পরিবেশ সুন্দর এবং সিরিয়াল ব্যবস্থাপনা ভালো ছিল। ডাক্তার সাহেবের আচরণ খুবই মার্জিত।',
      verified: true
    }
  ])

  const [newRating, setNewRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  const handleReviewSubmit = (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const newRev = {
      id: Date.now(),
      userName: user?.name || user?.full_name || 'বেনামী রোগী',
      rating: newRating,
      date: 'আজ',
      comment: newComment.trim(),
      verified: true
    }

    setReviews([newRev, ...reviews])
    setNewComment('')
    setNewRating(5)
    setReviewSubmitted(true)
    setTimeout(() => setReviewSubmitted(false), 4000)
  }

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 5.0
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    return (sum / reviews.length).toFixed(1)
  }, [reviews])

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

      const sections = ['summary', 'chambers', 'education', 'experience', 'reviews'];
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

  const handleBook = (chamberId = null) => {
    let path = `/book-appointment/${id}`
    if (chamberId && typeof chamberId === 'string') path += `?chamberId=${chamberId}`
    navigate(path)
  }

  const sortedChambers = useMemo(() => {
    const DAY_ORDER = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    return [...chambers].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day))
  }, [chambers])

  const lowestFee = useMemo(() => {
    return sortedChambers.length > 0 ? Math.min(...sortedChambers.map(c => Number(c.fee) || 0)) : (doctor?.fee || 0)
  }, [sortedChambers, doctor])

  const formatTimeBn = (timeStr) => {
    if (!timeStr) return '';
    try {
      let timeUpper = timeStr.toUpperCase();
      let isPM = timeUpper.includes('PM');
      let isAM = timeUpper.includes('AM');
      let cleanStr = timeStr.replace(/[a-zA-Z\s]/g, '').trim();
      let parts = cleanStr.split(':');
      let h = parseInt(parts[0], 10);
      let m = parseInt(parts[1] || '0', 10);
      
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;

      let periodBn = '';
      if (h >= 6 && h < 12) periodBn = 'সকাল';
      else if (h >= 12 && h < 15) periodBn = 'দুপুর';
      else if (h >= 15 && h < 18) periodBn = 'বিকাল';
      else if (h >= 18 && h < 20) periodBn = 'সন্ধ্যা';
      else periodBn = 'রাত';
      
      let h12 = h % 12 || 12;
      let timeEn = `${h12}:${String(m).padStart(2, '0')}`;
      
      const enToBn = {'0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯'};
      let timeBn = timeEn.replace(/\d/g, d => enToBn[d]);
      
      return `${periodBn} ${timeBn}`;
    } catch {
      return timeStr;
    }
  }

  if (loading) return (
    <div className="page-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh' }}>
       <Container className="py-5">
         <DoctorDetailSkeleton />
       </Container>
    </div>
  )

  if (error || !doctor) return (
    <div className="page-wrapper">
      <Container className="py-5 text-center">
        <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
        <h4 style={{ fontWeight: 700, marginBottom: 8, color: '#1E293B' }}>{t('doctor_not_found')}</h4>
        <p style={{ color: '#64748B', marginBottom: 24 }}>{error}</p>
        <div className="d-flex justify-content-center gap-3">
          <button onClick={() => refetch()} style={{ background: '#006B52', color: 'white', border: 'none', borderRadius: 10, padding: '10px 28px', fontWeight: 600, cursor: 'pointer' }}>{t('try_again')}</button>
          <button onClick={() => navigate('/doctors')} style={{ background: 'transparent', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 28px', fontWeight: 600, cursor: 'pointer', color: '#1E293B' }}>{t('back_to_doctors')}</button>
        </div>
      </Container>
    </div>
  )

  const specialtyName = translateMetadata(doctor?.specialty?.name || doctor?.specialty_name || t('general_physician'), language, t)

  // Design Tokens (STRICT Image 1 Match)
  const primaryGreen = '#006B52'
  const textColor = '#1E293B'
  const mutedColor = '#64748B'
  const borderColor = '#E2E8F0'

  return (
    <div className="page-wrapper" style={{ background: '#F9FAFB', minHeight: '100vh', fontFamily: "'Hind Siliguri', sans-serif" }}>
      
      {/* 1. Breadcrumbs */}
      <div style={{ padding: '12px 0' }}>
        <Container>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: '#006B52', cursor: 'pointer' }} onClick={() => navigate('/')}>হোম</span>
            <IconChevronRight size={14} color={mutedColor} />
            <span style={{ color: '#006B52', cursor: 'pointer' }} onClick={() => navigate('/doctors')}>ডাক্তার</span>
            <IconChevronRight size={14} color={mutedColor} />
            <span style={{ color: mutedColor }}>{doctor?.name}</span>
          </div>
        </Container>
      </div>

      {/* 2. Main Header Section */}
      <section style={{ marginBottom: 40 }}>
        <Container>
          <div style={{ background: 'white', borderRadius: 24, border: `1px solid ${borderColor}`, padding: '32px' }}>
            <Row className="g-4">
              {/* Doctor Image Column */}
              <Col md={4} lg={3}>
                <div style={{ position: 'relative', width: '100%', maxWidth: 260, margin: '0 auto' }}>
                  <div style={{ border: `1px solid ${borderColor}`, borderRadius: 20, overflow: 'hidden' }}>
                    <img 
                      src={doctor?.photo || DEMO_AVATAR} 
                      alt={doctor?.name}
                      style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ 
                    position: 'absolute', bottom: 0, left: 0, right: 0, 
                    background: primaryGreen, color: 'white', 
                    padding: '10px', borderRadius: '0 0 20px 20px', fontSize: 13, 
                    fontWeight: 900, display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', gap: 8
                  }}>
                    <IconDiscountCheckFilled size={18} /> ভেরিফাইড ডাক্তার
                  </div>
                </div>
              </Col>
              
              {/* Doctor Info Column */}
              <Col md={8} lg={9}>
                <div className="h-100 d-flex flex-column">
                  
                  {/* Name and Action Buttons Row */}
                  <div className="d-flex flex-column flex-xl-row justify-content-between align-items-start gap-4 mb-3">
                    <div style={{ flex: 1 }}>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: 950, color: textColor, margin: 0, lineHeight: 1.2 }}>
                          {doctor?.name}
                        </h1>
                        <IconDiscountCheckFilled size={24} color="#10B981" style={{ flexShrink: 0 }} />
                      </div>
                      
                      <p style={{ fontSize: 18, fontWeight: 700, color: '#334155', marginBottom: 12 }}>
                        {specialtyName} ({translateMetadata(doctor?.specialty_bn, language, t) || 'হৃদরোগ বিশেষজ্ঞ'})
                      </p>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <button 
                        onClick={() => doctor && toggleFavoriteDoctor(doctor)}
                        className="btn-premium-outline" 
                        style={{ 
                          height: 46, 
                          padding: '0 20px', 
                          borderRadius: 10, 
                          border: `1px solid ${doctor && isDoctorFavorite(doctor.id) ? '#EF4444' : borderColor}`, 
                          background: doctor && isDoctorFavorite(doctor.id) ? '#FEF2F2' : 'white', 
                          color: doctor && isDoctorFavorite(doctor.id) ? '#EF4444' : textColor, 
                          fontWeight: 800, 
                          fontSize: 14, 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 8, 
                          whiteSpace: 'nowrap' 
                        }}
                      >
                        <IconHeart 
                          size={18} 
                          fill={doctor && isDoctorFavorite(doctor.id) ? '#EF4444' : 'none'} 
                          color={doctor && isDoctorFavorite(doctor.id) ? '#EF4444' : textColor} 
                        /> 
                        {doctor && isDoctorFavorite(doctor.id) ? 'সেভড' : 'সেভ'}
                      </button>
                      <button 
                        onClick={() => doctor && triggerShare({
                          title: doctor.name,
                          text: `${specialtyName} | Doctor Booklet`,
                          url: window.location.href,
                          image: doctor.photo || DEMO_AVATAR
                        })}
                        className="btn-premium-outline" 
                        style={{ height: 46, padding: '0 20px', borderRadius: 10, border: `1px solid ${borderColor}`, background: 'white', color: textColor, fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', cursor: 'pointer' }}
                      >
                        <IconShare size={18} /> শেয়ার
                      </button>
                      <button 
                        className="btn-premium"
                        onClick={() => handleBook()}
                        style={{ height: 46, padding: '0 28px', borderRadius: 10, border: 'none', background: primaryGreen, color: 'white', fontWeight: 950, fontSize: 15, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,107,82,0.15)' }}
                      >
                        অ্যাপয়েন্টমেন্ট নিন
                      </button>
                    </div>
                  </div>

                  {/* Basic Metadata List */}
                  <div className="d-flex flex-column gap-2 mb-4">
                    <div className="d-flex align-items-center gap-2" style={{ color: '#475569', fontSize: 15, fontWeight: 700 }}>
                      <IconSchool size={20} color={mutedColor} /> {doctor?.degree}
                    </div>
                    <div className="d-flex align-items-center gap-2" style={{ color: '#475569', fontSize: 15, fontWeight: 700 }}>
                      <IconHistory size={20} color={mutedColor} /> {doctor?.experience} বছরের অভিজ্ঞতা
                    </div>
                  </div>

                  {/* Special Skills in Header */}
                  <div className="mb-4">
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>বিশেষ দক্ষতা:</p>
                    <div className="d-flex flex-wrap gap-2">
                      {[
                        'হার্ট ব্লক চিকিৎসা', 'উচ্চ রক্তচাপ', 'করোনারি আর্টারি ডিজিজ (CAD)',
                        'হার্ট ফেইলিওর', 'ইসিজি', 'ইকোকার্ডিওগ্রাফি', 'ট্রেডমিল টেস্ট', 'পেসমেকার ফলোআপ'
                      ].map((skill, idx) => (
                        <div key={idx} style={{ 
                          padding: '6px 14px', borderRadius: 8, border: `1px solid #DCFCE7`, 
                          background: '#F0FDF4', color: '#065F46', fontSize: 13, fontWeight: 800,
                          display: 'flex', alignItems: 'center', gap: 6
                        }}>
                          <IconCheck size={14} /> {skill}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rating & Patients Summary */}
                  <div className="d-flex align-items-center gap-4 mb-4">
                    <div className="d-flex align-items-center gap-2">
                      <IconStar size={22} color="#F59E0B" fill="#F59E0B" />
                      <span style={{ fontSize: 18, fontWeight: 950, color: textColor }}>{averageRating}</span>
                      <span style={{ fontSize: 14, color: mutedColor, fontWeight: 700 }}>({reviews.length} রিভিউ)</span>
                    </div>
                    <div style={{ width: 1.5, height: 18, background: '#E2E8F0' }} />
                    <div className="d-flex align-items-center gap-2" style={{ color: '#334155', fontWeight: 700 }}>
                      <IconUsers size={20} color={mutedColor} />
                      <span style={{ fontSize: 15 }}>রোগী দেখিয়েছেন: ৫,২০০+</span>
                    </div>
                  </div>

                  {/* Quick Info Bar - REFINED FOR WRAPPING */}
                  <div style={{ marginTop: 'auto', paddingTop: 28, borderTop: `1.5px solid #F1F5F9` }}>
                    <Row className="g-4">
                      {[
                        { icon: <IconClock size={24} />, label: 'চেম্বার ফি', value: `৳ ${lowestFee}` },
                        { icon: <IconClock size={24} />, label: 'রোগী দেখার সময়', value: 'প্রতিদিন (শনি - বৃহস্পতিবার)' },
                        { icon: <IconHistory size={24} />, label: 'অভিজ্ঞতা', value: `${doctor?.experience} বছর` },
                        { icon: <IconCertificate size={24} />, label: 'সার্টিফিকেট', value: 'বাংলাদেশ মেডিকেল কাউন্সিল' }
                      ].map((item, idx) => (
                        <Col key={idx} xs={6} lg={3}>
                          <div className="d-flex align-items-start gap-3 h-100" style={{ paddingRight: 10, borderRight: (idx % 2 === 0 && window.innerWidth < 992) || (idx < 3 && window.innerWidth >= 992) ? `1.5px solid #F1F5F9` : 'none' }}>
                            <div style={{ color: '#059669', flexShrink: 0 }}>{item.icon}</div>
                            <div>
                              <p style={{ fontSize: 11, fontWeight: 800, color: mutedColor, margin: 0, textTransform: 'uppercase', marginBottom: 2, whiteSpace: 'nowrap' }}>{item.label}</p>
                              <p style={{ fontSize: 14, fontWeight: 950, color: textColor, margin: 0, lineHeight: 1.4 }}>{item.value}</p>
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </section>

      {/* 3. Tabs Navigation */}
      <div className="sticky-tab-bar" style={{ background: 'white', borderBottom: `1.5px solid ${borderColor}`, position: 'sticky', zIndex: 990 }}>
        <Container>
          <Nav ref={tabContainerRef} className="flex-nowrap overflow-auto" activeKey={activeTab} onSelect={(k) => scrollToSection(k)} style={{ gap: 40, padding: '0' }}>
            {[
              { key: 'summary', label: 'সারসংক্ষেপ', icon: <IconBriefcase size={20} /> },
              { key: 'chambers', label: 'চেম্বার ও সময়সূচি', icon: <IconMapPin size={20} /> },
              { key: 'education', label: 'শিক্ষাগত যোগ্যতা', icon: <IconSchool size={20} /> },
              { key: 'experience', label: 'অভিজ্ঞতা', icon: <IconAward size={20} /> },
              { key: 'reviews', label: `রিভিউ (${reviews.length})`, icon: <IconStar size={20} /> }
            ].map(tab => (
              <Nav.Item key={tab.key}>
                <Nav.Link 
                  eventKey={tab.key}
                  style={{ 
                    padding: '20px 0', fontSize: 15, fontWeight: 900,
                    color: activeTab === tab.key ? '#059669' : mutedColor,
                    borderBottom: `3px solid ${activeTab === tab.key ? '#059669' : 'transparent'}`,
                    borderRadius: 0, transition: '0.2s', background: 'transparent',
                    display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap'
                  }}
                >
                  {tab.icon} {tab.label}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </Container>
      </div>

      {/* 4. Content Sections */}
      <Container style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div className="d-flex flex-column" style={{ gap: '60px' }}>
          
          {/* Summary Section */}
          <div id="summary" className="scroll-section">
            <Row className="g-5">
              <Col lg={8}>
                <div className="d-flex flex-column gap-5">
                  <div>
                    <h3 style={{ fontSize: 22, fontWeight: 950, color: textColor, marginBottom: 20 }}>আমার সম্পর্কে</h3>
                    <p style={{ color: '#334155', fontSize: 17, lineHeight: 1.8, margin: 0, textAlign: 'justify' }}>
                      {doctor?.bio || 'ডা. মোঃ রাকিবুল হাসান একজন অভিজ্ঞ কার্ডিওলজিস্ট। তিনি হৃদরোগ, হাইপারটেনশন, করোনারি আর্টারি ডিজিজ এবং অন্যান্য হৃদরোগের চিকিৎসায় বিশেষ দক্ষতা অর্জন করেছেন।'}
                    </p>
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          <div style={{ height: '1px', background: borderColor }} />

          {/* Chambers Section */}
          <div id="chambers" className="scroll-section">
            <h3 style={{ fontSize: 22, fontWeight: 950, color: textColor, marginBottom: 24 }}>চেম্বার ও সময়সূচি</h3>
            <Row className="g-4">
              {sortedChambers.map((chamber) => (
                <Col key={chamber.id} md={6} lg={4}>
                  <div 
                    onClick={() => handleBook(chamber.id)}
                    className="premium-card"
                    style={{ padding: 28, borderRadius: 24, background: 'white', border: `1.5px solid ${borderColor}`, height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-start gap-3 mb-4">
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F0FDF4', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <IconMapPin size={24} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: 18, fontWeight: 950, color: textColor, marginBottom: 4 }}>{chamber.hospital?.name || chamber.hospital_name || 'চেম্বার'}</h4>
                        <p style={{ fontSize: 14, color: mutedColor, margin: 0, fontWeight: 600 }}>{chamber.address || chamber.hospital?.address || 'ঠিকানা দেওয়া নেই'}</p>
                      </div>
                    </div>
                    
                    {/* Time & Schedule Info */}
                    <div className="mb-4 d-flex flex-column gap-2" style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: 12, border: `1px solid ${borderColor}` }}>
                      <div className="d-flex align-items-center gap-2">
                        <IconCalendarEvent size={18} color={mutedColor} />
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#334155' }}>
                          {chamber.day ? translateMetadata(chamber.day, language, t) : 'শনিবার - বৃহস্পতিবার'}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <IconClock size={18} color={mutedColor} />
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#334155' }}>
                          {chamber.start_time ? `${formatTimeBn(chamber.start_time)} - ${formatTimeBn(chamber.end_time)}` : 'বিকাল ৫:০০ - রাত ৯:০০'}
                        </span>
                      </div>
                      {(chamber.phone || chamber.hospital?.phone) && (
                        <div className="d-flex align-items-center gap-2 mt-1">
                          <IconShare size={18} color={mutedColor} style={{ transform: 'rotate(90deg)' }} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#006B52' }}>
                            {chamber.phone || chamber.hospital?.phone}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-4 border-top d-flex align-items-center justify-content-between">
                      <p style={{ fontSize: 20, fontWeight: 950, color: '#059669', margin: 0 }}>৳ {chamber.fee || lowestFee}</p>
                      <button className="btn-premium" onClick={(e) => { e.stopPropagation(); handleBook(chamber.id); }} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: primaryGreen, color: 'white', fontSize: 15, fontWeight: 950 }}>অ্যাপয়েন্টমেন্ট নিন</button>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>

          <div style={{ height: '1px', background: borderColor }} />

          {/* Education Section */}
          <div id="education" className="scroll-section">
            <div style={{ background: 'white', borderRadius: 24, padding: 32, border: `1px solid ${borderColor}`, maxWidth: 600 }}>
              <h3 style={{ fontSize: 22, fontWeight: 950, color: textColor, marginBottom: 24 }}>শিক্ষাগত যোগ্যতা</h3>
              <div className="d-flex flex-column gap-4">
                {['MBBS - ঢাকা মেডিকেল কলেজ', 'MD (Cardiology) - BSMMU'].map((edu, i) => (
                  <div key={i} className="d-flex gap-3 align-items-start">
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: primaryGreen, marginTop: 10 }} />
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#334155', margin: 0 }}>{edu}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: borderColor }} />

          {/* Experience Section */}
          <div id="experience" className="scroll-section">
            <div style={{ maxWidth: 700 }}>
              <h3 style={{ fontSize: 22, fontWeight: 950, color: textColor, marginBottom: 8 }}>অভিজ্ঞতা</h3>
              <p style={{ fontSize: 15, color: mutedColor, fontWeight: 700, marginBottom: 28 }}>
                মোট অভিজ্ঞতা: <span style={{ color: primaryGreen, fontWeight: 950 }}>{doctor?.experience} বছর</span>
              </p>

              {doctor?.experiences && doctor.experiences.length > 0 ? (
                <div style={{ position: 'relative', paddingLeft: 32 }}>
                  {/* Timeline vertical line */}
                  <div style={{ position: 'absolute', left: 11, top: 8, bottom: 8, width: 2, background: `linear-gradient(to bottom, ${primaryGreen}, #A7F3D0)`, borderRadius: 2 }} />

                  <div className="d-flex flex-column gap-4">
                    {doctor.experiences.map((exp, idx) => {
                      const hospitalName = language === 'bn' ? (exp.hospital_name_bn || exp.hospital_name) : (exp.hospital_name || exp.hospital_name_bn)
                      const designation = language === 'bn' ? (exp.designation_bn || exp.designation) : (exp.designation || exp.designation_bn)
                      const department = language === 'bn' ? (exp.department_bn || exp.department) : (exp.department || exp.department_bn)
                      const address = language === 'bn' ? (exp.address_bn || exp.address) : (exp.address || exp.address_bn)
                      const period = language === 'bn' ? (exp.period_bn || exp.period) : (exp.period || exp.period_bn)
                      const duration = language === 'bn' ? (exp.duration_bn || exp.duration) : (exp.duration || exp.duration_bn)

                      return (
                        <div key={exp.id || idx} style={{ position: 'relative' }}>
                          {/* Timeline dot */}
                          <div style={{
                            position: 'absolute', left: -32, top: 18,
                            width: 24, height: 24, borderRadius: '50%',
                            background: idx === 0 ? primaryGreen : 'white',
                            border: `3px solid ${primaryGreen}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 2
                          }}>
                            {idx === 0 && <IconBriefcase size={12} color="white" />}
                          </div>

                          {/* Experience card */}
                          <div className="exp-timeline-card" style={{
                            background: 'white', borderRadius: 18, padding: '24px 28px',
                            border: `1.5px solid ${idx === 0 ? '#A7F3D0' : borderColor}`,
                            transition: 'all 0.3s ease',
                            boxShadow: idx === 0 ? '0 4px 20px rgba(0,107,82,0.06)' : 'none'
                          }}>
                            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                              <h4 style={{ fontSize: 18, fontWeight: 950, color: textColor, margin: 0 }}>
                                {hospitalName}
                              </h4>
                              {duration && (
                                <span style={{
                                  padding: '4px 12px', borderRadius: 8,
                                  background: '#F0FDF4', color: '#059669',
                                  fontSize: 12, fontWeight: 800,
                                  border: '1px solid #DCFCE7'
                                }}>
                                  {duration}
                                </span>
                              )}
                            </div>

                            <p style={{ fontSize: 15, fontWeight: 800, color: primaryGreen, marginBottom: 8 }}>
                              {designation}
                            </p>

                            {department && (
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <IconBriefcase size={15} color={mutedColor} />
                                <span style={{ fontSize: 14, color: '#475569', fontWeight: 600 }}>{department}</span>
                              </div>
                            )}

                            {address && (
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <IconMapPin size={15} color={mutedColor} />
                                <span style={{ fontSize: 14, color: '#475569', fontWeight: 600 }}>{address}</span>
                              </div>
                            )}

                            {period && (
                              <div className="d-flex align-items-center gap-2" style={{ marginTop: 8 }}>
                                <IconClock size={15} color={mutedColor} />
                                <span style={{ fontSize: 13, color: mutedColor, fontWeight: 700 }}>{period}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                /* Fallback: show static workplace info if no experiences */
                <div style={{ background: 'white', borderRadius: 18, padding: 28, border: `1px solid ${borderColor}` }}>
                  {(doctor?.workplace || doctor?.workplace_bn) ? (
                    <div className="d-flex align-items-start gap-3">
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F0FDF4', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <IconBriefcase size={22} />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: mutedColor, marginBottom: 4 }}>বর্তমান/পূর্ববর্তী কর্মস্থল</p>
                        <p style={{ fontSize: 17, fontWeight: 800, color: '#334155', margin: 0 }}>
                          {language === 'bn' ? (doctor?.workplace_bn || doctor?.workplace) : (doctor?.workplace || doctor?.workplace_bn)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: mutedColor, fontWeight: 600, textAlign: 'center', margin: 0 }}>কোনো অভিজ্ঞতা যোগ করা হয়নি</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ height: '1px', background: borderColor }} />

          {/* Reviews Section */}
          <div id="reviews" className="scroll-section">
            <div style={{ maxWidth: 800 }}>
              <h3 style={{ fontSize: 22, fontWeight: 950, color: textColor, marginBottom: 24 }}>রোগী রিভিউ ও মূল্যায়ন</h3>
              
              {/* Rating Summary Card */}
              <div style={{ background: 'white', borderRadius: 24, padding: 28, border: `1px solid ${borderColor}`, marginBottom: 32 }}>
                <Row className="align-items-center g-4">
                  <Col sm={4} className="text-center border-end-sm">
                    <div style={{ fontSize: 56, fontWeight: 950, color: textColor, lineHeight: 1 }}>{averageRating}</div>
                    <div className="d-flex justify-content-center gap-1 my-2">
                      {[1, 2, 3, 4, 5].map(s => (
                        <IconStar key={s} size={22} color="#F59E0B" fill={s <= Math.round(Number(averageRating)) ? '#F59E0B' : 'none'} />
                      ))}
                    </div>
                    <p style={{ fontSize: 14, color: mutedColor, fontWeight: 700, margin: 0 }}>সর্বমোট {reviews.length} টি রিভিউ</p>
                  </Col>
                  <Col sm={8}>
                    <div className="d-flex flex-column gap-2 px-sm-3">
                      {[5, 4, 3, 2, 1].map(stars => {
                        const count = reviews.filter(r => r.rating === stars).length
                        const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                        return (
                          <div key={stars} className="d-flex align-items-center gap-3">
                            <span style={{ fontSize: 13, fontWeight: 700, width: 40, color: textColor }}>{stars} স্টার</span>
                            <div className="flex-grow-1" style={{ height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${percent}%`, height: '100%', background: '#F59E0B', borderRadius: 4 }} />
                            </div>
                            <span style={{ fontSize: 13, color: mutedColor, fontWeight: 700, width: 30, textAlign: 'right' }}>{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Logged in User Feedback / Review Form OR Login Prompt */}
              <div style={{ background: 'white', borderRadius: 24, padding: 28, border: `1px solid ${borderColor}`, marginBottom: 32 }}>
                {isLoggedIn ? (
                  <div>
                    <h4 style={{ fontSize: 18, fontWeight: 900, color: textColor, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <IconUserCheck size={22} color={primaryGreen} />
                      আপনার মূল্যবান রিভিউ দিন
                    </h4>

                    {reviewSubmitted && (
                      <div className="mb-3 p-3" style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 12, color: '#065F46', fontSize: 14, fontWeight: 800 }}>
                        <IconCheck size={18} className="me-2" />
                        আপনার রিভিউ সফলভাবে জমা দেওয়া হয়েছে! ধন্যবাদ।
                      </div>
                    )}

                    <form onSubmit={handleReviewSubmit}>
                      {/* Star Selection */}
                      <div className="mb-3">
                        <label style={{ fontSize: 14, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 6 }}>
                          রেটিং নির্বাচন করুন:
                        </label>
                        <div className="d-flex gap-2 align-items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                            >
                              <IconStar
                                size={32}
                                color="#F59E0B"
                                fill={(hoverRating || newRating) >= star ? '#F59E0B' : 'none'}
                                style={{ transition: 'transform 0.15s ease', transform: (hoverRating || newRating) >= star ? 'scale(1.1)' : 'scale(1)' }}
                              />
                            </button>
                          ))}
                          <span style={{ fontSize: 15, fontWeight: 900, color: '#F59E0B', marginLeft: 8 }}>
                            {hoverRating || newRating} / 5
                          </span>
                        </div>
                      </div>

                      {/* Comment Area */}
                      <div className="mb-3">
                        <label style={{ fontSize: 14, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 6 }}>
                          আপনার মতামত বা অভিজ্ঞতা:
                        </label>
                        <textarea
                          rows={3}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="ডাক্তার সাহেবের সেবা ও পরামর্শ সম্পর্কে আপনার অভিজ্ঞতার কথা সংক্ষেপে লিখুন..."
                          required
                          style={{
                            width: '100%', padding: '14px 16px', borderRadius: 12,
                            border: `1.5px solid ${borderColor}`, fontSize: 15,
                            outline: 'none', transition: 'border-color 0.2s',
                            fontFamily: 'inherit', resize: 'vertical'
                          }}
                          onFocus={(e) => e.target.style.borderColor = primaryGreen}
                          onBlur={(e) => e.target.style.borderColor = borderColor}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn-premium"
                        style={{
                          padding: '12px 28px', borderRadius: 12, border: 'none',
                          background: primaryGreen, color: 'white', fontWeight: 950,
                          fontSize: 15, display: 'flex', alignItems: 'center', gap: 8
                        }}
                      >
                        <IconSend size={18} /> রিভিউ জমা দিন
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 p-2">
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <IconLock size={24} />
                      </div>
                      <div>
                        <h5 style={{ fontSize: 16, fontWeight: 900, color: textColor, margin: 0, marginBottom: 2 }}>আপনার মতামত জানাতে চান?</h5>
                        <p style={{ fontSize: 14, color: mutedColor, margin: 0, fontWeight: 700 }}>রিভিউ বা ফিডব্যাক পোস্ট করতে লগইন করুন</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/login', { state: { from: `/doctor/${id}` } })}
                      className="btn-premium-outline"
                      style={{
                        padding: '10px 24px', borderRadius: 12, border: `1.5px solid ${primaryGreen}`,
                        background: 'white', color: primaryGreen, fontWeight: 900, fontSize: 14,
                        whiteSpace: 'nowrap', cursor: 'pointer'
                      }}
                    >
                      লগইন করুন
                    </button>
                  </div>
                )}
              </div>

              {/* Reviews List */}
              <div className="d-flex flex-column gap-3">
                {reviews.map((rev) => (
                  <div key={rev.id} style={{ background: 'white', borderRadius: 18, padding: '20px', border: `1px solid ${borderColor}` }}>
                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                      <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: '50%', background: '#F0FDF4',
                          color: primaryGreen, fontWeight: 950, fontSize: 18,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {rev.userName ? rev.userName.charAt(0) : 'U'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="d-flex align-items-center flex-wrap gap-2">
                            <h5 style={{ fontSize: 16, fontWeight: 950, color: textColor, margin: 0, whiteSpace: 'nowrap' }}>
                              {rev.userName}
                            </h5>
                            {rev.verified && (
                              <span style={{ fontSize: 11, fontWeight: 800, background: '#DCFCE7', color: '#065F46', padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                ভেরিফাইড রোগী
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 12, color: mutedColor, fontWeight: 700, display: 'block', marginTop: 2 }}>{rev.date}</span>
                        </div>
                      </div>

                      <div className="d-flex gap-1 align-items-center flex-shrink-0" style={{ paddingTop: 2 }}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <IconStar key={s} size={16} color="#F59E0B" fill={s <= rev.rating ? '#F59E0B' : 'none'} />
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: 15, color: '#334155', margin: 0, lineHeight: 1.6 }}>
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </Container>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700;800;900&display=swap');
        
        /* Premium UI Animations */
        .premium-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .premium-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px -10px rgba(0, 107, 82, 0.12) !important;
          border-color: #006B52 !important;
        }
        
        .btn-premium {
          transition: all 0.3s ease;
        }
        .btn-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,107,82,0.3) !important;
        }
        
        .btn-premium-outline {
          transition: all 0.3s ease;
        }
        .btn-premium-outline:hover {
          transform: translateY(-2px);
          border-color: #006B52 !important;
          color: #006B52;
          background: #F0FDF4 !important;
        }

        .nav-link:hover { color: #059669 !important; }
        ::-webkit-scrollbar { height: 4px; width: 6px; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; borderRadius: 10px; }

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
      ` }} />

      <ShareModal show={shareModalOpen} onHide={closeShareModal} shareData={shareData} />
    </div>
  )
}

export default DoctorDetailPage

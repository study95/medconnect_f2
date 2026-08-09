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
  IconLock, IconSend, IconUserCheck, IconStethoscope, IconPhone, IconSparkles,
  IconWallet, IconBuildingHospital, IconShieldCheck, IconUser
} from '@tabler/icons-react'

const DEMO_AVATAR = 'https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg'

function DoctorDetailPageContent() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const language = i18n?.language || 'bn'
  const { theme } = useTheme() || {}
  const { user, isLoggedIn } = useAuth() || {}

  const { doctor, chambers, loading, error, refetch } = useDoctorDetail(id)
  const favoritesContext = useFavorites() || {}
  const isDoctorFavorite = favoritesContext.isDoctorFavorite || (() => false)
  const toggleFavoriteDoctor = favoritesContext.toggleFavoriteDoctor || (() => {})

  const shareContext = useShare() || {}
  const triggerShare = shareContext.triggerShare || (() => {})
  const shareModalOpen = shareContext.shareModalOpen || false
  const shareData = shareContext.shareData || null
  const closeShareModal = shareContext.closeShareModal || (() => {})

  // Active tab state: 'about', 'chamber', 'experience', 'reviews'
  const [activeTab, setActiveTab] = useState('about')

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
    if (!reviews || reviews.length === 0) return '5.0'
    const sum = reviews.reduce((acc, r) => acc + (Number(r?.rating) || 5), 0)
    return (sum / reviews.length).toFixed(1)
  }, [reviews])

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey)
    // Smoothly focus/align the top of right card when menu item is clicked
    const rightCard = document.querySelector('.right-main-card')
    if (rightCard) {
      const isMobile = window.innerWidth < 992
      const offset = isMobile ? 70 : 90
      const bodyRect = document.body.getBoundingClientRect().top
      const elementRect = rightCard.getBoundingClientRect().top
      const elementPosition = elementRect - bodyRect
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  const handleBook = (chamberId = null) => {
    let path = `/book-appointment/${id}`
    if (chamberId !== null && chamberId !== undefined && chamberId !== '') {
      path += `?chamberId=${chamberId}`
    }
    navigate(path)
  }

  const sortedChambers = useMemo(() => {
    const DAY_ORDER = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const getDayIndex = (dayStr) => {
      if (!dayStr) return 99
      const normalized = dayStr.charAt(0).toUpperCase() + dayStr.slice(1).toLowerCase()
      const idx = DAY_ORDER.indexOf(normalized)
      return idx === -1 ? 99 : idx
    }
    return [...(chambers || [])].sort((a, b) => getDayIndex(a?.day) - getDayIndex(b?.day))
  }, [chambers])

  const lowestFee = useMemo(() => {
    if (!sortedChambers || sortedChambers.length === 0) return doctor?.fee || 0
    const validFees = sortedChambers.map(c => Number(c?.fee)).filter(f => !isNaN(f) && f > 0)
    return validFees.length > 0 ? Math.min(...validFees) : (doctor?.fee || 0)
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
        <h4 style={{ fontWeight: 700, marginBottom: 8, color: '#1E293B' }}>{t ? t('doctor_not_found') : 'ডাক্তার পাওয়া যায়নি'}</h4>
        <p style={{ color: '#64748B', marginBottom: 24 }}>{error || 'অনুরোধকৃত ডাক্তারের তথ্য খুঁজে পাওয়া যায়নি'}</p>
        <div className="d-flex justify-content-center gap-3">
          <button onClick={() => refetch && refetch()} style={{ background: '#00A88C', color: 'white', border: 'none', borderRadius: 10, padding: '10px 28px', fontWeight: 600, cursor: 'pointer' }}>{t ? t('try_again') : 'আবার চেষ্টা করুন'}</button>
          <button onClick={() => navigate('/doctors')} style={{ background: 'transparent', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 28px', fontWeight: 600, cursor: 'pointer', color: '#1E293B' }}>{t ? t('back_to_doctors') : 'ডাক্তার তালিকায় ফিরে যান'}</button>
        </div>
      </Container>
    </div>
  )

  const specialtyName = translateMetadata(doctor?.specialty?.name || doctor?.specialty_name || (t ? t('general_physician') : 'সাধারণ চিকিৎসক'), language, t)

  // Design tokens aligned with sample reference
  const primaryGreen = '#00A88C'
  const lightGreenBg = '#E6F6F4'
  const darkTextColor = '#1A1D2E'
  const mutedTextColor = '#6B7280'
  const cardBorderColor = '#E5EAF0'
  const isFav = doctor ? isDoctorFavorite(doctor.id) : false

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>
      
      {/* 1. Top Breadcrumb Line */}
      <div style={{ background: '#FFFFFF', borderBottom: `1px solid ${cardBorderColor}`, padding: '12px 0' }}>
        <Container>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: primaryGreen, cursor: 'pointer' }} onClick={() => navigate('/')}>হোম</span>
            <IconChevronRight size={14} color={mutedTextColor} />
            <span style={{ color: primaryGreen, cursor: 'pointer' }} onClick={() => navigate('/doctors')}>ডাক্তার নির্দেশিকা</span>
            <IconChevronRight size={14} color={mutedTextColor} />
            <span style={{ color: mutedTextColor }}>{doctor?.name}</span>
          </div>
        </Container>
      </div>

      {/* 2. Main Page Center Container (Left & Right Split) */}
      <Container className="py-4 py-lg-5">
        <Row className="g-4 align-items-start">
          
          {/* ================= LEFT SIDE PROFILE SIDEBAR ================= */}
          <Col lg={4} xl={4}>
            <div className="left-profile-card" style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: `1px solid ${cardBorderColor}`,
              padding: '24px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.03)',
              position: 'sticky',
              top: 90,
              zIndex: 10
            }}>
              
              {/* RECTANGULAR DOCTOR IMAGE (NO CIRCLE) WITH VERIFIED BADGE */}
              <div style={{ position: 'relative', width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 20, background: '#F1F5F9' }}>
                <img 
                  src={doctor?.photo || DEMO_AVATAR} 
                  alt={doctor?.name || 'Doctor'}
                  onError={(e) => { e.target.src = DEMO_AVATAR }}
                  style={{
                    width: '100%',
                    aspectRatio: '1/1',
                    objectFit: 'cover',
                    borderRadius: 16,
                    display: 'block'
                  }}
                />
                
                {/* Verified Blue Badge on Top Right of Rectangular Image */}
                <div style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#1D4ED8',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                  border: '2px solid white'
                }} title="ভেরিফাইড ডাক্তার">
                  <IconCheck size={16} stroke={3.5} />
                </div>
              </div>

              {/* Doctor Name */}
              <h2 style={{
                fontSize: 21,
                fontWeight: 950,
                color: darkTextColor,
                textAlign: 'center',
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.2px'
              }}>
                {doctor?.name}
              </h2>

              {/* Specialty Green Pill Badge */}
              <div className="d-flex justify-content-center mb-2">
                <div style={{
                  background: lightGreenBg,
                  color: primaryGreen,
                  padding: '6px 16px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 900,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <IconShieldCheck size={16} />
                  {specialtyName}
                </div>
              </div>

              {/* Degree */}
              <p style={{
                fontSize: 14,
                fontWeight: 700,
                color: mutedTextColor,
                textAlign: 'center',
                marginBottom: 20
              }}>
                {doctor?.degree || 'MBBS, FCPS'}
              </p>

              {/* PIC 2 STYLE HORIZONTAL STATS BAR (Visit Fee | Rating | Patients) */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: 16,
                border: `1px solid ${cardBorderColor}`,
                padding: '14px 10px',
                marginBottom: 20,
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
              }}>
                <Row className="g-0 text-center align-items-center">
                  {/* Column 1: Visit Fee */}
                  <Col xs={4} style={{ borderRight: `1px solid ${cardBorderColor}`, padding: '0 4px' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: mutedTextColor, display: 'block', marginBottom: 2 }}>
                      ভিজিট ফি
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 950, color: primaryGreen }}>
                      ৳{lowestFee || doctor?.fee || '৫০০'}
                    </span>
                  </Col>

                  {/* Column 2: Rating & Reviews */}
                  <Col xs={4} style={{ borderRight: `1px solid ${cardBorderColor}`, padding: '0 4px' }}>
                    <div className="d-flex align-items-center justify-content-center gap-1 mb-1">
                      <IconStar size={16} color="#F59E0B" fill="#F59E0B" />
                      <span style={{ fontSize: 16, fontWeight: 950, color: darkTextColor }}>
                        {averageRating}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: mutedTextColor, display: 'block' }}>
                      ({(reviews || []).length} রিভিউ)
                    </span>
                  </Col>

                  {/* Column 3: Patients Count */}
                  <Col xs={4} style={{ padding: '0 4px' }}>
                    <div className="d-flex align-items-center justify-content-center gap-1 mb-1">
                      <IconUsers size={16} color="#3B82F6" />
                      <span style={{ fontSize: 15, fontWeight: 950, color: darkTextColor }}>
                        ৪,৮৬৩
                      </span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: mutedTextColor, display: 'block' }}>
                      রোগী
                    </span>
                  </Col>
                </Row>
              </div>

              {/* Total Experience Highlight Badge */}
              <div className="d-flex align-items-center justify-content-between mb-4" style={{
                background: lightGreenBg,
                padding: '10px 16px',
                borderRadius: 12,
                border: '1px solid #B4EBE3'
              }}>
                <div className="d-flex align-items-center gap-2">
                  <IconCalendarEvent size={18} color={primaryGreen} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#007A65' }}>অভিজ্ঞতা</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 950, color: primaryGreen }}>
                  {doctor?.experience || '১০'}+ বছর
                </span>
              </div>

              {/* Share Profile Outline Button */}
              <button 
                onClick={() => doctor && triggerShare({
                  title: doctor.name,
                  text: `${specialtyName} | Doctor Booklet`,
                  url: window.location.href,
                  image: doctor.photo || DEMO_AVATAR
                })}
                className="btn-share-profile mb-2"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 12,
                  border: `1.5px solid ${primaryGreen}`,
                  background: 'white',
                  color: primaryGreen,
                  fontWeight: 900,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <IconShare size={18} /> Share Profile
              </button>

              {/* Secondary Actions (Book & Favorite) */}
              <div className="d-flex gap-2">
                <button 
                  onClick={() => handleBook()}
                  className="btn-book-now flex-grow-1"
                  style={{
                    padding: '12px',
                    borderRadius: 12,
                    border: 'none',
                    background: primaryGreen,
                    color: 'white',
                    fontWeight: 950,
                    fontSize: 14,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,168,140,0.2)'
                  }}
                >
                  অ্যাপয়েন্টমেন্ট নিন
                </button>

                <button 
                  onClick={() => doctor && toggleFavoriteDoctor(doctor)}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    border: `1px solid ${isFav ? '#EF4444' : cardBorderColor}`,
                    background: isFav ? '#FEF2F2' : 'white',
                    color: isFav ? '#EF4444' : darkTextColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  title={isFav ? 'সেভড' : 'সেভ করুন'}
                >
                  <IconHeart 
                    size={20} 
                    fill={isFav ? '#EF4444' : 'none'} 
                    color={isFav ? '#EF4444' : darkTextColor} 
                  />
                </button>
              </div>

            </div>
          </Col>

          {/* ================= RIGHT SIDE CONTENT PANEL ================= */}
          <Col lg={8} xl={8}>
            <div className="right-main-card" style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: `1px solid ${cardBorderColor}`,
              padding: '24px 28px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.03)'
            }}>
              
              {/* Top Menu Tabs (Inside Right Box Top) */}
              <div className="top-menu-tabs-wrapper" style={{
                borderBottom: `1px solid ${cardBorderColor}`,
                marginBottom: 28,
                position: 'sticky',
                top: 80,
                background: 'white',
                zIndex: 9,
                paddingTop: 4
              }}>
                <Nav className="flex-nowrap overflow-auto" activeKey={activeTab} onSelect={(k) => handleTabChange(k)} style={{ gap: 32 }}>
                  {[
                    { key: 'about', label: 'About Doctor', icon: <IconUser size={18} /> },
                    { key: 'chamber', label: 'Chamber', icon: <IconBuildingHospital size={18} /> },
                    { key: 'experience', label: 'Experience', icon: <IconBriefcase size={18} /> },
                    { key: 'reviews', label: 'Reviews', icon: <IconStar size={18} /> }
                  ].map(tab => (
                    <Nav.Item key={tab.key}>
                      <Nav.Link 
                        eventKey={tab.key}
                        style={{ 
                          padding: '12px 4px 16px',
                          fontSize: 15,
                          fontWeight: 900,
                          color: activeTab === tab.key ? primaryGreen : mutedTextColor,
                          borderBottom: `3px solid ${activeTab === tab.key ? primaryGreen : 'transparent'}`,
                          borderRadius: 0,
                          transition: 'all 0.2s ease',
                          background: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {tab.icon} {tab.label}
                      </Nav.Link>
                    </Nav.Item>
                  ))}
                </Nav>
              </div>

              {/* Body Content: Shows ONLY Selected Menu Item Data at the Top! */}
              <div className="tab-content-container">

                {/* 1. About Doctor Section */}
                {activeTab === 'about' && (
                  <div id="section-about" className="tab-body-section animate-tab-view">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <IconUser size={22} color={primaryGreen} />
                      <h3 style={{ fontSize: 19, fontWeight: 950, color: darkTextColor, margin: 0 }}>
                        About Doctor
                      </h3>
                    </div>

                    <p style={{ color: '#374151', fontSize: 15, lineHeight: 1.8, marginBottom: 24, textAlign: 'justify' }}>
                      {doctor?.bio || `Dr. ${doctor?.name || 'H.Ahasan Habib Khan'} is a highly skilled and experienced Allergy & Immunology / Cardiology specialist in Bangladesh. He has been working in this field for more than 10 years. He is dedicated to providing the best possible care to his patients.`}
                    </p>

                    {/* NOTE REQUIREMENT: বিশেষ দক্ষতা: content add dr about section */}
                    <div style={{
                      background: lightGreenBg,
                      borderRadius: 16,
                      padding: '20px',
                      border: '1px solid #B4EBE3',
                      marginBottom: 24
                    }}>
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <IconSparkles size={20} color={primaryGreen} />
                        <h4 style={{ fontSize: 16, fontWeight: 950, color: '#007A65', margin: 0 }}>
                          বিশেষ দক্ষতা:
                        </h4>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {[
                          'হার্ট ব্লক চিকিৎসা',
                          'উচ্চ রক্তচাপ ও হাইপারটেনশন',
                          'করোনারি আর্টারি ডিজিজ (CAD)',
                          'হার্ট ফেইলিওর ব্যবস্থাপনা',
                          'ইসিজি ও ইকোকার্ডিওগ্রাফি',
                          'ট্রেডমিল টেস্ট (ETT)',
                          'পেসমেকার ইমপ্লান্ট ও ফলোআপ',
                          'অ্যাঞ্জিওপ্লাস্টি ও করোনারি কেয়ার'
                        ].map((skill, idx) => (
                          <span key={idx} style={{
                            padding: '6px 14px',
                            borderRadius: 8,
                            background: 'white',
                            color: '#007A65',
                            fontSize: 13,
                            fontWeight: 800,
                            border: '1px solid #80DFD1',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}>
                            <IconCheck size={15} color={primaryGreen} /> {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Educational background */}
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 900, color: darkTextColor, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <IconSchool size={18} color={primaryGreen} /> Education & Credentials
                      </h4>
                      <div className="d-flex flex-column gap-2">
                        {['MBBS - Dhaka Medical College', 'MD (Cardiology / Specialty) - BSMMU', 'FCPS - BCPS Bangladesh'].map((edu, i) => (
                          <div key={i} className="d-flex align-items-center gap-2" style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, border: `1px solid ${cardBorderColor}` }}>
                            <IconCheck size={16} color={primaryGreen} />
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#334155' }}>{edu}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Chamber & Visiting Hour Section */}
                {activeTab === 'chamber' && (
                  <div id="section-chamber" className="tab-body-section animate-tab-view">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <IconMapPin size={22} color={primaryGreen} />
                      <h3 style={{ fontSize: 19, fontWeight: 950, color: darkTextColor, margin: 0 }}>
                        Chamber & Visiting Hour
                      </h3>
                    </div>

                    <div className="d-flex flex-column gap-3">
                      {sortedChambers.map((chamber, idx) => (
                        <div 
                          key={chamber?.id || idx}
                          style={{
                            padding: 20,
                            borderRadius: 16,
                            background: '#FFFFFF',
                            border: `1px solid ${cardBorderColor}`,
                            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                          }}
                        >
                          <Row className="align-items-center g-3">
                            <Col md={8}>
                              <h4 style={{ fontSize: 16, fontWeight: 950, color: darkTextColor, marginBottom: 4 }}>
                                {chamber?.hospital?.name || chamber?.hospital_name || 'Popular Diagnostic Center, Dhanmondi'}
                              </h4>
                              <p style={{ fontSize: 13, color: mutedTextColor, margin: 0, fontWeight: 600, marginBottom: 12 }}>
                                {chamber?.address || chamber?.hospital?.address || 'Road-12, Dhanmondi, Dhaka-1209'}
                              </p>

                              <div className="d-inline-flex align-items-center gap-2" style={{
                                padding: '8px 14px',
                                background: lightGreenBg,
                                borderRadius: 10,
                                fontSize: 13,
                                fontWeight: 800,
                                color: primaryGreen
                              }}>
                                <IconClock size={16} />
                                <span>
                                  {chamber?.day ? translateMetadata(chamber.day, language, t) : 'Saturday - Thursday'}: {chamber?.start_time ? `${formatTimeBn(chamber.start_time)} - ${formatTimeBn(chamber.end_time)}` : '5:00 PM - 9:00 PM'}
                                </span>
                              </div>
                            </Col>

                            <Col md={4} className="text-md-end">
                              <button 
                                onClick={() => handleBook(chamber?.id)}
                                style={{
                                  padding: '10px 20px',
                                  borderRadius: 10,
                                  border: `1.5px solid ${primaryGreen}`,
                                  background: 'white',
                                  color: primaryGreen,
                                  fontSize: 14,
                                  fontWeight: 900,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}
                              >
                                <IconMapPin size={16} /> View & Book
                              </button>
                            </Col>
                          </Row>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Experience Section */}
                {activeTab === 'experience' && (
                  <div id="section-experience" className="tab-body-section animate-tab-view">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <IconBriefcase size={22} color={primaryGreen} />
                      <h3 style={{ fontSize: 19, fontWeight: 950, color: darkTextColor, margin: 0 }}>
                        Experience
                      </h3>
                    </div>

                    <div className="d-flex flex-column gap-3">
                      {Array.isArray(doctor?.experiences) && doctor.experiences.length > 0 ? (
                        doctor.experiences.map((exp, idx) => (
                          <div key={exp.id || idx} className="d-flex align-items-start gap-3" style={{ padding: '14px 18px', background: '#F8FAFC', borderRadius: 14, border: `1px solid ${cardBorderColor}` }}>
                            <IconBriefcase size={20} color={primaryGreen} style={{ marginTop: 2 }} />
                            <div>
                              <h5 style={{ fontSize: 15, fontWeight: 900, color: darkTextColor, margin: 0 }}>{exp.hospital_name || exp.hospital_name_bn || 'হাসপাতাল / প্রতিষ্ঠান'}</h5>
                              <p style={{ fontSize: 13, fontWeight: 700, color: primaryGreen, margin: 0 }}>{exp.designation || exp.designation_bn || 'পদবী'}</p>
                              {exp.period && <p style={{ fontSize: 12, color: mutedTextColor, margin: 0 }}>{exp.period}</p>}
                            </div>
                          </div>
                        ))
                      ) : (
                        [
                          '10+ Years of experience in Allergy & Immunology / Cardiology',
                          'Worked as Senior Consultant at National Heart Foundation',
                          'Specialized in Asthma, Allergy, Sinusitis & Immunodeficiency Disorders',
                          'Expert in Advanced Allergy Testing & Immunotherapy'
                        ].map((item, idx) => (
                          <div key={idx} className="d-flex align-items-start gap-3" style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: 12, border: `1px solid ${cardBorderColor}` }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: primaryGreen, marginTop: 6, flexShrink: 0 }} />
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#374151', lineHeight: 1.6 }}>{item}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Patient Reviews Section */}
                {activeTab === 'reviews' && (
                  <div id="section-reviews" className="tab-body-section animate-tab-view">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <IconStar size={22} color={primaryGreen} />
                      <h3 style={{ fontSize: 19, fontWeight: 950, color: darkTextColor, margin: 0 }}>
                        Patient Reviews ({(reviews || []).length})
                      </h3>
                    </div>

                    {/* Rating Breakdown & Sample Review */}
                    <Row className="g-3 mb-4">
                      <Col md={6}>
                        <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 20, border: `1px solid ${cardBorderColor}`, height: '100%' }}>
                          <div className="d-flex align-items-center gap-3 mb-3">
                            <IconStar size={32} color="#F59E0B" fill="#F59E0B" />
                            <div>
                              <span style={{ fontSize: 36, fontWeight: 950, color: darkTextColor, lineHeight: 1 }}>{averageRating}</span>
                              <span style={{ fontSize: 13, color: mutedTextColor, fontWeight: 700, display: 'block' }}>({(reviews || []).length} Reviews)</span>
                            </div>
                          </div>

                          <div className="d-flex flex-column gap-1">
                            {[5, 4, 3, 2, 1].map(stars => {
                              const count = (reviews || []).filter(r => r.rating === stars).length
                              const percent = (reviews || []).length > 0 ? (count / reviews.length) * 100 : 0
                              return (
                                <div key={stars} className="d-flex align-items-center gap-2" style={{ fontSize: 12 }}>
                                  <span style={{ width: 16, fontWeight: 700 }}>{stars}★</span>
                                  <div className="flex-grow-1" style={{ height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{ width: `${percent}%`, height: '100%', background: primaryGreen }} />
                                  </div>
                                  <span style={{ width: 30, color: mutedTextColor, textAlign: 'right' }}>{Math.round(percent)}%</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </Col>

                      <Col md={6}>
                        <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 20, border: `1px solid ${cardBorderColor}`, height: '100%' }}>
                          <div className="d-flex gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map(s => (
                              <IconStar key={s} size={16} color="#F59E0B" fill="#F59E0B" />
                            ))}
                            <span style={{ fontSize: 12, color: mutedTextColor, marginLeft: 'auto', fontWeight: 700 }}>2 days ago</span>
                          </div>
                          <p style={{ fontSize: 14, color: '#374151', fontStyle: 'italic', marginBottom: 12, lineHeight: 1.5 }}>
                            "Very friendly and explained everything clearly. Highly recommended."
                          </p>
                          <span style={{ fontSize: 13, fontWeight: 900, color: primaryGreen }}>— Rahim Uddin</span>
                        </div>
                      </Col>
                    </Row>

                    {/* Add Review Form for Logged In Users */}
                    <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 20, border: `1px solid ${cardBorderColor}` }}>
                      {isLoggedIn ? (
                        <form onSubmit={handleReviewSubmit}>
                          <h4 style={{ fontSize: 15, fontWeight: 900, color: darkTextColor, marginBottom: 12 }}>
                            আপনার অভিজ্ঞতা জানান:
                          </h4>

                          {reviewSubmitted && (
                            <div className="mb-3 p-2" style={{ background: lightGreenBg, border: '1px solid #A7F3D0', borderRadius: 8, color: '#007A65', fontSize: 13, fontWeight: 800 }}>
                              <IconCheck size={16} className="me-1" /> রিভিউ জমা দেওয়া হয়েছে!
                            </div>
                          )}

                          <div className="d-flex gap-2 align-items-center mb-3">
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
                                  size={24}
                                  color="#F59E0B"
                                  fill={(hoverRating || newRating) >= star ? '#F59E0B' : 'none'}
                                />
                              </button>
                            ))}
                          </div>

                          <textarea
                            rows={3}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="আপনার মতামত বা অভিজ্ঞতা লিখুন..."
                            required
                            style={{
                              width: '100%', padding: '10px 14px', borderRadius: 10,
                              border: `1px solid ${cardBorderColor}`, fontSize: 14,
                              outline: 'none', fontFamily: 'inherit', marginBottom: 12
                            }}
                          />

                          <button
                            type="submit"
                            style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: primaryGreen, color: 'white', fontWeight: 900, fontSize: 14, cursor: 'pointer' }}
                          >
                            Submit Review
                          </button>
                        </form>
                      ) : (
                        <div className="d-flex align-items-center justify-content-between">
                          <span style={{ fontSize: 14, fontWeight: 700, color: darkTextColor }}>রিভিউ দিতে চান?</span>
                          <button
                            onClick={() => navigate('/login', { state: { from: `/doctor/${id}` } })}
                            style={{ padding: '6px 18px', borderRadius: 8, border: `1px solid ${primaryGreen}`, background: 'white', color: primaryGreen, fontWeight: 900, fontSize: 13, cursor: 'pointer' }}
                          >
                            লগইন করুন
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </Col>
        </Row>
      </Container>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInTab {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-tab-view {
          animation: fadeInTab 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .top-menu-tabs-wrapper .nav::-webkit-scrollbar {
          display: none !important;
        }
        .top-menu-tabs-wrapper .nav {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .btn-share-profile:hover {
          background: #E6F6F4 !important;
        }
        .btn-book-now:hover {
          background: #008a74 !important;
        }
        @media (max-width: 991px) {
          .left-profile-card {
            position: static !important;
            margin-bottom: 20px;
          }
          .top-menu-tabs-wrapper {
            top: 60px !important;
          }
        }
      ` }} />

      <ShareModal show={shareModalOpen} onHide={closeShareModal} shareData={shareData} />
    </div>
  )
}

// Wrap with ErrorBoundary to catch any UI errors gracefully
export default function DoctorDetailPage() {
  return (
    <ErrorBoundary>
      <DoctorDetailPageContent />
    </ErrorBoundary>
  )
}

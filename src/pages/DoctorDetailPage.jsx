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
import SeoHead from '../components/common/SeoHead'
import { translateMetadata } from '../utils/translationUtils'
import { getMediaUrl } from '../utils/mediaUtils'
import { 
  IconHeart, IconShare, IconMapPin, IconClock, 
  IconBriefcase, IconCertificate, IconStar, 
  IconSchool, IconUsers, IconAward, IconCheck, IconChevronRight,
  IconHistory, IconDiscountCheckFilled, IconCalendarEvent,
  IconLock, IconSend, IconUserCheck, IconStethoscope, IconPhone, IconSparkles,
  IconWallet, IconBuildingHospital, IconShieldCheck, IconUser, IconArrowLeft
} from '@tabler/icons-react'

const DEMO_AVATAR = 'https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg'

function DoctorDetailPageContent() {
  const { district, upazila, slug, id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const language = i18n?.language || 'bn'
  const { theme } = useTheme() || {}
  const { user, isLoggedIn } = useAuth() || {}

  const { doctor, chambers, loading, error, refetch } = useDoctorDetail({ district, upazila, slug, id })
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

  // Canonical SEO URL redirect: if navigated via legacy numeric ID or bare ULID (/doctors/:id), update URL to canonical SEO route
  useEffect(() => {
    if (id && doctor?.slug && doctor?.district_slug && doctor?.upazila_slug) {
      navigate(`/doctors/${doctor.district_slug}/${doctor.upazila_slug}/${doctor.slug}`, { replace: true })
    }
  }, [id, doctor?.slug, doctor?.district_slug, doctor?.upazila_slug, navigate])

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

  // Compute total experience from all experience durations
  const totalExpLabel = (() => {
    const exps = Array.isArray(doctor?.experiences) ? doctor.experiences : []
    let totalMonths = 0
    exps.forEach(exp => {
      const d = (exp.duration || '').toLowerCase()
      const yr = d.match(/(\d+)\s*year/)
      const mo = d.match(/(\d+)\s*month/)
      if (yr) totalMonths += parseInt(yr[1]) * 12
      if (mo) totalMonths += parseInt(mo[1])
    })
    if (totalMonths === 0) return (doctor?.experience || '১০') + '+ বছর'
    const yrs = Math.floor(totalMonths / 12)
    const mos = totalMonths % 12
    if (yrs === 0) return mos + ' মাস'
    if (mos === 0) return yrs + '+ বছর'
    return yrs + ' বছর ' + mos + ' মাস'
  })()

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey)
    // Smoothly focus/align the top of right card when menu item is clicked
    const rightCard = document.querySelector('.right-main-card')
    if (rightCard) {
      const topbar = document.querySelector('.db-topbar')
      const mainHeader = document.querySelector('.db-main-header') || document.querySelector('.navbar')
      let totalHeaderHeight = 0
      if (topbar) totalHeaderHeight += topbar.offsetHeight
      if (mainHeader) totalHeaderHeight += mainHeader.offsetHeight
      if (totalHeaderHeight === 0) totalHeaderHeight = 135

      const offset = totalHeaderHeight + 20
      const bodyRect = document.body.getBoundingClientRect().top
      const elementRect = rightCard.getBoundingClientRect().top
      const elementPosition = elementRect - bodyRect
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: Math.max(0, offsetPosition),
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

  const dayNamesBn = {
    'Saturday': 'শনিবার',
    'Sunday': 'রবিবার',
    'Monday': 'সোমবার',
    'Tuesday': 'মঙ্গলবার',
    'Wednesday': 'বুধবার',
    'Thursday': 'বৃহস্পতিবার',
    'Friday': 'শুক্রবার'
  }

  const groupedChambers = useMemo(() => {
    const list = sortedChambers || []
    if (list.length === 0) {
      if (doctor?.hospital || doctor?.workplace || doctor?.workplace_bn) {
        const hospName = doctor?.hospital?.name || doctor?.workplace_bn || doctor?.workplace || 'প্রধান চেম্বার'
        const hospAddr = doctor?.hospital?.address || (doctor?.district?.name ? `${doctor.district.name}, বাংলাদেশ` : 'ঠিকানা উপলব্ধ নয়')
        return [{
          hospitalId: doctor?.hospital?.id || 'primary',
          hospitalName: hospName,
          address: hospAddr,
          phone: doctor?.hospital?.phone || doctor?.phone || '',
          photoUrl: doctor?.hospital?.photo_url || doctor?.hospital?.photo || null,
          schedules: [{
            id: 'primary',
            day: 'Saturday',
            start_time: '17:00:00',
            end_time: '21:00:00',
            fee: doctor?.fee || 500
          }]
        }]
      }
      return []
    }
    const map = new Map()
    list.forEach((chamber) => {
      const hospId = chamber.hospital_id || chamber.hospital?.id || chamber.hospital_name || chamber.address || 'default'
      if (!map.has(hospId)) {
        map.set(hospId, {
          hospitalId: chamber.hospital_id || chamber.hospital?.id,
          hospitalName: chamber.hospital?.name || chamber.hospital_name || 'চেম্বার',
          address: chamber.address || chamber.hospital?.address || 'ঠিকানা উপলব্ধ নয়',
          phone: chamber.hospital?.phone || chamber.phone || '',
          photoUrl: chamber.hospital?.photo_url || chamber.hospital?.photo || null,
          schedules: []
        })
      }
      map.get(hospId).schedules.push(chamber)
    })
    return Array.from(map.values())
  }, [sortedChambers, doctor])

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

  const doctorSchema = useMemo(() => {
    if (!doctor) return null
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Physician',
      'name': doctor.name,
      'alternateName': doctor.name_bn || undefined,
      'description': doctor.about || doctor.specialty?.name || 'বিশেষজ্ঞ ডাক্তার',
      'medicalSpecialty': doctor.specialty?.name || doctor.specialty?.name_bn || undefined,
      'telephone': doctor.phone || doctor.hotline || undefined,
      'url': `${window.location.origin}/doctors/${doctor.district_slug || 'bangladesh'}/${doctor.upazila_slug || 'general'}/${doctor.slug || doctor.id}`,
      'image': doctor.photo ? getMediaUrl(doctor.photo) : (doctor.photo_url ? getMediaUrl(doctor.photo_url) : DEMO_AVATAR),
      'priceRange': doctor.fee ? `৳ ${doctor.fee}` : undefined,
    }

    if (doctor.district?.name || doctor.upazila?.name) {
      schema.address = {
        '@type': 'PostalAddress',
        'addressLocality': doctor.upazila?.name || undefined,
        'addressRegion': doctor.district?.name || 'Dhaka',
        'addressCountry': 'BD'
      }
    }

    if (doctor.hospital?.name) {
      schema.worksFor = {
        '@type': 'Hospital',
        'name': doctor.hospital.name
      }
    }

    if (reviews && reviews.length > 0) {
      const avgRating = reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        'ratingValue': avgRating.toFixed(1),
        'reviewCount': reviews.length,
        'bestRating': '5',
        'worstRating': '1'
      }
    }

    return schema
  }, [doctor, reviews])

  const breadcrumbSchema = useMemo(() => {
    if (!doctor) return null
    const origin = window.location.origin
    const items = [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': `${origin}/`
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Doctors',
        'item': `${origin}/doctors`
      }
    ]

    let pos = 3
    if (doctor.district?.name) {
      items.push({
        '@type': 'ListItem',
        'position': pos++,
        'name': doctor.district.name,
        'item': `${origin}/doctors?district_id=${doctor.district.id}`
      })
    }

    if (doctor.upazila?.name) {
      items.push({
        '@type': 'ListItem',
        'position': pos++,
        'name': doctor.upazila.name,
        'item': `${origin}/doctors?upazila_id=${doctor.upazila.id}`
      })
    }

    items.push({
      '@type': 'ListItem',
      'position': pos,
      'name': doctor.name,
      'item': `${origin}/doctors/${doctor.district_slug || 'bangladesh'}/${doctor.upazila_slug || 'general'}/${doctor.slug || doctor.id}`
    })

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': items
    }
  }, [doctor])

  if (loading) return (
    <div className="page-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh' }}>
       <Container className="py-5">
         <DoctorDetailSkeleton />
       </Container>
    </div>
  )

  if (error || !doctor) return (
    <div className="page-wrapper">
      <SeoHead
        title="ডাক্তার পাওয়া যায়নি — MedConnect"
        description="অনুরোধকৃত ডাক্তারের তথ্য খুঁজে পাওয়া যায়নি।"
        noIndex={true}
      />
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

  // Design tokens aligned with main website brand green
  const primaryGreen = '#00B875'
  const lightGreenBg = '#D1FAE5'
  const darkTextColor = '#1A1D2E'
  const mutedTextColor = '#6B7280'
  const cardBorderColor = '#E5EAF0'
  const isFav = doctor ? isDoctorFavorite(doctor.id) : false

  const canonicalPath = `/doctors/${doctor?.district_slug || district || 'bangladesh'}/${doctor?.upazila_slug || upazila || 'general'}/${doctor?.slug || slug || doctor?.id}`
  const doctorOgImage = doctor?.photo ? getMediaUrl(doctor.photo) : (doctor?.photo_url ? getMediaUrl(doctor.photo_url) : DEMO_AVATAR)

  return (
    <div className="page-wrapper" style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>
      <SeoHead
        title={`${doctor?.name || 'ডাক্তার প্রোফাইল'} — ${doctor?.specialty?.name_bn || doctor?.specialty?.name || 'বিশেষজ্ঞ'} | MedConnect`}
        description={`${doctor?.name} (${doctor?.degree || 'MBBS'}) - ${doctor?.specialty?.name_bn || doctor?.specialty?.name || 'বিশেষজ্ঞ চিকিৎসা'}। চেম্বার ও অ্যাপয়েন্টমেন্টের তথ্য।`}
        canonicalUrl={`${window.location.origin}${canonicalPath}`}
        ogImage={doctorOgImage}
        ogType="profile"
        schemaData={[doctorSchema, breadcrumbSchema].filter(Boolean)}
      />
      
      {/* MOBILE APP BAR TOP HEADER (SHOWS ON MOBILE ONLY — MATCHING IMAGE 2) */}
      <div className="d-flex d-lg-none align-items-center justify-content-between px-3 py-3 bg-white border-bottom sticky-top" style={{ zIndex: 1020 }}>
        <button 
          type="button"
          onClick={() => navigate(-1)} 
          style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#0F172A', display: 'flex', alignItems: 'center' }}
        >
          <IconArrowLeft size={22} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0, fontFamily: 'inherit' }}>
          Profile
        </h1>
        <button 
          type="button"
          onClick={() => doctor && triggerShare({
            title: doctor.name,
            text: `${specialtyName} | Doctor Booklet`,
            url: window.location.href,
            image: doctor.photo || DEMO_AVATAR
          })}
          style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#0F172A', display: 'flex', alignItems: 'center' }}
        >
          <IconShare size={20} />
        </button>
      </div>

      {/* 1. Top Breadcrumb Line (Desktop Only) */}
      <div className="doc-detail-breadcrumb d-none d-lg-block" style={{ background: '#FFFFFF', borderBottom: `1px solid ${cardBorderColor}`, padding: '12px 0' }}>
        <Container>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: primaryGreen, cursor: 'pointer' }} onClick={() => navigate('/')}>হোম</span>
            <IconChevronRight size={14} color={mutedTextColor} />
            <span style={{ color: primaryGreen, cursor: 'pointer' }} onClick={() => navigate('/doctors')}>ডাক্তার নির্দেশিকা</span>
            <IconChevronRight size={14} color={mutedTextColor} />
            {doctor?.district?.name && (
              <>
                <span style={{ color: primaryGreen, cursor: 'pointer' }} onClick={() => navigate(`/doctors?district_id=${doctor.district.id}`)}>{doctor.district.name}</span>
                <IconChevronRight size={14} color={mutedTextColor} />
              </>
            )}
            {doctor?.upazila?.name && (
              <>
                <span style={{ color: primaryGreen, cursor: 'pointer' }} onClick={() => navigate(`/doctors?upazila_id=${doctor.upazila.id}`)}>{doctor.upazila.name}</span>
                <IconChevronRight size={14} color={mutedTextColor} />
              </>
            )}
            <span style={{ color: mutedTextColor }}>{doctor?.name}</span>
          </div>
        </Container>
      </div>

      {/* 2. Main Page Center Container (Left & Right Split) */}
      <Container className="py-0 py-lg-5 doc-detail-container">

        {/* MOBILE COMPACT DOCTOR PROFILE CARD (SHOWS ON MOBILE ONLY — MATCHING IMAGE 2 EXACTLY) */}
        <div className="d-block d-lg-none bg-white p-3 mb-2 doc-detail-mobile-card-inner">
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
            {/* Square Avatar with Appointment Badge Tag */}
            <div style={{ position: 'relative', width: 90, height: 98, flexShrink: 0, borderRadius: 12, overflow: 'hidden', background: '#F1F5F9' }}>
              <img
                src={getMediaUrl(doctor?.photo || doctor?.photo_url || doctor?.image || doctor?.avatar, DEMO_AVATAR)}
                alt={doctor?.name || 'Doctor'}
                onError={(e) => { e.target.src = DEMO_AVATAR }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: '#00B875',
                color: 'white',
                fontSize: 10.5,
                fontWeight: 800,
                textAlign: 'center',
                padding: '2px 0'
              }}>
                Appointment
              </div>
            </div>

            {/* Info Column */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: darkTextColor, margin: '0 0 3px 0', lineHeight: 1.3 }}>
                {doctor?.name}
              </h2>
              <div style={{ fontSize: 12, fontWeight: 600, color: mutedTextColor, marginBottom: 8, lineHeight: 1.4 }}>
                {doctor?.degree || 'MBBS, MCPS (Gynae & Obs), MS (Gynae & Obs), FCPS (Gynae & Obs)'}
              </div>

              {/* Specialty Ribbon Tag */}
              <div>
                <span style={{
                  background: '#00B875',
                  color: 'white',
                  padding: '3px 10px 3px 8px',
                  borderRadius: '4px 2px 2px 4px',
                  clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)',
                  fontSize: 11,
                  fontWeight: 800,
                  display: 'inline-block',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {specialtyName}
                </span>
              </div>
            </div>
          </div>

          {/* 3 Stats Columns with Vertical Dotted/Light Dividers (Matching Image 2) */}
          <div style={{
            borderTop: '1px solid #F1F5F9',
            borderBottom: '1px solid #F1F5F9',
            padding: '10px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12
          }}>
            <div style={{ textAlign: 'center', flex: 1, borderRight: '1px solid #E2E8F0', padding: '0 4px' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: mutedTextColor, display: 'block', marginBottom: 2 }}>Total Experience</span>
              <span style={{ fontSize: 14.5, fontWeight: 900, color: darkTextColor }}>{doctor?.experience || '15'}+ Years</span>
            </div>
            <div style={{ textAlign: 'center', flex: 1, borderRight: '1px solid #E2E8F0', padding: '0 4px' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: mutedTextColor, display: 'block', marginBottom: 2 }}>BMDC Number</span>
              <span style={{ fontSize: 14.5, fontWeight: 900, color: darkTextColor }}>{doctor?.bmdc_number || doctor?.bmdc_no || '51550'}</span>
            </div>
            <div style={{ textAlign: 'center', flex: 1, padding: '0 4px' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: mutedTextColor, display: 'block', marginBottom: 2 }}>Total Rating</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyCenter: 'center', gap: 3 }}>
                <IconStar size={14} color="#F59E0B" fill="#F59E0B" />
                <span style={{ fontSize: 14.5, fontWeight: 900, color: darkTextColor }}>{averageRating}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: mutedTextColor }}>({(reviews || []).length * 100 + 51})</span>
              </div>
            </div>
          </div>

          {/* Working Location Row */}
          <div style={{ fontSize: 11, color: mutedTextColor, fontWeight: 600 }}>
            Working in
            <div style={{ fontSize: 13, fontWeight: 800, color: darkTextColor, marginTop: 2 }}>
              {sortedChambers?.[0]?.hospital?.name || doctor?.hospital?.name || 'Dhaka medical college hospital'}
            </div>
          </div>
        </div>

        <Row className="g-4 align-items-start">

          {/* ================= LEFT SIDE PROFILE SIDEBAR (DESKTOP ONLY) ================= */}
          <Col lg={4} xl={4} className="d-none d-lg-block">
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
                  src={getMediaUrl(doctor?.photo || doctor?.photo_url || doctor?.image || doctor?.avatar, DEMO_AVATAR)} 
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
                
                {/* Verified Badge on Top Right of Rectangular Image */}
                <div style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#00B875',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(0, 184, 117, 0.35)',
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
                  {totalExpLabel}
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
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit'
                }}
              >
                <IconShare size={18} /> প্রোফাইল শেয়ার করুন
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
                    boxShadow: '0 4px 12px rgba(0,168,140,0.2)',
                    fontFamily: 'inherit'
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
                  title={isFav ? 'সংরক্ষিত' : 'সংরক্ষণ করুন'}
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
              
              {/* Top Menu Tabs (Inside Right Box Top — Pill Container Design) */}
              <div className="top-menu-tabs-wrapper" style={{
                background: '#F1F5F9',
                borderRadius: 99,
                padding: '5px',
                marginBottom: 24,
                position: 'sticky',
                top: 'calc(var(--header-height, 135px) + 10px)',
                zIndex: 9,
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}>
                <Nav className="flex-nowrap align-items-center justify-content-between" activeKey={activeTab} onSelect={(k) => handleTabChange(k)} style={{ gap: 4 }}>
                  {[
                    { key: 'about', label: 'ডাক্তার সম্পর্কে', icon: <IconUser size={16} /> },
                    { key: 'chamber', label: 'চেম্বার ও সময়সূচি', icon: <IconBuildingHospital size={16} /> },
                    { key: 'experience', label: 'অভিজ্ঞতা', icon: <IconBriefcase size={16} /> },
                    { key: 'reviews', label: 'রিভিউ', icon: <IconStar size={16} /> }
                  ].map(tab => {
                    const isActive = activeTab === tab.key
                    return (
                      <Nav.Item key={tab.key} style={{ flex: 1, textAlign: 'center' }}>
                        <Nav.Link 
                          eventKey={tab.key}
                          style={{ 
                            padding: '10px 8px',
                            fontSize: 13.5,
                            fontWeight: isActive ? 800 : 600,
                            color: isActive ? primaryGreen : '#64748B',
                            borderRadius: 99,
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            background: isActive ? '#FFFFFF' : 'transparent',
                            boxShadow: isActive ? '0 2px 10px rgba(0, 0, 0, 0.08)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            whiteSpace: 'nowrap',
                            border: 'none',
                            fontFamily: 'inherit'
                          }}
                        >
                          {tab.icon} <span>{tab.label}</span>
                        </Nav.Link>
                      </Nav.Item>
                    )
                  })}
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
                        ডাক্তার সম্পর্কে
                      </h3>
                    </div>

                    <p style={{ color: '#374151', fontSize: 15, lineHeight: 1.8, marginBottom: 24, textAlign: 'justify' }}>
                      {doctor?.bio || `ডাঃ ${doctor?.name || ''} একজন দক্ষ ও অভিজ্ঞ বিশেষজ্ঞ চিকিৎসক। তিনি দীর্ঘ দিন ধরে রোগীদের উন্নত স্বাস্থ্যসেবা ও সঠিক পরামর্শ প্রদানে নিরলসভাবে কাজ করে যাচ্ছেন।`}
                    </p>

                    {/* NOTE REQUIREMENT: বিশেষ দক্ষতা */}
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
                        <IconSchool size={18} color={primaryGreen} /> শিক্ষাগত যোগ্যতা ও সনদ
                      </h4>
                      <div className="d-flex flex-column gap-2">
                        {['MBBS - ঢাকা মেডিকেল কলেজ', 'MD (কার্ডিওলজি / বিশেষজ্ঞ)', 'FCPS - বিসিপিএস বাংলাদেশ'].map((edu, i) => (
                          <div key={i} className="d-flex align-items-center gap-2" style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, border: `1px solid ${cardBorderColor}` }}>
                            <IconCheck size={16} color={primaryGreen} />
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#334155' }}>{edu}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Chamber & Visiting Hour Section (GROUPED BY HOSPITAL) */}
                {activeTab === 'chamber' && (
                  <div id="section-chamber" className="tab-body-section animate-tab-view">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <IconBuildingHospital size={22} color={primaryGreen} />
                        <h3 style={{ fontSize: 19, fontWeight: 950, color: darkTextColor, margin: 0 }}>
                          চেম্বার ও সাক্ষাতের সময়সূচি
                        </h3>
                      </div>
                      {groupedChambers.length > 0 && (
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: '#007A65', background: lightGreenBg, padding: '4px 12px', borderRadius: 20, border: '1px solid #A7F3D0' }}>
                          {groupedChambers.length}টি চেম্বার লোকেশন
                        </span>
                      )}
                    </div>

                    <div className="d-flex flex-column gap-3">
                      {groupedChambers.map((group, idx) => (
                        <div 
                          key={group.hospitalId || idx}
                          style={{
                            padding: '20px 22px',
                            borderRadius: 16,
                            background: '#FFFFFF',
                            border: `1.5px solid ${cardBorderColor}`,
                            boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                            transition: 'all 0.25s ease'
                          }}
                        >
                          {/* Hospital Header */}
                          <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-3">
                            <div className="d-flex align-items-start gap-3">
                              <div style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                background: '#E8F8F2',
                                color: primaryGreen,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                border: '1px solid #A7F3D0'
                              }}>
                                <IconBuildingHospital size={22} />
                              </div>
                              <div>
                                <h4 style={{ fontSize: 16.5, fontWeight: 900, color: darkTextColor, margin: '0 0 4px 0' }}>
                                  {group.hospitalName}
                                </h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: mutedTextColor, fontSize: 13, fontWeight: 600 }}>
                                  <IconMapPin size={14} color={primaryGreen} style={{ flexShrink: 0 }} />
                                  <span>{group.address}</span>
                                </div>
                              </div>
                            </div>

                            {group.schedules.length > 1 && (
                              <span style={{
                                background: '#F1F5F9',
                                color: '#334155',
                                fontSize: 12,
                                fontWeight: 800,
                                padding: '3px 10px',
                                borderRadius: 6,
                                border: '1px solid #E2E8F0'
                              }}>
                                {group.schedules.length}টি সময়সূচি
                              </span>
                            )}
                          </div>

                          {/* Visiting Schedules list */}
                          <div className="d-flex flex-column gap-2">
                            {group.schedules.map((sch, sIdx) => {
                              const fee = sch?.fee || doctor?.fee || doctor?.consultation_fee
                              const dayBn = dayNamesBn[sch?.day] || (sch?.day ? translateMetadata(sch.day, language, t) : 'সাপ্তাহিক দিন')
                              return (
                                <div
                                  key={sch?.id || sIdx}
                                  className="doc-schedule-card"
                                >
                                  {/* Top / Left Group: Day + Time + Desktop Fee */}
                                  <div className="doc-schedule-left">
                                    {/* Day Badge */}
                                    <span className="doc-schedule-day">
                                      <IconCalendarEvent size={14} color={primaryGreen} />
                                      <span>{dayBn}</span>
                                    </span>

                                    {/* Time */}
                                    <div className="doc-schedule-time">
                                      <IconClock size={14} color={primaryGreen} />
                                      <span>
                                        {sch?.start_time ? `${formatTimeBn(sch.start_time)} - ${formatTimeBn(sch.end_time)}` : 'বিকাল ৫:০০ - রাত ৯:০০'}
                                      </span>
                                    </div>

                                    {/* Fee Tag on Desktop */}
                                    {fee && (
                                      <span className="doc-schedule-fee d-none d-sm-inline-flex">
                                        ৳{fee} ফি
                                      </span>
                                    )}
                                  </div>

                                  {/* Bottom / Right Group: Mobile Fee + Booking Button */}
                                  <div className="doc-schedule-right">
                                    {/* Fee Tag on Mobile */}
                                    {fee ? (
                                      <span className="doc-schedule-fee d-inline-flex d-sm-none">
                                        ৳{fee} ফি
                                      </span>
                                    ) : <div className="d-sm-none" />}

                                    {/* Booking Button */}
                                    <button 
                                      type="button"
                                      onClick={() => handleBook(sch?.id)}
                                      className="doc-schedule-btn"
                                    >
                                      <IconCalendarEvent size={15} color="white" />
                                      <span>অ্যাপয়েন্টমেন্ট নিন</span>
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                      {groupedChambers.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '36px 20px', background: '#F8FAFC', borderRadius: 16, border: '1px dashed #CBD5E1', color: '#64748B' }}>
                          <IconBuildingHospital size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>ডাক্তারের কোনো চেম্বার তথ্য পাওয়া যায়নি</p>
                        </div>
                      )}
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
                        doctor.experiences.map((exp, idx) => {
                          const isPresent = Boolean(
                            exp?.is_current ||
                            exp?.currently_working ||
                            (typeof exp?.period === 'string' && /present|বর্তমান/i.test(exp.period)) ||
                            (typeof exp?.end_date === 'string' && /present|বর্তমান/i.test(exp.end_date)) ||
                            (typeof exp?.to_date === 'string' && /present|বর্তমান/i.test(exp.to_date))
                          )

                          return (
                            <div
                              key={exp.id || idx}
                              style={{
                                padding: '18px 20px 16px',
                                background: isPresent ? '#F0FDF4' : '#F8FAFC',
                                borderRadius: 16,
                                border: isPresent ? '1.5px solid #00B875' : `1px solid ${cardBorderColor}`,
                                boxShadow: isPresent ? '0 4px 14px rgba(0, 184, 117, 0.08)' : 'none',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 14
                              }}
                            >
                              {/* Top Right Floating Badge (Exact same style as 'প্রস্তাবিত') */}
                              {isPresent && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '-10px',
                                    right: '20px',
                                    background: '#00B875',
                                    color: '#FFFFFF',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '2px 10px',
                                    borderRadius: '6px',
                                    boxShadow: '0 2px 6px rgba(0, 184, 117, 0.25)',
                                    fontFamily: "'Hind Siliguri', sans-serif"
                                  }}
                                >
                                  বর্তমানে কর্মরত আছেন
                                </div>
                              )}

                              <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                background: isPresent ? '#FFFFFF' : lightGreenBg,
                                border: isPresent ? '1px solid #A7F3D0' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                marginTop: 2,
                                color: primaryGreen
                              }}>
                                <IconBriefcase size={20} />
                              </div>

                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
                                  <h5 style={{ fontSize: 16, fontWeight: 600, color: darkTextColor, margin: 0 }}>
                                    {exp.designation || 'Specialist Doctor'}
                                  </h5>
                                  {exp.duration && (
                                    <span style={{ fontSize: 12, fontWeight: 500, color: primaryGreen, background: isPresent ? '#DCFCE7' : lightGreenBg, padding: '3px 10px', borderRadius: 20 }}>
                                      {exp.duration}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 500, color: primaryGreen, margin: '0 0 4px' }}>
                                  {exp.hospital_name || 'Hospital / Institute'}
                                </div>
                                {exp.department && (
                                  <div style={{ margin: '0 0 6px 0' }}>
                                    <span style={{
                                      background: '#00B875',
                                      color: 'white',
                                      fontSize: 11.5,
                                      fontWeight: 400,
                                      padding: '2px 8px',
                                      borderRadius: 4,
                                      display: 'inline-block',
                                      fontFamily: "'Hind Siliguri', sans-serif"
                                    }}>
                                      {exp.department}
                                    </span>
                                  </div>
                                )}
                                <div className="d-flex align-items-center gap-3 flex-wrap text-muted" style={{ fontSize: 12.5, fontWeight: 400 }}>
                                  {exp.period && <span>📅 {exp.period}</span>}
                                  {exp.address && <span>📍 {exp.address}</span>}
                                </div>
                              </div>
                            </div>
                          )
                        })
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

                    {/* Rating Breakdown */}
                    <div className="mb-4" style={{ background: '#F8FAFC', borderRadius: 16, padding: 20, border: `1px solid ${cardBorderColor}` }}>
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
                            style={{ padding: '9px 24px', borderRadius: 10, border: 'none', background: primaryGreen, color: 'white', fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            রিভিউ জমা দিন
                          </button>
                        </form>
                      ) : (
                        <div className="d-flex align-items-center justify-content-between">
                          <span style={{ fontSize: 14, fontWeight: 700, color: darkTextColor }}>রিভিউ দিতে চান?</span>
                          <button
                            onClick={() => navigate('/login', { state: { from: `/doctor/${id}` } })}
                            style={{ padding: '6px 18px', borderRadius: 8, border: `1px solid ${primaryGreen}`, background: 'white', color: primaryGreen, fontWeight: 900, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
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

      {/* STICKY MOBILE BOTTOM BAR (CRISP CARD STYLING & BENGALI TEXT) */}
      <div className="d-block d-lg-none" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        padding: '12px 18px',
        boxShadow: '0 -6px 25px rgba(0, 0, 0, 0.12)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 2 }}>চেম্বার ফি</span>
            <span style={{ fontSize: 20, fontWeight: 950, color: primaryGreen }}>৳{lowestFee || doctor?.fee || '৫০০'}</span>
          </div>
          <button
            type="button"
            onClick={() => handleBook()}
            style={{
              flex: 1,
              maxWidth: 220,
              background: primaryGreen,
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '12px 20px',
              fontSize: 15,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(0, 184, 117, 0.35)',
              fontFamily: 'inherit'
            }}
          >
            <IconCalendarEvent size={19} color="white" />
            <span>অ্যাপয়েন্টমেন্ট নিন</span>
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .doc-schedule-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          background: #FAFBFD;
          border: 1px solid #EEF1F6;
          transition: all 0.2s ease;
        }
        .doc-schedule-card:hover {
          border-color: #CBD5E1;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }
        .doc-schedule-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .doc-schedule-day {
          background: #FFFFFF;
          color: #0F172A;
          border: 1.5px solid #CBD5E1;
          border-radius: 8px;
          padding: 4px 10px;
          fontSize: 12.5px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
        }
        .doc-schedule-time {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #334155;
          font-size: 13px;
          font-weight: 700;
        }
        .doc-schedule-fee {
          background: #E8F8F2;
          color: #00B875;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid #A7F3D0;
          align-items: center;
        }
        .doc-schedule-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .doc-schedule-btn {
          padding: 8px 18px;
          border-radius: 10px;
          border: none;
          background: #00B875;
          color: white;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 8px rgba(0, 184, 117, 0.25);
          transition: all 0.2s ease;
          font-family: inherit;
          white-space: nowrap;
        }
        .doc-schedule-btn:hover {
          background: #059669;
          transform: translateY(-1px);
        }

        @media (max-width: 576px) {
          .doc-schedule-card {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding: 12px 14px;
          }
          .doc-schedule-left {
            justify-content: flex-start;
            gap: 8px;
          }
          .doc-schedule-right {
            justify-content: space-between;
            width: 100%;
            padding-top: 6px;
            border-top: 1px dashed #E2E8F0;
          }
        }

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
          display: flex !important;
          flex-wrap: nowrap !important;
        }
        .btn-share-profile:hover {
          background: #D1FAE5 !important;
        }
        .btn-book-now:hover {
          background: #009E64 !important;
        }
        @media (max-width: 991px) {
          .db-topbar, .db-main-header, .navbar, .doc-detail-breadcrumb, footer {
            display: none !important;
          }
          .doc-detail-container {
            padding-top: 0 !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            padding-bottom: 85px !important;
          }
          .doc-detail-mobile-card-inner {
            border-radius: 0 !important;
            border-left: none !important;
            border-right: none !important;
            margin-bottom: 8px !important;
          }
          .right-main-card {
            padding: 16px 14px !important;
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .top-menu-tabs-wrapper {
            top: 52px !important;
            margin: 0 12px 18px 12px !important;
            padding: 4px !important;
            background: #F8FAFC !important;
            border-radius: 99px !important;
          }
          .top-menu-tabs-wrapper .nav {
            gap: 2px !important;
            justify-content: space-between !important;
            width: 100% !important;
          }
          .top-menu-tabs-wrapper .nav-item {
            flex: 1 1 0px !important;
            min-width: 0 !important;
          }
          .top-menu-tabs-wrapper .nav-link {
            font-size: 13px !important;
            padding: 8px 4px !important;
            gap: 4px !important;
          }
          .top-menu-tabs-wrapper .nav-link svg {
            display: none !important;
          }
          .top-menu-tabs-wrapper .nav-link span {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
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

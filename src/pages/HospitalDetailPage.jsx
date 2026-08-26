import { useState, useMemo, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Row, Col, Nav, Modal } from 'react-bootstrap'
import useHospitalDetail from '../hooks/useHospitalDetail'
import useDoctors from '../hooks/useDoctors'
import DoctorCard from '../components/common/DoctorCard'
import HospitalCard from '../components/common/HospitalCard'
import useHospitalRelated from '../hooks/useHospitalRelated'
import { HospitalDetailSkeleton } from '../components/common/Skeletons'
import BreadcrumbHUD from '../components/common/BreadcrumbHUD'
import { ReviewList, ReviewReplyModal, ReviewReportModal, ReviewFormModal } from '../components/reviews'
import { useDeleteReview } from '../features/reviews/useReviews'
import { useDialog } from '../hooks/useDialog'
import { DIALOG_MESSAGES, DIALOG_BUTTONS } from '../utils/dialogMessages'
import toast from 'react-hot-toast'
import SeoHead from '../components/common/SeoHead'
import { buildHospitalSchema } from '../utils/schemaBuilder'
import { getMediaUrl } from '../utils/mediaUtils'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../context/ThemeContext'
import { useFavorites } from '../context/FavoritesContext'
import { useAuth } from '../context/AuthContext'
import { translateMetadata } from '../utils/translationUtils'
import useShare from '../hooks/useShare'
import ShareModal from '../components/common/ShareModal'
import { 
  IconHeart, IconShare, IconCircleCheckFilled, IconMapPin, IconClock, 
  IconPhone, IconWorld, IconStar, IconUsers, IconBed, 
  IconAmbulance, IconStethoscope, IconNurse, IconMicroscope,
  IconChevronRight, IconMessageQuestion, IconPhoto, IconBriefcase,
  IconCalendarEvent, IconCheck, IconDiscountCheckFilled,
  IconScissors, IconEye, IconBuildingHospital, IconSend, IconLayoutGrid, IconActivity, IconPlus, IconX, IconSearch, IconMail, IconCompass, IconBrandLinkedin, IconBrandTwitter, IconBrandX, IconBrandYoutube, IconBrandFacebook
} from '@tabler/icons-react'

const DEMO_BANNER = 'https://images.unsplash.com/photo-1587350859728-1176c2bc003f?q=80&w=2070&auto=format&fit=crop'
const DEMO_LOGO = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=2070&auto=format&fit=crop'

const ALL_DEPARTMENTS = [
  { id: 'cardiology', name: 'কার্ডিওলজি', sub: 'হৃদরোগ বিভাগ', icon: <IconHeart size={26} /> },
  { id: 'neurology', name: 'নিউরোলজি', sub: 'স্নায়ুরোগ বিভাগ', icon: <IconActivity size={26} /> },
  { id: 'gastroenterology', name: 'গ্যাস্ট্রোএন্টারোলজি', sub: 'হজম ও লিভার বিভাগ', icon: <IconActivity size={26} /> },
  { id: 'orthopedics', name: 'অর্থোপেডিকস', sub: 'হাড় ও জয়েন্ট বিভাগ', icon: <IconActivity size={26} /> },
  { id: 'urology', name: 'ইউরোলজি', sub: 'মূত্র ও কিডনি বিভাগ', icon: <IconScissors size={26} /> },
  { id: 'gynecology', name: 'গাইনি ও অবস', sub: 'নারী ও প্রসূতি বিভাগ', icon: <IconUsers size={26} /> },
  { id: 'ophthalmology', name: 'চক্ষু বিভাগ', sub: 'চোখের সেবা', icon: <IconEye size={26} /> },
  { id: 'ent', name: 'ইএনটি', sub: 'কান, নাক, গলা', icon: <IconStethoscope size={26} /> },
  { id: 'pediatrics', name: 'শিশুরোগ বিভাগ', sub: 'নবজাতক ও শিশু বিশেষজ্ঞ', icon: <IconUsers size={26} /> },
  { id: 'dermatology', name: 'ডার্মাটোলজি', sub: 'চর্ম ও যৌন রোগ বিভাগ', icon: <IconActivity size={26} /> },
  { id: 'dental', name: 'ডেন্টাল কেয়ার', sub: 'দন্ত চিকিৎসা বিভাগ', icon: <IconScissors size={26} /> },
  { id: 'nephrology', name: 'নেফ্রোলজি', sub: 'কিডনি ও ডায়ালাইসিস', icon: <IconActivity size={26} /> },
  { id: 'pulmonology', name: 'পালমোনোলজি', sub: 'বক্ষব্যাধি ও অ্যাজমা', icon: <IconActivity size={26} /> },
  { id: 'oncology', name: 'অনকোলজি', sub: 'ক্যান্সার কেয়ার ইউনিট', icon: <IconHeart size={26} /> },
  { id: 'psychiatry', name: 'সাইকিয়াট্রি', sub: 'মানসিক স্বাস্থ্য বিভাগ', icon: <IconUsers size={26} /> },
  { id: 'surgery', name: 'জেনারেল সার্জারি', sub: 'ল্যাপারোস্কোপিক অস্ত্রোপচার', icon: <IconScissors size={26} /> },
  { id: 'endocrinology', name: 'এন্ডোক্রিনোলজি', sub: 'ডায়াবেটিস ও হরমোন', icon: <IconActivity size={26} /> },
  { id: 'emergency', name: 'ইমার্জেন্সি ও ট্রমা', sub: '২৪/৭ জরুরি বিভাগ', icon: <IconAmbulance size={26} /> }
]

function HospitalDetailPage() {
  const { district, upazila, slug, id } = useParams()
  const navigate = useNavigate()
  const { isHospitalFavorite, toggleFavoriteHospital } = useFavorites()
  const { user } = useAuth() || {}
  const { triggerShare, shareModalOpen, shareData, closeShareModal } = useShare()
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const { theme } = useTheme()

  const [deptModalOpen, setDeptModalOpen] = useState(false)

  // Review Module Modal States
  const [selectedReviewForReply, setSelectedReviewForReply] = useState(null)
  const [selectedReviewForReport, setSelectedReviewForReport] = useState(null)
  const [selectedReviewForEdit, setSelectedReviewForEdit] = useState(null)

  const { confirm, showSuccess, showError } = useDialog()
  const deleteReviewMutation = useDeleteReview()

  const handleDeleteReview = async (rev) => {
    const isConfirmed = await confirm({
      title: DIALOG_MESSAGES.REVIEW_DELETE_CONFIRM.title,
      message: DIALOG_MESSAGES.REVIEW_DELETE_CONFIRM.message,
      confirmText: DIALOG_BUTTONS.DELETE,
      cancelText: DIALOG_BUTTONS.CANCEL,
      variant: 'danger',
    })

    if (isConfirmed) {
      try {
        await deleteReviewMutation.mutateAsync(rev.public_id || rev.id)
        showSuccess({
          title: DIALOG_MESSAGES.REVIEW_DELETE_SUCCESS.title,
          message: DIALOG_MESSAGES.REVIEW_DELETE_SUCCESS.message,
        })
      } catch (err) {
        showError({
          title: DIALOG_MESSAGES.ERROR.title,
          message: DIALOG_MESSAGES.ERROR.message,
        })
      }
    }
  }
  const [deptSearchQuery, setDeptSearchQuery] = useState('')

  const filteredDepartments = useMemo(() => {
    if (!deptSearchQuery.trim()) return ALL_DEPARTMENTS
    const q = deptSearchQuery.toLowerCase()
    return ALL_DEPARTMENTS.filter(d => 
      d.name.toLowerCase().includes(q) || d.sub.toLowerCase().includes(q)
    )
  }, [deptSearchQuery])

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
          <div style={{ position: 'relative', zIndex: 10, width: '100%', paddingBottom: 20, paddingTop: 20 }}>
            <Container>
              <div
                className="hero-bottom-row"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  gap: 16
                }}
              >

                {/* ── Floating White Info Card ── */}
                <div
                  className="hero-info-card"
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 20,
                    padding: '16px 20px 14px 20px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
                    flex: '1 1 auto',
                    maxWidth: 580,
                    minWidth: 0
                  }}
                >
                  {/* Card Top Section: Logo + Title + Subtitle + Rating + Favorite Button */}
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    
                    {/* Logo Box */}
                    <div
                      style={{
                        width: 76,
                        height: 76,
                        minWidth: 76,
                        borderRadius: 14,
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
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
                          <h1
                            style={{
                              fontSize: 'clamp(16px, 2vw, 22px)',
                              fontWeight: 900,
                              color: '#1E293B',
                              margin: 0,
                              lineHeight: 1.2
                            }}
                          >
                            {hospital?.name || 'ABC Hospital'}
                          </h1>
                          <IconDiscountCheckFilled size={20} color="#00A88C" style={{ flexShrink: 0 }} />
                        </div>

                        {/* Favorite Heart Icon Button on Right Side of Hospital Name */}
                        <button
                          type="button"
                          aria-label={hospital && isHospitalFavorite(hospital.id) ? 'সংরক্ষিত' : 'সংরক্ষণ করুন'}
                          onClick={() => hospital && toggleFavoriteHospital(hospital)}
                          style={{
                            width: 36,
                            height: 36,
                            minWidth: 36,
                            borderRadius: 10,
                            border: `1.5px solid ${hospital && isHospitalFavorite(hospital.id) ? '#FECDD3' : '#E2E8F0'}`,
                            background: hospital && isHospitalFavorite(hospital.id) ? '#FEF2F2' : '#F8FAFC',
                            color: hospital && isHospitalFavorite(hospital.id) ? '#EF4444' : '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                            transition: 'all 0.2s ease',
                            padding: 0
                          }}
                          title={hospital && isHospitalFavorite(hospital.id) ? 'সংরক্ষিত' : 'সংরক্ষণ করুন'}
                        >
                          <IconHeart
                            size={19}
                            fill={hospital && isHospitalFavorite(hospital.id) ? '#EF4444' : 'none'}
                            color={hospital && isHospitalFavorite(hospital.id) ? '#EF4444' : '#64748B'}
                          />
                        </button>
                      </div>

                      <p style={{ fontSize: 13, fontWeight: 700, color: '#64748B', margin: '2px 0 5px 0' }}>
                        মাল্টিস্পেশালিটি হাসপাতাল
                      </p>

                      {/* Rating & NABH Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <IconStar size={15} color="#F59E0B" fill="#F59E0B" />
                          <span style={{ fontSize: 14, fontWeight: 900, color: '#1E293B' }}>4.8</span>
                          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>(৩,৫০০+ রিভিউ)</span>
                        </div>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: '#E6F8F3',
                            color: '#008A74',
                            borderRadius: 6,
                            padding: '2px 8px',
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
                  <div style={{ height: 1, background: '#F1F5F9', margin: '10px 0 8px 0' }} />

                  {/* Card Bottom Meta: Location, Phone, Website (Single Compact Line) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      flexWrap: 'wrap',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#64748B'
                    }}
                  >
                    {/* Location */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
                      <IconMapPin size={14} color="#00A88C" style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={hospital?.address || 'ধানমণ্ডি, ঢাকা'}>
                        {hospital?.address || 'ধানমণ্ডি, ঢাকা'}
                      </span>
                    </div>

                    {/* Phone */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, whiteSpace: 'nowrap' }}>
                      <IconPhone size={14} color="#00A88C" style={{ flexShrink: 0 }} />
                      <span>{hospital?.phone || '011100111w'}</span>
                    </div>

                    {/* Website */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, whiteSpace: 'nowrap' }}>
                      <IconWorld size={14} color="#00A88C" style={{ flexShrink: 0 }} />
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

                {/* ── 4 Action Buttons Row (One Row on Desktop Beside Card) ── */}
                <div
                  className="hero-action-btns"
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    flexShrink: 0
                  }}
                >
                  {/* 1. Appointment */}
                  <button
                    type="button"
                    aria-label="অ্যাপয়েন্টমেন্ট নিন"
                    onClick={() => navigate(`/doctors?hospital_id=${id}`)}
                    className="hero-btn-primary"
                    style={{
                      height: 44,
                      padding: '0 16px',
                      borderRadius: 12,
                      border: 'none',
                      background: '#00B875',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: 13.5,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(0, 184, 117, 0.35)',
                      whiteSpace: 'nowrap',
                      transition: 'transform 0.15s, background 0.15s'
                    }}
                  >
                    <IconCalendarEvent size={17} />
                    অ্যাপয়েন্টমেন্ট নিন
                  </button>

                  {/* 2. Call */}
                  <a
                    href={`tel:${hospital?.phone || ''}`}
                    aria-label="কল করুন"
                    className="hero-btn-secondary"
                    style={{
                      height: 44,
                      padding: '0 14px',
                      borderRadius: 12,
                      border: '1.5px solid #E2E8F0',
                      background: '#FFFFFF',
                      color: '#1E293B',
                      fontWeight: 800,
                      fontSize: 13.5,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.07)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <IconPhone size={16} color="#00A88C" />
                    কল করুন
                  </a>

                  {/* 3. Direction */}
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(hospital?.address || hospital?.name || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="দিক নির্দেশনা"
                    className="hero-btn-secondary"
                    style={{
                      height: 44,
                      padding: '0 14px',
                      borderRadius: 12,
                      border: '1.5px solid #E2E8F0',
                      background: '#FFFFFF',
                      color: '#1E293B',
                      fontWeight: 800,
                      fontSize: 13.5,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.07)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <IconSend size={16} color="#00A88C" />
                    দিক নির্দেশনা
                  </a>

                  {/* 4. Share (Mobile & Desktop 4th Slot) */}
                  <button
                    type="button"
                    aria-label="শেয়ার করুন"
                    onClick={() => hospital && triggerShare({
                      title: hospital.name,
                      text: (hospital.address || 'হাসপাতাল') + ' | Doctor Booklet',
                      url: window.location.href,
                      image: hospital.photo_url || DEMO_BANNER
                    })}
                    className="hero-btn-secondary"
                    style={{
                      height: 44,
                      padding: '0 14px',
                      borderRadius: 12,
                      border: '1.5px solid #E2E8F0',
                      background: '#FFFFFF',
                      color: '#1E293B',
                      fontWeight: 800,
                      fontSize: 13.5,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.07)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <IconShare size={16} color="#00A88C" />
                    শেয়ার
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
      <div style={{ background: "#F8FAFC", minHeight: "100vh", paddingTop: 32, paddingBottom: 60 }}><Container>
        <Row className="g-5">
          {/* Main Content Column (All Sections in White Card Design) */}
          <Col lg={8}>
            <div className="d-flex flex-column" style={{ gap: '24px' }}>
              
              {/* 1. Top Key Stats Bar (150+ Doctors, 350 Beds, 20+ Departments, 24/7 Emergency) */}
              <Row className="g-3">
                <Col xs={6} md={3}>
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: 18,
                    padding: '16px 14px',
                    border: `1.5px solid #E2E8F0`,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    height: '100%'
                  }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: '#E6F8F3',
                      color: primaryGreen,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <IconUsers size={22} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 'clamp(17px, 1.5vw, 21px)', fontWeight: 950, color: textColor, margin: 0, lineHeight: 1.1 }}>
                        {hospital?.doctors_count ? `${hospital.doctors_count}+` : '150+'}
                      </h4>
                      <p style={{ fontSize: 12, fontWeight: 700, color: mutedColor, margin: '3px 0 0 0' }}>
                        বিশেষজ্ঞ ডাক্তার
                      </p>
                    </div>
                  </div>
                </Col>

                <Col xs={6} md={3}>
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: 18,
                    padding: '16px 14px',
                    border: `1.5px solid #E2E8F0`,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    height: '100%'
                  }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: '#E6F8F3',
                      color: primaryGreen,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <IconBed size={22} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 'clamp(17px, 1.5vw, 21px)', fontWeight: 950, color: textColor, margin: 0, lineHeight: 1.1 }}>
                        {hospital?.bed_count || '350'}
                      </h4>
                      <p style={{ fontSize: 12, fontWeight: 700, color: mutedColor, margin: '3px 0 0 0' }}>
                        বেড সুবিধা
                      </p>
                    </div>
                  </div>
                </Col>

                <Col xs={6} md={3}>
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: 18,
                    padding: '16px 14px',
                    border: `1.5px solid #E2E8F0`,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    height: '100%'
                  }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: '#E6F8F3',
                      color: primaryGreen,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <IconBuildingHospital size={22} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 'clamp(17px, 1.5vw, 21px)', fontWeight: 950, color: textColor, margin: 0, lineHeight: 1.1 }}>
                        {ALL_DEPARTMENTS?.length ? `${ALL_DEPARTMENTS.length}+` : '20+'}
                      </h4>
                      <p style={{ fontSize: 12, fontWeight: 700, color: mutedColor, margin: '3px 0 0 0' }}>
                        বিভাগ সমূহ
                      </p>
                    </div>
                  </div>
                </Col>

                <Col xs={6} md={3}>
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: 18,
                    padding: '16px 14px',
                    border: `1.5px solid #E2E8F0`,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    height: '100%'
                  }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: '#E6F8F3',
                      color: primaryGreen,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <IconClock size={22} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 'clamp(17px, 1.5vw, 21px)', fontWeight: 950, color: textColor, margin: 0, lineHeight: 1.1 }}>
                        24/7
                      </h4>
                      <p style={{ fontSize: 12, fontWeight: 700, color: mutedColor, margin: '3px 0 0 0' }}>
                        জরুরি সেবা
                      </p>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* 2. About Section (Card Design) */}
              <div 
                id="summary" 
                className="scroll-section"
                style={{
                  background: '#FFFFFF',
                  borderRadius: 20,
                  padding: '28px 24px',
                  border: `1.5px solid #E2E8F0`,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }}
              >
                <h3 style={{ fontSize: 20, fontWeight: 950, color: textColor, marginBottom: 14 }}>
                  হাসপাতাল সম্পর্কে
                </h3>
                <p style={{ color: '#334155', fontSize: 15, lineHeight: 1.8, margin: 0, textAlign: 'justify' }}>
                  {hospital?.bio || 'ABC Hospital একটি আধুনিক ও মাল্টিস্পেশালিটি হাসপাতাল। ১৯৯৫ সাল থেকে আমরা উন্নত চিকিৎসা সেবা দিয়ে আসছি। অভিজ্ঞ ডাক্তার, আধুনিক প্রযুক্তি ও মানসম্মত সেবাই আমাদের মূল লক্ষ্য।'}
                </p>

                {/* Key Facts Summary Bar (স্থাপিত সাল, ধরন, শাখা, রোগী পরিষেবা) */}
                <div 
                  style={{
                    marginTop: 20,
                    background: '#F8FAFC',
                    borderRadius: 14,
                    border: '1px solid #E2E8F0',
                    padding: '14px 16px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 14
                  }}
                >
                  {/* Fact 1: Established Year */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E6F8F3', color: primaryGreen, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <IconBuildingHospital size={18} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: mutedColor, margin: 0 }}>স্থাপিত সাল</p>
                      <p style={{ fontSize: 14, fontWeight: 950, color: textColor, margin: '2px 0 0 0' }}>
                        {hospital?.established_year || '1995'}
                      </p>
                    </div>
                  </div>

                  {/* Fact 2: Hospital Type */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E6F8F3', color: primaryGreen, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <IconBuildingHospital size={18} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: mutedColor, margin: 0 }}>হাসপাতালের ধরন</p>
                      <p style={{ fontSize: 14, fontWeight: 950, color: textColor, margin: '2px 0 0 0' }}>
                        {hospital?.type || 'প্রাইভেট'}
                      </p>
                    </div>
                  </div>

                  {/* Fact 3: Branches */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E6F8F3', color: primaryGreen, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <IconBuildingHospital size={18} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: mutedColor, margin: 0 }}>শাখা সংখ্যা</p>
                      <p style={{ fontSize: 14, fontWeight: 950, color: textColor, margin: '2px 0 0 0' }}>
                        {hospital?.branches_count ? `${hospital.branches_count}+` : '5+'}
                      </p>
                    </div>
                  </div>

                  {/* Fact 4: Patients Served */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E6F8F3', color: primaryGreen, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <IconHeart size={18} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: mutedColor, margin: 0 }}>রোগী পরিষেবা</p>
                      <p style={{ fontSize: 14, fontWeight: 950, color: textColor, margin: '2px 0 0 0' }}>
                        1M+
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Departments Section (Card Design) */}
              <div 
                id="department" 
                className="scroll-section"
                style={{
                  background: '#FFFFFF',
                  borderRadius: 20,
                  padding: '28px 24px',
                  border: `1.5px solid #E2E8F0`,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 950, color: textColor, margin: '0 0 4px 0' }}>
                      আমাদের বিভাগসমূহ
                    </h3>
                    <p style={{ fontSize: 13, color: mutedColor, margin: 0, fontWeight: 600 }}>
                      মোট {ALL_DEPARTMENTS.length}টি বিশেষায়িত চিকিৎসা বিভাগ
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeptModalOpen(true)}
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
                    সব দেখুন <IconChevronRight size={16} />
                  </button>
                </div>

                <Row className="g-3">
                  {/* First 7 Departments */}
                  {ALL_DEPARTMENTS.slice(0, 7).map((dept, idx) => (
                    <Col key={dept.id || idx} xs={6} md={4} lg={3}>
                      <div 
                        onClick={() => {
                          if (hospital?.id) {
                            navigate(`/doctors?hospital_id=${hospital.id}&department=${encodeURIComponent(dept.name)}`)
                          }
                        }}
                        style={{ 
                          padding: '18px 14px', 
                          borderRadius: 14, 
                          border: `1.5px solid #F1F5F9`, 
                          background: '#FAFAFA', 
                          color: textColor, 
                          height: '100%',
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: 10, 
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
                          cursor: 'pointer',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.01)'
                        }} 
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = primaryGreen
                          e.currentTarget.style.background = '#FFFFFF'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,168,140,0.08)'
                        }} 
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#F1F5F9'
                          e.currentTarget.style.background = '#FAFAFA'
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.01)'
                        }}
                      >
                        <div style={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 10, 
                          background: '#E6F8F3', 
                          color: primaryGreen, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}>
                          {dept.icon}
                        </div>
                        <div>
                          <p style={{ fontSize: 14.5, fontWeight: 900, margin: 0, color: textColor }}>{dept.name}</p>
                          <p style={{ fontSize: 12, fontWeight: 600, color: mutedColor, margin: '2px 0 0 0' }}>{dept.sub}</p>
                        </div>
                      </div>
                    </Col>
                  ))}

                  {/* 8th Slot: + Button Card to open Modal */}
                  <Col xs={6} md={4} lg={3}>
                    <div 
                      onClick={() => setDeptModalOpen(true)}
                      style={{ 
                        padding: '18px 14px', 
                        borderRadius: 14, 
                        border: `2px dashed #00B875`, 
                        background: '#F0FDF4', 
                        color: textColor, 
                        height: '100%',
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8, 
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
                        cursor: 'pointer',
                        textAlign: 'center'
                      }} 
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.background = '#DCFCE7'
                      }} 
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.background = '#F0FDF4'
                      }}
                    >
                      <div style={{ 
                        width: 38, 
                        height: 38, 
                        borderRadius: 10, 
                        background: '#00B875', 
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 3px 8px rgba(0,184,117,0.3)'
                      }}>
                        <IconPlus size={22} stroke={2.5} />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 900, color: '#007A65', margin: 0 }}>
                          +{ALL_DEPARTMENTS.length - 7}টি বিভাগ
                        </p>
                        <p style={{ fontSize: 11.5, fontWeight: 700, color: '#00B875', margin: '2px 0 0 0' }}>
                          সকল বিভাগ দেখুন
                        </p>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* 4. Facilities Section (Card Design) */}
              <div 
                id="facilities" 
                className="scroll-section"
                style={{
                  background: '#FFFFFF',
                  borderRadius: 20,
                  padding: '28px 24px',
                  border: `1.5px solid #E2E8F0`,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }}
              >
                <h3 style={{ fontSize: 20, fontWeight: 950, color: textColor, marginBottom: 20 }}>
                  আমাদের সুবিধাসমূহ
                </h3>
                <Row className="g-3">
                  {[
                    { icon: <IconAmbulance size={24} />, name: '২৪/৭ অ্যাম্বুলেন্স' },
                    { icon: <IconBed size={24} />, name: 'আইসিইউ (ICU)' },
                    { icon: <IconScissors size={24} />, name: 'আধুনিক অপারেশন থিয়েটার' },
                    { icon: <IconActivity size={24} />, name: 'জরুরি বিভাগ (Emergency)' },
                    { icon: <IconBuildingHospital size={24} />, name: 'ডায়াগনস্টিক সেন্টার' },
                    { icon: <IconCheck size={24} />, name: 'ফার্মেসি' }
                  ].map((facility, idx) => (
                    <Col key={idx} xs={6} md={4}>
                      <div style={{ 
                        padding: '16px 14px', 
                        borderRadius: 14, 
                        border: `1.5px solid #F1F5F9`, 
                        background: '#FAFAFA', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 12,
                        transition: 'all 0.2s ease',
                        cursor: 'default'
                      }}>
                        <div style={{ color: primaryGreen }}>{facility.icon}</div>
                        <p style={{ fontSize: 14.5, fontWeight: 800, color: textColor, margin: 0 }}>{facility.name}</p>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>

              {/* 5. Popular / Specialist Doctors Section (Card Design) */}
              <div 
                id="doctors" 
                className="scroll-section"
                style={{
                  background: '#FFFFFF',
                  borderRadius: 20,
                  padding: '28px 24px',
                  border: `1.5px solid #E2E8F0`,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 950, color: textColor, margin: '0 0 4px 0' }}>
                      আমাদের বিশেষজ্ঞ ডাক্তার সমূহ
                    </h3>
                    <p style={{ fontSize: 13, color: mutedColor, margin: 0, fontWeight: 600 }}>
                      এই হাসপাতালে কর্মরত অভিজ্ঞ বিশেষজ্ঞ চিকিৎসকবৃন্দ
                    </p>
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
                      সব দেখুন <IconChevronRight size={16} />
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
                  <div className="text-center py-4 bg-light rounded-4 border">
                    <p style={{ color: mutedColor, margin: 0, fontWeight: 600 }}>এই মুহূর্তে কোনো ডাক্তারের তথ্য পাওয়া যায়নি</p>
                  </div>
                )}
              </div>

              {/* 6. Gallery Section (Card Design) */}
              <div 
                id="gallery" 
                className="scroll-section"
                style={{
                  background: '#FFFFFF',
                  borderRadius: 20,
                  padding: '28px 24px',
                  border: `1.5px solid #E2E8F0`,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                  <h3 style={{ fontSize: 20, fontWeight: 950, color: textColor, margin: 0 }}>
                    গ্যালারি
                  </h3>
                  <span style={{ fontSize: 13, fontWeight: 700, color: primaryGreen }}>
                    ৪টি ছবি
                  </span>
                </div>
                <Row className="g-3">
                  {[
                    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1453&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?q=80&w=1470&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=1528&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=1470&auto=format&fit=crop'
                  ].map((img, idx) => (
                    <Col key={idx} xs={6} md={6}>
                      <img src={img} alt="Gallery" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 14, border: `1px solid ${borderColor}` }} />
                    </Col>
                  ))}
                </Row>
              </div>

              {/* 7. Reviews Section (Card Design) */}
              <div 
                id="reviews" 
                className="scroll-section"
                style={{
                  background: '#FFFFFF',
                  borderRadius: 20,
                  padding: '28px 24px',
                  border: `1.5px solid #E2E8F0`,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }}
              >
                <h3 style={{ fontSize: 20, fontWeight: 950, color: textColor, marginBottom: 20 }}>
                  রোগী রিভিউ
                </h3>
                <div>
                  <div className="d-flex align-items-center gap-4 mb-4 pb-4 border-bottom">
                    <div style={{ fontSize: 44, fontWeight: 950, color: textColor, lineHeight: 1 }}>4.8</div>
                    <div>
                      <div className="d-flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map(s => <IconStar key={s} size={20} color="#F59E0B" fill="#F59E0B" />)}
                      </div>
                      <p style={{ fontSize: 14, color: mutedColor, margin: 0, fontWeight: 700 }}>১,২৫৬ জন রোগীর মতামতের ভিত্তিতে</p>
                    </div>
                  </div>
                  
                  <div className="d-flex flex-column gap-3">
                    {[1, 2].map((review) => (
                      <div key={review} className="d-flex gap-3 p-3 rounded-3" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#334155', flexShrink: 0 }}>
                          R
                        </div>
                        <div>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <h5 style={{ fontSize: 15, fontWeight: 900, color: textColor, margin: 0 }}>রাকিবুল ইসলাম</h5>
                            <span style={{ fontSize: 12, color: mutedColor, fontWeight: 600 }}>২ দিন আগে</span>
                          </div>
                          <div className="d-flex gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map(s => <IconStar key={s} size={13} color="#F59E0B" fill="#F59E0B" />)}
                          </div>
                          <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.6 }}>হাসপাতালের পরিবেশ খুব সুন্দর এবং পরিষ্কার। ডাক্তার এবং নার্সদের ব্যবহার অনেক ভালো ছিল। সার্ভিস নিয়ে আমি সন্তুষ্ট।</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button style={{ width: '100%', marginTop: 20, padding: '12px', borderRadius: 12, border: `1.5px solid #E2E8F0`, background: '#F8FAFC', color: textColor, fontWeight: 800, fontSize: 14 }}>আরও রিভিউ দেখুন</button>
                </div>
              </div>

              {/* 8. Contact & Location Section (Card Design) */}
              <div 
                id="contact" 
                className="scroll-section"
                style={{
                  background: '#FFFFFF',
                  borderRadius: 20,
                  padding: '28px 24px',
                  border: `1.5px solid #E2E8F0`,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }}
              >
                <h3 style={{ fontSize: 20, fontWeight: 950, color: textColor, marginBottom: 20 }}>
                  যোগাযোগের ঠিকানা
                </h3>
                <div className="d-flex flex-column gap-3">
                  {[
                    { icon: <IconPhone size={22} />, title: 'ফোন নাম্বার', value: hospital?.phone || '+880 2 48119911-15' },
                    { icon: <IconMail size={22} />, title: 'ইমেইল এড্রেস', value: hospital?.email || 'info@labaidhospital.com' },
                    { icon: <IconWorld size={22} />, title: 'ওয়েবসাইট', value: hospital?.url || 'www.labaidhospital.com' },
                    { icon: <IconMapPin size={22} />, title: 'লোকেশন', value: hospital?.address || 'ধানমণ্ডি, ঢাকা - ১২০৫, বাংলাদেশ' }
                  ].map((contact, idx) => (
                    <div key={idx} className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: '#E6F8F3', color: primaryGreen, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {contact.icon}
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: mutedColor, margin: 0 }}>{contact.title}</p>
                        <p style={{ fontSize: 15, fontWeight: 900, color: textColor, margin: '2px 0 0 0' }}>{contact.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </Col>

          {/* Sidebar Column */}
          <Col lg={4}>
            <div className="sticky-sidebar d-flex flex-column gap-3">
              
              {/* 0. Appointment CTA Card (অ্যাপয়েন্টমেন্ট নিন - Desktop Only) */}
              <div 
                className="d-none d-lg-block"
                style={{
                  background: '#007A65',
                borderRadius: 20,
                padding: '24px 20px',
                boxShadow: '0 8px 24px rgba(0, 122, 101, 0.25)',
                textAlign: 'center',
                color: '#FFFFFF'
              }}>
                <h3 style={{ fontSize: 20, fontWeight: 950, margin: '0 0 6px 0', color: '#FFFFFF' }}>
                  অ্যাপয়েন্টমেন্ট নিন
                </h3>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)', margin: '0 0 18px 0' }}>
                  সহজেই অনলাইনে অ্যাপয়েন্টমেন্ট নিন
                </p>

                <button
                  type="button"
                  onClick={() => navigate(`/doctors?hospital_id=${hospital?.id || id}`)}
                  style={{
                    width: '100%',
                    padding: '13px 18px',
                    borderRadius: 12,
                    border: 'none',
                    background: '#FFFFFF',
                    color: '#007A65',
                    fontWeight: 900,
                    fontSize: 15,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.12)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <IconCalendarEvent size={20} color="#007A65" />
                  <span>অ্যাপয়েন্টমেন্ট নিন</span>
                </button>
              </div>
              
              {/* 1. Contact Sidebar Card (যোগাযোগ) */}
              <div style={{ background: '#FFFFFF', borderRadius: 20, padding: '22px 24px', border: `1.5px solid ${borderColor}`, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: 18, fontWeight: 950, color: textColor, marginBottom: 18 }}>যোগাযোগ</h3>
                <div className="d-flex flex-column gap-3">
                  {/* Phone */}
                  <div className="d-flex align-items-center gap-3">
                    <div style={{ color: primaryGreen, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconPhone size={20} />
                    </div>
                    <a 
                      href={`tel:${hospital?.phone || ''}`} 
                      style={{ fontSize: 14.5, fontWeight: 800, color: textColor, textDecoration: 'none', margin: 0 }}
                    >
                      {hospital?.phone || '011100111w'}
                    </a>
                  </div>

                  {/* Email */}
                  <div className="d-flex align-items-center gap-3">
                    <div style={{ color: primaryGreen, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconMail size={20} />
                    </div>
                    <a 
                      href={`mailto:${hospital?.email || 'abc1@gmail.com'}`} 
                      style={{ fontSize: 14.5, fontWeight: 800, color: textColor, textDecoration: 'none', margin: 0, wordBreak: 'break-all' }}
                    >
                      {hospital?.email || 'abc1@gmail.com'}
                    </a>
                  </div>

                  {/* Website */}
                  <div className="d-flex align-items-center gap-3">
                    <div style={{ color: primaryGreen, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconWorld size={20} />
                    </div>
                    <a 
                      href={hospital?.url ? (hospital.url.startsWith('http') ? hospital.url : `https://${hospital.url}`) : 'https://www.abchospital.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 14.5, fontWeight: 800, color: textColor, textDecoration: 'none', margin: 0 }}
                    >
                      {hospital?.url || 'www.abchospital.com'}
                    </a>
                  </div>

                  {/* Address */}
                  <div className="d-flex align-items-center gap-3">
                    <div style={{ color: primaryGreen, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconMapPin size={20} />
                    </div>
                    <p style={{ fontSize: 14.5, fontWeight: 800, color: textColor, margin: 0 }}>
                      {hospital?.address || 'ধানমণ্ডি, ঢাকা - ১২০৫'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Emergency Services Card (জরুরি সেবা) */}
              <div style={{ 
                background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)', 
                borderRadius: 20, 
                padding: '22px 24px', 
                border: '1.5px solid #FECDD3',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.08)'
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 950, color: '#E11D48', marginBottom: 4 }}>
                  জরুরি সেবা
                </h3>
                <p style={{ fontSize: 13, color: '#64748B', fontWeight: 700, margin: '0 0 16px 0' }}>
                  24/7 আমাদের জরুরি সেবা চালু আছে
                </p>
                
                <a 
                  href={`tel:${hospital?.phone || '011100111w'}`}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 12,
                    border: '1.5px solid #FDA4AF',
                    padding: '12px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    color: '#E11D48',
                    fontWeight: 900,
                    fontSize: 16,
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(225, 29, 72, 0.1)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#E11D48'
                    e.currentTarget.style.color = '#FFFFFF'
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#FFFFFF'
                    e.currentTarget.style.color = '#E11D48'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <IconPhone size={20} color="currentColor" />
                  <span>{hospital?.phone || '011100111w'}</span>
                </a>
              </div>

              {/* 3. Our Location Card (আমাদের অবস্থান) */}
              <div style={{ background: '#FFFFFF', borderRadius: 20, padding: '22px 24px', border: `1.5px solid ${borderColor}`, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: 18, fontWeight: 950, color: textColor, marginBottom: 16 }}>
                  আমাদের অবস্থান
                </h3>
                
                {/* Map Preview Container */}
                <div 
                  style={{ 
                    position: 'relative', 
                    width: '100%', 
                    height: 160, 
                    borderRadius: 14, 
                    overflow: 'hidden', 
                    background: '#E2E8F0',
                    marginBottom: 14,
                    border: '1px solid #CBD5E1'
                  }}
                >
                  {/* Stylized Map Background Pattern */}
                  <div 
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: 'radial-gradient(#CBD5E1 1.5px, transparent 1.5px), radial-gradient(#94A3B8 1.5px, #F1F5F9 1.5px)',
                      backgroundSize: '24px 24px',
                      backgroundPosition: '0 0, 12px 12px',
                      opacity: 0.8
                    }}
                  />
                  {/* Visual Map Roads/Grid Lines */}
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4 }} xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="30" x2="300" y2="160" stroke="#94A3B8" strokeWidth="6" />
                    <line x1="80" y1="0" x2="220" y2="160" stroke="#00B875" strokeWidth="4" />
                    <line x1="0" y1="110" x2="300" y2="70" stroke="#60A5FA" strokeWidth="4" />
                    <circle cx="150" cy="80" r="45" fill="#E6F8F3" opacity="0.6" />
                  </svg>

                  {/* Center Location Pin Badge */}
                  <div 
                    style={{ 
                      position: 'absolute', 
                      top: '50%', 
                      left: '50%', 
                      transform: 'translate(-50%, -60%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      zIndex: 2
                    }}
                  >
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: '#00B875',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0, 184, 117, 0.4)',
                      border: '2.5px solid #FFFFFF'
                    }}>
                      <IconMapPin size={22} />
                    </div>
                    <div style={{
                      background: '#FFFFFF',
                      color: '#1E293B',
                      fontSize: 11.5,
                      fontWeight: 800,
                      padding: '2px 10px',
                      borderRadius: 8,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                      marginTop: 4,
                      whiteSpace: 'nowrap',
                      border: '1px solid #E2E8F0'
                    }}>
                      {hospital?.address ? hospital.address.split(',')[0] : 'ধানমণ্ডি'}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: 14, fontWeight: 800, color: textColor, textAlign: 'center', margin: '0 0 14px 0' }}>
                  {hospital?.address || 'ধানমণ্ডি, ঢাকা'}
                </p>

                {/* Direction Button */}
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(hospital?.address || hospital?.name || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 12,
                    border: '1.5px solid #E2E8F0',
                    padding: '11px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    color: textColor,
                    fontWeight: 800,
                    fontSize: 14,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = primaryGreen
                    e.currentTarget.style.color = primaryGreen
                    e.currentTarget.style.background = '#F0FDF4'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#E2E8F0'
                    e.currentTarget.style.color = textColor
                    e.currentTarget.style.background = '#FFFFFF'
                  }}
                >
                  <IconCompass size={18} color={primaryGreen} />
                  <span>দিক নির্দেশনা দেখুন</span>
                </a>
              </div>

              {/* 4. Social Media Card (সামাজিক মাধ্যমে) */}
              <div style={{ background: '#FFFFFF', borderRadius: 20, padding: '22px 24px', border: `1.5px solid ${borderColor}`, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: 18, fontWeight: 950, color: textColor, marginBottom: 18 }}>
                  সামাজিক মাধ্যমে
                </h3>
                
                <div className="d-flex align-items-center justify-content-between gap-2">
                  {/* Facebook */}
                  <a 
                    href={hospital?.facebook_url || 'https://facebook.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: '50%',
                      background: '#1877F2',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      boxShadow: '0 4px 10px rgba(24, 119, 242, 0.25)',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-3px)'
                      e.currentTarget.style.boxShadow = '0 6px 14px rgba(24, 119, 242, 0.4)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 10px rgba(24, 119, 242, 0.25)'
                    }}
                  >
                    <IconBrandFacebook size={22} />
                  </a>

                  {/* YouTube */}
                  <a 
                    href={hospital?.youtube_url || 'https://youtube.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: '50%',
                      background: '#FF0000',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      boxShadow: '0 4px 10px rgba(255, 0, 0, 0.25)',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-3px)'
                      e.currentTarget.style.boxShadow = '0 6px 14px rgba(255, 0, 0, 0.4)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 10px rgba(255, 0, 0, 0.25)'
                    }}
                  >
                    <IconBrandYoutube size={22} />
                  </a>

                  {/* X (formerly Twitter) */}
                  <a 
                    href={hospital?.twitter_url || hospital?.x_url || 'https://x.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="X"
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: '50%',
                      background: '#000000',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.25)',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-3px)'
                      e.currentTarget.style.boxShadow = '0 6px 14px rgba(0, 0, 0, 0.4)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.25)'
                    }}
                  >
                    <IconBrandX size={20} />
                  </a>

                  {/* LinkedIn */}
                  <a 
                    href={hospital?.linkedin_url || 'https://linkedin.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: '50%',
                      background: '#0A66C2',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      boxShadow: '0 4px 10px rgba(10, 102, 194, 0.25)',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-3px)'
                      e.currentTarget.style.boxShadow = '0 6px 14px rgba(10, 102, 194, 0.4)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 10px rgba(10, 102, 194, 0.25)'
                    }}
                  >
                    <IconBrandLinkedin size={22} />
                  </a>
                </div>
              </div>

            </div>
          </Col>
        </Row>
      </Container></div>

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

        /* Hero Responsive Row */
        @media (min-width: 992px) {
          .hero-bottom-row {
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            align-items: flex-end !important;
            justify-content: space-between !important;
          }
          .hero-info-card {
            flex: 1 1 auto !important;
            max-width: 580px !important;
            min-width: 0 !important;
          }
          .hero-action-btns {
            flex-shrink: 0 !important;
            flex-wrap: nowrap !important;
            margin-left: auto !important;
          }
        }

        @media (max-width: 991px) {
          .hero-bottom-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .hero-info-card {
            max-width: 100% !important;
          }
          .hero-action-btns {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            width: 100% !important;
            gap: 8px !important;
          }
          .hero-action-btns > button,
          .hero-action-btns > a {
            width: 100% !important;
            justify-content: center !important;
            margin: 0 !important;
          }
        }

        @media (min-width: 992px) {
          .sticky-sidebar {
            position: sticky;
            top: 180px;
            align-self: start;
          }
        }
      ` }} />

      
      {/* All Departments Modal Popup */}
      <Modal 
        show={deptModalOpen} 
        onHide={() => { setDeptModalOpen(false); setDeptSearchQuery('') }}
        centered 
        size="lg"
        contentClassName="border-0 shadow-lg"
        style={{ borderRadius: 20 }}
      >
        <Modal.Header 
          closeButton 
          style={{ 
            borderBottom: `1px solid #F1F5F9`, 
            padding: '20px 24px', 
            background: '#FAFAFA',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20
          }}
        >
          <div>
            <Modal.Title style={{ fontSize: 20, fontWeight: 950, color: textColor, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#E6F8F3', color: primaryGreen, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconStethoscope size={20} />
              </div>
              আমাদের সকল ডিপার্টমেন্ট সমূহ
            </Modal.Title>
            <p style={{ fontSize: 13, color: mutedColor, margin: '4px 0 0 0', fontWeight: 600 }}>
              {hospital?.name || 'হাসপাতাল'}-এর মোট {ALL_DEPARTMENTS.length}টি বিশেষায়িত বিভাগ
            </p>
          </div>
        </Modal.Header>
        <Modal.Body style={{ padding: '20px 24px', maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <IconSearch size={18} color="#94A3B8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="ডিপার্টমেন্টের নাম দিয়ে খুঁজুন..."
              value={deptSearchQuery}
              onChange={(e) => setDeptSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 40px',
                borderRadius: 12,
                border: '1.5px solid #E2E8F0',
                fontSize: 14,
                fontWeight: 600,
                outline: 'none',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = primaryGreen}
              onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
            />
            {deptSearchQuery && (
              <button 
                onClick={() => setDeptSearchQuery('')}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer' }}
              >
                <IconX size={16} />
              </button>
            )}
          </div>

          {/* Department Grid in Modal */}
          <Row className="g-3">
            {filteredDepartments.map((dept, idx) => (
              <Col key={dept.id || idx} xs={12} sm={6} md={4}>
                <div 
                  onClick={() => {
                    setDeptModalOpen(false)
                    if (hospital?.id) {
                      navigate(`/doctors?hospital_id=${hospital.id}&department=${encodeURIComponent(dept.name)}`)
                    }
                  }}
                  style={{ 
                    padding: '16px 18px', 
                    borderRadius: 14, 
                    border: `1.5px solid #F1F5F9`, 
                    background: '#FFFFFF', 
                    color: textColor, 
                    height: '100%',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 14, 
                    transition: 'all 0.2s ease', 
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }} 
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = primaryGreen
                    e.currentTarget.style.background = '#F0FDF4'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }} 
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#F1F5F9'
                    e.currentTarget.style.background = '#FFFFFF'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ 
                    width: 42, 
                    height: 42, 
                    borderRadius: 12, 
                    background: '#E6F8F3', 
                    color: primaryGreen, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0 
                  }}>
                    {dept.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 900, margin: 0, color: textColor }}>{dept.name}</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: mutedColor, margin: '2px 0 0 0' }}>{dept.sub}</p>
                  </div>
                </div>
              </Col>
            ))}
            {filteredDepartments.length === 0 && (
              <Col xs={12}>
                <div className="text-center py-4" style={{ color: mutedColor }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>কোনো ডিপার্টমেন্ট পাওয়া যায়নি</p>
                </div>
              </Col>
            )}
          </Row>
        </Modal.Body>
      </Modal>

      <ShareModal show={shareModalOpen} onHide={closeShareModal} shareData={shareData} />
    </div>
  )
}

export default HospitalDetailPage

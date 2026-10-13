import React, { useState, useRef, useEffect, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import { useQuery } from '@tanstack/react-query'
import useLocations from '../../hooks/useLocations'
import { getSpecialties } from '../../api/doctorApi'
import { getHospitals } from '../../api/hospitalApi'
import {
  IconSearch,
  IconMapPin,
  IconChevronDown,
  IconChevronRight,
  IconChevronLeft,
  IconChevronsDown,
  IconUserCheck,
  IconCalendarEvent,
  IconShieldCheck,
  IconHeadset,
  IconStethoscope,
  IconBuildingHospital,
  IconWriting,
  IconX,
  IconCheck,
  IconMicrophone,
  IconAdjustmentsHorizontal,
  IconUsers,
  IconReportMedical,
  IconArrowRight
} from '@tabler/icons-react'
import { getContent } from '../../utils/contentService'
import ScrollReveal from '../common/ScrollReveal'

// ── Location Popup Picker ───────────────────────────────────────────────────
function LocationPopup({ onClose, onSelect }) {
  const {
    divisions, districts, upazilas, unions,
    selectedDivision, setSelectedDivision,
    selectedDistrict, setSelectedDistrict,
    selectedUpazila, setSelectedUpazila,
    selectedUnion, setSelectedUnion,
    loadingDistricts, loadingUpazilas, loadingUnions
  } = useLocations()

  const [step, setStep] = useState('division')
  const [divisionLabel, setDivisionLabel] = useState('')
  const [districtLabel, setDistrictLabel] = useState('')
  const [upazilaLabel, setUpazilaLabel] = useState('')

  const handleDivisionClick = (div) => {
    setSelectedDivision(div.id)
    setDivisionLabel(div.name || div.bangla_name)
    setStep('district')
  }

  const handleDistrictClick = (dist) => {
    setSelectedDistrict(dist.id)
    setDistrictLabel(dist.name || dist.bangla_name)
    setStep('upazila')
  }

  const handleUpazilaClick = (upz) => {
    setSelectedUpazila(upz.id)
    setUpazilaLabel(upz.name || upz.bangla_name)
    setStep('union')
  }

  const handleUnionClick = (union) => {
    setSelectedUnion(union.id)
    const label = `${divisionLabel} > ${districtLabel} > ${upazilaLabel} > ${union.name || union.bangla_name}`
    onSelect({ division_id: selectedDivision, district_id: selectedDistrict, upazila_id: selectedUpazila, union_id: union.id, label })
    onClose()
  }

  const handleConfirmWithoutUnion = () => {
    let label = divisionLabel
    if (districtLabel) label += ` > ${districtLabel}`
    if (upazilaLabel) label += ` > ${upazilaLabel}`
    onSelect({ division_id: selectedDivision, district_id: selectedDistrict || '', upazila_id: selectedUpazila || '', union_id: '', label })
    onClose()
  }

  // ── Back navigation: go one step back, reset child selections ──
  const goBack = () => {
    if (step === 'district') {
      setSelectedDivision(''); setSelectedDistrict(''); setSelectedUpazila(''); setSelectedUnion('')
      setDivisionLabel(''); setDistrictLabel(''); setUpazilaLabel('')
      setStep('division')
    } else if (step === 'upazila') {
      setSelectedDistrict(''); setSelectedUpazila(''); setSelectedUnion('')
      setDistrictLabel(''); setUpazilaLabel('')
      setStep('district')
    } else if (step === 'union') {
      setSelectedUpazila(''); setSelectedUnion('')
      setUpazilaLabel('')
      setStep('upazila')
    }
  }

  // ── Clickable breadcrumb: jump to any previous step ──
  const goToStep = (targetStep) => {
    const order = ['division', 'district', 'upazila', 'union']
    const currentIdx = order.indexOf(step)
    const targetIdx = order.indexOf(targetStep)
    if (targetIdx >= currentIdx) return
    if (targetStep === 'division') {
      setSelectedDivision(''); setSelectedDistrict(''); setSelectedUpazila(''); setSelectedUnion('')
      setDivisionLabel(''); setDistrictLabel(''); setUpazilaLabel(''); setStep('division')
    } else if (targetStep === 'district') {
      setSelectedDistrict(''); setSelectedUpazila(''); setSelectedUnion('')
      setDistrictLabel(''); setUpazilaLabel(''); setStep('district')
    } else if (targetStep === 'upazila') {
      setSelectedUpazila(''); setSelectedUnion('')
      setUpazilaLabel(''); setStep('upazila')
    }
  }

  const stepLabels = {
    division: 'বিভাগ নির্বাচন করুন',
    district: 'জেলা নির্বাচন করুন',
    upazila: 'উপজেলা নির্বাচন করুন',
    union: 'ইউনিয়ন নির্বাচন করুন'
  }

  const getItems = () => {
    if (step === 'division') return divisions
    if (step === 'district') return districts
    if (step === 'upazila') return upazilas
    if (step === 'union') return unions
    return []
  }

  const isLoading =
    (step === 'district' && loadingDistricts) ||
    (step === 'upazila' && loadingUpazilas) ||
    (step === 'union' && loadingUnions)

  const breadcrumb = [divisionLabel, districtLabel, upazilaLabel].filter(Boolean)
  const breadcrumbSteps = ['division', 'district', 'upazila']

  return (
    <div className="loc-popup-overlay" onClick={onClose}>
      <div className="loc-popup-box" onClick={e => e.stopPropagation()}>

        {/* Header with back button */}
        <div className="loc-popup-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {step !== 'division' && (
              <button className="loc-back-btn" onClick={goBack} title="পেছনে যান">
                <IconChevronLeft size={20} />
              </button>
            )}
            <div>
              <div className="loc-popup-title">{stepLabels[step]}</div>
              {breadcrumb.length > 0 && (
                <div className="loc-breadcrumb">
                  {breadcrumb.map((b, i) => (
                    <span
                      key={i}
                      className="loc-breadcrumb-item"
                      onClick={() => goToStep(breadcrumbSteps[i])}
                    >
                      {i > 0 && <IconChevronRight size={11} style={{ margin: '0 3px', opacity: 0.45 }} />}
                      <span>{b}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {step !== 'division' && (
              <button className="loc-confirm-btn" onClick={handleConfirmWithoutUnion}>
                <IconCheck size={15} />
                <span>নিশ্চিত</span>
              </button>
            )}
            <button className="loc-close-btn" onClick={onClose}>
              <IconX size={18} />
            </button>
          </div>
        </div>

        {/* Step tabs — clicking a done tab jumps back */}
        <div className="loc-steps">
          {['division', 'district', 'upazila', 'union'].map((s, idx) => {
            const labels = ['বিভাগ', 'জেলা', 'উপজেলা', 'ইউনিয়ন']
            const isActive = step === s
            const isDone = (
              (s === 'division' && selectedDivision && step !== 'division') ||
              (s === 'district' && selectedDistrict && step !== 'district') ||
              (s === 'upazila' && selectedUpazila && step !== 'upazila')
            )
            const isClickable = isDone
            return (
              <div
                key={s}
                className={`loc-step-tab ${isActive ? 'active' : ''} ${isDone ? 'done' : ''} ${isClickable ? 'clickable' : ''}`}
                onClick={isClickable ? () => goToStep(s) : undefined}
              >
                <span className="loc-step-num">{idx + 1}</span>
                <span>{labels[idx]}</span>
              </div>
            )
          })}
        </div>

        {/* List */}
        <div className="loc-list">
          {isLoading ? (
            <div className="loc-loading">লোড হচ্ছে...</div>
          ) : getItems().length === 0 ? (
            <div className="loc-empty">কোনো তথ্য পাওয়া যায়নি</div>
          ) : (
            getItems().map((item) => (
              <button
                key={item.id}
                className="loc-item"
                onClick={() => {
                  if (step === 'division') handleDivisionClick(item)
                  else if (step === 'district') handleDistrictClick(item)
                  else if (step === 'upazila') handleUpazilaClick(item)
                  else handleUnionClick(item)
                }}
              >
                <span>{item.name || item.bangla_name}</span>
                {step !== 'union' && <IconChevronRight size={16} className="loc-item-arrow" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Shared Searchable Popup (for Specialties, Hospitals, etc.) ──────────────
function SearchablePopup({ title, placeholder, items, getLabel, onClose, onSelect }) {
  const [query, setQuery] = useState('')
  const inputRef = React.useRef(null)

  // Auto-focus search input when popup opens
  React.useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [])

  const filtered = query.trim()
    ? items.filter(item => {
        const label = getLabel(item) || ''
        return label.toLowerCase().includes(query.trim().toLowerCase())
      })
    : items

  return (
    <div className="loc-popup-overlay" onClick={onClose}>
      <div className="loc-popup-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="loc-popup-header">
          <div className="loc-popup-title">{title}</div>
          <button className="loc-close-btn" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="srch-popup-search">
          <IconSearch size={16} style={{ color: '#A0AEC0', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="srch-popup-input"
          />
          {query && (
            <button onClick={() => setQuery('')} className="srch-popup-clear">
              <IconX size={14} />
            </button>
          )}
        </div>

        {/* Results list */}
        <div className="loc-list">
          {filtered.length === 0 ? (
            <div className="loc-empty">
              {query ? `"${query}" পাওয়া যায়নি` : 'কোনো তথ্য পাওয়া যায়নি'}
            </div>
          ) : (
            filtered.map(item => (
              <button
                key={item.id}
                className="loc-item"
                onClick={() => onSelect(item)}
              >
                <span>{getLabel(item)}</span>
                <IconCheck size={15} className="srch-item-check" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Hero Section ───────────────────────────────────────────────
const HeroSection = memo(function HeroSection({ stats: propStats }) {
  const navigate = useNavigate()
  const [cms, setCms] = useState(getContent())
  useEffect(() => {
    const update = () => setCms(getContent())
    window.addEventListener('cms-updated', update)
    return () => window.removeEventListener('cms-updated', update)
  }, [])
  const hero = cms.hero || {}

  const line2Text = 'ডাক্তার বুকিং, আরো সহজ'
  const [typedLine2, setTypedLine2] = useState('')

  useEffect(() => {
    let isMounted = true
    let charIndex = 0
    let isDeleting = false
    let timeoutId = null

    function typeLoop() {
      if (!isMounted) return

      if (!isDeleting) {
        setTypedLine2(line2Text.slice(0, charIndex))
        if (charIndex < line2Text.length) {
          charIndex++
          timeoutId = setTimeout(typeLoop, 85) // Smooth writing speed
        } else {
          isDeleting = true
          timeoutId = setTimeout(typeLoop, 3200) // Stay visible for 3.2s
        }
      } else {
        setTypedLine2(line2Text.slice(0, charIndex))
        if (charIndex > 0) {
          charIndex--
          timeoutId = setTimeout(typeLoop, 40)
        } else {
          isDeleting = false
          timeoutId = setTimeout(typeLoop, 500)
        }
      }
    }

    typeLoop()

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [line2Text])

  const [showLocationPopup, setShowLocationPopup] = useState(false)
  const [locationLabel, setLocationLabel] = useState('')
  const [locationParams, setLocationParams] = useState({})

  const [showSpecialtyPopup, setShowSpecialtyPopup] = useState(false)
  const [specialtyLabel, setSpecialtyLabel] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('')

  const [showHospitalPopup, setShowHospitalPopup] = useState(false)
  const [hospitalLabel, setHospitalLabel] = useState('')
  const [selectedHospital, setSelectedHospital] = useState('')

  const [searchText, setSearchText] = useState('')
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [selectedDate, setSelectedDate] = useState('')
  const dateInputRef = useRef(null)

  const getDateLabel = () => {
    if (!selectedDate) return 'তারিখ'
    const today = new Date().toISOString().split('T')[0]
    const tom = new Date()
    tom.setDate(tom.getDate() + 1)
    const tomorrow = tom.toISOString().split('T')[0]
    if (selectedDate === today) return 'আজ'
    if (selectedDate === tomorrow) return 'আগামীকাল'
    const parts = selectedDate.split('-')
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`
    return selectedDate
  }

  const openDatePicker = (e) => {
    e.stopPropagation()
    if (dateInputRef.current) {
      if (dateInputRef.current.showPicker) {
        try {
          dateInputRef.current.showPicker()
          return
        } catch (err) {}
      }
      dateInputRef.current.focus()
      dateInputRef.current.click()
    }
  }

  const promoSlides = [
    {
      title1: 'বিশ্বস্ত ডাক্তারের',
      title2: 'সহজ অ্যাপয়েন্টমেন্ট',
      subtitle: 'আপনার ও পরিবারের স্বাস্থ্যসেবায় আমরা আছি আপনার পাশে',
      badgeNum: '10,000+',
      badgeLabel: 'বিশ্বস্ত ডাক্তার'
    },
    {
      title1: 'অনলাইন ও চেম্বার',
      title2: 'দ্রুত সিরিয়াল বুকিং',
      subtitle: 'বাংলাদেশের শীর্ষ বিশেষজ্ঞ ডাক্তার ও হাসপাতালের সাথে সরাসরি যোগাযোগ',
      badgeNum: '৫০০+',
      badgeLabel: 'টপ হাসপাতাল'
    },
    {
      title1: 'যাচাইকৃত বিশেষজ্ঞ',
      title2: 'নিরাপদ স্বাস্থ্যসেবা',
      subtitle: 'ঘরে বসেই যেকোনো রোগের বিশেষজ্ঞ ডাক্তার খুঁজে নিন নিমিষেই',
      badgeNum: '১০০%',
      badgeLabel: 'যাচাইকৃত প্রোফাইল'
    },
    {
      title1: 'জরুরি প্রয়োজনে',
      title2: '২৪/৭ সাপোর্ট',
      subtitle: 'সঠিক ডাক্তার ও চিকিৎসাসেবা নির্বাচনে আমরা সবসময় আপনার সাথে',
      badgeNum: '২৪/৭',
      badgeLabel: 'সহায়তা সেবা'
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % promoSlides.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [promoSlides.length])

  useEffect(() => {
    const handleOpenLoc = () => setShowLocationPopup(true)
    window.addEventListener('open-hero-location-popup', handleOpenLoc)
    return () => window.removeEventListener('open-hero-location-popup', handleOpenLoc)
  }, [])

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition()
        recognition.lang = 'bn-BD'
        recognition.onresult = (event) => {
          const text = event.results?.[0]?.[0]?.transcript
          if (text) setSearchText(text)
        }
        recognition.start()
      } catch (err) {
        console.error(err)
      }
    } else {
      const el = document.querySelector('.hero-mobile-search-input')
      if (el) el.focus()
    }
  }

  // Fetch specialties — uses same cache key as useSpecialties() hook
  // → If useSpecialties() already fetched on this page, this is instant (cache hit)
  const specialtiesQuery = useQuery({
    queryKey: ['specialties'],
    queryFn: async () => {
      const res = await getSpecialties()
      return res.data?.data || res.data || []
    },
    staleTime: 30 * 60 * 1000
  })
  const specialties = specialtiesQuery.data || []

  // Fetch hospitals — uses same cache key as useHospitals({ per_page: 100 })
  // → If another component fetched hospitals with same params, this is instant (cache hit)
  const hospitalsQuery = useQuery({
    queryKey: ['hospitals', { per_page: 100 }],
    queryFn: async () => {
      const res = await getHospitals({ per_page: 100 })
      return res.data?.data || res.data?.data?.data || res.data || []
    },
    staleTime: 30 * 60 * 1000
  })
  const hospitals = hospitalsQuery.data || []

  const handleLocationSelect = (data) => {
    setLocationLabel(data.label)
    setLocationParams({
      division_id: data.division_id,
      district_id: data.district_id,
      upazila_id: data.upazila_id,
      union_id: data.union_id
    })
    const shortName = (data.label || '').split('>')[0].trim()
    if (shortName) {
      localStorage.setItem('user_location_name', shortName)
      window.dispatchEvent(new CustomEvent('location-selected', { detail: { name: shortName } }))
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const params = {}
    if (locationParams.division_id) params.division_id = locationParams.division_id
    if (locationParams.district_id) params.district_id = locationParams.district_id
    if (locationParams.upazila_id) params.upazila_id = locationParams.upazila_id
    if (locationParams.union_id) params.union_id = locationParams.union_id
    if (selectedSpecialty) params.specialty_id = selectedSpecialty
    if (selectedHospital) params.hospital_id = selectedHospital
    if (selectedDate) params.date = selectedDate
    if (searchText.trim()) params.search = searchText.trim()

    if (selectedHospital) {
      navigate(`/hospitals?${new URLSearchParams(params).toString()}`)
    } else {
      navigate(`/doctors?${new URLSearchParams(params).toString()}`)
    }
  }

  const handleScrollDown = () => {
    const heroSec = document.querySelector('.hero-section-main')
    if (heroSec) {
      const topbar = document.querySelector('.db-topbar')
      const mainHeader = document.querySelector('.db-main-header') || document.querySelector('.navbar')
      let totalHeaderHeight = 0
      if (topbar) totalHeaderHeight += topbar.offsetHeight
      if (mainHeader) totalHeaderHeight += mainHeader.offsetHeight
      if (totalHeaderHeight === 0) totalHeaderHeight = 90
      
      const targetTop = heroSec.offsetTop + heroSec.offsetHeight - totalHeaderHeight
      window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
    } else {
      window.scrollBy({ top: window.innerHeight * 0.85, behavior: 'smooth' })
    }
  }

  const featureCards = [
    { icon: <IconUserCheck size={26} color="#15803D" />, title: 'যাচাইকৃত ডাক্তার', desc: '১০০% যাচাইকৃত ও অভিজ্ঞ স্বাস্থ্যসেবা বিশেষজ্ঞ' },
    { icon: <IconCalendarEvent size={26} color="#15803D" />, title: 'সহজ অ্যাপয়েন্টমেন্ট', desc: 'মাত্র কয়েক ক্লিকেই অ্যাপয়েন্টমেন্ট বুক করুন' },
    { icon: <IconShieldCheck size={26} color="#15803D" />, title: 'নিরাপদ ও নির্ভরযোগ্য', desc: 'আপনার স্বাস্থ্য তথ্য আমাদের কাছে সম্পূর্ণ নিরাপদ' },
    { icon: <IconHeadset size={26} color="#15803D" />, title: '২৪/৭ সহায়তা', desc: 'যেকোনো প্রয়োজনে যেকোনো সময় পাশে আছি' }
  ]

  const heroBgImage = hero.bg_image_url || '/images/city_hero_bg.jpg'

  return (
    <section
      className="hero-section-main"
      style={{
        paddingTop: 'calc(var(--header-height, 90px) + 16px)',
        paddingBottom: '20px',
        position: 'relative',
        zIndex: 1,
        color: '#FFFFFF',
        overflow: 'hidden'
      }}
    >
      {/* Dynamic Background Layer */}
      <div className="hero-bg-dynamic" style={{
        position: 'absolute',
        inset: -14,
        backgroundImage: `url('${heroBgImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 36%',
        backgroundRepeat: 'no-repeat',
        filter: 'blur(2.5px) brightness(0.88) contrast(1.05)',
        transform: 'scale(1.05)',
        zIndex: -2,
        pointerEvents: 'none',
        transition: 'background-image 0.5s ease'
      }} />
      {/* Dark overlay */}
      <div className="hero-bg-dark-overlay" style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.72) 0%, rgba(15, 23, 42, 0.75) 45%, rgba(11, 25, 44, 0.82) 100%)',
        zIndex: -1,
        pointerEvents: 'none'
      }} />
      {/* Location Popup */}
      {showLocationPopup && (
        <LocationPopup
          onClose={() => setShowLocationPopup(false)}
          onSelect={handleLocationSelect}
        />
      )}

      {/* Specialty Popup */}
      {showSpecialtyPopup && (
        <SearchablePopup
          title="বিশেষজ্ঞতা নির্বাচন করুন"
          placeholder="বিশেষজ্ঞতার নাম লিখুন..."
          items={specialties}
          getLabel={(s) => s.name || s.name_bn || s.title}
          onClose={() => setShowSpecialtyPopup(false)}
          onSelect={(item) => {
            setSelectedSpecialty(item.id)
            setSpecialtyLabel(item.name || item.name_bn || item.title)
            setShowSpecialtyPopup(false)
          }}
        />
      )}

      {/* Hospital Popup */}
      {showHospitalPopup && (
        <SearchablePopup
          title="হাসপাতাল নির্বাচন করুন"
          placeholder="হাসপাতালের নাম লিখুন..."
          items={hospitals}
          getLabel={(h) => h.name || h.name_bn}
          onClose={() => setShowHospitalPopup(false)}
          onSelect={(item) => {
            setSelectedHospital(item.id)
            setHospitalLabel(item.name || item.name_bn)
            setShowHospitalPopup(false)
          }}
        />
      )}

      {/* DESKTOP HERO VIEW (>= 992px) */}
      <div className="hero-desktop-wrapper">
        <Container style={{ maxWidth: 1240 }}>
          {/* Hero Title */}
        <ScrollReveal direction="up" distance={20} duration={600}>
          <div className="text-center mx-auto hero-title-wrapper" style={{ maxWidth: 980, marginBottom: 36 }}>
            <h1 className="hero-title-h1" style={{ fontSize: 'clamp(22px, 3.6vw, 44px)', fontWeight: 900, color: '#00B875', lineHeight: 1.35, letterSpacing: '-0.01em', marginBottom: 16, textShadow: '0 2px 14px rgba(0, 0, 0, 0.6)', fontFamily: "'Hind Siliguri', sans-serif" }}>
              <div style={{ display: 'block', color: '#00B875', whiteSpace: 'nowrap' }}>স্বাগত ডক্টর বুকলেটে</div>
              <div className="hero-typed-wrapper" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', minHeight: '1.35em', lineHeight: 1.35, marginTop: 4 }}>
                <span style={{ color: '#FFFFFF', whiteSpace: 'nowrap' }}>{typedLine2 || ' '}</span>
                <span style={{ display: 'inline-block', color: '#00B875', fontWeight: 300, animation: 'cursorBlink 0.8s infinite', marginLeft: 2, lineHeight: 1 }}>|</span>
              </div>
            </h1>
            <p className="hero-subtitle-p" style={{ fontSize: 'clamp(14px, 1.6vw, 18px)', color: 'rgba(241, 245, 249, 0.94)', fontWeight: 400, lineHeight: 1.65, margin: '0 auto', maxWidth: 880 }}>
              {hero.subtitle || 'বাংলাদেশের অভিজ্ঞ ও যাচাইকৃত বিশেষজ্ঞ ডাক্তার, হাসপাতাল এবং চেম্বার খুঁজে মাত্র কয়েক ক্লিকেই অ্যাপয়েন্টমেন্ট বুক করুন—দ্রুত, নিরাপদ এবং সম্পূর্ণ ঝামেলামুক্তভাবে।'}
            </p>
          </div>
        </ScrollReveal>

        {/* Search Bar */}
        <ScrollReveal direction="up" distance={25} duration={700}>
          <form onSubmit={handleSearch} className="hero-search-form" style={{ marginBottom: 44 }}>
            <div className="hero-search-bar">

              {/* 1. Location Popup Trigger */}
              <div
                className="hero-field-col hero-field-location"
                onClick={() => setShowLocationPopup(true)}
                title="লোকেশন নির্বাচন করুন"
              >
                <div className="hero-field-icon-bg">
                  <IconMapPin size={18} style={{ color: '#00B875', flexShrink: 0 }} />
                </div>
                <span className="hero-field-text" style={{ color: locationLabel ? '#1E293B' : '#64748B', fontWeight: locationLabel ? 700 : 500 }}>
                  {locationLabel || 'লোকেশন নির্বাচন করুন'}
                </span>
                {locationLabel ? (
                  <IconX
                    size={16}
                    style={{ color: '#64748B', marginLeft: 'auto', cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); setLocationLabel(''); setLocationParams({}) }}
                  />
                ) : (
                  <IconChevronDown size={16} style={{ color: '#94A3B8', marginLeft: 'auto' }} />
                )}
              </div>

              {/* 2. বিশেষজ্ঞতা Popup Trigger */}
              <div
                className="hero-field-col hero-field-location"
                onClick={() => setShowSpecialtyPopup(true)}
                title="বিশেষজ্ঞতা নির্বাচন করুন"
              >
                <div className="hero-field-icon-bg">
                  <IconStethoscope size={18} style={{ color: '#00B875', flexShrink: 0 }} />
                </div>
                <span className="hero-field-text" style={{ color: specialtyLabel ? '#1E293B' : '#64748B', fontWeight: specialtyLabel ? 700 : 500 }}>
                  {specialtyLabel || 'বিশেষজ্ঞতা নির্বাচন করুন'}
                </span>
                {specialtyLabel ? (
                  <IconX size={16} style={{ color: '#64748B', marginLeft: 'auto', cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); setSpecialtyLabel(''); setSelectedSpecialty('') }} />
                ) : (
                  <IconChevronDown size={16} style={{ color: '#94A3B8', marginLeft: 'auto' }} />
                )}
              </div>

              {/* 3. হাসপাতাল Popup Trigger */}
              <div
                className="hero-field-col hero-field-location"
                onClick={() => setShowHospitalPopup(true)}
                title="হাসপাতাল নির্বাচন করুন"
              >
                <div className="hero-field-icon-bg">
                  <IconBuildingHospital size={18} style={{ color: '#00B875', flexShrink: 0 }} />
                </div>
                <span className="hero-field-text" style={{ color: hospitalLabel ? '#1E293B' : '#64748B', fontWeight: hospitalLabel ? 700 : 500 }}>
                  {hospitalLabel || 'হাসপাতাল নির্বাচন করুন'}
                </span>
                {hospitalLabel ? (
                  <IconX size={16} style={{ color: '#64748B', marginLeft: 'auto', cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); setHospitalLabel(''); setSelectedHospital('') }} />
                ) : (
                  <IconChevronDown size={16} style={{ color: '#94A3B8', marginLeft: 'auto' }} />
                )}
              </div>

              {/* 4. Keyword */}
              <div className="hero-field-col">
                <div className="hero-field-icon-bg">
                  <IconWriting size={18} style={{ color: '#00B875', flexShrink: 0 }} />
                </div>
                <input
                  type="text"
                  placeholder="ডাক্তার / হাসপাতাল / বিশেষজ্ঞতা লিখুন"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="hero-text-input"
                />
              </div>

              {/* 5. Search Button */}
              <button type="submit" className="hero-search-btn">
                <IconSearch size={20} stroke={2.8} />
                <span>খুঁজুন</span>
              </button>
            </div>
          </form>
        </ScrollReveal>

        {/* Feature Badges */}
        <ScrollReveal direction="up" distance={30} duration={800}>
          <div className="hero-features-row">
            {featureCards.map((card, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)' }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.25, marginBottom: 3 }}>{card.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.35 }}>{card.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Scroll Down */}
        <div onClick={handleScrollDown} className="hero-scroll-down-btn" title="Scroll Down">
          <div className="hero-scroll-icon">
            <IconChevronsDown size={26} stroke={2.5} />
          </div>
        </div>
        </Container>
      </div>

      {/* MOBILE APP HERO VIEW (< 992px) - Matching Image 1 Reference */}
      <div className="hero-mobile-wrapper">
        <div className="hero-mobile-container">
          {/* 1. Mint Green Promo Card */}
          <div className="hero-mobile-promo-card">
            {/* Left Column: Text & Slider Dots */}
            <div className="hero-mobile-card-left">
              <h2 className="hero-mobile-promo-title-1">
                {promoSlides[activeSlide]?.title1 || 'বিশ্বস্ত ডাক্তারের'}
              </h2>
              <h3 className="hero-mobile-promo-title-2">
                {promoSlides[activeSlide]?.title2 || 'সহজ অ্যাপয়েন্টমেন্ট'}
              </h3>
              <p className="hero-mobile-promo-sub">
                {promoSlides[activeSlide]?.subtitle || 'আপনার ও পরিবারের স্বাস্থ্যসেবায় আমরা আছি আপনার পাশে'}
              </p>
              
              {/* Slider Dots */}
              <div className="hero-mobile-dots">
                {promoSlides.map((_, idx) => (
                  <span
                    key={idx}
                    className={`hero-mobile-dot ${activeSlide === idx ? 'active' : ''}`}
                    onClick={() => setActiveSlide(idx)}
                  />
                ))}
              </div>
            </div>

            {/* Right Column: Doctor Image & Floating Badge */}
            <div className="hero-mobile-card-right">
              <div className="hero-mobile-doctor-glow" />
              <img
                src="/doctor-hero.png"
                alt="Doctor"
                className="hero-mobile-doctor-img"
              />
              <div className="hero-mobile-floating-badge">
                <div className="hero-mobile-badge-icon">
                  <IconUsers size={15} stroke={2.5} />
                </div>
                <div>
                  <div className="hero-mobile-badge-num">
                    {promoSlides[activeSlide]?.badgeNum || '10,000+'}
                  </div>
                  <div className="hero-mobile-badge-label">
                    {promoSlides[activeSlide]?.badgeLabel || 'বিশ্বস্ত ডাক্তার'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Search & Filter Bar */}
          <form onSubmit={handleSearch} className="hero-mobile-search-row">
            <div className="hero-mobile-search-pill">
              <IconSearch size={20} className="hero-mobile-search-icon" />
              <input
                type="text"
                placeholder="ডাক্তার, বিশেষজ্ঞতা বা হাসপাতাল খুঁজুন..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="hero-mobile-search-input"
              />
              <button
                type="button"
                onClick={handleVoiceSearch}
                className="hero-mobile-mic-btn"
                title="ভয়েস সার্চ"
              >
                <IconMicrophone size={19} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowMobileFilterModal(true)}
              className={`hero-mobile-filter-btn ${locationLabel || specialtyLabel || hospitalLabel ? 'active' : ''}`}
              title="ফিল্টার অপশন"
            >
              <IconAdjustmentsHorizontal size={22} />
              {(locationLabel || specialtyLabel || hospitalLabel) && (
                <span className="hero-mobile-filter-active-dot" />
              )}
            </button>
          </form>

          {/* 3. 4-Pill Filter Bar (Matching user image) */}
          <div className="hero-mobile-filter-pills-row">
            {/* Pill 1: অবস্থান */}
            <button
              type="button"
              onClick={() => setShowLocationPopup(true)}
              className={`hero-mobile-filter-pill ${locationLabel ? 'active' : ''}`}
            >
              <IconMapPin size={15} color="#00803D" stroke={2.2} />
              <span>{locationLabel ? locationLabel.split('>')[0].trim() : 'অবস্থান'}</span>
              {locationLabel ? (
                <span
                  className="hero-mobile-filter-pill-clear"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLocationLabel('')
                    setLocationParams({})
                  }}
                >
                  <IconX size={14} />
                </span>
              ) : (
                <IconChevronDown size={14} color="#64748B" />
              )}
            </button>

            {/* Pill 2: বিশেষজ্ঞতা */}
            <button
              type="button"
              onClick={() => setShowSpecialtyPopup(true)}
              className={`hero-mobile-filter-pill ${specialtyLabel ? 'active' : ''}`}
            >
              <IconStethoscope size={15} color="#00803D" stroke={2.2} />
              <span>{specialtyLabel || 'বিশেষজ্ঞতা'}</span>
              {specialtyLabel ? (
                <span
                  className="hero-mobile-filter-pill-clear"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSpecialtyLabel('')
                    setSelectedSpecialty('')
                  }}
                >
                  <IconX size={14} />
                </span>
              ) : (
                <IconChevronDown size={14} color="#64748B" />
              )}
            </button>

            {/* Pill 3: হাসপাতাল */}
            <button
              type="button"
              onClick={() => setShowHospitalPopup(true)}
              className={`hero-mobile-filter-pill ${hospitalLabel ? 'active' : ''}`}
            >
              <IconBuildingHospital size={15} color="#00803D" stroke={2.2} />
              <span>{hospitalLabel || 'হাসপাতাল'}</span>
              {hospitalLabel ? (
                <span
                  className="hero-mobile-filter-pill-clear"
                  onClick={(e) => {
                    e.stopPropagation()
                    setHospitalLabel('')
                    setSelectedHospital('')
                  }}
                >
                  <IconX size={14} />
                </span>
              ) : (
                <IconChevronDown size={14} color="#64748B" />
              )}
            </button>

            {/* Pill 4: তারিখ */}
            <button
              type="button"
              onClick={openDatePicker}
              className={`hero-mobile-filter-pill ${selectedDate ? 'active' : ''}`}
            >
              <IconCalendarEvent size={15} color="#00803D" stroke={2.2} />
              <span>{getDateLabel()}</span>
              {selectedDate ? (
                <span
                  className="hero-mobile-filter-pill-clear"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedDate('')
                  }}
                >
                  <IconX size={14} />
                </span>
              ) : (
                <IconChevronDown size={14} color="#64748B" />
              )}
              {/* Invisible native date picker input */}
              <input
                ref={dateInputRef}
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
              />
            </button>
          </div>

          {/* 4. Quick Action Cards (4-Grid) */}
          <div className="hero-mobile-quick-actions">
            {/* Action 1: অ্যাপয়েন্টমেন্ট বুক করুন */}
            <div
              className="hero-mobile-action-card hero-mobile-action-mint"
              onClick={() => navigate('/quick-appointment')}
            >
              <div className="hero-mobile-action-icon-wrapper">
                <IconCalendarEvent size={30} color="#00803D" stroke={2.2} />
              </div>
              <div className="hero-mobile-action-text">
                <div>অ্যাপয়েন্টমেন্ট</div>
                <div>বুক করুন</div>
              </div>
            </div>

            {/* Action 2: হাসপাতাল খুঁজুন */}
            <div
              className="hero-mobile-action-card hero-mobile-action-blue"
              onClick={() => navigate('/hospitals')}
            >
              <div className="hero-mobile-action-icon-wrapper">
                <IconBuildingHospital size={30} color="#2563EB" stroke={2.2} />
              </div>
              <div className="hero-mobile-action-text">
                <div>হাসপাতাল</div>
                <div>খুঁজুন</div>
              </div>
            </div>

            {/* Action 3: বিশেষজ্ঞ ডাক্তার */}
            <div
              className="hero-mobile-action-card hero-mobile-action-orange"
              onClick={() => navigate('/doctors')}
            >
              <div className="hero-mobile-action-icon-wrapper">
                <IconUserCheck size={30} color="#EA580C" stroke={2.2} />
              </div>
              <div className="hero-mobile-action-text">
                <div>বিশেষজ্ঞ</div>
                <div>ডাক্তার</div>
              </div>
            </div>
          </div>

          {/* 5. Emergency Red Banner */}
          <div
            className="hero-mobile-emergency-banner"
            onClick={() => navigate('/hospitals?emergency=1')}
          >
            {/* 3D-Style Vector Ambulance Graphic */}
            <div className="hero-mobile-emergency-img-box">
              <svg width="52" height="34" viewBox="0 0 72 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-mobile-ambulance-svg">
                {/* Siren glow & lights */}
                <ellipse cx="38" cy="8" rx="8" ry="3" fill="#60A5FA" opacity="0.4" />
                <rect x="36" y="6" width="5" height="4" rx="1.5" fill="#3B82F6" />
                <rect x="42" y="6" width="5" height="4" rx="1.5" fill="#EF4444" />
                {/* Main body white */}
                <path d="M6 14C6 11.79 7.79 10 10 10H46C47.3 10 48.5 10.6 49.3 11.6L57.5 21.2C58.5 22.3 59 23.7 59 25.2V35C59 36.65 57.65 38 56 38H6C4.35 38 3 36.65 3 35V17C3 15.35 4.35 14 6 14Z" fill="#FFFFFF" />
                {/* Cab front bumper */}
                <path d="M59 28H62C63.1 28 64 28.9 64 30V34C64 36.2 62.2 38 60 38H59V28Z" fill="#F1F5F9" />
                {/* Front Window */}
                <path d="M48 13.5H46V22H56.5L49.5 14C49.1 13.7 48.6 13.5 48 13.5Z" fill="#38BDF8" />
                {/* Side window */}
                <rect x="34" y="13.5" width="9.5" height="8.5" rx="1.5" fill="#BAE6FD" />
                {/* Red Cross on side */}
                <rect x="18" y="16" width="4" height="12" rx="1" fill="#EF4444" />
                <rect x="14" y="20" width="12" height="4" rx="1" fill="#EF4444" />
                {/* Red stripe across bottom */}
                <path d="M3 31H59V35C59 36.65 57.65 38 56 38H6C4.35 38 3 36.65 3 35V31Z" fill="#EF4444" />
                {/* Wheels */}
                <circle cx="16" cy="38" r="7" fill="#1E293B" />
                <circle cx="16" cy="38" r="3.5" fill="#94A3B8" />
                <circle cx="16" cy="38" r="1.5" fill="#F8FAFC" />
                <circle cx="48" cy="38" r="7" fill="#1E293B" />
                <circle cx="48" cy="38" r="3.5" fill="#94A3B8" />
                <circle cx="48" cy="38" r="1.5" fill="#F8FAFC" />
                {/* Headlight */}
                <rect x="61" y="29" width="3" height="3" rx="1" fill="#FBBF24" />
              </svg>
            </div>

            {/* Emergency text info */}
            <div className="hero-mobile-emergency-info">
              <div className="hero-mobile-emergency-title">জরুরি সেবা প্রয়োজন?</div>
              <div className="hero-mobile-emergency-desc">অ্যাম্বুলেন্স, ব্লাড ব্যাংক ও ২৪/৭ হাসপাতাল খুঁজুন</div>
            </div>

            {/* Action Arrow Button */}
            <div className="hero-mobile-emergency-arrow">
              <IconArrowRight size={16} stroke={2.8} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Mobile Filter Bottom Sheet Modal */}
      {showMobileFilterModal && (
        <div className="loc-popup-overlay" onClick={() => setShowMobileFilterModal(false)}>
          <div className="hero-mobile-filter-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="hero-mobile-filter-header">
              <div className="hero-mobile-filter-title">অনুসন্ধান ফিল্টার</div>
              <button
                type="button"
                className="loc-close-btn"
                onClick={() => setShowMobileFilterModal(false)}
              >
                <IconX size={20} />
              </button>
            </div>

            <div className="hero-mobile-filter-body">
              {/* Location Selector */}
              <div
                className="hero-mobile-filter-item"
                onClick={() => { setShowMobileFilterModal(false); setShowLocationPopup(true) }}
              >
                <div className="hero-mobile-filter-icon-box">
                  <IconMapPin size={18} color="#00B875" />
                </div>
                <div className="hero-mobile-filter-item-info">
                  <span className="hero-mobile-filter-item-label">লোকেশন</span>
                  <span className="hero-mobile-filter-item-val">
                    {locationLabel || 'লোকেশন নির্বাচন করুন'}
                  </span>
                </div>
                <IconChevronRight size={18} color="#94A3B8" />
              </div>

              {/* Specialty Selector */}
              <div
                className="hero-mobile-filter-item"
                onClick={() => { setShowMobileFilterModal(false); setShowSpecialtyPopup(true) }}
              >
                <div className="hero-mobile-filter-icon-box">
                  <IconStethoscope size={18} color="#00B875" />
                </div>
                <div className="hero-mobile-filter-item-info">
                  <span className="hero-mobile-filter-item-label">বিশেষজ্ঞতা</span>
                  <span className="hero-mobile-filter-item-val">
                    {specialtyLabel || 'বিশেষজ্ঞতা নির্বাচন করুন'}
                  </span>
                </div>
                <IconChevronRight size={18} color="#94A3B8" />
              </div>

              {/* Hospital Selector */}
              <div
                className="hero-mobile-filter-item"
                onClick={() => { setShowMobileFilterModal(false); setShowHospitalPopup(true) }}
              >
                <div className="hero-mobile-filter-icon-box">
                  <IconBuildingHospital size={18} color="#00B875" />
                </div>
                <div className="hero-mobile-filter-item-info">
                  <span className="hero-mobile-filter-item-label">হাসপাতাল</span>
                  <span className="hero-mobile-filter-item-val">
                    {hospitalLabel || 'হাসপাতাল নির্বাচন করুন'}
                  </span>
                </div>
                <IconChevronRight size={18} color="#94A3B8" />
              </div>

              {/* Date Selector */}
              <div
                className="hero-mobile-filter-item"
                onClick={(e) => {
                  setShowMobileFilterModal(false)
                  setTimeout(() => openDatePicker(e), 150)
                }}
              >
                <div className="hero-mobile-filter-icon-box">
                  <IconCalendarEvent size={18} color="#00B875" />
                </div>
                <div className="hero-mobile-filter-item-info">
                  <span className="hero-mobile-filter-item-label">তারিখ</span>
                  <span className="hero-mobile-filter-item-val">
                    {getDateLabel()}
                  </span>
                </div>
                <IconChevronRight size={18} color="#94A3B8" />
              </div>
            </div>

            <div className="hero-mobile-filter-footer">
              <button
                type="button"
                className="hero-mobile-filter-reset-btn"
                onClick={() => {
                  setLocationLabel('')
                  setLocationParams({})
                  setSpecialtyLabel('')
                  setSelectedSpecialty('')
                  setHospitalLabel('')
                  setSelectedHospital('')
                  setSelectedDate('')
                }}
              >
                রিসেট
              </button>
              <button
                type="button"
                className="hero-mobile-filter-apply-btn"
                onClick={(e) => {
                  setShowMobileFilterModal(false)
                  handleSearch(e)
                }}
              >
                খুঁজুন
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ── Stable Typewriter Container (Zero Layout Shift) ──── */
        .hero-typed-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          min-height: 1.35em;
          line-height: 1.35;
        }

        /* ── Hero Section Background Layers ──── */
        .hero-section-main {
          position: relative;
          overflow: hidden;
        }




        /* ── Search Bar ───────────────────────── */
        .hero-search-bar {
          background: #FFFFFF;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 45px rgba(0,0,0,0.22);
          display: flex;
          align-items: stretch;
          width: 100%;
          max-width: 1160px;
          margin: 0 auto;
          height: 60px;
        }

        .hero-field-icon-bg {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #E8F8F2;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .hero-field-col {
          flex: 1 1 22%;
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 16px;
          border-right: 1px solid #E2E8F0;
          overflow: hidden;
          transition: background 0.2s ease;
        }

        .hero-field-location {
          cursor: pointer;
          user-select: none;
        }
        .hero-field-location:hover {
          background: #F8FAFC;
        }
        .hero-field-location:hover .hero-field-icon-bg {
          transform: scale(1.05);
        }

        .hero-field-text {
          font-size: 13.5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        .hero-text-input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 13.5px;
          font-weight: 700;
          color: #1E293B;
        }
        .hero-text-input::placeholder { color: #64748B; opacity: 1; font-weight: 500; }

        .hero-search-btn {
          background: linear-gradient(135deg, #00B875 0%, #008A58 100%);
          color: #FFFFFF;
          border: none;
          border-radius: 0;
          padding: 0 32px;
          font-size: 15px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
          height: 100%;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .hero-search-btn:hover {
          background: linear-gradient(135deg, #00A368 0%, #00774C 100%);
        }

        /* ── Location Popup ─────────────────── */
        .loc-popup-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          z-index: 9999;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 130px;
          backdrop-filter: blur(4px);
          animation: locFadeIn 0.18s ease;
        }

        @keyframes locFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .loc-popup-box {
          background: #FFFFFF;
          width: 100%;
          max-width: 560px;
          border-radius: 0;
          box-shadow: 0 24px 64px rgba(0,0,0,0.35);
          overflow: hidden;
          animation: locSlideUp 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes locSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        .loc-popup-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 18px 20px 14px;
          border-bottom: 1px solid #EDF2F7;
          background: #F8FAFC;
        }

        .loc-popup-title {
          font-size: 16px;
          font-weight: 700;
          color: #1A202C;
        }

        .loc-breadcrumb {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 2px;
          margin-top: 4px;
          font-size: 12px;
          color: #718096;
        }

        .loc-confirm-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: #00803D;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .loc-confirm-btn:hover { background: #006630; }

        .loc-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #A0AEC0;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }
        .loc-close-btn:hover { color: #E53E3E; }

        /* Step tabs */
        .loc-steps {
          display: flex;
          border-bottom: 1px solid #EDF2F7;
          background: #FFFFFF;
        }

        .loc-step-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 4px;
          font-size: 12px;
          font-weight: 600;
          color: #CBD5E0;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .loc-step-tab.active {
          color: #00803D;
          border-bottom-color: #00803D;
        }

        .loc-step-tab.done {
          color: #48BB78;
        }

        .loc-step-num {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #EDF2F7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
        }

        .loc-step-tab.active .loc-step-num { background: #00803D; color: #fff; }
        .loc-step-tab.done .loc-step-num { background: #48BB78; color: #fff; }
        .loc-step-tab.clickable { cursor: pointer; }
        .loc-step-tab.clickable:hover { background: #F0FFF4; color: #00803D; }

        /* Back button */
        .loc-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: #F0FFF4;
          border: 1.5px solid #C6F6D5;
          color: #00803D;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.18s;
        }
        .loc-back-btn:hover {
          background: #00803D;
          border-color: #00803D;
          color: #FFFFFF;
        }

        /* Clickable breadcrumb items */
        .loc-breadcrumb-item {
          display: inline-flex;
          align-items: center;
          cursor: pointer;
          transition: color 0.15s;
        }
        .loc-breadcrumb-item:hover span { color: #00803D; text-decoration: underline; }

        /* List */
        .loc-list {
          max-height: 340px;
          overflow-y: auto;
          padding: 8px 0;
        }

        .loc-list::-webkit-scrollbar { width: 5px; }
        .loc-list::-webkit-scrollbar-thumb { background: #CBD5E0; border-radius: 99px; }

        .loc-item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          background: none;
          border: none;
          text-align: left;
          font-size: 14px;
          font-weight: 500;
          color: #2D3748;
          cursor: pointer;
          transition: background 0.15s;
          border-bottom: 1px solid #F7FAFC;
        }

        .loc-item:hover {
          background: #F0FFF4;
          color: #00803D;
        }

        .loc-item-arrow { color: #CBD5E0; transition: color 0.15s; }
        .loc-item:hover .loc-item-arrow { color: #00803D; }

        .loc-loading, .loc-empty {
          text-align: center;
          padding: 32px;
          color: #A0AEC0;
          font-size: 14px;
        }

        /* Search popup search bar */
        .srch-popup-search {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          border-bottom: 1px solid #EDF2F7;
          background: #F8FAFC;
        }

        .srch-popup-input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-size: 14px;
          font-weight: 500;
          color: #2D3748;
        }
        .srch-popup-input::placeholder { color: #A0AEC0; }

        .srch-popup-clear {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          color: #A0AEC0;
          padding: 2px;
        }
        .srch-popup-clear:hover { color: #E53E3E; }

        .srch-item-check {
          color: #E2E8F0;
          flex-shrink: 0;
          transition: color 0.15s;
        }
        .loc-item:hover .srch-item-check { color: #00803D; }

        /* ── Feature row & Scroll icon ──────── */
        .hero-features-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          max-width: 1180px;
          margin: 0 auto 36px;
        }

        .hero-scroll-down-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 36px auto 10px;
          cursor: pointer;
          width: fit-content;
          user-select: none;
        }

        .hero-scroll-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1.5px solid rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          animation: heroScrollBounce 2.2s infinite ease-in-out;
          transition: all 0.3s ease;
        }

        @keyframes heroScrollBounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(12px); }
          60% { transform: translateY(6px); }
        }

        .hero-scroll-down-btn:hover .hero-scroll-icon {
          background: rgba(22,163,74,0.9);
          border-color: #22C55E;
          transform: scale(1.1);
        }

        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        @media (min-width: 992px) {
          .hero-desktop-wrapper {
            display: block !important;
          }
          .hero-mobile-wrapper {
            display: none !important;
          }
          .hero-section-main {
            min-height: 100vh !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            padding-top: calc(var(--header-height, 100px) + 45px) !important;
            padding-bottom: 45px !important;
          }
          .hero-title-wrapper {
            margin-top: 12px !important;
          }
        }

        @media (max-width: 991px) {
          .hero-desktop-wrapper {
            display: none !important;
          }
          .hero-mobile-wrapper {
            display: block !important;
          }
          .hero-bg-dynamic,
          .hero-bg-dark-overlay {
            display: none !important;
          }
          .hero-section-main {
            background: #F8FAFC !important;
            color: #0F172A !important;
            min-height: auto !important;
            display: block !important;
            padding-top: calc(var(--header-height, 68px) + 14px) !important;
            padding-bottom: 22px !important;
          }

          /* ── Mobile Container ── */
          .hero-mobile-container {
            width: 100%;
            max-width: 500px;
            margin: 0 auto;
            padding: 0 14px;
          }

          /* ── 1. Mint Green Promo Card ── */
          .hero-mobile-promo-card {
            background: linear-gradient(135deg, #E6F7F0 0%, #D8F5E5 50%, #E8F8F2 100%);
            border-radius: 20px;
            padding: 18px 14px 14px 18px;
            display: flex;
            align-items: stretch;
            justify-content: space-between;
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(16, 185, 129, 0.18);
            box-shadow: 0 6px 20px rgba(0, 184, 117, 0.08);
          }

          .hero-mobile-card-left {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            z-index: 2;
            padding-right: 4px;
          }

          .hero-mobile-promo-title-1 {
            font-size: 19px;
            font-weight: 900;
            color: #0F2942;
            line-height: 1.25;
            margin: 0;
            font-family: 'Hind Siliguri', sans-serif;
            letter-spacing: -0.01em;
          }

          .hero-mobile-promo-title-2 {
            font-size: 21px;
            font-weight: 900;
            color: #00B875;
            line-height: 1.25;
            margin: 2px 0 6px 0;
            font-family: 'Hind Siliguri', sans-serif;
            letter-spacing: -0.01em;
          }

          .hero-mobile-promo-sub {
            font-size: 11.5px;
            font-weight: 500;
            color: #475569;
            line-height: 1.45;
            margin: 0 0 14px 0;
            max-width: 175px;
            font-family: 'Hind Siliguri', sans-serif;
          }

          .hero-mobile-dots {
            display: flex;
            align-items: center;
            gap: 5px;
          }

          .hero-mobile-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: rgba(0, 184, 117, 0.28);
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
          }

          .hero-mobile-dot.active {
            width: 20px;
            border-radius: 99px;
            background: #00B875;
          }

          .hero-mobile-card-right {
            position: relative;
            width: 135px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            flex-shrink: 0;
          }

          .hero-mobile-doctor-glow {
            position: absolute;
            width: 130px;
            height: 130px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(16, 185, 129, 0.26) 0%, rgba(255,255,255,0) 70%);
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 0;
            pointer-events: none;
          }

          .hero-mobile-doctor-img {
            height: 142px;
            width: auto;
            object-fit: contain;
            position: relative;
            z-index: 1;
            mix-blend-mode: multiply;
            pointer-events: none;
            margin-bottom: -4px;
          }

          .hero-mobile-floating-badge {
            position: absolute;
            right: -6px;
            bottom: 12px;
            background: #FFFFFF;
            border-radius: 12px;
            padding: 5px 8px;
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(226, 232, 240, 0.9);
            display: flex;
            align-items: center;
            gap: 6px;
            z-index: 3;
            white-space: nowrap;
          }

          .hero-mobile-badge-icon {
            width: 24px;
            height: 24px;
            border-radius: 7px;
            background: #E8F8F2;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #00B875;
            flex-shrink: 0;
          }

          .hero-mobile-badge-num {
            font-size: 11px;
            font-weight: 800;
            color: #0F172A;
            line-height: 1.1;
          }

          .hero-mobile-badge-label {
            font-size: 9px;
            font-weight: 600;
            color: #64748B;
            line-height: 1.1;
          }

          /* ── 2. Search & Filter Bar ── */
          .hero-mobile-search-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 14px;
            width: 100%;
          }

          .hero-mobile-search-pill {
            flex: 1;
            height: 50px;
            background: #FFFFFF;
            border: 1.5px solid #E2E8F0;
            border-radius: 16px;
            padding: 0 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.03);
            transition: all 0.2s ease;
          }

          .hero-mobile-search-pill:focus-within {
            border-color: #00B875;
            box-shadow: 0 2px 12px rgba(0, 184, 117, 0.14);
          }

          .hero-mobile-search-icon {
            color: #00B875;
            flex-shrink: 0;
          }

          .hero-mobile-search-input {
            border: none;
            background: transparent;
            outline: none;
            width: 100%;
            font-size: 13.5px;
            font-weight: 600;
            color: #1E293B;
            font-family: 'Hind Siliguri', sans-serif;
          }

          .hero-mobile-search-input::placeholder {
            color: #64748B;
            font-weight: 500;
            opacity: 1;
          }

          .hero-mobile-mic-btn {
            background: none;
            border: none;
            padding: 0;
            color: #00B875;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            flex-shrink: 0;
            transition: transform 0.15s ease;
          }

          .hero-mobile-mic-btn:active {
            transform: scale(0.9);
          }

          .hero-mobile-filter-btn {
            width: 50px;
            height: 50px;
            border-radius: 16px;
            background: #FFFFFF;
            border: 1.5px solid #E2E8F0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #1E293B;
            flex-shrink: 0;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.03);
            position: relative;
            transition: all 0.2s ease;
          }

          .hero-mobile-filter-btn:active {
            transform: scale(0.96);
            background: #F8FAFC;
          }

          .hero-mobile-filter-btn.active {
            border-color: #00B875;
            background: #E8F8F2;
            color: #008A58;
          }

          .hero-mobile-filter-active-dot {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #00B875;
            box-shadow: 0 0 0 2px #FFFFFF;
          }

          /* ── 3. 4-Pill Filter Bar (Matching user image) ── */
          .hero-mobile-filter-pills-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 12px;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            -webkit-overflow-scrolling: touch;
            padding: 2px 2px 4px 2px;
            width: 100%;
          }

          .hero-mobile-filter-pills-row::-webkit-scrollbar {
            display: none;
          }

          .hero-mobile-filter-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #FFFFFF;
            border: 1.5px solid #E2E8F0;
            border-radius: 999px;
            padding: 7px 13px;
            font-size: 13px;
            font-weight: 700;
            color: #1E293B;
            white-space: nowrap;
            flex-shrink: 0;
            cursor: pointer;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
            transition: all 0.2s ease;
            user-select: none;
            font-family: 'Hind Siliguri', sans-serif;
            line-height: 1.2;
          }

          .hero-mobile-filter-pill:active {
            transform: scale(0.97);
            background: #F8FAFC;
          }

          .hero-mobile-filter-pill.active {
            background: #E8F8F2;
            border-color: #00803D;
            color: #00803D;
            box-shadow: 0 2px 8px rgba(0, 128, 61, 0.12);
          }

          .hero-mobile-filter-pill-clear {
            color: #64748B;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-left: 2px;
            transition: color 0.15s;
          }

          .hero-mobile-filter-pill-clear:hover {
            color: #E53E3E;
          }

          /* ── 4. Quick Action Cards (3-Grid) ── */
          .hero-mobile-quick-actions {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 14px;
            width: 100%;
          }

          .hero-mobile-action-card {
            border-radius: 14px;
            padding: 13px 6px 11px 6px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            user-select: none;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
            text-align: center;
            min-height: 82px;
          }

          .hero-mobile-action-card:active {
            transform: scale(0.96);
          }

          .hero-mobile-action-mint {
            background: #E8F8F0;
            border: 1px solid rgba(0, 184, 117, 0.22);
          }

          .hero-mobile-action-blue {
            background: #EBF5FF;
            border: 1px solid rgba(59, 130, 246, 0.22);
          }

          .hero-mobile-action-orange {
            background: #FFF4E6;
            border: 1px solid rgba(249, 115, 22, 0.22);
          }

          .hero-mobile-action-purple {
            background: #F4F0FF;
            border: 1px solid rgba(139, 92, 246, 0.22);
          }

          .hero-mobile-action-icon-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 6px;
            height: 32px;
            transition: transform 0.2s ease;
          }

          .hero-mobile-action-card:hover .hero-mobile-action-icon-wrapper {
            transform: translateY(-2px);
          }

          .hero-mobile-action-text {
            font-size: 12.5px;
            font-weight: 800;
            color: #0F172A;
            line-height: 1.3;
            font-family: 'Hind Siliguri', sans-serif;
            letter-spacing: -0.01em;
          }

          /* ── 5. Emergency Banner ── */
          .hero-mobile-emergency-banner {
            margin-top: 11px;
            background: linear-gradient(90deg, #F04438 0%, #E02424 100%);
            border-radius: 14px;
            padding: 9px 12px 9px 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            cursor: pointer;
            box-shadow: 0 6px 20px rgba(239, 68, 68, 0.25);
            transition: all 0.25s ease;
            user-select: none;
            position: relative;
            overflow: hidden;
          }

          .hero-mobile-emergency-banner:active {
            transform: scale(0.98);
            box-shadow: 0 3px 12px rgba(239, 68, 68, 0.2);
          }

          .hero-mobile-emergency-img-box {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .hero-mobile-ambulance-svg {
            filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.18));
            display: block;
          }

          .hero-mobile-emergency-info {
            flex: 1;
            min-width: 0;
          }

          .hero-mobile-emergency-title {
            font-size: 15px;
            font-weight: 900;
            color: #FFFFFF;
            line-height: 1.2;
            font-family: 'Hind Siliguri', sans-serif;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
          }

          .hero-mobile-emergency-desc {
            font-size: 10.5px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.95);
            line-height: 1.25;
            margin-top: 2px;
            font-family: 'Hind Siliguri', sans-serif;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .hero-mobile-emergency-arrow {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
            color: #EF4444;
            transition: transform 0.2s ease;
          }

          .hero-mobile-emergency-banner:hover .hero-mobile-emergency-arrow {
            transform: translateX(2px);
          }

          /* ── 6. Mobile Filter Bottom Sheet ── */
          .hero-mobile-filter-sheet {
            background: #FFFFFF;
            width: 100%;
            max-width: 480px;
            border-radius: 24px 24px 0 0;
            padding: 20px 20px calc(24px + env(safe-area-inset-bottom, 0px));
            box-shadow: 0 -10px 40px rgba(0,0,0,0.18);
            animation: mobileFilterSlideUp 0.25s cubic-bezier(0.165, 0.84, 0.44, 1);
          }

          @keyframes mobileFilterSlideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }

          .hero-mobile-filter-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid #EDF2F7;
          }

          .hero-mobile-filter-title {
            font-size: 17px;
            font-weight: 800;
            color: #0F172A;
            font-family: "'Hind Siliguri', sans-serif";
          }

          .hero-mobile-filter-body {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 20px;
          }

          .hero-mobile-filter-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 14px;
            border-radius: 14px;
            background: #F8FAFC;
            border: 1.5px solid #E2E8F0;
            cursor: pointer;
            transition: all 0.18s ease;
          }

          .hero-mobile-filter-item:active {
            background: #E8F8F2;
            border-color: #00B875;
          }

          .hero-mobile-filter-icon-box {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            background: #E8F8F2;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .hero-mobile-filter-item-info {
            flex: 1;
            overflow: hidden;
          }

          .hero-mobile-filter-item-label {
            font-size: 11px;
            color: #64748B;
            font-weight: 600;
            display: block;
          }

          .hero-mobile-filter-item-val {
            font-size: 13.5px;
            color: #1E293B;
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: block;
            margin-top: 2px;
          }

          .hero-mobile-filter-footer {
            display: flex;
            gap: 10px;
          }

          .hero-mobile-filter-reset-btn {
            flex: 1;
            height: 48px;
            border-radius: 14px;
            background: #F1F5F9;
            border: none;
            color: #475569;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
          }

          .hero-mobile-filter-apply-btn {
            flex: 2;
            height: 48px;
            border-radius: 14px;
            background: linear-gradient(135deg, #00B875 0%, #008A58 100%);
            border: none;
            color: #FFFFFF;
            font-weight: 800;
            font-size: 15px;
            box-shadow: 0 4px 14px rgba(0, 184, 117, 0.3);
            cursor: pointer;
          }

          .loc-popup-box { max-width: 96vw; margin: 0 8px; }
          .loc-popup-overlay { padding-top: 80px; }
        }

        @media (max-width: 576px) {
          .hero-section-main {
            padding-top: calc(var(--header-height, 68px) + 10px) !important;
          }
        }
      `}</style>
    </section>
  )
})

export default HeroSection

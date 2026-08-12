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
  IconCheck
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

// ── Main Hero Section ───────────────────────────────────────────────────────
const HeroSection = memo(function HeroSection({ stats: propStats }) {
  const navigate = useNavigate()
  const cms = getContent()
  const hero = cms.hero || {}

  const fullTitle = hero.title || (hero.title_line1 ? (hero.title_line2 ? `${hero.title_line1} ${hero.title_line2}` : hero.title_line1) : 'স্বাগত ডক্টর বুকলেটে- বিশ্বস্ত ডাক্তার খুঁজুন, সহজে অ্যাপয়েন্টমেন্ট নিন')
  const [typedTitle, setTypedTitle] = useState('')

  useEffect(() => {
    let isMounted = true
    let charIndex = 0
    let isDeleting = false
    let timeoutId = null

    function typeLoop() {
      if (!isMounted) return

      if (!isDeleting) {
        setTypedTitle(fullTitle.slice(0, charIndex))
        if (charIndex < fullTitle.length) {
          charIndex++
          timeoutId = setTimeout(typeLoop, 80) // Medium typing speed
        } else {
          isDeleting = true
          timeoutId = setTimeout(typeLoop, 2800)
        }
      } else {
        setTypedTitle(fullTitle.slice(0, charIndex))
        if (charIndex > 0) {
          charIndex--
          timeoutId = setTimeout(typeLoop, 35)
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
  }, [fullTitle])

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

  // Fetch specialties
  const specialtiesQuery = useQuery({
    queryKey: ['hero-specialties'],
    queryFn: async () => {
      const res = await getSpecialties()
      return res.data?.data || res.data || []
    },
    staleTime: 30 * 60 * 1000
  })
  const specialties = specialtiesQuery.data || []

  // Fetch hospitals
  const hospitalsQuery = useQuery({
    queryKey: ['hero-hospitals'],
    queryFn: async () => {
      const res = await getHospitals({ per_page: 100 })
      return res.data?.data || res.data || []
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
    if (searchText.trim()) params.search = searchText.trim()

    if (selectedHospital) {
      navigate(`/hospitals?${new URLSearchParams(params).toString()}`)
    } else {
      navigate(`/doctors?${new URLSearchParams(params).toString()}`)
    }
  }

  const handleScrollDown = () => {
    const heroSec = document.querySelector('.hero-section-main')
    const nextSec = heroSec?.nextElementSibling
    if (nextSec) {
      const topbar = document.querySelector('.db-topbar')
      const mainHeader = document.querySelector('.db-main-header') || document.querySelector('.navbar')
      let totalHeaderHeight = 0
      if (topbar) totalHeaderHeight += topbar.offsetHeight
      if (mainHeader) totalHeaderHeight += mainHeader.offsetHeight
      if (totalHeaderHeight === 0) {
        const cssVar = getComputedStyle(document.documentElement).getPropertyValue('--header-height')
        totalHeaderHeight = parseInt(cssVar) || 110
      }
      const targetTop = nextSec.getBoundingClientRect().top + window.scrollY - totalHeaderHeight
      window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
    }
  }

  const featureCards = [
    { icon: <IconUserCheck size={26} color="#15803D" />, title: 'যাচাইকৃত ডাক্তার', desc: '১০০% যাচাইকৃত ও অভিজ্ঞ স্বাস্থ্যসেবা বিশেষজ্ঞ' },
    { icon: <IconCalendarEvent size={26} color="#15803D" />, title: 'সহজ অ্যাপয়েন্টমেন্ট', desc: 'মাত্র কয়েক ক্লিকেই অ্যাপয়েন্টমেন্ট বুক করুন' },
    { icon: <IconShieldCheck size={26} color="#15803D" />, title: 'নিরাপদ ও নির্ভরযোগ্য', desc: 'আপনার স্বাস্থ্য তথ্য আমাদের কাছে সম্পূর্ণ নিরাপদ' },
    { icon: <IconHeadset size={26} color="#15803D" />, title: '২৪/৭ সহায়তা', desc: 'যেকোনো প্রয়োজনে যেকোনো সময় পাশে আছি' }
  ]

  return (
    <section
      className="hero-section-main"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.82)), url('/images/city_hero_bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        paddingTop: 'calc(var(--header-height, 90px) + 16px)',
        paddingBottom: '20px',
        position: 'relative',
        zIndex: 1,
        color: '#FFFFFF'
      }}
    >
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

      <Container style={{ maxWidth: 1240 }}>
        {/* Hero Title */}
        <ScrollReveal direction="up" distance={20} duration={600}>
          <div className="text-center mx-auto hero-title-wrapper" style={{ maxWidth: 980, marginBottom: 36 }}>
            <h1 className="hero-title-h1" style={{ fontSize: 'clamp(22px, 3.6vw, 44px)', fontWeight: 900, color: '#22C55E', lineHeight: 1.3, letterSpacing: '-0.01em', marginBottom: 16, textShadow: '0 2px 14px rgba(0, 0, 0, 0.5)', whiteSpace: 'normal', wordBreak: 'break-word' }}>
              {typedTitle}
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
                <IconMapPin size={20} style={{ color: '#000000', flexShrink: 0 }} />
                <span className="hero-field-text" style={{ color: locationLabel ? '#000000' : '#64748B', fontWeight: locationLabel ? 700 : 500 }}>
                  {locationLabel || 'লোকেশন নির্বাচন করুন'}
                </span>
                {locationLabel ? (
                  <IconX
                    size={16}
                    style={{ color: '#000000', marginLeft: 'auto', cursor: 'pointer' }}
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
                <IconStethoscope size={20} style={{ color: '#000000', flexShrink: 0 }} />
                <span className="hero-field-text" style={{ color: specialtyLabel ? '#000000' : '#64748B', fontWeight: specialtyLabel ? 700 : 500 }}>
                  {specialtyLabel || 'বিশেষজ্ঞতা নির্বাচন করুন'}
                </span>
                {specialtyLabel ? (
                  <IconX size={16} style={{ color: '#000000', marginLeft: 'auto', cursor: 'pointer' }}
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
                <IconBuildingHospital size={20} style={{ color: '#000000', flexShrink: 0 }} />
                <span className="hero-field-text" style={{ color: hospitalLabel ? '#000000' : '#64748B', fontWeight: hospitalLabel ? 700 : 500 }}>
                  {hospitalLabel || 'হাসপাতাল নির্বাচন করুন'}
                </span>
                {hospitalLabel ? (
                  <IconX size={16} style={{ color: '#000000', marginLeft: 'auto', cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); setHospitalLabel(''); setSelectedHospital('') }} />
                ) : (
                  <IconChevronDown size={16} style={{ color: '#94A3B8', marginLeft: 'auto' }} />
                )}
              </div>

              {/* 4. Keyword */}
              <div className="hero-field-col">
                <IconWriting size={20} style={{ color: '#000000', flexShrink: 0 }} />
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

      <style>{`
        /* ── Search Bar ───────────────────────── */
        .hero-search-bar {
          background: #FFFFFF;
          border-radius: 0;
          box-shadow: 0 15px 40px rgba(0,0,0,0.3);
          display: flex;
          align-items: stretch;
          width: 100%;
          max-width: 1160px;
          margin: 0 auto;
          height: 56px;
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
        }

        .hero-field-location {
          cursor: pointer;
          user-select: none;
        }
        .hero-field-location:hover {
          background: #F7FAFC;
        }

        .hero-field-text {
          font-size: 13.5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        .hero-select {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 13.5px;
          font-weight: 700;
          color: #000000;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          padding-right: 20px;
        }

        .hero-text-input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 13.5px;
          font-weight: 700;
          color: #000000;
        }
        .hero-text-input::placeholder { color: #64748B; opacity: 1; font-weight: 500; }

        .hero-search-btn {
          background: #00803D;
          color: #FFFFFF;
          border: none;
          border-radius: 0;
          padding: 0 32px;
          font-size: 15px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: background 0.2s ease;
          flex-shrink: 0;
          height: 100%;
        }
        .hero-search-btn:hover { background: #006630; }

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

        @media (min-width: 992px) {
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
          .hero-section-main {
            min-height: auto !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            padding-top: 95px !important;
            padding-bottom: 24px !important;
          }
          .hero-title-wrapper {
            margin-top: 0px !important;
            margin-bottom: 20px !important;
          }
          .hero-title-h1 {
            font-size: clamp(20px, 5vw, 28px) !important;
            line-height: 1.4 !important;
            margin-bottom: 12px !important;
          }
          .hero-subtitle-p {
            font-size: 13.5px !important;
            line-height: 1.6 !important;
          }
          .hero-search-bar {
            flex-direction: column;
            height: auto;
            padding: 16px !important;
            gap: 12px !important;
            border-radius: 0 !important;
            background: #F1F5F9 !important;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.22) !important;
          }
          .hero-field-col {
            width: 100%;
            height: 56px !important;
            border-right: none !important;
            border: 1px solid #CBD5E1 !important;
            border-radius: 0 !important;
            background: #FFFFFF !important;
            display: flex !important;
            align-items: center !important;
            padding: 8px 16px !important;
            gap: 12px !important;
            transition: all 0.2s ease;
          }
          .hero-field-text {
            height: auto !important;
            display: inline-flex !important;
            align-items: center !important;
            font-size: 15px !important;
            line-height: 1.4 !important;
            margin: 0 !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
            -webkit-font-smoothing: antialiased !important;
          }
          .hero-text-input {
            height: auto !important;
            display: inline-flex !important;
            align-items: center !important;
            font-size: 15px !important;
            font-weight: 700 !important;
            color: #000000 !important;
            line-height: 1.4 !important;
            margin: 0 !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
            -webkit-font-smoothing: antialiased !important;
          }
          .hero-text-input::placeholder {
            color: #64748B !important;
            font-weight: 500 !important;
            opacity: 1 !important;
          }
          .hero-field-col:hover,
          .hero-field-col:active,
          .hero-field-col:focus-within {
            background: #FFFFFF !important;
            border-color: #CBD5E1 !important;
          }
          .hero-search-btn {
            width: 100%;
            height: 50px !important;
            padding: 0 16px;
            border-radius: 0 !important;
            margin-top: 2px !important;
            background: #0B8039 !important;
            box-shadow: none !important;
            font-size: 16.5px !important;
            font-weight: 700 !important;
            letter-spacing: 0.3px;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 8px !important;
          }
          .hero-search-btn:active {
            transform: scale(0.98);
          }
          .hero-features-row {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px 16px;
          }
          .loc-popup-box { max-width: 96vw; margin: 0 8px; }
          .loc-popup-overlay { padding-top: 80px; }
        }

        @media (max-width: 576px) {
          .hero-section-main {
            padding-top: 90px !important;
          }
          .hero-features-row { grid-template-columns: 1fr; gap: 16px; }
        }
      `}</style>
    </section>
  )
})

export default HeroSection
